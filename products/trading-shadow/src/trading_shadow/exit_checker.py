"""Mechanical exit checker — runs before every LLM decision pass.

Checks all open Alpaca positions for take-profit and stop-loss triggers.
Priority (top-down — first match wins):
  1. Watchlist-level SL/TP (agent wrote an explicit price in a prior pass)
  2. Take-profit at +TAKE_PROFIT_PCT (currently +6%)
  3. Stop-loss at -STOP_LOSS_PCT (currently -3%)
  4. Break-even trail: once a position has been up at +3% at any point
     (halfway to TP), the effective stop-loss tightens to entry price.
     Locks in "no-loss" once the trade has shown signal. This is the
     Percoco rule directly: "as soon as a candle closes over the high,
     move stop to entry — risk-free trade from there."

This fires BEFORE the LLM is asked anything for the current pass. If an
exit triggers, the sell is submitted immediately and logged. The LLM is
NOT asked about that ticker for the rest of the pass — saves API spend
and removes the "agent forgot its own stop" failure mode.

A separate momentum-peak exit (RSI > 75) lives in runner.py because it
needs bar-level data this module doesn't have.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from trading_shadow.config import Config
from trading_shadow.watchlist import current_state, append as wl_append, WatchEvent, now_iso

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

        # Break-even trail (Percoco rule): once a position has crossed
        # +50% of the way to TP (i.e. +3% on a 6% target), pin its
        # effective stop-loss to the entry price by writing a
        # watchlist stop. Subsequent passes will fire watchlist_sl if
        # price falls back to entry — "risk-free trade from there."
        # We don't exit *this* pass on the trail itself; we just lock
        # in the floor for the next price drop.
        be_trigger = 0.5 * Config.TAKE_PROFIT_PCT
        if 0 < pnl_pct < Config.TAKE_PROFIT_PCT and pnl_pct >= be_trigger:
            existing_sl = wl_entry.get("stop_loss")
            already_at_be = existing_sl is not None and float(existing_sl) >= entry - 0.01
            if not already_at_be:
                wl_append(agent, WatchEvent(
                    timestamp=now_iso(), agent=agent, ticker=ticker, kind="stop",
                    thesis=f"break-even trail (auto): pnl crossed +{be_trigger:.0%}",
                    stop_loss=entry,
                ))

    return signals
