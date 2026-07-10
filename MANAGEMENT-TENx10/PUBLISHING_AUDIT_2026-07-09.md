# LAB10 / DSR Publishing — data + process audit
**2026-07-09.** Verified against live Supabase `ocscxqaythiuidkwjuvg`, 82 works in
`publishing_registrations`, all written by Leigh Bray.

---

## 1. You set the structure up correctly

Thomas: *"I thought I needed an IPI for ASCAP and an IPI for BMI so we can register our
songs with the proper publishing depending if our artist is a writer with ASCAP, BMI or other."*

**That is exactly right.** It is how every real publisher operates.

- A writer affiliates with **one** PRO. Leigh Bray is **BMI**, IPI `01017500116`.
- A publisher must hold an entity affiliated with the **same PRO as the writer** in order to
  collect the publisher share. **ASCAP cannot pay a BMI publisher, and BMI cannot pay an ASCAP
  publisher.** There is no cross-payment.
- So a label signing writers from different PROs keeps one publishing entity **per PRO**, all
  owned by the same parent. Names must differ slightly between societies.

DSR owns both, correctly:

| entity | PRO | IPI | collects for |
|---|---|---|---|
| DirtySnatcha Records Publishing | ASCAP | 1238282844 | ASCAP writers (e.g. Dark Matter) |
| LAB10 Publishing | BMI | 1262829440 *(to confirm)* | BMI writers (Leigh Bray) |

Precedent: Broken Bow's Magic Mustang operates as *Magic Mustang Songs* (BMI), *This Is Hit*
(ASCAP) and *Legends of Magic Mustang* (SESAC) — one parent, three PRO buckets.

**The structure is sound. The data sitting inside it is not.**

---

## 2. Defect A — 74 of 82 works are assigned to the wrong publisher entity

Every one of the 82 works has a **BMI writer** (Leigh Bray). But:

| publisher on the work | PRO | IPI | works | valid? |
|---|---|---|---|---|
| DirtySnatcha Records Publishing | **ASCAP** | 1238282844 | **74** | **NO — PRO mismatch** |
| DirtySnatcha Records Publishing | BMI | 1262829440 | 7 | yes (but misnamed) |
| Wakaan Sskwan Musical Oddities | BMI | 1079032660 | 1 | yes (co-publisher) |

An ASCAP publishing entity **cannot collect the publisher share on a BMI writer's composition.**
For 74 works, the publisher share currently has no valid collection path. This is the single
biggest problem in the catalogue and it predates any registration.

Those 74 must be re-pointed to the BMI entity (LAB10 Publishing) before anything is filed.

**Note:** `scripts/publishing/generate-lab10-mlc-csv.ts` already overrides the ASCAP rows to the
BMI entity. **Its intent was correct.** The reason not to run it yet is item 3.

---

## 3. Defect B — the BMI publisher rows are misnamed, and the IPI is unconfirmed

The 7 correct-PRO rows are named `DirtySnatcha Records Publishing` but carry the **BMI** IPI
`1262829440`. Given Thomas's confirmation that LAB10 Publishing is the BMI entity, `1262829440`
is almost certainly **LAB10's** IPI recorded under the wrong name.

Almost certainly is not good enough to file with. And the evidence is thin:

- `MANAGEMENT-TENx10/LAB10_PILOT_TRACK_RUN.md` line 64 literally reads
  `Publisher: LAB10 Publishing / IPI: [fill in]` — **LAB10's IPI was never actually recorded.**
- Global memory lists LAB10's IPI as unknown.
- The only evidence for `1262829440` is those 7 rows and the CSV script that asserts it.

**ACTION (Thomas, 2 minutes):** log into BMI → Publisher profile. Confirm LAB10 Publishing's IPI.
If it is `1262829440`, everything downstream unlocks.

---

## 4. Defect C — 10 works carry a different writer IPI

| writer IPI | works | titles |
|---|---|---|
| `01017500116` | 72 | (canonical — matches the pilot doc and BMI) |
| `01017500119` | 8 | Alien Shit · Found Myself · Hold On · I'm a Savage · Keep Moving · Need U (Dobadly Remix) · Old School · SuperSonic VIP |
| `01017500117` | 1 | Cosmic Sounds |
| `01017500118` | 1 | Can You Feel |

