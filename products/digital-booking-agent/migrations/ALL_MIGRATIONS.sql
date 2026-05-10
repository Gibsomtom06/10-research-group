-- DBA — all migrations 0001–0017 concatenated for one-shot paste into Supabase SQL Editor.
-- Every block is idempotent (do $$ ... exists checks / create ... if not exists).
-- Safe to re-run; safe to run on an empty DB or one that's partially up to date.
--
-- ═══════════════════════════════════════════════════════════════════════
-- PRELUDE — extensions the migrations depend on
-- ═══════════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists vector;


-- ═══════════════════════════════════════════════════════════════════════
-- 0001_outreach_audit_columns.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0001_outreach_audit_columns.sql
-- Adds explicit human-action audit columns to outreach_log so the /drafts
-- approve/edit/reject server actions have a clean write target.
-- Also extends offers with the extracted fields the Inbound classifier
-- produces per prompts/inbound_classifier.md.
--
-- Run after schema.sql. Idempotent.

alter table outreach_log
  add column if not exists approved_at   timestamptz,
  add column if not exists approved_by   text,
  add column if not exists edited_at     timestamptz,
  add column if not exists edited_by     text,
  add column if not exists rejected_at   timestamptz,
  add column if not exists rejected_by   text;

-- offers: extracted structured fields from classifier
alter table offers
  add column if not exists venue_name           text,
  add column if not exists city                 text,
  add column if not exists state                text,
  add column if not exists capacity_claimed     int,
  add column if not exists door_split_pct       numeric,
  add column if not exists backend_terms        text,
  add column if not exists radius_clause_miles  int,
  add column if not exists radius_clause_days   int,
  add column if not exists is_hold              boolean default false,
  add column if not exists hold_position        int,
  add column if not exists deadline_to_respond  timestamptz,
  add column if not exists sensitivity_flags    text[] default '{}';

-- outreach_status enum may not yet contain 'rejected'. Add it if missing.
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'outreach_status' and e.enumlabel = 'rejected'
  ) then
    alter type outreach_status add value 'rejected';
  end if;
end $$;

-- Make the pipeline view status-aware (rejected excluded, recency honored).
-- DROP first because CREATE OR REPLACE can't reorder / rename columns
-- (adding 'body' at position 5 triggers 42P16 otherwise).
drop view if exists v_outreach_pipeline;
create view v_outreach_pipeline as
select
    o.id, o.status, o.direction, o.subject, o.body,
    o.scheduled_send_at, o.confidence_score, o.created_at,
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
    coalesce(o.scheduled_send_at, o.created_at) asc;


-- ═══════════════════════════════════════════════════════════════════════
-- 0002_bounces_and_reminders.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0002_bounces_and_reminders.sql
-- Bounce handling (invalidate bad emails without hard-deleting contacts)
-- + follow-up reminders infrastructure.
--
-- Run after 0001. Idempotent.

-- =========================================================================
-- worker_state (kv store for worker watermarks etc.)
-- =========================================================================
create table if not exists worker_state (
    key        text primary key,
    value      text,
    updated_at timestamptz default now()
);

-- =========================================================================
-- contacts: email validity + bounce tracking
-- =========================================================================
alter table contacts
  add column if not exists email_valid      boolean default true,
  add column if not exists last_bounce_at   timestamptz,
  add column if not exists bounce_count     int default 0,
  add column if not exists bounce_reason    text,
  add column if not exists do_not_contact   boolean default false,
  add column if not exists reminder_due_at  timestamptz,
  add column if not exists reminder_reason  text;

create index if not exists idx_contacts_email_valid on contacts (email_valid) where email_valid = false;
create index if not exists idx_contacts_reminder    on contacts (reminder_due_at) where reminder_due_at is not null and do_not_contact = false;

-- =========================================================================
-- outreach_log: bounce flagging
-- =========================================================================
alter table outreach_log
  add column if not exists is_bounce      boolean default false,
  add column if not exists bounce_type    text,          -- 'hard' | 'soft' | 'blocked' | 'unknown'
  add column if not exists bounced_for_id uuid references outreach_log(id);  -- the outbound that bounced

-- add 'bounced' to outreach_status enum if missing
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'outreach_status' and e.enumlabel = 'bounced'
  ) then
    alter type outreach_status add value 'bounced';
  end if;
end $$;

create index if not exists idx_outreach_bounces on outreach_log (is_bounce) where is_bounce = true;

-- =========================================================================
-- View: who we've reached out to, with latest status per contact
-- =========================================================================
create or replace view v_outreach_history as
select
    c.id                     as contact_id,
    c.full_name,
    c.email,
    c.city,
    c.state,
    c.role,
    c.relationship_strength,
    c.email_valid,
    c.do_not_contact,
    c.last_interaction_at,
    c.reminder_due_at,
    c.reminder_reason,
    (select count(*) from outreach_log o
        where o.contact_id = c.id
          and o.direction = 'outbound'
          and o.status = 'sent')                    as outbound_sent_count,
    (select count(*) from outreach_log o
        where o.contact_id = c.id
          and o.direction = 'inbound')              as inbound_count,
    (select count(*) from outreach_log o
        where o.contact_id = c.id
          and o.status = 'bounced')                 as bounce_count_local,
    (select max(o.sent_at) from outreach_log o
        where o.contact_id = c.id
          and o.direction = 'outbound'
          and o.status = 'sent')                    as last_outbound_sent_at,
    (select max(o.replied_at) from outreach_log o
        where o.contact_id = c.id
          and o.direction = 'inbound')              as last_inbound_at,
    c.bounce_count                                   as lifetime_bounce_count
from contacts c
where c.deleted_at is null
order by c.last_interaction_at desc nulls last;

-- =========================================================================
-- View: who to reach back out to
-- Composed of three lanes:
--   1. inbound_awaiting_us  -> inbound email with no outbound reply > 48hr
--   2. warm_going_cold      -> warm contact, no touch in 30+ days, no active pitch
--   3. sent_no_reply        -> sent outbound >= 14 days ago, no reply, relationship stale
-- =========================================================================
create or replace view v_reach_back_reminders as
with inbound_awaiting as (
    select
        c.id                             as contact_id,
        c.full_name,
        c.email,
        c.role,
        max(i.created_at)                as last_inbound_at,
        'inbound_awaiting_us'::text      as lane,
        'inbound message >48h with no outbound reply'::text as reason
    from contacts c
    join outreach_log i on i.contact_id = c.id and i.direction = 'inbound'
    where c.deleted_at is null
      and c.email_valid = true
      and c.do_not_contact = false
      and not exists (
          select 1 from outreach_log o
          where o.contact_id = c.id
            and o.direction = 'outbound'
            and o.sent_at > i.created_at
      )
      and i.created_at < now() - interval '48 hours'
    group by c.id
),
warm_going_cold as (
    select
        c.id                             as contact_id,
        c.full_name,
        c.email,
        c.role,
        c.last_interaction_at            as last_inbound_at,
        'warm_going_cold'::text          as lane,
        'warm contact with no touch in 30+ days'::text as reason
    from contacts c
    where c.deleted_at is null
      and c.email_valid = true
      and c.do_not_contact = false
      and c.relationship_strength in ('warm','reconnect')
      and (c.last_interaction_at is null or c.last_interaction_at < now() - interval '30 days')
      and not exists (
          select 1 from outreach_log o
          where o.contact_id = c.id
            and o.status in ('draft','queued','held_for_review')
      )
),
sent_no_reply as (
    select
        c.id                             as contact_id,
        c.full_name,
        c.email,
        c.role,
        max(o.sent_at)                   as last_inbound_at,
        'sent_no_reply'::text            as lane,
        'sent outbound 14+ days ago, no reply'::text as reason
    from contacts c
    join outreach_log o on o.contact_id = c.id
    where c.deleted_at is null
      and c.email_valid = true
      and c.do_not_contact = false
      and o.direction = 'outbound'
      and o.status = 'sent'
      and o.sent_at < now() - interval '14 days'
      and o.replied_at is null
      and not exists (
          select 1 from outreach_log i
          where i.contact_id = c.id
            and i.direction = 'inbound'
            and i.created_at > o.sent_at
      )
      and not exists (
          select 1 from outreach_log d
          where d.contact_id = c.id
            and d.status in ('draft','queued','held_for_review')
            and d.created_at > o.sent_at
      )
    group by c.id
)
select * from inbound_awaiting
union all
select * from warm_going_cold
union all
select * from sent_no_reply
order by last_inbound_at asc nulls first;


-- ═══════════════════════════════════════════════════════════════════════
-- 0003_reports.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0003_reports.sql
-- Reporting storage: persisted daily / weekly rollups so the dashboard
-- doesn't need to recompute (or re-call the model) every request.
--
-- Run after 0002. Idempotent.

create table if not exists reports (
    id            uuid primary key default gen_random_uuid(),
    period        text not null,              -- 'daily' | 'weekly' | 'custom'
    window_start  timestamptz not null,
    window_end    timestamptz not null,
    payload       jsonb not null default '{}'::jsonb,  -- scorecard object
    markdown      text,                       -- rendered narrative
    created_at    timestamptz default now()
);

create index if not exists idx_reports_period_created
    on reports (period, created_at desc);

create index if not exists idx_reports_window
    on reports (window_end desc);

-- Convenience view: the most recent report of each period type
create or replace view v_latest_reports as
select distinct on (period)
    id, period, window_start, window_end, payload, markdown, created_at
from reports
order by period, created_at desc;


-- ═══════════════════════════════════════════════════════════════════════
-- 0004_contact_tiers.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0004_contact_tiers.sql
-- Adds the insider/warm/cold relationship_tier, multi-role contacts, timezone
-- handling, source tagging, and the artists/tours scope tables the outreach
-- seeder writes into.
--
-- Run after 0003. Idempotent.

-- =========================================================================
-- relationship_tier enum (distinct from relationship_strength, which is a
-- recency signal — tier is about how close the working relationship is)
-- =========================================================================
do $$
begin
    if not exists (select 1 from pg_type where typname = 'relationship_tier') then
        create type relationship_tier as enum ('insider', 'warm', 'cold');
    end if;
end $$;

-- =========================================================================
-- expand contact_role enum with the roles we actually see in offers
-- =========================================================================
do $$
begin
    begin alter type contact_role add value if not exists 'venue_booker';   exception when duplicate_object then null; end;
    begin alter type contact_role add value if not exists 'festival_buyer'; exception when duplicate_object then null; end;
    begin alter type contact_role add value if not exists 'tour_buyer';     exception when duplicate_object then null; end;
end $$;

-- =========================================================================
-- contacts: add multi-role, tier, timezone, source tag, radius holds,
-- and a hand-maintained VIP flag (never auto-send for VIPs).
-- =========================================================================
alter table contacts
    add column if not exists contact_roles         contact_role[] default '{}',
    add column if not exists relationship_tier     relationship_tier not null default 'cold',
    add column if not exists timezone              text,               -- 'America/Denver' etc
    add column if not exists last_contact_at       timestamptz,        -- most recent send or reply
    add column if not exists source_tag            text,               -- 'gmail:offers_dirtysnatcha', 'apollo', 'talent_db_import'
    add column if not exists radius_holds          jsonb default '[]'::jsonb,
    add column if not exists vip                   boolean default false,
    add column if not exists linkedin_url          text,
    add column if not exists instagram_handle      text,
    add column if not exists website               text;

-- backfill contact_roles from the legacy single-role field so the array is
-- always populated
update contacts
set contact_roles = array[role]
where (contact_roles is null or cardinality(contact_roles) = 0)
  and role is not null;

-- backfill last_contact_at from last_interaction_at
update contacts
set last_contact_at = last_interaction_at
where last_contact_at is null and last_interaction_at is not null;

-- backfill relationship_tier from relationship_strength as a starting heuristic
-- (the sync script will then refine based on actual exchange counts)
update contacts
set relationship_tier = case
    when relationship_strength = 'warm' then 'warm'::relationship_tier
    when relationship_strength = 'reconnect' then 'warm'::relationship_tier
    else 'cold'::relationship_tier
end
where relationship_tier = 'cold';  -- only touch rows still at default

create index if not exists idx_contacts_tier_last_contact
    on contacts (relationship_tier, last_contact_at desc);

create index if not exists idx_contacts_roles_gin
    on contacts using gin (contact_roles);

create index if not exists idx_contacts_source_tag
    on contacts (source_tag) where source_tag is not null;

-- =========================================================================
-- exchange_stats: denormalized per-contact counts, updated by sync script
-- =========================================================================
alter table contacts
    add column if not exists outbound_count        int default 0,
    add column if not exists inbound_count         int default 0,
    add column if not exists shows_together_count  int default 0;

-- =========================================================================
-- artists: the roster DBA books for (starts with DirtySnatcha, expands)
-- =========================================================================
create table if not exists artists (
    id                      uuid primary key default uuid_generate_v4(),
    slug                    text not null unique,        -- 'dirtysnatcha', 'whoisee'
    display_name            text not null,
    legal_name              text,
    pronouns                text,
    genre_tags              text[] default '{}',
    spotify_artist_id       text,
    home_market             text,                        -- 'Denver, CO'
    epk_url                 text,
    one_sheet_url           text,
    agent_company           text,                        -- 'Prysm', 'AB'
    agent_contact_id        uuid references contacts(id),
    notes                   text,
    active                  boolean not null default true,
    created_at              timestamptz default now(),
    updated_at              timestamptz default now()
);

-- =========================================================================
-- tours: a bookable window (Q2 2026 tier-2, summer festivals, etc)
-- the seeder works off one tour at a time
-- =========================================================================
create table if not exists tours (
    id                      uuid primary key default uuid_generate_v4(),
    artist_id               uuid not null references artists(id) on delete cascade,
    name                    text not null,               -- 'Q2 2026 Tier-2'
    tier                    int not null default 2,      -- 1=majors, 2=300-800cap, 3=DIY
    window_start            date not null,
    window_end              date not null,
    routing_anchors         jsonb default '[]'::jsonb,   -- [{city:'Denver', anchor_date:'2026-05-15'}]
    target_market_count     int default 0,               -- aspirational city count
    guarantee_target        numeric,
    guarantee_floor         numeric,
    status                  text not null default 'planning', -- planning | active | paused | closed
    notes                   text,
    created_at              timestamptz default now(),
    updated_at              timestamptz default now()
);

