import json
import uuid
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Any, Optional


@dataclass(frozen=True)
class Decision:
    timestamp: str
    track: str  # "A" or "B"
    agent: str  # "claude" or "shadow"
    ticker: str
    action: str  # "buy" | "sell" | "hold"
    size_usd: float
    reasoning: str
    market_state: dict[str, Any] = field(default_factory=dict)
    # Rollback primitive (per strategic-review Risk 2 — ReAgent-style backtracking).
    # decision_id uniquely identifies this entry; prior_state_id chains to the
    # previous safe state for the same (track, agent) so we can replay or revert.
    decision_id: str = ""
    prior_state_id: Optional[str] = None

    @staticmethod
    def new_id() -> str:
        return uuid.uuid4().hex


class DecisionLog:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.touch(exist_ok=True)

    def append(self, decision: Decision) -> Decision:
        # Auto-fill decision_id and chain prior_state_id to the latest decision
        # on the same (track, agent) lineage if not explicitly provided.
        if not decision.decision_id:
            prior = self._latest_for(decision.track, decision.agent)
            decision = Decision(
                timestamp=decision.timestamp,
                track=decision.track,
                agent=decision.agent,
                ticker=decision.ticker,
                action=decision.action,
                size_usd=decision.size_usd,
                reasoning=decision.reasoning,
                market_state=decision.market_state,
                decision_id=Decision.new_id(),
                prior_state_id=decision.prior_state_id or (prior.decision_id if prior else None),
            )
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(decision)) + "\n")
        return decision

    def read_all(self) -> list[Decision]:
        if not self.path.exists():
            return []
        out = []
        for line in self.path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            raw = json.loads(line)
            # Backward-compatible: legacy entries lack decision_id / prior_state_id.
            raw.setdefault("decision_id", "")
            raw.setdefault("prior_state_id", None)
            out.append(Decision(**raw))
        return out

    def _latest_for(self, track: str, agent: str) -> Optional[Decision]:
        """Most recent decision on a given (track, agent) lineage."""
        for d in reversed(self.read_all()):
            if d.track == track and d.agent == agent:
                return d
        return None

    def rollback_to(self, state_id: str) -> list[Decision]:
        """Return the chain of decisions UP TO AND INCLUDING `state_id`.

        This is the read-side rollback primitive. Callers replay strategy from
        the returned chain. The on-disk JSONL is append-only — rollback never
        deletes rows. Use this to drive 'revert to safe state' behavior.

        Raises ValueError if state_id is not found.
        """
        all_decisions = self.read_all()
        for i, d in enumerate(all_decisions):
            if d.decision_id == state_id:
                return all_decisions[: i + 1]
        raise ValueError(f"decision_id not found in log: {state_id}")
