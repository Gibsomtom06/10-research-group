# 10 Research Group — Skill Directory

**Last updated:** 2026-04-30
**Companion to:** `EMPLOYEE_DIRECTORY.md` (this file = the skills; that file = the agents that USE skills)

A skill is a discrete capability — a prompt + tool spec + decision tree — that an agent can invoke. Skills live close to the project they serve. This directory indexes them so you can find a skill without crawling folders.

Status: ✅ ACTIVE (current canonical version) · 🟡 PARTIAL (works but missing pieces) · 📦 LEGACY (older version kept; may still be the working one — check before deleting)

---

## TENx10 platform skills

Location: `products/tenx10-platform/.claude/skills/`

| Skill | Path | Status | What it does | Invoked by |
|---|---|---|---|---|
| `edm-booking-agent` | `.claude/skills/edm-booking-agent/SKILL.md` | ✅ ACTIVE | Full 11-step booking decision engine: PDF parsing, terminology glossary, radius conflict matrix, financial breakdown, structured output, reply drafting | The Deal Maker (L3 Bookings) when an offer comes in via Gmail |
| `meta-ads-analyzer` | `.claude/skills/meta-ads-analyzer/SKILL.md` | ✅ ACTIVE | Meta Ads campaign analysis with the [BUILD] / [SONG] / [SHOW] tag system; CPT calculation; kill-threshold flagging | RJ Jackson / The Algorithm Whisperer when reviewing campaign performance |

### Recovered legacy skills (per Thomas's "older might be working" rule)

These were recovered from the old skill packages during 2026-04-30 deep-diff. Some are RICHER than current versions and may be the actual working spec — review before discarding.

| Skill | Recovered location | What it does |
|---|---|---|
| `dsr-booking-evaluator` | `_archive/_old_dsr-booking-evaluator-SKILL.md` | Predecessor to edm-booking-agent. Validated as DRAMATICALLY richer in the deep-diff — components may have been lost in a rebuild. |
| Older platform agent prompts | `_archive/` various `_old_*.md` files | Old voice + decision-tree work that may have been lost in rebuilds |
| `dsr-daily-briefing` | (location TBD — look for it during DBA deep-read) | Built; daily briefing generation skill |

---

## Trading Shadow — Phase 0 Factory module skills

Location: `products/trading-shadow/src/trading_shadow/`

These aren't `SKILL.md` files (different convention — Trading Shadow uses Python modules + system prompts rather than the Claude Code skill format). Listed here for completeness.

| Skill | Path | Status | What it does |
|---|---|---|---|
| Trader system prompt v1 | `src/trading_shadow/prompts.py:CLAUDE_TRADER_SYSTEM` | ✅ ACTIVE | Mechanical "if unsure hold" trader prompt (default-to-hold bias) |
| Trader system prompt v2 (proposed) | `src/trading_shadow/prompts_v2.py:CLAUDE_TRADER_SYSTEM` | 📋 PROPOSAL | Restructured prompt with explicit BUY/SELL/HOLD criteria, conviction-to-size mapping, mode-specific behavior, few-shot examples. Swap by changing one import in `claude_trader.py`. |
| Shadow system prompt | `src/trading_shadow/prompts.py:SHADOW_SYSTEM` | ✅ ACTIVE | Ollama shadow learning to mimic the Trader |
| Strategist system prompt | `scripts/chat_bridge.py:STRATEGIST_SYSTEM_PROMPT` | ✅ ACTIVE 2026-04-30 | Senior business operator playing devil's advocate — for #ideas-inbox brainstorming |
| Xai system prompt (Discord) | `scripts/chat_bridge.py:XAI_SYSTEM_PROMPT` | ✅ ACTIVE 2026-04-30 | Mirror of platform Xai prompt for Discord channel use; INCONSISTENT with platform (uses Claude Sonnet vs platform's Gemini — gap to fix) |
| Claude system prompt (Discord) | `scripts/chat_bridge.py:CLAUDE_SYSTEM_PROMPT` | ✅ ACTIVE 2026-04-30 | General Claude assistant for Thomas via Discord |

---

## DBA (Digital Booking Agent) skills

Location: `products/digital-booking-agent/prompts/`

| Skill | Path | Status |
|---|---|---|
| Inbound classifier | `prompts/inbound_classifier.md` | 🟡 SCAFFOLDED |
| Analyst pitch pack | `prompts/analyst_pitch_pack.md` | 🟡 SCAFFOLDED |
| Routing | `prompts/routing.md` | 🟡 SCAFFOLDED |
| Research | `prompts/research.md` | 🟡 SCAFFOLDED |
| Reporting | `prompts/reporting.md` | 🟡 SCAFFOLDED |
| Supervisor | `prompts/supervisor.md` | 🟡 SCAFFOLDED |

DBA is awaiting Thomas's exports + Supabase provisioning before going live.

---

## RJ Jackson persona

The CMO/COO persona is a full skill spec at `products/tenx10-platform/TENx10_Knowledge_Base/24_Agent_Team_Architecture.md` lines 80-200. Not a separate `SKILL.md` file but functions as one — invoked when any agent needs to speak in RJ's voice (cold outreach, editorial pitching, social strategy, press positioning).

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
| A specific named skill | grep `SKILL.md` files: `Grep "skill_name" --glob="**/*.md"` |
| All current skills | This file |
| The skill spec for a given agent | `EMPLOYEE_DIRECTORY.md` (column "Skill") + cross-reference here |
| Old/recovered skills | `_archive/` directory + the "Recovered legacy skills" section above |
| What a skill DOES | Open the SKILL.md file directly — they're written to be self-explanatory |

---

*Directory v1 — 2026-04-30. New file — replaces the implicit "skills are scattered around" pattern. Update when new skills land or get reclassified.*
