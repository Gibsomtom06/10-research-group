# Phase 0: Trading Shadow A/B Test — Spec

**Date:** 2026-04-27
**Status:** Spec, ready to build
**Live deadline (Track A):** Friday 2026-05-01
**Live deadline (Track B):** Tuesday 2026-05-05
**Parent doc:** `2026-04-27-factory-architecture-design.md`

---

## Goal

Prove the shadow team learning model on a real-world, real-money task with bounded loss exposure. The Trader is the first production-grade test of the Claude → Ollama shadow graduation pipeline.

**Two outcomes wanted:**
1. **Build the Trader Sub** of the Finance department — a working trading agent with shadow learning
2. **Empirically test graduation timeline** via A/B comparison — does aggressive (5-day) graduation work, or does conservative (10-day) win?

---

## A/B Test Setup

| Track | Agent | Shadow | Live date | Live capital | Notes |
|-------|-------|--------|-----------|--------------|-------|
| **A** | Claude Trader 1 | Ollama Shadow 1 | **Fri 2026-05-01** | $20 | Aggressive — 5 days paper, then live |
| **B** | Claude Trader 2 | Ollama Shadow 2 | **Tue 2026-05-05** | $20 | Conservative — 10 days paper (extra weekend soak), then live |

**4 agents total:** 2 Claude + 2 Ollama shadows.
**Total live exposure:** $40 ($20 each track).
**Worst case loss if both halt same day:** $2.

Both shadows learn from BOTH agents' outputs. After 2 weeks, empirical comparison reveals which graduation timeline produces better paper P&L and better shadow accuracy.

---

## Build Plan — This Week

| Day | What |
|-----|------|
| **Mon 4/27** (today) | Spec written ✅. Set up Alpaca paper account. Configure Ollama local model. Define starter strategy. |
| **Mon-Tue 4/27-28** | Backtest sprint — Claude Trader 1 + 2 run on 5+ years historical data (equities, ETFs, crypto, options, forex). Generate thousands of synthetic trades. Shadows ingest as training corpus. |
| **Tue-Thu 4/28-30** | Both Claude Traders run paper trading on LIVE current market data. Shadows run parallel predictions, compared to Claude actuals. Decision-match accuracy tracked daily. |
| **Thu 4/30 EOD** | Track A go/no-go review — must have ≥ $101 paper P&L AND shadow accuracy ≥ 90% on equities to graduate Friday |
| **Fri 5/1** | **Track A goes LIVE** ($20, equities only) at market open. Discord reports every 4 hours during market hours. |
| **Sat-Mon** | Track B continues paper. Track A monitored via Discord. Kill switch armed. |
| **Mon 5/4 EOD** | Track B go/no-go review — must hit same gates as Track A did |
| **Tue 5/5** | **Track B goes LIVE** ($20, equities only). |

---

## Markets & Strategy

**Asset coverage (Option E from brainstorm):**
- Equities (US listed, liquid tickers SPY/QQQ + a curated list of 20-30 names)
- ETFs (sector + thematic)
- Crypto (BTC, ETH, SOL — major liquidity)
- Options (single-leg long calls/puts on equities — no spreads in v1)
- Forex (major pairs only — EUR/USD, GBP/USD, USD/JPY)

**Live trading week 1: EQUITIES ONLY.** Other asset classes continue paper trading. Each graduates to live independently after meeting per-asset graduation criteria.

**Starter strategy:** trend-following with mean-reversion overlay. Specific signals to be defined Monday during setup. Strategy is owned by Claude Trader; Shadow learns to recognize signal patterns.

---

## Hard Guardrails

| Guardrail | Rule | Action on breach |
|-----------|------|------------------|
| **Hard floor** | Account balance < $100 (starting capital) | Auto-halt, escalate to Thomas via Discord |
| **Per-trade max** | $5 single-trade size | Trade rejected before submission |
| **Position cap** | Single position > 10% account | Requires Thomas approval |
| **Daily P&L floor** | EOD cumulative < $101 (= < $1 net profit) | Execution privileges revoked, training continues |
| **Asset class restriction** | Live trading limited to equities week 1 | Other assets blocked from live execution |
| **Outside hours** | Open/close any position outside trading hours | Requires Thomas approval |
| **Strategy changes** | New tickers, new instruments, new logic | Requires Thomas approval |
| **Live capital cap** | Total live capital across both tracks > $40 | Blocks new allocations |

