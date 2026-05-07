"""Dollar P&L per trader, simulated apples-to-apples at the live capital
level (Thomas's real-money plan = $100).

Walks every decision in chronological order and applies it to a $100
paper wallet per agent so the P&L numbers reflect what the strategy
would actually do at the capital level we're going to deploy. For BUY:
spends min(percent-of-equity, cash) at the logged price. For SELL:
liquidates the entire position in that ticker at the logged price.
Final equity = cash + sum(qty * last_price).

Why translate historical size_usd by percentage instead of literal
dollars: every existing row in data/decisions.jsonl was sized against
the Alpaca paper account's implicit $100K wallet. Pre-2026-05-06
trades were $5 absolute (= 0.005% of $100K); post-cap-lift trades are
% × $100K (= 2-10% of $100K). Apples-to-apples at $100 = take the
percentage that decision represented and apply it to the new $100
wallet. A 5% conviction trade is $5K on $100K paper, $5 on $100 real;
a $5 absolute trade is $0.005 at $100 (tiny but proportional).

Override START via LEADERBOARD_START env var (e.g. =1000 to model what
$1K would look like, =100000 for the legacy $100K view).
"""
import json
import os
from collections import defaultdict
from pathlib import Path

# Live-capital plan = $100. Set LEADERBOARD_START=100000 to recover the
# pre-2026-05-07 view at Alpaca paper-account scale.
START = float(os.environ.get("LEADERBOARD_START", "100"))

# What every historical size_usd was sized against. Used to convert a
# logged dollar amount into the percentage of equity it represented at
# decision time, which we then apply to whatever START the simulator
# is running at.
DECISION_TIME_WALLET = 100_000.00

# Fallback when an agent (Ollama shadow) returns size_usd=0 — 5% of
# the agent's current simulator wallet. Matches the typical-conviction
# tier in prompts_v2.
DEFAULT_TRADE_PCT = 0.05


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

        # Apply trade. Translate the logged size_usd to a percentage of
        # the agent's current simulator wallet so the same decision
        # produces proportional dollar moves regardless of the START
        # capital the simulator is running at.
        position_value = sum(qty * last_price.get(t, 0.0) for t, qty in shares[agent].items())
        equity = cash[agent] + position_value
        if size > 0:
            pct = size / DECISION_TIME_WALLET  # what fraction of the implicit $100K wallet this trade was
            spend = equity * pct
        else:
            spend = equity * DEFAULT_TRADE_PCT
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
    pl_label = f"P/L vs ${int(START):,}" if START >= 1 else f"P/L vs ${START:.2f}"
    print(f"{'TRADER':<14}{'EQUITY':>14}{'CASH':>14}{'POSITIONS':>14}{pl_label:>16}{'TRADES':>9}{'ERRORS':>8}")
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
