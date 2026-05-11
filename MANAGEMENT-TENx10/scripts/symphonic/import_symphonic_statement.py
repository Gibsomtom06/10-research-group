#!/usr/bin/env python3
"""Symphonic Distribution royalty ingest.

DSR's distribution history is Symphonic + VMG running in parallel. Some
tracks migrated to VMG, some are still on Symphonic. Symphonic's portal at
www.symphonicms.com exposes royalty data 2019 -> present across two
labelIds (55185 and 30750).

This script drives an already-logged-in agent-browser session
('symphonic-research') to:
1. Extract Laravel CSRF token + session cookies
2. POST /royalties/getsalessummaryearningscsv with periodFrom/periodTo/labelId
3. Save the returned CSV to MANAGEMENT-TENx10/labels/DirtySnatcha Records/distribution/symphonic/statements/
4. Parse CSV + UPSERT into symphonic_statement_periods + symphonic_royalty_lines

Modes:
  --mode fetch      # pull CSVs from Symphonic; don't parse
  --mode ingest     # parse local CSVs to Supabase; don't fetch
  --mode all        # fetch then ingest (default)

Filters:
  --label-id 55185         # restrict to one labelId (default: both 55185 + 30750)
  --from JAN-19            # period bounds (default: JAN-19)
  --to FEB-26              # default: current month code (UPPER-3-LETTER-YY)
  --period FEB-26          # shortcut: just one period (sets both --from and --to)
  --dry-run                # don't write Supabase

Usage:
  python import_symphonic_statement.py                          # all defaults
  python import_symphonic_statement.py --mode fetch             # just pull CSVs
  python import_symphonic_statement.py --mode ingest            # just parse local
  python import_symphonic_statement.py --label-id 55185 --period FEB-26
"""

import argparse
import csv
import datetime
import io
import json
import os
import subprocess
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

try:
    from supabase import create_client as _create_supabase_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False


SCRIPT_DIR = Path(__file__).parent.resolve()
UMBRELLA_ROOT = SCRIPT_DIR.parent.parent.parent  # .../10 Research Group
STATEMENTS_DIR = UMBRELLA_ROOT / "MANAGEMENT-TENx10" / "labels" / "DirtySnatcha Records" / "distribution" / "symphonic" / "statements"
LOG_PATH = SCRIPT_DIR / "import_symphonic.log"

DEFAULT_LABEL_IDS = ["55185", "30750"]
DEFAULT_FROM = "JAN-19"
SYMPHONIC_BASE = "https://www.symphonicms.com"
EXPORT_URL = f"{SYMPHONIC_BASE}/royalties/getsalessummaryearningscsv"
BROWSER_SESSION = "symphonic-research"

MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]


def log(msg):
    ts = datetime.datetime.now().isoformat(timespec="seconds")
    line = f"[{ts}] {msg}"
    print(line)
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def current_period_code():
    """e.g. 'MAY-26' for current month."""
    now = datetime.date.today()
    return f"{MONTH_NAMES[now.month - 1]}-{str(now.year)[-2:]}"


def find_env():
    for p in [SCRIPT_DIR / ".env", UMBRELLA_ROOT / ".env", Path.home() / ".config" / "10rg" / ".env"]:
        if p.exists():
            return p
    return None


def get_supabase():
    if not HAS_SUPABASE:
        return None
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    return _create_supabase_client(url, key)


# ─── Phase 1: drive agent-browser to extract CSRF + cookies ────────────────

def browser_eval(js_expr):
    """Run a JS expression in the agent-browser session and return the value.
    agent-browser returns the result as JSON (so string returns are quoted)."""
    r = subprocess.run(
        ["agent-browser.cmd" if os.name == "nt" else "agent-browser", "--session", BROWSER_SESSION, "eval", js_expr],
        capture_output=True, text=True, timeout=30,
    )
    if r.returncode != 0:
        raise RuntimeError(f"agent-browser eval failed: {r.stderr.strip()}")
    out = r.stdout.strip()
    if not out:
        return ""
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return out


def browser_open(url):
    r = subprocess.run(
        ["agent-browser.cmd" if os.name == "nt" else "agent-browser", "--session", BROWSER_SESSION, "open", url],
        capture_output=True, text=True, timeout=60,
    )
    if r.returncode != 0:
        raise RuntimeError(f"agent-browser open failed: {r.stderr.strip()}")


