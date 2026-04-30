# DBA — Tasks

Open backlog. Read this third, after `CLAUDE.md` and `docs/SESSION_STATE.md`.

Format: `[ ]` open, `[x]` done, `[~]` in progress, `[!]` blocked. Task number is stable — don't renumber.

---

## Active / near-term

- [~] **#14** Ingest active promoter contacts from Gmail OFFERS/* labels.
- [~] **#24** Load real promoter/booker contacts.
- [~] **#27** Wire Gmail OAuth for sender worker.  **Code: 100% done (`workers/sender.ts` has OAuth + refresh, quiet hours, 25/d cap, HMAC click redirect, 1x1 pixel, multipart/alternative MIME). Remaining: credential provisioning only — run `scripts/gmail_oauth_setup.py` (added 2026-04-22) after Google Cloud Console bootstrap (see `docs/GMAIL_OAUTH_SETUP.md`). `workers/.env` template now populated; `app/.env.local` has `NEXT_PUBLIC_TRACK_BASE` + `TRACKING_SECRET` live.**
- [ ] **#28** First real outbound email end-to-end.  **← depends on #27 credentials being pasted in**
- [ ] **#49** Create Supabase Storage bucket `deal-memos` (blocks first memo PDF).
- [ ] **#50** Backfill `dsr_standard_deal_terms` from Colton / Prysm threads — current values are industry-norm guesses.
- [x] **#51** Update `prompts/outbound_composer.md` with counter_offer mode branch.
- [ ] **#62** Backfill `venues.is_festival` manually — 0011 heuristic is conservative (only matches name patterns).
- [~] **#63** Add `latitude`/`longitude` to `venues` and replace same-city radius approximation with real 75-mi distance check. **← migration 0013 written, venues still need coord backfill (Google Places pass) to unlock the haversine path**
- [ ] **#64** Audit tier-diversity defaults (insider=20, warm=30, cold=50, total=250) once seeder runs on real inventory.

## Platform / infra

- [ ] **#19** Set up Ollama + Continue.dev for local model paths.
- [ ] **#20** Bump Next 15.0.0 → 15.2.3+.
- [~] **#21** DBA token meter + model router — **Phase 0 shipped** (migration 0016 `model_calls` + `v_model_spend_*` views, `agents/model_config.py` tiered routing with Tier-A floor, `agents/model_router.py` wraps every `call_model` call, `/dashboard/costs` UI, `scripts/model_spend_report.py` CLI). Phase 1 (Haiku eye-test on top-2-by-cost agents) pending — needs 14d of prod data first.
- [~] **#23** Wire Voyage embeddings client — **code shipped**. `agents/embeddings.py` (Voyage client + `model_calls` logging under `provider='voyage'`, `agent_name='embeddings'`), `scripts/embed_voice_samples.py` (batch backfill), migration 0017 (HNSW index on `voice_samples.embedding`, `fn_similar_voice_samples` cosine RPC, `v_voice_sample_coverage` view), and `agents/outbound.py::load_voice_samples` rewritten to prefer semantic retrieval with silent recency fallback + `decision_trace.retrieval_mode` stamped on every draft. **Ops-pending:** set `VOYAGE_API_KEY` in `.env.local`, apply 0017, run backfill. Until backfill runs, composer transparently falls back to recency — no functional regression.

## Intelligence / growth

- [x] **#30** Radius clause audit — flag any new offer inside 75mi/30d of a locked show. (migration 0015 + banner on `/offers/[id]` + sign-as-thomas server-action hard-block guard with two-click override).
- [ ] **#31** Reverse-research promoters for existing-bill fit (who's booked adjacent to us, who hasn't).
- [ ] **#32** Ingest Talent Buyer & Promoter Database.
- [x] **#33** Capture agent workload to avoid stepping on AB/PRYSM toes — `v_agent_workload` view (migration 0014).
- [ ] **#34** Multi-artist scope — WHOiSEE + AB roster. Remove any `artist_slug = 'dirtysnatcha'` hardcodes.
- [ ] **#35** Promoter activity monitor — IG posts, lineup drops, site scrapes into `promoter_activity`.

