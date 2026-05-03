"""Google Trends interest scores for our equity tickers — no API key needed.

Uses pytrends (unofficial Google Trends API wrapper).

Output: data/research/trends_{ticker}.jsonl
  One row per run. Fields: ticker, interest (0-100), ts, period.

Interest score 0-100 represents relative search popularity over the
last 7 days vs the peak. Use as a lead indicator:
  - Rising trend on a ticker = retail attention growing (buy signal lean)
  - Falling trend = retail losing interest (neutral/sell lean)
  - Spike then drop = probably news-driven, check headlines

Context.py picks these up and adds them to the decision prompt:
  ## Search trends (7d relative interest)
    NVDA=85 (+12) · AAPL=62 (=) · MSFT=50 (-8)

Run on demand or daily:
    .venv/Scripts/python.exe scripts/fetch_trends.py

pytrends rate-limits aggressively. We pull all tickers in one batch
(max 5 per call) with sleep between calls.
"""
from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    from pytrends.request import TrendReq
except ImportError:
    print(
        "[fetch_trends] pytrends not installed. Run: pip install pytrends",
        file=sys.stderr,
    )
    sys.exit(1)

TICKERS = [
    "SPY", "QQQ", "AAPL", "MSFT", "NVDA",
    "FCX", "SCCO", "TECK", "COPX",
]

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "research"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Google Trends allows 5 keywords per request; we batch in groups of 5
BATCH_SIZE = 5
SLEEP_BETWEEN_CALLS = 8.0  # seconds — be polite, pytrends gets 429'd easily


def fetch_batch(pytrends: TrendReq, batch: list[str]) -> dict[str, int]:
    """Fetch relative interest (0-100) for up to 5 tickers. Returns {ticker: score}."""
    pytrends.build_payload(batch, cat=0, timeframe="now 7-d", geo="US")
    data = pytrends.interest_over_time()
    if data.empty:
        return {}
    # Average the hourly scores to get a single "this week" number per ticker
    result = {}
    for ticker in batch:
        if ticker in data.columns:
            result[ticker] = int(data[ticker].mean())
    return result


def run() -> None:
    pt = TrendReq(hl="en-US", tz=-300)  # tz=-300 = US Eastern
    ts = datetime.now(timezone.utc).isoformat()
    total = 0

    for i in range(0, len(TICKERS), BATCH_SIZE):
        batch = TICKERS[i:i + BATCH_SIZE]
        try:
            scores = fetch_batch(pt, batch)
        except Exception as e:
            print(f"[fetch_trends] batch {batch} failed: {e}", file=sys.stderr)
            scores = {}

        for ticker, score in scores.items():
            path = OUT_DIR / f"trends_{ticker}.jsonl"
            with path.open("a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "ticker": ticker,
                    "interest": score,
                    "period": "7d_us",
                    "ts": ts,
                }) + "\n")
            total += 1

        if scores:
            print(f"[fetch_trends] {' '.join(f'{t}={scores.get(t, 0)}' for t in batch)}")

        if i + BATCH_SIZE < len(TICKERS):
            time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"[fetch_trends] complete — {total} scores written")


if __name__ == "__main__":
    run()
