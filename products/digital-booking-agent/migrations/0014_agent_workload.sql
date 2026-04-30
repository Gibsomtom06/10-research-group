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
