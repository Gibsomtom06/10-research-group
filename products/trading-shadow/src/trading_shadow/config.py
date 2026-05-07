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
    # SIZING — capital-agnostic % rules (2026-05-06 cap-lift, 2026-05-07
    # rebased to real-money scale).
    # Prior $5/trade absolute cap removed: it contradicted the notebook
    # playbooks that recommend $20-$50 per trade at 10x leverage with
    # $100 universal risk (Coleman, Percoco). Sizing is now driven by
    # MAX_POSITION_SIZE_PCT (% of equity) and the floor by HARD_FLOOR_PCT
    # (% of starting capital). Same math at $100 and at $100K — divide
    # paper P&L by (paper_equity / 100) to read the equivalent at $100.
    # LIVE mode also gated by LIVE_TRADING_ENABLED.
    # ============================================================

    # LIVE_CAPITAL_PER_TRACK: starting capital allocated to each track
    # (A and B run independently). Real-money plan is $100 total → $50
    # per track. The Alpaca paper account starts at $100K regardless of
    # this value; this number is the reference for the hard-floor
    # calculation and for live-mode budgeting.
    LIVE_CAPITAL_PER_TRACK: float = 50.0

    # HARD_FLOOR_PCT: equity below this fraction of starting per-track
    # capital triggers the alert / auto-rollback path (when enabled).
    # 50% drawdown from start = the strategy is broken, not just a
    # losing streak. At $50/track this floor is $25; at $100K paper it's
    # $50K — same proportional rule.
    HARD_FLOOR_PCT: float = 0.50

    # MAX_CONSECUTIVE_LOSSES: explicit count from notebook (Craig
    # Percoco LIVE): "Make sure I don't hit three consecutive losses
    # cuz then I shut myself out on the session." When the session loss
    # counter hits this number, runner returns HOLD on all subsequent
    # tickers for the rest of the trading session. NOT YET WIRED — see
    # runner.py TODO post-cutover.
    MAX_CONSECUTIVE_LOSSES: int = 3

    # MAX_POSITION_SIZE_PCT: the primary sizing cap, replacing the old
    # $5 absolute cap. Notebook playbook (Percoco): "risk stays exactly
    # $100 regardless of account size" — universal sizing via leverage.
    # We enforce as a % of equity so it scales naturally and keeps
    # paper sessions sized to what the playbooks actually teach.
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
    def hard_floor_usd(cls) -> float:
        """Hard floor in dollars = HARD_FLOOR_PCT × LIVE_CAPITAL_PER_TRACK.

        Computed rather than stored so changing capital level (e.g.
        scaling from $50 real to $50K paper validation) only requires
        editing one constant.
        """
        return cls.LIVE_CAPITAL_PER_TRACK * cls.HARD_FLOOR_PCT

    @classmethod
    def from_env(cls) -> "Config":
        mode = os.environ.get("MODE", "paper")
        env_file = Path(f".env.{mode}")
        if env_file.exists():
            load_dotenv(env_file, override=False)
        else:
            load_dotenv(override=False)

        if mode == "live":
            # Hard gate after the 2026-05-06 cap-lift. Lifting the $5
            # per-trade cap means a paper-account-sized 10%-equity rule
            # is now in force, but the strategy hasn't been validated
            # at the new sizing. Setting MODE=live alone is no longer
            # enough — the operator must also set LIVE_TRADING_ENABLED=1
            # explicitly, after deciding paper results justify it.
            if os.environ.get("LIVE_TRADING_ENABLED", "0") != "1":
                raise RuntimeError(
                    "MODE=live requires LIVE_TRADING_ENABLED=1 to be set explicitly. "
                    "Live trading is gated until paper results validate the new sizing rules."
                )
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
