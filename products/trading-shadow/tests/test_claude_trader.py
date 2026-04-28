from unittest.mock import MagicMock, patch
import json
from trading_shadow.claude_trader import decide
from trading_shadow.alpaca_client import AccountState


def test_claude_trader_parses_response():
    fake_resp = MagicMock()
    fake_resp.content = [MagicMock(text='{"action": "buy", "size_usd": 3.0, "reasoning": "trend up", "confidence": 0.7}')]
    fake_client = MagicMock()
    fake_client.messages.create.return_value = fake_resp

    decision = decide(
        client=fake_client,
        signal_summary="BUY: trend up",
        sma20=100.0, current_price=105.0, rsi=25.0,
        account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
        track="A", live=False,
    )

    assert decision.action == "buy"
    assert decision.size_usd == 3.0
    assert decision.confidence == 0.7


def test_claude_trader_falls_back_to_hold_on_invalid_json():
    fake_resp = MagicMock()
    fake_resp.content = [MagicMock(text="this is not json")]
    fake_client = MagicMock()
    fake_client.messages.create.return_value = fake_resp

    decision = decide(
        client=fake_client,
        signal_summary="HOLD: no signal",
        sma20=100.0, current_price=100.0, rsi=50.0,
        account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
        track="A", live=False,
    )
    assert decision.action == "hold"
    assert decision.size_usd == 0.0
