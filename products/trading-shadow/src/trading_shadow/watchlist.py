"""Per-agent watchlist + position triggers.

Storage model: append-only JSONL per agent at data/watchlist/{agent}.jsonl.
Each row is one watchlist event:
  - kind="add"     → put a ticker on the watchlist with a thesis
  - kind="remove"  → take a ticker off (thesis invalidated, or position taken)
  - kind="trigger" → declare an explicit if-X-then-Y rule
  - kind="stop"    → declare a stop-loss / take-profit level for an open position
  - kind="note"    → free-form observation that doesn't change state

Why append-only: same model as decision_log — every change is auditable
and can be replayed. The "current state" is computed by walking the log.

This module is intentionally NOT wired into runner.py on cutover day.
Post-cutover we'll:
1. Inject `current_state(agent)` into the user prompt so agents see what
   they were watching last pass.
2. Parse a new `watchlist_updates` field from the JSON response and
   call append() for each update.
3. Check triggers against current price BEFORE asking the agent to
   decide — if a trigger fires, execute it directly and skip the LLM
   call for that ticker (saves API spend and removes "did the agent
   forget its own rule?" risk).
"""
from __future__ import annotations

import json
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

WATCHLIST_DIR = Path("data/watchlist")
WATCHLIST_DIR.mkdir(parents=True, exist_ok=True)

WatchKind = Literal["add", "remove", "trigger", "stop", "note"]


@dataclass(frozen=True)
class WatchEvent:
    timestamp: str
    agent: str
    ticker: str
    kind: WatchKind
    thesis: str = ""
    # Trigger-specific: condition is a structured rule the runner can check
    # e.g. {"price_above": 48.50, "rsi_above": 55}
    condition: dict[str, Any] = field(default_factory=dict)
    # Stop-specific: explicit SL/TP levels for open position
    stop_loss: float | None = None
    take_profit: float | None = None
    # Free-form context
    notes: str = ""


def _path(agent: str) -> Path:
    return WATCHLIST_DIR / f"{agent}.jsonl"


def append(agent: str, event: WatchEvent) -> None:
    path = _path(agent)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(asdict(event), ensure_ascii=False, default=str) + "\n")


def read_all(agent: str) -> list[WatchEvent]:
    path = _path(agent)
    if not path.exists():
        return []
    out: list[WatchEvent] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            d = json.loads(line)
            out.append(WatchEvent(**d))
        except Exception:
            continue
    return out


def current_state(agent: str) -> dict[str, dict[str, Any]]:
    """Walk the log and compute the current watchlist state per ticker.

    Returns: {ticker: {kind, thesis, condition, stop_loss, take_profit, last_event_ts}}
    A ticker is "on watchlist" if its most recent event was add|trigger|stop
    and not subsequently `remove`d.
    """
    state: dict[str, dict[str, Any]] = {}
    for e in read_all(agent):
        if e.kind == "remove":
            state.pop(e.ticker, None)
            continue
        slot = state.setdefault(e.ticker, {
            "kind": None, "thesis": "", "condition": {},
            "stop_loss": None, "take_profit": None, "last_event_ts": None,
        })
        slot["kind"] = e.kind
        if e.thesis:
            slot["thesis"] = e.thesis
        if e.condition:
            slot["condition"] = e.condition
        if e.stop_loss is not None:
            slot["stop_loss"] = e.stop_loss
        if e.take_profit is not None:
            slot["take_profit"] = e.take_profit
        slot["last_event_ts"] = e.timestamp
    return state


def check_trigger(condition: dict[str, Any], price: float, rsi: float) -> bool:
    """Evaluate a structured trigger condition against current market state.

    Supported keys (all conditions ANDed together; missing means "any"):
      price_above / price_below
      rsi_above / rsi_below
    """
    if not condition:
        return False
    if "price_above" in condition and not (price > float(condition["price_above"])):
        return False
    if "price_below" in condition and not (price < float(condition["price_below"])):
        return False
    if "rsi_above" in condition and not (rsi > float(condition["rsi_above"])):
        return False
    if "rsi_below" in condition and not (rsi < float(condition["rsi_below"])):
        return False
    return True


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
