import json
from dataclasses import dataclass, field
from typing import Literal
from anthropic import Anthropic
from trading_shadow.alpaca_client import AccountState
from trading_shadow.prompts_v2 import CLAUDE_TRADER_SYSTEM  # 2026-04-30: swapped from prompts (v1) to prompts_v2. v1 still in tree as baseline; revert by importing from `prompts` instead.


@dataclass(frozen=True)
class TraderDecision:
    action: Literal["buy", "sell", "hold"]
    size_usd: float
    reasoning: str
    confidence: float
    # Optional list of watchlist event dicts the agent wants to record:
    #   {"ticker": "...", "kind": "add|trigger|remove|stop|note", "thesis": "...",
    #    "condition": {...}, "stop_loss": float, "take_profit": float, "notes": "..."}
    # Default empty list — agent can omit the field entirely.
    watchlist_updates: list = field(default_factory=list)


def _build_user_prompt(signal_summary: str, sma20: float, current_price: float, rsi: float, account: AccountState, track: str, live: bool, ticker: str = "", agent: str = "claude") -> str:
    """Build the per-decision user prompt.

    If `ticker` and `agent` are provided, also injects:
      - macro pulse (vix, oil, 10yr, gold, dxy)
      - top 3 recent headlines for the ticker
      - the agent's current watchlist entry for the ticker (if any)

    Context loading is best-effort — failures silently degrade to the
    base prompt rather than crashing the decision.
    """
    base = f"""Ticker: {ticker or '(unspecified)'}
Track: {track}
Mode: {'LIVE' if live else 'PAPER'}
Account: cash=${account.cash:.2f}, equity=${account.equity:.2f}
Strategy signal: {signal_summary}
20-day SMA: ${sma20:.2f}
Current price: ${current_price:.2f}
RSI: {rsi:.1f}"""

    if ticker:
        try:
            from trading_shadow.context import build_decision_context
            ctx = build_decision_context(agent=agent, ticker=ticker)
            if ctx:
                base += "\n\n" + ctx
        except Exception:
            # Context is enrichment, never blocking — silently skip
            pass

    base += "\n\nDecide. Output JSON only."
    return base


def decide(*, client: Anthropic, signal_summary: str, sma20: float, current_price: float, rsi: float, account: AccountState, track: str, live: bool, ticker: str = "", agent: str = "claude", model: str = "claude-sonnet-4-6") -> TraderDecision:
    user = _build_user_prompt(signal_summary, sma20, current_price, rsi, account, track, live, ticker=ticker, agent=agent)
    # Prompt caching: the system prompt is identical for every call across
    # tickers, tracks, and passes. Cache it so calls 2..N within the 5-min
    # TTL window read at $0.30/MT instead of $3.00/MT. With a per-pass
    # burst of 10 calls (5 tickers x 2 tracks) issued in seconds, only the
    # first call per pass writes cache; the other 9 hit it. The user
    # message stays uncached because it changes every call.
    resp = client.messages.create(
        model=model,
        max_tokens=512,
        system=[
            {
                "type": "text",
                "text": CLAUDE_TRADER_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user}],
    )
    raw = resp.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`").lstrip("json").strip()
    try:
        parsed = json.loads(raw)
        wl_updates = parsed.get("watchlist_updates") or []
        if not isinstance(wl_updates, list):
            wl_updates = []
        return TraderDecision(
            action=parsed.get("action", "hold"),
            size_usd=float(parsed.get("size_usd", 0.0)),
            reasoning=parsed.get("reasoning", ""),
            confidence=float(parsed.get("confidence", 0.0)),
            watchlist_updates=wl_updates,
        )
    except (json.JSONDecodeError, ValueError, KeyError):
        return TraderDecision(action="hold", size_usd=0.0, reasoning=f"Parse failure: {raw[:100]}", confidence=0.0)
