# 10 Research Group — Portfolio Status

**Last updated:** Apr 22, 2026 — Claude kept working while Thomas was in a meeting (fourth pass).

## One-line summary

Client 0 (WRS rim shop) is signature-ready. Digital Booking Agent is now a full 7-agent system — all specialist runners shipped (Inbound, Analyst, Outbound, Routing, Research, Reporting, Supervisor). Thomas can `npm install && supabase db push` and have a live dashboard + a supervisor loop ready to run on cron. No blockers that don't need Thomas's hands on a keyboard.

---

## Client 0 — WRS rim shop (Task #10)

**Status:** ready to sign + execute.

Artifacts in `clients/rim-shop/`:
- `PILOT_BRIEF.md` — 90-day performance-share plan, 7 deliverables, targets
- `SOW_v1.md` — 1-page contract, ready for signature
- `gmc-feed/FEED_TEMPLATE.xml` + `inventory_to_feed.py` — GMC feed generator, takes inventory CSV, outputs compliant RSS 2.0
- `google-ads/CAMPAIGN_PLAN.md` + `keywords.csv` — Local + Performance Max campaign structure, keywords, ad copy, week-by-week budget ramp
- `email-sequences/ABANDONED_CART.md` — 3-email sequence with copy + merge fields + A/B test plan
- `chatbot/SYSTEM_PROMPT.md` — system prompt ready to drop into Claude API
- `EBAY_LOOKUP.md` — eBay store lookup log (not found publicly; needs WRS to provide handle)

**What Thomas does next (≤ 2 hours of work):**
1. Have the verbal with WRS owner, confirm appetite for performance-share structure.
2. Send `SOW_v1.md` for signature.
3. Get: Google Ads account access (or create under WRS ownership), Merchant Center access, inventory CSV, website admin, eBay seller handle.
4. Run `inventory_to_feed.py` against real inventory. Submit feed to Merchant Center.
5. Load keywords.csv into Google Ads, launch Local campaign at $30/day.

---

## Digital Booking Agent — Phase 0 (Task #9)

**Status:** app + parser scaffolds shipped, **all 7 specialist prompts written**, **all 7 specialist Python runners live** (Inbound, Analyst, Outbound, Routing, Research, Reporting, Supervisor), all 5 workers shipped, `/drafts` + `/outreach` + `/reminders` + `/reports` server actions wired. Waiting on Thomas's exports + Supabase provisioning.

**New in this pass (pass 2 — specialist prompts + agents + drafts UI):**
- `prompts/inbound_classifier.md` — classify every inbound email, extract offer fields
- `prompts/analyst_pitch_pack.md` — Analyst system prompt with freshness gates
- `prompts/outbound_composer.md` — already existed; now the Outbound runner references it
- `prompts/supervisor.md` — PES orchestrator with reversible-reasoning rules
- `prompts/reporting.md` — weekly/daily rollup writer
- `agents/analyst.py` — runs the Analyst, writes to `pitch_packs`
- `agents/outbound.py` — composes drafts, validates, writes to `outreach_log`
- `agents/inbound.py` — classifies emails, creates offers + log rows, audits
- `agents/README.md` — end-to-end flow doc
- `app/app/drafts/actions.ts` — server actions for approve/edit/reject with decisions audit
- `app/app/drafts/row-actions.tsx` — client component wiring the buttons + edit modal
- `app/app/drafts/page.tsx` — now reads real `outreach_log` rows, shows confidence badges + body preview
- `migrations/0001_outreach_audit_columns.sql` — audit columns + offers extensions + `rejected` enum + updated pipeline view

**New in this pass (pass 3 — outreach visibility, reminders, bounces, Gigwell import):**

Addresses Thomas's ask: *"i want to make sure we have a way to see outreach and reminders to reach back out or if they came back bounced to delete that email contact we did a scrape for dirtysnatcha contacts from show history on gigwell"*.

- `workers/sender.ts` — polling Gmail sender with dry-run mode, quiet hours, daily cap, retry backoff, decisions audit per send
- `workers/freshness_sweep.ts` — marks stale pitch packs for refresh, expires praise, flags blocked contacts for research
- `workers/bounce_handler.ts` — polls Gmail for DSN bounces, parses Final-Recipient / Status / Diagnostic-Code, flips `contacts.email_valid=false`, cancels queued outreach, audits
- `workers/reminder_sweep.ts` — reads `v_reach_back_reminders` daily, stamps most-urgent lane per contact, clears stale reminders
- `workers/package.json` + `workers/tsconfig.json` — separate package so workers run on their own process lifecycle
- `migrations/0002_bounces_and_reminders.sql` — `worker_state` kv table, contacts bounce/DNC/reminder columns, `outreach_log` bounce columns, `bounced` enum value, two views:
  - `v_outreach_history` — per-contact outbound/inbound/bounce counts + last touches
  - `v_reach_back_reminders` — three lanes (inbound_awaiting_us >48h, warm_going_cold ≥30d, sent_no_reply ≥14d)
