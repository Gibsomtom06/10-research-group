from dataclasses import dataclass
from typing import Literal, Optional
from trading_shadow.alpaca_client import AccountState
from trading_shadow.config import Config


@dataclass(frozen=True)
class GuardrailCheck:
    allowed: bool
    reason: Optional[str]


AssetClass = Literal["equities", "etf", "leveraged_etf", "crypto", "options", "forex"]


def check_trade(
    *,
    ticker: str,
    notional_usd: float,
    side: Literal["buy", "sell"],
    account: AccountState,
    asset_class: AssetClass,
    live: bool,
) -> GuardrailCheck:
    # Position cap (% of equity) applies in BOTH paper and live after the
    # 2026-05-06 cap-lift — the absolute $5 cap was the bug, not paper
    # mode itself. Specific rules fire before the catch-all hard-floor
    # rule so error messages identify the actual constraint violated.
    pos_pct = notional_usd / max(account.equity, 0.01)
    if pos_pct > Config.MAX_POSITION_SIZE_PCT:
        return GuardrailCheck(
            False,
            f"Position cap: {pos_pct:.1%} > {Config.MAX_POSITION_SIZE_PCT:.0%} of equity (notional ${notional_usd:.2f}, equity ${account.equity:.2f})",
        )

    if live and asset_class != "equities":
        return GuardrailCheck(False, f"Live trading restricted to equities; got {asset_class}")

    floor = Config.hard_floor_usd()
    if account.equity < floor:
        return GuardrailCheck(False, f"Hard floor breached: equity ${account.equity:.2f} < ${floor:.2f}")

    return GuardrailCheck(True, None)
