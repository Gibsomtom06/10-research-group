# Build Cycle Skill
# Triggered by: /build-cycle, "build cycle," "rebuild," "full rework," or any request to design+build a substantial new product/feature/surface

The Boris-method 3-phase cycle for any non-trivial build, with verification loops, parallel partitioning, and "information mode" baked in. Run this BEFORE writing code on anything that touches more than 2-3 files or more than one product subsystem.

---

## Why this exists

The 2026-05-05 TENx10.co rebuild caught a process drift: jumped to "build" without interviewing scope. User had to halt the work and force the alignment phase. This skill prevents that drift — every substantial build runs all 3 phases in order, with explicit gates between them.

---

## The 3 phases (run in order, no skipping)

### Phase 1 — Alignment

The "what is this and why" phase. Output: shared mental model between Thomas and Claude.

**Steps:**

1. Glob every relevant `.md` and source file in scope. Use the [Read before writing](../../../CLAUDE.md) discipline — first-hand reads only, no filename heuristics.
2. Restate back: what currently exists, what changes have been made recently (last ~30 days of git log), the purpose of each file, and how the pieces connect.
3. Interview Thomas with the 4 core questions BEFORE proposing anything:
   - **What is the core problem this solves?**
   - **Who is this for?** (primary user, secondary users)
   - **What does success look like?** (concrete; "no more X" or "Y happens automatically")
   - **What should this NOT do?** (out of scope, explicit non-goals)
4. Surface 3-5 gaps / contradictions / ambiguities found in step 1-2. Get Thomas's call on each.
5. Summarize the alignment back as a single section. Get explicit "yes that's right" before proceeding.

**Gate to Phase 2:** Thomas confirms the summary. If anything is still ambiguous, loop step 3.

### Phase 2 — Translation

The "what specifically gets built" phase. Output: a concrete technical spec.

**Steps:**

1. Translate the alignment into:
   - Domain model deltas (entities, relationships, fields)
   - Migrations needed (numbered, named)
   - File-level changes (new files, modified files, deletions)
   - UI/route surface changes (routes added, components added, props/state shape)
   - Data source / API integration changes
2. Identify the **smallest cuttable verifiable slice** — what does a "Hello World" version look like? What's the first thing that proves the build is on track?
3. Identify external dependencies (API keys, OAuth, third-party docs, recent platform changes — verify currency via WebSearch if the tech is fast-moving).
4. Surface architectural decisions that need Thomas's call (defaults, behaviors, opt-in vs opt-out, etc.).

**Gate to Phase 3:** Thomas confirms the spec is what he wanted. Architectural decisions resolved.

### Phase 3 — Partitioning

The "who/where/when does each piece happen" phase. Output: a parallel execution plan.

**Steps:**

1. Decompose the spec into discrete tasks. Each task has:
   - **cwd** (where it runs — product root)
   - **files claimed** (exact paths, exclusive)
   - **migrations claimed** (numbered, exclusive)
   - **dependencies** (which other tasks must finish first)
   - **parallel-with** (which tasks can run concurrently)
   - **verification recipe** (how to know this task is done)
2. Verify **non-overlapping partitions** — no two parallel tasks claim the same file or migration number. This is the hard rule that makes parallelization work.
3. Group tasks into **execution rounds**. Round N = all tasks whose dependencies are in earlier rounds.
4. Write the partition document at `docs/superpowers/plans/YYYY-MM-DD-<name>-partition.md` (or product-local equivalent).
5. List the **20-step end-to-end smoke test** that exercises the whole build once shipped.

**Gate to execution:** Thomas confirms the partition. Then dispatch — a single message with one Agent per parallel task in Round 1, with hard exclusivity rules in each prompt.

---

## The 6-point methodology (operates throughout all phases)

### 1. Verification loops (the 200-300% quality multiplier)

Every non-trivial change states the verification approach BEFORE the change, and runs it before declaring done. Verification is **domain-specific**:

