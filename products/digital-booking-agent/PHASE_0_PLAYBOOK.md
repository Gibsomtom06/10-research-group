# DBA Phase 0 Playbook — Weeks 1–2

**Goal by end of week 2:** a populated CRM, a voice corpus, a live market heat map, and one shadow-mode draft sent through Thomas's hands. That's the demo moment.

This playbook is sequenced by day. Each day has a clear owner (Thomas or Claude) and a clear output.

---

## Day 0 — stand up the stack (Claude)

**Output:** Supabase project + repo skeleton ready to accept data.

- [ ] Create Supabase project `dba-dirtysnatcha` (free tier is fine for v0)
- [ ] Run `schema.sql` against the new project
- [ ] Scaffold Next.js app at `10 Research Group/products/digital-booking-agent/app/`
- [ ] Environment file with Supabase URL + service role key
- [ ] Vercel project linked to the repo (hobby tier)
- [ ] Add placeholder routes: `/dashboard`, `/drafts`, `/contacts`, `/markets`
- [ ] Commit initial scaffold

## Day 1 — export Thomas's source material (Thomas + Claude)

**Output:** raw dumps staged in `_staging/` ready for parsing.

Thomas runs:
- [ ] Google Takeout export: Gmail (Mail + Contacts), filter for last 3 years of sent mail
- [ ] Export any existing booking spreadsheets (show history, venue lists, promoter lists)
- [ ] Screenshot or export Instagram DM threads with industry contacts (manual, slow — skip to IG API if too painful)
- [ ] Dump any existing show contracts (PDF or scan) into `_staging/contracts/`
- [ ] Export Spotify for Artists data (CSV export of last 12 months)
- [ ] Export YouTube Analytics (last 12 months)

Claude runs:
- [ ] Parse `sent-mail.mbox` into a structured table (sender, recipient, date, subject, body)
- [ ] Parse `google-contacts.csv`
- [ ] OCR any scanned contracts
- [ ] Stage all of the above in `_staging/parsed/`

## Day 2 — build the contact pass (Claude)

**Output:** `contacts` table populated with ranked, deduped CRM records.

- [ ] Deduplicate across Gmail contacts + Gmail sent history + contract parties + spreadsheet rows
- [ ] Classify each contact by role (talent_buyer, venue_owner, promoter, manager, agent) using email domain + subject-line heuristics + Claude classification on ambiguous cases
- [ ] Compute `last_interaction_at` from most recent sent/received mail
- [ ] Compute `relationship_strength` heuristic:
  - `warm` = interaction within 180 days
  - `reconnect` = prior interaction, 180–730 days old
  - `dormant` = >730 days old
  - `cold` = never interacted (imported from a list)
- [ ] Attach `source_imports` JSONB so Thomas can see where every record came from
- [ ] **Target: 200+ contacts with ≥60% typed by role**
- [ ] Thomas spot-checks 20 random records for accuracy

## Day 3 — venues + market seeding (Claude)

**Output:** `venues` + `markets` tables populated for Thomas's historical play cities.

- [ ] Extract every venue name that appears in contracts, confirmed shows, or in Gmail subjects
- [ ] Enrich each venue: Songkick lookup for capacity + typical nights + upcoming calendar
- [ ] Map each venue to a metro in `markets`
- [ ] Populate `markets` with Nielsen DMA codes + basic population data for each metro DSR has ever played
- [ ] Link contacts to venues via `contact_venues`
- [ ] **Target: every warm/reconnect contact has at least one venue linked**

## Day 4 — voice corpus (Claude)

**Output:** `voice_samples` table with 50+ hand-picked examples.

- [ ] Run a query: most recent 200 emails from Thomas's sent mail
- [ ] Claude pre-classifies each into category (cold_outreach, negotiation, confirm, followup, casual)
- [ ] Present Thomas a picker UI at `/voice-training`: he clicks keep/skip/recategorize
- [ ] Target 10 samples per category minimum (50 total)
- [ ] Compute embeddings for each sample (OpenAI `text-embedding-3-small` is cheap and works)
- [ ] Write `voice-samples.md` reference doc: canonical examples + explicit style notes ("Thomas uses lowercase subject lines, em-dashes rare, signs off with just 'thomas' or nothing")

## Day 5 — Spotify + YouTube + IG pulls (Claude)

**Output:** `artist_data` table with first snapshot, dashboard heat map live.

