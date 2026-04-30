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
