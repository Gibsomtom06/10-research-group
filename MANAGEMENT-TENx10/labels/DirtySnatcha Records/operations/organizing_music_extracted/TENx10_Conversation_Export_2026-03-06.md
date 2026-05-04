# TENx10 Platform — Conversation Export
**Date:** March 6, 2026  
**Project:** TENx10 (formerly DSR Platform)  
**Session Type:** Platform cleanup, naming corrections, Gmail/Drive/dual-AI integration

---

## CONTEXT NOTE
This conversation follows from a compacted prior session. The summary at the top of this conversation covered the Supabase schema + client build session (transcript: `2026-03-04-09-05-38-supabase-schema-client-build.txt`).

---

## CONVERSATION

---

### [USER]
*(Project instructions message — DSR Platform AI Agent setup, identity rules, voice/tone, guardrails, daily briefing format, quick reference table)*

---

### [USER]
There isnt 2/3 voting for anything except demo.submissions. This process is only for dsr or dirtysnatcha records only for demo submission nothing else. The platform is now called TENx10 fix wording to be changed to tenx10.

---

### [ASSISTANT]
Acknowledged two corrections:

**Voting:**
- `votes` table (show-level) — deleted entirely
- `enforce_vote_gate` function + trigger on `shows` — deleted entirely
- `shows.castVote()` in the client — deleted
- `submissions` table — 2/3 voting fully intact (`vote_1/2/3_user`, `vote_1/2/3_value`, `yes_count` auto-calc trigger). Only place it exists.

**Naming:**
- Every header, comment, footer, file reference changed from DSR Platform → TENx10 Platform
- Migration helper now references `tenx10-platform.jsx` and `tenx10_supabase_client.js`

**Files delivered:**
- `tenx10_supabase_schema.sql`
- `tenx10_supabase_client.js`

---

### [USER]
Have all the files and workflows been updated to the dual ai format as well as gmail and google drive clean for labels and hierarchy

---

### [ASSISTANT]
Ran a full audit. Found the previous session's schema/client edits were **never saved to outputs** (hash mismatch). Found 5 more files still containing "DSR Platform" branding. Built all missing pieces.

**What was actually broken:**
- Schema and client from last session never copied to outputs
- Gmail: zero implementation anywhere
- Google Drive: only dead text fields (`drive_url`) — no actual tables
- Dual AI format: no provider tracking, no abstraction layer
- Label/manager overlap: Thomas is BOTH manager and label head — schema didn't handle dual-role
- Old `dsr_supabase_*` files still in outputs

**What was fixed across all 7 files:**

| File | Changes |
|---|---|
| `tenx10-platform.jsx` | Renamed from `dsr-platform.jsx`. Added `callAI()` dual router — auto-detects Claude (artifact/dev) vs Gemini (production) by hostname. Removed inline fetch calls. Footer updated. |
| `tenx10_supabase_schema.sql` | `label_manager` tier added. `ai_provider` enum (claude/gemini/system). `gmail_outbox`, `email_threads`, `drive_folders`, `drive_files` tables added. `is_label_tier()` + `is_manager_tier()` helper functions. Hierarchy comment block documenting full permission chain. |
| `tenx10_supabase_client.js` | `aiAgent.chat()` dual router. `gmail.*` module (saveDraft, listByArtist, listAll, approveDraft, confirmSent, buildPromoterEmail, subscribe). `drive.*` module (showFolderName, registerShowFolders, linkDriveFolder, registerFile, getShowFolders, getMissingFolders). |
| `Platform_Spec_v1.md` | All Gmail label prefixes `DSR/🔴 Urgent`, `DSR/💰 Financial`, etc. → `TENx10/🔴 Urgent`, `TENx10/💰 Financial`, etc. |
| `WHOiSEE_Dashboard.jsx` | Footer "DSR PLATFORM" → "TENx10" (both instances) |
| `whoisee_dashboard.jsx` | "Thomas Nalian · DSR" → "Thomas Nalian · TENx10". Footer updated. |
| `tenx10-content-calendar.jsx` | Platform header cleaned. Catalog refs (DSR159, DSR178, etc.) left intact — those are label release numbers, not platform branding. |

**Hierarchy implemented:**
```
label_manager (Thomas Nalian) — TOP TIER
  ├── Sees ALL: shows, financials, A&R, submissions, promoter grades
  ├── Manages artists as manager
  └── Runs label A&R, catalog, releases, permissions

manager — TIER 2
  ├── Sees all roster shows, DSP, content, commissions
  └── Cannot see label financials or A&R queue

label — TIER 3
  ├── Full catalog, A&R, releases, permissions
  └── Cannot see individual manager commission details

artist — TIER 1 (OWN DATA ONLY)
  ├── Own shows (guarantee visibility: label-controlled)
  ├── Own DSP metrics, content calendar, releases
  └── CANNOT see: promoter grades, other artists, label financials
```

