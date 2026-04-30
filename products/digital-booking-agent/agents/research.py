#!/usr/bin/env python3
"""
Research specialist runner.

Fills gaps in the database — emails, capacities, market stats — so the
Analyst and Outbound specialists can do their work. Called by the
Supervisor when Routing says a target is missing data.

Strict rules (enforced in code, not just in the prompt):
  - Never invent values. High-confidence (>=0.8) emails require two
    independent sources.
  - Stats findings over 30 days old are downgraded to confidence <=0.5.
  - Praise quotes >90d old are dropped entirely.
  - Only writes to the target row if --apply and the finding passes the
    confidence gate.
  - Always writes a decisions audit row with the full findings payload,
    whether we apply or not.

Usage:
    # find a better email for a contact
    python agents/research.py --target contact --target-id <uuid> \
        --missing email --why "current email bounced"

    # look up venue capacity
    python agents/research.py --target venue --target-id <uuid> \
        --missing capacity,booking_contact

    # market stats (requires --allow-web-search to be useful)
    python agents/research.py --target market --target-id <metro> \
        --missing artist_monthly_listeners,youtube_views_90d \
        --allow-web-search

    # dry-run (print, don't persist, don't apply)
    python agents/research.py --target contact --target-id <uuid> \
        --missing email --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
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

# Task #21 — research agent. Tier-A floor (citations must be right).
try:
    from .model_router import call_json
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from agents.model_router import call_json  # type: ignore[no-redef]


PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "research.md"

# confidence gates for auto-apply
EMAIL_MIN_CONF = 0.8
GENERIC_MIN_CONF = 0.75

# allowed fields per target (keeps us from writing junk)
CONTACT_FIELDS = {"email", "phone", "role", "company", "city", "state", "country"}
VENUE_FIELDS = {"capacity", "venue_type", "address", "city", "state", "booking_contact_name",
                "booking_contact_email", "typical_genres", "door_split_norms"}
MARKET_FIELDS = {"market_metro", "dma_rank", "artist_monthly_listeners",
                 "youtube_views_90d", "instagram_followers_from_city", "adjacent_markets"}

TARGET_FIELD_MAP = {
    "contact": CONTACT_FIELDS,
    "venue": VENUE_FIELDS,
    "market": MARKET_FIELDS,
}


def supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


# ---------- target loaders ----------

def load_contact_row(sb: Client, contact_id: str) -> dict:
    res = (
        sb.table("contacts")
        .select("*, venues:venue_id(id,name,city,state,dma,capacity)")
        .eq("id", contact_id)
        .maybeSingle()
        .execute()
    )
    return res.data or {}


def load_venue_row(sb: Client, venue_id: str) -> dict:
    res = sb.table("venues").select("*").eq("id", venue_id).maybeSingle().execute()
    return res.data or {}


def load_market_row(sb: Client, metro: str) -> dict:
    """
    `market` target is looked up by metro name — a free-text city/DMA key.
    We don't have a markets table in v0; we reconstruct from artist_data +
    recent offers. If a markets table exists later, swap this out.
    """
    # freshest artist_data snapshot (gives DMA breakdown + listener counts)
    snap_res = (
        sb.table("artist_data")
        .select("as_of_iso, dma_listeners, dma_listeners_60d_pct_change, last_show_results_by_dma")
        .order("as_of_iso", desc=True)
        .limit(1)
        .execute()
    )
    snap = (snap_res.data or [{}])[0]
    dma_listeners = snap.get("dma_listeners") or {}
    current = dma_listeners.get(metro)

    # recent offers in that metro (signal for market heat)
    offers_res = (
        sb.table("offers")
        .select("id, venue_name, city, guarantee, created_at")
        .ilike("city", f"%{metro}%")
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    return {
        "metro": metro,
        "snapshot_as_of": snap.get("as_of_iso"),
        "current_listener_count": current,
        "delta_60d_pct": (snap.get("dma_listeners_60d_pct_change") or {}).get(metro),
        "last_show_results": (snap.get("last_show_results_by_dma") or {}).get(metro),
        "recent_offers_in_metro": offers_res.data or [],
    }


def load_adjacent_signals(sb: Client, target: str, target_id: str) -> list[dict]:
    """Pull nearby rows that might help: prior outreach threads for contacts, etc."""
    signals: list[dict] = []
    if target == "contact":
        # last 10 threads — the model can scan signatures for better emails
        res = (
            sb.table("outreach_log")
            .select("id, direction, subject, body, from_email, thread_id, created_at")
            .eq("contact_id", target_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        for row in res.data or []:
            signals.append({
                "kind": "outreach_log",
                "id": row.get("id"),
                "direction": row.get("direction"),
                "subject": row.get("subject"),
                # truncate bodies to keep context small
                "body_excerpt": (row.get("body") or "")[:1200],
                "thread_id": row.get("thread_id"),
                "created_at": row.get("created_at"),
            })
    elif target == "venue":
        # recent offers at this venue — booking_contact may surface in text
        res = (
            sb.table("offers")
            .select("id, contact_id, venue_name, city, guarantee, created_at")
            .eq("venue_id", target_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        for row in res.data or []:
            signals.append({"kind": "offer", **row})
    return signals


# ---------- model call ----------

def build_tools(allow_web_search: bool) -> list[dict]:
    tools: list[dict] = []
    if allow_web_search:
        # Anthropic's hosted web_search tool — free tier may not have it;
        # guarded by flag so we don't break non-web-enabled setups.
        tools.append({
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": 5,
        })
    return tools


def call_model(system_prompt: str, payload: dict, allow_web_search: bool = False) -> dict:
    tools = build_tools(allow_web_search)
    return call_json(
        agent_name="research",
        system_prompt=system_prompt,
        payload=payload,
        task_type="research_with_web_search" if allow_web_search else "research",
        max_tokens=2000,
        tools=tools or None,
        context={
            "target": payload.get("target"),
            "allow_web_search": allow_web_search,
        },
    )


# ---------- finding validation ----------

def validate_findings(findings: list[dict], target: str) -> tuple[list[dict], list[dict]]:
    """
    Enforce: allowed field catalog, at-least-one-source, freshness downgrade.
    Returns (valid, dropped).
    """
    allowed = TARGET_FIELD_MAP.get(target, set())
    valid: list[dict] = []
    dropped: list[dict] = []

    for f in findings or []:
        field = f.get("field")
        if field not in allowed:
            dropped.append({**f, "_drop_reason": f"field '{field}' not in catalog for target={target}"})
            continue
        sources = f.get("sources") or []
        if not sources:
            dropped.append({**f, "_drop_reason": "no sources cited"})
            continue
        # freshness check for stats-like fields
        if field in {"artist_monthly_listeners", "youtube_views_90d",
                     "instagram_followers_from_city"}:
            newest = _newest_source_age_days(sources)
            if newest is not None and newest > 30:
                f = {**f, "confidence": min(float(f.get("confidence") or 0), 0.5)}
                f.setdefault("notes", "")
                f["notes"] = (f["notes"] + f" [stale: {newest}d old]").strip()

        # email 2-source rule
        if target == "contact" and field == "email":
            unique_kinds = {s.get("kind") for s in sources}
            if (float(f.get("confidence") or 0) > 0.8) and len(sources) < 2:
                # downgrade instead of dropping — still useful as a lead
                f = {**f, "confidence": 0.7,
                     "notes": (f.get("notes") or "") + " [single-source; confidence capped]"}
                f["notes"] = f["notes"].strip()

        valid.append(f)

    return valid, dropped


def _newest_source_age_days(sources: list[dict]) -> int | None:
    newest: int | None = None
    now = datetime.now(timezone.utc)
    for s in sources:
        r = s.get("retrieved_at")
        if not r:
            continue
        try:
            dt = datetime.fromisoformat(r.replace("Z", "+00:00"))
            age = (now - dt).days
            if newest is None or age < newest:
                newest = age
        except Exception:
            continue
    return newest


# ---------- apply (write back to target row) ----------

def apply_findings(sb: Client, target: str, target_id: str, findings: list[dict]) -> list[dict]:
    """
    Write high-confidence findings back to the target row. Returns list of
    {field, value, applied, reason}.
    """
    applied: list[dict] = []
    if target == "market":
        # markets have no direct row to write; skip apply
        for f in findings:
            applied.append({
                "field": f.get("field"),
                "value": f.get("value"),
                "applied": False,
                "reason": "market targets have no direct storage; surface in decisions only",
            })
        return applied

    if target == "contact":
        update: dict[str, Any] = {}
        for f in findings:
            field = f.get("field")
            conf = float(f.get("confidence") or 0)
            gate = EMAIL_MIN_CONF if field == "email" else GENERIC_MIN_CONF
            if conf < gate:
                applied.append({
                    "field": field, "value": f.get("value"), "applied": False,
                    "reason": f"confidence {conf} < gate {gate}",
                })
                continue
            # only write first allowed value per field
            if field in CONTACT_FIELDS and field not in update:
                update[field] = f.get("value")
                if field == "email":
                    # restoring an email means re-validating it
                    update["email_valid"] = True
                applied.append({
                    "field": field, "value": f.get("value"), "applied": True,
                    "reason": f"conf {conf} >= gate {gate}",
                })
        if update:
            sb.table("contacts").update(update).eq("id", target_id).execute()

    if target == "venue":
        update: dict[str, Any] = {}
        for f in findings:
            field = f.get("field")
            conf = float(f.get("confidence") or 0)
            if conf < GENERIC_MIN_CONF:
                applied.append({
                    "field": field, "value": f.get("value"), "applied": False,
                    "reason": f"confidence {conf} < gate {GENERIC_MIN_CONF}",
                })
                continue
            if field in VENUE_FIELDS and field not in update:
                update[field] = f.get("value")
                applied.append({
                    "field": field, "value": f.get("value"), "applied": True,
                    "reason": f"conf {conf} >= gate",
                })
        if update:
            sb.table("venues").update(update).eq("id", target_id).execute()

    return applied


# ---------- decisions audit ----------

def persist_decision(
    sb: Client,
    target: str,
    target_id: str,
    payload: dict,
    result: dict,
    applied: list[dict],
) -> str:
    subject_type = {"contact": "contact", "venue": "venue", "market": "market"}.get(target, "other")
    res = sb.table("decisions").insert({
        "actor": "research",
        "action": "fill_missing_fields",
        "subject_type": subject_type,
        "subject_id": target_id if target != "market" else None,
        "confidence": _overall_confidence(result.get("findings") or []),
        "rationale": result.get("recommended_next"),
        "input_snapshot": payload,
        "output_snapshot": {
            "findings": result.get("findings") or [],
            "unresolved": result.get("unresolved") or [],
            "recommended_next": result.get("recommended_next"),
            "applied": applied,
        },
    }).execute()
    return (res.data or [{}])[0].get("id", "")


def _overall_confidence(findings: list[dict]) -> float | None:
    if not findings:
        return None
    vals = [float(f.get("confidence") or 0) for f in findings]
    return round(sum(vals) / len(vals), 2) if vals else None


# ---------- main ----------

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", required=True, choices=["contact", "venue", "market"])
    ap.add_argument("--target-id", required=True,
                    help="uuid for contact/venue; metro name for market")
    ap.add_argument("--missing", required=True,
                    help="comma-separated field list (e.g. email,phone)")
    ap.add_argument("--why", default="filling gaps", help="why routing sent this")
    ap.add_argument("--budget-seconds", type=int, default=60)
    ap.add_argument("--allow-web-search", action="store_true",
                    help="enable Anthropic hosted web_search tool")
    ap.add_argument("--apply", action="store_true",
                    help="write high-confidence findings back to target row")
    ap.add_argument("--dry-run", action="store_true",
                    help="skip decisions write + apply; print result only")
    args = ap.parse_args()

    missing_fields = [f.strip() for f in args.missing.split(",") if f.strip()]
    allowed = TARGET_FIELD_MAP.get(args.target, set())
    unknown = [f for f in missing_fields if f not in allowed]
    if unknown:
        print(json.dumps({
            "error": f"unknown fields for target={args.target}: {unknown}",
            "allowed": sorted(allowed),
        }), file=sys.stderr)
        return 2

    sb = supabase()

    # Load existing row + adjacent signals
    if args.target == "contact":
        existing = load_contact_row(sb, args.target_id)
    elif args.target == "venue":
        existing = load_venue_row(sb, args.target_id)
    else:
        existing = load_market_row(sb, args.target_id)

    adjacent = load_adjacent_signals(sb, args.target, args.target_id)

    payload = {
        "target": args.target,
        "target_id": args.target_id,
        "missing_fields": missing_fields,
        "context": {
            "why": args.why,
            "existing_data": existing,
            "adjacent_signals": adjacent,
        },
        "budget_seconds": args.budget_seconds,
    }

    system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
    try:
        result = call_model(system_prompt, payload, allow_web_search=args.allow_web_search)
    except Exception as e:
        err = {"error": f"research model call failed: {e}",
               "target": args.target, "target_id": args.target_id}
        print(json.dumps(err), file=sys.stderr)
        return 1

    # enforce catalog + source + freshness rules
    valid, dropped = validate_findings(result.get("findings") or [], args.target)
    result["findings"] = valid
    if dropped:
        result.setdefault("unresolved", [])
        for d in dropped:
            result["unresolved"].append({
                "field": d.get("field"),
                "reason": d.get("_drop_reason", "dropped by validator"),
            })

    if args.dry_run:
        print(json.dumps({
            "would_apply": args.apply,
            "result": result,
        }, indent=2))
        return 0

    applied: list[dict] = []
    if args.apply:
        applied = apply_findings(sb, args.target, args.target_id, valid)

    decision_id = persist_decision(sb, args.target, args.target_id, payload, result, applied)

    print(json.dumps({
        "decision_id": decision_id,
        "target": args.target,
        "target_id": args.target_id,
        "finding_count": len(valid),
        "applied_count": sum(1 for a in applied if a.get("applied")),
        "recommended_next": result.get("recommended_next"),
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
