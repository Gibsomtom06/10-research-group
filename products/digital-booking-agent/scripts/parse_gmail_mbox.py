#!/usr/bin/env python3
"""
Parse a Gmail Takeout .mbox file into two things:

1. contacts.csv — deduped recipients with inferred role + relationship strength
2. sent_mail.jsonl — structured record per sent email for voice-samples loading

Usage:
    python parse_gmail_mbox.py \
        --mbox "/path/to/All mail Including Spam and Trash.mbox" \
        --out-dir ./_staging/parsed \
        --sender thomas@dirtysnatcha.com

Does NOT touch Supabase. Writes files. A separate loader reads the CSVs and inserts.
This split keeps the ingestion auditable — you can eyeball contacts.csv before any DB write.
"""
from __future__ import annotations

import argparse
import csv
import json
import mailbox
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from email.utils import getaddresses, parseaddr, parsedate_to_datetime
from pathlib import Path

# crude-but-effective heuristics for classifying who we're emailing with
ROLE_HINTS = {
    "talent_buyer":   ["booking@", "talent@", "bookings@", "book@", "info@", "talent buyer"],
    "venue_owner":    ["venue", "room", "ballroom", "theatre", "hall", "club"],
    "promoter":       ["promo", "promoter", "productions", "presents", "live nation", "aeg"],
    "manager":        ["mgmt", "management", "manager"],
    "agent":          ["agency", "agent", "caa", "waa", "wme", "utr", "paradigm", "uta"],
    "artist_peer":    ["records", "music", "band", "artist"],
}

GENERIC_EMAIL_PREFIXES = {"hello", "hi", "contact", "support", "admin", "info", "noreply", "no-reply", "billing"}


def classify_role(email: str, name: str) -> str:
    e = (email or "").lower()
    n = (name or "").lower()
    for role, hints in ROLE_HINTS.items():
        if any(h in e or h in n for h in hints):
            return role
    return "other"


def relationship_strength(last_seen: datetime | None) -> str:
    if last_seen is None:
        return "cold"
    days = (datetime.now(timezone.utc) - last_seen).days
    if days <= 180:
        return "warm"
    if days <= 730:
        return "reconnect"
    return "dormant"


def extract_city_guess(body: str) -> str | None:
    # very rough: look for "City, ST" patterns in signatures / venue lines
    m = re.search(r"([A-Z][a-zA-Z .'-]+),\s*([A-Z]{2})\b", body or "")
    return f"{m.group(1).strip()}, {m.group(2)}" if m else None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mbox", required=True)
    ap.add_argument("--out-dir", default="_staging/parsed")
    ap.add_argument("--sender", required=True, help="Thomas's email — used to tag outbound vs inbound")
    ap.add_argument("--limit", type=int, default=0, help="0 = all")
    args = ap.parse_args()

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    mbox = mailbox.mbox(args.mbox)
    sender_l = args.sender.lower()

    contacts: dict[str, dict] = {}  # email -> record
    sent_samples: list[dict] = []
    counters = defaultdict(int)

    for i, msg in enumerate(mbox):
        if args.limit and i >= args.limit:
            break
        counters["total"] += 1

        try:
            date = parsedate_to_datetime(msg["Date"]) if msg["Date"] else None
            if date and date.tzinfo is None:
                date = date.replace(tzinfo=timezone.utc)
        except Exception:
            date = None

        frm_name, frm = parseaddr(msg.get("From", ""))
        to_pairs = getaddresses(msg.get_all("To", []) + msg.get_all("Cc", []) + msg.get_all("Bcc", []))

        # determine direction
        outbound = (frm or "").lower() == sender_l
        counterparties = to_pairs if outbound else [(frm_name, frm)]

        # update contacts
        for name, email in counterparties:
            email_l = (email or "").lower().strip()
            if not email_l or "@" not in email_l:
                continue
            prefix = email_l.split("@", 1)[0]
            role = classify_role(email_l, name)
            rec = contacts.setdefault(email_l, {
                "email": email_l,
                "full_name": name or email_l,
                "role": role,
                "company": email_l.split("@", 1)[1] if "@" in email_l else "",
                "is_generic": prefix in GENERIC_EMAIL_PREFIXES,
                "first_seen": date,
                "last_seen": date,
                "sent_count": 0,
                "received_count": 0,
            })
            if name and not rec["full_name"] or rec["full_name"] == email_l:
                rec["full_name"] = name
            if date and (not rec["last_seen"] or date > rec["last_seen"]):
                rec["last_seen"] = date
            if date and (not rec["first_seen"] or date < rec["first_seen"]):
                rec["first_seen"] = date
            if outbound:
                rec["sent_count"] += 1
            else:
                rec["received_count"] += 1

        # if outbound, capture as a potential voice sample
        if outbound:
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        try:
                            body = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace")
                            break
                        except Exception:
                            continue
            else:
                try:
                    body = msg.get_payload(decode=True).decode(msg.get_content_charset() or "utf-8", errors="replace")
                except Exception:
                    body = msg.get_payload() or ""

            body = body.strip()
            if 30 <= len(body) <= 3000:  # skip one-liners and walls
                sent_samples.append({
                    "date": date.isoformat() if date else None,
                    "to": [e for _, e in to_pairs],
                    "subject": msg.get("Subject", ""),
                    "body": body,
                    "word_count": len(body.split()),
                })
                counters["voice_candidates"] += 1

        counters["processed"] += 1
        if counters["processed"] % 500 == 0:
            print(f"  …processed {counters['processed']}")

    # write contacts.csv
    contacts_path = out / "contacts.csv"
    with contacts_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "email","full_name","role","company","is_generic",
            "first_seen","last_seen","sent_count","received_count","relationship_strength"
        ])
        for rec in contacts.values():
            w.writerow([
                rec["email"], rec["full_name"], rec["role"], rec["company"],
                rec["is_generic"],
                rec["first_seen"].isoformat() if rec["first_seen"] else "",
                rec["last_seen"].isoformat() if rec["last_seen"] else "",
                rec["sent_count"], rec["received_count"],
                relationship_strength(rec["last_seen"]),
            ])

    # write sent_mail.jsonl
    sent_path = out / "sent_mail.jsonl"
    with sent_path.open("w", encoding="utf-8") as f:
        for s in sent_samples:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")

    print(f"\nprocessed: {counters['processed']} messages")
    print(f"contacts:  {len(contacts)} -> {contacts_path}")
    print(f"voice candidates: {counters['voice_candidates']} -> {sent_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
