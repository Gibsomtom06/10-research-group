from trading_shadow.guardrails import GuardrailCheck, check_trade
from trading_shadow.alpaca_client import AccountState

# 2026-05-06 cap-lift: PER_TRADE_MAX_USD removed, position cap is now
# 10% of equity in BOTH paper and live, hard floor raised to $500.


def test_pass_when_all_guardrails_satisfied():
    # $1000 equity, $50 trade (5%) — under cap, above floor.
    state = AccountState(cash=1000.0, portfolio_value=1000.0, equity=1000.0)
    result = check_trade(
        ticker="AAPL", notional_usd=50.0, side="buy",
        account=state, asset_class="equities", live=False,
    )
    assert result.allowed
    assert result.reason is None


def test_block_when_account_below_hard_floor_live():
    # Hard floor = LIVE_CAPITAL_PER_TRACK ($50) × HARD_FLOOR_PCT (0.50)
    # = $25. At $24 equity, $2 trade (8.3%) passes the cap, but the
    # floor blocks because we're below the 50%-drawdown alarm.
    state = AccountState(cash=24.0, portfolio_value=24.0, equity=24.0)
    result = check_trade(
        ticker="AAPL", notional_usd=2.0, side="buy",
        account=state, asset_class="equities", live=True,
    )
    assert not result.allowed
    assert "hard floor" in result.reason.lower()


def test_block_when_position_cap_exceeded():
    # $1000 equity, $200 trade (20%) — exceeds 10% cap.
    state = AccountState(cash=1000.0, portfolio_value=1000.0, equity=1000.0)
    result = check_trade(
        ticker="AAPL", notional_usd=200.0, side="buy",
        account=state, asset_class="equities", live=True,
    )
    assert not result.allowed
    assert "position cap" in result.reason.lower() or "10%" in result.reason.lower()


def test_block_non_equities_on_live():
    state = AccountState(cash=1000.0, portfolio_value=1000.0, equity=1000.0)
    result = check_trade(
        ticker="BTC/USD", notional_usd=50.0, side="buy",
        account=state, asset_class="crypto", live=True,
    )
    assert not result.allowed
    assert "live" in result.reason.lower()


def test_allow_non_equities_on_paper():
    state = AccountState(cash=1000.0, portfolio_value=1000.0, equity=1000.0)
    result = check_trade(
        ticker="BTC/USD", notional_usd=50.0, side="buy",
        account=state, asset_class="crypto", live=False,
    )
    assert result.allowed


def test_position_cap_enforced_in_paper_mode_too():
    # Pre-cap-lift, 10% cap only applied in live. Post-cap-lift it
    # applies in paper too — that's the guardrail that replaces the
    # absolute $5 cap.
    state = AccountState(cash=1000.0, portfolio_value=1000.0, equity=1000.0)
    result = check_trade(
        ticker="AAPL", notional_usd=150.0, side="buy",
        account=state, asset_class="equities", live=False,
    )
    assert not result.allowed
    assert "position cap" in result.reason.lower() or "10%" in result.reason.lower()
