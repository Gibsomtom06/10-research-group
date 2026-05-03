"""CFTC Commitment of Traders (COT) — weekly speculative positioning.

FREE, no API key. CFTC publishes every Friday after market close.

Disaggregated Futures report covers physical commodities:
  - Gold (safe haven, inflation hedge)
  - WTI Crude Oil (energy/macro, relevant to copper thesis)
  - Copper (directly relevant to FCX, SCCO, TECK, COPX)

The "Managed Money" category = hedge funds / CTAs (speculators).
When they are crowded long, contrarian reversal risk. Crowded short = squeeze risk.

Output: data/research/cot_{slug}.jsonl
  Fields: report_date, managed_money_net, commercial_net, total_oi, net_pct

Context.py surfaces this in agent prompts:
  ## COT positioning (weekly)
    Copper: specs net +18,000 (+5.2% OI) — neutral positioning

Run weekly (Fridays) or on demand:
    .venv/Scripts/python.exe scripts/fetch_cot.py
"""
from __future__ import annotations

import csv
import io
import json
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import requests

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "research"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# CFTC disaggregated futures-only (commodities: metals, energy, ag)
COT_URLS = [
    "https://www.cftc.gov/files/dea/history/fut_disagg_txt_2025.zip",
    "https://www.cftc.gov/files/dea/history/fut_disagg_txt_2024.zip",
]

UA = "trading-shadow/0.1 (10 Research Group)"

# Exact market name substrings → output slug
# Found by inspecting the CSV's Market_and_Exchange_Names column directly
MARKET_FILTERS: dict[str, str] = {
    "GOLD - COMMODITY EXCHANGE INC":         "gold",
    "CRUDE OIL, LIGHT SWEET":                "wti_crude",
    "COPPER- #1 - COMMODITY EXCHANGE INC":   "copper",
}


def _safe_int(s: str | None) -> int:
    try:
        return int((s or "0").strip().replace(",", ""))
    except (ValueError, TypeError):
        return 0


def _seen_dates(slug: str) -> set[str]:
    path = OUT_DIR / f"cot_{slug}.jsonl"
    if not path.exists():
        return set()
    seen: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            seen.add(json.loads(line).get("report_date", ""))
        except Exception:
            continue
    return seen


def fetch_and_parse() -> dict[str, list[dict]]:
    content: bytes | None = None
    for url in COT_URLS:
        try:
            r = requests.get(url, headers={"User-Agent": UA}, timeout=60)
            if r.status_code == 200:
                content = r.content
                print(f"[fetch_cot] downloaded from {url}")
                break
        except Exception as e:
            print(f"[fetch_cot] {url} failed: {e}", file=sys.stderr)

    if not content:
        print("[fetch_cot] all URLs failed", file=sys.stderr)
        return {}

    try:
        zf = zipfile.ZipFile(io.BytesIO(content))
        csv_bytes = zf.read(zf.namelist()[0])
    except Exception as e:
        print(f"[fetch_cot] zip parse failed: {e}", file=sys.stderr)
        return {}

    text = csv_bytes.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))

    results: dict[str, list[dict]] = {slug: [] for slug in MARKET_FILTERS.values()}

    for row in reader:
        market_name = (row.get("Market_and_Exchange_Names") or "").upper().strip()
        slug: str | None = None
        for keyword, s in MARKET_FILTERS.items():
            if keyword.upper() in market_name:
                slug = s
                break
        if slug is None:
            continue

        report_date = (
            row.get("Report_Date_as_YYYY-MM-DD")
            or row.get("As_of_Date_In_Form_YYMMDD")
            or ""
        ).strip()

        total_oi    = _safe_int(row.get("Open_Interest_All"))
        mm_long     = _safe_int(row.get("M_Money_Positions_Long_All"))
        mm_short    = _safe_int(row.get("M_Money_Positions_Short_All"))
        prod_long   = _safe_int(row.get("Prod_Merc_Positions_Long_All"))
        prod_short  = _safe_int(row.get("Prod_Merc_Positions_Short_All"))

        mm_net   = mm_long - mm_short
        prod_net = prod_long - prod_short
        net_pct  = round(mm_net / total_oi * 100, 2) if total_oi else 0.0

        results[slug].append({
            "report_date": report_date,
            "market": market_name[:60],
            "total_oi": total_oi,
            "managed_money_long": mm_long,
            "managed_money_short": mm_short,
            "managed_money_net": mm_net,
            "commercial_net": prod_net,
            "net_pct_of_oi": net_pct,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        })

    return results


def main() -> None:
    print("[fetch_cot] fetching CFTC disaggregated COT report...")
    market_rows = fetch_and_parse()
    total_new = 0
    for slug, rows in market_rows.items():
        seen = _seen_dates(slug)
        path = OUT_DIR / f"cot_{slug}.jsonl"
        new = 0
        with path.open("a", encoding="utf-8") as f:
            for row in sorted(rows, key=lambda r: r.get("report_date", "")):
                if row["report_date"] in seen:
                    continue
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
                new += 1
        if new:
            latest = max(rows, key=lambda r: r.get("report_date", ""))
            print(
                f"[fetch_cot] {slug}: +{new} rows "
                f"(latest {latest['report_date']}: "
                f"managed money net {latest['managed_money_net']:+,} "
                f"= {latest['net_pct_of_oi']:+.1f}% OI)"
            )
        total_new += new
    print(f"[fetch_cot] complete — {total_new} new rows across {len(market_rows)} markets")


if __name__ == "__main__":
    main()
