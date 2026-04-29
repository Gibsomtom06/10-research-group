"""Best-effort Supabase sync for the trading-shadow decision log.

Every decision appended via DecisionLog.append() also gets upserted into the
TENx10 platform's `trades` table so the dashboard can show running P&L,
accuracy, and a live tail of paper/live trade decisions.

Failures NEVER crash the loop — they log to stderr and move on.
"""
from __future__ import annotations

import os
import sys
from dataclasses import asdict
from typing import Optional

from trading_shadow.decision_log import Decision

_warned_missing = False


def _client():
    """Return a configured supabase client, or None if env / lib missing."""
    global _warned_missing
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not (url and key):
        if not _warned_missing:
            print(
                "[supabase_sync] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — "
                "skipping sync. Decisions still written to JSONL.",
                file=sys.stderr,
            )
            _warned_missing = True
        return None
    try:
        from supabase import create_client  # type: ignore
    except Exception as e:  # pragma: no cover - import guard
        if not _warned_missing:
            print(f"[supabase_sync] supabase client unavailable: {e}", file=sys.stderr)
            _warned_missing = True
        return None
    try:
        return create_client(url, key)
    except Exception as e:  # pragma: no cover
        print(f"[supabase_sync] create_client failed: {e}", file=sys.stderr)
        return None


def sync_decision(
    decision: Decision,
    *,
    mode: str,
    ticker: Optional[str] = None,
    action: Optional[str] = None,
    shares: Optional[float] = None,
    price: Optional[float] = None,
    pnl: Optional[float] = None,
    accuracy: Optional[bool] = None,
) -> None:
    """Upsert a single decision row into the `trades` table.

    Best-effort: any failure (no env, network error, supabase down) is
    swallowed and logged to stderr. The trading loop must NEVER crash on this.
    """
    if mode not in ("paper", "live"):
        print(f"[supabase_sync] invalid mode {mode!r}, skipping", file=sys.stderr)
        return

    client = _client()
    if client is None:
        return

    # Pull price from market_state when not explicitly passed.
    if price is None:
        ms_price = decision.market_state.get("price") if decision.market_state else None
        if isinstance(ms_price, (int, float)):
            price = float(ms_price)

    row = {
        "decision_id": decision.decision_id,
        "prior_state_id": decision.prior_state_id,
        "track": decision.track,
        "agent": decision.agent,
        "ticker": ticker if ticker is not None else decision.ticker,
        "action": action if action is not None else decision.action,
        "shares": shares,
        "price": price,
        "mode": mode,
        "pnl": pnl,
        "accuracy": accuracy,
        "raw": asdict(decision),
        "decided_at": decision.timestamp,
    }

    try:
        client.table("trades").upsert(row, on_conflict="decision_id").execute()
    except Exception as e:
        print(f"[supabase_sync] upsert failed for {decision.decision_id}: {e}", file=sys.stderr)
