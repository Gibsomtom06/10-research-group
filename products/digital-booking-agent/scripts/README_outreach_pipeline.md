# Outreach Pipeline - Runbook

Four-step flow from zero to drafted outreach queue for a package tour.

The pipeline has grown past single-artist touring. It now handles:
- Multi-artist package tours (trio / quintet / full_seven etc.)
- Per-venue artist suppression (same buyer books multiple rooms -> independent
  suppression per room)
- Gigwell-sourced confirmed-show history as the primary suppression signal

## Step 0 - apply the migrations

```bash
cd products/digital-booking-agent
psql "$SUPABASE_DB_URL" -f migrations/0004_contact_tiers.sql
psql "$SUPABASE_DB_URL" -f migrations/0005_artist_attribution.sql
psql "$SUPABASE_DB_URL" -f migrations/0006_multi_artist_packages.sql
psql "$SUPABASE_DB_URL" -f migrations/0007_tour_targets_per_venue.sql
```

What each migration adds:
- `0004` - `relationship_tier`, `contact_roles[]`, `timezone`, `source_tag`,
  `radius_holds`, `vip`, plus `artists`, `tours`, `tour_targets`,
  `promoter_activity`.
- `0005` - `artist_id` / `artist_slug` on `offers` + `confirmed_shows`.
  Creates `v_recent_plays_by_venue` (primary suppression view) and
  `v_recent_plays_by_contact` (fallback). Adds
  `fn_suppress_artists_for_venue(venue_id, cooldown_days)` and
  `fn_suppress_artists_for_contact(contact_id, cooldown_days)`. Adds
  `suppressed_artists[]` and `featured_artists[]` columns on `tour_targets`.
- `0006` - Seeds the DSR roster (`dirtysnatcha`, `mport`, `kotrax`, `ozztin`,
  `dark_matter`, `hvrcrft`, `xenotype`). Creates `tour_artists` junction
  (role = headliner/co_headliner/support/open, plus `is_required`,
  `priority`) and `package_levels` (`tier_size`, capacity band, guarantee
  band, required/optional artist slugs). Adds `fn_pick_package_level(tour_id,
  venue_capacity)` and `v_tour_roster`.
- `0007` - Drops the `(tour_id, contact_id)` unique constraint on
  `tour_targets`, replaces with
  `(tour_id, contact_id, coalesce(venue_id, uuid_nil))`. Creates
  `v_pitchable_targets` - every (contact, venue) pair the seeder should
  consider.

All migrations are idempotent.

## Step 1 - sync contacts from Gmail (tier baseline)

First-time setup: drop a Desktop OAuth `client_secret.json` at
`_staging/gmail_credentials.json` and set the env vars.

```bash
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE=...
export GOOGLE_OAUTH_CREDENTIALS=_staging/gmail_credentials.json
export GOOGLE_OAUTH_TOKEN=_staging/gmail_token.json
export THOMAS_EMAIL=thomas@dirtysnatcha.com

# dry run - prints the ranked insider/warm/cold tables
python scripts/sync_contacts_from_gmail.py \
    --labels OFFERS BOOKING SENT \
    --since 2022-01-01 \
    --dry-run

# looks right? commit
python scripts/sync_contacts_from_gmail.py \
    --labels OFFERS BOOKING SENT \
    --since 2022-01-01 \
    --write
```

What it does:
- resolves every label whose name starts with `OFFERS`, `BOOKING`, or is `SENT`
- walks each thread, counts outbound/inbound per counterparty
- classifies tier: `insider` (>=3 outbound + replied within 12mo, or domain
  allowlist), `warm` (any exchange), `cold` (listed but never exchanged)
- roles: multi-role supported (e.g., Lance = manager + talent_buyer)
- upserts `contacts` keyed on email, tags `source_tag='gmail_sync:...'`
- always stages a JSONL audit copy at `_staging/gmail_contacts.jsonl`

## Step 1.5 - load Gigwell scrape (booking history + venue graph)

Gemini scrapes Gigwell into `_staging/gigwell_scrape/*.jsonl`. See the schema
doc at `_staging/gigwell_scrape/README.md`. Expected files (any subset is
fine - missing files skipped):

- `venues.jsonl`              - venue rows (capacity, city, state, gigwell_id)
- `contacts.jsonl`            - buyer/promoter contacts with `gigwell_id`
- `contact_venues.jsonl`      - which buyer books which venue
- `offers.jsonl`              - historical + pending offers, with
  `artist_slug`
