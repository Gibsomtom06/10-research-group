# 10 Research Group — Strategic Review and Gaps

**Date:** 2026-04-28
**Author:** Synthesized by Claude from Thomas's NotebookLM research notebook + the 10 Research Group brain
**Status:** Living doc — should be revisited after each NotebookLM follow-up query

---

## Sources reviewed

- **NotebookLM notebook** (`c0290609-e7cc-4fc7-ad98-2bd34868313a`) — queried successfully on 2026-04-28 after fresh auth. Pulled research on: agent hierarchy designs, business-growth automation patterns, failure modes, what NOT to do, framework recommendations.
- **Brain files** referenced in the BRAIN.md SSOT index, including:
  - `BRAIN.md` (top-level operating system)
  - `docs/superpowers/specs/2026-04-27-factory-architecture-design.md` (current factory)
  - `docs/superpowers/specs/2026-04-27-trading-shadow-test-design.md` (Phase 0 use case)
  - `FACTORY_BRAIN.md` and `EMPLOYEE_DIRECTORY.md` (legacy)
  - `products/mhp/BRAIN.md`, `products/trading-shadow/BRAIN.md`

---

## Where the brain ALIGNS with the research (validates current direction)

The factory architecture is genuinely well-designed against external research benchmarks. Specific alignments:

| Brain artifact | Research validation |
|---|---|
| Factory Boss using **Plan-Execute-Summarize (PES)** | Notebook calls PES the prevention mechanism for "agent stuck-in-loop" failure mode |
| **Supervisor → Lead → Sub** hierarchy | Notebook: hierarchical Supervisor-Worker pattern is the best cost-accuracy tradeoff |
| **Department Lead** routes to **Subs** with scoped tools | Matches the RP-ReAct pattern (Reasoner-Planner Agent for strategy, Proxy-Execution Agents for tools) |
| Thomas-as-only-approval-point on financial / outbound / contract actions | Avoids "100% faceless automation" failure mode (notebook flags YouTube demonetizing AI slop without human oversight) |
| Hard guardrails (per-trade max, hard floor, asset class restriction) before broker submission | Avoids "Over-Permissioning" failure mode |

**Net: the architecture is not reinventing failed wheels. The hierarchy and approval-gate design is correct.**

---

## Top 3 risks where the brain DIVERGES from the research

### Risk 1 — Orchestration Debt

**Research finding:** *"Accumulating fragmented AI agents, APIs, and legacy systems without a unified control layer causes brittle workflows that break under scale."*

**Where the brain has this risk:**

- Multiple in-flight agent systems (trading-shadow, ideas-inbox, conversation shadow, future MHP merch generators, future TENx10 platform agents) — all building toward the factory but currently fragmented
- Factory Boss (`factory-orchestrator` skill) exists but isn't yet integrated as the unified router
- Each system has its own JSONL log, its own runner, its own Discord channel pattern — no unified observability

**How to mitigate:**

- Wire the **Factory Boss** orchestrator into every new agent before it ships (not after)
- One observability layer (single Discord channel routing OR single dashboard) before scaling beyond 3 agents
- Standardize the agent contract: every agent reports `{status, output, cost, error}` in the same shape

### Risk 2 — Reversible Reasoning Not Implemented

**Research finding:** The **ReAgent** framework provides "non-monotonic backtracking, allowing agents to locally or globally roll back their state to a safe point if they detect a contradiction."

**Where the brain has this risk:**

- The factory architecture spec mentions Reversible Reasoning at L1 but no implementation exists
- When the trading shadow goes live Friday 5/1, there's no rollback mechanism if it makes a chain of bad decisions — only a halt switch
- Conversation shadow, MHP agents, and future depts are also being built without rollback semantics

**How to mitigate:**

- Add a rollback primitive to the decision logger schema (each entry references a `prior_state_id` so we can replay from any point)
- For trading specifically, define what "rollback to safe point" means (close positions? revert strategy params? both?) before live cutover
- Long-term: study ReAgent's non-monotonic semantics for adoption in the Factory Boss

### Risk 3 — Environment Blurring

**Research finding:** *"Do not share API keys across development and production environments; compromised dev environments can expose production data."*

**Where the brain has this risk:**

- The trading-shadow `.env` has both `ALPACA_PAPER_API_KEY` and `ALPACA_LIVE_API_KEY` in the same file, used by the same Python process
- Subagents that touch `.env` (Tasks 4-11) implicitly load both keys — paper-trading code can read live keys without intent
- The `.env` consolidation done today (merging DBA worker keys into trading-shadow `.env`) compounds this

**How to mitigate:**

- Split into `.env.paper` and `.env.live` — process loads one or the other based on a `MODE=paper|live` env var
- Live keys should only be loaded when explicitly running live mode (Friday cutover and beyond)
- Audit the alpaca-py wrapper to confirm it can't accidentally use the wrong account

---

## Recommended frameworks worth evaluating

The notebook surfaces three concrete frameworks. Quick assessment of fit:

