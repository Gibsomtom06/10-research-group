"""Run backtest on 5 years of SPY + 9 other equities. Output decisions to data/decisions.jsonl as 'backtest' track."""
from pathlib import Path
from trading_shadow.backtest import run_backtest
from trading_shadow.decision_log import DecisionLog
from trading_shadow.market_data import get_historical_bars

TICKERS = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "AMD"]
START = "2021-04-27"
END = "2026-04-27"

log = DecisionLog(Path("data/decisions.jsonl"))
total = 0
for ticker in TICKERS:
    df = get_historical_bars(ticker, START, END)
    if df.empty:
        print(f"WARNING {ticker}: no data")
        continue
    result = run_backtest(df, ticker=ticker)
    for d in result.decisions:
        log.append(d)
    total += result.total_trades
    print(f"{ticker}: {result.total_trades} trades, final equity ${result.final_equity:.2f}")

print(f"\nTotal trades logged: {total}")
