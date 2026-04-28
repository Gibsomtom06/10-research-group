import json
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Any


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


class DecisionLog:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.touch(exist_ok=True)

    def append(self, decision: Decision) -> None:
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(decision)) + "\n")

    def read_all(self) -> list[Decision]:
        if not self.path.exists():
            return []
        out = []
        for line in self.path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            out.append(Decision(**json.loads(line)))
        return out
