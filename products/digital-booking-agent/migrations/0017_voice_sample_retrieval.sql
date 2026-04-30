-- 0017_voice_sample_retrieval.sql
--
-- Task #23 — retrieval-augmented voice-sample selection for outbound composer.
--
-- Adds:
--   * HNSW index on voice_samples.embedding for cosine-distance nearest-neighbor
--     lookup (pgvector 0.5+). Small corpus (a few hundred rows) so the index
--     is optional for correctness, but it keeps the query plan stable as the
--     corpus grows and it's essentially free to build.
--   * fn_similar_voice_samples(query_embedding, categories, recipient_role,
--     match_count) — returns top-K rows by cosine similarity, filtered by
--     sample_category + recipient_role the same way the old recency-only
--     loader filtered.
--   * v_voice_sample_coverage — operational view: how many samples per
--     (category, role), how many still missing embeddings. Lets the
--     backfill script (scripts/embed_voice_samples.py) confirm the
--     corpus is fully embedded before the composer starts relying on it.
--
-- Idempotent + re-runnable.

-- ---------------------------------------------------------------------
-- HNSW index (pgvector >= 0.5). Falls back to IVFFlat if HNSW isn't
-- available on the pgvector version Supabase is running.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_class where relname = 'idx_voice_samples_embedding_hnsw'
  ) then
    begin
      execute $idx$
        create index idx_voice_samples_embedding_hnsw
          on voice_samples
          using hnsw (embedding vector_cosine_ops)
          with (m = 16, ef_construction = 64)
      $idx$;
    exception when others then
      -- HNSW not available? Fall back to IVFFlat. Smaller corpus is fine
      -- with `lists = greatest(10, row_count / 1000)`; we start with 10.
      execute $idx$
        create index if not exists idx_voice_samples_embedding_ivfflat
          on voice_samples
          using ivfflat (embedding vector_cosine_ops)
          with (lists = 10)
      $idx$;
    end;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Retrieval RPC. Returns top-K voice samples by cosine similarity,
-- filtered by category (IN list) and optional recipient_role.
--
-- Uses the <=> operator (cosine distance in pgvector). Lower = closer.
-- We return (1 - distance) as `similarity` so a downstream consumer can
-- filter by a minimum score without flipping sign conventions.
-- ---------------------------------------------------------------------
create or replace function fn_similar_voice_samples(
  query_embedding  vector(1024),
  categories       text[]          default null,
  recipient_role   contact_role    default null,
  match_count      int             default 8
) returns table (
  id              uuid,
  sample_category text,
  recipient_role  contact_role,
  subject         text,
  body            text,
  sent_at         timestamptz,
  similarity      double precision
)
language sql
stable
as $$
  select
    vs.id,
    vs.sample_category,
    vs.recipient_role,
    vs.subject,
    vs.body,
    vs.sent_at,
    (1 - (vs.embedding <=> query_embedding))::double precision as similarity
  from voice_samples vs
  where vs.embedding is not null
    and (categories is null or vs.sample_category = any(categories))
    and (recipient_role is null or vs.recipient_role = recipient_role)
  order by vs.embedding <=> query_embedding
  limit greatest(1, coalesce(match_count, 8));
$$;

comment on function fn_similar_voice_samples(vector, text[], contact_role, int) is
  'Task #23 — returns top-K voice_samples by cosine similarity to query_embedding, '
  'filtered by sample_category (in list) and optional recipient_role. '
  'Called from outbound.load_voice_samples when embeddings are populated.';

-- ---------------------------------------------------------------------
-- Coverage view. How many rows per category, how many have embeddings.
-- ---------------------------------------------------------------------
create or replace view v_voice_sample_coverage as
select
  sample_category,
  count(*)                                    as total_rows,
  count(*) filter (where embedding is not null)  as embedded_rows,
  count(*) filter (where embedding is null)      as missing_rows,
  round(
    100.0 * count(*) filter (where embedding is not null) / nullif(count(*), 0),
    1
  )                                           as pct_embedded,
  min(sent_at)                                as oldest_sent_at,
  max(sent_at)                                as newest_sent_at
from voice_samples
group by sample_category
order by sample_category;

-- ---------------------------------------------------------------------
-- sanity
-- ---------------------------------------------------------------------
select 'info: voice-sample retrieval ready' as status,
       (select count(*) from voice_samples)                                as rows_total,
       (select count(*) from voice_samples where embedding is not null)    as rows_embedded;
