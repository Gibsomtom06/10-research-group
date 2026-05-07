"""Main loop: fetch market state → strategy signal → claude+shadow decisions → guardrails → submit (or skip)."""
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Literal

from anthropic import Anthropic

from trading_shadow.config import Config
from trading_shadow.alpaca_client import AlpacaWrapper
from trading_shadow.market_data import get_historical_bars
from trading_shadow.strategy import compute_signal
from trading_shadow.backtest import _rsi
from trading_shadow.claude_trader import decide as claude_decide
from trading_shadow.shadow import shadow_predict
from trading_shadow.social_media_trader import social_media_trader_predict
from trading_shadow.guardrails import check_trade
from trading_shadow.decision_log import Decision, DecisionLog
from trading_shadow.discord_reporter import DiscordReporter
from trading_shadow.rollback import RollbackHandler
from trading_shadow.exit_checker import check_exits

TICKERS = [
    # Original cohort: large-cap tech + broad ETFs (high liquidity, tight spreads)
    "SPY", "QQQ", "AAPL", "MSFT", "NVDA",
    # Copper / AI-infra "picks-and-shovels" thesis (NotebookLM: "The Next
    # Shortage Is Here" — sulfuric acid scarcity → copper supply crunch →
    # AI buildout demands copper). Treated as sleep-well-at-night
    # accumulation plays per the v2 system prompt.
    "FCX", "SCCO", "TECK", "COPX",
]
# CRYPTO TODO (Apr 30 2026): "I Gave Claude Full Access to TradingView"
# notebook recommends 4hr EMA crossover on BTCUSDT (3% SL / 4% TP).
# Adding requires (a) yfinance↔Alpaca symbol mapping (BTC-USD vs BTC/USD)
# and (b) loosening the "equities only" hard constraint in prompts_v2.py
# for paper mode. Punt until after Friday May 1 cutover.
LOG_PATH = Path("data/decisions.jsonl")


