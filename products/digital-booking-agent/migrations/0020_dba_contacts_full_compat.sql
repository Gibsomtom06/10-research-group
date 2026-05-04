-- 0020_dba_contacts_full_compat.sql
--
-- Adds the rest of DBA's expected columns on contacts (additive — won't
-- break TENx10 reads). Defaults chosen so existing TENx10 rows have
-- sensible values:
--   - relationship_strength defaults to 'cold'
--   - role defaults to 'other' (when DBA can't figure it out)
--   - deleted_at NULL means active

alter table contacts add column if not exists role contact_role not null default 'other';
alter table contacts add column if not exists relationship_strength relationship_strength not null default 'cold';
alter table contacts add column if not exists last_interaction_at    timestamptz;
alter table contacts add column if not exists last_show_together_at  date;
alter table contacts add column if not exists thomas_notes           text;
alter table contacts add column if not exists tags                   text[] default '{}';
alter table contacts add column if not exists source_imports         jsonb default '[]'::jsonb;
alter table contacts add column if not exists deleted_at             timestamptz;

-- Backfill last_interaction_at from existing TENx10 last_pitched_at
update contacts set last_interaction_at = last_pitched_at
where last_interaction_at is null and last_pitched_at is not null;
