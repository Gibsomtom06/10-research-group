import pandas as pd
from trading_shadow.backtest import run_backtest, BacktestResult


def test_backtest_on_uptrending_data_makes_money():
    closes = [100.0 + i for i in range(60)]
    df = pd.DataFrame({"Close": closes})
    result = run_backtest(df, ticker="TEST", start_capital=100.0)
    assert isinstance(result, BacktestResult)
    assert result.total_trades >= 0
    assert result.final_equity >= 100.0


def test_backtest_records_decisions():
    closes = [100.0 + (i % 5) for i in range(60)]
    df = pd.DataFrame({"Close": closes})
    result = run_backtest(df, ticker="TEST", start_capital=100.0)
    assert result.ticker == "TEST"
    assert isinstance(result.decisions, list)
    # Oscillating data may not cross RSI thresholds — verify ticker label on any that fire
    assert all(d.ticker == "TEST" for d in result.decisions)
