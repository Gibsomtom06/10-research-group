# File Inventory — 10 Research Group umbrella

The living ledger of every `.md` (and other relevant doc) in scope, classified for purpose, status, and consolidation candidacy. Regenerate / update whenever files move, merge, or are archived.

**First built:** 2026-05-05 from the Boris-method retrofit + cross-machine sweep + reading-discipline pass.
**Last updated:** 2026-05-05.

---

## How to use this file

1. When you change a file's role / location / status, update its row here.
2. When you create a new `.md` file in the umbrella, add a row.
3. When you delete or archive a file, remove its row (or move to the "Archived" section at the bottom).
4. When two files cover the same topic, that's a redundancy candidate — add a note or merge them.

The reading-discipline rule (umbrella `CLAUDE.md` § "Read before writing") applies to any consolidation work that touches this file.

---

## Scope

In-scope: every `.md` file under `OneDrive\10 Research Group\` excluding:
- `_archive/` (historical; outside the live ledger)
- `node_modules/`, `.next/`, `.venv/`, `__pycache__/`, `dist/`, `build/`, `.git/`
- `products/tenx10-platform/TENx10_Knowledge_Base/` (KB has its own internal index at `00_START_HERE.md` and `01_KA_INDEX.md` — referenced, not duplicated here)

Total in-scope as of 2026-05-05: **~140-145 files** (down from 163 pre-consolidation).

---

## Umbrella OS layer (15 files at root + .claude + .beads)

| File | Role | Lines | Status |
|---|---|---|---|
| `BRAIN.md` | Top-level operating system, factory architecture, Capitulate-and-Cultivate principle, observability contract, Single Sources of Truth index | 217 | live |
| `CLAUDE.md` | Session operating rules — partition rules, reading discipline, verification, information mode, delegation tree | 132 | live (post-2026-05-05 retrofit + reading-discipline addition) |
| `HIERARCHY.md` | Folder structure rules | 142 | live |
| `BUSINESS_HIERARCHY.md` | Org chart (entities, products, status, roster) | 98 | live |
| `AUTONOMOUS_QUEUE.md` | Rolling backlog of parallelizable work | 124 | live |
| `AUTONOMOUS_MODE_PROTOCOL.md` | Dispatch contract for autonomous-mode work | 106 | live |
| `EMPLOYEE_DIRECTORY.md` | Current agent roster + status (refreshed 2026-04-30) | 117 | live |
| `SKILL_DIRECTORY.md` | Skill index + recovery notes | 94 | live |
| `AGENTS.md` | Beads task tracking workflow (manual quick-ref deduplicated 2026-05-05; auto-managed BEADS INTEGRATION block stays) | ~40 | live |
| `AUDIT_BRIEF_2026-05-04.md` | Comprehensive audit briefing for outside reviewers | 153 | live (eventually archive when stale) |
| `DAD_ACCOUNTS.md` | DAD product email/account map | 63 | live |
| `.beads/README.md` | Beads quick-start | 55 | live |
| `mcp-tools/README.md` | Active MCP integrations summary | 31 | live |
| `scripts/setup_github_remote.md` | GitHub remote setup | 93 | live |
| `.claude/CLAUDE.md` | Org-level personal Claude rules | 31 | live |

**Removed 2026-05-05:**
- `commit.bat` — broken old helper, references nonexistent path. Deleted.
- `client_secret_tenx10.json` — moved out of working tree to `~/AppData/Roaming/dba/client_secret_tenx10.json` (not tracked, not synced).
- `DirtySnatcha_Advance_Webster_Hartford_Apr25.docx` — moved to `MANAGEMENT-TENx10/labels/DirtySnatcha Records/`.
- `temp_mgt.json` — temp PowerShell scratch dump. Deleted.

---

## docs/ (7 files non-recursive + subtrees)

| File | Role | Status |
|---|---|---|
| `docs/DELEGATION_PLAYBOOK.md` | Tier 1/2/3 (Claude → Gemini → Ollama) delegation playbook | live |
| `docs/Management-README.md` | Mgmt namespace pointer | live (intentionally minimal) |
| `docs/STATUS.md` | Portfolio status snapshot (dated 2026-04-22) | dated-snapshot — likely superseded by AUDIT_BRIEF |
| `docs/royalty-recovery-brief_2026-04-25.md` | Royalty recovery product brief | live |
| `docs/FILE_INVENTORY.md` | This file | live (created 2026-05-05) |
| `docs/FILE_SWEEP_2026-05-05_thispc.md` | Cross-filesystem sweep report (desktop machine) | live |
| `docs/LAPTOP_PROMPT_2026-05-05.md` | Turn-key prompt for laptop sweep session | live (one-time use) |

### docs/conversation-memory/

| File | Role | Status |
|---|---|---|
| `session-7c5e2266.md` | TENx10 session log | dormant (corpus snapshot) |
| `session-f21775be.md` | Pre-push hook session log | dormant |

`session-a1d17251.md` deleted 2026-05-05 (was 2 lines, empty placeholder).

### docs/playbooks/_strategy/funding-my-life/

| File | Role | Status |
|---|---|---|
| `README.md` | God-level factory strategy SSOT (NotebookLM-anchored) | live |

### docs/superpowers/specs/ (15 strategic specs, all live or BACKBURNERED)

Index lives in umbrella `BRAIN.md` "Single Sources of Truth" table. Notable:

| File | Role | Status |
|---|---|---|
| `2026-04-27-factory-architecture-design.md` | 5-layer agent OS spec | live (designed, awaiting build) |
| `2026-04-27-trading-shadow-test-design.md` | Trading-shadow A/B spec | live |
| `2026-04-28-strategic-review-and-gaps.md` | Risks audit, brain gaps | live (revisit-needed) |
| `2026-04-30-dsr-booking-flow-vision.md` | 10-stage booking pipeline | live (Stage 3 blocked) |
| `2026-04-30-dsr-label-dashboard.md` | 5-dimension label ops dashboard | live (UI not built; schema exists) |
| `2026-04-28-revenue-funds-trading.md` | Zero-capital revenue streams | live |
| `2026-04-30-booking-intelligence-engine.md` | 11 intelligence capabilities for offer eval | live |
| `2026-04-30-contacts-inbox-cleanup.md` | Layer 1 ops + Layer 2 tooling | live + BACKBURNERED |
| `2026-04-30-positioning-and-site-hierarchy.md` | Product hierarchy + positioning | live |
| `2026-04-28-gary-vee-local-agency-playbook.md` | Local agency playbook | BACKBURNERED |
| `2026-04-30-analytics-mcp-everywhere.md` | GA MCP install stub | BACKBURNERED, pursue/kill open |
| `2026-04-30-dsp-playlists-repost-chain.md` | DSP playlists strategy | live + BACKBURNERED |
| `2026-04-30-faceless-music-channel.md` | YouTube faceless channel | BACKBURNERED, pursue/kill open |
| `2026-04-30-label-catalog-evaluator.md` | Label catalog evaluator | BACKBURNERED, pursue/kill open |
| `2026-04-30-personal-brand-launch.md` | Personal brand spec | BACKBURNERED |

### docs/superpowers/plans/

| File | Role | Status |
|---|---|---|
| `2026-04-27-trading-shadow-implementation.md` | Detailed trading-shadow build plan | live |

### data/

| File | Role | Status |
|---|---|---|
| `data/conversation_log/README.md` | Shadow corpus directory README | live |

**Note:** Last `data/conversation_log/*.jsonl` activity is 2026-04-29. Auto-logging may have stopped 2026-04-30+ — flagged for verification.

---

## MANAGEMENT-TENx10 (the management business)

### Top-level (5 files)

| File | Role | Status |
|---|---|---|
| `BRAIN.md` | Management business state | live |
| `GMAIL_LABEL_TREE.md` | Gmail label hierarchy | live |
| `LAB10_PILOT_TRACK_RUN.md` | Leigh Bray pilot tracker | dormant (low recent activity) |
| `MHP_JERSEY_DROP.md` | Hockey jersey campaign | live |
| `WRS_PILOT.md` | WRS pilot doc | dormant |

### artists/ (5 BRAINs + 1 outreach)

`artists/{dark-matter, dirtysnatcha, hvrcrft, kotrax, whoisee}/BRAIN.md` — all live, per-artist context.

`artists/whoisee/outreach/2026-04-28-ep-shopping.md` — live (current outreach).

### labels/DirtySnatcha Records/

**Top files (all live unless noted):**

- `BRAIN.md` — DSR label state
- `README.md` — public DSR readme (495 lines)
- `SKILL.md` — DSR Claude skill
- `DSR_Master_Operating_Bible_v3.md` — canonical operations playbook
- `DSR_Tour_Book_2026_Clean.md` — current tour bible
- `DSR_4Week_Content_Calendar.md` — March 2026 content calendar (dated-snapshot)
- `dsr-booking-evaluator-SKILL.md`, `dsr-daily-briefing-SKILL.md` — Claude skills
- `DirtySnatcha_Advance_Email_Template.md` — **artist-level** advance email template
- `DSR_Advance_Email_Template.md` — **label-level** advance email template (moved up from `operations/organizing_music_extracted/` 2026-05-05; intentionally distinct from artist-level)
- `DirtySnatcha_Advance_Webster_Hartford_Apr25.docx` — moved here from umbrella root 2026-05-05
- `DirtySnatcha_Hypeddit_Strategy.md`, `DirtySnatcha_TourBlast_SubjectLines.md`
- `ABQ_Final_Push_Social_Content.md`, `ABQ_Shazam_Spike_Ad_Specs.md` — March 2026 dated-snapshots
- `show_folder_structure.md` — per-show folder convention

### labels/.../KA_v2_*.md (KA v2 stubs + drift-flagged)

| File | Status |
|---|---|
| `KA_v2_Part1_Foundation.md` | **stub** (2026-05-05) — pointer to platform KB |
| `KA_v2_Part2_Booking_Money.md` | **stub** — pointer to platform KB |
| `KA_v2_Part3_DSP_Content_Voice.md` | **stub** — pointer to platform KB |
| `KA_v2_Part4_Releases_Alerts_Integrations.md` | **stub** — pointer to platform KB |
| `KA_v2_Part5_Templates_Networks_Rules.md` | **drift-warned** — has Big Vision Productions / Tyler-at-Hiatus-Events promoter entry not in KB; fold pending |
| `KA_v2_INDEX.md` | **drift-warned** — has v1.0→v2.0 changelog history not in KB; KB has v2.0→v2.1 not in this; stale phone number for Lee Bray (586-277-2537 vs canonical 586-208-6886) |

### labels/.../contracts/ (2 active contracts, more incoming via Phase 0c)

- `2026-04-25-Dark-Matter-Barooka-Run-The-Game-DSR-Contract.md`
- `2026-04-25-Walter-Wilde-DirtySnatcha-Turn-Uppp-Purple-Circle-Battle-Outta-Space-DSR-Contract.md`

**Phase 0c queue** (deferred — not yet executed): scattered contracts in `OneDrive\Desktop\` + `D:\Downloads\` (PRYSM Mutual Release, DirtySnatcha Priyanx, Autokorekt Phonk Sauce, Sloth x Chackk Game, etc.) need to land here following the same naming convention.

### labels/.../merch/

`2026-EF-Hockey-Jersey/CAMPAIGN_PLAN.md` — live.

### labels/.../operations/organizing_music_extracted/ (4 files — staging folder)

| File | Status |
|---|---|
| `Platform_Spec_v1.md` | legacy-still-referenced (Feb 2026 platform spec) |
| `TENx10_Conversation_Export_2026-03-06.md` | dated-snapshot |
| `DSR_Gemini_Handoff_Package.docx` | extraction artifact |
| `DirtySnatcha_Rider_ABQ_03062026.docx`, `DirtySnatcha_Rider_Butte_05022026.docx` | live (per-show riders) |
| `KA_v2_Patch_PSIntegration.docx` | legacy (KA patch already merged into live KB modules) |

`DirtySnatcha_Advance_Email_Template.md` deleted 2026-05-05 (verified byte-identical dup of canonical at parent folder).

`DSR_Advance_Email_Template.md` moved up to parent folder 2026-05-05 (now sibling of DirtySnatcha-level template).

### labels/.../publishing/ (5 files — all live)

`COVER_SONGS_GUIDE_2026-04-25.md`, `EXTERNAL_LABEL_GAP_ANALYSIS_2026-04-25.md`, `PRO_REGISTRATION_GUIDE_DSR_ARTISTS_2026-04-25.md`, `PUBLISHING_GLOSSARY.md`, `README_CANONICAL.md` (publishing ops master).

### labels/.../releases-refs/

`README.md` — pointer to per-release catalog.

---

## products/

### TENX10_PLATFORM_MIRROR_README.md (umbrella-level mirror metadata)

Live — 28 lines explaining why the OneDrive copy of tenx10-platform exists (read-only mirror; canonical clone is `Projects\tenx10\`).

### products/tenx10-platform/ (TENx10 SaaS — read-only mirror; canonical at Projects\tenx10\)

**Top-level files (12 active + 1 .claude skill + 1 merch-store config):**

| File | Role | Status |
|---|---|---|
| `CLAUDE.md` | Operating rules (post-2026-05-05 retrofit, 139 lines, KB pointers replace knowledge dups) | live |
| `BRAIN.md` | Current build state | live |
| `AGENTS.md` | Next.js coding rules + Fallow audit gate (NOT an inventory stub) | live (auto-managed sections) |
| `AGENTS_AND_SKILLS_INVENTORY.md` | Agent + skill inventory; updated 2026-05-05 to reflect Gemini Gem dedup | live |
| `BUILDPLAN.md`, `BUILDPLAN_DAD.md` | Within-day + extended build plans | live (intentional separation) |
| `BUILD_EVOLUTION.md` | Append-only chronological audit trail (1337 lines) | live (immutable log) |
| `DEALS_HANDOFF.md` | Session handoff notes | live |
| `OVERNIGHT_NOTES.md` | Overnight work notes | live |
| `README.md` | Next.js bootstrap README | live |
| `SESSIONS.md`, `SESSION_START.md` | Session protocol | live |
| `TASKS.md` | Active task list | live |
| `.claude/skills/close.md` | Close skill | live |
| `merch-store/SETUP.md` | E-commerce subsystem config | live |

### products/tenx10-platform/_archive/ (post-2026-05-05 cleanup)

**Deleted 2026-05-05** (verified-superseded; live counterparts exist):
- `_old_ABQ_Final_Push_Social_Content.md` → MANAGEMENT live copy
- `_old_ABQ_Shazam_Spike_Ad_Specs.md` → MANAGEMENT live copy
- `_old_DSP_Hack_Checklist.md` → KB module 13
- `_old_DSR_4Week_Content_Calendar.md` → MANAGEMENT live copy
- `_old_dsr-booking-evaluator-SKILL.md` → MANAGEMENT live copy
- `_old_Tour_Marketing_Playbook_Full.md` → KB module 10 (was empty file anyway)
- `_old_KA_v2_Patch_PSIntegration.md` → merged into KB modules 3, 15, 17, 20 + dedicated KB module 30
- `_old_Gemini_Gem_Instructions.md`, `_old_Gemini_Gem_Instructions_1.md` → byte-verified dups of `_2.md`/`_3.md`

**Remaining (kept as legacy reference):**
- `_old_Gemini_Gem_Instructions_2.md` — Gemini Gem v1 (no AUTO-BRIEFING preamble)
- `_old_Gemini_Gem_Instructions_3.md` — Gemini Gem v2 (with AUTO-BRIEFING preamble)
- `_old_agent-system-prompt.md` — legacy Tour Marketing Agent (Meta-ads, distinct from current Xai)
- `MORNING_HANDOFF.md`, `OLD_VS_CURRENT_DEEP_DIFF.md`, `OVERNIGHT_STATUS.md` — historical session notes

### products/tenx10-platform/TENx10_Knowledge_Base/

31 modules. Internal index at `00_START_HERE.md` and `01_KA_INDEX.md`. **Not enumerated here** (own index is canonical).

### products/digital-booking-agent/ (DBA)

**Top-level (9 active .md after 2026-05-05 cleanup):**

| File | Role | Status |
|---|---|---|
| `CLAUDE.md` | Operating rules (post-retrofit, 134 lines) | live |
| `BRAIN.md` | Architectural state, migration timeline | live (created 2026-05-05) |
| `TASKS.md` | Open backlog | live |
| `ANALYST_AGENT.md` | Analyst agent deep spec | live |
| `DEPLOYMENT.md` | Deployment phases | live |
| `HANDOFF.md` | Session bridge — DirtySnatcha 14 booked 2026 shows | live |
| `PHASE_0_PLAYBOOK.md` | Day-by-day Phase 0 sequence | live |
| `PRD_model_routing.md` | Model router PRD (Phase 1 deferred) | planning |
| `PRODUCT_BRIEF.md` | Product spec (12 capabilities) | live |

**Archived 2026-05-05** (moved to `_archive/dated-snapshots/`):
- `MORNING_BRIEF_2026-05-04.md`
- `PROJECT_DIGEST_2026-04-30.md`
- `GEMINI_HANDOFF.md` (stale Phase 2 task delegation, references nonexistent path)

### products/digital-booking-agent/docs/ (4 files — all live)

`DOMAIN_MODEL.md` (offers ARE contracts), `FLOWS.md` (outreach + counter + radius audit), `GMAIL_OAUTH_SETUP.md`, `SESSION_STATE.md`.

### products/digital-booking-agent/prompts/ (7 files — all live)

`outbound_composer.md` is the **VOICE source of truth** (10 universal hard rules). Others: `analyst_pitch_pack.md`, `inbound_classifier.md`, `reporting.md`, `research.md`, `routing.md`, `supervisor.md`.

### products/digital-booking-agent/ subdirs (3 README files)

- `_staging/gigwell_scrape/README.md` — staging (active or abandoned? unclear)
- `agents/README.md` — Python agent CLI runner index
- `app/README.md` — Next.js routes index
- `scripts/README_outreach_pipeline.md` — 4-step pipeline

### products/trading-shadow/ (8 active files)

`BRAIN.md`, `CUTOVER_RUNBOOK.md`, `DISCORD_BOT_SETUP.md`, `README.md`, `ROLLBACK_HANDLER_SPEC.md`, `WAKE_UP_2026-04-30.md` (dated-snapshot — superseded by `agent_digest_2026-05-01.md`), `data/agent_digest_2026-05-01.md` (current snapshot), `scripts/README.md`. The `.pytest_cache/README.md` is auto-generated and gitignored.

### products/rim-shop/ (10 files — all live, project dormant)

`BRAIN.md`, `EBAY_LISTINGS_DRAFT.md`, `EBAY_LOOKUP.md`, `PILOT_BRIEF.md`, `SOW_v1.md`, plus 5 component specs (`chatbot/SYSTEM_PROMPT.md`, `email-sequences/ABANDONED_CART.md`, `google-ads/CAMPAIGN_PLAN.md`, `refinishing-agent/PRIORITIZATION_AGENT.md`, `site/LAUNCH.md`). All draft-complete, project blocked on WRS eBay handle confirmation + site deployment decision.

### products/system-steward/ (2 files)

`CONSOLIDATION_PATTERN.md` (DAD seed corpus, 6-step pattern), `model_router/README.md`.

---

## Pending (not yet enumerated here)

- **Phase 0c** — scattered DSR business artifacts in `OneDrive\Desktop\` + `D:\Downloads\`. See `docs/FILE_SWEEP_2026-05-05_thispc.md` Section "What needs to move where" for the move list. Will appear in this inventory once filed.
- **Laptop sweep results** — `docs/FILE_SWEEP_2026-05-05_laptop.md` will be written by laptop session (not yet run).
- **Drift fold-ins** for `KA_v2_Part5_Templates_Networks_Rules.md` and `KA_v2_INDEX.md` — once content is folded into KB, those become stubs.

---

## Counts (after 2026-05-05 consolidation)

| Layer | Files |
|---|---|
| Umbrella OS root | 15 |
| docs/ (incl. superpowers/) | ~25 |
| MANAGEMENT-TENx10 | ~50 (includes per-artist BRAINs, contracts, publishing, KA stubs) |
| products/tenx10-platform top + KB | 14 + 31 |
| products/digital-booking-agent | 19 (9 root + 4 docs + 7 prompts + 3 sub-READMEs) |
| products/trading-shadow | 8 |
| products/rim-shop | 10 |
| products/system-steward | 2 |
| **Total in scope** | **~140-145** |

Pre-consolidation count was 163. **Net delta: -18 to -23 files** (mostly mojibake-corrupted archive dups, KA v2 stubs, byte-verified Gemini Gem dups, empty placeholders, dated handoff snapshots).
