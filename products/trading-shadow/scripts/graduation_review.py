"""Review graduation criteria per asset class. Posts result to Discord."""
from pathlib import Path
from trading_shadow.config import Config
from trading_shadow.decision_log import DecisionLog
from trading_shadow.accuracy_tracker import compute_accuracy
from trading_shadow.discord_reporter import DiscordReporter

ASSET_CLASSES = ["equities", "etf", "crypto", "options", "forex"]


def main():
    cfg = Config.from_env()
    log = DecisionLog(Path("data/decisions.jsonl"))
    decisions = log.read_all()
    discord = DiscordReporter(cfg.discord_webhook)

    lines = ["GRADUATION REVIEW"]
    for ac in ASSET_CLASSES:
        acc = compute_accuracy(decisions, asset_class=ac)
        ready = (
            acc.total_pairs >= Config.GRADUATION_MIN_TRADES
            and acc.accuracy >= Config.GRADUATION_ACCURACY
        )
        flag = "READY" if ready else "pending"
        lines.append(f"{flag} {ac}: {acc.matches}/{acc.total_pairs} ({acc.accuracy:.1%})")
    discord.send("\n".join(lines))


if __name__ == "__main__":
    main()
