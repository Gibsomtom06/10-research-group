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
from trading_shadow.guardrails import check_trade
from trading_shadow.decision_log import Decision, DecisionLog
from trading_shadow.discord_reporter import DiscordReporter
from trading_shadow.rollback import RollbackHandler

TICKERS = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA"]
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

    if (
        Config.AUTO_ROLLBACK_ON_HARD_FLOOR
        and live
        and state.equity < Config.HARD_FLOOR_USD
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

        c_dec = claude_decide(
            client=anthropic,
            signal_summary=f"{sig.signal.value.upper()}: {sig.rationale}",
            sma20=sig.sma20, current_price=sig.current_price, rsi=rsi,
            account=state, track=track, live=live,
        )
        log.append(Decision(timestamp=ts, track=track, agent="claude", ticker=ticker, action=c_dec.action, size_usd=c_dec.size_usd, reasoning=c_dec.reasoning, market_state={"price": sig.current_price, "rsi": rsi, "asset_class": "equities", "confidence": c_dec.confidence}))

        s_dec = shadow_predict(
            model=cfg.ollama_model,
            signal_summary=f"{sig.signal.value.upper()}: {sig.rationale}",
            sma20=sig.sma20, current_price=sig.current_price, rsi=rsi,
            account=state, track=track, live=live,
        )
        log.append(Decision(timestamp=ts, track=track, agent="shadow", ticker=ticker, action=s_dec.action, size_usd=s_dec.size_usd, reasoning=s_dec.reasoning, market_state={"price": sig.current_price, "rsi": rsi, "asset_class": "equities", "confidence": s_dec.confidence}))

        if c_dec.action in ("buy", "sell") and c_dec.size_usd > 0:
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
