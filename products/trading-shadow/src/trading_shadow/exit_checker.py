"""Mechanical exit checker — runs before every LLM decision pass.

Checks all open Alpaca positions for take-profit and stop-loss triggers.
Priority:
  1. Watchlist-level SL/TP (agent wrote an explicit price in a prior pass)
  2. Hard rule: 4% take-profit / 3% stop-loss (from TradingView research)

This fires BEFORE the LLM is asked anything for the current pass. If an
exit triggers, the sell is submitted immediately and logged. The LLM is
NOT asked about that ticker for the rest of the pass — saves API spend
and removes the "agent forgot its own stop" failure mode.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from trading_shadow.config import Config
from trading_shadow.watchlist import current_state

if TYPE_CHECKING:
    from trading_shadow.alpaca_client import AlpacaWrapper


@dataclass(frozen=True)
class ExitSignal:
    ticker: str
    reason: str          # "take_profit" | "stop_loss" | "watchlist_tp" | "watchlist_sl"
    current_price: float
    entry_price: float
    pnl_pct: float       # signed: positive = profit, negative = loss
    qty: float
    market_value: float


def check_exits(broker: "AlpacaWrapper", agent: str = "claude") -> list[ExitSignal]:
    """Return exit signals for every open position that has breached SL or TP.

    Safe to call even when the market is closed — if Alpaca returns no
    positions or an error, returns an empty list.
    """
    try:
        positions = broker.positions()
    except Exception:
        return []

    if not positions:
        return []

    wl = current_state(agent)
    signals: list[ExitSignal] = []

    for ticker, pos in positions.items():
        if pos.qty <= 0 or pos.avg_entry_price <= 0:
            continue

        entry = pos.avg_entry_price
        current = pos.current_price
        pnl_pct = (current - entry) / entry

        # Watchlist-level levels take priority (agent set explicit price targets)
        wl_entry = wl.get(ticker, {})
        wl_tp = wl_entry.get("take_profit")
        wl_sl = wl_entry.get("stop_loss")

        if wl_tp and current >= float(wl_tp):
            signals.append(ExitSignal(
                ticker=ticker, reason="watchlist_tp",
                current_price=current, entry_price=entry, pnl_pct=pnl_pct,
                qty=pos.qty, market_value=pos.market_value,
            ))
        elif wl_sl and current <= float(wl_sl):
            signals.append(ExitSignal(
                ticker=ticker, reason="watchlist_sl",
                current_price=current, entry_price=entry, pnl_pct=pnl_pct,
                qty=pos.qty, market_value=pos.market_value,
            ))
        elif pnl_pct >= Config.TAKE_PROFIT_PCT:
            signals.append(ExitSignal(
                ticker=ticker, reason="take_profit",
                current_price=current, entry_price=entry, pnl_pct=pnl_pct,
                qty=pos.qty, market_value=pos.market_value,
            ))
        elif pnl_pct <= -Config.STOP_LOSS_PCT:
            signals.append(ExitSignal(
                ticker=ticker, reason="stop_loss",
                current_price=current, entry_price=entry, pnl_pct=pnl_pct,
                qty=pos.qty, market_value=pos.market_value,
            ))

    return signals
