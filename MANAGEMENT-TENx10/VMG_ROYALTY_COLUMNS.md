# VMG royalty columns — what each one means, derived from the data
**2026-07-09.** Period `P04 26`, 9,097 real lines (footer excluded).

## The waterfall

Every figure below is the sum across all 9,097 lines. The relationship holds on
every line (12 apparent exceptions are sub-cent rounding on 50/50 splits, e.g.
`0.000699 − 0.000349 = 0.000350` stored as `0.000349`).

```
  Net Amount                               $443.38   what the retailers paid, for DSR's masters
    − VMG's distribution fee                $88.31   ≈19.9%  (per-line: DSR keeps 81.7% on average)
  = Net Amount After Fees                  $355.06   what VMG pays the label
    − Total 3rd Party Payments              $88.14   splits owed to featured artists / co-owners
  = Net Amount After 3rd Party Payments    $266.93   what DirtySnatcha Records actually keeps
```

`US Mechanicals` is **−$6.29** across 31 lines — mechanical royalties withheld at
source, tracked separately. It is not part of the waterfall above.

## Third-party payments are SPLITS, not fees

4,029 of 9,097 lines carry one. The pattern is unmistakable:

| artist_display | gross | paid to 3rd party | DSR keeps |
|---|---|---|---|
| DirtySnatcha, Luci | $48.47 | $19.44 | $19.44 |
| Dark Matter | $24.58 | $9.47 | $9.47 |
| Mavic, Ozztin | $15.64 | $6.37 | $6.37 |
| Walter Wilde, Tyro, Alic Adams | $14.17 | $1.85 | $9.38 |

Where the payout equals the retained amount, that is a 50/50 collaborator split.
These are payments **out of** the label's share to featured artists and
co-owners — money DSR collects and passes on.

## Which number is "recorded music revenue"?

It depends on the question:

| question | column | amount |
|---|---|---|
| What did the music earn at retail? | `net_amount` | $443.38 |
| What did the distributor pay the label? | `net_amount_after_fees` | **$355.06** |
| What did the label keep after paying collaborators? | `net_amount_after_3rd_party` | $266.93 |

## The consistency problem on the money page

`/dashboard/money`'s "Recorded music" tile adds VMG + Symphonic. But the two
feeds are not the same measure:

- **Symphonic** `symphonic_royalty_lines.net_amount` is the export's
  `Royalty ($US)` — the royalty **payable to the label**, i.e. already after
  Symphonic's cut. It has **no third-party/split column at all.** So the
  Symphonic figure of **$9,481.40** is an *after-distributor-fee* number.
- **VMG** currently contributes `net_amount_after_3rd_party` = **$266.93**, an
  *after-fee-AND-after-splits* number.

Adding them mixes two different measures. And the tile's subtitle says
"lifetime net after fees", which describes the Symphonic half but not the VMG half.

### Recommendation

Use **after distributor fees** for both, because it is the only measure Symphonic
can express:

```
  Symphonic  $9,481.40
  VMG          $355.06
  ─────────────────────
  Recorded music  $9,836.46      "lifetime net, after distributor fees"
```

Then show the collaborator splits as their own line — $88.14 owed out on the VMG
side — rather than silently netting them into the headline. That is real money
DSR owes to featured artists, and it deserves to be visible, not hidden inside a
smaller number.

If instead the tile should mean "what the label keeps", the VMG half is $266.93
but the Symphonic half cannot be computed: we do not have Symphonic split data.
The tile would be honest only if it said so.

### What is currently on screen

`$9,748.33` = $9,481.40 Symphonic (after fees) + $266.93 VMG (after fees + splits).
Neither measure. This needs Thomas's decision before it is correct.
