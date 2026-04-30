# Booking Intelligence Engine — 11 Capabilities for Stage 2 Evaluation

**Date:** 2026-04-30 night
**Status:** OPERATIONAL spec. Companion to `2026-04-30-dsr-booking-flow-vision.md` — extends Stage 2 (Offer Evaluation + Approval) into a richer intelligence layer.
**Source:** Thomas, 2026-04-30: "we also need attached offers parsed, we need to know when was the last time we worked with promoter, access voyager find out about sentiment of conversation, also research promoter see how they are doing their last shows and what markets they have. we also need to know about our radius clauses last time in markets, how our numbers on dsp and social align with market plays. festivals in markets and contacts if there are during the week shows avail that we can pitch we need intuitive shit"

---

## Why this exists

The current `dsr-booking-evaluator` skill covers a 6-step structured check (floor, market, CPT, calendar, promoter, marketing). Thomas wants Stage 2 of the booking flow to feel like a top-tier human agent's brain — pulling in 11 distinct intelligence signals before recommending action. This spec captures those signals + maps each to existing or missing infrastructure.

---

## The 11 capabilities

| # | Capability | Data source / Path | Status |
|---|---|---|---|
| 1 | **Parse attached offer (PDF/email)** | `dsr-booking-evaluator-SKILL.md` Step 1 (rich version in `_archive/`); current `edm-booking-agent` may have stripped this | ⚠️ recoverable from archive |
| 2 | **Last time we worked with this promoter** | DBA `deals` + `outreach_log` joined on `contacts.email` | ✅ schema exists, blocked on DBA Phase 1 |
| 3 | **Voyage semantic search across past conversations** | DBA Voyage embeddings shipped at migration 0017 (`agents/embeddings.py`) | ✅ infra exists, blocked on Phase 1 + Gmail Takeout corpus |
| 4 | **Sentiment of past conversations with promoter** | NEW — analyze past Gmail thread tones (was it tense, friendly, did they pay on time, did they ghost). Lives as a sub-skill in DBA Analyst agent. | ❌ NOT BUILT — ~2 hours new code |
| 5 | **Research promoter — last shows + market range** | DBA Research agent (`agents/research.py`); web fetch for show reviews/attendance | 🟡 SCAFFOLDED — Research agent exists; web-research path TBD |
| 6 | **Radius clause history — last time in this market** | DBA `deals` + `venues.lat/lng` + 75-mile haversine (migration 0013) | ✅ logic exists, blocked on Phase 1 + venue geocoding (~30% currently uncoded) |
| 7 | **DSP performance geo-aligned with offer city** | Spotify-for-Artists regional data, platform `dsp_metrics` | 🟡 PARTIAL — DSP table exists, geo-tagged listener data needs ingest pipeline |
| 8 | **Social performance geo-aligned with offer city** | Meta Insights per-city, Instagram per-city | ⚠️ Meta Ads MCP currently disconnected; reconnect needed |
| 9 | **Festivals happening in offer market that weekend** | `venues.is_festival` heuristic (DBA migration 0011, conservative) + paid festival DB OR manual backfill | ❌ data source not solved |
| 10 | **Contacts in market we already know** | DBA `contacts` table + market filter | ✅ schema exists, blocked on Phase 1 + Gmail Takeout import |
| 11 | **During-the-week availability for routing pitches** | Confirmed deals + open-date diff per region | ❌ NOT BUILT — calendar-gap detection logic for the Hustler agent |

---

## What "intuitive" means in this context

The 11 capabilities above produce a STRUCTURED intelligence packet. The Claude evaluator on top synthesizes them into recommendations like:

**Example accept:**
> "Take this Cleveland $2,200 offer. We last played Cleveland 7 months ago — radius clear. Promoter is grade B with one paid-late history but always ended up paying; sentiment from 2024 thread was warm. Spotify shows 8K MAUs in Cleveland metro (#3 city for DirtySnatcha). No competing festivals that weekend. Counter at $2,800 with 50-mile radius. Routing opportunity: Pittsburgh on the Friday before (open date), Columbus on the Saturday after (open date) — pitch both mid-week buyers I have in those markets."

**Example pass:**
> "Pass on this Phoenix $3,500 offer. Phoenix is currently radius-blocked by the Lost Lands routing (we play within 200 miles in 38 days). Promoter never replied to our 2024 advance — sentiment unknown but slow communication. Spotify Phoenix MAU rank #14, weak market for us. NXT Festival happens that same weekend in Mesa — competitive."

That's the bar. NOT a 15-field structured output, but a DECISION that names the data behind it.

---

## Smallest meaningful first slice (what to ship first)

In order of "data ready vs new work":

1. **Capabilities 1, 2, 6, 10** (parse offer, last-time-with-promoter, radius history, contacts in market) — all just need DBA Phase 1 (Supabase) to run + Gmail Takeout import to land. ZERO new code, just Phase 1 + data.
2. **Capability 3** (Voyage semantic search) — same; Voyage embeddings already shipped, needs Phase 1 + corpus.
3. **Capability 5** (research promoter) — DBA Research agent ready. Add a web-fetch sub-skill for show reviews + market territory mapping. ~2 hours new code on top.
4. **Capabilities 7 + 8** (DSP/social geo-aligned) — needs an ingest pipeline (~half day) + Meta Ads MCP reconnect.
5. **Capability 4** (conversation sentiment) — new skill in Analyst agent. ~2 hours.
6. **Capability 11** (during-week availability) — calendar-gap detection. New code in DBA. ~half day.
7. **Capability 9** (festival data) — paid DB ($) or manual backfill (slow). DEFER.

**The unlock:** DBA Phase 1 (15-min Supabase task) + Gmail Takeout import (1-3 days) = capabilities 1, 2, 3, 6, 10 ALL light up. Five capabilities from one unblock action. That's the highest-leverage move.

---

## Cross-references

- Companion spec: `2026-04-30-dsr-booking-flow-vision.md` (Stage 2 of that flow IS this engine)
- DBA project digest: `products/digital-booking-agent/PROJECT_DIGEST_2026-04-30.md` (the Supabase Phase 1 unblock action is documented there)
- Recovered legacy skill: `_archive/_old_dsr-booking-evaluator-SKILL.md` (rich version, may contain Step 1 PDF parsing logic that current `edm-booking-agent` stripped)
- KB Module 24: `products/tenx10-platform/TENx10_Knowledge_Base/24_Agent_Team_Architecture.md` (RJ Jackson + agent personas that consume this engine's output)
- Architecture: `docs/superpowers/specs/2026-04-27-factory-architecture-design.md` (where the booking eval lives in the L3 Bookings Department)

---

## Don't lose this again

This is the rebuild-loop antidote applied to booking. Every signal Thomas wants is named here. If a future Claude proposes "let's redesign the booking eval," it must point at THIS file and explain why specific capabilities don't work — not propose replacements that get half-built.

---

*Operational spec v1 — 2026-04-30. Update when capabilities ship; mark each ✅ when end-to-end smoke-tested.*
