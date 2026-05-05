# Setup: GitHub Remote for Umbrella Repo
**One-time setup. Do this once, then push_umbrella.ps1 handles the rest.**

---

## What this does

The 10 Research Group umbrella (`C:\Users\slash\OneDrive\10 Research Group\`) is a git repo with 3 commits but no remote. This means everything — trading-shadow, factory, DBA, MHP, rim-shop, system-steward, MANAGEMENT-TENx10 docs — lives only on OneDrive. One sync glitch = recovery from scratch.

This setup adds a private GitHub remote so `push_umbrella.ps1` can push nightly.

---

## Pre-flight: confirm .gitignore covers secrets

Run this BEFORE adding the remote. If ANY secrets are in git history, rotate them before pushing.

```powershell
cd "C:\Users\slash\OneDrive\10 Research Group"
git log -p | Select-String -Pattern "api_key|api-key|token|secret|password|sk-ant|sk-ant-api" -CaseSensitive:$false | Select-Object -First 20
```

If you find hits → stop, rotate the leaked key, then use BFG or `git filter-repo` to scrub history before pushing.

Check `.gitignore` covers:
```
.env
.env.*
.env.local
.env.paper
.env.live
*token*.json
*credentials*.json
node_modules/
.next/
dist/
*.pyc
__pycache__/
data/decisions*.jsonl     # trading decisions — keep private
data/conversation_log/    # shadow corpus — keep private
```

---

## Step 1: Create the private GitHub repo

Option A — gh CLI (fastest):
```powershell
cd "C:\Users\slash\OneDrive\10 Research Group"
gh repo create Gibsomtom06/10-research-group --private --source=. --remote=origin --push
```

Option B — manual:
1. Go to github.com/new
2. Name: `10-research-group`
3. Visibility: **Private**
4. Do NOT initialize with README (repo already has commits)
5. Copy the SSH or HTTPS remote URL

Then:
```powershell
cd "C:\Users\slash\OneDrive\10 Research Group"
git remote add origin https://github.com/Gibsomtom06/10-research-group.git
git push -u origin master
```

---

## Step 2: Verify

```powershell
git remote -v
# Should show:
# origin  https://github.com/Gibsomtom06/10-research-group.git (fetch)
# origin  https://github.com/Gibsomtom06/10-research-group.git (push)

gh repo view Gibsomtom06/10-research-group
# Should show your repo with commit history
```

---

## Step 3: Register nightly push as a scheduled task

```powershell
# Run from the scripts/ folder
.\install_push_cron.ps1
```

Or manually in Task Scheduler:
- Program: `powershell.exe`
- Arguments: `-NonInteractive -WindowStyle Hidden -File "C:\Users\slash\OneDrive\10 Research Group\scripts\push_umbrella.ps1"`
- Trigger: Daily at 11pm ET
- Run whether user is logged on or not: Yes
- Run with highest privileges: Yes

---

## What gets pushed

Everything in `C:\Users\slash\OneDrive\10 Research Group\` that isn't in `.gitignore`. This includes:
- `products/trading-shadow/` — all code, specs, runbooks
- `products/digital-booking-agent/` — all agents, schema, app
- `products/rim-shop/` — SOW, campaign plans, feed generator
- `products/system-steward/` — utility scripts
- `MANAGEMENT-TENx10/` — artist data, publishing playbooks, pilot logs
- `docs/` — all specs, factory architecture, strategic reviews
- `BRAIN.md`, `HIERARCHY.md`, `EMPLOYEE_DIRECTORY.md`, etc.

**Does NOT push:**
- `products/tenx10-platform/` — that's the separate `c:\Users\slash\Projects\tenx10\` repo with its own GitHub remote (Gibsomtom06/tenx10)
- Anything in `.gitignore`

---

## Notes

- **GitHub is the cross-PC sync layer.** Pull/push between machines, not OneDrive.
- ~~OneDrive for cross-PC sync speed~~ — this guidance was wrong. OneDrive racing with git on `.git/index.lock` causes commit failures and stale-clone artifacts (see `_archive/stale-clones/tenx10-cc65688-stale-clone/` for the receipt). Don't put a git working tree inside OneDrive.
- Working clones belong outside OneDrive (e.g., `C:\Users\slash\Projects\10-research-group\`), mirroring the tenx10 platform fix at `C:\Users\slash\Projects\tenx10\`.
- OneDrive's job is non-git assets only — audio, photos, contracts, design files, anything that isn't a text/code repo.

---

*Created 2026-05-03. Updated 2026-05-04: removed misleading "OneDrive for cross-PC sync" guidance after it caused git lock failures + stale clones across machines.*
