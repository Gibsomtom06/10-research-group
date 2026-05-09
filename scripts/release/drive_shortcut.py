#!/usr/bin/env python3
"""
drive_shortcut.py — create a Google Drive shortcut from one folder to another.

A Drive shortcut is mimeType=application/vnd.google-apps.shortcut with
shortcutDetails.targetId pointing at the canonical file/folder. NEVER duplicates bytes.

Used for the artist-folder pattern: e.g. a shortcut in `DirtySnatcha/2026/` points
at the canonical DSR release folder under `DSR Releases/2026/DirtySnatcha - Rise EP/`.

First run is interactive — opens a browser for OAuth consent against the Drive
scope. The refresh token is saved to TOKEN_PATH for subsequent non-interactive runs.

Usage:
    python drive_shortcut.py \\
        --target-id <canonical folder id> \\
        --parent-id <artist year folder id> \\
        --name "DirtySnatcha - Rise EP"

Or, more typically, look the IDs up by path inside the same shared drive:

    python drive_shortcut.py \\
        --target-path "DSR Releases/2026/DirtySnatcha - Rise EP" \\
        --parent-path "DirtySnatcha/2026" \\
        --shared-drive-id 0AFR5kVe9DGXCUk9PVA
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Lazy imports so --help works without google libs installed.

SCOPES = ["https://www.googleapis.com/auth/drive"]
DEFAULT_TOKEN_PATH = Path.home() / ".config" / "10rg" / "drive_shortcut_token.json"

# OAuth client config priority:
#   1. Env vars GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (auto-loaded from tenx10-platform/.env.local)
#   2. --client-secret PATH JSON file
# tenx10 cloud project (478216192609) is the canonical one; DBA project (137140748441) is legacy.

TENX10_ENV_PATHS = [
    Path(__file__).resolve().parents[2] / "products" / "tenx10-platform" / ".env.local",
    Path(__file__).resolve().parents[2] / "products" / "tenx10-platform" / ".env.production.local",
]


def load_env_for_oauth() -> None:
    for p in TENX10_ENV_PATHS:
        if not p.exists():
            continue
        for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v


def get_service(client_secret_path: Path | None, token_path: Path):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Priority: explicit --client-secret PATH first (since the only known
            # local-installable OAuth client lives in the DBA project at
            # products/digital-booking-agent/scripts/client_secret.json — Desktop type,
            # http://localhost redirect allowed). The tenx10 cloud project's OAuth
            # client is a Web-application type with a fixed callback at tenx10.co —
            # NOT compatible with the InstalledAppFlow / localhost redirect we use here.
            if client_secret_path and client_secret_path.exists():
                flow = InstalledAppFlow.from_client_secrets_file(str(client_secret_path), SCOPES)
            else:
                cid = os.environ.get("GOOGLE_CLIENT_ID")
                csec = os.environ.get("GOOGLE_CLIENT_SECRET")
                if cid and csec:
                    client_config = {
                        "installed": {
                            "client_id": cid,
                            "client_secret": csec,
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "token_uri": "https://oauth2.googleapis.com/token",
                            "redirect_uris": ["http://localhost"],
                        }
                    }
                    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
                else:
                    raise SystemExit(
                        "ERROR: no OAuth credentials found. Pass --client-secret PATH "
                        "(default: products/digital-booking-agent/scripts/client_secret.json) "
                        "OR set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET as a Desktop-app client."
                    )
            creds = flow.run_local_server(port=0, prompt="consent")
        token_path.parent.mkdir(parents=True, exist_ok=True)
        token_path.write_text(creds.to_json(), encoding="utf-8")
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def find_by_path(service, path: str, shared_drive_id: str) -> str:
    """Resolve `A/B/C` to a Drive file id by walking children, scoped to a shared drive."""
    parent = shared_drive_id
    for segment in [s for s in path.split("/") if s]:
        # Escape single-quotes in segment for the query
        seg_escaped = segment.replace("'", "\\'")
        q = f"name = '{seg_escaped}' and '{parent}' in parents and trashed = false"
        resp = service.files().list(
            q=q,
            corpora="drive",
            driveId=shared_drive_id,
            includeItemsFromAllDrives=True,
            supportsAllDrives=True,
            spaces="drive",
            fields="files(id, name, mimeType)",
            pageSize=10,
        ).execute()
        files = resp.get("files", [])
        if not files:
            raise SystemExit(f"path segment not found: {segment!r} under parent {parent}")
        if len(files) > 1:
            raise SystemExit(f"ambiguous segment {segment!r}: {len(files)} matches under parent {parent}")
        parent = files[0]["id"]
    return parent


def create_shortcut(service, *, target_id: str, parent_id: str, name: str) -> dict:
    body = {
        "name": name,
        "mimeType": "application/vnd.google-apps.shortcut",
        "shortcutDetails": {"targetId": target_id},
        "parents": [parent_id],
    }
    return service.files().create(
        body=body,
        supportsAllDrives=True,
        fields="id, name, mimeType, shortcutDetails, parents",
    ).execute()


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--target-id", help="Drive file id of the canonical target.")
    p.add_argument("--parent-id", help="Drive folder id where the shortcut will live.")
    p.add_argument("--target-path", help="Path under shared drive (e.g. 'DSR Releases/2026/DirtySnatcha - Rise EP').")
    p.add_argument("--parent-path", help="Path under shared drive for the parent folder (e.g. 'DirtySnatcha/2026').")
    p.add_argument("--shared-drive-id", default=os.environ.get("DSR_SHARED_DRIVE_ID", "0AFR5kVe9DGXCUk9PVA"),
                   help="Shared drive id to scope path lookups. Default: DSR shared drive.")
    p.add_argument("--name", help="Shortcut display name (default: target's basename).")
    p.add_argument("--client-secret", type=Path,
                   default=Path(__file__).resolve().parents[2] / "products" / "digital-booking-agent" / "scripts" / "client_secret.json",
                   help="Desktop-app OAuth client secret JSON. Default: DBA project's client.")
    p.add_argument("--token", type=Path, default=DEFAULT_TOKEN_PATH, help="Where to cache the refresh token.")
    args = p.parse_args()

    load_env_for_oauth()
    service = get_service(args.client_secret, args.token)

    target_id = args.target_id
    parent_id = args.parent_id
    name = args.name

    if not target_id:
        if not args.target_path:
            print("ERROR: must pass --target-id or --target-path", file=sys.stderr)
            return 2
        target_id = find_by_path(service, args.target_path, args.shared_drive_id)
        if not name:
            name = args.target_path.rstrip("/").split("/")[-1]
    if not parent_id:
        if not args.parent_path:
            print("ERROR: must pass --parent-id or --parent-path", file=sys.stderr)
            return 2
        parent_id = find_by_path(service, args.parent_path, args.shared_drive_id)

    if not name:
        # last fallback: query target's name
        meta = service.files().get(fileId=target_id, supportsAllDrives=True, fields="name").execute()
        name = meta["name"]

    res = create_shortcut(service, target_id=target_id, parent_id=parent_id, name=name)
    print(json.dumps(res, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