create index if not exists idx_tours_artist_status on tours (artist_id, status);

-- =========================================================================
-- tour_targets: the pitch queue — every (tour, contact) pair we plan to
-- reach out to. The seeder populates this, the composer reads it to know
-- what's in-scope, and outreach_log rows tie back via tour_target_id.
-- =========================================================================
create table if not exists tour_targets (
    id                      uuid primary key default uuid_generate_v4(),
    tour_id                 uuid not null references tours(id) on delete cascade,
    contact_id              uuid not null references contacts(id) on delete cascade,
    venue_id                uuid references venues(id) on delete set null,
    market_metro            text,
    relationship_tier_snapshot relationship_tier not null, -- captured at seed time
    priority                int not null default 50,       -- 0-100, higher = pitch first
    reason                  text,                          -- why this contact made the list
    status                  text not null default 'queued',-- queued | drafted | sent | replied | booked | declined | dropped
    blocked_reason          text,
    drafted_outreach_id     uuid references outreach_log(id),
    created_at              timestamptz default now(),
    updated_at              timestamptz default now(),
    unique (tour_id, contact_id)
);

create index if not exists idx_tour_targets_status on tour_targets (tour_id, status, priority desc);

-- add an outreach_log back-reference for ergonomics
alter table outreach_log
    add column if not exists tour_target_id uuid references tour_targets(id);

create index if not exists idx_outreach_tour_target on outreach_log (tour_target_id);

-- =========================================================================
-- promoter_activity: feeds the "taking initiative" opener — vlogs, announces,
-- lineup drops. Analyst writes here, composer reads it per contact.
-- =========================================================================
create table if not exists promoter_activity (
    id              uuid primary key default uuid_generate_v4(),
    contact_id      uuid references contacts(id) on delete cascade,
    venue_id        uuid references venues(id) on delete set null,
    activity_type   text not null,                      -- 'lineup_announce', 'vlog', 'ig_post', 'festival_announce', 'venue_series'
    headline        text not null,                      -- "Global Dance Festival 2026 announced, Jul 18-19 at Empower Field"
    source_url      text,
    activity_date   date,
    confidence      numeric default 0.9 check (confidence between 0 and 1),
    expires_at      date default (current_date + interval '60 days'),
    consumed_at     timestamptz,
    raw_payload     jsonb,
    created_at      timestamptz default now()
);

create index if not exists idx_promoter_activity_fresh
    on promoter_activity (contact_id, expires_at)
    where consumed_at is null;

-- =========================================================================
-- updated_at triggers for new tables
-- =========================================================================
do $$
declare t text;
begin
  for t in select unnest(array['artists','tours','tour_targets']) loop
    if not exists (
        select 1 from pg_trigger
        where tgname = format('trg_%s_updated', t)
    ) then
        execute format(
          'create trigger trg_%I_updated before update on %I for each row execute function set_updated_at();',
          t, t
        );
    end if;
  end loop;
end $$;

-- =========================================================================
-- v_outreach_scope: what's queued per tour, joined with contact tier
-- =========================================================================
create or replace view v_outreach_scope as
select
    tt.id               as target_id,
    tt.tour_id,
    t.name              as tour_name,
    a.display_name      as artist,
    c.id                as contact_id,
    c.full_name         as contact_name,
    c.email,
    c.company,
    c.city,
    c.state,
    c.timezone,
    c.relationship_tier,
    c.contact_roles,
    c.last_contact_at,
    c.outbound_count,
    tt.priority,
    tt.status           as target_status,
    tt.reason
from tour_targets tt
join tours t        on t.id = tt.tour_id
join artists a      on a.id = t.artist_id
join contacts c     on c.id = tt.contact_id
order by tt.priority desc, c.last_contact_at desc nulls last;


-- ═══════════════════════════════════════════════════════════════════════
-- 0005_artist_attribution.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0005_artist_attribution.sql
-- Adds artist attribution to offers + confirmed_shows so we can answer
-- "which of our roster artists played at this venue in the last N months"
-- and suppress recently-played artists from the per-contact package pitch.
--
-- Safe to re-run.

-- =========================================================================
-- offers: which of our artists did this offer cover?
-- =========================================================================
alter table offers
    add column if not exists artist_id      uuid references artists(id),
    add column if not exists artist_slug    text,              -- denormalized for fast lookup
    add column if not exists gigwell_id     text,
    add column if not exists source_tag     text;

create index if not exists idx_offers_artist_venue
    on offers (artist_id, venue_id);

create index if not exists idx_offers_gigwell_id
    on offers (gigwell_id) where gigwell_id is not null;

-- =========================================================================
-- confirmed_shows: which artist played?
-- =========================================================================
alter table confirmed_shows
    add column if not exists artist_id      uuid references artists(id),
    add column if not exists artist_slug    text,
    add column if not exists gigwell_id     text,
    add column if not exists source_tag     text;

create index if not exists idx_confirmed_shows_artist_venue_date
    on confirmed_shows (artist_id, venue_id, show_date desc);

create index if not exists idx_confirmed_shows_gigwell_id
    on confirmed_shows (gigwell_id) where gigwell_id is not null;

-- =========================================================================
-- v_recent_plays_by_venue: for each (venue, artist), when did that
-- artist last play that room? Primary suppression index — if Dirty
-- played Mishawaka last summer, we skip Dirty in any package pitched
-- into Mishawaka, regardless of which contact books it.
-- =========================================================================
create or replace view v_recent_plays_by_venue as
select
    cs.venue_id,
    cs.artist_id,
    cs.artist_slug,
    max(cs.show_date) as last_played_at,
    count(*)          as plays_count
from confirmed_shows cs
where (cs.status in ('announced', 'on_sale', 'sold_out') or cs.status is null)
  and cs.artist_slug is not null
group by cs.venue_id, cs.artist_id, cs.artist_slug;

-- v_recent_plays_by_contact: soft signal — "this buyer books rooms
-- where Dirty played recently." Used only as a fallback when we don't
-- yet know which specific venue a contact would pitch into.
create or replace view v_recent_plays_by_contact as
select
    cv.contact_id,
    cs.artist_id,
    cs.artist_slug,
    max(cs.show_date) as last_played_at,
    count(*)          as plays_count
from confirmed_shows cs
join contact_venues  cv on cv.venue_id = cs.venue_id
where (cs.status in ('announced', 'on_sale', 'sold_out') or cs.status is null)
  and cs.artist_slug is not null
group by cv.contact_id, cs.artist_id, cs.artist_slug;

-- =========================================================================
-- fn_suppress_artists_for_venue(venue_id, cooldown_days)
-- PRIMARY API. If a venue_id is known for the pitch target, use this —
-- it's the precise answer. Default cooldown: 180 days.
-- =========================================================================
create or replace function fn_suppress_artists_for_venue(
    p_venue_id uuid,
    p_cooldown_days int default 180
)
returns table (artist_slug text, last_played_at date)
language sql stable as $$
    select artist_slug, last_played_at
    from v_recent_plays_by_venue
    where venue_id = p_venue_id
      and last_played_at >= current_date - make_interval(days => p_cooldown_days);
$$;

-- fn_suppress_artists_for_contact(contact_id, cooldown_days)
-- Fallback when the pitch target has no venue_id yet (e.g. a promoter
-- doing one-offs across multiple rooms). Use fn_suppress_artists_for_venue
-- instead whenever the venue is known.
create or replace function fn_suppress_artists_for_contact(
    p_contact_id uuid,
    p_cooldown_days int default 180
)
returns table (artist_slug text, last_played_at date)
language sql stable as $$
    select artist_slug, last_played_at
    from v_recent_plays_by_contact
    where contact_id = p_contact_id
      and last_played_at >= current_date - make_interval(days => p_cooldown_days);
$$;

-- =========================================================================
-- tour_targets gains a snapshot of which artists were suppressed at seed
-- time — the composer reads this so it doesn't include DirtySnatcha in
-- the package header when pitching Mishawaka if he played there 2 months
-- ago.
-- =========================================================================
alter table tour_targets
    add column if not exists suppressed_artists text[] default '{}',
    add column if not exists featured_artists   text[] default '{}';

-- ═══════════════════════════════════════════════════════════════════════
-- 0006_multi_artist_packages.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0006_multi_artist_packages.sql
-- Turns a tour from "one artist, one window" into "a package of artists
-- offered at scalable tier-sizes". Needed for Take Me To Your Leader leg 2,
-- where the buyer can book 3 / 5 / or all 7 of the roster depending on
-- room size and budget.
--
-- Safe to re-run.

-- =========================================================================
-- seed the roster if those artist rows don't exist yet
-- (the slugs match what we use everywhere: artist_slug on offers / shows /
--  radius_holds, valid_slugs in the composer prompt, etc.)
-- =========================================================================
insert into artists (slug, display_name, home_market, active)
values
    ('dirtysnatcha', 'DirtySnatcha', 'Denver, CO', true),
    ('mport',        'Mport',        'Denver, CO', true),
    ('kotrax',       'Kotrax',       'Denver, CO', true),
    ('ozztin',       'Ozztin',       'Denver, CO', true),
    ('dark_matter',  'Dark Matter',  'Denver, CO', true),
    ('hvrcrft',      'HVRCRFT',      'Denver, CO', true),
    ('xenotype',     'Xenotype',     'Denver, CO', true)
on conflict (slug) do nothing;

-- =========================================================================
-- tour_artists: which artists are IN the package for this tour.
-- A tour can have many; each has a role so the composer knows who to
-- pitch as headliner vs. support.
-- =========================================================================
do $$
begin
    if not exists (select 1 from pg_type where typname = 'tour_artist_role') then
        create type tour_artist_role as enum ('headliner', 'co_headliner', 'support', 'open');
    end if;
end $$;

create table if not exists tour_artists (
    tour_id        uuid not null references tours(id) on delete cascade,
    artist_id      uuid not null references artists(id) on delete cascade,
    role           tour_artist_role not null default 'headliner',
    is_required    boolean not null default false,   -- must be in every pitched config
    priority       int not null default 50,          -- higher = pitched first if roster trimmed
    notes          text,
    created_at     timestamptz default now(),
    primary key (tour_id, artist_id)
);

create index if not exists idx_tour_artists_tour on tour_artists (tour_id);

-- =========================================================================
-- package_levels: the scalable configurations offered for this tour.
-- e.g. Take Me To Your Leader might offer:
--   trio       (3 artists, 300-500 cap, $2k-$3.5k)
--   quintet    (5 artists, 500-900 cap, $4k-$6.5k)
--   full_seven (7 artists, 900+ cap,   $7k+)
-- Each level has a venue-capacity fit range and guarantee band.
-- required_artist_slugs are always in; optional_artist_slugs is the
-- swap pool the seeder chooses from after suppression.
-- =========================================================================
create table if not exists package_levels (
    id                       uuid primary key default uuid_generate_v4(),
    tour_id                  uuid not null references tours(id) on delete cascade,
    label                    text not null,                 -- 'trio', 'quintet', 'full_seven'
    tier_size                int not null,                  -- number of artists in this config
    min_venue_capacity       int,                           -- nulls = no floor
    max_venue_capacity       int,                           -- nulls = no ceiling
    guarantee_floor          numeric,
    guarantee_target         numeric,
    guarantee_ceiling        numeric,
    required_artist_slugs    text[] not null default '{}',  -- always in
    optional_artist_slugs    text[] not null default '{}',  -- swap pool
    sort_order               int not null default 0,
    notes                    text,
    created_at               timestamptz default now(),
    updated_at               timestamptz default now(),
    unique (tour_id, label)
);

create index if not exists idx_package_levels_tour on package_levels (tour_id, sort_order);
create index if not exists idx_package_levels_capacity
    on package_levels (tour_id, min_venue_capacity, max_venue_capacity);

-- =========================================================================
-- tour_targets: capture which package level was matched for this target
-- and the concrete artist composition pitched. featured_artists already
-- added in 0005 — here we just add the level + composition pointers.
-- =========================================================================
alter table tour_targets
    add column if not exists package_level_id  uuid references package_levels(id),
    add column if not exists pitched_artists   text[] default '{}',
    add column if not exists pitched_guarantee numeric;

create index if not exists idx_tour_targets_package_level
    on tour_targets (package_level_id);

-- =========================================================================
-- fn_pick_package_level(tour_id, venue_capacity)
-- returns the best-fit package_level row for a venue of given capacity.
-- Picks the highest tier whose capacity band contains the venue cap,
-- falling back to the smallest tier if nothing fits cleanly.
-- =========================================================================
create or replace function fn_pick_package_level(
    p_tour_id uuid,
    p_venue_capacity int
)
returns package_levels
language sql stable as $$
    -- try exact fit first (venue cap within band)
    with fit as (
        select *
        from package_levels
        where tour_id = p_tour_id
          and (p_venue_capacity is null
               or (coalesce(min_venue_capacity, 0)    <= p_venue_capacity
                   and coalesce(max_venue_capacity, 2147483647) >= p_venue_capacity))
        order by tier_size desc, sort_order
        limit 1
    )
    select * from fit
    union all
    -- fallback: smallest tier
    select * from package_levels
    where tour_id = p_tour_id
      and not exists (select 1 from fit)
    order by tier_size asc, sort_order
    limit 1;
$$;

-- =========================================================================
-- v_tour_roster: flattened view of who's on each tour with their slugs
-- (the composer reads this to know the package pool)
-- =========================================================================
create or replace view v_tour_roster as
select
    t.id                as tour_id,
    t.name              as tour_name,
    array_agg(a.slug order by ta.priority desc, a.display_name) as artist_slugs,
    array_agg(a.display_name order by ta.priority desc, a.display_name) as artist_names,
    array_agg(a.slug order by ta.priority desc, a.display_name)
        filter (where ta.is_required) as required_slugs
from tours t
join tour_artists ta on ta.tour_id = t.id
join artists a      on a.id = ta.artist_id
group by t.id, t.name;

-- =========================================================================
-- updated_at trigger for package_levels
-- =========================================================================
do $$
begin
    if not exists (
        select 1 from pg_trigger where tgname = 'trg_package_levels_updated'
    ) then
        create trigger trg_package_levels_updated
            before update on package_levels
            for each row execute function set_updated_at();
    end if;
end $$;

