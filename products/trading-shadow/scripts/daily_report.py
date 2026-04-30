"""Pull current state from Alpaca + last 24hr decisions, post to Discord."""
from datetime import datetime, timedelta, timezone
from pathlib import Path
from trading_shadow.config import Config
from trading_shadow.alpaca_client import AlpacaWrapper
from trading_shadow.decision_log import DecisionLog
from trading_shadow.discord_reporter import DiscordReporter


def build_report() -> str:
    cfg = Config.from_env()
    paper = AlpacaWrapper.paper(cfg.alpaca_paper_key, cfg.alpaca_paper_secret)
    paper_state = paper.account_state()

    log = DecisionLog(Path("data/decisions.jsonl"))
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    recent = [d for d in log.read_all() if d.timestamp >= cutoff]

    by_track: dict[str, list] = {"A": [], "B": []}
    for d in recent:
        if d.track in by_track:
            by_track[d.track].append(d)

    return (
        f"TRADER UPDATE — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n"
        f"\n"
        f"Paper account: cash=${paper_state.cash:.2f}, equity=${paper_state.equity:.2f}\n"
        f"Track A trades (24h): {len(by_track['A'])}\n"
        f"Track B trades (24h): {len(by_track['B'])}\n"
        f"Total decisions logged: {len(log.read_all())}"
    )


if __name__ == "__main__":
    cfg = Config.from_env()
    msg = build_report()
    DiscordReporter(cfg.discord_webhook).send(msg)
    print(msg)
