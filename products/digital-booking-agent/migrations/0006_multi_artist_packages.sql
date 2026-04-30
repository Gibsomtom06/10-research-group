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
