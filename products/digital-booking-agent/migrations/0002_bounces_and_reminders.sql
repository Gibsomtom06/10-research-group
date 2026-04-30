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
