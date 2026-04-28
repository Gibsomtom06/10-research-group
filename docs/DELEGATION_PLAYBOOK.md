# Delegation playbook — Claude → Gemini → Ollama

The economics: Claude is the most expensive per-token resource. Gemini Code Assist is free on Thomas's existing plan. Ollama is free forever. Every non-essential task Claude does itself is money wasted.

This doc covers **how** to delegate — templates, setup, return formats.

---

## Tier 1 — Gemini Code Assist (VS Code)

### When to reach for Gemini

Gemini runs inside VS Code, sees the open workspace, can write files and run terminal commands. Best for:

- Running commands (`npm install`, `pip install`, migrations, tests)
- Verifying file structure (does file X exist, does it compile, does it match spec)
- Scaffolding boilerplate (new component, new route, new test file from a template)
- Applying a spec already written by Claude (Claude writes the PRD, Gemini implements)
- Git operations (stage, commit with a message, push to a branch)
- Linting, formatting, simple type fixes

### When NOT to reach for Gemini

- Architecture decisions
- Cross-file refactors where context matters
- Anything customer-facing (pitch emails, site copy)
- Security-sensitive code (auth, env handling, safety gates)
- Any work where Claude has nuanced context from the current session

### Gemini handoff template

Claude writes a `GEMINI_HANDOFF.md` file in the project folder. Structure:

```markdown
# Gemini handoff — <task name>

**Full spec:** point to any spec/PRD/DEPLOYMENT doc that has deeper context.

**Your lane:** one sentence. What Gemini is responsible for.

**Not your lane:** bullet list of things explicitly off-limits (usually things
Claude is handling in parallel or things that are risky to automate).

---

## Step 1 — <name>
<exact commands or instructions>

## Step 2 — <name>
...

## Step N — Report back

When done, reply to Thomas with exactly this block:

\`\`\`
GEMINI_<TASK>_DONE
- <check item>: yes/no
- <check item>: yes/no
- any errors: <paste them>
\`\`\`

Thomas pastes that into Cowork chat so Claude picks up from there.

---

## Do NOT

- <explicit thing>
- <explicit thing>

## If something fails

Paste the full error into chat for Thomas and stop. Do not retry with variations.
```

### Paste-in prompt for Thomas to give Gemini

> Open `<path to GEMINI_HANDOFF.md>` and follow every step in it exactly. Do not skip any. Do not do anything outside the scope defined in that file. Report back in the exact format at the bottom when done.

### Return-to-Claude format

The sub-agent returns a single code block Thomas pastes into Cowork:

```
GEMINI_<TASK>_DONE
- <item>: yes/no/value
- any errors: <paste>
```

Claude reads it and continues without re-doing the work.

---

## Tier 2 — Ollama (local models)

### Purpose

For repetitive, bounded work where quality tolerance is moderate and we don't want to spend Claude tokens. Runs 100% locally, free, no API limits.

### One-time setup (Thomas runs this once)

```powershell
# 1. Install Ollama
# Windows: download from https://ollama.com/download
# Verify:
ollama --version

# 2. Pull a coding model (recommend qwen2.5-coder:7b for speed, 14b for quality)
ollama pull qwen2.5-coder:14b

# Alternate: deepseek-coder-v2 for serious code work
# ollama pull deepseek-coder-v2:16b

# 3. Smoke test
ollama run qwen2.5-coder:14b "write a python function that returns the first n primes"

# 4. (Optional) Install Continue.dev in VS Code for in-editor Ollama use
# https://marketplace.visualstudio.com/items?itemName=Continue.continue
```

Claude will write this as a `OLLAMA_SETUP.md` the first time it needs it.

### Ollama batch template

Claude writes a `OLLAMA_BATCH.md` that defines:

- The input file (e.g., `_staging/raw_contacts.csv`)
- The per-item prompt (what to do with each row)
- The output format (JSON schema or CSV columns)
- The output file path
- A sample of 3 items done by Claude so Ollama has a concrete reference

Then Claude writes an `ollama_batch.py` runner script that:

```python
# pseudo
import ollama, json, csv
for row in rows:
    prompt = template.format(**row)
    resp = ollama.chat(model="qwen2.5-coder:14b", messages=[{"role":"user","content":prompt}])
    write_output(row, resp)
```

Thomas runs the script. Claude reviews a 10% sample of output before accepting it.

### When Ollama beats Gemini

- Volume >50 items
- You need the output as structured data (CSV/JSON) rather than freeform
- You want to keep sensitive data local (contacts, emails, customer data)

### When Gemini beats Ollama

- Task requires tool use (git, terminal, file edits in context of project)
- You want the work visible in VS Code as it happens
- Volume <20 items

---

## Token accounting

Rough ratios (order of magnitude, not exact):

| Resource | Per-task cost | Best for |
|---|---|---|
| Claude Opus / Sonnet | 1x | architecture, brand voice, synthesis |
| Gemini Code Assist | ~0 (free on your plan) | apply spec, run commands, scaffolding |
| Ollama local | ~0 (hardware only) | volume tasks, batch processing |

**Rule of thumb:** if Claude has to write more than 50 lines of boilerplate, stop — write a 10-line spec and delegate.

---

## Escalation back to Claude

Sub-agents return to Claude when:

- They hit an error they can't resolve
- The task definition is ambiguous
- They'd need to touch a red-flag area (see CLAUDE.md)
- Output needs review before it ships

Claude picks up the thread from the return-format block and continues.

---

## Worked examples

### Example 1 — DBA Phase 2 (current)

- File: `products/digital-booking-agent/GEMINI_HANDOFF.md`
- Scope: npm install, pip install, file checks, AST compile check
- Claude kept: Phase 1 (Supabase browser work via Chrome MCP), Phase 3 (Google Takeout kickoff)
- Why split this way: browser work needs Chrome MCP (Claude's); installs are pure command-running (Gemini's)

### Example 2 — Hypothetical contact categorization (future)

- 2,000 contacts in Gigwell CSV need to be tagged by market tier (A/B/C)
- Claude writes 20 canonical examples + criteria
- Ollama runs qwen2.5-coder:14b against all 2,000 with that prompt + examples
- Claude reviews 200 random outputs; if >95% match criteria, accept
- Saves ~$X of Claude tokens vs. doing it in chat

---

## This playbook is a living doc

Update it whenever a delegation pattern works well or fails. Record the failure mode in a "lessons learned" section so future sessions don't repeat it.