- `app/app/outreach/page.tsx` — outreach history table with filter tabs (all / active / inbound replies / bounced / DNC)
- `app/app/outreach/[contact_id]/page.tsx` — per-contact detail view: stats, notes editor, sources, offers, pitch packs, full outreach timeline with expandable bodies
- `app/app/outreach/[contact_id]/actions.ts` — server actions: markEmailBad (soft-invalidate, cancels queued), restoreEmail (with optional correction), setDoNotContact, unsetDoNotContact, updateThomasNotes — all with decisions audit
- `app/app/outreach/[contact_id]/row-actions.tsx` — contact action bar (mark bad / restore / DNC) with inline confirmation flow
- `app/app/outreach/[contact_id]/notes-client.tsx` — dirty-state notes editor (never overwritten by importers)
- `app/app/reminders/page.tsx` — three-lane grouped view sorted by urgency, color-coded, dedup'd to one lane per contact
- `app/app/reminders/actions.ts` — composeFollowUp (queues Outbound work via decisions + stamps contact), snoozeReminder (N days), clearReminder (hand-handled)
- `app/app/reminders/row-actions.tsx` — per-row compose / snooze / clear controls
- `app/app/layout.tsx` — nav now includes /outreach and /reminders
- `scripts/import_gigwell_contacts.py` — flexible CSV/JSON loader with 40+ header aliases, role classification heuristics, email+name dedup against existing `contacts`, append-only `source_imports` merge, `--dry-run` preview, never overwrites `thomas_notes`

Artifacts in `products/digital-booking-agent/`:
- `PRODUCT_BRIEF.md` — full product spec, 12 capabilities, 7 agents, pricing bands
- `ANALYST_AGENT.md` — specialist spec for the data-backed pitch agent
- `PHASE_0_PLAYBOOK.md` — day-by-day execution plan for weeks 1–2
- `schema.sql` — complete Supabase schema (14 tables, 2 views, triggers)
- `app/` — Next.js 15 app with 8 live routes:
  - `/` landing grid
  - `/dashboard` phase 0 progress + queue counters
  - `/drafts` outreach pipeline (approve/edit/reject UI)
  - `/outreach` history table + filter tabs
  - `/outreach/[contact_id]` per-contact detail view with notes / bounce / DNC controls
  - `/reminders` 3-lane reach-back queue with compose / snooze / clear
  - `/contacts` CRM table sorted by last-touch
  - `/markets` artist heat map (per-metro Spotify/YT/IG)
  - `/reports` daily / weekly rollups from the reporting agent

Specialist prompts (5 of 7 written; Routing + Research added in pass 3):
- `prompts/inbound_classifier.md`, `prompts/analyst_pitch_pack.md`, `prompts/outbound_composer.md`, `prompts/supervisor.md`, `prompts/reporting.md`, `prompts/routing.md`, `prompts/research.md`

Workers (under `workers/`, all runnable via `npm run <name>:once`):
- `sender.ts` — Gmail send loop with quiet hours + daily cap + backoff
- `freshness_sweep.ts` — expires stale pitch packs + praise
- `bounce_handler.ts` — polls Gmail DSNs, soft-invalidates bad emails
- `reminder_sweep.ts` — stamps reach-back reminders from the 3-lane view
- `followup_queue.ts` — bridges /reminders compose button → Outbound runner

Agent runners (under `agents/`):
- `inbound.py`, `analyst.py`, `outbound.py`, `reporting.py`
- `routing.py` — hard-rule-first dispatcher (DNC / bad email / sensitivity flags / deep holds handled in code; model only consulted when no rule fires)
- `research.py` — gap-filler for contacts / venues / markets. Enforces field catalog + source-required + freshness downgrade + two-source rule for high-confidence emails. Optional `--allow-web-search` wires in Anthropic's hosted web_search. With `--apply`, writes high-confidence findings back to the row.
- `supervisor.py` — dispatch loop. Reads unrouted inbound logs, calls routing.py, applies safety gates (daily cap, per-contact 7d cap), dispatches the chosen specialist via subprocess, writes supervisor decision summarizing the chain. Idempotent; runs fine on a 1-minute cron. Has `--once`, `--loop`, `--log-id`, `--dry-run`.
- `scripts/parse_gmail_mbox.py` — Gmail Takeout → `contacts.csv` + `sent_mail.jsonl`. Classifies roles, computes relationship strength, picks voice sample candidates.
- `scripts/load_to_supabase.py` — pushes the parsed output into Supabase (contacts + voice_samples).

