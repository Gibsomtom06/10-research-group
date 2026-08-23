---
name: project_r255_crm_spine_complete
description: "R255's 3-item CRM ruling is fully shipped as of 2026-08-21 — Contacts Next Action and Social Comment Promotion both merged to master"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3da292d4-a88d-4dc3-8a64-6bde3e5acfb8
  modified: 2026-08-22T23:02:57.930Z
---

All three items of R255 (`ARCHITECT_QUEUE.md`, the CRM ruling) shipped and merged to `master` on 2026-08-21, each via the full brainstorm → spec → plan → subagent-driven-development pipeline:

1. **`last_interaction_at` stamping** (commit `04dddc4`) — a Gmail contact-enrichment script wrote `last_contact_at` but never the separate `last_interaction_at` column the CRM spine needs. Fixed + backfilled.
2. **Contacts Next Action** (`4a51ed8`) — new `/dashboard/contacts` page (retired `/dashboard/admin/contacts` via a `next.config.ts` redirect, not a page stub — the page-stub approach failed this repo's wiring orphan-page check). Every contact gets a settable next-action date+reason, sorted so contacts with none set surface first. Spec: `docs/superpowers/specs/2026-08-21-contacts-next-action-design.md`.
3. **Social Comment Contact Promotion** (`2922c22`) — Facebook/Instagram commenters showing business-shaped engagement (keyword match or 2+ comments) get promoted into real `contacts` rows via a new recurring cron (`social-comment-promotion`, registered in the `sweeps` slot, `0 14 * * *`). Spec: `docs/superpowers/specs/2026-08-21-social-comment-promotion-design.md`. Already run twice against production with Thomas's approval: 132 real contacts created, 472 comments linked. One contact (`kotraxmusic`) was manually deleted 2026-08-21 per Thomas — Kotrax will get a real standalone contact later, not this auto-promoted one. 4 other owned-account contacts (`dirtysnatcha`, `dirtysnatcharecords`, `darkmatterbassmusic`, `whoisee.music`) were deliberately left as-is per Thomas's explicit choice — don't assume he wants those cleaned up too without asking again.

**Explicitly deferred, not yet built:**
- `inbound_dms.contact_id` (541 Facebook DMs) — R255(d) item 3's smaller half, Thomas's call to hold for a follow-on slice.
- Venue/promoter/festival/city name-detection as a third promotion criterion — spec calls it "genuine NLP-adjacent work," an honest v1 gap.
- YouTube comment capture — buildable but needs an OAuth scope change, see `[[project_social_comment_platforms_status]]`.

**How to apply:** If Thomas asks "what's the state of the CRM work" or references R255 again, this is fully closed — don't re-scope items 1-3. The natural next items in this thread are `inbound_dms.contact_id`, YouTube comments, or moving on to the handoff's formal Phase 5 (`HANDOFF_TO_CLAUDE_CODE.md` §5, Class-A write-path editors like `booking_config`/`publishing_registrations`/`tours`) or Phase 6 (§8 automations) — none of which have been started as of this writing.
