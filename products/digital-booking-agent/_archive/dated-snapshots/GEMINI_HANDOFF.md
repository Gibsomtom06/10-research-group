# Gemini handoff — DBA Phase 2 setup (parallel with Claude)

Hi Gemini. Claude (running in the Cowork sidebar) is handling Phase 1 (Supabase browser work) and Phase 3 kickoff (Google Takeout) in parallel. Your job is Phase 2 — the local app + workers + Python deps — so Thomas doesn't have to wait.

**Full spec:** `DEPLOYMENT.md` in this same folder has the five-phase walkthrough. Open it and read Phase 2 before you start.

**Do not touch Phase 1 or Phase 3** — those are Claude's lane. Specifically:
- Don't create a Supabase project
- Don't run schema.sql or any migration
- Don't touch Google Takeout

---

## What you're doing (Phase 2)

Work from `C:\Users\Slash\10 Research Group\products\digital-booking-agent\`.

### Step 1 — Open the integrated terminal

VS Code → Terminal → New Terminal. PowerShell is fine.

### Step 2 — App setup

```powershell
cd "C:\Users\Slash\10 Research Group\products\digital-booking-agent\app"
Copy-Item .env.example .env.local
npm install
```

The `.env.local` file has three blank Supabase keys. **Leave them blank for now** — Claude will paste them in after the Supabase project is live. Do NOT ask Thomas for the keys. Do NOT run `npm run dev` yet — that only works once the env is filled.

### Step 3 — Workers setup

```powershell
cd "..\workers"
npm install
```

Also create `workers\.env` (copy `.env.example` if it exists, otherwise create an empty file). Leave `SENDER_DRY_RUN=true` — we are NOT going live yet.

### Step 4 — Python deps (global)

```powershell
pip install supabase anthropic
```

If `pip` isn't found: `python -m pip install supabase anthropic`.

### Step 5 — Verify file structure is intact

Run these and confirm they all return 0 exit code (files exist):

```powershell
cd "C:\Users\Slash\10 Research Group\products\digital-booking-agent"
Test-Path agents\supervisor.py
Test-Path agents\routing.py
Test-Path agents\research.py
Test-Path agents\inbound.py
Test-Path agents\outbound.py
Test-Path agents\analyst.py
Test-Path agents\reporting.py
Test-Path scripts\preflight.py
Test-Path schema.sql
Test-Path migrations\0001_outreach_audit_columns.sql
Test-Path migrations\0002_bounces_and_reminders.sql
Test-Path migrations\0003_reports.sql
Test-Path workers\sender.ts
Test-Path workers\freshness_sweep.ts
Test-Path workers\bounce_handler.ts
Test-Path workers\reminder_sweep.ts
Test-Path app\app\dashboard\page.tsx
```

Every line should print `True`. If any print `False`, stop and report it to Thomas — something's missing from the repo.

### Step 6 — Check the 7 agent runners compile

```powershell
cd "C:\Users\Slash\10 Research Group\products\digital-booking-agent"
python -c "import ast; import pathlib; [ast.parse(pathlib.Path(p).read_text(encoding='utf-8')) for p in ['agents/supervisor.py','agents/routing.py','agents/research.py','agents/inbound.py','agents/outbound.py','agents/analyst.py','agents/reporting.py']]; print('all 7 compile')"
```

Should print `all 7 compile`.

### Step 7 — Report back

When done, tell Thomas (in chat) exactly this format so Claude knows what state you left things in:

```
GEMINI_PHASE_2_DONE
- app/.env.local created: yes/no
- app/node_modules installed: yes/no
- workers/node_modules installed: yes/no
- workers/.env created: yes/no
- supabase + anthropic pip installed: yes/no
- all 18 file checks pass: yes/no
- all 7 agent runners compile: yes/no
- any errors: <paste them>
```

Thomas will paste that back into the Cowork chat so Claude picks it up and continues from there.

---

## What you should NOT do

- Do NOT run `npm run dev` until the Supabase env vars are filled in.
- Do NOT run any worker (`npm run sender`, `npm run sender:dryrun`, etc.) yet.
- Do NOT run `python scripts/preflight.py` yet — it'll fail on Supabase checks.
- Do NOT run `python agents/supervisor.py` yet.
- Do NOT modify any file under `agents/`, `workers/`, `app/`, `scripts/`, `prompts/`, `migrations/`, or `schema.sql`. If you think something is broken, tell Thomas — don't "fix" it.
- Do NOT create new files outside `.env.local` and `workers/.env`.
- Do NOT set `SENDER_DRY_RUN=false` under any circumstance.

---

## If something fails

Paste the full error into chat for Thomas and stop. Do not retry with variations. Do not attempt workarounds. The deployment is sequenced for a reason — don't skip ahead.

— Claude (via Cowork)
