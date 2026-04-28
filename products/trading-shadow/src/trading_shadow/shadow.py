import json
import ollama

from trading_shadow.alpaca_client import AccountState
from trading_shadow.claude_trader import TraderDecision, _build_user_prompt
from trading_shadow.prompts import SHADOW_SYSTEM


def shadow_predict(*, model: str, signal_summary: str, sma20: float, current_price: float, rsi: float, account: AccountState, track: str, live: bool) -> TraderDecision:
    user = _build_user_prompt(signal_summary, sma20, current_price, rsi, account, track, live)
    resp = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": SHADOW_SYSTEM},
            {"role": "user", "content": user},
        ],
        options={"temperature": 0.2},
    )
    raw = resp["message"]["content"].strip()
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
        return TraderDecision(action="hold", size_usd=0.0, reasoning=f"Shadow parse failure: {raw[:100]}", confidence=0.0)
