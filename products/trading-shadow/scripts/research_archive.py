"""Historical research subagent — pulls long-tail data per ticker.

Two stores per ticker:
1. data/research/{ticker}_news_archive.jsonl   — older news (yfinance gives ~10 latest)
2. data/research/{ticker}_filings.jsonl        — SEC filings (8-K material events,
                                                  10-Q quarterly earnings, 10-K annuals)

This is meant to run on demand or via a daily cron — not a tight loop.
The news API only returns the latest ~10 headlines so "archive" really
means: every time we run, snapshot what's currently on the wire and
dedupe against history. Over weeks we accumulate the deeper feed.

SEC filings come from yfinance.Ticker.get_sec_filings() which proxies
EDGAR. Free, no auth.

Run:
    .\\.venv\\Scripts\\python.exe scripts\\research_archive.py
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf

EQUITY_TICKERS = [
    "SPY", "QQQ", "AAPL", "MSFT", "NVDA",
    "FCX", "SCCO", "TECK", "COPX",
]

RESEARCH_DIR = Path("data/research")
RESEARCH_DIR.mkdir(parents=True, exist_ok=True)


def _seen_keys(path: Path, key_field: str) -> set[str]:
    if not path.exists():
        return set()
    seen = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
            v = row.get(key_field)
            if v:
                seen.add(str(v))
        except json.JSONDecodeError:
            continue
    return seen


def archive_news(ticker: str) -> int:
    try:
        items = yf.Ticker(ticker).news or []
    except Exception as e:
        print(f"[research] {ticker} news fetch failed: {e}", file=sys.stderr)
        return 0

    path = RESEARCH_DIR / f"{ticker}_news_archive.jsonl"
    seen = _seen_keys(path, "link")
    appended = 0
    with path.open("a", encoding="utf-8") as f:
        for item in items:
            content = item.get("content") if isinstance(item, dict) else None
            if content:
                title = content.get("title")
                summary = content.get("summary")
                link = (content.get("canonicalUrl") or {}).get("url") or (content.get("clickThroughUrl") or {}).get("url")
                pub_iso = content.get("pubDate")
                provider = (content.get("provider") or {}).get("displayName")
            else:
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
            f.write(json.dumps({
                "ticker": ticker,
                "title": title,
                "summary": summary,
                "link": link,
                "published_at": pub_iso,
                "provider": provider,
                "archived_at": datetime.now(timezone.utc).isoformat(),
            }, ensure_ascii=False) + "\n")
            appended += 1
    return appended


def archive_filings(ticker: str) -> int:
    """Pull SEC filings index (10-K, 10-Q, 8-K) via yfinance EDGAR proxy."""
    try:
        t = yf.Ticker(ticker)
        # yfinance versions vary: some have get_sec_filings(), some sec_filings property
        if hasattr(t, "get_sec_filings"):
            filings = t.get_sec_filings()
        else:
            filings = getattr(t, "sec_filings", None)
        if not filings:
            return 0
    except Exception as e:
        print(f"[research] {ticker} filings fetch failed: {e}", file=sys.stderr)
        return 0

    path = RESEARCH_DIR / f"{ticker}_filings.jsonl"
    seen = _seen_keys(path, "edgarUrl")
    appended = 0
    with path.open("a", encoding="utf-8") as f:
        # filings can be a dict (newer yfinance) or list (older)
        items = filings.values() if isinstance(filings, dict) else filings
        for item in items or []:
            if not isinstance(item, dict):
                continue
            url = item.get("edgarUrl") or item.get("url")
            if not url or url in seen:
                continue
            seen.add(url)
            f.write(json.dumps({
                "ticker": ticker,
                "title": item.get("title") or item.get("type"),
                "type": item.get("type"),
                "date": item.get("date"),
                "edgarUrl": url,
                "exhibits": item.get("exhibits"),
                "archived_at": datetime.now(timezone.utc).isoformat(),
            }, ensure_ascii=False, default=str) + "\n")
            appended += 1
    return appended


def main() -> None:
    print(f"[research] starting archive sweep for {len(EQUITY_TICKERS)} tickers")
    total_news = 0
    total_filings = 0
    for ticker in EQUITY_TICKERS:
        n = archive_news(ticker)
        f = archive_filings(ticker)
        total_news += n
        total_filings += f
        print(f"[research] {ticker}: +{n} news  +{f} filings")
    print(f"[research] sweep complete: {total_news} news rows, {total_filings} filing rows")


if __name__ == "__main__":
    main()
