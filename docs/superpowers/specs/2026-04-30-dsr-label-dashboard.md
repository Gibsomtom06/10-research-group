# DSR Label Dashboard — Operational Spec

**Date:** 2026-04-30
**Status:** OPERATIONAL spec. Captures everything Thomas wants the LABEL-tier dashboard to track. Companion to `2026-04-30-dsr-booking-flow-vision.md` (booking-side) and `2026-04-30-booking-intelligence-engine.md` (Stage 2 evaluation).
**Implementation:** TENx10 platform `/dashboard/label` route (currently NOT built — placeholder exists per CLAUDE.md TASKS).

---

## Why this exists

Thomas: *"on tenx10 on the label page (we havent done anything to label dashboard) is our entire catalog, registration. of tracks then we need to track payout and if we put marketing towards the track. if we are paid back and how much is owed etc. we also need to map our files & folders like contracts, art, track, to catalog."*

Plus: *"keeping tabs on our artists if they moved where they live what they been up to can help us know who to reach out to for more music or to be a DSR takeover show."*

The label dashboard is the SINGLE PANE for running DSR Records as a business. Five operational dimensions:

1. **Catalog** — every track, every release, every registration status
2. **Financial** — per-track payouts received, marketing spent, recoupment status, amount owed
3. **Files** — contracts, art, masters, stems mapped to each track in catalog
4. **Roster CRM** — where each artist lives, what they're up to, outreach history, takeover-show eligibility
5. **Operations** — releases pipeline, A&R queue, A/R reconciliation

---

## Dimension 1 — Catalog tracking

Source-of-truth tables (see DSR_CLEAN_DATABASE.xlsx + future Supabase):
- `tracks` — one row per ISRC
- `releases` — one row per UPC
- `release_tracks` — many-to-many
- `track_writers` + `track_publishers` — split data
- `track_registrations` — registry status (BMI/ASCAP/MLC/SoundExchange/CMRRA/PRS/...)

UI views needed:
- Catalog grid (sortable by release date / artist / track / streams)
- Per-track detail page (all metadata, all DSP links, all registrations)
- **Gap detection alerts** — "track X has no MLC submission" / "artist Y has no PRO registration"

**Status:** schema exists in DSR_CLEAN_DATABASE.xlsx (✅). UI: ❌ not built.

---

## Dimension 2 — Financial tracking (NEW SCHEMA NEEDED)

Tables to ADD to clean DB + Supabase:

### `track_revenue` (one row per track × period × source)
- `revenue_id` (PK)
- `track_isrc` (FK)
- `period_start`, `period_end` (e.g., 2026-Q1)
- `source` (Spotify, Apple Music, YouTube CID, Beatport, BMI, ASCAP, MLC, SoundExchange, etc.)
- `amount_usd`
- `units` (streams, downloads, plays)
- `received_date`
- `payout_method`
- `notes`

### `track_marketing_spend` (one row per track × campaign)
- `spend_id` (PK)
- `track_isrc` (FK)
- `campaign_name` (e.g., "Shazam Spike Detroit", "Save Campaign 2026-04")
- `platform` (Meta Ads, TikTok Ads, Spotify Marquee, etc.)
- `tag` ([SHOW] / [SONG] / [BUILD] per CLAUDE.md system)
- `start_date`, `end_date`
- `amount_spent_usd`
- `cpt_or_cpr` (cost per ticket / cost per result)
- `attribution_window` (days)
- `notes`

### `track_recoupment_status` (computed view, not raw table)
- `track_isrc`
- `total_revenue_received`
- `total_marketing_spent`
- `net_position` (revenue - marketing)
- `recouped_flag` (Y/N — net >= 0?)
- `amount_owed_to_artist` (per artist split, deduct recouped marketing first)
- `last_calculated`

UI views:
- Per-track P&L row in catalog grid
- Label-wide P&L summary (total revenue, total spend, total recouped, total owed)
- Drill-down: per-track financial history

**Status:** schema NOT in DSR_CLEAN_DATABASE.xlsx yet. ADD in next iteration.

---

## Dimension 3 — File/folder mapping (EXTEND EXISTING)

Current `assets` table:
- `asset_id`, `owner_artist_id`, `linked_track_isrc`, `asset_type`, `url`, `size_bytes`, `uploaded_at`, `notes`

Needs ENRICHMENT:
- `asset_type` enum: `contract`, `master_wav`, `master_aif`, `instrumental`, `stems_zip`, `artwork_3000`, `artwork_1500`, `canvas_video`, `lyric_sheet`, `metadata_sheet`, `vmg_delivery_pdf`, `cover_song_license_pdf`, ...
- `parent_folder_path` — Drive folder path / OneDrive path that holds it
- `is_canonical` — flag the latest/canonical version (e.g., latest mastered WAV)
- `version` — incrementing version number for files that get rebuilt

