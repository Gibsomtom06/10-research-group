# Booking Agent — Current State Audit (Reality Check on the Rebuild Partition)

**Date:** 2026-05-05 20:45 ET
**Reason for existence:** The TENx10 rebuild partition (`docs/superpowers/plans/2026-05-05-tenx10-rebuild-partition.md`) was written assuming greenfield. A source-code audit run tonight (2026-05-05) found the booking agent flow is **brownfield with ~70% of W1's intended behavior already shipped** under existing file names. This doc captures the gap so F1/F2/W1 don't rebuild what's already there.

---

## Status by capability

### Already shipped (no rebuild needed; some need polish)

| Capability | Where it lives | Status |
|---|---|---|
| Opportunity discovery + filtering + Gmail draft generation | `products/tenx10-platform/src/app/api/booking-agent/run/` (SSE streaming), `src/app/artist/booking/BookingAgentClient.tsx` | LIVE — hardcoded artist=`dirtysnatcha`, ready to parameterize |
| Market sizing (ticket range, CPT, recommended guarantee) | `src/app/api/outreach/market-estimate/`, `src/components/outreach/MarketEstimator.tsx` | LIVE — Claude-powered |
| Offer decoder (6-step decision engine + counter draft + email draft) | `src/app/api/deals/analyze-text/`, `src/app/dashboard/gmail/OfferAnalyzerClient.tsx` | LIVE |
| Deal Kanban (Mission Control + Timeline + Map views) | `src/app/dashboard/deals/`, `src/components/deals/{MissionControlView,TimelineView,MapView}.tsx` | LIVE — 3-lane red/yellow/green |
| Deal detail (intelligence, conversation thread, deal points editor) | `src/app/dashboard/deals/[id]/`, `BookingThread.tsx`, `ShowIntelligence.tsx`, `DealPointsEditor.tsx` | LIVE |
| Bulk CSV → DB import | `src/app/api/import/bookings/` | LIVE |
| Per-show Drive folder creation | `src/app/api/deals/create-offer-folder/` | LIVE — 7-subfolder convention per `show_folder_structure.md` |
| Promoter grading (single-axis A-F + grade_breakdown jsonb) | Migration `20260428_promoter_grading.sql` applied | LIVE schema, UI surfacing partial |
| Discord webhook notifications (platform side) | `src/app/api/discord/notify/`, `DISCORD_WEBHOOK_URL` env | LIVE — used by morning brief, ops test button |
| **DBA outbound composition** | `agents/outbound.py` (525 lines) + `prompts/outbound_composer.md` (locked voice rules) | LIVE — verifies pitch_pack stamps, writes draft to `outreach_log` |
| **DBA inbound classification** | `agents/inbound.py` (230 lines) + `prompts/inbound_classifier.md` | LIVE — 9-class classifier, structured field extraction |
| **DBA supervisor + safety gates** | `agents/supervisor.py` (462 lines) | LIVE — daily cap, per-contact 7-day cap, hold/escalate routing |
| **DBA send worker** | `workers/sender.ts` (350+ lines) | LIVE — quiet hours, business-hours gating, TZ-aware, Gmail OAuth to thomas@dirtysnatcha.com |
| **DBA analyst (pitch pack generation)** | `agents/analyst.py` (335 lines) | LIVE — verification stamps, 7-day freshness gates |
| **DBA tracking pixels** | `app/t/click/[id]/`, `app/t/open/[id]/` routes | LIVE — but not wired into a tracking events table yet |

### Real gaps (the actual minor tweaks)

