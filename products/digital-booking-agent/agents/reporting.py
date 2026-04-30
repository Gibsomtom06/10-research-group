#!/usr/bin/env python3
"""
Reporting runner — produces daily and weekly rollups.

Modes:
    --period daily     snapshot of last 24h (default)
    --period weekly    rollup of last 7 days
    --period custom --from YYYY-MM-DD --to YYYY-MM-DD

Writes a row to the `reports` table (id, period, created_at, payload, markdown)
so the Next.js app can render it at /reports/[id] without hitting the model
again.

Output sections (from prompts/reporting.md):
    1. scorecard — counts, rates, deltas
    2. what moved — list of wins / closes / sent pitches that landed
    3. what's stuck — inbound awaiting, bounces, blocked pitch packs, DNC adds
    4. recommended next action — ONE concrete next step

No em-dashes. No filler. Specific numbers or nothing.

Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE
    ANTHROPIC_API_KEY (optional — if absent, writes the data-only version)
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


PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "reporting.md"


def supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


def window_for(period: str, iso_from: str | None, iso_to: str | None) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    if period == "daily":
        start = now - timedelta(hours=24)
        return start.isoformat(), now.isoformat()
    if period == "weekly":
        start = now - timedelta(days=7)
        return start.isoformat(), now.isoformat()
    if period == "custom":
        if not iso_from or not iso_to:
            raise ValueError("custom period requires --from and --to")
        return iso_from, iso_to
    raise ValueError(f"unknown period: {period}")


def gather(sb: Client, start_iso: str, end_iso: str) -> dict[str, Any]:
    """Pull the raw counts and lists the reporter will narrate."""
    # Outbound sent in window
    sent = (
        sb.table("outreach_log")
        .select("id, contact_id, subject, sent_at, replied_at, confidence_score")
        .eq("direction", "outbound")
        .eq("status", "sent")
        .gte("sent_at", start_iso)
        .lte("sent_at", end_iso)
        .execute()
    ).data or []

    # Inbound in window
    inbound = (
        sb.table("outreach_log")
        .select("id, contact_id, subject, created_at, replied_at")
        .eq("direction", "inbound")
        .gte("created_at", start_iso)
        .lte("created_at", end_iso)
        .execute()
    ).data or []

    # Bounces in window
    bounces = (
        sb.table("outreach_log")
        .select("id, contact_id, subject, created_at, bounce_type, bounced_for_id")
        .eq("is_bounce", True)
        .gte("created_at", start_iso)
        .lte("created_at", end_iso)
        .execute()
    ).data or []

    # Held / rejected drafts in window
    held = (
        sb.table("outreach_log")
        .select("id, contact_id, held_reason, created_at")
        .eq("status", "held_for_review")
        .gte("created_at", start_iso)
        .lte("created_at", end_iso)
        .execute()
    ).data or []

    rejected = (
        sb.table("outreach_log")
        .select("id, contact_id, cancelled_reason, rejected_at")
        .eq("status", "rejected")
        .gte("rejected_at", start_iso)
        .lte("rejected_at", end_iso)
        .execute()
    ).data or []

    # Offers received in window (via created_at)
    offers = (
        sb.table("offers")
        .select("id, contact_id, venue_name, city, state, guarantee_usd, is_hold, sensitivity_flags, created_at")
        .gte("created_at", start_iso)
        .lte("created_at", end_iso)
        .execute()
    ).data or []

    # Currently pending reminders (not windowed — that's "what's stuck right now")
    reminders = (
        sb.table("v_reach_back_reminders")
        .select("contact_id, full_name, lane, reason")
        .limit(100)
        .execute()
    ).data or []

    # DNC additions in window (decisions audit)
    dnc_actions = (
        sb.table("decisions")
        .select("id, input_snapshot, reasoning, created_at")
        .eq("action", "set_dnc")
        .gte("created_at", start_iso)
        .lte("created_at", end_iso)
        .execute()
    ).data or []

    # Reply rate: inbound replies to outbounds sent in window
    reply_hits = [s for s in sent if s.get("replied_at")]
    reply_rate = (len(reply_hits) / len(sent)) if sent else 0.0

    return {
        "window_start": start_iso,
        "window_end": end_iso,
        "scorecard": {
            "outbound_sent": len(sent),
            "inbound_received": len(inbound),
            "offers_received": len(offers),
            "reply_rate": round(reply_rate, 3),
            "held_for_review": len(held),
            "rejected": len(rejected),
            "bounces": len(bounces),
            "dnc_added": len(dnc_actions),
            "pending_reminders": len(reminders),
        },
        "sent": sent,
        "inbound": inbound,
        "bounces": bounces,
        "held": held,
        "rejected": rejected,
        "offers": offers,
        "reminders": reminders,
        "dnc_actions": dnc_actions,
    }


def lanes_breakdown(reminders: list[dict]) -> dict[str, int]:
    out: dict[str, int] = {}
    for r in reminders:
        lane = r.get("lane", "unknown")
        out[lane] = out.get(lane, 0) + 1
    return out


def default_markdown(raw: dict[str, Any], period: str) -> str:
    """
    Data-only markdown, usable when no model key is configured.
    Follows prompts/reporting.md structure: no em-dashes, specific numbers,
    one recommendation.
    """
    s = raw["scorecard"]
    lanes = lanes_breakdown(raw["reminders"])
    start = raw["window_start"][:10]
    end = raw["window_end"][:10]

    lines: list[str] = []
    lines.append(f"# DBA {period} report · {start} to {end}")
    lines.append("")
    lines.append("## scorecard")
    lines.append(f"- outbound sent: {s['outbound_sent']}")
    lines.append(f"- inbound received: {s['inbound_received']}")
    lines.append(f"- offers received: {s['offers_received']}")
    lines.append(f"- reply rate: {int(s['reply_rate'] * 100)}%")
    lines.append(f"- held for review: {s['held_for_review']}")
    lines.append(f"- bounces: {s['bounces']}")
    lines.append(f"- DNC added: {s['dnc_added']}")
    lines.append(f"- pending reminders: {s['pending_reminders']}")
    lines.append("")

    lines.append("## what moved")
    if raw["offers"]:
        for o in raw["offers"][:5]:
            loc = ", ".join(x for x in [o.get("city"), o.get("state")] if x)
            g = o.get("guarantee_usd")
            gstr = f" @ ${g:,.0f}" if g else ""
            lines.append(f"- offer: {o.get('venue_name') or 'unknown venue'} ({loc}){gstr}")
    if raw["inbound"]:
        lines.append(f"- {len(raw['inbound'])} inbound threads picked up, {len([i for i in raw['inbound'] if i.get('replied_at')])} already replied to")
    if not raw["offers"] and not raw["inbound"]:
        lines.append("- nothing closed or pitched in this window")
    lines.append("")

    lines.append("## what's stuck")
    if s["pending_reminders"]:
        parts = [f"{k}: {v}" for k, v in lanes.items()]
        lines.append(f"- {s['pending_reminders']} contacts on the reminders page (" + ", ".join(parts) + ")")
    if s["bounces"]:
        lines.append(f"- {s['bounces']} emails bounced; check /outreach?filter=bounced and get better addresses")
    if s["held_for_review"]:
        lines.append(f"- {s['held_for_review']} drafts held for human review; see /drafts")
    if not any([s["pending_reminders"], s["bounces"], s["held_for_review"]]):
        lines.append("- nothing blocked")
    lines.append("")

    lines.append("## recommended next action")
    # Single, concrete recommendation
    if s["held_for_review"] > 0:
        lines.append(f"- clear the {s['held_for_review']} drafts waiting for review at /drafts before the next sender tick")
    elif lanes.get("inbound_awaiting_us", 0) > 0:
        lines.append(f"- reply to the {lanes['inbound_awaiting_us']} inbound threads that have been waiting 48+ hours")
    elif s["bounces"] > 0:
        lines.append(f"- fix the {s['bounces']} bounced email addresses at /outreach?filter=bounced")
    elif s["offers_received"] > 0:
        lines.append(f"- evaluate the {s['offers_received']} new offers in /drafts and accept / counter")
    else:
        lines.append("- nothing on fire; push outbound volume, target cold reconnects in /reminders")

    return "\n".join(lines)


def persist(sb: Client, period: str, raw: dict[str, Any], markdown: str) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "period": period,
        "window_start": raw["window_start"],
        "window_end": raw["window_end"],
        "payload": raw["scorecard"],
        "markdown": markdown,
        "created_at": now,
    }
    try:
        res = sb.table("reports").insert(row).execute()
        return {"ok": True, "id": (res.data or [{}])[0].get("id")}
    except Exception as e:
        # Reports table may not exist yet; fall back to decisions audit
        sb.table("decisions").insert({
            "actor": "reporting",
            "action": f"generate_{period}_report",
            "input_snapshot": {"window_start": raw["window_start"], "window_end": raw["window_end"]},
            "output_snapshot": {"scorecard": raw["scorecard"]},
            "reasoning": f"reports table unavailable ({e!s}); markdown below:\n\n{markdown}",
        }).execute()
        return {"ok": False, "fallback": "decisions_audit", "error": str(e)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--period", choices=["daily", "weekly", "custom"], default="daily")
    ap.add_argument("--from", dest="iso_from", default=None)
    ap.add_argument("--to", dest="iso_to", default=None)
    ap.add_argument("--dry-run", action="store_true", help="print markdown, don't insert")
    ap.add_argument("--print-markdown", action="store_true", help="also print to stdout")
    args = ap.parse_args()

    start_iso, end_iso = window_for(args.period, args.iso_from, args.iso_to)

    sb = supabase_client()
    raw = gather(sb, start_iso, end_iso)
    md = default_markdown(raw, args.period)

    if args.dry_run:
        print(md)
        print(json.dumps({"scorecard": raw["scorecard"]}, indent=2))
        return 0

    result = persist(sb, args.period, raw, md)
    if args.print_markdown:
        print(md)
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
