-- 0016_model_calls.sql
--
-- Task #21 — token meter + model router foundation.
--
-- Every agent call goes through `agents/model_router.py` and writes a row
-- here. That gives us:
--   (a) a per-tenant / per-agent cost ledger (used by /dashboard/costs),
--   (b) the measurement surface that Phase 1 needs before we downgrade any
--       agent to Haiku — see PRD_model_routing.md.
--
-- Idempotent + re-runnable.

do $$ begin
  create table if not exists model_calls (
    id              uuid primary key default gen_random_uuid(),
    -- multi-tenant foreign keys are nullable for the DSR solo phase;
    -- the analytics views coalesce artist_id -> 'solo' when null.
    tenant_id       uuid,
    artist_id       uuid,
    agent_name      text not null,
    model_id        text not null,
    -- what the agent was doing, e.g. 'classify_inbound', 'draft_outbound',
    -- 'compose_pitch_pack', 'route_email', 'generate_report'. Free-form.
    task_type       text,
    input_tokens    integer not null default 0,
    output_tokens   integer not null default 0,
    cache_creation_input_tokens  integer not null default 0,
    cache_read_input_tokens      integer not null default 0,
    latency_ms      integer,
    cost_usd        numeric(12,6),
    -- who is paying for this? 'anthropic', 'groq', 'together', 'deepinfra',
    -- 'ollama', 'voyage' — keep low cardinality.
    provider        text,
    success         boolean not null default true,
    error_code      text,   -- e.g. 'rate_limit', 'timeout', 'auth_error'
    error_message   text,
    -- opaque context so we can join back to the row that triggered the call:
    -- {"offer_id": "...", "outreach_log_id": "...", "contact_id": "..."}
    context         jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now()
  );
end $$;

-- Indexes for the three access patterns we need on day one.
create index if not exists model_calls_tenant_agent_time_idx
  on model_calls (tenant_id, agent_name, created_at desc);

create index if not exists model_calls_agent_time_idx
  on model_calls (agent_name, created_at desc);

create index if not exists model_calls_model_time_idx
  on model_calls (model_id, created_at desc);

create index if not exists model_calls_created_at_idx
  on model_calls (created_at desc);

-- Jsonb gin so we can filter by offer_id / outreach_log_id cheaply.
create index if not exists model_calls_context_gin_idx
  on model_calls using gin (context);

-- ---------------------------------------------------------------
-- v_model_spend_daily — per-day, per-tenant, per-agent roll-up.
-- This is what the /dashboard/costs page reads.
-- ---------------------------------------------------------------
create or replace view v_model_spend_daily as
select
  (created_at at time zone 'utc')::date       as day,
  coalesce(tenant_id::text, 'solo')           as tenant_key,
  coalesce(artist_id::text, 'unassigned')     as artist_key,
  agent_name,
  model_id,
  coalesce(provider, 'unknown')               as provider,
  count(*)                                    as call_count,
  sum(input_tokens)                           as input_tokens,
  sum(output_tokens)                          as output_tokens,
  sum(cache_creation_input_tokens)            as cache_creation_tokens,
  sum(cache_read_input_tokens)                as cache_read_tokens,
  sum(coalesce(cost_usd, 0))                  as cost_usd,
  avg(latency_ms)::int                        as avg_latency_ms,
  sum(case when success then 0 else 1 end)    as error_count
from model_calls
group by 1, 2, 3, 4, 5, 6;

-- ---------------------------------------------------------------
-- v_model_spend_30d — last-30-day rollup per (tenant, agent, model).
-- Used for the default /dashboard/costs table and Phase-1 ranking:
-- "which agents burn the most tokens, sorted descending?"
-- ---------------------------------------------------------------
create or replace view v_model_spend_30d as
select
  coalesce(tenant_id::text, 'solo')           as tenant_key,
  agent_name,
  model_id,
  coalesce(provider, 'unknown')               as provider,
  count(*)                                    as call_count,
  sum(input_tokens)                           as input_tokens,
  sum(output_tokens)                          as output_tokens,
  sum(cache_creation_input_tokens)            as cache_creation_tokens,
  sum(cache_read_input_tokens)                as cache_read_tokens,
  sum(coalesce(cost_usd, 0))                  as cost_usd,
  avg(latency_ms)::int                        as avg_latency_ms,
  sum(case when success then 0 else 1 end)    as error_count,
  min(created_at)                             as first_call_at,
  max(created_at)                             as last_call_at
from model_calls
where created_at >= now() - interval '30 days'
group by 1, 2, 3, 4
order by sum(coalesce(cost_usd, 0)) desc;

-- ---------------------------------------------------------------
-- v_model_spend_agent_summary — per-agent totals over the last 30 days.
-- This is the Phase-1 shortlist: highest cost_usd = first downgrade target.
-- ---------------------------------------------------------------
create or replace view v_model_spend_agent_summary as
select
  agent_name,
  count(*)                                    as call_count,
  sum(input_tokens + output_tokens)           as total_tokens,
  sum(coalesce(cost_usd, 0))                  as cost_usd,
  avg(latency_ms)::int                        as avg_latency_ms,
  sum(case when success then 0 else 1 end)    as error_count,
  -- share of last-30-day spend
  (sum(coalesce(cost_usd, 0)) / nullif(
    (select sum(coalesce(cost_usd, 0))
       from model_calls
       where created_at >= now() - interval '30 days'), 0
  ) * 100)::numeric(6,2)                      as pct_of_spend
from model_calls
where created_at >= now() - interval '30 days'
group by agent_name
order by cost_usd desc;

-- ---------------------------------------------------------------
-- sanity
-- ---------------------------------------------------------------
select 'info: model_calls ready'               as status,
       (select count(*) from model_calls)      as rows_total,
       (select count(*) from model_calls
         where created_at >= now() - interval '30 days') as rows_last_30d;
