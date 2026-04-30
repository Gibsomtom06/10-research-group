# File Consolidation Pattern (DAD seed corpus)

**Purpose:** the standard process for consolidating scattered files into clean canonical folders. Captured 2026-04-30 from the manual run on `MANAGEMENT-TENx10/labels/DirtySnatcha Records/publishing/` (15 files → 10 active + 8 archived). This is the algorithm DAD encodes when it ships.

**Why differentiation matters:** competitors (Songtrust, Songspace, Distrokid SongStore) sell registration-as-a-service for 15-30% of royalties. Your differentiator: do this work autonomously via DAD, charge SaaS pricing, keep all royalties. The pattern below is the SaaS product's core algorithm.

---

## The 6-step pattern

### Step 1 — Inventory + structural read

Open each file briefly. Don't deep-read. Capture:
- File type (xlsx / csv / md / pdf / docx / image)
- For xlsx: sheet names + row counts + first-row headers per sheet
- For csv: row count + column count + first-row headers
- For md: first H1 + length
- File size + last-modified date

Output: per-file structural manifest.

### Step 2 — Group by SCHEMA (not by topic)

Two files with the same column schema are MERGE candidates. Two files with different schemas are NOT (even if they're about the same topic — e.g., MLC and CMRRA both register music but have totally different column layouts).

In the publishing example:
- 5 files had the MLC 20-column bulk-submission schema → mergeable
- 1 file had the CMRRA 13-column schema → standalone
- 1 file had the SoundExchange 6-column schema → standalone
- 3 markdown files → topic-different, leave separate

**Heuristic:** group by exact schema fingerprint (column count + first 3 column names normalized). Files in the same fingerprint bucket are merge candidates.

### Step 3 — Group MERGE candidates by ENTITY

Within a same-schema bucket, look at WHO the data belongs to. Different entities should NOT merge — they have different submission accounts, different IPIs, different MLC member IDs.

In the publishing example, the 5 MLC files broke into 2 entity buckets:
- DirtySnatcha (artist) + LAB10 Publishing (Leigh's personal pub co) → workbook 1
- DSR Records (label) + DSR Label Artists (signed roster) → workbook 2

**Heuristic:** entity = the legal/business entity that submits to the receiving registry. Look for explicit IDs (MLC Member ID, IPI number, ASCAP/BMI Member ID, EIN). When in doubt, a human (Thomas) decides the boundary.

### Step 4 — Build per-entity workbook

For each entity bucket, produce ONE xlsx workbook:
- Sheet 0: `README` (auto-generated — entity name, sheet list with row counts, source file references, submission process notes, known gaps)
- One sheet per source file: name should be schema-purpose, NOT the source filename
- Each sheet retains the FULL source data (no transformation; just CSV → XLSX sheet)

**Why xlsx not multi-CSV:** xlsx supports per-sheet metadata, the README sheet for context, and clean export-to-CSV when submission time comes.

### Step 5 — Archive originals

NEVER delete (per "older might be working" rule). Move source files to `_archive/<YYYY-MM-DD>-<context>/<original-folder>-old/`.

Maintain a `_MOVE_LOG_<context>_<date>.md` log capturing: source path → archive path, reason, supersession reference.

### Step 6 — Update / create glossary

Per-folder `<FOLDERNAME>_GLOSSARY.md` (or sometimes a top-level cross-folder glossary):
- "What this folder is FOR" (1 paragraph high-level)
- Active files table (canonical working set)
- Archived files table (with supersession references)
- Open work / gaps (cross-referenced to source memory entries)
- Last-updated stamp

The glossary IS the contract: future sessions read the glossary; they don't open each file.

---

## DAD encoding (when this becomes automated)

The 6 steps map to functions DAD will implement:

```python
def consolidate_folder(folder_path: Path) -> ConsolidationResult:
    manifest = inventory_files(folder_path)              # Step 1
    schema_groups = group_by_schema(manifest)             # Step 2
    for group in schema_groups:
        if len(group) <= 1:
            continue  # nothing to merge
        entity_buckets = group_by_entity(group)           # Step 3 (LLM call OK; needs domain context)
        for bucket in entity_buckets:
            workbook = build_entity_workbook(bucket)      # Step 4
            archive_sources(bucket, reason='merged')      # Step 5
            workbook.save()
    update_glossary(folder_path, manifest)                # Step 6
    return result
```

**LLM-required steps:** Step 3 (entity boundary detection — needs business-domain knowledge). All other steps are deterministic.

**Cost optimization:** Step 3 is the only LLM-billable step. Routes through model_router → most likely Haiku for clear-cut cases (different MLC Member IDs), Sonnet for ambiguity, Opus only when high-stakes (e.g., legal/tax filings).

---

## HARD RULES (added 2026-04-30 night per Thomas)

1. **CHECK EVERY SHEET BEFORE ARCHIVING.** Multi-sheet workbooks may have data on sheets you didn't sample. Open every sheet, count rows, sample 2-3, verify each is captured in the canonical destination. Only then archive the source.
2. **LIVE PROGRESS OUTPUT IS REQUIRED.** Every consolidation script must emit progress per file/sheet ("Scanning X (Y MB) on drive Z...", "Verified sheet 3/13: name (cols × rows) → mapped to table T"). Users need to SEE the work happening — silent processes feel broken.
3. **NEVER SAY "DONE" PREMATURELY.** Done means: every sheet checked, every row accounted for in the canonical, archived sources have a clear supersession reference, glossary is updated, commit landed. Anything less is "in progress."
4. **NEVER DELETE.** Always move to `_archive/<date>-<context>/`. Per "older might be working" rule.

These four rules + the 6-step pattern above make the algorithm safe to run autonomously by DAD.

---

## Failure modes to handle

1. **Two files claim to be the same entity but have different IDs** — surface to human, don't auto-merge.
2. **Source file fails to open** (corrupt, password-protected, weird encoding) — move to `_inbox/needs-review/` instead of merging or archiving.
3. **Schema looks identical but column ORDER differs** — re-order columns in the merged sheet to match a CANONICAL order; flag deviation in the README sheet.
4. **Glossary collision** (folder already has a glossary; new run wants to add) — APPEND a "2026-XX-XX update" section, don't overwrite.

---

## Reference run (publishing folder, 2026-04-30)

| Stage | Result |
|---|---|
| Files at start | 15 |
| Schema groups | 4 (MLC bulk · ISRC catalog · CMRRA · SoundExchange · markdown topic-different) |
| Entity buckets in MLC group | 2 (DirtySnatcha+LAB10, DSR+LabelArtists) |
| Workbooks built | 2 (`DirtySnatcha_MLC_Submissions.xlsx`, `DSR_Records_MLC_Submissions.xlsx`) |
| Files archived | 8 (5 source CSVs + 2 redundant ISRC + 1 subset xlsx) |
| Active files after | 10 (incl. glossary + 2 new workbooks) |
| Time spent (manual) | ~15 min |
| Time projected for DAD-automated | ~30 sec (mostly the LLM call for entity detection) |

This is the dogfood. Encode the pattern, charge SaaS for it.

---

*Pattern v1 — 2026-04-30. Update when DAD ships its first automated consolidation run; mark which steps proved unreliable.*
