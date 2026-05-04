"""News + macro scout — runs every 10 min, populates data/news/.

Two streams:
1. Per-ticker headlines: data/news/{ticker}.jsonl  (one row per headline)
2. Macro pulse: data/news/macro.jsonl  (one row per pulse, all macro fields)

Sources are FREE (no API key needed):
- yfinance.Ticker(symbol).news — recent headlines per stock
- yfinance market data — current price for macro tickers (VIX, crude, 10yr, gold)

This is a STANDALONE pipeline — it does NOT feed into runner.py yet. It
just accumulates data so when we wire the news-context injection into
the trader prompt (post-cutover), there's already a corpus to read from.

Dedupe is by (ticker, link) — same headline only logged once even if it
shows up across multiple polls.

Run:
    .\\.venv\\Scripts\\python.exe scripts\\news_scout.py
"""
from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf

INTERVAL_SECONDS = 10 * 60

EQUITY_TICKERS = [
    # Match runner.py TICKERS exactly so we have news for every ticker the
    # traders see. Update both lists together.
    "SPY", "QQQ", "AAPL", "MSFT", "NVDA",
    "FCX", "SCCO", "TECK", "COPX",
]

MACRO_TICKERS = {
    # yfinance symbols → human label
    "^VIX": "vix",
    "^TNX": "us_10yr_yield",
    "CL=F": "wti_crude",
    "GC=F": "gold",
    "DX-Y.NYB": "dxy",
    # Crypto vol — added 2026-05-01 per Thomas request: "integrate crypto
    # volatility to our advantage". BTC/ETH price + day change feeds the
    # macro pulse so equity-only agents at least see the crypto risk-on /
    # risk-off regime even though they don't trade BTC directly.
    "BTC-USD": "btc",
    "ETH-USD": "eth",
}

NEWS_DIR = Path("data/news")
NEWS_DIR.mkdir(parents=True, exist_ok=True)


def _seen_links_for(ticker: str) -> set[str]:
    """Read existing headlines for a ticker, return set of links to dedupe."""
    path = NEWS_DIR / f"{ticker}.jsonl"
    if not path.exists():
        return set()
    seen = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
            if row.get("link"):
                seen.add(row["link"])
        except json.JSONDecodeError:
            continue
    return seen


def fetch_news_for(ticker: str) -> int:
    """Pull yfinance news for a ticker, append new ones to its jsonl. Return count appended."""
    try:
        items = yf.Ticker(ticker).news or []
    except Exception as e:
        print(f"[news_scout] {ticker} fetch failed: {e}", file=sys.stderr)
        return 0

    seen = _seen_links_for(ticker)
    path = NEWS_DIR / f"{ticker}.jsonl"
    appended = 0
    with path.open("a", encoding="utf-8") as f:
        for item in items:
            # yfinance v0.2.x changed schema: news items now nest under "content"
            content = item.get("content") if isinstance(item, dict) else None
            if content:
                title = content.get("title")
                summary = content.get("summary")
                link = (content.get("canonicalUrl") or {}).get("url") or (content.get("clickThroughUrl") or {}).get("url")
                pub_iso = content.get("pubDate")
                provider = (content.get("provider") or {}).get("displayName")
            else:
                # Legacy schema fallback
                title = item.get("title")
                summary = item.get("summary")
                link = item.get("link")
                pub_unix = item.get("providerPublishTime")
                pub_iso = (
                    datetime.fromtimestamp(pub_unix, tz=timezone.utc).isoformat()
                    if pub_unix else None
                )
                provider = item.get("publisher")

            if not link or link in seen:
                continue
            seen.add(link)
            row = {
                "ticker": ticker,
                "title": title,
                "summary": summary,
                "link": link,
                "published_at": pub_iso,
                "provider": provider,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            appended += 1
    return appended


def fetch_macro_pulse() -> dict:
    """Snapshot current values for all macro tickers.

    Uses history(period='1d') because fast_info.last_price returns None
    for index/futures symbols like ^VIX, ^TNX, CL=F, GC=F. The history
    endpoint always works for them.
    """
    pulse = {
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    for symbol, label in MACRO_TICKERS.items():
        try:
            t = yf.Ticker(symbol)
            hist = t.history(period="2d")
            if not hist.empty:
                pulse[label] = float(hist["Close"].iloc[-1])
                # also stash the prior close for delta context
                if len(hist) >= 2:
                    prev = float(hist["Close"].iloc[-2])
                    pulse[f"{label}_change_pct"] = (pulse[label] / prev - 1.0) * 100
            else:
                pulse[label] = None
        except Exception as e:
            print(f"[news_scout] macro {symbol} failed: {e}", file=sys.stderr)
            pulse[label] = None
    return pulse


def write_macro(pulse: dict) -> None:
    path = NEWS_DIR / "macro.jsonl"
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(pulse) + "\n")


def one_pass() -> None:
    total_news = 0
    for ticker in EQUITY_TICKERS:
        n = fetch_news_for(ticker)
        if n:
            print(f"[news_scout] {ticker}: +{n} new headlines")
        total_news += n
    pulse = fetch_macro_pulse()
    write_macro(pulse)
    print(
        f"[news_scout] pass complete: +{total_news} headlines  ·  "
        f"vix={pulse.get('vix')} oil={pulse.get('wti_crude')} "
        f"10yr={pulse.get('us_10yr_yield')} gold={pulse.get('gold')}"
    )


if __name__ == "__main__":
    print(f"[news_scout] starting; tickers={len(EQUITY_TICKERS)} macro={len(MACRO_TICKERS)} interval={INTERVAL_SECONDS}s")
    while True:
        try:
            one_pass()
        except Exception as e:
            print(f"[news_scout] pass error: {e}", file=sys.stderr)
        time.sleep(INTERVAL_SECONDS)
