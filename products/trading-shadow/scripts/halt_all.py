"""Emergency kill switch — closes all open positions in paper + live, posts to Discord."""
from alpaca.trading.client import TradingClient

from trading_shadow.config import Config
from trading_shadow.discord_reporter import DiscordReporter


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
                f"⚠️ HALT: failed to close {pos.symbol} on {label}: {e}"
            )

    DiscordReporter(cfg.discord_webhook).send(
        f"🛑 HALT EXECUTED on {label}. Closed: {closed or 'no open positions'}"
    )


if __name__ == "__main__":
    import sys
    paper = "--live" not in sys.argv
    halt(paper=paper)
