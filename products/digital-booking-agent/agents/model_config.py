"""
agents/model_config.py
----------------------

Single source of truth for agent → model mapping. Task #21 (PRD_model_routing.md).

DO NOT hardcode model IDs anywhere else in the codebase. Every agent pulls
its model from `model_for(agent_name)`. Changing tiers = one line here.

Tier floor rules (from PRD, non-negotiable):
  • outbound    → Tier A forever. Brand voice is the product.
  • supervisor  → Tier A for decisions that change agent routing.
  • anything writing customer-facing text → minimum Tier A.
  • reporting / analyst internal → may downgrade once we have Phase-1
    measurement data proving quality holds.

Phase 0 has everything on Sonnet to establish the cost baseline.
Phase 1 will flip the top-2-by-volume to Haiku after the eye-test pass.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


# --------------------------------------------------------------------
# Provider + model inventory
# --------------------------------------------------------------------

@dataclass(frozen=True)
class ModelSpec:
    """One row of the model catalog."""
    model_id: str
    provider: str           # 'anthropic' | 'groq' | 'together' | 'ollama' | ...
    tier: str               # 'A' | 'B' | 'C' | 'D'
    input_per_m_usd: float  # USD per 1M input tokens
    output_per_m_usd: float
    # Anthropic prompt-caching prices (None for providers without caching).
    cache_write_per_m_usd: float | None = None
    cache_read_per_m_usd: float | None = None


# Kept flat so we can add rows as we add providers in Phase 2+.
# Prices reflect Anthropic public pricing as of 2026-04-22; bump when they change.
MODEL_CATALOG: dict[str, ModelSpec] = {
    # -------- Anthropic --------
    "claude-sonnet-4-6": ModelSpec(
        model_id="claude-sonnet-4-6",
        provider="anthropic",
        tier="A",
        input_per_m_usd=3.00,
        output_per_m_usd=15.00,
        cache_write_per_m_usd=3.75,
        cache_read_per_m_usd=0.30,
    ),
    "claude-opus-4-6": ModelSpec(
        model_id="claude-opus-4-6",
        provider="anthropic",
        tier="A",
        input_per_m_usd=15.00,
        output_per_m_usd=75.00,
        cache_write_per_m_usd=18.75,
        cache_read_per_m_usd=1.50,
    ),
    "claude-haiku-4-5": ModelSpec(
        model_id="claude-haiku-4-5-20251001",
        provider="anthropic",
        tier="B",
        input_per_m_usd=0.80,
        output_per_m_usd=4.00,
        cache_write_per_m_usd=1.00,
        cache_read_per_m_usd=0.08,
    ),
    # -------- Placeholders for Phase 2 (Groq / Together) --------
    "llama-3.3-70b-groq": ModelSpec(
        model_id="llama-3.3-70b-versatile",
        provider="groq",
        tier="C",
        input_per_m_usd=0.59,
        output_per_m_usd=0.79,
    ),
    # -------- Tier D (self-hosted, free marginal) --------
    "ollama-qwen2.5-32b": ModelSpec(
        model_id="qwen2.5:32b",
        provider="ollama",
        tier="D",
        input_per_m_usd=0.0,
        output_per_m_usd=0.0,
    ),
}


# --------------------------------------------------------------------
# Agent → model key routing
# --------------------------------------------------------------------
# KEY must exist in MODEL_CATALOG.
# Overridable per-agent via env: DBA_MODEL_<AGENT> (e.g. DBA_MODEL_OUTBOUND=claude-opus-4-6).
# Global override via env: DBA_MODEL_DEFAULT.
# --------------------------------------------------------------------

MODEL_ROUTING: dict[str, str] = {
    # Tier-A floor agents (customer-facing or decision-changing)
    "outbound":   "claude-sonnet-4-6",   # FROZEN — brand voice
    "supervisor": "claude-sonnet-4-6",   # FROZEN — routing decisions
    "research":   "claude-sonnet-4-6",   # citations must be right

    # Candidates for Phase-1 downgrade once eye-test passes
    "inbound":    "claude-sonnet-4-6",   # → claude-haiku-4-5 post-Phase-1
    "routing":    "claude-sonnet-4-6",   # → claude-haiku-4-5 post-Phase-1
    "analyst":    "claude-sonnet-4-6",   # → claude-haiku-4-5 post-Phase-1

    # Candidate for Phase-2 Groq swap
    "reporting":  "claude-sonnet-4-6",   # → llama-3.3-70b-groq post-Phase-2
}


# Agents that must never leave Tier A regardless of env override. The router
# will refuse to call a non-A model for these.
TIER_A_FLOOR: set[str] = {"outbound", "supervisor", "research"}


# --------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------

def model_key_for(agent_name: str) -> str:
    """
    Resolve an agent name to the catalog key for its model. Applies env
    overrides (DBA_MODEL_<AGENT> then DBA_MODEL_DEFAULT), but enforces the
    Tier-A floor for protected agents.
    """
    agent = (agent_name or "").strip().lower()
    if not agent:
        raise ValueError("agent_name is required")

    per_agent_env = f"DBA_MODEL_{agent.upper()}"
    override = os.environ.get(per_agent_env) or os.environ.get("DBA_MODEL_DEFAULT")
    base = MODEL_ROUTING.get(agent)
    if base is None and override is None:
        raise KeyError(
            f"no model configured for agent '{agent}'. "
            f"add it to MODEL_ROUTING in agents/model_config.py."
        )
    chosen = override or base
    if chosen not in MODEL_CATALOG:
        raise KeyError(
            f"agent '{agent}' routed to unknown model key '{chosen}'. "
            f"known keys: {sorted(MODEL_CATALOG)}"
        )
    if agent in TIER_A_FLOOR and MODEL_CATALOG[chosen].tier != "A":
        # Safety: refuse the override, fall back to the configured Tier-A model.
        base_spec = MODEL_CATALOG[base] if base in MODEL_CATALOG else None
        if base_spec and base_spec.tier == "A":
            return base  # type: ignore[return-value]
        # No safe fallback — surface the error rather than silently downgrading.
        raise RuntimeError(
            f"tier-A-floor agent '{agent}' cannot run on "
            f"'{chosen}' (tier {MODEL_CATALOG[chosen].tier}). "
            f"revise MODEL_ROUTING or drop the override."
        )
    return chosen


def spec_for(agent_name: str) -> ModelSpec:
    return MODEL_CATALOG[model_key_for(agent_name)]


def compute_cost_usd(
    model_key: str,
    input_tokens: int,
    output_tokens: int,
    cache_creation_input_tokens: int = 0,
    cache_read_input_tokens: int = 0,
) -> float:
    """
    Cost in USD. Cache tokens are priced separately from regular input when
    the provider supports it; otherwise they fall through to input pricing.
    """
    spec = MODEL_CATALOG[model_key]
    cost = (
        (input_tokens / 1_000_000.0) * spec.input_per_m_usd
        + (output_tokens / 1_000_000.0) * spec.output_per_m_usd
    )
    if cache_creation_input_tokens and spec.cache_write_per_m_usd is not None:
        cost += (cache_creation_input_tokens / 1_000_000.0) * spec.cache_write_per_m_usd
    if cache_read_input_tokens and spec.cache_read_per_m_usd is not None:
        cost += (cache_read_input_tokens / 1_000_000.0) * spec.cache_read_per_m_usd
    return round(cost, 6)
