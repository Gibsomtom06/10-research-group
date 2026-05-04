"""Trader leaderboard: rank every (track, agent) pair by simulated paper P&L,
plus benchmarks (SPY buy-and-hold, equal-weight buy-and-hold of all tickers).

A "trader" here is any (track, agent) tuple that has decisions in
data/decisions.jsonl. Today that's 4: (A,claude), (A,shadow), (B,claude),
(B,shadow). As we add more agents (e.g. shadow_v2_value mimicking 13F
filings, or strategy-only baseline), they appear automatically.

Simulation rules (paper-trade walk):
- Start each trader at $100 cash, 0 holdings.
- For each decision in chronological order:
    - BUY:  spend size_usd at the logged price, increment shares.
    - SELL: liquidate ALL shares of that ticker at the logged price.
    - HOLD: no-op.
- Final equity = cash + sum(shares_i * latest_price_i).
- "Latest price" comes from the LAST decision logged for that ticker.

This is a deliberately simple walk — no slippage, no fees, no shorting.
Good enough to RANK traders relatively. NOT good enough to predict real PnL.

Benchmarks:
- SPY buy-hold: $100 fully into SPY at first decision price, marked to last.
- Equal-weight: $100 split evenly across the 5 tracked tickers at first price each.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Iterable

LOG_PATH = Path("data/decisions.jsonl")
START_CASH = 100.0


@dataclass
class TraderState:
    cash: float = START_CASH
    shares: dict[str, float] = field(default_factory=dict)
    trades: int = 0
    buys: int = 0
    sells: int = 0
    holds: int = 0
    errors: int = 0
    first_ts: str | None = None
    last_ts: str | None = None
    pass_ranks: list[int] = field(default_factory=list)  # ranks per pass for consistency

    def equity(self, mark_prices: dict[str, float]) -> float:
        return self.cash + sum(qty * mark_prices.get(t, 0.0) for t, qty in self.shares.items())


def load_rows(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def latest_prices(rows: Iterable[dict]) -> dict[str, float]:
    """Latest decision price per ticker — used as mark-to-market price."""
    latest: dict[str, tuple[str, float]] = {}
    for r in rows:
        ticker = r.get("ticker")
        ts = r.get("timestamp", "")
        ms = r.get("market_state") or {}
        price = float(ms.get("price") or 0.0)
        if not ticker or price <= 0:
            continue
        if ticker not in latest or ts > latest[ticker][0]:
            latest[ticker] = (ts, price)
    return {t: p for t, (_, p) in latest.items()}


def simulate(rows: list[dict]) -> dict[tuple[str, str], TraderState]:
    """Walk decisions in order, update each (track, agent) trader state."""
    rows_sorted = sorted(rows, key=lambda r: r.get("timestamp", ""))
    states: dict[tuple[str, str], TraderState] = defaultdict(TraderState)

    for r in rows_sorted:
        track = r.get("track", "?")
        agent = r.get("agent", "?")
        if agent not in ("claude", "shadow"):
            continue  # skip backtest etc.
        key = (track, agent)
        st = states[key]

        ts = r.get("timestamp", "")
        action = str(r.get("action", "")).lower()
        size = float(r.get("size_usd") or 0.0)
        ticker = r.get("ticker", "")
        ms = r.get("market_state") or {}
        price = float(ms.get("price") or 0.0)
        reasoning = r.get("reasoning") or ""
        is_error = isinstance(reasoning, str) and reasoning.startswith("claude_error:")

        if st.first_ts is None:
            st.first_ts = ts
        st.last_ts = ts

        if is_error:
            st.errors += 1
            st.holds += 1
            continue
        if action == "buy" and size > 0 and price > 0 and st.cash >= size:
            qty = size / price
            st.shares[ticker] = st.shares.get(ticker, 0.0) + qty
            st.cash -= size
            st.trades += 1
            st.buys += 1
        elif action == "sell" and price > 0 and st.shares.get(ticker, 0.0) > 0:
            qty = st.shares[ticker]
            st.cash += qty * price
            st.shares[ticker] = 0.0
            st.trades += 1
            st.sells += 1
        else:
            st.holds += 1

    return states


def benchmarks(rows: list[dict]) -> dict[str, dict[str, float]]:
    """Compute SPY buy-hold and equal-weight buy-hold over the same window."""
    by_ticker_first: dict[str, float] = {}
    rows_sorted = sorted(rows, key=lambda r: r.get("timestamp", ""))
    for r in rows_sorted:
        ticker = r.get("ticker", "")
        price = float((r.get("market_state") or {}).get("price") or 0.0)
        if ticker and price > 0 and ticker not in by_ticker_first:
            by_ticker_first[ticker] = price

    last = latest_prices(rows)
    out: dict[str, dict[str, float]] = {}

    if "SPY" in by_ticker_first and "SPY" in last:
        spy_ret = (last["SPY"] - by_ticker_first["SPY"]) / by_ticker_first["SPY"]
        out["SPY_buy_hold"] = {
            "start_price": by_ticker_first["SPY"],
            "last_price": last["SPY"],
            "final_equity": START_CASH * (1.0 + spy_ret),
            "return_pct": spy_ret * 100.0,
        }

    if by_ticker_first:
        weight = START_CASH / len(by_ticker_first)
        eq = sum(weight * (last.get(t, p) / p) for t, p in by_ticker_first.items())
        out["equal_weight_basket"] = {
            "tickers": len(by_ticker_first),
            "final_equity": eq,
            "return_pct": (eq / START_CASH - 1.0) * 100.0,
        }
    return out


def render(states: dict[tuple[str, str], TraderState], bench: dict[str, dict[str, float]], mark: dict[str, float]) -> str:
    lines = []
    lines.append("TRADER LEADERBOARD")
    lines.append("=" * 72)
    lines.append(f"start_cash: ${START_CASH:.2f}    mark prices: {len(mark)} tickers")
    lines.append("")

    rows = []
    for (track, agent), st in states.items():
        eq = st.equity(mark)
        rows.append((eq, track, agent, st))
    rows.sort(reverse=True, key=lambda r: r[0])

    lines.append(f"{'rank':<5}{'trader':<22}{'equity':>10}{'return':>9}{'trades':>8}{'buys':>6}{'sells':>6}{'holds':>7}{'errs':>6}")
    lines.append("-" * 72)
    for i, (eq, track, agent, st) in enumerate(rows, 1):
        ret_pct = (eq / START_CASH - 1.0) * 100.0
        name = f"track_{track}.{agent}"
        lines.append(
            f"{i:<5}{name:<22}{eq:>9.2f} {ret_pct:>+7.2f}% {st.trades:>7} {st.buys:>5} {st.sells:>5} {st.holds:>6} {st.errors:>5}"
        )

    if bench:
        lines.append("")
        lines.append("BENCHMARKS")
        lines.append("-" * 72)
        for name, info in bench.items():
            lines.append(f"  {name:<22}  equity=${info['final_equity']:.2f}  return={info['return_pct']:+.2f}%")

    lines.append("")
    lines.append("MARK PRICES (last logged per ticker)")
    for t, p in sorted(mark.items()):
        lines.append(f"  {t:<6} ${p:.2f}")

    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default=str(LOG_PATH))
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    rows = load_rows(Path(args.path))
    if not rows:
        print("No decisions logged yet. The loop has to run at least one pass first.")
        return 0

    states = simulate(rows)
    bench = benchmarks(rows)
    mark = latest_prices(rows)

    if args.json:
        out = {
            "traders": [
                {
                    "track": k[0], "agent": k[1],
                    "equity": v.equity(mark),
                    "trades": v.trades, "buys": v.buys, "sells": v.sells,
                    "holds": v.holds, "errors": v.errors,
                    "first_ts": v.first_ts, "last_ts": v.last_ts,
                }
                for k, v in states.items()
            ],
            "benchmarks": bench,
            "mark_prices": mark,
        }
        print(json.dumps(out, indent=2, default=str))
    else:
        print(render(states, bench, mark))
    return 0


if __name__ == "__main__":
    sys.exit(main())
