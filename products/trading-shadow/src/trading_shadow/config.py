import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv


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

    # ============================================================
    # FLOOR SETTINGS — derived from NotebookLM "investor research"
    # patterns extracted 2026-04-30. Source citations in
    # data/top_trader_patterns.json.
    # ============================================================

    # HARD_FLOOR_USD: equity level below which the loop alerts (and
    # auto-rollbacks once AUTO_ROLLBACK_ON_HARD_FLOOR is flipped on).
    #
    # Was $100. That number was inherited from "$100 starter account"
    # tutorials but our LIVE capital is $40 ($20/track) — a $100 floor
    # would trip the moment live mode goes hot. New value $25 = the
    # equity level after ~3 consecutive max-loss trades (3 × $5 = $15
    # off $40 start), matching Craig Percoco's "hard stop after 3
    # consecutive losses" rule from the notebook playbook.
    HARD_FLOOR_USD: float = 25.0

    # PER_TRADE_MAX_USD: maximum dollars at risk on any single trade.
    # Notebook (Craig Percoco): "Risk $25-$50 per trade in a $100
    # account" → 25-50% per trade. At our $40 capital the equivalent
    # would be $10-$20, but we're keeping $5 (12.5%) — more conservative
    # than the playbook because Phase 0 is about decision quality, not
    # P&L magnitude. The shadow-graduation metric only needs small
    # decisions to evaluate accuracy.
    PER_TRADE_MAX_USD: float = 5.0

    # LIVE_CAPITAL_PER_TRACK: starting capital allocated to each track
    # (A and B run independently). $20 × 2 tracks = $40 total live
    # exposure across the entire system.
    LIVE_CAPITAL_PER_TRACK: float = 20.0

    # MAX_CONSECUTIVE_LOSSES: explicit count from notebook (Craig
    # Percoco LIVE): "Make sure I don't hit three consecutive losses
    # cuz then I shut myself out on the session." When the session loss
    # counter hits this number, runner returns HOLD on all subsequent
    # tickers for the rest of the trading session. NOT YET WIRED — see
    # runner.py TODO post-cutover.
    MAX_CONSECUTIVE_LOSSES: int = 3

    # MAX_POSITION_SIZE_PCT: hardest cap on any single ticker as a
    # share of equity. Notebook (Craig Percoco): "stays exactly $100
    # regardless of account size" — universal sizing. We enforce as a
    # percentage so it scales naturally as equity grows. 10% matches
    # the existing system-prompt hard constraint in prompts_v2.py.
    MAX_POSITION_SIZE_PCT: float = 0.10

    # ============================================================
    # MECHANICAL EXIT RULES — from "I Gave Claude Full Access to
    # TradingView" notebook: EMA crossover strategy validated with
    # 3% stop-loss / 4% take-profit. Applied to ALL open positions
    # regardless of LLM decision, so exits are never "forgotten."
    # ============================================================
    TAKE_PROFIT_PCT: float = 0.04
    STOP_LOSS_PCT: float = 0.03

    GRADUATION_ACCURACY: float = 0.90
    GRADUATION_MIN_TRADES: int = 50
    GRADUATION_MIN_PROFIT_USD: float = 1.0

    # AUTO_ROLLBACK_ON_HARD_FLOOR remains FALSE for the cutover. The
    # RollbackHandler is wired so scripts/halt_all.py --rollback-to=...
    # works for manual operator-approved rollbacks, but the runner does
    # NOT call rollback_to() automatically until accuracy graduates.
    AUTO_ROLLBACK_ON_HARD_FLOOR: bool = False
    ROLLBACK_BUDGET_PER_DAY: int = 3

    @classmethod
    def from_env(cls) -> "Config":
        mode = os.environ.get("MODE", "paper")
        env_file = Path(f".env.{mode}")
        if env_file.exists():
            load_dotenv(env_file, override=False)
        else:
            load_dotenv(override=False)

        if mode == "live":
            return cls(
                anthropic_key=os.environ["ANTHROPIC_API_KEY"],
                alpaca_paper_key=os.environ.get("ALPACA_PAPER_API_KEY", ""),
                alpaca_paper_secret=os.environ.get("ALPACA_PAPER_API_SECRET", ""),
                alpaca_live_key=os.environ["ALPACA_LIVE_API_KEY"],
                alpaca_live_secret=os.environ["ALPACA_LIVE_API_SECRET"],
                discord_webhook=os.environ["DISCORD_WEBHOOK_URL"],
                ollama_host=os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
                ollama_model=os.environ.get("OLLAMA_MODEL", "llama3.1:8b"),
            )
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
