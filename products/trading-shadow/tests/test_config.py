import os
from trading_shadow.config import Config


def test_config_loads_env_vars(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-test")
    monkeypatch.setenv("ALPACA_PAPER_API_KEY", "paper-key")
    monkeypatch.setenv("ALPACA_PAPER_API_SECRET", "paper-secret")
    monkeypatch.setenv("DISCORD_WEBHOOK_URL", "https://discord.test")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.1:8b")

    cfg = Config.from_env()

    assert cfg.anthropic_key == "sk-test"
    assert cfg.alpaca_paper_key == "paper-key"
    assert cfg.alpaca_paper_secret == "paper-secret"
    assert cfg.discord_webhook == "https://discord.test"
    assert cfg.ollama_model == "llama3.1:8b"


def test_config_constants():
    # Updated 2026-05-06 cap-lift + 2026-05-07 real-money rebase:
    # PER_TRADE_MAX_USD removed, sizing driven by MAX_POSITION_SIZE_PCT.
    # LIVE_CAPITAL_PER_TRACK rebased to $50 (Thomas's $100 / 2 tracks).
    # Hard floor stored as %; computed via Config.hard_floor_usd().
    assert Config.LIVE_CAPITAL_PER_TRACK == 50.0
    assert Config.HARD_FLOOR_PCT == 0.50
    assert Config.hard_floor_usd() == 25.0  # $50 × 50%
    assert Config.MAX_POSITION_SIZE_PCT == 0.10
    assert Config.MIN_CONFIDENCE == 0.75
    assert not hasattr(Config, "PER_TRADE_MAX_USD")
    assert not hasattr(Config, "HARD_FLOOR_USD")
    assert Config.GRADUATION_ACCURACY == 0.90
    assert Config.GRADUATION_MIN_TRADES == 50
