# DBA — Session Handoff (2026-05-04)

## Context

This is the handoff Thomas was preparing in `products/tenx10-platform/DEALS_HANDOFF.md` (last touched May 4 03:14) before realizing he should be working from the umbrella root, not inside the tenx10 standalone clone. The DirtySnatcha 2026 shows table below was about to be added there but never made it to disk — capturing it here so it's not lost.

**Larger context this session:** the old DBA Supabase project (`erwlfjlgrrfuqnjzitor`) is dead — DNS doesn't resolve, no backup recoverable. Decision was made to merge DBA into TENx10's Supabase project (`ocscxqaythiuidkwjuvg`). DBA-only tables get applied alongside TENx10's existing `deals/contacts/venues/artists`. One project. Hierarchy is `10 Research Group → TENx10 → DBA`.

The previous platform-side handoff at `products/tenx10-platform/DEALS_HANDOFF.md` documents:
- Migrations 044 + 045 already applied to `deals`: `deposit_due_date`, `balance_due_date`, `bonus_structure jsonb`, `ticket_capacity`, `walkout_potential`, `offer_thread_id`, `offer_sheet_url`
- 6 WHOiSEE deals + 1 Kotrax deal already ingested via Brian Lachman / Corson Agency
- DirtySnatcha Electric Forest Day 2 corrected June 28 → June 26
- **Active TENx10 platform blocker:** dashboard `/dashboard/deals` blank for Thomas. Last fix is commit `92d17bd` (service-client fallback when `artist_members` has no match), needs verification on hard reload.

---

## DirtySnatcha 2026 booked shows

These are real, in-flight booking commitments. Verify against existing `deals` rows before seeding (Electric Forest dates are likely already there from the 044/045 migration session).

| Date | Market | Guarantee | Deposit | Balance | Status / Notes |
|------|--------|-----------|---------|---------|----------------|
| 2026-05-30 | Orlando, FL | $2,000 | $200 | $200 | Assets attached |
| 2026-06-04 | Seattle, WA [MPort] | $1,750 | $175 | $1,575 | Contract no HGR |
| 2026-06-13 | Santa Fe, NM | $1,500 | $150 | $1,350 | No contract — Andrew confirmed by phone. Flight, HGR, bonuses |
| 2026-06-18 | Portland, OR | $2,000 | $200 | $200 | Contract no HGR. Assets |
| 2026-06-20 | San Diego, CA | $3,000 | $300 | $2,700 | Contract no HGR |
| 2026-06-25 | Electric Forest | N/A | N/A | N/A | Festival. Likely already in `deals`. |
| 2026-06-28 | Electric Forest | N/A | N/A | N/A | Festival. Likely already in `deals` (was 6/26 per platform handoff — verify). |
| 2026-07-18 | Austin, TX [MPort] | $2,000 | $200 | $1,800 | Contract + HGR. Andrew negotiating to $2,250 |
| 2026-07-31 | Oklahoma City, OK | $2,000 | $400 | $1,800 | Contract + HR (rider, no HGR) |
| 2026-08-01 | Sacramento, CA | $2,000 | $400 | $1,600 | Direct support — see WHOiSEE Sacramento deal in platform handoff (offer pending Tue 5/5) |
| 2026-08-08 | Rappin' the Rivers, MT | $3,000 | $300 / $1,200 paid | $1,500 remaining | $1,500 deposit received |
| 2026-08-22 | Baltimore, MD [MPort, Ozztin, Sinatra] | $1,750 | $175 | $1,800 | Contract + HGR |
| 2026-09-16 | Lost Lands | $2,500 | $250 | $2,250 | Contract |
| 2026-09-20 | Lost Lands | — | — | — | Contract |

Total committed (excluding festivals): **$24,500 gross** across 12 hard shows.

---

## Immediate next step (DBA side)

Apply DBA-only tables to `ocscxqaythiuidkwjuvg`, run `npm run sender:dryrun` to confirm worker connects to `outreach_log`. See plan at `~/.claude/plans/replicated-stargazing-squid.md`.

## Pass 2 (deferred to morning)

- Reconcile this booking data with whatever's already in `deals` for DirtySnatcha (no duplicates)
- Build a real compatibility view `offers → deals` so DBA's Python/TS code can read the live booking pipeline
- Verify TENx10 `/dashboard/deals` blank issue from `92d17bd`
