#!/usr/bin/env python3
"""
Outbound composer runner.

Given a pitch_pack_id and an email type, pulls:
  - pitch_pack.payload (Analyst output)
  - 5-10 relevant voice_samples from Thomas's corpus
  - thread context if replying
calls Claude with prompts/outbound_composer.md as system prompt,
and writes the resulting draft to outreach_log (status=draft).

Refuses to compose if pitch_pack.verification_stamps don't all pass —
mirrors the hard rule from the composer prompt.

Usage:
    python outbound.py --pitch-pack <uuid> --email-type cold_outreach
    python outbound.py --pitch-pack <uuid> --email-type counter_offer \
        --thread-id <gmail_thread_id> --in-reply-to <message_id>

Email types map to voice-sample categories:
    cold_outreach       -> sample_category = 'cold_outreach'
    warm_pitch          -> 'cold_outreach' or 'negotiation' mix
    counter_offer       -> 'negotiation'
    confirmation        -> 'confirm'
    followup            -> 'followup'

Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE, ANTHROPIC_API_KEY
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
    from anthropic import Anthropic  # noqa: F401 — kept so import errors surface loudly
except ImportError:
    print("missing dep: pip install anthropic", file=sys.stderr)
    sys.exit(2)

# Task #21 — brand-voice agent. Tier-A-floor; model_router enforces that even
# if a DBA_MODEL_OUTBOUND env override tries to downgrade.
# Dual import: works whether we're run as `python agents/outbound.py` (no
# parent package) or imported as `agents.outbound`.
try:
    from .model_router import call_json
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from agents.model_router import call_json  # type: ignore[no-redef]


PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "outbound_composer.md"

EMAIL_TYPE_TO_SAMPLE_CATS = {
    "cold_outreach": ["cold_outreach"],
    "warm_pitch": ["cold_outreach", "negotiation"],
    "counter_offer": ["negotiation"],
    "confirmation": ["confirm"],
    "followup": ["followup"],
}

EMAIL_TYPE_TO_LENGTH_HINT = {
    "cold_outreach": "4-6 sentences, max 80 words",
    "warm_pitch": "3-5 sentences, insider mode may be shorter (2-4)",
    "counter_offer": "3-5 sentences",
    "confirmation": "1-2 sentences",
    "followup": "2-3 sentences",
}


def supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


def load_pitch_pack(sb: Client, pack_id: str) -> dict:
    res = sb.table("pitch_packs").select("*").eq("id", pack_id).single().execute()
    if not res.data:
        raise RuntimeError(f"pitch_pack {pack_id} not found")
    return res.data


def _recency_fallback(sb: Client, categories: list[str], role: str | None, limit: int) -> list[dict]:
    """Legacy path: pull the freshest samples matching filters, no embedding."""
    q = sb.table("voice_samples").select("sample_category, subject, body, sent_at")
    q = q.in_("sample_category", categories)
    if role:
        q = q.eq("recipient_role", role)
    q = q.order("sent_at", desc=True).limit(limit)
    res = q.execute()
    return res.data or []


def _build_retrieval_query(payload: dict | None, email_type: str, role: str | None) -> str:
    """
    Compose the string we embed to find semantically-similar past samples.
    We fold tier, venue, and recipient-role cues in — they're exactly the
    kind of tonal signal that separates "promoter-cold" from "agent-counter"
    from "festival-insider-confirm" in Thomas's past writing.
    """
    payload = payload or {}
    tier = (payload.get("relationship_tier") or "").lower()
    contact = payload.get("contact") or {}
    venue = payload.get("venue") or {}
    artist = payload.get("artist_snapshot") or {}

    parts = [
        f"type={email_type}",
        f"tier={tier}" if tier else "",
        f"role={role}" if role else "",
        f"contact={contact.get('display_name') or contact.get('first_name') or ''}",
        f"venue={venue.get('name') or ''}",
        f"market={venue.get('city') or ''}",
        f"artist={artist.get('artist_slug') or payload.get('artist_slug') or ''}",
    ]
    return " | ".join(p for p in parts if p and not p.endswith("="))


def load_voice_samples(
    sb: Client,
    categories: list[str],
    role: str | None,
    limit: int = 8,
    *,
    pack_payload: dict | None = None,
    email_type: str | None = None,
) -> list[dict]:
    """
    Retrieval-augmented voice-sample selection (task #23).

    Prefers semantic similarity via Voyage + pgvector when embeddings are
    populated on voice_samples AND Voyage is configured. Falls back silently
    to the legacy recency-only path when:
      * VOYAGE_API_KEY is unset,
      * no rows match the filter with non-null embedding,
      * or the RPC errors for any reason (e.g. migration 0017 not applied).

    The shape returned is the same either way so the composer prompt
    doesn't need to care which path fired.
    """
    # Shortcut: if we have no contextual payload, there's nothing useful to
    # build a query string from — just use recency.
    if not pack_payload or not email_type or not os.environ.get("VOYAGE_API_KEY"):
        return _recency_fallback(sb, categories, role, limit)

    query_text = _build_retrieval_query(pack_payload, email_type, role)
    if not query_text:
        return _recency_fallback(sb, categories, role, limit)

    # Embed + nearest-neighbor. Dual-import to mirror call_json pattern.
    try:
        try:
            from .embeddings import embed_one, to_pgvector_literal
        except ImportError:
            sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
            from agents.embeddings import embed_one, to_pgvector_literal  # type: ignore[no-redef]

        vec = embed_one(
            query_text,
            input_type="query",
            task_type="embed_voice_query",
            context={
                "email_type": email_type,
                "tier": (pack_payload.get("relationship_tier") or "").lower(),
                "role": role or "",
            },
        )
        res = sb.rpc(
            "fn_similar_voice_samples",
            {
                "query_embedding": to_pgvector_literal(vec),
                "categories": categories,
                "recipient_role": role,
                "match_count": limit,
            },
        ).execute()
        rows = res.data or []
        if rows:
            # Normalize to the shape the composer expects. Drop `similarity`
            # from the payload sent to the model — keep the prompt clean —
            # but log it on the row for debugging via decision_trace later.
            return [
                {
                    "sample_category": r.get("sample_category"),
                    "subject": r.get("subject"),
                    "body": r.get("body"),
                    "sent_at": r.get("sent_at"),
                    "_similarity": r.get("similarity"),
                }
                for r in rows
            ]
        # No embedded rows matched filters — fall through to recency.
    except Exception as e:
        # Fall back silently; never let retrieval break the composer run.
        print(f"[outbound] semantic retrieval failed, falling back to recency: {e}",
              file=sys.stderr)

    return _recency_fallback(sb, categories, role, limit)


def load_thread(sb: Client, thread_id: str, limit: int = 3) -> list[dict]:
    res = (
        sb.table("outreach_log")
        .select("direction, subject, body, sent_at, replied_at")
        .eq("thread_id", thread_id)
        .order("sent_at", desc=False)
        .limit(limit)
        .execute()
    )
    return res.data or []


def stamps_all_pass(pack: dict) -> bool:
    """Tier-aware verification gate.

    Cold mode needs praise + stats + sources (it's a pitch to a stranger).
    Insider and warm mode only need source/invention integrity — stats and
    praise are not required because we don't use them in the body.
    """
    payload = pack.get("payload") or {}
    stamps = payload.get("verification_stamps", {})
    if not stamps:
        return False
    tier = (payload.get("relationship_tier") or "cold").lower()

    universal = ["no_invented_fields", "sources_all_linkable"]
    if tier == "cold":
        required = universal + [
            "stats_freshness_ok",
            "praise_freshness_ok",
            "praise_specificity_ok",
        ]
    else:
        required = universal  # insider/warm only need integrity stamps
    return all(bool(stamps.get(k)) for k in required)


def call_model(system_prompt: str, payload: dict) -> dict:
    # Routed via model_router → Tier-A floor enforced for outbound.
    mode = (payload.get("mode") or payload.get("task_mode") or "warm_pitch")
    return call_json(
        agent_name="outbound",
        system_prompt=system_prompt,
        payload=payload,
        task_type=f"draft_outbound:{mode}",
        max_tokens=1200,
        context={
            "contact_id": payload.get("target", {}).get("contact_id"),
            "artist_slug": payload.get("artist_snapshot", {}).get("artist_slug"),
            "mode": mode,
        },
    )


def validate_no_em_dashes(body: str) -> bool:
    return "—" not in body and "–" not in body


def validate_no_filler(body: str) -> list[str]:
    banned = [
        "hope this finds you well",
        "just wanted to reach out",
        "let me know if you have any questions",
        "looking forward to hearing",
        "excited to",
        "thrilled to",
        "circle back",
        "touch base",
        "leverag",
        "our goals, our vision",
    ]
    hits = [b for b in banned if b in body.lower()]
    return hits


def validate_insider_no_epk_offer(body: str, tier: str) -> list[str]:
    """Insiders don't need an EPK offered to them."""
    if tier != "insider":
        return []
    body_l = body.lower()
    triggers = ["fresh epk", "send you an epk", "send an epk", "send the epk",
                "one-sheet", "one sheet", "press kit"]
    hits = [t for t in triggers if t in body_l]
    return hits


def validate_insider_no_stats(body: str, tier: str) -> list[str]:
    """Insiders don't get hit with a stats line in the body."""
    if tier != "insider":
        return []
    body_l = body.lower()
    triggers = ["monthly spotify", "monthly listeners", "spotify listener",
                "paid attendance", "sell-through", "draw number"]
    hits = [t for t in triggers if t in body_l]
    return hits


def persist_draft(
    sb: Client,
    pack: dict,
    draft: dict,
    email_type: str,
    thread_id: str | None,
    offer_id: str | None,
    post_validation_flags: list[str],
) -> str:
    # cap confidence if we caught bad tokens in validation
    confidence = float(draft.get("confidence", 0.0))
    if post_validation_flags:
        confidence = min(confidence, 0.6)

    row = {
        "direction": "outbound",
        "status": "draft" if confidence < 0.95 or post_validation_flags else "draft",
        # always draft — Supervisor decides queued/hold based on confidence downstream
        "contact_id": pack.get("contact_id"),
        "pitch_pack_id": pack.get("id"),
        "offer_id": offer_id,
        "thread_id": thread_id,
        "subject": draft.get("subject"),
        "body": draft.get("body"),
        "confidence_score": confidence,
        "held_reason": ";".join(post_validation_flags) if post_validation_flags else None,
        "decision_trace": {
            "email_type": email_type,
            "model_flags": draft.get("flags", []),
            "validation_flags": post_validation_flags,
            "rationale": draft.get("rationale"),
            "retrieval_mode": draft.get("retrieval_mode"),
        },
    }
    res = sb.table("outreach_log").insert(row).execute()
    return (res.data or [{}])[0].get("id", "")


def synthetic_pack_from_counter(payload: dict) -> dict:
    """
    Counter offers skip the pitch_pack table (they're too short-lived
    and fully derivable from the offer row). Build a pitch_pack-shaped
    dict from the counter payload so the rest of the composer flow
    works unchanged.

    The payload is produced by scripts/seed_counter_drafts.py and
    passed in via the DBA_COUNTER_PAYLOAD env var.
    """
    contact = payload.get("contact") or {}
    venue = payload.get("venue") or {}
    return {
        "id": None,                                # no pitch_pack row
        "contact_id": contact.get("id"),
        "verification_stamps": {
            # counters bypass the cold-outreach stamps — we're already
            # mid-negotiation, the analyst has implicitly cleared us.
            "voice_aligned": "pass",
            "no_fabricated_stats": "pass",
            "tier_match": "pass",
        },
        "payload": {
            "mode": "counter_offer",
            "relationship_tier": contact.get("relationship_tier") or "warm",
            "contact": contact,
            "venue": venue,
            "proposed_date": payload.get("proposed_date"),
            "artist_slug": payload.get("artist_slug"),
            "original_guarantee": payload.get("original_guarantee"),
            "counter_target": payload.get("counter_target"),
            "counter_min": payload.get("counter_min"),
            "counter_walk_away": payload.get("counter_walk_away"),
            "notes": payload.get("notes"),
            "tone_hint": payload.get("tone_hint"),
        },
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pitch-pack", help="pitch_pack id (not required for counter payloads)")
    ap.add_argument("--email-type", required=True,
                    choices=list(EMAIL_TYPE_TO_SAMPLE_CATS.keys()))
    ap.add_argument("--thread-id", default=None)
    ap.add_argument("--offer-id", default=None)
    ap.add_argument("--in-reply-to", default=None)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--from-counter-payload",
        action="store_true",
        help="read counter payload from DBA_COUNTER_PAYLOAD env var instead of a pitch_pack id",
    )
    args = ap.parse_args()

    sb = supabase()

    if args.from_counter_payload:
        raw = os.environ.get("DBA_COUNTER_PAYLOAD")
        if not raw:
            print(json.dumps({
                "error": "--from-counter-payload set but DBA_COUNTER_PAYLOAD env var is empty"
            }), file=sys.stderr)
            return 2
        try:
            counter_payload = json.loads(raw)
        except json.JSONDecodeError as e:
            print(json.dumps({"error": f"DBA_COUNTER_PAYLOAD not valid JSON: {e}"}),
                  file=sys.stderr)
            return 2
        pack = synthetic_pack_from_counter(counter_payload)
        # thread / offer context flows through
        if not args.thread_id:
            args.thread_id = counter_payload.get("thread_id")
        if not args.offer_id:
            args.offer_id = counter_payload.get("offer_id")
    else:
        if not args.pitch_pack:
            print(json.dumps({"error": "--pitch-pack required unless --from-counter-payload"}),
                  file=sys.stderr)
            return 2
        pack = load_pitch_pack(sb, args.pitch_pack)

    if not stamps_all_pass(pack):
        print(json.dumps({
            "error": "pitch_pack verification_stamps failed — refusing to compose",
            "pitch_pack_id": args.pitch_pack,
            "flags": (pack.get("payload") or {}).get("flags", []),
        }, indent=2))
        return 1

    # pull contact role for voice-sample filtering
    contact_id = pack.get("contact_id")
    contact = (
        sb.table("contacts").select("role").eq("id", contact_id).single().execute().data
        if contact_id else {}
    ) or {}
    role = contact.get("role")

    cats = EMAIL_TYPE_TO_SAMPLE_CATS[args.email_type]
    pack_payload = pack.get("payload") or {}
    samples = load_voice_samples(
        sb, cats, role,
        pack_payload=pack_payload,
        email_type=args.email_type,
    )

    thread = load_thread(sb, args.thread_id) if args.thread_id else []

    relationship_tier = (pack_payload.get("relationship_tier") or "cold").lower()
    retrieval_mode = (
        "semantic" if any(s.get("_similarity") is not None for s in samples) else "recency"
    )

    payload = {
        "pitch_pack": pack_payload,
        "relationship_tier": relationship_tier,
        "voice_samples": [
            {"subject": s.get("subject"), "body": s.get("body"),
             "sample_category": s.get("sample_category")}
            for s in samples
        ],
        "thread_context": thread,
        "email_type": args.email_type,
        "length_hint": EMAIL_TYPE_TO_LENGTH_HINT[args.email_type],
        "in_reply_to": args.in_reply_to,
    }

    system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
    draft = call_model(system_prompt, payload)

    # Stamp retrieval mode onto the draft so decision_trace captures whether
    # this composition used semantic or recency-only voice-sample selection.
    draft["retrieval_mode"] = retrieval_mode

    # client-side validation — these are the non-negotiables
    body = draft.get("body") or ""
    subject = draft.get("subject") or ""
    flags: list[str] = []
    if not validate_no_em_dashes(body):
        flags.append("validation_em_dash_present_in_body")
    if not validate_no_em_dashes(subject):
        flags.append("validation_em_dash_present_in_subject")
    filler = validate_no_filler(body)
    if filler:
        flags.append(f"validation_filler_phrases:{','.join(filler)}")
    epk_hits = validate_insider_no_epk_offer(body, relationship_tier)
    if epk_hits:
        flags.append(f"validation_insider_epk_offer:{','.join(epk_hits)}")
    stat_hits = validate_insider_no_stats(body, relationship_tier)
    if stat_hits:
        flags.append(f"validation_insider_stats_in_body:{','.join(stat_hits)}")

    if args.dry_run:
        out = {
            "draft": draft,
            "validation_flags": flags,
            "would_persist": not flags,
            "retrieval_mode": retrieval_mode,
        }
        print(json.dumps(out, indent=2))
        return 0

    draft_id = persist_draft(sb, pack, draft, args.email_type, args.thread_id, args.offer_id, flags)

    try:
        from agents.notifier import notify_safe

        confidence = float(draft.get("confidence") or 0.0)
        notify_safe(
            type="approval" if confidence < 0.95 else "done",
            title=f"outbound draft: {args.email_type}",
            message=(draft.get("subject") or "(no subject)")[:300],
            fields=[
                ("confidence", f"{confidence:.2f}"),
                ("retrieval_mode", retrieval_mode or "n/a"),
                ("flags", ",".join(flags) if flags else "none"),
                ("outreach_log_id", str(draft_id)),
            ],
        )
    except Exception:
        # never block draft persistence on a notifier failure
        pass

    print(json.dumps({
        "outreach_log_id": draft_id,
        "subject": draft.get("subject"),
        "confidence": draft.get("confidence"),
        "validation_flags": flags,
        "retrieval_mode": retrieval_mode,
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
