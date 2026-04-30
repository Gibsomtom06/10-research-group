# PRD — Model routing + token meter

**Owner:** Thomas
**Drafted by:** Claude (Cowork)
**Status:** Scoped, not built
**Priority:** High — blocks enterprise unit economics, not Phase 0 launch

---

## Problem

At scale, DBA's 7-agent system running everything on Claude Sonnet costs ~$30-150/tenant/month in model spend. At $199/mo pricing that's 50-85% gross margin — acceptable but not great. At 100 tenants it's $3K-15K/month in API burn.

Different agent tasks have wildly different cognitive needs. Supervisor decisions need deep reasoning; Routing just classifies an email into one of 5 buckets. Forcing both through Sonnet is paying Porsche prices for a Toyota commute.

## Goal

Introduce a **model router** inside DBA so each agent call runs on the cheapest model that can do its job cleanly. Target unit economics: **$3-15/tenant/month** in model spend, yielding 92-98% gross margin.

## Non-goals

- Not building a universal ML ops platform
- Not supporting every open model under the sun — pick 2-3 providers, ship
- Not running a local model in production as Phase 0 (too fragile)
- Not optimizing before measuring — token meter ships first, routing ships second

---

## Scope

### Four tiers

| Tier | Model | Cost (per M tokens, in/out) | Used for | % of calls (est.) |
|------|-------|-----|-----|-----|
| A | Claude Sonnet 4.6 | $3 / $15 | Supervisor, Outbound (brand voice), Research synthesis | ~15% |
| B | Claude Haiku 4.5 | ~$0.80 / $4 | Routing, Inbound parsing, VIP/hold classifiers | ~40% |
| C | Llama 3.3 70B (Groq/Together) | $0.10-0.60 / $0.10-0.60 | Reporting, bulk summarization, enrichment | ~35% |
| D | Qwen 2.5 / Llama on self-hosted Ollama or local dev | $0 marginal | Batch offline jobs, pre-compute during quiet hours | ~10% |

### Hard rules (non-negotiable)

- **Outbound agent → Tier A forever.** Brand voice is the product. No fallback, no downgrade under any circumstance.
- **Supervisor → Tier A for decisions that change agent routing or customer-facing actions.** Can call Tier B/C for internal lookups.
- **Any agent that writes or sends customer-facing text → minimum Tier A.**
- **Tier D never touches live customer flows.** Batch and offline only.

---

## Phase 0 (build now — before first tenant live)

Ship the foundation so we can measure and swap without refactoring later.

### Components

1. **`agents/model_config.py`** — single source of truth mapping `agent_name → model_id`. Example:
   ```python
   MODEL_ROUTING = {
       "supervisor":  "claude-sonnet-4-6",
       "outbound":    "claude-sonnet-4-6",
       "research":    "claude-sonnet-4-6",
       "inbound":     "claude-sonnet-4-6",   # → Haiku in Phase 1
       "routing":     "claude-sonnet-4-6",   # → Haiku in Phase 1
       "analyst":     "claude-sonnet-4-6",   # → Haiku in Phase 1
       "reporting":   "claude-sonnet-4-6",   # → Groq in Phase 2
   }
   ```
   Every agent reads from this instead of hardcoding a model. Changing tiers = one line.

2. **`agents/model_router.py`** — thin wrapper around provider SDKs. Accepts `agent_name`, returns a client that can call the right model with the right auth. Handles Anthropic + Groq + Together in a uniform interface.

3. **`model_calls` table** in Supabase:
   ```sql
   CREATE TABLE model_calls (
     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id   uuid,
     artist_id   uuid,
     agent_name  text NOT NULL,
     model_id    text NOT NULL,
     input_tokens int NOT NULL,
     output_tokens int NOT NULL,
     latency_ms  int,
     cost_usd    numeric(10,6),
     task_type   text,         -- e.g. 'classify_inbound', 'draft_outbound'
     success     boolean,
     error       text,
     created_at  timestamptz DEFAULT now()
   );
   CREATE INDEX ON model_calls (tenant_id, agent_name, created_at DESC);
   CREATE INDEX ON model_calls (agent_name, created_at DESC);
   ```

4. **Cost calculator** inside model_router — hardcoded cost table per model, computes `cost_usd` per call. Updated when Anthropic changes pricing.

5. **Simple dashboard page** at `/app/dashboard/costs` showing last 30 days of spend by tenant × agent. Just a table. No charts.

### What Phase 0 does NOT include

- Automatic fallback between tiers
- Groq/Together integration (config supports it but no code path yet)
- Quality sampling / drift detection
- Per-tenant cost alerts

---

## Phase 1 (2 weeks after first tenant live — measure, then cut)

### Prerequisite

Two weeks of production usage logged in `model_calls`. Top 2 agents by token volume identified. Usually Routing + Inbound (they fire on every email).

### Build

1. **Add Anthropic Haiku paths** to model_router. Switch the top 2 cost-driving agents to Haiku in model_config.py.

2. **Quality eye-test:** before flipping the switch, run the same 20 real inputs through both Sonnet and Haiku, diff outputs, confirm Haiku is acceptable. If Haiku degrades on any critical task (misroutes an email, misclassifies a VIP), stay on Sonnet for that one.

3. **Token-meter dashboard upgrade:** add before/after comparison view so we can see the savings from each swap.

---

## Phase 2 (before Milestone 2 multi-tenant refactor)

