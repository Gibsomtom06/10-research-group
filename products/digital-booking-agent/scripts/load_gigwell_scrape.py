#!/usr/bin/env python3
"""
Load Gigwell scrape JSONL -> Supabase.

Reads the files Gemini wrote to _staging/gigwell_scrape/ and upserts
them into DBA's Supabase tables with source_tag='gigwell_scrape:<run>'.

Order matters: venues -> contacts -> contact_venues -> artists lookup
-> offers -> confirmed_shows -> radius_holds -> praise. Anything that
references another entity is loaded after its targets exist.

Idempotent: re-running the same JSONL is a no-op.

Usage:
    python scripts/load_gigwell_scrape.py --dry-run
    python scripts/load_gigwell_scrape.py --write
    python scripts/load_gigwell_scrape.py --write --only contacts,venues

Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable

try:
    from supabase import create_client, Client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)


STAGING = Path(__file__).parent.parent / "_staging" / "gigwell_scrape"

# Gigwell status strings we see -> offer_status enum
OFFER_STATUS_MAP = {
    "inbound": "inbound",
    "new": "inbound",
    "offered": "inbound",
    "negotiating": "negotiating",
    "in_negotiation": "negotiating",
    "pending": "negotiating",
    "confirmed": "confirmed",
    "booked": "confirmed",
    "signed": "confirmed",
    "declined": "declined",
    "passed": "declined",
    "lost": "lost",
    "cancelled": "lost",
    "canceled": "lost",
}

SHOW_STATUS_MAP = {
    "announced": "announced",
    "on_sale": "onsale",
    "onsale": "onsale",
    "sold_out": "sold_out",
    "soldout": "sold_out",
    "completed": "announced",   # historical shows — keep as announced
    "played": "announced",
    "cancelled": "cancelled",
    "canceled": "cancelled",
}

ROLE_FROM_RAW = [
    (["talent buyer", "buyer", "booker", "venue"],   "venue_booker"),
    (["festival"],                                    "festival_buyer"),
    (["tour buyer"],                                  "tour_buyer"),
    (["promoter", "promo"],                           "promoter"),
    (["agent"],                                       "agent"),
    (["manager"],                                     "manager"),
]


def supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out: list[dict] = []
    with path.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"  skip {path.name}:{i} bad json — {e}", file=sys.stderr)
    return out


def role_from_raw(raw: str | None) -> str:
    if not raw:
        return "other"
    r = raw.lower()
    for needles, role in ROLE_FROM_RAW:
        if any(n in r for n in needles):
            return role
    return "other"


def tag(run_date: str) -> str:
    return f"gigwell_scrape:{run_date}"


def upsert_venues(sb: Client, rows: list[dict], run_tag: str, dry: bool) -> dict[str, str]:
    """gigwell venue id -> supabase uuid"""
    id_map: dict[str, str] = {}
    for r in rows:
        gid = r.get("gigwell_id")
        if not gid or not r.get("name"):
            continue
        payload = {
            "name": r["name"],
            "city": r.get("city"),
            "state": r.get("state"),
            "country": r.get("country") or "US",
            "capacity": r.get("capacity"),
            "typical_nights": r.get("typical_nights") or [],
            "has_weekday_slots": bool(r.get("has_weekday_slots")),
            "genre_fit": r.get("genre_fit") or [],
            "website": r.get("website"),
            "songkick_id": r.get("songkick_id"),
            "bandsintown_id": r.get("bandsintown_id"),
            "notes": r.get("notes"),
        }
        if dry:
            print(f"  [dry] venue {gid} -> {r['name']}")
            continue
        # match by (name, city, state) since schema doesn't have gigwell_id on venues yet
        existing = (
            sb.table("venues").select("id")
            .eq("name", r["name"])
            .eq("city", r.get("city"))
            .execute().data or []
        )
        if existing:
            vid = existing[0]["id"]
            sb.table("venues").update(payload).eq("id", vid).execute()
        else:
            res = sb.table("venues").insert(payload).execute()
            vid = (res.data or [{}])[0].get("id")
        if vid:
            id_map[gid] = vid
    return id_map


def upsert_contacts(sb: Client, rows: list[dict], run_tag: str, dry: bool) -> dict[str, str]:
    id_map: dict[str, str] = {}
    for r in rows:
        gid = r.get("gigwell_id")
        email = (r.get("email") or "").strip().lower() or None
        if not gid or not r.get("full_name"):
            continue
        role = role_from_raw(r.get("role_raw"))
        payload = {
            "full_name": r["full_name"],
            "email": email,
            "phone": r.get("phone"),
            "role": role,
            "contact_roles": [role],
            "company": r.get("company"),
            "city": r.get("city"),
            "state": r.get("state"),
            "country": r.get("country") or "US",
            "timezone": r.get("timezone"),
            "linkedin_url": r.get("linkedin_url"),
            "instagram_handle": r.get("instagram_handle"),
            "website": r.get("website"),
            "source_tag": run_tag,
            "thomas_notes": None,  # never overwrite
        }
        if dry:
            print(f"  [dry] contact {gid} -> {r['full_name']} <{email}>")
            continue
        # match by email first, fall back to source_tag lookup
        existing = []
        if email:
            existing = (
                sb.table("contacts").select("id, thomas_notes")
                .eq("email", email).execute().data or []
            )
        if existing:
            cid = existing[0]["id"]
            # preserve thomas_notes
            payload.pop("thomas_notes", None)
            sb.table("contacts").update(payload).eq("id", cid).execute()
        else:
            res = sb.table("contacts").insert(payload).execute()
            cid = (res.data or [{}])[0].get("id")
        if cid:
            id_map[gid] = cid
    return id_map


def upsert_contact_venues(sb: Client, rows: list[dict],
                          contact_ids: dict[str, str],
                          venue_ids: dict[str, str], dry: bool) -> int:
    n = 0
    for r in rows:
        cid = contact_ids.get(r.get("contact_gigwell_id"))
        vid = venue_ids.get(r.get("venue_gigwell_id"))
        if not (cid and vid):
            continue
        if dry:
            print(f"  [dry] link {cid[:8]} <-> venue {vid[:8]}")
            n += 1
            continue
        try:
            sb.table("contact_venues").insert(
                {"contact_id": cid, "venue_id": vid}
            ).execute()
        except Exception:
            pass  # dup primary key
        n += 1
    return n


def load_artist_slug_map(sb: Client) -> dict[str, str]:
    res = sb.table("artists").select("id, slug").execute()
    return {row["slug"]: row["id"] for row in (res.data or [])}


def upsert_offers(sb: Client, rows: list[dict],
                  contact_ids: dict[str, str],
                  venue_ids: dict[str, str],
                  artist_ids: dict[str, str],
                  run_tag: str, dry: bool) -> int:
    n = 0
    for r in rows:
        gid = r.get("gigwell_id")
        if not gid:
            continue
        status = OFFER_STATUS_MAP.get((r.get("status_raw") or "").lower().strip(), "inbound")
        slug = (r.get("artist_slug") or "").lower().strip() or None
        payload = {
            "contact_id": contact_ids.get(r.get("contact_gigwell_id")),
            "venue_id":   venue_ids.get(r.get("venue_gigwell_id")),
            "artist_id":  artist_ids.get(slug) if slug else None,
            "artist_slug": slug,
            "status": status,
            "proposed_date": r.get("proposed_date"),
            "guarantee": r.get("guarantee"),
            "door_deal": r.get("door_deal"),
            "counter_bounds": r.get("counter_bounds"),
            "thread_id": r.get("thread_ref"),
            "notes": r.get("notes"),
            "gigwell_id": gid,
            "source_tag": run_tag,
        }
        if dry:
            print(f"  [dry] offer {gid} artist={slug} status={status}")
            n += 1
            continue
        existing = (
            sb.table("offers").select("id")
            .eq("gigwell_id", gid).execute().data or []
        )
        if existing:
            sb.table("offers").update(payload).eq("id", existing[0]["id"]).execute()
        else:
            sb.table("offers").insert(payload).execute()
        n += 1
    return n


def upsert_confirmed_shows(sb: Client, rows: list[dict],
                           venue_ids: dict[str, str],
                           artist_ids: dict[str, str],
                           run_tag: str, dry: bool) -> int:
    n = 0
    # first build offer gigwell_id -> supabase uuid map from DB
    offer_map: dict[str, str] = {}
    if rows and not dry:
        offer_gids = [r.get("offer_gigwell_id") for r in rows if r.get("offer_gigwell_id")]
        if offer_gids:
            res = sb.table("offers").select("id, gigwell_id").in_("gigwell_id", offer_gids).execute()
            offer_map = {row["gigwell_id"]: row["id"] for row in (res.data or [])}

    for r in rows:
        gid = r.get("gigwell_id")
        if not gid or not r.get("show_date"):
            continue
        slug = (r.get("artist_slug") or "").lower().strip() or None
        status = SHOW_STATUS_MAP.get((r.get("status_raw") or "").lower().strip(), "announced")
        payload = {
            "offer_id": offer_map.get(r.get("offer_gigwell_id")),
            "venue_id": venue_ids.get(r.get("venue_gigwell_id")),
            "artist_id": artist_ids.get(slug) if slug else None,
            "artist_slug": slug,
            "show_date": r["show_date"],
            "guarantee": r.get("guarantee"),
            "status": status,
            "paid_attendance": r.get("paid_attendance"),
            "capacity_at_show": r.get("capacity_at_show"),
            "notes": r.get("notes"),
            "gigwell_id": gid,
            "source_tag": run_tag,
        }
        # don't overwrite non-null attendance with null
        payload = {k: v for k, v in payload.items() if not (v is None and k in ("paid_attendance", "capacity_at_show"))}
        if dry:
            print(f"  [dry] show {gid} artist={slug} date={r['show_date']}")
            n += 1
            continue
        existing = (
            sb.table("confirmed_shows").select("id")
            .eq("gigwell_id", gid).execute().data or []
        )
        if existing:
            sb.table("confirmed_shows").update(payload).eq("id", existing[0]["id"]).execute()
        else:
            sb.table("confirmed_shows").insert(payload).execute()
        n += 1
    return n


def apply_radius_holds(sb: Client, rows: list[dict],
                       contact_ids: dict[str, str], dry: bool) -> int:
    """Append rows to contacts.radius_holds jsonb. Keyed per contact."""
    n = 0
    # group by contact
    by_contact: dict[str, list[dict]] = {}
    for r in rows:
        cid = contact_ids.get(r.get("contact_gigwell_id"))
        if not cid:
            continue
        entry = {
            "artist_slug": r.get("artist_slug"),
            "hold_start": r.get("hold_start"),
            "hold_end": r.get("hold_end"),
            "radius_miles": r.get("radius_miles"),
            "hold_number": r.get("hold_number"),
            "notes": r.get("notes"),
        }
        by_contact.setdefault(cid, []).append(entry)
    for cid, holds in by_contact.items():
        if dry:
            print(f"  [dry] radius_holds contact={cid[:8]} n={len(holds)}")
            n += len(holds)
            continue
        sb.table("contacts").update({"radius_holds": holds}).eq("id", cid).execute()
        n += len(holds)
    return n


def upsert_praise(sb: Client, rows: list[dict],
                  contact_ids: dict[str, str],
                  venue_ids: dict[str, str], dry: bool) -> int:
    n = 0
    for r in rows:
        cid = contact_ids.get(r.get("contact_gigwell_id"))
        vid = venue_ids.get(r.get("venue_gigwell_id"))
        if not (cid or vid) or not r.get("text"):
            continue
        payload = {
            "contact_id": cid,
            "venue_id": vid,
            "category": r.get("category") or "testimonial",
            "text": r["text"],
            "source_url": r.get("source_url"),
            "date_observed": r.get("date_observed") or str(date.today()),
            "thomas_entered": False,
        }
        if dry:
            print(f"  [dry] praise contact={cid or '-'}/venue={vid or '-'}")
            n += 1
            continue
        sb.table("praise_bank").insert(payload).execute()
        n += 1
    return n


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--staging", default=str(STAGING))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--only", default="",
                    help="comma list of entities to load (default: all)")
    args = ap.parse_args()

    if not (args.dry_run or args.write):
        print("need --dry-run or --write", file=sys.stderr)
        return 2

    staging = Path(args.staging)
    if not staging.exists():
        print(f"staging dir not found: {staging}", file=sys.stderr)
        return 2

    only = set(s.strip() for s in args.only.split(",") if s.strip())
    want = lambda k: (not only) or (k in only)  # noqa: E731

    run_date = datetime.now(timezone.utc).strftime("%Y_%m_%d")
    run_tag = tag(run_date)

    sb = None if args.dry_run else supabase()
    artist_ids = load_artist_slug_map(sb) if sb else {}

    print(f"[{run_tag}] staging={staging}")

    venues = read_jsonl(staging / "venues.jsonl")           if want("venues") else []
    contacts = read_jsonl(staging / "contacts.jsonl")       if want("contacts") else []
    links = read_jsonl(staging / "contact_venues.jsonl")    if want("contact_venues") else []
    offers = read_jsonl(staging / "offers.jsonl")           if want("offers") else []
    shows = read_jsonl(staging / "confirmed_shows.jsonl")   if want("confirmed_shows") else []
    holds = read_jsonl(staging / "radius_holds.jsonl")      if want("radius_holds") else []
    praise = read_jsonl(staging / "praise.jsonl")           if want("praise") else []

    print(f"  venues={len(venues)} contacts={len(contacts)} links={len(links)}")
    print(f"  offers={len(offers)} shows={len(shows)} holds={len(holds)} praise={len(praise)}")

    venue_ids = upsert_venues(sb, venues, run_tag, args.dry_run) if sb or args.dry_run else {}
    contact_ids = upsert_contacts(sb, contacts, run_tag, args.dry_run) if sb or args.dry_run else {}
    link_n = upsert_contact_venues(sb, links, contact_ids, venue_ids, args.dry_run)
    off_n = upsert_offers(sb, offers, contact_ids, venue_ids, artist_ids, run_tag, args.dry_run)
    show_n = upsert_confirmed_shows(sb, shows, venue_ids, artist_ids, run_tag, args.dry_run)
    hold_n = apply_radius_holds(sb, holds, contact_ids, args.dry_run)
    praise_n = upsert_praise(sb, praise, contact_ids, venue_ids, args.dry_run)

    print(json.dumps({
        "run_tag": run_tag,
        "venues_mapped": len(venue_ids),
        "contacts_mapped": len(contact_ids),
        "contact_venues": link_n,
        "offers": off_n,
        "confirmed_shows": show_n,
        "radius_holds": hold_n,
        "praise": praise_n,
        "dry_run": args.dry_run,
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
