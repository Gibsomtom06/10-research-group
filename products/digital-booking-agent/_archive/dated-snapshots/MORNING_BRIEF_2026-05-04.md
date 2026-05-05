# DBA Morning Brief — 2026-05-04

## Bottom line

**DBA is functional.** Dev server runs at http://localhost:3000. All key pages render. Worker connects to Supabase and dry-runs cleanly. The /offers funnel shows your 233 actual TENx10 deals.

---

## What works (verified at 6:00am — all 11 routes return 200)

| URL | Status | What it shows |
|-----|--------|---------------|
| http://localhost:3000/ | 200 | DBA root with full nav |
| /dashboard | 200 | **phase 0 status** — contacts 166/200, venues 171/50, voice samples 0/50, praise hooks 0/90, drafts queued 0 |
| /offers | 200 | **233-deal kanban with real promoter names** — 84 inbound, 1 evaluating, 123 signed, 18 locked. Tiles show promoter name + grade + venue + amount + days-out. |
| /offers/[id] | 200 | **Detail page with full promoter info** — name, role, city, grade. Lifecycle actions (sign, record promoter sig, record deposit, counter). |
| /drafts | 200 | drafts awaiting thomas — empty until outbound runs |
| /outreach | 200 | Outreach history — shows TENx10's 166 contacts with default tier |
| /outreach/priorities | 200 | Top targets — empty until v_target_score has data |
| /reports | 200 | Reports view |
| /contacts | 200 | contacts · crm — 166 rows |
| /reminders | 200 | reminders view |
| /markets | 200 | markets view |
| /history | 200 | outreach history |
| /dashboard/costs | 200 | model spend dashboard |
| Worker: `npm run sender:dryrun` | clean exit | `{"considered":0,"sent":0,"skipped":0,"deferred":0,"failed":0}` |

---

## The architecture decision (settled tonight)

**One Supabase project: `ocscxqaythiuidkwjuvg`** (TENx10's). The old DBA project (`erwlfjlgrrfuqnjzitor`) is dead — DNS doesn't resolve. DBA tables now live alongside TENx10's. Hierarchy: **10 Research Group → TENx10 → DBA**, one database for all of it.

---

## What was applied tonight (12 migrations + 1 view replacement)

| Migration | Purpose |
|-----------|---------|
| `0017_voice_sample_retrieval` | (already done) HNSW index, fn_similar_voice_samples, v_voice_sample_coverage |
| `0018_dba_into_tenx10` | DBA-only tables: outreach_log, pitch_packs, praise_bank, buyer_signals, confirmed_shows, decisions, markets, artist_data + stub offers view |
| `0019_dba_contacts_compat` | contacts.full_name (generated from name) + timezone |
| `0020_dba_contacts_full_compat` | contacts.role, relationship_strength, last_interaction_at, thomas_notes, tags, source_imports, deleted_at |
| `0021_dba_artists_compat` | artists.slug + display_name + 9 other DBA-expected columns, backfilled from TENx10 stage_name |
| `0022_seed_q2_q4_2026_tours` | **12 tour rows** (DirtySnatcha, WHOiSEE, Dark Matter, Kotrax × Q2/Q3/Q4 2026) — all status=planning, ready for outreach scope |
| `0002_bounces_and_reminders` | (DBA legacy) worker_state, bounce tracking, v_outreach_history, v_reach_back_reminders |
| `0003_reports` | reports table + v_latest_reports |
| `0004_contact_tiers` | relationship_tier enum, contact_roles[], tour_targets, promoter_activity, v_outreach_scope |
| `0008_outreach_events` | open/click tracking, fn_record_outreach_event, v_outreach_engagement |
| `0016_model_calls` | model_calls ledger + v_model_spend_daily/30d/agent_summary |
| `0023_offers_over_deals` | **THE BIG ONE** — replaces stub offers view with view-over-deals; 233 deals now visible in DBA's funnel |

Plus the `deal-memos` Supabase Storage bucket with RLS policies (created earlier in session).

---

## What you can do right now

1. **Open the dashboard:** http://localhost:3000 (dev server running on this machine)
2. **See your funnel:** http://localhost:3000/offers — 233 deals across the lifecycle
3. **Click a deal:** any row → detail view with lifecycle controls
4. **Push everything:** `git push` — already done; latest commit `213dae3` on `Gibsomtom06/10-research-group:master`

---

## What's missing / pass-2 territory

These need work before they fully shine:

1. **Promoter contact bridge.** TENx10's `deals.promoter_id` references the `promoters` table, not `contacts`. DBA wants `contacts`. Need a mapping (probably by email match) so deal pages show real contact names instead of "unknown contact".
2. **Pitch packs / research data.** `praise_bank`, `pitch_packs`, `buyer_signals`, `promoter_activity` are all empty. The Analyst agent (`agents/analyst.py`) needs to be run against real promoters to populate research before Outbound can compose with sell-out compliments.
3. **`/dashboard/deals` blank issue from your platform handoff.** Commit `92d17bd` was supposed to fix it (service-client fallback). Hard reload + verify.
4. **DBA migrations 0001/0005/0006/0007/0009/0010/0011/0012/0013/0014/0015 NOT applied** — they reference offers/contact_venues/promoter_activity-with-deps that need pass-2 reconciliation. The pages don't crash without them but features like radius checks, agent workload gates, score-ranked outreach (v_target_score) won't work.
5. **Multi-artist outreach scope.** Tours are seeded for 4 artists; tour_targets table is empty. Need to populate which contacts/venues to pitch per tour.
6. **Sender → real send.** `SENDER_DRY_RUN=true` is hardcoded in `workers/.env`. Flip to `false` when you've eyeballed 2-3 drafts in /drafts and are ready to actually send.

---

## DirtySnatcha 14 booked 2026 shows

Preserved in `products/digital-booking-agent/HANDOFF.md` — your handoff text was never written to disk before workspace switch. Total committed: **$24,500 gross across 12 hard shows + 2 Electric Forest dates**. Reconcile against existing TENx10 `deals` rows tomorrow before seeding.

---

## Where to start

If you want to actually **send your first DBA outreach**:

1. Verify the dev server is still running (or `cd products/digital-booking-agent/app; npm run dev`)
2. Open http://localhost:3000/contacts — pick a promoter you want to reach
3. Run the analyst agent: `cd products/digital-booking-agent; python agents/analyst.py --contact-id <id>` — this populates a pitch_pack with research + praise hook
4. Run the outbound composer: `python agents/outbound.py --pitch-pack <pack_id>` — generates a draft into outreach_log status='draft'
5. Open http://localhost:3000/drafts — review, edit, mark queued
6. The sender worker (`npm run sender` in /workers) will pick it up on the next poll. With `SENDER_DRY_RUN=true` it just logs; flip the env var to send for real.

---

## Repo

- Pushed to: https://github.com/Gibsomtom06/10-research-group
- Tonight's commits (most recent first):
  - `86cf49f` real promoter names in offers kanban + detail (mig 0024)
  - `c776191` morning brief documentation
  - `213dae3` offer detail page fix
  - `ae7f028` offers funnel goes live (view-over-deals, 233 deals)
  - `5bc7272` compat migrations 0019-0022 + Q2-Q4 2026 tours
  - `124e7f2` CLAUDE.md notes Supabase merger
  - `a84db56` migration 0018 + DS handoff
- Plan that drove this: `~/.claude/plans/replicated-stargazing-squid.md`