---

## Graduation Criteria

**Per-asset graduation rule:**
- ≥ 50 trades in that asset class
- ≥ 90% shadow decision-match accuracy vs Claude Trader's actuals
- Cumulative paper P&L on that asset class ≥ $1
- 30-day minimum paper trading window (or accelerated if all gates hit early)

When ALL gates hit for an asset class → that asset class graduates to live execution by shadow under guardrails. Other asset classes continue paper.

**Track A vs Track B comparison metrics (post-Friday + post-Tuesday):**
- Win rate per agent
- Average P&L per trade
- Decision-match accuracy (Claude vs Shadow)
- Regime adaptation — did Track A learn from Friday surprises that Track B benefited from?
- Total paper P&L delta

---

## Architecture

```
┌─ Claude Trader (Anthropic API) ──────────────────────┐
│  Receives: market data, strategy params, account     │
│           state                                       │
│  Produces: trade decisions (buy/sell/hold), reasoning│
│  Logs: every decision + reasoning to local store     │
└──────────────────────────────────────────────────────┘
            │
            ↓ (every decision logged)
┌─ Decision Logger ────────────────────────────────────┐
│  Stores: timestamp, ticker, action, size, reasoning,│
│          actual P&L outcome                          │
│  Format: JSONL append-only                           │
│  Location: local (privacy)                           │
└──────────────────────────────────────────────────────┘
            │
            ↓ (training corpus)
┌─ Ollama Shadow ──────────────────────────────────────┐
│  Reads: same market data + account state             │
│  Produces: predicted decision + confidence           │
│  Compared to: Claude's actual decision               │
│  Tracks: decision-match accuracy over time           │
└──────────────────────────────────────────────────────┘
            │
            ↓ (when accuracy threshold met)
┌─ Graduation Gate ────────────────────────────────────┐
│  Per-asset accuracy ≥ 90% AND ≥ 50 trades AND ≥ $1  │
│  paper P&L → shadow takes over execution within     │
│  guardrails on that asset class                      │
└──────────────────────────────────────────────────────┘
            │
            ↓
┌─ Broker (Alpaca paper / live) ───────────────────────┐
│  API: trade submission, position queries, P&L        │
│  Paper account for training; live account for        │
│  graduated execution                                  │
└──────────────────────────────────────────────────────┘
            │
            ↓
┌─ Discord Reporter ───────────────────────────────────┐
│  Every 4 hours during market open: P&L, positions,  │
│  decisions made, shadow accuracy                     │
│  On halt: immediate escalation                       │
└──────────────────────────────────────────────────────┘
```

---

## Components to Build (Mon-Tue setup)

| # | Component | Effort | Notes |
|---|-----------|--------|-------|
| 1 | Alpaca paper account + API keys | 30 min | Free, no funding required |
| 2 | Alpaca live account + $40 funding | 1 hr | KYC + bank link required |
| 3 | Local Ollama setup + model selection | 2 hrs | Llama 3.1 / Qwen 2.5 candidates |
| 4 | Decision logger (JSONL append) | 1 hr | Local file, simple schema |
| 5 | Backtest engine (5yr historical) | 4 hrs | Use yfinance or Alpaca historical API |
| 6 | Claude Trader agent (Anthropic SDK) | 4 hrs | System prompt + decision loop |
| 7 | Shadow training pipeline (corpus → model) | 4 hrs | Embedding store + similarity check |
| 8 | Graduation evaluator | 2 hrs | Accuracy tracker, threshold check |
| 9 | Discord webhook reporting | 1 hr | One-way already works |
| 10 | Kill switch (Discord command listener) | 3 hrs | Two-way Discord NOT yet built — fallback: manual halt via API |
| 11 | Guardrail enforcement layer | 2 hrs | Pre-trade checks |

