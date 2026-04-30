"""Pre-flight environment verification for trading-shadow.

Read-only sanity check before any cutover. Validates:
  1. .env.paper and .env.live structural correctness (keys present, sane format)
  2. Anthropic API key authenticates (calls models.list())
  3. Alpaca paper key authenticates (calls get_account() on paper endpoint)
  4. Alpaca live key authenticates (calls get_account() on live endpoint)
  5. Discord webhook URL format (does NOT post — to avoid noise)

NEVER prints secret values. Only masks. Output is safe to share.

Usage (from project root):
    .\\.venv\\Scripts\\python.exe scripts\\verify_live_env.py
    .\\.venv\\Scripts\\python.exe scripts\\verify_live_env.py --paper-only
    .\\.venv\\Scripts\\python.exe scripts\\verify_live_env.py --live-only

Exit code 0 = all checks passed. Non-zero = at least one failure.
"""
from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

# ANSI colors (work in modern Windows terminals; degrade gracefully)
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
DIM = "\033[2m"
BOLD = "\033[1m"
RESET = "\033[0m"

ROOT = Path(__file__).resolve().parent.parent


def mask(value: str, prefix: int = 4, suffix: int = 4) -> str:
    if not value:
        return "(empty)"
    if len(value) <= prefix + suffix:
        return "(too-short)"
    return f"{value[:prefix]}...{value[-suffix:]} (len={len(value)})"


@dataclass
class Check:
    name: str
    passed: bool
    detail: str

    def render(self) -> str:
        icon = f"{GREEN}OK{RESET}" if self.passed else f"{RED}FAIL{RESET}"
        return f"  [{icon}] {self.name}: {self.detail}"


def parse_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    out: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def validate_anthropic_key(key: str) -> tuple[bool, str]:
    if not key:
        return False, "missing"
    if not key.startswith("sk-ant-api03-"):
        return False, f"wrong prefix (expected sk-ant-api03-, got {key[:13]!r})"
    if len(key) < 80:
        return False, f"too short (len={len(key)}, expected ~108)"
    return True, mask(key)


def validate_alpaca_key(key: str, expected_prefix: str) -> tuple[bool, str]:
    if not key:
        return False, "missing"
    if not key.startswith(expected_prefix):
        return False, f"wrong prefix (expected {expected_prefix}, got {key[:2]!r})"
    if len(key) < 20:
        return False, f"too short (len={len(key)})"
    return True, mask(key)


def validate_secret(secret: str) -> tuple[bool, str]:
    if not secret:
        return False, "missing"
    if len(secret) < 30:
        return False, f"too short (len={len(secret)})"
    return True, mask(secret)


def validate_webhook(url: str) -> tuple[bool, str]:
    if not url:
        return False, "missing"
    if not url.startswith("https://discord"):
        return False, f"wrong host (got {url[:25]!r})"
    if len(url) < 100:
        return False, f"too short (len={len(url)})"
    return True, f"https://discord.../{url[-6:]} (len={len(url)})"


def check_anthropic_auth(key: str) -> Check:
    if not key.startswith("sk-ant-api03-"):
        return Check("Anthropic API auth", False, "skipped (key invalid)")
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=key)
        models = client.models.list(limit=1)
        # Just confirms 200 response. Don't print model names — not secret but noisy.
        return Check("Anthropic API auth", True, "models.list() returned 200")
    except Exception as e:
        return Check("Anthropic API auth", False, f"{type(e).__name__}: {str(e)[:120]}")


def check_alpaca_auth(key: str, secret: str, paper: bool) -> Check:
    label = "paper" if paper else "LIVE"
    if not key or not secret:
        return Check(f"Alpaca {label} auth", False, "skipped (key or secret missing)")
    try:
        from alpaca.trading.client import TradingClient
        client = TradingClient(api_key=key, secret_key=secret, paper=paper)
        account = client.get_account()
        cash = float(account.cash)
        equity = float(account.equity)
        status = account.status
        return Check(
            f"Alpaca {label} auth",
            True,
            f"account.status={status}, cash=${cash:.2f}, equity=${equity:.2f}",
        )
    except Exception as e:
        return Check(f"Alpaca {label} auth", False, f"{type(e).__name__}: {str(e)[:120]}")


