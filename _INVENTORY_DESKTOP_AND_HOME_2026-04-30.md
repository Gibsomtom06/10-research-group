# Desktop & Home File Inventory — April 30, 2026

**Purpose:** Stage 1 dogfood for DAD file routing automation. Manual cataloging that feeds into automated system rules.

## Summary

150+ business files found scattered across:
- Desktop
- Documents
- Downloads
- Home root
- OneDrive root

(Excluding canonical 10 Research Group folder.)

## Classification Breakdown

- **47 HIGH confidence** — Auto-route OK after Thomas approves destination bucket
- **28 MEDIUM confidence** — Scan filenames first, then categorize
- **18 LOW confidence** — Per-file decision required
- **12 TRASH/archive candidates** — Move to _archive/, never delete

## Key Finds

### DSR Contracts (~20 files)
Scattered across Desktop\Contracts. Canonical folder contains only 2. Need consolidation.

### Publishing Docs
BMI, MLC, SoundExchange, splits files all on Desktop. Should route to MANAGEMENT-TENx10/Catalog/Publishing/.

### Misfiled
- DSR EIN PDF in Pictures folder
- Various supporting docs across Downloads

### Recovery Artifacts
- rtist_bible_handoff_package — Needs content review before archive (may contain critical booking-agent context)
- somberg law folder — Personal legal case (NOT business — requires personal-data decision)

## Apps Script Recovery

**Status:** ZERO .gs files found on disk. Confirmed not recoverable from filesystem. Only remaining path: script.google.com project trash.

## DAD Seed Corpus

10 routing rules surfaced from this inventory. These become products/system-steward/ automated rules eventually:

1. Contract files → MANAGEMENT-TENx10/Contracts/{artist_name}/
2. Publishing docs → MANAGEMENT-TENx10/Catalog/Publishing/{doc_type}/
3. DSR financial docs → MANAGEMENT-TENx10/Financial/
4. Personal legal → personal-data decision gate
5. Archived contracts → _archive/Contracts-Historical/
6. EIN/tax docs → MANAGEMENT-TENx10/Financial/Tax/
7. Artist bibles → MANAGEMENT-TENx10/Artist-Profiles/
8. Meeting notes → data/notes/{date}/
9. Supplier invoices → MANAGEMENT-TENx10/Financial/Invoices/
10. Event planning → MANAGEMENT-TENx10/Events/{event_date}/

## Next Steps

This is the **manual stage-1 dogfood** that DAD will automate. Actual file moves happen in batches Thomas approves. Each batch generates a _MOVE_LOG for revertability.

---

**Inventory completed:** 2026-04-30  
**Data scope:** Desktop, Documents, Downloads, home root, OneDrive root  
**Excludes:** Canonical 10 Research Group folder structure (in scope separately)
