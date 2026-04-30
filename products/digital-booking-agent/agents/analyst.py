#!/usr/bin/env python3
"""
Analyst agent runner.

Builds a pitch-pack for a given contact + intent by:
  1. Pulling contact + venue + market data from Supabase
  2. Pulling the freshest artist_data snapshot for the contact's market
  3. Pulling qualifying praise_bank hits (fresh, specific)
  4. Loading the prompts/analyst_pitch_pack.md system prompt
  5. Calling Claude to compose the pitch-pack JSON
  6. Validating verification_stamps and writing to pitch_packs table

Usage:
    python analyst.py --contact-id <uuid> --intent cold_outreach
    python analyst.py --contact-id <uuid> --intent warm_pitch \
        --prior-city Cleveland --prior-date 2026-08-12 \
        --next-city Chicago --next-date 2026-08-16

Env required:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE
    ANTHROPIC_API_KEY

Notes:
    - Freshness gates enforced client-side BEFORE calling the model,
      so we never pay for a generation that will be blocked downstream.
    - If gates fail, writes a pitch_pack row with flags + empty body,
      so the Supervisor can route to Research.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

try:
    from supabase import create_client, Client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)

try:
    from anthropic import Anthropic  # noqa: F401 — kept so import errors surface loudly
except ImportError:
    print("missing dep: pip install anthropic", file=sys.stderr)
    sys.exit(2)

# Task #21 — all model calls route through agents/model_router.py so the
# model_calls ledger logs cost / latency / tokens per invocation. Never call
# Anthropic() directly from an agent anymore.
try:
    from .model_router import call_json
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from agents.model_router import call_json  # type: ignore[no-redef]


PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "analyst_pitch_pack.md"
STATS_FRESHNESS_DAYS = 30
PRAISE_FRESHNESS_DAYS = 90
PRAISE_SPECIFICITY_FLOOR = 0.7
DMA_LISTENER_FLOOR = 500


@dataclass
class RoutingContext:
    prior_city: str | None = None
    prior_date_iso: str | None = None
    next_city: str | None = None
    next_date_iso: str | None = None


@dataclass
class AnalystInput:
    contact: dict[str, Any]
    intent: str
    proposed_date_iso: str | None
    routing_context: RoutingContext
    artist_snapshot: dict[str, Any]
    praise_bank_hits: list[dict[str, Any]] = field(default_factory=list)


def supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


def load_contact(sb: Client, contact_id: str) -> dict:
    res = (
        sb.table("contacts")
        .select("*, venues:venue_id(id,name,city,state,dma,capacity)")
        .eq("id", contact_id)
        .single()
        .execute()
    )
    if not res.data:
        raise RuntimeError(f"contact {contact_id} not found")
    return res.data


def load_artist_snapshot(sb: Client, market: str) -> dict:
    """Pull the freshest artist_data row + DMA-specific listener stats."""
    res = (
        sb.table("artist_data")
        .select("*")
        .order("as_of_iso", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        return {}
    snap = res.data[0]
    dma_listeners = snap.get("dma_listeners", {}) or {}
    dma_delta = snap.get("dma_listeners_60d_pct_change", {}) or {}
    last_shows = snap.get("last_show_results_by_dma", {}) or {}
    return {
        "monthly_listeners_total": snap.get("monthly_listeners_total"),
        "dma_listeners": dma_listeners,
        "dma_listeners_60d_pct_change": dma_delta,
        "top_tracks": snap.get("top_tracks", []),
        "recent_releases": snap.get("recent_releases", []),
        "last_show_results_by_dma": last_shows,
        "as_of_iso": snap.get("as_of_iso"),
    }


def load_praise_bank(sb: Client, contact_id: str) -> list[dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=PRAISE_FRESHNESS_DAYS)).isoformat()
    res = (
        sb.table("praise_bank")
        .select("*")
        .eq("contact_id", contact_id)
        .is_("consumed_at", "null")
        .gte("captured_at_iso", cutoff)
        .gte("specificity_score", PRAISE_SPECIFICITY_FLOOR)
        .order("captured_at_iso", desc=True)
        .limit(5)
        .execute()
    )
    return res.data or []


def gate_freshness(snapshot: dict, praise_hits: list[dict]) -> tuple[bool, bool, list[str]]:
    flags: list[str] = []
    as_of = snapshot.get("as_of_iso")
    stats_ok = False
    if as_of:
        try:
            age = (datetime.now(timezone.utc) - datetime.fromisoformat(as_of.replace("Z", "+00:00"))).days
            stats_ok = age <= STATS_FRESHNESS_DAYS
            if not stats_ok:
                flags.append("stale_stats")
        except Exception:
            flags.append("stats_parse_error")
    else:
        flags.append("no_stats")

    praise_ok = len(praise_hits) > 0
    if not praise_ok:
        flags.append("no_praise_available")

    return stats_ok, praise_ok, flags


def build_analyst_input(
    contact: dict,
    intent: str,
    proposed_date_iso: str | None,
    routing_context: RoutingContext,
    artist_snapshot: dict,
    praise_bank_hits: list[dict],
) -> dict:
    return {
        "contact": {
            "id": contact["id"],
            "name": contact.get("full_name"),
            "role": contact.get("role"),
            "venue_id": contact.get("venue_id"),
            "venue_name": (contact.get("venues") or {}).get("name"),
            "market_city": (contact.get("venues") or {}).get("city") or contact.get("city"),
            "market_state": (contact.get("venues") or {}).get("state") or contact.get("state"),
            "dma": (contact.get("venues") or {}).get("dma"),
            "relationship": contact.get("relationship_strength"),
            "last_interaction_at": contact.get("last_interaction_at"),
        },
        "intent": intent,
        "proposed_date_iso": proposed_date_iso,
        "routing_context": {
            "prior_city": routing_context.prior_city,
            "prior_date_iso": routing_context.prior_date_iso,
            "next_city": routing_context.next_city,
            "next_date_iso": routing_context.next_date_iso,
        },
        "artist_snapshot": artist_snapshot,
        "praise_bank_hits": praise_bank_hits,
    }


def call_model(system_prompt: str, user_payload: dict) -> dict:
    # Routed via model_router so model_calls ledger captures cost + tokens.
    # agent_name='analyst' → tier selected by agents/model_config.py.
    return call_json(
        agent_name="analyst",
        system_prompt=system_prompt,
        payload=user_payload,
        task_type="compose_pitch_pack",
        max_tokens=2000,
        context={
            "contact_id": user_payload.get("contact", {}).get("contact_id"),
            "artist_slug": user_payload.get("artist_snapshot", {}).get("artist_slug"),
        },
    )


def empty_pack(contact: dict, flags: list[str]) -> dict:
    return {
        "target": {
            "contact_id": contact["id"],
            "venue_name": (contact.get("venues") or {}).get("name"),
            "market": (contact.get("venues") or {}).get("city"),
        },
        "praise_hook": None,
        "artist_market_stats": [],
        "fit_rationale": None,
        "ask": {"type": "date_window", "proposed_dates_iso": [], "routing_explanation": None, "flexibility": None},
        "verification_stamps": {
            "stats_freshness_ok": False,
            "praise_freshness_ok": False,
            "praise_specificity_ok": False,
            "no_invented_fields": True,
            "sources_all_linkable": True,
        },
        "confidence_overall": 0.1,
        "flags": flags,
    }


def persist_pack(sb: Client, contact: dict, pack: dict) -> str:
    """Writes to pitch_packs per schema.sql — payload carries the full pack JSON."""
    now = datetime.now(timezone.utc).isoformat()
    expires = (datetime.now(timezone.utc) + timedelta(days=STATS_FRESHNESS_DAYS)).isoformat()

    # mirror freshness dates inside payload so view queries can filter without
    # needing top-level columns
    pack.setdefault("generated_at", now)
    pack.setdefault("expires_at", expires)

    blocked = None
    flags = pack.get("flags") or []
    if any(f.startswith("blocked_") for f in flags):
        blocked = ";".join(f for f in flags if f.startswith("blocked_"))

    row = {
        "contact_id": contact["id"],
        "venue_id": contact.get("venue_id"),
        "market_metro": (contact.get("venues") or {}).get("city"),
        "payload": pack,
        "verification_stamps": pack.get("verification_stamps", {}),
        "blocked_reason": blocked,
    }
    res = sb.table("pitch_packs").insert(row).execute()
    return (res.data or [{}])[0].get("id", "")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--contact-id", required=True)
    ap.add_argument("--intent", default="cold_outreach",
                    choices=["cold_outreach", "warm_pitch", "counter_offer", "market_expansion"])
    ap.add_argument("--proposed-date", default=None)
    ap.add_argument("--prior-city", default=None)
    ap.add_argument("--prior-date", default=None)
    ap.add_argument("--next-city", default=None)
    ap.add_argument("--next-date", default=None)
    ap.add_argument("--dry-run", action="store_true",
                    help="don't write to pitch_packs, just print the pack")
    args = ap.parse_args()

    sb = supabase()
    contact = load_contact(sb, args.contact_id)
    market = (contact.get("venues") or {}).get("city") or contact.get("city")

    artist_snapshot = load_artist_snapshot(sb, market)
    praise_hits = load_praise_bank(sb, args.contact_id)

    stats_ok, praise_ok, gate_flags = gate_freshness(artist_snapshot, praise_hits)

    if not stats_ok:
        pack = empty_pack(contact, ["blocked_stale_stats"] + gate_flags)
        pack_id = "(dry-run)" if args.dry_run else persist_pack(sb, contact, pack)
        print(json.dumps({"pitch_pack_id": pack_id, "pack": pack}, indent=2))
        return 0

    # DMA floor
    dma_listeners = artist_snapshot.get("dma_listeners", {})
    if dma_listeners.get(market, 0) < DMA_LISTENER_FLOOR:
        gate_flags.append("thin_market_data")

    routing = RoutingContext(
        prior_city=args.prior_city,
        prior_date_iso=args.prior_date,
        next_city=args.next_city,
        next_date_iso=args.next_date,
    )

    payload = build_analyst_input(
        contact, args.intent, args.proposed_date, routing, artist_snapshot, praise_hits
    )

    system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
    pack = call_model(system_prompt, payload)

    # safety net: if model invented verification stamps, override with our truth
    pack.setdefault("verification_stamps", {})
    pack["verification_stamps"]["stats_freshness_ok"] = stats_ok
    pack["verification_stamps"]["praise_freshness_ok"] = praise_ok

    # merge our client-side flags
    model_flags = set(pack.get("flags") or [])
    pack["flags"] = sorted(model_flags.union(gate_flags))

    pack_id = "(dry-run)" if args.dry_run else persist_pack(sb, contact, pack)
    print(json.dumps({"pitch_pack_id": pack_id, "pack": pack}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
