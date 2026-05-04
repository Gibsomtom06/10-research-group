# Autonomous Queue — what runs when Thomas steps away

**Purpose:** Living backlog of heavy work to dispatch as parallel subagents whenever Thomas is not actively guiding. Updated continuously by Claude.

**The contract:**
- When Thomas types autonomous-mode trigger phrases → I dispatch every READY item as a parallel subagent in a single message
- When Thomas is back, lighter subagents continue running in the background
- I update this file with status as agents land + new items emerge
- Thomas can reorder priorities by editing this file directly

**Last updated:** 2026-05-03

---

## HOT — running right now

*(nothing — all agents from 2026-05-03 run completed)*

---

## READY TO DISPATCH (parallelizable, no conflicts)

| Pri | Task | Why it matters | Model | Est duration | Blast radius |
|---|---|---|---|---|---|
| **P0** | **Verify DSR publishing entity registered** at ASCAP (IPI 1238282844), MLC (publisher P330RE), CMRRA (02274554/02274555), SoundExchange | Royalties don't collect if entity unregistered | manual at portals | 1-2 hrs | n/a |
| **P0** | **BMI Live registration — DirtySnatcha** for 17 TMTYL 2026 shows + Electric Forest + Lost Lands | Live perf royalties uncollected. IPI=01017500116 | sonnet + manual portal | 30 min/show | low |
| **P0** | **ASCAP OnStage registration — Dark Matter** Isaac (IPI 1262457258) + Joseph (IPI 1262457454) | Live perf royalties uncollected | sonnet + manual | per-show | low |
| **P0** | **WHOiSEE BMI Live registration** — IPI now confirmed (00779461097) | IPI unblocked; register all WHOiSEE shows at BMI Live | sonnet + manual | per-show | low |
| P0 | **Kotrax basic data capture** — real name, PRO, IPI | Blocks all registrations | manual (Tom-input) | 5 min | n/a |
| P0 | **HVRCRFT basic data capture** — real name, PRO, IPI | Blocks all registrations | manual (Tom-input) | 5 min | n/a |
| P1 | **Backfill PRO/IPI for 27 submission-tracker artists** (Aalioura, Adam Annella, etc.) in dsr_artists with NULL PRO/IPI | Writer royalties stranded | manual / API lookup | per-artist 5-15 min | zero |
| P1 | **MLC submission — LAB10 82 tracks** via portal | Uncollected royalties start collecting | manual at MLC portal | n/a | n/a |
| P1 | **ISRC reconciliation — manual source review** of DSR_CLEAN_DATABASE.xlsx to map 241 placeholder ISRCs (BMI_TITLE_xxx) to real ISRCs | DB joins broken on synthetic keys; auto-match failed (zero title overlap between tables) | sonnet + manual | 1-2 hrs | low |
| P2 | **Google Drive sweep** — inventory + classify scattered Sheets/Docs | Tom flagged | haiku | 15-20 min | zero (read-only) — **BLOCKED: needs Google Drive OAuth** |
| P2 | **Desktop routing — 200 file moves** per `DESKTOP_INVENTORY_2026-04-30.md` | Cleanup follow-through | sonnet | 30-45 min | medium |

---

## BACKLOG (known but lower priority)

- TENx10 platform homepage — strip hardcoded DSR content (Priority 1 from CLAUDE.md TASKS)
- TENx10 platform site UX revision — management-first restructure (per BUSINESS_HIERARCHY.md)
- 10researchgroup.com umbrella site — Phase 1 hierarchy index (per positioning spec)
- DSP API integrations to populate Spotify/Apple/etc. IDs in DSR_CLEAN_DATABASE
- ~~WHOiSEE BMI IPI lookup~~ — DONE 2026-05-03 (IPI 00779461097)
- Dark Matter ASCAP IPI confirmation (lookup at ascap.com)
- DBA Phase 1 Supabase migration unblock
- DAD v1 logic recovery (search laptop OR ask Thomas for filename)
- Music organization workflow file recovery (laptop)
- ~~HVRCRFT spelling audit~~ — DONE 2026-05-03, fixed CLAUDE.md line 303 (HVVRCRFT → HVRCRFT)

---

## BLOCKED (need Thomas input)

| Task | Blocked on |
|---|---|
| Identify 10 unknown-label tracks (Escape, Sum Dirty, Dimension, etc.) | Thomas needs to confirm labels |
| CMRRA accounts 02274554 / 02274555 activation | Thomas activates at portal |
| Umbrella git lock fix | Decision: move repo out of OneDrive OR pause-OneDrive-then-commit pattern |
| ~~WHOiSEE legal full name confirmation~~ | DONE — Brett Hopkin (from DSR contract) |
| Google Drive sweep | Needs Google Drive OAuth — run google-drive-auth or equivalent |
| ISRC reconciliation final pass | Needs manual review: dsr_track_registrations references different track catalog than dsr_tracks; Thomas to clarify if these are archived/unreleased tracks |

---

## DONE (ship log — last 7 days)

