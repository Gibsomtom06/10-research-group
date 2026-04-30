"""Model Router — picks the cheapest sufficient Claude model for a task.

Reads `rules.yaml` (routing rules, ordered) and `cost_table.yaml` (pricing).
Logs every decision to `decisions.jsonl` for evaluation.

Usage:
    from model_router.router import route
    decision = route(
        task_description="commit the spec file to umbrella repo",
        stakes="low",
        reversibility="reversible",
        token_volume="low",
    )
    # decision.model = "claude-haiku-4-5"
    # decision.reasoning = "Atomic git ops with clear correct output."

CLI:
    python -m model_router.router "commit the spec file" --stakes low

Designed to be importable from any project (DBA, trading-shadow, the platform)
OR invoked as a CLI by Thomas / Claude Code per todo.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Run: pip install pyyaml", file=sys.stderr)
    sys.exit(1)


HERE = Path(__file__).resolve().parent
RULES_PATH = HERE / "rules.yaml"
COST_PATH = HERE / "cost_table.yaml"
LOG_PATH = HERE / "decisions.jsonl"


@dataclass(frozen=True)
class Decision:
    """A routing decision. Logged for evaluation."""
    timestamp: str
    task_description: str
    stakes: str
    reversibility: str
    token_volume: str
    model: str
    rule_name: str
    reasoning: str
    confidence: float
    estimated_cost_usd: float          # if estimated tokens provided
    estimated_input_tokens: int = 0
    estimated_output_tokens: int = 0
    extra_context: dict[str, Any] = field(default_factory=dict)


def _load_yaml(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Missing config: {path}")
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _kw_match(task_lower: str, keyword: str) -> bool:
    """Word-boundary keyword match (fixes the v1 substring bug where 'class'
    matched 'classify'). For multi-word keywords, the whole phrase is matched
    as one chunk, again with word boundaries on the outsides."""
    keyword_lower = keyword.lower().strip()
    if not keyword_lower:
        return False
    # Escape regex metachars in the keyword, allow internal whitespace flex
    escaped = re.escape(keyword_lower).replace(r"\ ", r"\s+")
    pattern = rf"\b{escaped}\b"
    return re.search(pattern, task_lower) is not None


def _matches(task_lower: str, rule: dict, ctx: dict) -> bool:
    """Return True if all conditions in rule['matches'] match the task + context."""
    matches_block = rule.get("matches") or {}

    # Handle empty matches dict (catch-all)
    if not matches_block:
        return True

    # keywords (any match — word boundary)
    if "keywords" in matches_block:
        keywords = matches_block["keywords"]
        if not any(_kw_match(task_lower, kw) for kw in keywords):
            return False

    # keywords_all (all must match — word boundary)
    if "keywords_all" in matches_block:
        kws = matches_block["keywords_all"]
        if not all(_kw_match(task_lower, kw) for kw in kws):
            return False

    # stakes (caller-provided context)
    if "stakes" in matches_block:
        allowed = matches_block["stakes"]
        if isinstance(allowed, str):
            allowed = [allowed]
        if ctx.get("stakes", "medium") not in allowed:
            return False

    # reversibility
    if "reversibility" in matches_block:
        allowed = matches_block["reversibility"]
        if isinstance(allowed, str):
            allowed = [allowed]
        if ctx.get("reversibility", "reversible") not in allowed:
            return False

    # token_volume
    if "token_volume" in matches_block:
        allowed = matches_block["token_volume"]
        if isinstance(allowed, str):
            allowed = [allowed]
        if ctx.get("token_volume", "low") not in allowed:
            return False

    return True


def _estimate_cost(model: str, costs: dict, in_tokens: int, out_tokens: int) -> float:
    """Estimate cost in USD given expected token volumes."""
    info = costs.get("models", {}).get(model)
    if info is None:
        return 0.0
    cost_in = (in_tokens / 1_000_000) * info["input_per_mtok_usd"]
    cost_out = (out_tokens / 1_000_000) * info["output_per_mtok_usd"]
    return round(cost_in + cost_out, 6)


def route(
    task_description: str,
    *,
    stakes: str = "medium",
    reversibility: str = "reversible",
    token_volume: str = "low",
    estimated_input_tokens: int = 0,
    estimated_output_tokens: int = 0,
    extra_context: Optional[dict[str, Any]] = None,
    log: bool = True,
) -> Decision:
    """Route a task to the cheapest sufficient model.

    Args:
        task_description: free-form description of what the task does
        stakes: "low" / "medium" / "high" — financial / safety stakes
        reversibility: "reversible" / "irreversible"
        token_volume: "low" (<5K) / "medium" (<50K) / "high" (>=50K) — total
        estimated_input_tokens: optional precise number for cost calc
        estimated_output_tokens: optional precise number for cost calc
        extra_context: any additional key/value the rules may reference
        log: write decision to decisions.jsonl (default True)

    Returns:
        Decision dataclass with model + reasoning + cost estimate.
    """
    rules_doc = _load_yaml(RULES_PATH)
    costs = _load_yaml(COST_PATH)

    ctx = {
        "stakes": stakes,
        "reversibility": reversibility,
        "token_volume": token_volume,
        **(extra_context or {}),
    }

    task_lower = task_description.lower()

    chosen_rule = None
    for rule in rules_doc.get("rules", []):
        if _matches(task_lower, rule, ctx):
            chosen_rule = rule
            break

    if chosen_rule is None:
        # Should not happen — last rule is catch-all — but be defensive.
        chosen_rule = {
            "name": "no-match-emergency-default",
            "model": "claude-sonnet-4-6",
            "reasoning": "No rule matched (rules misconfigured?). Defaulting to Sonnet.",
            "confidence": 0.0,
        }

    cost = _estimate_cost(
        chosen_rule["model"],
        costs,
        estimated_input_tokens,
        estimated_output_tokens,
    )

    decision = Decision(
        timestamp=datetime.now(timezone.utc).isoformat(),
        task_description=task_description,
        stakes=stakes,
        reversibility=reversibility,
        token_volume=token_volume,
        model=chosen_rule["model"],
        rule_name=chosen_rule["name"],
        reasoning=chosen_rule["reasoning"],
        confidence=float(chosen_rule.get("confidence", 0.5)),
        estimated_cost_usd=cost,
        estimated_input_tokens=estimated_input_tokens,
        estimated_output_tokens=estimated_output_tokens,
        extra_context=extra_context or {},
    )

    if log:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        LOG_PATH.touch(exist_ok=True)
        with LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(decision)) + "\n")

    return decision


def main() -> int:
    parser = argparse.ArgumentParser(description="Pick the right Claude model for a task.")
    parser.add_argument("task", nargs="+", help="Task description (free text)")
    parser.add_argument("--stakes", default="medium", choices=["low", "medium", "high"])
    parser.add_argument("--reversibility", default="reversible", choices=["reversible", "irreversible"])
    parser.add_argument("--token-volume", default="low", choices=["low", "medium", "high"])
    parser.add_argument("--in-tokens", type=int, default=0)
    parser.add_argument("--out-tokens", type=int, default=0)
    parser.add_argument("--no-log", action="store_true", help="Skip writing to decisions.jsonl")
    args = parser.parse_args()

    decision = route(
        task_description=" ".join(args.task),
        stakes=args.stakes,
        reversibility=args.reversibility,
        token_volume=args.token_volume,
        estimated_input_tokens=args.in_tokens,
        estimated_output_tokens=args.out_tokens,
        log=not args.no_log,
    )

    print(f"Model      : {decision.model}")
    print(f"Rule       : {decision.rule_name}")
    print(f"Reasoning  : {decision.reasoning}")
    print(f"Confidence : {decision.confidence}")
    if decision.estimated_cost_usd > 0:
        print(f"Est. cost  : ${decision.estimated_cost_usd:.6f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