1. **Add Groq/Together client** to model_router. Ship `llama-3.3-70b-versatile` via Groq (fastest, cheapest of the fast-cheap providers). Fallback to Together if Groq is down.

2. **Route Reporting agent to Tier C.** Reporting is templated — writes daily/weekly reports in a bounded format. Open models handle this cleanly.

3. **Fallback logic:** if Tier C errors twice within 30 seconds, retry once on Tier B for this call. Log the fallback event. If fallbacks exceed 5% of Tier C calls over 1 hour, page Thomas.

4. **Per-tenant cost dashboard** — add to the main supervisor dashboard. Shows cost-per-tenant-per-day with a target line at $0.50/tenant/day.

---

## Phase 3 (at 10+ tenants — optimize tail)

1. **Self-hosted Ollama on VPS** for Tier D if — and only if — we have a batch workload large enough to justify the ops cost of running a GPU VPS. Most common candidate: contact enrichment at tenant onboarding (new tenant imports 15K contacts, we enrich all of them overnight).

2. **Quality sampling:** 1% of Tier B/C outputs get graded by Tier A. If drift detected (Tier B gets a classification wrong that Tier A gets right), flag the input pattern and consider bumping that task back up a tier.

3. **Per-tenant model budgets:** hard caps. If a tenant exceeds 10x their subscription cost in model spend (runaway loop, abuse), Supervisor kill-switches their queue and pages Thomas.

---

## Embeddings (sibling decision, not part of the tier routing)

**Provider: Voyage AI** (Anthropic's embeddings partner, acquired 2024). Project-scoped API key, not org-scoped.

- **Primary model:** `voyage-3-large` — 1024 dims, matches `voice_samples.embedding vector(1024)` column. Use for voice-sample retrieval (Outbound pulls closest past samples to Thomas's tone for a given recipient/context).
- **Future code agent use:** `voyage-code-3` — 1024 dims. For when we embed code or agent prompts for RAG.
- **Cost:** ~$0.12 per 1M tokens. Negligible at DBA's volume (voice samples are a few hundred strings per tenant; re-embedding happens only when Thomas adds new samples).
- **Why not OpenAI text-embedding-3:** adds another vendor, weaker retrieval on semantic benchmarks, and we want embedding provider aligned with generation provider for coherent vendor management.
- **Why not Cohere / local:** Voyage is what Anthropic ships with. Keep the stack coherent until there's a reason to diversify.

**Swap path:** if Voyage ever becomes a problem (outage, pricing change), the column stays `vector(1024)` and we swap any 1024-dim replacement behind the same embeddings client. No schema change needed.

**Env var:** `VOYAGE_API_KEY` in `.env.local` and `.env.example`. Named project-scoped key in Voyage console: `digital-booking-agent` or `DBA-prod`.

---

## Open questions (answer before Phase 1)

1. **Groq vs Together vs DeepInfra** — benchmark on our actual tasks. Groq is faster, Together has wider model selection, DeepInfra is cheapest on some models. Pick one as primary.

2. **Do we bill customers by usage, flat-rate, or tiered?** This changes the per-tenant budget logic. Recommend: flat-rate tiers ($99 / $299 / $699) with soft usage caps, hard cutoff at 3x cap. Most SaaS works like this.

3. **Haiku-quality threshold for customer-facing text.** Today rule: Tier A for anything sent externally. Revisit once we have 6 months of Haiku data — Haiku 4.5 might be good enough for non-Outbound externals (calendar invites, internal notes visible to tenant).

4. **Local Ollama as dev-time fallback if Anthropic is down.** Worth exploring — means DBA never fully fails, just degrades. But adds complexity. Parking for now.

---

## Success metrics

**Phase 0:** Every agent call logged with cost. Zero hardcoded model IDs in agent code.

**Phase 1:** Token spend on top 2 agents drops 85%+ with no observable quality regression.

**Phase 2:** Per-tenant monthly model cost < $15 average across all tenants.

**Phase 3:** Gross margin per tenant > 92% at $199/mo price point.

---

## Risk / non-obvious gotchas

- **Token accounting drift.** Every provider counts tokens differently (Anthropic ≠ OpenAI ≠ Llama tokenizer). Don't assume totals are comparable across providers. Only compare within-provider.
- **Haiku quality on long contexts.** Haiku is great on short tasks, degrades faster than Sonnet on long context (>20K tokens). If an agent's prompt grows, it may silently lose accuracy — keep an eye.
- **Groq rate limits.** Free tier has aggressive limits. At production volume we'll need a paid plan or multi-account shard. Budget: $0-20/mo to start.
- **Self-hosted Ollama is an ops burden.** Running a GPU VPS means patching, monitoring, restarting. If we can't commit 1-2 hours/month to maintaining it, skip Tier D and stick with Tier C for "as cheap as it gets."
- **Brand voice drift.** If Outbound ever gets downgraded "just for this one experiment," quality degrades customer perception in ways we won't see until a promoter complains. Treat the Tier A floor as sacred.

---

## Delegation

- **Phase 0 build → Gemini (or Thomas-driven) once DBA is deployed.** Well-bounded: add a config file, add a table, add a wrapper. No brand-voice decisions.
- **Phase 1 quality eye-test → Claude.** Requires judgment on whether Haiku output "is good enough" for each task.
- **Phase 2 Groq integration → Gemini with Claude review.** Well-bounded implementation; review pass because fallback logic has safety implications.
- **Phase 3 → Claude-led.** Multi-tenant cost dashboards, drift detection, kill-switch logic all touch safety gates.