def browser_cookies():
    """Get all cookies for the current session as a list of dicts.
    agent-browser wraps the response as {success, data: {cookies: [...]}}."""
    r = subprocess.run(
        ["agent-browser.cmd" if os.name == "nt" else "agent-browser", "--session", BROWSER_SESSION, "cookies", "--json"],
        capture_output=True, text=True, timeout=30,
    )
    if r.returncode != 0:
        raise RuntimeError(f"agent-browser cookies failed: {r.stderr.strip()}")
    out = r.stdout.strip()
    if not out:
        return []
    try:
        parsed = json.loads(out)
    except json.JSONDecodeError:
        log(f"could not parse cookies JSON: {out[:200]}")
        return []
    # Unwrap {success, data: {cookies: [...]}} shape
    if isinstance(parsed, dict) and "data" in parsed:
        data = parsed["data"]
        if isinstance(data, dict) and "cookies" in data:
            return data["cookies"]
        if isinstance(data, list):
            return data
    if isinstance(parsed, list):
        return parsed
    return []


def get_csrf_and_cookies():
    """Navigate to royalties summary (ensures CSRF token is fresh), pull
    the meta[name=csrf-token] value + the symphonicms.com cookies."""
    log("opening royalty summary to refresh CSRF token...")
    browser_open(f"{SYMPHONIC_BASE}/royalties/summary")
    csrf = browser_eval("document.querySelector('meta[name=csrf-token]')?.content || ''")
    if not csrf:
        # Some Laravel apps put the token in a meta name="X-CSRF-TOKEN" or as a hidden input
        csrf = browser_eval("document.querySelector('input[name=_token]')?.value || ''")
    if not csrf:
        raise RuntimeError("Could not extract CSRF token from any meta tag or hidden input on /royalties/summary")
    log(f"CSRF token: {csrf[:8]}... (truncated)")
    cookies = browser_cookies()
    log(f"got {len(cookies)} cookies from session")
    return csrf, cookies


# ─── Phase 2: POST the export endpoint via requests ─────────────────────────

def build_session(cookies):
    """Build a requests.Session pre-loaded with cookies from the browser."""
    sess = requests.Session()
    sess.headers.update({
        "User-Agent": "Mozilla/5.0 (compatible; TENx10 Symphonic Ingest)",
        "Referer": f"{SYMPHONIC_BASE}/royalties/summary",
        "Origin": SYMPHONIC_BASE,
    })
    for c in cookies:
        # agent-browser cookies JSON uses keys: name, value, domain, path, etc.
        if isinstance(c, dict) and "name" in c and "value" in c:
            domain = c.get("domain", "").lstrip(".")
            if "symphonic" in domain or domain == "":
                sess.cookies.set(c["name"], c["value"], domain=domain or "www.symphonicms.com", path=c.get("path", "/"))
    return sess


def fetch_csv(session, csrf, period_from, period_to, label_id):
    """POST the export endpoint; return CSV text or None on failure."""
    payload = {
        "_token": csrf,
        "periodFrom": period_from,
        "periodTo": period_to,
        "fname": "DirtySnatchaRecords",
        "labelId": label_id,
    }
    log(f"  POST labelId={label_id} {period_from} -> {period_to}")
    try:
        r = session.post(EXPORT_URL, data=payload, timeout=180, allow_redirects=True)
    except requests.RequestException as e:
        log(f"  POST failed: {e}")
        return None

    ctype = r.headers.get("content-type", "")
    if r.status_code != 200:
        log(f"  HTTP {r.status_code} (content-type={ctype})")
        return None
    if "text/html" in ctype:
        # Likely got redirected to login, OR error page
        log(f"  got HTML instead of CSV (likely auth issue) — first 200 chars: {r.text[:200]}")
        return None

    return r.text


def save_csv(csv_text, label_id, period_from, period_to):
    """Save to statements/<labelId>_<periodFrom>_<periodTo>.csv."""
    STATEMENTS_DIR.mkdir(parents=True, exist_ok=True)
    fname = f"label{label_id}_{period_from}_to_{period_to}.csv"
    path = STATEMENTS_DIR / fname
    path.write_text(csv_text, encoding="utf-8")
    return path