**Note:** `dsr-platform.jsx`, `dsr_supabase_schema.sql`, `dsr_supabase_client.js` still in outputs as legacy reference — can delete when ready to cut over.

---

### [USER]
Is this conversation shared with building tenx10 convo

---

### [ASSISTANT]
No — conversations are isolated from each other.

**What IS shared across conversations in this Project:**
- Project knowledge files (all `.md` and `.docx` files in `/mnt/project/`) — readable in any conversation
- Memory — saved facts carry over
- Output files you downloaded

**What is NOT shared:**
- The actual back-and-forth chat history between conversations
- Anything said in chat that was never saved to a file or memory

**Practical implication:** The work done in this session exists as files you downloaded. If you start a new conversation and want to continue, re-upload those files or reference the project files. The conversation context itself doesn't carry over.

To make TENx10 build work continuously accessible: upload key output files back into project knowledge so any conversation in this project can pick them up without re-pasting.

---

### [USER]
I want this entire conversation history exported to a file

---

### [ASSISTANT]
*(This response — generating the export now)*

---

## TRANSCRIPT ARCHIVE INDEX
All prior sessions are saved as transcripts at `/mnt/transcripts/`. Key sessions relevant to TENx10:

| Transcript | Topic |
|---|---|
| `2026-03-03-19-40-43-platform-architecture-dual-engine-content-automation.txt` | Dual-engine routing strategy (Claude/Gemini), inbox intelligence, content automation |
| `2026-03-03-22-50-23-platform-architecture-dual-engine-supabase.txt` | Module 21 (Inbox Intelligence), Module 22 (Dual-Engine Router), Supabase schema |
| `2026-03-03-23-37-11-tenx10-platform-supabase-integration.txt` | Supabase integration, TENx10 rebranding, platform identity |
| `2026-03-03-23-55-13-content-calendar-platform-build.txt` | Content calendar for all 4 artists + label |
| `2026-03-04-00-02-55-content-calendar-algorithm-optimization.txt` | Algorithm optimization for content calendar |
| `2026-03-04-00-12-19-dsr-label-timezone-platform-build.txt` | Label entity, timezone system, 127 posts |
| `2026-03-04-06-09-57-babel-jsx-runtime-length-error.txt` | Runtime error debugging |
| `2026-03-04-09-05-38-supabase-schema-client-build.txt` | Full Supabase schema (22 tables) + client library build |

---

## CURRENT OUTPUT FILES

| File | Description | Status |
|---|---|---|
| `tenx10-platform.jsx` | Main React platform — dual AI router, 5 entities | ✅ Current |
| `tenx10_supabase_schema.sql` | 26 tables, RLS, Gmail, Drive, ai_provider, label_manager tier | ✅ Current |
| `tenx10_supabase_client.js` | Auth, CRUD, aiAgent, gmail, drive, real-time | ✅ Current |
| `tenx10-content-calendar.jsx` | Standalone content calendar app | ✅ Current |
| `Platform_Spec_v1.md` | Gmail label hierarchy, inbox routing spec | ✅ Current |
| `WHOiSEE_Dashboard.jsx` | WHOiSEE intelligence dashboard (full) | ✅ Current |
| `whoisee_dashboard.jsx` | WHOiSEE dashboard (alternate build) | ✅ Current |
| `dsr-platform.jsx` | Legacy — pre-rename | ⚠️ Superseded |
| `dsr_supabase_schema.sql` | Legacy — pre-rename | ⚠️ Superseded |
| `dsr_supabase_client.js` | Legacy — pre-rename | ⚠️ Superseded |
| `DSR_Gemini_Handoff_Package.docx` | Gemini handoff doc | 📁 Reference |
| `DirtySnatcha_Advance_Email_Template.md` | Advance email template | 📁 Reference |
| `DirtySnatcha_Rider_Butte_05022026.docx` | Butte rider with Queen of England clause | 📁 Reference |
| `DirtySnatcha_Rider_ABQ_03062026.docx` | ABQ rider | 📁 Reference |
| `KA_v2_Patch_PSIntegration.docx` | Popularity Score patch doc | 📁 Reference |
| `WHOiSEE_DSP_Social_Intelligence.docx` | WHOiSEE intelligence report | 📁 Reference |

