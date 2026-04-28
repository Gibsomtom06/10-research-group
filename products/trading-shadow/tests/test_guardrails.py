from trading_shadow.guardrails import GuardrailCheck, check_trade
from trading_shadow.alpaca_client import AccountState


def test_pass_when_all_guardrails_satisfied():
    state = AccountState(cash=20.0, portfolio_value=20.0, equity=20.0)
    result = check_trade(
        ticker="AAPL", notional_usd=3.0, side="buy",
        account=state, asset_class="equities", live=False,
    )
    assert result.allowed
    assert result.reason is None


def test_block_when_account_below_hard_floor_live():
    state = AccountState(cash=99.0, portfolio_value=99.0, equity=99.0)
    result = check_trade(
        ticker="AAPL", notional_usd=3.0, side="buy",
        account=state, asset_class="equities", live=True,
    )
    assert not result.allowed
    assert "hard floor" in result.reason.lower()


def test_block_when_per_trade_max_exceeded():
    state = AccountState(cash=20.0, portfolio_value=20.0, equity=20.0)
    result = check_trade(
        ticker="AAPL", notional_usd=10.0, side="buy",
        account=state, asset_class="equities", live=True,
    )
    assert not result.allowed
    assert "per-trade max" in result.reason.lower()


def test_block_non_equities_on_live():
    state = AccountState(cash=20.0, portfolio_value=20.0, equity=20.0)
    result = check_trade(
        ticker="BTC/USD", notional_usd=3.0, side="buy",
        account=state, asset_class="crypto", live=True,
    )
    assert not result.allowed
    assert "live" in result.reason.lower()


def test_allow_non_equities_on_paper():
    state = AccountState(cash=100.0, portfolio_value=100.0, equity=100.0)
    result = check_trade(
        ticker="BTC/USD", notional_usd=3.0, side="buy",
        account=state, asset_class="crypto", live=False,
    )
    assert result.allowed


def test_block_position_over_10pct():
    state = AccountState(cash=20.0, portfolio_value=20.0, equity=20.0)
    result = check_trade(
        ticker="AAPL", notional_usd=3.0, side="buy",
        account=state, asset_class="equities", live=True,
    )
    assert not result.allowed
    assert "10%" in result.reason.lower() or "position cap" in result.reason.lower()
