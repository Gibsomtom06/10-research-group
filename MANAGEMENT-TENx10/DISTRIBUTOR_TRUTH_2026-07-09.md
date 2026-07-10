# Distributor royalties — read directly from the portal, 2026-07-09

Source: `symphonicms.com` → Royalties → Royalty Summary, all years 2019–2026.
Account: **DirtySnatcha, #22670** (single account — no switcher; profile menu only).

---

## 1. Virgin Music Group IS Symphonic

`dsr_label_info.distributor` already said it: *"Virgin Music Group (VMG, formerly
Symphonic)"*. The portal is `symphonicms.com`, and it holds one account.

So `symphonic_royalty_lines` and `vmg_royalty_lines` are **the same distributor**,
two export formats. The money page presents them as two distributors. It should
say one: *Virgin Music Group (formerly Symphonic)*.

The periods do not overlap — Symphonic lines run Oct-2019→Feb-2026 on an
**activity** basis, the VMG file is Apr-2026 on a **reporting** basis — so the
tile is not double-counting today. But the framing is wrong and one careless
import away from becoming a real double-count.

---

## 2. The real lifetime numbers (85 reporting periods, APR-19 → APR-26)

| | |
|---|---|
| Earnings (after the distributor's fee) | **$32,082.90** |
| SplitShare (paid out to collaborators) | **−$15,288.66** |
| Adjustments | +$944.60 |
| **= what DirtySnatcha Records keeps** | **$17,738.84** |
| Payments already made to DSR | −$17,689.78 |
| **Current balance owed** | **$49.13** |

Internal check: `17,738.84 − 17,689.78 = 49.06` against a stated balance of
`$49.13`. Seven cents of rounding across 85 periods. The waterfall is right.

**SplitShare is 48% of earnings.** Nearly half of what the distributor pays this
account goes straight back out to featured artists and co-owners.

SplitShare did not exist before **APR-21**. The $4,879.83 earned in APR-19→MAR-21
had no splits deducted at the distributor.

---

## 3. The account holds TWO distributors' worth of money: the artist's and the label's

**Thomas, 2026-07-09: "dirtysnatcha might be paid for some of that because we have
distribution on symphonic for dirtysnatcha records AND dirtysnatcha."**

That is the key. Account #22670 distributes for two separate rights holders:

- **DirtySnatcha** — the ARTIST. Leigh Bray's own releases. His money.
- **DirtySnatcha Records** — the LABEL. Leigh 70% / Thomas 30%.

APR-26 earnings, broken down by label name inside the account:

| label name at the distributor | whose money | earnings | artist earnings | via SplitShare |
|---|---|---|---|---|
| **DirtySnatcha** | **Leigh, personally** | $129.20 | $92.58 | $83.36 |
| DirtySnatcha Records | the label | $0.73 | $0.36 | $0.22 |
| DirtySnatchaRecords | the label (typo) | $5.55 | $2.78 | $2.78 |
| | | **$135.48** | | |

So in APR-26 the LABEL earned **$6.28** and the ARTIST earned **$129.20**.

### Which means our database is correctly scoped, not broken

`symphonic_royalty_lines` holds only `DirtySnatchaRecords` (83,715 rows) and
`DirtySnatcha Records` (28,074 rows). **Zero rows labelled plain `DirtySnatcha`.**

That is the label's book, and only the label's book. The $22,601.50 "missing" from
our $9,481.40 is **Leigh's personal distribution income**. It has no business in
DSR's accounts, and Thomas owns 30% of DSR — pulling it in would quietly assign
him 30% of the artist's earnings.

The RLS predicate `is_dsr_label()` accepts the two "Records" spellings and rejects
the bare artist name. **That was right.** Do not widen it.

### The typo is still a typo

`DirtySnatchaRecords` (no space) and `DirtySnatcha Records` are the same label
entered two ways. Worth fixing at the distributor so the label's own reporting
stops fragmenting.

---

## 4. Two separate lifetime figures, and they must never be added

The portal's Royalty Summary reports the ACCOUNT total — artist + label combined:

| account-wide, 85 periods | |
|---|---|
| Earnings (after distributor fee) | $32,082.90 |
| SplitShare paid out | −$15,288.66 |
| Adjustments | +$944.60 |
| = kept by the account | $17,738.84 |
| already paid out | −$17,689.78 |
| balance owed | $49.13 |

That $17,738.84 belongs to **Leigh (artist) + the label**, in unknown proportion.
It is not the label's revenue and must not be shown as such.

**The per-label split is only visible on the sales-summary page, per period.** To
get the label's true lifetime figure we need those 85 breakdowns — or the CSVs.

---

## 5. What this settles about the money tile

Both feeds are the same distributor. Both have splits. And the account mixes the
artist's money with the label's.

The tile currently shows **$9,748.33**. Its Symphonic half ($9,481.40) is drawn
from the label-labelled rows only, which is the right scope. Its VMG half ($266.93)
is one month, Apr-2026, from a file whose Label column is `Dirtysnatcha Records` —
also label-scoped.

So the tile is **closer to right than it looked**, and it is measuring *the label*.
Its faults are narrower than feared:

1. It calls one distributor two ("VMG" + "Symphonic"). It is one: Virgin Music
   Group, formerly Symphonic.
2. The two halves are different measures — Symphonic's `Royalty ($US)` is
   pre-SplitShare; VMG's `net_amount_after_3rd_party` is post-split.
3. Neither half nets out SplitShare consistently, and SplitShare is ~48% of
   earnings account-wide.

**Recommendation:** show the label's Earnings and its SplitShare as two lines, from
the same measure, for the same rights holder. Leigh's personal distribution income
is his and does not belong on the label's dashboard at all — if it should be
anywhere, it is on the DirtySnatcha artist page, visible to Leigh.

---

## 6. Open questions

1. **`vmg-dsr-apr2026.xlsx` does not reconcile with the portal.** The file's gross
   is $443.38 and after-fees $355.06; the portal's APR-26 Earnings across ALL
   THREE label names is $135.48, of which the label's share is $6.28. The xlsx's
   Label column says `Dirtysnatcha Records` on all 9,097 lines, yet its total is
   70x the label's portal earnings for that period. Either the xlsx spans more
   than one period, or its "Net Amount" is retailer gross before the distributor's
   share — not the account's earnings. **Resolve before trusting any VMG figure.**
2. Per-period, per-label CSVs are on the sales-summary page (`Export`, plus a `CSV`
   link per label row). Those give the label's true lifetime earnings and
   SplitShare, separated from the artist's.
3. SplitShare recipients are not in our data at all. The SplitShare tab shows who
   is owed what — needed before any "what the label owes" number is trustworthy.
4. **DirtySnatcha's self-distributed releases are Leigh's masters.** That is direct
   evidence for the SoundExchange ownership question: the 106 recordings whose
   owner we could not establish are likely split between DSR-released masters and
   Leigh's own. The per-label CSVs would settle it.