-- =========================================================================
-- seed Take Me To Your Leader leg 2 package configuration
-- (commented out — uncomment after you've created the tour row itself.
--  this is here as the canonical example so the seeder knows the shape.)
-- =========================================================================
-- do $$
-- declare
--     v_tour_id   uuid;
--     v_artist_id uuid;
-- begin
--     -- assume artist DirtySnatcha is the tour's primary artist
--     select id into v_artist_id from artists where slug = 'dirtysnatcha';
--
--     insert into tours (artist_id, name, tier, window_start, window_end,
--                        guarantee_target, guarantee_floor, notes)
--     values (v_artist_id, 'Take Me To Your Leader - Leg 2', 2,
--             '2026-06-01', '2026-09-30',
--             null, null,
--             'Multi-artist package tour. Scalable 3/5/7 configs.')
--     returning id into v_tour_id;
--
--     insert into tour_artists (tour_id, artist_id, role, is_required, priority)
--     select v_tour_id, a.id,
--            case a.slug when 'dirtysnatcha' then 'headliner'::tour_artist_role
--                        else 'support'::tour_artist_role end,
--            a.slug = 'dirtysnatcha',   -- only DSR is required in every config
--            case a.slug when 'dirtysnatcha' then 100
--                        when 'kotrax'       then 90
--                        when 'dark_matter'  then 85
--                        when 'hvrcrft'      then 80
--                        when 'mport'        then 75
--                        when 'ozztin'       then 70
--                        when 'xenotype'     then 65
--                        end
--     from artists a
--     where a.slug in ('dirtysnatcha','mport','kotrax','ozztin',
--                      'dark_matter','hvrcrft','xenotype');
--
--     insert into package_levels
--         (tour_id, label, tier_size,
--          min_venue_capacity, max_venue_capacity,
--          guarantee_floor, guarantee_target, guarantee_ceiling,
--          required_artist_slugs, optional_artist_slugs, sort_order)
--     values
--         (v_tour_id, 'trio',       3,   250,  500,   null, 2500,  3500,
--          array['dirtysnatcha'],
--          array['kotrax','dark_matter','hvrcrft','mport','ozztin','xenotype'], 1),
--         (v_tour_id, 'quintet',    5,   500,  900,   null, 4500,  6500,
--          array['dirtysnatcha'],
--          array['kotrax','dark_matter','hvrcrft','mport','ozztin','xenotype'], 2),
--         (v_tour_id, 'full_seven', 7,   900, null,   null, 7500, 10000,
--          array['dirtysnatcha','kotrax','dark_matter','hvrcrft','mport','ozztin','xenotype'],
--          array[]::text[], 3);
-- end $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 0007_tour_targets_per_venue.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0007_tour_targets_per_venue.sql
-- Opens up tour_targets so a single contact can be pitched multiple times
-- on the same tour — once per venue they book. The seeder now iterates
-- (tour, contact, venue) tuples so a buyer who books three rooms gets
-- three targeted pitches, each with its own per-venue suppression.
--
-- Safe to re-run.

-- drop the old (tour_id, contact_id) unique constraint if present
do $$
declare
    conname text;
begin
    select c.conname into conname
    from pg_constraint c
    join pg_class r on r.oid = c.conrelid
    where r.relname = 'tour_targets'
      and c.contype = 'u';
    if conname is not null then
        execute format('alter table tour_targets drop constraint %I', conname);
    end if;
end $$;

