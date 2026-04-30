#!/usr/bin/env python3
"""
Import DSR contacts scraped from Gigwell show history.

Expected input: a CSV or JSON file exported from Gigwell. Headers vary,
so we map flexibly — the script normalizes common column names and
skips fields that aren't present.

Recognized column variants (case-insensitive):
    name        | contact name | buyer | booker | promoter | talent buyer
    email       | contact email | email address
    phone       | mobile | contact phone
    venue       | venue name | property | room
    city        | venue city | location
    state       | venue state | region
    role        | contact role | buyer type
    company     | organization | promo company | agency
    notes       | note | comments
    show_date   | date | event date
    show_title  | event | performance

Role heuristics:
    'talent buyer' / 'booker' / 'venue'      -> venue_booker
    'promoter'                                -> promoter
    'agent'                                   -> agent
    'manager'                                 -> manager
    'festival' + buyer                        -> festival_buyer
    else                                      -> other

Dedup: lowercased email match against contacts.email. On match, we
merge by appending the Gigwell source tag to source_imports and
updating blank fields only (never overwriting Thomas's notes).

Usage:
    python scripts/import_gigwell_contacts.py --file ./gigwell_export.csv
    python scripts/import_gigwell_contacts.py --file ./gigwell.json --dry-run
    python scripts/import_gigwell_contacts.py --file ./gigwell_export.csv \
        --tag "gigwell_scrape_2026_04"

Env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from supabase import create_client, Client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)


# header normalizer -> canonical field
HEADER_MAP = {
    "name": "full_name", "contact name": "full_name", "contact": "full_name",
    "buyer": "full_name", "booker": "full_name", "talent buyer": "full_name",
    "promoter": "full_name", "full name": "full_name", "first name": "_first",
    "last name": "_last",

    "email": "email", "contact email": "email", "email address": "email",
    "e-mail": "email",

    "phone": "phone", "mobile": "phone", "contact phone": "phone",
    "phone number": "phone", "cell": "phone",

    "venue": "company", "venue name": "company", "property": "company",
    "room": "company", "company": "company", "organization": "company",
    "promo company": "company", "agency": "company",

    "city": "city", "venue city": "city", "location": "city",

    "state": "state", "venue state": "state", "region": "state",

    "country": "country",

    "role": "role_hint", "contact role": "role_hint", "buyer type": "role_hint",
    "position": "role_hint", "title": "role_hint",

    "notes": "notes", "note": "notes", "comments": "notes",

    "show_date": "show_date", "date": "show_date", "event date": "show_date",
    "show title": "show_title", "event": "show_title", "performance": "show_title",
}

ROLE_KEYWORDS = [
    ("festival_buyer", ["festival"]),
    ("venue_booker", ["buyer", "booker", "venue", "talent"]),
    ("promoter", ["promoter", "promo"]),
    ("agent", ["agent", "booking agent", "agency"]),
    ("manager", ["manager", "management", "mgmt"]),
    ("production", ["production", "stage manager", "production manager"]),
    ("hospitality", ["hospitality"]),
]


def classify_role(hint: str | None, company: str | None, full_name: str | None) -> str:
    blob = " ".join([hint or "", company or "", full_name or ""]).lower()
    for role, keys in ROLE_KEYWORDS:
        if any(k in blob for k in keys):
            return role
    return "other"


def load_rows(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".json":
        obj = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(obj, dict) and "contacts" in obj:
            return obj["contacts"]
        if isinstance(obj, list):
            return obj
        raise ValueError("JSON must be a list or an object with a 'contacts' key")
    # CSV
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({k: (v or "").strip() for k, v in r.items()})
    return rows


def normalize_row(raw: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for k, v in raw.items():
        if v in (None, ""):
            continue
        key = (k or "").strip().lower()
        mapped = HEADER_MAP.get(key)
        if not mapped:
            continue
        out[mapped] = v

    # reassemble first + last into full_name if needed
    if "full_name" not in out:
        first = out.pop("_first", None)
        last = out.pop("_last", None)
        if first or last:
            out["full_name"] = " ".join(p for p in [first, last] if p).strip()
    else:
        out.pop("_first", None)
        out.pop("_last", None)

    # normalize email
    if "email" in out:
        out["email"] = out["email"].lower().strip()
        if "@" not in out["email"] or " " in out["email"]:
            out.pop("email")

    return out


def build_contact(row: dict[str, Any], source_tag: str) -> dict[str, Any]:
    role = classify_role(row.get("role_hint"), row.get("company"), row.get("full_name"))
    now = datetime.now(timezone.utc).isoformat()
    return {
        "full_name": row.get("full_name") or row.get("email", "").split("@")[0] or "Unknown",
        "email": row.get("email"),
        "phone": row.get("phone"),
        "role": role,
        "company": row.get("company"),
        "city": row.get("city"),
        "state": row.get("state"),
        "country": row.get("country") or "US",
        "relationship_strength": "cold",
        "thomas_notes": row.get("notes"),
        "source_imports": [{"source": "gigwell", "tag": source_tag, "imported_at": now,
                            "show_date": row.get("show_date"), "show_title": row.get("show_title")}],
    }


def supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


def lookup_existing(sb: Client, email: str | None, full_name: str | None) -> dict | None:
    if email:
        res = sb.table("contacts").select("*").ilike("email", email).limit(1).execute()
        if res.data:
            return res.data[0]
    # Name-only fuzzy match — only if full_name is distinctive (has two+ words)
    if full_name and len(full_name.split()) >= 2:
        res = (
            sb.table("contacts").select("*").ilike("full_name", full_name).limit(1).execute()
        )
        if res.data:
            return res.data[0]
    return None


def merge_imports(existing_imports: Any, new_entry: dict) -> list:
    try:
        arr = list(existing_imports or [])
    except Exception:
        arr = []
    arr.append(new_entry)
    return arr


def import_rows(sb: Client, rows: list[dict], source_tag: str, dry_run: bool) -> dict:
    inserted = 0
    merged = 0
    skipped_no_email = 0
    skipped_invalid = 0
    for raw in rows:
        row = normalize_row(raw)
        if not row:
            skipped_invalid += 1
            continue
        email = row.get("email")
        if not email and not row.get("full_name"):
            skipped_no_email += 1
            continue

        contact = build_contact(row, source_tag)
        existing = lookup_existing(sb, contact["email"], contact["full_name"])

        if existing:
            # merge: update only blank fields, append source_imports
            patch: dict[str, Any] = {
                "source_imports": merge_imports(existing.get("source_imports"), contact["source_imports"][0]),
            }
            for f in ("phone", "company", "city", "state"):
                if not existing.get(f) and contact.get(f):
                    patch[f] = contact[f]
            # never overwrite role if existing is specific, only fill default 'other'
            if existing.get("role") == "other" and contact.get("role") != "other":
                patch["role"] = contact["role"]

            if not dry_run:
                sb.table("contacts").update(patch).eq("id", existing["id"]).execute()
            merged += 1
        else:
            if not dry_run:
                sb.table("contacts").insert(contact).execute()
            inserted += 1

    return {
        "inserted": inserted,
        "merged": merged,
        "skipped_no_email": skipped_no_email,
        "skipped_invalid": skipped_invalid,
        "total_input_rows": len(rows),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True, help="CSV or JSON export from Gigwell")
    ap.add_argument("--tag", default=None, help="source tag; defaults to gigwell_YYYY_MM_DD")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    path = Path(args.file)
    if not path.exists():
        print(f"file not found: {path}", file=sys.stderr)
        return 2

    tag = args.tag or f"gigwell_{datetime.now(timezone.utc).strftime('%Y_%m_%d')}"
    rows = load_rows(path)
    print(f"loaded {len(rows)} rows from {path.name}")

    if args.dry_run:
        # show a preview
        sample_norm = [normalize_row(r) for r in rows[:5]]
        print("sample normalized rows:")
        print(json.dumps(sample_norm, indent=2))
        print("(dry-run — no DB writes)")

    sb = supabase_client()
    result = import_rows(sb, rows, tag, args.dry_run)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
