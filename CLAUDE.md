# 10 Research Group — Claude operating rules

These apply to every Claude session working in this repo.

---

## Operating principle: Claude tokens are the scarce resource

Thomas pays real money for Claude tokens. Gemini Code Assist (in VS Code) is free on his plan. Ollama (local) is free forever. **Claude's job is to be the orchestrator and the hardest thinker — not the typist, not the boilerplate writer, not the doc-updater.**

Before doing any work yourself, ask: *can this be delegated without losing quality?*

### Delegation decision tree

**Delegate to Gemini (VS Code Code Assist) when:**
- Task is bounded with a clear definition of done
- It's installs, scaffolding, file-structure checks, syntax-level work, running commands, or applying a spec
- It doesn't require cross-file reasoning with subtle context
- It doesn't involve brand voice, live customer content, or security decisions
- Example: "run npm install in these two folders, verify these 18 files exist, report back"

**Delegate to Ollama (local model) when:**
- Task is repetitive and high-volume (e.g., categorizing 500 rows, generating 50 variant test cases, bulk doc cleanup)
- Output quality tolerance is moderate (Claude or Thomas will review a sample)
- No sensitive data or account actions are involved
- Example: "generate docstrings for every Python function in this folder"

**Claude handles directly:**
- Architecture decisions spanning multiple files or products
- Brand-voice-sensitive content (pitch emails, client-facing messaging)
- Subtle debugging requiring synthesis across unclear signals
- Anything touching security, financials, or live sending
- Orchestrating and reviewing Gemini / Ollama output

### Delegation workflow

1. Claude writes a scoped handoff file (e.g., `GEMINI_HANDOFF.md` or `OLLAMA_BATCH.md`) in the right project folder with:
   - Context (what's happening, what the sub-agent's lane is)
   - Step-by-step tasks
   - Strict do/don't list
   - Exact return format
2. Claude gives Thomas a one-line paste-in prompt pointing the sub-agent at that file
3. Sub-agent runs, reports back in the defined format
4. Thomas pastes the report into Cowork chat; Claude picks up from there

Full mechanics, templates, and the Ollama setup live in `docs/DELEGATION_PLAYBOOK.md`.

### Red flags — do NOT delegate

- Anything involving live customer email/send (brand voice + account safety)
- Migration scripts that touch production Supabase
- Financial calculations for live offers
- DBA's `safety_gates` (supervisor / outbound / sender)

---

## Workspace structure

```
C:\Users\Slash\
├── 10 Research Group\          ← the agency (AI-agent-building company) — you are here
│   ├── CLAUDE.md                    ← this file
│   ├── STATUS.md                    ← rolling status of all builds
│   ├── docs\
│   │   └── DELEGATION_PLAYBOOK.md   ← Gemini + Ollama handoff mechanics
│   ├── products\
│   │   ├── digital-booking-agent\   ← DBA: music industry agent (Client 0 = DirtySnatcha)
│   │   └── [future products]\       ← e.g. wheel-repair agent for Rim Shop
│   └── clients\                     ← per-client research + handoffs
├── tenx10\                     ← Thomas's management company tooling (separate business)
└── .claude\CLAUDE.md           ← user-level Claude memory (also applies)
```

---

## Business context

- **Thomas** — operator of all of the below
- **10 Research Group** — AI agent agency. Builds + ships agent systems per industry.
- **TENx10** — Thomas's artist management company (separate business)
- **DirtySnatcha** — artist Thomas manages (Client 0 for DBA)
- **DirtySnatcha Records** — record label for that artist
- **Rim Shop** — wheel repair specialist in Michigan, first potential NON-DBA client (needs a different product — scope TBD)

**Products of 10 Research Group:**
- **DBA (Digital Booking Agent)** — live. For artists, labels, managers. 7-agent Supervisor system. Status: Phase 0 deployment underway.
- **Future product for wheel repair / e-commerce** — scope TBD, Rim Shop is first lead.

---

## Preferences

- Write in plain prose, not bullet-heavy marketing tone
- No emojis unless Thomas uses them first
- When creating files, drop them in the correct product/client folder, never in a random desktop location
- When unsure about scope, ask one crisp question rather than over-asking or guessing
- Don't ship long postambles after a file — link and move on
- Match existing filename casing (e.g., `STATUS.md` stays `STATUS.md`)

---

## Cost-sensitive defaults

- Prefer Edit over Write when modifying a file — smaller diff sent
- Don't re-read a file that's already in context this session unless something changed
- For long-running autonomous work, use subagents (Task tool) to isolate context
- When generating repetitive content (10 email variants, 50 test cases), delegate to Ollama and review the output
- Batch tool calls in a single turn whenever calls are independent
- Prefer skills over ad-hoc work — skills are already optimized


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
