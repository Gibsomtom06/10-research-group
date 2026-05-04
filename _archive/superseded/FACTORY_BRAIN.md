# 10 Research Group — Agent Factory Blueprint

**Last updated:** 2026-04-25
**Status:** Architecture defined. 0 skills built. 0 autonomous pipelines running. This doc is the north star.

---

## What We're Building

An autonomous, self-sustaining, revenue-generating AI factory that runs the following businesses without Thomas having to prompt every step:

| Business | Domain | Revenue Model |
|----------|--------|---------------|
| **TENx10 / DSR** | Artist management + label | SaaS subscriptions + booking commissions |
| **My Hydration Pack (MHP)** | Merch + dropship e-commerce | Product margins + brand deals |
| **10 Research Group** | AI agent systems | Agency fees + platform licensing |

---

## The Architecture (NotebookLM-validated)

### L1 — The Supervisor (1 agent)

| Agent | Codename | Domain |
|-------|----------|--------|
| Orchestrator | The Factory Boss | Goal routing, PES framework, conflict resolution |

---

#### The Orchestrator (Factory Boss)

The central brain. Uses the **Plan-Execute-Summarize (PES)** framework on every goal:
1. Draft an explicit step-by-step plan before touching any tools
2. Delegate tasks to the right specialist workers
3. Monitor a continuous loop: `Am I done? Did a tool fail? Am I stuck? Do I need a fallback?`
4. On failure: trigger **Reversible Reasoning** — roll back to last stable state, try a new path

The Orchestrator routes every inbound goal:
- **Single-domain request** → route to one specialist worker, return result
- **Multi-domain request** → query multiple workers in parallel, synthesize output
- **Ambiguous request** → ask one clarifying question, then route
- **Conflict between workers** → surface BOTH recommendations with trade-offs, Thomas decides

Thomas is the ONLY approval point. The Orchestrator never auto-executes financial transactions, outbound sends, or contract signatures.

---

---

### 10 Research Group Team — Company Infrastructure (4 agents)

These agents are not scoped to a single business unit. They own the platform's technical foundation, design standards, and runtime health across ALL products. They activate whenever platform construction or infra work is in flight.

---

#### 10RG-A — The System Brain (AI + Data Architect)

**Domain:** Platform intelligence, prompt optimization, self-improving feedback loops, data pipeline design, model routing, cost control

**Tools:** Ollama (local), Claude API, Gemini API, Supabase analytics

**Autonomous behaviors:**
- Routes heavy/repetitive tasks to Ollama (zero cost)
- Routes complex reasoning to Claude Sonnet
- Routes consumer-facing to Gemini Flash
- Monitors token spend per session and flags bloat
- Compacts context automatically before hitting limits

---

#### 10RG-B — The Experience Architect (UX Designer)

**Domain:** Platform design — mobile-first dashboards, user flows, component systems, artist portals, landing pages

**Tools:** React component generator, Tailwind styles, visual edit

**Autonomous behaviors:**
- Generates React component specs from user story
- Applies Thomas's UI style (all-lowercase labels, compact density, workbench feel)
- Reviews implemented UX against mobile-first standards

---

#### 10RG-C — The Tech Sentinel (API Integration)

**Domain:** Connect all products to external platforms without breaking existing logic. OAuth, webhook management, API health monitoring.

**Tools:** Spotify API, Stripe, Gmail OAuth, Meta Ads API, Discord webhook

**Autonomous behaviors:**
- Monitors OAuth token expiry and alerts before expiration (Gmail tokens currently expired)
- Tests webhook health daily
- Alerts on API rate limit approach
- Reconnects expired OAuth with minimal Thomas interaction

---

#### 10RG-D — The Router (LLM Cost Optimizer)

**Domain:** Intelligent routing of all agent tasks to the right model at the right cost. Prevents Claude token waste across the factory.

**Tools:** Ollama (local), Claude API, Gemini API, usage analytics

**Autonomous behaviors:**
- Classifies every incoming task by complexity + cost tolerance
- Routes to Ollama for bulk/repetitive work, Claude for reasoning, Gemini for consumer-facing
- Tracks spend per worker per week
- Flags sessions where Claude is being used for tasks Ollama could handle

---

### L5 — Specialist Workers (Scoped Tools Only)

Each worker has a strictly scoped toolset. Workers cannot access tools outside their domain — this prevents catastrophic cross-system errors.

---

#### WORKER 1 — The Deal Maker (Booking Agent)

