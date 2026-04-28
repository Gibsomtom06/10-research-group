from unittest.mock import MagicMock, patch
from trading_shadow.shadow import shadow_predict
from trading_shadow.alpaca_client import AccountState


def test_shadow_predict_parses_response():
    with patch("trading_shadow.shadow.ollama.chat") as mock_chat:
        mock_chat.return_value = {"message": {"content": '{"action": "buy", "size_usd": 2.5, "reasoning": "match trader", "confidence": 0.8}'}}
        decision = shadow_predict(
            model="llama3.1:8b",
            signal_summary="BUY: trend up",
            sma20=100.0, current_price=105.0, rsi=25.0,
            account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
            track="A", live=False,
        )
        assert decision.action == "buy"
        assert decision.size_usd == 2.5


def test_shadow_predict_handles_garbage_response():
    with patch("trading_shadow.shadow.ollama.chat") as mock_chat:
        mock_chat.return_value = {"message": {"content": "garbage output"}}
        decision = shadow_predict(
            model="llama3.1:8b",
            signal_summary="HOLD",
            sma20=100.0, current_price=100.0, rsi=50.0,
            account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
            track="A", live=False,
        )
        assert decision.action == "hold"
