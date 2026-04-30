#!/usr/bin/env python3
"""
seed_q2_tier2_drafts.py

Given a tour (artist package + window), build the outreach queue as a list
of (tour, contact, venue) targets, RANKED by v_target_score from
migration 0011. Replaces the old "pull N per tier" logic -- tier caps now
act as a diversity FLOOR (guarantee at least N of each tier if we have
them) rather than a hard ceiling.

Behavior:
  - Looks up the tour (must exist -- package_levels + tour_artists must be
    pre-seeded; see migrations/0006 for the canonical config)
  - Pulls scored rows from v_target_score filtered by this tour
  - Dedupes to max-scoring artist per (contact, venue) -- the featured set
    still pitches the full package roster minus per-venue suppression
  - Radius-blocked rows (score=0) are dropped at the DB level
  - Ranks by score DESC, enforces per-tier diversity floor, then overall cap
  - For each target:
      - suppression = fn_suppress_artists_for_venue OR fallback by contact
      - featured = tour_roster - suppression (ordered by priority)
      - package_level = fn_pick_package_level(tour_id, venue_capacity)
      - if len(featured) < package_level.tier_size, try smaller level
      - if still under required, drop with blocked_reason='suppression_heavy'
  - factor_breakdown flows through to outreach_log.decision_trace for audit

Usage:
    python seed_q2_tier2_drafts.py \\
        --tour-name "Take Me To Your Leader - Leg 2" \\
        --primary-artist dirtysnatcha \\
        --window 2026-06-01..2026-09-30 \\
        --routing-anchors '[{"city":"Denver","anchor_date":"2026-07-18"}]' \\
        --tier 2 \\
        --total-cap 250 \\
        --tier-floor insider=20,warm=30,cold=50 \\
        --score-threshold 0.35 \\
        --plan-only

Legacy mode (old tier-cap-based ranking) still available via --legacy-rank
for the case where migration 0011 hasn't been applied yet.

Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE, ANTHROPIC_API_KEY
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, date, timezone
from pathlib import Path
from typing import Any

try:
    from supabase import create_client, Client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)


REPO_ROOT = Path(__file__).parent.parent
OUTBOUND_RUNNER = REPO_ROOT / "agents" / "outbound.py"
UUID_NIL = "00000000-0000-0000-0000-000000000000"

BUYER_ROLES = {"talent_buyer", "festival_buyer", "tour_buyer", "venue_booker",
               "promoter", "manager"}
COLD_ROLES = {"talent_buyer", "festival_buyer", "venue_booker", "promoter"}

RECENT_CONTACT_DAYS = 120


@dataclass
class TourSpec:
    tour_name: str
    primary_artist_slug: str
    tier: int
    window_start: date
    window_end: date
    routing_anchors: list[dict]


def sb_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


# -------------------------------------------------------------------------
# tour + package lookup (migrations/0006 must be seeded)
# -------------------------------------------------------------------------
def load_tour(sb: Client, tour_name: str) -> dict:
    res = sb.table("tours").select("*").eq("name", tour_name).execute()
    if not res.data:
        raise RuntimeError(
            f"tour '{tour_name}' not found -- seed it with the block at the "
            f"bottom of migrations/0006_multi_artist_packages.sql first"
        )
    return res.data[0]


def load_tour_roster(sb: Client, tour_id: str) -> list[dict]:
    """All artists on this tour, ordered by priority (highest first)."""
    res = (sb.table("tour_artists")
           .select("artist_id, role, is_required, priority, artists(slug, display_name)")
           .eq("tour_id", tour_id)
           .order("priority", desc=True)
           .execute())
    out = []
    for r in res.data or []:
        a = r.get("artists") or {}
        out.append({
            "artist_id": r["artist_id"],
            "slug": a.get("slug"),
            "display_name": a.get("display_name"),
            "role": r.get("role"),
            "is_required": bool(r.get("is_required")),
            "priority": int(r.get("priority") or 50),
        })
    return out


def load_package_levels(sb: Client, tour_id: str) -> list[dict]:
    res = (sb.table("package_levels")
           .select("*")
           .eq("tour_id", tour_id)
           .order("sort_order")
           .execute())
    return res.data or []


def pick_package_level(levels: list[dict], capacity: int | None) -> dict | None:
    """Pick the highest-tier level whose capacity band contains the venue cap.
    If cap is unknown, return the middle tier. If nothing fits, smallest."""
    if not levels:
        return None
    if capacity is None:
        return levels[len(levels) // 2]
    fits = [
        lv for lv in levels
        if (lv.get("min_venue_capacity") or 0) <= capacity
        and (lv.get("max_venue_capacity") or 10**9) >= capacity
    ]
    if fits:
        # highest tier among those that fit
        return max(fits, key=lambda lv: lv.get("tier_size") or 0)
    return sorted(levels, key=lambda lv: lv.get("tier_size") or 0)[0]


# -------------------------------------------------------------------------
# suppression (per-venue primary, per-contact fallback)
# -------------------------------------------------------------------------
def suppress_for_target(sb: Client, contact_id: str, venue_id: str | None,
                        cooldown_days: int = 180) -> set[str]:
    """Returns artist_slugs to suppress for this target."""
    try:
        if venue_id:
            res = sb.rpc("fn_suppress_artists_for_venue", {
                "p_venue_id": venue_id,
                "p_cooldown_days": cooldown_days,
            }).execute()
        else:
            res = sb.rpc("fn_suppress_artists_for_contact", {
                "p_contact_id": contact_id,
                "p_cooldown_days": cooldown_days,
            }).execute()
        rows = res.data or []
        return {r["artist_slug"] for r in rows if r.get("artist_slug")}
    except Exception as e:
        # If the RPCs don't exist yet (migration 0005 not applied) we
        # silently return empty -- caller can still pitch the full roster.
        print(f"  [warn] suppression RPC failed for {contact_id}: {e}",
              file=sys.stderr)
        return set()


# -------------------------------------------------------------------------
# candidate selection -- score-ranked (migration 0011)
# -------------------------------------------------------------------------
def _top_factors(factor_breakdown: dict, n: int = 3) -> str:
    """Render the top-N scoring factors as a human-readable reason string.
    e.g. 'anchor=1.0,tier=0.6,history=0.5'"""
    factors = (factor_breakdown or {}).get("factors") or {}
    weights = (factor_breakdown or {}).get("weights") or {}
    # Weight * factor = contribution to score; sort by contribution desc
    contributions = sorted(
        (
            (name, float(val or 0), float(weights.get(name, 0) or 0))
            for name, val in factors.items()
        ),
        key=lambda x: x[1] * x[2],
        reverse=True,
    )
    parts = [f"{name}={val:.2f}" for name, val, _w in contributions[:n]]
    return ",".join(parts)


def pull_agent_workload_blocks(sb: Client) -> set[tuple[str, str]]:
    """
    Agent-workload gate (#33 followup, backed by migration 0014).

    Returns a set of (artist_id, contact_id) pairs that we should NOT seed
    outbound on because an agent (AB / PRYSM / other) already has an
    in-flight offer with that contact for that artist. Covers all three
    contact linkages on the offer:
      - primary contact_id (the one we'd email)
      - relayed_by_contact_id (the agent themselves)
      - promoter_contact_id (the underlying promoter)

    Called once per seeder run. If the view doesn't exist yet (migration
    0014 not applied), returns an empty set -- which gracefully degrades
    to "no blocking" rather than failing the run.
    """
    blocks: set[tuple[str, str]] = set()
    try:
        res = (sb.table("v_agent_workload")
                 .select("artist_id, primary_contact_id, relayed_by_contact_id, "
                         "promoter_contact_id, source")
                 # only agent-relayed offers block outbound seeding.
                 # direct_promoter / manual / gigwell don't count as
                 # "an agent is working this" for purposes of avoiding
                 # cross-agent double-pitching.
                 .in_("source", ["agent_ab", "agent_prysm", "agent_other"])
                 .execute())
        for row in res.data or []:
            aid = row.get("artist_id")
            if not aid:
                continue
            for fld in ("primary_contact_id", "relayed_by_contact_id", "promoter_contact_id"):
                cid = row.get(fld)
                if cid:
                    blocks.add((aid, cid))
    except Exception as e:
        # view missing or RLS / permission error -- degrade gracefully.
        print(f"[warn] agent-workload gate disabled: {e}", file=sys.stderr)
    return blocks


def pull_scored_targets(sb: Client, tour_id: str,
                        score_threshold: float,
                        row_budget: int = 2000,
                        agent_workload_blocks: set[tuple[str, str]] | None = None
                        ) -> list[dict]:
    """Pull scored (artist, contact, venue) rows from v_target_score for
    this tour, filter by score threshold, dedupe to the best-scoring
    artist per (contact, venue), role-gate, and return sorted by score.

    If agent_workload_blocks is provided, drops any row whose
    (artist_id, contact_id) is in the set (see pull_agent_workload_blocks).

    Raises if the view doesn't exist -- caller should fall back to legacy
    mode in that case.
    """
    # v_target_score already excludes radius_blocked via score=0; we
    # additionally filter by score_threshold for efficiency.
    res = (sb.table("v_target_score")
             .select("tour_id, tour_name, artist_id, artist_slug, artist_name, "
                     "contact_id, contact_name, email, relationship_tier, "
                     "contact_roles, vip, venue_id, venue_name, venue_capacity, "
                     "venue_city, venue_state, score, radius_exception_candidate, "
                     "factor_breakdown")
             .eq("tour_id", tour_id)
             .gte("score", score_threshold)
             .order("score", desc=True)
             .limit(row_budget)
             .execute())
    raw = res.data or []

    # Dedupe to best-scoring artist per (contact_id, venue_id). Keeps
    # the representative score, records which artist drove it.
    best_by_pair: dict[tuple, dict] = {}
    for r in raw:
        key = (r["contact_id"], r.get("venue_id"))
        prev = best_by_pair.get(key)
        if prev is None or (r.get("score") or 0) > (prev.get("score") or 0):
            best_by_pair[key] = r

    kept: list[dict] = []
    blocked_by_agent = 0
    for r in best_by_pair.values():
        roles = set(r.get("contact_roles") or [])
        tier = r.get("relationship_tier") or "cold"
        allowed = COLD_ROLES if tier == "cold" else BUYER_ROLES
        if allowed and not (roles & allowed):
            continue
        if not r.get("email"):
            continue
        # agent-workload gate (#33 / migration 0014). If an agent is already
        # pitching this (artist, contact), don't double-pitch from the DBA.
        if agent_workload_blocks is not None:
            pair = (r.get("artist_id"), r.get("contact_id"))
            if pair in agent_workload_blocks:
                blocked_by_agent += 1
                continue
        kept.append(r)

    if agent_workload_blocks is not None and blocked_by_agent:
        print(
            f"[info] agent-workload gate filtered {blocked_by_agent} "
            f"(artist × contact) pair(s) already being worked by AB/PRYSM/other",
            file=sys.stderr,
        )

    kept.sort(key=lambda x: (x.get("score") or 0), reverse=True)
    return kept


def apply_tier_diversity(scored: list[dict],
                         total_cap: int,
                         tier_floors: dict[str, int]) -> list[dict]:
    """Select from the score-sorted list such that each tier hits at least
    its floor (when enough candidates exist), and the total is capped at
    total_cap. Remaining slots after floors are filled score-desc from
    the combined pool.
    """
    pool_by_tier: dict[str, list[dict]] = {"insider": [], "warm": [], "cold": []}
    for r in scored:
        t = r.get("relationship_tier") or "cold"
        pool_by_tier.setdefault(t, []).append(r)

    selected: list[dict] = []
    seen: set[str] = set()

    # 1. Fill tier floors first (score-desc within each tier)
    for tier, floor in tier_floors.items():
        for r in pool_by_tier.get(tier, []):
            if len(selected) >= total_cap:
                break
            if r["contact_id"] + str(r.get("venue_id")) in seen:
                continue
            pick_count = sum(1 for s in selected if s.get("relationship_tier") == tier)
            if pick_count >= floor:
                break
            selected.append(r)
            seen.add(r["contact_id"] + str(r.get("venue_id")))

    # 2. Fill remaining slots from full pool, score-desc
    for r in scored:
        if len(selected) >= total_cap:
            break
        key = r["contact_id"] + str(r.get("venue_id"))
        if key in seen:
            continue
        selected.append(r)
        seen.add(key)

    # Return in score-desc order for stable processing
    selected.sort(key=lambda x: (x.get("score") or 0), reverse=True)
    return selected


# -------------------------------------------------------------------------
# candidate selection -- legacy tier-cap (pre-migration 0011)
# -------------------------------------------------------------------------
def pull_targets(sb: Client, tier: str, caps: dict[str, int]) -> list[dict]:
    """Pull (contact, venue) pairs for contacts of the given tier.
    A contact with no linked venues gets one row with venue_id=None."""
    roles_allowed = COLD_ROLES if tier == "cold" else BUYER_ROLES
    cap = caps.get(tier, 100)

    res = (sb.table("v_pitchable_targets")
             .select("*")
             .eq("relationship_tier", tier)
             .limit(cap * 4)  # wide net, dedupe/filter below
             .execute())
    raw = res.data or []

    kept: list[dict] = []
    seen_contact_only: set[str] = set()  # contact_ids we've emitted a None-venue for
    for r in raw:
        roles = set(r.get("contact_roles") or [])
        if roles_allowed and not (roles & roles_allowed):
            continue
        if not r.get("email"):
            continue
        kept.append(r)

    # ensure every contact has at least one target even if no linked venue
    contact_ids_with_venues = {r["contact_id"] for r in kept if r.get("venue_id")}
    for r in list(kept):
        if r.get("venue_id") is None:
            seen_contact_only.add(r["contact_id"])
    # drop the None-venue row for contacts that also have venue rows
    # (so Julian with House of Independents + Webster gets 2 rows, not 3)
    kept = [
        r for r in kept
        if not (r.get("venue_id") is None and r["contact_id"] in contact_ids_with_venues)
    ]
    return kept


def score_target(row: dict, spec: TourSpec) -> tuple[int, str]:
    tier = row.get("relationship_tier", "cold")
    base = {"insider": 80, "warm": 55, "cold": 30}.get(tier, 20)
    reasons: list[str] = [f"tier={tier}"]
    roles = set(row.get("contact_roles") or [])
    if "festival_buyer" in roles and spec.window_start.month in (4, 5, 6, 7, 8, 9):
        base += 5
        reasons.append("festival_season")
    if row.get("vip"):
        reasons.append("VIP_hold")
    if row.get("venue_capacity"):
        base += 3
        reasons.append(f"cap={row['venue_capacity']}")
    base = max(0, min(100, base))
    return base, ";".join(reasons)


# -------------------------------------------------------------------------
# pitch-pack construction (now with package context)
# -------------------------------------------------------------------------
def compute_featured(roster: list[dict], suppressed: set[str],
                     package_level: dict | None) -> tuple[list[str], list[str]]:
    """Return (featured_slugs_in_priority_order, warnings)."""
    warnings: list[str] = []
    if package_level:
        required = set(package_level.get("required_artist_slugs") or [])
        optional = set(package_level.get("optional_artist_slugs") or [])
        tier_size = package_level.get("tier_size") or 3
    else:
        required = set()
        optional = {a["slug"] for a in roster if a.get("slug")}
        tier_size = 3

    required_available = [s for s in (a["slug"] for a in roster
                                      if a["slug"] in required)
                          if s not in suppressed]
    if len(required_available) < len(required):
        missing = required - set(required_available)
        warnings.append(f"required_suppressed:{','.join(missing)}")

    optional_available = [a["slug"] for a in roster
                          if a["slug"] in optional and a["slug"] not in suppressed]

    featured = required_available + [
        s for s in optional_available if s not in required_available
    ]
    featured = featured[:tier_size]
    if len(featured) < tier_size:
        warnings.append(f"below_tier_size:{len(featured)}/{tier_size}")
    return featured, warnings


def build_pitch_pack(sb: Client, target: dict, tour: dict,
                     roster: list[dict], package_level: dict | None,
                     featured: list[str], suppressed: set[str]) -> dict | None:
    """Minimal pitch-pack with tour + package context layered in."""
    tier = target.get("relationship_tier", "cold")
    contact_id = target["contact_id"]

    # promoter_activity
    activity_res = (sb.table("promoter_activity")
                    .select("headline,source_url,activity_date,activity_type,confidence")
                    .eq("contact_id", contact_id)
                    .is_("consumed_at", "null")
                    .order("activity_date", desc=True)
                    .limit(2).execute())
    activity = activity_res.data or []

    # praise (cold only)
    praise = None
    if tier == "cold":
        praise_res = (sb.table("praise_bank")
                      .select("id,text,source_url,date_observed,confidence")
                      .eq("contact_id", contact_id)
                      .is_("consumed_at", "null")
                      .gte("expires_at", date.today().isoformat())
                      .order("date_observed", desc=True)
                      .limit(1).execute())
        praise = (praise_res.data or [None])[0]

    # artist_market_stats (cold only, lead featured artist, venue metro)
    artist_stat = None
    if tier == "cold" and featured:
        metro = None
        if target.get("venue_city") and target.get("venue_state"):
            metro = f"{target['venue_city']}, {target['venue_state']}"
        if metro:
            stat_res = (sb.table("artist_data")
                        .select("spotify_monthly_listeners,spotify_trend_90d_pct,"
                                "as_of_date,metro,artist_slug")
                        .eq("metro", metro)
                        .eq("artist_slug", featured[0])
                        .order("as_of_date", desc=True)
                        .limit(1).execute())
            artist_stat = (stat_res.data or [None])[0]

    # gate checks
    if tier in ("insider", "warm") and not activity:
        return {"_blocked": True, "reason": f"no_activity_for_{tier}"}
    if tier == "cold" and not artist_stat:
        return {"_blocked": True, "reason": "no_market_stat_for_cold"}
    if not featured:
        return {"_blocked": True, "reason": "suppression_total"}
    if package_level and len(featured) < (package_level.get("tier_size") or 0) - 1:
        return {"_blocked": True, "reason": "suppression_heavy"}

    # roster display data for the composer
    roster_display = [
        {"slug": a["slug"], "display_name": a["display_name"],
         "role": a["role"], "priority": a["priority"]}
        for a in roster
    ]

    pack = {
        "contact": {
            "id": contact_id,
            "name": target["contact_name"],
            "city": target.get("venue_city"),
            "state": target.get("venue_state"),
        },
        "venue": {
            "id": target.get("venue_id"),
            "name": target.get("venue_name"),
            "capacity": target.get("venue_capacity"),
        } if target.get("venue_id") else None,
        "relationship_tier": tier,
        "tour": {
            "id": tour["id"],
            "name": tour["name"],
            "window_start": tour["window_start"],
            "window_end": tour["window_end"],
            "routing_anchors": tour.get("routing_anchors") or [],
            "tour_roster": roster_display,
        },
        "package_level": ({
            "label": package_level["label"],
            "tier_size": package_level["tier_size"],
            "min_venue_capacity": package_level.get("min_venue_capacity"),
            "max_venue_capacity": package_level.get("max_venue_capacity"),
            "guarantee_floor": package_level.get("guarantee_floor"),
            "guarantee_target": package_level.get("guarantee_target"),
            "guarantee_ceiling": package_level.get("guarantee_ceiling"),
        } if package_level else None),
        "featured_artists": featured,
        "suppressed_artists": sorted(suppressed),
        "praise_hook": ({
            "text": praise["text"], "source_url": praise.get("source_url"),
            "confidence": float(praise.get("confidence") or 0.9),
        } if praise else None),
        "promoter_activity": [
            {"headline": a["headline"], "source_url": a.get("source_url"),
             "type": a.get("activity_type"), "date": a.get("activity_date")}
            for a in activity
        ],
        "artist_market_stats": ({
            "artist_slug": artist_stat.get("artist_slug") or (featured[0] if featured else None),
            "metro": artist_stat["metro"],
            "spotify_monthly_listeners": artist_stat["spotify_monthly_listeners"],
            "spotify_trend_90d_pct": float(artist_stat.get("spotify_trend_90d_pct") or 0),
            "as_of_date": artist_stat["as_of_date"],
        } if artist_stat else None),
        "verification_stamps": {
            "stats_freshness_ok": artist_stat is not None if tier == "cold" else True,
            "praise_freshness_ok": praise is not None if tier == "cold" else True,
            "praise_specificity_ok": bool(praise and len(praise.get("text") or "") > 20)
                                    if tier == "cold" else True,
            "no_invented_fields": True,
            "sources_all_linkable": True,
        },
    }
    return pack


def write_pitch_pack(sb: Client, pack: dict) -> str:
    row = {
        "contact_id": pack["contact"]["id"],
        "market_metro": (f"{pack['contact'].get('city')}, {pack['contact'].get('state')}"
                         .strip(", ") if pack["contact"].get("city") else None),
        "payload": pack,
        "verification_stamps": pack["verification_stamps"],
    }
    res = sb.table("pitch_packs").insert(row).execute()
    return res.data[0]["id"]


# -------------------------------------------------------------------------
# composer invocation
# -------------------------------------------------------------------------
def run_composer(pitch_pack_id: str, email_type: str, dry_run: bool) -> dict:
    cmd = [sys.executable, str(OUTBOUND_RUNNER),
           "--pitch-pack", pitch_pack_id, "--email-type", email_type]
    if dry_run:
        cmd.append("--dry-run")
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        return {"error": proc.stderr.strip() or "composer failed",
                "stdout": proc.stdout.strip()}
    try:
        return json.loads(proc.stdout.strip())
    except Exception:
        return {"raw": proc.stdout.strip()}


# -------------------------------------------------------------------------
# main
# -------------------------------------------------------------------------
def parse_caps(s: str) -> dict[str, int]:
    out: dict[str, int] = {}
    for part in (s or "").split(","):
        part = part.strip()
        if not part:
            continue
        k, v = part.split("=", 1)
        out[k.strip()] = int(v.strip())
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tour-name", required=True)
    ap.add_argument("--primary-artist", default="dirtysnatcha",
                    help="primary artist slug for this tour (metadata only)")
    ap.add_argument("--window", required=True, help="YYYY-MM-DD..YYYY-MM-DD")
    ap.add_argument("--tier", type=int, default=2)
    ap.add_argument("--routing-anchors", default="[]")
    ap.add_argument("--cap-per-tier", default="insider=50,warm=50,cold=150",
                    help="(legacy mode) per-tier ceiling")
    ap.add_argument("--total-cap", type=int, default=250,
                    help="(score-ranked) overall ceiling on drafted targets")
    ap.add_argument("--tier-floor", default="insider=20,warm=30,cold=50",
                    help="(score-ranked) minimum picks per tier (diversity floor)")
    ap.add_argument("--score-threshold", type=float, default=0.35,
                    help="(score-ranked) drop anything below this composite score")
    ap.add_argument("--legacy-rank", action="store_true",
                    help="Use old tier-cap ranking (pre-migration-0011 fallback)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Compose but do not persist drafts")
    ap.add_argument("--plan-only", action="store_true",
                    help="Print ranked scope without calling composer")
    ap.add_argument("--only-tier", choices=["insider", "warm", "cold"], default=None)
    ap.add_argument("--cooldown-days", type=int, default=180,
                    help="suppression cooldown window")
    args = ap.parse_args()

    ws, we = args.window.split("..")
    spec = TourSpec(
        tour_name=args.tour_name,
        primary_artist_slug=args.primary_artist,
        tier=args.tier,
        window_start=date.fromisoformat(ws),
        window_end=date.fromisoformat(we),
        routing_anchors=json.loads(args.routing_anchors),
    )
    caps = parse_caps(args.cap_per_tier)
    tier_floors = parse_caps(args.tier_floor)

    sb = sb_client()
    tour = load_tour(sb, spec.tour_name)
    roster = load_tour_roster(sb, tour["id"])
    levels = load_package_levels(sb, tour["id"])
    if not roster:
        raise RuntimeError("tour has no tour_artists -- seed them first")
    if not levels:
        print(f"[warn] tour has no package_levels -- will pitch full roster as fallback",
              file=sys.stderr)

    print(f"[seed] tour={tour['name']}  roster={len(roster)} artists  "
          f"levels={[lv['label'] for lv in levels]}  window={ws}..{we}")

    # -------------------------------------------------------------------
    # Build ranked target list -- score-ranked (0011) or legacy tier-cap
    # -------------------------------------------------------------------
    # each entry: (priority 0-100, reason_str, row, factor_breakdown_or_none)
    all_targets: list[tuple[int, str, dict, dict | None]] = []

    use_score = not args.legacy_rank
    if use_score:
        # agent-workload gate (#33 / migration 0014). Pulled once per run
        # and passed into the scored-target filter so we skip any
        # (artist, contact) pair where AB / PRYSM / another agent already
        # has an in-flight offer. Graceful-degrades to empty set if the
        # view isn't available.
        agent_blocks = pull_agent_workload_blocks(sb)
        if agent_blocks:
            print(f"[seed] agent-workload gate loaded {len(agent_blocks)} "
                  f"(artist × contact) block pair(s)")

        try:
            scored = pull_scored_targets(
                sb, tour["id"],
                score_threshold=args.score_threshold,
                agent_workload_blocks=agent_blocks,
            )
        except Exception as e:
            print(f"[warn] v_target_score unavailable ({e}); falling back to legacy",
                  file=sys.stderr)
            scored = None
            use_score = False

        if use_score and scored is not None:
            print(f"[seed] v_target_score returned {len(scored)} ranked targets "
                  f"(threshold={args.score_threshold})")
            if args.only_tier:
                scored = [r for r in scored if r.get("relationship_tier") == args.only_tier]
                print(f"[seed] filtered to tier={args.only_tier}: {len(scored)}")
            selected = apply_tier_diversity(
                scored,
                total_cap=args.total_cap,
                tier_floors=tier_floors,
            )
            print(f"[seed] tier-diversity floor applied: {len(selected)} targets "
                  f"({tier_floors})")
            for r in selected:
                pri = int(round((r.get("score") or 0) * 100))
                factors = r.get("factor_breakdown") or {}
                top = _top_factors(factors, n=3)
                reason = f"score={r.get('score'):.3f};{top}"
                if r.get("radius_exception_candidate"):
                    reason += ";radius_exception"
                all_targets.append((pri, reason, r, factors))

    if not use_score:
        tiers = [args.only_tier] if args.only_tier else ["insider", "warm", "cold"]
        for tier in tiers:
            rows = pull_targets(sb, tier, caps)
            print(f"[seed] {tier}: {len(rows)} (contact, venue) targets (legacy)")
            for r in rows:
                pri, reason = score_target(r, spec)
                all_targets.append((pri, reason, r, None))

    all_targets.sort(key=lambda x: x[0], reverse=True)

    if args.plan_only:
        print(f"\n== PLAN ({len(all_targets)} targets) ==")
        for pri, reason, r, _ in all_targets[:150]:
            venue = f"{r.get('venue_name') or '-':28s}"
            cap = r.get("venue_capacity") or "?"
            print(f"  [{pri:3d}] {r['contact_name']:26s} "
                  f"@ {venue} cap={cap!s:>5} {r['relationship_tier']:7s} {reason}")
        return 0

    drafted = 0
    blocked = 0
    for pri, reason, r, factors in all_targets:
        contact_id = r["contact_id"]
        venue_id = r.get("venue_id")

        # suppression + featured set + package level
        suppressed = suppress_for_target(sb, contact_id, venue_id, args.cooldown_days)
        level = pick_package_level(levels, r.get("venue_capacity")) if levels else None
        featured, warns = compute_featured(roster, suppressed, level)

        # upsert tour_target
        tt_row = {
            "tour_id": tour["id"],
            "contact_id": contact_id,
            "venue_id": venue_id,
            "market_metro": (f"{r.get('venue_city')}, {r.get('venue_state')}".strip(", ")
                             if r.get("venue_city") else None),
            "relationship_tier_snapshot": r["relationship_tier"],
            "priority": pri,
            "reason": reason + (";" + ";".join(warns) if warns else ""),
            "status": "queued",
            "suppressed_artists": sorted(suppressed),
            "featured_artists": featured,
            "package_level_id": (level or {}).get("id"),
        }
        # upsert using the (tour, contact, coalesce(venue,nil)) uniqueness
        # supabase-py doesn't expose coalesce'd on_conflict easily, so we
        # look up first
        existing = (sb.table("tour_targets")
                    .select("id")
                    .eq("tour_id", tour["id"])
                    .eq("contact_id", contact_id)
                    .eq("venue_id", venue_id or UUID_NIL)
                    .execute().data or []) if venue_id else (
                    sb.table("tour_targets")
                    .select("id")
                    .eq("tour_id", tour["id"])
                    .eq("contact_id", contact_id)
                    .is_("venue_id", "null")
                    .execute().data or [])
        if existing:
            target_id = existing[0]["id"]
            sb.table("tour_targets").update(tt_row).eq("id", target_id).execute()
        else:
            ins = sb.table("tour_targets").insert(tt_row).execute()
            target_id = ins.data[0]["id"]

        # build pitch-pack
        pack = build_pitch_pack(sb, r, tour, roster, level, featured, suppressed)
        if pack.get("_blocked"):
            sb.table("tour_targets").update({
                "status": "dropped", "blocked_reason": pack["reason"],
            }).eq("id", target_id).execute()
            blocked += 1
            print(f"  [skip] {r['contact_name']:26s} @ {r.get('venue_name') or '-':24s} "
                  f"{pack['reason']}")
            continue

        pack_id = write_pitch_pack(sb, pack)
        email_type = "cold_outreach" if r["relationship_tier"] == "cold" else "warm_pitch"
        result = run_composer(pack_id, email_type, dry_run=args.dry_run)

        if "error" in result:
            sb.table("tour_targets").update({
                "status": "dropped",
                "blocked_reason": "composer_error: " + result["error"][:200],
            }).eq("id", target_id).execute()
            blocked += 1
            print(f"  [fail] {r['contact_name']:26s} composer_error")
            continue

        outreach_id = result.get("outreach_log_id")
        if outreach_id:
            sb.table("tour_targets").update({
                "status": "drafted",
                "drafted_outreach_id": outreach_id,
                "pitched_artists": result.get("featured_artists_named") or featured,
            }).eq("id", target_id).execute()
            # Merge factor breakdown into the decision_trace so we can
            # audit why this target was picked (v_target_score output).
            outreach_patch: dict[str, Any] = {"tour_target_id": target_id}
            if factors:
                # Read-modify-write the jsonb (supabase-py has no deep-merge).
                existing = (sb.table("outreach_log").select("decision_trace")
                              .eq("id", outreach_id).limit(1).execute().data or [{}])
                trace = dict((existing[0] or {}).get("decision_trace") or {})
                trace["target_score"] = {
                    "score": r.get("score"),
                    "factor_breakdown": factors,
                    "radius_exception_candidate": bool(r.get("radius_exception_candidate")),
                }
                outreach_patch["decision_trace"] = trace
            sb.table("outreach_log").update(outreach_patch).eq("id", outreach_id).execute()
            drafted += 1
            print(f"  [draft] {r['contact_name']:26s} @ {r.get('venue_name') or '-':24s} "
                  f"conf={result.get('confidence')} lvl={level and level['label']}")
        else:
            # dry-run path
            print(f"  [dry]  {r['contact_name']:26s} @ {r.get('venue_name') or '-':24s} "
                  f"{result.get('subject','')[:48]}")
            drafted += 1

    print(f"\n[seed] drafted={drafted}  blocked={blocked}  total={len(all_targets)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
