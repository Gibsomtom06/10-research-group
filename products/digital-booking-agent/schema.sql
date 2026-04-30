-- Digital Booking Agent — Supabase schema v0
-- Tenant model: one Supabase project per artist (RLS not required for single-tenant v0;
-- add org_id + RLS policies when productized for multi-artist agencies).
--
-- Convention:
--   - snake_case everything
--   - every table has created_at, updated_at, audit-friendly
--   - soft-delete via deleted_at rather than hard DELETE (so Reversible Reasoning has a path back)
--   - JSONB for anything Analyst might add fields to without schema churn

-- =========================================================================
-- extensions
-- =========================================================================
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;        -- fuzzy name matching for contacts
create extension if not exists vector;         -- future: embed voice samples + past threads

-- =========================================================================
-- enums
-- =========================================================================
create type relationship_strength as enum ('warm', 'cold', 'reconnect', 'dormant');
create type contact_role           as enum ('talent_buyer', 'venue_owner', 'promoter', 'manager', 'agent', 'artist_peer', 'other');
create type offer_status           as enum ('inbound', 'evaluating', 'countered', 'confirmed', 'declined', 'dropped');
create type outreach_direction     as enum ('outbound', 'inbound');
create type outreach_status        as enum ('draft', 'queued', 'held_for_review', 'sent', 'replied', 'bounced', 'cancelled');
create type show_status            as enum ('announced', 'on_sale', 'sold_out', 'played', 'cancelled');
create type praise_category        as enum ('recent_win', 'taste_signal', 'personal_thread', 'seasonal');

-- =========================================================================
-- contacts (CRM core)
-- =========================================================================
create table contacts (
    id                       uuid primary key default uuid_generate_v4(),
    full_name                text not null,
    email                    text,
    phone                    text,
    role                     contact_role not null default 'other',
    company                  text,              -- venue or promo company
    city                     text,
    state                    text,
    country                  text default 'US',
    relationship_strength    relationship_strength not null default 'cold',
    last_interaction_at      timestamptz,
    last_show_together_at    date,
    thomas_notes             text,              -- Thomas-entered personal notes (kid, move, etc.)
    tags                     text[] default '{}',
    source_imports           jsonb default '[]'::jsonb,  -- where we got this record (gmail, contract X, IG DM)
    deleted_at               timestamptz,
    created_at               timestamptz default now(),
    updated_at               timestamptz default now()
);
create index idx_contacts_email            on contacts (lower(email)) where email is not null;
create index idx_contacts_name_trgm        on contacts using gin (full_name gin_trgm_ops);
create index idx_contacts_role_strength    on contacts (role, relationship_strength);
create index idx_contacts_city             on contacts (city);

-- =========================================================================
-- venues (enriched per-venue record, separate from contacts — one venue can have many contacts)
-- =========================================================================
create table venues (
    id                    uuid primary key default uuid_generate_v4(),
    name                  text not null,
    city                  text,
    state                 text,
    country               text default 'US',
    capacity              int,
    typical_nights        text[] default '{}',  -- {'Thu','Fri','Sat'}
    has_weekday_slots     boolean default false,
    genre_fit             text[] default '{}',  -- rough fit tags
    website               text,
    songkick_id           text,
    bandsintown_id        text,
    notes                 text,
    deleted_at            timestamptz,
    created_at            timestamptz default now(),
    updated_at            timestamptz default now()
);
create index idx_venues_city on venues (city);

create table contact_venues (
    contact_id uuid references contacts(id) on delete cascade,
    venue_id   uuid references venues(id)   on delete cascade,
    primary key (contact_id, venue_id)
);