**Domain:** Show offers, negotiation, routing, radius clauses, venue/promoter evaluation, domestic + international touring

**Tools:** Gmail (offer detection + reply drafting), Google Calendar (conflict check), Google Drive (contract storage), Supabase (shows, promoters, venues tables)

**Autonomous behaviors:**
- Scans Gmail for inbound offers every 4 hours
- Runs full 6-step booking evaluation (floor check → market → CPT → routing → promoter grade → marketing commitment)
- Drafts counter-offer or acceptance email
- Flags radius clause conflicts
- Posts evaluation to Discord for Thomas to approve/reject

**Cannot:** Accept or decline offers. Send emails without Thomas approval.

---

#### WORKER 2 — RJ Jackson (CMO / COO)

**Domain:** PR, editorial pitching, playlist strategy, press outreach, social strategy, release campaigns, cold outreach, label ops

**Full named persona** — see `TENx10_Knowledge_Base/24_Agent_Team_Architecture.md`

**Tools:** Gmail (pitch drafting + cold outreach), web search (press/blog research), Meta Ads API (campaign execution), Spotify API (playlist tracking)

**Autonomous behaviors:**
- Generates editorial pitch plan 4 weeks before every release
- Drafts cold emails to blogs (EDM.com, Your EDM, The Untz, Run The Trap, Dancing Astronaut)
- Builds content calendars per release
- Monitors press coverage and reports weekly

**Cannot:** Send pitch emails without Thomas approval.

---

#### WORKER 3 — The Algorithm Whisperer (Social Media Architect)

**Domain:** Platform-native content strategy, posting cadence, algorithm optimization, community engagement, trend identification

**Tools:** Meta Ads API (post scheduling, performance), TikTok API (posting, analytics), web search (trend research)

**Autonomous behaviors:**
- Generates weekly content calendars per artist per platform
- Writes captions in artist voice profile
- Monitors save-to-stream ratios and engagement rates
- Flags when engagement drops >20% week-over-week

**Cannot:** Post without Thomas content approval.

---

#### WORKER 4 — The Strategist (Artist Manager)

**Domain:** Career strategy, financial oversight, white space identification, quarterly planning, revenue diversification, team coordination

**Tools:** All read access. Supabase (full schema), Spotify API, Meta Ads API

**Autonomous behaviors:**
- Generates daily briefing (all 7 revenue pillars per artist, gaps, top 3 unlocks)
- Identifies revenue left on table (unpitched sync catalog, unregistered royalties, merch gaps)
- Produces quarterly P&L per artist
- Synthesizes conflicts between other worker recommendations

**Cannot:** Execute financial transactions.

---

#### WORKER 5 — The Launch Commander (Release Agent)

**Domain:** Release strategy, VMG distribution, ISRC tracking, waterfall planning, Day 0-7 execution, catalog health

**Tools:** Spotify API (ISRC polling, PS monitoring), VMG Assets, Musicstax, Supabase (releases, track_metrics)

**Autonomous behaviors:**
- Monitors Popularity Score daily per track
- Triggers save campaign when track approaches PS threshold
- Tracks 6-week decay deadlines and sends alert at Day 35
- Manages waterfall timing (singles → EP bundle)

**Cannot:** Approve final release dates or A&R decisions.

---

#### WORKER 6 — The Street Team Commander (Promo + UGC)

**Domain:** Promo team management, UGC campaigns, download gates, fan activation, email list growth, grassroots

**Tools:** Hypeddit (download gates), email platform, social monitoring

**Autonomous behaviors:**
- Runs weekly promo team leaderboard
- Identifies top fan UGC and queues for artist repost
- Manages Hypeddit gate funnels (follow + save + email)
- Segments email list by behavior (gate vs ticket vs merch buyer)

**Cannot:** Approve budget for physical promo materials.

---

#### WORKER 7 — The Auditor (Royalty Recovery Agent)

**Domain:** Continuous scanning of PROs, SoundExchange, MLC, publishing databases for unclaimed/unmatched royalties

**Tools:** Local Ollama (heavy data scanning — zero cloud cost), BMI/ASCAP/MLC APIs, Supabase (publishing_registrations)

**Autonomous behaviors:**
- Runs nightly scan of all registered ISRCs against MLC claimed status
- Identifies unregistered tracks and queues LAB10 submission batch
- Monitors SoundExchange for unclaimed performer royalties
- Auto-generates MLC CSV upload file for LAB10 Publishing (82 Leigh Bray tracks)

**Cannot:** Submit to PROs without Thomas approval.

