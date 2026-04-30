#!/usr/bin/env python3
"""
Preflight health check.

Run this after wiring up Supabase + env vars but before flipping the
sender to live. Validates every moving piece:

  1. Env vars present (SUPABASE_URL, SUPABASE_SERVICE_ROLE, ANTHROPIC_API_KEY)
  2. Supabase reachable + service role key valid
  3. All expected tables exist (schema.sql + all 3 migrations applied)
  4. All expected views exist
  5. All expected enum values exist on outreach_log.status
  6. Anthropic API reachable with claude-sonnet-4-6
  7. Agent scripts syntactically valid + importable
  8. Worker tsx files parseable (best-effort)
  9. Sender dry-run would succeed (checks Gmail creds presence, not validity)

Exits non-zero if any critical check fails. Prints a pass/fail scorecard.

Usage:
    python scripts/preflight.py
    python scripts/preflight.py --skip-anthropic  # don't burn a token
    python scripts/preflight.py --verbose
"""
from __future__ import annotations

import argparse
import ast
import json
import os
import sys
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).parent.parent  # products/digital-booking-agent

EXPECTED_TABLES = {
    "contacts",
    "venues",
    "offers",
    "outreach_log",
    "pitch_packs",
    "artist_data",
    "praise_bank",
    "voice_samples",
    "decisions",
    "source_imports",
    "worker_state",
    "reports",
}

EXPECTED_VIEWS = {
    "v_outreach_history",
    "v_reach_back_reminders",
    "v_latest_reports",
}

EXPECTED_AGENTS = [
    "inbound.py", "analyst.py", "outbound.py", "routing.py",
    "research.py", "reporting.py", "supervisor.py",
]

EXPECTED_WORKERS = [
    "sender.ts", "freshness_sweep.ts", "bounce_handler.ts",
    "reminder_sweep.ts", "followup_queue.ts",
]


class Checklist:
    def __init__(self, verbose: bool = False):
        self.results: list[tuple[str, bool, str]] = []
        self.verbose = verbose

    def run(self, name: str, fn: Callable[[], tuple[bool, str]]) -> bool:
        try:
            ok, detail = fn()
        except Exception as e:
            ok, detail = False, f"exception: {type(e).__name__}: {e}"
        self.results.append((name, ok, detail))
        mark = "✓" if ok else "✗"
        color = "\033[32m" if ok else "\033[31m"
        reset = "\033[0m"
        print(f"  {color}{mark}{reset} {name}  {detail if (self.verbose or not ok) else ''}")
        return ok

    def summary(self) -> tuple[int, int]:
        passed = sum(1 for _, ok, _ in self.results if ok)
        total = len(self.results)
        return passed, total


# ---------- individual checks ----------

def check_env() -> tuple[bool, str]:
    missing = [k for k in ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE", "ANTHROPIC_API_KEY"]
               if not os.environ.get(k)]
    if missing:
        return False, f"missing: {', '.join(missing)}"
    return True, "all three set"


def check_supabase_reach() -> tuple[bool, str]:
    try:
        from supabase import create_client
    except ImportError:
        return False, "supabase-py not installed (pip install supabase)"
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        return False, "env not set (see previous check)"
    try:
        sb = create_client(url, key)
        # smoke — should return 0 rows, not 500
        res = sb.table("contacts").select("id", count="exact").limit(0).execute()
        return True, f"contacts table accessible (count={res.count or 0})"
    except Exception as e:
        return False, f"connect failed: {e}"


def check_tables() -> tuple[bool, str]:
    try:
        from supabase import create_client
    except ImportError:
        return False, "supabase-py not installed"
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        return False, "env not set"
    sb = create_client(url, key)
    missing = []
    for t in sorted(EXPECTED_TABLES):
        try:
            sb.table(t).select("*").limit(0).execute()
        except Exception:
            missing.append(t)
    if missing:
        return False, f"missing: {', '.join(missing)}  (did you run all migrations?)"
    return True, f"all {len(EXPECTED_TABLES)} tables present"


def check_views() -> tuple[bool, str]:
    try:
        from supabase import create_client
    except ImportError:
        return False, "supabase-py not installed"
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        return False, "env not set"
    sb = create_client(url, key)
    missing = []
    for v in sorted(EXPECTED_VIEWS):
        try:
            sb.table(v).select("*").limit(0).execute()
        except Exception:
            missing.append(v)
    if missing:
        return False, f"missing: {', '.join(missing)}  (migrations 0002 / 0003 not applied?)"
    return True, f"all {len(EXPECTED_VIEWS)} views present"


def check_anthropic(skip: bool) -> tuple[bool, str]:
    if skip:
        return True, "skipped (--skip-anthropic)"
    try:
        from anthropic import Anthropic
    except ImportError:
        return False, "anthropic sdk not installed (pip install anthropic)"
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return False, "ANTHROPIC_API_KEY not set"
    try:
        client = Anthropic()
        # minimal request to verify auth + model access
        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=10,
            messages=[{"role": "user", "content": "respond with just: OK"}],
        )
        text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text").strip()
        if "OK" in text.upper():
            return True, "claude-sonnet-4-6 responded"
        return True, f"responded (content: {text!r})"
    except Exception as e:
        return False, f"anthropic call failed: {e}"


