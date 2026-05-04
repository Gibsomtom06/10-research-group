"""Pull SEC 13F holdings for our top-3 cohort and persist diffs.

Top 3 (handpicked, well-known long-horizon investors):
  - Berkshire Hathaway (Buffett)        CIK 0001067983
  - Bridgewater Associates (Dalio)      CIK 0001350694
  - Pershing Square Capital (Ackman)    CIK 0001336528

Output: data/research/13f/{cik}_holdings.jsonl  (one row per filing)
        data/research/13f/positions_current.json (latest positions per fund)
        data/research/13f/diff_latest.jsonl (newest filing diff vs prior)

The "diff" tells us: tickers ADDED, INCREASED, REDUCED, EXITED last
quarter. That's the actionable signal for shadow_copy v2:
  - Fund ADDED a ticker we trade  → bullish bias
  - Fund EXITED a ticker we trade → bearish bias
  - >=2 of 3 funds aligned        → strong signal

EDGAR is free, no auth, official source. SEC requires a User-Agent
identifying the client.

Run on demand or via daily cron:
    .\\.venv\\Scripts\\python.exe scripts\\fetch_13f.py
"""
from __future__ import annotations

import json
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

import requests

OUT_DIR = Path("data/research/13f")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# SEC requires a User-Agent identifying the client. Per their guidance,
# include name and contact email so they can reach out about misuse.
UA = "trading-shadow research/0.1 thomas@dirtysnatcha.com"

TOP3 = {
    "0001067983": "Berkshire Hathaway",
    "0001350694": "Bridgewater Associates",
    "0001336528": "Pershing Square Capital",
}

# Tickers we care about — used to filter the diff to only flag changes
# in stocks our agents actually trade.
WATCHED_TICKERS = {"SPY", "QQQ", "AAPL", "MSFT", "NVDA", "FCX", "SCCO", "TECK", "COPX"}


def edgar_get(url: str) -> requests.Response:
    """Polite GET with the SEC-required UA + 100ms throttle."""
    time.sleep(0.11)  # SEC rate limit is 10 req/sec
    return requests.get(url, headers={"User-Agent": UA, "Accept": "application/json"}, timeout=30)


def list_13f_filings(cik: str) -> list[dict]:
    """Return list of {accession, filing_date, primary_doc} for recent 13F-HRs."""
    cik_padded = cik.zfill(10)
    url = f"https://data.sec.gov/submissions/CIK{cik_padded}.json"
    r = edgar_get(url)
    if r.status_code != 200:
        print(f"[13f] CIK {cik}: submissions list failed {r.status_code}", file=sys.stderr)
        return []
    data = r.json()
    recent = (data.get("filings") or {}).get("recent") or {}
    forms = recent.get("form", [])
    accessions = recent.get("accessionNumber", [])
    dates = recent.get("filingDate", [])
    primary = recent.get("primaryDocument", [])
    out = []
    for i, form in enumerate(forms):
        if form == "13F-HR":
            out.append({
                "accession": accessions[i],
                "filing_date": dates[i],
                "primary_doc": primary[i],
            })
    return out


def fetch_holdings(cik: str, accession: str) -> list[dict]:
    """Parse the 13F-HR information table (XML) — list of holdings.

    Each holding: {issuer_name, cusip, value_usd, shares, ticker_guess}
    Note: 13F reports CUSIP not ticker, so we approximate ticker by
    looking at issuer_name. For our purposes this is fine — we just
    need to know which of WATCHED_TICKERS show up.
    """
    cik_int = int(cik)
    acc_no_dashes = accession.replace("-", "")
    base = f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{acc_no_dashes}"
    # Look for the information table — usually named "*infotable*.xml"
    index = edgar_get(f"{base}/index.json")
    if index.status_code != 200:
        return []
    items = (index.json().get("directory") or {}).get("item") or []
    # The information table is usually the largest XML in the filing
    # directory. Filers name it inconsistently:
    #   Bridgewater: "infotable.xml"
    #   Berkshire:   "50240.xml" (numeric)
    #   Pershing Sq: "form13fInfoTable.xml"
    # Heuristic: pick the largest .xml that isn't primary_doc.xml.
    candidates = []
    for it in items:
        name = (it.get("name") or "")
        if not name.lower().endswith(".xml"):
            continue
        if name.lower() == "primary_doc.xml":
            continue
        try:
            size = int(it.get("size") or 0)
        except (ValueError, TypeError):
            size = 0
        candidates.append((size, name))
    if not candidates:
        return []
    candidates.sort(reverse=True)
    info_xml = candidates[0][1]
    r = edgar_get(f"{base}/{info_xml}")
    if r.status_code != 200:
        return []
    try:
        # 13F info tables use namespaces; use tag-suffix matching
        root = ET.fromstring(r.text)
    except ET.ParseError:
        return []

    holdings = []
    for entry in root.iter():
        if not entry.tag.endswith("}infoTable"):
            continue
        h = {}
        for child in entry:
            tag = child.tag.split("}", 1)[-1]
            if tag == "nameOfIssuer":
                h["issuer_name"] = (child.text or "").strip()
            elif tag == "cusip":
                h["cusip"] = (child.text or "").strip()
            elif tag == "value":
                try:
                    h["value_usd"] = int(child.text or 0) * 1000  # 13F values reported in thousands
                except ValueError:
                    h["value_usd"] = 0
            elif tag == "shrsOrPrnAmt":
                for ss in child:
                    if ss.tag.endswith("}sshPrnamt"):
                        try:
                            h["shares"] = int(ss.text or 0)
                        except ValueError:
                            h["shares"] = 0
        if h.get("issuer_name"):
            h["ticker_guess"] = guess_ticker(h["issuer_name"])
            holdings.append(h)
    return holdings


