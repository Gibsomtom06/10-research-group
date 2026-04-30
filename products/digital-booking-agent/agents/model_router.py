"""
agents/model_router.py
----------------------

Thin provider-agnostic wrapper. Every agent calls `run_agent_model(...)`
instead of instantiating Anthropic() directly. That gives us:

  • one place to swap tiers (per-agent via model_config)
  • automatic cost + token logging into the `model_calls` Supabase table
  • a uniform response shape regardless of provider

Phase 0 only supports provider='anthropic'. Phase 2 adds Groq/Together.

Usage from an agent:

    from agents.model_router import run_agent_model
    result = run_agent_model(
        agent_name="outbound",
        system_prompt=system_prompt,
        payload=payload,
        task_type="draft_outbound",
        context={"outreach_log_id": log_id},
        max_tokens=1200,
    )
    parsed_json = result["parsed_json"]  # or result["text"] for raw text
"""

from __future__ import annotations

import json
import os
import time
from typing import Any

try:
    from .model_config import (
        MODEL_CATALOG,
        compute_cost_usd,
        model_key_for,
        spec_for,
    )
except ImportError:
    # Fallback when model_router is imported via a path-injected `agents.`
    # namespace (agents are often run as `python agents/outbound.py`).
    import sys as _sys
    from pathlib import Path as _P
    _sys.path.insert(0, str(_P(__file__).resolve().parent.parent))
    from agents.model_config import (  # type: ignore[no-redef]
        MODEL_CATALOG,
        compute_cost_usd,
        model_key_for,
        spec_for,
    )


_LOG_TABLE = "model_calls"


# --------------------------------------------------------------------
# Supabase singleton (service role) — same pattern the other scripts use.
# Router logging is best-effort; we never let a log-write failure kill
# the agent call.
# --------------------------------------------------------------------

_sb_cache: Any = None


def _sb():
    global _sb_cache
    if _sb_cache is not None:
        return _sb_cache
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    if not (url and key):
        return None
    try:
        from supabase import create_client
        _sb_cache = create_client(url, key)
        return _sb_cache
    except Exception:  # pragma: no cover — best-effort
        return None


def _log_call(row: dict) -> None:
    sb = _sb()
    if sb is None:
        return
    try:
        sb.table(_LOG_TABLE).insert(row).execute()
    except Exception as e:  # pragma: no cover — never break on log failure
        # Keep noise out of production logs; print for local dev visibility.
        print(f"[model_router] warning: log write failed: {e}")


# --------------------------------------------------------------------
# JSON-fence stripper shared across agents
# --------------------------------------------------------------------

def strip_json_fences(text: str) -> str:
    t = (text or "").strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1]
        if t.startswith("json"):
            t = t[4:]
        t = t.strip("` \n")
    return t


# --------------------------------------------------------------------
# Anthropic path
# --------------------------------------------------------------------

def _call_anthropic(
    model_id: str,
    system_prompt: str,
    payload: dict,
    max_tokens: int,
    tools: list[dict] | None,
) -> tuple[str, dict]:
    """Returns (raw_text, usage_dict)."""
    try:
        from anthropic import Anthropic
    except ImportError as e:
        raise RuntimeError("missing dep: pip install anthropic") from e

    client = Anthropic()
    kwargs: dict[str, Any] = {
        "model": model_id,
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": json.dumps(payload, indent=2)}],
    }
    if tools:
        kwargs["tools"] = tools
    msg = client.messages.create(**kwargs)
    text = "".join(
        b.text for b in msg.content
        if getattr(b, "type", "") == "text"
    )
    u = getattr(msg, "usage", None)
    usage = {
        "input_tokens": getattr(u, "input_tokens", 0) or 0,
        "output_tokens": getattr(u, "output_tokens", 0) or 0,
        "cache_creation_input_tokens":
            getattr(u, "cache_creation_input_tokens", 0) or 0,
        "cache_read_input_tokens":
            getattr(u, "cache_read_input_tokens", 0) or 0,
    }
    return text, usage


# --------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------

