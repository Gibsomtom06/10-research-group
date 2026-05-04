-- 0019_dba_contacts_compat.sql
--
-- Pass 1 of DBA → TENx10 merger compat layer.
-- DBA's worker (sender.ts) queries contacts.full_name + contacts.timezone.
-- TENx10's contacts has 'name' (not full_name) and no timezone column.
-- Add the columns DBA needs without breaking TENx10's existing reads.

alter table contacts
  add column if not exists full_name text generated always as (name) stored;

alter table contacts
  add column if not exists timezone text;

create index if not exists idx_contacts_full_name_trgm
  on contacts using gin (full_name gin_trgm_ops);
