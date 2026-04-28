# 10 Research Group Factory — Architecture Design

**Date:** 2026-04-27
**Status:** Designed, awaiting build
**Author:** Brainstormed with Thomas Nalian

---

## Vision

10 Research Group runs an autonomous AI agent factory that operates Thomas's portfolio of businesses (TENx10, DSR, MHP, Rim Shop, DAD, artists, ventures) with minimal human intervention. Every C-suite seat has a Claude-powered AI agent. Every Claude agent has an Ollama-powered shadow that learns from it and graduates to handle specific tasks independently — driving cost toward zero over time.

**Core promise:** Thomas talks. Factory routes. Agents cook. Shadows learn. Results hit Discord. Capital grows.

---

## 5-Layer Architecture

```
┌─ L0 ─ Thomas (sole approval point) ─────────────────┐
│  Final say on: financial transactions, outbound     │
│  sends, contracts, A&R decisions                    │
└─────────────────────────────────────────────────────┘
            │
┌─ L1 ─ Factory Boss (Orchestrator) ──────────────────┐
│  PES (Plan-Execute-Summarize) on every goal         │
│  Routes briefs across departments                   │
│  Surfaces conflicts to Thomas                       │
│  Already built: factory-orchestrator skill ✅        │
└─────────────────────────────────────────────────────┘
            │
┌─ L2 ─ 10RG Infrastructure Team (7 agents) ──────────┐
│  System Brain · UX · UI · App · Tech Sentinel ·     │
│  Router · Shadow Memory Architect                   │
└─────────────────────────────────────────────────────┘
            │
┌─ L3 ─ Departments (functional, 6 depts, 46 agents) ─┐
│  Marketing · Sales · Finance · Product · Ops · CS   │
└─────────────────────────────────────────────────────┘
            │
┌─ L4 ─ Projects (verticals served by L3) ────────────┐
│  TENx10 · DSR · MHP · Rim Shop · DAD ·              │
│  artists · Comics · Trelis · Thomas Nalian          │
└─────────────────────────────────────────────────────┘
            │
┌─ L5 ─ Shadow Team (Ollama, local) ──────────────────┐
│  Mirrors every Claude agent in L1, L2, L3           │
│  Observes both task execution AND Thomas+Claude     │
│  conversations. Graduates tasks off Claude over     │
│  time. Zero-cost local execution at scale.          │
└─────────────────────────────────────────────────────┘
```

---

## Layer 1 — Factory Boss (1 agent)

| Role | Codename | Skill | Status |
|------|----------|-------|--------|
| Orchestrator | The Factory Boss | `factory-orchestrator` | ✅ BUILT |

**Responsibilities:** PES framework, goal routing, conflict resolution between departments, escalation to Thomas. Never auto-executes financial transactions, outbound sends, or contracts.

---

## Layer 2 — 10RG Infrastructure Team (7 agents)

Cross-cutting technical foundation. Owns the platform's design standards, infrastructure, and runtime health across ALL projects.

| # | Role | Codename | Skill |
|---|------|----------|-------|
| A | AI + Data Architect | System Brain | `system-brain` |
| B | UX Designer | Experience Architect | `ux-designer` |
| C | UI Designer | Visual Hierarchist | `ui-designer` |
| D | App Designer | Native Patterns | `app-designer` |
| E | API Integration | Tech Sentinel | `api-sentinel` |
| F | LLM Cost Optimizer | The Router | `llm-router` |
| G | Shadow Memory Architect | Memory Steward | `shadow-memory` |

**Shadow Memory Architect (new role)** owns the conversation capture, vector indexing, and shadow learning loop. This is the connective tissue that makes shadow team work — without it, shadows have nothing to learn from.

---

## Layer 3 — Departments (46 agents across 6 depts)

Every department has 1 Lead + 4-10 Subs. Each department serves ALL projects. Projects "tap in" — Lead receives brief, routes to Subs, Subs work with project context loaded.

### Marketing — CMO + 9 Subs (10)

