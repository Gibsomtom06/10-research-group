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
    tenx10-platform/BRAIN.md        ← TENx10 the PLATFORM (the SaaS product)
    digital-booking-agent/BRAIN.md
    rim-shop/BRAIN.md               ← client work (WRS)
    system-steward/                  ← local Python utilities
    trading-shadow/BRAIN.md
    mhp/BRAIN.md
  MANAGEMENT-TENx10/                ← TENx10 the BUSINESS (management company). Reorg'd 2026-04-29 — was previously bare TENx10/ at the umbrella root.
    BRAIN.md                         ← (TODO: write fresh management business BRAIN — old tenx10/BRAIN.md was a stale platform clone, archived to _archive/stale-clones/)
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

## Capitulate and Cultivate (the strategic principle)

We **rent** foundation models from Anthropic (Claude) and Ollama (local). We do NOT try to build models or compete with frontier labs — that's capitulation. **Our moat is what we build ON TOP of the rented models:**

1. **The orchestration layer** — Factory Boss, Department Leads, Subs, the routing logic, the guardrails, the human-in-loop checkpoints
2. **The conversation corpus** — every Thomas ↔ Claude session auto-logs to `data/conversation_log/` (since 2026-04-27). This corpus is uniquely ours; no competitor has it. It captures Thomas's decision patterns, business judgment, what gets rejected and why.
3. **The per-project BRAIN.md files** — the operational context for every business unit, written in Thomas's voice. Subagents read these to act in-character.
4. **The shadow team** — Ollama agents that learn from the corpus + task execution and graduate to handle work independently. Drives marginal cost toward zero.

**Practical implication:** never build something a frontier lab will commoditize in 6 months. Build everything that's specific to Thomas's businesses, his voice, his judgment, his portfolio. The model layer changes; the orchestration + corpus + brains + shadows do not.

This principle was identified in the 2026-04-28 strategic review (`docs/superpowers/specs/2026-04-28-strategic-review-and-gaps.md`) and made explicit here per Brain Gap #3.

---

## What BRAIN means

Thomas calls these files "brain." In other contexts you may see:
**project brief / context file / north star doc** — same thing.

---

## Canonical naming — 10 Research Group ≡ 10RG

**There is exactly one entity.** `10 Research Group` is the full canonical name. `10RG` is its only acceptable abbreviation. They refer to the **same** business, the same umbrella, the same git repo, the same OneDrive folder.

- **Not** two separate entities.
- **Not** a parent/child relationship.
- **Not** different products or business units.
- **One thing, two ways of writing it.**

**Usage rule:**
- Documents, prose, contracts, customer-facing copy → `10 Research Group`
- File paths, code identifiers, scheduled-task names, kebab/snake-case where space is awkward → `10rg` / `10RG` / `10-research-group`
- GitHub repo: `Gibsomtom06/10-research-group` (kebab-case full name)

If you ever see a file, folder, doc, or system that treats `10rg` as something distinct from `10 Research Group`, that artifact is wrong and must be corrected. There is no `10rg/` folder, no `10rg` product, no separate company by either name. **Don't create one.**

---

## Unified Observability — the agent contract

To prevent **Orchestration Debt** (the risk identified in the 2026-04-28 strategic review where multiple in-flight agent systems each get their own JSONL/runner/Discord pattern), every agent in the Factory MUST report in a unified shape.

**Required fields per agent invocation:**

