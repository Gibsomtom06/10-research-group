# 10 Research Group — Employee Directory

**Last updated:** 2026-04-30
**Canonical architecture spec:** `docs/superpowers/specs/2026-04-27-factory-architecture-design.md` (read this first if you want the deep design — this directory is the operational status snapshot)
**TENx10-specific specialist details:** `products/tenx10-platform/TENx10_Knowledge_Base/24_Agent_Team_Architecture.md`

This file is the at-a-glance roster of every AI agent in the umbrella + its implementation status. **Updated as agents ship.** Older versions remain in git history.

Status legend: ✅ BUILT (running code) · 🟡 SCAFFOLDED (partial code) · 📋 SPEC (designed, no code) · ❌ NOT BUILT

---

## L0 — Thomas (the sole approval point)

Single human in the loop. Approves all financial transactions, sent communications, label decisions, releases. Cannot be bypassed by design.

---

## L1 — Factory Boss (1 agent)

| Role | Codename | Skill | Status |
|---|---|---|---|
| Orchestrator | The Factory Boss | `factory-orchestrator` | ✅ BUILT |

PES (Plan-Execute-Summarize) loop. Routes tasks across L2/L3/L4. Refuses dispatch to agents that don't comply with the Unified Observability contract.

---

## L2 — Infrastructure (Company-level; 4 agents)

These agents own the platform's runtime, design standards, integrations, and cost layer across ALL business units.

| Role | Codename | Skill | Status | Notes |
|---|---|---|---|---|
| AI + Data Architect | The System Brain | `system-brain` | ❌ NOT BUILT | Self-improving feedback loops |
| UX Designer | The Experience Architect | `ux-designer` | ❌ NOT BUILT | Mobile-first, glanceable dashboards |
| API Integration | The Tech Sentinel | `api-sentinel` | ❌ NOT BUILT | Watch external APIs for breaking changes |
| LLM Cost Optimizer | The Router | `llm-router` | ❌ NOT BUILT | Model selection per task; cost tracking |

---

## L3 — Departments (Cross-business workers; ~10-15 agents)

Department leads route work into per-project sub-agents. Each Department owns a domain across the umbrella (CMO ops for DSR + MHP + future agency clients, etc.).

