-- seed_tmtyl_tour.sql
-- Materializes the canonical "Take Me To Your Leader - Leg 2" package tour:
--   * tour row
--   * tour_artists rows (full 7-artist roster with roles + priorities)
--   * package_levels rows (trio / quintet / full_seven)
--
-- Safe to re-run. Upserts on tour.name and (tour_id, label) for package_levels.
-- Prereqs: 0004, 0005, 0006, 0007 must be applied first.
--
-- Usage:
--   psql "$SUPABASE_DB_URL" -f scripts/seed_tmtyl_tour.sql

\set ON_ERROR_STOP on

begin;

do $$
declare
    v_tour_id    uuid;
    v_dsr_id     uuid;
begin
    -- -------------------------------------------------------------------
    -- Resolve primary artist (DirtySnatcha is the tour lead)
    -- -------------------------------------------------------------------
    select id into v_dsr_id from artists where slug = 'dirtysnatcha';
    if v_dsr_id is null then
        raise exception 'artist dirtysnatcha not found - apply migration 0006 first';
    end if;

    -- -------------------------------------------------------------------
    -- Upsert the tour row (idempotent on name)
    -- -------------------------------------------------------------------
    select id into v_tour_id
    from tours
    where name = 'Take Me To Your Leader - Leg 2';

    if v_tour_id is null then
        insert into tours (
            artist_id, name, tier,
            window_start, window_end,
            guarantee_target, guarantee_floor,
            notes
        )
        values (
            v_dsr_id,
            'Take Me To Your Leader - Leg 2',
            2,
            date '2026-06-01',
            date '2026-09-30',
            null,   -- target varies by package_level
            null,   -- floor varies by package_level
            'Multi-artist package tour. Scalable 3/5/7 configs. ' ||
            'See package_levels for capacity band -> guarantee mapping.'
        )
        returning id into v_tour_id;
    else
        update tours
           set window_start = date '2026-06-01',
               window_end   = date '2026-09-30',
               tier         = 2,
               notes        = 'Multi-artist package tour. Scalable 3/5/7 configs. ' ||
                              'See package_levels for capacity band -> guarantee mapping.'
         where id = v_tour_id;
    end if;

    -- -------------------------------------------------------------------
    -- tour_artists: full DSR roster with roles + priorities
    --   DirtySnatcha - required headliner, top priority
    --   Kotrax       - co_headliner, priority 90
    --   Dark Matter  - support,       priority 85
    --   HVRCRFT      - support,       priority 80
    --   Mport        - support,       priority 75
    --   Ozztin       - support,       priority 70
    --   Xenotype     - open,          priority 65
    -- Only DirtySnatcha is is_required=true (anchors every config).
    -- -------------------------------------------------------------------
    insert into tour_artists (tour_id, artist_id, role, is_required, priority)
    select v_tour_id, a.id,
           case a.slug
             when 'dirtysnatcha' then 'headliner'::tour_artist_role
             when 'kotrax'       then 'co_headliner'::tour_artist_role
             when 'xenotype'     then 'open'::tour_artist_role
             else 'support'::tour_artist_role
           end,
           (a.slug = 'dirtysnatcha'),
           case a.slug
             when 'dirtysnatcha' then 100
             when 'kotrax'       then 90
             when 'dark_matter'  then 85
             when 'hvrcrft'      then 80
             when 'mport'        then 75
             when 'ozztin'       then 70
             when 'xenotype'     then 65
             else 50
           end
    from artists a
    where a.slug in (
        'dirtysnatcha', 'mport', 'kotrax', 'ozztin',
        'dark_matter', 'hvrcrft', 'xenotype'
    )
    on conflict (tour_id, artist_id) do update
        set role        = excluded.role,
            is_required = excluded.is_required,
            priority    = excluded.priority;

    -- -------------------------------------------------------------------
    -- package_levels: trio / quintet / full_seven
    --   trio        - 3 artists, 250-500 cap,   $2k-$3.5k
    --   quintet     - 5 artists, 500-900 cap,   $4.5k-$6.5k
    --   full_seven  - 7 artists, 900+ cap,      $7.5k-$10k
    -- required_artist_slugs always pitched; optional is the swap pool.
    -- -------------------------------------------------------------------
    insert into package_levels (
        tour_id, label, tier_size,
        min_venue_capacity, max_venue_capacity,
        guarantee_floor, guarantee_target, guarantee_ceiling,
        required_artist_slugs, optional_artist_slugs, sort_order
    )
    values
        (v_tour_id, 'trio', 3,
         250, 500,
         null, 2500, 3500,
         array['dirtysnatcha'],
         array['kotrax', 'dark_matter', 'hvrcrft', 'mport', 'ozztin', 'xenotype'],
         1),
        (v_tour_id, 'quintet', 5,
         500, 900,
         null, 4500, 6500,
         array['dirtysnatcha'],
         array['kotrax', 'dark_matter', 'hvrcrft', 'mport', 'ozztin', 'xenotype'],
         2),
        (v_tour_id, 'full_seven', 7,
         900, null,
         null, 7500, 10000,
         array['dirtysnatcha', 'kotrax', 'dark_matter', 'hvrcrft',
               'mport', 'ozztin', 'xenotype'],
         array[]::text[],
         3)
    on conflict (tour_id, label) do update
        set tier_size             = excluded.tier_size,
            min_venue_capacity    = excluded.min_venue_capacity,
            max_venue_capacity    = excluded.max_venue_capacity,
            guarantee_floor       = excluded.guarantee_floor,
            guarantee_target      = excluded.guarantee_target,
            guarantee_ceiling     = excluded.guarantee_ceiling,
            required_artist_slugs = excluded.required_artist_slugs,
            optional_artist_slugs = excluded.optional_artist_slugs,
            sort_order            = excluded.sort_order,
            updated_at            = now();

    raise notice 'Seeded tour %: Take Me To Your Leader - Leg 2 (7 artists, 3 package_levels)', v_tour_id;
end $$;

commit;

-- -------------------------------------------------------------------
-- Sanity checks (read-only; safe to leave in or strip)
-- -------------------------------------------------------------------
select t.id, t.name, t.tier, t.window_start, t.window_end
from tours t
where t.name = 'Take Me To Your Leader - Leg 2';

select role, is_required, priority, a.slug, a.display_name
from tour_artists ta
join artists a on a.id = ta.artist_id
join tours  t on t.id = ta.tour_id
where t.name = 'Take Me To Your Leader - Leg 2'
order by ta.priority desc;

select label, tier_size,
       min_venue_capacity, max_venue_capacity,
       guarantee_floor, guarantee_target, guarantee_ceiling,
       required_artist_slugs, optional_artist_slugs
from package_levels pl
join tours t on t.id = pl.tour_id
where t.name = 'Take Me To Your Leader - Leg 2'
order by sort_order;

select * from v_tour_roster
where tour_name = 'Take Me To Your Leader - Leg 2';
