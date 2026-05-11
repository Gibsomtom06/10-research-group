#!/usr/bin/env python3
"""Shared Spotify daily autopull — runs for every managed artist.

Per artist:
1. Fetches artist endpoint (popularity, followers, genres) + top-tracks (US)
2. Appends one row to clients/<stage_name>/spotify-daily/spotify_daily.csv
3. Writes clients/<stage_name>/spotify-daily/snapshots/snapshot_<YYYY-MM-DD>.md
4. Upserts the artist-level snapshot into spotify_daily_snapshots
5. Looks up all of that artist's catalog rows with spotify_track_id and
   batch-fetches /v1/tracks for current per-track popularity, upserting
   into catalog_track_snapshots and refreshing catalog.popularity.

The daily VM systemd timer (spotify-daily.timer, 9am America/New_York)
runs this script with no args. Re-running mid-day is idempotent — CSV
skip-on-date, file snapshot regenerates, Supabase UPSERT on
(artist_id, snapshot_date) and (catalog_track_id, snapshot_date).

Usage:
  python multi_pull.py                # all artists in REGISTRY
  python multi_pull.py DirtySnatcha   # one artist
  python multi_pull.py --no-supabase  # file writes only, skip DB
  python multi_pull.py --no-tracks    # skip the per-track snapshot step
"""

import csv
import datetime
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


LOG_PATH = SCRIPT_DIR / "multi_pull.log"
log = make_logger(LOG_PATH)


def fetch_artist_data(token, artist_id):
    artist = api_get(f"/v1/artists/{artist_id}", token)
    top_tracks = api_get(f"/v1/artists/{artist_id}/top-tracks?market=US", token)["tracks"]
    return artist, top_tracks