## Product / scope

- [ ] **#10** Scope second 10 Research Group product for Rim Shop.

## Demo / sales (new)

- [x] **#66** `demo.html` — self-contained single-page demo using real tailwind tokens (bg #0b0b0c, accent #39ff14, mono, lowercase). Scroll-through of 5 aha moments: priorities ranking with sparkbar factor breakdown, offers kanban (6 columns), counter-offer drafter showing red-value non-leakage, radius audit hard-block banner + agent-workload gate + festival exception + licensor lock, and tracking stats + learning loop. Closes with side-by-side vs gigwell/artery/muzeek. Double-click to open, no supabase required. Saved at repo root.
- [x] **#67** `scripts/gmail_oauth_setup.py` — one-time InstalledAppFlow (scope: `gmail.send`, access_type=offline, prompt=consent) that reads `client_secret.json` from Google Cloud Console download, pops browser for consent, prints `CLIENT_ID` / `CLIENT_SECRET` / `REFRESH_TOKEN` block to paste into `app/.env.local` + `workers/.env`. Refuses to proceed if Google withholds refresh_token, with revoke-and-retry instructions.
- [x] **#68** `docs/GMAIL_OAUTH_SETUP.md` — step-by-step Google Cloud Console walkthrough (create project, enable Gmail API, OAuth consent screen in Testing with thomas@dirtysnatcha.com as test user, create Desktop-app OAuth client, download JSON, run setup script, dry-run verification flow). Explicit guidance on the "app isn't verified → Advanced" screen. Troubleshooting for missing refresh token and invalid_grant.
- [x] **#69** `workers/.env` populated (was 0 bytes) with full key template: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_OAUTH_*` placeholders, `SENDER_FROM_EMAIL=thomas@dirtysnatcha.com`, `SENDER_DRY_RUN=true`, `SENDER_POLL_INTERVAL_MS=30000`, `MAX_SENDS_PER_DAY=25`, `NEXT_PUBLIC_TRACK_BASE=http://localhost:3000`, `TRACKING_SECRET` (fresh 32-byte hex: `d9f8e79c…05268b`). Same `NEXT_PUBLIC_TRACK_BASE` + `TRACKING_SECRET` added to `app/.env.local` so the click-redirect route's `verifyClick()` HMAC matches what sender.ts signs with. Mismatch would 403 every click.

## Done (recent)

