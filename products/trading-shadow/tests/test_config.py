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
    assert Config.HARD_FLOOR_USD == 100.0
    assert Config.PER_TRADE_MAX_USD == 5.0
    assert Config.LIVE_CAPITAL_PER_TRACK == 20.0
    assert Config.GRADUATION_ACCURACY == 0.90
    assert Config.GRADUATION_MIN_TRADES == 50