-- new unique index: one row per (tour, contact, venue_or_null)
-- uuid_nil() ('00000000-...') stands in for null so the index works
-- even when the target has no specific venue (contact-level fallback).
create unique index if not exists tour_targets_tour_contact_venue_uniq
    on tour_targets (
        tour_id,
        contact_id,
        coalesce(venue_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

-- handy view: every pitchable (contact, venue) pair for a tour, joined
-- with capacity + existing target status if already seeded. The seeder
-- uses this as its working set.
create or replace view v_pitchable_targets as
select
    c.id                          as contact_id,
    c.full_name                   as contact_name,
    c.email,
    c.relationship_tier,
    c.contact_roles,
    c.vip,
    v.id                          as venue_id,
    v.name                        as venue_name,
    v.capacity                    as venue_capacity,
    v.city                        as venue_city,
    v.state                       as venue_state
from contacts c
left join contact_venues cv on cv.contact_id = c.id
left join venues v          on v.id = cv.venue_id
where c.deleted_at is null
  and c.email is not null
  and coalesce(v.deleted_at, now() + interval '1 year') > now();


-- ═══════════════════════════════════════════════════════════════════════
-- 0008_outreach_events.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0008_outreach_events.sql
-- Adds open/click tracking for outbound emails.
--
-- Design:
--   * Every outbound send gets a 1x1 pixel inlined at /t/open/<id>.gif
--   * Links in the body are rewritten to /t/click/<id>?u=<encoded_url>
--   * The endpoints write a row to outreach_events AND bump aggregate
--     counters on outreach_log for quick queries in the UI.
--   * IPs are hashed with a rotating daily salt (stored in app config)
--     so we never store raw recipient IPs.
--
-- Delete tracking is explicitly not modeled here — Gmail exposes no
-- recipient-side delete signal for individual senders. If/when we wire
-- Postmaster Tools for the domain, add a `delete` event_type and a
-- webhook ingester.
--
-- Safe to re-run.

-- =========================================================================
-- event_type enum
-- =========================================================================
do $$
begin
    if not exists (select 1 from pg_type where typname = 'outreach_event_type') then
        create type outreach_event_type as enum ('open', 'click', 'unsubscribe');
    end if;
end $$;

-- =========================================================================
-- outreach_events: one row per pixel fetch / link click
-- =========================================================================
create table if not exists outreach_events (
    id               uuid primary key default uuid_generate_v4(),
    outreach_log_id  uuid not null references outreach_log(id) on delete cascade,
    contact_id       uuid references contacts(id) on delete set null,
    event_type       outreach_event_type not null,
    target_url       text,                    -- for clicks
    user_agent       text,
    ip_hash          text,                    -- sha256(ip + daily_salt)
    referrer         text,
    created_at       timestamptz default now()
);

create index if not exists idx_outreach_events_log
    on outreach_events (outreach_log_id, created_at desc);
create index if not exists idx_outreach_events_contact
    on outreach_events (contact_id, created_at desc);
create index if not exists idx_outreach_events_type_time
    on outreach_events (event_type, created_at desc);

-- =========================================================================
-- Aggregate columns on outreach_log for fast UI queries
-- =========================================================================
alter table outreach_log
    add column if not exists first_opened_at  timestamptz,
    add column if not exists open_count       int not null default 0,
    add column if not exists first_clicked_at timestamptz,
    add column if not exists click_count      int not null default 0,
    add column if not exists last_event_at    timestamptz;

create index if not exists idx_outreach_log_first_opened
    on outreach_log (first_opened_at)
    where first_opened_at is not null;
create index if not exists idx_outreach_log_first_clicked
    on outreach_log (first_clicked_at)
    where first_clicked_at is not null;

-- =========================================================================
-- fn_record_outreach_event(log_id, event_type, url, ua, ip_hash, ref)
-- Insert event + bump aggregates on outreach_log in one txn.
-- Returns the inserted event row.
-- =========================================================================
create or replace function fn_record_outreach_event(
    p_log_id      uuid,
    p_event_type  outreach_event_type,
    p_target_url  text default null,
    p_user_agent  text default null,
    p_ip_hash     text default null,
    p_referrer    text default null
) returns outreach_events
language plpgsql as $$
declare
    v_event   outreach_events;
    v_contact uuid;
begin
    -- resolve contact from the log row (allows set null on contact delete)
    select contact_id into v_contact
    from outreach_log
    where id = p_log_id;

    insert into outreach_events (
        outreach_log_id, contact_id, event_type,
        target_url, user_agent, ip_hash, referrer
    )
    values (
        p_log_id, v_contact, p_event_type,
        p_target_url, p_user_agent, p_ip_hash, p_referrer
    )
    returning * into v_event;

    if p_event_type = 'open' then
        update outreach_log
           set first_opened_at = coalesce(first_opened_at, v_event.created_at),
               open_count      = open_count + 1,
               last_event_at   = v_event.created_at
         where id = p_log_id;
    elsif p_event_type = 'click' then
        update outreach_log
           set first_clicked_at = coalesce(first_clicked_at, v_event.created_at),
               click_count      = click_count + 1,
               last_event_at    = v_event.created_at
         where id = p_log_id;
    else
        update outreach_log
           set last_event_at = v_event.created_at
         where id = p_log_id;
    end if;

    -- bump last_interaction_at on the contact so the outreach views
    -- surface engagement even before an explicit reply
    if v_contact is not null then
        update contacts
           set last_interaction_at = greatest(
                   coalesce(last_interaction_at, v_event.created_at),
                   v_event.created_at
               )
         where id = v_contact;
    end if;

    return v_event;
end $$;

-- =========================================================================
-- v_outreach_engagement: roll-up for the /history + dashboard views
-- =========================================================================
create or replace view v_outreach_engagement as
select
    o.id                as outreach_log_id,
    o.contact_id,
    o.subject,
    o.sent_at,
    o.first_opened_at,
    o.open_count,
    o.first_clicked_at,
    o.click_count,
    o.last_event_at,
    c.full_name         as contact_name,
    c.email             as contact_email,
    c.city              as contact_city,
    c.state             as contact_state,
    c.relationship_tier
from outreach_log o
left join contacts c on c.id = o.contact_id
where o.direction = 'outbound'
  and o.status   = 'sent';


-- ═══════════════════════════════════════════════════════════════════════
-- 0009_offers_as_contracts.sql
-- ═══════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════
-- 0010_offers_agent_relay.sql
-- ═══════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════
-- 0011_booking_intelligence.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0011_booking_intelligence.sql
--
-- Booking intelligence: a composite score per (artist, contact, venue, tour)
-- tuple so outreach goes out ranked by probability-to-book, not by tier
-- filter alone. Replaces the "pick N from each tier" logic in
-- scripts/seed_q2_tier2_drafts.py with a sorted work queue.
--
-- Design decisions (locked with Thomas 2026-04-22):
--   * Plain SQL view, not materialized, not function. Easy to read, easy
--     to join. Promote to materialized view only if reads get slow.
--   * One row per (artist_id, contact_id, venue_id, tour_id) — every
--     roster artist scored independently against every target. The
--     seeder picks the top artist-target pair per outreach slot.
--   * Radius conflicts are TIERED:
--       - Non-festival venue inside window + proximate city -> score = 0,
--         surfaces on v_radius_blocked_targets.
--       - Festival venue inside window -> keep score, flag
--         radius_exception_candidate = true, surfaces on
--         v_radius_exception_candidates so Thomas can pursue with AB.
--   * promoter_activity factor omitted entirely until #35 lands. When it
--     does, add a factor column and rebalance weights.
--
-- Known v1 limitations (followups, noted in CLAUDE.md drift as we ship):
--   * No lat/lng on venues, so "within 75 miles" is approximated as
--     SAME CITY for radius conflict checks. Good enough for today's
--     data (we mostly have one venue per city per artist on the calendar)
--     but deserves a real geo upgrade when we backfill coords.
--   * Genre-fit factor relies on venues.genre_fit (text[]) intersecting
--     artists.genre_tags (text[]) — both sparsely populated. Scores
--     neutral (0.5) when either is empty rather than punishing missing
--     data.
--
-- Safe to re-run.

-- =========================================================================
-- 1. Schema prep: mark which venues are festivals (radius-exception path)
-- =========================================================================
alter table venues
    add column if not exists is_festival boolean not null default false;

-- Heuristic backfill: any venue whose name contains 'festival', 'fest',
-- 'grounds', or 'field' is very likely a festival grounds. Conservative —
-- easy for Thomas to override per-row.
update venues
set is_festival = true
where is_festival = false
  and deleted_at is null
  and (
        name ilike '%festival%'
     or name ilike '%fest %'
     or name ilike '% fest'
     or name ilike '%fest'
     or name ilike '%grounds%'
     or name ilike '%fairgrounds%'
  );

create index if not exists idx_venues_is_festival
    on venues (is_festival) where is_festival = true;

-- =========================================================================
-- 2. Supporting view: reply-rate history per contact
-- Uses outreach_log: reply_rate = replied_count / sent_count.
-- Null-safe: contacts we've never emailed get reply_rate = null (the
-- scorer treats null as neutral 0.3, mid-range).
-- =========================================================================
create or replace view v_reply_rate_by_contact as
select
    c.id                                                       as contact_id,
    count(*) filter (where o.status = 'sent')                  as sent_count,
    count(*) filter (where o.replied_at is not null)           as replied_count,
    count(*) filter (where o.first_opened_at is not null)      as opened_count,
    case
        when count(*) filter (where o.status = 'sent') > 0
        then round(
            count(*) filter (where o.replied_at is not null)::numeric
            / count(*) filter (where o.status = 'sent'),
            3
        )
        else null
    end                                                        as reply_rate,
    max(o.sent_at)                                             as last_sent_at,
    max(o.replied_at)                                          as last_replied_at
from contacts c
left join outreach_log o
       on o.contact_id = c.id
      and o.direction = 'outbound'
where c.deleted_at is null
group by c.id;

-- =========================================================================
-- 3. Supporting view: locked shows per artist, with window bounds for
-- radius conflict checks. Union of confirmed_shows (calendar of truth)
-- and offers that reached fully_executed / deposit_received state (which
-- are contractually locked but may not have a confirmed_shows row yet).
-- =========================================================================
create or replace view v_locked_shows as
select
    cs.artist_id,
    cs.artist_slug,
    cs.venue_id,
    v.city                as venue_city,
    v.state               as venue_state,
    cs.show_date,
    'confirmed_show'      as source_type,
    cs.id                 as source_id
from confirmed_shows cs
left join venues v on v.id = cs.venue_id
where cs.status in ('announced', 'on_sale', 'sold_out')
  and cs.artist_id is not null
union all
select
    o.artist_id,
    o.artist_slug,
    o.venue_id,
    v.city                as venue_city,
    v.state               as venue_state,
    o.proposed_date       as show_date,
    'offer_locked'        as source_type,
    o.id                  as source_id
from offers o
left join venues v on v.id = o.venue_id
where o.status in ('fully_executed'::offer_status, 'deposit_received'::offer_status)
  and o.artist_id is not null
  and o.proposed_date is not null;

-- =========================================================================
-- 4. The scorer. One row per (artist, contact, venue, tour) where:
--    - the tour is active (planning | active)
--    - the artist is on that tour's package
--    - the contact is pitchable (see v_pitchable_targets)
--    - the venue is known on the contact OR we fall back to contact-level
-- =========================================================================
create or replace view v_target_score as
with base as (
    select
        t.id                           as tour_id,
        t.name                         as tour_name,
        t.artist_id                    as tour_primary_artist_id,
        t.window_start,
        t.window_end,
        t.guarantee_target,
        t.guarantee_floor,
        t.routing_anchors,

        ta.artist_id,
        a.slug                         as artist_slug,
        a.display_name                 as artist_name,
        a.genre_tags                   as artist_genre_tags,

        vpt.contact_id,
        vpt.contact_name,
        vpt.email,
        vpt.relationship_tier,
        vpt.contact_roles,
        vpt.vip,

        vpt.venue_id,
        vpt.venue_name,
        vpt.venue_capacity,
        vpt.venue_city,
        vpt.venue_state
    from tours t
    join tour_artists ta on ta.tour_id = t.id
    join artists a       on a.id = ta.artist_id
    join v_pitchable_targets vpt on true  -- every artist × every pitchable target
    where t.status in ('planning', 'active')
),
-- ---- factor: historical booking rate at this venue for ANY DSR roster artist
--       (signals "this is a room our scene plays"). 1.0 if >=3 recent plays,
--       scaled down below that. Uses v_recent_plays_by_venue from 0005.
hist as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        coalesce(sum(rp.plays_count), 0)                    as plays_count,
        max(rp.last_played_at)                              as last_played_at,
        case
            when sum(rp.plays_count) is null then 0.0
            when sum(rp.plays_count) >= 3    then 1.0
            when sum(rp.plays_count) = 2     then 0.7
            when sum(rp.plays_count) = 1     then 0.5
            else 0.0
        end                                                 as f_history
    from base b
    left join v_recent_plays_by_venue rp
           on rp.venue_id = b.venue_id
    group by b.tour_id, b.artist_id, b.contact_id, b.venue_id
),
-- ---- factor: buyer tier (insider / warm / cold). Simple map.
tier_f as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        case b.relationship_tier
            when 'insider' then 1.0
            when 'warm'    then 0.6
            when 'cold'    then 0.2
        end                                                 as f_tier
    from base b
),
-- ---- factor: recency. Sweet spot is 30-180d since last contact. Never-
--       contacted is neutral-positive (0.7). Recent (<30d) is suppressed
--       because we don't want to pester. Very stale (>365d) is modestly
--       positive — reconnect territory.
recency as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        c.last_contact_at,
        case
            when c.last_contact_at is null                                                then 0.7
            when current_date - c.last_contact_at::date < 30                              then 0.2
            when current_date - c.last_contact_at::date between 30 and 180                then 1.0
            when current_date - c.last_contact_at::date between 181 and 365               then 0.7
            else 0.5
        end                                                 as f_recency
    from base b
    join contacts c on c.id = b.contact_id
),
-- ---- factor: capacity x guarantee fit.
--       Roughly "is this venue big enough to cover the tour's guarantee
--       target?" with ~$20/head as the rule of thumb. Missing data is
--       neutral (0.5).
cap_fit as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        case
            when b.venue_capacity is null or b.guarantee_target is null then 0.5
            when b.guarantee_target = 0                                 then 0.5
            else least(1.0, (b.venue_capacity::numeric * 20.0) / b.guarantee_target)
        end                                                 as f_cap_fit
    from base b
),
-- ---- factor: routing anchor proximity.
--       If the candidate venue city is one of the tour's routing anchors,
--       strong signal (1.0). If not, we check state match as a weak
--       proxy for "roughly on the way" (0.5). Else 0.2.
anchor as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        case
            when exists (
                select 1
                from jsonb_array_elements(coalesce(b.routing_anchors, '[]'::jsonb)) ra
                where lower(ra->>'city') = lower(b.venue_city)
            )                                                   then 1.0
            when exists (
                select 1
                from jsonb_array_elements(coalesce(b.routing_anchors, '[]'::jsonb)) ra
                where split_part(ra->>'city', ',', 2) ilike '%' || b.venue_state || '%'
                   or ra->>'city' ilike '%' || b.venue_state || '%'
            )                                                   then 0.5
            else 0.2
        end                                                 as f_anchor
    from base b
),
-- ---- factor: reply-rate history on this contact. If we have >=3 sent and
--       the contact replied, strong signal. If we have sent but never
--       heard back, weak signal. If we've never emailed them, neutral.
reply as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        rr.reply_rate,
        rr.sent_count,
        case
            when rr.reply_rate is null                      then 0.5   -- never emailed
            when rr.sent_count < 3 and rr.reply_rate > 0    then 0.7   -- early positive
            when rr.reply_rate >= 0.5                       then 1.0
            when rr.reply_rate >= 0.2                       then 0.8
            when rr.reply_rate > 0                          then 0.5
            when rr.sent_count >= 3                         then 0.2   -- persistent silence
            else 0.4
        end                                                 as f_reply
    from base b
    left join v_reply_rate_by_contact rr on rr.contact_id = b.contact_id
),
-- ---- factor: genre fit. Artists.genre_tags overlap with venues.genre_fit.
genre as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        case
            when b.artist_genre_tags is null or cardinality(b.artist_genre_tags) = 0 then 0.5
            when coalesce(v.genre_fit, '{}') = '{}'                                    then 0.5
            else least(1.0,
                cardinality(
                    array(
                        select unnest(b.artist_genre_tags)
                        intersect
                        select unnest(v.genre_fit)
                    )
                )::numeric / cardinality(b.artist_genre_tags)
            )
        end                                                 as f_genre
    from base b
    left join venues v on v.id = b.venue_id
),
-- ---- radius conflict detection. Does this artist have a locked show in
--       the same city during the tour window (plus 30d padding on either
--       side)?  If so, flag it. Festival venues are surfaced separately
--       via the is_festival check on the candidate venue.
conflict as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        (
            select ls.source_type || ':' || ls.source_id
            from v_locked_shows ls
            where ls.artist_id = b.artist_id
              and ls.venue_city is not null
              and b.venue_city is not null
              and lower(ls.venue_city) = lower(b.venue_city)
              and ls.show_date between (b.window_start - interval '30 days')::date
                                   and (b.window_end   + interval '30 days')::date
            limit 1
        )                                                   as conflict_source,
        exists (
            select 1
            from v_locked_shows ls
            where ls.artist_id = b.artist_id
              and ls.venue_city is not null
              and b.venue_city is not null
              and lower(ls.venue_city) = lower(b.venue_city)
              and ls.show_date between (b.window_start - interval '30 days')::date
                                   and (b.window_end   + interval '30 days')::date
        )                                                   as has_radius_conflict
    from base b
),
scored as (
    select
        b.tour_id, b.tour_name,
        b.window_start, b.window_end,
        b.guarantee_target, b.guarantee_floor,
        b.artist_id, b.artist_slug, b.artist_name,
        b.contact_id, b.contact_name, b.email,
        b.relationship_tier, b.contact_roles, b.vip,
        b.venue_id, b.venue_name, b.venue_capacity,
        b.venue_city, b.venue_state,

        v.is_festival,

        h.f_history, h.plays_count, h.last_played_at,
        tf.f_tier,
        r.f_recency, r.last_contact_at,
        cf.f_cap_fit,
        an.f_anchor,
        rp.f_reply, rp.reply_rate, rp.sent_count,
        g.f_genre,

        cn.has_radius_conflict,
        cn.conflict_source,
        (cn.has_radius_conflict and coalesce(v.is_festival, false))   as radius_exception_candidate,
        (cn.has_radius_conflict and not coalesce(v.is_festival, false)) as radius_blocked,

        -- Weighted raw score (pre-conflict mask). Weights sum to 1.0.
        --   history       0.25
        --   tier          0.15
        --   recency       0.10
        --   cap_fit       0.10
        --   anchor        0.15
        --   reply         0.15
        --   genre         0.10
        (
            0.25 * h.f_history
          + 0.15 * tf.f_tier
          + 0.10 * r.f_recency
          + 0.10 * cf.f_cap_fit
          + 0.15 * an.f_anchor
          + 0.15 * rp.f_reply
          + 0.10 * g.f_genre
        )                                                              as raw_score
    from base b
    left join venues v   on v.id = b.venue_id
    join hist h          on h.tour_id = b.tour_id and h.artist_id = b.artist_id
                        and h.contact_id = b.contact_id and h.venue_id is not distinct from b.venue_id
    join tier_f tf       on tf.tour_id = b.tour_id and tf.artist_id = b.artist_id
                        and tf.contact_id = b.contact_id and tf.venue_id is not distinct from b.venue_id
    join recency r       on r.tour_id = b.tour_id and r.artist_id = b.artist_id
                        and r.contact_id = b.contact_id and r.venue_id is not distinct from b.venue_id
    join cap_fit cf      on cf.tour_id = b.tour_id and cf.artist_id = b.artist_id
                        and cf.contact_id = b.contact_id and cf.venue_id is not distinct from b.venue_id
    join anchor an       on an.tour_id = b.tour_id and an.artist_id = b.artist_id
                        and an.contact_id = b.contact_id and an.venue_id is not distinct from b.venue_id
    join reply rp        on rp.tour_id = b.tour_id and rp.artist_id = b.artist_id
                        and rp.contact_id = b.contact_id and rp.venue_id is not distinct from b.venue_id
    join genre g         on g.tour_id = b.tour_id and g.artist_id = b.artist_id
                        and g.contact_id = b.contact_id and g.venue_id is not distinct from b.venue_id
    join conflict cn     on cn.tour_id = b.tour_id and cn.artist_id = b.artist_id
                        and cn.contact_id = b.contact_id and cn.venue_id is not distinct from b.venue_id
)
select
    s.*,
    -- Final score: hard zero for non-festival radius conflicts, kept for
    -- festival-exception candidates, raw otherwise.
    case
        when s.radius_blocked then 0::numeric
        else round(s.raw_score::numeric, 4)
    end                                                         as score,

    -- Factor breakdown — stored on outreach_log.decision_trace so we can
    -- audit why any given target was picked (or skipped).
    jsonb_build_object(
        'weights', jsonb_build_object(
            'history', 0.25, 'tier', 0.15, 'recency', 0.10,
            'cap_fit', 0.10, 'anchor', 0.15, 'reply', 0.15, 'genre', 0.10
        ),
        'factors', jsonb_build_object(
            'history',  s.f_history,
            'tier',     s.f_tier,
            'recency',  s.f_recency,
            'cap_fit',  s.f_cap_fit,
            'anchor',   s.f_anchor,
            'reply',    s.f_reply,
            'genre',    s.f_genre
        ),
        'signals', jsonb_build_object(
            'plays_count',                s.plays_count,
            'last_played_at',             s.last_played_at,
            'last_contact_at',            s.last_contact_at,
            'reply_rate',                 s.reply_rate,
            'sent_count',                 s.sent_count,
            'venue_is_festival',          s.is_festival,
            'has_radius_conflict',        s.has_radius_conflict,
            'radius_exception_candidate', s.radius_exception_candidate,
            'radius_blocked',             s.radius_blocked,
            'conflict_source',            s.conflict_source
        ),
        'raw_score',                      s.raw_score
    )                                                           as factor_breakdown
from scored s;

-- =========================================================================
-- 5. Exception panels — the two "you should look at this" lists.
-- =========================================================================