**Total estimated effort:** ~25 hours for both Claude+Shadow tracks. Achievable Mon-Tue if focused.

---

## Success Criteria

**Minimum viable success (MVS) by Friday 2026-05-01:**
- Track A live with $20 in equities. ✅
- At least one trade executed live. ✅
- Discord reports flowing. ✅
- Account balance ≥ $19 at EOD Friday (= max $1 loss). ✅

**Strong success by Tuesday 2026-05-05:**
- Both tracks live with $20 each.
- Shadow decision-match accuracy ≥ 70% on equities (graduation threshold = 90%, so 70% is "promising")
- Paper P&L positive on at least one track.

**A/B test verdict (by 2026-06-01):**
- Either Track A or Track B shows ≥ $5 cumulative paper P&L on equities AND ≥ 90% shadow accuracy.
- Comparison reveals which graduation timeline (5-day vs 10-day) produces better outcomes.
- Winning approach becomes default for graduating future asset classes (ETFs → crypto → options → forex).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Markets behave unusually Friday (Fed, CPI, jobs surprise) | Medium | Medium | Track B fallback gives second data point. $20 cap bounds loss. |
| 5-day backtest training insufficient for Track A | High | Low | Track B's extra soak directly tests this. If A fails and B works, we learn. |
| $100 starting capital too small for diverse signal | Medium | Medium | Acknowledged: this is data-generation sprint, not make-money sprint. Real profit when capital scales after shadow proves out. |
| Two-way Discord kill switch not ready | High | Medium | Fallback: manual halt via Alpaca API. Build kill switch as priority post-launch. |
| Ollama shadow can't learn fast enough | Medium | High | If shadow accuracy < 50% by Thursday, rethink model selection. Llama 3.1 → Qwen 2.5 → fine-tuning if needed. |
| Live trading regulations / tax implications | Low | Medium | $40 stakes too small to trigger most issues. Track all P&L for tax reporting at year-end. |

---

## Beyond Phase 0

If the Trader proves the shadow learning model works:

**Phase 1 application:** apply same pattern to Marketing dept's Trend & Culture Analyst (also high-volume, pattern-rich, model-friendly task). Then Brand Voice Steward (classification problem, perfect for shadow).

**Capital scaling:** if Track A or B shows reliable positive P&L over 60 days, scale capital from $20 → $200 → $2000 with same guardrails proportionally scaled.

**Additional asset classes graduate:** ETFs → crypto → options → forex sequentially as each proves out paper.

---

## Pending Decisions

| Question | Owner | Deadline |
|----------|-------|----------|
| Specific trend-following signal logic for starter strategy | Thomas + Claude | Mon 4/27 EOD |
| Curated equities watchlist (20-30 names) | Thomas | Mon 4/27 EOD |
| Ollama model selection (Llama 3.1 8B vs Qwen 2.5 7B vs other) | System Brain agent | Mon 4/27 |
| Final Alpaca account funding ($40 total) | Thomas | Tue 4/28 |

---

## Daily Reporting Format (Discord)

```
📊 TRADER UPDATE — [TIMESTAMP]

Track A | Claude+Shadow 1
  Status: PAPER | LIVE | HALTED
  Account: $XX.XX (vs $20.00 start)
  Today's trades: N
  Win rate: XX% | Avg trade: $X.XX
  Shadow accuracy: XX% (target 90%)

Track B | Claude+Shadow 2
  [same fields]

Asset class status:
  Equities: LIVE / PAPER ($X.XX P&L)
  ETFs: PAPER ($X.XX P&L)
  Crypto: PAPER ($X.XX P&L)
  Options: PAPER ($X.XX P&L)
  Forex: PAPER ($X.XX P&L)

Notable: [significant trade, regime shift, alert]
Next check: [TIMESTAMP]
```

---

*Spec v1.0 — 2026-04-27. Companion to factory-architecture-design.md. Ready for review.*