- [ ] Spotify for Artists OAuth — pull monthly listeners by city, audience demo
- [ ] YouTube Data API OAuth — pull views + watch time by geography
- [ ] Meta Graph (IG Business) OAuth — pull followers by city, engagement rate
- [ ] TikTok Business OAuth (skip if API access isn't immediate)
- [ ] Write ingest job that snapshots every source nightly into `artist_data`
- [ ] Build the heat map view at `/markets`: grid of metros with streams, growth, last show result
- [ ] **Thomas looks at the heat map and confirms it matches his intuition for where DSR draws**

## Day 6 — buyer signals + praise bank (Claude)

**Output:** `buyer_signals` + `praise_bank` populated for top 50 warm contacts.

- [ ] Songkick/Bandsintown pulls for every linked venue — 12 months history + upcoming
- [ ] Set up Google Alerts on the top 50 contact + venue names, forwarded to a dedicated inbox
- [ ] Email parser writes alert hits into `buyer_signals` + generates `praise_bank` entries where the signal qualifies (recent win, taste signal)
- [ ] Thomas's dashboard at `/contacts` now shows per-contact praise options with freshness

## Day 7 — Thomas checkpoint (Thomas + Claude)

**Output:** 30-minute review. Green-light or fix-list.

- [ ] Thomas reviews the heat map, the contact list top 50, and 5 random praise hooks
- [ ] Flag anything that feels wrong (miscategorized contact, stale praise, wrong stat)
- [ ] Fix-list gets owned by Claude for day 8–9

## Day 8–9 — pitch-pack generator (Claude)

**Output:** function that given (contact_id) returns a full pitch-pack JSON per ANALYST_AGENT.md §3.

- [ ] Implement `analyst.generate_pitch_pack(contact_id, intent)`:
  - looks up contact + venue + market
  - pulls freshest artist_data for that metro
  - pulls top available praise_bank entry (consumed_at null, expires_at >= today)
  - looks up comparable prior show attendance from `confirmed_shows`
  - composes `counter_bounds` from routing rules
  - runs verification stamps — if any fail, return `blocked_reason`
- [ ] Test against 5 contacts by hand; compare to what Thomas would have said about those buyers

## Day 10 — inbound supervisor + evaluator integration (Claude)

**Output:** inbound email → evaluator result → drafted response → queue.

- [ ] Gmail push subscription (Pub/Sub) for Thomas's booking inbox (or a filter/label if Pub/Sub is overkill for v0)
- [ ] Inbound agent classifies new email: is this an offer? a follow-up? a cold intro?
- [ ] If offer: call the `dsr-booking-evaluator` skill, store result in `offers.evaluator_result`
- [ ] Outbound agent drafts a response — pulls pitch-pack if needed, composes in Thomas's voice
- [ ] Draft lands in `outreach_log` with `status='held_for_review'`

## Day 11 — draft review dashboard (Claude)

**Output:** Thomas can see every pending draft at `/drafts` and approve/edit/reject.

- [ ] `/drafts` page shows the `v_outreach_pipeline` view
- [ ] Per draft: original email + evaluator result + proposed reply + edit-in-place
- [ ] Approve → sets `status='queued'`, `scheduled_send_at` set to next human-cadence window
- [ ] Reject → sets `status='cancelled'` with reason captured for training

## Day 12 — first shadow send (Thomas + Claude)

**Output:** one real inbound offer responded to via DBA, with Thomas's approval before send.

- [ ] Wait for or simulate an inbound offer
- [ ] DBA drafts
- [ ] Thomas reviews at `/drafts`, makes any edits
- [ ] Thomas clicks approve
- [ ] DBA sends via Gmail API at the scheduled window
- [ ] Reply tracking wired up — when buyer replies, `outreach_log.replied_at` updates

## Day 13–14 — polish + first proactive outreach test (Claude + Thomas)

**Output:** one proactive outbound pitch to a known warm contact, reviewed and sent.

- [ ] Pick a high-confidence warm contact with a fresh praise hook and a strong market stat
- [ ] Analyst generates pitch-pack
- [ ] Outbound composes
- [ ] Thomas reviews and sends
- [ ] Capture this whole flow as a screen recording — **this is the sales demo**

---

## What's NOT in Phase 0

Deferred to Phase 2/3:
- Cold-market outreach (waits until voice + data quality are proven)
- Tour routing agent
- Multi-artist / multi-tenant features
- Chartmetric / Pollstar integrations
- Paid scraper infrastructure for tertiary venues
- Auto-send on anything — everything is review-gated in Phase 0

## Success criteria for Phase 0

By day 14, all of these must be true:
1. 200+ contacts in CRM, roles typed, relationship strengths assigned
2. 50+ voice samples in the corpus
3. Heat map live with fresh data on every metro DSR has played
4. Praise bank has ≥ 3 fresh hooks for ≥ 30 top contacts
5. Pitch-pack generator produces valid, verification-stamped packs
6. Inbound flow works end-to-end in shadow mode
7. One outbound pitch composed + sent (with Thomas's approval)
8. Demo recording captured

If all 8 are green, move to Phase 2 (shadow mode on full inbound volume). If any are red, fix before moving on.