- `confirmed_shows.jsonl`     - settled shows, with `artist_slug`,
  `show_date`, `capacity_at_show`
- `radius_holds.jsonl`        - active radius clauses
- `praise.jsonl`              - buyer quotes / social praise

```bash
# dry-run doesn't need Supabase env
python scripts/load_gigwell_scrape.py \
    --staging-dir _staging/gigwell_scrape \
    --dry-run

# write to Supabase
python scripts/load_gigwell_scrape.py \
    --staging-dir _staging/gigwell_scrape \
    --write
```

Behavior:
- upserts on `gigwell_id` (stable dedup on re-scrape)
- tags every row with `source_tag='gigwell_scrape:YYYY_MM_DD'`
- maps `status_raw` -> offer status enum (`pending` -> `negotiating`,
  `confirmed` -> `confirmed`, etc.)
- load order: venues -> contacts -> contact_venues -> offers ->
  confirmed_shows -> radius_holds -> praise

Once loaded, `v_recent_plays_by_venue` is automatically populated - this is
what drives per-venue suppression in Step 2.

## Step 2 - seed a package-tour outreach queue

Prereq: the tour row, its `tour_artists` (roster), and its `package_levels`
(tier configurations) must already exist. See
`scripts/seed_tmtyl_tour.sql` for the canonical Take Me To Your Leader Leg 2
example.

```bash
python scripts/seed_q2_tier2_drafts.py \
    --tour-name "Take Me To Your Leader - Leg 2" \
    --window 2026-06-01..2026-09-30 \
    --routing-anchors '[{"city":"Denver","anchor_date":"2026-07-15"}]' \
    --cap-per-tier insider=50,warm=50,cold=150 \
    --cooldown-days 180 \
    --plan-only
```

`--plan-only` prints the (contact, venue, chosen package_level,
featured_artists, suppressed_artists) matrix without calling the composer.
Review, then drop `--plan-only`.

What the seeder does per run:
1. Loads roster via `v_tour_roster` and `package_levels`.
2. Iterates `v_pitchable_targets` - one row per pitchable (contact, venue)
   pair the buyer actually books.
3. For each target:
   - calls `fn_suppress_artists_for_venue(venue_id, cooldown_days)` - or
     `fn_suppress_artists_for_contact` if no venue - to get recently-played
     slugs.
   - `pick_package_level(levels, venue.capacity)` -> best-fit tier.
   - `compute_featured(roster, suppressed, package_level)` - honours
     `required_artist_slugs` (those never get suppressed out of the pitch;
     if one conflicts, the target is flagged with a warning rather than
     silently dropping the required artist).
4. Builds the pitch-pack including `tour.tour_roster`, chosen
   `package_level`, `featured_artists`, `suppressed_artists`.
5. Upserts `tour_targets` on
   `(tour_id, contact_id, coalesce(venue_id, uuid_nil))` with
   `package_level_id`, `pitched_artists[]`, `suppressed_artists[]`,
   `featured_artists[]`.

Behavior per tier:
- `insider` -> composer in insider mode: no stats, no EPK offer, references
  shared work and promoter_activity, short direct ask. Leads with highest-
  priority featured artist.
- `warm`    -> composer in warm mode: one concrete reason, short, names
  2-3 featured artists explicitly.
- `cold`    -> composer in cold mode: praise hook (if fresh) + one market
  stat + specific package fit + ask. Blocked if no fresh stat for the metro.

Drafts land in `outreach_log` with `status='draft'`. Confidence thresholds:
- `>= 0.95` -> auto-send at next human-cadence window
- `0.80 - 0.94` -> queue, auto-send 2hr after view
- `< 0.80` -> hold for Thomas review

All VIPs always hold for review regardless of confidence.

Composer rules enforced (`prompts/outbound_composer.md`):
- Never name a suppressed artist.
- Name 2-3 featured artists explicitly; lead with highest-priority.
- Package-level language: pitch "trio / quintet / full seven" when label is
  canonical; otherwise use the roster size literally ("a 5-artist package").

## Step 3 - review in the UI

`/drafts` in the DBA app shows the queue. Approve, edit, or reject.
Approvals flow through `app/drafts/actions.ts` into the sender worker.

## Step 4 - handle inbound offers as contracts

Offers ARE contracts (migration `0009_offers_as_contracts.sql`). The full
lifecycle happens on the `offers` table — no separate contract-ingest
pipeline. The `/offers` kanban in the DBA app gives a six-column view:

    new -> negotiating -> awaiting my sig -> awaiting promoter sig ->
    awaiting deposit -> locked

