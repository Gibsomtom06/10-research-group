# Read-only mirror

This OneDrive copy of the TENx10 platform repo is a **read-only mirror**.

## Where to actually edit

Active dev clone: `C:\Users\slash\Projects\tenx10\` (off OneDrive — no lock contention, faster file watcher).

The umbrella VS Code workspace (`10-research.code-workspace`) opens the standalone clone, NOT this copy.

## Why this copy still exists

- The umbrella git repo (`10 Research Group/`) tracks `products/tenx10-platform/` as a gitlink (nested git repo). The umbrella commits reference a specific HEAD sha here, so the directory needs to exist with the right contents.
- Code search across the portfolio (browse mode) finds tenx10 code without leaving the umbrella workspace.
- Sub-agents that read by-path don't need to know about the standalone clone.

## How it stays in sync

`scripts/sync_tenx10_mirror.ps1` fast-forwards this copy from GitHub. Run manually before reading, or schedule nightly via Task Scheduler.

## What NOT to do

- **Don't edit code here.** Changes will be overwritten on next sync.
- **Don't `git commit` here.** The mirror is not the source of truth.
- **Don't add untracked files here.** They'll get clobbered or stash-stranded.

If you accidentally edit something here: copy the diff over to `Projects\tenx10\`, commit + push from there, then re-sync this mirror.
