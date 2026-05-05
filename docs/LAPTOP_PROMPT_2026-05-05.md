# Laptop Sweep Prompt — 2026-05-05

Open Claude Code on the laptop, `cd` to the umbrella (`OneDrive\10 Research Group\` or wherever it lives on that machine), and paste the prompt below into a fresh chat. The desktop session has already done its half; this finishes the cross-machine inventory.

---

## Paste this into the laptop's Claude Code session

> I'm on the laptop. The desktop session already swept its machine and wrote the report to `docs/FILE_SWEEP_2026-05-05_thispc.md` plus several JSON dumps in the same folder. Read that report first to understand context (what we're looking for, why, and what the desktop turned up).
>
> Then run the same sweep on this laptop:
>
> ```
> python "scripts/sweep_for_claude_files.py" laptop
> ```
>
> That writes `docs/FILE_SWEEP_2026-05-05_laptop.json` with all keyword hits + archive hits across this laptop's Downloads, Desktop, Documents, Projects, .claude, all OneDrive non-10RG areas, and any non-C: drives mounted on this machine.
>
> After the JSON lands:
>
> 1. Read `docs/FILE_SWEEP_2026-05-05_laptop.json` to see what was found.
> 2. Write a markdown report at `docs/FILE_SWEEP_2026-05-05_laptop.md` mirroring the desktop's report structure: Critical (security/privacy findings) → By location → Top duplicate groups (within laptop AND cross-machine vs desktop's report) → What needs to move where (with target paths in `MANAGEMENT-TENx10/` and `tenx10-platform/`) → Status summary.
> 3. Specifically hunt for **claude.ai chat-export zips** the user downloaded before he started using Claude Code. Look for: `conversations.json` filenames, doubly-nested folder names (extraction artifact), folders named `Claude` / `chat` / `conversation` / `transcript` / `handoff` / `export`, and any `.zip` whose contents include a Claude-shaped JSON. Desktop turned up 0 of these — they're likely on this laptop.
> 4. Sign in to Google Drive Desktop if it's installed and not signed in, so `I:\My Drive\` is mounted. The umbrella's `BRAIN.md` says MHP content lives there; chat zips might too.
> 5. **Don't move any files yet.** This is inventory only. The desktop session will reconcile findings once your report lands.
>
> When the report is written, end with: "Laptop sweep complete. Report at `docs/FILE_SWEEP_2026-05-05_laptop.md`. Desktop session can pick up from here."

---

## What the script does

`scripts/sweep_for_claude_files.py`:

- Detects the user's home + OneDrive paths from environment variables (works on either machine without hardcoded paths)
- Detects mounted drives D-Z, skips Pioneer DJ drives (`PIONEER` folder check), Recycle Bin, System Volume Information
- Searches for `.md`, `.txt`, `.json`, `.yaml`, `.yml`, `.csv`, `.docx`, `.xlsx`, `.pdf` matching keywords (`claude`, `10rg`, `tenx10`, `dba`, `dirtysnatcha`, `dsr`, etc.)
- Catalogs all archive files (`.zip`, `.tar.gz`, `.7z`, `.rar`, etc.) with size + mtime
- Skips `OneDrive/10 Research Group/` (the consolidation destination)
- Writes JSON to `docs/FILE_SWEEP_2026-05-05_<machine-label>.json`

## When both reports are in OneDrive

The desktop session reconciles:

- Cross-machine duplicate detection (same file on both machines)
- Cross-machine missing files (only on one)
- Combined "what needs to move where" plan
- Final consolidation move list (proposed; user approves before execution)

The desktop session will pick this up automatically when the laptop report syncs in.
