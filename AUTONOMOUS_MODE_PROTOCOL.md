# Autonomous Mode Protocol

**Purpose:** When Thomas steps away or signals autonomous mode, this is the procedure. No improvisation.

**Last updated:** 2026-04-30

---

## Trigger phrases

Any of these phrases from Thomas activate the protocol:

- "autonomous mode"
- "autonomous"
- "while I'm away" / "while im away"
- "while I sleep" / "while i sleep"
- "overnight"
- "go figure it out"
- "just go" / "run with it"
- "I'm out for [time]"
- "be back in [time]"

When triggered: STOP foreground work. Execute this protocol. Then return.

---

## The 7-step protocol

### Step 1 — STOP foreground work

Do not finish what you were typing. The signal is: dispatch first, return to foreground after.

### Step 2 — Read AUTONOMOUS_QUEUE.md

The live backlog at umbrella root. Has READY / BACKLOG / BLOCKED / DONE columns.

### Step 3 — Audit pending work across 5 sources

Don't trust the queue file alone. Cross-check:
1. `AUTONOMOUS_QUEUE.md` — explicit backlog
2. Current TodoWrite list (this session)
3. CLAUDE.md TASKS section + project CLAUDE.md files
4. Memory entries (`MEMORY.md` index)
5. Recent BRAIN.md files for "open work" sections

Anything in any of those that's parallelizable goes into the dispatch batch.

### Step 4 — Classify each task

| Class | Definition | Action |
|---|---|---|
| **Parallelizable** | Independent of other tasks; can run in own subagent without coordination | Dispatch |
| **Sequential** | Depends on output of another task | Wait, then dispatch when unblocked |
| **Blocking** | Needs Thomas's input/decision | Add to BLOCKED column, surface in summary |
| **Foreground-only** | Requires conversation with Thomas | Skip in autonomous mode |

### Step 5 — Pick the right model per task

| Task type | Model | Why |
|---|---|---|
| Read-only inventory / classification / search | haiku | Cheap; dispatchable work |
| Code generation / file routing / migration writing | sonnet | Balance of capability and cost |
| Architecture decisions / hard reasoning / cross-file refactor | opus | When sonnet might miss subtleties |

Default to haiku unless the task requires more. Cost matters — model router exists for a reason.

### Step 6 — Dispatch ALL parallel agents in a SINGLE message

This is the critical mechanic. Multiple `Agent` tool calls in ONE response → they actually run concurrently.

If you call them in separate messages, they run sequentially. **Wrong.**

Each subagent prompt MUST be self-contained:
- Goal stated up front
- Files/paths referenced explicitly
- Hard rules (no force-push, no .env touch, no destructive ops without confirm)
- Output format (where to write report, what filename)
- Run-mode (`run_in_background: true` for long-running)

### Step 7 — Stamp the arrival summary

After dispatch, tell Thomas in ONE message:
```
Dispatched N agents in autonomous mode:

1. [name] (model, ~ETA) — agent ID — purpose
2. [name] (model, ~ETA) — agent ID — purpose
...

Will surface completions as they land. Foreground available for guidance.
```

Then update `AUTONOMOUS_QUEUE.md` HOT column.

---

## Blast radius rules

Before dispatching, audit each agent's blast radius:

- **Zero (read-only)** — fine, dispatch immediately
- **Low (additive: new files, new DB tables, new commits)** — fine if work doesn't conflict with parallel agents
- **Medium (modifies existing files)** — only if file scope doesn't overlap with other parallel agents
- **High (deletes, force-pushes, destructive)** — NEVER in autonomous mode without prior Thomas approval

If in doubt: have the agent PROPOSE the change (write a report) rather than execute. Thomas approves on return.

---

## Anti-patterns — never in autonomous mode

- ❌ Dispatching one agent and calling it "autonomous"
- ❌ Doing foreground work between dispatches (you're stalling — dispatch first)
- ❌ Sequential dispatches across multiple messages
- ❌ Force-push, hard-reset, --no-verify, .env edits
- ❌ Assuming silence = continue. If Thomas types anything, READ IT before next action.
- ❌ Letting subagents touch files another subagent is editing (conflict risk)
- ❌ Dispatching without specifying `run_in_background: true` for long tasks (you'll block on them)

---

## Pattern — example dispatch (the good shape)

```
[Single message with 4 Agent tool calls in parallel]

Agent 1: subagent_type=general-purpose, model=sonnet, run_in_background=true
  prompt: "Migrate DSR_CLEAN_DATABASE.xlsx to Supabase. Read schema from
           [path]. Write supabase/migrations/021_*.sql. Apply via MCP.
           Generate INSERT statements for 514 rows. Verify. Report at
           [path]/MIGRATION_REPORT.md. No destructive ops."

Agent 2: subagent_type=general-purpose, model=haiku, run_in_background=true
  prompt: "Inventory Google Drive. Use mcp__claude_ai_Google_Drive__*.
           Find non-canonical Sheets/Docs at root. Classify (duplicate,
           draft, abandoned, ops). Write report at [path]/DRIVE_SWEEP.md.
           Read-only — do not move/delete anything."

Agent 3: ...
Agent 4: ...
```

After dispatch in single message, all 4 run concurrently.

---

## Recovery — when an agent fails

- If subagent reports failure: log to `AUTONOMOUS_QUEUE.md` BLOCKED with the error
- If subagent permission-fails: switch to general-purpose subagent (has all tools)
- If subagent hallucinates paths: stop, verify with Glob/Bash, restart with corrected paths
- Never blindly retry — diagnose root cause first

---

*v1 — 2026-04-30. Lives at umbrella root. Read on every autonomous-mode trigger.*
