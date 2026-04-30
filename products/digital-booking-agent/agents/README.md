# DBA specialist agents

Python runners that wrap each specialist prompt in `../prompts/` with the Supabase + Anthropic plumbing needed to run end to end.

## Install

```bash
pip install supabase anthropic
```

## Env required

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE=<service_role_key>
ANTHROPIC_API_KEY=<key>
```

## Agents

### `analyst.py`

Builds a pitch-pack for a contact + intent. Enforces freshness gates (stats ≤30d, praise ≤90d, specificity ≥0.7) client-side before calling the model, so blocked packs never burn tokens. Writes to `pitch_packs` table.

```bash
python agents/analyst.py \
  --contact-id <uuid> \
  --intent cold_outreach \
  --proposed-date 2026-08-14 \
  --prior-city Cleveland --prior-date 2026-08-12 \
  --next-city Chicago --next-date 2026-08-16
```

### `outbound.py`

Composes an email in Thomas's voice from a pitch-pack. Refuses if `verification_stamps` don't all pass. Runs client-side validation (no em-dashes, no banned filler phrases) and caps confidence if anything is caught. Writes to `outreach_log` with `status=draft` — Supervisor decides queuing.

```bash
python agents/outbound.py \
  --pitch-pack <pitch_pack_id> \
  --email-type cold_outreach
```

Email types: `cold_outreach | warm_pitch | counter_offer | confirmation | followup`.

### `inbound.py`

Classifies an inbound email and creates structured rows. Reads payload from stdin or `--payload-file`. Upserts `contacts`, creates `offers` when class is `offer` or `negotiation`, writes `outreach_log` (direction=inbound), audits to `decisions`.

```bash
cat incoming_email.json | python agents/inbound.py
```

Payload shape matches what `prompts/inbound_classifier.md` expects.

### `routing.py`

Dispatcher. Given an inbound classification (+ contact, open offers, recent outreach), decides which specialist runs next. Hard safety routes (DNC, bad emails, sensitivity flags, deep holds) are implemented in code, not the model — the model is only consulted when no hard rule matches. Writes a `decisions` row with actor=`routing`.

```bash
# from a stored inbound log (classifier result is in decision_trace)
python agents/routing.py --from-classifier-log <outreach_log_id>

# from pasted classifier JSON
echo '<classifier json>' | python agents/routing.py --contact-id <uuid>
```

Output: `{ route_to, intent, payload, priority, reason, blockers, recommended_after }`.

### `research.py`

Fact-finder. Fills gaps in `contacts`, `venues`, or `market` data. Enforces: allowed field catalog (no junk fields), at-least-one-source per finding, freshness downgrade for stats >30d, two-source rule for high-confidence contact emails. Can optionally enable Anthropic's hosted `web_search` tool (`--allow-web-search`). With `--apply`, writes high-confidence findings back to the target row.

```bash
python agents/research.py --target contact --target-id <uuid> \
  --missing email --why "current email bounced" --apply

python agents/research.py --target venue --target-id <uuid> \
  --missing capacity,booking_contact_email --allow-web-search --apply

python agents/research.py --target market --target-id "Brooklyn" \
  --missing artist_monthly_listeners,youtube_views_90d --allow-web-search
```

### `reporting.py`

Rollup writer. Reads `outreach_log`, `offers`, `decisions`, `v_reach_back_reminders` over a window and produces a scorecard + markdown narrative. Writes to `reports` table (or falls back to `decisions` if unavailable).

```bash
python agents/reporting.py --period daily
python agents/reporting.py --period weekly
python agents/reporting.py --period custom --start 2026-04-15 --end 2026-04-22
```

### `supervisor.py`

Orchestrator. Reads unrouted inbound logs, runs `routing.py`, applies safety gates (daily cap, per-contact 7d cap), dispatches the target specialist via subprocess, and writes a summary `decisions` row. Idempotent; safe on a 1-minute cron.

```bash
# single pass (recommended for cron)
python agents/supervisor.py --once

# one specific log (manual)
python agents/supervisor.py --log-id <outreach_log_id>

# continuous loop (local dev)
python agents/supervisor.py --loop --interval 60

# dry-run (no side effects)
python agents/supervisor.py --once --dry-run
```

Gates enforced in code (not the prompt):
- `SUPERVISOR_DAILY_CAP` outbound sends per day (default 25)
- `SUPERVISOR_PER_CONTACT_7D` outbound per contact per 7d (default 1)
- Anything blocked becomes `held_for_review` via the chosen specialist, never auto-sent.

## End-to-end flow (example)

1. Email arrives in Thomas's booking inbox.
2. Gmail push → worker calls `inbound.py` → classification + offer row created.
3. Supervisor sees classification with `suggested_route = "analyst_then_booking_evaluator"`.
4. Supervisor calls `analyst.py` with `intent=counter_offer` → pitch-pack written.
5. Supervisor runs the `dsr-booking-evaluator` skill on the offer with pitch-pack context.
6. If evaluator decision is `counter` or `accept`: Supervisor calls `outbound.py` with `email-type=counter_offer` → draft written.
7. Draft surfaces on `/drafts` page. Thomas approves, edits, or rejects.
8. Approved drafts move to `queued` with `scheduled_send_at` per the human-cadence rule.
9. Sender worker (task #11, not yet built) polls and sends.

## Dry-run everything

All three runners accept `--dry-run` to skip DB writes — useful for debugging prompts or sanity-checking the model's output format.
