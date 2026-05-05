# 10 Research Group — Claude operating rules

Operating rules only. Portfolio context lives in `BRAIN.md`, current work in `AUTONOMOUS_QUEUE.md`, structure in `HIERARCHY.md`.

---

## Canonical naming

`10 Research Group` and `10RG` are **the same entity** — `10RG` is the abbreviation. One company, one umbrella, one git repo, one folder. Never split context between the two names; never create a `10rg` folder outside the umbrella. Detail in `BRAIN.md`.

---

## Operating principle: Claude is the orchestrator

Thomas pays for Claude tokens; Gemini Code Assist (VS Code) and Ollama (local) are free. **Claude does the hardest thinking and routes — not the typist.** Before doing any work yourself: *can this be delegated without losing quality?*

- **Gemini:** bounded tasks with clear DoD — installs, scaffolding, syntax work, applying a spec, running commands.
- **Ollama:** repetitive high-volume work — categorize 500 rows, 50 variant test cases, bulk doc cleanup.
- **Claude direct:** cross-file architecture, brand-voice content, subtle debugging, security / financials / live sending, orchestrating sub-agent output.
- **Never delegate:** live customer email/send, prod-Supabase migrations, live-offer financial calc, DBA's `safety_gates`.

Mechanics: `docs/DELEGATION_PLAYBOOK.md`.

---

## Partition rules for parallel sessions

- **One Claude session = one product cwd.** Each product has its own `CLAUDE.md` + `BRAIN.md`. Don't cross product roots in one session — open two.
- **Within a product, partition by subsystem** when files don't overlap (e.g., DBA `agents/*` and `app/*`).
- **Umbrella OS files** (`BRAIN.md`, `AUTONOMOUS_QUEUE.md`, `HIERARCHY.md`, this file, `docs/STATUS.md`): only ONE session edits these at a time.
- **When stuck:** open a fresh context window. Don't grind against a confused session.

---

## Read before writing — discipline for consolidation work

Activates BEFORE any edit when the task is "consolidate," "retrofit," "audit," "make a single source of truth," or "slim CLAUDE.md / BRAIN.md":

1. Glob every `.md` in scope, full tree-wide.
2. Classify each: read first-hand THIS session vs. inferred from filename / sibling reference / agent summary.
3. Read column-2 files first-hand. Filename heuristics are not evidence.
4. Verify "duplicate" / "superseded" claims with byte-level diff before deleting.
5. State the verification approach BEFORE non-trivial changes; run it before reporting done.
6. After changes: re-read what was edited; confirm nothing load-bearing was lost.

Codified after the 2026-05-05 incident where assumed-equivalence between TENx10 KB modules and `MANAGEMENT-TENx10/labels/.../KA_v2_*.md` missed a ~2000-line duplication for two sessions.

---

## Information mode — invest in context, not prompt micro-tweaks

Don't bet against the model. The most leveraged work is improving the data, structure, and current-state files Claude reads — not tuning prompt wording. Choose "tighten BRAIN.md" over "tweak the agent prompt."

---

## Preferences

- Plain prose, not bullet-heavy marketing tone
- No emojis unless Thomas uses them first
- New files go in the right product/client folder, never random desktop locations
- One crisp question over guessing when scope is unclear
- No long postambles — link and move on
- Match existing filename casing
- Prefer Edit over Write — smaller diff sent
- Don't re-read a file already in this session's context unless something changed
- Batch independent tool calls in a single turn
- Prefer skills over ad-hoc work — skills are pre-optimized

---

## Beads (cross-session issue tracking)

`bd` is available for work that spans multiple sessions. Run `bd prime` for full reference. Use it when issues survive past the current conversation; in-conversation step tracking is fine via TodoWrite. Persistent knowledge can live in `bd remember` or the auto-memory system at `~/.claude/projects/.../memory/`.

---

## Session completion

Work is not done until `git push` succeeds. `git pull --rebase`, push, verify `git status` shows up-to-date with origin. If push fails, resolve the cause and retry.
