#!/usr/bin/env python3
"""
scripts/model_spend_report.py
-----------------------------

CLI summary of the model_calls ledger (task #21). Matches what
/dashboard/costs renders, so we have a terminal view when Supabase's
Studio / Next UI isn't handy.

Usage:
    python scripts/model_spend_report.py                # last 30d
    python scripts/model_spend_report.py --days 7
    python scripts/model_spend_report.py --agent outbound

Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""
from __future__ import annotations

import argparse
import os
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone

try:
    from supabase import create_client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)


def supabase():
    url = os.environ["SUPABASE_URL"]
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_KEY"]
    return create_client(url, key)


def money(n: float) -> str:
    return f"${n:,.4f}"


def intfmt(n: int) -> str:
    return f"{n:,}"


def main() -> int:
    ap = argparse.ArgumentParser(description="model_calls ledger report")
    ap.add_argument("--days", type=int, default=30)
    ap.add_argument("--agent", help="filter to a single agent_name")
    ap.add_argument("--tenant", help="filter to a single tenant_id")
    args = ap.parse_args()

    sb = supabase()
    since = (datetime.now(timezone.utc) - timedelta(days=args.days)).isoformat()

    q = sb.table("model_calls").select(
        "agent_name, model_id, provider, input_tokens, output_tokens, "
        "cache_creation_input_tokens, cache_read_input_tokens, "
        "cost_usd, latency_ms, success, tenant_id"
    ).gte("created_at", since)
    if args.agent:
        q = q.eq("agent_name", args.agent)
    if args.tenant:
        q = q.eq("tenant_id", args.tenant)
    rows = q.execute().data or []

    if not rows:
        print(f"no model_calls rows in the last {args.days}d")
        return 0

    # per-agent rollup
    agent_stats: dict[str, dict] = defaultdict(lambda: {
        "calls": 0, "in": 0, "out": 0, "cache_w": 0, "cache_r": 0,
        "cost": 0.0, "lat_ms_sum": 0, "lat_n": 0, "errors": 0,
        "models": set(),
    })
    for r in rows:
        a = agent_stats[r["agent_name"]]
        a["calls"] += 1
        a["in"] += r["input_tokens"] or 0
        a["out"] += r["output_tokens"] or 0
        a["cache_w"] += r.get("cache_creation_input_tokens") or 0
        a["cache_r"] += r.get("cache_read_input_tokens") or 0
        a["cost"] += float(r["cost_usd"] or 0)
        if r.get("latency_ms"):
            a["lat_ms_sum"] += int(r["latency_ms"])
            a["lat_n"] += 1
        if not r.get("success", True):
            a["errors"] += 1
        a["models"].add(r.get("model_id", "?"))

    total_cost = sum(a["cost"] for a in agent_stats.values())
    total_calls = sum(a["calls"] for a in agent_stats.values())

    print(f"dba model spend — last {args.days}d")
    print(f"  total: {money(total_cost)}   calls: {intfmt(total_calls)}   "
          f"avg / call: {money(total_cost / total_calls) if total_calls else '—'}")
    print()
    print(f"{'agent':<14}{'calls':>8}{'in':>10}{'out':>10}{'cache r/w':>14}"
          f"{'errors':>8}{'avg lat':>10}{'cost':>12}   model(s)")
    print("-" * 110)
    for agent, a in sorted(agent_stats.items(), key=lambda kv: kv[1]["cost"], reverse=True):
        avg_lat = f"{a['lat_ms_sum'] // a['lat_n']} ms" if a["lat_n"] else "—"
        print(
            f"{agent:<14}"
            f"{intfmt(a['calls']):>8}"
            f"{intfmt(a['in']):>10}"
            f"{intfmt(a['out']):>10}"
            f"{intfmt(a['cache_r']) + '/' + intfmt(a['cache_w']):>14}"
            f"{intfmt(a['errors']):>8}"
            f"{avg_lat:>10}"
            f"{money(a['cost']):>12}"
            f"   {', '.join(sorted(a['models']))}"
        )
    print()
    # Phase-1 downgrade hint
    ranked = sorted(agent_stats.items(), key=lambda kv: kv[1]["cost"], reverse=True)
    if ranked:
        top = ranked[0][0]
        print(f"phase-1 shortlist: '{top}' is the single biggest cost driver — "
              f"it's the first candidate for a Haiku eye-test.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
