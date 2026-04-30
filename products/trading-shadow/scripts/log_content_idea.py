"""Append a content idea to data/content_ideas.jsonl.

Two ways to use:

  1. CLI quick-capture (one arg = what happened):
       python scripts/log_content_idea.py "Shipped rollback handler with 13 TDD tests"

  2. Multi-arg explicit:
       python scripts/log_content_idea.py \\
           --what "Friday cutover slipped to graduation gate" \\
           --why "calendar-driven cutovers are the wrong gate" \\
           --format linkedin-long \\
           --tags agent-architecture,shipping-discipline \\
           --source "claude session 2026-04-30"

Either form appends a row to data/content_ideas.jsonl with status=pending.
Weekly review picks up pending rows and flips them to pursued/killed/archived.

Designed so Claude can call this during a session ("hey, this moment is
content-worthy, log it") OR Thomas can call it manually for ambient capture.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "content_ideas.jsonl"


def parse_tags(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [t.strip() for t in raw.split(",") if t.strip()]


def append_idea(*, what: str, why: str = "", suggested_format: str = "",
                tags: list[str] | None = None, source: str = "manual") -> dict:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    LOG_PATH.touch(exist_ok=True)
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "what_happened": what,
        "why_content_worthy": why or "(left blank — fill on review)",
        "suggested_format": suggested_format or "(undecided)",
        "topic_tags": tags or [],
        "status": "pending",
        "reviewed": False,
    }
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Log a content idea to data/content_ideas.jsonl",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "what",
        nargs="?",
        help="Quick-capture form: just describe what happened. "
             "If omitted, use the --what flag with the other --... flags.",
    )
    parser.add_argument("--what", dest="what_flag", help="What happened (overrides positional)")
    parser.add_argument("--why", default="", help="Why is it content-worthy?")
    parser.add_argument("--format", dest="fmt", default="",
                        help="Suggested format (linkedin-long, twitter-thread, "
                             "youtube-short, blog-post, video-essay, ...)")
    parser.add_argument("--tags", default="",
                        help="Comma-separated topic tags "
                             "(adhd-orchestration, agent-architecture, capitulate-cultivate, ...)")
    parser.add_argument("--source", default="manual",
                        help="Where the moment happened (default: manual)")
    args = parser.parse_args()

    what = args.what_flag or args.what
    if not what:
        parser.error("Need a 'what' description (positional or --what)")

    entry = append_idea(
        what=what,
        why=args.why,
        suggested_format=args.fmt,
        tags=parse_tags(args.tags),
        source=args.source,
    )

    print(f"Logged content idea -> {LOG_PATH.relative_to(LOG_PATH.parent.parent)}")
    print(f"  {entry['timestamp']}")
    print(f"  {entry['what_happened'][:100]}")
    if entry['topic_tags']:
        print(f"  tags: {', '.join(entry['topic_tags'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
