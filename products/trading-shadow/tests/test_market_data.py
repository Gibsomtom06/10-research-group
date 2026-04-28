from unittest.mock import patch, MagicMock
import pandas as pd
from trading_shadow.market_data import get_quote, get_historical_bars


def test_get_quote_returns_price():
    with patch("trading_shadow.market_data.yf.Ticker") as mock_yf:
        mock_yf.return_value.fast_info = {"last_price": 175.30}
        price = get_quote("AAPL")
        assert price == 175.30


def test_get_historical_bars_returns_dataframe():
    fake_df = pd.DataFrame({"Close": [100.0, 101.0, 102.0]})
    with patch("trading_shadow.market_data.yf.download") as mock_dl:
        mock_dl.return_value = fake_df
        bars = get_historical_bars("AAPL", start="2024-01-01", end="2024-01-04")
        assert len(bars) == 3
        assert bars["Close"].iloc[-1] == 102.0
