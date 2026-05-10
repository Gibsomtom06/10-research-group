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
10 Research Group/                  ← umbrella git repo (Gibsomtom06/10-research-group, private)
  BRAIN.md                          ← this file (top-level operating system)
  products/
    tenx10-platform/BRAIN.md        ← READ-ONLY MIRROR of the platform repo
                                       active dev clone: C:\Users\slash\Projects\tenx10\
                                       sync via scripts/sync_tenx10_mirror.ps1
    digital-booking-agent/BRAIN.md
    rim-shop/BRAIN.md               ← client work (WRS)
    system-steward/                  ← local Python utilities
    trading-shadow/BRAIN.md
    mhp/BRAIN.md                    ← stub only — content moved to I:\My Drive\02-MyHydrationPack\
  MANAGEMENT-TENx10/                ← TENx10 the BUSINESS (management company). Reorg'd 2026-04-29 — was previously bare TENx10/ at the umbrella root.
    BRAIN.md                         ← written 2026-04-30 (full roster, booking team, commission structure)
    labels/
      DirtySnatcha Records/BRAIN.md
    artists/
      dirtysnatcha/BRAIN.md
      whoisee/BRAIN.md
      dark-matter/BRAIN.md
      kotrax/BRAIN.md
      hvrcrft/BRAIN.md
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
| Business chart (entities, status, roster) | `BUSINESS_HIERARCHY.md` |
| Rolling status / autonomous backlog | `AUTONOMOUS_QUEUE.md` (replaces former `STATUS.md` reference) |
| Autonomous-mode dispatch contract | `AUTONOMOUS_MODE_PROTOCOL.md` |
| Delegation playbook (Gemini, Ollama) | `docs/DELEGATION_PLAYBOOK.md` |
| **Employee Directory (current agent roster + status)** | `EMPLOYEE_DIRECTORY.md` ← updated 2026-04-30 |
| **Skill Directory (current skills + locations)** | `SKILL_DIRECTORY.md` ← new 2026-04-30 |
| **Build-cycle skill (Alignment → Translation → Partitioning)** | `.claude/skills/build-cycle/SKILL.md` ← new 2026-05-05 |
| **Factory architecture (CURRENT)** | `docs/superpowers/specs/2026-04-27-factory-architecture-design.md` |
| **Trading shadow A/B test spec** | `docs/superpowers/specs/2026-04-27-trading-shadow-test-design.md` |
| **Trading shadow implementation plan** | `docs/superpowers/plans/2026-04-27-trading-shadow-implementation.md` |
| **TENx10.co full rebuild — partition + execution plan (2026-05-05)** | `docs/superpowers/plans/2026-05-05-tenx10-rebuild-partition.md` |
| **Content / meme generation framework (3-folder system)** | `docs/superpowers/specs/2026-05-05-content-meme-generation-framework.md` |
| **AI Studio prototype extraction (early TENx10 prototype)** | `docs/superpowers/specs/2026-05-05-aistudio-prototype-extraction.md` |
| **DSR release organizer (per-release Drive workflow)** | `docs/superpowers/specs/2026-05-06-dsr-release-organizer.md` |
| **TENx10 action-surface audit (per-page row-action gap, 2026-05-09)** | `docs/superpowers/specs/2026-05-09-tenx10-action-surface-audit.md` |
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

### Superseded — moved to `_archive/superseded/` 2026-05-04

- `FACTORY_BRAIN.md` → `_archive/superseded/FACTORY_BRAIN.md` (legacy 12-worker factory architecture; superseded by the 2026-04-27 architecture spec above)
- `SKILL_LIBRARY.md` → `_archive/superseded/SKILL_LIBRARY.md` (duplicate of `SKILL_DIRECTORY.md`)
- `CLAUDE_CODE_REORG_PROMPT.md` → `_archive/superseded/CLAUDE_CODE_REORG_PROMPT.md` (one-time reorg prompt; reorg complete)

### Dated reports — moved to `_archive/reports-2026-04-30/` 2026-05-04

- `TONIGHT_SUMMARY_2026-04-30.md`, `HOMEPAGE_CLEANUP_REPORT_2026-04-30.md`, `_AUDIT_2026-04-30.md`, `_INVENTORY_DESKTOP_AND_HOME_2026-04-30.md`, `_MOVE_LOG_LEGAL_2026-04-30.md`, `_READ_FIRST_WHEN_YOU_WAKE_UP.md`

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

