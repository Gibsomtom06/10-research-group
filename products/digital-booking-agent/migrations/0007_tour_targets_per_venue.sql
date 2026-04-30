-- 0007_tour_targets_per_venue.sql
-- Opens up tour_targets so a single contact can be pitched multiple times
-- on the same tour — once per venue they book. The seeder now iterates
-- (tour, contact, venue) tuples so a buyer who books three rooms gets
-- three targeted pitches, each with its own per-venue suppression.
--
-- Safe to re-run.

-- drop the old (tour_id, contact_id) unique constraint if present
do $$
declare
    conname text;
begin
    select c.conname into conname
    from pg_constraint c
    join pg_class r on r.oid = c.conrelid
    where r.relname = 'tour_targets'
      and c.contype = 'u';
    if conname is not null then
        execute format('alter table tour_targets drop constraint %I', conname);
    end if;
end $$;

-- new unique index: one row per (tour, contact, venue_or_null)
-- uuid_nil() ('00000000-...') stands in for null so the index works
-- even when the target has no specific venue (contact-level fallback).
create unique index if not exists tour_targets_tour_contact_venue_uniq
    on tour_targets (
        tour_id,
        contact_id,
        coalesce(venue_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

-- handy view: every pitchable (contact, venue) pair for a tour, joined
-- with capacity + existing target status if already seeded. The seeder
-- uses this as its working set.
create or replace view v_pitchable_targets as
select
    c.id                          as contact_id,
    c.full_name                   as contact_name,
    c.email,
    c.relationship_tier,
    c.contact_roles,
    c.vip,
    v.id                          as venue_id,
    v.name                        as venue_name,
    v.capacity                    as venue_capacity,
    v.city                        as venue_city,
    v.state                       as venue_state
from contacts c
left join contact_venues cv on cv.contact_id = c.id
left join venues v          on v.id = cv.venue_id
where c.deleted_at is null
  and c.email is not null
  and coalesce(v.deleted_at, now() + interval '1 year') > now();