-- =========================================================================
-- markets (metro / DMA level intelligence)
-- =========================================================================
create table markets (
    id              uuid primary key default uuid_generate_v4(),
    metro           text not null unique,      -- 'Columbus, OH'
    dma_code        text,
    population      int,
    age_distribution jsonb,                    -- {"18-24": 0.12, "25-34": ...}
    music_index     numeric,                   -- Nielsen-ish index if we buy it
    notes           text,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- =========================================================================
-- artist_data (per-metro artist performance, refreshed nightly)
-- =========================================================================
create table artist_data (
    id                       uuid primary key default uuid_generate_v4(),
    metro                    text not null,
    as_of_date               date not null,
    spotify_monthly_listeners int,
    spotify_trend_90d_pct    numeric,
    youtube_views_28d        int,
    youtube_watch_hours_28d  numeric,
    ig_followers             int,
    ig_engagement_rate       numeric,
    tiktok_followers         int,
    top_track                text,
    audience_age_dist        jsonb,
    audience_gender_dist     jsonb,
    raw_payload              jsonb,             -- full API response for audit
    created_at               timestamptz default now(),
    unique (metro, as_of_date)
);
create index idx_artist_data_metro_date on artist_data (metro, as_of_date desc);

-- =========================================================================
-- buyer_signals (per-contact/venue: recent bookings, calendar gaps, mentions)
-- =========================================================================
create table buyer_signals (
    id              uuid primary key default uuid_generate_v4(),
    contact_id      uuid references contacts(id) on delete cascade,
    venue_id        uuid references venues(id)   on delete set null,
    observed_at     timestamptz not null default now(),
    signal_type     text not null,                     -- 'upcoming_show','calendar_gap','press_mention','ig_post','reddit_thread'
    summary         text not null,
    source_url      text,
    raw_payload     jsonb,
    expires_at      timestamptz,                       -- auto-stale after this
    created_at      timestamptz default now()
);
create index idx_buyer_signals_contact on buyer_signals (contact_id, observed_at desc);
create index idx_buyer_signals_expires on buyer_signals (expires_at) where expires_at is not null;

-- =========================================================================
-- praise_bank (dated, verified praise hooks Analyst hands to Outbound)
-- =========================================================================
create table praise_bank (
    id              uuid primary key default uuid_generate_v4(),
    contact_id      uuid references contacts(id) on delete cascade,
    venue_id        uuid references venues(id)   on delete set null,
    category        praise_category not null,
    text            text not null,                     -- the praise hook as a sentence fragment
    source_url      text,                              -- must exist for non-Thomas-entered hooks
    date_observed   date not null,
    confidence      numeric not null default 0.9 check (confidence between 0 and 1),
    expires_at      date not null default (current_date + interval '90 days'),
    consumed_at     timestamptz,                       -- null = available; set when used in a pitch
    consumed_by_pitch_id uuid,
    thomas_entered  boolean default false,
    created_at      timestamptz default now()
);
create index idx_praise_available on praise_bank (contact_id, expires_at, consumed_at) where consumed_at is null;

-- =========================================================================
-- pitch_packs (Analyst's output, Outbound's input)
-- =========================================================================
create table pitch_packs (
    id                    uuid primary key default uuid_generate_v4(),
    contact_id            uuid references contacts(id) on delete cascade,
    venue_id              uuid references venues(id)   on delete set null,
    market_metro          text,
    praise_hook_id        uuid references praise_bank(id),
    payload               jsonb not null,              -- full pitch-pack JSON per ANALYST_AGENT.md §3
    verification_stamps   jsonb not null,              -- { praise_verified, stats_freshness_ok, sources_cited }
    blocked_reason        text,                        -- if Analyst refused to hand off, why
    created_at            timestamptz default now()
);

-- =========================================================================
-- offers (in-flight negotiations)
-- =========================================================================
create table offers (
    id                    uuid primary key default uuid_generate_v4(),
    contact_id            uuid references contacts(id),
    venue_id              uuid references venues(id),
    status                offer_status not null default 'inbound',
    proposed_date         date,
    guarantee             numeric,
    door_deal             jsonb,                       -- {"split": 80, "bonus_threshold": 200}
    counter_bounds        jsonb,                       -- {min_guarantee, target, walk_away}
    evaluator_result      jsonb,                       -- output from dsr-booking-evaluator skill
    thread_id             text,                        -- email thread reference
    notes                 text,
    created_at            timestamptz default now(),
    updated_at            timestamptz default now()
);

-- =========================================================================
-- confirmed_shows (calendar of truth)
-- =========================================================================
create table confirmed_shows (
    id                uuid primary key default uuid_generate_v4(),
    offer_id          uuid references offers(id),
    venue_id          uuid references venues(id),
    show_date         date not null,
    day_of_week       int generated always as (extract(dow from show_date)) stored,
    guarantee         numeric,
    status            show_status default 'announced',
    paid_attendance   int,
    capacity_at_show  int,
    sell_through_pct  numeric generated always as (
        case when capacity_at_show > 0 then (paid_attendance::numeric / capacity_at_show * 100) end
    ) stored,
    notes             text,
    created_at        timestamptz default now(),
    updated_at        timestamptz default now()
);
create index idx_confirmed_shows_date on confirmed_shows (show_date);

-- =========================================================================
-- outreach_log (every send, draft, reply — the audit trail)
-- =========================================================================
create table outreach_log (
    id                uuid primary key default uuid_generate_v4(),
    direction         outreach_direction not null,
    status            outreach_status not null default 'draft',
    contact_id        uuid references contacts(id),
    offer_id          uuid references offers(id),
    pitch_pack_id     uuid references pitch_packs(id),
    thread_id         text,
    subject           text,
    body              text,
    scheduled_send_at timestamptz,
    sent_at           timestamptz,
    replied_at        timestamptz,
    confidence_score  numeric,                         -- 0-1 from composer
    held_reason       text,                            -- if status=held_for_review
    cancelled_reason  text,                            -- if rolled back by Reversible Reasoning
    decision_trace    jsonb,                           -- PES log of how we got here
    created_at        timestamptz default now(),
    updated_at        timestamptz default now()
);
create index idx_outreach_contact on outreach_log (contact_id, created_at desc);
create index idx_outreach_status  on outreach_log (status, scheduled_send_at);

-- =========================================================================
-- voice_samples (Thomas's writing, the style corpus)
-- =========================================================================
create table voice_samples (
    id              uuid primary key default uuid_generate_v4(),
    sample_category text not null,                   -- 'cold_outreach','negotiation','confirm','followup','casual'
    recipient_role  contact_role,
    subject         text,
    body            text not null,
    sent_at         timestamptz,
    embedding       vector(1024),                    -- Voyage voyage-3-large (1024 dims); for retrieval-style grounding later
    notes           text,
    created_at      timestamptz default now()
);
create index idx_voice_samples_category on voice_samples (sample_category);

-- =========================================================================
-- decisions (Supervisor-level audit of significant actions)
-- =========================================================================
create table decisions (
    id                uuid primary key default uuid_generate_v4(),
    actor             text not null,                 -- 'supervisor','inbound','analyst','outbound','routing','research','reporting','thomas'
    action            text not null,                 -- 'send_pitch','hold_for_review','rollback_draft','counter','confirm_show'
    subject_type      text,                          -- 'outreach_log','offer','pitch_pack'
    subject_id        uuid,
    rationale         text,
    confidence        numeric,
    input_snapshot    jsonb,
    output_snapshot   jsonb,
    created_at        timestamptz default now()
);
create index idx_decisions_subject on decisions (subject_type, subject_id);

-- =========================================================================
-- updated_at triggers
-- =========================================================================
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'contacts','venues','markets','offers','confirmed_shows','outreach_log'
  ]) loop
    execute format(
      'create trigger trg_%I_updated before update on %I for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- =========================================================================
-- useful views
-- =========================================================================
create or replace view v_active_praise as
select p.*, c.full_name as contact_name
from praise_bank p
join contacts c on c.id = p.contact_id
where p.consumed_at is null
  and p.expires_at >= current_date;

create or replace view v_outreach_pipeline as
select
    o.id, o.status, o.direction, o.subject, o.scheduled_send_at, o.confidence_score,
    c.full_name as contact, c.city, c.role
from outreach_log o
left join contacts c on c.id = o.contact_id
where o.status in ('draft','queued','held_for_review')
order by
    case o.status
      when 'held_for_review' then 0
      when 'queued' then 1
      when 'draft' then 2
    end,
    o.scheduled_send_at nulls last;