The sequence 116 / 117 / 118 / 119 looks like a data-entry increment. **But do not assume.**
BMI assigns *a distinct IPI to each name/AKA a writer has on file*, so `…117/118/119` could be
legitimate AKA numbers. Against that: all three appear under the name "Leigh Anthony Bray", and
the canonical `…116` appears under **both** "Leigh Anthony Bray" and "Leigh Bray" — so the name
does not discriminate between them. That pattern favours typo, not AKA.

Filing a work under the wrong writer IPI means the royalty never matches the writer.

**ACTION (Thomas):** BMI → your writer profile → list your IPIs/AKAs. If only `01017500116`
exists, the other 10 rows are typos and I will correct them under a guard.

---

## 5. Defect D — co-writers exist but are not recorded anywhere

`publishing_registrations` holds **one composer per row**. Yet:

| composer_share | works | implies |
|---|---|---|
| 100.00 | 54 | Leigh sole writer — fine |
| 50.00 | 24 | **a co-writer exists, unnamed** |
| 33.34 | 3 | **two co-writers exist, unnamed** |
| 16.67 | 1 | **a five-way split, all unnamed** |

**28 works have missing co-writers.** A work filed at 50% writer share with no second writer
named will either be rejected or will leave the other 50% unclaimed. The same limitation means
the Wakaan co-publishing split cannot be expressed — the row can hold Wakaan *or* LAB10, not both.

This is the recording/work modelling gap described in
`products/tenx10-platform/docs/CATALOG_PUBLISHING_PIPELINE.md`. It blocks the 28 split works, not
the 54 sole-writer ones.

---

## 6. The registration process, triple-checked

**Order matters, and two of these are independent of each other.**

| # | registry | scope | depends on | status |
|---|---|---|---|---|
| 1 | **SoundExchange** | **RECORDING** (ISRC) | nothing | **0 registered — start here** |
| 2 | BMI | composition (work) | correct writer + publisher IPIs | 82 works registered |
| 3 | MLC | composition — mechanicals | writer/publisher IPIs + shares | **0 registered** |
| 4 | CMRRA | composition — Canada mechanicals | as MLC | accounts **not activated** |

**SoundExchange is the fast money and it is blocked by none of the above.** It pays the *featured
artist* and the *sound-recording owner* (DSR, the label) on the master — the ISRC — not the
composition. Nothing about the ASCAP/BMI publisher mess touches it. All 124 of Leigh's released
recordings have an ISRC. **Do this first, in parallel with fixing the publishing data.**

Then: fix defects A–C → re-file / correct at BMI → MLC bulk register → CMRRA.

**MLC readiness right now:** 79 of 82 works carry an ISRC (migration 097 raised this from 65).
Three still have none — `5 0`, `Losing Myself`, `SuperSonic VIP` — because they have no matching
catalog recording.

**Correction to earlier advice:** a subagent reported CMRRA accounts `02274554 / 02274555` as
"already active". They are not. `AUTONOMOUS_QUEUE.md`, `MANAGEMENT-TENx10/BRAIN.md` and
`LAB10_PILOT_TRACK_RUN.md` all say *pending activation*.

---

## 6b. RESOLVED — defects A, B and C are fixed (migration 100)

Thomas confirmed from his BMI account, 2026-07-09:

| | |
|---|---|
| **LAB10 Publishing** | IPI **01262829440**, BMI |
| **Bray, Leigh** | IPI **01017500116**, BMI — his only writer IPI |

Migration 100 re-pointed 81 works to LAB10 Publishing (BMI), corrected the 10
writer-IPI typos, and normalised the publisher IPI to BMI's 11-digit leading-zero
form. Verified: **0 writer/publisher PRO mismatches, down from 74.** The Wakaan
co-published work is untouched.

Defect D (28 works with unnamed co-writers) remains open.

---

## 6c. NEW — VMG metadata has eleven spellings of LAB10, and four are on the wrong PRO

