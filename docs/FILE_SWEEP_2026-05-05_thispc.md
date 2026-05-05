# File Sweep — This PC (Desktop) — 2026-05-05

Sweep of all reachable filesystem locations on the desktop machine for files related to Claude / 10RG / projects, in service of the consolidation pass. Intent: identify scattered files outside `OneDrive\10 Research Group\` for relocation into one source of truth.

---

## Critical (read first — security / privacy)

### S1. Cryptocurrency seed phrase in plaintext at OneDrive root

`C:\Users\slash\OneDrive\binance chain wallet seed phrase.docx`

A `.docx` named `binance chain wallet seed phrase` sits at the OneDrive root. OneDrive syncs to all devices, including any device where the OneDrive account is signed in. **Anyone with access to your OneDrive account has the seed phrase.** This was already flagged in memory entry `project_filesystem_chaos_2026_05_04.md` and remains unaddressed.

**Recommended action (you, not me):** Move the phrase to a password manager (Bitwarden was installed per the autonomous queue). Then delete the `.docx`. Do not delete it before saving the phrase elsewhere — that's catastrophic and irrecoverable.

### S2. Medical records at OneDrive root

`C:\Users\slash\OneDrive\t bogner test results.docx`
`C:\Users\slash\OneDrive\t nalian test results.docx`

Personal medical files at OneDrive root. Likely do not belong in the working tree. Move to a `Personal/Medical/` folder outside the project areas, or to local-only storage.

### S3. Other private items at OneDrive root

`Morrison Arrest warrent charges.xlsx` — unclear context but personal-legal-sensitive name.

---

## Sweep results — by location

| Location | Hits | Notes |
|---|---|---|
| `C:\Users\slash\.claude\` | 168 | Claude's own scaffolding (memory, plans, transcripts, agents). Not user scatter. |
| `C:\Users\slash\OneDrive\Desktop\` | 92 | Real DSR business artifacts going back to 2021. Major scatter. |
| `C:\Users\slash\Projects\` | 85 | `Projects\tenx10\` (canonical platform clone) + `Projects\aistudio\`. |
| `D:\Downloads\` | 40 | DSR contracts, riders, royalty reports, EPK. Going back 2024-2026. Major scatter. |
| `C:\Users\slash\OneDrive\` (root) | 12 | Loose `.docx` / `.xlsx` files at OneDrive root (see Critical above). |
| `C:\Users\slash\OneDrive\Pictures\` | 1 | DSR Records EIN LLC PDF (legal doc misfiled). |
| `C:\Users\slash\Downloads\` | 0 | Empty (Windows is using OneDrive Known Folder Move). |
| `C:\Users\slash\Documents\` | 0 | Empty (same — KFM redirected). |
| `D:\` (other than Downloads) | 0 keyword hits | DSR Merch folder + various media assets exist at D root but didn't keyword-match. |
| Drives `E:\`, `F:\`, `H:\`, `J:\` | — | Pioneer DJ drives only. Skipped. |
| Drive `I:\` | — | Not mounted (Google Drive offline). MHP content lives there. |

**Total hits this PC: 398.**

---

## Top duplicate groups

23 filename-duplicate groups (same name in 2+ locations). Highlights:

| Group | Copies | Locations |
|---|---|---|
| `DirtySnatcha Rider.docx` | **5** | All in `D:\Downloads\` — `Rider`, `Rider (1)`, `Rider (2)`, `Rider (3)`, `Rider (4)`. All same byte size (23,071). Browser dup-on-redownload. |
| `README.md` | 4 | Different projects (`Projects/tenx10`, `Projects/aistudio`, `_archive`-ish copy in OneDrive Desktop); per-project, OK. |
| `SKILL.md` | 4 | `.claude/skills/agent-browser`, `.claude/skills/gog`, plus 2 `meta-ads-analyzer` mirrors in `OneDrive\Desktop\shit\...artist_bible_handoff_package\` (legacy artifact). |
| `MEMORY.md` | 3 | Per-Claude-project memory files. Correct (each project has its own). |
| `DirtySnatcha Records EIN LLC.pdf` | 3 | `OneDrive\Pictures\` + 2 in `D:\Downloads\`. Legal entity doc — single canonical needed. |
| `Photo City Music Hall ... Performance Agreement.pdf` | 3 | `D:\Downloads\` (no parens), `(1)`, `(2)`. Browser re-download. |
| `2024-09-09 Dark Matter - Brainwash - DSR Contract.pdf` | 1 | In `D:\Downloads\`, should be in `MANAGEMENT/.../contracts/2024-09-09-...`. |
| Multiple `meta-ads-analyzer/references/*.md` | 8+ | Doubly-mirrored inside `OneDrive\Desktop\shit\...artist_bible_handoff_package\`. Old. |

---

## What needs to move where

### A. DSR contracts — currently scattered, target `MANAGEMENT-TENx10/labels/DirtySnatcha Records/contracts/<date>-...`

Real legal contracts found outside the canonical contracts folder:

- `OneDrive\Desktop\Contracts\2025.09.09 DirtySnatcha feat Raddix - Everybody...DSR Exclusive License Agreement.pdf`
- `OneDrive\Desktop\shit\Documents\2024-11-DirtySnatcha x Priyanx DSR Exclusive License Agreement.docx`
- `OneDrive\Desktop\DSR Exclusive Licensing Agreement-DSRecords.docx`
- `OneDrive\Desktop\DirtySnatcha x PRYSM Mutual Release.pdf`
- `D:\Downloads\2024-09-09 Dark Matter - Brainwash - DSR Contract.pdf`
- `D:\Downloads\2024-05-05-Autokorekt -Phonk Sauce DSR Contract.docx`
- `OneDrive\Desktop\DSR\Sloth x Chackk - Game - DSR CONTRACT 2023-12-21.docx` (also present in a sibling folder)

Recommended convention: `MANAGEMENT-TENx10/labels/DirtySnatcha Records/contracts/YYYY-MM-DD-<artist>-<track>-DSR-Contract.<ext>`. Two contracts already there (Dark Matter Barooka Apr 25, Walter Wilde Apr 25) follow this pattern.

### B. DSR business artifacts — target `MANAGEMENT-TENx10/labels/DirtySnatcha Records/`

- `OneDrive\Desktop\PDF\dsr emblem.pdf`, `dsr logo.pdf` → `MANAGEMENT/.../brand-assets/` (new folder)
- `OneDrive\Desktop\dsr hoodie v1.pdf` (24 MB), `OneDrive\Desktop\DSR hoodie.pdf` (33 MB), `OneDrive\Desktop\dsR football jersey.pdf` (29 MB on D drive), `OneDrive\Desktop\dsr merch invoice.pdf` → `MANAGEMENT/.../merch/`
- `OneDrive\Desktop\2026 dirtysnatcha w9a.pdf.docx`, `OneDrive\Desktop\DSR\dsr w9.pdf` → `MANAGEMENT/.../legal/tax-forms/` (new folder)
- `OneDrive\Pictures\DirtySnatcha Records EIN LLC.pdf` (+ 2 dup in D:\Downloads) → `MANAGEMENT/.../legal/`
- `OneDrive\Desktop\DirtySnatcha Records Publishing CMRRA-Affiliation.pdf`, `OneDrive\Desktop\DSR\LAB10 CMRRA-Affiliation.pdf` → `MANAGEMENT/.../publishing/cmrra/`
- `D:\Downloads\Dirtysnatcha_Records_202604_*.xlsx` (royalty reports), `D:\Downloads\2024.11.10.DSR.Catalog.csv`, `D:\Downloads\DirtySnatcha Records Inventory*.xlsx` → `MANAGEMENT/.../publishing/royalty-reports/<YYYY-MM>/` or `MANAGEMENT/.../catalog/`
- `D:\Downloads\Dirtysnatcha - EPK.pdf` → `MANAGEMENT/.../press-kit/`

### C. Per-show files — target per-show folders

`show_folder_structure.md` defines `[MM.DD.YYYY] [City, State] - [Venue Name]/` with subfolders 00_CONTROL through 06_SHOW_ASSETS. The Photo City Rochester agreement (3 copies in `D:\Downloads\`, 1 in `OneDrive\Desktop\`) should land in:

`MANAGEMENT-TENx10/labels/DirtySnatcha Records/shows/04.30.2026 Rochester, NY - Photo City Music Hall/01_CONTRACT_&_PAYMENT/`

(Once copied, delete the 3 D:\Downloads dups.)

Same for `Electric Forest 2026 Artist Offer - dirtysnatcha.pdf` → per-show folder for Electric Forest.

### D. Riders — keep one canonical

`D:\Downloads\DirtySnatcha Rider*.docx` (5 copies, all 23,071 bytes, identical). Single canonical lives at `MANAGEMENT-TENx10/labels/DirtySnatcha Records/operations/riders/DirtySnatcha-Rider.docx` (or under `tenx10-platform/TENx10_Knowledge_Base/18_Advance_Rider_Templates.md` if it's just a generic rider template). Delete the 5 dups.

### E. Legacy `artist_bible_handoff_package` — already partially archived

`OneDrive\Desktop\shit\Documents\artist_bible_handoff_package\artist_bible_handoff_package\` is a doubly-nested old artifact. Already mirrored under `OneDrive\10 Research Group\_archive\desktop-cleanup-2026-04-30\ubuntu\artist_bible_handoff_package\`. Confirm content match, then delete the OneDrive\Desktop\shit\... copy.

### F. The `OneDrive\Desktop\shit\` directory

The folder name is literally `shit`. Contains real legal documents (Priyanx DSR contract, MyHydrationPack NDA, more). Should be renamed AND its contents filed properly. Suggested target:

- DSR contracts → `MANAGEMENT/.../contracts/`
- MyHydrationPack NDAs → outside this repo (lives in `I:\My Drive\02-MyHydrationPack\` per BRAIN.md)
- Then delete `OneDrive\Desktop\shit\`.

### G. OneDrive root cleanup

Beyond the critical items in S1-S3, these loose files at OneDrive root:

- `architect markdown.docx`, `New contract.docx`, `marketing questions for release.docx` — placeholder-named files, content unclear. Open and decide.
- `Book 1.xlsx`, `Book.xlsx` — likely empty Excel placeholders. Open and confirm; delete if empty.
- `DirtySnatcha Music .xlsx` — DSR catalog data. Should be in `MANAGEMENT/.../catalog/` if active.
- `DESKTOP_INVENTORY_2026-04-30.md` — old desktop inventory. Move to `_archive/reports-2026-04-30/`.
- `HANDOFF.md` at OneDrive root — what is this? Likely a stray umbrella handoff. Verify, file or delete.

### H. Already-canonical: leave alone

- `Projects\tenx10\` — canonical platform dev clone. Not "scatter"; this is by design per umbrella BRAIN.md. Just integrated retrofit (139-line CLAUDE.md).
- `Projects\aistudio\` — separate project, not 10RG-related.
- `.claude\` (memory, plans, transcripts, agents, sessions) — Claude's own state; correct location.
- `D:\` non-Downloads (DSR Merch, 350 videos, etc.) — large media assets. Could move to `MANAGEMENT/.../merch/raw-files/` or stay on D: if too big for OneDrive sync.

---

## Proposed Phase 0 — extends the existing consolidation plan

This sweep adds a phase BEFORE Phase 1 of the existing `async-swimming-falcon.md` plan:

### Phase 0a — security cleanup (you-driven, not me)

- Move Binance seed phrase to password manager → delete `.docx`
- Move medical records out of working tree
- Move/delete `Morrison Arrest warrent charges.xlsx`

### Phase 0b — cross-machine inventory

- This PC sweep: done (this file)
- Laptop sweep: pending — laptop session needs to run the same sweep, write `FILE_SWEEP_2026-05-05_laptop.md` alongside this file

### Phase 0c — cross-machine consolidation

After both sweeps land:
- Reconcile findings (some files may exist on both machines)
- Move per the recommendations above
- Archive `OneDrive\Desktop\shit\` after content is filed
- Re-sweep both machines to verify no remaining scatter
- Add the "no files outside designated locations" rule to `HIERARCHY.md`

---

## For the laptop session

Open Claude Code on the laptop. cd to `C:\Users\slash\OneDrive\10 Research Group\` (or wherever the umbrella lives on that machine). Paste this prompt:

> Read `docs/FILE_SWEEP_2026-05-05_thispc.md` to understand what was found on the desktop machine. Then run the equivalent sweep on this laptop: scan `~\Downloads\`, `~\Desktop\`, `~\Documents\`, `~\Projects\`, `~\.claude\`, all OneDrive non-10RG areas (`OneDrive\Desktop\`, `OneDrive\Documents\`, etc.), and any non-C: drives. Use the same keyword set (claude, 10rg, tenx10, dba, dirtysnatcha, dsr, trading-shadow, system-steward, rim-shop, mhp, hvrcrft, whoisee, kotrax, dark-matter) and the same file extensions (.md, .txt, .json, .yaml, .yml, .csv, .docx, .xlsx, .pdf). Skip `OneDrive\10 Research Group\`, `node_modules`, `.next`, `.venv`, `__pycache__`, `dist`, `build`, `.git`, `$RECYCLE.BIN`, `System Volume Information`. Write the laptop's sweep report to `OneDrive\10 Research Group\docs\FILE_SWEEP_2026-05-05_laptop.md` with the same structure (Critical / By location / Top duplicate groups / What needs to move where). Don't move any files yet — just inventory. The desktop session will reconcile findings once the laptop file lands.

Both reports will be readable by both sessions via OneDrive sync.

---

## Status after this sweep

- **TENx10 mirror invariant** — fixed. `Projects\tenx10\` pulled to `c68f568`. CLAUDE.md is 139 lines on both sides.
- **OS files existence check** — all 6 worried-about files exist (`HIERARCHY.md`, `BUSINESS_HIERARCHY.md`, `AUTONOMOUS_QUEUE.md`, `AUTONOMOUS_MODE_PROTOCOL.md`, `EMPLOYEE_DIRECTORY.md`, `SKILL_DIRECTORY.md`). Reading-discipline rule caught this would-have-been bug.
- **`client_secret*.json` in working tree** — confirmed not tracked. Worth moving outside the tree (Phase 3 of main plan).
- **File scatter** — confirmed real, mapped, recommendations above.
