#!/usr/bin/env python3
"""
Load parsed Gmail output into Supabase.

Reads:
  - _staging/parsed/contacts.csv
  - _staging/parsed/sent_mail.jsonl

Writes:
  - contacts (insert, skip generic inboxes by default)
  - voice_samples (inserts best candidates across categories)

Usage:
    export SUPABASE_URL=... SUPABASE_SERVICE_ROLE=...
    python load_to_supabase.py --parsed-dir ./_staging/parsed --skip-generic

Requires: pip install supabase-py==2.*  (or compatible)
"""
import argparse
import csv
import json
import os
import sys
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    print("pip install supabase", file=sys.stderr)
    sys.exit(1)


def rough_category(subject: str, body: str) -> str:
    s = (subject or "").lower()
    b = (body or "").lower()
    if any(k in s + b for k in ["offer", "available", "booking", "looking to play", "routing"]):
        return "cold_outreach" if "following up" not in s else "followup"
    if any(k in s + b for k in ["counter", "guarantee", "split", "door deal"]):
        return "negotiation"
    if any(k in s + b for k in ["confirm", "locked in", "advance"]):
        return "confirm"
    if "following up" in s or "bump" in s:
        return "followup"
    return "casual"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--parsed-dir", default="_staging/parsed")
    ap.add_argument("--skip-generic", action="store_true")
    ap.add_argument("--max-voice-per-cat", type=int, default=15)
    args = ap.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("set SUPABASE_URL and SUPABASE_SERVICE_ROLE", file=sys.stderr)
        return 1
    sb = create_client(url, key)

    parsed = Path(args.parsed_dir)
    contacts_csv = parsed / "contacts.csv"
    sent_jsonl = parsed / "sent_mail.jsonl"

    # contacts
    inserted = 0
    skipped = 0
    with contacts_csv.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if args.skip_generic and row.get("is_generic", "").lower() == "true":
                skipped += 1
                continue
            sb.table("contacts").upsert({
                "full_name": row["full_name"] or row["email"],
                "email": row["email"],
                "role": row["role"],
                "company": row["company"] or None,
                "relationship_strength": row["relationship_strength"],
                "last_interaction_at": row["last_seen"] or None,
                "source_imports": [{"source": "gmail_mbox", "at": row["last_seen"]}],
            }, on_conflict="email").execute()
            inserted += 1
    print(f"contacts inserted/updated: {inserted}, generic skipped: {skipped}")

    # voice samples — keep best N per category
    by_cat: dict[str, list[dict]] = {}
    with sent_jsonl.open(encoding="utf-8") as f:
        for line in f:
            s = json.loads(line)
            cat = rough_category(s.get("subject"), s.get("body"))
            by_cat.setdefault(cat, []).append(s)

    vs_inserted = 0
    for cat, samples in by_cat.items():
        samples.sort(key=lambda s: s.get("word_count", 0), reverse=True)
        for s in samples[: args.max_voice_per_cat]:
            sb.table("voice_samples").insert({
                "sample_category": cat,
                "subject": s.get("subject") or None,
                "body": s.get("body"),
                "sent_at": s.get("date"),
            }).execute()
            vs_inserted += 1
    print(f"voice samples inserted: {vs_inserted}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
