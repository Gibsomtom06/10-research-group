#!/usr/bin/env python3
"""
Inbound classifier runner.

Takes a single inbound email payload (from Gmail push or polled fetch),
calls Claude with prompts/inbound_classifier.md as system prompt,
returns the classification JSON + side-effects:
  - creates/updates a contact row if sender is unknown
  - if class is 'offer' or 'negotiation', creates an offer row
  - writes an outreach_log row (direction=inbound)
  - emits a decisions audit row

The classifier does not route downstream — the Supervisor does that
based on suggested_route in the returned JSON.

Usage:
    echo '<email payload JSON>' | python inbound.py
    python inbound.py --payload-file email.json

Payload format expected (matches Gmail push parse output):
    {
      "from_name": "Jane Doe",
      "from_email": "jane@somevenue.com",
      "subject": "...",
      "date_iso": "...",
      "body_plain": "...",
      "thread_id": "...",
      "is_reply": false,
      "prior_messages_count": 0
    }
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

try:
    from supabase import create_client, Client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)

try:
    from anthropic import Anthropic  # noqa: F401 — import guard
except ImportError:
    print("missing dep: pip install anthropic", file=sys.stderr)
    sys.exit(2)

# Task #21 — inbound classifier. Phase-1 candidate for Haiku downgrade.
try:
    from .model_router import call_json
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from agents.model_router import call_json  # type: ignore[no-redef]


PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "inbound_classifier.md"


def supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


def lookup_contact(sb: Client, email: str) -> dict | None:
    res = sb.table("contacts").select("*").eq("email", email).limit(1).execute()
    rows = res.data or []
    return rows[0] if rows else None


def upsert_contact(sb: Client, email: str, name: str) -> str:
    existing = lookup_contact(sb, email)
    if existing:
        return existing["id"]
    row = {
        "email": email,
        "full_name": name or email.split("@")[0],
        "relationship_strength": "cold",
        "role": None,
    }
    res = sb.table("contacts").insert(row).execute()
    return (res.data or [{}])[0].get("id", "")


def enrich_payload_for_model(email: dict, contact_row: dict | None) -> dict:
    return {
        "from_name": email.get("from_name"),
        "from_email": email.get("from_email"),
        "from_domain": (email.get("from_email") or "").split("@")[-1],
        "subject": email.get("subject"),
        "date_iso": email.get("date_iso"),
        "body_plain": email.get("body_plain"),
        "thread_id": email.get("thread_id"),
        "is_reply": bool(email.get("is_reply")),
        "prior_messages_count": int(email.get("prior_messages_count") or 0),
        "contact_known": contact_row is not None,
        "contact_relationship": (contact_row or {}).get("relationship_strength"),
        "contact_role": (contact_row or {}).get("role"),
    }


def call_model(system_prompt: str, payload: dict) -> dict:
    return call_json(
        agent_name="inbound",
        system_prompt=system_prompt,
        payload=payload,
        task_type="classify_inbound",
        max_tokens=1200,
        context={
            "thread_id": payload.get("thread_id"),
            "contact_known": payload.get("contact_known"),
        },
    )


def persist_offer(sb: Client, contact_id: str, result: dict) -> str | None:
    offer_fields = result.get("offer_fields") or {}
    if not offer_fields:
        return None
    row = {
        "contact_id": contact_id,
        "status": "inbound",
        "proposed_date": offer_fields.get("proposed_date_iso"),
        "venue_name": offer_fields.get("venue_name"),
        "city": offer_fields.get("city"),
        "state": offer_fields.get("state"),
        "capacity_claimed": offer_fields.get("capacity_claimed"),
        "guarantee": offer_fields.get("guarantee_usd"),
        "door_split_pct": offer_fields.get("door_split_pct"),
        "backend_terms": offer_fields.get("backend_terms"),
        "radius_clause_miles": offer_fields.get("radius_clause_miles"),
        "radius_clause_days": offer_fields.get("radius_clause_days"),
        "is_hold": offer_fields.get("is_hold", False),
        "hold_position": offer_fields.get("hold_position"),
        "deadline_to_respond": offer_fields.get("deadline_to_respond_iso"),
        "sensitivity_flags": result.get("sensitivity_flags", []),
    }
    res = sb.table("offers").insert(row).execute()
    return (res.data or [{}])[0].get("id", "")


def persist_inbound(
    sb: Client,
    contact_id: str,
    offer_id: str | None,
    email: dict,
    result: dict,
) -> str:
    row = {
        "direction": "inbound",
        "status": "sent",  # inbound emails are 'received' — schema uses 'sent' for both ends
        "contact_id": contact_id,
        "offer_id": offer_id,
        "thread_id": email.get("thread_id"),
        "subject": email.get("subject"),
        "body": email.get("body_plain"),
        "confidence_score": result.get("confidence"),
        "decision_trace": {
            "classifier_result": result,
        },
    }
    res = sb.table("outreach_log").insert(row).execute()
    return (res.data or [{}])[0].get("id", "")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--payload-file", default=None, help="JSON file path; otherwise read from stdin")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.payload_file:
        email = json.loads(Path(args.payload_file).read_text())
    else:
        email = json.loads(sys.stdin.read())

    sb = supabase()
    from_email = email.get("from_email", "").lower()
    if not from_email:
        print(json.dumps({"error": "missing from_email"}), file=sys.stderr)
        return 1

    existing = lookup_contact(sb, from_email)

    payload = enrich_payload_for_model(email, existing)
    system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
    result = call_model(system_prompt, payload)

    # side effects (skip in dry-run)
    if args.dry_run:
        print(json.dumps({"classifier_result": result, "would_persist": True}, indent=2))
        return 0

    contact_id = existing["id"] if existing else upsert_contact(sb, from_email, email.get("from_name") or "")
    offer_id: str | None = None
    if result.get("class") in {"offer", "negotiation"}:
        offer_id = persist_offer(sb, contact_id, result)

    log_id = persist_inbound(sb, contact_id, offer_id, email, result)

    sb.table("decisions").insert({
        "actor": "inbound",
        "action": "classify_inbound",
        "subject_type": "outreach_log",
        "subject_id": log_id,
        "confidence": result.get("confidence"),
        "rationale": result.get("rationale"),
        "input_snapshot": payload,
        "output_snapshot": result,
    }).execute()

    print(json.dumps({
        "outreach_log_id": log_id,
        "offer_id": offer_id,
        "contact_id": contact_id,
        "class": result.get("class"),
        "suggested_route": result.get("suggested_route"),
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
