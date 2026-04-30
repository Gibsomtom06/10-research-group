# Trading Shadow — Rollback Handler Spec

**Status:** Spec, not implemented
**Created:** 2026-04-30
**Companion to:** Factory spec Rollback Contract section (`../../docs/superpowers/specs/2026-04-27-factory-architecture-design.md`)

The trading-shadow has the read-side rollback primitive (`decision_log.rollback_to(state_id)`) and the position-closing primitive (`alpaca_client.close_position(ticker)`). **What's missing is the write-side handler that ties them together.** This spec defines that handler so a Trader rollback can be executed deterministically.

Per the Factory Rollback Contract: "If an agent CANNOT define its rollback semantics for an action, that action requires explicit Thomas approval before execution. No silent irreversibility." This file makes Trader rollback explicit.

---

## Trigger conditions (what causes a rollback)

The Trader rollback handler fires when ANY of these occur:

| Trigger | Source | Action |
|---------|--------|--------|
| Hard floor breach | `account_balance < $100` per guardrails | Auto-rollback last N decisions to find safe state, then halt |
| Daily P&L floor breach | EOD `cumulative_pnl < $1` | Auto-rollback today's trades, training continues |
| Strategy contradiction detected | Claude Trader rejects its own prior reasoning mid-loop (e.g., enters a position then immediately wants to exit at a loss) | Rollback the most recent decision in the contradiction chain |
| Manual halt + investigate | Thomas runs `scripts/halt_all.py --rollback-to=<state_id>` | Rollback to specified state, halt remains until cleared |
| Shadow flag | Shadow predicts the Claude action will breach a guardrail and Claude proceeded anyway | Flag for review, NO auto-rollback (Claude is currently authoritative until graduation) |

---

## Per-action rollback definitions (Trader-specific, per Factory spec)

| Decision action in log | Rollback means | Implementation |
|------------------------|----------------|----------------|
| `buy` (filled) | Close at market. Accept slippage as the rollback cost. Log the slippage. **Do NOT wait for price recovery.** | `alpaca_client.close_position(ticker)`. Log realized slippage = `current_market_price - decision.entry_price` × position_size. |
| `buy` (submitted but unfilled) | Cancel the order pre-fill | `alpaca_client.cancel_order(order_id)`. Log the cancel as a `rollback` decision row. |
| `sell` (filled — short or long-exit) | If short: close at market (buy back), accept slippage. If long-exit: cannot un-sell — log as terminal state, mark the rollback chain as "partially recoverable." | Same close_position logic. The "partially recoverable" flag tells the orchestrator some economic effect was irreversible. |
| `hold` | No-op — nothing to roll back | Skip in the rollback walk. |
| Strategy parameter change | Restore prior parameter set from `prior_state_id` | Read `decision.market_state.strategy_params` from the chain at `prior_state_id`, write to the live config. |

**Hard rule:** rollback NEVER opens new positions. It only closes / cancels. If a chain rollback would require opening a new opposite position to "make whole," that's a new strategy decision for Claude — not a rollback action.

---

## Handler shape (Python, fits with existing codebase)

File: `src/trading_shadow/rollback.py`

```python
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from trading_shadow.alpaca_client import AlpacaClient
from trading_shadow.decision_log import Decision, DecisionLog
from trading_shadow.discord_reporter import DiscordReporter


@dataclass(frozen=True)
class RollbackResult:
    state_id: str               # the safe state we rolled back to
    decisions_walked: int       # how many decisions were in the chain
    positions_closed: list[str] # tickers we closed
    orders_canceled: list[str]  # order ids we canceled
    slippage_usd: float         # total realized slippage as rollback cost
    irreversible_actions: list[str]  # decisions we couldn't undo (filled long-exits, sent communications, etc.)
    halted: bool                # True if the rollback also armed the halt switch


class RollbackHandler:
    """
    Write-side rollback for the Trader Sub.

    Per Factory Rollback Contract:
    - Walks the decision chain via DecisionLog.rollback_to()
    - For each rolled-back decision, applies the per-action rollback
    - Closes positions at market (paper or live), accepts slippage
    - Cancels unfilled orders
    - Restores strategy parameters from the safe state's prior_state_id
    - Reports each step via Discord
    - Returns a structured RollbackResult for audit
    """

    def __init__(
        self,
        decision_log: DecisionLog,
        alpaca: AlpacaClient,
        discord: DiscordReporter,
        track: str,         # "A" or "B"
        agent: str = "claude",
    ):
        ...

    def rollback_to(self, state_id: str, reason: str) -> RollbackResult:
        """Execute the rollback. Idempotent — re-running on already-rolled-back chain is a no-op."""
        ...
```