| Framework | What it does | Fit for 10 Research Group | Recommendation |
|---|---|---|---|
| **ReAgent** | Reversible multi-agent with backtracking | High — directly fixes Risk 2 | Drill in after Friday's trading cutover; pilot on conversation shadow first |
| **Orchestral AI** | Synchronous deterministic execution + pre/post hooks | Very high — directly competes with Factory Boss design | **Highest priority follow-up question** — should we adopt vs build? |
| **Capitulate and Cultivate** | Buy foundation models, build proprietary orchestration + vector DBs | Strategic alignment check — Thomas already does this for Claude / Ollama | No build needed, but principle should be explicit in BRAIN.md |

---

## Industry case studies relevant to MHP / TENx10

These are pulled from the notebook to ground the trading-shadow thesis ("agent learning before scale") in real numbers:

- **Mid-market retailer (anonymous):** Multi-step agent updated 80,000 SKUs across platforms autonomously. Eliminated 40 manual hours/week. **Return rates dropped from 3.2% to 1.1%.** *Relevant to MHP catalog operations.*
- **B2B SaaS (anonymous):** Tier-2 support agent using RAG on past tickets. **Response time 18hr → 4min. Saved $140K/year in unneeded headcount.** *Relevant to future TENx10 customer support layer.*
- **Retail AI Arbitrage ("Flipper" model):** Agents scan thousands of clearance/liquidation items, identify price gaps, autonomously cross-list profitable inventory to Amazon/eBay. *Directly relevant to your MHP viral-merch generation idea — same pattern, different inputs.*

---

## 5 Brain Gaps (concrete additions/changes)

1. **Add a "Rollback contract" section to the factory architecture spec.** Define what rollback means at each layer (Factory Boss, Department Lead, Sub, Shadow). File: `docs/superpowers/specs/2026-04-27-factory-architecture-design.md`.
2. **Split `.env` into `.env.paper` / `.env.live`** for trading-shadow before Friday's cutover. Update `config.py` to load the right one based on `MODE`. File: `products/trading-shadow/`.
3. **Make the `Capitulate and Cultivate` principle explicit in BRAIN.md** — "We rent foundation models from Anthropic / Ollama. Our moat is the orchestration layer + the conversation corpus + the per-project brains."
4. **Add a "Unified Observability" section to BRAIN.md** that defines what every agent must report (status, output, cost, error) so we don't accumulate orchestration debt as more agents ship.
5. **Update `EMPLOYEE_DIRECTORY.md` (currently marked superseded)** OR delete it entirely and redirect readers to the 2026-04-27 architecture spec. Right now it's a stale source of truth that contradicts the new doc.

---

## 3 Quick Wins This Week

1. **Split `.env`** (Risk 3 mitigation) — 30 min. Do before Friday live cutover. **DONE 2026-04-28** — `.env.paper` and `.env.live` exist; `config.py::Config.from_env()` loads the right one based on `MODE`. Live keys are not loaded in paper mode.
2. **Run a NotebookLM follow-up specifically on Orchestral AI** — if the framework solves what Factory Boss is being built for, Thomas saves weeks. ~5 min query, decision-shaping.
3. **Wire trading-shadow's runner.py through Factory Boss orchestrator** — instead of running `loop_paper.py` standalone, the runner registers with Factory Boss, posts heartbeats, accepts kill signals. Prevents trading-shadow from becoming the first "fragmented agent without unified control."

## Rollback primitive (Risk 2)

**Status: shipped 2026-04-28.** `Decision` dataclass now carries `decision_id` (uuid hex) and `prior_state_id` (chain-pointer to previous decision on the same `(track, agent)` lineage). `DecisionLog.rollback_to(state_id)` returns the decision chain up to and including that state — read-side rollback, append-only file. Backward compatible with legacy JSONL rows that lack the new fields. Tests in `tests/test_decision_log.py`.

**What this does NOT yet define:** the operational meaning of "rollback to safe point" for live trading (close positions? revert strategy params? both?). That remains a pre-cutover decision Thomas needs to make. The primitive is now in place to *implement* whichever semantics he picks.

---

## Follow-up Research Questions (queue for next NotebookLM session)

1. **Orchestral AI framework drill-down** — How does it manage tool routing, async vs sync execution, and pre/post hooks? Is it open source / adoptable, or is it conceptual?
2. **ReAgent backtracking** — what's the actual implementation pattern? Database snapshots? Event sourcing? Tradeoffs at scale?
3. **Capitulate and Cultivate case studies** — which companies have successfully built defensible orchestration layers on top of commodity foundation models? What did they invest in that the foundation models couldn't replicate?

---

## What this memo does NOT include

- Verbatim NotebookLM citation numbers (notebook's response had source numbers like `[1]`, `[2]`, etc., but these reference the notebook's internal source library which is opaque to this memo). To trace a specific claim, query NotebookLM with the exact phrase.
- Code-level prescriptions for the Orchestral AI / ReAgent integrations — those need their own specs once we decide whether to adopt or build.
- A budget / time estimate for closing the gaps. Those estimates depend on whether we adopt frameworks or build custom.

---

*Memo v1.0 — 2026-04-28. Should be re-run after each major architecture change or quarterly. Each follow-up NotebookLM query should append findings, not replace them.*
