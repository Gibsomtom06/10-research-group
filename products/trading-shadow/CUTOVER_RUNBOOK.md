# Trading Shadow — Cutover Runbook

**Purpose:** the actual sequence of commands to run, with the actual decision points, for the paper-validation → Tuesday live cutover.

**Original cutover date:** Friday 2026-05-01 → **Slipped to Tuesday 2026-05-05** because paper had never run end-to-end and the env files had foundation bugs (placeholder Anthropic key in paper, Alpaca key pasted into Anthropic slot in live). See `BUILD_EVOLUTION.md` 2026-04-30 entries for the full why.

---

## Phase 0 — Tonight (Thursday 2026-04-30, before bed)

### Step 0.1 — Fix the env files

Both `.env.paper` and `.env.live` need the same real Anthropic API key.

```
ANTHROPIC_API_KEY=sk-ant-api03-<the real 108-char value>
```

Copy from a known-good source: `C:\Users\slash\Projects\tenx10\.env.local` already has a working key in the `ANTHROPIC_API_KEY=` line. Same value goes in both `.env.paper` and `.env.live`.

In `.env.live` ALSO: leave `ALPACA_LIVE_API_KEY=AK...` line alone — it was already correct. The mistake was that the SAME `AK...` value got pasted into the `ANTHROPIC_API_KEY=` line by accident.

### Step 0.2 — Verify

From the project root (`C:\Users\slash\OneDrive\10 Research Group\products\trading-shadow`):

```
.\.venv\Scripts\python.exe scripts\verify_live_env.py
```

You should see all green:
```
[OK] .env.paper file
[OK] MODE=paper
[OK] ANTHROPIC_API_KEY format
[OK] ALPACA_PAPER_API_KEY format
[OK] ALPACA_PAPER_API_SECRET format
[OK] DISCORD_WEBHOOK_URL format
[OK] Anthropic API auth: models.list() returned 200
[OK] Alpaca paper auth: account.status=ACTIVE, cash=$100000.00
... (same for live)
All checks passed.
```

If any FAIL, fix the named item before continuing. Don't skip.

### Step 0.3 — Decide on prompts v2 (optional, 5 minutes)

Read `src/trading_shadow/prompts_v2.py`. It's a proposed rewrite of the trader prompt that fixes the default-to-hold bias the v1 prompt has. If you approve:

```
# Edit src/trading_shadow/claude_trader.py
# Change:
from trading_shadow.prompts import CLAUDE_TRADER_SYSTEM
# To:
from trading_shadow.prompts_v2 import CLAUDE_TRADER_SYSTEM
```

Same swap in `src/trading_shadow/shadow.py` for `SHADOW_SYSTEM`. Then run the test suite:

```
.\.venv\Scripts\python.exe -m pytest -q
```

53 tests should still pass. If any fail, revert the swap.

If you'd rather NOT change the prompt mid-cutover (a defensible call — minimize variables), leave v1 in place. Just expect more HOLDs than BUYs.

---

## Phase 1 — Friday 2026-05-01, market hours (9:30 AM – 4:00 PM ET)

This is the paper smoke-test day. The goal is to confirm:
- The loop actually fires
- Decisions land in `data/decisions.jsonl`
- Discord receives trade-attempted messages
- No crashes, no auth errors, no timeouts

### Step 1.1 — Start the paper loop

Either:

**A. Double-click** `scripts/start_paper.bat` (easiest)

**B. From a terminal** at the project root:
```
$env:MODE='paper'
.\.venv\Scripts\python.exe scripts\loop_paper.py
```

Either way, you should see:
- Console output every 30 minutes during market hours
- `logs/paper_<timestamp>.log` filling up
- Discord messages like `Track A PAPER: HOLD SPY $0.00 (no thesis)` or `Track A PAPER: BUY NVDA $2.50 (...)`

### Step 1.2 — Confirm decisions are landing

Open another terminal:
```
Get-Content -Path "data\decisions.jsonl" -Wait -Tail 20
```

You should see new JSONL lines appearing. Each with `track`, `agent` (claude or shadow), `action`, `size_usd`, `decision_id`, `prior_state_id`.

If `data/decisions.jsonl` does NOT appear after 30 minutes during market hours, the loop is broken. Stop and diagnose.

### Step 1.3 — End-of-day review (after 4:00 PM ET)

In a terminal:
```
.\.venv\Scripts\python.exe -c "
from pathlib import Path
import json
from collections import Counter
rows = [json.loads(l) for l in Path('data/decisions.jsonl').read_text().splitlines() if l]
print(f'Total decisions today: {len(rows)}')
print('By (track, agent, action):')
for k, v in Counter((r['track'], r['agent'], r['action']) for r in rows).items():
    print(f'  {k}: {v}')
print(f'Tickers seen: {sorted(set(r[\"ticker\"] for r in rows))}')
"
```

