"""TDD test suite for the Trader rollback handler.

Covers the 12 cases in ROLLBACK_HANDLER_SPEC.md. Uses MagicMock for the
broker (AlpacaWrapper) and Discord reporter; uses a real DecisionLog backed
by a tmp_path JSONL file (mirrors test_decision_log.py conventions).
"""
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from trading_shadow.decision_log import Decision, DecisionLog
from trading_shadow.rollback import (
    RollbackBudgetExceeded,
    RollbackHandler,
    RollbackResult,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _append_buy(log, ticker, size, *, track="A", agent="claude", price=100.0,
                order_id=None, order_status="filled", reasoning="entry"):
    market_state = {
        "price": price,
        "entry_price": price,
        "order_status": order_status,
    }
    if order_id is not None:
        market_state["order_id"] = order_id
    return log.append(Decision(
        timestamp=f"t-{ticker}-{size}",
        track=track,
        agent=agent,
        ticker=ticker,
        action="buy",
        size_usd=size,
        reasoning=reasoning,
        market_state=market_state,
    ))


def _append_sell(log, ticker, size, *, track="A", agent="claude", price=100.0,
                 reasoning="exit", short=False):
    return log.append(Decision(
        timestamp=f"t-sell-{ticker}-{size}",
        track=track,
        agent=agent,
        ticker=ticker,
        action="sell",
        size_usd=size,
        reasoning=reasoning,
        market_state={
            "price": price,
            "entry_price": price,
            "order_status": "filled",
            "short": short,
        },
    ))


def _append_hold(log, ticker, *, track="A", agent="claude"):
    return log.append(Decision(
        timestamp=f"t-hold-{ticker}",
        track=track,
        agent=agent,
        ticker=ticker,
        action="hold",
        size_usd=0.0,
        reasoning="no edge",
        market_state={"price": 100.0},
    ))


def _build_handler(log, *, track="A", agent="claude", broker=None, discord=None,
                   halt=None):
    broker = broker or MagicMock()
    discord = discord or MagicMock()
    return RollbackHandler(
        decision_log=log,
        alpaca=broker,
        discord=discord,
        track=track,
        agent=agent,
        halt_fn=halt,
    ), broker, discord


# ---------------------------------------------------------------------------
# 1. Walks chain MRU -> LRU
# ---------------------------------------------------------------------------

def test_rollback_to_walks_chain_in_order(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    d1 = _append_buy(log, "AAPL", 4.0)
    d2 = _append_buy(log, "MSFT", 4.0)
    d3 = _append_buy(log, "NVDA", 4.0)

    handler, broker, _ = _build_handler(log)
    # current_price stub for slippage logging
    broker.get_latest_price.return_value = 100.0

    handler.rollback_to(d1.decision_id, reason="test")

    # close_position should be called for the most recent first: NVDA, MSFT, AAPL
    tickers_in_order = [c.args[0] for c in broker.close_position.call_args_list]
    assert tickers_in_order == ["NVDA", "MSFT", "AAPL"]


# ---------------------------------------------------------------------------
# 2. Filled buy -> close_position
# ---------------------------------------------------------------------------

def test_rollback_closes_filled_buy(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    _append_buy(log, "AAPL", 4.0, price=100.0, order_status="filled")

    handler, broker, _ = _build_handler(log)
    broker.get_latest_price.return_value = 99.0

    result = handler.rollback_to(safe.decision_id, reason="test")

    broker.close_position.assert_called_once_with("AAPL")
    assert "AAPL" in result.positions_closed


# ---------------------------------------------------------------------------
# 3. Unfilled buy -> cancel_order
# ---------------------------------------------------------------------------

def test_rollback_cancels_unfilled_buy(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    _append_buy(log, "AAPL", 4.0, order_id="order-xyz", order_status="submitted")

    handler, broker, _ = _build_handler(log)

    result = handler.rollback_to(safe.decision_id, reason="test")

    broker.cancel_order.assert_called_once_with("order-xyz")
    broker.close_position.assert_not_called()
    assert "order-xyz" in result.orders_canceled


# ---------------------------------------------------------------------------
# 4. Hold decisions are skipped
# ---------------------------------------------------------------------------

def test_rollback_skips_hold_decisions(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    _append_hold(log, "QQQ")
    _append_hold(log, "MSFT")

    handler, broker, _ = _build_handler(log)

    handler.rollback_to(safe.decision_id, reason="test")

    broker.close_position.assert_not_called()
    broker.cancel_order.assert_not_called()


# ---------------------------------------------------------------------------
# 5. Slippage is logged
# ---------------------------------------------------------------------------

def test_rollback_logs_slippage(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    # entry @ $100, exit @ $98, $4 size -> notional 4, qty .04, slippage = -.08
    _append_buy(log, "AAPL", 4.0, price=100.0, order_status="filled")

    handler, broker, _ = _build_handler(log)
    broker.get_latest_price.return_value = 98.0

    result = handler.rollback_to(safe.decision_id, reason="test")

    # slippage = (98 - 100) * (4 / 100) = -0.08
    assert result.slippage_usd == pytest.approx(-0.08, abs=1e-6)


# ---------------------------------------------------------------------------
# 6. Audit rows appended (action="rollback")
# ---------------------------------------------------------------------------

def test_rollback_appends_audit_rows(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    bd = _append_buy(log, "AAPL", 4.0, price=100.0, order_status="filled")

    handler, broker, _ = _build_handler(log)
    broker.get_latest_price.return_value = 99.5

    handler.rollback_to(safe.decision_id, reason="hard floor")

    rows = log.read_all()
    rb_rows = [r for r in rows if r.action == "rollback"]
    assert len(rb_rows) == 1
    rb = rb_rows[0]
    assert rb.market_state.get("rolled_back_decision_id") == bd.decision_id
    assert "hard floor" in rb.market_state.get("rollback_reason", "")
    # Reasoning text should reference the rolled-back decision's id
    assert bd.decision_id in rb.reasoning


# ---------------------------------------------------------------------------
# 7. Idempotent
# ---------------------------------------------------------------------------

def test_rollback_idempotent(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    _append_buy(log, "AAPL", 4.0, price=100.0, order_status="filled")

    handler, broker, discord = _build_handler(log)
    broker.get_latest_price.return_value = 99.0

    handler.rollback_to(safe.decision_id, reason="first")
    rows_after_first = len(log.read_all())
    close_calls_first = broker.close_position.call_count

    # Re-run on the same chain — should be a no-op.
    handler.rollback_to(safe.decision_id, reason="second")

    assert len(log.read_all()) == rows_after_first
    assert broker.close_position.call_count == close_calls_first


# ---------------------------------------------------------------------------
# 8. Strategy params restored from prior_state_id chain
# ---------------------------------------------------------------------------

def test_rollback_restores_strategy_params(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    # Decision 1 carries strategy_params we want restored.
    expected_params = {"sma_window": 20, "rsi_oversold": 35.0, "rsi_overbought": 65.0}
    log.append(Decision(
        timestamp="t1", track="A", agent="claude", ticker="SPY",
        action="hold", size_usd=0.0, reasoning="seed",
        market_state={"strategy_params": expected_params},
    ))
    # Decision 2 will be the safe state; its prior_state_id chains to d1.
    safe = log.append(Decision(
        timestamp="t2", track="A", agent="claude", ticker="SPY",
        action="hold", size_usd=0.0, reasoning="safe",
        market_state={},
    ))
    _append_buy(log, "AAPL", 4.0)  # to be rolled back

    captured = {}

    def restore(params):
        captured.update(params)

    handler, broker, _ = _build_handler(log)
    handler.params_restore_fn = restore
    broker.get_latest_price.return_value = 100.0

    result = handler.rollback_to(safe.decision_id, reason="test")

    assert captured == expected_params
    assert result.state_id == safe.decision_id


# ---------------------------------------------------------------------------
# 9. Hard floor breach -> halt arms after rollback
# ---------------------------------------------------------------------------

def test_rollback_halt_arms_on_hard_floor(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    _append_buy(log, "AAPL", 4.0, price=100.0, order_status="filled")

    halt_calls = []

    def halt(reason):
        halt_calls.append(reason)

    handler, broker, _ = _build_handler(log, halt=halt)
    broker.get_latest_price.return_value = 99.0

    result = handler.rollback_to(
        safe.decision_id,
        reason="hard floor breach",
        halt_after=True,
    )

    assert halt_calls and "hard floor" in halt_calls[0]
    assert result.halted is True


# ---------------------------------------------------------------------------
# 10. Filled long-exit (sell, not short) -> irreversible_actions
# ---------------------------------------------------------------------------

def test_rollback_partial_recovery_flag(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    sd = _append_sell(log, "AAPL", 4.0, short=False)  # long-exit, irreversible

    handler, broker, _ = _build_handler(log)

    result = handler.rollback_to(safe.decision_id, reason="test")

    assert sd.decision_id in result.irreversible_actions
    broker.close_position.assert_not_called()


# ---------------------------------------------------------------------------
# 11. Unknown state_id raises (matches DecisionLog.rollback_to behavior)
# ---------------------------------------------------------------------------

def test_rollback_unknown_state_id_raises(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    _append_hold(log, "SPY")

    handler, _, _ = _build_handler(log)

    with pytest.raises(ValueError):
        handler.rollback_to("does-not-exist", reason="test")


# ---------------------------------------------------------------------------
# 12. Single Discord summary, not one per decision
# ---------------------------------------------------------------------------

def test_rollback_discord_summary_single_event(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    _append_buy(log, "AAPL", 4.0)
    _append_buy(log, "MSFT", 4.0)
    _append_buy(log, "NVDA", 4.0)

    handler, broker, discord = _build_handler(log)
    broker.get_latest_price.return_value = 100.0

    handler.rollback_to(safe.decision_id, reason="test")

    assert discord.send.call_count == 1


# ---------------------------------------------------------------------------
# Bonus: rollback budget enforcement (Thomas's defaults)
# ---------------------------------------------------------------------------

def test_rollback_budget_caps_at_three_per_day(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    safe = _append_hold(log, "SPY")
    _append_buy(log, "AAPL", 4.0)

    handler, broker, _ = _build_handler(log)
    broker.get_latest_price.return_value = 100.0

    # Three rollbacks should succeed.
    handler.rollback_to(safe.decision_id, reason="r1")
    _append_buy(log, "AAPL", 4.0)
    handler.rollback_to(safe.decision_id, reason="r2")
    _append_buy(log, "AAPL", 4.0)
    handler.rollback_to(safe.decision_id, reason="r3")
    _append_buy(log, "AAPL", 4.0)

    with pytest.raises(RollbackBudgetExceeded):
        handler.rollback_to(safe.decision_id, reason="r4")
