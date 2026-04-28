import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    anthropic_key: str
    alpaca_paper_key: str
    alpaca_paper_secret: str
    alpaca_live_key: str
    alpaca_live_secret: str
    discord_webhook: str
    ollama_host: str
    ollama_model: str

    HARD_FLOOR_USD: float = 100.0
    PER_TRADE_MAX_USD: float = 5.0
    LIVE_CAPITAL_PER_TRACK: float = 20.0
    GRADUATION_ACCURACY: float = 0.90
    GRADUATION_MIN_TRADES: int = 50
    GRADUATION_MIN_PROFIT_USD: float = 1.0

    @classmethod
    def from_env(cls) -> "Config":
        return cls(
            anthropic_key=os.environ["ANTHROPIC_API_KEY"],
            alpaca_paper_key=os.environ["ALPACA_PAPER_API_KEY"],
            alpaca_paper_secret=os.environ["ALPACA_PAPER_API_SECRET"],
            alpaca_live_key=os.environ.get("ALPACA_LIVE_API_KEY", ""),
            alpaca_live_secret=os.environ.get("ALPACA_LIVE_API_SECRET", ""),
            discord_webhook=os.environ["DISCORD_WEBHOOK_URL"],
            ollama_host=os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
            ollama_model=os.environ.get("OLLAMA_MODEL", "llama3.1:8b"),
        )