| # | Role | Codename | Domain |
|---|------|----------|--------|
| Lead | CMO | The CMO | Strategy, brief routing, final approval |
| 1 | Content Strategist | — | Long-form copy: blog, press, EPK, scripts |
| 2 | Social Operator | — | Multi-platform: TikTok, IG, FB, Snapchat, Pinterest, X, YouTube, LinkedIn |
| 3 | Creative Asset Producer | — | Graphics, video, ad creatives, meme images |
| 4 | Brand Voice Steward | — | Voice profiles per project, voice review across all outputs |
| 5 | SEO Strategist | — | Keyword research, on-page, content briefs |
| 6 | PR & Press | — | Media pitching, awards, features |
| 7 | Email & CRM | — | Nurture, broadcasts, segmentation |
| 8 | Trend & Culture Analyst | — | TikTok Creator Insight, trend tracking, meme lifecycle |
| 9 | Influencer & Creator Partnerships | — | Influencer discovery, outreach, collab management |
| 10 | Video & Synthetic Media Producer | — | Long-form video, short-form clipping, AI avatar / deepfake / voice clone |

**Existing music-specific workers fold in:** RJ Jackson → CMO Lead. Algorithm Whisperer → Social Operator. Street Team Commander → distributed across Social + Email & CRM.

### Sales — CRO + 8 Subs (9)

| # | Role | Codename | Domain |
|---|------|----------|--------|
| Lead | CRO | The CRO | Full-funnel: acquisition → conversion → close → channel revenue |
| 1 | Performance Marketer | — | Paid acquisition: Google, Meta, TikTok, Pinterest, Snapchat ads |
| 2 | Funnel Optimizer | — | Landing pages, checkout flow, A/B tests |
| 3 | Conversion Copywriter | — | Sales pages, direct response, urgency |
| 4 | Lifecycle Funnel | — | Cart abandonment, post-purchase, re-engagement |
| 5 | Pipeline Manager | — | CRM, lead routing, B2B follow-up |
| 6 | Retention Specialist | — | Loyalty, repeat purchase, fan-club tiers |
| 7 | Closer | — | Outbound deal closing — absorbs Pitcher (sync), Hustler (booking), sponsorship deals |
| 8 | Channel Monetizer | — | YouTube AdSense, TikTok Creator Fund, Spotify, IG bonuses, Twitch, Patreon, super chats |

### Finance — CFO + 7 Subs (8)

| # | Role | Codename | Domain |
|---|------|----------|--------|
| Lead | CFO | The CFO | Cash flow, P&L, capital allocation, runway |
| 1 | ROI / ROAS Tracker | — | Per-channel ROI, ad ROAS, payback periods |
| 2 | Margin Analyst | — | Per-SKU / per-deal margin |
| 3 | Royalty Auditor | — | MLC, BMI, ASCAP, SoundExchange recovery |
| 4 | Spend Allocator | — | Capital deployment decisions |
| 5 | Reporting | — | Weekly / monthly / quarterly summaries |
| 6 | Capital Acquisition | — | Grants + sponsorship hunting + applications |
| 7 | The Trader | — | Paper → live trading, strategy + execution + risk management |

### Product — CPO + 5 Subs (6)

| # | Role | Codename | Domain |
|---|------|----------|--------|
| Lead | CPO | The CPO | Product strategy, lifecycle, launch decisions |
| 1 | Sourcer | — | Supplier scanning, discovery |
| 2 | Designer | — | Mockup generation, design specs (Gemini Nano 2 native) |
| 3 | Catalog Operator | — | Listings, variants, tagging |
| 4 | Pricing Strategist | — | Competitor scan, margin floor |
| 5 | QA Analyst | — | Pre-launch validation, defect tracking |

### Operations — COO + 6 Subs (7)

| # | Role | Codename | Domain |
|---|------|----------|--------|
| Lead | COO | The COO | Process design, throughput, vendor coordination, compliance |
| 1 | Supply Chain Coordinator | — | Vendor relationships, sourcing |
| 2 | Fulfillment Manager | — | Order processing, shipping, tracking, returns intake |
| 3 | Inventory Tracker | — | Stock levels, reorder triggers |
| 4 | Process Documenter | — | SOPs, workflow docs, automation specs |
| 5 | Quality Control | — | Pre-ship inspection, defect tracking |
| 6 | Release Operations | — | Music release ops (absorbs Launch Commander) — VMG, ISRC, waterfall, PS monitoring |

