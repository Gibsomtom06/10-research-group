import json
from dataclasses import dataclass
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


def _build_user_prompt(signal_summary: str, sma20: float, current_price: float, rsi: float, account: AccountState, track: str, live: bool) -> str:
    return f"""Track: {track}
Mode: {'LIVE' if live else 'PAPER'}
Account: cash=${account.cash:.2f}, equity=${account.equity:.2f}
Strategy signal: {signal_summary}
20-day SMA: ${sma20:.2f}
Current price: ${current_price:.2f}
RSI: {rsi:.1f}

Decide. Output JSON only."""


def decide(*, client: Anthropic, signal_summary: str, sma20: float, current_price: float, rsi: float, account: AccountState, track: str, live: bool, model: str = "claude-sonnet-4-6") -> TraderDecision:
    user = _build_user_prompt(signal_summary, sma20, current_price, rsi, account, track, live)
    resp = client.messages.create(
        model=model,
        max_tokens=512,
        system=CLAUDE_TRADER_SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    raw = resp.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`").lstrip("json").strip()
    try:
        parsed = json.loads(raw)
        return TraderDecision(
            action=parsed.get("action", "hold"),
            size_usd=float(parsed.get("size_usd", 0.0)),
            reasoning=parsed.get("reasoning", ""),
            confidence=float(parsed.get("confidence", 0.0)),
        )
    except (json.JSONDecodeError, ValueError, KeyError):
        return TraderDecision(action="hold", size_usd=0.0, reasoning=f"Parse failure: {raw[:100]}", confidence=0.0)
