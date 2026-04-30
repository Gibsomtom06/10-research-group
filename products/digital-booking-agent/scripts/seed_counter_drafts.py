#!/usr/bin/env python3
"""
seed_counter_drafts.py

Watches `offers` for rows that Thomas has marked as `countered` in the
UI (via the "counter" button on /offers/[id]), and drafts a
counter-offer email for each one. Idempotent: will skip offers that
already have a recent outbound draft tied to them.

Flow:
  1. select offers where status = 'countered' and counter_bounds has
     a non-null `target` and no outreach_log row tied to this offer
     with status='draft' AND created_at > updated_at of the offer
  2. for each one, build a pitch_pack-like payload (counter target,
     offer context, venue, contact) and call agents/outbound.py with
     --email-type counter_offer
  3. the composer writes the draft into outreach_log; the UI picks
     it up on /drafts

Usage:
    python seed_counter_drafts.py [--dry-run] [--limit 10]

Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE, ANTHROPIC_API_KEY
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from supabase import create_client, Client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)


REPO_ROOT = Path(__file__).parent.parent
OUTBOUND_RUNNER = REPO_ROOT / "agents" / "outbound.py"


def supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


def load_countered_offers(sb: Client, limit: int) -> list[dict]:
    """Offers that need a counter email drafted."""
    res = (
        sb.table("offers")
        .select(
            "id, contact_id, venue_id, artist_slug, proposed_date, guarantee,"
            " counter_bounds, status, updated_at, notes, thread_id,"
            " contact:contacts(full_name, email, role, city, state, relationship_tier),"
            " venue:venues(name, city, state, capacity)"
        )
        .eq("status", "countered")
        .order("updated_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def has_fresh_counter_draft(sb: Client, offer: dict) -> bool:
    """Has a draft been written since this offer was last countered?"""
    offer_updated = offer.get("updated_at")
    if not offer_updated or not offer.get("contact_id"):
        return False
    q = (
        sb.table("outreach_log")
        .select("id, created_at, status, email_type")
        .eq("contact_id", offer["contact_id"])
        .eq("direction", "outbound")
        .eq("email_type", "counter_offer")
        .gte("created_at", offer_updated)
        .limit(1)
        .execute()
    )
    return bool(q.data)


def build_pitch_pack_payload(offer: dict) -> dict:
    """
    Build the pitch-pack-style payload the composer needs for a
    counter. We don't write to the `pitch_packs` table for counters
    because they're too short-lived; instead we pass the payload in
    via a tempfile (see call below).
    """
    contact = offer.get("contact") or {}
    if isinstance(contact, list):
        contact = contact[0] if contact else {}
    venue = offer.get("venue") or {}
    if isinstance(venue, list):
        venue = venue[0] if venue else {}

    counter = offer.get("counter_bounds") or {}
    counter_target = counter.get("target")
    min_guarantee = counter.get("min_guarantee")
    walk_away = counter.get("walk_away")

    # multi-artist scope (#34): artist_slug MUST come off the offer row.
    # offers.artist_slug is non-null (migration 0005) so a missing value
    # here is a data bug, not a fallback case — don't silently route a
    # kotrax / whoisee / dark matter counter as DirtySnatcha.
    artist_slug = offer.get("artist_slug")
    if not artist_slug:
        raise RuntimeError(
            f"offer {offer['id']} has no artist_slug — refusing to default "
            "(multi-artist safety, see task #34)"
        )

    return {
        "email_type": "counter_offer",
        "offer_id": offer["id"],
        "thread_id": offer.get("thread_id"),
        "contact": {
            "id": offer.get("contact_id"),
            "full_name": contact.get("full_name"),
            "email": contact.get("email"),
            "role": contact.get("role"),
            "relationship_tier": contact.get("relationship_tier"),
            "city": contact.get("city"),
            "state": contact.get("state"),
        },
        "venue": {
            "id": offer.get("venue_id"),
            "name": venue.get("name"),
            "city": venue.get("city"),
            "state": venue.get("state"),
            "capacity": venue.get("capacity"),
        },
        "proposed_date": offer.get("proposed_date"),
        "artist_slug": artist_slug,
        "original_guarantee": offer.get("guarantee"),
        "counter_target": counter_target,
        "counter_min": min_guarantee,
        "counter_walk_away": walk_away,
        "notes": offer.get("notes"),
        "tone_hint": (
            "warm, confident, not apologetic. we're countering because "
            "the guarantee is below what the room + touring costs justify. "
            "name the counter clearly; close with a concrete next step."
        ),
    }


def run_composer(payload: dict, dry_run: bool) -> int:
    """Fire agents/outbound.py with the counter payload via env var."""
    env = os.environ.copy()
    env["DBA_COUNTER_PAYLOAD"] = json.dumps(payload)

    cmd = [
        sys.executable,
        str(OUTBOUND_RUNNER),
        "--email-type",
        "counter_offer",
        "--from-counter-payload",
    ]
    if dry_run:
        cmd.append("--dry-run")

    print(f"  → running composer: offer={payload['offer_id']} counter=${payload['counter_target']}")
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"    composer failed: rc={result.returncode}")
        if result.stderr:
            print(f"    stderr: {result.stderr.strip()[:500]}")
    else:
        print(f"    composer ok")
    return result.returncode


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=20)
    args = ap.parse_args()

    sb = supabase()
    offers = load_countered_offers(sb, args.limit)

    if not offers:
        print("no countered offers awaiting draft")
        return 0

    print(f"found {len(offers)} countered offer(s)")

    drafted = 0
    skipped = 0
    failed = 0

    for o in offers:
        contact = o.get("contact")
        if isinstance(contact, list):
            contact = contact[0] if contact else None
        contact_name = (contact or {}).get("full_name", "?")
        target = (o.get("counter_bounds") or {}).get("target")

        print(f"- {contact_name} · ${target} · offer={o['id'][:8]}")

        if has_fresh_counter_draft(sb, o):
            print("    already has fresh draft, skip")
            skipped += 1
            continue

        payload = build_pitch_pack_payload(o)
        if payload["counter_target"] is None:
            print("    no counter_target in counter_bounds, skip")
            skipped += 1
            continue

        rc = run_composer(payload, args.dry_run)
        if rc == 0:
            drafted += 1
        else:
            failed += 1

    print(
        f"\nsummary: drafted={drafted} skipped={skipped} failed={failed} "
        f"total={len(offers)}"
    )
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