UI views:
- Per-track Files panel: shows all files attached, grouped by asset_type
- "Find missing files" view: tracks that don't have all required assets (e.g., release date but no master WAV)
- Bulk upload: drag a folder, auto-classify by extension + filename pattern

**Status:** assets table exists in clean DB; type enum + folder-path columns NOT yet added. EXTEND in next iteration.

---

## Dimension 4 — Roster CRM (NEW SCHEMA NEEDED)

Per Thomas: *"keeping tabs on our artists... where they live what they been up to..."*

Tables to ADD:

### `artist_activity_log` (one row per artist × snapshot)
- `entry_id` (PK)
- `artist_id` (FK)
- `snapshot_date`
- `current_city`, `current_state`, `current_country` (last-known)
- `last_release_date`
- `last_post_date_per_platform` (json: instagram_last, tiktok_last, etc.)
- `monthly_listener_trend` (delta last 30d)
- `notes` (free-form: "just signed to mgmt with X", "moved to LA", "working on EP w/ Y")
- `source` (manual entry / Spotify API / social scrape / other)

### `artist_outreach_log` (one row per interaction)
- `interaction_id` (PK)
- `artist_id` (FK)
- `interaction_date`
- `direction` (inbound / outbound)
- `channel` (email, dm, phone, in-person, agent-relay)
- `subject` (e.g., "Asking about new EP for DSR", "DSR takeover Detroit invite")
- `outcome` (no-reply / replied / declined / accepted / pending)
- `next_action_due`
- `notes`

### `dsr_takeover_candidates` (curated list — flagged for shows)
- `candidate_id` (PK)
- `artist_id` (FK)
- `flagged_date`
- `flagged_by` (Thomas / Claude / RJ Jackson agent)
- `reason` (recent activity, market fit, audience overlap)
- `priority` (S/A/B/C tier)
- `status` (candidate / invited / confirmed / declined / completed)
- `target_show_id` (FK to tour_shows when a show is identified)

UI views:
- Roster grid with last-contact date + days-since-last-release per artist
- "Reach out today" view: artists with stale contact + recent activity (signal they're approachable)
- DSR takeover planner: candidate roster + market fit + show calendar overlay

**Status:** NOT in DSR_CLEAN_DATABASE.xlsx yet. ADD in next iteration.

---

## Dimension 5 — Operations (existing, lighter)

- Releases pipeline (`releases` table sorted by release_date desc, status)
- A&R queue (`submissions` table from current platform — 2/3 vote rule applies HERE only)
- A/R reconciliation (per-deal in DBA + cross-referenced to track_revenue)

**Status:** schema exists in current platform; UI build TBD.

---

## Implementation order (when this becomes Priority #2 platform work)

1. **Wire DSR_CLEAN_DATABASE.xlsx → Supabase tables** (DBA Phase 1 + this dashboard share the database)
2. **Catalog grid view** (read-only, renders existing tables) — ships Sprint 1
3. **Add financial tables + per-track P&L view** — Sprint 2
4. **Add file/folder mapping enrichments + bulk upload** — Sprint 3
5. **Add roster CRM tables + outreach UI** — Sprint 4
6. **Add DSR takeover planner with show-calendar overlay** — Sprint 5

Each sprint is shippable as a slice. Don't wait for all 5 before shipping any.

---

## DAD mapping

Every dimension above is a class of work DAD eventually automates:
- Catalog ingest from manager's distributor exports (already pattern-captured in CONSOLIDATION_PATTERN.md)
- Financial: pull DSP statements + Meta Ads spend, auto-reconcile recoupment
- Files: classify uploaded folders by extension/filename, auto-route to canonical
- Roster CRM: scrape social/Spotify activity → activity_log; flag candidates by rules
- Takeover planner: cross-reference candidate fit with confirmed show calendars

**This is the SaaS product.** Songtrust does only catalog/registration/admin and takes 15-30%. We do all 5 dimensions and charge a flat fee.

---

## Cross-references

- `DSR_CLEAN_DATABASE.xlsx` (in MANAGEMENT-TENx10/labels/DirtySnatcha Records/) — current schema
- `GODSHEET_SCHEMA_MAP_FULL.md` (in TENx10_Knowledge_Base/) — source mapping
- `2026-04-30-dsr-booking-flow-vision.md` — booking-side companion
- `2026-04-30-booking-intelligence-engine.md` — booking eval engine
- `2026-04-30-contacts-inbox-cleanup.md` — Gmail-side companion
- `products/system-steward/CONSOLIDATION_PATTERN.md` — DAD's algorithm
- TENx10 platform CLAUDE.md TASKS — currently lists multi-artist onboarding, artist join flow, RSE dashboard, artist Xai chat, morning briefings. **This spec adds: label dashboard with 5 dimensions.**

---

*Spec v1 — 2026-04-30. Update when each dimension's schema/UI ships.*
