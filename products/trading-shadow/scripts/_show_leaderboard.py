"""Local-only: print the leaderboard to stdout without posting to Discord."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from post_leaderboard import simulate, fetch_alpaca, AGENTS

rows = [
    json.loads(l)
    for l in Path("data/decisions.jsonl").read_text(encoding="utf-8").splitlines()
    if l.strip()
]
print(f"total decisions logged: {len(rows)}")
sim = simulate(rows)
ranked = sorted(AGENTS, key=lambda a: sim[a]["equity"], reverse=True)
print()
print(
    f"{'rank':<5}{'agent':<25}{'equity':>15}{'P/L':>12}"
    f"{'P/L %':>10}{'trades':>10}{'errors':>10}"
)
print("-" * 87)
for i, a in enumerate(ranked, 1):
    s = sim[a]
    print(
        f"{i:<5}{a:<25}${s['equity']:>13,.2f}{s['pl']:>+12.2f}"
        f"{s['pl_pct']:>+9.3f}%{s['trades']:>10}{s['errors']:>10}"
    )
print()
spread = sim[ranked[0]]["equity"] - sim[ranked[1]]["equity"]
print(f"winner: {ranked[0]}  (+${spread:.2f} over {ranked[1]})")
print()
ap = fetch_alpaca()
if ap:
    print(
        f"real alpaca paper acct: equity ${ap['equity']:,.2f}  "
        f"day P/L {ap['day_pl']:+.2f} ({ap['day_pl_pct']:+.2f}%)  "
        f"cash ${ap['cash']:,.2f}"
    )