---

#### WORKER 8 — The Pitcher (Sync Licensing Agent)

**Domain:** Monitor sync briefs from music supervisors, ad agencies, film/TV databases. Match catalog tracks to open briefs. Outreach.

**Tools:** Local Ollama (catalog audio profile analysis), Gmail (pitch emails), web search (brief aggregators)

**Autonomous behaviors:**
- Monitors sync brief databases weekly
- Matches DSR catalog tracks to open briefs using sonic + metadata profile
- Drafts targeted pitch email per brief
- Tracks pitch status and follow-up timeline

**Cannot:** Send pitch emails without approval.

---

#### WORKER 9 — The Booking Hustler (Automated Outreach)

**Domain:** Proactively find booking gaps. Scan festival announcements, venue calendars, promoter socials. Pitch without waiting for inbound offers.

**Tools:** Web search, Gmail (outreach), social monitoring, Supabase (venues, promoters)

**Autonomous behaviors:**
- Scans festival submission deadlines weekly
- Identifies venue booking gaps in routing-efficient markets
- Sends EPK + available dates to venues Thomas hasn't played
- Tracks outreach status per venue/promoter

**Cannot:** Send outreach without approval on first contact with any new promoter.

---

### MHP — My Hydration Pack Worker Cluster

A separate sub-factory within 10 Research Group targeting $1M+ merch/dropship revenue.

#### MHP-1 — The Product Scout
Scans dropship supplier catalogs (Printful, Faire, Spocket) for trending hydration/outdoor/lifestyle products. Identifies high-margin SKUs. Builds product catalog recommendations.

#### MHP-2 — The Store Operator
Manages Shopify/WooCommerce product listings, inventory sync, pricing rules, and discount logic. Runs autonomously once product catalog is approved.

#### MHP-3 — The Growth Engine
Runs Meta Ads campaigns for MHP. Optimizes for ROAS. Monitors CPM/CPC/ROAS daily. Kills underperformers, scales winners.

#### MHP-4 — The Brand Builder
Pitches MHP for brand deals — outdoor/fitness/festival brands. Generates sponsorship decks. Manages influencer outreach for UGC product content.

---

## Skills Roadmap (Priority Order)

These are Claude Code skills that need to be built. Each skill = one worker's behavior set.

### Phase 1 — Foundation (Build First)
| Skill | What It Does |
|-------|-------------|
| `factory-orchestrator` | The L1 Supervisor — PES framework, routing logic, reversible reasoning |
| `discord-reporter` | Sends all agent results to Discord with proper embed formatting |
| `supabase-reader` | Safe read-only Supabase queries for any worker needing DB context |
| `llm-router` | Routes tasks: Claude (complex) → Gemini (consumer) → Ollama (bulk/free) |

### Phase 2 — Revenue Recovery (Highest ROI First)
| Skill | What It Does |
|-------|-------------|
| `royalty-auditor` | Nightly scan → MLC CSV generator → LAB10 submission queue |
| `booking-evaluator` | Full 6-step offer evaluation → Discord post for approval |
| `release-monitor` | Daily PS polling → decay alerts → campaign triggers |
| `sync-pitcher` | Brief monitoring → catalog matching → pitch draft |

### Phase 3 — Growth Engine
| Skill | What It Does |
|-------|-------------|
| `content-calendar` | Weekly content generation per artist per platform |
| `pr-campaign` | Editorial pitch plan → blog outreach → press release drafting |
| `booking-hustler` | Proactive venue/festival outreach → EPK sender |
| `promo-manager` | UGC campaign management → fan leaderboard → gate funnels |

### Phase 4 — MHP Factory
| Skill | What It Does |
|-------|-------------|
| `mhp-product-scout` | Supplier scanning → SKU recommendations |
| `mhp-store-operator` | Shopify product sync → pricing → inventory |
| `mhp-growth-engine` | Meta Ads ROAS optimization for MHP |
| `mhp-brand-builder` | Sponsorship deck → influencer outreach |

### Phase 5 — Platform Intelligence
| Skill | What It Does |
|-------|-------------|
| `system-architect` | Supabase schema generation → Vercel provisioning → architecture docs |
| `ux-designer` | React component generation → Tailwind → mobile-first review |
| `api-sentinel` | OAuth health monitoring → webhook testing → reconnect flows |
| `feedback-loop` | Agent recommendation → user action → outcome measurement → model refinement |

---

## Autonomous Revenue Engine

Three categories of money the factory finds and captures without Thomas:

