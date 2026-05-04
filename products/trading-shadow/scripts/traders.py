"""Two-trader rollup: claude vs shadow only — no track split.

Mirrors the dashboard's per-trader leaderboard (which now collapses
track A and B into a single agent rollup).
"""
import json
from collections import Counter, defaultdict
from pathlib import Path

rows = [
    json.loads(l)
    for l in Path("data/decisions.jsonl").read_text(encoding="utf-8").splitlines()
    if l.strip()
]

agg = defaultdict(Counter)
last_ts: dict[str, str] = {}

for r in rows:
    a = r.get("agent", "?")
    act = str(r.get("action", "")).lower()
    reasoning = r.get("reasoning") or ""
    is_err = isinstance(reasoning, str) and reasoning.startswith("claude_error:")
    if is_err:
        agg[a]["errors"] += 1
        agg[a]["holds"] += 1
    elif act == "buy":
        agg[a]["buys"] += 1
    elif act in ("sell", "close"):
        agg[a]["sells"] += 1
    else:
        agg[a]["holds"] += 1
    agg[a]["decisions"] += 1
    ts = r.get("timestamp", "")
    if a not in last_ts or ts > last_ts[a]:
        last_ts[a] = ts

print(f"{'trader':<10}{'decisions':>11}{'buys':>7}{'sells':>7}{'holds':>7}{'errors':>8}  last_decision")
print("-" * 72)
# Map legacy agent name to new one for continuity with pre-rename rows
for r_agent, r_data in list(agg.items()):
    if r_agent == "shadow_copy":
        target = agg["social_media_trader"]
        for k, v in r_data.items():
            target[k] += v
        if "shadow_copy" in last_ts:
            ts = last_ts.pop("shadow_copy")
            if ts > last_ts.get("social_media_trader", ""):
                last_ts["social_media_trader"] = ts
        del agg[r_agent]

for agent in ("claude", "shadow", "social_media_trader"):
    c = agg[agent]
    print(
        f"{agent:<22}{c['decisions']:>6}{c['buys']:>7}{c['sells']:>7}"
        f"{c['holds']:>7}{c['errors']:>8}  {last_ts.get(agent, '-')[:19]}"
    )
