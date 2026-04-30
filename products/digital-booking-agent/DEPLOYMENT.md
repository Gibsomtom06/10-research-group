# DBA — Deployment walkthrough

Zero to first-live-send. If this doc takes you more than two hours, something is off — ping the playbook first (`PHASE_0_PLAYBOOK.md`) for diagnostic tips.

The happy path has five phases. You can do the Gmail Takeout export (phase 3) in parallel with phases 1 and 2 since it runs in the background for hours.

---

## Phase 1 — Supabase (~15 min)

1. Go to https://supabase.com, create a new project. Name: `dba-dirtysnatcha`. Region: nearest to you. Free tier is fine for Phase 0.
2. Wait for the project to provision (~2 min).
3. In the Supabase dashboard → Settings → API, copy these three strings. You'll paste them into `.env.local` in Phase 2.
   - Project URL → `SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE`
4. In the Supabase dashboard → SQL editor, create a new query. Paste in order (each is idempotent; rerunning is safe):
   1. `products/digital-booking-agent/schema.sql`
   2. `products/digital-booking-agent/migrations/0001_outreach_audit_columns.sql`
   3. `products/digital-booking-agent/migrations/0002_bounces_and_reminders.sql`
   4. `products/digital-booking-agent/migrations/0003_reports.sql`

   Run each one. If any fails, stop and check the error — usually it's a typo in a previous migration or a missing extension (`gen_random_uuid` requires `pgcrypto`, which should already be available).

5. In the Supabase dashboard → Table editor, confirm these tables exist:
   - `contacts`, `venues`, `offers`, `outreach_log`, `pitch_packs`, `decisions`, `artist_data`, `praise_bank`, `voice_samples`, `source_imports`, `worker_state`, `reports`

---

## Phase 2 — Local app + workers (~10 min)

From `products/digital-booking-agent/`:

```bash
# set up the app
cd app
cp .env.example .env.local   # fill with the three Supabase keys from phase 1
npm install
npm run dev                  # verify localhost:3000 renders

# set up the workers (separate process lifecycle)
cd ../workers
npm install
```

You should see `/dashboard`, `/drafts`, `/outreach`, `/reminders`, `/contacts`, `/markets`, `/reports` all render with empty-state copy. No data yet is expected.

Also set these env vars at the shell level (or in a local `.envrc`) — the Python agents need them:

```bash
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE="<service_role_key_from_phase_1>"
export ANTHROPIC_API_KEY="<your anthropic key>"
```

Install Python deps:

```bash
pip install supabase anthropic
```

---

## Phase 3 — Data intake (~3-6 hrs wall time, mostly waiting)

Kick these off in parallel, in this order:

1. **Google Takeout** (start first, runs for hours):
   Go to takeout.google.com. Select: Mail + Contacts. Format: mbox. Click Create Export. You'll get an email when it's ready. Download the zip.

2. **Spotify for Artists** — export last 12 months as CSV from the dashboard.

3. **YouTube Analytics** — export last 12 months as CSV.

4. **Gigwell show-history** — the DirtySnatcha scrape. Drop the CSV into `_staging/gigwell_contacts.csv`.

Once Takeout finishes (hours later), extract the mbox and run:

```bash
cd products/digital-booking-agent
python scripts/parse_gmail_mbox.py \
    --mbox /path/to/All\ mail\ Including\ Spam\ and\ Trash.mbox \
    --sender thomas@dirtysnatcha.com \
    --out-dir ./_staging/parsed

python scripts/load_to_supabase.py --skip-generic

python scripts/import_gigwell_contacts.py \
    --input ./_staging/gigwell_contacts.csv \
    --dry-run
# review the preview, then rerun without --dry-run
python scripts/import_gigwell_contacts.py \
    --input ./_staging/gigwell_contacts.csv
```

---

## Phase 4 — Preflight + dry-run (~15 min)

Run the preflight check:

