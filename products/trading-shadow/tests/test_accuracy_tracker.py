from trading_shadow.accuracy_tracker import compute_accuracy
from trading_shadow.decision_log import Decision


def _d(agent, action, ticker="SPY", track="A"):
    return Decision(timestamp="t", track=track, agent=agent, ticker=ticker, action=action, size_usd=1.0, reasoning="", market_state={})


def test_accuracy_perfect_match():
    # Each pair needs a unique (timestamp, ticker) key
    decisions = [
        _d("claude", "buy", "SPY"), _d("shadow", "buy", "SPY"),
        _d("claude", "hold", "AAPL"), _d("shadow", "hold", "AAPL"),
        _d("claude", "sell", "MSFT"), _d("shadow", "sell", "MSFT"),
    ]
    acc = compute_accuracy(decisions, asset_class="equities")
    assert acc.total_pairs == 3
    assert acc.matches == 3
    assert acc.accuracy == 1.0


def test_accuracy_partial_match():
    decisions = [
        _d("claude", "buy", "SPY"), _d("shadow", "hold", "SPY"),
        _d("claude", "hold", "AAPL"), _d("shadow", "hold", "AAPL"),
        _d("claude", "sell", "MSFT"), _d("shadow", "sell", "MSFT"),
    ]
    acc = compute_accuracy(decisions, asset_class="equities")
    assert acc.total_pairs == 3
    assert acc.matches == 2
    assert abs(acc.accuracy - 0.6667) < 0.01


def test_accuracy_filters_by_asset_class():
    decisions = [
        Decision("t", "A", "claude", "SPY", "buy", 1.0, "", {"asset_class": "equities"}),
        Decision("t", "A", "shadow", "SPY", "buy", 1.0, "", {"asset_class": "equities"}),
        Decision("t", "A", "claude", "BTC/USD", "buy", 1.0, "", {"asset_class": "crypto"}),
        Decision("t", "A", "shadow", "BTC/USD", "sell", 1.0, "", {"asset_class": "crypto"}),
    ]
    acc = compute_accuracy(decisions, asset_class="equities")
    assert acc.total_pairs == 1
    assert acc.matches == 1
