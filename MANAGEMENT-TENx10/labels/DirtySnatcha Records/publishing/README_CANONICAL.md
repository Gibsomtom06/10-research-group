# DSR Publishing — Canonical Source of Truth

**Last enforced:** 2026-04-30

**Read this BEFORE editing any publishing file in this folder. Read this BEFORE pointing a dashboard or another Claude session at "publishing data."**

---

## THE RULE

**One canonical source per data category. No competing versions. Older snapshots go to `_archive/`.**

This is the consolidation rule the entire publishing folder runs on. Violating it creates the confusion we just spent hours unwinding.

---

## What is canonical (and what is NOT)

### ✅ CANONICAL — source of truth for ALL DSR publishing data

**`../DSR_CLEAN_DATABASE.xlsx`** (one level up, at the DSR root) is the normalized, 14-table database. **All publishing facts originate here.** Tables relevant to publishing:
- `tracks` — one row per ISRC (53 tracks)
- `track_writers` — composer splits (122 rows)
- `track_publishers` — publisher splits
- `track_registrations` — per-registry submission status (241 rows: BMI / ASCAP / MLC / SoundExchange / CMRRA / PRS / etc.)
- `artists` — one row per artist (27 rows)

If a question is "what's the data?" — the answer is in `DSR_CLEAN_DATABASE.xlsx`. Period.

### 🔄 DERIVED — for MLC portal upload only, generated FROM the canonical

These two workbooks exist because MLC's bulk upload portal expects a specific format. They are derived views — never edit them by hand; regenerate from `DSR_CLEAN_DATABASE.xlsx` when the source changes:

- `DirtySnatcha_MLC_Submissions.xlsx` — DS Writer (82 rows) + LAB10 Pub Full (157 rows)
- `DSR_Records_MLC_Submissions.xlsx` — DSR Publishing (75 rows) + DSR Label Artists (80 rows)

### 🌍 OTHER REGISTRIES — different schemas, kept standalone

These can't merge into MLC format. They're standalone canonical for their own registry:

- `DirtySnatcha_CMRRA_Registration_2026-04-25.csv` — CMRRA (Canada mechanical, 13-col schema)
- `SoundExchange_DSR_RightsOwner_Prep_2026-04-25.csv` — SoundExchange (US digital perf, 6-col schema, rights-owner side)
- `FinalCatalog_decoded.csv` — full catalog snapshot (141 rows × 32 cols) — preserved for reference

### 📚 DOCS / GUIDES

- `PUBLISHING_GLOSSARY.md` — the per-file index
- `PRO_REGISTRATION_GUIDE_DSR_ARTISTS_2026-04-25.md` — BMI/ASCAP onboarding
- `EXTERNAL_LABEL_GAP_ANALYSIS_2026-04-25.md` — track-by-track external-label audit
- `COVER_SONGS_GUIDE_2026-04-25.md` — cover song registration logic
- This file (`README_CANONICAL.md`) — the canonical map

---

## ❌ NOT canonical — stop pointing at these

The following files are SUPERSEDED. If a Claude session, dashboard, or doc references one of them as truth, that reference is wrong:

| Stale source | Why it's stale | Where the truth is now |
|---|---|---|
| **God Sheet** (the 13-sheet Google Sheet on DSR Drive) | Pre-consolidation source. Schema-mapped to `DSR_CLEAN_DATABASE.xlsx`. | `DSR_CLEAN_DATABASE.xlsx` — see `GODSHEET_SCHEMA_MAP_FULL.md` for the migration map |
| `DS-DSR ARTIST PUBLISHING.xlsx` (in this folder, now archived) | Working workbook with overlapping data — DS Catalog (74) ≈ DSR_Publishing sheet, DSR Catalog (81) ≈ MLC_Bulk_DS_Writer sheet. Same data, two homes. Violates consolidation rule. | `DSR_CLEAN_DATABASE.xlsx` for source data; `*_MLC_Submissions.xlsx` for derived MLC views |
| `MLCBulkWork_V1.1.xlsx` (was on `L:\My Drive\`, now archived) | Pre-consolidation MLC bulk file. Tom flagged it as supposed-to-be-removed earlier this session. | Same as above |
| Any 2026-04-25 dated MLC CSV (in `_archive/desktop-cleanup-2026-04-30/publishing-old/`) | Pre-consolidation snapshots from before the entity-split workbooks were built | The 2 `*_MLC_Submissions.xlsx` files (canonical derived views) |

---

## How to use this for the TENx10 platform `/dashboard/label`

The label dashboard reads from Supabase tables. Those tables are populated by migration `021_dsr_clean_database.sql` (pending) which IS the migration of `DSR_CLEAN_DATABASE.xlsx`. So:

- Dashboard tracks → Supabase `tracks` ← `DSR_CLEAN_DATABASE.xlsx` `tracks` sheet (53 ISRCs)
- Dashboard registrations → Supabase `track_registrations` ← `DSR_CLEAN_DATABASE.xlsx` `track_registrations` sheet (241 rows)
- Gap report → derived from `track_registrations` JOIN `tracks` (one row per track × per registry × per status)

**If a future Claude says "the most relevant publishing source is the God Sheet" — that Claude is wrong. Point them to this README.**

---

## Adding new data

1. Edit `DSR_CLEAN_DATABASE.xlsx` (the canonical) — never edit derived workbooks
2. Regenerate the MLC submission workbooks from the updated canonical (script TBD)
3. Apply the regenerated workbooks to the MLC portal upload
4. Commit changes (when umbrella git lock is fixed) with a clear message: "DSR_CLEAN_DATABASE: <change description>"

---

*README_CANONICAL.md v1 — 2026-04-30. The consolidation rule is binding. If you're confused about source-of-truth, this file is the answer.*