-- Targets we blocked because of a radius conflict at a non-festival venue.
-- Shown on /outreach/priorities in a "what got cut" panel so Thomas can
-- spot false positives (e.g. two venues in the same city that are actually
-- far apart, or a past show that's expired).
create or replace view v_radius_blocked_targets as
select
    tour_id, tour_name, artist_id, artist_slug, artist_name,
    contact_id, contact_name, email,
    venue_id, venue_name, venue_city, venue_state,
    conflict_source,
    factor_breakdown
from v_target_score
where radius_blocked = true;

-- Festival targets with a radius conflict — flagged as exception
-- candidates so Thomas can ping AB/PRYSM to negotiate a carve-out.
create or replace view v_radius_exception_candidates as
select
    tour_id, tour_name, artist_id, artist_slug, artist_name,
    contact_id, contact_name, email,
    venue_id, venue_name, venue_city, venue_state,
    score,
    conflict_source,
    factor_breakdown
from v_target_score
where radius_exception_candidate = true
order by score desc;

-- =========================================================================
-- Sanity
-- =========================================================================
select 'venues flagged as festival:' as info, count(*) as n
from venues where is_festival = true;

select 'active tour × artist combos:' as info, count(*) as n
from tours t join tour_artists ta on ta.tour_id = t.id
where t.status in ('planning','active');

select 'scored targets by bucket:' as info,
       count(*) filter (where radius_blocked) as blocked,
       count(*) filter (where radius_exception_candidate) as exception,
       count(*) filter (where not has_radius_conflict) as clean,
       count(*) as total
from v_target_score;

select 'score distribution (clean targets only):' as info,
       round(avg(score), 3) as avg_score,
       round(percentile_cont(0.5)  within group (order by score)::numeric, 3) as p50,
       round(percentile_cont(0.9)  within group (order by score)::numeric, 3) as p90,
       round(percentile_cont(0.99) within group (order by score)::numeric, 3) as p99,
       max(score) as max_score
from v_target_score
where not radius_blocked;


-- ═══════════════════════════════════════════════════════════════════════
-- 0012_fix_prysm_email_domain.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0012_fix_prysm_email_domain.sql
--
-- Bug fix for migration 0010.
--
-- 0010 backfilled `source = 'agent_prysm'` by matching contact emails
-- ending in `@prysmagency.com`. That domain is WRONG — Colton's actual
-- email is `colton@prysmtalentagency.com` (verified 2026-04-22 from
-- the TENx10 platform source where the contact data is hard-coded).
--
-- Any offer routed through a PRYSM contact using the correct domain
-- was therefore left as `direct_promoter` after 0010 ran. This
-- migration sweeps those and retags them.
--
-- We also tag the reverse: if any @prysmagency.com contacts were
-- mistakenly created (typo, bad import) they still get the agent_prysm
-- source from 0010 — we leave those alone; the migration is additive.
--
-- Safe to re-run.

-- =========================================================================
-- 1. Re-backfill with the correct domain.
-- =========================================================================
update offers o
set source = 'agent_prysm',
    relayed_by_contact_id = o.contact_id,
    agent_commission_pct = coalesce(o.agent_commission_pct, 10)
from contacts c
where o.contact_id = c.id
  and (o.source is null or o.source = 'direct_promoter')
  and c.email ilike '%@prysmtalentagency.com';

-- =========================================================================
-- 2. Also normalize any @prysmagency.com addresses that were created
--    as a typo. They don't resolve to a real PRYSM domain — flag them
--    so Thomas can clean up. We don't auto-rewrite the email because
--    that might be someone's actual inbox. Just mark the contact with
--    a note so it surfaces in the contacts UI.
-- =========================================================================
update contacts
set notes = trim(both E'\n' from coalesce(notes, '') ||
    E'\n[0012] email domain is @prysmagency.com — did you mean @prysmtalentagency.com?')
where email ilike '%@prysmagency.com'
  and (notes is null or notes not like '%[0012]%');

-- =========================================================================
-- Sanity
-- =========================================================================
select 'info: offers now tagged agent_prysm' as info, count(*) as n
from offers where source = 'agent_prysm';

select 'info: offers retagged from direct_promoter to agent_prysm in this run' as info,
       count(*) as n
from offers o
join contacts c on c.id = o.contact_id
where o.source = 'agent_prysm'
  and c.email ilike '%@prysmtalentagency.com';

select 'info: contacts with flagged typo-domain @prysmagency.com' as info, count(*) as n
from contacts
where email ilike '%@prysmagency.com';


-- ═══════════════════════════════════════════════════════════════════════
-- 0013_venues_geo_radius.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0013_venues_geo_radius.sql
--
-- Replace the same-city radius approximation in v_target_score with a real
-- distance check. Migration 0011 flagged this as a v1 limitation (task #63
-- in TASKS.md): "within 75 miles" was proxied as "same city" because we had
-- no coords on venues, which silently missed cross-city metro conflicts
-- (Boulder vs Denver, Oakland vs SF, Brooklyn vs Manhattan, etc).
--
-- What this does:
--   1. Adds latitude / longitude columns to venues (nullable; backfilled
--      later via task #62/#63 followup using Google Places or similar).
--   2. Adds a plain-SQL haversine helper, fn_miles_between(lat1,lng1,lat2,lng2),
--      so we don't need PostGIS on managed Supabase.
--   3. Rebuilds v_locked_shows to surface venue lat/lng alongside city/state.
--   4. Rebuilds v_target_score with a hybrid radius check:
--         - If BOTH the candidate venue and the locked-show venue have
--           coords, use fn_miles_between(...) <= radius_miles (default 75).
--         - Otherwise fall back to the same-city heuristic so we don't
--           regress coverage while the backfill is in progress.
--      This keeps today's behavior for un-coded venues and immediately
--      upgrades coverage for any venue Thomas backfills coords on.
--   5. Exposes a radius_miles_used signal in factor_breakdown (the actual
--      miles if we had coords, null if we fell back to same-city). Makes
--      it auditable on /outreach/priorities which conflicts were
--      distance-checked vs heuristic.
--
-- Design constraints:
--   * No PostGIS. Supabase Cloud supports it but we don't want the extension
--     requirement. Haversine in plain SQL is fine at DBA-scale (low
--     thousands of venues, ranked offline).
--   * fn_miles_between is IMMUTABLE PARALLEL SAFE so Postgres can cache /
--     parallelize inside the view.
--   * Idempotent: all "add column if not exists", "create or replace",
--     drop-and-recreate on the function signature.
--   * Safe to re-run.

-- =========================================================================
-- 1. Schema: lat/lng on venues
-- =========================================================================
alter table venues
    add column if not exists latitude  numeric(9,6),
    add column if not exists longitude numeric(9,6);

comment on column venues.latitude  is 'WGS84 latitude, decimal degrees. Null until backfilled (task #63 followup).';
comment on column venues.longitude is 'WGS84 longitude, decimal degrees. Null until backfilled (task #63 followup).';

-- Partial index: only venues with coords, used by the radius check join.
create index if not exists idx_venues_coords
    on venues (latitude, longitude)
    where latitude is not null and longitude is not null;

-- Sanity check at write time — latitude must be in [-90,90], longitude in
-- [-180,180]. Skip the constraint if it already exists so re-runs are safe.
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'venues_latitude_range_chk'
    ) then
        alter table venues
            add constraint venues_latitude_range_chk
            check (latitude is null or (latitude between -90 and 90));
    end if;
    if not exists (
        select 1 from pg_constraint where conname = 'venues_longitude_range_chk'
    ) then
        alter table venues
            add constraint venues_longitude_range_chk
            check (longitude is null or (longitude between -180 and 180));
    end if;
end $$;

-- =========================================================================
-- 2. Haversine helper
-- Distance in miles between two (lat, lng) points on WGS84.
-- Returns null if any input is null.
-- Earth radius = 3958.8 mi (matches Google Maps default).
-- =========================================================================
create or replace function fn_miles_between(
    lat1 numeric,
    lng1 numeric,
    lat2 numeric,
    lng2 numeric
) returns numeric
language sql
immutable
parallel safe
as $$
    select case
        when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null
        else
            3958.8 * 2 * asin(
                sqrt(
                    power(sin(radians((lat2 - lat1) / 2)), 2)
                  + cos(radians(lat1)) * cos(radians(lat2))
                    * power(sin(radians((lng2 - lng1) / 2)), 2)
                )
            )
    end;
$$;

comment on function fn_miles_between(numeric,numeric,numeric,numeric) is
    'Haversine great-circle distance in miles. Null-safe. Used by v_target_score radius check and any UI/memo that wants "how far from X is Y".';

-- =========================================================================
-- 3. v_locked_shows — add venue_latitude / venue_longitude
-- Downstream radius check needs these alongside venue_city/state so it can
-- prefer distance when coords are present and fall back to city otherwise.
-- =========================================================================
create or replace view v_locked_shows as
select
    cs.artist_id,
    cs.artist_slug,
    cs.venue_id,
    v.city                as venue_city,
    v.state               as venue_state,
    v.latitude            as venue_latitude,
    v.longitude           as venue_longitude,
    cs.show_date,
    'confirmed_show'      as source_type,
    cs.id                 as source_id
from confirmed_shows cs
left join venues v on v.id = cs.venue_id
where cs.status in ('announced', 'on_sale', 'sold_out')
  and cs.artist_id is not null
union all
select
    o.artist_id,
    o.artist_slug,
    o.venue_id,
    v.city                as venue_city,
    v.state               as venue_state,
    v.latitude            as venue_latitude,
    v.longitude           as venue_longitude,
    o.proposed_date       as show_date,
    'offer_locked'        as source_type,
    o.id                  as source_id
from offers o
left join venues v on v.id = o.venue_id
where o.status in ('fully_executed'::offer_status, 'deposit_received'::offer_status)
  and o.artist_id is not null
  and o.proposed_date is not null;

-- =========================================================================
-- 4. v_target_score — rebuild the conflict CTE with hybrid radius logic
--
-- Behavior matrix for radius_conflict:
--   candidate venue has coords  +  locked show has coords  -> distance <= 75mi
--   either side is missing coords                          -> same-city fallback
--
-- The "miles_to_nearest_conflict" signal is populated when distance was
-- used (both sides coded). When we fell back to same-city, the signal is
-- null and factor_breakdown records radius_check_method='same_city'.
--
-- Everything else about v_target_score is unchanged: weights, tiering,
-- festival-exception handling, factor_breakdown shape (with one new
-- signals key).
-- =========================================================================

-- We pull radius_miles from dsr_standard_deal_terms so Thomas can tune it
-- in one place. Materialized as a CTE literal for query-plan stability.
create or replace view v_target_score as
with
radius_cfg as (
    -- one row, current config. Falls back to 75 if the view is unexpectedly
    -- empty.
    select coalesce((select radius_miles from dsr_standard_deal_terms), 75) as radius_miles
),
base as (
    select
        t.id                           as tour_id,
        t.name                         as tour_name,
        t.artist_id                    as tour_primary_artist_id,
        t.window_start,
        t.window_end,
        t.guarantee_target,
        t.guarantee_floor,
        t.routing_anchors,

        ta.artist_id,
        a.slug                         as artist_slug,
        a.display_name                 as artist_name,
        a.genre_tags                   as artist_genre_tags,

        vpt.contact_id,
        vpt.contact_name,
        vpt.email,
        vpt.relationship_tier,
        vpt.contact_roles,
        vpt.vip,

        vpt.venue_id,
        vpt.venue_name,
        vpt.venue_capacity,
        vpt.venue_city,
        vpt.venue_state,

        -- candidate venue coords — null when venue_id is null or coords
        -- haven't been backfilled yet (#63 followup).
        vv.latitude                    as candidate_latitude,
        vv.longitude                   as candidate_longitude
    from tours t
    join tour_artists ta on ta.tour_id = t.id
    join artists a       on a.id = ta.artist_id
    join v_pitchable_targets vpt on true
    left join venues vv  on vv.id = vpt.venue_id
    where t.status in ('planning', 'active')
),
-- ---- factor: historical booking rate at this venue
hist as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        coalesce(sum(rp.plays_count), 0)                    as plays_count,
        max(rp.last_played_at)                              as last_played_at,
        case
            when sum(rp.plays_count) is null then 0.0
            when sum(rp.plays_count) >= 3    then 1.0
            when sum(rp.plays_count) = 2     then 0.7
            when sum(rp.plays_count) = 1     then 0.5
            else 0.0
        end                                                 as f_history
    from base b
    left join v_recent_plays_by_venue rp
           on rp.venue_id = b.venue_id
    group by b.tour_id, b.artist_id, b.contact_id, b.venue_id
),
tier_f as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        case b.relationship_tier
            when 'insider' then 1.0
            when 'warm'    then 0.6
            when 'cold'    then 0.2
        end                                                 as f_tier
    from base b
),
recency as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        c.last_contact_at,
        case
            when c.last_contact_at is null                                                then 0.7
            when current_date - c.last_contact_at::date < 30                              then 0.2
            when current_date - c.last_contact_at::date between 30 and 180                then 1.0
            when current_date - c.last_contact_at::date between 181 and 365               then 0.7
            else 0.5
        end                                                 as f_recency
    from base b
    join contacts c on c.id = b.contact_id
),
cap_fit as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        case
            when b.venue_capacity is null or b.guarantee_target is null then 0.5
            when b.guarantee_target = 0                                 then 0.5
            else least(1.0, (b.venue_capacity::numeric * 20.0) / b.guarantee_target)
        end                                                 as f_cap_fit
    from base b
),
anchor as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        case
            when exists (
                select 1
                from jsonb_array_elements(coalesce(b.routing_anchors, '[]'::jsonb)) ra
                where lower(ra->>'city') = lower(b.venue_city)
            )                                                   then 1.0
            when exists (
                select 1
                from jsonb_array_elements(coalesce(b.routing_anchors, '[]'::jsonb)) ra
                where split_part(ra->>'city', ',', 2) ilike '%' || b.venue_state || '%'
                   or ra->>'city' ilike '%' || b.venue_state || '%'
            )                                                   then 0.5
            else 0.2
        end                                                 as f_anchor
    from base b
),
reply as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        rr.reply_rate,
        rr.sent_count,
        case
            when rr.reply_rate is null                      then 0.5
            when rr.sent_count < 3 and rr.reply_rate > 0    then 0.7
            when rr.reply_rate >= 0.5                       then 1.0
            when rr.reply_rate >= 0.2                       then 0.8
            when rr.reply_rate > 0                          then 0.5
            when rr.sent_count >= 3                         then 0.2
            else 0.4
        end                                                 as f_reply
    from base b
    left join v_reply_rate_by_contact rr on rr.contact_id = b.contact_id
),
genre as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        case
            when b.artist_genre_tags is null or cardinality(b.artist_genre_tags) = 0 then 0.5
            when coalesce(v.genre_fit, '{}') = '{}'                                    then 0.5
            else least(1.0,
                cardinality(
                    array(
                        select unnest(b.artist_genre_tags)
                        intersect
                        select unnest(v.genre_fit)
                    )
                )::numeric / cardinality(b.artist_genre_tags)
            )
        end                                                 as f_genre
    from base b
    left join venues v on v.id = b.venue_id
),
-- ---- radius conflict detection — hybrid: distance when both sides have
--       coords, same-city fallback when either side is missing.
--       Returns method label ('haversine' vs 'same_city') and nearest-
--       conflict miles when haversine was used.
--
--       To keep the logic readable and avoid duplicating the date-window
--       predicate, we first build a per-(base row, locked show) join as a
--       LATERAL subquery, tag each pair with the method it triggers under
--       (haversine / same_city / null), then aggregate.
conflict as (
    select
        b.tour_id, b.artist_id, b.contact_id, b.venue_id,
        -- first-matching source id:source_type, preferring haversine hits
        -- (distance-based) over same-city heuristic hits.
        (
            select ls.source_type || ':' || ls.source_id
            from v_locked_shows ls
            cross join radius_cfg rc
            where ls.artist_id = b.artist_id
              and ls.show_date between (b.window_start - interval '30 days')::date
                                   and (b.window_end   + interval '30 days')::date
              and (
                    (
                        b.candidate_latitude  is not null and b.candidate_longitude  is not null
                    and ls.venue_latitude     is not null and ls.venue_longitude     is not null
                    and fn_miles_between(
                            b.candidate_latitude, b.candidate_longitude,
                            ls.venue_latitude,    ls.venue_longitude
                        ) <= rc.radius_miles
                    )
                 or (
                        (b.candidate_latitude is null or b.candidate_longitude is null
                         or ls.venue_latitude is null or ls.venue_longitude is null)
                    and ls.venue_city is not null
                    and b.venue_city is not null
                    and lower(ls.venue_city) = lower(b.venue_city)
                    )
              )
            -- prefer distance-flagged hits (both sides coded) first, then
            -- most recent show date. Puts the highest-confidence conflict
            -- as the reported conflict_source.
            order by
                (b.candidate_latitude is not null
                 and b.candidate_longitude is not null
                 and ls.venue_latitude is not null
                 and ls.venue_longitude is not null) desc,
                ls.show_date desc
            limit 1
        )                                                   as conflict_source,

        -- miles to the nearest in-window locked show that has coords on
        -- both sides. Null when either side is uncoded or no conflict.
        (
            select min(
                fn_miles_between(
                    b.candidate_latitude, b.candidate_longitude,
                    ls.venue_latitude,    ls.venue_longitude
                )
            )
            from v_locked_shows ls
            where ls.artist_id = b.artist_id
              and ls.show_date between (b.window_start - interval '30 days')::date
                                   and (b.window_end   + interval '30 days')::date
              and b.candidate_latitude  is not null and b.candidate_longitude  is not null
              and ls.venue_latitude     is not null and ls.venue_longitude     is not null
        )                                                   as miles_to_nearest,

        -- which method flagged the conflict (audit trail). Null when no
        -- conflict. Haversine wins if both paths could flag the same row.
        (
            select case
                when exists (
                    select 1
                    from v_locked_shows ls
                    cross join radius_cfg rc
                    where ls.artist_id = b.artist_id
                      and ls.show_date between (b.window_start - interval '30 days')::date
                                           and (b.window_end   + interval '30 days')::date
                      and b.candidate_latitude  is not null and b.candidate_longitude  is not null
                      and ls.venue_latitude     is not null and ls.venue_longitude     is not null
                      and fn_miles_between(
                              b.candidate_latitude, b.candidate_longitude,
                              ls.venue_latitude,    ls.venue_longitude
                          ) <= rc.radius_miles
                ) then 'haversine'
                when exists (
                    select 1
                    from v_locked_shows ls
                    where ls.artist_id = b.artist_id
                      and ls.show_date between (b.window_start - interval '30 days')::date
                                           and (b.window_end   + interval '30 days')::date
                      and ls.venue_city is not null
                      and b.venue_city is not null
                      and lower(ls.venue_city) = lower(b.venue_city)
                      and (b.candidate_latitude is null or b.candidate_longitude is null
                           or ls.venue_latitude is null or ls.venue_longitude is null)
                ) then 'same_city'
                else null
            end
        )                                                   as radius_check_method,

        -- boolean: conflict under EITHER method
        exists (
            select 1
            from v_locked_shows ls
            cross join radius_cfg rc
            where ls.artist_id = b.artist_id
              and ls.show_date between (b.window_start - interval '30 days')::date
                                   and (b.window_end   + interval '30 days')::date
              and (
                    (
                        b.candidate_latitude  is not null and b.candidate_longitude  is not null
                    and ls.venue_latitude     is not null and ls.venue_longitude     is not null
                    and fn_miles_between(
                            b.candidate_latitude, b.candidate_longitude,
                            ls.venue_latitude,    ls.venue_longitude
                        ) <= rc.radius_miles
                    )
                 or (
                        (b.candidate_latitude is null or b.candidate_longitude is null
                         or ls.venue_latitude is null or ls.venue_longitude is null)
                    and ls.venue_city is not null
                    and b.venue_city is not null
                    and lower(ls.venue_city) = lower(b.venue_city)
                    )
              )
        )                                                   as has_radius_conflict
    from base b
),
scored as (
    select
        b.tour_id, b.tour_name,
        b.window_start, b.window_end,
        b.guarantee_target, b.guarantee_floor,
        b.artist_id, b.artist_slug, b.artist_name,
        b.contact_id, b.contact_name, b.email,
        b.relationship_tier, b.contact_roles, b.vip,
        b.venue_id, b.venue_name, b.venue_capacity,
        b.venue_city, b.venue_state,

        v.is_festival,
        v.latitude  as venue_latitude,
        v.longitude as venue_longitude,

        h.f_history, h.plays_count, h.last_played_at,
        tf.f_tier,
        r.f_recency, r.last_contact_at,
        cf.f_cap_fit,
        an.f_anchor,
        rp.f_reply, rp.reply_rate, rp.sent_count,
        g.f_genre,

        cn.has_radius_conflict,
        cn.conflict_source,
        cn.miles_to_nearest,
        cn.radius_check_method,
        (cn.has_radius_conflict and coalesce(v.is_festival, false))   as radius_exception_candidate,
        (cn.has_radius_conflict and not coalesce(v.is_festival, false)) as radius_blocked,

        (
            0.25 * h.f_history
          + 0.15 * tf.f_tier
          + 0.10 * r.f_recency
          + 0.10 * cf.f_cap_fit
          + 0.15 * an.f_anchor
          + 0.15 * rp.f_reply
          + 0.10 * g.f_genre
        )                                                              as raw_score
    from base b
    left join venues v   on v.id = b.venue_id
    join hist h          on h.tour_id = b.tour_id and h.artist_id = b.artist_id
                        and h.contact_id = b.contact_id and h.venue_id is not distinct from b.venue_id
    join tier_f tf       on tf.tour_id = b.tour_id and tf.artist_id = b.artist_id
                        and tf.contact_id = b.contact_id and tf.venue_id is not distinct from b.venue_id
    join recency r       on r.tour_id = b.tour_id and r.artist_id = b.artist_id
                        and r.contact_id = b.contact_id and r.venue_id is not distinct from b.venue_id
    join cap_fit cf      on cf.tour_id = b.tour_id and cf.artist_id = b.artist_id
                        and cf.contact_id = b.contact_id and cf.venue_id is not distinct from b.venue_id
    join anchor an       on an.tour_id = b.tour_id and an.artist_id = b.artist_id
                        and an.contact_id = b.contact_id and an.venue_id is not distinct from b.venue_id
    join reply rp        on rp.tour_id = b.tour_id and rp.artist_id = b.artist_id
                        and rp.contact_id = b.contact_id and rp.venue_id is not distinct from b.venue_id
    join genre g         on g.tour_id = b.tour_id and g.artist_id = b.artist_id
                        and g.contact_id = b.contact_id and g.venue_id is not distinct from b.venue_id
    join conflict cn     on cn.tour_id = b.tour_id and cn.artist_id = b.artist_id
                        and cn.contact_id = b.contact_id and cn.venue_id is not distinct from b.venue_id
)
select
    s.*,
    case
        when s.radius_blocked then 0::numeric
        else round(s.raw_score::numeric, 4)
    end                                                         as score,

    jsonb_build_object(
        'weights', jsonb_build_object(
            'history', 0.25, 'tier', 0.15, 'recency', 0.10,
            'cap_fit', 0.10, 'anchor', 0.15, 'reply', 0.15, 'genre', 0.10
        ),
        'factors', jsonb_build_object(
            'history',  s.f_history,
            'tier',     s.f_tier,
            'recency',  s.f_recency,
            'cap_fit',  s.f_cap_fit,
            'anchor',   s.f_anchor,
            'reply',    s.f_reply,
            'genre',    s.f_genre
        ),
        'signals', jsonb_build_object(
            'plays_count',                s.plays_count,
            'last_played_at',             s.last_played_at,
            'last_contact_at',            s.last_contact_at,
            'reply_rate',                 s.reply_rate,
            'sent_count',                 s.sent_count,
            'venue_is_festival',          s.is_festival,
            'venue_has_coords',           (s.venue_latitude is not null and s.venue_longitude is not null),
            'has_radius_conflict',        s.has_radius_conflict,
            'radius_exception_candidate', s.radius_exception_candidate,
            'radius_blocked',             s.radius_blocked,
            'radius_check_method',        s.radius_check_method,
            'miles_to_nearest_conflict',  s.miles_to_nearest,
            'conflict_source',            s.conflict_source
        ),
        'raw_score',                      s.raw_score
    )                                                           as factor_breakdown