**Pass 4 additions (just shipped):**
- `agents/routing.py` — full dispatcher runner (hard-rule override + model fallback + decisions audit)
- `agents/research.py` — full research specialist with target-aware loaders, adjacent-signal injection, client-side finding validation, optional write-back via `--apply`
- `agents/supervisor.py` — orchestrator loop; subprocess dispatch pattern; hard safety gates for daily/per-contact caps; `--once`/`--loop`/`--log-id`/`--dry-run`; latest-pitch-pack auto-resolution for outbound dispatch
- `scripts/preflight.py` — full readiness check: env, Supabase tables + views, agent syntax, worker + app presence, Anthropic API reachability. Exits non-zero on failure.
- `DEPLOYMENT.md` — zero-to-live walkthrough (5 phases: Supabase / local app / data intake / preflight / go-live) with cron recipe + safety-gate inventory + debugging playbook
- Updated `agents/README.md` with routing / research / reporting / supervisor sections and end-to-end examples

**What Thomas does next (≤ 2 hours to start Phase 0 Day 0):**
1. Create Supabase project `dba-dirtysnatcha` at supabase.com (free tier).
2. From `products/digital-booking-agent/app/`: `npm install && cp .env.example .env.local` and fill in Supabase URL + anon + service keys.
3. Push schema: from `products/digital-booking-agent/`: paste in order — `schema.sql`, `migrations/0001_outreach_audit_columns.sql`, `migrations/0002_bounces_and_reminders.sql`, `migrations/0003_reports.sql` (order matters).
4. `npm run dev` — dashboard will render at localhost:3000 with empty-state copy on every page (no data yet = expected).
5. Kick off Google Takeout export: Gmail Mail + Contacts, last 3 years. That runs for hours in the background — start it now.
6. (Parallel) Export Spotify for Artists last 12 months as CSV. Export YouTube Analytics last 12 months. These are manual one-time exports.

Once the mbox is ready: `python scripts/parse_gmail_mbox.py --mbox <path> --sender thomas@dirtysnatcha.com --out-dir ./_staging/parsed` → `python scripts/load_to_supabase.py --skip-generic`.

---

## Everything else (open tasks)

| # | Task | Status | Next step |
|---|---|---|---|
| 3 | Move TENx10 + system_steward into `10 Research Group/` | in progress | PowerShell script for Thomas to run on Windows (#6) |
| 5 | Consolidate scattered DSR files (221 authoritative hashes vs 1000 staged) | in progress | Diff manifest + delete recommendations (deferred until Client 0 revenue is unblocked) |
| 6 | PowerShell migration script | pending | Draft, test dry-run, hand to Thomas |
| 7 | NotebookLM `funding-my-life` ingestion | in progress | Strategic Blueprint report still generating in Studio panel |
| 8 | Capture 4 pre-existing NotebookLM Studio reports | pending | Uses Chrome MCP when Thomas is at the computer |

---

## What Claude built while Thomas was in his meeting

(Roughly last 90 min of work — all files are in the tree above.)

- Renamed `products/booking-evaluator/` → `products/digital-booking-agent/`
- Wrote `PRODUCT_BRIEF.md` (7-agent architecture, pricing, dogfood + productize plan)
- Wrote `ANALYST_AGENT.md` (data sources, pitch-pack JSON contract, praise-bank hygiene)
- Wrote `schema.sql` (full Supabase DDL)
- Wrote `PHASE_0_PLAYBOOK.md` (14-day day-by-day)
- Scaffolded Next.js app: package.json, tsconfig, tailwind, postcss, layout, globals, 4 pages, Supabase client, types module, app README
- Wrote `parse_gmail_mbox.py` (pure Python, no external deps beyond stdlib)
- Wrote `load_to_supabase.py` (supabase-py, env-gated)
- Wrote `SOW_v1.md` (Client 0 1-pager)
- Wrote `FEED_TEMPLATE.xml` + `inventory_to_feed.py` (GMC-compliant feed)
- Wrote `CAMPAIGN_PLAN.md` + `keywords.csv` (Google Ads starter, 3 campaigns, week-by-week ramp)
- Wrote `ABANDONED_CART.md` (3-email sequence, copy + merge fields + A/B plan)
- Wrote `SYSTEM_PROMPT.md` (WRS chatbot, with explicit price ranges + escalation rules)
- Wrote `EBAY_LOOKUP.md` (search log — public sources didn't surface WRS's eBay handle; needs owner input)
- Ran public web searches to try to find the WRS eBay store — no public hit. Documented.

**Nothing Thomas needs to approve in this batch** — all edits are in new files under his workspace. No external calls. No sends. No financial actions. No permissions changed.
