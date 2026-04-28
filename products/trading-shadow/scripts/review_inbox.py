"""Walk through unreviewed ideas-inbox entries.

Usage:
    uv run python scripts/review_inbox.py            # show all unreviewed
    uv run python scripts/review_inbox.py --mark-reviewed  # mark all as reviewed after display
"""
import json
import sys
from pathlib import Path

QUEUE_PATH = Path("data/ideas_inbox.jsonl")


def load_queue() -> list[dict]:
    if not QUEUE_PATH.exists():
        return []
    return [json.loads(line) for line in QUEUE_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]


def save_queue(entries: list[dict]) -> None:
    with QUEUE_PATH.open("w", encoding="utf-8") as f:
        for e in entries:
            f.write(json.dumps(e) + "\n")


def main():
    mark_reviewed = "--mark-reviewed" in sys.argv

    entries = load_queue()
    unreviewed = [e for e in entries if not e.get("reviewed")]

    if not unreviewed:
        print("✅ Inbox empty. No unreviewed ideas.")
        return

    print(f"📥 {len(unreviewed)} unreviewed entries:\n")
    for i, e in enumerate(unreviewed, 1):
        ts = e.get("timestamp", "?")
        author = e.get("author", "?")
        text = e.get("text", "")
        attachments = e.get("attachment_urls", [])
        print(f"--- {i}. {ts} ({author}) ---")
        print(text or "(no text)")
        if attachments:
            print(f"  📎 {len(attachments)} attachment(s):")
            for url in attachments:
                print(f"    {url}")
        print()

    if mark_reviewed:
        for e in entries:
            if not e.get("reviewed"):
                e["reviewed"] = True
        save_queue(entries)
        print(f"\n✅ Marked all {len(unreviewed)} as reviewed.")


if __name__ == "__main__":
    main()
