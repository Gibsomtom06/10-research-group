from dataclasses import dataclass, field
from datetime import datetime, timezone
import pandas as pd

from trading_shadow.config import Config
from trading_shadow.strategy import compute_signal, SignalType
from trading_shadow.decision_log import Decision


def _rsi(closes: pd.Series, period: int = 14) -> float:
    # yfinance can return a DataFrame instead of Series under certain conditions
    if isinstance(closes, pd.DataFrame):
        closes = closes.iloc[:, 0]
    if len(closes) < period + 1:
        return 50.0
    delta = closes.diff().dropna()
    gain = delta.clip(lower=0).tail(period).mean()
    loss = -delta.clip(upper=0).tail(period).mean()
    if float(loss) == 0:
        return 100.0
    rs = gain / loss
    return 100.0 - (100.0 / (1.0 + rs))


@dataclass
class BacktestResult:
    ticker: str
    final_equity: float
    total_trades: int
    decisions: list[Decision] = field(default_factory=list)


def run_backtest(df: pd.DataFrame, ticker: str, start_capital: float = 100.0) -> BacktestResult:
    """Walk-forward backtest. At each bar (after warmup), generate signal, simulate fill."""
    cash = start_capital
    qty = 0.0
    decisions: list[Decision] = []
    trades = 0

    for i in range(20, len(df)):
        window = df.iloc[: i + 1]
        rsi = _rsi(window["Close"])
        sig = compute_signal(window, current_rsi=rsi)
        price = float(window["Close"].iloc[-1])
        ts = datetime.now(timezone.utc).isoformat()

        if sig.signal == SignalType.BUY and cash >= 1.0:
            equity = cash + qty * price
            spend = min(equity * Config.MAX_POSITION_SIZE_PCT, cash)
            qty += spend / price
            cash -= spend
            trades += 1
            decisions.append(Decision(timestamp=ts, track="backtest", agent="strategy", ticker=ticker, action="buy", size_usd=spend, reasoning=sig.rationale, market_state={"price": price, "rsi": rsi}))
        elif sig.signal == SignalType.SELL and qty > 0:
            cash += qty * price
            decisions.append(Decision(timestamp=ts, track="backtest", agent="strategy", ticker=ticker, action="sell", size_usd=qty * price, reasoning=sig.rationale, market_state={"price": price, "rsi": rsi}))
            qty = 0.0
            trades += 1

    final_equity = cash + qty * float(df["Close"].iloc[-1])
    return BacktestResult(ticker=ticker, final_equity=final_equity, total_trades=trades, decisions=decisions)