# Hand-curated issuer-name → ticker mapping for our watched set. Issuer
# names in 13F filings are formal corporate names; we only need to map
# the ones we trade.
ISSUER_TO_TICKER = {
    "APPLE INC": "AAPL",
    "MICROSOFT CORP": "MSFT",
    "NVIDIA CORP": "NVDA",
    "NVIDIA CORPORATION": "NVDA",
    "FREEPORT-MCMORAN INC": "FCX",
    "FREEPORT MCMORAN INC": "FCX",
    "SOUTHERN COPPER CORP": "SCCO",
    "TECK RESOURCES LTD": "TECK",
    "TECK RESOURCES LIMITED": "TECK",
    "SPDR S&P 500 ETF TRUST": "SPY",
    "INVESCO QQQ TRUST": "QQQ",
    "GLOBAL X COPPER MINERS ETF": "COPX",
}


def guess_ticker(issuer_name: str) -> str | None:
    name = issuer_name.upper().replace(",", "").strip()
    return ISSUER_TO_TICKER.get(name)


def write_jsonl(path: Path, rows: list[dict]) -> None:
    with path.open("a", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def diff_holdings(prev: list[dict], curr: list[dict]) -> dict:
    """Per-ticker shares delta between two holdings snapshots."""
    by_ticker_prev: dict[str, int] = defaultdict(int)
    by_ticker_curr: dict[str, int] = defaultdict(int)
    for h in prev:
        t = h.get("ticker_guess")
        if t:
            by_ticker_prev[t] += int(h.get("shares") or 0)
    for h in curr:
        t = h.get("ticker_guess")
        if t:
            by_ticker_curr[t] += int(h.get("shares") or 0)

    all_tickers = set(by_ticker_prev) | set(by_ticker_curr)
    diff = {}
    for t in all_tickers:
        delta = by_ticker_curr[t] - by_ticker_prev[t]
        if delta == 0:
            continue
        if by_ticker_prev[t] == 0:
            kind = "ADDED"
        elif by_ticker_curr[t] == 0:
            kind = "EXITED"
        elif delta > 0:
            kind = "INCREASED"
        else:
            kind = "REDUCED"
        diff[t] = {
            "kind": kind,
            "shares_prev": by_ticker_prev[t],
            "shares_curr": by_ticker_curr[t],
            "shares_delta": delta,
        }
    return diff


def main() -> None:
    print(f"[13f] starting sweep of {len(TOP3)} top-3 funds")
    positions_current: dict[str, dict] = {}
    diffs_today = []

    for cik, name in TOP3.items():
        print(f"[13f] {name} (CIK {cik})...")
        filings = list_13f_filings(cik)
        if not filings:
            print(f"[13f]   no 13F-HR filings found")
            continue
        # Sort by filing_date descending
        filings.sort(key=lambda f: f["filing_date"], reverse=True)
        latest = filings[0]
        prev = filings[1] if len(filings) > 1 else None

        latest_holdings = fetch_holdings(cik, latest["accession"])
        print(f"[13f]   {latest['filing_date']} {len(latest_holdings)} positions")

        # Filter to watched tickers only for the position summary
        watched_in_latest = [h for h in latest_holdings if h.get("ticker_guess") in WATCHED_TICKERS]
        positions_current[cik] = {
            "fund_name": name,
            "filing_date": latest["filing_date"],
            "watched_positions": watched_in_latest,
            "total_positions": len(latest_holdings),
        }

        # Save full holdings snapshot
        out_path = OUT_DIR / f"{cik}_holdings.jsonl"
        write_jsonl(out_path, [{
            "fund": name,
            "cik": cik,
            "filing_date": latest["filing_date"],
            "accession": latest["accession"],
            "holdings_count": len(latest_holdings),
            "snapshot_at": datetime.now(timezone.utc).isoformat(),
            "watched_only": watched_in_latest,
        }])

        # Compute diff vs prior filing if available
        if prev:
            prev_holdings = fetch_holdings(cik, prev["accession"])
            diff = diff_holdings(prev_holdings, latest_holdings)
            watched_diff = {t: d for t, d in diff.items() if t in WATCHED_TICKERS}
            if watched_diff:
                diffs_today.append({
                    "fund": name,
                    "cik": cik,
                    "from_filing": prev["filing_date"],
                    "to_filing": latest["filing_date"],
                    "watched_changes": watched_diff,
                })
                for ticker, change in watched_diff.items():
                    print(f"[13f]   {ticker}: {change['kind']} ({change['shares_delta']:+,} shares)")

    # Write current positions snapshot (full overwrite — easy to read)
    (OUT_DIR / "positions_current.json").write_text(
        json.dumps(positions_current, indent=2, default=str), encoding="utf-8"
    )
    # Append today's diffs to a running log
    if diffs_today:
        write_jsonl(OUT_DIR / "diff_latest.jsonl", diffs_today)

    print(f"[13f] complete. positions snapshot + {len(diffs_today)} diff records written")


if __name__ == "__main__":
    main()
