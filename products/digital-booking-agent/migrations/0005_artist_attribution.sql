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
