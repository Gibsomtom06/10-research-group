# 10 Research Group — Skill Directory

**Last updated:** 2026-04-30 (late, with corrections)
**Companion to:** `EMPLOYEE_DIRECTORY.md` (this file = the skills; that file = the agents that USE skills)

A skill is a discrete capability — a prompt + tool spec + decision tree — that an agent can invoke. Skills live close to the project they serve. This directory indexes them so you can find a skill without crawling folders.

Status: ✅ ACTIVE (current canonical, invokable) · 🟡 PARTIAL (works but missing pieces) · 📦 ARCHIVED (in `_archive/`, NOT invokable until restored) · 📋 PROPOSAL (drafted, not yet wired)

---

## Important corrections (2026-04-30 night)

1. **Andrew Lehr is the correct booking agent name** — Confirmed correct. Previous memory error was fixed 2026-04-30.

2. **`dsr-booking-evaluator` does NOT exist as a live skill.** The 357-line DSR-tuned version is in `_archive/_old_dsr-booking-evaluator-SKILL.md` only. It's NOT at `.claude/skills/dsr-booking-evaluator/SKILL.md`. The current `edm-booking-agent` skill is a generic 100-line EDM persona, not a DSR-tuned operational pipeline. **Restoration needed.**

3. **File auto-corruption is occurring** on Markdown specs as we write them tonight (booking-flow-vision, contacts-inbox-cleanup, the inventory file all rewritten by some local tool/extension/hook with semantic damage — wrong path structures, wrong name expansions). Investigate the source separately.

---

## TENx10 platform skills

Location: `products/tenx10-platform/.claude/skills/`

| Skill | Path | Status | What it does | Invoked by |
|---|---|---|---|---|
| `edm-booking-agent` | `.claude/skills/edm-booking-agent/SKILL.md` (100 lines) | ✅ ACTIVE | Generic EDM/Bass booking persona — vocabulary, industry guarantee tiers, generic radius management. NOT DSR-tuned. | The Deal Maker (L3 Bookings) — but this skill alone is insufficient for actual offer evaluation; needs `dsr-booking-evaluator` restored alongside |
| `meta-ads-analyzer` | `.claude/skills/meta-ads-analyzer/SKILL.md` | ✅ ACTIVE | Meta Ads campaign analysis with the [BUILD] / [SONG] / [SHOW] tag system; CPT calculation; kill-threshold flagging | RJ Jackson / The Algorithm Whisperer when reviewing campaign performance |
| `dsr-booking-evaluator` | (does NOT exist live — see archived row below) | ❌ NOT LIVE | — | — |

### Archived skills awaiting restoration

