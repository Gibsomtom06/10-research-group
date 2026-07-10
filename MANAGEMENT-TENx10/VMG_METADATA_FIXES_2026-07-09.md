# VMG metadata fix list — DirtySnatcha Records & LAB10 Publishing
**2026-07-09.** Every defect below is in **VMG's portal**, not in Supabase.
`vmg_product_catalog` is a *mirror* of what VMG holds. Do not "fix" the mirror —
if you do, you lose the ability to tell whether VMG was actually corrected, and
the next ingest overwrites it anyway.

Re-run `scripts/publishing/vmg-metadata-audit.sql` after fixing. **It returns zero
rows when VMG is clean.**

---

## The three names, and where each belongs

| entity | what it is | correct string |
|---|---|---|
| **DirtySnatcha** | the ARTIST — Leigh Bray, a person | (artist fields only) |
| **DirtySnatcha Records** | the LABEL — a company | `DirtySnatcha Records` |
| **DirtySnatcha Records Publishing** | the ASCAP publishing entity | `DirtySnatcha Records Publishing <ASCAP>` |
| **LAB10 Publishing** | the BMI publishing entity | `LAB10 Publishing <BMI>` |

- **℗ line** = who owns the **sound recording**. That is the **label**.
  A publishing company can never appear here.
- **© line** = who owns the **composition**. VMG's convention on this catalogue is
  the label name; keep it consistent with what is already there.
- **Publishers field** = the publishing entity, with its PRO in angle brackets.

---

## 1. ℗ lines — 5 defects (recording owner)

Most of these are DSR label releases by other artists. **Do not assume a track on
DirtySnatcha Records is a DirtySnatcha track** — the label signs many artists.
Skrrt, for instance, is by **Kotrax + DARK MATTER** (writers: Dakota
Tonnessen-Visaggio, Joseph Kalina, Isaac Tullos). Leigh Bray is not on it.

| track | ISRC | field | currently | should be |
|---|---|---|---|---|
| **Skrrt** (Kotrax + DARK MATTER) | `USA2P2545706` | track_p_line | `℗ 2025 DirtySnatcha Records Publishing` | `℗ 2025 DirtySnatcha Records` |
| Power | `USA2P2511350` | track_p_line | `℗ 2025 DitySnatcha Records` | `℗ 2025 DirtySnatcha Records` |
| Theme Music | `USA2P2545712` | track_p_line | `℗ 2025 DirtySnatcha Recrds` | `℗ 2025 DirtySnatcha Records` |
| Get Moving | `USA2P2538177` | track_p_line | `℗ 2025 DirtySnatcha␣␣Records` *(double space)* | `℗ 2025 DirtySnatcha Records` |
| Everybody | `USA2P2546848` | product_p_line | `℗ 2025 DitySnatcha Records` | `℗ 2025 DirtySnatcha Records` |
| Sound Boiz | `USA2P2505076` | product_p_line | `℗ 2025 Dirtysnatcha Records` *(lowercase s)* | `℗ 2025 DirtySnatcha Records` |

**Skrrt is the serious one.** Its ℗ line names your *publishing* company as the
owner of the master. A publisher cannot own a sound recording. This is the public
declaration SoundExchange and the DSPs read.

---

## 2. © lines — 6 defects (composition owner)

| track | ISRC | field | currently | should be |
|---|---|---|---|---|
| Bring The Pain | `USA2P2528433` | product_c_line | `© 2025 DirtySnatcha␣␣Records` | `© 2025 DirtySnatcha Records` |
| Kong | `USA2P2528435` | product_c_line | `© 2025 DirtySnatcha␣␣Records` | `© 2025 DirtySnatcha Records` |
| Nasty | `USA2P2528434` | product_c_line | `© 2025 DirtySnatcha␣␣Records` | `© 2025 DirtySnatcha Records` |
| Power | `USA2P2511350` | product_c_line | `© 2025 DirtySnatcha␣␣Records` | `© 2025 DirtySnatcha Records` |
| Watagwan | `USA2P2523431` | product_c_line | `© 2025 DirtySnatcha␣␣Records` | `© 2025 DirtySnatcha Records` |
| Freaky | `USA2P2524931` | product_c_line | `© 2025 DitySnatcha Records` | `© 2025 DirtySnatcha Records` |
| if u want to cry | `USA2P2624500` | product_c_line | `© 2026 DirtySnatha Records` *(no `c`)* | `© 2026 DirtySnatcha Records` |
| Keep Movin' | `USA2P2624498` | product_c_line | `© 2026 DirtySnatha Records` | `© 2026 DirtySnatcha Records` |
| Lean N' Rock | `USA2P2624499` | product_c_line | `© 2026 DirtySnatha Records` | `© 2026 DirtySnatcha Records` |
| WTF Is Trench | `USA2P2536597` | track_c_line | `© 2025 DirtySnatcha Reccords` *(double c)* | `© 2025 DirtySnatcha Records` |
| Money Right | `USA2P2508980` | track_c_line | `© 2025 Dirtysnatcha Records` | `© 2025 DirtySnatcha Records` |