### Customer Service — CXO + 4 Subs (5)

| # | Role | Codename | Domain |
|---|------|----------|--------|
| Lead | CXO | The CXO | Customer experience strategy, satisfaction targets, escalation routing |
| 1 | Tier 1 Support | — | FAQ-level, common questions, order status |
| 2 | Tier 2 Support | — | Escalations, complex issues, refund decisions |
| 3 | Returns Coordinator | — | RMA processing, refund workflow |
| 4 | Reviews & Reputation | — | Review monitoring, response drafting, sentiment tracking |

---

## Layer 4 — Projects (verticals served by Layer 3)

| Project | Type | Notes |
|---------|------|-------|
| **TENx10** | SaaS platform | Artist management software (tenx10.co) |
| **DSR (DirtySnatcha Records)** | Music label | 154+ releases, BMI + ASCAP affiliated |
| **DirtySnatcha** | Artist | Thomas himself (Leigh Bray, BMI) |
| **WHOiSEE** | Artist | NC, Circus Records UK |
| **Dark Matter** | Artist | Chicago/Knoxville, Wakaan, ASCAP |
| **Kotrax** | Artist | DSR roster |
| **MHP** | Custom merch e-commerce | Artists × fans, charity component, Shopify |
| **Rim Shop** | Client engagement | Wheel Repair Specialists MI, automotive |
| **DAD** | Productivity service | Digital Asset Declutterer, tenx10.co/dad |
| **Trelis Work** | Separate business | TBD |
| **Comics Resale** | Venture | eBay-based |
| **Photography (tnalianphotos)** | Service | Photography work |
| **WHOisDad music** | Music project | TBD scope |
| **Thomas Nalian (personal brand)** | Personal | Industry leader → drives upmarket TENx10 clients |

---

## Layer 5 — Shadow Team (Ollama, local)

**Goal:** every Claude agent in L1/L2/L3 has an Ollama shadow that learns its patterns and graduates tasks off Claude over time. Zero-cost local execution at scale, privacy-preserving (no cloud), eventual digital twin of Thomas's business judgment.

**Two streams of input:**

1. **Task execution layer** — shadow observes how Claude agents complete tasks (the WHAT)
2. **Strategic conversation layer** — shadow observes Thomas + Claude main conversations (the WHY, decisions, trade-offs, what gets killed and why)

**Architecture components:**

| Component | Purpose |
|-----------|---------|
| Conversation capture | Logs main Thomas ↔ Claude channel + every agent task |
| Vector embedding store | Indexes conversations + task transcripts (local) |
| Shadow memory store | Per-agent learning corpus, indexed for retrieval |
| Graduation evaluator | Compares shadow predictions vs Claude actuals; tracks accuracy |
| Decision orchestrator | Routes task to shadow once accuracy threshold met |
| Privacy layer | All Ollama, all local, no cloud sync — sensitive business data stays on machine |

**Graduation rule (per-agent):** when shadow predicts Claude's decisions at ≥ 90% accuracy across ≥ 50 instances, shadow graduates to handle that task type independently within guardrails.

---

## Cross-Cutting Concepts

### The Tap-In Pattern

When a project needs work, the Factory Boss routes the brief to the appropriate department Lead. Lead loads project context (brand voice, brief, KPIs) and routes to Subs. Each Sub works with project context active. Same agents, different project hat each tap.

**Example:** MHP needs a viral merch drop → Factory Boss → Marketing Lead → Trend Scout (Sub) → Concept Generator (Product Sub) → Designer → Listing Writer → Catalog Operator (Ops Sub) → Promo (Marketing Sub) → live drop.

### Conversation Shadowing

Shadow team observes ALL Thomas + Claude conversations, not just task outputs. Captures Thomas's decision patterns: priorities, trade-offs, what gets rejected, why. Eventually shadow can make strategic calls in Thomas's voice when he's not tapped in.

### Per-Agent Graduation

