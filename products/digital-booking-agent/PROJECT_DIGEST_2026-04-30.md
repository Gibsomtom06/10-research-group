# Digital Booking Agent — Project Digest

**Date:** 2026-04-30
**Source:** Deep-read of `digital-booking-agent/` by Explore subagent + verification.
**Purpose:** Single-page consolidation of DBA's current state so future Claude sessions don't have to re-read 11+ project docs.

---

## What DBA IS

Digital Booking Agent is an autonomous booking system that handles the full end-to-end booking workflow (inbound triage, outbound prospecting, deal-memo generation, signature tracking, deposit tracking) for touring artists. First tenant is **DirtySnatcha** (Thomas's flagship artist). Built on **7 Claude specialists** orchestrated by a **Supervisor**, grounded in real CRM data + Spotify/YouTube/Instagram market analytics + Thomas's voice samples — designed to be indistinguishable from a human agent to buyers on the other end.

Vertical strategy: DBA is the flagship income product post-Rim Shop (Client 0). Once DirtySnatcha dogfood proves the model, DBA sells to independent artists (~$25K one-time + $2K/mo) and booking agencies ($300K+ custom).

---

## Current state

**Scaffolded but blocked.** All 7 specialist agents are prompt-defined in `prompts/`, all 5 background workers are coded in TypeScript, the Next.js UI is routed at `/dashboard`, `/drafts`, `/contacts`, `/markets`, and the full Supabase schema is ready.

### Named blockers (in order of unblock effort)

1. **Supabase project creation + schema migration** — Phase 1 of `DEPLOYMENT.md`. ~15 min browser task. ZERO external dependencies. **This is the unblock-everything action.**
2. **Thomas's Gmail Takeout export** (Gmail + Contacts + show history). Background job, days 1-3 to land. Independent of #1.
3. **Spotify / YouTube OAuth credentials** — day 5 dependency. Independent of #1.
4. **Gmail OAuth setup** — `scripts/gmail_oauth_setup.py` is READY, but needs Google Cloud Console bootstrap + consent flow completion (task #27).

---

## The 7 specialist agents

| # | Agent | Code path | Prompt | Status |
|---|---|---|---|---|
| 1 | **Supervisor** | `agents/supervisor.py` | `prompts/supervisor.md` | Code + prompt ready. Routes work, verifies output, orchestrates Plan-Execute-Summarize per specialist. |
| 2 | **Analyst** | `agents/analyst.py` | `prompts/analyst_pitch_pack.md` | Code + prompt ready. Builds data-backed pitch-packs (artist stats, praise hooks, fit rationale). Enforces freshness: stats ≤30d, praise ≤90d, confidence ≥0.7. Voyage embeddings (migration 0017) shipped. |
| 3 | **Inbound Classifier** | `agents/inbound.py` | `prompts/inbound_classifier.md` | Code + prompt ready. Classifies email (offer / negotiation / cold_intro / admin / spam, etc), extracts offer fields. |
| 4 | **Outbound Composer** | `agents/outbound.py` | `prompts/outbound_composer.md` | Code + prompt ready. Composes email in Thomas's voice from pitch-pack. Locked rules: no em-dashes, no filler phrases, deal-structure per-artist, date specificity. Counter-offer mode added (task #51). |
| 5 | **Routing** | `agents/routing.py` | `prompts/routing.md` | Code + prompt ready. Dispatches next specialist based on classified email + contact state. Safety gates in code (DNC, bad emails, sensitivity flags). |
| 6 | **Research** | `agents/research.py` | `prompts/research.md` | Code + prompt ready. Fills gaps in contact/venue/market data. Enforces allowed-field catalog, source requirement. |
| 7 | **Reporting** | `agents/reporting.py` | `prompts/reporting.md` | Code + prompt ready. Daily/weekly rollups from outreach_log + offers + decisions. |

---

## The 5 background workers

| # | Worker | Code path | Status |
|---|---|---|---|
| 1 | **Sender** | `workers/sender.ts` | Code ready. Polls `outreach_log` status=`queued`. Respects quiet hours (9pm-8am recipient-local). Caps 25/day. Pushes via Gmail OAuth (credentials needed — task #27). |
| 2 | **Freshness Sweep** | `workers/freshness_sweep.ts` | Code ready. Marks stale praise (>90d) and stats (>30d). Triggers re-pull from Spotify/YouTube/Instagram. |
| 3 | **Reminder Sweep** | `workers/reminder_sweep.ts` | Code ready. Stamps 90-day reach-back reminders (hygiene touchpoint per project CLAUDE.md). |
| 4 | **Bounce Handler** | `workers/bounce_handler.ts` | Code ready. Polls for DSNs (delivery status notifications), marks bad emails, auto-cancels queued outreach. |
| 5 | **Model Call Logger** | `agents/model_router.py` + migration 0016 | Phase 0 live. Every Anthropic + Voyage call logged to `model_calls` table with tokens, latency, cost. Tier-based config: Supervisor/Outbound = Sonnet; others downgrade-eligible in Phase 1. |

---

## Critical unknowns / decisions Thomas needs to make

- **Multi-artist scope (task #34):** WHOiSEE, Dark Matter, Kotrax all need the same pipeline. When do we remove `artist_slug = 'dirtysnatcha'` hardcodes?
- **Standard deal terms (task #50):** Current `dsr_standard_deal_terms` view defaults (50% deposit, 30-day due, 75-mile radius) are industry norms + Thomas's stated prefs. Need to backfill from Colton / PRYSM threads once parsed.
- **Venue geocoding (task #63):** 75-mile radius check uses haversine when both sides have coords; falls back to same-city. Google Places backfill needed to unlock haversine path; currently ~30% of venues uncoded.
- **Festival exceptions (task #62):** `venues.is_festival` heuristic (migration 0011) is conservative. Manual backfill OR pay for a festival DB.
- **Model tier thresholds (`PRD_model_routing.md`):** Haiku-vs-Sonnet tradeoff not yet measured. Phase 1 requires 14 days of production data + quality eye-test on top 2 cost-driving agents (likely Routing + Inbound).

---

## How DBA connects to the rest of 10 Research Group

- **TENx10 platform:** DBA's Next.js app runs alongside `tenx10-platform/` (workspace at `10-research.code-workspace`). Tour routing feeds TENx10's calendar + venue DB. Booking data flows both directions.
- **`dsr-booking-evaluator` skill:** Reused as a subroutine inside Supervisor. Takes an offer + pitch-pack context, returns GREEN/YELLOW/RED + suggested counter bounds.
- **`brand-voice` skill:** Runs on every Outbound draft before send (referenced in DBA `CLAUDE.md`). Skill not yet built — post-Phase 0 work.
- **DSR (DirtySnatcha Records):** First tenant + dogfood. DBA's prompts include DSR voice samples + DirtySnatcha-specific deal terms.
- **EMPLOYEE_DIRECTORY.md (umbrella):** DBA's 7 specialists are the L4 Project workers under DBA. Cross-listed there with status flags.

---

## Concrete next action (the unblock)

**Run Phase 1 of `DEPLOYMENT.md`.** Specifically:
1. Create Supabase project (browser, ~5 min)
2. Run `schema.sql` (Supabase SQL editor, ~5 min)
3. Copy three API keys to `.env.local` (~2 min)

Total: ~15 minutes, zero external dependencies except a Supabase account.

Once Phase 1 is live:
- Phase 2 (app + workers local setup) is independent — can run in parallel via Gemini delegation per `GEMINI_HANDOFF.md`
- Phase 3 (data intake) kicks off in background — Gmail Takeout export takes 1-3 days to land

Once all three phases land, the 14-day Phase 0 playbook (`PHASE_0_PLAYBOOK.md`) becomes runnable with clear day-by-day deliverables.

---

*Digest v1 — 2026-04-30 night, by Explore subagent + Claude consolidation. Update when Phase 1 runs OR when blockers change.*
