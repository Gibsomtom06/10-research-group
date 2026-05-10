# TENx10 action-surface audit — per-page row-action gap (2026-05-09)

**Status:** spec, no code yet.
**Owner:** Tenx10 platform.
**Active dev clone:** `C:\Users\slash\Projects\tenx10\` (origin `Gibsomtom06/tenx10`, branch `master`).
**Read-only mirror:** `C:\Users\slash\OneDrive\10 Research Group\products\tenx10-platform\` — out of sync; the active clone has been pulled current to `0df778d` for this audit.

---

## Why

Thomas keeps doing his real management work in Claude Code conversations instead of inside TENx10, even though TENx10 is positioned as the management OS. Diagnosis: TENx10 is a **viewer**, not an **action surface**. It reads the database fine but most rows on most list pages are dead ends — no button to do the next thing. Claude Code wins because Claude Code can execute (drafts emails, sends contracts, runs pipelines, kicks off tools).

Thomas's standing rule (memory `feedback_actionable_lists.md`, re-flagged 2026-05-07): **every visible row needs a button that does the thing — Draft pitch / Send advance / Mark done / Open thread.** A list of names/promoters/deals only helps if each row has a one-click action. Static reading-only lists waste his time.

This spec audits every TENx10 surface that lists rows, identifies the missing per-row action button(s), and specifies the backend wiring (Supabase columns, API routes, agent tools, Gmail/Drive/Calendar/Dropbox-Sign integrations) needed to make the page usable. Phase 1 ships the cheapest wins.

The deal **detail** page ([`src/app/dashboard/deals/[id]/DealActions.tsx`](../../../products/tenx10-platform/src/app/dashboard/deals/%5Bid%5D/DealActions.tsx)) is already the gold standard — Accept offer / Counter / Pass / Generate draft / Fire Confirm Workflow / Build Meta Ads / Open in Gmail. The audit's job is to push that surface area out across every other list page.

---

## Scope

**Included** — every list view under `src/app/dashboard/` and the artist sub-routes that render rows:

- `/dashboard` (home / bird's-eye)
- `/dashboard/briefing` (morning briefing)
- `/dashboard/deals` (Today / Map / Calendar tabs)
- `/dashboard/deals/[id]` (already strong — gap analysis only)
- `/dashboard/booking/outbound` (booking-agent v1 outbound moves)
- `/dashboard/outreach` (Smart Outreach + 5 sibling tabs)
- `/dashboard/contracts`
- `/dashboard/label` (5-tab — roster, catalog, P&L, A&R)
- `/dashboard/publishing`
- `/dashboard/releases`, `/dashboard/releases/[id]`
- `/dashboard/artists`
- `/dashboard/tasks`
- `/dashboard/venues`
- `/dashboard/spotify` (per-artist daily snapshots)
- `/dashboard/agent` (chat — flagged as the executor for many actions)

**Excluded** — pages that are not row-list views:

- `/dashboard/finance`, `/dashboard/revenue`, `/dashboard/analytics` (chart pages, not row-action surfaces)
- `/dashboard/gmail` (OAuth setup screen)
- `/dashboard/settings`, `/dashboard/import`, `/dashboard/onboarding`
- `/dashboard/dad`, `/dashboard/mhp`, `/dashboard/rim`, `/dashboard/trading` (other product mounts)
- The `/artist/*` artist-portal tree (not the manager surface)

**Briefing reconciliation** — the upstream briefing claimed migrations 023 (`live_perf_registrations`), 036 (`signing_label`/`management_only`), 038 (ISRC reconciliation), 039 (5 publishing export views), 040+041 label roster views. Only **037** (`publishing_registries` lookup), **047** (`release_projects`), **048** (`festivals`), **049** (`outbound_moves`), **050** (artist_members admin recursion fix) actually exist in `supabase/migrations/`. The legacy `publishing_registrations` table holds the per-track PRO state today. `live_perf_registrations` does **not** exist in the active repo and is treated as a new migration in this spec. See open questions.

---

## Per-page audit

Rows in the tables below: **row type** | **what it shows now** | **missing actions** | **backend wiring**.

### `/dashboard` — bird's-eye home

[`src/app/dashboard/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/page.tsx)

Three list-shaped surfaces: `RevenuePieHero` (chart, excluded), `PillarBreakdownList`, `InboxPanel` (offers).

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Inbox offer (from `deals` where `status='inquiry'`, last 30d, future show date) | Title, amount, age, link to detail | **Draft response · Accept · Pass · Snooze 24h** inline on the card | Already have `/api/deals/draft` (POST `{dealId}`) and direct `deals.status` write. New: `/api/deals/[dealId]/snooze` (sets `snoozed_until` — new column on `deals`). |
| Pillar breakdown row | Revenue figure + drill link | **Open detail** (already a link). OK. | n/a |

### `/dashboard/briefing` — morning triage

[`src/app/dashboard/briefing/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/briefing/page.tsx)

Each "Needs your attention" item is a `<Link>` — no inline action. This page is supposed to be Thomas's first stop of the day; it's the single place where row-action discipline matters most.

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Show in next 7 days (urgency=show) | Linked label + amount | **Send advance · Open promoter thread · Mark advance sent · Add to Calendar** | `/api/deals/confirm-workflow` already builds advance email; surface a one-click "Send advance" that flips a new `deals.advance_sent_at`. Calendar create via agent tool (see registry). Promoter thread opens `gmail_thread_id` if set. |
| Pending negotiation (urgency=deal) | Label + amount | **Draft response · Counter at floor · Pass** | Reuse `/api/deals/draft`; floor counter needs `artist.guarantee_floor` column read + a templated counter draft (skill exists in agent system prompt, not exposed as endpoint). |
| Open task (urgency=task) | Title + due date | **Mark done · Snooze · Open related deal/release** | `/api/tasks/toggle` exists (added 2026-05-07). Wire as button. Snooze needs `tasks.snoozed_until`. |
| Email needing action (urgency=email) | Subject + amount | **Draft response · Open thread · Convert to deal** | Same as pending negotiation. |

### `/dashboard/deals` — pipeline (Today/Map/Calendar)

[`src/app/dashboard/deals/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/deals/page.tsx) → [`DealsView.tsx`](../../../products/tenx10-platform/src/app/dashboard/deals/DealsView.tsx) → [`views/TodayView.tsx`](../../../products/tenx10-platform/src/app/dashboard/deals/views/TodayView.tsx).

Every deal row in every section is a `<Link>` to detail. Zero inline actions despite this being the daily booking pipeline.

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Action-item deal (red/yellow urgency) | City, urgency dot, days-out, amount | **Draft reply · Accept · Counter · Pass · Snooze · Open thread** (mirror what `DealActions.tsx` exposes on detail) | All endpoints exist (`/api/deals/draft`, `/api/deals/[dealId]/status`). Build a shared `<DealRowActions/>` component reused on home, briefing, and Today view. |
| Pipeline-stage deal (inquiry/offer/negotiating column) | Mini card | **Draft reply · Advance status (next stage button)** | `deals.status` direct write. Status next-stage helper already encoded in `STATUSES` array in `DealActions.tsx`. |
| Confirmed-30d show row | Date, city, venue, amount, days-out | **Send advance · Calendar add · Run Shazam Spike · Build Meta Ads** | Advance: `/api/deals/confirm-workflow` already writes advance draft. Meta Ads: `/api/meta-ads/campaign-brief` exists. Shazam Spike + Calendar add are new. |
| Recently completed/cancelled (collapsed) | Status badge | **Reopen (set status back to confirmed) · Delete** — only useful as overflow | `deals.status` write. |

### `/dashboard/deals/[id]` — deal detail (gold standard)

[`src/app/dashboard/deals/[id]/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/deals/%5Bid%5D/page.tsx) + [`DealActions.tsx`](../../../products/tenx10-platform/src/app/dashboard/deals/%5Bid%5D/DealActions.tsx).

This page already covers the row-action rule: **Accept offer · Counter offer · Pass · Generate draft · Fire Confirm Workflow · Build Meta Ads · View in Gmail · Ticket Sales · Social Tracking**. Use this as the template for every other surface. Two gaps:

| Gap | Action needed | Backend wiring |
|---|---|---|
| Contract send | **Send contract via Dropbox Sign** + per-signer state | New `/api/deals/[dealId]/send-contract` POSTs to Dropbox Sign API; new tables `contract_signers` + columns `deals.contract_status` ('not_sent'/'sent'/'partial'/'fully_signed') + `deals.signature_request_id`. |
| BMI/ASCAP live registration | **Register at BMI Live** / **Register at ASCAP OnStage** for the show's setlist | New `live_perf_registrations` table (P0 queue item already names this). New `/api/deals/[dealId]/register-perf` opens portal URL with prefilled querystring + creates registration row. |

### `/dashboard/booking/outbound` — agent's daily plays

[`src/app/dashboard/booking/outbound/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/booking/outbound/page.tsx).

This is the canonical violation. The agent computes ranked outbound moves daily into `outbound_moves` (status enum: `pending` / `pitched` / `dismissed` / `converted`). The UI renders cards with score, reason, target city, promoter name, promoter email — and **zero buttons**. Status never advances. Same row stays "pending" forever even after Thomas pitches in Gmail manually.

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Outbound move (warm_pitch / cold_pitch / routing_gap / momentum_market / double_booking) | Score, reason, city, promoter name+email, grade | **Draft pitch · Pitched (mark) · Dismiss · Convert to deal · Open thread** | `outbound_moves` already has the columns (`status`, `pitched_at`, `dismissed_at`, `converted_deal_id`). New endpoint `/api/booking-agent/outbound/[moveId]` PATCH. Draft pitch can reuse `/api/outreach/generate-pitch` if the move references a `target_contact_id`. |

### `/dashboard/outreach` — Smart Outreach (6 tabs)

[`src/app/dashboard/outreach/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/outreach/page.tsx) → [`SmartOutreachClient.tsx`](../../../products/tenx10-platform/src/app/dashboard/outreach/SmartOutreachClient.tsx).

This page already has actions on most rows (Generate Pitch / Smart Pitch / View / Re-pitch / Open in Gmail / Tour Routing Blast). It's the **second-best** page in the app after deal detail. Only minor gaps:

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Promoter Research result (live web search) | Name, grade, notes, email, website | **Add to contacts (already-on-row but only via mailto link) · Generate pitch directly from research row** | Already have `/api/contacts` POST and `/api/outreach/generate-pitch`. Missing: a "+Add & pitch" button on each research row. |
| Weekday Show Finder result | Venue, city, day, frequency, contact | **Add to contacts · Generate pitch** | Same as above. |
| Routing Gap card | Suggested city, gap days | "Find Promoters" exists. Add: **Pitch all graded-A in this city in one click** (1-row-equivalent). | Reuse existing `/api/outreach/routing-blast` scoped to one city. |
| All-contacts row (`PitchCard`) | Name, status badges, history | Already has Generate Pitch. **Mark contacted manually** if Thomas pitched outside the system. **Mark dead.** | New columns `contacts.pitch_status` already exists; need a status-change dropdown on the card. |

### `/dashboard/contracts`

[`src/app/dashboard/contracts/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/contracts/page.tsx).

Pure read-only table. Column for HGR (hotel/ground/rider) detection and signed date — **no Send button, no per-signer status, no Open Drive folder, no Open Adobe Sign envelope**. This is where DSR contract orchestration is supposed to live but currently happens in Adobe Sign + Drive directly.

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Contract row | Title, artist, deal link, HGR icons, status badge, signed date | **Send via Dropbox Sign · Open envelope · Per-signer state · Open signed PDF in Drive · Mark voided** | New tables: `contract_signers` (`contract_id`, `signer_email`, `signer_name`, `role`, `state` enum, `signed_at`). New endpoint `/api/contracts/[id]/send` (Dropbox Sign API call). New column `contracts.signature_request_id`, `contracts.drive_folder_url`. Status pull via `/api/contracts/[id]/refresh-status` calling Dropbox Sign GET. |

### `/dashboard/label` — DSR label dashboard (5 tabs)

[`src/app/dashboard/label/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/label/page.tsx) → [`LabelDashboardClient.tsx`](../../../products/tenx10-platform/src/app/dashboard/label/LabelDashboardClient.tsx) + 3 tab files.

Mostly read-only. Stats blocks are fine. Tabs vary:

- **Roster tab** ([`LabelRosterTab.tsx`](../../../products/tenx10-platform/src/app/dashboard/label/LabelRosterTab.tsx)) — list of artists.
- **Catalog tab** ([`LabelCatalogTab.tsx`](../../../products/tenx10-platform/src/app/dashboard/label/LabelCatalogTab.tsx)) — VMG product catalog.
- **P&L tab** ([`LabelPnlTab.tsx`](../../../products/tenx10-platform/src/app/dashboard/label/LabelPnlTab.tsx)) — per-release P&L.

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Roster artist | Name, status, ASCAP/BMI badges | **Open artist detail · Draft management update · Mark active/inactive · View deals** | Already have `/dashboard/artists/[id]` route. Draft update reuses agent tool registry. Status write to `artists.status`. |
| VMG catalog row (release+track) | UPC, title, artists, ISRC, play link | **Open Spotify (play link is a link)** is fine. **Mark VMG-uploaded · Re-register at MLC · Run lyric flag** — all missing. | New `releases.lyric_flag_status` + `lyric_flag_results_url`. Run via agent tool `lyric_flagger_run`. |
| Pending release (`dsr_pending_releases`) | UPC, title, artist, status, submitted_at | **Mark live · Open VMG portal · Open Drive folder** | Status write to `dsr_pending_releases.status`. Drive URL field already exists. |
| Per-release P&L row | Catalog#, title, gross, net, costs, profit | **Open release detail · Drill into costs · Forecast** | Open release links to a release-detail page that doesn't exist yet on the label tab side. Current `/dashboard/releases/[id]` is the rollout-project view, not the catalog view. |

### `/dashboard/publishing` — PRO registrations tracker

[`src/app/dashboard/publishing/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/publishing/page.tsx) → [`PublishingClient.tsx`](../../../products/tenx10-platform/src/app/dashboard/publishing/PublishingClient.tsx).

**The single worst offender in the app.** The page literally renders an "action needed" badge per row with no action button next to it. Estimates "$X uncollected" and shows BMI/ASCAP/MLC/SX/CMRRA dots — and you can do nothing from this page.

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Track row (one per `publishing_registrations` row, joined to track) | Title, ISRC, BMI/ASCAP/MLC/SX/CMRRA dots, share, label, "action needed" badge | **Register at BMI · Register at ASCAP · Register at MLC · Register at CMRRA · Mark registered (manual) · Open portal · Generate submission CSV** | Each PRO is an external portal. Per-row buttons should: (1) `window.open()` the portal pre-filled where possible; (2) optimistically write `bmi_registered`/`ascap_registered`/`mlc_registered`/etc to true; (3) record the registration date in new columns `bmi_registered_at`, etc. New endpoint `/api/publishing/[trackId]/mark-registered` `{ pro }`. CSV submission needs new endpoint `/api/publishing/export?pro=mlc&artist=...` to dump rows formatted for the registry's bulk-upload spec. |

The P0 queue items "BMI Live registration — DirtySnatcha for 17 TMTYL shows", "ASCAP OnStage — Dark Matter", and "WHOiSEE BMI Live registration" require a separate per-show registration UI — see Phase 2 below.

### `/dashboard/releases` and `/dashboard/releases/[id]`

[`src/app/dashboard/releases/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/releases/page.tsx) and [`releases/[id]/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/releases/%5Bid%5D/page.tsx).

Each release row links to detail. Detail page has per-task `MarkDoneButton` — that's the only action.

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Release row (list) | Title, artist, date, countdown, progress | **Open Drive folder · Run lyric flag · Send contracts · Open release detail** | New `release_projects.drive_folder_url` (might already exist; verify against migration 047). Lyric flag: agent tool `lyric_flagger_run` writes job id back into `release_projects.lyric_flag_job_id`. |
| Release-detail header | Title, status, % done | **Mark phase complete · Re-roll tasks from template · Open all task calendar events** | Status write. Re-roll endpoint already implied by template system (migration 047 `rollout_templates`). |
| Phase column task | Title, description, due date, calendar link | **Mark done (exists)** · **Reschedule · Open in Calendar (link exists when event posted)** | Reschedule writes `tasks.due_date`. Already wired. |

### `/dashboard/artists`

[`src/app/dashboard/artists/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/artists/page.tsx).

| Row type | What it shows now | Missing actions | Backend wiring |
|---|---|---|---|
| Artist row | Name, genre, Spotify icon, latest VMG, lifetime VMG, Portal invite, status, View link | **Draft management update · Open Spotify daily · Open last gmail thread · Open deals filtered by artist · Open releases filtered by artist** | Spotify daily exists per autopull (`MANAGEMENT-TENx10/clients/HVRCRFT/spotify-daily/`). Surface as a drawer pulled in via cron-loaded snapshot table (new `artist_spotify_daily` table) instead of file-on-disk. Filter links: `/dashboard/deals?artist=<id>` already works; add explicit per-row buttons. |

### `/dashboard/tasks`

[`src/app/dashboard/tasks/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/tasks/page.tsx).

Already has actions: status dropdown, delete button, kanban move. **Keep as-is for Phase 1.** One gap:

| Gap | Action needed | Backend wiring |
|---|---|---|
| Email-type tasks | **Draft email · Open thread** when task type is `email` | Pull `task.linked_deal_id` (new column) → reuse `/api/deals/draft`. |

### `/dashboard/venues`, `/dashboard/spotify`, `/dashboard/agent`

[`src/app/dashboard/venues/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/venues/page.tsx), [`spotify/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/spotify/page.tsx), [`agent/page.tsx`](../../../products/tenx10-platform/src/app/dashboard/agent/page.tsx).

| Page | Row | Missing actions |
|---|---|---|
| `/dashboard/venues` | Venue row | **Draft outreach · Open last deal · Mark blacklist · Find similar capacity** |
| `/dashboard/spotify` | Per-artist autopull row | **Trigger pull now · Open snapshot · Diff vs yesterday** |
| `/dashboard/agent` | Chat — not a list page; called out in agent registry section below |

The chat surface ([`src/app/api/agent/route.ts`](../../../products/tenx10-platform/src/app/api/agent/route.ts) currently runs Gemini with a `buildManagerContext` injection at line 138. **It cannot execute any of the actions above today** — it's read-only context. The P0 queue item "Discord Xai — Supabase live context (Phase 1 of 'everything connected')" plans Option B layer (Anthropic tool-use loop) on top — that layer is the executor for any agent-driven row action button.

### Festivals — page does not exist

Migration 048 created the `festivals` table with bass/EDM circuit hand-seeded rows. There is no `/dashboard/festivals` route. Booking-agent v2 (B1/B2/B3 in the queue) is meant to consume festivals for radius-clause checks. A list page should exist:

| Row type | What it shows | Missing actions | Backend wiring |
|---|---|---|---|
| Festival row | Name, dates, city, capacity | **Pitch artist for stage · Mark applied · Add radius-clause flag to nearby deals** | New page. New table `festival_pitches` (`festival_id`, `artist_id`, `status`, `pitched_at`). |

### Live performance registrations — table does not exist

The P0 queue items ("BMI Live registration — DirtySnatcha for 17 TMTYL shows", "ASCAP OnStage — Dark Matter") need a per-show-per-artist registration tracker. The briefing referenced migration 023 — that's `dsr_data_artists.sql` in the active repo, **not** a `live_perf_registrations` table. This needs to be created.

| Row type | What it shows | Missing actions | Backend wiring |
|---|---|---|---|
| Show-registration row (one per (show, artist, registry)) | Show date, venue, artist, registry (BMI Live / ASCAP OnStage), portal status, set length | **Register at portal (deep link) · Mark registered · Attach setlist · Generate submission XML** | New table `live_perf_registrations`. New surface — could live as a tab on `/dashboard/deals/[id]` or as a standalone `/dashboard/publishing/live` page. |

---

## Schema gaps — consolidated

Group by migration. Numbers continue from 050.

### Migration 051 — deal action surface

```sql
ALTER TABLE deals
  ADD COLUMN snoozed_until TIMESTAMPTZ,
  ADD COLUMN advance_sent_at TIMESTAMPTZ,
  ADD COLUMN gmail_thread_id TEXT,
  ADD COLUMN last_action_at TIMESTAMPTZ,
  ADD COLUMN contract_status TEXT
    CHECK (contract_status IN ('not_sent','sent','partial','fully_signed','voided'))
    DEFAULT 'not_sent',
  ADD COLUMN signature_request_id TEXT;

ALTER TABLE tasks
  ADD COLUMN snoozed_until TIMESTAMPTZ,
  ADD COLUMN linked_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  ADD COLUMN linked_release_project_id UUID REFERENCES release_projects(id) ON DELETE SET NULL;

ALTER TABLE outbound_moves
  ADD COLUMN gmail_thread_id TEXT,
  ADD COLUMN last_action_at TIMESTAMPTZ;
```

### Migration 052 — contract signing

```sql
CREATE TABLE contract_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_email TEXT NOT NULL,
  signer_name TEXT,
  role TEXT,                                   -- 'artist'|'manager'|'label'|'co_writer'|'venue'
  state TEXT NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','signed','declined','viewed')),
  state_updated_at TIMESTAMPTZ,
  signature_id TEXT,                            -- Dropbox Sign per-signer id
  reminder_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contracts
  ADD COLUMN signature_request_id TEXT,        -- Dropbox Sign signature_request_id
  ADD COLUMN drive_folder_url TEXT,
  ADD COLUMN sent_at TIMESTAMPTZ,
  ADD COLUMN voided_at TIMESTAMPTZ;
```

### Migration 053 — release action surface

```sql
ALTER TABLE release_projects
  ADD COLUMN drive_folder_url TEXT,
  ADD COLUMN lyric_flag_status TEXT
    CHECK (lyric_flag_status IN ('not_run','queued','running','done','failed')),
  ADD COLUMN lyric_flag_job_id TEXT,
  ADD COLUMN lyric_flag_results_url TEXT,
  ADD COLUMN vmg_uploaded_at TIMESTAMPTZ;
```

### Migration 054 — publishing per-track action surface

```sql
ALTER TABLE publishing_registrations
  ADD COLUMN bmi_registered_at TIMESTAMPTZ,
  ADD COLUMN ascap_registered_at TIMESTAMPTZ,
  ADD COLUMN mlc_registered_at TIMESTAMPTZ,
  ADD COLUMN soundexchange_registered_at TIMESTAMPTZ,
  ADD COLUMN cmrra_registered_at TIMESTAMPTZ,
  ADD COLUMN last_action_at TIMESTAMPTZ;
```

### Migration 055 — live performance registrations

```sql
CREATE TABLE live_perf_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  registry TEXT NOT NULL
    CHECK (registry IN ('bmi_live','ascap_onstage','sesac_live','prs_concerts','socan_setlist')),
  portal_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (portal_status IN ('pending','submitted','accepted','rejected','paid')),
  submitted_at TIMESTAMPTZ,
  setlist JSONB,                                 -- array of { title, isrc?, iswc?, share? }
  external_ref TEXT,                             -- portal-side confirmation id
  amount_paid NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (deal_id, artist_id, registry)
);

ALTER TABLE live_perf_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY lpr_read_member
  ON live_perf_registrations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM artist_members am
    WHERE am.user_id = auth.uid() AND am.artist_id = live_perf_registrations.artist_id
  ));

CREATE POLICY lpr_write_member
  ON live_perf_registrations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM artist_members am
    WHERE am.user_id = auth.uid() AND am.artist_id = live_perf_registrations.artist_id
  ));
```

### Migration 056 — festival pitches

```sql
CREATE TABLE festival_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'considering'
    CHECK (status IN ('considering','pitched','rejected','offered','confirmed','declined')),
  pitched_at TIMESTAMPTZ,
  offer_amount NUMERIC,
  notes TEXT,
  gmail_thread_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (festival_id, artist_id)
);
```

### Migration 057 — Spotify daily snapshot table (read-from-DB instead of file)

```sql
CREATE TABLE artist_spotify_daily (
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  monthly_listeners INTEGER,
  followers INTEGER,
  popularity INTEGER,
  raw JSONB,
  pulled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artist_id, snapshot_date)
);
```

(Today the HVRCRFT pull writes to `MANAGEMENT-TENx10/clients/HVRCRFT/spotify-daily/`. Phase 2 wires the cron to write here as well.)

---

## Agent tool registry

The `/api/agent` route is currently Gemini-backed read-only context. The P0 queue Phase B layers an Anthropic tool-use loop. The action buttons across the audit dispatch through that loop or hit dedicated REST endpoints. **Most Phase 1 buttons should hit dedicated endpoints directly** (faster, no LLM in the loop) — the agent tools are for chat-driven dispatch and for longer-running actions like "draft a counter at floor with the right tone."

The minimum tool set the in-app agent needs:

| Tool | Signature | Backed by |
|---|---|---|
| `gmail_draft_create` | `(to, subject, body, thread_id?)` → `{ draft_id, thread_id? }` | Gmail API (OAuth wired 2026-05-09); thin wrapper around existing `/api/deals/draft` plumbing |
| `gmail_send` | `(draft_id)` → `{ thread_id, message_id }` | Gmail API |
| `gmail_open_thread_url` | `(thread_id)` → `string` | Pure URL construction |
| `dropbox_sign_send` | `(template_id, signers[], deal_id?, contract_id?)` → `{ signature_request_id }` | Dropbox Sign REST API (new env vars `DROPBOX_SIGN_API_KEY`, `DROPBOX_SIGN_TEMPLATE_*`) |
| `dropbox_sign_get_status` | `(signature_request_id)` → `{ overall, signers: [...] }` | Dropbox Sign REST |
| `dropbox_sign_remind` | `(signature_request_id, signer_email)` → `void` | Dropbox Sign REST |
| `calendar_create_event` | `(title, start, end, description?, attendees?, calendar_id?)` → `{ event_id, html_link }` | Google Calendar API (OAuth shares the Gmail flow) |
| `drive_create_folder` | `(parent_id, name)` → `{ folder_id, url }` | Drive API (DBA project Desktop client per memory `reference_drive_oauth_clients.md`) |
| `drive_upload_file` | `(folder_id, name, mime, bytes)` → `{ file_id, url }` | Drive API |
| `drive_open_folder_url` | `(folder_id)` → `string` | Pure URL |
| `lyric_flagger_run` | `(release_id, audio_url? \| upload?)` → `{ job_id, status }` | Kicks the umbrella `scripts/lyric-flagger/lyric_flagger.py` via VM SSH or local subprocess; writes to `release_projects.lyric_flag_*` |
| `bmi_live_open_portal` | `(deal_id, artist_id)` → `{ url }` | Pure URL builder against bmi.com/live-performance with prefilled querystring; plus optimistic write to `live_perf_registrations` |
| `ascap_onstage_open_portal` | same | same for ASCAP OnStage |
| `mlc_register_track` | `(track_id)` → `{ url }` | Portal URL builder + `publishing_registrations.mlc_registered_at` write on confirmation |
| `meta_ads_build_brief` | `(deal_id)` → existing `/api/meta-ads/campaign-brief` | Already shipped |
| `supabase_update` | `(table, id, fields)` → row | Service-client write; restrict via allowlist of safe tables |
| `agent_search_deals` | `(filters)` → `Deal[]` | Read-only Supabase query |
| `agent_search_contacts` | `(query)` → `Contact[]` | Read-only |

The chat surface should expose these tools to the model and let the model decide when to call them. The button surface across the rest of the app should hit the underlying REST endpoints directly without going through the model — buttons must be deterministic.

---

## Phasing

### Phase 1 — Cheapest wins (schema already there)

Ship these first. Every action below has the data already in Supabase; only UI and a couple of one-line endpoints are missing. **Goal: kill 80% of the dead-end-row complaint with five days of work.**

1. **Outbound moves row actions** — [`/dashboard/booking/outbound`](../../../products/tenx10-platform/src/app/dashboard/booking/outbound/page.tsx). `outbound_moves` already has the status enum and `pitched_at` / `dismissed_at` / `converted_deal_id`. Add Draft pitch / Pitched / Dismiss / Convert + a single PATCH endpoint. **Highest leverage** — this is where the agent's daily plays die.
2. **Deal-list inline actions** — `<DealRowActions/>` shared component. Used on home Inbox panel, briefing action items, deals/Today pipeline columns, deals/Today action items. Wraps existing `/api/deals/draft` + `deals.status` writes. Reuses the gold-standard set from `DealActions.tsx`.
3. **Briefing inline actions** — wire `/api/tasks/toggle` into the morning briefing task rows; wire `/api/deals/draft` into pending-negotiation and email-needing-action rows.
4. **Outreach minor gaps** — Add "+Add & pitch" to Promoter Research and Weekday Show Finder result rows. Add status-change dropdown to `PitchCard`.
5. **Artists row actions** — Add "Open Spotify daily" (links to a per-artist drawer that surfaces `artist_spotify_daily` once migration 057 ships) and per-artist filter shortcuts to deals/releases.

### Phase 2 — New schema needed, single integration

Each ships migration + UI together.

6. **Live performance registrations** — Migration 055. New per-deal tab "Live registrations" rendering rows for BMI Live / ASCAP OnStage / etc. Buttons: Open portal · Mark registered · Attach setlist. Unblocks the three P0 queue items (DirtySnatcha 17 shows / Dark Matter / WHOiSEE).
7. **Publishing per-track action buttons** — Migration 054. Add Register-at-X buttons + "Mark registered" on each track row. The portal URLs are public; the schema only needs `_at` columns. Unblocks DSR uncollected-royalty backlog.
8. **Release row actions** — Migration 053. "Run lyric flag", "Open Drive folder", "Mark VMG-uploaded" on `/dashboard/releases` rows. Lyric-flag executor lives on the umbrella; expose via agent tool (bridge to VM SSH initially).
9. **Festivals page** — Migration 056. New `/dashboard/festivals` route. Pitch / Mark applied / Radius-clause overlay on deals.

### Phase 3 — Multi-integration heavies

10. **Contract orchestration** — Migration 052. Dropbox Sign integration end-to-end. `/dashboard/contracts` becomes the live envelope tracker. Reuses contracts table + new `contract_signers` rows.
11. **Calendar add buttons** — wire Google Calendar across deal-detail "Send advance" + release-task rows. OAuth shared with Gmail.
12. **Agent tool-use loop** — Anthropic-side executor for the chat surface. Coordinates with the P0 queue item "Discord Xai — Supabase live context" so context-injection lands first.

---

## Open questions

These need Thomas to answer before Phase 2 starts. Phase 1 can ship without any of them.

1. **Migration numbering / source of truth for "what's applied to prod"** — the briefing claimed migrations 023 (`live_perf_registrations`), 036, 038, 039, 040, 041 exist. They don't in `Projects/tenx10/supabase/migrations/`. Either (a) the briefing was working from a stale memory, or (b) those migrations exist applied directly to prod Supabase but never made it into git. Should this audit verify against prod via the Supabase MCP before assuming the migration ladder is git-authoritative?
2. **Dropbox Sign vs Adobe Acrobat Sign** — memory `reference_dsr_contract_signing.md` says DSR contracts go through Adobe Acrobat Sign (CC Student) today. The briefing names Dropbox Sign as the target integration. Which is canonical going forward? Phase 3 design depends on this.
3. **Agent surface — Gemini today, Anthropic in the plan** — `/api/agent/route.ts` runs Gemini (2.0-flash). The P0 plan layers an Anthropic tool-use loop. Does the agent get migrated to Anthropic, or does the tool-use loop sit in front of Gemini? (Tool-use is supported by both, but Anthropic's is more mature.)
4. **Where does "Send advance" sit relative to the existing "Fire Confirm Workflow"** — `/api/deals/confirm-workflow` already builds an advance email draft and saves to Gmail. Is "Send advance" a button that auto-sends that draft (skipping the manual review) or a button that just opens the draft in Gmail? Default: opens draft in Gmail; sending stays manual.
5. **Spotify daily — file-on-disk vs DB-table** — HVRCRFT's daily pull lives at `MANAGEMENT-TENx10/clients/HVRCRFT/spotify-daily/` per memory. Phase 1 references this directly; Phase 2 migration 057 puts it in Supabase. Confirm the migration path is acceptable (vs keeping the file as canonical and importing).
6. **Live perf registries that aren't auto-API'd** — BMI Live and ASCAP OnStage portals don't expose write APIs Thomas's account can use (manual per-show submission). Phase 2 design assumes deep-link-+-prefilled-form + manual confirm-back-into-DB. Confirm this is acceptable as the V1 pattern.
7. **`/dashboard/agent` chat — where does the tool-use loop UI live?** Same chat box, or a dedicated "operate" mode? Affects how risky actions (send contract, register PRO) get gated behind a confirm step.