def already_logged_today(csv_path, date_str):
    if not csv_path.exists():
        return False
    with open(csv_path, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("date") == date_str:
                return True
    return False


def append_csv(csv_path, date_str, artist, top_tracks):
    headers = [
        "date", "artist_popularity", "followers",
        "top1_name", "top1_pop",
        "top2_name", "top2_pop",
        "top3_name", "top3_pop",
        "top5_avg_pop", "top10_avg_pop",
    ]
    top10 = top_tracks[:10]
    top5 = top_tracks[:5]
    def name(i): return top10[i]["name"] if i < len(top10) else ""
    def pop(i): return top10[i]["popularity"] if i < len(top10) else ""
    row = {
        "date": date_str,
        "artist_popularity": artist["popularity"],
        "followers": artist["followers"]["total"],
        "top1_name": name(0), "top1_pop": pop(0),
        "top2_name": name(1), "top2_pop": pop(1),
        "top3_name": name(2), "top3_pop": pop(2),
        "top5_avg_pop": round(sum(t["popularity"] for t in top5) / len(top5), 1) if top5 else "",
        "top10_avg_pop": round(sum(t["popularity"] for t in top10) / len(top10), 1) if top10 else "",
    }
    new_file = not csv_path.exists()
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        if new_file:
            w.writeheader()
        w.writerow(row)


def write_snapshot(snapshot_dir, date_str, stage_name, artist_id, artist, top_tracks):
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    md_path = snapshot_dir / f"snapshot_{date_str}.md"
    lines = [
        f"# {stage_name} Spotify Snapshot — {date_str}",
        "",
        f"Artist: **{artist['name']}**  ",
        f"Spotify URI: `spotify:artist:{artist_id}`  ",
        f"Genres: {', '.join(artist['genres']) if artist['genres'] else 'n/a'}",
        "",
        "## Artist-level metrics",
        "",
        f"- **Spotify popularity (0–100):** {artist['popularity']}",
        f"- **Followers:** {artist['followers']['total']:,}",
        "",
        "## Top tracks (Spotify market=US)",
        "",
        "| # | Track | Popularity | Album | Released |",
        "|---|---|---:|---|---|",
    ]
    for i, t in enumerate(top_tracks[:10], 1):
        rel = t.get("album", {}).get("release_date", "")
        album = t.get("album", {}).get("name", "")
        lines.append(f"| {i} | {t['name']} | {t['popularity']} | {album} | {rel} |")
    md_path.write_text("\n".join(lines), encoding="utf-8")
    return md_path


def upsert_artist_snapshot(stage_name, spotify_artist_id, date_str, artist, top_tracks):
    """Upsert one row into spotify_daily_snapshots."""
    sb = get_supabase()
    if sb is None:
        return False
    artist_uuid = lookup_artist_uuid(stage_name, log)
    if not artist_uuid:
        return False

    top_tracks_payload = [
        {
            "rank": i + 1,
            "name": t["name"],
            "popularity": t.get("popularity"),
            "album": (t.get("album") or {}).get("name"),
            "release_date": (t.get("album") or {}).get("release_date"),
        }
        for i, t in enumerate(top_tracks[:10])
    ]
    record = {
        "artist_id": artist_uuid,
        "snapshot_date": date_str,
        "popularity": artist["popularity"],
        "followers": artist["followers"]["total"],
        "top_tracks": top_tracks_payload,
        "raw": {
            "source": {
                "runner": "multi_pull.py",
                "ingested_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            },
            "spotify_artist_id": spotify_artist_id,
            "genres": artist.get("genres", []),
        },
    }
    sb.table("spotify_daily_snapshots").upsert(record, on_conflict="artist_id,snapshot_date").execute()
    log(f"[{stage_name}] artist snapshot upserted (artist_id={artist_uuid[:8]}, pop={artist['popularity']}, followers={artist['followers']['total']:,})")
    return True


def snapshot_track_popularities(stage_name, date_str, token):
    """Batch-fetch current popularity for every catalog row with a
    spotify_track_id for this artist; upsert into catalog_track_snapshots
    and refresh catalog.popularity to the latest value."""
    sb = get_supabase()
    if sb is None:
        log(f"[{stage_name}] tracks: supabase unavailable, skipping")
        return 0

    artist_uuid = lookup_artist_uuid(stage_name, log)
    if not artist_uuid:
        return 0

    try:
        rows_res = (
            sb.table("catalog")
            .select("id, spotify_track_id")
            .eq("artist_id", artist_uuid)
            .not_.is_("spotify_track_id", "null")
            .execute()
        )
    except Exception as e:
        log(f"[{stage_name}] tracks: catalog query failed: {type(e).__name__}: {e}")
        return 0

    rows = rows_res.data or []
    if not rows:
        log(f"[{stage_name}] tracks: no catalog rows with spotify_track_id (run multi_label_catalog_pull.py first)")
        return 0

    total = 0
    for i in range(0, len(rows), 50):
        chunk = rows[i:i + 50]
        ids = ",".join(r["spotify_track_id"] for r in chunk)
        try:
            data = api_get(f"/v1/tracks?ids={ids}&market=US", token)
        except requests.exceptions.HTTPError as e:
            log(f"[{stage_name}] tracks: chunk fetch failed: {e}")
            continue
        tracks = data.get("tracks") or []

        snapshot_rows = []
        for r, t in zip(chunk, tracks):
            if t is None:
                continue
            pop = t.get("popularity")
            snapshot_rows.append({
                "catalog_track_id": r["id"],
                "snapshot_date": date_str,
                "spotify_popularity": pop,
                "raw": {
                    "source": {
                        "runner": "multi_pull.py",
                        "ingested_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                    },
                },
            })
            # Refresh catalog.popularity to the freshest value too — saves a
            # join when the UI shows the per-track badge.
            try:
                sb.table("catalog").update({"popularity": pop}).eq("id", r["id"]).execute()
            except Exception:
                pass

        if snapshot_rows:
            try:
                sb.table("catalog_track_snapshots").upsert(
                    snapshot_rows, on_conflict="catalog_track_id,snapshot_date"
                ).execute()
                total += len(snapshot_rows)
            except Exception as e:
                log(f"[{stage_name}] tracks: upsert failed: {type(e).__name__}: {e}")

    log(f"[{stage_name}] tracks: {total} track snapshots upserted (of {len(rows)} catalog rows)")
    return total


def run_one(token, stage_name, artist_id, date_str, write_supabase=True, do_tracks=True):
    out_dir = CLIENTS_DIR / stage_name / "spotify-daily"
    csv_path = out_dir / "spotify_daily.csv"
    snapshot_dir = out_dir / "snapshots"

    try:
        artist, top_tracks = fetch_artist_data(token, artist_id)
    except requests.exceptions.HTTPError as e:
        log(f"[{stage_name}] API error: {e}")
        return False

    if not already_logged_today(csv_path, date_str):
        append_csv(csv_path, date_str, artist, top_tracks)
        log(f"[{stage_name}] CSV append: pop={artist['popularity']}, followers={artist['followers']['total']:,}")
    else:
        log(f"[{stage_name}] CSV already has {date_str}, regenerating snapshot only")

    md = write_snapshot(snapshot_dir, date_str, stage_name, artist_id, artist, top_tracks)
    log(f"[{stage_name}] snapshot written: {md.name}")

    if write_supabase:
        try:
            ok = upsert_artist_snapshot(stage_name, artist_id, date_str, artist, top_tracks)
            if not ok:
                log(f"[{stage_name}] artist snapshot upsert skipped (creds missing or no artist match)")
        except Exception as e:
            log(f"[{stage_name}] artist snapshot upsert FAILED (non-fatal): {type(e).__name__}: {e}")

        if do_tracks:
            try:
                snapshot_track_popularities(stage_name, date_str, token)
            except Exception as e:
                log(f"[{stage_name}] track snapshot FAILED (non-fatal): {type(e).__name__}: {e}")

    return True


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    flags = [a for a in sys.argv[1:] if a.startswith("-")]
    write_supabase = "--no-supabase" not in flags
    do_tracks = "--no-tracks" not in flags
    target = args[0] if args else None
    if target and target not in REGISTRY:
        log(f"ERROR: artist '{target}' not in REGISTRY ({', '.join(REGISTRY.keys())})")
        sys.exit(2)

    cid, csec = load_env_or_exit(log)

    if write_supabase:
        sb = get_supabase()
        if sb is None:
            log("WARN: supabase client unavailable (creds missing or supabase-py not installed) — file writes only")

    date_str = datetime.date.today().isoformat()
    log(f"=== multi_pull run start for {date_str} ===")

    token = get_access_token(cid, csec)

    ok = 0
    fail = 0
    for stage_name, artist_id in REGISTRY.items():
        if target and stage_name != target:
            continue
        if run_one(token, stage_name, artist_id, date_str, write_supabase=write_supabase, do_tracks=do_tracks):
            ok += 1
        else:
            fail += 1

    log(f"=== Done. ok={ok} fail={fail} ===")


if __name__ == "__main__":
    main()
