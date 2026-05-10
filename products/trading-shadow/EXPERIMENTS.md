# Trading Shadow — Experiment Log

Every change made in pursuit of graduation gets a row here. Rule: if the change didn't move the needle, that's still data — log it. The only mistake is not capturing why we tried what we tried.

## Graduation gate (canonical, from `Config` in `src/trading_shadow/config.py`)

- `GRADUATION_ACCURACY = 0.90` — shadow's action matches Claude's on 90%+ of paired decisions
- `GRADUATION_MIN_TRADES = 50` — at least 50 paired decisions per asset class
- `GRADUATION_MIN_PROFIT_USD = 1.0` — Claude is making $1+ realized P&L per day on paper

All three must hold per asset class before live cutover for that class.

## Entry shape

```
### NNN · YYYY-MM-DD HH:MM ET · <one-line-title>

**Hypothesis:** what we think is true / what we think will move
**Change:** the actual code/config/prompt diff (commit SHA when relevant)
**Expected:** the metric we expect to move and by how much
**Actual:** measured numbers before/after
**Decision:** keep · revert · iterate
**Lesson:** what this taught us about the system (the reusable insight)
```

---

### 001 · 2026-05-09 22:43 ET · Case-normalize action strings in accuracy_tracker

**Hypothesis:** Equities accuracy was reported at 57.4% but inspection of `data/decisions.jsonl` showed `claude` writes lowercase actions (`buy`/`sell`/`hold`) while `shadow` writes uppercase (`BUY`/`SELL`/`HOLD`/`LONG`). The literal `==` compare in `accuracy_tracker.compute_accuracy` was rejecting matches that were semantically identical. This isn't a strategy gap — it's a measurement bug masking real agreement.

**Divergence analysis run before the fix** (557 clean pairs, no errors either side, equities only):

| claude | shadow | count | nature |
|---|---|---|---|
| hold | buy | 84 | real disagree (shadow more aggressive long) |
| buy | hold | 69 | real disagree (shadow more conservative) |
| buy | BUY | 25 | **case-only** |
| hold | SELL | 17 | real disagree (shadow more aggressive short) |
| hold | HOLD | 15 | **case-only** |
| hold | BUY | 11 | real disagree (shadow more aggressive long) |
| buy | HOLD | 6 | real disagree (shadow more conservative) |
| sell | buy | 5 | real disagree (opposite directions) |
| sell | HOLD | 1 | real disagree |
| hold | LONG | 1 | **alias-only** (LONG = buy) |

42 of the 236 clean disagreements (17.8%) were pure case/alias artifacts.

Operational findings (separate from accuracy):
- `claude` agent had 112 error decisions (15.5% of its 725 total). 29 of those were `anthropic_credit_balance` — the API key ran out of credit and the agent defaulted to `hold` with an error reason. The remaining 83 are `other_error` — undiagnosed.
- `shadow` agent had 21 error decisions (much cleaner). The leaderboard's "shadow=0 errors" wasn't quite right; some error rows exist but far fewer.
- `social_media_trader` (477 decisions) and `shadow_copy` (82 decisions) are not paired into the gate.

**Change:** [`src/trading_shadow/accuracy_tracker.py`](src/trading_shadow/accuracy_tracker.py) — added `_normalize_action(action)` that lowercases, strips, and aliases `long→buy`/`short→sell`. Both sides of the equality comparison run through it.

**Expected:** equities accuracy lifts from 57.4% to ~65% (~42 pairs reclassified as agreements).

**Actual:**

| Metric | Before | After | Delta |
|---|---|---|---|
| Equities clean accuracy | 57.4% (396/690) | **65.2%** (450/690) | +7.8 pp |
| Tests passing | 3/3 | 3/3 | clean |

Still 24.8 pp short of the 90% gate. Real divergence, not measurement noise, dominates the remaining gap.

**Decision:** keep.

**Lesson:** before chasing strategy improvements, audit the measurement pipeline. The gate's accuracy figure was fake-low for weeks of paper runs, which would have led to wrong "the prompts are bad" conclusions if we hadn't looked. **Whenever a metric doesn't move, suspect the metric before suspecting the strategy.**

---

## Open failure modes to investigate next

1. **Default-bias asymmetry between claude and shadow prompts.** Real disagreements skew "claude=hold, shadow=buy" (84) and "claude=buy, shadow=hold" (69). Suggests the two agents have systematically different defaults. Check whether `prompts_v2` (referenced in `CUTOVER_RUNBOOK.md` as fixing claude's default-to-hold bias) has been swapped in for shadow but not claude (or vice versa).
2. **`claude` 83 unclassified `other_error` decisions.** Need to read raw rows and categorize. Suspect a mix of malformed JSON responses, network blips, and rate-limit retries.
3. **No paired decisions for ETF (Lane 3 leveraged), options (Lane 4), crypto, forex.** Either no shadow agent runs for those classes, or paired logging isn't tagging them. Without pairs, those lanes can't ever graduate by the current gate. Decision needed: drop the gate per-class, or run shadow for those lanes.
4. **`anthropic_credit_balance` errors (29 of 112).** Operational, not strategy. Need a credit-monitor + alert before the API hits zero.

## Open questions for Thomas

- Is the 90% gate per-asset-class, or aggregate? Code reads per-class (`compute_accuracy(decisions, asset_class=ac)`), `CUTOVER_RUNBOOK.md` is silent on aggregate-vs-per-class. If per-class, we'd be graduating equities first while ETF/options/crypto/forex stay paper indefinitely until they get pairs.
- Is "shadow agreement with claude" the right north-star metric, or should we shift to "shadow's own P&L on paper" once it's making decisions independently? The current gate says "shadow learned to imitate claude"; the value-aligned gate would say "shadow makes money on its own."
