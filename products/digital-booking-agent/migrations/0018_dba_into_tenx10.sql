-- 0018_dba_into_tenx10.sql
--
-- Pass 1 of the DBA → TENx10 Supabase merge.
--
-- Old DBA project (erwlfjlgrrfuqnjzitor) is dead. DBA now lives in TENx10's
-- project (ocscxqaythiuidkwjuvg) alongside the existing booking-management
-- schema. This migration adds the DBA-only tables that don't conflict with
-- TENx10's existing tables — outreach_log, pitch_packs, etc. — plus a stub
-- `offers` view so DBA code that references `offers` doesn't crash.
--
-- A later migration (pass 2) will replace the stub with a real compatibility
-- view over `deals`, and add columns to `deals` for DBA's lifecycle fields
-- (counter_bounds, evaluator_result, etc.).
--
-- This migration is idempotent and re-runnable.

-- ---------------------------------------------------------------------
-- Enums DBA needs (skip ones that already exist)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'relationship_strength') then
    create type relationship_strength as enum ('warm','cold','reconnect','dormant');
  end if;
  if not exists (select 1 from pg_type where typname = 'offer_status') then
    create type offer_status as enum ('inbound','evaluating','countered','confirmed','declined','dropped');
  end if;
  if not exists (select 1 from pg_type where typname = 'outreach_direction') then
    create type outreach_direction as enum ('outbound','inbound');
  end if;
  if not exists (select 1 from pg_type where typname = 'outreach_status') then
    create type outreach_status as enum ('draft','queued','held_for_review','sent','replied','bounced','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'show_status') then
    create type show_status as enum ('announced','on_sale','sold_out','played','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'praise_category') then
    create type praise_category as enum ('recent_win','taste_signal','personal_thread','seasonal');
  end if;
  -- contact_role already created earlier in session
end $$;

-- ---------------------------------------------------------------------
-- pg_trgm for fuzzy contact-name matching (DBA expects it)
-- ---------------------------------------------------------------------
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- markets (metro intelligence)
-- ---------------------------------------------------------------------
create table if not exists markets (
    id              uuid primary key default uuid_generate_v4(),
    metro           text not null unique,
    dma_code        text,
    population      int,
    age_distribution jsonb,
    music_index     numeric,
    notes           text,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- ---------------------------------------------------------------------
-- artist_data (per-metro artist performance)
-- ---------------------------------------------------------------------
create table if not exists artist_data (
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
    raw_payload              jsonb,
    created_at               timestamptz default now(),
    unique (metro, as_of_date)
);
create index if not exists idx_artist_data_metro_date on artist_data (metro, as_of_date desc);

-- ---------------------------------------------------------------------
-- buyer_signals (recent bookings, calendar gaps, mentions per contact/venue)
-- ---------------------------------------------------------------------
create table if not exists buyer_signals (
    id              uuid primary key default uuid_generate_v4(),
    contact_id      uuid references contacts(id) on delete cascade,
    venue_id        uuid references venues(id)   on delete set null,
    observed_at     timestamptz not null default now(),
    signal_type     text not null,
    summary         text not null,
    source_url      text,
    raw_payload     jsonb,
    expires_at      timestamptz,
    created_at      timestamptz default now()
);
create index if not exists idx_buyer_signals_contact on buyer_signals (contact_id, observed_at desc);
create index if not exists idx_buyer_signals_expires on buyer_signals (expires_at) where expires_at is not null;

-- ---------------------------------------------------------------------
-- praise_bank (Analyst's praise hooks for Outbound)
-- ---------------------------------------------------------------------
create table if not exists praise_bank (
    id              uuid primary key default uuid_generate_v4(),
    contact_id      uuid references contacts(id) on delete cascade,
    venue_id        uuid references venues(id)   on delete set null,
    category        praise_category not null,
    text            text not null,
    source_url      text,
    date_observed   date not null,
    confidence      numeric not null default 0.9 check (confidence between 0 and 1),
    expires_at      date not null default (current_date + interval '90 days'),
    consumed_at     timestamptz,
    consumed_by_pitch_id uuid,
    thomas_entered  boolean default false,
    created_at      timestamptz default now()
);
create index if not exists idx_praise_available on praise_bank (contact_id, expires_at, consumed_at) where consumed_at is null;

-- ---------------------------------------------------------------------
-- pitch_packs (Analyst output → Outbound input)
-- ---------------------------------------------------------------------
create table if not exists pitch_packs (
    id                    uuid primary key default uuid_generate_v4(),
    contact_id            uuid references contacts(id) on delete cascade,
    venue_id              uuid references venues(id)   on delete set null,
    market_metro          text,
    praise_hook_id        uuid references praise_bank(id),
    payload               jsonb not null,
    verification_stamps   jsonb not null,
    blocked_reason        text,
    created_at            timestamptz default now()
);

-- ---------------------------------------------------------------------
-- outreach_log (every send/draft/reply — sender.ts polls this table)
--
-- offer_id is a plain uuid column (no FK) because `offers` is a stub view
-- in pass 1; pass 2 either creates a real `offers` table or finalizes the
-- view-over-deals shape and re-adds the FK.
-- ---------------------------------------------------------------------
create table if not exists outreach_log (
    id                uuid primary key default uuid_generate_v4(),
    direction         outreach_direction not null,
    status            outreach_status not null default 'draft',
    contact_id        uuid references contacts(id),
    offer_id          uuid,
    pitch_pack_id     uuid references pitch_packs(id),
    thread_id         text,
    subject           text,
    body              text,
    scheduled_send_at timestamptz,
    sent_at           timestamptz,
    replied_at        timestamptz,
    confidence_score  numeric,
    held_reason       text,
    cancelled_reason  text,
    decision_trace    jsonb,
    created_at        timestamptz default now(),
    updated_at        timestamptz default now()
);
create index if not exists idx_outreach_contact on outreach_log (contact_id, created_at desc);
create index if not exists idx_outreach_status  on outreach_log (status, scheduled_send_at);

-- ---------------------------------------------------------------------
-- confirmed_shows (offer_id is plain uuid for the same reason)
-- ---------------------------------------------------------------------
create table if not exists confirmed_shows (
    id                uuid primary key default uuid_generate_v4(),
    offer_id          uuid,
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
create index if not exists idx_confirmed_shows_date on confirmed_shows (show_date);

-- ---------------------------------------------------------------------
-- decisions (Supervisor audit)
-- ---------------------------------------------------------------------
create table if not exists decisions (
    id                uuid primary key default uuid_generate_v4(),
    actor             text not null,
    action            text not null,
    subject_type      text,
    subject_id        uuid,
    rationale         text,
    confidence        numeric,
    input_snapshot    jsonb,
    output_snapshot   jsonb,
    created_at        timestamptz default now()
);
create index if not exists idx_decisions_subject on decisions (subject_type, subject_id);

-- ---------------------------------------------------------------------
-- updated_at trigger function (idempotent)
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'markets','outreach_log','confirmed_shows'
  ]) loop
    if exists (select 1 from pg_class where relname = t)
       and not exists (
         select 1 from pg_trigger
         where tgname = 'trg_' || t || '_updated'
       )
    then
      execute format(
        'create trigger trg_%I_updated before update on %I for each row execute function set_updated_at();',
        t, t
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Stub `offers` view so DBA code that references it doesn't crash.
-- Returns zero rows. Pass 2 replaces this with a real view over `deals`.
-- ---------------------------------------------------------------------
drop view if exists offers cascade;
create view offers as
select
  null::uuid       as id,
  null::uuid       as contact_id,
  null::uuid       as venue_id,
  'inbound'::text  as status,
  null::date       as proposed_date,
  null::numeric    as guarantee,
  null::jsonb      as door_deal,
  null::jsonb      as counter_bounds,
  null::jsonb      as evaluator_result,
  null::text       as thread_id,
  null::text       as notes,
  now()            as created_at,
  now()            as updated_at
where false;

-- ---------------------------------------------------------------------
-- sanity
-- ---------------------------------------------------------------------
select
  'info: dba pass-1 merge complete'             as status,
  (select count(*) from outreach_log)           as outreach_log_rows,
  (select count(*) from pitch_packs)            as pitch_packs_rows,
  (select count(*) from confirmed_shows)        as confirmed_shows_rows,
  (select count(*) from offers)                 as offers_rows;
