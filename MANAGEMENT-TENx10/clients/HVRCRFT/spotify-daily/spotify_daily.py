#!/usr/bin/env python3
"""
HVRCRFT daily Spotify autopull.

Pulls fresh artist + top-track data from the Spotify Web API and:
1. Appends one row to spotify_daily.csv (rolling timeseries)
2. Writes today's snapshot to snapshots/snapshot_<YYYY-MM-DD>.md
3. (Optional, with --notebook) Adds the snapshot to the HVRCRFT NotebookLM

Reads SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET from .env. Search order:
- ./.env           (script-local)
- repo-root .env   (10 Research Group umbrella)
- ~/.config/10rg/.env

Usage:
  python spotify_daily.py              # CSV + snapshot only
  python spotify_daily.py --notebook   # also push snapshot to NotebookLM
"""

import csv
import datetime
import json
import os
import subprocess
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

ARTIST_ID = "7F5MkQ9b2m12d1mujO8fpw"
ARTIST_NAME = "HVRCRFT"
NOTEBOOK_ID = "7c9082fc-66ca-470c-a477-3b6f594d3921"

SCRIPT_DIR = Path(__file__).parent.resolve()
CSV_PATH = SCRIPT_DIR / "spotify_daily.csv"
SNAPSHOT_DIR = SCRIPT_DIR / "snapshots"
LOG_PATH = SCRIPT_DIR / "spotify_daily.log"


def find_env():
    candidates = [
        SCRIPT_DIR / ".env",
        SCRIPT_DIR.parent.parent.parent.parent / ".env",
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


def fetch_artist_data(token):
    artist = api_get(f"https://api.spotify.com/v1/artists/{ARTIST_ID}", token)
    top_tracks = api_get(
        f"https://api.spotify.com/v1/artists/{ARTIST_ID}/top-tracks?market=US", token
    )["tracks"]
    # audio-features is restricted to extended-quota apps as of late 2024;
    # new dev apps get 403. Try, but treat 403 as a non-fatal "not available".
    features = []
    if top_tracks:
        ids = ",".join(t["id"] for t in top_tracks[:10])
        try:
            features = api_get(
                f"https://api.spotify.com/v1/audio-features?ids={ids}", token
            )["audio_features"]
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 403:
                log("audio-features endpoint not accessible (extended-quota required); skipping")
                features = []
            else:
                raise
    return artist, top_tracks, features


def already_logged_today(date_str):
    if not CSV_PATH.exists():
        return False
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("date") == date_str:
                return True
    return False


def append_csv(date_str, artist, top_tracks):
    headers = [
        "date",
        "artist_popularity",
        "followers",
        "top1_name", "top1_pop",
        "top2_name", "top2_pop",
        "top3_name", "top3_pop",
        "top5_avg_pop",
        "top10_avg_pop",
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
    new_file = not CSV_PATH.exists()
    with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        if new_file:
            w.writeheader()
        w.writerow(row)


def write_snapshot(date_str, artist, top_tracks, features):
    SNAPSHOT_DIR.mkdir(exist_ok=True)
    md_path = SNAPSHOT_DIR / f"snapshot_{date_str}.md"
    lines = [
        f"# HVRCRFT Spotify Snapshot — {date_str}",
        "",
        f"Artist: **{artist['name']}**  ",
        f"Spotify URI: `spotify:artist:{ARTIST_ID}`  ",
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
    if features and any(f for f in features):
        lines += [
            "",
            "## Audio features (top 10)",
            "",
            "| Track | BPM | Key | Energy | Dance | Valence | Loudness | Acoustic |",
            "|---|---:|---:|---:|---:|---:|---:|---:|",
        ]
        for t, f in zip(top_tracks[:10], features):
            if not f:
                continue
            lines.append(
                f"| {t['name']} | {round(f['tempo'])} | {f['key']} | "
                f"{f['energy']:.2f} | {f['danceability']:.2f} | "
                f"{f['valence']:.2f} | {f['loudness']:.1f} | {f['acousticness']:.2f} |"
            )
    md_path.write_text("\n".join(lines), encoding="utf-8")
    return md_path


def update_notebooklm(snapshot_text, date_str):
    """Push today's snapshot to the HVRCRFT NotebookLM via the notebooklm-mcp CLI."""
    title = f"HVRCRFT Spotify Snapshot {date_str}"
    init_req = {
        "jsonrpc": "2.0", "id": 0, "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "spotify-daily", "version": "1.0"},
        },
    }
    initialized = {"jsonrpc": "2.0", "method": "notifications/initialized"}
    add_req = {
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {
            "name": "notebook_add_text",
            "arguments": {
                "notebook_id": NOTEBOOK_ID,
                "text": snapshot_text,
                "title": title,
            },
        },
    }
    proc = subprocess.Popen(
        ["notebooklm-mcp"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    try:
        proc.stdin.write((json.dumps(init_req) + "\n").encode())
        proc.stdin.flush()
        proc.stdout.readline()
        proc.stdin.write((json.dumps(initialized) + "\n").encode())
        proc.stdin.flush()
        proc.stdin.write((json.dumps(add_req) + "\n").encode())
        proc.stdin.flush()
        response_line = proc.stdout.readline().decode()
    finally:
        try:
            proc.stdin.close()
        except Exception:
            pass
        proc.wait(timeout=30)
    response = json.loads(response_line)
    if "error" in response:
        raise RuntimeError(f"NotebookLM update failed: {response['error']}")
    log(f"NotebookLM source added: {title}")


def main():
    env_path = find_env()
    if env_path:
        load_dotenv(env_path)
        log(f"Loaded env from {env_path}")
    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        log("ERROR: SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing from .env")
        sys.exit(1)

    date_str = datetime.date.today().isoformat()
    log(f"Run start for {date_str}")

    if already_logged_today(date_str):
        log(f"Already logged today; skipping CSV append. Snapshot will be regenerated.")

    token = get_access_token(client_id, client_secret)
    artist, top_tracks, features = fetch_artist_data(token)

    if not already_logged_today(date_str):
        append_csv(date_str, artist, top_tracks)
        log(f"CSV row appended: pop={artist['popularity']}, followers={artist['followers']['total']}")

    snapshot_path = write_snapshot(date_str, artist, top_tracks, features)
    log(f"Snapshot written: {snapshot_path}")

    if "--notebook" in sys.argv:
        text = snapshot_path.read_text(encoding="utf-8")
        try:
            update_notebooklm(text, date_str)
        except Exception as e:
            log(f"NotebookLM update FAILED (non-fatal): {e}")

    log("Run complete")


if __name__ == "__main__":
    main()
