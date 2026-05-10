-- 0010_offers_agent_relay.sql
--
-- Offers don't always come from promoters directly. Thomas's agents
-- forward them too:
--   - Andrew Lehr (AB Touring)
--   - Colton @ PRYSM Talent Agency
--   - potentially others
--
-- When an agent relays an offer:
--   * the `contact_id` might be the AGENT, not the promoter
--   * the agent takes a booking commission (usually 10%) off the top,
--     which reduces net-to-artist
--   * reply-to should go to the agent, not the underlying promoter
--   * the deal memo needs to reflect agent involvement so Thomas can
--     confirm routing
--
-- This migration adds the relay layer. The underlying promoter (when
-- known) goes on `promoter_contact_id`; the relaying agent on
-- `relayed_by_contact_id`. Both are optional — a direct offer just
-- leaves relayed_by_contact_id null.
--
-- Safe to re-run.

-- =========================================================================
-- offer_source: where did this offer arrive from?
-- =========================================================================
do $$
begin
    if not exists (select 1 from pg_type where typname = 'offer_source') then
        create type offer_source as enum (
            'direct_promoter',        -- promoter emailed us directly
            'agent_ab',               -- Andrew Lehr / AB Touring relayed
            'agent_prysm',            -- PRYSM (Colton et al) relayed
            'agent_other',            -- some other agent (roster grows)
            'manual',                 -- Thomas entered it by hand
            'gigwell_import'          -- scraped from Gigwell historical data
        );
    end if;
end
$$;

-- =========================================================================
-- Extend offers with agent-relay fields
-- =========================================================================
alter table offers
    add column if not exists source                     offer_source,
    add column if not exists relayed_by_contact_id      uuid references contacts(id),
    add column if not exists promoter_contact_id        uuid references contacts(id),
    add column if not exists agent_commission_pct       numeric,            -- 0-100; default 10 for AB/PRYSM
    add column if not exists agent_commission_paid_at   timestamptz,
    add column if not exists reply_to_contact_id        uuid references contacts(id);
    -- reply_to lets us override: sometimes Thomas wants us to cc the
    -- promoter even when the agent relayed. Falls back to relayed_by
    -- → primary contact_id → (nothing).

create index if not exists idx_offers_relayed_by
    on offers (relayed_by_contact_id)
    where relayed_by_contact_id is not null;

create index if not exists idx_offers_source
    on offers (source)
    where source is not null;

-- =========================================================================
-- Backfill: infer source from what we can see today.
-- =========================================================================

-- 1. Offers with a contact whose email ends in @prysmagency.com →
--    agent_prysm; relayed_by_contact_id = that contact
update offers o
set source = 'agent_prysm',
    relayed_by_contact_id = o.contact_id,
    agent_commission_pct = coalesce(o.agent_commission_pct, 10)
from contacts c
where o.contact_id = c.id
  and o.source is null
  and c.email ilike '%@prysmagency.com';

-- 2. Offers relayed by Andrew Lehr (best-effort: name match on
--    contacts.full_name ilike 'andrew lehr%' OR role='agent' with
--    that name). Tag as agent_ab.
update offers o
set source = 'agent_ab',
    relayed_by_contact_id = o.contact_id,
    agent_commission_pct = coalesce(o.agent_commission_pct, 10)
from contacts c
where o.contact_id = c.id
  and o.source is null
  and (
      c.full_name ilike 'andrew lehr%'
      or (c.role = 'agent' and c.full_name ilike '%lehr%')
  );

-- 3. Offers imported from Gigwell (source_tag like 'gigwell_scrape:%')
update offers
set source = 'gigwell_import'
where source is null
  and source_tag like 'gigwell_scrape:%';

-- 4. Everything else we still don't know → direct_promoter default
update offers
set source = 'direct_promoter'
where source is null;

-- =========================================================================
-- Generated column: net guarantee to artist after agent commission.
-- Makes the kanban + counter evaluator use the right number.
-- =========================================================================
alter table offers
    add column if not exists net_to_artist numeric generated always as (
        case
            when guarantee is null then null
            when agent_commission_pct is null or agent_commission_pct = 0 then guarantee
            else round(guarantee * (1 - agent_commission_pct / 100.0), 2)
        end
    ) stored;

create index if not exists idx_offers_net_to_artist
    on offers (net_to_artist)
    where net_to_artist is not null;

-- =========================================================================
-- Refresh dsr_standard_deal_terms to include the default agent commission
-- =========================================================================
create or replace view dsr_standard_deal_terms as
select
    50::numeric                     as deposit_pct_default,
    10::numeric                     as deposit_pct_minimum,
    30                              as deposit_due_days_default,
    85::numeric                     as override_pct_default,
    75                              as radius_miles_default,
    30                              as radius_days_before_default,
    30                              as radius_days_after_default,
    'standard'::hospitality_tier    as hospitality_default,
    'promoter_provided'::sound_lights_source as sound_lights_default,
    'force_majeure'::cancellation_policy    as cancellation_default,
    true                            as travel_provided_default,
    true                            as lodging_provided_default,
    10::numeric                     as agent_commission_pct_default;

-- =========================================================================
-- Extend v_offer_contract_status with relay / net-to-artist
-- =========================================================================
create or replace view v_offer_contract_status as
select
    o.id,
    o.contact_id,
    o.venue_id,
    o.artist_id,
    o.artist_slug,
    o.status,
    o.source,
    o.relayed_by_contact_id,
    o.promoter_contact_id,
    o.agent_commission_pct,
    o.proposed_date,
    o.guarantee,
    o.net_to_artist,
    o.deposit_pct,
    o.deposit_due_days,
    o.deposit_received_at,
    o.signed_at_thomas,
    o.signed_at_promoter,
    o.deal_memo_pdf_url,
    (o.status = 'inbound'::offer_status)                                      as is_new,
    (o.status in ('evaluating'::offer_status, 'countered'::offer_status))     as is_negotiating,
    (o.deal_memo_generated_at is not null and o.signed_at_thomas is null)     as needs_thomas_sig,
    (o.signed_at_thomas is not null and o.signed_at_promoter is null)         as needs_promoter_sig,
    (o.signed_at_thomas is not null and o.signed_at_promoter is not null
        and o.deposit_received_at is null)                                     as awaiting_deposit,
    (o.deposit_received_at is not null)                                       as is_locked,
    (o.relayed_by_contact_id is not null)                                     as is_relayed,
    case
        when o.proposed_date is null then null
        else (o.proposed_date - current_date)
    end                                                                        as days_until_show,
    o.created_at,
    o.updated_at
from offers o;

-- =========================================================================
-- Helper: resolve the reply-to contact for an offer.
--   priority: reply_to_contact_id > relayed_by_contact_id > contact_id
-- =========================================================================
create or replace function fn_offer_reply_to(p_offer_id uuid)
returns uuid
language sql
stable
as $$
    select coalesce(o.reply_to_contact_id, o.relayed_by_contact_id, o.contact_id)
    from offers o
    where o.id = p_offer_id;
$$;

-- =========================================================================
-- Sanity
-- =========================================================================
select 'offers by source:' as info, source, count(*) as n
from offers
group by source
order by n desc;

select 'offers with relay:' as info, count(*)
from offers
where relayed_by_contact_id is not null;
