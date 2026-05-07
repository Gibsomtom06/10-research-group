"""Push the current trading leaderboard + Alpaca state to Discord.

Reads from data/decisions.jsonl + Alpaca paper API + simulates per-agent
$100k wallets. Posts a single embed message via DISCORD_WEBHOOK_URL.

Run manually:
    .\\.venv\\Scripts\\python.exe scripts\\post_leaderboard.py

Or wire into a cron / loop_paper.py to auto-post every N passes.
"""
from __future__ import annotations

import json
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

# Load .env.{MODE} like config.py does
MODE = os.environ.get("MODE", "paper")
ENV_FILE = Path(f".env.{MODE}")
if ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=False)
else:
    load_dotenv(override=False)

DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")
START = 100_000.00
# 5% of agent's wallet equity — typical-conviction tier. Pre-2026-05-06
# this was a fixed $5; after the cap-lift, fixed dollars distort
# leaderboard comparability when claude sizes off conviction tiers.
DEFAULT_TRADE_PCT = 0.05


AGENTS = ("claude", "shadow", "social_media_trader")
AGENT_ALIASES = {"shadow_copy": "social_media_trader"}  # legacy


def simulate(rows: list[dict]) -> dict:
    cash = {a: START for a in AGENTS}
    shares = {a: defaultdict(float) for a in AGENTS}
    trades = {a: 0 for a in AGENTS}
    errors = {a: 0 for a in AGENTS}
    last_price: dict[str, float] = {}

    for r in sorted(rows, key=lambda x: x.get("timestamp", "")):
        agent = r.get("agent")
        agent = AGENT_ALIASES.get(agent, agent)  # legacy → new
        if agent not in AGENTS:
            continue
        ticker = r.get("ticker") or ""
        price = float((r.get("market_state") or {}).get("price") or 0.0)
        if price <= 0 or not ticker:
            continue
        last_price[ticker] = price
        action = str(r.get("action", "")).lower()
        size = float(r.get("size_usd") or 0.0)
        reasoning = r.get("reasoning") or ""
        if isinstance(reasoning, str) and reasoning.startswith("claude_error:"):
            errors[agent] += 1
            continue
        if size > 0:
            spend = size
        else:
            position_value = sum(q * last_price.get(t, 0.0) for t, q in shares[agent].items())
            spend = (cash[agent] + position_value) * DEFAULT_TRADE_PCT
        if action == "buy" and cash[agent] >= spend:
            shares[agent][ticker] += spend / price
            cash[agent] -= spend
            trades[agent] += 1
        elif action in ("sell", "close") and shares[agent][ticker] > 0:
            cash[agent] += shares[agent][ticker] * price
            shares[agent][ticker] = 0.0
            trades[agent] += 1

    out = {}
    for agent in AGENTS:
        position_value = sum(q * last_price.get(t, 0.0) for t, q in shares[agent].items())
        equity = cash[agent] + position_value
        out[agent] = {
            "equity": equity,
            "cash": cash[agent],
            "positions_value": position_value,
            "pl": equity - START,
            "pl_pct": (equity / START - 1) * 100,
            "trades": trades[agent],
            "errors": errors[agent],
            "open_positions": [
                {"ticker": t, "qty": q, "value": q * last_price.get(t, 0.0)}
                for t, q in sorted(shares[agent].items()) if q > 0
            ],
        }
    return out


def fetch_alpaca() -> dict | None:
    key = os.environ.get("ALPACA_PAPER_API_KEY")
    secret = os.environ.get("ALPACA_PAPER_API_SECRET")
    if not (key and secret):
        return None
    headers = {"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret}
    base = "https://paper-api.alpaca.markets"
    try:
        a = requests.get(f"{base}/v2/account", headers=headers, timeout=10).json()
        equity = float(a["equity"])
        last_eq = float(a["last_equity"])
        return {
            "cash": float(a["cash"]),
            "equity": equity,
            "day_pl": equity - last_eq,
            "day_pl_pct": (equity - last_eq) / last_eq * 100 if last_eq else 0,
        }
    except Exception:
        return None


def build_embed(sim: dict, alpaca: dict | None) -> dict:
    # Rank by equity descending — winner is the agent with the most money
    ranked = sorted(AGENTS, key=lambda a: sim[a]["equity"], reverse=True)
    winner = ranked[0] if sim[ranked[0]]["equity"] > sim[ranked[1]]["equity"] else "tied"
    spread = sim[ranked[0]]["equity"] - sim[ranked[1]]["equity"]

    icons = {"claude": "🤖", "shadow": "👻", "social_media_trader": "📱"}
    fields = []
    for agent in ranked:
        s = sim[agent]
        fields.append({
            "name": f"{icons.get(agent, '·')} {agent} (sim $100k)",
            "value": (
                f"equity: **${s['equity']:,.2f}**  ({s['pl']:+.2f}, {s['pl_pct']:+.3f}%)\n"
                f"cash: ${s['cash']:,.2f}  ·  positions: ${s['positions_value']:.2f}\n"
                f"trades: {s['trades']}  ·  errors: {s['errors']}"
            ),
            "inline": False,
        })
        pos = s.get("open_positions", [])
        if pos:
            fields.append({
                "name": f"{agent} positions",
                "value": "\n".join(f"`{p['ticker']:5}` ${p['value']:.2f}" for p in pos),
                "inline": True,
            })

    if alpaca:
        fields.append({
            "name": "🏦 real alpaca paper account",
            "value": (
                f"equity: **${alpaca['equity']:,.2f}**  (day P/L {alpaca['day_pl']:+.2f}, {alpaca['day_pl_pct']:+.2f}%)\n"
                f"cash: ${alpaca['cash']:,.2f}"
            ),
            "inline": False,
        })

    colors = {"claude": 0x57F287, "shadow": 0x5865F2, "social_media_trader": 0xFEE75C, "tied": 0x95A5A6}
    color = colors.get(winner, 0x95A5A6)
    title = f"who's winning?  →  **{winner}** (+${spread:.2f})" if winner != "tied" else "who's winning?  →  **tied**"

    return {
        "username": "trading-shadow",
        "embeds": [{
            "title": title,
            "color": color,
            "fields": fields,
            "footer": {"text": "live paper sim · /scripts/post_leaderboard.py"},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }],
    }


def main() -> int:
    if not DISCORD_WEBHOOK_URL:
        print("DISCORD_WEBHOOK_URL not set — exiting.", file=sys.stderr)
        return 1

    rows_path = Path("data/decisions.jsonl")
    if not rows_path.exists():
        print("data/decisions.jsonl not found — has the loop run yet?", file=sys.stderr)
        return 1

    rows = [json.loads(l) for l in rows_path.read_text(encoding="utf-8").splitlines() if l.strip()]
    sim = simulate(rows)
    alpaca = fetch_alpaca()
    payload = build_embed(sim, alpaca)

    res = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=15)
    if res.status_code in (200, 204):
        # Strip non-ASCII for Windows cp1252 console compatibility.
        title = payload["embeds"][0]["title"].encode("ascii", "replace").decode("ascii")
        print(f"posted leaderboard to discord (winner: {title})")
        return 0
    print(f"discord post failed: {res.status_code} {res.text[:200]}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