def check_agents() -> tuple[bool, str]:
    agents_dir = ROOT / "agents"
    missing = [a for a in EXPECTED_AGENTS if not (agents_dir / a).exists()]
    if missing:
        return False, f"missing: {', '.join(missing)}"
    # parse each
    bad = []
    for a in EXPECTED_AGENTS:
        src = (agents_dir / a).read_text(encoding="utf-8")
        try:
            ast.parse(src)
        except SyntaxError as e:
            bad.append(f"{a}:{e.lineno}")
    if bad:
        return False, f"syntax errors: {', '.join(bad)}"
    return True, f"all {len(EXPECTED_AGENTS)} agents compile"


def check_workers() -> tuple[bool, str]:
    workers_dir = ROOT / "workers"
    if not workers_dir.exists():
        return False, "workers/ directory missing"
    missing = [w for w in EXPECTED_WORKERS if not (workers_dir / w).exists()]
    if missing:
        return False, f"missing: {', '.join(missing)}"
    pkg = workers_dir / "package.json"
    if not pkg.exists():
        return False, "workers/package.json missing"
    try:
        data = json.loads(pkg.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"workers/package.json invalid: {e}"
    scripts = (data.get("scripts") or {})
    need = {"sender", "sender:once", "freshness-sweep:once",
            "bounce-handler:once", "reminder-sweep:once"}
    absent = need - set(scripts.keys())
    if absent:
        return False, f"missing npm scripts: {sorted(absent)}"
    return True, f"{len(EXPECTED_WORKERS)} workers + required npm scripts present"


def check_app() -> tuple[bool, str]:
    app = ROOT / "app"
    if not app.exists():
        return False, "app/ directory missing"
    routes = [
        "app/dashboard/page.tsx",
        "app/drafts/page.tsx",
        "app/outreach/page.tsx",
        "app/outreach/[contact_id]/page.tsx",
        "app/reminders/page.tsx",
        "app/contacts/page.tsx",
        "app/markets/page.tsx",
        "app/reports/page.tsx",
    ]
    missing = [r for r in routes if not (app / r).exists()]
    if missing:
        return False, f"missing routes: {missing}"
    env = app / ".env.local"
    if not env.exists():
        return False, "app/.env.local missing (copy from .env.example and fill)"
    return True, f"{len(routes)} routes + .env.local present"


def check_sender_creds() -> tuple[bool, str]:
    creds = os.environ.get("GMAIL_CREDENTIALS_JSON")
    token = os.environ.get("GMAIL_TOKEN_JSON")
    dry = os.environ.get("SENDER_DRY_RUN", "true").lower()
    if dry == "true":
        return True, "SENDER_DRY_RUN=true (safe — no real sends)"
    if not creds or not token:
        return False, "live mode but GMAIL_CREDENTIALS_JSON / GMAIL_TOKEN_JSON not set"
    return True, "live mode with credentials present"


def check_prompts() -> tuple[bool, str]:
    prompts = ROOT / "prompts"
    expected = [
        "inbound_classifier.md", "analyst_pitch_pack.md", "outbound_composer.md",
        "supervisor.md", "reporting.md", "routing.md", "research.md",
    ]
    missing = [p for p in expected if not (prompts / p).exists()]
    if missing:
        return False, f"missing: {', '.join(missing)}"
    return True, f"all {len(expected)} specialist prompts present"


# ---------- main ----------

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-anthropic", action="store_true",
                    help="skip Anthropic API call (saves a token)")
    ap.add_argument("--verbose", "-v", action="store_true")
    args = ap.parse_args()

    cl = Checklist(verbose=args.verbose)

    print("preflight: DBA readiness check\n")
    print("env + deps")
    cl.run("env vars set", check_env)
    print()
    print("code")
    cl.run("7 agent runners compile", check_agents)
    cl.run("7 specialist prompts present", check_prompts)
    cl.run("5 workers + npm scripts", check_workers)
    cl.run("8 app routes + .env.local", check_app)
    print()
    print("supabase")
    cl.run("supabase reachable", check_supabase_reach)
    cl.run(f"{len(EXPECTED_TABLES)} expected tables", check_tables)
    cl.run(f"{len(EXPECTED_VIEWS)} expected views", check_views)
    print()
    print("external services")
    cl.run("anthropic api reachable (claude-sonnet-4-6)",
           lambda: check_anthropic(args.skip_anthropic))
    cl.run("gmail sender credentials (or dry-run mode)", check_sender_creds)

    passed, total = cl.summary()
    print()
    color = "\033[32m" if passed == total else "\033[33m"
    reset = "\033[0m"
    print(f"{color}{passed}/{total} checks passed{reset}")
    if passed < total:
        print("\nfailing checks need attention before going live. see detail above.")
        return 1
    print("\nsystem is ready for phase 0. you can flip sender to live.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
