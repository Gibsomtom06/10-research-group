#!/usr/bin/env python3
"""Full multi-label discography backfill for every managed artist.

VMG sees only DSR-distributed releases — that left ~120 of DirtySnatcha's
tracks invisible to the platform (Dim Mak / Circus / Wakaan / Subsidia /
self-release never touched VMG). This script walks Spotify Web API's
getArtistAlbums endpoint with the widest include_groups
(album,single,appears_on,compilation) and upserts every unique track into
the `catalog` table, regardless of which label distributed it.

For each artist in REGISTRY:
  1. Paginate /v1/artists/{id}/albums?include_groups=album,single,appears_on,compilation
  2. For each album, list its tracks via /v1/albums/{id}/tracks
  3. For each track, fetch the full /v1/tracks/{id} record (gives ISRC + popularity)
  4. Dedupe by ISRC (preferring the highest-popularity occurrence on collision)
  5. Upsert each into catalog with bucket='released_full', popularity,
     spotify_track_id, spotify_album_id, label, collaborators, streaming_url,
     artwork_url, release_date

Idempotent: ON CONFLICT (artist_id, isrc) DO UPDATE for tracks with an ISRC,
falls back to (artist_id, spotify_track_id) for tracks without one.

Audit JSON of the deduped track list per run lands at
clients/<stage_name>/spotify-daily/catalog_pull_<YYYY-MM-DD>.json for
diff-ability.

Usage:
  python multi_label_catalog_pull.py                # all artists
  python multi_label_catalog_pull.py DirtySnatcha   # one
  python multi_label_catalog_pull.py --dry-run      # show counts only
  python multi_label_catalog_pull.py --no-supabase  # file audit only
"""

import datetime
import json
import re
import sys
from pathlib import Path

import requests

from _spotify_common import (
    REGISTRY,
    SCRIPT_DIR,
    CLIENTS_DIR,
    make_logger,
    get_access_token,
    api_get,
    get_supabase,
    lookup_artist_uuid,
    load_env_or_exit,
)


LOG_PATH = SCRIPT_DIR / "multi_label_catalog_pull.log"
log = make_logger(LOG_PATH)


REMIX_RE = re.compile(r"\b(remix|vip|edit|bootleg|flip|rework)\b", re.IGNORECASE)


def infer_type(album, track, primary_artist_id):
    """Best-guess catalog.type from album/track metadata."""
    name = track["name"]
    if REMIX_RE.search(name):
        return "remix"
    other_artists = [a for a in track.get("artists", []) if a["id"] != primary_artist_id]
    if other_artists:
        return "collab"
    album_type = album.get("album_type")
    if album_type == "album":
        return "album"
    if album_type == "compilation":
        return "compilation"
    return "single"


def walk_artist_albums(spotify_artist_id, token):
    """Paginate getArtistAlbums with all 4 include_groups. Returns list of album dicts."""
    albums = []
    seen_album_ids = set()
    next_url = (
        f"/v1/artists/{spotify_artist_id}/albums"
        "?include_groups=album,single,appears_on,compilation"
        "&limit=50&market=US"
    )
    while next_url:
        page = api_get(next_url, token)
        for a in page.get("items", []):
            if a["id"] in seen_album_ids:
                continue
            seen_album_ids.add(a["id"])
            albums.append(a)
        next_url = page.get("next")
    return albums


def walk_album_tracks(album_id, token):
    """Paginate /v1/albums/{id}/tracks. Returns list of (track-stub) dicts."""
    tracks = []
    next_url = f"/v1/albums/{album_id}/tracks?limit=50&market=US"
    while next_url:
        page = api_get(next_url, token)
        tracks.extend(page.get("items", []))
        next_url = page.get("next")
    return tracks


def fetch_full_tracks(track_ids, token):
    """Batch-fetch /v1/tracks?ids=... (max 50 IDs per call). Returns dict id->track."""
    out = {}
    for i in range(0, len(track_ids), 50):
        chunk = track_ids[i:i + 50]
        ids_param = ",".join(chunk)
        data = api_get(f"/v1/tracks?ids={ids_param}&market=US", token)
        for t in data.get("tracks") or []:
            if t is None:
                continue
            out[t["id"]] = t
    return out


