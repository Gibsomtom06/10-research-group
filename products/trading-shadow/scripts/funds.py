"""Show current Alpaca paper account state + open positions + recent orders.

Two things to be aware of:
1. Alpaca paper account is shared across Track A and Track B — the runner
   does NOT split capital per-track at the broker level. The split only
   exists in the simulated leaderboard (`scripts/leaderboard.py`).
2. So "who has more funds" splits into two answers:
   - Real broker: ONE pooled account, shown here
   - Simulated per-trader: leaderboard.py's per-(track,agent) walk
"""
from trading_shadow.config import Config
from trading_shadow.alpaca_client import AlpacaWrapper
from alpaca.trading.client import TradingClient


def main() -> None:
    cfg = Config.from_env()
    broker = AlpacaWrapper.paper(cfg.alpaca_paper_key, cfg.alpaca_paper_secret)
    state = broker.account_state()

    print("ALPACA PAPER ACCOUNT (shared across Track A + Track B)")
    print("=" * 60)
    print(f"  cash:    ${state.cash:,.2f}")
    print(f"  equity:  ${state.equity:,.2f}")
    print()

    tc = TradingClient(cfg.alpaca_paper_key, cfg.alpaca_paper_secret, paper=True)

    positions = tc.get_all_positions()
    print(f"OPEN POSITIONS ({len(positions)})")
    print("-" * 60)
    if not positions:
        print("  (none)")
    for p in positions:
        avg = float(p.avg_entry_price)
        mkt = float(p.market_value)
        pl = float(p.unrealized_pl)
        pl_pct = float(p.unrealized_plpc) * 100
        print(f"  {p.symbol:6}  qty={p.qty:>10}  avg=${avg:>8.2f}  mkt=${mkt:>10.2f}  P/L=${pl:+.2f} ({pl_pct:+.2f}%)")
    print()

    orders = tc.get_orders()
    print(f"RECENT ORDERS ({len(orders)})")
    print("-" * 60)
    if not orders:
        print("  (none)")
    for o in orders[:15]:
        ts = o.created_at.strftime("%Y-%m-%d %H:%M:%S")
        side = o.side.value if hasattr(o.side, "value") else str(o.side)
        status = o.status.value if hasattr(o.status, "value") else str(o.status)
        qty = o.qty or o.notional or "?"
        print(f"  {ts}  {side:4}  {o.symbol:6}  qty={str(qty):>10}  {status}")


if __name__ == "__main__":
    main()
