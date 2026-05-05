# 10 Research Group — Claude operating rules

These apply to every Claude session working in this repo. Operating instructions only — portfolio context lives in `BRAIN.md`, current work in `AUTONOMOUS_QUEUE.md`, structure in `HIERARCHY.md`.

---

## Canonical naming — read first

`10 Research Group` and `10RG` are **the same entity**. `10RG` is the abbreviation. One company, one umbrella, one git repo, one folder. Never split context between the two names; never create a `10rg` folder outside the umbrella. Full rule in `BRAIN.md`.

---

## Operating principle: Claude tokens are the scarce resource

Thomas pays for Claude tokens; Gemini Code Assist (VS Code) is free on his plan; Ollama (local) is free. **Claude orchestrates and does the hardest thinking — not the typist, not the doc-updater.**

Before doing any work yourself: *can this be delegated without losing quality?*

### Delegation decision tree

**Gemini (VS Code Code Assist):** bounded tasks with clear DoD — installs, scaffolding, file-structure checks, syntax work, running commands, applying a spec. No cross-file reasoning, no brand voice, no live customer content, no security decisions.

**Ollama (local):** repetitive high-volume work (categorize 500 rows, 50 variant test cases, bulk doc cleanup). Moderate quality tolerance, no sensitive data.

**Claude direct:** cross-file architecture, brand-voice-sensitive content, subtle debugging, anything touching security / financials / live sending, orchestrating Gemini / Ollama output.

**Workflow:** Claude writes a scoped handoff file (`GEMINI_HANDOFF.md` / `OLLAMA_BATCH.md`) in the right project folder with context + step-by-step tasks + do/don't list + exact return format. Hands Thomas a one-line paste-in prompt. Sub-agent reports back in the defined format. Full mechanics in `docs/DELEGATION_PLAYBOOK.md`.

**Never delegate:** live customer email/send, production-Supabase migration scripts, live-offer financial calc, DBA's `safety_gates` (supervisor / outbound / sender).

---

## Partition rules for parallel sessions

- **One Claude session = one product cwd.** Each product has its own `CLAUDE.md` + `BRAIN.md` — read those when in that cwd. Never cross product roots in a single session. If you need to touch DBA and TENx10, open two sessions.
- **Within a product, partition by subsystem** when safe: e.g., DBA `agents/*` (Python) and DBA `app/*` (Next.js) can run as separate sessions because they don't share files.
- **Umbrella OS files** (`BRAIN.md`, `AUTONOMOUS_QUEUE.md`, `HIERARCHY.md`, this `CLAUDE.md`, `docs/STATUS.md`): only ONE session edits these at a time. If unsure who else is in here, ask.
- **When stuck:** open a fresh context window rather than fighting in the current one. Don't grind for an hour against a confused session.

---

## Verification

State your verification approach BEFORE making a non-trivial change, not after. Run the verification before reporting done. Per-product verification recipes live in each product's `CLAUDE.md`.

---

## Information mode — invest in context, not prompt micro-tweaks

Don't bet against the model. The most leveraged work is improving the data, structure, and current-state files Claude reads — not tuning prompt wording. When choosing between "tweak the agent prompt" and "tighten the BRAIN.md it reads," tighten BRAIN.md.

---

## Preferences

- Plain prose, not bullet-heavy marketing tone
- No emojis unless Thomas uses them first
- New files go in the right product/client folder, never random desktop locations
- One crisp question over guessing when scope is unclear
- No long postambles after a file — link and move on
- Match existing filename casing (`BRAIN.md` stays `BRAIN.md`, `AUTONOMOUS_QUEUE.md` stays `AUTONOMOUS_QUEUE.md`)

---

## Cost-sensitive defaults

- Prefer Edit over Write — smaller diff sent
- Don't re-read a file already in context this session unless something changed
- For long autonomous work, use subagents (Task tool) to isolate context
- High-volume repetitive content → delegate to Ollama, review the sample
- Batch independent tool calls in a single turn
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
