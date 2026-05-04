"""Social scout subagent — pulls retail-trader signal from Stocktwits + Reddit.

Free public endpoints, no API key required:
- Stocktwits per-symbol stream: https://api.stocktwits.com/api/2/streams/symbol/{TICKER}.json
  Returns recent messages, with optional bullish/bearish sentiment per author.
- Reddit per-subreddit JSON: https://www.reddit.com/r/{sub}/new.json (needs UA header)
  Plain HTTP, no OAuth needed for read-only.

Output streams (one row per message):
- data/social/stocktwits_{ticker}.jsonl
- data/social/reddit_{sub}.jsonl

Aggregated sentiment per ticker per pass:
- data/social/sentiment.jsonl  (one row per pass per ticker)

This is the data feeder for shadow_copy.py — that agent reads sentiment
+ recent message activity to generate "follow the crowd" trade decisions
that run alongside Claude and the Ollama shadow.

Run:
    .\\.venv\\Scripts\\python.exe scripts\\social_scout.py

Polling interval is generous (10 min) to stay polite with Stocktwits
and Reddit's free tier expectations. Stocktwits doesn't enforce hard
rate limits on this endpoint but expects no abuse; Reddit allows ~60
req/min for read-only.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

INTERVAL_SECONDS = 10 * 60
SOCIAL_DIR = Path("data/social")
SOCIAL_DIR.mkdir(parents=True, exist_ok=True)

EQUITY_TICKERS = [
    "SPY", "QQQ", "AAPL", "MSFT", "NVDA",
    "FCX", "SCCO", "TECK", "COPX",
]

REDDIT_SUBS = ["wallstreetbets", "stocks", "investing", "cryptocurrency"]

UA = "trading-shadow-social-scout/0.1 (10 Research Group)"

TICKER_RE = re.compile(r"\$([A-Z]{1,5})\b")  # matches $AAPL, $SPY etc.
BULLISH_KEYWORDS = re.compile(r"\b(buy|long|bull|moon|calls?|puts? sold|breakout|squeeze|pump)\b", re.I)
BEARISH_KEYWORDS = re.compile(r"\b(sell|short|bear|crash|puts?|calls? sold|dump|tank|rug)\b", re.I)


def _seen_ids(path: Path, key: str) -> set[str]:
    if not path.exists():
        return set()
    seen = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            v = json.loads(line).get(key)
            if v is not None:
                seen.add(str(v))
        except json.JSONDecodeError:
            continue
    return seen


def fetch_stocktwits(ticker: str) -> tuple[int, dict[str, int]]:
    """Returns (new_messages_count, sentiment_counter dict)."""
    url = f"https://api.stocktwits.com/api/2/streams/symbol/{ticker}.json"
    sentiment = Counter()
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=15)
        if r.status_code != 200:
            return 0, sentiment
        msgs = r.json().get("messages") or []
    except Exception as e:
        print(f"[social_scout] stocktwits {ticker} failed: {e}", file=sys.stderr)
        return 0, sentiment

    path = SOCIAL_DIR / f"stocktwits_{ticker}.jsonl"
    seen = _seen_ids(path, "id")
    appended = 0
    with path.open("a", encoding="utf-8") as f:
        for m in msgs:
            mid = str(m.get("id"))
            if mid in seen:
                continue
            seen.add(mid)

            user = m.get("user") or {}
            entities = m.get("entities") or {}
            sent = (entities.get("sentiment") or {}).get("basic")
            if sent:
                sentiment[sent.lower()] += 1

            row = {
                "id": mid,
                "ticker": ticker,
                "body": m.get("body", "")[:500],
                "username": user.get("username"),
                "followers": user.get("followers"),
                "ideas_count": user.get("ideas"),
                "like_count": (m.get("likes") or {}).get("total"),
                "sentiment": sent,
                "created_at": m.get("created_at"),
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            appended += 1
    return appended, sentiment


def fetch_reddit(subreddit: str) -> tuple[int, dict[str, dict[str, int]]]:
    """Returns (new_post_count, per_ticker_sentiment).

    Each ticker mention in a post gets classified by keyword sentiment
    of the title+selftext.
    """
    url = f"https://www.reddit.com/r/{subreddit}/new.json?limit=50"
    per_ticker_sentiment: dict[str, dict[str, int]] = defaultdict(lambda: Counter())
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=15)
        if r.status_code != 200:
            return 0, {}
        children = (r.json().get("data") or {}).get("children") or []
    except Exception as e:
        print(f"[social_scout] reddit r/{subreddit} failed: {e}", file=sys.stderr)
        return 0, {}

    path = SOCIAL_DIR / f"reddit_{subreddit}.jsonl"
    seen = _seen_ids(path, "id")
    appended = 0
    with path.open("a", encoding="utf-8") as f:
        for child in children:
            d = child.get("data") or {}
            pid = d.get("id")
            if not pid or pid in seen:
                continue
            seen.add(pid)
            text = (d.get("title") or "") + "\n" + (d.get("selftext") or "")
            tickers = TICKER_RE.findall(text)
            bull = bool(BULLISH_KEYWORDS.search(text))
            bear = bool(BEARISH_KEYWORDS.search(text))
            sentiment_label = "bullish" if (bull and not bear) else "bearish" if (bear and not bull) else "mixed" if (bull and bear) else "neutral"

            for t in set(tickers):
                if t in EQUITY_TICKERS:
                    per_ticker_sentiment[t][sentiment_label] += 1

            row = {
                "id": pid,
                "subreddit": subreddit,
                "title": d.get("title"),
                "score": d.get("score"),
                "comments": d.get("num_comments"),
                "url": f"https://www.reddit.com{d.get('permalink', '')}",
                "tickers_mentioned": list(set(tickers)),
                "sentiment_inferred": sentiment_label,
                "created_utc": d.get("created_utc"),
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            appended += 1
    return appended, dict(per_ticker_sentiment)


def write_aggregated_sentiment(per_ticker: dict[str, dict[str, int]]) -> None:
    path = SOCIAL_DIR / "sentiment.jsonl"
    ts = datetime.now(timezone.utc).isoformat()
    with path.open("a", encoding="utf-8") as f:
        for ticker, counts in per_ticker.items():
            bull = counts.get("bullish", 0)
            bear = counts.get("bearish", 0)
            total = bull + bear + counts.get("neutral", 0) + counts.get("mixed", 0)
            score = (bull - bear) / total if total else 0.0
            f.write(json.dumps({
                "ts": ts,
                "ticker": ticker,
                "bullish": bull,
                "bearish": bear,
                "neutral": counts.get("neutral", 0),
                "mixed": counts.get("mixed", 0),
                "total_mentions": total,
                "sentiment_score": round(score, 3),  # -1.0 to +1.0
            }) + "\n")


def one_pass() -> None:
    per_ticker: dict[str, dict[str, int]] = defaultdict(lambda: Counter())
    total_st = 0
    for ticker in EQUITY_TICKERS:
        n, sent = fetch_stocktwits(ticker)
        total_st += n
        for label, count in sent.items():
            per_ticker[ticker][label] += count

    total_rd = 0
    for sub in REDDIT_SUBS:
        n, per_t = fetch_reddit(sub)
        total_rd += n
        for ticker, counts in per_t.items():
            for label, count in counts.items():
                per_ticker[ticker][label] += count

    write_aggregated_sentiment(per_ticker)
    summary = ", ".join(
        f"{t}({c.get('bullish', 0)}b/{c.get('bearish', 0)}r)"
        for t, c in sorted(per_ticker.items()) if sum(c.values()) > 0
    )
    print(
        f"[social_scout] pass: +{total_st} stocktwits  +{total_rd} reddit  "
        f"sentiment_picks=[{summary or '(none yet)'}]"
    )


if __name__ == "__main__":
    print(f"[social_scout] starting; tickers={len(EQUITY_TICKERS)} subs={len(REDDIT_SUBS)} interval={INTERVAL_SECONDS}s")
    while True:
        try:
            one_pass()
        except Exception as e:
            print(f"[social_scout] pass error: {e}", file=sys.stderr)
        time.sleep(INTERVAL_SECONDS)
