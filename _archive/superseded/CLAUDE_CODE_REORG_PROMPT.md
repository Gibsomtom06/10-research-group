# Prompt to paste into Claude Code

Copy everything between the `===` markers into Claude Code. Run it from `C:\Users\Slash\10 Research Group\` (or open that as the Claude Code working directory first).

Claude Code will audit, propose, and then ask before moving anything. Nothing gets deleted.

---

```
===BEGIN PROMPT===

You are reorganizing my TENx10 / 10 Research Group folder hierarchy. The canonical map is at `C:\Users\Slash\10 Research Group\HIERARCHY.md` — READ THAT FIRST, in full, before doing anything.

Context you need before you touch files:
- TENx10 (aka "10 Research Group") is my artist-management company. Everything company-related lives under `C:\Users\Slash\10 Research Group\`.
- Rim Shop is a SEPARATE venture (wheel repair, Michigan). It is NOT a TENx10 product. If you find Rim Shop files anywhere inside `10 Research Group\`, move them out to `C:\Users\Slash\Rim Shop\`.
- The Digital Booking Agent (DBA) is a TENx10 product. It lives at `10 Research Group\products\digital-booking-agent\`. It has its own `CLAUDE.md`, `TASKS.md`, and `docs\SESSION_STATE.md`. DO NOT move or rename those — they are live working-memory files.
- The tenx10.co website source is `10 Research Group\products\tenx10-platform\`.
- DSR = DirtySnatcha Records (the label for one artist on my roster). Its paperwork lives under `10 Research Group\artists\dirtysnatcha\`.
- My personal cross-project memory is at `C:\Users\Slash\memory\`. Do NOT move that into the company folder.
- My workspace root `CLAUDE.md` at `C:\Users\Slash\CLAUDE.md` and the auto-loaded mirror at `C:\Users\Slash\.claude\CLAUDE.md` both stay where they are.

Non-negotiable safety rules:
1. DO NOT delete anything. Every move must be reversible.
2. DO NOT overwrite an existing file. If a destination path already has a file with the same name, stop and ask.
3. DO NOT move anything inside `products\digital-booking-agent\` without telling me first. That tree has working imports and tests.
4. Prefer `git mv` over `mv` whenever the source file is inside a git repo, so history is preserved.
5. When you move non-git-tracked files, use plain `Move-Item` (PowerShell) or `mv` — not `cp` — and verify the source is gone after.
6. NEVER touch `C:\Users\Slash\AppData\`, `C:\Users\Slash\.claude\`, `C:\Users\Slash\memory\`, or any folder outside `C:\Users\Slash\10 Research Group\` and `C:\Users\Slash\Rim Shop\`.

Do this in phases and STOP for my approval between each phase.

## Phase 1 — audit (READ-ONLY)

1. Read `HIERARCHY.md` in full.
2. List every top-level folder and file inside `C:\Users\Slash\10 Research Group\`.
3. For each product folder under `10 Research Group\products\`, list its top-level contents (one level deep, not recursive).
4. Search `C:\Users\Slash\` (top level only — do NOT recurse into AppData, node_modules, .git) for anything that looks like it belongs under `10 Research Group\` but isn't there — e.g. loose folders named `tenx10*`, `dirtysnatcha*`, `whoisee*`, `dark-matter*`, `kotrax*`, `dba*`, `booking*`.
5. Search for Rim Shop related folders/files that are currently MIS-placed inside `10 Research Group\` (look for names containing "rim", "wheel", "repair").
6. Produce a DIFF report comparing what's on disk to what `HIERARCHY.md` says should be there. Format:

   ```
   # Hierarchy diff
   
   ## Matches (already correct)
   - <path>: matches expected location
   
   ## Misplaced (needs to move)
   - <current path>  →  <target path>   (reason: ...)
   
   ## Orphaned (not in the map — need a decision)
   - <path>: no obvious target slot. Options: [A] ..., [B] ..., [C] leave in place.
   
   ## Missing (expected by map but doesn't exist)
   - <expected path>: would need to be created
   ```

7. Do NOT move anything yet. Hand me the diff report and wait.

## Phase 2 — propose a plan

After I confirm the audit, produce a concrete move plan:

- Every move as `<source> → <destination>` with the exact command (`git mv <src> <dst>` or `Move-Item <src> <dst>`).
- Group moves by destination so I can see the shape of the final tree.
- Flag any move that crosses a git-repo boundary (moving a file from inside a repo to outside it, or vice versa) — those need a copy-then-delete dance, not `git mv`.
- For any "orphaned" file from phase 1, either propose a home or list it under "leave in place for now, decide later".

STOP. Wait for me to approve the plan — in full or with edits.

## Phase 3 — execute

Only after I approve. Execute the plan one batch at a time:

1. Before each batch, run the moves.
2. After each batch, verify:
   - Source paths no longer exist.
   - Destination paths now exist.
   - If a git repo was touched, `git status` inside that repo shows the moves as renames (not delete+add).
3. If ANYTHING unexpected happens — file already exists at destination, permission error, git conflict — STOP and report. Do not keep going.

## Phase 4 — verify nothing broke

After all moves are done:

1. Inside `products\digital-booking-agent\`:
   - Run `git status` and paste output.
   - Run `python -c "import agents.outbound; import agents.inbound; import agents.routing; import agents.research; import agents.analyst; import agents.model_router; import agents.embeddings; print('ok')"` from the repo root. Any ImportError is a regression — report it.
   - `cd app && npm run build` and report whether it succeeded. If it fails, do NOT attempt to fix it without asking me — just report.
2. Inside `products\tenx10-platform\`:
   - Run `git status` and paste output.
   - If there's a package.json, report whether `npm run build` still succeeds.
3. Open `10-research.code-workspace` (or read it as JSON) and confirm all folder paths in it still resolve to real directories. If any don't, show me the broken entry — do not auto-fix.

## Phase 5 — report

Give me a final summary:
- Total moves executed
- Any repos whose history you preserved via `git mv`
- Any files you left in place because they were orphaned with no clear home
- Any broken imports / build failures / workspace-file drift
- A short "what to do next" list if anything is still not right

That's the whole job. Do not go beyond this — no cleanup, no reformatting, no renaming beyond what the map requires.

===END PROMPT===
```

---

## Why it's phased

You asked to make sure you don't break anything. The phases are the safety net:

- **Phase 1 is read-only** — Claude Code can't damage anything while auditing.
- **Phase 2 is a proposal** — you see every move before it happens.
- **Phase 3 is gated** — you approve the plan first, then it runs in batches with checks after each one.
- **Phase 4 is regression-catching** — confirms the DBA still imports and builds, the website still builds, and the VS Code workspace file still points at real paths.
- **Phase 5 is the handoff** — a clean summary so you know what changed.

If something goes sideways in Phase 3 or 4, you'll know immediately and the rest of the plan pauses.

## If you want a faster / riskier variant

If you're confident about the reorg and want Claude Code to just DO it, remove the "STOP. Wait for me to approve" lines in phases 1 and 2, and change phase 3's opening to "Execute the plan." Keep phase 4 verification either way — that's cheap and catches regressions.