### Category 1 — Royalty Recovery (Immediate — $0 today, should be $X/mo)
- **LAB10 Publishing**: 82 Leigh Bray tracks unregistered at MLC. The Auditor generates the submission CSV automatically.
- **SoundExchange**: 0 tracks registered. Factory registers Leigh Bray as performer + DSR as rights holder.
- **CMRRA**: accounts 02274554/02274555 not activated. Factory activates and files catalog.

### Category 2 — Sync Licensing (Mid-Term — passive income from catalog)
- The Pitcher monitors brief databases weekly
- 136 DirtySnatcha tracks → match to film/TV/ad briefs
- Target: 2-3 sync placements/year at $500-5,000 each

### Category 3 — Booking Outreach (Active — proactive vs. reactive)
- Current model: wait for inbound offers
- Factory model: The Hustler proactively pitches 10 new venues/week
- Target: 30% conversion on new market penetration

---

## Self-Healing Design

When any worker fails:
1. **Verifier** flags the error (API timeout, hallucination, form failure)
2. **Supervisor** receives the flag during its monitoring loop
3. **Reversible Reasoning**: roll back to last stable state
4. Supervisor calculates new execution path
5. Thomas is NEVER interrupted for recoverable errors

Thomas IS interrupted for:
- Financial transaction failures
- Auth/OAuth expiration requiring manual login
- Contract execution failures
- Any outbound communication that failed after 3 retries

---

## Cost Architecture (Zero-Waste)

| Task Type | Route To | Cost |
|-----------|----------|------|
| Heavy data scanning (bulk catalog analysis, royalty scans) | Ollama (local) | $0 |
| Repetitive generation (50 email variants, bulk categorization) | Ollama → Claude reviews sample | ~$0 |
| Consumer-facing chat (Xai agent) | Gemini Flash | ~$0 |
| Complex reasoning (architecture decisions, negotiations) | Claude Sonnet | $ |
| Build-time code generation | Claude Sonnet | $ |

Target: Claude tokens reserved exclusively for orchestration, complex reasoning, and Thomas-facing interactions. Workers handle their own domains locally wherever possible.

---

## GitHub / MCP / Tools Needed

| Tool | Use |
|------|-----|
| **GitHub Actions** | Trigger cron workflows (daily royalty scan, weekly sync brief check) |
| **Supabase MCP** | Workers read/write DB without raw SQL in every prompt |
| **Gmail MCP** | Offer detection, pitch email drafting, outreach tracking |
| **Google Drive MCP** | Contract storage, EPK management, asset library |
| **Meta Ads MCP** | Campaign execution for MHP and artist promos |
| **Google Calendar MCP** | Availability check for booking routing |
| **Discord webhook** | All results flow to Thomas here |
| **Vercel cron** | Schedule autonomous worker runs |
| **Ollama (local)** | Zero-cost bulk processing |

---

## Current Gap Summary

| Layer | Status |
|-------|--------|
| Architecture | ✅ Defined (this doc) |
| 8-agent personas | ✅ Designed (KA module 24) |
| NotebookLM validated | ✅ 3 queries done |
| Claude Code skills | ❌ 0 built |
| Autonomous pipelines | ❌ 0 running |
| MHP sub-factory | ❌ 0 built |
| Cron/GitHub Actions | ❌ 0 configured |
| Discord reporting | ✅ Webhook working (1-way) |

**Next action:** Build Phase 1 skills (factory-orchestrator, discord-reporter, supabase-reader, llm-router). These are the foundation everything else runs on.

---

## MHP Vision

My Hydration Pack: currently dormant. Target: $1M+ merch/dropship operation.

**Model:** Curated hydration + outdoor lifestyle merch. Dropship (no inventory risk). Automated via Shopify + Printful/Spocket. Scaled via Meta Ads.

**Why it works with the factory:**
- Same Meta Ads infrastructure as DSR/TENx10 artist marketing
- Same UGC/influencer playbook as artist promo
- MHP Workers reuse the llm-router, discord-reporter, and supabase-reader foundation
- Thomas approval point stays the same — he approves product catalog + ad spend budgets, factory executes

**Revenue projection (conservative):**
- 500 orders/month × $35 AOV × 40% margin = $7,000/month net
- Scale to 2,000 orders/month = $28,000/month net

---

*Factory BRAIN v1.0 — April 25, 2026*
*Built from: NotebookLM AI Agent Architecture notebook + TENx10 KA Module 24 + Thomas Nalian direction*
