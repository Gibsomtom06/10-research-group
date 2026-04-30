#!/usr/bin/env python3
"""
scripts/embed_voice_samples.py
------------------------------

Backfill `voice_samples.embedding` using Voyage voyage-3-large (task #23).

Strategy:
  1. Pull every voice_sample where `embedding is null` (or --all).
  2. Batch into groups of N (Voyage tolerates up to 128 per call; we use 32
     to keep per-call token counts well under the 120K-token ceiling and
     bound retry cost).
  3. Build the string to embed as `subject\n\nbody` — subject line often
     carries the tonal cue for a cold-vs-negotiation voice.
  4. Call agents/embeddings.embed_texts(input_type='document').
  5. Write back via the update RPC (or direct table update).

Cost ballpark: the DSR voice corpus is ~a few hundred samples of a few
hundred tokens each. One backfill pass is pennies.

Usage:
    python scripts/embed_voice_samples.py                  # missing only
    python scripts/embed_voice_samples.py --all            # re-embed everything
    python scripts/embed_voice_samples.py --limit 50       # cap for a dry run
    python scripts/embed_voice_samples.py --dry-run        # don't write
    python scripts/embed_voice_samples.py --batch-size 16

Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)

# Allow `python scripts/embed_voice_samples.py` from anywhere in the repo.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from agents.embeddings import (  # noqa: E402
    DEFAULT_VOICE_MODEL,
    embed_texts,
    to_pgvector_literal,
)


def supabase():
    url = os.environ["SUPABASE_URL"]
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_KEY"]
    return create_client(url, key)


def build_text(row: dict) -> str:
    subj = (row.get("subject") or "").strip()
    body = (row.get("body") or "").strip()
    if subj and body:
        return f"{subj}\n\n{body}"
    return body or subj


def chunk(seq: list, n: int):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def main() -> int:
    ap = argparse.ArgumentParser(description="backfill voice_samples.embedding with Voyage")
    ap.add_argument("--all", action="store_true",
                    help="re-embed even rows that already have embeddings")
    ap.add_argument("--limit", type=int, default=None,
                    help="cap the number of rows processed")
    ap.add_argument("--batch-size", type=int, default=32,
                    help="rows per Voyage call (default 32, max sensible ~64)")
    ap.add_argument("--model", default=DEFAULT_VOICE_MODEL,
                    help="voyage model key (default voyage-3-large)")
    ap.add_argument("--dry-run", action="store_true",
                    help="don't write; just report what would happen")
    args = ap.parse_args()

    sb = supabase()

    q = sb.table("voice_samples").select("id, subject, body, embedding")
    if not args.all:
        q = q.is_("embedding", "null")
    if args.limit:
        q = q.limit(args.limit)
    rows = q.execute().data or []

    if not rows:
        print("nothing to embed — all voice_samples already have embeddings.")
        print("  use --all to re-embed.")
        return 0

    print(f"found {len(rows)} voice_samples to embed with {args.model}.")
    if args.dry_run:
        print("(dry-run) — not calling Voyage, not writing.")
        return 0

    total_cost = 0.0
    total_tokens = 0
    done = 0
    errors = 0

    for batch in chunk(rows, args.batch_size):
        texts = [build_text(r) for r in batch]
        try:
            res = embed_texts(
                texts,
                model=args.model,
                input_type="document",
                task_type="embed_voice_sample",
                context={"script": "embed_voice_samples", "batch_size": len(batch)},
            )
        except Exception as e:
            errors += len(batch)
            print(f"  batch failed ({len(batch)} rows): {e}")
            continue

        vectors = res["vectors"]
        total_cost += res["cost_usd"]
        total_tokens += res["input_tokens"]

        for row, vec in zip(batch, vectors):
            try:
                sb.table("voice_samples") \
                    .update({"embedding": to_pgvector_literal(vec)}) \
                    .eq("id", row["id"]) \
                    .execute()
                done += 1
            except Exception as e:
                errors += 1
                print(f"  update failed for {row['id']}: {e}")

        print(f"  batch ok — {len(batch)} rows, "
              f"{res['input_tokens']:,} tok, ${res['cost_usd']:.6f}, "
              f"{res['latency_ms']} ms")

    print()
    print("summary")
    print(f"  written:       {done}")
    print(f"  errors:        {errors}")
    print(f"  total tokens:  {total_tokens:,}")
    print(f"  total cost:    ${total_cost:.6f}")
    if done and not errors:
        print("  ✓ backfill complete")
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