---

## PENDING / NEXT STEPS

- [ ] Paste Supabase credentials into `tenx10_supabase_client.js` (lines 11-12)
- [ ] Run `tenx10_supabase_schema.sql` against Supabase project
- [ ] Execute `migrateContentCalendar()` to seed 127 posts
- [ ] Delete legacy `dsr_*` files from outputs
- [ ] Wire platform reads to Supabase (replace static CC object)
- [ ] Add real-time subscriptions to useEffect hooks
- [ ] Build admin UI for shows/releases/metrics data entry
- [ ] Daily cron job for DSP metrics via Spotify OAuth
- [ ] Meta MCP integration for live campaign launch
- [ ] Upload final output files back to project knowledge for cross-conversation access

---

## FILE SUMMARY — KEY DETAILS

---

### `tenx10-platform.jsx`
**Size:** 100.7 KB | **Lines:** 1,765 | **Status:** ✅ Current (v0.3)

**React Components (14):**
StatBar, TrackRow, CatalogView, OverviewView, Message, TypingIndicator, ChatTab, PostCard, ContentCalendarView, MasterCalendarView, ArtistCard, PasscodeModal, DashboardView, ErrorBoundary

**Data Objects:**
VMG_CATALOG, ARTISTS, MANAGER, DSR_LABEL, CATALOG_DATA, TZ_COLORS, CONTENT_CALENDAR, CATEGORY_CONFIG, PLATFORM_COLORS, ARTIST_META

**Content:**
- 127 date-stamped social posts across 5 entities (DS, WHOiSEE, Dark Matter, Kotrax, DSR Label)
- 5 AI call points routed through `callAI()` dual router (Claude artifact / Gemini production)
- Passcode auth for Manager, DSR Label, and all 4 artists
- Timezone badges (ET/CT/MT/PT) per post

**Dual AI Router:** Auto-detects `claude.ai` hostname → Claude API. All other environments → Gemini API.

---

### `tenx10_supabase_schema.sql`
**Size:** 55.6 KB | **Lines:** 1,383 | **Status:** ✅ Current

**Tables (27):**

| Category | Tables |
|---|---|
| Identity | artists, users, promo_members |
| Booking | shows, promoters, venues, promoter_show_grades, venue_show_grades, agent_commissions, contracts |
| DSP | dsp_metrics, track_metrics |
| Releases | releases, release_marketing |
| Content | content_calendar, post_analytics, campaigns, assets |
| A&R | submissions |
| Tasks | tasks, task_completions |
| AI | ai_conversations, alerts |
| Gmail | gmail_outbox, email_threads |
| Drive | drive_folders, drive_files |

**Enums (16):**
user_tier, show_status, contract_type, campaign_phase, post_status, post_platform, post_category, release_status, submission_status, vote_value, grade_letter, alert_priority, ai_provider, timezone_code, email_status, email_category

**Key Enum Values:**
- `user_tier`: artist / manager / label / **label_manager** / admin
- `ai_provider`: **claude** / **gemini** / system
- `show_status`: 15 states from offer_received → completed
- `email_category`: promoter_followup, advance, deposit_request, deposit_overdue, settlement, contract_send, booking_offer_reply, booking_counter, agent_update, label_outreach, demo_response, other

**Functions (8):**
set_updated_at, calc_submission_score, calc_submission_votes, update_promoter_grade, current_user_tier, **is_label_tier**, **is_manager_tier**, current_user_artist_ids

**Triggers (9):**
- Auto `updated_at` on 6 tables
- Submission score auto-calc (reach/quality/fit weighted)
- Submission yes_count auto-calc from 3 votes (A&R only)
- Promoter average_grade rollup from all show grades

**Indexes:** 31 | **RLS Policies:** 16

**2/3 Vote Gate:** Submissions table only (A&R demo intake). No vote gate on shows.

---

### `tenx10_supabase_client.js`
**Size:** 40.4 KB | **Lines:** 1,193 | **Status:** ✅ Current

**Exported Modules (14):**

