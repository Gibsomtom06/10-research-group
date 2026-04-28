from dataclasses import dataclass
from typing import Literal, Optional
from trading_shadow.alpaca_client import AccountState
from trading_shadow.config import Config


@dataclass(frozen=True)
class GuardrailCheck:
    allowed: bool
    reason: Optional[str]


AssetClass = Literal["equities", "etf", "crypto", "options", "forex"]


def check_trade(
    *,
    ticker: str,
    notional_usd: float,
    side: Literal["buy", "sell"],
    account: AccountState,
    asset_class: AssetClass,
    live: bool,
) -> GuardrailCheck:
    # Specific rules fire before the catch-all hard-floor rule so error
    # messages identify the actual constraint violated.
    if notional_usd > Config.PER_TRADE_MAX_USD:
        return GuardrailCheck(False, f"Per-trade max exceeded: ${notional_usd:.2f} > ${Config.PER_TRADE_MAX_USD}")

    if live and asset_class != "equities":
        return GuardrailCheck(False, f"Live trading restricted to equities; got {asset_class}")

    if live:
        pos_pct = notional_usd / max(account.equity, 0.01)
        if pos_pct > 0.10:
            return GuardrailCheck(False, f"Position cap: {pos_pct:.1%} > 10% of equity")

        if account.equity < Config.HARD_FLOOR_USD:
            return GuardrailCheck(False, f"Hard floor breached: equity ${account.equity:.2f} < ${Config.HARD_FLOOR_USD}")

    return GuardrailCheck(True, None)