### Apply the migration

```bash
psql "$SUPABASE_DB_URL" -f migrations/0009_offers_as_contracts.sql
```

This adds deal-memo fields (deposit %, radius clause, override,
hospitality, sound/lights, cancellation, signature timestamps,
`deal_memo_pdf_url`), extends `offer_status` with `memo_sent`,
`signed_by_thomas`, `fully_executed`, `deposit_received`, and creates
three RPCs (`fn_offer_sign_thomas`, `fn_offer_sign_promoter`,
`fn_offer_record_deposit`) plus the `v_offer_contract_status` view for
the kanban.

Defaults live in the `dsr_standard_deal_terms` view:
- 50% deposit (10% minimum), 30 days prior
- 85% override of net door
- 75mi / 30d radius window
- force_majeure cancellation policy
- standard hospitality
- promoter-provided sound/lights

### Work a single offer

Click into `/offers/[id]`. Buttons:
- **generate deal memo** — renders `app/lib/deal-memo.ts` into a PDF,
  uploads to Supabase Storage bucket `deal-memos` (falls back to /tmp
  if bucket missing), writes URL to `offers.deal_memo_pdf_url`, moves
  status to `memo_sent`
- **sign as thomas** — calls `fn_offer_sign_thomas`, stamps
  `signed_at_thomas`
- **record promoter sig** — calls `fn_offer_sign_promoter`, stamps
  `signed_at_promoter`, moves to `fully_executed` if both sides signed
- **record deposit** — takes $ amount, calls `fn_offer_record_deposit`,
  moves to `deposit_received`
- **counter** — takes $ guarantee, updates `counter_bounds.target`,
  moves to `countered`. The counter composer drafts the email on next
  run.

### Draft counter emails for all countered offers

```bash
python scripts/seed_counter_drafts.py --limit 20
```

Watches `offers` where `status='countered'` and calls
`agents/outbound.py --email-type counter_offer` for each one. Drafts
appear in `/drafts` alongside regular outbound. Safe to run as often as
you like — `has_fresh_counter_draft` guard skips any offer that already
has a draft created since the last `updated_at`.

### Create the Supabase Storage bucket (one-time)

```bash
supabase storage buckets create deal-memos --project-ref <ref>
```

Without the bucket, `generate deal memo` falls back to writing to the
server's `/tmp` directory. That's fine for dev but useless for sharing
a signed memo with a promoter — create the bucket before the first
deal closes.

## Troubleshooting

- "no fresh market data for Columbus DMA" on a cold draft: the Analyst
  agent hasn't populated `artist_data` for that metro yet. Run the Analyst
  or backfill by hand.
- "no_activity_for_insider" blocks: the seeder requires
  `promoter_activity` rows before an insider pack builds. Either populate
  them (IG scrape / lineup feed) or mark the contact `relationship_tier='warm'`
  temporarily.
- "required artist suppressed for venue X": a `required_artist_slugs` entry
  on the chosen package_level was played at that room inside the cooldown
  window. The target is still seeded but flagged with
  `warning='required_artist_suppressed'` on the tour_target row; review
  manually before sending.
- "no package_level fits venue capacity N": seeder falls back to the
  smallest tier via `fn_pick_package_level`. If the venue is genuinely too
  small for the smallest tier, drop the target or add a lower tier to
  `package_levels`.
- Composer flagging `validation_insider_epk_offer`: confidence gets capped
  at 0.6, draft goes to held_for_review. Edit
  `prompts/outbound_composer.md` examples if the model keeps drifting.

## Re-running safely

- Gmail sync: idempotent on email, always overwrites tier with latest
  signal.
- Gigwell loader: idempotent on `gigwell_id`. Re-running with a later
  scrape date updates `source_tag` but keeps the row.
- Seeder: idempotent on `(tour_id, contact_id, venue_id)`. Re-running
  refreshes `suppressed_artists` / `featured_artists` / `package_level_id`
  without duplicating drafts - existing `outreach_log` rows are untouched
  unless status is still `draft`.
- Counter drafter: checks `outreach_log` for a counter_offer draft
  newer than `offers.updated_at`. Re-running only re-drafts offers that
  have been re-countered (you changed the target) since the last run.
- Deal memo generator: new PDF per call, uploaded to a unique path
  `<offer_id>/<timestamp>.pdf`. Regenerating overwrites
  `deal_memo_pdf_url` to the newest file; older files stay in the
  bucket for audit.