**DONE 2026-04-29:** `artists/` and `labels/` moved to `MANAGEMENT-TENx10/artists/` and `MANAGEMENT-TENx10/labels/`. The bare `tenx10/` clone at the umbrella root (was a stale platform clone, NOT a real management folder) was archived to `_archive/stale-clones/tenx10-cc65688-stale-clone/`. Lowercase duplicate `labels/dirtysnatcha-records/` merged into `DirtySnatcha Records/` and archived.

**DONE 2026-04-30:** `MANAGEMENT-TENx10/BRAIN.md` written from scratch — covers the management business: roster (5 artists), booking team (Andrew Lehr / Colton Anderson), active tour state (TMTYL 2026 + Electric Forest + Lost Lands), commission structure (10/10/80 agent-routed, 20/80 direct).

**DONE 2026-05-04:** `Projects\tenx10\` (off-OneDrive) confirmed as the active dev clone for the platform repo. `OneDrive\products\tenx10-platform\` retained as a read-only mirror to keep the umbrella's gitlink reference + browse-mode search consistent. Sync via `scripts/sync_tenx10_mirror.ps1`. Workspace `10-research.code-workspace` opens the standalone clone, not the mirror.

**DONE 2026-05-04:** Umbrella backed up to GitHub for the first time (private repo `Gibsomtom06/10-research-group`). Was previously OneDrive-only. 9 chunked commits pushed: security cleanup, governance docs, reports, MGMT reorg, naming canonicalization, MHP migration, archive cleanup, trading-shadow updates, gitlink sync.

**DONE 2026-05-05 → 2026-05-10 (umbrella + tenx10 platform shipments):**
- 2026-05-05: CLAUDE.md prune across umbrella + tenx10 + .claude (-52% / -62%). Build-cycle skill added. Tenx10 rebuild partition plan written.
- 2026-05-05: Phase-0c MGMT consolidation — scattered DSR artifacts filed into `MANAGEMENT-TENx10/`.
- 2026-05-06: Oracle Cloud VM live (`tenx10-dev-amd`, AMD E2.1.Micro Always Free, Ashburn AD-1, `ssh tenx10-dev`). Polling launcher in `scripts/oracle/launch-a1-when-available.sh` for the 4-OCPU/24-GB A1 ARM until capacity opens.
- 2026-05-06: Tenx10 dashboard bird's-eye redesign + `/dashboard/deals` consolidation + ArtistSwitcher across 5 pages + roster aggregation everywhere.
- 2026-05-06: Tenx10 booking-agent inbound — PDF-aware ingest + 11-step decision engine (KB Module 29).
- 2026-05-06: Migration 047 release-as-project + 048 festivals.
  - **CORRECTION 2026-05-10:** earlier ship-log entries claimed migrations 023 = `live_perf_registrations`, 036 = `signing_label/management_only`, 038 = ISRC reconciliation. Per the 2026-05-10 ledger reconciliation: 023 is `dsr_data_artists`; `live_perf_registrations` was applied separately (no numeric prefix); 036 and 038 NEVER SHIPPED. 12 prod migrations applied via MCP without on-disk files have been dumped into `Projects/tenx10/supabase/migrations/999_applied_directly_via_mcp/` for the ledger.
- 2026-05-07: Tenx10 booking-agent outbound (PR #4–#11) — proactive moves cron, manual run trigger, warm/cold pitch, two-step roster lookup, persist-moves fix, RLS recursion fix. Migration 049 outbound_moves + 050 artist_members admin recursion.
- 2026-05-07: Trading-shadow Lane 3 lifted off the $5/trade cap → real-money scale; cheaper model + credit circuit breaker; leveraged ETFs (TQQQ/SOXL/SQQQ) at 3x amplification; 75% confidence gate + 2:1 R:R + smart sell signals; options on Alpaca (paper-only ATM calls + puts).
- 2026-05-08–09: DSR Run The Game contract finalized + Dropbox Sign send pipeline (`_send_contract.cjs` / `_wrap_html.cjs`). RELEASE_CHECKLIST_TEMPLATE per release. `scripts/release/` (confirm_release + drive_shortcut helpers). Spec at `docs/superpowers/specs/2026-05-06-dsr-release-organizer.md`.
- 2026-05-09: `scripts/lyric-flagger/` explicit/language detection pipeline (Spotify API + LRCLIB / yt-dlp + faster-whisper). Per-artist vocab files address Whisper's plausible-but-wrong failure mode.
- 2026-05-09: `MANAGEMENT-TENx10/clients/` per-artist working folders (DSR offers, HVRCRFT spotify-daily + s4a-export, WHOiSEE rider). `s4a-auth.json` gitignored locally.
- 2026-05-09: Tenx10 Gmail OAuth persistence fix (service-role client for refreshed tokens; refresh_token preserved on re-consent).
- 2026-05-09: TENx10 action-surface audit — per-page row-action gap spec written (`docs/superpowers/specs/2026-05-09-tenx10-action-surface-audit.md`). Diagnosis: TENx10 is a viewer not an action surface; rule is "every visible row needs a button that does the thing." Spec covers per-page audit, schema gaps, agent tool registry, P0/P1/P2 phasing.
- 2026-05-10: TENx10 action-surface Phase 1 shipped (commits `1dd2f63` / `5deb2d4` / `575b356`, push `0df778d..575b356` → Vercel). Outbound moves row actions + PATCH endpoint; shared `<DealRowActions/>` on home Inbox + briefing + deals/Today; briefing inline Mark done + Draft response; outreach +Add & pitch on Promoter Research + Weekday Finder + pitch_status dropdown on PitchCard; artists row Spotify daily drawer + per-artist filter shortcuts. Phase 2 (Spotify→Supabase mirror, tasks.snoozed_until, BMI Live / ASCAP OnStage row actions, Add to Calendar) queued in `AUTONOMOUS_QUEUE.md`.
- 2026-05-10: **Strategic decision — DBA absorbed into TENx10 platform.** Digital Booking Agent (`products/digital-booking-agent/`) is no longer a standalone SaaS path; logic consolidates into TENx10's booking-agent module. Booking Agent v2 B1/B2/B3 work already in flight is the consolidation path. Removes territorial overlap, one codebase. DBA repo archives to `_archive/superseded/` after porting (any DBA-specific logic that isn't already in tenx10/booking-agent).
- 2026-05-10: **Strategic decision — Management primary GTM, 21-day build cycles.** TENx10 the management firm is the product. Platform is internal tooling that exists to make Thomas's management work scalable. Stripe / multi-tenant / public signup are NOT P0; sign-up gets demoted to a footer link only on tenx10.co. Build cadence: 21-day cycles (Cycle 1 = 2026-05-10 → 2026-05-31). Forcing function: Wednesday 2026-05-13 networking event — platform needs to read as "the operating system I built to run my management company" by then.
- 2026-05-10: Discord Xai live Supabase context shipped (commits `84dccf5` chat-bridge + `5c765a1` vm-sync sudo fix). `_build_xai_live_context_sync()` mirrors `route.ts:138 buildManagerContext` — pulls 8 artists / 15 confirmed shows / 10 pipeline negotiations / 10 tasks / $55,400 90-day revenue per turn. 5-min per-channel TTL cache. ~580 extra input tokens/turn (~$0.0017 per turn at Sonnet 4.6 prices). VM `chat-bridge.service` running with `live-supabase` mode active. Verification: Thomas sends a test message in #briefing.
- 2026-05-10: TENx10 action-surface Phase 2 shipped (commits `a44634f` / `6860eef` / `36e9de6` / `156634a` on tenx10 master). Migration 057 `spotify_daily_snapshots` + 058 `tasks_snoozed_until` applied to prod (versions `20260510174955` / `20260510175419`). HVRCRFT 3 snapshots backfilled — Spotify drawer now works on Vercel for HVRCRFT; DirtySnatcha + WHOiSEE need source data captured before their drawers populate. Live-performance row actions surface live at `/dashboard/publishing/live-performance` (Open BMI Live / ASCAP OnStage / SOCAN portal + clipboard prefill of `Artist | Date | Venue | City, ST`, Mark registered, Skip, Reset). Snooze 24h on briefing task rows. Migration ledger reconciliation complete — README at `supabase/migrations/README.md`. Phase 3 schema discovery: real `live_perf_registrations` schema differs from spec (table empty in prod; clean re-migration still cheap). Spotify Web API has no public `monthly_listeners`; migration 057 stores `popularity` (0-100) + nullable `monthly_listeners` for forward-compat S4A.
- 2026-05-10: Wednesday networking event positioning — homepage SaaS CTAs demoted (commit `6f6e0b8`), roster page rewritten with 5-card stage-name-only listing.