| Gap | Severity | Where it lives | Notes |
|---|---|---|---|
| `/dashboard/deals/new` form has no submit handler | minor tweak | `src/app/dashboard/deals/new/page.tsx` | Form renders, POST logic missing |
| DBA does not post to Discord on key events | minor tweak | `agents/outbound.py`, `agents/supervisor.py`, `workers/sender.ts` | Platform's `/api/discord/notify` exists; DBA isn't calling it |
| Email open/click tracking pixels live in DBA but not wired to `email_engagement_events` table | small build | DBA `app/t/click/[id]/`, `app/t/open/[id]/` | Missing the events table + UI surfacing on the platform |
| Multi-axis grading (separate promoter / venue / talent_buyer scores) | small build | Extends existing `promoter_grading` migration | Single grade A-F today; user wants three axes |
| Counter-offer negotiation loop in DBA | medium | New: outbound counter-composer path + reply-cycle tracker | Inbound classifies "negotiation"; no formalized counter-compose path |
| DBA → Sheets bidirectional sync | medium | New: `workers/sheet-sync.ts` + Apps Script | Manual CSV import only today |
| Unified "/booking" hub linking the 4 scattered surfaces | minor tweak | New: single page at `src/app/booking/page.tsx` | `/artist/booking`, `/dashboard/deals`, `/dashboard/gmail`, `/dashboard/outreach` are all separate today |
| Booking section role-conditioned for non-artist users | small build | `src/middleware.ts` + page-level guard | Currently artist-scoped; needs booking_agent + manager + label_manager support |
| Promoter/venue photo + sellout-history scrapers (W1.3) | full build | New (per partition) | Doesn't exist; scrapers + tables both new |
| Promoter background-check / red-flag detector (W1.4) | full build | New (per partition) | Doesn't exist; scrapers + table both new |
| Email open / interaction widget on deal cards (W1.1) | medium build | New component + queries against the events table once it exists | Depends on events table |

### What the partition doc got wrong

The partition doc's W1 task description (`src/components/dashboard/{...}` + migration 044) assumes blank slate. Reality:

1. **Migration numbering** — 045 is already applied. Next free number is 046, not 043.
2. **`/booking/`** as a top-level route doesn't exist; the booking flow lives at `/artist/booking`, `/dashboard/deals`, `/dashboard/gmail`, `/dashboard/outreach`. Either the rebuild creates `/booking/` as a unifier or it accepts the existing four-surface layout.
3. **Promoter grading already exists** — migration `20260428_promoter_grading.sql` ships single-axis A-F + grade_breakdown jsonb. W1.2's three-axis grading is an extension, not new work.
4. **Discord webhook already wired** on the platform side — DBA is the gap, not the platform.
5. **Tracking pixels exist** in DBA — agents/audit was wrong saying "no email open tracking." It's there; just not wired to events surfacing yet.

---

## Realistic "minor tweaks to done" list (auto-mode tonight)

Ranked by risk × value:

1. **DBA → Discord notifications** — wire `agents/notifier.py` that POSTs to platform's `/api/discord/notify` from outbound.py (draft queued), supervisor.py (send blocked, route_to=hold), sender.ts (send succeeded / failed). Single new file + 3 callsites. **Low risk, high value.**
2. **Update partition doc migration numbering** — bump baseline from 043 to 046. **No risk.**
3. **Add corrective callout to partition doc** linking this current-state doc. **No risk.**
4. **`/dashboard/deals/new` submit handler** — find the missing POST logic, wire it. **Low risk if simple, medium if the schema mapping isn't obvious.**
5. **Unified `/booking` hub page** — single page that links the four scattered surfaces. **Low risk; new file at new route.**

NOT for tonight (need user input or are bigger than minor):

- W1.1 email open widget (needs events table; touches schema)
- W1.2 multi-axis grading (touches schema)
- W1.3 + W1.4 scrapers (full builds)
- DBA counter-offer loop (medium; voice-sensitive)
- Sheets bidirectional sync (medium; Apps Script + worker)
- F1 + F2 (still the right path, but require user input on names/emails for HVRCRFT/Kotrax/Hunter/Brian + IPI/FEIN data)

---

## Open questions (need Thomas's input before deeper work)

See the digest file for the consolidated list.