```bash
cd products/digital-booking-agent
python scripts/preflight.py
```

It validates: env vars, Supabase reachability, every expected table + view, all 7 agent runners compile, all 5 workers present, app routes present, Anthropic API reachable, Gmail sender mode safe. Pass `--skip-anthropic` if you don't want to burn a token on this check.

Then dry-run the key workers — each accepts `:once` to run a single pass:

```bash
cd workers
npm run sender:dryrun         # composes + queues, never sends
npm run freshness-sweep:once  # marks stale packs
npm run reminder-sweep:once   # stamps reach-back reminders
npm run bounce-handler:once   # polls for DSNs (no-op if none)
```

And dry-run the supervisor:

```bash
cd ..
python agents/supervisor.py --once --dry-run
```

This walks the inbound queue, runs routing for each unrouted log, and prints the dispatch plan without any side effects. If this succeeds, your whole pipeline is wired.

---

## Phase 5 — Go live (~5 min)

1. **Gmail OAuth**: generate `credentials.json` + `token.json` for `thomas@dirtysnatcha.com`. Drop them at `workers/.gmail/`. See [Gmail API quickstart](https://developers.google.com/gmail/api/quickstart/python) — you only need the `gmail.send` + `gmail.readonly` scopes.
2. In `workers/.env`, set `SENDER_DRY_RUN=false`.
3. Start the sender + supervisor loops:

   ```bash
   # in one shell
   cd workers && npm run sender

   # in another shell
   cd products/digital-booking-agent
   python agents/supervisor.py --loop --interval 60
   ```

4. Run your first reporting rollup:

   ```bash
   python agents/reporting.py --period daily
   ```

   Then check `/reports` in the dashboard.

---

## Cron recipe (once you trust it)

On a Linux box (or launchd on macOS):

```cron
# supervisor tick every minute
* * * * * cd /path/to/dba && python agents/supervisor.py --once >> logs/supervisor.log 2>&1

# sender loop (long-running — use a systemd unit instead)
# see workers/README.md

# freshness sweep every 4h
0 */4 * * * cd /path/to/dba && cd workers && npm run freshness-sweep:once >> ../logs/freshness.log 2>&1

# bounce handler every 30 min
*/30 * * * * cd /path/to/dba && cd workers && npm run bounce-handler:once >> ../logs/bounces.log 2>&1

# reminder sweep daily at 7am local
0 7 * * * cd /path/to/dba && cd workers && npm run reminder-sweep:once >> ../logs/reminders.log 2>&1

# daily reporting 8am local
0 8 * * * cd /path/to/dba && python agents/reporting.py --period daily >> logs/reporting.log 2>&1

# weekly reporting monday 9am local
0 9 * * 1 cd /path/to/dba && python agents/reporting.py --period weekly >> logs/reporting.log 2>&1
```

---

## Safety gates that are already on

These are enforced in code, not config — no way to accidentally turn them off:

- `SUPERVISOR_DAILY_CAP` outbound sends per day (default 25). Overage gets held, never queued.
- `SUPERVISOR_PER_CONTACT_7D` outbound per contact per 7 days (default 1). Same.
- Quiet hours 9pm–8am recipient-local are enforced in `sender.ts`.
- VIP / sensitivity-flagged contacts go to Thomas, never autosent.
- Financial actions (dollar amounts, commits, deposits) always hold.
- Bad-email contacts (`email_valid=false`) have all queued outreach auto-cancelled by `markEmailBad` and the bounce handler.
- Analyst verification stamps are a hard gate on Outbound — no verification, no send.

---

## When something breaks

1. Check `/dashboard` first — held items surface with rationale.
2. Check `/reports` — daily rollups include error counts.
3. Grep the `decisions` table for your contact_id or offer_id — every action writes a decision row with input + output snapshots, so the audit trail is complete.
4. Set `SENDER_DRY_RUN=true` immediately if anything looks weird. The sender will keep composing but stop mailing until you flip it back.
