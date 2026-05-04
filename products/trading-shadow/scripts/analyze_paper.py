"""Analyze paper-trading decisions: per-track, per-agent, per-ticker breakdown.

Reads data/decisions.jsonl and produces:
- Run summary (total passes, time range, errors)
- Per-agent action distribution (claude vs shadow: buy / sell / hold / error)
- Agreement matrix (when both agents acted on the same ticker+timestamp, did they agree?)
- Per-ticker last decision + market state
- Highlighted disagreements (where Claude and Shadow diverged)
- Error roll-up (Claude credit-exhausted, yfinance timeouts, etc.)

Usage:
    python scripts/analyze_paper.py            # full report
    python scripts/analyze_paper.py --since 1h # last hour only
    python scripts/analyze_paper.py --json     # JSON output for piping
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

LOG_PATH = Path("data/decisions.jsonl")


@dataclass
class Row:
    ts: datetime
    track: str
    agent: str
    ticker: str
    action: str
    size_usd: float
    reasoning: str
    price: float
    rsi: float
    confidence: float
    is_error: bool
    error_kind: str | None


def parse_since(s: str | None) -> datetime | None:
    if not s:
        return None
    m = re.fullmatch(r"(\d+)([mhd])", s.strip().lower())
    if not m:
        raise SystemExit(f"--since must look like 30m, 4h, 2d (got {s!r})")
    n, unit = int(m.group(1)), m.group(2)
    delta = {"m": timedelta(minutes=n), "h": timedelta(hours=n), "d": timedelta(days=n)}[unit]
    return datetime.now(timezone.utc) - delta


def load(path: Path, since: datetime | None) -> list[Row]:
    rows: list[Row] = []
    if not path.exists():
        return rows
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            continue
        ts = datetime.fromisoformat(d["timestamp"])
        if since and ts < since:
            continue
        raw_reasoning = d.get("reasoning") or ""
        reasoning = raw_reasoning if isinstance(raw_reasoning, str) else json.dumps(raw_reasoning)
        is_error = reasoning.startswith("claude_error:")
        error_kind: str | None = None
        if is_error:
            if "credit balance is too low" in reasoning:
                error_kind = "anthropic_credits_exhausted"
            elif "BadRequestError" in reasoning:
                error_kind = "anthropic_bad_request"
            elif "RateLimit" in reasoning:
                error_kind = "anthropic_rate_limit"
            else:
                error_kind = "claude_other"
        ms = d.get("market_state") or {}
        rows.append(Row(
            ts=ts,
            track=d.get("track", "?"),
            agent=d.get("agent", "?"),
            ticker=d.get("ticker", "?"),
            action=str(d.get("action", "")).lower(),
            size_usd=float(d.get("size_usd") or 0.0),
            reasoning=reasoning,
            price=float(ms.get("price") or 0.0),
            rsi=float(ms.get("rsi") or 0.0),
            confidence=float(ms.get("confidence") or 0.0),
            is_error=is_error,
            error_kind=error_kind,
        ))
    return rows


def summarize(rows: list[Row]) -> dict[str, Any]:
    if not rows:
        return {"empty": True, "rows": 0}

    by_agent_action: dict[str, Counter[str]] = defaultdict(Counter)
    error_kinds: Counter[str] = Counter()
    by_track: Counter[str] = Counter()
    last_per_ticker: dict[tuple[str, str, str], Row] = {}  # (track, agent, ticker) -> latest row

    for r in rows:
        by_agent_action[r.agent][r.action] += 1
        by_track[r.track] += 1
        if r.error_kind:
            error_kinds[r.error_kind] += 1
        key = (r.track, r.agent, r.ticker)
        if key not in last_per_ticker or r.ts > last_per_ticker[key].ts:
            last_per_ticker[key] = r

    # Agreement matrix: pair claude+shadow rows on (track, ticker, ts)
    paired: dict[tuple[str, str, str], dict[str, Row]] = defaultdict(dict)
    for r in rows:
        if r.agent in ("claude", "shadow"):
            paired[(r.track, r.ticker, r.ts.isoformat())][r.agent] = r

    agreements: Counter[str] = Counter()
    disagreements: list[dict[str, Any]] = []
    for (track, ticker, ts), pair in paired.items():
        if "claude" in pair and "shadow" in pair:
            c, s = pair["claude"], pair["shadow"]
            if c.is_error:
                agreements["claude_errored"] += 1
                continue
            if c.action == s.action:
                agreements["agree"] += 1
            else:
                agreements["disagree"] += 1
                disagreements.append({
                    "ts": ts, "track": track, "ticker": ticker,
                    "claude": c.action, "shadow": s.action,
                    "rsi": round(c.rsi, 2), "price": c.price,
                })

    timestamps = sorted({r.ts for r in rows})
    return {
        "rows": len(rows),
        "first_ts": timestamps[0].isoformat(),
        "last_ts": timestamps[-1].isoformat(),
        "by_track": dict(by_track),
        "by_agent_action": {a: dict(c) for a, c in by_agent_action.items()},
        "errors": dict(error_kinds),
        "agreements": dict(agreements),
        "disagreements": disagreements,
        "last_decisions": [
            {
                "track": k[0], "agent": k[1], "ticker": k[2],
                "action": v.action, "rsi": round(v.rsi, 2),
                "price": v.price, "ts": v.ts.isoformat(),
                "reasoning": v.reasoning[:120] if v.reasoning else "",
            }
            for k, v in sorted(last_per_ticker.items())
        ],
    }


def render(s: dict[str, Any]) -> str:
    if s.get("empty"):
        return "No decisions logged yet."
    lines = []
    lines.append("PAPER TRADING — RESULTS ANALYSIS")
    lines.append("=" * 60)
    lines.append(f"rows: {s['rows']}    window: {s['first_ts']}  ->  {s['last_ts']}")
    lines.append(f"by track: {s['by_track']}")
    lines.append("")
    lines.append("ACTION DISTRIBUTION")
    for agent, actions in s["by_agent_action"].items():
        total = sum(actions.values())
        bits = ", ".join(f"{a}={n} ({n/total:.0%})" for a, n in sorted(actions.items()))
        lines.append(f"  {agent:8}  n={total:4}  {bits}")
    lines.append("")
    if s["errors"]:
        lines.append("ERRORS")
        for k, n in s["errors"].items():
            lines.append(f"  {k:35}  {n}")
        lines.append("")
    lines.append("CLAUDE vs SHADOW AGREEMENT")
    for k, v in s["agreements"].items():
        lines.append(f"  {k:20}  {v}")
    lines.append("")
    if s["disagreements"]:
        lines.append(f"DISAGREEMENTS  ({len(s['disagreements'])})")
        for d in s["disagreements"][-15:]:
            lines.append(
                f"  {d['ts'][:19]}  T{d['track']}  {d['ticker']:5}  "
                f"claude={d['claude']:5}  shadow={d['shadow']:5}  "
                f"rsi={d['rsi']:.1f}  px={d['price']:.2f}"
            )
        lines.append("")
    lines.append("LAST DECISION PER (track, agent, ticker)")
    for ld in s["last_decisions"]:
        lines.append(
            f"  T{ld['track']}  {ld['agent']:7}  {ld['ticker']:5}  "
            f"{ld['action']:5}  rsi={ld['rsi']:5.1f}  px={ld['price']:8.2f}  "
            f"{ld['ts'][:19]}"
        )
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", help="window: 30m, 4h, 2d, ...")
    ap.add_argument("--json", action="store_true", help="emit JSON instead of text")
    ap.add_argument("--path", default=str(LOG_PATH))
    args = ap.parse_args()

    rows = load(Path(args.path), parse_since(args.since))
    summary = summarize(rows)
    if args.json:
        print(json.dumps(summary, indent=2, default=str))
    else:
        print(render(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