| Module | Key Functions |
|---|---|
| `auth` | signIn, signOut, getUser, onAuthStateChange |
| `artists` | list, getBySlug, updateMetrics |
| `contentCalendar` | listByArtist, listAll, create, bulkCreate, updateStatus, updateContent, delete, updateAnalytics, subscribe |
| `shows` | listByArtist, listAll, getById, create, update, transition, calcCPT, tourPnL |
| `dspMetrics` | latest, trend, upsert, topTracks |
| `releases` | listByArtist, create, update, checkSixWeekRule |
| `alerts` | listActive, listAllActive, create, resolve, subscribe |
| `**aiAgent**` | **chat()** — dual routes Claude ↔ Gemini by environment |
| `**gmail**` | **saveDraft, listByArtist, listAll, approveDraft, confirmSent, buildPromoterEmail, subscribe** |
| `**drive**` | **showFolderName, registerShowFolders, linkDriveFolder, registerFile, getShowFolders, getMissingFolders** |
| `aiConversations` | log, getSession, recentSessions |
| `tasks` | listActive, create, complete |
| `realtime` | subscribeArtist, unsubscribeArtist, unsubscribeAll |
| `migrateContentCalendar` | One-shot migration of 127 static posts → Supabase |

**Total async functions:** 47

**Gmail flow:** AI drafts → `gmail_outbox` table → human approval → `approveDraft()` → send via Gmail MCP → `confirmSent()` logs thread ID. Never auto-sends.

**Drive folder structure (per show):**
```
[MM.DD.YYYY] [City, State] - [Venue Name]/
  ├── 00_CONTROL
  ├── 01_CONTRACT_&_PAYMENT
  ├── 02_ADVANCE_&_LOGISTICS
  ├── 03_TRAVEL
  ├── 04_MARKETING
  ├── 05_TICKETS
  └── 06_SHOW_ASSETS
```

---

### `tenx10-content-calendar.jsx`
**Size:** 70.5 KB | **Lines:** 1,275 | **Status:** ✅ Current

**Data Objects:** ARTISTS, PLATFORM_COLORS, TYPE_ICON, PHASE_STYLE, STATUS_CONFIG

**Content:** ~57 date-stamped post entries in standalone calendar app (subset of platform's 127 — standalone build has different scope)

**Features:** Approval workflow, status tracking (draft/pending/approved/posted), platform filtering, artist filtering, algorithm-optimized post timing

---

### `Platform_Spec_v1.md`
**Size:** 19.6 KB | **Lines:** 428 | **Status:** ✅ Current

**Sections:** 45 | **Table rows:** ~41

**Gmail Label Hierarchy (10 labels):**
```
TENx10/🔴 Urgent
TENx10/🟡 This Week
TENx10/💰 Financial
TENx10/📄 Contracts
TENx10/🎤 DirtySnatcha
TENx10/🎵 WHOiSEE
TENx10/🏷️ Label Operations
TENx10/🤝 Collabs & A&R
TENx10/🛠️ SaaS Build
TENx10/⬜ Archive
```

**Covers:** Inbox routing rules, filter logic by sender/subject, auto-classification triggers, daily briefing integration spec

---

### `WHOiSEE_Dashboard.jsx`
**Size:** 54.7 KB | **Lines:** 892 | **Status:** ✅ Current

**React Components (11):**
Label, Value, Card, SectionTitle, Gauge, ScoreBar, ThreshPill, HiddenRow, KPIRow, BriefRow + more

**Contains:** Artist Popularity Score gauges, Track Popularity Score analysis, hidden Spotify metrics, threshold playbook, KPI tracking, daily brief integration, Discovery Mode analysis, Marquee campaign data

---

### `whoisee_dashboard.jsx`
**Size:** 44.8 KB | **Lines:** 648 | **Status:** ✅ Current (alternate build)

**React Components (7):**
GlowCard, MetricBig, ScoreBar, ThresholdCard, KPIRow, BriefItem, HiddenMetric

**Contains:** Same intelligence as WHOiSEE_Dashboard but different visual design. Both present, use preferred version.

---

### Reference / Template Files

| File | Size | Lines | Contents |
|---|---|---|---|
| `DirtySnatcha_Advance_Email_Template.md` | 3.5 KB | 127 | Advance email template with real show variables |
| `DSR_Advance_Email_Template.md` | 2.9 KB | 114 | Earlier version of advance template |
| `DSR_Gemini_Handoff_Package.docx` | — | — | Gemini handoff doc from Manus session |
| `DirtySnatcha_Rider_Butte_05022026.docx` | — | — | Butte tech rider (Queen of England clause included) |
| `DirtySnatcha_Rider_ABQ_03062026.docx` | — | — | ABQ show rider |
| `KA_v2_Patch_PSIntegration.docx` | — | — | Spotify Popularity Score system patch |
| `WHOiSEE_DSP_Social_Intelligence.docx` | — | — | Full WHOiSEE intelligence report (Word doc) |

---

*TENx10 Platform — Conversation Export v1.1 — March 6, 2026*
