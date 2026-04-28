import pandas as pd
from trading_shadow.strategy import compute_signal, SignalType


def test_signal_is_buy_when_price_above_20sma_and_rsi_oversold():
    closes = [100.0] * 19 + [105.0]
    df = pd.DataFrame({"Close": closes})
    sig = compute_signal(df, current_rsi=25.0)
    assert sig.signal == SignalType.BUY
    assert "trend" in sig.rationale.lower() or "oversold" in sig.rationale.lower()


def test_signal_is_sell_when_price_below_20sma_and_rsi_overbought():
    closes = [100.0] * 19 + [95.0]
    df = pd.DataFrame({"Close": closes})
    sig = compute_signal(df, current_rsi=78.0)
    assert sig.signal == SignalType.SELL


def test_signal_is_hold_when_neither_extreme():
    closes = [100.0] * 19 + [100.5]
    df = pd.DataFrame({"Close": closes})
    sig = compute_signal(df, current_rsi=50.0)
    assert sig.signal == SignalType.HOLD
