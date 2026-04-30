#!/usr/bin/env python3
"""
Routing specialist runner.

Given an inbound classification result (from inbound.py) plus the full
contact / offers / outreach context, decides which specialist to
dispatch to and with what payload. Writes the dispatch decision to the
`decisions` audit table. Does NOT execute — the Supervisor reads routing
decisions and spawns the target specialist.

Usage:
    # dispatch from a classifier result JSON
    python agents/routing.py --from-classifier-log <outreach_log_id>

    # dispatch from a pasted classifier JSON
    echo '<classifier result>' | python agents/routing.py --contact-id <uuid>

    # dry-run (prints the dispatch, skips decisions write)
    python agents/routing.py --from-classifier-log <uuid> --dry-run
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

# Task #21 — routing classifier. Phase-1 candidate for Haiku downgrade.
try:
    from .model_router import call_json
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from agents.model_router import call_json  # type: ignore[no-redef]


PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "routing.md"


def supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


def load_contact(sb: Client, contact_id: str) -> dict:
    res = (
        sb.table("contacts")
        .select(
            "id, full_name, email, role, relationship_strength, "
            "do_not_contact, email_valid, last_interaction_at, reminder_due_at, bounce_count"
        )
        .eq("id", contact_id)
        .maybeSingle()
        .execute()
    )
    return res.data or {}


def load_open_offers(sb: Client, contact_id: str) -> list[dict]:
    res = (
        sb.table("offers")
        .select(
            "id, venue_name, city, state, date_iso, guarantee_usd, "
            "deadline_to_respond, is_hold, hold_position, "
            "radius_clause_miles, radius_clause_days, sensitivity_flags, status, created_at"
        )
        .eq("contact_id", contact_id)
        .in_("status", ["inbound", "under_review", "countered"])
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    return res.data or []


def load_recent_outreach(sb: Client, contact_id: str, limit: int = 10) -> list[dict]:
    res = (
        sb.table("outreach_log")
        .select("id, direction, status, subject, sent_at, replied_at, created_at")
        .eq("contact_id", contact_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def load_classifier_from_log(sb: Client, log_id: str) -> tuple[dict, str]:
    """Pull the classifier result + contact_id from a stored inbound log row."""
    res = (
        sb.table("outreach_log")
        .select("id, contact_id, decision_trace")
        .eq("id", log_id)
        .maybeSingle()
        .execute()
    )
    row = res.data or {}
    classifier = (row.get("decision_trace") or {}).get("classifier_result") or {}
    return classifier, row.get("contact_id", "")


def call_model(system_prompt: str, payload: dict) -> dict:
    return call_json(
        agent_name="routing",
        system_prompt=system_prompt,
        payload=payload,
        task_type="route_email",
        max_tokens=1500,
        context={
            "outreach_log_id": payload.get("outreach_log_id"),
            "contact_id": payload.get("contact", {}).get("id") if isinstance(payload.get("contact"), dict) else None,
        },
    )


# ---------- hard rule pre-check ----------

def hard_route_override(classification: dict, contact: dict, offers: list[dict]) -> dict | None:
    """
    Implements the 'hard routing rules' section of prompts/routing.md in code
    so we don't rely on the model for safety-critical routes.
    """
    if contact.get("do_not_contact"):
        return {
            "route_to": "none",
            "intent": "noop",
            "payload": {},
            "priority": "this_week",
            "reason": "contact is DNC",
            "blockers": ["do_not_contact=true"],
            "recommended_after": [],
        }

    flags = set(classification.get("sensitivity_flags") or [])
    escalate_flags = {
        "illegal_request",
        "payola_solicitation",
        "radius_clause_conflict",
        "competing_hold_conflict",
        "rider_violation_threat",
    }
    if flags & escalate_flags:
        return {
            "route_to": "supervisor_escalate",
            "intent": "flagged_for_thomas",
            "payload": {
                "reason": f"sensitivity flags: {sorted(flags & escalate_flags)}",
                "urgency": "now",
                "requires_thomas": True,
            },
            "priority": "now",
            "reason": "sensitivity flag triggers human-in-loop",
            "blockers": list(flags & escalate_flags),
            "recommended_after": [],
        }

    if contact.get("email_valid") is False:
        return {
            "route_to": "research",
            "intent": "find_better_email",
            "payload": {
                "target": "contact",
                "target_id": contact.get("id"),
                "missing_fields": ["email"],
            },
            "priority": "today",
            "reason": "current email is invalidated; need a better address before any outbound",
            "blockers": ["email_valid=false"],
            "recommended_after": ["analyst"],
        }

    for o in offers:
        if o.get("is_hold") and (o.get("hold_position") or 0) > 3:
            return {
                "route_to": "supervisor_escalate",
                "intent": "deep_hold_needs_judgement",
                "payload": {
                    "reason": f"hold position {o.get('hold_position')} on {o.get('venue_name')}",
                    "urgency": "this_week",
                    "requires_thomas": True,
                },
                "priority": "this_week",
                "reason": "holds beyond #3 aren't worth chasing without human judgement",
                "blockers": [f"hold_position={o.get('hold_position')}"],
                "recommended_after": [],
            }

    return None


def persist_decision(
    sb: Client,
    classification: dict,
    contact: dict,
    dispatch: dict,
    source_log_id: str | None,
) -> str:
    res = sb.table("decisions").insert({
        "actor": "routing",
        "action": "route",
        "subject_type": "outreach_log" if source_log_id else "contact",
        "subject_id": source_log_id or contact.get("id"),
        "confidence": classification.get("confidence"),
        "rationale": dispatch.get("reason"),
        "input_snapshot": {
            "classification": classification,
            "contact_id": contact.get("id"),
            "contact_state": {
                "relationship_strength": contact.get("relationship_strength"),
                "email_valid": contact.get("email_valid"),
                "do_not_contact": contact.get("do_not_contact"),
            },
        },
        "output_snapshot": dispatch,
    }).execute()
    return (res.data or [{}])[0].get("id", "")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-classifier-log", default=None,
                    help="outreach_log id of an inbound row with classifier result in decision_trace")
    ap.add_argument("--contact-id", default=None,
                    help="contact id (required when passing classifier JSON via stdin)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    sb = supabase()

    # Load classification + contact id
    if args.from_classifier_log:
        classification, contact_id = load_classifier_from_log(sb, args.from_classifier_log)
        source_log_id = args.from_classifier_log
    else:
        if not args.contact_id:
            print("need --contact-id when providing classifier JSON via stdin", file=sys.stderr)
            return 2
        classification = json.loads(sys.stdin.read())
        contact_id = args.contact_id
        source_log_id = None

    if not classification:
        print(json.dumps({"error": "no classification result found"}), file=sys.stderr)
        return 1

    contact = load_contact(sb, contact_id) if contact_id else {}
    offers = load_open_offers(sb, contact_id) if contact_id else []
    recent = load_recent_outreach(sb, contact_id) if contact_id else []

    # Hard rules first (safety routes don't need the model)
    dispatch = hard_route_override(classification, contact, offers)

    if dispatch is None:
        payload = {
            "classification": classification,
            "contact": contact,
            "open_offers": offers,
            "recent_outreach": recent,
        }
        system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
        dispatch = call_model(system_prompt, payload)

    if args.dry_run:
        print(json.dumps({"dispatch": dispatch, "contact_id": contact_id}, indent=2))
        return 0

    decision_id = persist_decision(sb, classification, contact, dispatch, source_log_id)

    print(json.dumps({
        "decision_id": decision_id,
        "route_to": dispatch.get("route_to"),
        "intent": dispatch.get("intent"),
        "priority": dispatch.get("priority"),
        "contact_id": contact_id,
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