- UI changes → start dev server, hit the route, confirm correct render for the right tier
- DB migrations → apply via MCP, run sanity SELECT, run `npx tsc --noEmit` to catch type drift
- Agent changes → POST test message, confirm response shape + context injection rules
- Cron/webhook → `curl` with auth, confirm 200 + side effect (DB row, Discord post)
- Brand-voice content → side-by-side compare against the locked voice rules
- Financial calc → sanity-check against a known case before live data

**Retrospective validation:** at the end of each phase, ask "did the output actually solve the question I started with?" — not "did the steps execute cleanly."

### 2. Parallelization via non-overlapping partitions

Multiple Agents in one message — but only when their file/migration claims don't overlap. The exclusivity rule is the unlock. Rounds 1-N are gated by dependency chains; within a round, fan out as wide as the partition allows.

Anti-pattern: spawning agents on the same file → merge conflicts and silent overwrites.

### 3. Inner loop systematization

If a workflow runs more than 3 times, codify it. Two formats:

- **Slash command** (project `.claude/commands/<name>.md`) — for one-off triggers in one product
- **Skill** (this directory: `.claude/skills/<name>/SKILL.md`) — for cross-product or substantive workflows

The build-cycle skill itself is the canonical example: this file replaces the ad-hoc "I'll just start building" pattern.

### 4. Information mode — never bet against the model

The most leveraged work is improving the **data, structure, and current-state files** Claude reads — not tuning prompt wording. When choosing between "tighten the agent prompt" and "tighten the BRAIN.md it reads," tighten BRAIN.md.

Corollary: when a build is going sideways, the bug is almost always in the input context, not the model output. Look at what's being fed in before tweaking the prompt.

### 5. Currency check on fast-moving tech

For platform/API integrations, verify the current state via WebSearch before writing code. Examples that have bitten this project:
- Spotify API removed Popularity Score field (Feb 2026)
- Apple Music Connect 2026 launched (Feb 26, 2026)
- Gemini 3 Flash GA + thinking_level + multimodal Function Responses (April 2026)
- Bandcamp anti-AI policy (Jan 2026)

Stale tech assumptions waste rounds. One WebSearch up front prevents 4 hours of debugging the wrong API.

### 6. Cost-aware delegation

Claude orchestrates. Before doing the work yourself, ask: *can this be delegated without losing quality?*
- **Gemini (free):** bounded tasks with clear DoD — installs, scaffolding, syntax work, applying a spec
- **Ollama (free):** repetitive high-volume work — categorize 500 rows, bulk doc cleanup
- **Claude direct:** cross-file architecture, brand-voice content, security/financials, sub-agent orchestration
- **Never delegate:** live customer email/send, prod migrations, live financial calc, DBA `safety_gates`

Delegation mechanics: `docs/DELEGATION_PLAYBOOK.md`.

---

## Quick reference — the 4 alignment questions

When Thomas says "build" and you haven't aligned yet, stop and ask:

> Before we start building, I need to align on this:
> 1. What is the core problem this solves?
> 2. Who is this for?
> 3. What does success look like?
> 4. What should this NOT do?

Don't proceed until all 4 have answers. The 2026-05-05 incident locked this in: jumping to build without these 4 questions is the failure mode this skill exists to prevent.

---

## When NOT to run this skill

- Single-file edits, typo fixes, copy changes
- Bug fixes with a known root cause and bounded blast radius
- Adding a single field to an existing schema
- Skill / config / `.md` cleanup that's already scoped

For those: just do the work. The build-cycle is for **new surfaces, rebuilds, or features touching 3+ files / 2+ subsystems**.

---

## Output artifacts (what the skill produces)

- `docs/superpowers/specs/YYYY-MM-DD-<name>.md` — the alignment + spec (Phases 1-2)
- `docs/superpowers/plans/YYYY-MM-DD-<name>-partition.md` — the partition + execution plan (Phase 3)
- A single message with N parallel-Agent dispatches for Round 1
- BRAIN.md SSoT index updated to reference both new artifacts

Cross-reference the canonical example: [2026-05-05-tenx10-rebuild-partition.md](../../../docs/superpowers/plans/2026-05-05-tenx10-rebuild-partition.md).
