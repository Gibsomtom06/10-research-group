#!/usr/bin/env python3
"""
gmail_oauth_setup.py — one-time Gmail OAuth bootstrap for DBA.

Walks Thomas through the Google InstalledAppFlow consent screen and prints
the refresh token that needs to go into:
  - app/.env.local → GOOGLE_OAUTH_REFRESH_TOKEN
  - workers/.env   → GOOGLE_OAUTH_REFRESH_TOKEN

Prereqs (one time in Google Cloud Console — see docs/GMAIL_OAUTH_SETUP.md):
  1. Create / pick a GCP project
  2. Enable Gmail API
  3. Configure OAuth consent screen (External → Testing, add thomas@dirtysnatcharecords.com
     as a test user — that's the identity the sender worker uses)
  4. Create OAuth 2.0 Client ID, type = "Desktop app"
  5. Download the JSON as client_secret.json next to this script

Usage:
  cd scripts
  pip install google-auth-oauthlib google-auth
  python gmail_oauth_setup.py                       # default: reads ./client_secret.json
  python gmail_oauth_setup.py path/to/secret.json   # explicit path

The script:
  - Pops a browser tab, asks you to sign in as thomas@dirtysnatcharecords.com
  - You grant gmail.send scope
  - Prints CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN to paste into .env files

Refresh tokens don't expire as long as:
  - the app stays in "Testing" OR gets published
  - Thomas doesn't revoke at myaccount.google.com/permissions
  - the token is used at least once every 6 months

If this ever breaks (revoked, expired, changed password), just re-run it.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:  # noqa: BLE001
    sys.stderr.write(
        "[fatal] missing deps. run:\n"
        "    pip install google-auth-oauthlib google-auth\n"
    )
    sys.exit(2)


# Gmail send is all we need — sender.ts only drafts & sends.
# If we later add the inbound classifier worker hitting users.messages.list,
# bump this to include gmail.readonly or gmail.modify and re-run the flow.
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def _resolve_secret_path(argv: list[str]) -> Path:
    if len(argv) > 1:
        p = Path(argv[1]).expanduser().resolve()
    else:
        p = (Path(__file__).parent / "client_secret.json").resolve()
    if not p.exists():
        sys.stderr.write(
            f"[fatal] client_secret.json not found at: {p}\n"
            "        download it from Google Cloud Console → APIs & Services\n"
            "        → Credentials → your OAuth 2.0 Client ID → Download JSON\n"
            "        and save it to the path above (or pass explicit path as argv[1]).\n"
        )
        sys.exit(2)
    return p


def _extract_client_pair(secret_path: Path) -> tuple[str, str]:
    raw = json.loads(secret_path.read_text(encoding="utf-8"))
    # installed-app client JSON has one of two shapes depending on console vintage
    bag = raw.get("installed") or raw.get("web") or {}
    cid = bag.get("client_id") or ""
    cs = bag.get("client_secret") or ""
    if not cid or not cs:
        sys.stderr.write(
            "[fatal] client_secret.json is missing client_id / client_secret.\n"
            "        make sure you created a Desktop-app OAuth client, not a service account.\n"
        )
        sys.exit(2)
    return cid, cs


def main() -> int:
    secret_path = _resolve_secret_path(sys.argv)
    client_id, client_secret = _extract_client_pair(secret_path)

    print()
    print("dba gmail oauth setup")
    print("=" * 60)
    print(f"using client_secret: {secret_path}")
    print(f"requesting scopes  : {', '.join(SCOPES)}")
    print()
    print("opening browser — sign in as thomas@dirtysnatcharecords.com and grant access.")
    print("(if no browser opens, copy the printed URL into one manually.)")
    print()

    flow = InstalledAppFlow.from_client_secrets_file(str(secret_path), SCOPES)

    # port=0 → OS picks a free loopback port. access_type=offline is required
    # for a refresh token. prompt=consent forces Google to re-issue one even
    # if Thomas previously consented (so we always get a fresh refresh_token
    # back in the response, not None).
    creds = flow.run_local_server(
        port=0,
        access_type="offline",
        prompt="consent",
        open_browser=True,
    )

    if not creds.refresh_token:
        sys.stderr.write(
            "[fatal] google returned no refresh_token.\n"
            "        this usually means you've already consented to this app and\n"
            "        Google is refusing to re-issue. fix:\n"
            "          1. go to https://myaccount.google.com/permissions\n"
            "          2. revoke access for this OAuth client\n"
            "          3. re-run this script\n"
        )
        return 2

    print()
    print("=" * 60)
    print("  success — paste the block below into your .env files")
    print("=" * 60)
    print()
    print(f"GOOGLE_OAUTH_CLIENT_ID={client_id}")
    print(f"GOOGLE_OAUTH_CLIENT_SECRET={client_secret}")
    print(f"GOOGLE_OAUTH_REFRESH_TOKEN={creds.refresh_token}")
    print()
    print("target files:")
    print("  - app/.env.local")
    print("  - workers/.env")
    print()
    print("verify:  cd workers && npm run worker:sender -- --once")
    print("         (set SENDER_DRY_RUN=true in workers/.env for the first run)")
    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
