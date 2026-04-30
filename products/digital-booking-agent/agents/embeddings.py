"""
agents/embeddings.py
--------------------

Voyage AI embeddings client. Task #23.

Why its own module (not folded into model_router.py):
  - Different provider, different pricing, different batch semantics
    (Voyage takes a list of strings per call, chat models don't).
  - Cadence is different: chat calls happen per-inbound/per-outbound,
    embeddings happen in a backfill pass + at voice_sample write time.
  - Keeping them separate avoids a `task_type='embed'` special case on
    every chat call path.

What it does:
  - Voyage client wrapper (`embed_texts(texts, model=...)`) that returns
    a list of float vectors plus a cost + latency summary.
  - Best-effort cost logging into the SAME `model_calls` ledger the chat
    router uses, with `provider='voyage'` and `agent_name='embeddings'`.
    That way /dashboard/costs and scripts/model_spend_report.py see the
    real, blended cost — not just Anthropic spend.
  - Built-in retry with exponential backoff for transient 429/5xx.

Phase-0 pricing (PRD_model_routing.md § Embeddings):
  voyage-3-large     $0.12 per 1M tokens (1024 dims, matches voice_samples.embedding)
  voyage-3-lite      $0.02 per 1M tokens (512 dims — NOT for voice_samples)
  voyage-code-3      $0.12 per 1M tokens (1024 dims; future code RAG)

Env:
  VOYAGE_API_KEY         required
  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   optional — enables ledger logging
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any, Sequence


# --------------------------------------------------------------------
# Voyage catalog + cost math
# --------------------------------------------------------------------

@dataclass(frozen=True)
class VoyageModelSpec:
    model_id: str
    dims: int
    input_per_m_usd: float


VOYAGE_CATALOG: dict[str, VoyageModelSpec] = {
    "voyage-3-large": VoyageModelSpec("voyage-3-large", 1024, 0.12),
    "voyage-3-lite":  VoyageModelSpec("voyage-3-lite",  512,  0.02),
    "voyage-code-3":  VoyageModelSpec("voyage-code-3",  1024, 0.12),
}

# Default for voice-sample retrieval. Matches schema.sql vector(1024).
DEFAULT_VOICE_MODEL = "voyage-3-large"


def voyage_cost_usd(model: str, input_tokens: int) -> float:
    spec = VOYAGE_CATALOG.get(model)
    if spec is None:
        return 0.0
    return round((input_tokens / 1_000_000.0) * spec.input_per_m_usd, 6)


# --------------------------------------------------------------------
# Best-effort supabase logger (mirrors model_router._log_call)
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
    except Exception:  # pragma: no cover
        return None


def _log_embed_call(row: dict) -> None:
    sb = _sb()
    if sb is None:
        return
    try:
        sb.table("model_calls").insert(row).execute()
    except Exception as e:  # pragma: no cover
        print(f"[embeddings] warning: log write failed: {e}")


# --------------------------------------------------------------------
# Voyage HTTP client (no SDK dep; keep the surface tiny)
# --------------------------------------------------------------------

_VOYAGE_ENDPOINT = "https://api.voyageai.com/v1/embeddings"


def _voyage_post(
    texts: list[str],
    model: str,
    input_type: str | None,
    timeout_s: float,
) -> dict:
    """Raw POST. Caller handles retries + logging."""
    import urllib.request
    import urllib.error
    import json as _json

    key = os.environ.get("VOYAGE_API_KEY")
    if not key:
        raise RuntimeError(
            "VOYAGE_API_KEY not set (see app/.env.example). Voyage is "
            "project-scoped; create a key at voyageai.com/dashboard."
        )

    body = {"input": texts, "model": model}
    if input_type:
        # 'query' | 'document' — Voyage uses it to optimize the embedding
        # for retrieval vs. indexing. We pass 'document' on backfill, 'query'
        # at retrieval time.
        body["input_type"] = input_type

    req = urllib.request.Request(
        _VOYAGE_ENDPOINT,
        data=_json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            raw = resp.read().decode("utf-8")
            return _json.loads(raw)
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"voyage http {e.code}: {msg}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"voyage network error: {e}") from e


# --------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------

def embed_texts(
    texts: Sequence[str],
    *,
    model: str = DEFAULT_VOICE_MODEL,
    input_type: str | None = "document",
    task_type: str | None = "embed",
    context: dict | None = None,
    tenant_id: str | None = None,
    artist_id: str | None = None,
    max_retries: int = 4,
    timeout_s: float = 30.0,
) -> dict:
    """
    Embed a batch of texts with Voyage. Returns:
        {
          "vectors":      [[float, ...], ...],   # len == len(texts)
          "model":        "voyage-3-large",
          "dims":         1024,
          "input_tokens": <int>,
          "cost_usd":     <float>,
          "latency_ms":   <int>,
          "success":      True/False,
          "error":        <str | None>,
        }

    Retries transient 429 / 5xx with exponential backoff. Logs one row per
    successful or failed batch into `model_calls` so the costs dashboard
    picks up Voyage spend alongside Anthropic spend.
    """
    if model not in VOYAGE_CATALOG:
        raise KeyError(
            f"unknown voyage model '{model}'. known: {sorted(VOYAGE_CATALOG)}"
        )
    spec = VOYAGE_CATALOG[model]

    clean_texts = [str(t) for t in texts]
    if not clean_texts:
        return {
            "vectors": [], "model": model, "dims": spec.dims,
            "input_tokens": 0, "cost_usd": 0.0, "latency_ms": 0,
            "success": True, "error": None,
        }

    started = time.monotonic()
    last_err: Exception | None = None
    data: dict | None = None
    input_tokens = 0

    for attempt in range(max_retries):
        try:
            data = _voyage_post(clean_texts, model, input_type, timeout_s)
            usage = data.get("usage") or {}
            input_tokens = int(usage.get("total_tokens") or 0)
            last_err = None
            break
        except Exception as e:
            last_err = e
            # 429 / 5xx heuristic: retry; 4xx (auth, bad req) fail fast.
            msg = str(e)
            if "voyage http 4" in msg and "voyage http 429" not in msg:
                break
            sleep_s = min(2 ** attempt, 8)
            time.sleep(sleep_s)

    latency_ms = int((time.monotonic() - started) * 1000)
    success = last_err is None and data is not None
    cost = voyage_cost_usd(model, input_tokens) if success else 0.0

    _log_embed_call({
        "tenant_id": tenant_id,
        "artist_id": artist_id,
        "agent_name": "embeddings",
        "model_id": model,
        "task_type": task_type,
        "input_tokens": input_tokens,
        "output_tokens": 0,
        "cache_creation_input_tokens": 0,
        "cache_read_input_tokens": 0,
        "latency_ms": latency_ms,
        "cost_usd": cost,
        "provider": "voyage",
        "success": success,
        "error_code": last_err.__class__.__name__ if last_err else None,
        "error_message": (str(last_err)[:2000] if last_err else None),
        "context": {**(context or {}), "batch_size": len(clean_texts)},
    })

    if not success:
        raise RuntimeError(f"voyage embed failed after {max_retries} attempts: {last_err}")

    vectors = [row["embedding"] for row in (data["data"] or [])]
    if len(vectors) != len(clean_texts):
        raise RuntimeError(
            f"voyage returned {len(vectors)} vectors for {len(clean_texts)} inputs"
        )
    return {
        "vectors": vectors,
        "model": model,
        "dims": spec.dims,
        "input_tokens": input_tokens,
        "cost_usd": cost,
        "latency_ms": latency_ms,
        "success": True,
        "error": None,
    }


def embed_one(
    text: str,
    *,
    model: str = DEFAULT_VOICE_MODEL,
    input_type: str | None = "query",
    task_type: str | None = "embed_query",
    context: dict | None = None,
) -> list[float]:
    """Single-shot helper; used at retrieval time to embed a query string."""
    res = embed_texts(
        [text],
        model=model,
        input_type=input_type,
        task_type=task_type,
        context=context,
    )
    return res["vectors"][0]


def to_pgvector_literal(vec: Sequence[float]) -> str:
    """
    Format a vector for Postgres/pgvector string literal. Supabase's
    python client serializes this as text; pgvector parses on insert.
    """
    return "[" + ",".join(f"{float(x):.8f}" for x in vec) + "]"


# --------------------------------------------------------------------
# CLI smoke test — `python -m agents.embeddings "hello world"`
# --------------------------------------------------------------------

if __name__ == "__main__":  # pragma: no cover
    import json as _json
    import sys

    if len(sys.argv) < 2:
        print("usage: python -m agents.embeddings \"some text\" [\"more text\" ...]")
        sys.exit(2)
    res = embed_texts(sys.argv[1:], context={"cli": True})
    # Don't dump all 1024 floats — print a head + stats.
    head = res["vectors"][0][:8] if res["vectors"] else []
    print(_json.dumps({
        "model": res["model"],
        "dims": res["dims"],
        "n_vectors": len(res["vectors"]),
        "input_tokens": res["input_tokens"],
        "cost_usd": res["cost_usd"],
        "latency_ms": res["latency_ms"],
        "first_vector_head": [round(x, 4) for x in head],
    }, indent=2))
