"""Dollar P&L per trader (claude vs shadow), simulated from $100k starting.

Walks every decision in chronological order and applies it to a separate
$100k paper wallet per agent. For BUY: spends min(size_usd or
DEFAULT_TRADE_PCT × wallet equity, cash) at the logged price. For SELL:
liquidates the entire position in that ticker at the logged price. Final
equity = cash + sum(qty * last_price) where last_price is the most recent
logged price for each ticker.

Why a %-of-equity fallback for shadow: Ollama's shadow returns size_usd=0
even on BUY decisions (it predicts action only, not size). Pre-2026-05-06
this fell back to a fixed $5, which was fine when claude was also capped
at $5. After the cap-lift, claude sizes by 2/5/8/10% conviction tiers, so
a $5 shadow fallback created a 2000x asymmetry on a $100K wallet. The
typical-conviction tier (5% of equity) is the right baseline.
"""
import json
from collections import defaultdict
from pathlib import Path

START = 100_000.00
DEFAULT_TRADE_PCT = 0.05  # 5% of agent's wallet equity, matches typical-conviction tier


def main() -> None:
    rows = sorted(
        (
            json.loads(line)
            for line in Path("data/decisions.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        ),
        key=lambda r: r.get("timestamp", ""),
    )

    AGENTS = ("claude", "shadow", "social_media_trader")
    # Legacy alias: rows logged as "shadow_copy" before the 2026-05-01 rename
    # are treated as "social_media_trader" for leaderboard continuity.
    AGENT_ALIASES = {"shadow_copy": "social_media_trader"}
    cash = {a: START for a in AGENTS}
    shares: dict[str, dict[str, float]] = {a: defaultdict(float) for a in AGENTS}
    realized = {a: 0.0 for a in AGENTS}
    trade_count = {a: 0 for a in AGENTS}
    skipped_due_to_error = {a: 0 for a in AGENTS}
    last_price: dict[str, float] = {}

    for r in rows:
        agent = r.get("agent")
        agent = AGENT_ALIASES.get(agent, agent)  # map legacy name → new name
        if agent not in AGENTS:
            continue
        ticker = r.get("ticker") or ""
        action = str(r.get("action", "")).lower()
        size = float(r.get("size_usd") or 0.0)
        ms = r.get("market_state") or {}
        price = float(ms.get("price") or 0.0)
        if price <= 0 or not ticker:
            continue
        last_price[ticker] = price

        reasoning = r.get("reasoning") or ""
        if isinstance(reasoning, str) and reasoning.startswith("claude_error:"):
            skipped_due_to_error[agent] += 1
            continue

        # Apply trade. Fallback uses 5% of agent's wallet equity (cash
        # + position value at last seen price) so shadow scales with the
        # wallet instead of being pinned at a tiny fixed dollar amount.
        if size <= 0:
            position_value = sum(qty * last_price.get(t, 0.0) for t, qty in shares[agent].items())
            spend = (cash[agent] + position_value) * DEFAULT_TRADE_PCT
        else:
            spend = size
        if action == "buy" and cash[agent] >= spend:
            qty = spend / price
            shares[agent][ticker] += qty
            cash[agent] -= spend
            trade_count[agent] += 1
        elif action in ("sell", "close") and shares[agent][ticker] > 0:
            qty = shares[agent][ticker]
            proceeds = qty * price
            cost_basis = spend  # rough — we don't track per-lot cost
            realized[agent] += proceeds - cost_basis
            cash[agent] += proceeds
            shares[agent][ticker] = 0.0
            trade_count[agent] += 1

    # Mark to market
    print(f"{'TRADER':<14}{'EQUITY':>14}{'CASH':>14}{'POSITIONS':>14}{'P/L vs $100k':>16}{'TRADES':>9}{'ERRORS':>8}")
    print("-" * 89)
    for agent in AGENTS:
        position_value = sum(qty * last_price.get(t, 0.0) for t, qty in shares[agent].items())
        equity = cash[agent] + position_value
        pl = equity - START
        pl_pct = (equity / START - 1.0) * 100
        print(
            f"{agent:<10}"
            f"${equity:>12,.2f}  "
            f"${cash[agent]:>12,.2f}  "
            f"${position_value:>12,.2f}  "
            f"${pl:>+10,.2f} ({pl_pct:+.3f}%)  "
            f"{trade_count[agent]:>7}"
            f"{skipped_due_to_error[agent]:>8}"
        )

    print()
    print("OPEN POSITIONS")
    print("-" * 60)
    for agent in AGENTS:
        positions = [(t, q) for t, q in shares[agent].items() if q > 0]
        if not positions:
            print(f"  {agent}: (none)")
            continue
        for ticker, qty in sorted(positions):
            mkt = qty * last_price.get(ticker, 0.0)
            print(f"  {agent:12}  {ticker:6}  qty={qty:.6f}  @ last ${last_price.get(ticker, 0):.2f}  =  ${mkt:.2f}")


if __name__ == "__main__":
    main()