The handler's responsibilities, in order:

1. Read the chain via `self.decision_log.rollback_to(state_id)`
2. Iterate from MOST RECENT to OLDEST, applying the per-action rollback for each
3. For each action, write a NEW decision row to the log marking it as a rollback (so the chain stays append-only and the rollback itself is recorded)
4. Aggregate slippage as we go
5. Restore strategy params from the safe state's `prior_state_id`'s `market_state.strategy_params` (if present)
6. Discord-report a single summary event when complete (NOT one per decision — that's noise)
7. If triggered by a hard floor breach, also call `halt_all.halt(reason)` after rollback

---

## Tests required (TDD per project rules)

File: `tests/test_rollback.py`

| Test | What it verifies |
|------|------------------|
| `test_rollback_to_walks_chain_in_order` | rollback walks decisions in MRU→LRU order |
| `test_rollback_closes_filled_buy` | a `buy` decision in chain → `close_position(ticker)` is called |
| `test_rollback_cancels_unfilled_buy` | a `buy` with status=submitted but no fill → `cancel_order` is called |
| `test_rollback_skips_hold_decisions` | `hold` actions cause no broker calls |
| `test_rollback_logs_slippage` | result.slippage_usd reflects realized close-price - entry-price × size |
| `test_rollback_appends_audit_rows` | decision log gains new rows tagged action="rollback" referencing the original decision_ids |
| `test_rollback_idempotent` | re-running rollback_to on already-rolled-back chain is a no-op (no new broker calls, no new audit rows) |
| `test_rollback_restores_strategy_params` | strategy_params from safe state prior_state_id are restored to config |
| `test_rollback_halt_arms_on_hard_floor` | rollback triggered by hard floor breach calls halt afterward |
| `test_rollback_partial_recovery_flag` | filled long-exit decisions surface in result.irreversible_actions list |
| `test_rollback_unknown_state_id_raises` | non-existent state_id raises ValueError (matches DecisionLog.rollback_to behavior) |
| `test_rollback_discord_summary_single_event` | one Discord post per rollback, not per decision |

Run via the project's existing test command (per implementation plan Task 27): `uv run pytest -v tests/test_rollback.py`

---

## Open questions Thomas decides

- [ ] **Slippage accounting:** does realized slippage during rollback count against the per-trade $5 max? (Suggested: NO — rollback is recovery, not new exposure. But the slippage IS a real loss that hits the $100 hard floor.)
- [ ] **Paper vs live behavior:** should paper-mode rollbacks "replay" against live market data or just simulate? (Suggested: paper rollbacks update the paper simulator; live rollbacks hit the live broker.)
- [ ] **Auto-rollback vs alert-only:** should hard floor breach auto-rollback, or only alert + wait for Thomas? (For Friday cutover: ALERT ONLY by default. Thomas approves the rollback. Once shadow accuracy is high enough, switch to auto-rollback.)
- [ ] **Rollback budget per day:** cap on how many rollbacks per day before requiring Thomas approval? (Prevents thrash from a buggy strategy. Suggested: 3.)
- [ ] **Audit row format:** should rollback rows include the original decision's full snapshot, or just the decision_id reference? (Suggested: just the reference + action="rollback" + reason. The original decision is already in the log; no need to duplicate.)
- [ ] **Strategy params restore:** what if the safe state's `prior_state_id` is null (very first decision)? Then there's no prior params to restore — fall back to the strategy's compile-time defaults.

---

## Pre-Friday cutover checklist

- [ ] Implement `src/trading_shadow/rollback.py` per shape above
- [ ] Implement `tests/test_rollback.py` per test list above (TDD — write tests first)
- [ ] Wire RollbackHandler into `runner.py` so it's instantiated per track
- [ ] Update `scripts/halt_all.py` to accept `--rollback-to=<state_id>` flag
- [ ] Confirm `alpaca_client.cancel_order(order_id)` exists (currently only `close_position` is verified — `cancel_order` may need adding)
- [ ] Smoke test: simulate a 3-decision chain, trigger rollback, verify Discord summary
- [ ] Update BUILD_EVOLUTION.md when handler ships

If the handler ships before Thursday EOD, Friday cutover runs with full rollback path. If not, Friday cutover is paper-only — defer Track A live until Tuesday or until rollback ships.

---

*Spec v0.1 — 2026-04-30. Companion to the Rollback Contract section in the Factory architecture spec. Ready to implement.*
