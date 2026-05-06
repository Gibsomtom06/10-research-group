#!/usr/bin/env python3
"""
Discord notifier for DBA agents.

Posts to DISCORD_WEBHOOK_URL when meaningful events fire from outbound, supervisor,
or worker code. Fail-soft: notifier errors never propagate to caller (these are
notifications, not critical path).

Severity colors match the platform's `/api/discord/notify` route conventions:
    info     -> violet  (0x6E5BFF)
    done     -> green   (0x22c55e)
    alert    -> red     (0xef4444)
    approval -> amber   (0xf59e0b)

Env:
    DISCORD_WEBHOOK_URL   (required for live posts; absent = silent no-op)
    DBA_NOTIFIER_DISABLED (any truthy value = silence everything; useful in tests)
    DBA_NOTIFIER_PREFIX   (optional string prepended to every title; default "[DBA]")

Usage:
    from agents.notifier import notify

    notify(
        type="done",
        title="outbound draft queued",
        message="contact=Andrew@AB capacity=900 city=Denver",
        link="https://tenx10.co/dashboard/deals/<uuid>",
    )
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Iterable

_COLORS = {
    "info": 0x6E5BFF,
    "done": 0x22C55E,
    "alert": 0xEF4444,
    "approval": 0xF59E0B,
}

_DEFAULT_PREFIX = "[DBA]"


def _disabled() -> bool:
    flag = os.environ.get("DBA_NOTIFIER_DISABLED", "").strip().lower()
    return flag in {"1", "true", "yes", "on"}


def _webhook() -> str | None:
    url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    return url or None


def notify(
    *,
    type: str = "info",
    title: str,
    message: str = "",
    link: str | None = None,
    fields: Iterable[tuple[str, str]] | None = None,
) -> bool:
    """Post one Discord embed. Returns True on 2xx, False otherwise (incl. silent no-op).

    Never raises — caller can ignore the return value safely.
    """
    if _disabled() or _webhook() is None:
        return False

    color = _COLORS.get(type, _COLORS["info"])
    prefix = os.environ.get("DBA_NOTIFIER_PREFIX", _DEFAULT_PREFIX).strip()
    full_title = f"{prefix} {title}".strip() if prefix else title

    embed: dict = {
        "title": full_title[:256],
        "description": (message or "")[:4000],
        "color": color,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "footer": {"text": f"dba · {type}"},
    }

    if link:
        embed["url"] = link

    if fields:
        embed["fields"] = [
            {"name": str(name)[:256], "value": str(value)[:1024], "inline": True}
            for name, value in fields
        ][:25]

    payload = json.dumps({"embeds": [embed]}).encode("utf-8")
    req = urllib.request.Request(
        _webhook(),
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return 200 <= resp.status < 300
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
        print(f"[notifier] discord post failed (non-fatal): {exc}", file=sys.stderr)
        return False


def notify_safe(**kwargs) -> bool:
    """Alias for `notify` that swallows all exceptions (defense-in-depth)."""
    try:
        return notify(**kwargs)
    except Exception as exc:
        print(f"[notifier] unexpected error (swallowed): {exc}", file=sys.stderr)
        return False


if __name__ == "__main__":
    ok = notify(
        type="info",
        title="notifier self-test",
        message="if you see this in Discord, the DBA notifier wiring is live.",
        fields=[
            ("env", os.environ.get("DBA_ENV", "unknown")),
            ("python", f"{sys.version_info.major}.{sys.version_info.minor}"),
        ],
    )
    print("posted" if ok else "skipped (disabled or no webhook)")
