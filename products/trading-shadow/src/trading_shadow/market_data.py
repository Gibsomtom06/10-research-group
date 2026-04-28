import yfinance as yf
import pandas as pd


def get_quote(ticker: str) -> float:
    """Latest price for a ticker via yfinance."""
    info = yf.Ticker(ticker).fast_info
    return float(info["last_price"])


def get_historical_bars(ticker: str, start: str, end: str, interval: str = "1d") -> pd.DataFrame:
    """OHLCV DataFrame for a ticker over [start, end). Date format YYYY-MM-DD."""
    df = yf.download(ticker, start=start, end=end, interval=interval, progress=False)
    return df