| Department | Lead | Status | Subs |
|---|---|---|---|
| CMO / COO | RJ Jackson | 📋 SPEC (rich persona in KB Module 24) | Editorial pitch · Cold outreach · Press · Playlist · Social strategy · Synthetic Media (#10 — deepfake/voice/avatar future) |
| Operations | The Catalog Operator | 📋 SPEC | Catalog ops · Listings · Logistics · Settlement · Settlement · Inventory |
| Sales | The Pitcher | 📋 SPEC | Inbound classifier · Outbound · Lead gen · Quoting · Deal onboarding |
| Bookings | The Deal Maker | ✅ BUILT (skill: `dsr-booking-evaluator`, also called `edm-booking-agent` in tenx10-platform) | Domestic offers · International routing · Festival submissions |
| Releases | The Launch Commander | 🟡 SCAFFOLDED | Distribution · ISRC tracking · Day 0-7 launch · Decay alerts |
| Promo / UGC | Street Team Commander | ❌ NOT BUILT | Hypeddit · UGC campaigns · Email lists · Grassroots |
| Royalty Recovery | The Auditor | ❌ NOT BUILT | MLC · SoundExchange · CMRRA · International societies |
| Sync Licensing | The Pitcher (different one) | ❌ NOT BUILT | Music supervisors · Sync brief response |
| Proactive Booking | The Hustler | ❌ NOT BUILT | Cold-pitch promoters before they pitch you |

---

## L4 — Project workers (Per business unit; ~10-12 agents)

Each Layer-4 project has its own scoped sub-agents that talk to the Department leads.

### TENx10 platform
- Xai (consumer-facing, manager chat) — ✅ BUILT at `src/app/api/agent/route.ts` (Gemini 2.0 flash)
- Daily briefing skill — ✅ BUILT (`dsr-daily-briefing`)
- Multi-artist onboarding — ❌ NOT BUILT (in TASKS.md queue)
- Artist Revenue Sustainability Engine UI — ❌ NOT BUILT (in TASKS.md)
- Artist-facing Xai chat — ❌ NOT BUILT (in TASKS.md)

### DSR (DirtySnatcha Records)
- All Layer-3 agents above operate against DSR data; no DSR-specific Layer-4 agents yet.

### MHP (My Hydration Pack)
| Role | Codename | Skill | Status |
|---|---|---|---|
| Product Scout | The Curator | `mhp-product-scout` | ❌ NOT BUILT |
| Store Operator | The Shopkeeper | `mhp-store-operator` | ❌ NOT BUILT |
| Growth Engine | The Ad Buyer | `mhp-growth-engine` | ❌ NOT BUILT |
| Brand Builder | The Networker | `mhp-brand-builder` | ❌ NOT BUILT |

### Trading Shadow (Phase 0 of the Factory)
| Role | Codename | Module | Status |
|---|---|---|---|
| The Trader | Claude Sonnet 4.6 with `prompts.py` (v1) or `prompts_v2.py` (proposed) | `claude_trader.py` | ✅ BUILT |
| The Shadow | Ollama llama3.1:8b learning from Trader | `shadow.py` | ✅ BUILT |
| Rollback Handler | (no codename) | `rollback.py` | ✅ BUILT 2026-04-30 |
| Discord Reporter | Results Channel | `discord_reporter.py` | ✅ BUILT |
| Discord Chat Bridge | Multi-persona bot (Xai/Claude/Strategist) | `chat_bridge.py` | ✅ BUILT 2026-04-30 (awaits token paste) |

### DBA (Digital Booking Agent)
Per `products/digital-booking-agent/PRODUCT_BRIEF.md`, 7 specialist agents shipped:
| Role | Skill prompt | Status |
|---|---|---|
| Inbound Classifier | `prompts/inbound_classifier.md` | 🟡 SCAFFOLDED |
| Analyst | `prompts/analyst_pitch_pack.md` | 🟡 SCAFFOLDED |
| Outbound | (specific prompt unverified) | 🟡 SCAFFOLDED |
| Routing | `prompts/routing.md` | 🟡 SCAFFOLDED |
| Research | `prompts/research.md` | 🟡 SCAFFOLDED |
| Reporting | `prompts/reporting.md` | 🟡 SCAFFOLDED |
| Supervisor | `prompts/supervisor.md` | 🟡 SCAFFOLDED |
| Plus 5 background workers | — | 🟡 SCAFFOLDED |
| Awaiting Thomas's exports + Supabase provisioning | — | (blocking GO) |

### WRS Rim Shop
- Static site at `products/rim-shop/site/index.html` (✅ BUILT, ❌ NOT DEPLOYED)
- GMC feed generator — ✅ BUILT
- Google Ads campaign plan — 📋 SPEC
- Abandoned cart sequence — 📋 SPEC
- Refinishing prioritization agent — 📋 SPEC

### Personal brand / Faceless music / Comics resale / Photography / etc.
- All listed as L4 projects in the architecture spec
- All BACKBURNERED — see `docs/superpowers/specs/2026-04-30-personal-brand-launch.md` and `2026-04-30-faceless-music-channel.md`

---

## L5 — Shadow Team (Ollama; ~per-Layer-3-agent)

Local models that learn from Layer-3 Claude decisions. Graduate when they hit accuracy + profit + decision-pair count thresholds.

| Shadow | Trains on | Status |
|---|---|---|
| Trading Shadow | Trader Claude | 🟡 SCAFFOLDED — running paper-mode, awaiting first decisions |
| All other shadows | Their respective Layer-3 Claude | ❌ NOT BUILT |

Graduation criteria per `src/trading_shadow/config.py`: accuracy ≥ 0.90, pairs ≥ 50, daily profit ≥ $1.

---

## Headcount summary (as of 2026-04-30)

| Layer | Total | Built | Scaffolded | Spec only | Not built |
|---|---|---|---|---|---|
| L0 (Thomas) | 1 | 1 | — | — | — |
| L1 (Boss) | 1 | 1 | — | — | — |
| L2 (Infra) | 4 | 0 | 0 | 0 | 4 |
| L3 (Departments) | 9 | 1 | 1 | 6 | 1 |
| L4 (Projects) | ~25 | 6 | 8 | 4 | 7 |
| L5 (Shadows) | ~5 | 0 | 1 | 0 | 4 |
| **Total** | **~45** | **9** | **10** | **10** | **16** |

(Numbers are approximate — the L4 list grows as new projects are scoped.)

---

## How to find an agent

| If you want to know... | Look at |
|---|---|
| What an agent IS conceptually | `docs/superpowers/specs/2026-04-27-factory-architecture-design.md` |
| What persona/voice an agent has | `products/tenx10-platform/TENx10_Knowledge_Base/24_Agent_Team_Architecture.md` |
| Where an agent's code lives | This file (column "Skill" / "Module") + grep |
| What skills are available | `SKILL_DIRECTORY.md` (umbrella root, parallel to this file) |
| What's currently running | This file's status flags + `data/agent_invocations.jsonl` (when observability surface ships) |

---

*Directory v2 — 2026-04-30. Replaces the 2026-04-27 v1 (still in git history). Updated when agents ship status transitions. Older state remains accessible via `git log EMPLOYEE_DIRECTORY.md`.*
