import yfinance as yf
import pandas as pd


def get_quote(ticker: str) -> float:
    """Latest price for a ticker via yfinance."""
    info = yf.Ticker(ticker).fast_info
    return float(info["last_price"])


def get_historical_bars(ticker: str, start: str, end: str, interval: str = "1d") -> pd.DataFrame:
    """OHLCV DataFrame for a ticker over [start, end). Date format YYYY-MM-DD."""
    df = yf.download(
        ticker, start=start, end=end, interval=interval,
        progress=False, auto_adjust=True, multi_level_index=False,
    )
    # Belt-and-suspenders: some yfinance versions ignore multi_level_index.
    # Flatten any remaining MultiIndex columns to single-level and deduplicate.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
        df = df.loc[:, ~df.columns.duplicated(keep="first")]
    return df