from scored s;

-- =========================================================================
-- 5. Downstream panel views — refresh so the new columns propagate
-- =========================================================================
create or replace view v_radius_blocked_targets as
select
    tour_id, tour_name, artist_id, artist_slug, artist_name,
    contact_id, contact_name, email,
    venue_id, venue_name, venue_city, venue_state,
    conflict_source,
    radius_check_method,
    miles_to_nearest,
    factor_breakdown
from v_target_score
where radius_blocked = true;

create or replace view v_radius_exception_candidates as
select
    tour_id, tour_name, artist_id, artist_slug, artist_name,
    contact_id, contact_name, email,
    venue_id, venue_name, venue_city, venue_state,
    score,
    conflict_source,
    radius_check_method,
    miles_to_nearest,
    factor_breakdown
from v_target_score
where radius_exception_candidate = true
order by score desc;

-- =========================================================================
-- Sanity
-- =========================================================================
select 'venues with coords:' as info,
       count(*) filter (where latitude is not null and longitude is not null) as coded,
       count(*) filter (where latitude is null or longitude is null) as uncoded,
       count(*) as total
from venues
where deleted_at is null;

select 'radius check methods in play:' as info,
       count(*) filter (where radius_check_method = 'haversine') as via_distance,
       count(*) filter (where radius_check_method = 'same_city') as via_same_city,
       count(*) filter (where radius_check_method is null and not has_radius_conflict) as no_conflict,
       count(*) as total
from v_target_score;

select 'haversine smoke test (should be ~= 1520 mi, LA -> NYC):' as info,
       round(
           fn_miles_between(34.0522, -118.2437, 40.7128, -74.0060)::numeric,
           1
       ) as miles;

select 'haversine smoke test (Boulder -> Denver, should be ~= 25 mi):' as info,
       round(
           fn_miles_between(40.0150, -105.2705, 39.7392, -104.9903)::numeric,
           1
       ) as miles;


