"""Build the per-decision context payload that gets injected into the
trader and shadow user prompts.

Sources stitched into one compact string per ticker:
1. Recent news for THIS ticker (top 3 headlines from data/news/{ticker}.jsonl)
2. Latest macro pulse (vix, oil, 10yr, gold, dxy, btc, eth + change %)
3. Fear & Greed Index (data/news/fear_greed.jsonl — alternative.me, free)
4. Crypto spot prices (data/news/crypto_pulse.jsonl — CoinGecko, free)
5. Google Trends interest score (data/research/trends_{ticker}.jsonl)
6. Insider transactions (data/research/insider_{ticker}.jsonl)
7. Analyst upgrades/downgrades (data/research/analyst_{ticker}.jsonl)
8. The agent's current watchlist state for THIS ticker (if any)

Designed to stay UNDER 600 tokens per call so the cost increment is
small even at our 26 calls/pass cadence. If a source is unavailable
we silently omit it — never crash the decision.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from trading_shadow.watchlist import current_state as watchlist_state

# Paths relative to repo root so context works regardless of cwd
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
NEWS_DIR = _REPO_ROOT / "data" / "news"
RESEARCH_DIR = _REPO_ROOT / "data" / "research"
MAX_HEADLINES_PER_TICKER = 3
MAX_INSIDER_ROWS = 5
MAX_ANALYST_ROWS = 5


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def recent_headlines(ticker: str, limit: int = MAX_HEADLINES_PER_TICKER) -> list[dict]:
    rows = _read_jsonl(NEWS_DIR / f"{ticker}.jsonl")
    rows.sort(key=lambda r: r.get("published_at") or r.get("fetched_at") or "", reverse=True)
    return rows[:limit]


def latest_macro() -> dict[str, Any]:
    rows = _read_jsonl(NEWS_DIR / "macro.jsonl")
    if not rows:
        return {}
    return rows[-1]


def format_macro(macro: dict[str, Any]) -> str:
    if not macro:
        return ""
    bits = []
    for label in ("vix", "wti_crude", "us_10yr_yield", "gold", "dxy", "btc", "eth"):
        val = macro.get(label)
        if val is None:
            continue
        chg = macro.get(f"{label}_change_pct")
        sign = ""
        if chg is not None:
            sign = f" ({chg:+.2f}%)"
        bits.append(f"{label}={val:.2f}{sign}")
    return " · ".join(bits)


def latest_fear_greed() -> dict[str, Any]:
    rows = _read_jsonl(NEWS_DIR / "fear_greed.jsonl")
    if not rows:
        return {}
    rows.sort(key=lambda r: r.get("ts") or "", reverse=True)
    return rows[0]


def latest_crypto_pulse() -> dict[str, Any]:
    rows = _read_jsonl(NEWS_DIR / "crypto_pulse.jsonl")
    if not rows:
        return {}
    rows.sort(key=lambda r: r.get("ts") or "", reverse=True)
    return rows[0]


def format_fear_greed(fg: dict[str, Any]) -> str:
    if not fg:
        return ""
    val = fg.get("value")
    label = fg.get("label", "")
    if val is None:
        return ""
    regime = "risk-on" if val >= 60 else ("risk-off" if val <= 40 else "neutral")
    return f"Fear & Greed: {val}/100 ({label}) — {regime}"


def format_crypto_pulse(cp: dict[str, Any]) -> str:
    if not cp:
        return ""
    parts = []
    for coin in ("btc", "eth", "sol"):
        price = cp.get(coin)
        chg = cp.get(f"{coin}_change_pct")
        if price is None:
            continue
        chg_str = f" ({chg:+.1f}%)" if chg is not None else ""
        parts.append(f"{coin.upper()}=${price:,.0f}{chg_str}")
    return " · ".join(parts)


def latest_trend_score(ticker: str) -> int | None:
    rows = _read_jsonl(RESEARCH_DIR / f"trends_{ticker}.jsonl")
    if not rows:
        return None
    rows.sort(key=lambda r: r.get("ts") or "", reverse=True)
    val = rows[0].get("interest")
    return int(val) if val is not None else None


# COT slug mapping — which CFTC market tracks which of our tickers
_COT_TICKER_MAP: dict[str, str] = {
    "SPY": "sp500_emini",
    "QQQ": "sp500_emini",  # tech follows broad market positioning
    "GC=F": "gold",
    "FCX":  "copper",
    "SCCO": "copper",
    "TECK": "copper",
    "COPX": "copper",
}


def latest_cot(ticker: str) -> dict[str, Any] | None:
    slug = _COT_TICKER_MAP.get(ticker)
    if not slug:
        return None
    rows = _read_jsonl(RESEARCH_DIR / f"cot_{slug}.jsonl")
    if not rows:
        return None
    rows.sort(key=lambda r: r.get("report_date") or "", reverse=True)
    return rows[0]


def format_cot(row: dict[str, Any] | None) -> str:
    if not row:
        return ""
    net = row.get("managed_money_net", row.get("non_comm_net", 0))  # new field name, fallback for legacy rows
    pct = row.get("net_pct_of_oi", 0)
    date = (row.get("report_date") or "")[:10]
    signal = "crowded long — reversal risk" if pct > 15 else (
        "crowded short — squeeze risk" if pct < -15 else "neutral positioning"
    )
    return f"COT ({date}): specs net {net:+,} contracts ({pct:+.1f}% OI) — {signal}"


def format_news(headlines: list[dict]) -> str:
    if not headlines:
        return "(no recent headlines)"
    lines = []
    for h in headlines:
        title = (h.get("title") or "").strip()
        provider = (h.get("provider") or "").strip()
        if not title:
            continue
        # Hard cap title length to keep token budget tight
        if len(title) > 120:
            title = title[:117] + "..."
        lines.append(f"- {title}" + (f"  [{provider}]" if provider else ""))
    return "\n".join(lines) if lines else "(no recent headlines)"


def format_watchlist_for_ticker(agent: str, ticker: str) -> str:
    """Render the agent's current watchlist entry for this ticker, or empty."""
    state = watchlist_state(agent)
    entry = state.get(ticker)
    if not entry:
        return ""
    parts = []
    if entry.get("kind"):
        parts.append(f"watchlist_kind={entry['kind']}")
    if entry.get("thesis"):
        parts.append(f'thesis="{entry["thesis"][:120]}"')
    if entry.get("condition"):
        parts.append(f"trigger={json.dumps(entry['condition'])}")
    if entry.get("stop_loss") is not None:
        parts.append(f"stop_loss=${entry['stop_loss']:.2f}")
    if entry.get("take_profit") is not None:
        parts.append(f"take_profit=${entry['take_profit']:.2f}")
    return " · ".join(parts) if parts else ""