| Field | Required | Notes |
|-------|----------|-------|
| `timestamp` | ✅ | ISO-8601 UTC |
| `agent_id` | ✅ | Unique within the Factory (e.g. `cmo`, `trader-track-a`, `inbound-classifier`) |
| `agent_layer` | ✅ | `L1` / `L2` / `L3` / `L4-shadow` |
| `project` | ✅ | Which Layer-4 project the work is for (TENx10, DSR, MHP, etc.) |
| `task_id` | ✅ | UUID for the task run; subagents inherit and append |
| `status` | ✅ | `started` / `succeeded` / `failed` / `requires_approval` / `rolled_back` |
| `output_summary` | optional | One-line summary of the result |
| `output_pointer` | optional | File path / DB row ID / URL where full output lives |
| `cost_tokens` | ✅ for LLM agents | Input + output token counts |
| `cost_usd` | ✅ for LLM agents | Estimated USD cost of the call |
| `error` | required when status=failed | Exception message + stack trace pointer |
| `parent_task_id` | optional | If invoked by another agent, the parent's task_id |
| `prior_state_id` | optional (Risk #2 mitigation) | For rollback — pointer to the last-known-good state before this action |

**Single observability surface:**

- All agent invocations append to a single store (Supabase table `agent_invocations` OR a unified JSONL at `data/agent_invocations.jsonl`)
- Discord summaries roll up by project + status + cost — one channel, one schema, not one channel per agent
- Cost tracking is unified — The Router (10RG infra agent F per the factory architecture spec) reads from this store to flag bloat

**Enforcement:** the Factory Boss orchestrator will refuse to dispatch to an agent that doesn't write its invocation row. New agent? It implements the contract OR it doesn't ship.

**Practical implication for ANY agent being built right now** (trading-shadow, MHP merch generators, conversation shadow, future TENx10 agents): wire to this contract from day one. Retrofitting is more expensive than getting it right at scaffold time.

This section was added per Brain Gap #4 from the 2026-04-28 strategic review.

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
| **Employee Directory (current agent roster + status)** | `EMPLOYEE_DIRECTORY.md` ← updated 2026-04-30 |
| **Skill Directory (current skills + locations)** | `SKILL_DIRECTORY.md` ← new 2026-04-30 |
| **Audit (current .md inventory across umbrella)** | `_AUDIT_2026-04-30.md` |
| **Factory architecture (CURRENT)** | `docs/superpowers/specs/2026-04-27-factory-architecture-design.md` |
| **Trading shadow A/B test spec** | `docs/superpowers/specs/2026-04-27-trading-shadow-test-design.md` |
| **Trading shadow implementation plan** | `docs/superpowers/plans/2026-04-27-trading-shadow-implementation.md` |
| **Strategic review + gaps audit (2026-04-28)** | `docs/superpowers/specs/2026-04-28-strategic-review-and-gaps.md` |
| **Rollback Handler spec (Trader Sub)** | `products/trading-shadow/ROLLBACK_HANDLER_SPEC.md` |
| **Cutover Runbook (graduation-gated)** | `products/trading-shadow/CUTOVER_RUNBOOK.md` |
| **Discord Bot Setup** | `products/trading-shadow/DISCORD_BOT_SETUP.md` |
| Gary Vee local agency playbook (BACKBURNERED) | `docs/superpowers/specs/2026-04-28-gary-vee-local-agency-playbook.md` |
| Revenue funds trading (BACKBURNERED) | `docs/superpowers/specs/2026-04-28-revenue-funds-trading.md` |
| Personal brand / deepfake / voice mode (BACKBURNERED) | `docs/superpowers/specs/2026-04-30-personal-brand-launch.md` |
| Label catalog evaluator (BACKBURNERED, pursue/kill open) | `docs/superpowers/specs/2026-04-30-label-catalog-evaluator.md` |
| Faceless music channel (BACKBURNERED, pursue/kill open) | `docs/superpowers/specs/2026-04-30-faceless-music-channel.md` |
| DSP playlists + repost chain (Layer 1 ship-ready / Layer 2 BACKBURNERED) | `docs/superpowers/specs/2026-04-30-dsp-playlists-repost-chain.md` |
| Analytics MCP everywhere (BACKBURNERED, pursue/kill open) | `docs/superpowers/specs/2026-04-30-analytics-mcp-everywhere.md` |
| Per-project context | `products/<project>/BRAIN.md` |
| Conversation log (shadow corpus Layer B) | `data/conversation_log/` |

### NOTE on EMPLOYEE_DIRECTORY (updated 2026-04-30)

Earlier audits flagged this as "superseded" — that was wrong. Thomas actively uses it as the at-a-glance roster. As of 2026-04-30 it has been REFRESHED (not archived) to align with the current 5-layer factory architecture. Cross-references the architecture spec for design details + KB Module 24 for persona detail. **Use this file when you want to know which agents exist and what their status is.**

### Superseded — kept for reference, do NOT use as source of truth

- `FACTORY_BRAIN.md` — legacy 12-worker factory architecture. Superseded by the 2026-04-27 architecture spec above.

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

~~`artists/` and `labels/` currently sit directly under `10 Research Group/`. They need to move under `TENx10/` to reflect the actual business structure.~~

**DONE 2026-04-29:** `artists/` and `labels/` moved to `MANAGEMENT-TENx10/artists/` and `MANAGEMENT-TENx10/labels/`. The bare `tenx10/` clone at the umbrella root (was a stale platform clone, NOT a real management folder) was archived to `_archive/stale-clones/tenx10-cc65688-stale-clone/`. Lowercase duplicate `labels/dirtysnatcha-records/` merged into `DirtySnatcha Records/` and archived. The MANAGEMENT-TENx10/BRAIN.md still needs to be written from scratch — there is no real management business BRAIN yet; the old `tenx10/BRAIN.md` was just the platform's BRAIN duplicated into the wrong place.