-- ═══════════════════════════════════════════════════════════════════════
-- 0014_agent_workload.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0014_agent_workload.sql
--
-- Agent workload visibility (task #33). Before we fire outbound to a contact
-- we want to know whether AB or PRYSM is already actively pitching the same
-- venue / contact / artist so we don't step on their toes. This view unions
-- offers in "in-flight" lifecycle states grouped by the relaying agent.
--
-- In-flight = any offer_status that isn't a terminal state:
--   inbound / evaluating / countered / memo_sent / signed_by_thomas /
--   fully_executed (still awaiting promoter sig)
-- NOT in-flight = declined / withdrawn / expired / deposit_received
--   (deposit_received is "locked" — no one else is pitching it anymore)
--
-- Grouping keys:
--   - agent identity (source + relayed_by_contact_id when present)
--   - artist_id + artist_slug  (agent might work multiple artists)
--   - venue_id (null-safe — contact-level holds land in their own rows)
--   - underlying promoter contact (to spot "AB and PRYSM both pitching
--     the same promoter with the same artist")
--
-- Three exposed views:
--   v_agent_workload          — one row per in-flight offer with agent tag
--   v_agent_workload_summary  — rolled up per (agent × artist), counts + $
--   v_agent_overlap           — pairs of agents working the same
--                                (artist, promoter) — the "don't double-pitch"
--                                canary. If this view has rows, look at them.
--
-- Safe to re-run.

-- =========================================================================
-- 1. v_agent_workload — one row per in-flight offer tagged with its agent
-- =========================================================================
create or replace view v_agent_workload as
select
    o.id                                                as offer_id,
    o.artist_id,
    o.artist_slug,
    o.status,
    o.proposed_date,
    o.guarantee,
    o.net_to_artist,
    o.venue_id,
    v.name                                              as venue_name,
    v.city                                              as venue_city,
    v.state                                             as venue_state,

    o.source,
    case o.source
        when 'agent_ab'         then 'AB'
        when 'agent_prysm'      then 'PRYSM'
        when 'agent_other'      then 'Other agent'
        when 'direct_promoter'  then 'Direct'
        when 'manual'           then 'Manual'
        when 'gigwell_import'   then 'Gigwell'
        else 'Unknown'
    end                                                 as source_label,

    o.relayed_by_contact_id,
    relayer.full_name                                   as relayer_name,
    relayer.email                                       as relayer_email,

    o.promoter_contact_id,
    promoter.full_name                                  as promoter_name,
    promoter.email                                      as promoter_email,

    o.contact_id                                        as primary_contact_id,
    pc.full_name                                        as primary_contact_name,
    pc.email                                            as primary_contact_email,

    o.created_at,
    o.updated_at,

    -- days since the offer last moved. High values = probably stalled;
    -- Thomas can read "AB has been sitting on this 40 days" as a ping
    -- prompt.
    (current_date - o.updated_at::date)                 as days_since_update
from offers o
left join contacts relayer  on relayer.id  = o.relayed_by_contact_id
left join contacts promoter on promoter.id = o.promoter_contact_id
left join contacts pc       on pc.id       = o.contact_id
left join venues   v        on v.id        = o.venue_id
where o.status in (
    'inbound'::offer_status,
    'evaluating'::offer_status,
    'countered'::offer_status,
    'memo_sent'::offer_status,
    'signed_by_thomas'::offer_status,
    'fully_executed'::offer_status
);

comment on view v_agent_workload is
    'One row per in-flight offer, tagged with which agent relayed it. Terminal states (declined/withdrawn/expired/deposit_received) are excluded — those are no longer workload.';

-- =========================================================================
-- 2. v_agent_workload_summary — roll-up per agent × artist
-- Used by a future /agents/workload page. Gives Thomas a single number to
-- look at ("AB is actively pitching 14 shows for DirtySnatcha at $127k in
-- aggregate").
-- =========================================================================
create or replace view v_agent_workload_summary as
select
    coalesce(w.source::text, 'unknown')                 as source,
    w.source_label,
    w.relayed_by_contact_id,
    w.relayer_name,
    w.relayer_email,

    w.artist_id,
    w.artist_slug,

    count(*)                                            as in_flight_count,
    count(*) filter (
        where w.status in ('inbound'::offer_status, 'evaluating'::offer_status)
    )                                                   as awaiting_decision,
    count(*) filter (
        where w.status = 'countered'::offer_status
    )                                                   as awaiting_counter_reply,
    count(*) filter (
        where w.status in (
            'memo_sent'::offer_status,
            'signed_by_thomas'::offer_status,
            'fully_executed'::offer_status
        )
    )                                                   as awaiting_signature_or_deposit,

    sum(w.guarantee)                                    as total_guarantee,
    sum(w.net_to_artist)                                as total_net_to_artist,

    min(w.days_since_update)                            as most_recent_movement_days,
    max(w.days_since_update)                            as stalest_offer_days,
    count(*) filter (where w.days_since_update > 21)    as stalled_over_21d,

    min(w.proposed_date)                                as earliest_proposed_date,
    max(w.proposed_date)                                as latest_proposed_date
from v_agent_workload w
group by
    w.source,
    w.source_label,
    w.relayed_by_contact_id,
    w.relayer_name,
    w.relayer_email,
    w.artist_id,
    w.artist_slug;

comment on view v_agent_workload_summary is
    'Roll-up of in-flight offers per (agent × artist). Powers a "what is AB/PRYSM currently working on" dashboard panel.';

-- =========================================================================
-- 3. v_agent_overlap — pairs of agents simultaneously working the same
--    (artist, underlying promoter). This is the canary for "AB and PRYSM
--    both pitching the same promoter with DirtySnatcha" — the thing we're
--    trying to catch BEFORE outbound goes out.
-- =========================================================================
create or replace view v_agent_overlap as
with in_flight_tagged as (
    select
        w.offer_id,
        w.artist_id,
        w.artist_slug,
        w.promoter_contact_id,
        w.promoter_name,
        w.promoter_email,
        w.source,
        w.source_label,
        w.relayed_by_contact_id,
        w.relayer_name,
        w.status,
        w.proposed_date,
        w.venue_name,
        w.venue_city,
        w.venue_state
    from v_agent_workload w
    where w.promoter_contact_id is not null
      and w.source in ('agent_ab'::offer_source, 'agent_prysm'::offer_source, 'agent_other'::offer_source)
)
select
    a.artist_id,
    a.artist_slug,
    a.promoter_contact_id,
    a.promoter_name,
    a.promoter_email,

    a.source                                            as source_a,
    a.source_label                                      as source_a_label,
    a.relayer_name                                      as relayer_a_name,
    a.offer_id                                          as offer_id_a,
    a.status                                            as status_a,
    a.proposed_date                                     as proposed_date_a,
    a.venue_name                                        as venue_a,

    b.source                                            as source_b,
    b.source_label                                      as source_b_label,
    b.relayer_name                                      as relayer_b_name,
    b.offer_id                                          as offer_id_b,
    b.status                                            as status_b,
    b.proposed_date                                     as proposed_date_b,
    b.venue_name                                        as venue_b
from in_flight_tagged a
join in_flight_tagged b
       on a.artist_id = b.artist_id
      and a.promoter_contact_id = b.promoter_contact_id
      and a.offer_id < b.offer_id   -- dedupe (a,b) vs (b,a)
      and a.source <> b.source;     -- only cross-agent; same agent double-
                                    -- pitching is not an overlap, that's
                                    -- just that agent's inventory.

comment on view v_agent_overlap is
    'Canary view: pairs of offers in flight with different relaying agents but the same (artist, underlying promoter). If non-empty, Thomas needs to decide which agent continues the conversation before we fire outbound on either side.';

-- =========================================================================
-- Convenience: "who is working this promoter right now" lookup
-- Used by outbound seeder pre-check (task #33 followup — seeder should
-- skip or ask before pitching a contact if an agent is already on it).
-- =========================================================================
create or replace function fn_agents_working_promoter(
    p_artist_id   uuid,
    p_contact_id  uuid
) returns table (
    source           offer_source,
    source_label     text,
    relayer_name     text,
    in_flight_count  bigint
)
language sql
stable
as $$
    select
        w.source,
        w.source_label,
        w.relayer_name,
        count(*) as in_flight_count
    from v_agent_workload w
    where w.artist_id = p_artist_id
      and (
            w.promoter_contact_id  = p_contact_id
         or w.primary_contact_id   = p_contact_id
         or w.relayed_by_contact_id = p_contact_id
      )
    group by w.source, w.source_label, w.relayer_name
    order by in_flight_count desc;
$$;

comment on function fn_agents_working_promoter(uuid, uuid) is
    'Pre-outbound guard — returns the agents (and counts) currently pitching this (artist, contact). Empty result = clear to send.';

-- =========================================================================
-- Sanity
-- =========================================================================
select 'in-flight offers by source:' as info,
       source_label,
       count(*) as n,
       sum(guarantee)::numeric as total_guarantee
from v_agent_workload
group by source_label
order by n desc;

select 'agents with in-flight workload:' as info,
       source_label,
       artist_slug,
       in_flight_count,
       awaiting_decision,
       awaiting_counter_reply,
       awaiting_signature_or_deposit,
       total_guarantee
from v_agent_workload_summary
where source in ('agent_ab','agent_prysm','agent_other')
order by in_flight_count desc;

select 'cross-agent overlap (SHOULD BE ZERO rows in normal operation):' as info,
       count(*) as overlap_pairs
from v_agent_overlap;


-- ═══════════════════════════════════════════════════════════════════════
-- 0015_offer_radius_audit.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0015_offer_radius_audit.sql
--
-- Task #30 — radius-clause audit for *inbound* offers.
--
-- v_target_score already enforces the radius check on the OUTBOUND side
-- (scoring new targets to pitch). What we didn't have was the mirror for
-- the INBOUND side: when a new offer lands (status in inbound/evaluating/
-- countered/memo_sent), does it fall inside the 75mi / 30d window of any
-- locked show for the same artist? Thomas wants this flagged before he
-- signs anything — if AB or PRYSM relayed an offer that would breach a
-- radius clause we already granted another promoter, we need to know
-- before the counter goes out.
--
-- Exposed objects:
--
--   v_offer_radius_conflicts        one row per (in-flight offer × conflicting
--                                    locked show) pair, with miles + day_gap
--                                    + severity
--
--   v_offer_radius_audit            one row per in-flight offer with the
--                                    highest-severity conflict rolled up
--                                    (severity = hard_block | soft_warning |
--                                    festival_exception | clear)
--
--   fn_offer_radius_check(uuid)     callable from server actions — "is this
--                                    offer safe to sign?" Returns severity +
--                                    top-3 conflicts as jsonb.
--
-- Severity semantics (mirrors v_target_score's festival-exception tiering):
--
--   hard_block           same artist · non-festival locked show · within
--                        radius_miles (or same-city when coords missing) ·
--                        within radius_days. Do not sign.
--   soft_warning         same artist · locked show within radius_days but
--                        the distance check had to use same-city fallback
--                        (either side un-coded). Recommend a coord backfill
--                        before sign.
--   festival_exception   same artist · festival-flagged locked show within
--                        radius_miles + radius_days. Festivals can often
--                        coexist (different contract exclusivity). Surface
--                        it so Thomas can decide.
--   clear                no conflicts.
--
-- In-flight = offers.status NOT IN (declined, withdrawn, expired,
-- deposit_received). We include fully_executed here even though it's also
-- in v_locked_shows — an offer breaching its own radius window against
-- *another* locked show still matters until deposit clears.
--
-- Safe to re-run.

-- =========================================================================
-- 1. v_offer_radius_conflicts — one row per conflicting (offer, locked show)
-- =========================================================================
create or replace view v_offer_radius_conflicts as
with
radius_cfg as (
    select
        coalesce((select radius_miles from dsr_standard_deal_terms), 75)  as radius_miles,
        coalesce((select radius_days  from dsr_standard_deal_terms), 30)  as radius_days
),
in_flight as (
    -- candidate offers — the things we're auditing
    select
        o.id                 as offer_id,
        o.artist_id,
        o.artist_slug,
        o.status,
        o.proposed_date,
        o.venue_id,
        o.guarantee,
        o.net_to_artist,
        v.name               as venue_name,
        v.city               as venue_city,
        v.state              as venue_state,
        v.latitude           as candidate_latitude,
        v.longitude          as candidate_longitude,
        coalesce(v.is_festival, false) as candidate_is_festival
    from offers o
    left join venues v on v.id = o.venue_id
    where o.status in (
        'inbound'::offer_status,
        'evaluating'::offer_status,
        'countered'::offer_status,
        'memo_sent'::offer_status,
        'signed_by_thomas'::offer_status,
        'fully_executed'::offer_status
    )
      and o.artist_id is not null
      and o.proposed_date is not null
),
locked_with_fest as (
    -- same shape as v_locked_shows but carries is_festival so we can tier
    select
        ls.artist_id,
        ls.artist_slug,
        ls.venue_id,
        ls.venue_city,
        ls.venue_state,
        ls.venue_latitude,
        ls.venue_longitude,
        ls.show_date,
        ls.source_type,
        ls.source_id,
        coalesce(v.is_festival, false) as locked_is_festival
    from v_locked_shows ls
    left join venues v on v.id = ls.venue_id
)
select
    i.offer_id,
    i.artist_id,
    i.artist_slug,
    i.status                                                as offer_status,
    i.proposed_date,
    i.venue_id                                              as offer_venue_id,
    i.venue_name                                            as offer_venue_name,
    i.venue_city                                            as offer_venue_city,
    i.venue_state                                           as offer_venue_state,
    i.guarantee                                             as offer_guarantee,
    i.net_to_artist                                         as offer_net_to_artist,
    i.candidate_is_festival                                 as offer_is_festival,

    l.venue_id                                              as locked_venue_id,
    l.venue_city                                            as locked_venue_city,
    l.venue_state                                           as locked_venue_state,
    l.show_date                                             as locked_show_date,
    l.source_type                                           as locked_source_type,
    l.source_id                                             as locked_source_id,
    l.locked_is_festival,

    -- distance: real haversine when both sides coded, null otherwise
    case
        when i.candidate_latitude is not null
         and i.candidate_longitude is not null
         and l.venue_latitude is not null
         and l.venue_longitude is not null
        then fn_miles_between(
            i.candidate_latitude, i.candidate_longitude,
            l.venue_latitude,     l.venue_longitude
        )
        else null
    end                                                     as miles_between,

    abs((i.proposed_date - l.show_date))                    as day_gap,

    case
        when i.candidate_latitude is not null
         and i.candidate_longitude is not null
         and l.venue_latitude is not null
         and l.venue_longitude is not null
        then 'haversine'
        else 'same_city'
    end                                                     as check_method,

    -- severity classifier: the tierring that drives the UI badge
    case
        -- festival on either side: exception candidate, not hard block
        when i.candidate_is_festival or l.locked_is_festival then 'festival_exception'
        -- both sides coded & haversine says inside radius: hard block
        when i.candidate_latitude is not null
         and i.candidate_longitude is not null
         and l.venue_latitude is not null
         and l.venue_longitude is not null
         and fn_miles_between(
             i.candidate_latitude, i.candidate_longitude,
             l.venue_latitude,     l.venue_longitude
         ) <= (select radius_miles from radius_cfg)
        then 'hard_block'
        -- same-city fallback fired: soft warning (recommend coord backfill
        -- + Thomas eyeballs the actual miles)
        when (i.candidate_latitude is null
           or i.candidate_longitude is null
           or l.venue_latitude is null
           or l.venue_longitude is null)
         and i.venue_city is not null
         and l.venue_city is not null
         and lower(i.venue_city) = lower(l.venue_city)
         and coalesce(lower(i.venue_state), '') = coalesce(lower(l.venue_state), '')
        then 'soft_warning'
        else null  -- filtered out below
    end                                                     as severity,

    (select radius_miles from radius_cfg)                   as radius_miles_cfg,
    (select radius_days  from radius_cfg)                   as radius_days_cfg
from in_flight i
join locked_with_fest l
    on l.artist_id = i.artist_id
   and l.source_id <> i.offer_id  -- don't self-match: offer shouldn't audit against itself
where
    abs((i.proposed_date - l.show_date)) <= (select radius_days from radius_cfg)
    and (
        -- inside radius via haversine …
        (
            i.candidate_latitude is not null
            and i.candidate_longitude is not null
            and l.venue_latitude is not null
            and l.venue_longitude is not null
            and fn_miles_between(
                i.candidate_latitude, i.candidate_longitude,
                l.venue_latitude,     l.venue_longitude
            ) <= (select radius_miles from radius_cfg)
        )
        or
        -- … or same-city fallback when either side un-coded
        (
            (i.candidate_latitude is null
             or i.candidate_longitude is null
             or l.venue_latitude is null
             or l.venue_longitude is null)
            and i.venue_city is not null
            and l.venue_city is not null
            and lower(i.venue_city) = lower(l.venue_city)
            and coalesce(lower(i.venue_state), '') = coalesce(lower(l.venue_state), '')
        )
    );

comment on view v_offer_radius_conflicts is
    'One row per (in-flight offer × conflicting locked show) pair. Joins on same artist_id, filters to within radius_days, then classifies severity (hard_block/soft_warning/festival_exception). Excludes self-matches on source_id.';

-- =========================================================================
-- 2. v_offer_radius_audit — roll up highest-severity conflict per offer
-- =========================================================================
-- Severity ranking: hard_block (3) > soft_warning (2) > festival_exception (1)
create or replace view v_offer_radius_audit as
with
ranked as (
    select
        c.*,
        case c.severity
            when 'hard_block'          then 3
            when 'soft_warning'        then 2
            when 'festival_exception'  then 1
            else 0
        end as severity_rank
    from v_offer_radius_conflicts c
),
per_offer as (
    select
        offer_id,
        artist_id,
        artist_slug,
        offer_status,
        proposed_date,
        offer_venue_id,
        offer_venue_name,
        offer_venue_city,
        offer_venue_state,
        offer_guarantee,
        offer_net_to_artist,

        max(severity_rank) as max_rank,
        count(*)           as conflict_count,
        count(*) filter (where severity = 'hard_block')         as hard_block_count,
        count(*) filter (where severity = 'soft_warning')       as soft_warning_count,
        count(*) filter (where severity = 'festival_exception') as festival_exception_count,
        min(miles_between) filter (where miles_between is not null) as nearest_miles,
        min(day_gap)                                            as smallest_day_gap
    from ranked
    group by
        offer_id,
        artist_id,
        artist_slug,
        offer_status,
        proposed_date,
        offer_venue_id,
        offer_venue_name,
        offer_venue_city,
        offer_venue_state,
        offer_guarantee,
        offer_net_to_artist
)
select
    p.*,
    case p.max_rank
        when 3 then 'hard_block'
        when 2 then 'soft_warning'
        when 1 then 'festival_exception'
        else        'clear'  -- unreachable given the join, but defensive
    end as severity
from per_offer p;

comment on view v_offer_radius_audit is
    'One row per in-flight offer that has at least one radius conflict, with severity rolled up to the worst case. Offers with zero conflicts are absent — use left join from offers if you need a full list.';

-- =========================================================================
-- 3. fn_offer_radius_check(offer_id) — call from server actions
-- =========================================================================
-- Returns a jsonb blob the UI / server action can consume directly.
-- Example return:
--   {
--     "severity": "hard_block",
--     "conflict_count": 2,
--     "hard_block_count": 1,
--     "soft_warning_count": 1,
--     "festival_exception_count": 0,
--     "nearest_miles": 42.6,
--     "smallest_day_gap": 14,
--     "top_conflicts": [
--       { "locked_show_date": "...", "locked_venue_city": "...",
--         "miles_between": 42.6, "day_gap": 14, "severity": "hard_block",
--         "source_type": "confirmed_show", "source_id": "..." },
--       ...
--     ]
--   }
-- Returns '{"severity":"clear"}' for offers with no conflicts. Callers
-- should treat 'clear' as green light and everything else as requires-
-- Thomas-review.
create or replace function fn_offer_radius_check(p_offer_id uuid)
returns jsonb
language sql
stable
as $$
    with agg as (
        select
            a.severity,
            a.conflict_count,
            a.hard_block_count,
            a.soft_warning_count,
            a.festival_exception_count,
            a.nearest_miles,
            a.smallest_day_gap
        from v_offer_radius_audit a
        where a.offer_id = p_offer_id
    ),
    top as (
        select jsonb_agg(c order by
                           case c.severity
                               when 'hard_block' then 3
                               when 'soft_warning' then 2
                               when 'festival_exception' then 1
                               else 0
                           end desc,
                           c.day_gap asc,
                           c.miles_between asc nulls last
                       ) as conflicts
        from (
            select
                jsonb_build_object(
                    'locked_show_date',    cv.locked_show_date,
                    'locked_venue_city',   cv.locked_venue_city,
                    'locked_venue_state',  cv.locked_venue_state,
                    'locked_is_festival',  cv.locked_is_festival,
                    'miles_between',       cv.miles_between,
                    'day_gap',             cv.day_gap,
                    'check_method',        cv.check_method,
                    'severity',            cv.severity,
                    'source_type',         cv.locked_source_type,
                    'source_id',           cv.locked_source_id
                ) as c,
                cv.severity,
                cv.day_gap,
                cv.miles_between
            from v_offer_radius_conflicts cv
            where cv.offer_id = p_offer_id
            order by
                case cv.severity
                    when 'hard_block' then 3
                    when 'soft_warning' then 2
                    when 'festival_exception' then 1
                    else 0
                end desc,
                cv.day_gap asc,
                cv.miles_between asc nulls last
            limit 3
        ) c
    )
    select coalesce(
        (
            select jsonb_build_object(
                'severity',                  agg.severity,
                'conflict_count',            agg.conflict_count,
                'hard_block_count',          agg.hard_block_count,
                'soft_warning_count',        agg.soft_warning_count,
                'festival_exception_count',  agg.festival_exception_count,
                'nearest_miles',             agg.nearest_miles,
                'smallest_day_gap',          agg.smallest_day_gap,
                'top_conflicts',             coalesce((select conflicts from top), '[]'::jsonb)
            )
            from agg
        ),
        jsonb_build_object('severity', 'clear', 'conflict_count', 0, 'top_conflicts', '[]'::jsonb)
    );
$$;

comment on function fn_offer_radius_check(uuid) is
    'Audit helper: returns {severity, counts, nearest_miles, smallest_day_gap, top_conflicts[]} for an offer. "clear" = no radius conflicts. Call from server actions before sign/memo/send.';

-- =========================================================================
-- 4. Sanity
-- =========================================================================
select 'offers with radius conflicts by severity:' as info,
       severity,
       count(*) as n
from v_offer_radius_audit
group by severity
order by case severity
            when 'hard_block' then 1
            when 'soft_warning' then 2
            when 'festival_exception' then 3
            else 4
         end;

select 'top 5 worst in-flight offers right now:' as info,
       offer_id,
       artist_slug,
       proposed_date,
       offer_venue_city,
       severity,
       conflict_count,
       nearest_miles,
       smallest_day_gap
from v_offer_radius_audit
order by
    case severity
        when 'hard_block' then 1
        when 'soft_warning' then 2
        when 'festival_exception' then 3
        else 4
    end,
    smallest_day_gap asc,
    nearest_miles asc nulls last
limit 5;

-- smoke test for the function — should return 'clear' when given a random uuid
-- (no match) and a real audit blob when pointed at an in-flight offer.
select 'fn_offer_radius_check on a nonexistent uuid returns clear:' as info,
       fn_offer_radius_check('00000000-0000-0000-0000-000000000000'::uuid) as out;


-- ═══════════════════════════════════════════════════════════════════════
-- 0016_model_calls.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0016_model_calls.sql
--
-- Task #21 — token meter + model router foundation.
--
-- Every agent call goes through `agents/model_router.py` and writes a row
-- here. That gives us:
--   (a) a per-tenant / per-agent cost ledger (used by /dashboard/costs),
--   (b) the measurement surface that Phase 1 needs before we downgrade any
--       agent to Haiku — see PRD_model_routing.md.
--
-- Idempotent + re-runnable.

do $$ begin
  create table if not exists model_calls (
    id              uuid primary key default gen_random_uuid(),
    -- multi-tenant foreign keys are nullable for the DSR solo phase;
    -- the analytics views coalesce artist_id -> 'solo' when null.
    tenant_id       uuid,
    artist_id       uuid,
    agent_name      text not null,
    model_id        text not null,
    -- what the agent was doing, e.g. 'classify_inbound', 'draft_outbound',
    -- 'compose_pitch_pack', 'route_email', 'generate_report'. Free-form.
    task_type       text,
    input_tokens    integer not null default 0,
    output_tokens   integer not null default 0,
    cache_creation_input_tokens  integer not null default 0,
    cache_read_input_tokens      integer not null default 0,
    latency_ms      integer,
    cost_usd        numeric(12,6),
    -- who is paying for this? 'anthropic', 'groq', 'together', 'deepinfra',
    -- 'ollama', 'voyage' — keep low cardinality.
    provider        text,
    success         boolean not null default true,
    error_code      text,   -- e.g. 'rate_limit', 'timeout', 'auth_error'
    error_message   text,
    -- opaque context so we can join back to the row that triggered the call:
    -- {"offer_id": "...", "outreach_log_id": "...", "contact_id": "..."}
    context         jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now()
  );
end $$;

-- Indexes for the three access patterns we need on day one.
create index if not exists model_calls_tenant_agent_time_idx
  on model_calls (tenant_id, agent_name, created_at desc);

create index if not exists model_calls_agent_time_idx
  on model_calls (agent_name, created_at desc);

create index if not exists model_calls_model_time_idx
  on model_calls (model_id, created_at desc);

create index if not exists model_calls_created_at_idx
  on model_calls (created_at desc);

-- Jsonb gin so we can filter by offer_id / outreach_log_id cheaply.
create index if not exists model_calls_context_gin_idx
  on model_calls using gin (context);

-- ---------------------------------------------------------------
-- v_model_spend_daily — per-day, per-tenant, per-agent roll-up.
-- This is what the /dashboard/costs page reads.
-- ---------------------------------------------------------------
create or replace view v_model_spend_daily as
select
  (created_at at time zone 'utc')::date       as day,
  coalesce(tenant_id::text, 'solo')           as tenant_key,
  coalesce(artist_id::text, 'unassigned')     as artist_key,
  agent_name,
  model_id,
  coalesce(provider, 'unknown')               as provider,
  count(*)                                    as call_count,
  sum(input_tokens)                           as input_tokens,
  sum(output_tokens)                          as output_tokens,
  sum(cache_creation_input_tokens)            as cache_creation_tokens,
  sum(cache_read_input_tokens)                as cache_read_tokens,
  sum(coalesce(cost_usd, 0))                  as cost_usd,
  avg(latency_ms)::int                        as avg_latency_ms,
  sum(case when success then 0 else 1 end)    as error_count
from model_calls
group by 1, 2, 3, 4, 5, 6;

-- ---------------------------------------------------------------
-- v_model_spend_30d — last-30-day rollup per (tenant, agent, model).
-- Used for the default /dashboard/costs table and Phase-1 ranking:
-- "which agents burn the most tokens, sorted descending?"
-- ---------------------------------------------------------------
create or replace view v_model_spend_30d as
select
  coalesce(tenant_id::text, 'solo')           as tenant_key,
  agent_name,
  model_id,
  coalesce(provider, 'unknown')               as provider,
  count(*)                                    as call_count,
  sum(input_tokens)                           as input_tokens,
  sum(output_tokens)                          as output_tokens,
  sum(cache_creation_input_tokens)            as cache_creation_tokens,
  sum(cache_read_input_tokens)                as cache_read_tokens,
  sum(coalesce(cost_usd, 0))                  as cost_usd,
  avg(latency_ms)::int                        as avg_latency_ms,
  sum(case when success then 0 else 1 end)    as error_count,
  min(created_at)                             as first_call_at,
  max(created_at)                             as last_call_at
from model_calls
where created_at >= now() - interval '30 days'
group by 1, 2, 3, 4
order by sum(coalesce(cost_usd, 0)) desc;

-- ---------------------------------------------------------------
-- v_model_spend_agent_summary — per-agent totals over the last 30 days.
-- This is the Phase-1 shortlist: highest cost_usd = first downgrade target.
-- ---------------------------------------------------------------
create or replace view v_model_spend_agent_summary as
select
  agent_name,
  count(*)                                    as call_count,
  sum(input_tokens + output_tokens)           as total_tokens,
  sum(coalesce(cost_usd, 0))                  as cost_usd,
  avg(latency_ms)::int                        as avg_latency_ms,
  sum(case when success then 0 else 1 end)    as error_count,
  -- share of last-30-day spend
  (sum(coalesce(cost_usd, 0)) / nullif(
    (select sum(coalesce(cost_usd, 0))
       from model_calls
       where created_at >= now() - interval '30 days'), 0
  ) * 100)::numeric(6,2)                      as pct_of_spend
from model_calls
where created_at >= now() - interval '30 days'
group by agent_name
order by cost_usd desc;

-- ---------------------------------------------------------------
-- sanity
-- ---------------------------------------------------------------
select 'info: model_calls ready'               as status,
       (select count(*) from model_calls)      as rows_total,
       (select count(*) from model_calls
         where created_at >= now() - interval '30 days') as rows_last_30d;


-- ═══════════════════════════════════════════════════════════════════════
-- 0017_voice_sample_retrieval.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 0017_voice_sample_retrieval.sql
--
-- Task #23 — retrieval-augmented voice-sample selection for outbound composer.
--
-- Adds:
--   * HNSW index on voice_samples.embedding for cosine-distance nearest-neighbor
--     lookup (pgvector 0.5+). Small corpus (a few hundred rows) so the index
--     is optional for correctness, but it keeps the query plan stable as the
--     corpus grows and it's essentially free to build.
--   * fn_similar_voice_samples(query_embedding, categories, recipient_role,
--     match_count) — returns top-K rows by cosine similarity, filtered by
--     sample_category + recipient_role the same way the old recency-only
--     loader filtered.
--   * v_voice_sample_coverage — operational view: how many samples per
--     (category, role), how many still missing embeddings. Lets the
--     backfill script (scripts/embed_voice_samples.py) confirm the
--     corpus is fully embedded before the composer starts relying on it.
--
-- Idempotent + re-runnable.

-- ---------------------------------------------------------------------
-- HNSW index (pgvector >= 0.5). Falls back to IVFFlat if HNSW isn't
-- available on the pgvector version Supabase is running.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_class where relname = 'idx_voice_samples_embedding_hnsw'
  ) then
    begin
      execute $idx$
        create index idx_voice_samples_embedding_hnsw
          on voice_samples
          using hnsw (embedding vector_cosine_ops)
          with (m = 16, ef_construction = 64)
      $idx$;
    exception when others then
      -- HNSW not available? Fall back to IVFFlat. Smaller corpus is fine
      -- with `lists = greatest(10, row_count / 1000)`; we start with 10.
      execute $idx$
        create index if not exists idx_voice_samples_embedding_ivfflat
          on voice_samples
          using ivfflat (embedding vector_cosine_ops)
          with (lists = 10)
      $idx$;
    end;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Retrieval RPC. Returns top-K voice samples by cosine similarity,
-- filtered by category (IN list) and optional recipient_role.
--
-- Uses the <=> operator (cosine distance in pgvector). Lower = closer.
-- We return (1 - distance) as `similarity` so a downstream consumer can
-- filter by a minimum score without flipping sign conventions.
-- ---------------------------------------------------------------------
create or replace function fn_similar_voice_samples(
  query_embedding  vector(1024),
  categories       text[]          default null,
  recipient_role   contact_role    default null,
  match_count      int             default 8
) returns table (
  id              uuid,
  sample_category text,
  recipient_role  contact_role,
  subject         text,
  body            text,
  sent_at         timestamptz,
  similarity      double precision
)
language sql
stable
as $$
  select
    vs.id,
    vs.sample_category,
    vs.recipient_role,
    vs.subject,
    vs.body,
    vs.sent_at,
    (1 - (vs.embedding <=> query_embedding))::double precision as similarity
  from voice_samples vs
  where vs.embedding is not null
    and (categories is null or vs.sample_category = any(categories))
    and (recipient_role is null or vs.recipient_role = recipient_role)
  order by vs.embedding <=> query_embedding
  limit greatest(1, coalesce(match_count, 8));
$$;

comment on function fn_similar_voice_samples(vector, text[], contact_role, int) is
  'Task #23 — returns top-K voice_samples by cosine similarity to query_embedding, '
  'filtered by sample_category (in list) and optional recipient_role. '
  'Called from outbound.load_voice_samples when embeddings are populated.';

-- ---------------------------------------------------------------------
-- Coverage view. How many rows per category, how many have embeddings.
-- ---------------------------------------------------------------------
create or replace view v_voice_sample_coverage as
select
  sample_category,
  count(*)                                    as total_rows,
  count(*) filter (where embedding is not null)  as embedded_rows,
  count(*) filter (where embedding is null)      as missing_rows,
  round(
    100.0 * count(*) filter (where embedding is not null) / nullif(count(*), 0),
    1
  )                                           as pct_embedded,
  min(sent_at)                                as oldest_sent_at,
  max(sent_at)                                as newest_sent_at
from voice_samples
group by sample_category
order by sample_category;

-- ---------------------------------------------------------------------
-- sanity
-- ---------------------------------------------------------------------
select 'info: voice-sample retrieval ready' as status,
       (select count(*) from voice_samples)                                as rows_total,
       (select count(*) from voice_samples where embedding is not null)    as rows_embedded;

