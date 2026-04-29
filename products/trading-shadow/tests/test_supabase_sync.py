"""Tests for the best-effort Supabase sync layer.

We never hit Supabase from tests — the supabase client is mocked. We verify:
  * env-missing case is a quiet no-op (does not raise)
  * happy path calls .table('trades').upsert(row, on_conflict='decision_id').execute()
  * upsert exception is swallowed (loop must never crash on sync failure)
  * row payload has the expected shape, including price extracted from market_state
"""
from __future__ import annotations

import sys
from unittest.mock import MagicMock, patch

import pytest

from trading_shadow import supabase_sync
from trading_shadow.decision_log import Decision


def _decision(**overrides) -> Decision:
    base = dict(
        timestamp="2026-04-28T15:30:00+00:00",
        track="A",
        agent="claude",
        ticker="AAPL",
        action="buy",
        size_usd=4.50,
        reasoning="Trend signal triggered",
        market_state={"price": 175.30, "rsi": 28.4, "asset_class": "equities"},
        decision_id="abc123",
        prior_state_id=None,
    )
    base.update(overrides)
    return Decision(**base)


def test_sync_decision_noop_when_env_missing(monkeypatch, capsys):
    """No SUPABASE_URL / KEY → log a warning and return cleanly."""
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    # Reset the warned-once flag so we deterministically see the warning.
    supabase_sync._warned_missing = False

    supabase_sync.sync_decision(_decision(), mode="paper")

    captured = capsys.readouterr()
    assert "SUPABASE_URL" in captured.err


def test_sync_decision_upserts_with_correct_shape(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key")

    fake_table = MagicMock()
    fake_upsert = MagicMock()
    fake_table.upsert.return_value = fake_upsert
    fake_client = MagicMock()
    fake_client.table.return_value = fake_table

    with patch.object(supabase_sync, "_client", return_value=fake_client):
        supabase_sync.sync_decision(_decision(), mode="paper")

    fake_client.table.assert_called_once_with("trades")
    args, kwargs = fake_table.upsert.call_args
    row = args[0]
    assert kwargs == {"on_conflict": "decision_id"}
    assert row["decision_id"] == "abc123"
    assert row["mode"] == "paper"
    assert row["track"] == "A"
    assert row["agent"] == "claude"
    assert row["ticker"] == "AAPL"
    assert row["action"] == "buy"
    # price comes from market_state["price"] when not passed
    assert row["price"] == 175.30
    # outcome fields default to None
    assert row["pnl"] is None
    assert row["accuracy"] is None
    assert row["shares"] is None
    # raw payload preserved for debugging / replay
    assert row["raw"]["reasoning"] == "Trend signal triggered"
    assert row["decided_at"] == "2026-04-28T15:30:00+00:00"
    fake_upsert.execute.assert_called_once()


def test_sync_decision_swallows_upsert_errors(monkeypatch, capsys):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key")

    fake_table = MagicMock()
    fake_table.upsert.side_effect = RuntimeError("network down")
    fake_client = MagicMock()
    fake_client.table.return_value = fake_table

    with patch.object(supabase_sync, "_client", return_value=fake_client):
        # Must not raise.
        supabase_sync.sync_decision(_decision(), mode="live")

    err = capsys.readouterr().err
    assert "upsert failed" in err


def test_sync_decision_rejects_invalid_mode(capsys):
    supabase_sync.sync_decision(_decision(), mode="bogus")
    err = capsys.readouterr().err
    assert "invalid mode" in err


def test_sync_decision_explicit_overrides_win(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key")

    fake_table = MagicMock()
    fake_client = MagicMock()
    fake_client.table.return_value = fake_table

    with patch.object(supabase_sync, "_client", return_value=fake_client):
        supabase_sync.sync_decision(
            _decision(),
            mode="live",
            ticker="OVERRIDE",
            action="close",
            shares=2.5,
            price=180.0,
            pnl=12.34,
            accuracy=True,
        )

    row = fake_table.upsert.call_args.args[0]
    assert row["ticker"] == "OVERRIDE"
    assert row["action"] == "close"
    assert row["shares"] == 2.5
    assert row["price"] == 180.0
    assert row["pnl"] == 12.34
    assert row["accuracy"] is True
    assert row["mode"] == "live"