- [x] **#47** Migration 0009 — offers as contracts (lifecycle fields, RPCs, v_offer_contract_status).
- [x] **#48** `/offers` kanban UI (6 columns, filter-based).
- [x] **#55** Offer detail page + action buttons + server actions (sign, deposit, counter, memo).
- [x] **#56** Deal memo PDF generator (`app/lib/deal-memo.ts`) — pdf-lib, Supabase Storage upload.
- [x] **#57** Counter-offer drafter (`scripts/seed_counter_drafts.py` + `outbound.py` `--from-counter-payload`).
- [x] **#58** Migration 0010 — agent relays (source enum, relayed_by/promoter FKs, commission, net_to_artist generated column, fn_offer_reply_to).
- [x] **#59** Offers UI — net-to-artist display, source badges, relay & routing section.
- [x] **#60** Project memory scaffold — `CLAUDE.md`, `docs/SESSION_STATE.md`, `TASKS.md`.
- [x] **#52** Migration 0011 — booking intelligence (`v_target_score`, 8-factor composite scorer, festival-exception tiering, panel views `v_radius_blocked_targets` / `v_radius_exception_candidates`).
- [x] **#53** Scored seeder — `scripts/seed_q2_tier2_drafts.py` ranks by `v_target_score` with tier-diversity FLOOR; factor_breakdown logged into `outreach_log.decision_trace.target_score`; legacy path preserved behind `--legacy-rank`.
- [x] **#54** `/outreach/priorities` page — ranked table with sparkbar factor breakdown, festival-exception panel, blocked panel, "outreach now" queue button (upserts `tour_targets` at priority=100).
- [x] **#65** Migration 0012 — prysm email domain fix / agent_prysm backfill normalization.
- [x] **#51** `prompts/outbound_composer.md` — added counter_offer mode section (content rules, payload shape, 2 worked examples, `counter_target_named` echo field, new flags).
- [x] **Migration 0013** — `venues.latitude` / `venues.longitude` columns, `fn_miles_between()` haversine helper, `v_locked_shows` + `v_target_score` rebuilt with hybrid radius check (haversine when both sides have coords, same-city fallback otherwise). Adds `radius_check_method` / `miles_to_nearest_conflict` to factor_breakdown for audit.
- [x] **Migration 0014** — agent workload views. `v_agent_workload` (one row per in-flight offer tagged with relaying agent), `v_agent_workload_summary` (roll-up per agent × artist with counts + dollars + staleness), `v_agent_overlap` (canary: pairs of offers in flight with different agents against the same artist+promoter — empty in normal operation), and `fn_agents_working_promoter(artist_id, contact_id)` pre-outbound guard.
- [x] **Migration 0015** — offer radius audit. `v_offer_radius_conflicts` (one row per in-flight offer × conflicting locked show pair), `v_offer_radius_audit` (rolled up per offer with worst severity: hard_block / soft_warning / festival_exception / clear), and `fn_offer_radius_check(offer_id)` returning severity + counts + top-3 conflicts. Wired into `/offers/[id]` as a red/yellow/blue banner above actions; `signThomasAction` now refuses `hard_block` severity unless called with `{force: true}` (two-click override latch in the UI).
- [x] **seed_counter_drafts.py artist_slug bug** — removed silent `"dirtysnatcha"` fallback in `build_pitch_pack_payload()`; raises RuntimeError when offer.artist_slug is missing. Prevents cross-artist counter misrouting (multi-artist safety, part of #34).
- [x] **Migration 0016 + model router Phase 0** (#21) — `model_calls` ledger table + three rollup views (`v_model_spend_daily`, `v_model_spend_30d`, `v_model_spend_agent_summary`). `agents/model_config.py` holds the single source of truth for agent → model routing with per-agent env overrides, Tier-A floor enforcement, and a cost calculator. `agents/model_router.py` is the provider-agnostic `call_json()` / `run_agent_model()` wrapper — all 5 agents that hit Anthropic (analyst / outbound / inbound / routing / research) now route through it and log cost + tokens + latency + success to `model_calls`. `/dashboard/costs` + `scripts/model_spend_report.py` expose the ledger. `.env.example` documents the `DBA_MODEL_*` overrides.
- [x] **#22** VS Code multi-root workspace file (`10-research.code-workspace`) — folders for root / DBA / tenx10-platform, file associations, per-language formatters, recommended extensions, launch configs, tasks.
- [x] **Migration 0017 + Voyage embeddings client** (part of #23) — `voice_samples.embedding` nearest-neighbor retrieval. HNSW index (falls back to IVFFlat if HNSW unsupported), `fn_similar_voice_samples(query_embedding, categories, recipient_role, match_count)` cosine RPC returning top-K rows with `(1 - distance)` similarity, `v_voice_sample_coverage` operational view. `agents/embeddings.py` wraps Voyage `voyage-3-large` (1024 dims) + `voyage-3-lite` + `voyage-code-3` with retries, `to_pgvector_literal()` helper, and cost logging into the shared `model_calls` ledger (provider='voyage') so `/dashboard/costs` and `scripts/model_spend_report.py` see blended Anthropic + Voyage spend. `scripts/embed_voice_samples.py` backfills in 32-row batches. `agents/outbound.py::load_voice_samples` now takes `pack_payload` + `email_type`, builds a retrieval query from tier/role/contact/venue/market, embeds with Voyage, hits the RPC, and falls back to recency-only silently if Voyage isn't configured or no embedded rows match filters — every draft's `decision_trace.retrieval_mode` stamps which path won.
