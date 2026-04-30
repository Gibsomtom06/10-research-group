#!/usr/bin/env python3
"""
sync_contacts_from_gmail.py

Pulls contacts out of Gmail and writes/upserts them into the contacts table
with tier classification, role hinting, and last_contact_at.

Source labels (configurable):
  - OFFERS/*               → these are real booking conversations; everyone
                              in them is a booker/promoter/buyer candidate
  - SENT                    → Thomas's outbound; used to count exchanges per
                              counterparty for tier classification
  - BOOKING/*              → optional extra scope

Tier rules (counts are per-counterparty, in-scope only):
  - insider: outbound_count >= 3 AND received a reply in the last 12 months
             OR email domain matches an `insider_domains` allowlist
  - warm:    1 <= outbound_count < 3, or 0 outbound with >=1 inbound reply
  - cold:    otherwise (listed but never emailed, or only received blast to)

Role hinting:
  - domain/address keywords (booking@, @livenation.com, @aegpresents.com)
  - subject/body keywords ("routing", "hold", "avails", "radius")
  - multi-role support: if both talent_buyer and manager evidence exists,
    both land in contact_roles[]

Requires: google-api-python-client, google-auth, supabase
Env:
    GOOGLE_OAUTH_CREDENTIALS  path to client_secret.json
    GOOGLE_OAUTH_TOKEN        path to saved token.json (created on first run)
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE
    THOMAS_EMAIL              defaults to thomas@dirtysnatcha.com

Usage:
    python sync_contacts_from_gmail.py \
        --labels OFFERS BOOKING \
        --since 2023-01-01 \
        --dry-run

Add --write to commit to Supabase. Dry-run prints a ranked table to stdout.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone, timedelta
from email.utils import getaddresses, parseaddr, parsedate_to_datetime
from pathlib import Path
from typing import Iterable

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
except ImportError:
    print(
        "missing deps: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib",
        file=sys.stderr,
    )
    sys.exit(2)

try:
    from supabase import create_client, Client
except ImportError:
    print("missing dep: pip install supabase", file=sys.stderr)
    sys.exit(2)


SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
THOMAS_DEFAULT = "thomas@dirtysnatcha.com"

# Role keyword map. Multi-role is allowed: hits from multiple buckets
# all land in contact_roles[].
ROLE_HINTS: dict[str, list[str]] = {
    "talent_buyer":    ["booking@", "talent@", "bookings@", "book@", "talent buyer",
                        "@livenation", "@aegpresents", "@globaldance", "@emporiumpresents"],
    "festival_buyer":  ["festival", "fest@", "edcweek", "lollapalooza", "bonnaroo",
                        "coachella", "global dance festival", "decadence", "elektric"],
    "tour_buyer":      ["tour@", "routing@", "tours@"],
    "venue_booker":    ["venue", "theatre", "ballroom", "amphitheat", "arena", "hall@",
                        "room@", "club@", "mission ballroom", "ogden theatre",
                        "bluebird theater", "fox theatre", "cervantes"],
    "venue_owner":     ["owner@", "president@"],
    "promoter":        ["promo", "promoter", "productions", "presents", "@emporiumpresents",
                        "@aeglive"],
    "manager":         ["mgmt", "management", "manager", "mgmt@"],
    "agent":           ["@prysmagency", "@agencygroup", "@wmeagency", "@caa.com",
                        "@paradigm", "@utalent", "@windishagency", "@ab-agents"],
    "artist_peer":     ["records", "artist services", "@dirtysnatcharecords"],
}

# Domains where EVERY counterparty is treated as an insider regardless of
# exchange count. Edit to taste.
INSIDER_DOMAINS: set[str] = {
    "prysmagency.com",
    # add agent/mgmt domains Thomas works with here
}

# Email prefixes we skip entirely (not real humans / would spam role inbox)
GENERIC_PREFIXES = {
    "noreply", "no-reply", "notifications", "support", "billing",
    "admin", "hello", "help", "postmaster", "mailer-daemon",
}

# Labels/prefixes to skip even within scoped pulls (auto, newsletter, ads)
SKIP_SENDER_DOMAINS = {
    "gigwell.com",                 # Gigwell system emails, not promoters
    "inbound.gigwell.com",
    "mandrillapp.com",
    "sendgrid.net",
    "docusign.net",
    "calendly.com",
}


@dataclass
class ContactAggregate:
    email: str
    full_name: str = ""
    company: str = ""
    outbound_count: int = 0
    inbound_count: int = 0
    first_seen: datetime | None = None
    last_seen: datetime | None = None
    last_reply_to_thomas: datetime | None = None
    roles: set[str] = field(default_factory=set)
    subjects_sampled: list[str] = field(default_factory=list)
    source_labels: set[str] = field(default_factory=set)

    @property
    def domain(self) -> str:
        return self.email.split("@", 1)[1] if "@" in self.email else ""

    @property
    def prefix(self) -> str:
        return self.email.split("@", 1)[0] if "@" in self.email else self.email

    def is_generic(self) -> bool:
        return self.prefix.lower() in GENERIC_PREFIXES

    def classify_tier(self, now: datetime) -> str:
        if self.domain in INSIDER_DOMAINS:
            return "insider"
        if self.outbound_count >= 3 and self.last_reply_to_thomas is not None:
            recent = (now - self.last_reply_to_thomas).days <= 365
            if recent:
                return "insider"
        if self.outbound_count >= 1 or self.inbound_count >= 1:
            return "warm"
        return "cold"

    def classify_roles(self) -> list[str]:
        blob = " ".join([
            self.email.lower(),
            self.full_name.lower(),
            self.company.lower(),
            " ".join(self.subjects_sampled).lower(),
        ])
        found: list[str] = []
        for role, hints in ROLE_HINTS.items():
            if any(h in blob for h in hints):
                found.append(role)
        if not found:
            found = ["other"]
        return found

    def to_upsert_row(self, thomas_email: str) -> dict:
        now = datetime.now(timezone.utc)
        tier = self.classify_tier(now)
        roles = self.classify_roles()
        primary_role = roles[0]
        return {
            "full_name": self.full_name or self.email,
            "email": self.email,
            "role": primary_role,
            "contact_roles": roles,
            "company": self.company or None,
            "relationship_tier": tier,
            "relationship_strength": (
                "warm" if tier in ("insider", "warm") else "cold"
            ),
            "last_interaction_at": self.last_seen.isoformat() if self.last_seen else None,
            "last_contact_at": self.last_seen.isoformat() if self.last_seen else None,
            "outbound_count": self.outbound_count,
            "inbound_count": self.inbound_count,
            "source_tag": "gmail_sync:" + ",".join(sorted(self.source_labels)),
            "source_imports": [{
                "source": "gmail_sync",
                "labels": sorted(self.source_labels),
                "synced_at": now.isoformat(),
                "by": thomas_email,
            }],
        }


# -------------------------------------------------------------------------
# Gmail auth
# -------------------------------------------------------------------------
def gmail_service():
    token_path = os.environ.get("GOOGLE_OAUTH_TOKEN", "_staging/gmail_token.json")
    cred_path = os.environ.get("GOOGLE_OAUTH_CREDENTIALS", "_staging/gmail_credentials.json")

    creds: Credentials | None = None
    if Path(token_path).exists():
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not Path(cred_path).exists():
                raise RuntimeError(
                    f"Gmail credentials not found at {cred_path}. "
                    "Download OAuth client JSON from Google Cloud Console "
                    "(type: Desktop) and set GOOGLE_OAUTH_CREDENTIALS."
                )
            flow = InstalledAppFlow.from_client_secrets_file(cred_path, SCOPES)
            creds = flow.run_local_server(port=0)
        Path(token_path).parent.mkdir(parents=True, exist_ok=True)
        Path(token_path).write_text(creds.to_json())
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


# -------------------------------------------------------------------------
# Gmail pulling
# -------------------------------------------------------------------------
def resolve_label_ids(svc, wanted_prefixes: list[str]) -> dict[str, str]:
    """Returns label_name -> label_id for every label whose name starts with
    any of the given prefixes (case-insensitive). SENT/INBOX are special."""
    resp = svc.users().labels().list(userId="me").execute()
    labels = resp.get("labels", [])
    out: dict[str, str] = {}
    wanted_upper = [p.upper() for p in wanted_prefixes]
    for lbl in labels:
        name = lbl.get("name", "")
        name_u = name.upper()
        if name_u in {"SENT", "INBOX"} and name_u in wanted_upper:
            out[name_u] = lbl["id"]
            continue
        for p in wanted_upper:
            if name_u == p or name_u.startswith(p + "/"):
                out[name] = lbl["id"]
                break
    return out


def iter_message_ids(svc, label_id: str, since: str | None) -> Iterable[str]:
    query = f"after:{since.replace('-', '/')}" if since else None
    page_token = None
    while True:
        kwargs = dict(userId="me", labelIds=[label_id], maxResults=500)
        if query:
            kwargs["q"] = query
        if page_token:
            kwargs["pageToken"] = page_token
        resp = svc.users().messages().list(**kwargs).execute()
        for m in resp.get("messages", []) or []:
            yield m["id"]
        page_token = resp.get("nextPageToken")
        if not page_token:
            return


def fetch_message(svc, msg_id: str) -> dict:
    return svc.users().messages().get(
        userId="me", id=msg_id, format="metadata",
        metadataHeaders=["From", "To", "Cc", "Bcc", "Subject", "Date"],
    ).execute()


def parse_headers(msg: dict) -> dict:
    headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
    date = None
    if headers.get("date"):
        try:
            date = parsedate_to_datetime(headers["date"])
            if date.tzinfo is None:
                date = date.replace(tzinfo=timezone.utc)
        except Exception:
            pass
    frm_name, frm_email = parseaddr(headers.get("from", ""))
    to_pairs = getaddresses([headers.get("to", ""), headers.get("cc", ""), headers.get("bcc", "")])
    return {
        "date": date,
        "from": (frm_name, frm_email.lower().strip()),
        "to": [(n, e.lower().strip()) for n, e in to_pairs if e],
        "subject": headers.get("subject", ""),
    }


# -------------------------------------------------------------------------
# Aggregation
# -------------------------------------------------------------------------
def update_contact(
    agg: dict[str, ContactAggregate],
    email: str,
    name: str,
    when: datetime | None,
    subject: str,
    label_name: str,
    outbound_from_thomas: bool,
    inbound_from_them: bool,
) -> None:
    email = email.lower().strip()
    if not email or "@" not in email:
        return
    domain = email.split("@", 1)[1]
    if domain in SKIP_SENDER_DOMAINS:
        return
    rec = agg.get(email)
    if rec is None:
        rec = ContactAggregate(email=email, full_name=name or "", company=domain)
        agg[email] = rec
    if name and (not rec.full_name or rec.full_name == email):
        rec.full_name = name
    if when:
        if not rec.first_seen or when < rec.first_seen:
            rec.first_seen = when
        if not rec.last_seen or when > rec.last_seen:
            rec.last_seen = when
        if inbound_from_them and (not rec.last_reply_to_thomas or when > rec.last_reply_to_thomas):
            rec.last_reply_to_thomas = when
    if outbound_from_thomas:
        rec.outbound_count += 1
    if inbound_from_them:
        rec.inbound_count += 1
    if subject and len(rec.subjects_sampled) < 10:
        rec.subjects_sampled.append(subject)
    rec.source_labels.add(label_name)


def process_label(
    svc,
    label_name: str,
    label_id: str,
    thomas_email: str,
    since: str | None,
    agg: dict[str, ContactAggregate],
    max_messages: int,
) -> int:
    thomas_l = thomas_email.lower()
    count = 0
    for msg_id in iter_message_ids(svc, label_id, since):
        if max_messages and count >= max_messages:
            break
        msg = fetch_message(svc, msg_id)
        h = parse_headers(msg)
        frm_name, frm_email = h["from"]
        outbound = frm_email == thomas_l
        subject = h["subject"]
        when = h["date"]
        counterparties = h["to"] if outbound else [(frm_name, frm_email)]
        for name, email in counterparties:
            if email == thomas_l:
                continue
            update_contact(
                agg, email, name, when, subject, label_name,
                outbound_from_thomas=outbound,
                inbound_from_them=(not outbound),
            )
        count += 1
    return count


# -------------------------------------------------------------------------
# Supabase write
# -------------------------------------------------------------------------
def supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL + SUPABASE_SERVICE_ROLE required")
    return create_client(url, key)


def upsert_contacts(sb: Client, rows: list[dict]) -> int:
    written = 0
    BATCH = 100
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i + BATCH]
        sb.table("contacts").upsert(chunk, on_conflict="email").execute()
        written += len(chunk)
    return written


# -------------------------------------------------------------------------
# CLI
# -------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--labels", nargs="+", default=["OFFERS", "BOOKING", "SENT"],
                    help="Label prefixes to pull. SENT is special (uses threads Thomas sent).")
    ap.add_argument("--since", default=None, help="YYYY-MM-DD")
    ap.add_argument("--max-messages", type=int, default=0,
                    help="0 = all; cap per-label for safety while testing")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print the ranked contact table; do not write Supabase")
    ap.add_argument("--write", action="store_true", help="Commit to Supabase")
    ap.add_argument("--skip-generic", action="store_true", default=True)
    ap.add_argument("--stage-path", default="_staging/gmail_contacts.jsonl",
                    help="Always write a JSONL audit copy here")
    args = ap.parse_args()

    if args.dry_run and args.write:
        print("--dry-run and --write are mutually exclusive", file=sys.stderr)
        return 2

    thomas_email = os.environ.get("THOMAS_EMAIL", THOMAS_DEFAULT).lower()

    print(f"[gmail-sync] connecting as {thomas_email} ...")
    svc = gmail_service()

    print(f"[gmail-sync] resolving labels: {args.labels}")
    label_map = resolve_label_ids(svc, args.labels)
    if not label_map:
        print("no matching labels found", file=sys.stderr)
        return 1
    for name, lid in label_map.items():
        print(f"  {name} -> {lid}")

    agg: dict[str, ContactAggregate] = {}
    for name, lid in label_map.items():
        print(f"[gmail-sync] pulling label {name} ...")
        n = process_label(svc, name, lid, thomas_email, args.since, agg, args.max_messages)
        print(f"  processed {n} messages for {name}")

    # drop generics
    if args.skip_generic:
        agg = {e: r for e, r in agg.items() if not r.is_generic()}

    # stage a JSONL audit copy
    stage = Path(args.stage_path)
    stage.parent.mkdir(parents=True, exist_ok=True)
    with stage.open("w", encoding="utf-8") as f:
        for rec in agg.values():
            d = asdict(rec)
            for k in ("first_seen", "last_seen", "last_reply_to_thomas"):
                v = d.get(k)
                d[k] = v.isoformat() if isinstance(v, datetime) else v
            d["roles"] = sorted(rec.roles)
            d["source_labels"] = sorted(rec.source_labels)
            f.write(json.dumps(d, ensure_ascii=False) + "\n")
    print(f"[gmail-sync] staged {len(agg)} contacts -> {stage}")

    # rank + summarise
    now = datetime.now(timezone.utc)
    rows = [(r.classify_tier(now), r) for r in agg.values()]
    by_tier = defaultdict(list)
    for tier, r in rows:
        by_tier[tier].append(r)
    for tier in ("insider", "warm", "cold"):
        bucket = sorted(by_tier[tier], key=lambda r: r.outbound_count + r.inbound_count, reverse=True)
        print(f"\n== {tier.upper()} ({len(bucket)}) ==")
        for r in bucket[:25]:
            roles = ",".join(r.classify_roles())
            last = r.last_seen.date().isoformat() if r.last_seen else "-"
            print(f"  {r.email:45s}  out={r.outbound_count:<3} in={r.inbound_count:<3} "
                  f"last={last}  {roles}  [{r.full_name[:30]}]")

    if args.write:
        sb = supabase_client()
        rows = [r.to_upsert_row(thomas_email) for r in agg.values()]
        n = upsert_contacts(sb, rows)
        print(f"\n[gmail-sync] upserted {n} contacts into Supabase")
    else:
        print("\n[gmail-sync] dry run. Pass --write to commit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
