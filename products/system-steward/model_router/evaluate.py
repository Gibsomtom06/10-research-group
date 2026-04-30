"""Evaluate the model router by reading decisions.jsonl.

Surfaces:
  - Total decisions, decisions per model, decisions per rule
  - Cost actual vs cost-if-all-Opus vs cost-if-all-Haiku (savings analysis)
  - Low-confidence decisions (rules that fired with confidence < 0.6)
  - Suspect routes — where we routed cheap on high-stakes tasks (potential safety issue)
  - Suspect routes — where we routed expensive on trivial tasks (potential waste)
  - Catch-all default rate (high catch-all = rules don't cover real workload)

Usage:
    python -m model_router.evaluate
    python -m model_router.evaluate --since 2026-04-30
    python -m model_router.evaluate --json     # machine-readable output

Run this weekly. Use the output to tune rules.yaml.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Run: pip install pyyaml", file=sys.stderr)
    sys.exit(1)


HERE = Path(__file__).resolve().parent
LOG_PATH = HERE / "decisions.jsonl"
COST_PATH = HERE / "cost_table.yaml"


def _load_decisions(since: str | None) -> list[dict]:
    if not LOG_PATH.exists():
        return []
    out = []
    cutoff = None
    if since:
        try:
            cutoff = datetime.fromisoformat(since.replace("Z", "+00:00"))
            if cutoff.tzinfo is None:
                cutoff = cutoff.replace(tzinfo=timezone.utc)
        except ValueError:
            print(f"WARN: bad --since format: {since}; ignoring", file=sys.stderr)
            cutoff = None
    for line in LOG_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        d = json.loads(line)
        if cutoff is not None:
            ts = datetime.fromisoformat(d["timestamp"].replace("Z", "+00:00"))
            if ts < cutoff:
                continue
        out.append(d)
    return out


def _load_costs() -> dict:
    if not COST_PATH.exists():
        return {"models": {}}
    return yaml.safe_load(COST_PATH.read_text(encoding="utf-8")) or {"models": {}}


def _cost_if_all(decisions: list[dict], target_model: str, costs: dict) -> float:
    info = costs.get("models", {}).get(target_model)
    if info is None:
        return 0.0
    total = 0.0
    for d in decisions:
        in_t = d.get("estimated_input_tokens", 0) or 0
        out_t = d.get("estimated_output_tokens", 0) or 0
        total += (in_t / 1_000_000) * info["input_per_mtok_usd"]
        total += (out_t / 1_000_000) * info["output_per_mtok_usd"]
    return total


def evaluate(decisions: list[dict]) -> dict[str, Any]:
    if not decisions:
        return {"empty": True}

    costs = _load_costs()

    by_model = Counter(d["model"] for d in decisions)
    by_rule = Counter(d["rule_name"] for d in decisions)
    actual_cost = sum(d.get("estimated_cost_usd", 0.0) or 0.0 for d in decisions)
    cost_if_all_opus = _cost_if_all(decisions, "claude-opus-4-7", costs)
    cost_if_all_haiku = _cost_if_all(decisions, "claude-haiku-4-5", costs)
    cost_if_all_sonnet = _cost_if_all(decisions, "claude-sonnet-4-6", costs)

    low_confidence = [d for d in decisions if d.get("confidence", 1.0) < 0.6]

    catch_all = [d for d in decisions if d.get("rule_name", "").startswith("unmatched")]

    # Suspect routes: high stakes routed to a cheap model
    cheap_high_stakes = [
        d for d in decisions
        if d.get("stakes") == "high" and d.get("model") == "claude-haiku-4-5"
    ]

    # Suspect routes: trivial keywords routed to Opus
    trivial_keywords = ("git commit", "rename", "move file", "extract field", "json to csv")
    expensive_trivial = [
        d for d in decisions
        if d.get("model") == "claude-opus-4-7"
        and any(k in d.get("task_description", "").lower() for k in trivial_keywords)
    ]

    return {
        "empty": False,
        "total_decisions": len(decisions),
        "by_model": dict(by_model),
        "by_rule": dict(by_rule),
        "actual_cost_usd": round(actual_cost, 4),
        "cost_if_all_opus_usd": round(cost_if_all_opus, 4),
        "cost_if_all_sonnet_usd": round(cost_if_all_sonnet, 4),
        "cost_if_all_haiku_usd": round(cost_if_all_haiku, 4),
        "savings_vs_opus_usd": round(cost_if_all_opus - actual_cost, 4),
        "savings_vs_opus_pct": round((1 - actual_cost / cost_if_all_opus) * 100, 1) if cost_if_all_opus > 0 else 0.0,
        "low_confidence_count": len(low_confidence),
        "low_confidence_examples": low_confidence[:5],
        "catch_all_count": len(catch_all),
        "catch_all_pct": round(len(catch_all) / len(decisions) * 100, 1) if decisions else 0.0,
        "cheap_on_high_stakes_count": len(cheap_high_stakes),
        "cheap_on_high_stakes_examples": cheap_high_stakes[:5],
        "expensive_on_trivial_count": len(expensive_trivial),
        "expensive_on_trivial_examples": expensive_trivial[:5],
    }


def render_human(eval_result: dict) -> str:
    if eval_result.get("empty"):
        return "No decisions logged yet. Route some tasks first, then re-run."

    out = []
    out.append("=" * 60)
    out.append("MODEL ROUTER EVALUATION")
    out.append("=" * 60)
    out.append(f"Total decisions      : {eval_result['total_decisions']}")
    out.append("")
    out.append("By model:")
    for m, c in eval_result["by_model"].items():
        out.append(f"  {m:30s} {c:5d}")
    out.append("")
    out.append("By rule:")
    for r, c in sorted(eval_result["by_rule"].items(), key=lambda x: -x[1]):
        out.append(f"  {r:30s} {c:5d}")
    out.append("")
    out.append("Cost analysis:")
    out.append(f"  Actual                  ${eval_result['actual_cost_usd']:.4f}")
    out.append(f"  If all Opus             ${eval_result['cost_if_all_opus_usd']:.4f}")
    out.append(f"  If all Sonnet           ${eval_result['cost_if_all_sonnet_usd']:.4f}")
    out.append(f"  If all Haiku            ${eval_result['cost_if_all_haiku_usd']:.4f}")
    out.append(f"  Savings vs Opus         ${eval_result['savings_vs_opus_usd']:.4f}  ({eval_result['savings_vs_opus_pct']}%)")
    out.append("")
    out.append("Quality flags:")
    out.append(f"  Catch-all default rate  {eval_result['catch_all_pct']}%   (high = rules don't cover workload)")
    out.append(f"  Low-confidence decisions {eval_result['low_confidence_count']}    (rules that fired below 0.6 confidence)")
    out.append(f"  Cheap on high-stakes     {eval_result['cheap_on_high_stakes_count']}    (potential SAFETY issue)")
    out.append(f"  Expensive on trivial     {eval_result['expensive_on_trivial_count']}    (potential cost waste)")
    out.append("")
    if eval_result['cheap_on_high_stakes_count'] > 0:
        out.append("WARN — cheap model on high-stakes tasks:")
        for d in eval_result['cheap_on_high_stakes_examples']:
            out.append(f"  - {d['task_description'][:80]}  -> {d['model']}")
    if eval_result['expensive_on_trivial_count'] > 0:
        out.append("INFO — Opus on trivial tasks:")
        for d in eval_result['expensive_on_trivial_examples']:
            out.append(f"  - {d['task_description'][:80]}  -> {d['model']}")
    out.append("")
    out.append("To tune: edit rules.yaml. Order matters; first match wins.")
    out.append("=" * 60)
    return "\n".join(out)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate model router decisions.")
    parser.add_argument("--since", help="ISO date — only evaluate decisions after this timestamp")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON instead")
    args = parser.parse_args()

    decisions = _load_decisions(args.since)
    result = evaluate(decisions)

    if args.json:
        print(json.dumps(result, indent=2, default=str))
    else:
        print(render_human(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
