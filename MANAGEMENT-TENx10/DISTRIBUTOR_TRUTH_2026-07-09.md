# Distributor royalties — read directly from the portal, 2026-07-09

Source: `symphonicms.com` → Royalties → Royalty Summary, all years 2019–2026.
Account: **DirtySnatcha, #22670** (single account — no switcher; profile menu only).

---

## 1. Virgin Music Group is NOT Symphonic. They are two distributors, in sequence.

**Corrected by Thomas, 2026-07-09:** *"Virgin Music Group is not symphonic.
Symphonic was our old distributor. we now use virgin music group. DirtySnatcha
still uses Symphonic for self releases i think and distrokid and some other ones."*

`dsr_label_info.distributor` used to read *"Virgin Music Group (VMG, formerly
Symphonic)"*, which asserts they are one company renamed. They are not. Fixed in
migration `correct_dsr_distributor`.

| | |
|---|---|
| **DirtySnatcha Records**, until Feb 2026 | Symphonic Distribution |
| **DirtySnatcha Records**, from 2026 | **Virgin Music Group** |
| **DirtySnatcha** (the artist), ongoing | Symphonic, DistroKid, and others |

Confirmed in the data: `symphonic_royalty_lines` covers 77 activity periods
Oct-2019 → Feb-2026. `vmg_royalty_lines` has exactly one, `P04 26` (Apr-2026).
**Sequential, no overlap.** Summing them for a lifetime label figure is correct.

That wrong string caused a real analytical error in this document's first draft:
it made the Symphonic portal look like the source of the VMG statements, and the
70x gap between them look like a data bug rather than two different companies.

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

## 3. Whose account is #22670? The ARTIST's.

Everything in §2 is read from **Symphonic**, account name `DirtySnatcha`. That is
Leigh's own distribution account. It still carries small residual earnings for the
label, because DSR's old Symphonic releases keep paying out — but the label has
moved to Virgin.

So the $32,082.90 / $17,738.84 figures in §2 are **the artist's Symphonic account,
plus DSR's Symphonic residuals.** They are not DSR's revenue and never were.


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

1. ~~`vmg-dsr-apr2026.xlsx` does not reconcile with the portal.~~ **RESOLVED — it
   never should have.** The xlsx is **Virgin Music Group's** statement for DSR.
   The portal figures are **Symphonic's**, for the artist's account. Two different
   distributors. There is no discrepancy. The 70x gap was an artefact of the wrong
   `distributor` string in `dsr_label_info` (§1).
2. Per-period, per-label CSVs are on the sales-summary page (`Export`, plus a `CSV`
   link per label row). Those give the label's true lifetime earnings and
   SplitShare, separated from the artist's.
3. SplitShare recipients are not in our data at all. The SplitShare tab shows who
   is owed what — needed before any "what the label owes" number is trustworthy.
4. **DirtySnatcha's self-distributed releases are Leigh's masters.** Direct evidence
   for the SoundExchange ownership question: the 106 recordings whose owner we
   could not establish are split between DSR-released masters and Leigh's own
   self-releases. His Symphonic + DistroKid catalogues would settle it.

5. **The artist's distribution is scattered and needs consolidating.** Thomas:
   *"i need to fix his distribution."* DirtySnatcha currently self-releases through
   Symphonic, DistroKid, "and some other ones." Every extra distributor is another
   royalty statement nobody reads, another ISRC registrant prefix, another place a
   master can be misattributed, and another split of the same catalogue's
   SoundExchange claim. Inventory them before choosing one.
