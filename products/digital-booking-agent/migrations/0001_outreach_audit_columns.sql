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
