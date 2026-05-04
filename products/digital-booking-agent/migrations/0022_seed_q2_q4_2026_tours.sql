-- 0022_seed_q2_q4_2026_tours.sql
--
-- Seed Q2-Q4 2026 tour rows for the four target artists so the
-- outreach pipeline has scope to write into. Idempotent: matches on
-- (artist_id, name) and skips existing.

insert into tours (artist_id, name, tier, window_start, window_end, status, notes)
select a.id, q.name, 2, q.win_start::date, q.win_end::date, 'planning',
       'Auto-seeded 2026-05-04 — Q2-Q4 2026 booking pipeline'
from artists a
cross join (values
  ('Q2 2026', '2026-04-01', '2026-06-30'),
  ('Q3 2026', '2026-07-01', '2026-09-30'),
  ('Q4 2026', '2026-10-01', '2026-12-31')
) as q(name, win_start, win_end)
where a.slug in ('dirtysnatcha','whoisee','darkmatter','kotrax')
  and not exists (
    select 1 from tours t where t.artist_id = a.id and t.name = q.name
  );
