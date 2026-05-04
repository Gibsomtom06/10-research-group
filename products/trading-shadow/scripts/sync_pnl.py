"""sync_pnl.py — Backfill P&L, shares, and accuracy into the Supabase trades table.

Reads data/decisions.jsonl, walks each agent's decisions chronologically using
FIFO position tracking, computes per-trade P&L, and writes back to Supabase.

Safe to run repeatedly — skips rows that already have pnl set (use --force to overwrite).

    python scripts/sync_pnl.py
    python scripts/sync_pnl.py --dry-run     # print, don't write
    python scripts/sync_pnl.py --force        # overwrite existing pnl
    python scripts/sync_pnl.py --since 24h    # only recent decisions
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

MODE = os.environ.get("MODE", "paper")
ENV_FILE = Path(f".env.{MODE}")
if ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=False)
else:
    load_dotenv(override=False)

LOG_PATH = Path("data/decisions.jsonl")

# Canonical agent names — shadow_copy is a legacy alias for social_media_trader.
AGENT_ALIASES: dict[str, str] = {"shadow_copy": "social_media_trader"}


def _client():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not (url and key):
        print(
            "[sync_pnl] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — aborting.",
            file=sys.stderr,
        )
        return None
    try:
        from supabase import create_client  # type: ignore
        return create_client(url, key)
    except Exception as e:
        print(f"[sync_pnl] supabase unavailable: {e}", file=sys.stderr)
        return None


def parse_since(s: str | None) -> datetime | None:
    if not s:
        return None
    m = re.fullmatch(r"(\d+)([mhd])", s.strip().lower())
    if not m:
        raise SystemExit(f"--since must be like 30m, 4h, 2d  (got {s!r})")
    n, unit = int(m.group(1)), m.group(2)
    delta = {"m": timedelta(minutes=n), "h": timedelta(hours=n), "d": timedelta(days=n)}[unit]
    return datetime.now(timezone.utc) - delta


def load_rows(path: Path, since: datetime | None = None) -> list[dict]:
    if not path.exists():
        return []
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            r = json.loads(line)
        except json.JSONDecodeError:
            continue
        if since:
            try:
                ts = datetime.fromisoformat(r.get("timestamp", ""))
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                if ts < since:
                    continue
            except Exception:
                continue
        out.append(r)
    return out


def compute_pnl(rows: list[dict]) -> list[dict]:
    """Walk all decisions per (agent, ticker) in FIFO order.

    Returns a list of update dicts, one per decision that has a buy or sell action.
    Each dict: {decision_id, shares, pnl, accuracy, filled_at}

    P&L rules:
    - BUY:  opens or adds to a FIFO lot queue for (agent, ticker).
            pnl = unrealized at last-known price for that ticker (computed at end).
    - SELL/CLOSE: drains FIFO lots, realizes P&L per lot consumed.
    - HOLD: skipped (no P&L, no shares).
    """
    rows_sorted = sorted(rows, key=lambda r: r.get("timestamp", ""))

    # latest_price[ticker] = most recently logged price for mark-to-market
    latest_price: dict[str, float] = {}

    # open_lots[agent][ticker] = deque of (qty, entry_price, decision_id)
    open_lots: dict[str, dict[str, deque]] = defaultdict(lambda: defaultdict(deque))

    # updates keyed by decision_id so we can back-fill unrealized at the end
    updates: dict[str, dict] = {}

    for r in rows_sorted:
        agent = AGENT_ALIASES.get(r.get("agent") or "", r.get("agent") or "?")
        decision_id = r.get("decision_id") or ""
        ticker = r.get("ticker") or ""
        ms = r.get("market_state") or {}
        price = float(ms.get("price") or 0.0)
        action = str(r.get("action", "")).lower()
        size_usd = float(r.get("size_usd") or 0.0)
        ts = r.get("timestamp") or ""
        reasoning = r.get("reasoning") or ""

        if not ticker or price <= 0 or not decision_id:
            continue

        latest_price[ticker] = price

        is_error = isinstance(reasoning, str) and reasoning.startswith("claude_error:")
        if is_error or action == "hold":
            continue

        if action == "buy" and size_usd > 0:
            qty = size_usd / price
            open_lots[agent][ticker].append((qty, price, decision_id))
            updates[decision_id] = {
                "decision_id": decision_id,
                "shares": round(qty, 6),
                "pnl": None,       # filled in at end via mark-to-market
                "accuracy": None,  # filled in at end
                "filled_at": ts,
                "_is_open_buy": True,
                "_agent": agent,
                "_ticker": ticker,
            }

        elif action in ("sell", "close"):
            lots = open_lots[agent][ticker]
            if not lots:
                # Sell with no matching open position — record shares/filled_at only
                updates[decision_id] = {
                    "decision_id": decision_id,
                    "shares": None,
                    "pnl": None,
                    "accuracy": None,
                    "filled_at": ts,
                    "_is_open_buy": False,
                    "_agent": agent,
                    "_ticker": ticker,
                }
                continue

            # Realize P&L across all lots for this ticker (full close)
            total_qty = 0.0
            total_cost = 0.0
            while lots:
                qty, entry, buy_did = lots.popleft()
                total_qty += qty
                total_cost += qty * entry
                # Mark the matching buy row as realized (clear the open flag)
                if buy_did in updates:
                    updates[buy_did]["_is_open_buy"] = False

            realized_pnl = (price - total_cost / total_qty) * total_qty if total_qty > 0 else 0.0
            updates[decision_id] = {
                "decision_id": decision_id,
                "shares": round(total_qty, 6),
                "pnl": round(realized_pnl, 4),
                "accuracy": realized_pnl > 0,
                "filled_at": ts,
                "_is_open_buy": False,
                "_agent": agent,
                "_ticker": ticker,
            }

    # Mark-to-market for all still-open buy rows
    for upd in updates.values():
        if not upd.get("_is_open_buy"):
            continue
        agent = upd["_agent"]
        ticker = upd["_ticker"]
        lots = open_lots[agent][ticker]
        # Find the lot for this specific decision_id
        did = upd["decision_id"]
        for lot_qty, lot_entry, lot_did in lots:
            if lot_did == did:
                current = latest_price.get(ticker, lot_entry)
                unrealized = (current - lot_entry) * lot_qty
                upd["pnl"] = round(unrealized, 4)
                upd["accuracy"] = unrealized > 0
                break

    # Strip internal tracking keys before returning
    clean = []
    for upd in updates.values():
        clean.append({k: v for k, v in upd.items() if not k.startswith("_")})

    return clean


def main() -> int:
    ap = argparse.ArgumentParser(description="Sync P&L from decisions.jsonl → Supabase trades table")
    ap.add_argument("--path", default=str(LOG_PATH), help="path to decisions.jsonl")
    ap.add_argument("--dry-run", action="store_true", help="print updates, don't write")
    ap.add_argument("--force", action="store_true", help="overwrite rows that already have pnl")
    ap.add_argument("--since", help="only process decisions newer than this (30m, 4h, 2d)")
    args = ap.parse_args()

    since = parse_since(args.since)
    rows = load_rows(Path(args.path), since)
    print(f"Loaded {len(rows)} decisions from {args.path}" + (f" (since {args.since})" if since else ""))

    updates = compute_pnl(rows)
    buys = [u for u in updates if u.get("pnl") is not None]
    print(f"Computed P&L for {len(buys)}/{len(updates)} buy/sell decisions")

    if args.dry_run:
        for u in sorted(updates, key=lambda x: x.get("filled_at") or "")[-30:]:
            pnl_str = f"{u['pnl']:+.4f}" if u.get("pnl") is not None else "null"
            acc_str = str(u.get("accuracy"))
            shares_str = f"{u['shares']:.4f}" if u.get("shares") else "null"
            print(f"  {u['decision_id'][:12]}  shares={shares_str:12}  pnl={pnl_str:10}  acc={acc_str}")
        if len(updates) > 30:
            print(f"  ... ({len(updates) - 30} more rows not shown)")
        return 0

    client = _client()
    if client is None:
        return 1

    if not args.force:
        # Fetch decision_ids that already have pnl set so we can skip them
        try:
            res = client.table("trades").select("decision_id").not_.is_("pnl", "null").execute()
            already_done = {r["decision_id"] for r in (res.data or [])}
        except Exception as e:
            print(f"[sync_pnl] could not fetch existing pnl rows: {e}", file=sys.stderr)
            already_done = set()
        skipped = sum(1 for u in updates if u["decision_id"] in already_done)
        updates = [u for u in updates if u["decision_id"] not in already_done]
        if skipped:
            print(f"Skipping {skipped} rows already have pnl (use --force to overwrite)")

    ok = err = 0
    for upd in updates:
        did = upd["decision_id"]
        payload = {k: v for k, v in upd.items() if k != "decision_id" and v is not None}
        if not payload:
            continue
        try:
            client.table("trades").update(payload).eq("decision_id", did).execute()
            ok += 1
        except Exception as e:
            print(f"  [sync_pnl] update failed {did[:12]}: {e}", file=sys.stderr)
            err += 1

    print(f"Done — updated {ok} rows ({err} errors)")
    return 0 if err == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
