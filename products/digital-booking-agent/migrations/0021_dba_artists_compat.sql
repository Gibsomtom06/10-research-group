-- 0021_dba_artists_compat.sql
--
-- DBA expects artists.slug + artists.display_name (and a few others).
-- TENx10's artists has 'name' + 'stage_name' instead. Add compat
-- columns and backfill.

alter table artists add column if not exists slug         text;
alter table artists add column if not exists display_name text;
alter table artists add column if not exists legal_name   text;
alter table artists add column if not exists pronouns     text;
alter table artists add column if not exists genre_tags   text[] default '{}';
alter table artists add column if not exists home_market  text;
alter table artists add column if not exists epk_url      text;
alter table artists add column if not exists one_sheet_url text;
alter table artists add column if not exists agent_company text;
alter table artists add column if not exists agent_contact_id uuid references contacts(id);
alter table artists add column if not exists active       boolean not null default true;

-- Backfill display_name = stage_name (or name if no stage_name)
update artists set display_name = coalesce(stage_name, name) where display_name is null;

-- Backfill slug from stage_name lowercased without spaces (fallback to name)
update artists
set slug = lower(regexp_replace(coalesce(stage_name, name), '[^a-zA-Z0-9]+', '', 'g'))
where slug is null;

-- Make slug unique (now that all rows have one)
do $$ begin
  if not exists (select 1 from pg_indexes where indexname = 'idx_artists_slug_unique') then
    create unique index idx_artists_slug_unique on artists (slug) where slug is not null;
  end if;
end $$;