| Skill | Archived path | Status | What it does | Restoration plan |
|---|---|---|---|---|
| `dsr-booking-evaluator` | `_archive/_old_dsr-booking-evaluator-SKILL.md` (357 lines) | 📦 ARCHIVED | Full 14-step DSR-tuned booking pipeline: Gmail offer detection (Andrew Lehr at AB Touring + Colton Anderson at PRYSM), mandatory PDF attachment parsing, 6-step decision engine (floor $1,500, market check, CPT analysis, radius conflict matrix, promoter check, marketing budget), counter-formula MAX-of-4, structured emoji-rich output template, 4 reply email templates (counter/approve/check date/decline), 9 cross-references to DSR docs | Copy archive → `.claude/skills/dsr-booking-evaluator/SKILL.md`. Andrew Lehr stays as-is (it's correct). Add to live skills row above. |

### Recovered legacy skills (per Thomas's "older might be working" rule)

| Skill | Recovered location | What it does |
|---|---|---|
| Older platform agent prompts | `_archive/` various `_old_*.md` files | Old voice + decision-tree work that may have been lost in rebuilds — review before discarding |
| `dsr-daily-briefing` | (location TBD — to verify during DBA deep-read) | Built; daily briefing generation skill |

---

## Trading Shadow — Phase 0 Factory module skills

Location: `products/trading-shadow/src/trading_shadow/`

These aren't `SKILL.md` files (different convention — Trading Shadow uses Python modules + system prompts rather than the Claude Code skill format). Listed here for completeness.

| Skill | Path | Status | What it does |
|---|---|---|---|
| Trader system prompt v1 | `src/trading_shadow/prompts.py:CLAUDE_TRADER_SYSTEM` | 📦 BASELINE (kept for revertability) | Mechanical "if unsure hold" trader prompt (default-to-hold bias) |
| Trader system prompt v2 | `src/trading_shadow/prompts_v2.py:CLAUDE_TRADER_SYSTEM` | ✅ ACTIVE 2026-04-30 (swapped via import) | Restructured prompt with explicit BUY/SELL/HOLD criteria, conviction-to-size mapping, mode-specific behavior, few-shot examples |
| Shadow system prompt | `src/trading_shadow/prompts.py:SHADOW_SYSTEM` | ✅ ACTIVE | Ollama shadow learning to mimic the Trader |
| Strategist system prompt | `scripts/chat_bridge.py:STRATEGIST_SYSTEM_PROMPT` | ✅ ACTIVE 2026-04-30 | Senior business operator playing devil's advocate — for #ideas-inbox brainstorming. Catches rebuild-loop pattern. |
| Xai system prompt (Discord) | `scripts/chat_bridge.py:XAI_SYSTEM_PROMPT` | ⚠️ ACTIVE 2026-04-30 — INCONSISTENT WITH PLATFORM | Mirror of platform Xai prompt for Discord. Uses Claude Sonnet; the platform Xai uses Gemini 2.0 flash. Gap to fix: swap Discord Xai to Gemini for parity. |
| Claude system prompt (Discord) | `scripts/chat_bridge.py:CLAUDE_SYSTEM_PROMPT` | ✅ ACTIVE 2026-04-30 | General Claude assistant for Thomas via Discord |

---

## Digital Booking Agent skills

Location: `products/digital-booking-agent/prompts/`

| Skill | Path | Status |
|---|---|---|
| Inbound classifier | `prompts/inbound_classifier.md` | 🟡 SCAFFOLDED |
| Analyst pitch pack | `prompts/analyst_pitch_pack.md` | 🟡 SCAFFOLDED |
| Outbound composer | `prompts/outbound_composer.md` | 🟡 SCAFFOLDED |
| Routing | `prompts/routing.md` | 🟡 SCAFFOLDED |
| Research | `prompts/research.md` | 🟡 SCAFFOLDED |
| Reporting | `prompts/reporting.md` | 🟡 SCAFFOLDED |
| Supervisor | `prompts/supervisor.md` | 🟡 SCAFFOLDED |

DBA is awaiting Supabase provisioning (Phase 1 of `DEPLOYMENT.md`, ~15 min) + Gmail Takeout import + Gmail OAuth setup before any of these scaffolded skills go live.

---

## RJ Jackson persona

The CMO/COO persona is a full skill spec at `products/tenx10-platform/TENx10_Knowledge_Base/24_Agent_Team_Architecture.md` lines 80-200. Not a separate `SKILL.md` file but functions as one — invoked when any agent needs to speak in RJ's voice (cold outreach, editorial pitching, social strategy, press positioning).

---

## Operational artifacts (NOT skills, but referenced from this directory)

These are operational tools / data artifacts produced this session. Not invokable skills, but used BY agents that need them.

| Artifact | Path | Purpose |
|---|---|---|
| Gmail label tree | `MANAGEMENT-TENx10/GMAIL_LABEL_TREE.md` | 25-label hierarchy to set up in Gmail Settings → Labels for both `thomas@dirtysnatcharecords.com` and `thomas@dirtysnatcha.com` |
| Gmail filter import XML | `MANAGEMENT-TENx10/gmail_filters_import.xml` | 18 starter filters (Andrew Lehr → Bookings/VIP, BMI/ASCAP/MLC/SoundExchange → Publishing, VMG → Operations, auto-archive Discord/GitHub/receipts). Import via Gmail Settings → Filters → Import filters. |
| Desktop inventory | `_INVENTORY_DESKTOP_AND_HOME_2026-04-30.md` | Stage 1 DAD dogfood — 150+ scattered business files classified for consolidation |
| DBA project digest | `products/digital-booking-agent/PROJECT_DIGEST_2026-04-30.md` | Single-page summary of DBA's current state + blockers + next action |

---

## Specs (design docs, NOT skills) — see `BRAIN.md` SST table for the full list

The umbrella `BRAIN.md` Single Sources of Truth table indexes all specs. Not duplicated here. New specs from 2026-04-30 night:

- `2026-04-30-dsr-booking-flow-vision.md` (10-stage operational booking pipeline)
- `2026-04-30-booking-intelligence-engine.md` (11 capabilities for Stage 2 evaluation)
- `2026-04-30-contacts-inbox-cleanup.md` (this is what GMAIL_LABEL_TREE + filter XML implement)
- `2026-04-30-personal-brand-launch.md` (BACKBURNERED)
- `2026-04-30-label-catalog-evaluator.md` (BACKBURNERED, pursue/kill open)
- `2026-04-30-faceless-music-channel.md` (BACKBURNERED, pursue/kill open)
- `2026-04-30-dsp-playlists-repost-chain.md` (Layer 1 ship-ready, Layer 2 BACKBURNERED)
- `2026-04-30-analytics-mcp-everywhere.md` (BACKBURNERED, pursue/kill open)

Several of these have been auto-corrupted by a local Markdown formatter (see Important corrections above). Source intent is recoverable from this session's BUILD_EVOLUTION entries; the disk versions may have wrong paths or name expansions.

---

## How to add a new skill

1. Create `<skill-name>/SKILL.md` under the relevant project's `.claude/skills/` directory
2. Follow the existing skill format (see `edm-booking-agent/SKILL.md` as a template)
3. Add a row to this directory in the appropriate section
4. Update `EMPLOYEE_DIRECTORY.md` if the skill is owned by a specific agent
5. If it's a CROSS-CUTTING skill (used by multiple agents), put it in the umbrella `_skills/` (doesn't exist yet — would be created at first instance)

---

## How to find a skill

| You're looking for... | Try... |
|---|---|
| A specific named skill | This file (above) — every live + archived skill is listed |
| What an agent uses | `EMPLOYEE_DIRECTORY.md` (column "Skill") + cross-reference here |
| Old/recovered skills | `_archive/` directory + "Archived skills awaiting restoration" section above |
| What a skill DOES | Open the SKILL.md file directly — they're written to be self-explanatory |
| Operational artifacts (not skills) | "Operational artifacts" section above |

---

*Directory v2 — 2026-04-30 (late). Updates: Andrew Lehr correction, dsr-booking-evaluator NOT-LIVE clarification, file-corruption note, operational artifacts section, prompts_v2 marked active. Older v1 retained in git history.*
