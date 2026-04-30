-- 0003_reports.sql
-- Reporting storage: persisted daily / weekly rollups so the dashboard
-- doesn't need to recompute (or re-call the model) every request.
--
-- Run after 0002. Idempotent.

create table if not exists reports (
    id            uuid primary key default gen_random_uuid(),
    period        text not null,              -- 'daily' | 'weekly' | 'custom'
    window_start  timestamptz not null,
    window_end    timestamptz not null,
    payload       jsonb not null default '{}'::jsonb,  -- scorecard object
    markdown      text,                       -- rendered narrative
    created_at    timestamptz default now()
);

create index if not exists idx_reports_period_created
    on reports (period, created_at desc);

create index if not exists idx_reports_window
    on reports (window_end desc);

-- Convenience view: the most recent report of each period type
create or replace view v_latest_reports as
select distinct on (period)
    id, period, window_start, window_end, payload, markdown, created_at
from reports
order by period, created_at desc;