- 2026-04-30: Foundation .md cleanup ~95% (TONIGHT_SUMMARY.md)
- 2026-04-30: DSR_CLEAN_DATABASE.xlsx populated (514 rows, 14 tables)
- 2026-04-30: 9 specs (booking eval, label dashboard, contacts, etc.)
- 2026-04-30: Trading Shadow rollback handler (13 TDD tests, shipped)
- 2026-04-30: Discord chat bridge (3 personas)
- 2026-04-30: Model Router built + self-evaluated (catch-all 26.7% → 6.7%)
- 2026-04-30: 370+ files moved (DSR contracts, riders, jerseys, somberg law, legacy zips)
- 2026-04-30: Andrew Lehr correction across 9 files
- 2026-04-30: TENx10 `/dashboard/label` 5-tab UI shipped (commit a03ccf8 — mock banners pending Supabase)
- 2026-04-30: BUSINESS_HIERARCHY.md canonical chart
- 2026-04-30: 3 TENx10 desktop duplicates archived
- 2026-04-30: Supabase migration 022 (dsr_clean_database) shipped — 476 rows across 7 dsr_* tables
- 2026-04-30: Supabase migration 023 (live_perf_registrations) — schema for tracking BMI Live / ASCAP OnStage / etc. submissions per show per artist
- 2026-04-30: 6 managed artists upserted with PRO/IPI (DirtySnatcha BMI, WHOiSEE BMI, Dark Matter Isaac/Joseph ASCAP, Kotrax/HVRCRFT flagged as data gaps)
- 2026-04-30: README_CANONICAL.md written — enforces consolidation rule for publishing folder
- 2026-04-30: Bitwarden + Bitwarden CLI installed; vault import JSON staged in %TEMP%
- 2026-04-30: Ollama llama3.1:8b + LM Studio installed
- 2026-04-30: MHP folder migration — 6.8 GB out of OneDrive into I:\My Drive\02-MyHydrationPack\
- 2026-04-30: Memory entries: catalog rule, publishing registry coverage, DAD persona-chat UI (+ extensions: voice-first, target 40s+, taglines, memory-becomes-maintenance)
- 2026-05-03: WHOiSEE BMI IPI confirmed (00779461097 / Brett Hopkin) — updated in artists table + BRAIN.md
- 2026-05-03: Dashboard rewire — LabelRosterTab mock data (211-line array) replaced with live artists table queries; is_managed → management_only/signing_label logic fixed
- 2026-05-03: Migration 036 — signing_label + management_only on artists table (Dark Matter → Wakaan, management_only=true)
- 2026-05-03: Migration 037 — publishing_registries lookup table, 42 registries seeded (US/CA/UK/EU/APAC/LATAM + digital platform gaps vs Songtrust)
- 2026-05-03: Migration 038 — ISRC reconciliation audit doc (241 placeholder ISRCs found; zero auto-match; needs manual source review)
- 2026-05-03: Migration 039 — 5 publishing export views (v_bmi/ascap/mlc_submission_ready, v_publishing_registration_gaps, v_publishing_coverage_summary)
- 2026-05-03: 4 artist BRAINs filled — Kotrax, WHOiSEE, Dark Matter, HVRCRFT (at MANAGEMENT-TENx10/artists/)
- 2026-05-03: MANAGEMENT-TENx10/BRAIN.md — revenue state, pilot tracking, cadence, open decisions sections added
- 2026-05-03: LAB10_PILOT_TRACK_RUN.md — step-by-step playbook for BMI→MLC→SoundExchange registration of first Leigh Bray track
- 2026-05-03: MHP_JERSEY_DROP.md — pre-sale tracker with unit economics + day-by-day targets
- 2026-05-03: WRS_PILOT.md — talking points, YES/NO/MAYBE guide, SOW send protocol, 30/90-day checkpoints
- 2026-05-03: Trading Shadow heartbeat — loop_paper.py writes .heartbeat_paper.txt every tick; watchdog_paper.ps1 alerts Discord if stale
- 2026-05-03: Umbrella nightly push — push_umbrella.ps1 + install_push_cron.ps1 (run install once to register Task Scheduler job)
- 2026-05-03: Deep Draft portfolio audit — NotebookLM + Opus 4-step pipeline complete; final polished doc ready
- 2026-05-03: 10 Research Group naming fix — 3 memory files corrected (MEMORY.md, reference_canonical_hierarchy.md, project_portfolio_status_apr29.md); CLAUDE.md HVRCRFT spelling fixed; duplicate NotebookLM notebook deleted
- 2026-05-03: Label roster model — migrations 040 + 041 applied; tenx10_id bridge column, v_dsr_label_roster + v_artist_label_relationships views; on_dsr_label derived from dsr_artist_labels data

---

## How this file gets used

**By Claude (every session):**
1. Read this file early in session
2. Update HOT as subagents start/finish
3. Move items READY → HOT → DONE
4. Surface BLOCKED items in summary to Thomas

**By Thomas (anytime):**
1. Reorder priorities by editing the table
2. Add new items to READY
3. Move items between READY / BACKLOG / BLOCKED
4. Strike DONE items he no longer needs

---

*v1 — 2026-04-30. Lives at umbrella root so every Claude session sees it.*
