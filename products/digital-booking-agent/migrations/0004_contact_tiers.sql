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
