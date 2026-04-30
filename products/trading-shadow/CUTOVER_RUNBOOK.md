# Trading Shadow — Cutover Runbook

**Purpose:** the actual sequence of commands and decision points for paper-validation → live cutover.

**Cutover is graduation-gated, not calendar-gated.** (Decision 2026-04-30 evening, Thomas.) The shadow Ollama agent must hit the graduation criteria below before Track A goes live. Paper runs as long as it takes — could be a week, could be a month. We do not move calendar-first.

**Graduation criteria** (from `Config` in `src/trading_shadow/config.py`):
- `GRADUATION_ACCURACY = 0.90` — shadow's action matches Claude's on 90%+ of paired decisions
- `GRADUATION_MIN_TRADES = 50` — at least 50 (claude, shadow) decision pairs in the log
- `GRADUATION_MIN_PROFIT_USD = 1.0` — Claude is making $1+ realized P&L per day on paper (means the strategy works, not just that the shadow learned to copy a money-loser)

All three must hold before live cutover. Hitting accuracy without profit means the shadow learned to copy bad decisions — that's exactly the failure mode the gate prevents. Hitting profit without accuracy means we don't yet have a shadow that can take over.

**Earlier plan history (now obsolete):** Friday 2026-05-01 was the original calendar target. Slipped to Tuesday 2026-05-05 mid-day Thursday after discovering paper had never run end-to-end. Tuesday was scrapped Thursday evening in favor of graduation-gating. The infrastructure built for Tuesday (live env validation, halt_all rollback wiring, RollbackHandler) all stays — it's just dormant until graduation.

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

### Step 1.4 — Friday end-of-day signal check (NOT a cutover gate)

This is just confirmation that paper trading actually works. It is NOT a "go live" gate — see Phase 4 for that.

| Signal | Status |
|---|---|
| Paper decisions in `decisions.jsonl` | ✅ confirms loop runs |
| At least one BUY OR SELL today | ✅ confirms trader isn't stuck holding |
| Zero unhandled exceptions in the log | ✅ confirms config + auth |
| Discord received at least one trade message | ✅ confirms reporter |
| Alpaca paper account balance moved | ✅ confirms order submission works |

**If all 5 pass:** paper is healthy; start the graduation soak (Phase 2).
**If any fail:** diagnose this weekend; do not advance until paper is healthy.

---

## Phase 2 — Graduation soak (open-ended)

Run paper continuously through every market session. Each weekday:

1. **Morning (9:30 AM ET):** confirm `start_paper.bat` is running OR start it.
2. **Each evening (after 4:00 PM ET):** review the daily output:
   - Decisions count by (track, agent, action)
   - Sensibility spot-check: pick 3 random BUYs and 3 HOLDs; do the reasonings hold up?
   - If reasoning quality is poor → consider swapping to `prompts_v2.py`
3. **Once per week:** compute graduation metrics:
   ```
   .\.venv\Scripts\python.exe -c "
   import json
   from pathlib import Path
   from trading_shadow.decision_log import Decision
   from trading_shadow.accuracy_tracker import compute_accuracy
   rows = [Decision(**json.loads(l)) for l in Path('data/decisions.jsonl').read_text().splitlines() if l]
   result = compute_accuracy(rows, asset_class='equities')
   print(f'Pairs: {result.total_pairs}')
   print(f'Matches: {result.matches}')
   print(f'Accuracy: {result.accuracy:.2%}')
   "
   ```

The graduation gate is met when, on a given week-ending review:
- `accuracy >= 0.90`
- `total_pairs >= 50`
- Realized weekly P&L from Claude's filled paper trades >= `$1 / week` (i.e., the $1/day proxied across the week)

**Do not advance to Phase 3 until all three are met.**

If the shadow plateaus below 90% accuracy: don't lower the bar. Either iterate on `prompts_v2.py` (so Claude's decisions become more learnable), tune the strategy (so signals are clearer), or change the shadow model (e.g. swap `llama3.1:8b` for a stronger local). Then keep soaking.

---

## Phase 3 — Pre-cutover prep (only after Phase 2 graduation)

These are the manual one-time things that have to happen before the very first live trade — but only when graduation criteria are confirmed met:

1. **Verify graduation metrics one more time** (run the snippet above; capture the output to a Discord post).
2. **Fund the live Alpaca account.** ACH-transfer $20 (or whatever Track A capital you've decided on). ACH takes 1-3 business days, so kick this off the moment graduation is met — not the morning of cutover. Confirm `cash > $0` via:
   ```
   .\.venv\Scripts\python.exe scripts\verify_live_env.py --live-only
   ```
3. **Lock the prompt.** Whatever prompt is in `claude_trader.py` at the moment of graduation is the prompt that goes live. Don't change it after the fact — the graduation accuracy was measured against that exact prompt.
4. **Pre-flight on the morning of cutover:**
   ```
   .\.venv\Scripts\python.exe scripts\verify_live_env.py
   ```
   ALL green required.

---

## Phase 4 — Live cutover (graduation-gated date — set when criteria are met)

### Step 4.1 — Start Track A live (market hours)

```
$env:MODE='live'
.\.venv\Scripts\python.exe scripts\run_track_a.py --live
```

Or for the looped version, make a `loop_live_a.py` companion to `loop_paper.py`.

Watch Discord. The first message should be either a `Track A LIVE: HOLD <ticker>` or a `Track A LIVE: BUY <ticker> $X.XX (order <id>)`.

### Step 4.2 — Hard-floor watch

`AUTO_ROLLBACK_ON_HARD_FLOOR=False` by default. If equity drops below $100, you'll get a Discord ALERT and the loop halts. To recover:

1. Decide which decision_id to roll back to (read `data/decisions.jsonl`)
2. Run:
   ```
   .\.venv\Scripts\python.exe scripts\halt_all.py --rollback-to=<decision_id> --track=A --agent=claude
   ```
3. Confirm slippage in the Discord summary
4. Investigate the trade that caused the breach BEFORE re-starting the loop

### Step 4.3 — Track B live (separate decision)

Track B follows Track A's graduation independently. Start Track B live when Track A has been live and stable for at least one full trading week AND Track B has hit its own graduation gate on paper.

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
