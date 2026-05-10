# DBA Session State

**Last updated**: 2026-04-23 (shipped 0011 + 0012 + scored seeder + /outreach/priorities + counter_offer composer branch + 0013 hybrid radius + 0014 agent workload views + multi-root workspace file + 0015 offer radius audit + /offers/[id] radius banner + sign guard + 0016 model_calls ledger + token meter / model router Phase 0 + **0017 voice-sample retrieval (HNSW + fn_similar_voice_samples) + Voyage embeddings client + outbound.py retrieval-augmented voice selection**)

This is the living handoff doc between Cowork sessions. Read this **second**, right after `CLAUDE.md`, before doing anything.

Update this file at the end of every session, or whenever Thomas says "checkpoint".

---

## Current focus

**Booking intelligence just shipped. Next up: Gmail OAuth + first real outbound.**

Thomas left the last session with "cook until you run out of credits" after the intelligence design was agreed. The intelligence layer is now live:

- **Migration 0011** — `v_target_score` composite scorer, radius-exception tiering, two panel views.
- **Migration 0012** — prysm email domain fix backfill (housekeeping during intelligence work).
- **Scored seeder** — `scripts/seed_q2_tier2_drafts.py` rewritten to rank by `v_target_score` with tier-diversity FLOOR (not ceiling), factor_breakdown logged into `outreach_log.decision_trace.target_score`. Legacy path preserved behind `--legacy-rank`.
- **`/outreach/priorities`** page — ranked table with sparkbar factor breakdown, festival-exception panel, blocked panel, "outreach now" queue button.