def verify_one_mode(mode: str) -> list[Check]:
    """Verify .env.{mode} file. mode in {'paper', 'live'}."""
    env_path = ROOT / f".env.{mode}"
    checks: list[Check] = []

    if not env_path.exists():
        checks.append(Check(f".env.{mode} file", False, f"missing at {env_path}"))
        return checks

    env = parse_env_file(env_path)
    checks.append(Check(f".env.{mode} file", True, f"{len(env)} key(s) found at {env_path.name}"))

    # MODE
    if env.get("MODE") != mode:
        checks.append(Check(f"MODE={mode}", False, f"got MODE={env.get('MODE')!r}"))
    else:
        checks.append(Check(f"MODE={mode}", True, "ok"))

    # Anthropic key
    ok, detail = validate_anthropic_key(env.get("ANTHROPIC_API_KEY", ""))
    checks.append(Check("ANTHROPIC_API_KEY format", ok, detail))

    if mode == "paper":
        # Paper Alpaca keys required
        ok, detail = validate_alpaca_key(env.get("ALPACA_PAPER_API_KEY", ""), "PK")
        checks.append(Check("ALPACA_PAPER_API_KEY format", ok, detail))
        ok, detail = validate_secret(env.get("ALPACA_PAPER_API_SECRET", ""))
        checks.append(Check("ALPACA_PAPER_API_SECRET format", ok, detail))
    else:
        # Live Alpaca keys required
        ok, detail = validate_alpaca_key(env.get("ALPACA_LIVE_API_KEY", ""), "AK")
        checks.append(Check("ALPACA_LIVE_API_KEY format", ok, detail))
        ok, detail = validate_secret(env.get("ALPACA_LIVE_API_SECRET", ""))
        checks.append(Check("ALPACA_LIVE_API_SECRET format", ok, detail))

    # Discord webhook
    ok, detail = validate_webhook(env.get("DISCORD_WEBHOOK_URL", ""))
    checks.append(Check("DISCORD_WEBHOOK_URL format", ok, detail))

    # Network checks (only if format passed)
    anthropic_key = env.get("ANTHROPIC_API_KEY", "")
    if anthropic_key.startswith("sk-ant-api03-"):
        checks.append(check_anthropic_auth(anthropic_key))
    else:
        checks.append(Check("Anthropic API auth", False, "skipped (key format failed above)"))

    if mode == "paper":
        checks.append(check_alpaca_auth(
            env.get("ALPACA_PAPER_API_KEY", ""),
            env.get("ALPACA_PAPER_API_SECRET", ""),
            paper=True,
        ))
    else:
        checks.append(check_alpaca_auth(
            env.get("ALPACA_LIVE_API_KEY", ""),
            env.get("ALPACA_LIVE_API_SECRET", ""),
            paper=False,
        ))

    return checks


def main() -> int:
    parser = argparse.ArgumentParser(description="Pre-flight env verification for trading-shadow.")
    parser.add_argument("--paper-only", action="store_true", help="Only check .env.paper")
    parser.add_argument("--live-only", action="store_true", help="Only check .env.live")
    args = parser.parse_args()

    if args.paper_only and args.live_only:
        print("Pick one of --paper-only or --live-only, not both.", file=sys.stderr)
        return 2

    modes = []
    if args.paper_only:
        modes = ["paper"]
    elif args.live_only:
        modes = ["live"]
    else:
        modes = ["paper", "live"]

    print(f"\n{BOLD}Trading Shadow — Pre-flight Env Verify{RESET}")
    print(f"{DIM}Project root: {ROOT}{RESET}\n")

    overall_pass = True
    for mode in modes:
        print(f"{BOLD}{mode.upper()} mode ({mode}.env){RESET}")
        checks = verify_one_mode(mode)
        for c in checks:
            print(c.render())
            if not c.passed:
                overall_pass = False
        print()

    if overall_pass:
        print(f"{GREEN}{BOLD}All checks passed.{RESET} You can run paper or go live (per mode checked).")
        return 0
    else:
        print(f"{RED}{BOLD}One or more checks failed.{RESET} Fix the items above before running the loop.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
