"""Fear & Greed Index + CoinGecko spot prices — no API key required.

Two outputs:
1. data/news/fear_greed.jsonl   — CNN Fear & Greed index (0-100, label, ts)
2. data/news/crypto_pulse.jsonl — BTC/ETH/SOL spot price + 24h change

Both feed into context.py so agents see:
  ## Crypto & sentiment pulse
    Fear & Greed: 62 (Greed) — risk-on regime
    BTC=$96,420 (+1.8%) · ETH=$3,210 (+0.9%) · SOL=$158 (-0.2%)

Run on demand or as a 15-min cron alongside news_scout.py:
    .venv/Scripts/python.exe scripts/crypto_signals.py
"""
from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "news"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1&format=json"
COINGECKO_URL = (
    "https://api.coingecko.com/api/v3/simple/price"
    "?ids=bitcoin,ethereum,solana"
    "&vs_currencies=usd"
    "&include_24hr_change=true"
)

COIN_MAP = {
    "bitcoin": "BTC",
    "ethereum": "ETH",
    "solana": "SOL",
}

SESSION = requests.Session()
SESSION.headers.update({"Accept": "application/json", "User-Agent": "trading-shadow/0.1"})


def fetch_fear_greed() -> dict | None:
    try:
        r = SESSION.get(FEAR_GREED_URL, timeout=10)
        r.raise_for_status()
        data = r.json()
        row = (data.get("data") or [{}])[0]
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "value": int(row.get("value", 0)),
            "label": row.get("value_classification", ""),
            "ts_source": row.get("timestamp", ""),
        }
    except Exception as e:
        print(f"[crypto_signals] fear_greed failed: {e}", file=sys.stderr)
        return None


def fetch_crypto_prices() -> dict | None:
    try:
        r = SESSION.get(COINGECKO_URL, timeout=10)
        r.raise_for_status()
        data = r.json()
        pulse: dict = {"ts": datetime.now(timezone.utc).isoformat()}
        for coin_id, ticker in COIN_MAP.items():
            info = data.get(coin_id, {})
            price = info.get("usd")
            chg = info.get("usd_24h_change")
            pulse[ticker.lower()] = price
            pulse[f"{ticker.lower()}_change_pct"] = round(chg, 4) if chg is not None else None
        return pulse
    except Exception as e:
        print(f"[crypto_signals] coingecko failed: {e}", file=sys.stderr)
        return None


def run_once() -> None:
    fg = fetch_fear_greed()
    if fg:
        with (OUT_DIR / "fear_greed.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(fg) + "\n")
        print(f"[crypto_signals] F&G={fg['value']} ({fg['label']})")

    cp = fetch_crypto_prices()
    if cp:
        with (OUT_DIR / "crypto_pulse.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(cp) + "\n")
        btc = cp.get("btc")
        eth = cp.get("eth")
        print(f"[crypto_signals] BTC=${btc:,.0f} ETH=${eth:,.0f}" if btc and eth else "[crypto_signals] prices written")


if __name__ == "__main__":
    run_once()