# ─── Phase 3: parse CSV + upsert to Supabase ────────────────────────────────

# Map Symphonic CSV column names to symphonic_royalty_lines columns.
# Discovered from a real export; common Symphonic column headers.
# Symphonic's exact CSV headers (verified from a real export 2026-05-10).
# Mapping is permissive — alternative spellings supported in case the format
# drifts between statement periods.
COLUMN_MAP = {
    # Period / activity
    "Reporting Period": "period_code",
    "Activity Period": "period_code",
    "Period": "period_code",
    # Distributor / store
    "Digital Service Provider": "retailer",
    "DSP": "retailer",
    "Retailer": "retailer",
    "Partner": "retailer",
    "Store": "retailer",
    # Label
    "Label": "label_name",
    "Label Name": "label_name",
    # Artist
    "Release Artists": "artist_display",
    "Track Artists": "artist_display",
    "Artist": "artist_display",
    "Artist Name": "artist_display",
    # Album / release
    "Release Name": "album_title",
    "Release": "album_title",
    "Album": "album_title",
    "Album Title": "album_title",
    # Catalog / UPC / ISRC
    "Catalogue": "catalog_number",
    "Catalog #": "catalog_number",
    "Catalog Number": "catalog_number",
    "UPC Code": "upc",
    "UPC": "upc",
    "ISRC Code": "isrc",
    "ISRC": "isrc",
    # Song / mix
    "Track Title": "song",
    "Track": "song",
    "Song": "song",
    "Track Name": "song",
    "Song Title": "song",
    "Mix Version": "mix_version",
    "Mix": "mix_version",
    "Version": "mix_version",
    "Release Version": "mix_version",
    "Mix / Version": "mix_version",
    "Release Date": "release_date",
    # Geo
    "Territory": "territory",
    "Country": "territory",
    # Numeric
    "Count": "quantity",
    "Quantity": "quantity",
    "Units": "quantity",
    "Streams": "quantity",
    "Royalty ($US)": "net_amount",
    "Royalty": "net_amount",
    "Net": "net_amount",
    "Net Amount": "net_amount",
    "Earnings": "net_amount",
    "Earnings After Fees": "net_amount",
}


def parse_csv_row(row, label_id):
    """Map a CSV row (dict by header) to a symphonic_royalty_lines record."""
    rec = {"label_id": label_id, "raw": {k: v for k, v in row.items() if v}}
    for src_col, dst_col in COLUMN_MAP.items():
        if src_col in row and row[src_col] != "":
            rec[dst_col] = row[src_col]
    # Numeric coercion
    for num_col in ("quantity", "net_amount"):
        if num_col in rec:
            try:
                rec[num_col] = float(str(rec[num_col]).replace(",", "").replace("$", ""))
            except (ValueError, TypeError):
                rec.pop(num_col, None)
    # Date coercion — release_date should be YYYY-MM-DD; some formats vary
    rd = rec.get("release_date")
    if rd:
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y", "%Y"):
            try:
                rec["release_date"] = datetime.datetime.strptime(str(rd).strip(), fmt).date().isoformat()
                break
            except ValueError:
                continue
        else:
            rec.pop("release_date", None)
    return rec


def ingest_csv(csv_path, label_id, dry_run=False):
    """Parse one CSV file + upsert rows."""
    sb = get_supabase()
    if sb is None and not dry_run:
        log(f"  supabase unavailable, skipping {csv_path.name}")
        return 0, 0

    log(f"  parsing {csv_path.name}")
    text = csv_path.read_text(encoding="utf-8")
    reader = csv.DictReader(io.StringIO(text))

    records = []
    for row in reader:
        rec = parse_csv_row(row, label_id)
        if rec.get("isrc") or rec.get("song"):
            records.append(rec)

    log(f"  parsed {len(records)} usable rows")
    if dry_run or not records:
        return len(records), 0

    # Build period_code summary
    period_codes = sorted({r["period_code"] for r in records if "period_code" in r})
    for pc in period_codes:
        try:
            sb.table("symphonic_statement_periods").upsert(
                {"period_code": pc, "reporting_period": pc},
                on_conflict="period_code",
            ).execute()
        except Exception as e:
            log(f"  period upsert failed for {pc}: {e}")

    # Batch insert royalty lines (no on-conflict — let the bigserial id auto-allocate)
    batch_size = 500
    inserted = 0
    for i in range(0, len(records), batch_size):
        chunk = records[i:i + batch_size]
        try:
            sb.table("symphonic_royalty_lines").insert(chunk).execute()
            inserted += len(chunk)
        except Exception as e:
            log(f"  insert chunk {i // batch_size} failed: {e}")
    log(f"  inserted {inserted} royalty lines into symphonic_royalty_lines")
    return len(records), inserted


