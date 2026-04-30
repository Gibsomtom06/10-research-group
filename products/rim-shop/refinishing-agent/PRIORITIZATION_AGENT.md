# WRS Refinishing Prioritization Agent (Deliverable #4)

**Pattern:** Plan-Execute-Summarize. Runs weekly. Outputs a prioritized work order telling WRS which "Not Ready" units to refinish first.

**Scoring formula:**

```
priority_score = search_demand_index × unit_price × availability_multiplier × trend_modifier
```

- `search_demand_index` — Google Trends score (0–100) for the SKU's finish + size combo in the US over the last 30 days
- `unit_price` — target sell price
- `availability_multiplier` — inversely proportional to current ready-to-sell stock in that SKU (if we have 10 in stock, discount; if 0 in stock, multiply by 1.5)
- `trend_modifier` — bonus for finishes matching current trend alerts (e.g., +20% for machined gunmetal in Q2 2026 per Notebook research)

Top 10 by score become the week's work order.

---

## Inputs

1. `inventory.csv` — WRS's full inventory with `sku, finish, size, price, ready (yes|no), stock_ready, stock_not_ready`
2. `trends.json` — scraped Google Trends scores per (finish, size) pair, refreshed weekly
3. `trend_alerts.json` — manually maintained list of current-season bonuses (`[{"finish":"machined gunmetal","bonus":0.20,"through":"2026-09-30"}]`)

## Output

`work_order_YYYY-MM-DD.md` — a human-readable prioritized list:

```
# WRS Refinishing Work Order — Week of 2026-04-27

## Top 10 to refinish this week

| Rank | SKU          | Finish             | Size | Target Price | In "Not Ready" | Score | Why                                                  |
|------|--------------|--------------------|------|--------------|----------------|-------|------------------------------------------------------|
| 1    | 10251-MGM    | Machined Gunmetal  | 20"  | $325         | 3              | 10,725 | Trend bonus +20%. Zero in stock ready. 98 demand idx |
| 2    | 4577-PPP     | PVD Chrome         | 19"  | $285         | 2              | 9,025  | Rare finish. 95 demand idx. 1 in stock only          |
| ...  |              |                    |      |              |                |       |                                                      |

## Also worth noting
- SKU 71488-GB has been in "Not Ready" for 120+ days. Either refinish or liquidate — capital sitting idle.
- Matte Black Machined is under-indexed this month; hold on MBM refinishing until May.
```

---

## Python skeleton (runnable)

See `score_refinishing.py`.
