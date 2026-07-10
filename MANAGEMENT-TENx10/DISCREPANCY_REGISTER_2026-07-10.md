# Discrepancy register — where two sources of truth disagree
**2026-07-10.** Opened because Thomas asked the right question:

> *"i thought you did an analysis of tenx10.co why wasnt the multiple buckets flagged?
> and where are other places with multiple discrepancies that hasnt been flagged in
> this system audit."*

---

## Why the system audit missed this

The audit graded every surface **against the database**. It asked *"does this number
match the data?"* — and it caught fabricated metrics, false zeros, a dropped table, a
live billing route with no product behind it.

It never once asked *"do two definitions of the same thing agree with each other?"*

That is a different class of defect, and the audit was structurally blind to it.
`catalog.bucket` holding one value looked like *feature not adopted*. It was actually
*two incompatible systems, one of them never used.* Same observation, opposite meaning,
and only the definitions can tell you which.

**Rule going forward: for anything with a name, find every place that names it.**

---

## Confirmed contradictions

Each verified this session against the file and the data. Nothing below is inferred.

### 1. Catalog buckets — SIX in code, FIVE in the knowledge base

| source | buckets |
|---|---|
| `src/app/dashboard/catalog/CatalogClient.tsx` (shipped, live) | `released_full` · `soundcloud_only` · `mixes_sets` · `unreleased_collab` · `wip` · `vault` |
| `TENx10_Knowledge_Base/20_Catalog_Management.md` | released & live · released-organic-only · WIPs · collabs · label submissions |
| `TENx10_Knowledge_Base/07_Artist_Bible.md` — *which Thomas named as the source* | **none.** Only marketing buckets and DSP "bucket logic". |

`00_START_HERE.md` calls the doc "5-bucket catalog system", so the KB is internally
consistent and disagrees with the code.

The two models are not reconcilable by renaming. The KB has `label_submission` with a
21-day response clock and `collab` with outbound/inbound direction; the code has
`mixes_sets` and `vault`, which the KB drops entirely. Each holds something the other
cannot express — which is why *Green Onions* (a cover, signed to Monstercat, unreleased)
had no home anywhere and returned zero rows in every query.

**Thomas ruled 2026-07-10: the five-bucket KB model is truth.** The code must change.
Migration 127 restored the shipped six so nothing breaks in the meantime; see task #61
for the ordered cutover.

**I made this worse before catching it.** Migration 120 invented an *eight*-stage
lifecycle out of nothing. Migration 124 replaced it with the KB's five and would have
made every "Add Track" and "Move to bucket" fail on a constraint violation. Both
reverted.

### 2. Framework version — CLAUDE.md says 14, package.json says 16

    CLAUDE.md      "Next.js 14, TypeScript, Tailwind, shadcn/ui"
    package.json   "next": "16.2.4",  "react": "19.2.4"

Two major versions out of date, in the file every session reads first.

### 3. Task tracking — the two instruction files forbid each other

| file | instruction |
|---|---|
| global `~/.claude/CLAUDE.md` | *"MANDATORY: TodoWrite is the workflow. Every session, every time, no exceptions."* |
| `products/tenx10-platform/CLAUDE.md` | *"All task tracking goes through `bd`. **Do NOT use TodoWrite** or markdown TODO lists."* |

A session in this product cannot obey both.

### 4. The label's publisher — the KB names one, the data shows two

`20_Catalog_Management.md`, VMG Distribution block:

> **Publisher:** DirtySnatcha Records Publishing (ASCAP)

The distributor's own catalogue export declares, per recording:

| publisher | PRO | declarations |
|---|---|---|
| **LAB10 Publishing** | **BMI** | **91** |
| DirtySnatcha Records Publishing | ASCAP | 70 |

The KB names the *minority* publisher and omits the majority one entirely. Two entities
exist because ASCAP cannot pay a BMI publisher. A reader of the KB alone would file
every work with the wrong society.

### 5. The label roster — the KB lists 6, the catalogue has 115

`20_Catalog_Management.md` "Label Roster Releases": DirtySnatcha, selekta, OZZTIN,
MAVIC, PRIYANX, WHOiSEE.

The Symphonic catalogue export across DSR's 129 releases contains **115 distinct artist
names**. The KB omits 111 of them — Dark Matter, BBX, Kotrax, Autokorekt, Barooka,
Big City, Artifact, Aalioura, Akronym and a hundred more.

**`selekta` appears in no DSR release at all.** Neither does `WHOiSEE` under that
spelling in the export, though he has 3 DSR-owned masters in `recordings`.

`artists.on_dsr_label` is true on **7** rows. Also not 115.

### 6. Parent label — "for some releases" is wrong

`20_Catalog_Management.md`:

> **Parent Label:** EDM Spotlight (for some releases)

The Symphonic export carries `Parent Label = EDM Spotlight` on **169 of 169** rows.
Not *some*. All of them. This matters: two executed agreements with **District**, sent
from an **EDM Spotlight Inc.** RightSignature account, may define the whole distribution
chain (task #57).

---

## Code defects found in the same sweep, fixed today

- `src/app/dashboard/money/page.tsx` — a comment read *"NOT Leigh Bray's — **her** LAB10"*.
  Leigh Bray is he/him. Fixed.
- `src/app/dashboard/catalog/page.tsx` — the empty-state paragraph listed the six buckets
  and then repeated a truncated fragment of the list (`"Only / Unreleased Collabs /
  Work in Progress / Vault."`) after the closing sentence — copy-paste residue that has
  been rendering to users. Fixed, and the "6-bucket" claim removed rather than replaced
  with a number I would then have to defend.

---

## Not yet checked

Named here so nobody mistakes silence for a clean bill:

- `03_KA_Part2_Booking_Money.md` commission rules (10/10/80 vs 20/80) vs the rates
  actually written in Thomas's invoice template (show 10%, jerseys 15%, Flow Stars 10%
  of the artist's 50% share, DSR items 0%).
- `02_KA_Part1_Foundation.md` "4-tier permissions" vs the RLS actually deployed
  (`is_platform_admin`, `is_label_owner`, `is_artist_member`, manager_id).
- `19_Platform_Spec.md` Drive folder structure per show vs what exists in Drive.
- `24_Agent_Team_Architecture.md` 8-agent team vs the 2 of 19 agents `EMPLOYEE_DIRECTORY.md`
  says are built.
- `catalog.type` vocabulary (`single/collab/remix/album/compilation`) vs
  `recordings.rights_type` — a row typed `collab` was hiding a cover (*Drugs In Da Club*).
- `20_Catalog_Management.md` "137 tracks in Spotify catalog" vs 126 released recordings
  for DirtySnatcha. Different scopes, possibly both right. **Unverified — do not cite.**
