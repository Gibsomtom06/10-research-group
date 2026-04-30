from dataclasses import dataclass
from typing import Literal
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce


@dataclass(frozen=True)
class AccountState:
    cash: float
    portfolio_value: float
    equity: float


@dataclass(frozen=True)
class Position:
    symbol: str
    qty: float
    market_value: float


class AlpacaWrapper:
    def __init__(self, client: TradingClient):
        self.client = client

    @classmethod
    def paper(cls, key: str, secret: str) -> "AlpacaWrapper":
        return cls(TradingClient(key, secret, paper=True))

    @classmethod
    def live(cls, key: str, secret: str) -> "AlpacaWrapper":
        return cls(TradingClient(key, secret, paper=False))

    def account_state(self) -> AccountState:
        a = self.client.get_account()
        return AccountState(cash=float(a.cash), portfolio_value=float(a.portfolio_value), equity=float(a.equity))

    def positions(self) -> dict[str, Position]:
        out = {}
        for p in self.client.get_all_positions():
            out[p.symbol] = Position(symbol=p.symbol, qty=float(p.qty), market_value=float(p.market_value))
        return out

    def submit_market_order(self, ticker: str, notional_usd: float, side: Literal["buy", "sell"]) -> str:
        req = MarketOrderRequest(
            symbol=ticker,
            notional=notional_usd,
            side=OrderSide.BUY if side == "buy" else OrderSide.SELL,
            time_in_force=TimeInForce.DAY,
        )
        order = self.client.submit_order(req)
        return str(order.id)

    def close_position(self, ticker: str) -> None:
        self.client.close_position(ticker)

    def cancel_order(self, order_id: str) -> None:
        """Cancel an unfilled order by id. Used by the rollback handler to
        reverse `buy` decisions that were submitted but not yet filled."""
        self.client.cancel_order_by_id(order_id)

    def get_order(self, order_id: str):
        """Fetch an order by id. Used by the rollback handler to determine
        whether a `buy` was filled (close_position) vs unfilled (cancel)."""
        return self.client.get_order_by_id(order_id)

    def get_latest_price(self, ticker: str) -> float:
        """Best-effort current market price for a ticker. Tries the open
        position first (cheapest, no extra API call), then falls back to
        market_data.get_quote so the rollback handler logs real slippage
        even AFTER close_position has fired and the position is gone."""
        try:
            pos = self.client.get_open_position(ticker)
            qty = float(pos.qty)
            if qty:
                return float(pos.market_value) / qty
        except Exception:
            pass
        try:
            from trading_shadow.market_data import get_quote
            return float(get_quote(ticker))
        except Exception:
            return 0.0
