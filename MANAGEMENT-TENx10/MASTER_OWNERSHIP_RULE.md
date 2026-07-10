# Who owns which master — the rule, and how we know

> ## ⚠ CORRECTED 2026-07-10. The central rule below was WRONG.
>
> This document said: *"Read from the recording's own ℗ line — never from the release
> label, never from the ISRC prefix."* Thomas doubted it. He was right.
>
> **A ℗ line marks who claims copyright in the PUBLISHED EDITION of a sound recording.
> Under an exclusive licence that is normally the LICENSEE, not the owner.** It is
> evidence of who put the record out. It is not a title deed.
>
> **The contract determines ownership.** And DSR's own contracts contradict its ℗ lines:
>
> | source | what it says about the master |
> |---|---|
> | ℗ line on the release | `℗ DirtySnatcha Records` |
> | **current template** (*DSR Exclusive **License** Agreement*, 2024+) | *"The Artists … hereby grants to Label **an exclusive irrevocable license** … in perpetuity."* The **artist keeps the master.** |
> | **old template** (demos@, 2022–23) | *"Ownership of the said recording: **50/50 split ownership** between the label and artist/s."* **Co-owned.** |
>
> The document is titled *License Agreement*, not *Assignment*. A licence — even an
> exclusive, irrevocable, perpetual one — is not a transfer of title.
>
> **Consequence:** 396 of the 417 rows in `recordings` had their owner set from a ℗
> line, and **not one** from a contract. All are now `owner_confidence = 'inferred'`,
> `owner_basis = 'p_line_declaration'`. The 217 DSR rows are flagged
> `OWNERSHIP CONTESTED` (migration 128).
>
> **Do not file a SoundExchange sound-recording-owner claim for DirtySnatcha Records
> on any of them until counsel reconciles "exclusive irrevocable license" against
> ownership.** This is a legal question and I am not qualified to answer it.
>
> What the ℗ line *is* still good for: identifying who **controls** a recording. For
> third-party masters (Wakaan, Circus, Monstercat, Disciple) that is all we have and
> all we need — we claim nothing on those either way. The **featured-artist 45%** is
> unaffected by all of this: it follows the performer, not the owner.

---

**2026-07-09 (superseded in part).** Established by reading Symphonic's own royalty
detail, at Thomas's suggestion: *"if you look at the ISRC or track title or anything
to find out the royalties you will answer your own question and both of our
confusions."*

He was right that the royalty detail settles the artist/label question. He was also
right, a day later, that a ℗ line does not settle ownership.

---

## First, the thing that makes this hard

**An ISRC is a RECORDING. A UPC is a RELEASE. One recording can appear on many
releases — including releases put out by a label that does not own it.**

Thomas: *"an ISRC that's owned as a self release can appear on a UPC on the label.
we did this with two DirtySnatcha and Walter Wilde tracks."*

Confirmed at SoundExchange, `USA2P2536655` — one recording, three releases:

| release | label | date | UPC |
|---|---|---|---|
| Outta Space | DirtySnatcha Records | 2025-08-15 | 198704626937 |
| Wilde Ride | DirtySnatcha Records | 2026-01-30 | 198704951503 |
| Battle | DirtySnatcha Records | 2026-04-10 | 823375069980 |

So **the label on a release does not prove who owns the recording on it.**

---

## The rule

**Ownership belongs to the RECORDING, and the recording's own ℗ line names the
owner.** Not the release's label; not the ISRC prefix.

| signal | what it actually tells you | trust for ownership |
|---|---|---|
| `track_p_line` — the recording's ℗ | who owns the master, and the year it was fixed | **yes, this is the owner** |
| `product_p_line` — the release's ℗ | who owns the release | no |
| release `Label` | who put the release out | evidence only |
| catalogue number `DS####` vs `DSR####` | whose release sequence it belongs to | strong evidence |
| ISRC registrant prefix | who *issued* the ISRC, once | **no. See below.** |

Proof the ℗ year survives re-release: `Turn Uppp` (`QM42K1715880`) sits on the
2026 *Battle* release but carries **`℗ 2017 DirtySnatcha Records`** — the original
recording year and owner, preserved through a later compilation.

Supporting signals, useful when the ℗ line is missing or wrong:

| distributor Label on the recording's own release | likely owner |
|---|---|
| `DirtySnatcha` | **Leigh Bray**, personally. A self-release. |
| `DirtySnatcha Records` / `DirtySnatchaRecords` | **DirtySnatcha Records** (Leigh 70% / Thomas 30%) |

| catalog number | whose release |
|---|---|
| `DS0004`, `DS0008`, `DS0015` … | Leigh, self-released |
| `DSR0074`, `DSR02`, `DSR30` … | the label |
| `CAT294133`, `CAT298940` … | Symphonic-assigned, on Leigh's self-releases |

**When a recording appears on more than one release, use its FIRST release** —
that is where the master was created and where its ℗ was set. Later appearances
are licences or compilations.

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