def build_track_records(stage_name, spotify_artist_id, token):
    """Walk + dedupe; return list of upsert dicts ready for the catalog table."""
    log(f"[{stage_name}] walking albums...")
    albums = walk_artist_albums(spotify_artist_id, token)
    log(f"[{stage_name}] found {len(albums)} unique albums across all include_groups")

    # Collect every album-track stub
    track_stubs = []
    track_to_album = {}
    for album in albums:
        try:
            stubs = walk_album_tracks(album["id"], token)
        except requests.exceptions.HTTPError as e:
            log(f"[{stage_name}] album {album['id']} failed: {e}")
            continue
        for t in stubs:
            # Skip tracks where the primary artist isn't credited (appears_on
            # compilations sometimes include tracks the artist isn't on).
            if not any(a["id"] == spotify_artist_id for a in t.get("artists", [])):
                continue
            track_stubs.append(t)
            track_to_album[t["id"]] = album
    log(f"[{stage_name}] found {len(track_stubs)} tracks across albums (pre-dedupe)")

    # Batch-fetch full track objects for ISRC + popularity
    track_ids = [t["id"] for t in track_stubs]
    full_tracks = fetch_full_tracks(track_ids, token)
    log(f"[{stage_name}] full-track lookup returned {len(full_tracks)} objects")

    # Dedupe by ISRC, falling back to track_id when ISRC missing.
    # On collision, keep the entry with the highest popularity (it's typically
    # the canonical release vs. compilation re-issue).
    by_key = {}
    for stub in track_stubs:
        full = full_tracks.get(stub["id"])
        if not full:
            continue
        isrc = (full.get("external_ids") or {}).get("isrc")
        key = isrc or f"sid:{full['id']}"
        album = track_to_album[stub["id"]]
        if key not in by_key:
            by_key[key] = (album, full)
        else:
            _, existing = by_key[key]
            if (full.get("popularity") or 0) > (existing.get("popularity") or 0):
                by_key[key] = (album, full)

    log(f"[{stage_name}] {len(by_key)} unique tracks after ISRC dedupe")

    records = []
    for key, (album, full) in by_key.items():
        isrc = (full.get("external_ids") or {}).get("isrc")
        type_ = infer_type(album, full, spotify_artist_id)
        collaborators = ", ".join(
            a["name"] for a in full.get("artists", []) if a["id"] != spotify_artist_id
        ) or None
        artwork = None
        images = album.get("images") or []
        if images:
            artwork = images[0].get("url")

        # Spotify returns release_date in 3 precisions: 'year' / 'year-month' / 'day'.
        # Postgres date column needs full YYYY-MM-DD. Normalize: pad year-only or
        # year-month to a January 1st / -01 default, leave full dates alone.
        rel_date = album.get("release_date") or None
        rel_prec = album.get("release_date_precision")
        if rel_date:
            if rel_prec == "year" or len(rel_date) == 4:
                rel_date = f"{rel_date}-01-01"
            elif rel_prec == "month" or len(rel_date) == 7:
                rel_date = f"{rel_date}-01"

        records.append({
            "title": full["name"],
            "type": type_,
            "bucket": "released_full",
            "release_date": rel_date,
            "isrc": isrc,
            "spotify_track_id": full["id"],
            "spotify_album_id": album["id"],
            "label": album.get("label"),
            "distributor": album.get("label"),  # best proxy without a second /v1/albums fetch
            "popularity": full.get("popularity"),
            "streaming_url": (full.get("external_urls") or {}).get("spotify"),
            "artwork_url": artwork,
            "collaborators": collaborators,
        })

    return records


def upsert_records(stage_name, artist_uuid, records, dry_run=False):
    """UPSERT records into catalog. Two paths:
       - records with ISRC -> on_conflict='artist_id,isrc'
       - records without -> on_conflict='artist_id,spotify_track_id'"""
    sb = get_supabase()
    if sb is None:
        log(f"[{stage_name}] supabase unavailable; skipping upsert")
        return 0
    if dry_run:
        log(f"[{stage_name}] DRY RUN — {len(records)} records would be upserted")
        return len(records)

    # Attach the artist_id and prepare the two batches
    with_isrc = []
    without_isrc = []
    for r in records:
        r["artist_id"] = artist_uuid
        if r.get("isrc"):
            with_isrc.append(r)
        else:
            without_isrc.append(r)

    total = 0
    if with_isrc:
        try:
            sb.table("catalog").upsert(with_isrc, on_conflict="artist_id,isrc").execute()
            total += len(with_isrc)
        except Exception as e:
            log(f"[{stage_name}] ISRC upsert failed: {type(e).__name__}: {e}")

    if without_isrc:
        try:
            sb.table("catalog").upsert(without_isrc, on_conflict="artist_id,spotify_track_id").execute()
            total += len(without_isrc)
        except Exception as e:
            log(f"[{stage_name}] spotify_track_id upsert failed: {type(e).__name__}: {e}")

    log(f"[{stage_name}] upserted {total} records ({len(with_isrc)} via ISRC + {len(without_isrc)} via spotify_track_id)")
    return total


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    flags = [a for a in sys.argv[1:] if a.startswith("-")]
    dry_run = "--dry-run" in flags
    write_supabase = "--no-supabase" not in flags
    target = args[0] if args else None
    if target and target not in REGISTRY:
        log(f"ERROR: artist '{target}' not in REGISTRY ({', '.join(REGISTRY.keys())})")
        sys.exit(2)

    cid, csec = load_env_or_exit(log)

    date_str = datetime.date.today().isoformat()
    log(f"=== multi_label_catalog_pull run start for {date_str} (dry_run={dry_run}, write_supabase={write_supabase}) ===")
    token = get_access_token(cid, csec)

    total_artists = 0
    total_tracks = 0
    for stage_name, spotify_artist_id in REGISTRY.items():
        if target and stage_name != target:
            continue
        try:
            records = build_track_records(stage_name, spotify_artist_id, token)
        except Exception as e:
            log(f"[{stage_name}] FAILED: {type(e).__name__}: {e}")
            continue

        # Audit JSON
        audit_path = CLIENTS_DIR / stage_name / "spotify-daily" / f"catalog_pull_{date_str}.json"
        audit_path.parent.mkdir(parents=True, exist_ok=True)
        audit_path.write_text(json.dumps(records, indent=2, default=str), encoding="utf-8")
        log(f"[{stage_name}] audit written: {audit_path.name}")

        if write_supabase:
            artist_uuid = lookup_artist_uuid(stage_name, log)
            if artist_uuid:
                upsert_records(stage_name, artist_uuid, records, dry_run=dry_run)

        total_artists += 1
        total_tracks += len(records)

    log(f"=== Done. artists={total_artists}, total_tracks_upserted={total_tracks} ===")


if __name__ == "__main__":
    main()
