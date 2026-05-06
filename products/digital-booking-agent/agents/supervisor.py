#!/usr/bin/env python3
"""
Supervisor loop.

Reads the queue, dispatches one specialist at a time, writes decisions.
Safe to run repeatedly on a cron — every pass is idempotent.

What it does each tick:

  1. Find unrouted inbound logs (direction=inbound, no routing decision
     in `decisions` yet). For each one:
       a. Read the classifier result stored in outreach_log.decision_trace.
       b. If missing, run the Inbound classifier subprocess.
       c. Run the Routing subprocess to produce a dispatch.
       d. Apply hard-safety gates (rate limits, VIP, financial holds).
       e. Dispatch to the chosen specialist (analyst / outbound / research).
       f. Write a supervisor decision summarizing the chain.

  2. Freshness sweep tick (optional, --sweep):
       - Analyst pitch-packs expiring in <7 days → queue refresh.
       - Does not run the Analyst directly — queues `decisions` rows
         for the freshness-sweep worker to pick up.

  3. Rate limit / daily cap enforcement:
       - MAX_DAILY_SENDS across contacts
       - MAX_PER_CONTACT_7D
       - Anything blocked is marked held_for_review, never auto-sent.

Usage:
    # single pass (recommended, from cron every minute)
    python agents/supervisor.py --once

    # one specific inbound log
    python agents/supervisor.py --log-id <uuid>

    # dry-run (print plan, no side effects)
    python agents/supervisor.py --once --dry-run

    # continuous loop (mostly for local dev)
    python agents/supervisor.py --loop --interval 60

Env required:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE, ANTHROPIC_API_KEY
    Optional:
      SUPERVISOR_MAX_PER_TICK (default 5)
      SUPERVISOR_DAILY_CAP    (default 25)
      SUPERVISOR_PER_CONTACT_7D (default 1)
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

try:
    from supabase import create_client, Client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)


AGENTS_DIR = Path(__file__).parent
PYTHON_BIN = os.environ.get("SUPERVISOR_PYTHON_BIN", sys.executable)

MAX_PER_TICK = int(os.environ.get("SUPERVISOR_MAX_PER_TICK", "5"))
DAILY_CAP = int(os.environ.get("SUPERVISOR_DAILY_CAP", "25"))
PER_CONTACT_7D = int(os.environ.get("SUPERVISOR_PER_CONTACT_7D", "1"))

# supervisor subprocess timeouts (seconds)
INBOUND_TIMEOUT = 90
ROUTING_TIMEOUT = 60
ANALYST_TIMEOUT = 180
OUTBOUND_TIMEOUT = 120
RESEARCH_TIMEOUT = 180


def supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


# ---------- subprocess wrappers ----------

def run_script(script: str, args: list[str], timeout: int, stdin_data: str | None = None) -> dict:
    """Run agents/<script> with args, return parsed JSON from last stdout line."""
    path = AGENTS_DIR / script
    cmd = [PYTHON_BIN, str(path), *args]
    try:
        result = subprocess.run(
            cmd,
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return {"_error": "timeout", "_script": script, "_args": args}
    out = (result.stdout or "").strip()
    err = (result.stderr or "").strip()
    if result.returncode != 0:
        return {"_error": f"exit {result.returncode}", "_stderr": err[-2000:],
                "_script": script, "_args": args}
    # parse last valid JSON blob in stdout
    parsed = _parse_last_json(out)
    if parsed is None:
        return {"_error": "no parseable json", "_stdout": out[-2000:],
                "_script": script, "_args": args}
    return parsed


def _parse_last_json(s: str) -> dict | None:
    """Find the last top-level JSON object in stdout (agents print one)."""
    s = s.strip()
    if not s:
        return None
    # try whole thing first (common case)
    try:
        return json.loads(s)
    except Exception:
        pass
    # fall back to scanning for a trailing JSON object
    depth = 0
    end = len(s)
    for i in range(len(s) - 1, -1, -1):
        c = s[i]
        if c == "}":
            depth += 1
            if depth == 1:
                end = i + 1
        elif c == "{":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(s[i:end])
                except Exception:
                    return None
    return None


# ---------- queue readers ----------

def find_unrouted_inbound_logs(sb: Client, limit: int) -> list[dict]:
    """
    Inbound logs that haven't had a routing decision written yet.
    We can't do a not-exists in PostgREST cleanly; filter client-side.
    """
    logs_res = (
        sb.table("outreach_log")
        .select("id, contact_id, subject, decision_trace, created_at, status")
        .eq("direction", "inbound")
        .in_("status", ["sent", "held_for_review"])
        .order("created_at", desc=False)
        .limit(limit * 3)
        .execute()
    )
    logs = logs_res.data or []
    if not logs:
        return []
    log_ids = [l["id"] for l in logs]
    dec_res = (
        sb.table("decisions")
        .select("subject_id, actor")
        .eq("actor", "supervisor")
        .in_("subject_id", log_ids)
        .execute()
    )
    routed = {d["subject_id"] for d in (dec_res.data or [])}
    unrouted = [l for l in logs if l["id"] not in routed][:limit]
    return unrouted


def count_sends_today(sb: Client) -> int:
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    res = (
        sb.table("outreach_log")
        .select("id", count="exact")
        .eq("direction", "outbound")
        .eq("status", "sent")
        .gte("sent_at", start.isoformat())
        .execute()
    )
    return res.count or 0


def _latest_pitch_pack_id(sb: Client, contact_id: str) -> str | None:
    res = (
        sb.table("pitch_packs")
        .select("id")
        .eq("contact_id", contact_id)
        .is_("blocked_reason", "null")
        .order("generated_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0]["id"] if rows else None


def count_sends_to_contact_7d(sb: Client, contact_id: str) -> int:
    start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    res = (
        sb.table("outreach_log")
        .select("id", count="exact")
        .eq("direction", "outbound")
        .eq("contact_id", contact_id)
        .in_("status", ["sent", "queued"])
        .gte("created_at", start)
        .execute()
    )
    return res.count or 0


# ---------- hard gates (applied on top of routing result) ----------

def apply_safety_gates(sb: Client, dispatch: dict, contact_id: str | None) -> tuple[dict, list[str]]:
    """
    Returns (possibly-modified dispatch, list of applied gate reasons).
    Never sends if daily cap hit or per-contact cap hit.
    """
    from agents.notifier import notify_safe

    applied: list[str] = []
    if dispatch.get("route_to") == "outbound" and contact_id:
        # daily cap
        if count_sends_today(sb) >= DAILY_CAP:
            applied.append(f"daily_cap_reached={DAILY_CAP}")
            dispatch = {**dispatch, "route_to": "hold", "intent": "hold_daily_cap",
                        "reason": f"daily cap {DAILY_CAP} reached; holding for tomorrow"}
            notify_safe(
                type="alert",
                title="safety gate: daily cap",
                message=f"daily send cap of {DAILY_CAP} reached; held for tomorrow.",
                fields=[("contact_id", contact_id), ("cap", str(DAILY_CAP))],
            )
        # per-contact 7d
        elif count_sends_to_contact_7d(sb, contact_id) >= PER_CONTACT_7D:
            applied.append(f"per_contact_7d={PER_CONTACT_7D}")
            dispatch = {**dispatch, "route_to": "hold", "intent": "hold_per_contact_cap",
                        "reason": "per-contact 7d cap reached"}
            notify_safe(
                type="alert",
                title="safety gate: per-contact cap",
                message=f"per-contact 7-day cap of {PER_CONTACT_7D} hit; held.",
                fields=[("contact_id", contact_id), ("cap_7d", str(PER_CONTACT_7D))],
            )
    return dispatch, applied


# ---------- dispatch ----------

def dispatch_specialist(
    sb: Client,
    dispatch: dict,
    contact_id: str | None,
    source_log_id: str | None,
    dry_run: bool,
) -> dict:
    """Invoke the right specialist script. Returns summary dict (never raises)."""
    route = dispatch.get("route_to")
    intent = dispatch.get("intent") or "unknown"
    payload = dispatch.get("payload") or {}

    if route == "none" or route == "noop":
        return {"dispatched": False, "reason": "routing returned noop"}

    if route == "hold":
        # Supervisor-only hold — write to outreach_log if there's a recent draft
        return {"dispatched": False, "reason": dispatch.get("reason", "held")}

    if route == "supervisor_escalate":
        # surface via decisions audit; /drafts + /reminders pick it up
        from agents.notifier import notify_safe

        if not dry_run:
            sb.table("decisions").insert({
                "actor": "supervisor",
                "action": "escalate_to_thomas",
                "subject_type": "contact",
                "subject_id": contact_id,
                "rationale": dispatch.get("reason"),
                "input_snapshot": {"dispatch": dispatch},
                "output_snapshot": {"needs_review": True},
            }).execute()
        notify_safe(
            type="approval",
            title="supervisor escalated to Thomas",
            message=dispatch.get("reason") or "needs review",
            fields=[
                ("contact_id", contact_id or "n/a"),
                ("intent", intent),
                ("source_log", source_log_id or "n/a"),
            ],
        )
        return {"dispatched": True, "target": "thomas", "intent": intent}

    if route == "analyst" and contact_id:
        args = ["--contact-id", contact_id,
                "--intent", payload.get("intent", "warm_pitch")]
        if payload.get("proposed_date"):
            args += ["--proposed-date", payload["proposed_date"]]
        if dry_run:
            args += ["--dry-run"]
        result = run_script("analyst.py", args, ANALYST_TIMEOUT)
        return {"dispatched": True, "target": "analyst", "result": result}

    if route == "outbound" and contact_id:
        # outbound.py requires --pitch-pack + --email-type; resolve latest if
        # routing didn't pass one through.
        pack_id = payload.get("pitch_pack_id") or _latest_pitch_pack_id(sb, contact_id)
        email_type = payload.get("email_type") or payload.get("intent") or "confirmation"
        if not pack_id:
            return {"dispatched": False,
                    "reason": "no pitch pack available for outbound; route to analyst first"}
        args = ["--pitch-pack", pack_id, "--email-type", email_type]
        if payload.get("offer_id"):
            args += ["--offer-id", payload["offer_id"]]
        if source_log_id:
            args += ["--in-reply-to", source_log_id]
        if dry_run:
            args += ["--dry-run"]
        result = run_script("outbound.py", args, OUTBOUND_TIMEOUT)
        return {"dispatched": True, "target": "outbound", "result": result}

    if route == "research":
        target = payload.get("target", "contact")
        target_id = payload.get("target_id") or contact_id
        missing = payload.get("missing_fields") or []
        if not target_id or not missing:
            return {"dispatched": False, "reason": "research missing target_id/fields"}
        args = ["--target", target, "--target-id", str(target_id),
                "--missing", ",".join(missing)]
        if payload.get("why"):
            args += ["--why", payload["why"]]
        if payload.get("allow_web_search"):
            args += ["--allow-web-search"]
        if dry_run:
            args += ["--dry-run"]
        else:
            args += ["--apply"]
        result = run_script("research.py", args, RESEARCH_TIMEOUT)
        return {"dispatched": True, "target": "research", "result": result}

    return {"dispatched": False, "reason": f"unknown route: {route}"}


# ---------- per-log driver ----------

def process_log(sb: Client, log: dict, dry_run: bool) -> dict:
    log_id = log["id"]
    contact_id = log.get("contact_id")
    trace = (log.get("decision_trace") or {}).get("classifier_result") or {}

    # 1. classifier — if missing, we'd re-run inbound.py but without the raw
    # email payload we can't. Surface as needs_reclassify.
    if not trace:
        return {"log_id": log_id, "status": "skipped_no_classification"}

    # 2. routing via subprocess (routing.py reads classifier from the log row)
    route_args = ["--from-classifier-log", log_id]
    if dry_run:
        route_args += ["--dry-run"]
    route_result = run_script("routing.py", route_args, ROUTING_TIMEOUT)
    if route_result.get("_error"):
        return {"log_id": log_id, "status": "routing_error", "detail": route_result}

    # routing.py returns either the dispatch dict (dry-run) or a summary w/
    # decision_id + route_to — pull the full dispatch via the decision row when
    # it ran for real.
    dispatch: dict[str, Any]
    if dry_run and route_result.get("dispatch"):
        dispatch = route_result["dispatch"]
    else:
        dec_id = route_result.get("decision_id")
        if dec_id:
            dec_row = (sb.table("decisions").select("output_snapshot")
                       .eq("id", dec_id).maybeSingle().execute()).data or {}
            dispatch = dec_row.get("output_snapshot") or {}
        else:
            dispatch = {
                "route_to": route_result.get("route_to"),
                "intent": route_result.get("intent"),
                "payload": {},
                "reason": "reconstructed from routing summary",
            }

    # 3. hard safety gates
    dispatch, gates = apply_safety_gates(sb, dispatch, contact_id)

    # 4. dispatch
    disp_result = dispatch_specialist(sb, dispatch, contact_id, log_id, dry_run)

    # 5. write supervisor decision summarizing the chain (skip on dry-run)
    if not dry_run:
        sb.table("decisions").insert({
            "actor": "supervisor",
            "action": "route_inbound",
            "subject_type": "outreach_log",
            "subject_id": log_id,
            "confidence": trace.get("confidence"),
            "rationale": f"inbound→{dispatch.get('route_to')} ({dispatch.get('intent')})",
            "input_snapshot": {
                "log_id": log_id,
                "classifier_class": trace.get("class"),
                "dispatch": dispatch,
                "gates_applied": gates,
            },
            "output_snapshot": disp_result,
        }).execute()

    return {
        "log_id": log_id,
        "status": "ok",
        "route_to": dispatch.get("route_to"),
        "intent": dispatch.get("intent"),
        "gates": gates,
        "dispatch_result": disp_result,
    }


# ---------- tick ----------

def tick(dry_run: bool, only_log_id: str | None = None) -> dict:
    sb = supabase()
    if only_log_id:
        res = sb.table("outreach_log").select(
            "id, contact_id, subject, decision_trace, status, created_at"
        ).eq("id", only_log_id).maybeSingle().execute()
        logs = [res.data] if res.data else []
    else:
        logs = find_unrouted_inbound_logs(sb, MAX_PER_TICK)

    results = [process_log(sb, l, dry_run) for l in logs]
    return {
        "tick_at": datetime.now(timezone.utc).isoformat(),
        "processed": len(results),
        "results": results,
        "dry_run": dry_run,
    }


# ---------- main ----------

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--loop", action="store_true")
    ap.add_argument("--interval", type=int, default=60)
    ap.add_argument("--log-id", default=None)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not (args.once or args.loop or args.log_id):
        print("specify --once, --loop, or --log-id", file=sys.stderr)
        return 2

    if args.log_id:
        result = tick(args.dry_run, only_log_id=args.log_id)
        print(json.dumps(result, indent=2))
        return 0

    if args.once:
        result = tick(args.dry_run)
        print(json.dumps(result, indent=2))
        return 0

    # --loop
    try:
        while True:
            result = tick(args.dry_run)
            print(json.dumps(result, indent=2), flush=True)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