Expected: at least 60-100 decisions (5 tickers × 2 tracks × 2 agents × ~3 passes/hour × 6.5 hours), maybe more or fewer depending on loop interval. Most will be HOLDs (that's expected with v1 prompt; v2 should have a healthier mix).

### Step 1.4 — Friday GO/NO-GO checkpoint for Tuesday cutover

| Signal | Status |
|---|---|
| Paper decisions in `decisions.jsonl` | ✅ confirms loop runs |
| At least one BUY OR SELL today | ✅ confirms trader isn't stuck holding |
| Zero unhandled exceptions in the log | ✅ confirms config + auth |
| Discord received at least one trade message | ✅ confirms reporter |
| Alpaca paper account balance moved | ✅ confirms order submission works |

**If all 5 pass → GO for Tuesday.**
**If any fail → diagnose this weekend, slip cutover by another week if needed.**

---

## Phase 2 — Weekend (Sat-Sun)

- Eyeball `decisions.jsonl` for sensibility. Pick 5 random BUY decisions; do the reasonings make sense given the price + RSI?
- Pick 5 HOLDs; do they have specific invalidation criteria, or are they vague?
- If the reasoning quality is poor → swap to `prompts_v2.py` (if not already done)
- Compare Claude vs Shadow agreement rate. Goal: >50% by Tuesday for a meaningful A/B baseline.
- Optionally: complete Alpaca live KYC if not already done. Fund the live account ($20 to Track A's account).

---

## Phase 3 — Monday 2026-05-04

- Final paper run during market hours
- Confirm no regressions from any weekend changes
- Run `verify_live_env.py` one more time (full live + paper)
- Confirm live Alpaca account funded ($20 cleared)

---

## Phase 4 — Tuesday 2026-05-05, market open (cutover)

### Step 4.1 — Pre-flight (9:00 AM ET)

```
.\.venv\Scripts\python.exe scripts\verify_live_env.py
```
ALL green required. Stop if anything is yellow or red.

### Step 4.2 — Start Track A live (9:30 AM ET)

```
$env:MODE='live'
.\.venv\Scripts\python.exe scripts\run_track_a.py --live
```

Or for the looped version, edit `loop_paper.py` to call `run_one_pass(track="A", live=True)` and run that. (Better: make a `loop_live_a.py` companion.)

Watch Discord. The first message should be either a `Track A LIVE: HOLD <ticker>` or a `Track A LIVE: BUY <ticker> $X.XX (order <id>)`.

### Step 4.3 — Hard-floor watch

The runner has the hard-floor breach hook gated OFF by default (`AUTO_ROLLBACK_ON_HARD_FLOOR=False`). If equity drops below $100, you'll get a Discord ALERT and the loop halts. To recover:

1. Decide which decision_id to roll back to (read `data/decisions.jsonl`)
2. Run:
   ```
   .\.venv\Scripts\python.exe scripts\halt_all.py --rollback-to=<decision_id> --track=A --agent=claude
   ```
3. Confirm slippage in the Discord summary
4. Investigate the trade that caused the breach BEFORE re-starting the loop

### Step 4.4 — Track B live (Tuesday or later)

Originally Tuesday by the implementation plan. If Track A behaves cleanly through Tuesday afternoon, start Track B. If anything weird happens on Track A, hold Track B until Wednesday.

---

## Emergency procedures

### "Everything's on fire — halt now"

```
.\.venv\Scripts\python.exe scripts\halt_all.py --live
```

This raises the halt flag. The loop checks it on every pass and exits cleanly. Positions remain open — you'll have to decide whether to close them manually (via Alpaca dashboard) or via a rollback.

### "Halt + rollback to a known-good state"

```
.\.venv\Scripts\python.exe scripts\halt_all.py --rollback-to=<decision_id> --track=<A|B> --agent=claude
```

The RollbackHandler walks the (track, agent) chain MRU→LRU from the named state, closes positions at market, cancels unfilled orders, restores strategy params. Single Discord summary post when done.

### "I broke something with v2 prompts"

```
# Revert claude_trader.py and shadow.py imports back to:
from trading_shadow.prompts import CLAUDE_TRADER_SYSTEM
```

Then restart the loop. v1 prompts are still in place at `src/trading_shadow/prompts.py`.

---

*Runbook v1 — 2026-04-30. Update after Tuesday cutover with lessons learned.*
