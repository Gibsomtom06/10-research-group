#!/usr/bin/env python3
"""
Post a markdown digest file to Discord via the configured webhook.

Reads the file, splits at ~1900-char chunks (Discord message limit is 2000),
and posts them in order so the digest renders as one readable thread.

Usage:
    # Post the latest auto-mode digest:
    DISCORD_WEBHOOK_URL=... python scripts/post_digest_to_discord.py docs/STATUS_2026-05-05_2030.md

    # Or with --title to add a header line:
    DISCORD_WEBHOOK_URL=... python scripts/post_digest_to_discord.py \
        docs/STATUS_2026-05-05_2030.md --title "auto-mode booking-agent digest"

The webhook URL is read from DISCORD_WEBHOOK_URL env var. The script does NOT
read or persist the URL anywhere; pass it inline or via your shell env only.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.request
from pathlib import Path


CHUNK_SIZE = 1900


def chunk_markdown(text: str, size: int = CHUNK_SIZE) -> list[str]:
    """Split markdown into <size-char chunks at line boundaries."""
    chunks: list[str] = []
    buf: list[str] = []
    n = 0
    for line in text.splitlines(keepends=True):
        if n + len(line) > size and buf:
            chunks.append("".join(buf).rstrip("\n"))
            buf = []
            n = 0
        buf.append(line)
        n += len(line)
    if buf:
        chunks.append("".join(buf).rstrip("\n"))
    return chunks


def post_chunk(webhook: str, content: str) -> int:
    payload = json.dumps({"content": content}).encode("utf-8")
    req = urllib.request.Request(
        webhook,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("digest", help="Path to a markdown digest file")
    p.add_argument("--title", help="Optional header line prepended as its own message")
    p.add_argument("--dry-run", action="store_true", help="Print chunks instead of posting")
    args = p.parse_args()

    webhook = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook and not args.dry_run:
        print("ERROR: DISCORD_WEBHOOK_URL not set. Pass it inline:", file=sys.stderr)
        print('  DISCORD_WEBHOOK_URL="..." python scripts/post_digest_to_discord.py <file>', file=sys.stderr)
        return 2

    src = Path(args.digest)
    if not src.exists():
        print(f"ERROR: file not found: {src}", file=sys.stderr)
        return 2

    body = src.read_text(encoding="utf-8")
    chunks = chunk_markdown(body)
    if args.title:
        chunks.insert(0, f"**{args.title}**")

    print(f"Posting {len(chunks)} message(s) from {src.name} ({len(body):,} chars)...")

    # Force UTF-8 stdout on Windows so dry-run output with em-dashes etc. doesn't crash
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    for i, chunk in enumerate(chunks, 1):
        if args.dry_run:
            print(f"\n----- chunk {i}/{len(chunks)} ({len(chunk)} chars) -----")
            print(chunk)
            continue
        try:
            status = post_chunk(webhook, chunk)
            print(f"  chunk {i}/{len(chunks)}: HTTP {status}")
        except Exception as exc:
            print(f"  chunk {i}/{len(chunks)}: FAILED — {exc}", file=sys.stderr)
            return 1
        # Tiny pause to avoid rate-limit on bigger digests
        if i < len(chunks):
            time.sleep(0.4)

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
