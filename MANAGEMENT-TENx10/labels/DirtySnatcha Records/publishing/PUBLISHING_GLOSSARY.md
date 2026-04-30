# DSR Publishing Folder — Glossary

**What this is:** explains every file in this folder so future-you (and future Claude sessions) don't have to open each one.

**Last updated:** 2026-04-30 (post-MLC consolidation: 15 files → 10 active + 8 archived)

---

## Active files (10) — current canonical working set

### Catalog (1 file)

| File | Use it for |
|---|---|
| `FinalCatalog_decoded.csv` | **Canonical full catalog.** 141 rows × 32 cols. Source of truth for ISRC/UPC/track/writer-share lookups. |

### MRI / MLC writer registration (1 master xlsx)

| File | Use it for |
|---|---|
| `DS-DSR ARTIST PUBLISHING.xlsx` | **Master working workbook.** 7 sheets: DirtySnatcha Catalog, DSR Catalog, Field Definitions, Artists, Composer Roles, TIS Codes, Examples. Update this as catalog grows. |

### MLC submissions (2 entity-split workbooks — newly consolidated 2026-04-30)

| File | Sheets | Use it for |
|---|---|---|
| `DirtySnatcha_MLC_Submissions.xlsx` | README · MLC_Bulk_DS_Writer (81) · LAB10_Pub_Full (156) | DirtySnatcha (artist) + LAB10 Publishing (Leigh's writer-side) submissions to The MLC. **LAB10_Pub_Full is the data for the 0-of-82-tracks gap.** |
| `DSR_Records_MLC_Submissions.xlsx` | README · DSR_Publishing (74) · DSR_Label_Artists (79) | DSR Records (label) + label artists submissions to The MLC |

**Submission process:** export the relevant SHEET to CSV → upload to MLC bulk portal.

### Other registries (2 standalone CSVs — different schemas, can't merge)

| File | Submitted to | Why standalone |
|---|---|---|
| `DirtySnatcha_CMRRA_Registration_2026-04-25.csv` | CMRRA (Canada) | Different 13-col schema vs MLC's 20-col |
| `SoundExchange_DSR_RightsOwner_Prep_2026-04-25.csv` | SoundExchange (US digital perf) | 6-col schema; different entity (rights owner not writer) |

### Documentation guides (3 markdown — topic-specific, intentionally separate)

| File | What it covers |
|---|---|
| `COVER_SONGS_GUIDE_2026-04-25.md` | Cover song registration (mechanical license, statutory rate) |
| `EXTERNAL_LABEL_GAP_ANALYSIS_2026-04-25.md` | Audit of where DSR has external-label registration gaps |
| `PRO_REGISTRATION_GUIDE_DSR_ARTISTS_2026-04-25.md` | BMI/ASCAP onboarding for DSR artists |

### This file
- `PUBLISHING_GLOSSARY.md` — the index you're reading right now

---

## Archived files (8) — at `_archive/desktop-cleanup-2026-04-30/publishing-old/`

NEVER deleted (per Thomas's "older might be working" rule). Preserved as snapshots; superseded by canonical above.

| File | Superseded by |
|---|---|
| `DirtySnatcha_MLC_Bulk_2026-04-25.csv` | DirtySnatcha_MLC_Submissions.xlsx → MLC_Bulk_DS_Writer sheet |
| `MLC_LAB10_Full_2026-04-25.csv` | DirtySnatcha_MLC_Submissions.xlsx → LAB10_Pub_Full sheet |
| `MLC_LAB10_Publishing_2026-04-25.csv` | 7-row subset; superseded by LAB10_Pub_Full sheet |
| `MLC_DSR_Publishing_2026-04-25.csv` | DSR_Records_MLC_Submissions.xlsx → DSR_Publishing sheet |
| `MLC_DSR_Publishing_LabelArtists_2026-04-25.csv` | DSR_Records_MLC_Submissions.xlsx → DSR_Label_Artists sheet |
| `2024-04-23 ISRC Soundexchange.xlsx` | FinalCatalog_decoded.csv (157 rows in old file vs 141 in new — old has more entries but fewer columns; new is more recent canonical) |
| `dirtysnatcha isrc search.xlsx` | Same as above — duplicate snapshot |
| `DSR ARTIST PUBLISHING.xlsx` | DS-DSR ARTIST PUBLISHING.xlsx (which has more rows + more reference sheets) |

---

## Open work (per portfolio status memory)

| Gap | Source data | Status |
|---|---|---|
| 0 of 82 LAB10 tracks registered with MLC | `DirtySnatcha_MLC_Submissions.xlsx` → `LAB10_Pub_Full` sheet | Submission-ready |
| WHOiSEE BMI IPI not in DB | needs add to `DS-DSR ARTIST PUBLISHING.xlsx` Artists sheet | Manual entry needed |
| Dark Matter ASCAP IPI unknown | needs lookup + add | Lookup pending |
| SoundExchange DSR + Leigh Bray not registered | `SoundExchange_DSR_RightsOwner_Prep_2026-04-25.csv` | Submission-ready |
| CMRRA accounts (02274554 / 02274555) not activated | `DirtySnatcha_CMRRA_Registration_2026-04-25.csv` | Activate accounts first |

---

## What this folder is FOR (high-level)

DSR has 5 publishing surfaces that all need data:

1. **MLC** (US streaming mechanical) — covered by 2 entity-workbooks above
2. **CMRRA** (Canada mechanical) — DirtySnatcha-only
3. **SoundExchange** (US digital perf) — DSR rights owner side
4. **PROs** (BMI / ASCAP) — per-artist; covered in PRO guide
5. **International** (PRS, GEMA, SACEM, etc.) — covered in gap analysis

---

*Glossary v2 — 2026-04-30 (post-consolidation). Update when files land/leave.*
