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


def test_decision_log_assigns_id_and_chains_prior(tmp_path: Path):
    """Each appended decision gets a unique decision_id and a prior_state_id
    pointing at the previous decision on the same (track, agent) lineage."""
    log = DecisionLog(tmp_path / "decisions.jsonl")
    d1 = log.append(Decision(timestamp="t1", track="A", agent="claude", ticker="SPY", action="hold", size_usd=0, reasoning="r1"))
    d2 = log.append(Decision(timestamp="t2", track="A", agent="claude", ticker="SPY", action="buy", size_usd=2, reasoning="r2"))
    d_other = log.append(Decision(timestamp="t3", track="B", agent="claude", ticker="SPY", action="buy", size_usd=2, reasoning="other-track"))
    d3 = log.append(Decision(timestamp="t4", track="A", agent="claude", ticker="SPY", action="sell", size_usd=2, reasoning="r3"))

    assert d1.decision_id and d2.decision_id and d3.decision_id
    assert d1.decision_id != d2.decision_id
    assert d1.prior_state_id is None
    assert d2.prior_state_id == d1.decision_id
    # d3 chains to d2 (same A/claude lineage), skipping d_other on track B
    assert d3.prior_state_id == d2.decision_id


def test_decision_log_rollback_returns_chain_through_state(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    d1 = log.append(Decision(timestamp="t1", track="A", agent="claude", ticker="SPY", action="hold", size_usd=0, reasoning="r1"))
    d2 = log.append(Decision(timestamp="t2", track="A", agent="claude", ticker="SPY", action="buy", size_usd=2, reasoning="r2"))
    d3 = log.append(Decision(timestamp="t3", track="A", agent="claude", ticker="SPY", action="sell", size_usd=2, reasoning="r3"))

    chain = log.rollback_to(d2.decision_id)
    assert [d.decision_id for d in chain] == [d1.decision_id, d2.decision_id]
    # rollback never deletes — d3 is still on disk
    assert len(log.read_all()) == 3


def test_decision_log_reads_legacy_rows_without_ids(tmp_path: Path):
    """Backward compatibility: pre-rollback JSONL rows lack decision_id/prior_state_id."""
    p = tmp_path / "decisions.jsonl"
    p.write_text(
        '{"timestamp": "old", "track": "A", "agent": "claude", "ticker": "SPY",'
        ' "action": "hold", "size_usd": 0, "reasoning": "legacy", "market_state": {}}\n',
        encoding="utf-8",
    )
    log = DecisionLog(p)
    decisions = log.read_all()
    assert len(decisions) == 1
    assert decisions[0].decision_id == ""
    assert decisions[0].prior_state_id is None


def test_decision_log_rollback_raises_for_unknown_id(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    log.append(Decision(timestamp="t1", track="A", agent="claude", ticker="SPY", action="hold", size_usd=0, reasoning="r1"))
    try:
        log.rollback_to("does-not-exist")
    except ValueError as e:
        assert "does-not-exist" in str(e)
    else:
        raise AssertionError("expected ValueError")