# ─── Orchestration ──────────────────────────────────────────────────────────

def iter_periods(period_from, period_to):
    """Yield period codes from period_from to period_to inclusive, month by
    month. Format: 'MON-YY' (e.g. 'JAN-19', 'FEB-26')."""
    def parse(pc):
        mon, yy = pc.split("-")
        return MONTH_NAMES.index(mon), int(yy)
    m, y = parse(period_from)
    end_m, end_y = parse(period_to)
    while (y, m) <= (end_y, end_m):
        yield f"{MONTH_NAMES[m]}-{y:02d}"
        m += 1
        if m >= 12:
            m = 0
            y += 1


def do_fetch(period_from, period_to, label_ids):
    """Symphonic's wide-range query returns an error page above a small
    window. Loop month-by-month instead — slower but reliable. Skips
    periods already saved on disk for idempotency."""
    csrf, cookies = get_csrf_and_cookies()
    session = build_session(cookies)
    saved = []
    periods = list(iter_periods(period_from, period_to))
    log(f"  will fetch {len(periods)} periods x {len(label_ids)} labelIds = {len(periods) * len(label_ids)} CSVs")
    for lid in label_ids:
        for period in periods:
            fname = f"label{lid}_{period}_to_{period}.csv"
            path = STATEMENTS_DIR / fname
            if path.exists() and path.stat().st_size > 200:
                log(f"  skip (exists): {fname}")
                continue
            csv_text = fetch_csv(session, csrf, period, period, lid)
            if csv_text is None:
                continue
            if len(csv_text) < 100:
                log(f"  WARN: CSV for labelId={lid} {period} is suspiciously short ({len(csv_text)} bytes)")
                continue
            saved_path = save_csv(csv_text, lid, period, period)
            log(f"  saved {saved_path.name} ({len(csv_text):,} bytes)")
            saved.append(saved_path)
    return saved


def do_ingest(label_ids, dry_run=False):
    """Walk STATEMENTS_DIR; ingest every CSV per labelId."""
    if not STATEMENTS_DIR.exists():
        log(f"no statements directory at {STATEMENTS_DIR}")
        return
    files = sorted(STATEMENTS_DIR.glob("*.csv"))
    if not files:
        log("no CSV files to ingest")
        return
    total_parsed = 0
    total_inserted = 0
    for f in files:
        # File name pattern: label<labelId>_<from>_to_<to>.csv
        lid = None
        if f.name.startswith("label"):
            try:
                lid = f.name.split("_")[0].replace("label", "")
            except Exception:
                pass
        if label_ids and lid not in label_ids:
            continue
        parsed, inserted = ingest_csv(f, lid or "unknown", dry_run=dry_run)
        total_parsed += parsed
        total_inserted += inserted
    log(f"INGEST DONE: parsed={total_parsed} inserted={total_inserted}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["fetch", "ingest", "all"], default="all")
    parser.add_argument("--label-id", action="append", default=None)
    parser.add_argument("--from", dest="period_from", default=DEFAULT_FROM)
    parser.add_argument("--to", dest="period_to", default=None)
    parser.add_argument("--period", dest="period", default=None, help="shortcut for --from X --to X")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    env_path = find_env()
    if env_path:
        load_dotenv(env_path)
        log(f"loaded env from {env_path}")

    label_ids = args.label_id or DEFAULT_LABEL_IDS
    period_from = args.period or args.period_from
    period_to = args.period or args.period_to or current_period_code()

    log(f"=== import_symphonic_statement mode={args.mode} labelIds={label_ids} period={period_from}->{period_to} dry_run={args.dry_run} ===")

    if args.mode in ("fetch", "all"):
        log("FETCH phase")
        do_fetch(period_from, period_to, label_ids)

    if args.mode in ("ingest", "all"):
        log("INGEST phase")
        do_ingest(label_ids, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
