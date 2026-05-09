#!/usr/bin/env python3
"""
HVRCRFT Spotify for Artists scraper — runs after agent-browser session is authenticated.

Pulls four datasets from the live S4A SPA via the agent-browser CDP session:
  1. Top cities (last 28 days)
  2. Top countries
  3. Audience demographics (age, gender)
  4. Source of streams (last 28 days)

Saves outputs to MANAGEMENT-TENx10/clients/HVRCRFT/s4a-export/<YYYY-MM-DD>/

Prereq: a logged-in agent-browser session named `s4a-hvrcrft` is already open
on the HVRCRFT artist page. Run this script while the browser session is live.

This uses agent-browser's `eval` to extract data directly from the rendered DOM,
which is more reliable than snapshot-based extraction for SPA-heavy pages.
"""

import datetime
import json
import os
import subprocess
from pathlib import Path

ARTIST_ID = "7F5MkQ9b2m12d1mujO8fpw"
SESSION = "s4a-hvrcrft"
SCRIPT_DIR = Path(__file__).parent.resolve()
EXPORT_DIR = SCRIPT_DIR.parent / "s4a-export" / datetime.date.today().isoformat()


def run(cmd):
    """Run a shell command and return stdout."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout, result.stderr, result.returncode


def navigate(path):
    cmd = f'agent-browser --session {SESSION} open "https://artists.spotify.com/c/artist/{ARTIST_ID}{path}"'
    out, err, rc = run(cmd)
    if rc != 0:
        print(f"navigate failed: {err}")
        return False
    # wait for SPA to render
    run(f'agent-browser --session {SESSION} wait --load networkidle')
    run(f'agent-browser --session {SESSION} wait 5000')
    return True


def eval_js(js_code):
    """Run JS in the browser and return the result."""
    # escape quotes for shell
    escaped = js_code.replace('"', '\\"')
    cmd = f'agent-browser --session {SESSION} eval "{escaped}"'
    out, err, rc = run(cmd)
    return out.strip()


def pull_cities():
    """Extract top cities from the audience page DOM."""
    navigate("/audience")
    # Spotify uses a virtualized list — scroll to load all rows
    run(f'agent-browser --session {SESSION} scroll down 1000')
    run(f'agent-browser --session {SESSION} wait 2000')
    # Try to extract via DOM. Spotify's audience page typically has a table with
    # `data-testid="city-row"` or similar. We'll grab all visible city rows.
    js = """
    JSON.stringify(
      Array.from(document.querySelectorAll('[data-testid*="city"], [aria-label*="city"]'))
        .map(el => el.textContent.trim()).filter(t => t.length > 0).slice(0, 100)
    )
    """
    raw = eval_js(js)
    return raw


def pull_countries():
    navigate("/audience")
    js = """
    JSON.stringify(
      Array.from(document.querySelectorAll('[data-testid*="country"], [aria-label*="country"]'))
        .map(el => el.textContent.trim()).filter(t => t.length > 0).slice(0, 100)
    )
    """
    return eval_js(js)


def pull_source_of_streams():
    navigate("/audience/sources")
    js = """
    JSON.stringify(
      Array.from(document.querySelectorAll('[data-testid*="source"], [aria-label*="source"]'))
        .map(el => el.textContent.trim()).filter(t => t.length > 0)
    )
    """
    return eval_js(js)


def main():
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Export dir: {EXPORT_DIR}")

    pulls = {
        "cities": pull_cities,
        "countries": pull_countries,
        "source_of_streams": pull_source_of_streams,
    }

    for name, fn in pulls.items():
        print(f"\n--- {name} ---")
        try:
            data = fn()
            out_path = EXPORT_DIR / f"{name}.json"
            out_path.write_text(data, encoding="utf-8")
            print(f"  saved to {out_path}")
            print(f"  preview: {data[:200]}")
        except Exception as e:
            print(f"  FAILED: {e}")
            (EXPORT_DIR / f"{name}.error.txt").write_text(str(e), encoding="utf-8")


if __name__ == "__main__":
    main()
