# DBA — Digital Booking Agent

Autonomous booking system for **TENx10** (10 Research Group, Thomas Nalian's artist management company — https://tenx10.co · platform source at `../tenx10-platform/`). Full roster to eventually serve: **DirtySnatcha** (Thomas, legal name Leigh Bray), **WHOiSEE** (Brett, NC, Circus Records UK), **Dark Matter** (Chicago/Knoxville, Wakaan), **Kotrax** (7 DSR tracks). First tenant is DSR; multi-artist scope is task #34. Automates the full booking workflow end-to-end: inbound offer triage, outbound prospecting, deal-memo generation, signature tracking, deposit tracking.

**Important for contracts**: the Licensor on any DSR deal memo must be **"Leigh Bray aka DirtySnatcha · Licensor"** — that's Thomas's actual legal signing identity (fixed in `app/lib/deal-memo.ts` on 2026-04-22, was previously the double-wrong "Thomas Clay · DirtySnatcha Records").

**This is the project memory file. Read it at the start of every session before touching code.**
**Then read `docs/SESSION_STATE.md` for what we're actively working on.**
**Then read `TASKS.md` for the open backlog.**

---

## Stack

- **App**: Next.js 15 App Router, React 19 server components, TypeScript, Tailwind
- **DB**: Supabase Postgres (service role from server), RPC functions, views, enums, generated columns
- **Workers**: Node/TS (`workers/*.ts`) — bounce handler, freshness sweep, reminder sweep, follow-up queue
- **Agents**: Python (`agents/*.py`) — supervisor, analyst, inbound classifier, outbound composer, routing, research, reporting
- **Scripts**: Python (`scripts/*.py`) — seed drafts, import contacts, preflight
- **PDFs**: `pdf-lib` (pure JS, no native deps) — generated via `app/lib/deal-memo.ts`
- **Storage**: Supabase Storage bucket `deal-memos` with 10-year signed URLs

## Repo layout

```
digital-booking-agent/
├── CLAUDE.md                    ← you are here
├── docs/SESSION_STATE.md        ← active work, updated end of each session
├── TASKS.md                     ← open backlog
├── PRODUCT_BRIEF.md, PHASE_0_PLAYBOOK.md, DEPLOYMENT.md, ANALYST_AGENT.md
├── migrations/NNNN_*.sql        ← numbered, idempotent (do $$ ... exists checks), re-runnable
├── app/
│   ├── lib/supabase.ts          ← serverClient() — service role
│   ├── lib/deal-memo.ts         ← PDF generator
│   └── app/{dashboard,contacts,markets,outreach,drafts,reminders,reports,offers}/
├── agents/
│   ├── supervisor.py analyst.py inbound.py outbound.py routing.py research.py reporting.py
├── scripts/
│   ├── seed_*.py import_*.py preflight.py
├── prompts/*.md                 ← LLM prompts by role
├── workers/*.ts                 ← cron/background
└── GEMINI_HANDOFF.md            ← older handoff, legacy
```

## Core domain model

### Offers ARE contracts
Migration 0009 eliminated a separate contract-ingest pipeline. An offer row holds the entire contract lifecycle.

**Offer lifecycle states** (`offer_status` enum):
`inbound` → `evaluating` → `countered` → `memo_sent` → `signed_by_thomas` → `fully_executed` → `deposit_received`
(plus `declined`, `withdrawn`, `expired`)

Also: `inbound` → `declined` directly on pass.

**Kanban** at `/offers`: 6 columns mirror the lifecycle — new, negotiating, awaiting my sig, awaiting promoter sig, awaiting deposit, locked.

### Agent relays (migration 0010, fixed in 0012)
Offers don't always come direct from promoter. Thomas has agents who relay:
- **Andrew Bass / AB Touring** → `source = 'agent_ab'` (active primary, andrew@abtouring.com)
- **Colton Anderson @ PRYSM Talent Agency** → `source = 'agent_prysm'` (emails ending **@prysmtalentagency.com** — 0010 mistakenly used @prysmagency.com; 0012 re-backfills with the correct domain). **LEGACY** — PRYSM is being transitioned out via Adobe Sign "DirtySnatcha_Prysm_Mutual_Transition_and_Release".
- **Other agents** → `agent_other`
- **Direct** → `direct_promoter`
- **Manual / gigwell_import** → legacy

Routing model:
- `contact_id` = primary reply-to (whoever emailed us)
- `relayed_by_contact_id` = the agent, if relayed
- `promoter_contact_id` = underlying promoter, optional
- `reply_to_contact_id` = override if Thomas wants us to cc the promoter anyway
- `fn_offer_reply_to(offer_id)` resolves to `coalesce(reply_to, relayed_by, contact_id)`

Commission: `agent_commission_pct` (default 10% for AB/PRYSM via `dsr_standard_deal_terms`).
`net_to_artist` is a **generated column** = `guarantee * (1 - agent_commission_pct/100.0)`. Use this, not `guarantee`, for anything user-facing about what Thomas actually takes home.

### Standard deal terms (view: `dsr_standard_deal_terms`)
Refresh this view anytime the defaults change. Current values:
- `deposit_pct_default = 50`, minimum 10
- `deposit_due_days = 30`
- `override_pct = 85` (of gross after expenses)
- `radius_miles = 75`, `radius_days = 30` before / `30` after
- `hospitality = 'standard'`
- `sound_lights = 'promoter_provided'`
- `cancellation = 'force_majeure'`
- `travel_provided = true`, `lodging_provided = true`
- `agent_commission_pct_default = 10`

⚠️ These were set from Thomas's stated prefs + industry norms for mid-tier headliner. Task #50 in TASKS.md: backfill from Colton threads once we've parsed them.

### Lifecycle RPCs
- `fn_offer_sign_thomas(offer_id)` — stamps `signed_at_thomas`, advances status
- `fn_offer_sign_promoter(offer_id)` — stamps `signed_at_promoter`, advances to `fully_executed`
- `fn_offer_record_deposit(offer_id, amount, method)` — stamps `deposit_received_at`, advances to `deposit_received`

### View: `v_offer_contract_status`
Pre-computes lifecycle flags: `is_new`, `is_negotiating`, `needs_thomas_sig`, `needs_promoter_sig`, `awaiting_deposit`, `is_locked`, `is_relayed`, `days_until_show`, plus all the key columns with `net_to_artist`. Use this view for kanban reads; raw `offers` table for writes.

## Conventions

### Migrations
- Numbered `NNNN_description.sql`, zero-padded
- **Always idempotent** — `do $$ begin if not exists ...`, `create ... if not exists`, `add column if not exists`
- Safe to re-run
- Include a sanity query at the bottom (`select 'info:' ..., count(*)`)

### Supabase joins — disambiguate FKs
When a table has multiple FKs to the same target, use the `!fkey_name` syntax:
```ts
.select(`id, status,
  contact:contacts!offers_contact_id_fkey(full_name, email),
  relayed_by:contacts!offers_relayed_by_contact_id_fkey(full_name, email),
  promoter:contacts!offers_promoter_contact_id_fkey(full_name, email)`)
```
Without the `!fkey` hint, Supabase errors "could not embed because more than one relationship was found."

### Next App Router
- Server components by default (`app/app/**/page.tsx`)
- Mark with `export const dynamic = "force-dynamic"` for live data pages
- Client components only when needed: forms with `useTransition`, interactive widgets — file them as `row-actions.tsx` / `actions.tsx` / `notes-client.tsx` next to the page
- Server actions in `server-actions.ts` — always call `revalidatePath()` after mutation
- No `localStorage`/`sessionStorage` — artifacts-era rule, not relevant here but worth keeping the habit

### Styling
- Tailwind. Design tokens: `bg-white/[0.02]` for cards, `bg-white/[0.03]` for hover-lighter, `text-accent` (cyan-ish), `text-muted`.
- Lowercase UI labels — matches Thomas's aesthetic (all the `<h1 className="text-2xl">offers</h1>` etc.)
- Compact info density — this is a workbench, not a SaaS landing page.

### Python agents
- Entry: `agents/outbound.py`, `agents/inbound.py`, etc.
- Composer takes `--pitch-pack` file path OR `--from-counter-payload` (reads `DBA_COUNTER_PAYLOAD` env var JSON)
- `synthetic_pack_from_counter(payload)` lets us skip the analyst pass when we already know what to say
- All agents log to `outreach_log` table via service-role Supabase client

### Scripts
- Always importable AND runnable (`if __name__ == "__main__"`)
- Idempotency guards on anything that writes drafts (check `outreach_log` for fresh timestamps)
- Use `rich` for CLI output where installed

## Deal memo PDF generation

`app/lib/deal-memo.ts`:
- US Letter 612x792, `PdfWriter` class with `section/kv/paragraph/spacer`
- `STANDARD` constant mirrors `dsr_standard_deal_terms`
- Signature block: Thomas (Licensor) + Promoter (Licensee) with date lines
- Uploads to Supabase Storage bucket `deal-memos`, falls back to `/tmp` writeLocal
- Returns `{ url, generatedAt }`
- If the bucket doesn't exist, deploy step: `supabase storage create deal-memos --private`

## Outreach flow (score-ranked, post-0011)

1. `v_target_score` view (migration 0011) ranks every (artist × contact × venue × tour) combo by composite probability-to-book — weights: history 25, tier 15, recency 10, cap_fit 10, anchor 15, reply 15, genre 10
2. Radius conflicts: hard zero for non-festival, `radius_exception_candidate` flag for festival venues (shown on `/outreach/priorities` festival panel)
3. `scripts/seed_q2_tier2_drafts.py` default mode pulls from `v_target_score` with tier-diversity floor; legacy fallback: `--legacy-rank`. Factor breakdown gets stamped into `outreach_log.decision_trace` for audit.
4. `agents/outbound.py` → analyst generates pitch pack → composer drafts email → writes to `email_drafts` table
5. `/drafts` UI: Thomas reviews, clicks send, worker pushes via Gmail
6. `/outreach/priorities` UI: Top 50 by score with factor sparkbars, top-3 contribution labels, VIP/festival/radius flags, "outreach now" button that upserts `tour_targets` with priority=100 so the next seeder run pulls it out-of-band

## Counter-offer flow

1. Thomas clicks "counter" on `/offers/[id]`, fills target/min/walk-away
2. `sendCounterAction` updates `counter_bounds`, bumps status to `countered`, doesn't auto-send
3. `scripts/seed_counter_drafts.py` watches for status='countered' with fresh bounds, builds counter payload with tone_hint
4. Subprocesses `agents/outbound.py --from-counter-payload` with `DBA_COUNTER_PAYLOAD` env var
5. Draft appears in `/drafts` for Thomas to review

## Environment / secrets

- `.env` at `app/.env.local` and `workers/.env`
- Supabase URL + service role key
- Gmail OAuth creds (tasks #27 #28)
- Model router (task #21): local Ollama for cheap paths, API for the rest

## Things to never forget

- **Voice rules that the composer MUST respect (locked 2026-04-23 from Thomas's feedback on the first real draft):**
  1. **No dashes as pause-construction.** Em-dash (—), en-dash (–), AND spaced hyphen ( - ) used for pause between clauses are all banned. "X - whichever works" reads AI instantly. Restructure into two sentences or a comma. Only legal hyphens: compound words and date ranges.
  2. **Deal-structure is per-artist, not universal.**
     - **DirtySnatcha (`dirtysnatcha`)**: NEVER lead with door split. Guarantee-first, small base + override (bonus). Offer flexibility on the number, not the structure.
     - **Dark Matter, Kotrax**: door splits OK market-dependent. Prefer guarantee-first for warmer markets (Denver, Chicago, LA); door splits fine for smaller markets or relationship-building venues.
     - **Others**: guarantee-first default.
     - Never phrase money as "X or Y, whichever works on your side" — that hands negotiation to the buyer. Pick a lead shape, offer to discuss the number.
  3. **Date specificity on touchback.** When referencing a past conversation/hold, name the concrete month or date ("November hold", "the 11/21 date"). Never "that Q4 hold". Quarter-naming is ONLY acceptable for future/speculative windows that haven't been pinned ("routing Q2 2026").
  - Source of truth: `prompts/outbound_composer.md` §"Universal hard rules" rules 1-3. Any change here must update there too.
- **Offers ARE contracts.** No separate contracts table. Ever.
- **`net_to_artist`, not `guarantee`** for anything Thomas-facing about take-home.
- **Reply-to routing**: use `fn_offer_reply_to()` or the `coalesce(reply_to, relayed_by, contact_id)` pattern. Don't assume `contact_id` is the promoter.
- **`!fkey_name`** when joining contacts multiple ways.
- **Radius enforcement** — any new offer in the radius window of an existing locked show needs a flag. Task #30.
- **Agent workload** — don't step on AB/PRYSM toes. Task #33.
- **Multi-artist** — WHOiSEE, Dark Matter, Kotrax all need the same pipeline. Don't hardcode `artist_slug = 'dirtysnatcha'`. Task #34.
- **AB Touring, not AB Talent** — the agency name had been miscaptured in older memory.
- **PRYSM email domain is @prysmtalentagency.com** — NOT @prysmagency.com. Migration 0010 made that mistake; 0012 fixes it.
- **Score-first, not tier-first** — v_target_score drives outreach priority. The tier filter is still a factor (weight 0.15) but it's no longer the routing key.
- **Radius check is hybrid (post-0013)** — uses real haversine distance via `fn_miles_between()` when both candidate and locked-show venues have coords, same-city fallback when either is uncoded. `factor_breakdown.signals.radius_check_method` reports which path fired. Once venue coords are backfilled, the same-city fallback becomes dead code. Do not re-approximate.
- **Counter-offer composer branch is live** — `prompts/outbound_composer.md` has a dedicated counter_offer mode. `agents/outbound.py --from-counter-payload` + `DBA_COUNTER_PAYLOAD` env is the only wire. Tier still drives voice; mode drives content shape. Never reveal `counter_min` / `counter_walk_away` in the body.
- **Agent workload gate (post-0014)** — `scripts/seed_q2_tier2_drafts.py` now **auto-enforces** this: pulls `pull_agent_workload_blocks(sb)` from `v_agent_workload` (filtered to agent_ab / agent_prysm / agent_other, in-flight only) once per run, builds `(artist_id, contact_id)` block set, and `pull_scored_targets()` drops any matching pair with `[info] agent-workload gate filtered N …` log line. Graceful-degrades if the view is missing. For any ad-hoc outbound script / one-off, still check `fn_agents_working_promoter(artist_id, contact_id)` manually before sending. `v_agent_overlap` is the **canary** — if it has rows, cross-agent double-pitching is already happening and Thomas needs to pick one. In-flight = NOT terminal (declined/withdrawn/expired/deposit_received).
- **Radius audit on inbound (post-0015)** — every in-flight offer gets audited against `v_locked_shows` via `fn_offer_radius_check(offer_id)`. Severity ladder: `hard_block` (non-festival, both sides coded, inside radius) > `soft_warning` (same-city fallback fired; venues lack coords) > `festival_exception` (festival overlap) > `clear`. `signThomasAction` **refuses hard_block** unless called with `{force: true}` — client has a two-click override latch. For any new server action that materially binds Thomas (future e-sign integration, offer-lock RPC, etc.), mirror this guard. Soft_warning and festival_exception render the banner but don't block signing.
- **No silent artist_slug fallbacks** — `scripts/seed_counter_drafts.py` now raises rather than defaulting to `"dirtysnatcha"` when the offer row is missing `artist_slug`. Any new script / route / agent that touches multi-artist data MUST do the same. A missing artist_slug is a data bug, never a routing default.
- **Model routing (post-0016)** — NEVER instantiate `Anthropic()` directly inside an agent. Use `from agents.model_router import call_json` (or `run_agent_model` for the full response dict). The router:
  • routes each `agent_name` through `agents/model_config.py::MODEL_ROUTING` (one line per agent),
  • enforces the Tier-A floor — `outbound`, `supervisor`, `research` can't be downgraded even via `DBA_MODEL_<AGENT>` env override,
  • logs every call into the `model_calls` table (`provider`, `model_id`, tokens, cache tokens, `cost_usd`, `latency_ms`, `success`, `context` jsonb),
  • fails loud: unparseable JSON raises `ValueError`, provider errors re-raise after logging `success=false`.
  `/dashboard/costs` reads `v_model_spend_agent_summary` + `v_model_spend_30d`; terminal equivalent is `python scripts/model_spend_report.py`. Phase-1 plan: once the top-2-by-cost agents show >14d of data, run the Haiku eye-test (PRD_model_routing.md §Phase 1), then flip their MODEL_ROUTING key.
- **Voice-sample retrieval (post-0017)** — `outbound.py::load_voice_samples()` now prefers **semantic retrieval** via Voyage `voyage-3-large` (1024 dims, matches `voice_samples.embedding vector(1024)`) + `fn_similar_voice_samples` pgvector cosine RPC. Silent fallback to the legacy recency-only path when `VOYAGE_API_KEY` is unset, no embedded rows match filters, or the RPC errors — so shipping before the backfill is safe. Every draft's `outreach_log.decision_trace.retrieval_mode` stamps `semantic` vs `recency` for audit. The Voyage client (`agents/embeddings.py`) logs every batch to the shared `model_calls` ledger under `provider='voyage'`, `agent_name='embeddings'` — `/dashboard/costs` shows blended Anthropic + Voyage spend, not just chat. Use `scripts/embed_voice_samples.py` to backfill / re-embed; `v_voice_sample_coverage` confirms corpus coverage per category. At retrieval time pass `input_type='query'`; at backfill pass `input_type='document'` (Voyage's recommended split). Never re-invent the query-text builder inline — use `_build_retrieval_query(pack_payload, email_type, role)` or edit it in one place.