With the intelligence layer done, the critical path is now actually getting mail out the door: Gmail OAuth (#27), first real outbound end-to-end (#28), Supabase Storage bucket for deal memos (#49). Between sessions this run also shipped the composer counter_offer branch (#51) and migration 0013 for real-distance radius (#63).

## Last completed (in order)

1. **Migration 0009 — offers as contracts** (`migrations/0009_offers_as_contracts.sql`)
   - Added contract-lifecycle fields, enum states, `dsr_standard_deal_terms` view, `v_offer_contract_status` view, sign/deposit RPCs.

2. **Offers kanban UI** (`app/app/offers/page.tsx`)
   - 6-column kanban (new → locked). Filter-based columns. Card shows guarantee, proposed_date, days_out badge, artist_slug, source tag.

3. **Offer detail page** (`app/app/offers/[id]/page.tsx` + `actions.tsx` + `server-actions.ts` + `not-found.tsx`)
   - Full deal view: financial, counter bounds, radius, production, cancellation, signatures, relay & routing
   - Client action buttons: generate memo, sign as thomas, record promoter sig, record deposit, counter
   - 5 server actions, all revalidatePath on mutate

4. **Deal memo PDF generator** (`app/lib/deal-memo.ts`)
   - pdf-lib, US Letter, section/kv/paragraph/spacer writer, signature block, uploads to Supabase Storage bucket `deal-memos`

5. **Counter-offer drafter** (`scripts/seed_counter_drafts.py` + `agents/outbound.py` edits)
   - Watches status='countered', fires outbound composer with `DBA_COUNTER_PAYLOAD` env + `--from-counter-payload`
   - `synthetic_pack_from_counter()` builds a pitch-pack-shaped dict, no analyst pass needed
   - Has `has_fresh_counter_draft()` idempotency guard

6. **Migration 0010 — agent relays** (`migrations/0010_offers_agent_relay.sql`)
   - `offer_source` enum (direct_promoter / agent_ab / agent_prysm / agent_other / manual / gigwell_import)
   - New FK columns: `relayed_by_contact_id`, `promoter_contact_id`, `reply_to_contact_id`
   - `agent_commission_pct`, `agent_commission_paid_at`
   - Generated column: `net_to_artist = guarantee * (1 - commission/100)`
   - Backfill from @prysmagency.com, Andrew Lehr, gigwell source_tag
   - Refreshed `v_offer_contract_status` with `source`, `net_to_artist`, `is_relayed`
   - `fn_offer_reply_to(offer_id)` RPC

7. **Offers UI updated for relays**
   - Kanban card: `net X` secondary to guarantee, source badge (AB/PRYSM/agent/gigwell/manual)
   - Detail page: new "relay & routing" section with commission math and reply-to disclosure

8. **Migration 0011 — booking intelligence** (`migrations/0011_booking_intelligence.sql`)
   - `venues.is_festival` boolean (heuristic backfill for names containing fest/grounds/fairgrounds)
   - `v_reply_rate_by_contact` view (sent/opened/replied counts + computed reply_rate)
   - `v_locked_shows` view (unions `confirmed_shows` announced/on_sale/sold_out with offers in fully_executed/deposit_received)
   - **`v_target_score`** — main composite scorer, one row per (tour, artist, contact, venue). 8 factor CTEs (history 0.25, tier 0.15, recency 0.10, cap_fit 0.10, anchor 0.15, reply 0.15, genre 0.10). Radius-conflict tiering: non-festival → hard zero (`radius_blocked=true`); festival → keep score, flag `radius_exception_candidate=true`. `factor_breakdown` jsonb column carries weights + factors + signals + raw_score for audit
   - `v_radius_blocked_targets` and `v_radius_exception_candidates` panel views
   - Decisions locked with Thomas: plain view (not materialized), one row per (artist, target), festival exceptions, promoter_activity omitted until #35
   - **Known v1 limits**: radius uses same-city approximation (no lat/lng), genre-fit scores 0.5 when either side of the intersection is empty. Flagged as tasks #62 and #63.

9. **Migration 0012 — prysm email domain fix** (`migrations/0012_fix_prysm_email_domain.sql`)
   - Backfill correction during 0010's offer-source logic. 0010 keyed on `@prysmagency.com`; 0012 normalizes to the correct domain and re-runs the agent_prysm backfill.

12. **Composer counter_offer branch** (`prompts/outbound_composer.md`)
    - New "Counter-offer mode" section alongside insider/warm/cold. Documents the synthetic-pack payload shape the runner passes (contact, venue, proposed_date, counter_target/min/walk_away, notes, tone_hint). Locks the content rules: name the counter once, never reveal min or walk-away, one rationale clause, one concrete next step, never apologize. Tier still drives voice warmth. Two worked examples (warm w/ notes rationale, insider w/ naked number). Output JSON gets a `counter_target_named` echo field so the runner can verify the model didn't drift off the number, and two new flags: `counter_no_rationale`, `counter_number_drift`. `agents/outbound.py` already dispatches the synthetic pack correctly — zero runner changes.

13. **Migration 0013 — venues geo + real distance radius** (`migrations/0013_venues_geo_radius.sql`)
    - Adds `venues.latitude`, `venues.longitude` (nullable; backfill is a followup). Adds `fn_miles_between(lat1,lng1,lat2,lng2)` — plain-SQL haversine, no PostGIS. Rebuilds `v_locked_shows` to surface venue coords. Rebuilds `v_target_score.conflict` CTE with hybrid radius: haversine when both sides coded (`<= dsr_standard_deal_terms.radius_miles`), same-city fallback otherwise. New signals `radius_check_method` + `miles_to_nearest_conflict` flow through `factor_breakdown` and into `v_radius_blocked_targets` / `v_radius_exception_candidates` so `/outreach/priorities` can show which method flagged each conflict. CHECK constraints on lat/lng ranges. Sanity queries at the bottom include LA↔NYC and Boulder↔Denver haversine smoke tests.

16. **Migration 0016 + token meter / model router Phase 0** (`migrations/0016_model_calls.sql` + `agents/model_config.py` + `agents/model_router.py` + `app/app/dashboard/costs/page.tsx` + `scripts/model_spend_report.py` + all 5 Anthropic-calling agents rewired)
    - **DB layer**: `model_calls` table holds every agent invocation with tenant/artist keys, `agent_name`, `model_id`, `provider`, token counts (input/output + cache read/write), `cost_usd`, `latency_ms`, `success` / `error_code` / `error_message`, and a jsonb `context` (typically `{outreach_log_id, contact_id, offer_id}`). Five indexes: (tenant, agent, time), (agent, time), (model, time), (time desc), and a GIN on `context`. Three views on top: `v_model_spend_daily` (per day × tenant × agent × model), `v_model_spend_30d` (the /dashboard/costs main table, sorted by cost desc), and `v_model_spend_agent_summary` (Phase-1 downgrade shortlist with pct_of_spend).
    - **Config layer**: `agents/model_config.py` is the single source of truth. `MODEL_CATALOG` lists every supported model with provider, tier (A/B/C/D), and per-million I/O + cache pricing. `MODEL_ROUTING` maps agent_name → model key. `TIER_A_FLOOR = {outbound, supervisor, research}` — the router refuses to run those on non-A models even if `DBA_MODEL_<AGENT>` env tries to downgrade. `model_key_for()` applies per-agent env override → global `DBA_MODEL_DEFAULT` → default, then enforces the floor. `compute_cost_usd()` handles the cache-token pricing split.
    - **Router layer**: `agents/model_router.py` wraps Anthropic calls and will grow to Groq/Together in Phase 2. Every call is timed, usage-tracked, cost-calculated, and logged to `model_calls` (best-effort — log failures don't break the agent). `run_agent_model(...)` returns full details; `call_json(...)` is a drop-in for the legacy `call_model(system_prompt, payload) -> dict` pattern and raises `ValueError` on unparseable JSON (matches the old behavior).
    - **Agent rewire**: `agents/{analyst,outbound,inbound,routing,research}.py` all had their `call_model()` bodies replaced — no more direct `Anthropic()` instantiation. Each passes a meaningful `task_type` (e.g. `draft_outbound:cold_outreach`, `classify_inbound`, `route_email`, `compose_pitch_pack`, `research_with_web_search`) and context dict (contact_id, artist_slug, thread_id, etc.) so we can slice cost analytics by task. Dual-import fallback (`from .model_router` → `sys.path` shim → `from agents.model_router`) so scripts running `python agents/outbound.py` work the same as `python -m agents.outbound`.
    - **UI**: `/dashboard/costs` (linked from nav) shows 30d cost / call count / avg-per-call / error count KPIs, a 30-day sparkline of daily spend, the per-agent summary table (Phase-1 downgrade shortlist, sorted by pct_of_spend), and the full tenant × agent × model breakdown. Graceful empty state if the view doesn't exist yet.
    - **CLI**: `scripts/model_spend_report.py --days 30 [--agent outbound] [--tenant ...]` prints the same summary for terminal consumption. Phase-1 hint at the bottom names the top-cost agent as the first Haiku eye-test candidate.
    - **Env**: `.env.example` documents the `DBA_MODEL_*` overrides. Tier-A-floor agents silently revert if the override tries to downgrade.

15. **Migration 0015 — offer radius audit** (`migrations/0015_offer_radius_audit.sql` + `app/app/offers/[id]/{page,actions,server-actions}.{tsx,ts}`)
    - **DB layer**: `v_offer_radius_conflicts` (one row per in-flight offer × conflicting locked show, same-artist join, within `radius_days`, hybrid haversine/same-city check matching 0013), `v_offer_radius_audit` (rolled up per offer with worst severity: `hard_block` / `soft_warning` / `festival_exception` / `clear`), and `fn_offer_radius_check(p_offer_id uuid)` STABLE function returning `{severity, counts, nearest_miles, smallest_day_gap, top_conflicts[]}` as jsonb. Severity tiering: non-festival + both sides coded + inside radius = hard_block; non-festival + same-city fallback fired = soft_warning; festival on either side = festival_exception. Self-matches on `source_id` are excluded.
    - **UI layer**: `/offers/[id]` page calls `fn_offer_radius_check` via rpc (skipped for terminal statuses) and renders a `<RadiusAuditBanner>` above actions — red for hard_block, yellow for soft_warning, blue for festival_exception, hidden when clear. Shows conflict count, nearest miles, smallest day gap, and up to 3 top conflicts (locked venue, date, miles/same-city, gap, festival badge).
    - **Sign guard**: `signThomasAction` in `server-actions.ts` now calls `fn_offer_radius_check` before hitting `fn_offer_sign_thomas`. If severity = `hard_block`, refuses with an error message unless called with `{force: true}`. Client (`actions.tsx`) has a `signForceArmed` latch: first click on a hard-blocked offer surfaces the error and arms the override; the button label swaps to "sign anyway (override)" and a second click passes `force: true`. Other actions (generate memo, counter, deposit) are unchanged — the binding action is thomas-sign.
    - **Also fixed**: `scripts/seed_counter_drafts.py` no longer silently defaults `artist_slug` to `"dirtysnatcha"` when the offer row's value is missing — raises RuntimeError instead (multi-artist safety ahead of #34).

14. **Migration 0014 — agent workload views** (`migrations/0014_agent_workload.sql`)
    - `v_agent_workload`: one row per **in-flight** offer (status NOT in declined/withdrawn/expired/deposit_received), tagged with `source_label` ('AB'/'PRYSM'/'Other agent'/'Direct'/'Manual'/'Gigwell'), relayer info (`relayed_by_contact_id`, relayer_name, relayer_email), underlying promoter info, primary-contact info, and `days_since_update` (so Thomas can spot stalled pitches at a glance — "AB has been sitting on this 40 days").
    - `v_agent_workload_summary`: rolled up per (source × relayer × artist). Exposes `in_flight_count`, `awaiting_decision` (inbound/evaluating), `awaiting_counter_reply`, `awaiting_signature_or_deposit` (memo_sent/signed_by_thomas/fully_executed), `total_guarantee`, `total_net_to_artist`, `most_recent_movement_days`, `stalest_offer_days`, `stalled_over_21d`, and date range. Powers a future `/agents/workload` dashboard panel.
    - `v_agent_overlap`: **canary view** — self-join on `(artist_id, promoter_contact_id)` with `a.offer_id < b.offer_id` dedup and `a.source <> b.source` filter. Rows here = cross-agent double-pitching (AB and PRYSM both working the same promoter for the same artist). **Empty in normal operation.** Non-empty = Thomas needs to decide which agent continues before we seed more outbound on either side.
    - `fn_agents_working_promoter(p_artist_id uuid, p_contact_id uuid)` STABLE function returning (source, source_label, relayer_name, in_flight_count). Checks `promoter_contact_id`, `primary_contact_id`, and `relayed_by_contact_id` — empty result = clear to send. This is the guard the outbound seeder should consult before firing on any contact (task #33 followup wiring).
    - Three sanity selects at the bottom: in-flight by source, summary per agent, overlap count (expects zero).

10. **Scored seeder** (`scripts/seed_q2_tier2_drafts.py`)
    - New funcs: `_top_factors`, `pull_scored_targets`, `apply_tier_diversity`. Uses `v_target_score` as primary source, dedupes to max-scoring artist per (contact, venue), role-gates, applies tier diversity floor (default insider=20,warm=30,cold=50), caps at `--total-cap` (default 250). Factor breakdown merged into `outreach_log.decision_trace.target_score` on draft write.
    - Legacy tier-cap path preserved behind `--legacy-rank`. If `v_target_score` is missing, falls back automatically with a `[warn]` line.
    - New CLI args: `--total-cap`, `--tier-floor`, `--score-threshold`, `--legacy-rank`.

11. **`/outreach/priorities` page** (`app/app/outreach/priorities/{page,row-actions,server-actions,actions}.{tsx,ts}`)
    - Ranked top-N table from `v_target_score`. Columns: artist · contact · venue · tier · score · factor sparkbars · top-3 factor labels · flags (vip/festival/radius exception/conflict) · action.
    - Filters: artist chips, tour chips, min score (0.3/0.5/0.7/any), limit (25/50/100/200), toggle to include radius-blocked rows.
    - **Festival exception candidates** panel pulls independently from `v_radius_exception_candidates` so it populates even under tight main-table filters.
    - **Radius-blocked** panel (opt-in via `include_blocked=1`) for false-positive review.
    - `OutreachNowButton` → `queueForOutreachAction` server action upserts a `tour_targets` row at priority=100 with `status='queued'` for the next seeder pass to pick up first. Does NOT send email directly — Thomas still reviews in `/drafts`.
    - Nav updated: `layout.tsx` now includes `/outreach/priorities`.

### Task #23 — Voyage embeddings + voice-sample retrieval (shipped this session)

- **Migration 0017** (`migrations/0017_voice_sample_retrieval.sql`) — adds HNSW index on `voice_samples.embedding` with `vector_cosine_ops` (falls back to IVFFlat if HNSW isn't available on the pgvector version), ships `fn_similar_voice_samples(query_embedding vector(1024), categories text[], recipient_role contact_role, match_count int)` returning top-K rows sorted by cosine distance with `(1 - distance) as similarity`, and `v_voice_sample_coverage` operational view so the backfill script can confirm corpus embedding coverage.
- **Voyage client** (`agents/embeddings.py`) — provider wrapper (no SDK dep, raw HTTP). `embed_texts(texts, model=, input_type=)` returns vectors + cost/latency summary. `embed_one(text)` for single-query use. `to_pgvector_literal(vec)` serializes a float list to the `[f1,f2,...]` pgvector string format the supabase-py client will accept on insert/update. `VOYAGE_CATALOG` with pricing (voyage-3-large $0.12/1M @ 1024 dims — matches schema — plus lite and code-3 for future). Built-in retry with exponential backoff for transient 429/5xx, fail-fast on 4xx auth. **Crucially, it logs every batch to the SAME `model_calls` ledger the chat router uses**, with `provider='voyage'`, `agent_name='embeddings'`. That keeps `/dashboard/costs` and `scripts/model_spend_report.py` honest — blended Anthropic + Voyage spend, not just chat.
- **Backfill script** (`scripts/embed_voice_samples.py`) — batches to 32 rows per Voyage call (well under the 120K-token ceiling), builds the embed string as `subject\n\nbody` (subject carries tonal cue), writes back via direct table update. Flags: `--all` / `--limit N` / `--batch-size N` / `--model` / `--dry-run`. Prints summary at the end with total tokens + cost.
- **outbound.py retrieval rewire** — `load_voice_samples()` now takes `pack_payload` + `email_type` kwargs. Composes a retrieval query from tier + role + contact + venue + market + artist (the tonal knobs that differentiate `cold_outreach` from `negotiation` samples in Thomas's corpus), embeds it with `input_type='query'` (different from the `'document'` used at backfill time — Voyage's recommended split), calls `fn_similar_voice_samples` RPC, returns rows with `_similarity` attached. Falls back silently to the legacy recency-only path when: VOYAGE_API_KEY unset, no embedded rows match filters, or the RPC errors (migration 0017 not applied yet). Every draft's `outreach_log.decision_trace.retrieval_mode` now stamps `'semantic'` or `'recency'` so we can audit per-draft which path fired. **This is deploy-safe** — shipping the code without running the backfill or migration 0017 won't break anything; the composer just runs on recency-only until embeddings are populated.
- **Ops-pending (not code):** (1) set `VOYAGE_API_KEY` in `app/.env.local` from voyageai.com/dashboard with a project-scoped key named `DBA-prod`, (2) apply migration 0017 via Supabase SQL editor, (3) run `python scripts/embed_voice_samples.py` once to backfill. After that, composer autoswitches to semantic on its next run.

## Active task (pick up here)

**Gmail OAuth + first real outbound (tasks #27, #28).** The intelligence layer is live, the composer knows counter-offer mode, the radius check uses real distance when coords exist. Still can't mail anything out until Gmail OAuth is wired. Get those creds plugged in, send one, watch it land.

Secondary: **create `deal-memos` Supabase Storage bucket** (task #49). Needed before any real deal memo PDF can upload — first real inbound offer will hit this.

Followup (autonomous-doable without Thomas): **coord backfill pass** for `venues.latitude` / `venues.longitude` to activate the haversine radius path at scale. Google Places text search over `venue.name` + `city` + `state` is the obvious cheapest lookup. Until that's done, 0013's same-city fallback keeps the current behavior.

Context & decisions from the last session:

### Intelligence-layer decisions that shipped (for reference)

- **Plain SQL view**, not materialized, not function. Promote to materialized only if reads get slow. (`v_target_score`)
- **One row per (tour_id, artist_id, contact_id, venue_id)** — every roster artist scored independently against every target. Seeder dedupes to max-scoring artist per (contact, venue).
- **Radius conflicts are TIERED** — non-festival inside window → score=0, surfaces on `v_radius_blocked_targets`. Festival inside window → keep score, flag `radius_exception_candidate=true`, surfaces on `v_radius_exception_candidates` so Thomas can pursue with AB.
- **Weights (locked)**: history 0.25, tier 0.15, recency 0.10, cap_fit 0.10, anchor 0.15, reply 0.15, genre 0.10. Sum = 1.00. `promoter_activity` factor omitted until #35 lands — add a factor column and rebalance when it does.
- **Seeder mode**: tier caps are now a FLOOR (guarantee at least N of each tier), not a ceiling. Overall cap via `--total-cap`.

### Open loops (no action needed, just remember)

- **Task #50**: still owe Thomas a backfill of `dsr_standard_deal_terms` from Colton's historical Prysm threads. Current values are industry-norm guesses + Thomas's stated 50/10 deposit prefs. OK for now but flag any deal where the override % diverges.
- ~~**Task #51**~~: DONE this session. `prompts/outbound_composer.md` now has an explicit counter_offer mode section: payload shape, content rules (name counter once, never reveal min/walk-away, close with one concrete next step, never apologize), two worked examples (warm tier with rationale from notes, insider tier with naked number), `counter_target_named` echo field for validation, and `counter_no_rationale`/`counter_number_drift` flags. `agents/outbound.py` already dispatches the synthetic pack correctly — no runner changes needed.
- **Task #49**: Thomas still needs to manually create the `deal-memos` Supabase Storage bucket (service role can't create buckets in Supabase Cloud). Deploy blocker when first memo PDF gets generated.
- ~~**Task #33**~~: DONE this session. `migrations/0014_agent_workload.sql` ships `v_agent_workload` / `v_agent_workload_summary` / `v_agent_overlap` + `fn_agents_working_promoter()`. **Seeder wiring is now live**: `scripts/seed_q2_tier2_drafts.py` pulls `pull_agent_workload_blocks(sb)` once per run (selecting from `v_agent_workload` where source in agent_ab/agent_prysm/agent_other) and `pull_scored_targets()` drops any (artist_id, contact_id) in the block set, logs the filtered count. Graceful-degrades to no-block when the view is missing. **Still nice-to-have**: a dashboard panel at `/agents/workload` reading from `v_agent_workload_summary` so Thomas can see at a glance what each agent is currently pitching.
- **Task #35**: `promoter_activity` monitor. When this lands, add a factor column to `v_target_score` and rebalance weights.
- **Task #61**: Deal memo Licensor name fix — `app/lib/deal-memo.ts` must sign as **"Leigh Bray aka DirtySnatcha"**. Confirm "aka" vs "p/k/a" with Thomas.
- **Task #62** (new): Backfill `venues.is_festival` manually. Migration 0011's heuristic (names containing festival/fest/grounds/fairgrounds) is intentionally conservative — Thomas will need to flip some flags by hand (e.g. Red Rocks, Fox Theater-style venues that aren't festivals but might match name patterns, or festivals with non-obvious names).
- **Task #63** (in progress): Migration 0013 is written — adds `venues.latitude`/`longitude`, a plain-SQL `fn_miles_between(lat1,lng1,lat2,lng2)` haversine helper (no PostGIS dependency), and rebuilds `v_locked_shows` + `v_target_score` with a hybrid radius check. When both candidate and locked-show venues have coords, it uses distance ≤ `radius_miles` (from `dsr_standard_deal_terms`). When either side is uncoded, it falls back to same-city so coverage doesn't regress during backfill. `factor_breakdown` now records `radius_check_method` (`haversine` / `same_city` / null) + `miles_to_nearest_conflict` so `/outreach/priorities` can show which method flagged each conflict. **Still needed**: a one-time Google Places coord backfill on the `venues` table to unlock the haversine path at scale.
- **Task #64** (new): Audit tier-diversity defaults once the seeder runs on real inventory. Current floors (insider=20, warm=30, cold=50, total=250) are a guess.

## Don't re-do (dead ends from previous sessions)

- **Do not re-read the Gmail 30k-token dump.** It eats the context budget and we already have what we need. Migration 0009 was written from Thomas's stated prefs + industry norms. If we need Colton-specific terms, task #50 is the path, not a re-read.
- **Do not build a separate `contracts` table.** Offers ARE contracts (0009). Any temptation to split them out means you're missing context — re-read `CLAUDE.md`.
- **Do not hardcode `artist_slug = 'dirtysnatcha'`.** Multi-artist is coming (#34). All new views/scoring must respect `artist_id` as a dimension.

## Checkpoint / handoff protocol

When Thomas says "checkpoint" or "end of session":
1. Update **Last completed** above with what we shipped
2. Update **Active task** with the next concrete step
3. Update **TASKS.md** — mark anything done with `[x]`, add new tasks discovered this session
4. Commit all three files with a message like `checkpoint: <one-line summary>`
5. Confirm the update to Thomas before session closes
