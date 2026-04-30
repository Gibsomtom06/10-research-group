"""Emergency kill switch — closes all open positions in paper + live, posts to Discord.

Two modes:

* ``python scripts/halt_all.py [--live]`` — close every open position on the
  paper (or live) broker. Halt-only behavior, unchanged from prior versions.

* ``python scripts/halt_all.py --rollback-to=<state_id> [--track=A|B]
  [--agent=claude|shadow] [--live]`` — instantiate a per-track
  :class:`RollbackHandler` and call ``rollback_to`` with the supplied state.
  Halt remains armed afterwards (the rollback path also closes positions and
  cancels unfilled orders). Track defaults to ``A``; agent defaults to
  ``claude``.
"""
from pathlib import Path

from alpaca.trading.client import TradingClient

from trading_shadow.alpaca_client import AlpacaWrapper
from trading_shadow.config import Config
from trading_shadow.decision_log import DecisionLog
from trading_shadow.discord_reporter import DiscordReporter
from trading_shadow.rollback import RollbackHandler


LOG_PATH = Path("data/decisions.jsonl")


def halt(paper: bool = True):
    cfg = Config.from_env()
    if paper:
        client = TradingClient(cfg.alpaca_paper_key, cfg.alpaca_paper_secret, paper=True)
        label = "PAPER"
    else:
        client = TradingClient(cfg.alpaca_live_key, cfg.alpaca_live_secret, paper=False)
        label = "LIVE"

    positions = client.get_all_positions()
    closed = []
    for pos in positions:
        try:
            client.close_position(pos.symbol)
            closed.append(pos.symbol)
        except Exception as e:
            DiscordReporter(cfg.discord_webhook).send(
                f":warning: HALT: failed to close {pos.symbol} on {label}: {e}"
            )

    DiscordReporter(cfg.discord_webhook).send(
        f":octagonal_sign: HALT EXECUTED on {label}. Closed: {closed or 'no open positions'}"
    )


def rollback(state_id: str, track: str, agent: str, live: bool) -> None:
    """Manual operator-driven rollback. Halt remains armed afterwards."""
    cfg = Config.from_env()
    if live:
        if not (cfg.alpaca_live_key and cfg.alpaca_live_secret):
            raise RuntimeError("Live mode requested but Alpaca live keys missing")
        broker = AlpacaWrapper.live(cfg.alpaca_live_key, cfg.alpaca_live_secret)
        label = "LIVE"
    else:
        broker = AlpacaWrapper.paper(cfg.alpaca_paper_key, cfg.alpaca_paper_secret)
        label = "PAPER"

    log = DecisionLog(LOG_PATH, mode="live" if live else "paper")
    discord = DiscordReporter(cfg.discord_webhook)

    handler = RollbackHandler(
        decision_log=log,
        alpaca=broker,
        discord=discord,
        track=track,
        agent=agent,
        budget_per_day=Config.ROLLBACK_BUDGET_PER_DAY,
    )

    discord.send(
        f":rewind: MANUAL ROLLBACK STARTING on {label} (track={track} "
        f"agent={agent}) state={state_id[:12]}..."
    )
    result = handler.rollback_to(state_id, reason="manual halt + rollback")
    discord.send(
        f":octagonal_sign: HALT REMAINS ARMED on {label} after rollback "
        f"(walked={result.decisions_walked}, slippage=${result.slippage_usd:.4f})"
    )


def _parse_kv(arg: str, key: str, default: str | None = None) -> str | None:
    prefix = f"--{key}="
    if arg.startswith(prefix):
        return arg[len(prefix):]
    return default


if __name__ == "__main__":
    import sys

    args = sys.argv[1:]
    paper = "--live" not in args

    rollback_state: str | None = None
    track = "A"
    agent = "claude"
    for a in args:
        v = _parse_kv(a, "rollback-to")
        if v is not None:
            rollback_state = v
        v = _parse_kv(a, "track")
        if v is not None:
            track = v
        v = _parse_kv(a, "agent")
        if v is not None:
            agent = v

    if rollback_state:
        rollback(state_id=rollback_state, track=track, agent=agent, live=not paper)
    else:
        halt(paper=paper)
