from dataclasses import dataclass
from collections import defaultdict
from trading_shadow.decision_log import Decision


@dataclass(frozen=True)
class AccuracyResult:
    asset_class: str
    total_pairs: int
    matches: int
    accuracy: float


def compute_accuracy(decisions: list[Decision], asset_class: str) -> AccuracyResult:
    """Pair claude+shadow decisions on the same (timestamp, ticker) and count action matches."""
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
            if agents["claude"].action == agents["shadow"].action:
                matches += 1
    accuracy = matches / total if total > 0 else 0.0
    return AccuracyResult(asset_class=asset_class, total_pairs=total, matches=matches, accuracy=accuracy)