---

## 3. Publishers field — LAB10 Publishing

**There is no "LAB 10" with a space anywhere.** But there are eight variants.

### Wrong PRO — the four that matter most
LAB10 Publishing is **BMI**. These four declare it ASCAP, which tells every
downstream society the entity sits at the wrong PRO:

| track | ISRC | currently | should be |
|---|---|---|---|
| Back 2 Life | `USA2P2536661` | `LAB10 Publishing <ASCAP>` | `LAB10 Publishing <BMI>` |
| Bad Business | `USA2P2602397` | `LAB10 Publishing <ASCAP>` | `LAB10 Publishing <BMI>` |
| Tatters | `USA2P2602398` | `LAB10 Publishing <ASCAP>` | `LAB10 Publishing <BMI>` |
| Wilde Ride | `USA2P2602396` | `LAB10 Publishing <ASCAP>` | `LAB10 Publishing <BMI>` |

### Spelling and case
| currently | tracks | should be |
|---|---|---|
| `Lab10 Publishing <BMI>` | Break It `QZ5FN2082238`, Let Go `USLZJ2405592`, Loose It `GBRKQ2109631`, Telekinese `USLZJ2292920` | `LAB10 Publishing <BMI>` |
| `LAB10 <BMI>` | Bored `USA2P2508953`, Power `USA2P2511350` | `LAB10 Publishing <BMI>` |
| `Lab10 <BMI>` | Wait For Me `USA2P2466213` | `LAB10 Publishing <BMI>` |
| `LAB10 PUblishing <BMI>` | Groupies `USA2P2456452` | `LAB10 Publishing <BMI>` |
| `LAB10 Publsihing <BMI>` | Lights Out `USA2P2471704` | `LAB10 Publishing <BMI>` |
| `LAB10 PUBLISHING <BMI>` | Wompem `USLZJ2318255` | `LAB10 Publishing <BMI>` |

---

## 4. Publishers field — DirtySnatcha Records Publishing

| currently | track | should be |
|---|---|---|
| `Dirtysnatcha Records Publishing <ASCAP>` | Assertion `QZWDD2238845` | `DirtySnatcha Records Publishing <ASCAP>` |
| `DIRTYSNATCHA RECORDS PUBLISHING <ASCAP>` | Groupies `USA2P2456452` | `DirtySnatcha Records Publishing <ASCAP>` |
| `DistrySnatcha Records Publishing <ASCAP>` | Terror `USLZJ2296710` | `DirtySnatcha Records Publishing <ASCAP>` |

Note **Groupies** `USA2P2456452` appears in both §3 and §4 — both its publisher
strings are malformed.

---

## 5. Leave these alone — they are correct

Multi-publisher strings on co-writes, where each writer's publisher sits at that
writer's own PRO. This is the system working exactly as designed:

- `DirtySnatcha Records Publishing <ASCAP>, LAB10 Publishing <BMI>` — Hip Swing, What If?
- `LAB10 Publishing <BMI>, DirtySnatcha Records Publishing <ASCAP>` — Need U
- `Create Digital Music <BMI>, LAB10 Publishing <BMI>` — Supersonic

---

## Totals

Verified against the live mirror, 2026-07-09:

| area | unique defects | tracks |
|---|---|---|
| ℗ lines | 6 | 6 |
| © lines | 11 | 11 |
| LAB10 publisher string | 14 | 14 |
| DirtySnatcha Records Publishing string | 3 | 3 |
| **total** | **34** | **31 distinct tracks** |

The LAB10 figure is 14, not 10: the four wrong-PRO rows (`<ASCAP>`) are defects in
their own right, on top of the ten spelling/case variants.

The audit query returns **36 raw rows** for these 34 defects, because
`vmg_product_catalog` holds two rows for a few ISRCs (e.g. Get Moving). That is a
mirror artefact, not two separate defects.