Thomas suspected he had registered some works as "LAB 10 Publishing" with a space.
**There is no space variant anywhere in VMG.** But `vmg_product_catalog` carries
eleven different publisher strings, and this is the metadata the distributor feeds
to the DSPs and societies:

| VMG string | tracks | problem |
|---|---|---|
| `LAB10 Publishing <BMI>` | 101 | canonical |
| `Lab10 Publishing <BMI>` | 4 | case |
| **`LAB10 Publishing <ASCAP>`** | **4** | **wrong PRO — LAB10 is BMI** |
| `LAB10 <BMI>` | 2 | missing "Publishing" |
| `Lab10 <BMI>` | 1 | case + missing word |
| `LAB10 PUblishing <BMI>` | 1 | typo |
| `LAB10 Publsihing <BMI>` | 1 | misspelled |
| `LAB10 PUBLISHING <BMI>` | 1 | all caps |

The four on the **wrong PRO** are the ones that matter — they tell every downstream
society that LAB10 is an ASCAP entity:

- Back 2 Life — `USA2P2536661`
- Bad Business — `USA2P2602397`
- Tatters — `USA2P2602398`
- Wilde Ride — `USA2P2602396`

Spelling variants to correct at VMG:

- `Lab10 Publishing <BMI>` — Break It `QZ5FN2082238`, Let Go `USLZJ2405592`,
  Loose It `GBRKQ2109631`, Telekinese `USLZJ2292920`
- `LAB10 <BMI>` — Bored `USA2P2508953`, Power `USA2P2511350`
- `Lab10 <BMI>` — Wait For Me `USA2P2466213`
- `LAB10 PUblishing <BMI>` — Groupies `USA2P2456452`
- `LAB10 Publsihing <BMI>` — Lights Out `USA2P2471704` *(sic)*
- `LAB10 PUBLISHING <BMI>` — Wompem `USLZJ2318255`

Legitimate multi-publisher strings, leave alone: `DirtySnatcha Records Publishing
<ASCAP>, LAB10 Publishing <BMI>` (Hip Swing, What If?) and `Create Digital Music
<BMI>, LAB10 Publishing <BMI>` (Supersonic) — those are co-writes where each
writer's publisher sits at their own PRO. That is the system working correctly.

**This must be fixed in VMG's portal.** It is the distributor's metadata; nothing
in Supabase changes it.

---

## 7. What happens next, in order

1. **Thomas, BMI portal, ~5 minutes:** confirm (a) LAB10 Publishing's IPI, (b) whether Leigh has
   AKA IPIs beyond `01017500116`.
2. **Claude, once confirmed:** migration to re-point 74 works to the BMI publisher entity, rename
   the 7 misnamed rows, and correct the 10 writer IPIs — each under a reconciliation guard.
3. **Claude, in parallel, needs nothing from step 1:** build the SoundExchange recording export
   for Leigh's 124 released ISRCs + DSR as rights owner.
4. Then the MLC bulk CSV for the 54 sole-writer works. The 28 split works wait on co-writer data.
5. CMRRA after the US flow is proven.

**Do not run `generate-lab10-mlc-csv.ts` until step 1 is done.** Its logic is right; its IPI is
unverified, and a wrong publisher IPI misroutes mechanicals to an entity that cannot receive them.

---

## Sources for the process claims

- ASCAP cannot pay a BMI publisher and vice versa; publishers keep a separate entity per PRO:
  [Songtrust](https://help.songtrust.com/knowledge/can-i-use-the-same-entity/llc-to-setup-myself-up-as-a-publisher-with-both-ascap-bmi),
  [Elizabeth Alexander](https://www.elizabethalexander.com/how-to-register-new-works-whose-entitled-parties-belong-to-different-performing-rights-organizations-pros/)
- Entity names must differ slightly between societies; multi-PRO precedent (Magic Mustang):
  [MusicLibraryReport](https://musiclibraryreport.com/forums/topic/publishers-with-both-ascap-and-bmi/)
- BMI assigns a unique IPI per name/AKA on file:
  [BMI FAQ](https://www.bmi.com/faq/entry/what_is_an_ipi_cae_number)
