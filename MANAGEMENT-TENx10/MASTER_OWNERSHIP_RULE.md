# Who owns which master — the rule, and how we know
**2026-07-09.** Established by reading Symphonic's own royalty detail, at Thomas's
suggestion: *"if you look at the ISRC or track title or anything to find out the
royalties you will answer your own question and both of our confusions."*

He was right. It did.

---

## The rule

**The distributor's `Label` field on the recording is the owner. Nothing else is.**

| distributor field | owner |
|---|---|
| Label = `DirtySnatcha` | **Leigh Bray**, personally. A self-release. |
| Label = `DirtySnatcha Records` / `DirtySnatchaRecords` | **DirtySnatcha Records** (Leigh 70% / Thomas 30%) |

The catalogue number agrees and is a useful cross-check:

| catalog number | owner |
|---|---|
| `DS0004`, `DS0008`, `DS0015` … | Leigh, self-released |
| `DSR0074`, `DSR02`, `DSR30` … | the label |
| `CAT294133`, `CAT298940` … | Symphonic-assigned, on Leigh's self-releases |

---

## The ISRC prefix is NOT a signal. I was wrong about this.

An earlier version of `scripts/publishing/soundexchange-exports.sql` reasoned from
the first five characters of the ISRC — the registrant code — and split Leigh's
catalogue into "likely DSR" (`QM42K`) and "third-party UK/Canadian labels"
(`GBWUL`, `GBRKQ`, `CA5KR`, `USLZJ`, `QZ5FN`). **That was wrong.**

Proof, from the portal, one period:

| ISRC | track | distributor's Label |
|---|---|---|
| `GBWUL2054729` | Crashing | **DirtySnatcha** (Leigh) |
| `GBWUL2407705` | Genie In a Bottle | **DirtySnatcha Records** (the label) |

Same `GBWUL` registrant prefix, two different owners. The prefix records who
*issued* the ISRC — a distributor, at a point in time — not who owns the master.

---

## Confirmed owners, from Symphonic APR-26 (30 recordings, 2 of 5 pages)

### Leigh's — self-released, label `DirtySnatcha` (28)

`GBWUL2054729` Crashing · `QZZ8A2432901` She Bangs Like a Fairy on Acid ·
`QZ5FN1992011` Free · `GBRKQ2277569` Old School · `QZ5FN2096166` Dance With Me ·
`QZ5FN2012069` Need U · `QZ5FN2068874` Lover · `QZ5FN2132637` Found Myself ·
`GBRKQ2322533` K.O. · `QZ5FN1978630` Wasted · `GBRKQ2121249` Tonight ·
`USLZJ2122502` Cosmic Sounds · `USLZJ1989291` Falling · `GBRKQ2382127` Spacecraft ·
`QZ5FN2200966` Move Back · `USLZJ2122508` I'm a Savage · `QZTV32416252` Home ·
`GBWUL1922930` Head Drop · `GBWUL2041081` It Ain't Over · `USLZJ2122495` Alien Shit ·
`USLZJ2122505` Can You Feel · `USLZJ1922760` Westside Rollin ·
`QZTRX2132962` Keep Moving · `USLZJ2286477` Lover – Urbanstep Remix ·
`GBWUL2077085` Head Bang · `USLZJ1922758` Shake The Block ·
`USLZJ2122517` Take Me Up · `USLZJ1903529` Set Me Free

### The label's (2)

`QZTRX2237730` FOG HORN (DENNETT) — `DirtySnatchaRecords`
`GBWUL2407705` Genie In a Bottle — `DirtySnatcha Records`

**25 of those 28 are in the set of 106 recordings whose owner we could not
establish.** They are Leigh's. From two pages of one month.

---

## What this means for SoundExchange

- The **featured-artist 45%** on all 124 of Leigh's released recordings is his,
  regardless of owner. Unblocked, unchanged.
- The **sound-recording-owner 50%** splits:
  - masters DSR released → the label claims (Leigh 70 / Thomas 30)
  - masters Leigh self-released → **Leigh claims personally**, 100%
- Claiming a `DirtySnatcha`-labelled master for the label would hand Thomas 30%
  of Leigh's own recording. Do not do it.

---

## How to finish the job

`symphonic_royalty_lines` in our DB holds **only** `DSR####` catalogue numbers
(110,530 lines, $9,425.60) and zero `DS####`/`CAT####`. It is the label's book and
nothing else — correctly scoped. So the owner map for Leigh's self-releases is not
in our database at all.

Get it from the portal, one of:

1. **Royalties → any period → View Details → Track tab** gives `ISRC · Track ·
   Artists · Release · Label` per recording, paginated. Per-row `CSV` and a
   period-wide `Export` button.
2. **Catalog → Releases** should list every release with its label, including
   ones no longer earning.

Then: for every ISRC in `catalog` where `artist_id = Leigh`, set the master owner
from the distributor's Label field. That converts the 106 "unknown" into two clean
claim lists.

Also outstanding: Leigh self-releases through **DistroKid and other distributors**
too. Those masters are his as well, but their ISRCs will never appear in Symphonic.
Inventory every distributor before filing anything with SoundExchange.
