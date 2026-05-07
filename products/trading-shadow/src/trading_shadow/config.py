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

    # MIN_CONFIDENCE: minimum P(profit) the trader must report on a
    # decision before the runner submits the order. Below this we log
    # a "low_confidence_skip" hold instead.
    #
    # 0.75 is the data-gathering sweet spot:
    #   - At MIN=0.90 most days produce no trades — agent HOLDs
    #     everything because honestly-calibrated 90% setups are rare.
    #     No data to learn from.
    #   - At MIN=0.60 EV barely positive (+1.2%/trade); drawdown
    #     volatility eats compounding before win-rate edge accumulates.
    #   - At MIN=0.75 EV is +2.25%/trade equity (+6.75% leveraged),
    #     trade volume is healthy, calibration data accumulates fast.
    # Once empirical win-rate data shows whether the agent's 0.75
    # confidence calls actually win ~75% of the time, ratchet up to
    # 0.80 or 0.85.
    #
    # The agent's `confidence` field is its own subjective P(profit-
    # within-the-TP/SL-window). With TAKE_PROFIT_PCT=4% and
    # STOP_LOSS_PCT=3% the implicit window is roughly 5-10 trading
    # days on standard equities (faster on leveraged ETFs because the
    # 3x exposure hits ±3-4% sooner).
    MIN_CONFIDENCE: float = 0.75

    # ============================================================
    # MECHANICAL EXIT RULES — applied to ALL open positions regardless
    # of LLM decision so exits are never "forgotten."
    #
    # Bumped to 2:1 reward:risk (6% TP / 3% SL) on 2026-05-07. Prior
    # 4%/3% gave 1.33:1 — operator note: "if we are risking that much,
    # the profit needs to be worth the risk." Combined with the 0.75
    # confidence gate, expected value per trade is now:
    #   EV = 0.75 × 6% - 0.25 × 3% = 3.75% per trade (equity)
    #   EV ≈ 11% per trade on leveraged ETFs (3x exposure)
    # Doubling at 3.75%/trade equity = ~19 trades; on leveraged ≈ 7.
    # ============================================================
    TAKE_PROFIT_PCT: float = 0.06
    STOP_LOSS_PCT: float = 0.03
    # Sanity guardrail against future config drift. If TP/SL ratio
    # ever drops below this, the runner refuses to start.
    MIN_REWARD_RISK_RATIO: float = 2.0

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
