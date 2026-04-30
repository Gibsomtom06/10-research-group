"""Thursday EOD — Track A go/no-go gate before Friday live.

Pass requires:
  - >= 50 paper trades since Tuesday on equities
  - Shadow accuracy >= 70% (graduation is 90% but go-live can ride at 70% with $20 cap)
  - Account paper P&L >= $1 net (paper account >= $100 + $1 = $101)
"""
from pathlib import Path
from trading_shadow.config import Config
from trading_shadow.decision_log import DecisionLog
from trading_shadow.accuracy_tracker import compute_accuracy
from trading_shadow.alpaca_client import AlpacaWrapper
from trading_shadow.discord_reporter import DiscordReporter


def main():
    cfg = Config.from_env()
    log = DecisionLog(Path("data/decisions.jsonl"))
    decisions = [d for d in log.read_all() if d.track == "A" and d.market_state.get("asset_class") == "equities"]

    acc = compute_accuracy(decisions, asset_class="equities")
    paper = AlpacaWrapper.paper(cfg.alpaca_paper_key, cfg.alpaca_paper_secret)
    state = paper.account_state()

    pnl = state.equity - 100.0
    pass_trades = acc.total_pairs >= 50
    pass_accuracy = acc.accuracy >= 0.70
    pass_pnl = pnl >= 1.0

    verdict = "GO" if (pass_trades and pass_accuracy and pass_pnl) else "NO-GO"
    msg = (
        f"TRACK A GO/NO-GO — Thursday EOD\n"
        f"Verdict: {verdict}\n\n"
        f"Trade pairs (claude+shadow): {acc.total_pairs} {'pass' if pass_trades else 'FAIL need 50'}\n"
        f"Shadow accuracy: {acc.accuracy:.1%} {'pass' if pass_accuracy else 'FAIL need 70%'}\n"
        f"Paper P&L: ${pnl:+.2f} {'pass' if pass_pnl else 'FAIL need $1+'}\n"
    )
    print(msg)
    DiscordReporter(cfg.discord_webhook).send(msg)


if __name__ == "__main__":
    main()
