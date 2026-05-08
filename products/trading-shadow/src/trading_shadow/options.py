"""Options trading on Alpaca — paper-only by default.

Adds a downside path (puts) and amplified upside path (calls) on top of
the existing equity decisions. Routes through Alpaca's options API
(alpaca-py 0.43+; the SDK is already in the venv).

Activation:
- Set env var OPTIONS_ENABLED=1 to enable. Default is OFF — the runner
  will continue to trade equities only when this is unset.
- Live mode never trades options regardless of this flag — guardrails
  reject asset_class != "equities" in live, and the runner-level wiring
  also short-circuits on `live=True`.
- Eligible underlyings: SPY, QQQ (most liquid US options). Extend
  OPTIONS_ELIGIBLE_TICKERS to add more.

How it routes (in runner.py):
- Agent says BUY <ticker> with confidence >= 0.80 → buy 1 ATM-ish CALL
  contract on <ticker> with ~14 DTE, instead of buying the equity
- Agent says SELL <ticker> with confidence >= 0.80 AND no open position
  on the ticker → buy 1 ATM-ish PUT (the "play the loss side" path)
- Agent says SELL <ticker> WITH an open position → close the equity
  position normally (existing behavior; options not used)

Sizing: each contract is 1 "qty" (= 100 shares of underlying exposure).
We buy 1 contract per signal. Max position cost is 1 × premium × 100
(plus spread). Keep CALL/PUT premium under MAX_POSITION_SIZE_PCT × equity
to respect the existing position cap.

NOT YET VALIDATED against live Alpaca paper API in this session. First
run on paper will reveal any SDK signature drift; check Discord for the
"option_order_failed" log line.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Literal, Optional

from alpaca.data.historical.option import OptionHistoricalDataClient
from alpaca.data.requests import OptionLatestQuoteRequest
from alpaca.trading.client import TradingClient
from alpaca.trading.enums import AssetStatus, ContractType, OrderSide, TimeInForce
from alpaca.trading.requests import GetOptionContractsRequest, MarketOrderRequest


OPTIONS_ELIGIBLE_TICKERS: set[str] = {"SPY", "QQQ"}
DEFAULT_DTE_TARGET = 14         # days-to-expiry target — sweet spot between cost and theta
DEFAULT_DTE_TOLERANCE = 7       # accept anything from (target - tol) to (target + tol)
MIN_OPTION_CONFIDENCE = 0.80    # only route to options on high-conviction calls


@dataclass(frozen=True)
class OptionContract:
    symbol: str               # OCC symbol Alpaca uses for orders
    underlying: str
    expiration: date
    strike: float
    contract_type: Literal["call", "put"]


def options_enabled() -> bool:
    return os.environ.get("OPTIONS_ENABLED", "0") == "1"


def pick_atm_contract(
    trading_client: TradingClient,
    underlying: str,
    direction: Literal["call", "put"],
    underlying_price: float,
    dte_target: int = DEFAULT_DTE_TARGET,
    dte_tolerance: int = DEFAULT_DTE_TOLERANCE,
) -> Optional[OptionContract]:
    """Find an at-the-money contract within the DTE window.

    Returns None if no eligible contract exists (rare for SPY/QQQ but
    possible during early-week scans before weekly expiries are listed).
    """
    today = date.today()
    earliest = today + timedelta(days=max(1, dte_target - dte_tolerance))
    latest = today + timedelta(days=dte_target + dte_tolerance)

    # Restrict strike search to a band around the current price so we
    # don't pull thousands of far-OTM contracts.
    strike_low = underlying_price * 0.95
    strike_high = underlying_price * 1.05

    req = GetOptionContractsRequest(
        underlying_symbols=[underlying],
        status=AssetStatus.ACTIVE,
        type=ContractType.CALL if direction == "call" else ContractType.PUT,
        expiration_date_gte=earliest,
        expiration_date_lte=latest,
        strike_price_gte=str(round(strike_low, 2)),
        strike_price_lte=str(round(strike_high, 2)),
        limit=200,
    )
    resp = trading_client.get_option_contracts(req)
    contracts = list(resp.option_contracts or [])
    if not contracts:
        return None

    # Pick the contract with strike closest to underlying price; tie-break
    # on the expiration nearest to dte_target.
    target_expiry = today + timedelta(days=dte_target)

    def score(c) -> tuple[float, int]:
        strike = float(c.strike_price)
        exp = c.expiration_date if isinstance(c.expiration_date, date) else date.fromisoformat(str(c.expiration_date))
        return (abs(strike - underlying_price), abs((exp - target_expiry).days))

    best = min(contracts, key=score)
    return OptionContract(
        symbol=best.symbol,
        underlying=underlying,
        expiration=best.expiration_date if isinstance(best.expiration_date, date) else date.fromisoformat(str(best.expiration_date)),
        strike=float(best.strike_price),
        contract_type=direction,
    )


def get_option_premium(
    data_client: OptionHistoricalDataClient,
    symbol: str,
) -> Optional[float]:
    """Best-effort latest mid-quote in dollars per share (multiply by 100
    for total contract cost). Returns None on any error."""
    try:
        req = OptionLatestQuoteRequest(symbol_or_symbols=symbol)
        quotes = data_client.get_option_latest_quote(req)
        q = quotes.get(symbol) if isinstance(quotes, dict) else None
        if q is None:
            return None
        bid = float(getattr(q, "bid_price", 0) or 0)
        ask = float(getattr(q, "ask_price", 0) or 0)
        if bid <= 0 and ask <= 0:
            return None
        if bid > 0 and ask > 0:
            return (bid + ask) / 2
        return ask if ask > 0 else bid
    except Exception:
        return None


def submit_option_market_order(
    trading_client: TradingClient,
    contract_symbol: str,
    qty: int,
    side: Literal["buy", "sell"],
) -> str:
    """Submit a market order on an option contract. Returns the order id."""
    req = MarketOrderRequest(
        symbol=contract_symbol,
        qty=qty,
        side=OrderSide.BUY if side == "buy" else OrderSide.SELL,
        time_in_force=TimeInForce.DAY,
    )
    order = trading_client.submit_order(req)
    return str(order.id)
