"""Run both tracks every 30 minutes during market hours (9:30-16:00 ET, M-F).

Discord leaderboard is posted TWICE PER DAY (changed 2026-05-01 per
Thomas — every-pass posting was too noisy):
  - Morning post: first pass at or after 10:00 ET (one hour into session)
  - Closing post:  first pass at or after 15:30 ET (last 30 min)

State tracked in data/.last_discord_post.json to avoid double-posting.
Discord failures NEVER stop the trading loop.
"""
import json
import subprocess
import sys
import time
from datetime import datetime, time as dt_time, date
from pathlib import Path
from zoneinfo import ZoneInfo

from trading_shadow.runner import run_one_pass

ET = ZoneInfo("America/New_York")
OPEN = dt_time(9, 30)
CLOSE = dt_time(16, 0)
SCRIPT_DIR = Path(__file__).resolve().parent
POST_LEADERBOARD = SCRIPT_DIR / "post_leaderboard.py"
SYNC_PNL = SCRIPT_DIR / "sync_pnl.py"
POST_STATE_PATH = SCRIPT_DIR.parent / "data" / ".last_discord_post.json"
HEARTBEAT_PATH = SCRIPT_DIR.parent / "data" / ".heartbeat_paper.txt"

POST_WINDOWS = [
    ("morning", dt_time(10, 0)),   # first pass at/after 10:00 ET
    ("closing", dt_time(15, 30)),  # first pass at/after 15:30 ET
]


def is_market_open() -> bool:
    now = datetime.now(ET)
    if now.weekday() >= 5:
        return False
    return OPEN <= now.time() <= CLOSE


def _load_post_state() -> dict:
    if not POST_STATE_PATH.exists():
        return {}
    try:
        return json.loads(POST_STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_post_state(state: dict) -> None:
    POST_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    POST_STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")


def should_post_now() -> str | None:
    """Return the window label (morning|closing) if we should post, else None.

    Posts once per window per day. State persisted across loop restarts.
    """
    now_et = datetime.now(ET)
    today = now_et.date().isoformat()
    state = _load_post_state()
    posted_today = state.get(today, [])
    for label, threshold in POST_WINDOWS:
        if label in posted_today:
            continue
        if now_et.time() >= threshold:
            return label
    return None


def sync_pnl_to_supabase() -> None:
    """Run scripts/sync_pnl.py after every pass — keeps dashboard P&L live."""
    try:
        result = subprocess.run(
            [sys.executable, str(SYNC_PNL)],
            cwd=str(SCRIPT_DIR.parent),
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode != 0:
            print(f"[sync_pnl] non-zero exit: {result.stderr[:200]}", flush=True)
    except Exception as e:
        print(f"[sync_pnl] failed: {e}", flush=True)


def post_to_discord(window_label: str) -> None:
    """Run scripts/post_leaderboard.py — failures don't crash the loop."""
    try:
        result = subprocess.run(
            [sys.executable, str(POST_LEADERBOARD)],
            cwd=str(SCRIPT_DIR.parent),
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            print(f"[post_leaderboard] non-zero exit: {result.stderr[:200]}", flush=True)
            return
        # Mark posted so we don't double-post in the same window
        today = datetime.now(ET).date().isoformat()
        state = _load_post_state()
        state.setdefault(today, []).append(window_label)
        _save_post_state(state)
        print(f"[post_leaderboard] posted {window_label} window", flush=True)
    except Exception as e:
        print(f"[post_leaderboard] failed: {e}", flush=True)


def write_heartbeat() -> None:
    """Write current UTC timestamp to heartbeat file. Called every loop tick."""
    try:
        HEARTBEAT_PATH.parent.mkdir(parents=True, exist_ok=True)
        HEARTBEAT_PATH.write_text(datetime.utcnow().isoformat(), encoding="utf-8")
    except Exception as e:
        print(f"[heartbeat] write failed: {e}", flush=True)


if __name__ == "__main__":
    print("[loop_paper] starting; market hours 9:30-16:00 ET; Discord posts at 10:00 + 15:30 ET", flush=True)
    while True:
        write_heartbeat()
        if is_market_open():
            try:
                run_one_pass(track="A", live=False)
                run_one_pass(track="B", live=False)
                sync_pnl_to_supabase()
                window = should_post_now()
                if window:
                    post_to_discord(window)
            except Exception as e:
                print(f"Pass error: {e}", flush=True)
        time.sleep(30 * 60)
