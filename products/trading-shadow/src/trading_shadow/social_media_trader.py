"""social_media_trader — follows TWO signals, weighted:

  1. INSTITUTIONAL (heavy weight: 3x) — SEC 13F quarterly filings from
     Berkshire (Buffett), Bridgewater (Dalio), Pershing Square (Ackman).
     Read from data/research/13f/diff_latest.jsonl. INCREASED = bull,
     REDUCED = bear, ADDED = strong bull, EXITED = strong bear. Multiple
     funds aligned amplifies the signal.

  2. RETAIL (light weight: 1x) — Reddit crowd sentiment from
     data/social/sentiment.jsonl. Aggregated bullish/bearish counts.

Decision (no LLM, pure rules, zero API cost):
  blended_score = (3 * inst_score + retail_score) / 4
  BUY  if blended_score > +0.30
  SELL if blended_score < -0.30
  HOLD otherwise

13F is quarterly (lagged) but it's REAL MONEY. Reddit is real-time but
crowd-noisy. Blending both gives an agent that's grounded in
institutional flow with a retail-momentum overlay.

Logged as agent="social_media_trader" in the decision log.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from trading_shadow.alpaca_client import AccountState
from trading_shadow.claude_trader import TraderDecision

SENTIMENT_PATH = Path("data/social/sentiment.jsonl")
INSTITUTIONAL_DIFF_PATH = Path("data/research/13f/diff_latest.jsonl")

# Trade thresholds — tunable as we learn what works
SENTIMENT_THRESHOLD = 0.3   # |blended score| above this fires a directional trade
MIN_MENTIONS = 3            # Reddit-side mention floor
# Sizing: this trader is a single-tier rules engine (no conviction
# tiers like the LLM trader). Size at the typical-conviction tier
# (5% of equity) when a signal fires; the guardrail enforces the
# 10% absolute cap.
DEFAULT_SIZE_PCT = 0.05

# Signal weights when blending institutional + retail
INST_WEIGHT = 3.0
RETAIL_WEIGHT = 1.0

# Map 13F change kinds → directional score per fund per ticker
INST_KIND_SCORE = {
    "ADDED":     +1.0,  # brand-new position
    "INCREASED": +0.5,
    "REDUCED":   -0.5,
    "EXITED":    -1.0,  # exited position entirely
}


def latest_sentiment_for(ticker: str) -> Optional[dict]:
    """Return the most recent sentiment row for a ticker, or None."""
    if not SENTIMENT_PATH.exists():
        return None
    latest = None
    for line in SENTIMENT_PATH.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if row.get("ticker") != ticker:
            continue
        if latest is None or (row.get("ts") or "") > (latest.get("ts") or ""):
            latest = row
    return latest


def institutional_signal_for(ticker: str) -> tuple[float, list[str]]:
    """Aggregate 13F position changes for a ticker across all top-3 funds.

    Dedupes by (fund_cik, to_filing) so re-running fetch_13f doesn't
    inflate the score. Each fund counts once per filing.

    Returns: (score in [-3.0, +3.0], list of human-readable reasons)
    """
    if not INSTITUTIONAL_DIFF_PATH.exists():
        return 0.0, []
    # Read all rows, dedupe by (cik, to_filing), keep the latest entry
    seen: dict[tuple[str, str], dict] = {}
    for line in INSTITUTIONAL_DIFF_PATH.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        key = (row.get("cik", ""), row.get("to_filing", ""))
        seen[key] = row  # later writes overwrite earlier
    score = 0.0
    reasons: list[str] = []
    for row in seen.values():
        watched = row.get("watched_changes") or {}
        if ticker not in watched:
            continue
        change = watched[ticker]
        kind = change.get("kind", "")
        delta = change.get("shares_delta", 0)
        s = INST_KIND_SCORE.get(kind, 0.0)
        if s != 0.0:
            score += s
            reasons.append(f"{row.get('fund', '?')} {kind} ({delta:+,} shares)")
    return score, reasons


def social_media_trader_predict(
    *,
    ticker: str,
    current_price: float,
    rsi: float,
    account: AccountState,
    track: str,
    live: bool,
) -> TraderDecision:
    """Compute the copy-trader's decision for one ticker.

    Pure function over the latest social sentiment row. No LLM, no API.
    """
    # === Institutional signal (13F) ===
    inst_score, inst_reasons = institutional_signal_for(ticker)

    # === Retail signal (Reddit sentiment) ===
    row = latest_sentiment_for(ticker)
    retail_score = 0.0
    retail_summary = "no retail data"
    if row is not None:
        rs = float(row.get("sentiment_score") or 0.0)
        total = int(row.get("total_mentions") or 0)
        bull = int(row.get("bullish") or 0)
        bear = int(row.get("bearish") or 0)
        if total >= MIN_MENTIONS:
            retail_score = rs
            retail_summary = f"retail score={rs:+.2f} ({bull}b/{bear}r over {total})"
        else:
            retail_summary = f"retail thin ({total} mentions)"

    # If neither signal fired, hold
    if inst_score == 0.0 and retail_score == 0.0:
        reason_bits = []
        if inst_reasons:
            reason_bits.append("inst: " + "; ".join(inst_reasons))
        reason_bits.append(retail_summary)
        return TraderDecision(
            action="hold",
            size_usd=0.0,
            reasoning="no actionable signal · " + " · ".join(reason_bits),
            confidence=0.0,
        )

    # Blend (institutional weighted 3x, retail 1x)
    blended = (INST_WEIGHT * inst_score + RETAIL_WEIGHT * retail_score) / (INST_WEIGHT + RETAIL_WEIGHT)

    inst_summary = "; ".join(inst_reasons) if inst_reasons else "no inst data"
    full_reasoning = (
        f"blended={blended:+.2f} (inst={inst_score:+.2f} ×{INST_WEIGHT:.0f}, retail={retail_score:+.2f} ×{RETAIL_WEIGHT:.0f}) · "
        f"inst[{inst_summary}] · retail[{retail_summary}]"
    )

    size = account.equity * DEFAULT_SIZE_PCT

    if blended >= SENTIMENT_THRESHOLD:
        return TraderDecision(
            action="buy", size_usd=size,
            reasoning=full_reasoning,
            confidence=min(1.0, abs(blended) + 0.2),
        )
    if blended <= -SENTIMENT_THRESHOLD:
        return TraderDecision(
            action="sell", size_usd=size,
            reasoning=full_reasoning,
            confidence=min(1.0, abs(blended) + 0.2),
        )

    return TraderDecision(
        action="hold", size_usd=0.0,
        reasoning=full_reasoning,
        confidence=max(0.0, abs(blended)),
    )
