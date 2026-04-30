-- 0009_offers_as_contracts.sql
--
-- Offers ARE contracts. We're not running a separate contract-ingest
-- pipeline; the information Thomas needs to sign off on a show is the
-- same information that's on the promoter's offer sheet. This migration
-- extends the offers table with the deal-memo fields that, together
-- with the existing (guarantee, door_deal, counter_bounds), constitute
-- a complete DSR booking agreement.
--
-- Standard defaults below reflect Thomas's verbal guidance:
--   "we like 50% deposits sometimes we do 10%"
-- Everything else is set from industry norms for a mid-tier headliner
-- at 250-1000 cap venues. These are DEFAULTS, not enforced — every
-- field is nullable so a non-standard deal just carries what the
-- promoter actually offered. See `dsr_standard_deal_terms` view at the
-- bottom for the canonical values the composer should cite when
-- proposing a counter.
--
-- ASSUMPTIONS TO VERIFY WITH THOMAS (all are overridable per-offer):
--   * deposit_pct default 50 (his words: "50% sometimes 10%")
--   * deposit_due_days: 30 days before show
--   * radius_miles / radius_days: 75 / 30 (typical for headliners in this tier)
--   * override_pct: 85% of net door after expenses (industry standard for DJs)
--   * cancellation_policy: 'force_majeure' (Thomas can switch to 'mutual' or
--     'promoter_buyout')
--   * hospitality_tier: 'standard' (green room, stocked cooler, food buyout)
--   * sound_lights: 'promoter_provided' (vs 'artist_provided' when we tour)
--
-- Safe to re-run.

-- =========================================================================
-- Extend offer_status to cover the full contract lifecycle
-- =========================================================================
-- The existing enum has: inbound, evaluating, countered, confirmed, declined, dropped
-- We need to distinguish "verbally confirmed" from "paper signed / deposit
-- received". Adding three new states.
do $$
begin
    if not exists (select 1 from pg_enum where enumlabel = 'memo_sent' and enumtypid = 'offer_status'::regtype) then
        alter type offer_status add value 'memo_sent';
    end if;
    if not exists (select 1 from pg_enum where enumlabel = 'signed_by_thomas' and enumtypid = 'offer_status'::regtype) then
        alter type offer_status add value 'signed_by_thomas';
    end if;
    if not exists (select 1 from pg_enum where enumlabel = 'fully_executed' and enumtypid = 'offer_status'::regtype) then
        alter type offer_status add value 'fully_executed';
    end if;
    if not exists (select 1 from pg_enum where enumlabel = 'deposit_received' and enumtypid = 'offer_status'::regtype) then
        alter type offer_status add value 'deposit_received';
    end if;
end
$$;

-- =========================================================================
-- Hospitality tier enum — granular enough for the composer to pick
-- talking points, small enough not to be a burden to classify.
-- =========================================================================
do $$
begin
    if not exists (select 1 from pg_type where typname = 'hospitality_tier') then
        create type hospitality_tier as enum (
            'none',
            'basic',         -- water + snacks
            'standard',      -- green room, stocked cooler, food buyout ~$40/person
            'premium',       -- full hot meal, dedicated dressing room, ground transport
            'festival'       -- artist compound, dedicated runner, full tech ops
        );
    end if;
end
$$;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'sound_lights_source') then
        create type sound_lights_source as enum (
            'promoter_provided',   -- house rig (default for clubs)
            'artist_provided',     -- we bring the rig (touring)
            'shared',              -- house rig + our CDJs/controller
            'festival_stage'       -- main-stage ops, we just show up
        );
    end if;
end
$$;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'cancellation_policy') then
        create type cancellation_policy as enum (
            'force_majeure',       -- acts of god only — strictest, our default
            'mutual',              -- either side can walk w/ N days notice
            'promoter_buyout',     -- promoter owes 100% if they cancel < 30d out
            'artist_buyout',       -- artist owes X% if we cancel (rare)
            'custom'               -- see notes
        );
    end if;
end
$$;

-- =========================================================================
-- Extend offers with contract-lifecycle fields
-- =========================================================================
alter table offers
    -- Financial terms
    add column if not exists deposit_pct               numeric,         -- 0-100, null=not yet negotiated
    add column if not exists deposit_due_days          int,             -- days before show
    add column if not exists deposit_received_at       timestamptz,
    add column if not exists deposit_amount_received   numeric,
    add column if not exists balance_due_when          text,            -- e.g. "day of show, cash, before doors"

    -- Override / bonus (rider above the guarantee)
    add column if not exists override_pct              numeric,         -- % of net door above threshold
    add column if not exists override_threshold        numeric,         -- $ of net door where override kicks in
    add column if not exists override_notes            text,

    -- Radius clause
    add column if not exists radius_miles              int,
    add column if not exists radius_days_before        int,
    add column if not exists radius_days_after         int,
    add column if not exists radius_exclusions         text,            -- free-text carve-outs (festivals, etc.)

    -- Production
    add column if not exists sound_lights              sound_lights_source,
    add column if not exists hospitality               hospitality_tier,
    add column if not exists travel_provided           boolean,
    add column if not exists lodging_provided          boolean,
    add column if not exists ground_transport_provided boolean,

    -- Cancellation
    add column if not exists cancellation              cancellation_policy,
    add column if not exists cancellation_notice_days  int,
    add column if not exists force_majeure_language    text,

    -- Signature tracking
    add column if not exists signed_at_thomas          timestamptz,
    add column if not exists signed_at_promoter        timestamptz,
    add column if not exists signature_method          text,            -- 'docusign', 'pdf_sig', 'email_confirm', 'verbal'

    -- Artifacts
    add column if not exists offer_sheet_url           text,             -- original PDF/doc from promoter
    add column if not exists offer_sheet_source        text,             -- 'gmail', 'upload', 'gigwell', 'manual'
    add column if not exists offer_sheet_raw_text      text,             -- extracted text for search
    add column if not exists deal_memo_pdf_url         text,             -- our generated DSR-side memo
    add column if not exists deal_memo_generated_at    timestamptz;