Each Claude agent's shadow graduates independently. Some agents graduate fast (image generation, listing copy, voice consistency check) — these are heavily model-driven, low judgment. Others graduate slow (strategy, conflict resolution, deal-closing) — these need Claude-level reasoning longer.

---

## Use Cases

### Phase 0 Use Case A — MHP Viral Merch Pipeline

The shadow team's first proving ground for the merch generation flow.

```
Trend Scout (Marketing) → TikTok Creator Insight + Google Trends + Reddit + X
Cultural Analyst (Marketing) → classify trend, ID joke + audience + lifecycle
Concept Generator (Product) → trend → merch concept (slogan, graphic, item)
Designer (Product / Sys Arch) → mockup via Gemini Nano 2 / Firefly
Listing Writer (Marketing) → product page in MHP voice
Pricing Strategist (Product) → competitor scan + margin floor
Catalog Operator (Operations) → push to Shopify storefront
Promo (Marketing) → social posts pushing the drop
ROI Tracker (Finance) → sales / CPA / ROAS, feeds back to Trend Scout
```

Every step has Claude agent + Ollama shadow watching. Market validates the trend (sales = signal). Shadow learns what trend signals → actual sales.

### Phase 0 Use Case B — Trading Shadow A/B Test

See companion spec: `2026-04-27-trading-shadow-test-design.md`.

---

## Build Phasing

| Phase | What | Why now |
|-------|------|---------|
| **Phase 0** (this week) | The Trader (paper) + Capital Acquisition (grants) | Direct capital generation. Pay debt, fund ventures. |
| **Phase 1** | Marketing dept core (Content, Social, Trend, Voice Steward) | Brand engine across all projects |
| **Phase 2** | Sales dept core (Performance Marketer, Channel Monetizer, Closer) | Revenue funnel + monetization |
| **Phase 3** | Product, Ops, CS depts | Operational depth, MHP fully automated |
| **Phase 4** | Charitable layer + 10RG company structure formalization | Mission alignment + governance |
| **Phase 5** | Full shadow team production | All Claude agents have graduated shadows |

---

## Pending / Open

- **Future project hint** (Thomas mentioned but not yet shared)
- **MHP current vendor** (awaiting Shopify admin lookup)
- **Charitable wing for 10RG** — Phase 4. MHP already has charity component baked in; opportunity to formalize at company level.
- **Company structure formalization** — Phase 4. 501(c)(3) status for grant unlock (Subtask A: fiscal sponsor / Subtask B: file 1023-EZ)
- **Project list completeness** — verify Photography, Trelis, Comics, WHOisDad music with Thomas
- **Existing skills migration** — `dsr-booking-evaluator`, `dsr-daily-briefing`, `royalty-auditor`, `discord-reporter`, `notebooklm` need to be slotted into new dept structure

---

## Dependencies (what we need to build)

| Need | Status |
|------|--------|
| Ollama infrastructure (local model selection, vector store, learning loop) | ❌ not built |
| Conversation logging system (main channel + agent tasks) | ❌ not built |
| Department orchestration layer (Tap-In pattern impl) | ❌ not built |
| Discord two-way bot (currently one-way webhook only) | ❌ not built |
| Shopify MCP for MHP integration | ❌ not built |
| TikTok Creator Insight API integration | ❌ not built |
| Gemini Nano 2 / Firefly mockup pipeline | ❌ not built |
| Broker API for Trader (Alpaca paper) | ❌ not built |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Scope sprawl (46 dept agents + 7 infra + shadows = 100+ agents to build) | Phase strictly. Build Phase 0 first, prove pattern, then scale. |
| Shadow learning is unproven at this scale | Trading A/B test in Phase 0 IS the proof. If shadows can't graduate after 60 days, rethink. |
| Conversation shadowing privacy | All local Ollama, never cloud. Sensitive data never leaves Thomas's machine. |
| Token cost explosion before shadows graduate | The Router (10RG infra) actively monitors per-session spend, flags bloat. Aggressive Ollama-first routing. |
| Thomas burns out on coordination | Discord-first reporting. Factory Boss surfaces only what needs Thomas attention. Most agent work happens silent. |

---

*Spec v1.0 — 2026-04-27. Brainstormed with Thomas Nalian. Ready for review.*
