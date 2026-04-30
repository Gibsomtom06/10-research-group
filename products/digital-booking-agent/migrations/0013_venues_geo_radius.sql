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
