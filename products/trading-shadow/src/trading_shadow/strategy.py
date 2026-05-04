from dataclasses import dataclass
from enum import Enum
import pandas as pd


# Compile-time strategy defaults. Used by the rollback handler as the fallback
# parameter set when the safe state's `prior_state_id` is None — i.e. there's
# no earlier decision in the chain to restore from. Mirrors the constants used
# by `compute_signal` below.
DEFAULT_PARAMS: dict[str, float] = {
    "sma_window": 20,
    "rsi_oversold": 30.0,
    "rsi_overbought": 70.0,
}


class SignalType(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


@dataclass(frozen=True)
class Signal:
    signal: SignalType
    rationale: str
    sma20: float
    current_price: float
    rsi: float


def compute_signal(closes_df: pd.DataFrame, current_rsi: float) -> Signal:
    """Trend-following with mean-reversion overlay.

    - BUY when price > 20SMA (uptrend) AND RSI < 30 (oversold pullback)
    - SELL when price < 20SMA (downtrend) AND RSI > 70 (overbought rally)
    - HOLD otherwise
    """
    sma20 = float(closes_df["Close"].tail(20).mean())
    current = float(closes_df["Close"].iloc[-1])

    if current > sma20 and current_rsi < 30:
        return Signal(SignalType.BUY, f"Uptrend (price ${current:.2f} > SMA20 ${sma20:.2f}) + oversold (RSI {current_rsi:.1f})", sma20, current, current_rsi)
    if current < sma20 and current_rsi > 70:
        return Signal(SignalType.SELL, f"Downtrend (price ${current:.2f} < SMA20 ${sma20:.2f}) + overbought (RSI {current_rsi:.1f})", sma20, current, current_rsi)
    return Signal(SignalType.HOLD, f"No edge: price ${current:.2f} vs SMA20 ${sma20:.2f}, RSI {current_rsi:.1f}", sma20, current, current_rsi)
