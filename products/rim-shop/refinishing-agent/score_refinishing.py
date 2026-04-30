#!/usr/bin/env python3
"""
WRS refinishing prioritization.

Reads:
    inventory.csv   sku, finish, size, price, ready, stock_ready, stock_not_ready
    trends.json     { "<finish>|<size>": demand_index_0_100 }
    trend_alerts.json  [ { finish, bonus, through(date) } ]

Writes:
    work_order_YYYY-MM-DD.md

Usage:
    python score_refinishing.py --inventory inventory.csv --trends trends.json \
        --alerts trend_alerts.json --out ./work_orders
"""
import argparse
import csv
import json
from datetime import date
from pathlib import Path


def availability_multiplier(stock_ready: int) -> float:
    if stock_ready <= 0: return 1.5
    if stock_ready <= 2: return 1.2
    if stock_ready <= 5: return 1.0
    return 0.7  # plenty in stock — don't refinish more of this yet


def trend_modifier(finish: str, alerts: list, today: date) -> float:
    mod = 1.0
    for a in alerts:
        if a["finish"].lower() != finish.lower():
            continue
        through = date.fromisoformat(a["through"])
        if today <= through:
            mod += float(a.get("bonus", 0))
    return mod


def score(row: dict, trends: dict, alerts: list, today: date) -> tuple[float, str]:
    key = f"{row['finish'].lower()}|{row['size']}"
    demand = float(trends.get(key, 50))  # default to 50 if unknown
    price = float(row["price"])
    stock_ready = int(row.get("stock_ready", 0) or 0)
    avail = availability_multiplier(stock_ready)
    tmod = trend_modifier(row["finish"], alerts, today)
    s = demand * price * avail * tmod
    reasons = []
    if tmod > 1.0: reasons.append(f"trend +{int((tmod-1)*100)}%")
    if stock_ready == 0: reasons.append("0 in stock")
    elif stock_ready <= 2: reasons.append(f"only {stock_ready} in stock")
    reasons.append(f"{int(demand)} demand idx")
    return s, " · ".join(reasons)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inventory", required=True)
    ap.add_argument("--trends", required=True)
    ap.add_argument("--alerts", default=None)
    ap.add_argument("--out", default=".")
    ap.add_argument("--top", type=int, default=10)
    args = ap.parse_args()

    trends = json.loads(Path(args.trends).read_text()) if Path(args.trends).exists() else {}
    alerts = json.loads(Path(args.alerts).read_text()) if args.alerts and Path(args.alerts).exists() else []
    today = date.today()

    candidates = []
    stale = []
    with open(args.inventory, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            not_ready = int(row.get("stock_not_ready", 0) or 0)
            if not_ready <= 0:
                continue
            s, why = score(row, trends, alerts, today)
            candidates.append((s, row, why))
            days_in_backlog = int(row.get("days_in_not_ready", 0) or 0)
            if days_in_backlog >= 120:
                stale.append(row)

    candidates.sort(key=lambda x: -x[0])

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"work_order_{today.isoformat()}.md"

    lines = [
        f"# WRS Refinishing Work Order — Week of {today.isoformat()}",
        "",
        f"## Top {args.top} to refinish this week",
        "",
        "| Rank | SKU | Finish | Size | Target Price | In Not Ready | Score | Why |",
        "|------|-----|--------|------|--------------|--------------|-------|-----|",
    ]
    for i, (s, row, why) in enumerate(candidates[: args.top], start=1):
        lines.append(
            f"| {i} | {row['sku']} | {row['finish']} | {row['size']}\" | ${row['price']} | "
            f"{row['stock_not_ready']} | {int(s):,} | {why} |"
        )

    if stale:
        lines += ["", "## Stale units (120+ days in backlog)",
                  "Either refinish these this week or liquidate. Capital is sitting idle.",
                  ""]
        for row in stale:
            lines.append(f"- {row['sku']} · {row['finish']} {row['size']}\" · "
                         f"{row['days_in_not_ready']} days in backlog")

    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
