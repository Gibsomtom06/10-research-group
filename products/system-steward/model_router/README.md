# Model Router

Picks the cheapest sufficient Claude model for a task. Logs every decision. Evaluates over time. Tunes via YAML rules edits (no code change).

This is the first concrete implementation of the **L2 Router** agent from the Factory architecture (`docs/superpowers/specs/2026-04-27-factory-architecture-design.md`).

---

## What it is

One Python module + two YAML files:

```
model_router/
├── __init__.py        — exports route() and Decision
├── router.py          — rule-based routing logic + CLI
├── rules.yaml         — the routing rules (order matters; first match wins)
├── cost_table.yaml    — Anthropic pricing per model
├── evaluate.py        — reads decisions.jsonl, surfaces miscalibration
├── decisions.jsonl    — runtime log (gitignored — created on first call)
└── README.md          — this file
```

Plus the skill spec at `products/tenx10-platform/.claude/skills/model_router/SKILL.md` for agent invocation.

---

## Quick start

### Pick a model
```bash
cd "C:\Users\slash\OneDrive\10 Research Group\products\system-steward"
python -m model_router.router "commit the booking spec to umbrella" --stakes low
```

Output:
```
Model      : claude-haiku-4-5
Rule       : git-commit
Reasoning  : Atomic git ops with clear correct output.
Confidence : 0.95
```

### Use from Python
```python
from system_steward.model_router import route

decision = route(
    task_description="rewrite the trader system prompt for explicit BUY/SELL criteria",
    stakes="medium",
    estimated_input_tokens=2000,
    estimated_output_tokens=1500,
)
# decision.model => "claude-opus-4-7"
# decision.reasoning => "Designing other models' prompts requires meta-reasoning."
```

### Run evaluation
```bash
python -m model_router.evaluate
```

Output (after some routing happens):
```
============================================================
MODEL ROUTER EVALUATION
============================================================
Total decisions      : 47

By model:
  claude-haiku-4-5                  18
  claude-sonnet-4-6                 22
  claude-opus-4-7                    7

By rule:
  git-commit                         8
  code-generation-medium             6
  research-readonly                  5
  ...

Cost analysis:
  Actual                  $0.0341
  If all Opus             $0.6125
  If all Sonnet           $0.1234
  If all Haiku            $0.0181
  Savings vs Opus         $0.5784  (94.4%)

Quality flags:
  Catch-all default rate  4.3%   (high = rules don't cover workload)
  Low-confidence decisions 2     (rules that fired below 0.6 confidence)
  Cheap on high-stakes     0     (potential SAFETY issue)
  Expensive on trivial     1     (potential cost waste)
```

---

## Tuning the rules

`rules.yaml` is the only file you edit to tune routing. Each rule:

```yaml
- name: my-rule
  matches:
    keywords: [foo, bar]        # any keyword in task → match
    keywords_all: [baz, qux]    # ALL must be present
    stakes: [low, medium]       # caller-provided context
    reversibility: reversible
    token_volume: [low, medium]
  model: claude-sonnet-4-6
  reasoning: "Why this routes to Sonnet"
  confidence: 0.85
```

**Order matters: first match wins.** High-stakes / more-specific rules go up top.

After editing rules.yaml, re-run `python -m model_router.evaluate` against historical decisions to see if the new rule would have fired correctly.

---

## When the router says "I don't know"

If no rule matches (shouldn't happen with the catch-all, but can during rule edits), the router emits an `unmatched-default` decision with confidence 0.0 and routes to Sonnet. Watch the catch-all rate in evaluation; >20% means rules don't cover your workload.

---

## What this is NOT

- **NOT a model dispatcher.** It outputs `decision.model`; the caller is responsible for actually invoking that model. The decoupling is intentional — model invocation lives in the agent / SDK layer, not here.
- **NOT a quality scorer.** It doesn't measure whether the recommended model produced good output. Evaluation requires a human signal (Thomas reviewing, a test passing, etc.) — that's a separate layer.
- **NOT a learning model.** Rules are static YAML. Adapting requires manual edits informed by `evaluate.py` output. Future: a self-tuning version that adjusts rules based on outcome signals.

---

## How this fits the broader system

| System | Connection |
|---|---|
| **Factory architecture L2 Router** | This skill is the first implementation |
| **DBA's `model_router.py`** | DBA-specific routing for its 7 specialist agents. Compatible — DBA can call this skill, OR delegate per-task |
| **Trading Shadow** | Trader uses Claude Sonnet 4.6 hardcoded; could switch to router-decided per decision (Opus when stakes >=$5/trade) |
| **TENx10 platform Xai** | Uses Gemini 2.0 flash hardcoded; could route per-question (simple → Gemini, complex → Sonnet) |
| **EMPLOYEE_DIRECTORY** | Mark "L2 LLM Cost Optimizer" as ✅ BUILT (basic) after this lands |
| **Capitulate-and-Cultivate principle** | Foundation models are rented. The router is the orchestration layer on top. Pure moat. |

---

## Backlog (improvements to ship next)

1. **Outcome tracking** — log not just the routing decision but the eventual quality score (human ✅ / ❌, test pass/fail, latency, actual cost). Compare predicted vs actual.
2. **Per-tenant overrides** — DSR may want stricter rules (everything Opus); WRS may want loose (everything Haiku). Multi-tenant rule files.
3. **Token volume estimation** — currently caller passes manually. Add a heuristic: estimated tokens from task description length + tool list.
4. **A/B routing** — when confidence is low, randomly try cheap-vs-expensive on the same task and compare outputs. Builds an empirical knowledge base over time.
5. **MCP server wrapper** — expose `route()` as an MCP tool so any Claude Code session can invoke it natively without writing Python.

---

*Module v1 — 2026-04-30. Built and self-evaluated tonight; tuned in production from there.*