def recent_insider(ticker: str, limit: int = MAX_INSIDER_ROWS) -> list[dict]:
    rows = _read_jsonl(RESEARCH_DIR / f"insider_{ticker}.jsonl")
    rows.sort(key=lambda r: r.get("date") or "", reverse=True)
    return rows[:limit]


def recent_analyst(ticker: str, limit: int = MAX_ANALYST_ROWS) -> list[dict]:
    rows = _read_jsonl(RESEARCH_DIR / f"analyst_{ticker}.jsonl")
    rows.sort(key=lambda r: r.get("date") or "", reverse=True)
    return rows[:limit]


def format_insider(rows: list[dict]) -> str:
    if not rows:
        return ""
    lines = []
    for r in rows:
        date = (r.get("date") or "")[:10]
        ttype = (r.get("transaction") or "").strip()
        insider = (r.get("insider") or "")[:40]
        position = (r.get("position") or "")[:30]
        shares = r.get("shares")
        shares_str = f"{int(shares):,}" if shares else "?"
        lines.append(f"- {date} {ttype:18} {shares_str:>12} sh by {insider} ({position})")
    return "\n".join(lines)


def format_analyst(rows: list[dict]) -> str:
    if not rows:
        return ""
    lines = []
    for r in rows:
        date = (r.get("date") or "")[:10]
        firm = (r.get("firm") or "")[:30]
        action = (r.get("action") or "").lower()
        from_g = (r.get("from_grade") or "").strip()
        to_g = (r.get("to_grade") or "").strip()
        if from_g and to_g:
            lines.append(f"- {date} {firm:30} {action:12} {from_g} -> {to_g}")
        else:
            lines.append(f"- {date} {firm:30} {action:12} {to_g}")
    return "\n".join(lines)


def build_decision_context(agent: str, ticker: str) -> str:
    """Compose the full context block for a (agent, ticker) decision.

    Returns a multi-line string ready to inject into the user prompt.
    Returns empty string if nothing is available — caller can skip.
    """
    headlines = recent_headlines(ticker)
    macro = latest_macro()
    fg = latest_fear_greed()
    cp = latest_crypto_pulse()
    trend = latest_trend_score(ticker)
    cot = latest_cot(ticker)
    watch = format_watchlist_for_ticker(agent, ticker)
    insider = recent_insider(ticker)
    analyst = recent_analyst(ticker)

    blocks = []

    # Macro + crypto sentiment pulse (single block to save tokens)
    macro_str = format_macro(macro)
    fg_str = format_fear_greed(fg)
    cp_str = format_crypto_pulse(cp)
    cot_str = format_cot(cot)
    pulse_lines = [s for s in (macro_str, fg_str, cp_str, cot_str) if s]
    if pulse_lines:
        blocks.append("## Market pulse\n" + "\n".join(pulse_lines))

    if trend is not None:
        blocks.append(f"## Google Trends interest ({ticker}, 7d US): {trend}/100")

    if headlines:
        blocks.append(f"## Recent news for {ticker}\n{format_news(headlines)}")
    if insider:
        blocks.append(f"## Insider activity ({ticker})\n{format_insider(insider)}")
    if analyst:
        blocks.append(f"## Analyst calls ({ticker})\n{format_analyst(analyst)}")
    if watch:
        blocks.append(f"## Your watchlist note for {ticker}\n{watch}")

    return "\n\n".join(blocks)