-- Fast lookup for "what's awaiting my signature" dashboard
create index if not exists idx_offers_awaiting_thomas
    on offers (status) where status in ('memo_sent'::offer_status, 'countered'::offer_status);

create index if not exists idx_offers_awaiting_deposit
    on offers (status) where status = 'fully_executed'::offer_status;

create index if not exists idx_offers_proposed_date
    on offers (proposed_date) where proposed_date is not null;

-- =========================================================================
-- Standard deal terms — the canonical values the composer / evaluator
-- should reference when drafting counters or deal memos.
-- =========================================================================
create or replace view dsr_standard_deal_terms as
select
    50::numeric                     as deposit_pct_default,
    10::numeric                     as deposit_pct_minimum,
    30                              as deposit_due_days_default,
    85::numeric                     as override_pct_default,          -- 85% of NBOR
    75                              as radius_miles_default,
    30                              as radius_days_before_default,
    30                              as radius_days_after_default,
    'standard'::hospitality_tier    as hospitality_default,
    'promoter_provided'::sound_lights_source as sound_lights_default,
    'force_majeure'::cancellation_policy    as cancellation_default,
    true                            as travel_provided_default,
    true                            as lodging_provided_default;

-- =========================================================================
-- v_offer_contract_status — one row per offer with derived lifecycle
-- flags the /offers UI will use to build its kanban columns.
-- =========================================================================
create or replace view v_offer_contract_status as
select
    o.id,
    o.contact_id,
    o.venue_id,
    o.artist_id,
    o.artist_slug,
    o.status,
    o.proposed_date,
    o.guarantee,
    o.deposit_pct,
    o.deposit_due_days,
    o.deposit_received_at,
    o.signed_at_thomas,
    o.signed_at_promoter,
    o.deal_memo_pdf_url,
    -- Lifecycle flags for kanban:
    (o.status = 'inbound'::offer_status)                                     as is_new,
    (o.status in ('evaluating'::offer_status, 'countered'::offer_status))    as is_negotiating,
    (o.deal_memo_generated_at is not null and o.signed_at_thomas is null)    as needs_thomas_sig,
    (o.signed_at_thomas is not null and o.signed_at_promoter is null)        as needs_promoter_sig,
    (o.signed_at_thomas is not null and o.signed_at_promoter is not null
        and o.deposit_received_at is null)                                    as awaiting_deposit,
    (o.deposit_received_at is not null)                                      as is_locked,
    -- Days-out from show, signed for NULL-safe sorting:
    case
        when o.proposed_date is null then null
        else (o.proposed_date - current_date)
    end                                                                       as days_until_show,
    o.created_at,
    o.updated_at
from offers o;

-- =========================================================================
-- Helper RPC: mark Thomas's signature and move status forward.
-- =========================================================================
create or replace function fn_offer_sign_thomas(p_offer_id uuid)
returns offers as $$
    update offers
    set signed_at_thomas = now(),
        status = case
            when signed_at_promoter is not null then 'fully_executed'::offer_status
            else 'signed_by_thomas'::offer_status
        end,
        updated_at = now()
    where id = p_offer_id
    returning *;
$$ language sql;

create or replace function fn_offer_sign_promoter(p_offer_id uuid)
returns offers as $$
    update offers
    set signed_at_promoter = now(),
        status = case
            when signed_at_thomas is not null then 'fully_executed'::offer_status
            else status
        end,
        updated_at = now()
    where id = p_offer_id
    returning *;
$$ language sql;

create or replace function fn_offer_record_deposit(
    p_offer_id uuid,
    p_amount numeric
)
returns offers as $$
    update offers
    set deposit_received_at = now(),
        deposit_amount_received = p_amount,
        status = 'deposit_received'::offer_status,
        updated_at = now()
    where id = p_offer_id
    returning *;
$$ language sql;

-- =========================================================================
-- Sanity
-- =========================================================================
select 'offers enum now has states:' as info, string_agg(enumlabel, ', ' order by enumsortorder) as states
from pg_enum where enumtypid = 'offer_status'::regtype;

select 'dsr_standard_deal_terms:' as info, * from dsr_standard_deal_terms;
