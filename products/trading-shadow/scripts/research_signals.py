"""Pull insider transactions + analyst recommendations per ticker.

Two new signal streams the agents can read at decision time:

1. data/research/insider_{ticker}.jsonl — recent insider buys/sells via
   yfinance (which proxies SEC Form 4 data). One row per transaction.
   Columns: date, insider, position, transaction_type, shares, value_usd.

2. data/research/analyst_{ticker}.jsonl — analyst rec history via
   yfinance.recommendations. One row per upgrade/downgrade event.
   Columns: date, firm, action, to_grade, from_grade.

Both feeds are FREE, no auth. Run on demand or via daily cron:
    .\\.venv\\Scripts\\python.exe scripts\\research_signals.py

Output is consumed by context.py so the agent's user prompt gets:
    ## Insider activity (last 30d)
      - 2026-04-12 BUY 50,000 sh by John Doe (CFO)
    ## Analyst calls (last 30d)
      - 2026-04-15 Morgan Stanley upgrade Hold -> Buy
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf

EQUITY_TICKERS = [
    "SPY", "QQQ", "AAPL", "MSFT", "NVDA",
    "FCX", "SCCO", "TECK", "COPX",
]

OUT_DIR = Path("data/research")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def _seen_keys(path: Path, key_field: str) -> set[str]:
    if not path.exists():
        return set()
    out = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            v = json.loads(line).get(key_field)
            if v is not None:
                out.add(str(v))
        except json.JSONDecodeError:
            continue
    return out


def fetch_insider(ticker: str) -> int:
    try:
        t = yf.Ticker(ticker)
        # yfinance has multiple insider endpoints across versions
        df = None
        for attr in ("insider_transactions", "get_insider_transactions"):
            if hasattr(t, attr):
                got = getattr(t, attr)
                df = got() if callable(got) else got
                break
        if df is None or len(df) == 0:
            return 0
    except Exception as e:
        print(f"[insider] {ticker} failed: {e}", file=sys.stderr)
        return 0

    path = OUT_DIR / f"insider_{ticker}.jsonl"
    seen = _seen_keys(path, "key")
    appended = 0
    with path.open("a", encoding="utf-8") as f:
        for _, row in df.iterrows():
            insider = str(row.get("Insider", "")).strip()
            position = str(row.get("Position", "")).strip()
            text = str(row.get("Text", "")).strip()
            # yfinance puts the actual transaction type in Text:
            # "Sale at price X" / "Purchase at price X" / "Stock Gift" etc.
            # Derive a clean BUY/SELL/OTHER tag.
            text_low = text.lower()
            if "sale" in text_low:
                ttype = "SALE"
            elif "purchase" in text_low or "buy" in text_low:
                ttype = "PURCHASE"
            elif "gift" in text_low:
                ttype = "GIFT"
            elif "exercise" in text_low or "option" in text_low:
                ttype = "OPTION"
            else:
                ttype = "OTHER"
            shares = row.get("Shares", 0)
            value = row.get("Value", 0)
            date_val = row.get("Start Date", row.get("Date", ""))
            try:
                date_iso = str(date_val) if date_val else ""
            except Exception:
                date_iso = ""
            key = f"{ticker}|{insider}|{date_iso}|{ttype}|{shares}"
            if key in seen:
                continue
            seen.add(key)
            f.write(json.dumps({
                "key": key,
                "ticker": ticker,
                "date": date_iso,
                "insider": insider,
                "position": position,
                "transaction": ttype,
                "transaction_text": text,
                "shares": float(shares) if isinstance(shares, (int, float)) else None,
                "value_usd": float(value) if isinstance(value, (int, float)) else None,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }, ensure_ascii=False, default=str) + "\n")
            appended += 1
    return appended


def fetch_analyst(ticker: str) -> int:
    """Pull per-firm analyst upgrade/downgrade history.

    yfinance.upgrades_downgrades returns columns:
      Firm, ToGrade, FromGrade, Action, priceTargetAction,
      currentPriceTarget, priorPriceTarget
    Index is GradeDate (datetime).

    Note: yfinance.recommendations is DIFFERENT — it returns aggregated
    consensus counts per period, not per-firm grade changes. We use
    upgrades_downgrades because individual firm calls are the actionable
    signal.
    """
    try:
        t = yf.Ticker(ticker)
        df = None
        for attr in ("upgrades_downgrades", "get_upgrades_downgrades"):
            if hasattr(t, attr):
                got = getattr(t, attr)
                df = got() if callable(got) else got
                if df is not None and len(df) > 0:
                    break
        if df is None or len(df) == 0:
            return 0
    except Exception as e:
        print(f"[analyst] {ticker} failed: {e}", file=sys.stderr)
        return 0

    path = OUT_DIR / f"analyst_{ticker}.jsonl"
    seen = _seen_keys(path, "key")
    appended = 0
    with path.open("a", encoding="utf-8") as f:
        for idx, row in df.iterrows():
            firm = str(row.get("Firm", "")).strip()
            action = str(row.get("Action", "")).strip()
            to_grade = str(row.get("ToGrade", "")).strip()
            from_grade = str(row.get("FromGrade", "")).strip()
            pt_action = str(row.get("priceTargetAction", "")).strip()
            pt_now = row.get("currentPriceTarget")
            pt_prior = row.get("priorPriceTarget")
            date_iso = str(idx) if idx is not None else ""
            key = f"{ticker}|{date_iso}|{firm}|{action}|{to_grade}"
            if key in seen:
                continue
            seen.add(key)
            f.write(json.dumps({
                "key": key,
                "ticker": ticker,
                "date": date_iso,
                "firm": firm,
                "action": action,
                "to_grade": to_grade,
                "from_grade": from_grade,
                "price_target_action": pt_action,
                "price_target": float(pt_now) if isinstance(pt_now, (int, float)) else None,
                "prior_price_target": float(pt_prior) if isinstance(pt_prior, (int, float)) else None,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }, ensure_ascii=False, default=str) + "\n")
            appended += 1
    return appended


def main() -> None:
    print(f"[research_signals] sweep across {len(EQUITY_TICKERS)} tickers")
    total_ins = 0
    total_ana = 0
    for ticker in EQUITY_TICKERS:
        ins = fetch_insider(ticker)
        ana = fetch_analyst(ticker)
        total_ins += ins
        total_ana += ana
        print(f"[research_signals] {ticker}: +{ins} insider  +{ana} analyst")
    print(f"[research_signals] complete. {total_ins} insider rows + {total_ana} analyst rows")


if __name__ == "__main__":
    main()
