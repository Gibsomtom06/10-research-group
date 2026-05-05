# DBA — Operational Flows

End-to-end paths for outreach, counter-offers, and deal-memo generation. Refer here when changing any step of these flows.

---

## Outreach flow (score-ranked, post-0011)

1. **Score**: `v_target_score` view ranks every (artist × contact × venue × tour) combo by composite probability-to-book. Weights: history 25, tier 15, recency 10, cap_fit 10, anchor 15, reply 15, genre 10.
2. **Radius**: hard zero for non-festival venues inside the radius window of an existing locked show. `radius_exception_candidate` flag for festival venues — surfaced on the `/outreach/priorities` festival panel.
3. **Seed**: `scripts/seed_q2_tier2_drafts.py` default mode pulls from `v_target_score` with a tier-diversity floor. Legacy fallback: `--legacy-rank`. Factor breakdown stamped into `outreach_log.decision_trace` for audit. Agent-workload gate (post-0014) auto-filters `(artist_id, contact_id)` pairs that AB / PRYSM are already in-flight on; logs `[info] agent-workload gate filtered N …`.
4. **Compose**: `agents/outbound.py` runs analyst → pitch pack → composer drafts email → writes to `email_drafts` table. Voice-sample retrieval is semantic (Voyage embeddings) with silent fallback to recency.
5. **Review**: `/drafts` UI — Thomas reviews, clicks send, worker pushes via Gmail.
6. **Priorities UI**: `/outreach/priorities` shows top 50 by score with factor sparkbars, top-3 contribution labels, VIP / festival / radius flags. "Outreach now" button upserts `tour_targets` with `priority=100` so the next seeder run pulls it out-of-band.

## Counter-offer flow

1. **Bounds**: Thomas clicks "counter" on `/offers/[id]`, fills target / min / walk-away.
2. **Stage**: `sendCounterAction` updates `counter_bounds`, bumps status to `countered`. Does NOT auto-send.
3. **Watch**: `scripts/seed_counter_drafts.py` watches for `status='countered'` with fresh bounds. Builds counter payload with `tone_hint`. **Raises** rather than defaulting to `artist_slug='dirtysnatcha'` when the offer row is missing `artist_slug` — a missing slug is a data bug, not a routing default.
4. **Compose**: subprocesses `agents/outbound.py --from-counter-payload` with `DBA_COUNTER_PAYLOAD` env var carrying the JSON payload.
5. **Review**: draft appears in `/drafts` for Thomas to review.

**Universal counter-offer content rules:** always include adjusted guarantee, radius clause, payment timing, hotel buyout. Never reveal `counter_min` / `counter_walk_away` in the body.

## Deal memo PDF generation

`app/lib/deal-memo.ts`:

- US Letter 612×792, `PdfWriter` class with `section / kv / paragraph / spacer`
- `STANDARD` constant mirrors `dsr_standard_deal_terms` view (keep in sync)
- Signature block: Thomas (Licensor) + Promoter (Licensee) with date lines
- Licensor signing identity: **"Leigh Bray aka DirtySnatcha · Licensor"** (legal name, fixed 2026-04-22 — do not regress)
- Uploads to Supabase Storage bucket `deal-memos`. Falls back to `/tmp` writeLocal if upload fails.
- Returns `{ url, generatedAt }`
- If the bucket doesn't exist on a fresh deploy: `supabase storage create deal-memos --private`

## Inbound radius audit (post-0015)

Every in-flight offer is audited against `v_locked_shows` via `fn_offer_radius_check(offer_id)`.

**Severity ladder:**
- `hard_block` — non-festival, both venues coded, inside the radius window. **`signThomasAction` refuses unless called with `{force: true}`.** Client has a two-click override latch.
- `soft_warning` — same-city fallback fired (one or both venues lack coords). Banner only, doesn't block.
- `festival_exception` — festival overlap. Banner only, doesn't block.
- `clear` — no conflict.

**Mirror the `hard_block` guard** for any future server action that materially binds Thomas (future e-sign integration, offer-lock RPC, etc.).