def run_one_pass(track: Literal["A", "B"], live: bool) -> None:
    cfg = Config.from_env()
    log = DecisionLog(LOG_PATH, mode="live" if live else "paper")
    discord = DiscordReporter(cfg.discord_webhook)
    anthropic = Anthropic(api_key=cfg.anthropic_key)

    if live:
        if not (cfg.alpaca_live_key and cfg.alpaca_live_secret):
            raise RuntimeError("Live mode requested but Alpaca live keys missing")
        broker = AlpacaWrapper.live(cfg.alpaca_live_key, cfg.alpaca_live_secret)
    else:
        broker = AlpacaWrapper.paper(cfg.alpaca_paper_key, cfg.alpaca_paper_secret)

    # Instantiate the per-track rollback handler so it's ready if Thomas
    # invokes scripts/halt_all.py --rollback-to=... or if hard-floor
    # auto-rollback is enabled (Config.AUTO_ROLLBACK_ON_HARD_FLOOR — gated
    # off by default for the Friday cutover).
    rollback_handler = RollbackHandler(
        decision_log=log,
        alpaca=broker,
        discord=discord,
        track=track,
        agent="claude",
        budget_per_day=Config.ROLLBACK_BUDGET_PER_DAY,
    )

    state = broker.account_state()

    # ── Mechanical exits (runs before any LLM call) ──────────────────────────
    # Check every open position for 4% TP / 3% SL (or watchlist-level prices).
    # Exits are submitted immediately without asking the LLM — this prevents
    # the "agent forgot its own stop" failure mode identified in the analysis.
    session_losses = 0
    exit_signals = check_exits(broker, agent="claude")
    for sig in exit_signals:
        ts = datetime.now(timezone.utc).isoformat()
        reason_tag = f"[{sig.reason}] {sig.pnl_pct:+.2%} — entry ${sig.entry_price:.2f} → now ${sig.current_price:.2f}"
        exit_dec = log.append(Decision(
            timestamp=ts, track=track, agent="claude",
            ticker=sig.ticker, action="sell",
            size_usd=sig.market_value,
            reasoning=reason_tag,
            market_state={"price": sig.current_price, "rsi": 0.0, "asset_class": "equities", "confidence": 1.0},
        ))
        try:
            broker.close_position(sig.ticker)
            discord.send(
                f"Track {track} {'LIVE' if live else 'PAPER'} EXIT: "
                f"{sig.reason.upper()} {sig.ticker} {sig.pnl_pct:+.2%} "
                f"(entry ${sig.entry_price:.2f} → ${sig.current_price:.2f})"
            )
        except Exception as e:
            discord.send(f"Track {track}: {sig.ticker} exit FAILED: {e}")
        if sig.reason == "stop_loss" or sig.reason == "watchlist_sl":
            session_losses += 1

    if session_losses >= Config.MAX_CONSECUTIVE_LOSSES:
        discord.send(
            f"Track {track}: {session_losses} stop-losses this pass — "
            f"skipping new buys for rest of session (MAX_CONSECUTIVE_LOSSES={Config.MAX_CONSECUTIVE_LOSSES})"
        )
    # ─────────────────────────────────────────────────────────────────────────

    if (
        Config.AUTO_ROLLBACK_ON_HARD_FLOOR
        and live
        and state.equity < Config.hard_floor_usd()
    ):
        # Auto-rollback path is wired but gated. Find the most recent
        # safe state (any decision predating today's trades) and revert.
        # For the Friday cutover this branch should NOT fire — leaving
        # the hook in place so it can be flipped on later without code
        # changes.
        rows = log.read_all()
        safe = next(
            (
                d for d in reversed(rows)
                if d.track == track and d.agent == "claude" and d.action == "hold"
            ),
            None,
        )
        if safe is not None:
            try:
                rollback_handler.rollback_to(
                    safe.decision_id,
                    reason=f"auto-rollback: equity ${state.equity:.2f} below hard floor",
                    halt_after=False,
                )
            except Exception as e:
                discord.send(
                    f":warning: auto-rollback failed on track {track}: {e}"
                )
        return

    for ticker in TICKERS:
        end = datetime.now(timezone.utc).date().isoformat()
        start = (datetime.now(timezone.utc).date() - timedelta(days=45)).isoformat()
        df = get_historical_bars(ticker, start, end)
        if df.empty or len(df) < 21:
            continue

        rsi = _rsi(df["Close"])
        sig = compute_signal(df, current_rsi=rsi)
        ts = datetime.now(timezone.utc).isoformat()

        c_dec = None
        try:
            c_dec = claude_decide(
                client=anthropic,
                signal_summary=f"{sig.signal.value.upper()}: {sig.rationale}",
                sma20=sig.sma20, current_price=sig.current_price, rsi=rsi,
                account=state, track=track, live=live, ticker=ticker, agent="claude",
            )
            log.append(Decision(timestamp=ts, track=track, agent="claude", ticker=ticker, action=c_dec.action, size_usd=c_dec.size_usd, reasoning=c_dec.reasoning, market_state={"price": sig.current_price, "rsi": rsi, "asset_class": "equities", "confidence": c_dec.confidence}))
        except Exception as e:
            # Paper-mode fail-soft: if Claude errors (e.g. credits exhausted),
            # log a hold for visibility and let the shadow still run.
            # In live mode we re-raise — no silent fallthrough on real money.
            if live:
                raise
            log.append(Decision(timestamp=ts, track=track, agent="claude", ticker=ticker, action="hold", size_usd=0.0, reasoning=f"claude_error: {type(e).__name__}: {str(e)[:200]}", market_state={"price": sig.current_price, "rsi": rsi, "asset_class": "equities", "confidence": 0.0}))

        s_dec = None
        try:
            s_dec = shadow_predict(
                model=cfg.ollama_model,
                signal_summary=f"{sig.signal.value.upper()}: {sig.rationale}",
                sma20=sig.sma20, current_price=sig.current_price, rsi=rsi,
                account=state, track=track, live=live, ticker=ticker,
            )
            log.append(Decision(timestamp=ts, track=track, agent="shadow", ticker=ticker, action=s_dec.action, size_usd=s_dec.size_usd, reasoning=s_dec.reasoning, market_state={"price": sig.current_price, "rsi": rsi, "asset_class": "equities", "confidence": s_dec.confidence}))
        except Exception as e:
            # Shadow never submits orders (only Claude does), so an Ollama
            # outage must not abort the pass and starve social_media_trader
            # + sync_pnl downstream. Fail-soft in both modes; log a hold so
            # the leaderboard still shows shadow's column.
            log.append(Decision(timestamp=ts, track=track, agent="shadow", ticker=ticker, action="hold", size_usd=0.0, reasoning=f"shadow_error: {type(e).__name__}: {str(e)[:200]}", market_state={"price": sig.current_price, "rsi": rsi, "asset_class": "equities", "confidence": 0.0}))

        # Third agent: social_media_trader follows aggregated social
        # sentiment from data/social/sentiment.jsonl (currently Reddit only;
        # YouTube + TikTok + Discord scrapers queued). Pure rules-based,
        # no LLM call, zero API cost. Logs alongside claude + shadow so
        # the leaderboard shows three traders.
        sc_dec = social_media_trader_predict(
            ticker=ticker, current_price=sig.current_price, rsi=rsi,
            account=state, track=track, live=live,
        )
        log.append(Decision(timestamp=ts, track=track, agent="social_media_trader", ticker=ticker, action=sc_dec.action, size_usd=sc_dec.size_usd, reasoning=sc_dec.reasoning, market_state={"price": sig.current_price, "rsi": rsi, "asset_class": "equities", "confidence": sc_dec.confidence}))

        # Persist any watchlist updates the agents emitted (best-effort).
        try:
            from trading_shadow.watchlist import WatchEvent, append as wl_append
            for agent_name, dec in (("claude", c_dec), ("shadow", s_dec)):
                if dec is None:
                    continue
                for upd in (getattr(dec, "watchlist_updates", []) or []):
                    if not isinstance(upd, dict):
                        continue
                    wl_append(agent_name, WatchEvent(
                        timestamp=ts,
                        agent=agent_name,
                        ticker=str(upd.get("ticker") or ticker),
                        kind=str(upd.get("kind") or "note"),
                        thesis=str(upd.get("thesis") or ""),
                        condition=upd.get("condition") or {},
                        stop_loss=upd.get("stop_loss"),
                        take_profit=upd.get("take_profit"),
                        notes=str(upd.get("notes") or ""),
                    ))
        except Exception:
            # Watchlist persistence is enrichment, never blocking
            pass

        if c_dec is not None and c_dec.action in ("buy", "sell") and c_dec.size_usd > 0:
            # Skip new buys if session loss limit is reached
            if c_dec.action == "buy" and session_losses >= Config.MAX_CONSECUTIVE_LOSSES:
                continue
            check = check_trade(
                ticker=ticker, notional_usd=c_dec.size_usd, side=c_dec.action,
                account=state, asset_class="equities", live=live,
            )
            if check.allowed:
                try:
                    order_id = broker.submit_market_order(ticker=ticker, notional_usd=c_dec.size_usd, side=c_dec.action)
                    discord.send(f"Track {track} {'LIVE' if live else 'PAPER'}: {c_dec.action.upper()} {ticker} ${c_dec.size_usd:.2f} (order {order_id})")
                except Exception as e:
                    discord.send(f"Track {track}: {ticker} order failed: {e}")
            else:
                discord.send(f"Track {track}: {ticker} {c_dec.action} blocked — {check.reason}")
