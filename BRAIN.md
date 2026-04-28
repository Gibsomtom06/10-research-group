# 10 Research Group — BRAIN (project brief / context file / north star doc)

The operating system for how Thomas and Claude work together.
This is the top-level architecture. Everything else lives under it.

---

## The Workflow

**Thomas talks. Claude routes. Subagents cook. Results hit Discord.**

1. Thomas fires topics rapid-fire — no slowing down, no filtering
2. Claude captures each topic, writes detail to the right BRAIN.md, spawns a subagent
3. Subagent works in the background while Thomas and Claude keep talking
4. Results come back to Thomas via Discord
5. Our shared context stays clean — detail lives in files, not in the conversation
6. Conversation capture: every Thomas ↔ Claude session auto-logs to `data/conversation_log/` for shadow training corpus. Online since 2026-04-27.

Claude never cooks in the main conversation. Claude routes and directs only.

---

## The File System

Every project has one BRAIN.md at its root. That file is the living context for that project — decisions, current state, gaps, what's next. Subagents read it before they work. Claude updates it before leaving a topic.

```
10 Research Group/
  BRAIN.md                          ← this file (top-level operating system)
  products/
    tenx10-platform/BRAIN.md        ← platform build state
    rim-shop/BRAIN.md               ← client work
  TENx10/                           ← management company (to be restructured)
    labels/
      DirtySnatcha Records/BRAIN.md
    artists/
      dirtysnatcha/BRAIN.md
      whoisee/BRAIN.md
      dark-matter/BRAIN.md
      kotrax/BRAIN.md
  ventures/
    comics-resale/BRAIN.md
```

---

## Rules

- Thomas never has to repeat context — it's in the BRAIN.md
- Claude never summarizes what it just did — it just does it and moves on
- Nothing stays in the conversation longer than it needs to — close it out, write it down, move on
- Subagents get the BRAIN.md, not a verbal briefing
- Discord is the async return channel — results always come to Thomas, Thomas never goes looking

---

## What BRAIN means

Thomas calls these files "brain." In other contexts you may see:
**project brief / context file / north star doc** — same thing.

---

## Single Sources of Truth — Index

**Start here when you need to find something.** Every important file is listed below. If a file isn't in this table, it isn't authoritative.

| Topic | File |
|-------|------|
| Operating system / how we work | this file (`BRAIN.md`) |
| Org-level Claude rules | `CLAUDE.md` |
| Folder structure rules | `HIERARCHY.md` |
| Rolling status | `STATUS.md` |
| Delegation playbook (Gemini, Ollama) | `docs/DELEGATION_PLAYBOOK.md` |
| **Factory architecture (CURRENT)** | `docs/superpowers/specs/2026-04-27-factory-architecture-design.md` |
| **Trading shadow A/B test spec** | `docs/superpowers/specs/2026-04-27-trading-shadow-test-design.md` |
| **Trading shadow implementation plan** | `docs/superpowers/plans/2026-04-27-trading-shadow-implementation.md` |
| Per-project context | `products/<project>/BRAIN.md` |
| Conversation log (shadow corpus Layer B) | `data/conversation_log/` |

### Superseded — kept for reference, do NOT use as source of truth

- `FACTORY_BRAIN.md` — legacy 12-worker factory architecture. Superseded by the 2026-04-27 architecture spec above.
- `EMPLOYEE_DIRECTORY.md` — legacy 19-agent roster. Superseded by the new department structure in the 2026-04-27 spec.

When new specs/plans get written, **add them to the table above** before leaving the topic. If it isn't indexed here, it doesn't exist.

---

## Plan Execution

When work is captured in `docs/superpowers/plans/`, the **default** is subagent-driven execution. Never inline-execute a plan in main conversation.

**Sequence:**

1. Brainstorm produces a spec → `docs/superpowers/specs/`
2. Writing-plans converts spec to plan → `docs/superpowers/plans/`
3. **Subagent-driven-development dispatches plan tasks** → fresh subagent per task → results report back via Discord + main thread
4. Claude reviews subagent output between tasks
5. Thomas keeps brainstorming the next thing in main thread while the previous plan ships

Thomas's main thread is for thinking, not typing. Typing happens in subagent threads. This is non-negotiable — it's how token budget gets preserved and how Thomas stays unblocked.

---

## Pending — Folder Restructure

`artists/` and `labels/` currently sit directly under `10 Research Group/`.
They need to move under `TENx10/` to reflect the actual business structure.
This is assigned to a subagent — not done yet.
