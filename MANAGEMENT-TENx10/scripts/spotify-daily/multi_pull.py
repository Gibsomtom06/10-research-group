#!/usr/bin/env python3
"""Shared Spotify daily autopull — runs for every managed artist.

Writes per-artist CSV + markdown snapshot into
    MANAGEMENT-TENx10/clients/<stage_name>/spotify-daily/
matching the file shape produced by HVRCRFT/spotify_daily.py so the
Tenx10 backfill (scripts/backfill/057_spotify_daily.ts) picks them up
without modification.

HVRCRFT keeps its own dedicated script + scheduled task for now (working,
proven). This runner handles the other 4 managed artists. Post-Wed event
we can fold HVRCRFT in too and retire the old script.

Reads SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET from the umbrella .env.

Usage:
  python multi_pull.py                # all artists in REGISTRY
  python multi_pull.py DirtySnatcha   # one artist
"""

import csv
import datetime
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

# Each managed artist + their Spotify artist ID. Folder name MUST match
# artists.stage_name (case-insensitive) for the Tenx10 backfill to find
# the right artist_id row.
REGISTRY = {
    "DirtySnatcha": "13dsmcZVkb1XlhT6RQYh1n",
    "WHOiSEE":      "7pA2OyYV0LxwdOvzJJe7CH",
    "Dark Matter":  "71c783dJDlJ3pqD7cFIOQq",
    "Kotrax":       "2uqBhmfMSA63cRR61btTdp",
    # HVRCRFT skipped here — uses its own dedicated spotify_daily.py at
    # clients/HVRCRFT/spotify-daily/. Fold in after 2026-05-13 event.
}

SCRIPT_DIR = Path(__file__).parent.resolve()
UMBRELLA_ROOT = SCRIPT_DIR.parent.parent.parent  # .../10 Research Group
CLIENTS_DIR = UMBRELLA_ROOT / "MANAGEMENT-TENx10" / "clients"
LOG_PATH = SCRIPT_DIR / "multi_pull.log"


def find_env():
    candidates = [
        SCRIPT_DIR / ".env",
        UMBRELLA_ROOT / ".env",
        Path.home() / ".config" / "10rg" / ".env",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def log(msg):
    ts = datetime.datetime.now().isoformat(timespec="seconds")
    line = f"[{ts}] {msg}"
    print(line)
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def get_access_token(client_id, client_secret):
    r = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "client_credentials"},
        auth=(client_id, client_secret),
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def api_get(url, token):
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    r.raise_for_status()
    return r.json()


def fetch_artist_data(token, artist_id):
    artist = api_get(f"https://api.spotify.com/v1/artists/{artist_id}", token)
    top_tracks = api_get(
        f"https://api.spotify.com/v1/artists/{artist_id}/top-tracks?market=US",
        token,
    )["tracks"]
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


def run_one(token, stage_name, artist_id, date_str):
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
    return True


def main():
    env_path = find_env()
    if env_path:
        load_dotenv(env_path)
        log(f"Loaded env from {env_path}")

    cid = os.environ.get("SPOTIFY_CLIENT_ID")
    csec = os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not cid or not csec:
        log("ERROR: SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing from .env")
        sys.exit(1)

    target = sys.argv[1] if len(sys.argv) > 1 else None
    if target and target not in REGISTRY:
        log(f"ERROR: artist '{target}' not in REGISTRY ({', '.join(REGISTRY.keys())})")
        sys.exit(2)

    date_str = datetime.date.today().isoformat()
    log(f"=== multi_pull run start for {date_str} ===")

    token = get_access_token(cid, csec)

    ok = 0
    fail = 0
    for stage_name, artist_id in REGISTRY.items():
        if target and stage_name != target:
            continue
        if run_one(token, stage_name, artist_id, date_str):
            ok += 1
        else:
            fail += 1

    log(f"=== Done. ok={ok} fail={fail} ===")


if __name__ == "__main__":
    main()
