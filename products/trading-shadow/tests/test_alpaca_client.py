from unittest.mock import MagicMock
from trading_shadow.alpaca_client import AlpacaWrapper, AccountState


def test_get_account_state_returns_struct():
    raw_account = MagicMock(cash="100.00", portfolio_value="100.00", equity="100.00")
    raw_client = MagicMock()
    raw_client.get_account.return_value = raw_account

    wrapper = AlpacaWrapper(raw_client)
    state = wrapper.account_state()

    assert isinstance(state, AccountState)
    assert state.cash == 100.0
    assert state.portfolio_value == 100.0
    assert state.equity == 100.0


def test_submit_market_order_calls_alpaca():
    raw_client = MagicMock()
    raw_client.submit_order.return_value = MagicMock(id="order-123")

    wrapper = AlpacaWrapper(raw_client)
    order_id = wrapper.submit_market_order(ticker="AAPL", notional_usd=4.50, side="buy")

    raw_client.submit_order.assert_called_once()
    assert order_id == "order-123"


def test_get_positions_returns_dict():
    raw_client = MagicMock()
    raw_client.get_all_positions.return_value = [
        MagicMock(symbol="AAPL", qty="0.025", market_value="4.50"),
    ]
    wrapper = AlpacaWrapper(raw_client)
    positions = wrapper.positions()
    assert "AAPL" in positions
    assert positions["AAPL"].qty == 0.025


def test_cancel_order_calls_alpaca():
    """Rollback handler depends on cancel_order(order_id) for unfilled buys."""
    raw_client = MagicMock()
    wrapper = AlpacaWrapper(raw_client)
    wrapper.cancel_order("order-abc")
    raw_client.cancel_order_by_id.assert_called_once_with("order-abc")
