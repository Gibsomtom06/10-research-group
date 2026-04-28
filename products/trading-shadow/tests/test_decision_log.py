import json
from pathlib import Path
from trading_shadow.decision_log import DecisionLog, Decision


def test_decision_log_appends_jsonl(tmp_path: Path):
    log_path = tmp_path / "decisions.jsonl"
    log = DecisionLog(log_path)

    decision = Decision(
        timestamp="2026-04-27T20:00:00Z",
        track="A",
        agent="claude",
        ticker="AAPL",
        action="buy",
        size_usd=4.50,
        reasoning="Trend signal triggered",
        market_state={"price": 175.30, "volume": 1_000_000},
    )
    log.append(decision)

    lines = log_path.read_text().strip().split("\n")
    assert len(lines) == 1
    parsed = json.loads(lines[0])
    assert parsed["track"] == "A"
    assert parsed["ticker"] == "AAPL"
    assert parsed["size_usd"] == 4.50


def test_decision_log_reads_back(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    d1 = Decision(timestamp="t1", track="A", agent="claude", ticker="SPY", action="hold", size_usd=0, reasoning="r1", market_state={})
    d2 = Decision(timestamp="t2", track="A", agent="shadow", ticker="SPY", action="buy", size_usd=2, reasoning="r2", market_state={})
    log.append(d1)
    log.append(d2)
    decisions = log.read_all()
    assert len(decisions) == 2
    assert decisions[0].agent == "claude"
    assert decisions[1].agent == "shadow"
