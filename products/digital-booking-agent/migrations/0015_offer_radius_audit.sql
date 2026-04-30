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
