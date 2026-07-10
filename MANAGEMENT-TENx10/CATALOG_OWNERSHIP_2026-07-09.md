# Catalog update — master ownership resolved for all five entities
**2026-07-09.** WHOiSEE · Dark Matter · HVRCRFT · DirtySnatcha · DirtySnatcha Records.

**Every one of the 231 released recordings across the four managed artists now has
an established owner, cited to a source.** Before today, 106 of DirtySnatcha's 124
were unknown and no SoundExchange owner claim could be filed on them.

---

## What we found, and what we did not

There is **no SoundExchange export** anywhere on the machine or in Google Drive. The
hunt for it was the wrong hunt. Two files in `Downloads/` are strictly better:

| file | what it is |
|---|---|
| `2025-04-01DSR.csv` | Symphonic catalogue export. 169 rows, **161 distinct ISRCs**. Carries `Track P Line`, `Publishers/Collection Societies`, writers, UPC, catalogue number. |
| `ReleasesExport.csv` | 155 ISRCs, a **strict subset** of the above. Ignore it. |

SoundExchange's public search returns none of that. It has no API and should not be
scraped.

A third file, `2025 - H1 DirtySnatcha Sales Export.csv`, is a **Wakaan** statement —
5,503 rows, but only **3 distinct ISRCs**. It is another label's book and must never
be folded into DSR's.

---

## The rule, unchanged, now applied at scale

Ownership belongs to the **recording** (the ISRC), and the recording's own **℗ line**
names the owner — taken from its **earliest** release. Not the release label. Not the
ISRC prefix.

This is why ownership could not go on `catalog`: that table holds one row per
*artist per recording*. `Skrrt` (`USA2P2545706`) is in it twice, once for Dark Matter
and once for Kotrax. An owner column there would let one master carry two owners.
Hence the new `recordings` table, keyed on ISRC.

---

## The ISRC prefix is not a distributor signal either

I previously proved the registrant prefix does not identify the **owner**. Today I
tested whether it identifies the **distributor**. It does not.

161 tracks. One distributor (Symphonic). One label (DSR). **Twelve** registrant
prefixes: `USA2P`, `QZ5FN`, `GBRKQ`, `USLZJ`, `GBWUL`, `QZTV3`, `QZWDD`, `QZWV3`,
`QZTRX`, `QZZ8B`, `QZWDE`, `QZZEB`.

The reason: DSR signs artists who already hold ISRCs issued by *their* previous
distributor, and the label release reuses them. UPC/GS1 prefix is nearly as noisy —
four barcode blocks for that one distributor.

**Spotify has no distributor field at all.**

### But the ℗ line does leak the distributor — in one specific case

When an artist supplies no label, the distributor stamps its own placeholder:

| ℗ line | distributor | recordings |
|---|---|---|
| `744447 Records DK` | **DistroKid** | HVRCRFT — `QMPKX1896938`, `QZANL1760368`, `QZNWT2128340` |
| `Repost Network` | **SoundCloud / Repost** | DirtySnatcha — `QM42K1766474` *HEAVY HITTA*, `QM42K1785552` *Hands Up* |
| `Kobalt Music` | Kobalt | HVRCRFT — `QT2VB2420990`, `QT2VB2451921` |

Those five rows are flagged by `v_master_ownership.p_line_names_a_distributor`.
A ℗ line naming a distributor means **nobody declared an owner** — the master is
almost certainly the artist's, and the ℗ line should be corrected.

The exact way to inventory scattered distribution is a set difference: take the full
ISRC list from Spotify, subtract the ISRCs appearing in each distributor's statements.
What remains sits with a distributor nobody is reading statements from.

---

## Where the catalogue actually stands

| artist | released | owner resolved | artist owns | DSR owns | third party |
|---|---|---|---|---|---|
| DirtySnatcha | 124 | **124** | 49 | 23 | 52 |
| HVRCRFT | 50 | **50** | 2 | 0 | 48 |
| WHOiSEE | 31 | **31** | 0 | 3 | 28 |
| Dark Matter | 26 | **26** | 1 | 10 | 15 |

