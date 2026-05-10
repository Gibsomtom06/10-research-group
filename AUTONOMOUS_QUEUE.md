# Autonomous Queue — what runs when Thomas steps away

**Purpose:** Living backlog of heavy work to dispatch as parallel subagents whenever Thomas is not actively guiding. Updated continuously by Claude.

**The contract:**
- When Thomas types autonomous-mode trigger phrases → I dispatch every READY item as a parallel subagent in a single message
- When Thomas is back, lighter subagents continue running in the background
- I update this file with status as agents land + new items emerge
- Thomas can reorder priorities by editing this file directly

**Last updated:** 2026-05-10 (PM — GTM decided: Management primary; 21-day cycles; Wed 2026-05-13 networking event = forcing function for management-firm positioning on tenx10.co)

---

## HOT — running right now

*(nothing)*

---

## READY TO DISPATCH (parallelizable, no conflicts)

| Pri | Task | Why it matters | Model | Est duration | Blast radius |
|---|---|---|---|---|---|
| **P0** | **TENx10 action-surface audit — Phase 2** (Spotify-daily mirror to Supabase + tasks.snoozed_until + migration ledger reconciliation + BMI Live / ASCAP OnStage portal-deeplink + Add to Calendar) | Phase 1 shipped 2026-05-10 (commits `1dd2f63` / `5deb2d4` / `575b356`). Phase 2 unblocks: (a) Spotify daily drawer on Vercel (umbrella file path is not mounted on Vercel — needs Supabase mirror per spec migration 057); (b) Snooze action on briefing tasks (column doesn't exist); (c) reconcile migration ledger (023/036/038/040/041 referenced in BRAIN.md but not in `supabase/migrations/` — applied directly to prod or labeled differently); (d) live-perf registration row actions per show (BMI Live / ASCAP OnStage are external portals — pattern is deep-link prefilled form + manual mark-registered against `live_perf_registrations`); (e) Add to Calendar via Google Calendar tool. Spec: `docs/superpowers/specs/2026-05-09-tenx10-action-surface-audit.md` § Phase 2. | sonnet | 1–2 days | low (tenx10 platform) |
| **P0** | **Discord Xai — Supabase live context (Phase 1 of "everything connected")** | Today Xai-via-Discord is prompt-only. User wants roster/shows/offers/tasks/release_projects injected on first turn so #briefing answers "live data" questions like the platform does. Architecture chosen 2026-05-09: Option A (context injection) first, Option B (Anthropic tool-use loop for Gmail/Drive/Calendar/Meta) layered on. Sub-tasks: 1) transfer SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from products/tenx10-platform/.env.local to .env.paper (local + VM); 2) `pip install supabase` in `~/dev/10-research-group/.venv-bot/` on VM; 3) modify products/trading-shadow/scripts/chat_bridge.py: add `_build_xai_live_context_sync()` mirroring src/app/api/agent/route.ts:138 buildManagerContext, cache 5 min per channel, prepend to XAI_SYSTEM_PROMPT, drop the "no live data" paragraph from XAI_SYSTEM_PROMPT lines 145-146; 4) commit + push (vm-sync deploys; manual restart needed because .env edits don't trigger auto-restart). | sonnet | 1 hr | low (read-only Supabase) |
| **P0** | **Booking Agent v2 — B1 routing-gap-first view** (per-artist gap days + corridor cities) | The abstraction a real booking agent works in. Gates B2/B3. | sonnet | 2–4 hrs | low (tenx10 platform) |
| **P0** | **Booking Agent v2 — B2 external promoter research action** (19hz / EDMtrain / Bandsintown / Songkick / venue calendars) | Today's outbound is pure DB self-reference; this is the live-data layer | sonnet + agentic research | 4–6 hrs | low |
| **P0** | **Booking Agent v2 — B3 cross-roster stacking detection** | Highest-leverage routing-fill type — carries existing booker relationship | sonnet | 2–3 hrs | low |
| **P0** | **DSR Run The Game — collect 5 signatures via Dropbox Sign** | Contract sent 2026-05-09; track signers Isaac / Joseph / Mike / Michael / DSR | manual (poll Dropbox Sign) | per-signer | n/a |
| **P0** | **Verify DSR publishing entity registered** at ASCAP (IPI 1238282844), MLC (publisher P330RE), CMRRA (02274554/02274555), SoundExchange | Royalties don't collect if entity unregistered | manual at portals | 1–2 hrs | n/a |
| **P0** | **BMI Live registration — DirtySnatcha** for 17 TMTYL 2026 shows + Electric Forest + Lost Lands | Live perf royalties uncollected. IPI=01017500116 | sonnet + manual portal | 30 min/show | low |
| **P0** | **ASCAP OnStage registration — Dark Matter** Isaac (IPI 1262457258) + Joseph (IPI 1262457454) | Live perf royalties uncollected | sonnet + manual | per-show | low |
| **P0** | **WHOiSEE BMI Live registration** — IPI confirmed (00779461097) | Register all WHOiSEE shows at BMI Live | sonnet + manual | per-show | low |
| P0 | **Kotrax basic data capture** — real name, PRO, IPI | Blocks all registrations | manual (Tom-input) | 5 min | n/a |
| P0 | **HVRCRFT basic data capture** — real name, PRO, IPI | Blocks all registrations | manual (Tom-input) | 5 min | n/a |
| P1 | **Oracle A1 ARM 24GB capacity poll** | A1 ARM Always Free is the canonical living dev environment per `project_oracle_canonical_vm.md`; current `tenx10-dev-amd` is the AMD E2.1.Micro placeholder | `scripts/oracle/launch-a1-when-available.sh` | passive | n/a |
| P1 | **Backfill PRO/IPI for 27 submission-tracker artists** (Aalioura, Adam Annella, etc.) in dsr_artists with NULL PRO/IPI | Writer royalties stranded | manual / API lookup | per-artist 5–15 min | zero |
| P1 | **MLC submission — LAB10 82 tracks** via portal | Uncollected royalties start collecting | manual at MLC portal | n/a | n/a |
| P1 | **ISRC reconciliation — manual source review** of DSR_CLEAN_DATABASE.xlsx to map 241 placeholder ISRCs (BMI_TITLE_xxx) to real ISRCs | DB joins broken on synthetic keys; auto-match failed (zero title overlap between tables) | sonnet + manual | 1–2 hrs | low |
| P2 | **Desktop routing — 200 file moves** per `DESKTOP_INVENTORY_2026-04-30.md` | Cleanup follow-through | sonnet | 30–45 min | medium |

---

## BACKLOG (known but lower priority)

- ~~TENx10 platform homepage — strip hardcoded DSR content~~ — DONE
- TENx10 platform site UX revision — management-first restructure (per BUSINESS_HIERARCHY.md)
- 10researchgroup.com umbrella site — Phase 1 hierarchy index (per positioning spec)
- DSP API integrations to populate Spotify/Apple/etc. IDs in DSR_CLEAN_DATABASE
- ~~DBA Phase 1 Supabase migration unblock~~ — **REPLACED 2026-05-10:** Absorb DBA into TENx10 booking-agent module (decision in MANAGEMENT-TENx10/BRAIN.md open decisions table). Booking Agent v2 B1/B2/B3 already in P0 is the consolidation path. Open work: archive `products/digital-booking-agent/` to `_archive/superseded/`, port any DBA-specific logic that isn't already in tenx10's booking-agent
- DAD v1 logic recovery (search laptop OR ask Thomas for filename)
- Music organization workflow file recovery (laptop)
- Tenx10 platform: artist-tier `/artist/chat` UI separated from manager `/api/agent`
- Tenx10 platform: Discord two-way bot (beyond one-way webhook)
- Tenx10 platform: global royalty map on publishing page (`react-simple-maps` installed)
- Tenx10 platform: post-VMG upload checklist per track

---

## BLOCKED (need Thomas input)

| Task | Blocked on |
|---|---|
| Identify 10 unknown-label tracks (Escape, Sum Dirty, Dimension, etc.) | Thomas needs to confirm labels |
| CMRRA accounts 02274554 / 02274555 activation | Thomas activates at portal |
| Umbrella git lock fix | Decision: move repo out of OneDrive OR pause-OneDrive-then-commit pattern |
| Dark Matter ASCAP IPI confirmation | Lookup at ascap.com — Isaac/Joseph IPIs known (1262457258 / 1262457454) but artist-side IPI unknown |
| ISRC reconciliation final pass | Needs manual review: dsr_track_registrations references different track catalog than dsr_tracks; Thomas to clarify if these are archived/unreleased tracks |
| ~~WHOiSEE legal full name confirmation~~ | DONE 2026-05-03 — Brett Hopkin (from DSR contract) |
| ~~Google Drive sweep~~ | DONE — Drive OAuth resolved via DBA project's Desktop client; token at `~/.config/10rg/drive_shortcut_token.json` (per `reference_drive_oauth_clients.md`) |

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
- 2026-05-05: CLAUDE.md prune across umbrella + tenx10 + .claude (-52% / -62%); build-cycle skill; tenx10 rebuild partition plan
- 2026-05-05: Phase-0c MGMT consolidation — scattered DSR artifacts filed into `MANAGEMENT-TENx10/`
- 2026-05-06: Oracle Cloud VM live (`tenx10-dev-amd`, AMD E2.1.Micro Always Free, Ashburn AD-1, `ssh tenx10-dev`); A1 ARM 24-GB launcher polling for capacity
- 2026-05-06: Tenx10 dashboard bird's-eye redesign + `/dashboard/deals` consolidation (Today/Map/Calendar) + ArtistSwitcher across 5 pages + roster aggregation
- 2026-05-06: Tenx10 booking-agent inbound — PDF-aware ingest + 11-step decision engine (KB Module 29)
- 2026-05-06: Migrations 047 release-as-project + 048 festivals applied to prod
- 2026-05-07: Tenx10 booking-agent outbound (PR #4–#11) — proactive moves cron, manual run trigger, warm/cold pitch fallbacks, two-step roster lookup, persist-moves silent-drop fix, RLS recursion fix
- 2026-05-07: Migrations 049 outbound_moves + 050 artist_members admin recursion applied
- 2026-05-07: Trading-shadow Lane 3 lifted off the $5/trade cap; cheaper model + credit circuit breaker; leveraged ETFs (TQQQ/SOXL/SQQQ) at 3x; 75% confidence gate + 2:1 R:R + smart sells; options on Alpaca (paper-only ATM calls + puts)
- 2026-05-08: DSR Run The Game (Dark Matter & Barooka) contract finalized — real legal parties (Mike Silva, Michael Zachary Thomas), aligned signature blocks, regenerated PDF
- 2026-05-09: Dropbox Sign send pipeline (`_send_contract.cjs` + `_wrap_html.cjs`) — 5-signer order, gitignored .env in contracts dir
- 2026-05-09: RELEASE_CHECKLIST_TEMPLATE per release; `scripts/release/` (confirm_release + drive_shortcut helpers); spec at `docs/superpowers/specs/2026-05-06-dsr-release-organizer.md`
- 2026-05-09: `scripts/lyric-flagger/` explicit/language pipeline (Spotify API + LRCLIB / yt-dlp + faster-whisper, per-artist vocab files)
- 2026-05-09: `MANAGEMENT-TENx10/clients/` per-artist working folders (DSR offers, HVRCRFT spotify-daily + s4a-export, WHOiSEE rider); `s4a-auth.json` gitignored locally
- 2026-05-09: Tenx10 Gmail OAuth fix — refreshed-token write goes via service-role client (cookie context dead by `tokens` event); refresh_token preserved on re-consent
- 2026-05-10: TENx10 action-surface audit Phase 1 shipped (commits `1dd2f63` / `5deb2d4` / `575b356`, push `0df778d..575b356` → Vercel) — outbound moves row actions (Draft pitch / Pitched / Dismiss / Convert + PATCH `/api/booking-agent/outbound/[moveId]`); shared `<DealRowActions/>` reused on home Inbox + briefing + deals/Today (action items + pipeline columns + confirmed-30d); briefing inline Mark done via `/api/tasks/toggle` + Draft response via DealRowActions; outreach +Add & pitch on Promoter Research + Weekday Finder + pitch_status dropdown on PitchCard; artists row Spotify daily drawer (`/api/artists/[id]/spotify-daily`) + per-artist filter shortcuts to deals/releases. Build clean (117 pages, 17s tsc). 5 files added + 8 modified. Spec: `docs/superpowers/specs/2026-05-09-tenx10-action-surface-audit.md`.

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