def run_agent_model(
    agent_name: str,
    system_prompt: str,
    payload: dict,
    *,
    task_type: str | None = None,
    context: dict | None = None,
    max_tokens: int = 1500,
    tools: list[dict] | None = None,
    parse_json: bool = True,
    tenant_id: str | None = None,
    artist_id: str | None = None,
) -> dict:
    """
    Call the model routed for `agent_name`, log usage, and return:
        {
          "text": <raw string>,
          "parsed_json": <dict | None>,
          "model_id": "...",
          "provider": "...",
          "usage": {...},
          "cost_usd": <float>,
          "latency_ms": <int>,
          "success": True/False,
          "error": <str | None>,
        }

    A provider error is caught, logged with success=False, and re-raised.
    """
    key = model_key_for(agent_name)
    spec = spec_for(agent_name)

    started = time.monotonic()
    text: str = ""
    usage: dict = {
        "input_tokens": 0, "output_tokens": 0,
        "cache_creation_input_tokens": 0, "cache_read_input_tokens": 0,
    }
    success = True
    error_code: str | None = None
    error_message: str | None = None

    try:
        if spec.provider == "anthropic":
            text, usage = _call_anthropic(
                spec.model_id, system_prompt, payload, max_tokens, tools,
            )
        else:
            raise RuntimeError(
                f"provider '{spec.provider}' not yet wired into model_router "
                f"(phase 2 work — see PRD_model_routing.md)."
            )
    except Exception as e:
        success = False
        error_code = e.__class__.__name__
        error_message = str(e)[:2000]
    finally:
        latency_ms = int((time.monotonic() - started) * 1000)

    cost_usd = compute_cost_usd(
        key,
        input_tokens=usage["input_tokens"],
        output_tokens=usage["output_tokens"],
        cache_creation_input_tokens=usage["cache_creation_input_tokens"],
        cache_read_input_tokens=usage["cache_read_input_tokens"],
    )

    _log_call({
        "tenant_id": tenant_id,
        "artist_id": artist_id,
        "agent_name": agent_name,
        "model_id": spec.model_id,
        "task_type": task_type,
        "input_tokens": usage["input_tokens"],
        "output_tokens": usage["output_tokens"],
        "cache_creation_input_tokens": usage["cache_creation_input_tokens"],
        "cache_read_input_tokens": usage["cache_read_input_tokens"],
        "latency_ms": latency_ms,
        "cost_usd": cost_usd,
        "provider": spec.provider,
        "success": success,
        "error_code": error_code,
        "error_message": error_message,
        "context": context or {},
    })

    if not success:
        # Bubble the original error to the agent; logging already happened.
        raise RuntimeError(f"{error_code}: {error_message}")

    parsed = None
    if parse_json and text:
        try:
            parsed = json.loads(strip_json_fences(text))
        except Exception:
            parsed = None

    return {
        "text": text,
        "parsed_json": parsed,
        "model_id": spec.model_id,
        "provider": spec.provider,
        "usage": usage,
        "cost_usd": cost_usd,
        "latency_ms": latency_ms,
        "success": success,
        "error": error_message,
    }


# --------------------------------------------------------------------
# Convenience: agent-side migration helper that matches the legacy
# `call_model(system_prompt, payload) -> dict` shape used across
# analyst.py / outbound.py / inbound.py / routing.py.
# --------------------------------------------------------------------

def call_json(
    agent_name: str,
    system_prompt: str,
    payload: dict,
    *,
    task_type: str | None = None,
    context: dict | None = None,
    max_tokens: int = 1500,
    tools: list[dict] | None = None,
    tenant_id: str | None = None,
    artist_id: str | None = None,
) -> dict:
    """
    Drop-in replacement for the old `call_model(...)` pattern. Returns the
    parsed JSON directly (raises on unparseable JSON — existing agents
    already assumed that behavior).
    """
    res = run_agent_model(
        agent_name=agent_name,
        system_prompt=system_prompt,
        payload=payload,
        task_type=task_type,
        context=context,
        max_tokens=max_tokens,
        tools=tools,
        parse_json=True,
        tenant_id=tenant_id,
        artist_id=artist_id,
    )
    if res["parsed_json"] is None:
        # Preserve the legacy contract: raise so the agent's error handler fires.
        raise ValueError(
            f"{agent_name}: model returned non-JSON text "
            f"({len(res['text'])} chars). First 200: {res['text'][:200]!r}"
        )
    return res["parsed_json"]
