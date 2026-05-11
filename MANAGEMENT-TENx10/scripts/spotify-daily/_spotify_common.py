#!/usr/bin/env python3
"""Shared helpers for the Spotify daily + catalog pipelines.

Both multi_pull.py (artist-level daily snapshot) and
multi_label_catalog_pull.py (one-shot full discography backfill) import from
here. Single source of truth for: env loading, Spotify auth, HTTP wrapper
with 429 rate-limit handling, Supabase client, log function, and the
REGISTRY of managed artists.
"""

import datetime
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

try:
    from supabase import create_client as _create_supabase_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False


# Each managed artist + their Spotify artist ID. Folder name MUST match
# artists.stage_name (case-insensitive) for the tenx10 backfill / snapshot
# joins to resolve the right artist_id row.
REGISTRY = {
    "DirtySnatcha": "13dsmcZVkb1XlhT6RQYh1n",
    "WHOiSEE":      "7pA2OyYV0LxwdOvzJJe7CH",
    "Dark Matter":  "71c783dJDlJ3pqD7cFIOQq",
    "Kotrax":       "2uqBhmfMSA63cRR61btTdp",
    "HVRCRFT":      "7F5MkQ9b2m12d1mujO8fpw",
}


# Path constants — both scripts share these so file outputs land in
# consistent locations.
SCRIPT_DIR = Path(__file__).parent.resolve()
UMBRELLA_ROOT = SCRIPT_DIR.parent.parent.parent  # .../10 Research Group
CLIENTS_DIR = UMBRELLA_ROOT / "MANAGEMENT-TENx10" / "clients"


def find_env():
    """Search the umbrella .env, script-local .env, and ~/.config/10rg/.env
    in that order. Returns the first match or None."""
    candidates = [
        SCRIPT_DIR / ".env",
        UMBRELLA_ROOT / ".env",
        Path.home() / ".config" / "10rg" / ".env",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def make_logger(log_path):
    """Build a logger that writes timestamped lines to both stdout and
    a log file. Returns the log function."""
    log_path = Path(log_path)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    def log(msg):
        ts = datetime.datetime.now().isoformat(timespec="seconds")
        line = f"[{ts}] {msg}"
        print(line)
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")

    return log


def get_access_token(client_id, client_secret):
    """Client-credentials flow — public data only. Returns a bearer token."""
    r = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "client_credentials"},
        auth=(client_id, client_secret),
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def api_get(url_or_path, token, max_retries=3):
    """GET wrapper with 429 Retry-After handling. Pass either a full URL or
    a path like '/v1/artists/...' (the base is prepended)."""
    url = url_or_path if url_or_path.startswith("http") else f"https://api.spotify.com{url_or_path}"
    for attempt in range(max_retries):
        r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", "2"))
            time.sleep(wait + 1)
            continue
        r.raise_for_status()
        return r.json()
    r.raise_for_status()
    return r.json()


# Lazy Supabase client — created on first use.
_supabase = None


def get_supabase():
    """Returns a Supabase client built from NEXT_PUBLIC_SUPABASE_URL +
    SUPABASE_SERVICE_ROLE_KEY in env. Returns None if creds missing or the
    supabase-py library isn't installed."""
    global _supabase
    if _supabase is not None:
        return _supabase
    if not HAS_SUPABASE:
        return None
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    _supabase = _create_supabase_client(url, key)
    return _supabase


def lookup_artist_uuid(stage_name, log_fn=None):
    """Resolve artists.stage_name → artists.id (uuid). Case-insensitive.
    Returns None if no row matches."""
    sb = get_supabase()
    if sb is None:
        return None
    try:
        res = sb.table("artists").select("id, stage_name").ilike("stage_name", stage_name).limit(1).execute()
        rows = res.data or []
        if rows:
            return rows[0]["id"]
        if log_fn:
            log_fn(f"WARN: no artists row matched stage_name='{stage_name}'")
        return None
    except Exception as e:
        if log_fn:
            log_fn(f"ERROR: artists lookup failed for '{stage_name}': {type(e).__name__}: {e}")
        return None


def load_env_or_exit(log_fn):
    """Find + load the .env. Verify SPOTIFY_CLIENT_ID + SECRET present.
    Returns (client_id, client_secret) or sys.exit(1) on failure."""
    env_path = find_env()
    if env_path:
        load_dotenv(env_path)
        log_fn(f"Loaded env from {env_path}")
    cid = os.environ.get("SPOTIFY_CLIENT_ID")
    csec = os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not cid or not csec:
        log_fn("ERROR: SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing from .env")
        sys.exit(1)
    return cid, csec