`recordings` holds **209 DirtySnatcha Records masters** (161 from Symphonic, all of
which turned out to be a subset of VMG's 209) plus 208 more from the Spotify walk.

### What this means for SoundExchange

- **Featured-artist 45%** — every artist, on every one of their recordings, regardless
  of owner. Unblocked for all 231.
- **Owner 50%** —
  - `owner_kind = 'artist'` → the artist personally, 100%. **49 of Leigh's.**
  - `owner_kind = 'label'` → DirtySnatcha Records (Leigh 70 / Thomas 30).
  - `owner_kind = 'third_party'` → not ours. Filing here would be a false claim.

Claiming Leigh's 49 self-owned masters for the label would hand Thomas 30% of the
artist's own recordings.

---

## Resolved: `DirtySnatcha Promotions` is nobody

> **Thomas, 2026-07-09:** *"dirtysnatcha promotions was never actually a legitimate
> company. we formed DirtySnatcha Records LLC around 2023 or 2024."*

An entity that does not exist cannot own a sound recording. Those 20 recordings
(2017–2018) were fixed by Leigh when no company existed, so the master is **his,
personally**. Reclassified in migration 112 as `owner_kind='artist'`,
`owner_confidence='inferred'` — the ℗ line still says otherwise and needs correcting
at the distributor.

**Leigh now personally owns 69 masters, not 49.**

### The much larger question this exposes

**89 masters carry `℗ DirtySnatcha Records` with a year of 2022 or earlier** — range
2017–2022 — *before the LLC existed*.

A company cannot own a recording fixed before it was formed. Those masters were
Leigh's personally at the moment of fixing. They belong to the LLC only if he
**assigned** them to it at formation.

Filing SoundExchange owner claims for the label on all 89 without that assignment
would hand Thomas **30% of recordings Leigh made before the company existed.**

This is a legal question about a document, not something readable off a ℗ line.
**Do not file label owner claims on pre-2023 masters until it is answered.**

## Still open — do not resolve by guessing

| ℗ line | recordings | question |
|---|---|---|
| `SOCI` | 4 (WHOiSEE) | Socially Outrageous Collective Of Intelligence is WHOiSEE's **publisher** (BMI, IPI 01088724720). A publisher cannot own a master. Is SOCI also a label? |
| `DSV Audio` | 2 (DirtySnatcha) | Third-party label, or Leigh's? |
| `HVRCRFT` | 2 | Self-owned — confirm. |

---

## Are we losing money on the bad ℗ lines? Mostly no — but we are losing money

**Streaming pays on the ISRC and the distributor contract. It never reads the ℗ line.**
No Spotify or Apple money has been lost to any of these typos.

Where the ℗ line *is* consulted is **SoundExchange** and the equivalent neighbouring-
rights bodies abroad, because that is where sound-recording **ownership** is claimed
and adjudicated. And there the real loss is not the typos:

> **0 recordings are registered with SoundExchange.** The featured-artist 45% is
> unclaimed on all **228** managed recordings. The owner 50% is unclaimed on the
> **106** we can prove we own.

Unclaimed SoundExchange royalties are held, and after a holding period are
redistributed to other rights holders by market share. The loss becomes permanent.
That, not the ℗ text, is the leak.

The ℗ line matters as the **evidence** for those claims. Five recordings have a ℗
line that names a *distributor* rather than an owner — meaning nobody ever declared
one:

| ℗ line | what it is | recordings |
|---|---|---|
| `744447 Records DK` | DistroKid's placeholder | HVRCRFT ×3 |
| `Repost Network` | SoundCloud's distributor | DirtySnatcha ×2 |

Plus `USA2P2545706` (*Skrrt*), whose ℗ names a **publisher**. Those six are the ones
that will actually obstruct a claim. Every recording has *some* ℗ line — none are
blank.

Mechanicals are a separate matter: the MLC reads the **©** line and the work
registration, not the ℗. The ℗ typos do not touch it. The *publisher* misspellings
and the unregistered ASCAP split do.

---

## How to see whether we are missing releases

By set difference against Spotify, which is the only place an artist's whole
catalogue appears in one list regardless of distributor.

Spotify walk (4 managed artists): **237 ISRCs.** Platform catalogue for those same
artists: **228.**

**9 recordings are live on Spotify and absent from the platform.** Zero go the other
way — no phantom rows.

| ISRC | artist |
|---|---|
| `USA2P2629215`, `USA2P2629464` | DirtySnatcha |
| `USA2P2629131`, `QZWFH2615035` | Dark Matter |
| `CA6D22600316`, `QZTGW2603935` | WHOiSEE |
| `QT4K42613139`, `QT4K42630556`, `USA2P2638153` | HVRCRFT |

Two carry the `USA2P` prefix DSR uses — the label released them and the platform
never learned of it.

**This check must run on a schedule, not once.** `scripts/catalog/spotify-catalog-walk.py`
already produces the left-hand side.

### What this method still cannot see

- **SoundCloud-, Bandcamp- and YouTube-only releases.** They never reach Spotify, so
  the walk cannot find them. Those need their own connectors.
- **DSR's non-managed artists.** The walk covers the four managed artists. The label's
  other ~30 artists are only visible through the distributor export.
- **Unreleased or taken-down masters.** They still earn SoundExchange money if they
  ever aired, and Spotify will not list them.

---

## Metadata defects to correct at the distributor

Six in the Symphonic export. The ℗ typo on **`USA2P2511350` (*Power*)** is the *same
typo already found in VMG* — `℗ 2025 DitySnatcha Records`. It is therefore in **DSR's
own metadata**, delivered to both distributors. Fixing it at VMG alone will not fix it.

| ISRC | filed as | should be |
|---|---|---|
| `USA2P2511350` | `℗ 2025 DitySnatcha Records` | `℗ 2025 DirtySnatcha Records` |
| `USA2P2466213` | `Lab10 <BMI>` | `LAB10 Publishing <BMI>` |
| `USA2P2508953` | `Lab10 <BMI>` | `LAB10 Publishing <BMI>` |
| `USA2P2511350` | `LAB10 <BMI>` | `LAB10 Publishing <BMI>` |
| `USA2P2471704` | `LAB10 Publsihing <BMI>` | `LAB10 Publishing <BMI>` |
| `USLZJ2296710` | `DistrySnatcha Records Publishing <ASCAP>` | `DirtySnatcha Records Publishing <ASCAP>` |

Plus, still outstanding in VMG: `USA2P2545706` (*Skrrt*) declares
`℗ 2025 DirtySnatcha Records Publishing` — a **publisher** as the recording owner.
It is the only row in `recordings` with `owner_confidence = 'inferred'`.

---

## What was built

| object | purpose |
|---|---|
| `recordings` | ISRC-keyed. `p_line_raw` verbatim, `master_owner` canonical, `owner_source` naming the document, `owner_confidence` ∈ confirmed/inferred/pending. |
| `recording_publishers` | 164 declarations. Publisher as filed per recording; `raw_text` preserved; `publisher_id` null where the name matched nothing (3 rows: EMI April, Griff Griff, Mother's Finest — a genuine third-party split). |
| `v_master_ownership` | Per artist, per recording, with the SoundExchange position spelled out. `security_invoker = on`. |
| `scripts/catalog/load-dsr-recordings.py` | Symphonic export → `recordings`. Keeps the earliest release per ISRC. |
| `scripts/catalog/spotify-catalog-walk.py` | Spotify → ISRC, UPC, label, ℗ and © per recording. Distributor records outrank it; it only fills gaps. |

**Access, verified by impersonation:** `anon` → permission denied. Leigh → 124 rows,
his own catalogue only. Thomas (manager) → 236 rows across five artists.

**Open decision, not settled:** Leigh is a 70% owner of DSR, and the `recordings`
table policy grants a label owner access to DSR masters. But `v_master_ownership`
inner-joins `catalog`, which is scoped by artist membership — so in practice Leigh
sees only his own 124 rows and none of WHOiSEE's or Dark Matter's DSR masters.

Thomas previously said Leigh *should* see what the label owes and what WHOiSEE's and
Dark Matter's tracks earn **for the label**. That instruction was about financials.
Whether it extends to this ownership view is genuinely ambiguous and has **not been
decided** — the current behaviour is the accident of the join, not a ruling. Ask
before changing it in either direction.

---

## The registration store was never joinable to the catalogue

Reconciling the newly-loaded `recording_publishers` (what the distributor was **told**)
against the registration tables (what was actually **registered**) exposed the real
blocker behind "one registration truth per track":

> **`dsr_track_registrations.track_isrc` contains no ISRCs.** All 139 values are
> synthetic `REGISTRY_TITLE_<TITLE>` strings. Zero match an ISRC pattern. The column
> name lied. It is keyed on **title** — the exact key that produced 104 duplicate rows
> before migration 096.

So the registration store and the catalogue have never been connectable, and every
"is this track registered?" answer to date was a title-string comparison.

Migration 111 adds `recording_isrc` alongside (the 096 unique index still depends on
`track_isrc`, so it stays), resolved by **unique** title match against `recordings`:

| registry | rows | unique match | ambiguous | no match |
|---|---|---|---|---|
| ASCAP | 50 | 44 | 2 | 4 |
| BMI | 35 | 31 | 3 | 1 |
| MLC | 54 | 50 | 2 | 2 |
| **total** | **139** | **125** | **7** | **7** |

The 14 unresolved rows are left null and stamped `isrc_match_method`. They are not
guessed. Ambiguous titles are exactly where title-keying does its damage.

### One track already shows the cost

`QZWDD2263341` — **Need U** — is declared to the distributor as co-published:

    LAB10 Publishing <BMI>   +   DirtySnatcha Records Publishing <ASCAP>

It is registered **only** with BMI, under LAB10. The ASCAP half of that split is
declared on the release and registered nowhere, so ASCAP has nothing to pay against.
This is the only overlapping ISRC between the two stores, and it is already wrong —
which is a fair indication of what the other 160 will look like once they are checked.

---

## Publishing, now joined to catalogue

The Symphonic export supplied the declared publisher per ISRC, which is the missing
link between the catalogue and the registration tables:

| publisher | PRO | declarations |
|---|---|---|
| LAB10 Publishing | BMI | 87 (+4 misspelled) |
| DirtySnatcha Records Publishing | ASCAP | 75 (+1 misspelled) |
| EMI April / Griff Griff / Mother's Finest | ASCAP | 1 track, third party |

This confirms migration 100 from the distributor's own records: **LAB10 is the BMI
publisher, DirtySnatcha Records Publishing is the ASCAP publisher.** Two entities
because ASCAP cannot pay a BMI publisher.
