from dataclasses import dataclass
from collections import defaultdict
from trading_shadow.decision_log import Decision


@dataclass(frozen=True)
class AccuracyResult:
    asset_class: str
    total_pairs: int
    matches: int
    accuracy: float


_ACTION_ALIASES = {"long": "buy", "short": "sell"}


def _normalize_action(action: str) -> str:
    a = (action or "").strip().lower()
    return _ACTION_ALIASES.get(a, a)


def compute_accuracy(decisions: list[Decision], asset_class: str) -> AccuracyResult:
    """Pair claude+shadow decisions on the same (timestamp, ticker) and count action matches.

    Action comparison is case-insensitive and treats LONG/SHORT as aliases for buy/sell.
    Historical logs have a mix of casings (claude=lowercase, shadow=UPPERCASE) and a
    literal string compare silently understates agreement (~7-8 percentage points).
    """
    by_key: dict[tuple, dict[str, Decision]] = defaultdict(dict)
    for d in decisions:
        if d.market_state.get("asset_class", "equities") != asset_class:
            continue
        key = (d.timestamp, d.ticker)
        by_key[key][d.agent] = d

    total = 0
    matches = 0
    for key, agents in by_key.items():
        if "claude" in agents and "shadow" in agents:
            total += 1
            if _normalize_action(agents["claude"].action) == _normalize_action(agents["shadow"].action):
                matches += 1
    accuracy = matches / total if total > 0 else 0.0
    return AccuracyResult(asset_class=asset_class, total_pairs=total, matches=matches, accuracy=accuracy)
