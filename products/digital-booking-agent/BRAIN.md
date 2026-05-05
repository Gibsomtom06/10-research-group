# DBA — BRAIN

Current architectural state of Digital Booking Agent. This is what's *true right now*, not what's *required* — the operating rules live in `CLAUDE.md`.

Update this whenever a migration ships or an architectural decision changes which path Claude should take.

---

## Where the system lives

- App code: `app/` (Next.js 15, App Router)
- Background: `workers/*.ts` (Node — bounce handler, freshness sweep, reminder sweep, follow-up queue), `agents/*.py` (Python — supervisor, analyst, inbound, outbound, routing, research, reporting), `scripts/*.py` (seeders, importers, preflight)
- DB: shares the **TENx10** Supabase project `ocscxqaythiuidkwjuvg`. The old standalone DBA project `erwlfjlgrrfuqnjzitor` is dead — ignore it. Migration `0018_dba_into_tenx10.sql` merged DBA tables into the TENx10 schema.
- PDFs: `pdf-lib` (pure JS), generated via `app/lib/deal-memo.ts`, stored in Supabase Storage bucket `deal-memos` (10-year signed URLs).

## Migration status (highlights — full list in `migrations/`)

- `0009` — eliminated separate contract pipeline. Offers ARE contracts. See `docs/DOMAIN_MODEL.md`.
- `0010 → 0012` — agent relays (AB Touring, PRYSM). 0010 used wrong PRYSM domain; 0012 backfilled correct `@prysmtalentagency.com`.
- `0011` — `v_target_score` outreach ranking view (composite probability-to-book, 7-factor weighted).
- `0013` — radius check went hybrid: real haversine via `fn_miles_between()` when both venues coded, same-city fallback otherwise. `factor_breakdown.signals.radius_check_method` reports which path fired. Once venue coords are backfilled, the same-city fallback becomes dead code — do not re-approximate before then.
- `0014` — agent-workload gate. `scripts/seed_q2_tier2_drafts.py` auto-pulls `pull_agent_workload_blocks()` and drops `(artist_id, contact_id)` matches with `[info] agent-workload gate filtered N …` log line. Graceful-degrades if `v_agent_workload` missing. `v_agent_overlap` is the canary: rows means cross-agent double-pitching is happening.
- `0015` — radius audit on inbound. Every in-flight offer audited against `v_locked_shows` via `fn_offer_radius_check(offer_id)`. Severity: `hard_block` > `soft_warning` > `festival_exception` > `clear`. `signThomasAction` refuses `hard_block` unless called with `{force: true}`. Two-click client override latch. Mirror this guard for any future server action that materially binds Thomas.
- `0016` — model routing layer. All Claude/OpenAI calls go through `agents/model_router::call_json` (or `run_agent_model`). Routing table in `agents/model_config.py::MODEL_ROUTING`. Tier-A floor: `outbound`, `supervisor`, `research` cannot be downgraded even via env override. Every call logged to `model_calls` table. `/dashboard/costs` reads `v_model_spend_agent_summary` + `v_model_spend_30d`. Phase-1 plan in `PRD_model_routing.md`: once top-2-by-cost agents have >14d data, run Haiku eye-test, then flip MODEL_ROUTING key.
- `0017` — voice-sample retrieval went semantic. `outbound.py::load_voice_samples()` prefers Voyage `voyage-3-large` (1024-dim, matches `voice_samples.embedding vector(1024)`) + `fn_similar_voice_samples` pgvector cosine RPC. Silent fallback to recency-only when `VOYAGE_API_KEY` unset / no embedded matches / RPC error. Every draft's `outreach_log.decision_trace.retrieval_mode` stamps `semantic` vs `recency`. Voyage logged to `model_calls` under `provider='voyage'`. Backfill via `scripts/embed_voice_samples.py`; coverage check via `v_voice_sample_coverage`. `input_type='query'` at retrieval, `'document'` at backfill.
- `0018` — DBA → TENx10 Supabase merger. DBA tables added alongside TENx10's existing schema. The `offers` table is currently a STUB VIEW returning zero rows — pass 2 will replace with a real view over `deals`. TENx10's `contacts` got compat columns `full_name` (generated from `name`) + `timezone`.
- `0025` — outreach v2 schema (threads + pitches). Latest as of 2026-05-04.

## Outreach selection: score-first, not tier-first

`v_target_score` (migration 0011) ranks every (artist × contact × venue × tour) combo. Composite weights: history 25, tier 15, recency 10, cap_fit 10, anchor 15, reply 15, genre 10. The tier filter is still a factor (weight 0.15) but it's no longer the routing key. `scripts/seed_q2_tier2_drafts.py` default mode pulls from `v_target_score` with tier-diversity floor; legacy fallback: `--legacy-rank`. Factor breakdown gets stamped into `outreach_log.decision_trace` for audit.

## Counter-offer composer

Live since the post-0011 era. `prompts/outbound_composer.md` has a dedicated `counter_offer` mode. Wire: `agents/outbound.py --from-counter-payload` + `DBA_COUNTER_PAYLOAD` env var. Tier still drives voice; mode drives content shape. **Never reveal `counter_min` / `counter_walk_away` in the body.**

## Open architectural debts

- Radius enforcement: any new offer in the radius window of an existing locked show needs a flag. Task #30.
- Agent workload coordination: don't step on AB / PRYSM toes. Task #33.
- Multi-artist generalization: WHOiSEE, Dark Matter, Kotrax all need the same pipeline. Don't hardcode `artist_slug = 'dirtysnatcha'`. Task #34.
- Standard deal terms: backfill from Colton (PRYSM) email threads once parsed. Task #50.
- PRYSM transition: being phased out via Adobe Sign "DirtySnatcha_Prysm_Mutual_Transition_and_Release". Treat PRYSM relays as legacy.

## Roster scope (v1 → vN)

First tenant is **DSR / DirtySnatcha** (Thomas, legal name **Leigh Bray**). Full roster to eventually serve: WHOiSEE (Brett, NC, Circus Records UK), Dark Matter (Chicago/Knoxville, Wakaan), Kotrax (7 DSR tracks). Multi-artist scope is task #34. See `HANDOFF.md` for the 14 booked 2026 DirtySnatcha shows that drive the radius / routing math today.

## Contracts — the legal name trap

The Licensor on any DSR deal memo must be **"Leigh Bray aka DirtySnatcha · Licensor"**. That's Thomas's actual legal signing identity. Fixed in `app/lib/deal-memo.ts` on 2026-04-22 — was previously the double-wrong "Thomas Clay · DirtySnatcha Records". Do not regress.
