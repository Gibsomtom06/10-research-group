# 10 Research Group — Skill Library

**Last updated:** 2026-04-25
All Claude Code skills. Location: `C:\Users\Slash\.claude\skills\`

---

## Built Skills (Ready to Use)

| Skill | Trigger | Description |
|-------|---------|-------------|
| `factory-orchestrator` | "run the factory", "daily factory run", cross-domain tasks | L1 Supervisor — PES framework, routing, self-healing |
| `dsr-booking-evaluator` | "got an offer", "should I take this show", offer email pasted | Full 6-step booking evaluation → counter draft → Discord |
| `dsr-daily-briefing` | "daily briefing", "morning update", "what matters today" | Comprehensive DSR daily status from live data |
| `royalty-auditor` | "royalty audit", "MLC submission", "uncollected royalties" | Scan for unclaimed royalties → generate MLC CSV → queue |
| `discord-reporter` | Any agent result needing Discord delivery | Format + send results/approvals/alerts to Discord |
| `prompt-skill-evaluator` | "evaluate this prompt", "grade this skill", "review this agent" | 6-criterion quality audit with score + improved version |
| `agent-creator-from-article` | "make a skill from this", "turn this into an agent", URL/article pasted | Ingest any content → output prompts, skills, agents, subagents |
| `notebooklm` | "ask my notebooklm", "check my docs", /notebooklm | Query Google NotebookLM notebooks via browser automation |
| `edm-booking-agent` | EDM/Dubstep booking context | Elite EDM booking agent persona |
| `pr-description` | PR context | PR description generation |
| `ui-ux-pro-max` | UI/UX review requests | UI/UX design intelligence |
| `web-design-guidelines` | UI code review | Web interface guidelines review |
| `skill-creator` | "create a new skill", "build a skill" | Build new skills from scratch |

**Superpowers skills** (auto-loaded): brainstorming, writing-plans, executing-plans, tdd, debugging, code-review, etc.

---

## Skills To Build (Priority Order)

### Phase 1 — Foundation (Build These First)

| Skill | What It Does | Owner Agent | Priority |
|-------|-------------|-------------|----------|
| `factory-orchestrator` | L1 Supervisor: PES framework, routing logic, reversible reasoning, worker delegation | The Factory Boss | 🔴 P1 |
| `discord-reporter` | Formats and sends any agent result to Discord with proper embeds | Discord Reporter | 🔴 P1 |
| `supabase-reader` | Safe read-only DB queries — gives any worker live DB context | All workers | 🔴 P1 |
| `llm-router` | Route task to right model: Claude (complex) / Gemini (consumer) / Ollama (bulk) | The Router | 🔴 P1 |

### Phase 2 — Revenue Recovery (Highest ROI)

| Skill | What It Does | Owner Agent | Priority |
|-------|-------------|-------------|----------|
| `royalty-auditor` | Nightly scan → find unclaimed royalties → generate MLC CSV → LAB10 queue | The Auditor | 🟠 P2 |
| `release-monitor` | Daily Popularity Score polling → decay alerts → campaign triggers | Launch Commander | 🟠 P2 |
| `sync-pitcher` | Weekly brief scan → catalog match → pitch email draft | The Pitcher | 🟠 P2 |
| `booking-hustler` | Proactive venue/festival outreach → EPK sender | The Hustler | 🟠 P2 |

### Phase 3 — Growth Engine

| Skill | What It Does | Owner Agent | Priority |
|-------|-------------|-------------|----------|
| `rj-jackson` | RJ persona: PR campaigns, editorial pitching, press outreach, cold email | RJ Jackson | 🟡 P3 |
| `content-calendar` | Weekly content generation per artist per platform in their voice | Algorithm Whisperer | 🟡 P3 |
| `promo-manager` | UGC campaigns, fan leaderboard, download gate funnels | Street Team Commander | 🟡 P3 |
| `artist-manager` | Daily white space identification, P&L, career trajectory, 7-pillar revenue | The Strategist | 🟡 P3 |

### Phase 4 — MHP Factory

| Skill | What It Does | Priority |
|-------|-------------|----------|
| `mhp-product-scout` | Scan Printful/Spocket/Faire → high-margin SKU recommendations | 🟡 P4 |
| `mhp-store-operator` | Shopify product sync, pricing, inventory management | 🟡 P4 |
| `mhp-growth-engine` | Meta Ads ROAS optimization for MHP campaigns | 🟡 P4 |
| `mhp-brand-builder` | Sponsorship decks, influencer outreach, brand deal pipeline | 🟡 P4 |

### Phase 5 — Platform Intelligence

| Skill | What It Does | Priority |
|-------|-------------|----------|
| `system-architect` | Supabase schema gen, Vercel provisioning, architecture docs | 🟢 P5 |
| `ux-designer` | React component specs, Tailwind, mobile-first review | 🟢 P5 |
| `api-sentinel` | OAuth health monitoring, webhook testing, reconnect flows | 🟢 P5 |
| `social-architect` | Platform-native content, algorithm playbooks per platform | 🟢 P5 |

---

## MCP Servers (Available Now)

| MCP | Used By | Status |
|-----|---------|--------|
| Gmail | Booking evaluator, RJ Jackson, Booking Hustler | ✅ Connected (tokens expired — needs reconnect) |
| Google Drive | Contract storage, EPK, asset library | ✅ Connected |
| Google Calendar | Booking routing, conflict check | ✅ Connected |
| Meta Ads | MHP growth, artist show promo | ✅ Connected |
| Supabase | All DB operations | ✅ Connected |
| Vercel | Deploy, env vars, logs | ✅ Connected |
| Google NotebookLM | Knowledge queries | ✅ Connected (via notebooklm skill) |
| Microsoft Learn | Technical reference | ✅ Connected |
| Netlify | N/A | ✅ Connected |

---

## Skill File Format

Each skill lives at `C:\Users\Slash\.claude\skills\<skill-name>\SKILL.md`

```markdown
# Skill Name

**name:** skill-name
**description:** One sentence describing when this triggers. This is what Claude reads to decide whether to invoke it.

---

## What This Skill Does
[Purpose]

## When to Use
- Trigger condition 1
- Trigger condition 2

## Process
[Step-by-step instructions]
```

To build a new skill: use the `skill-creator` skill or create the directory + SKILL.md manually.

---

## Revenue Impact by Skill

| Skill | Revenue Source | Est. Annual Value |
|-------|---------------|------------------|
| `royalty-auditor` | Uncollected MLC + PRO royalties | $5K-50K (136 tracks) |
| `sync-pitcher` | Sync placement fees | $1K-15K/year |
| `booking-hustler` | New market penetration | $10K-30K/year |
| `release-monitor` | Prevents revenue decay, maximizes algorithmic placement | Multiplier on existing streams |
| `mhp-growth-engine` | MHP merch/dropship margin | $84K-336K/year at scale |

**Highest ROI first: `royalty-auditor` → `booking-hustler` → `sync-pitcher`**
