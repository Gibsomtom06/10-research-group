"""
smart_dedupe.py — Thomas-rules dedupe scan.

Rules per Thomas (2026-05-04):
- Don't touch festival footage (.insv, .lrv, paths containing "lost lands",
  "360 VIDEOS", "festival")
- Don't touch music files (.wav, .mp3, .flac, .m4a, .aiff, .aif)
- Don't touch files untouched 1+ year ago
- Do find duplicates and migrate (not delete)

This script is READ-ONLY. It groups files by (lowercased_name, size) — fast,
no content hashing, doesn't trigger OneDrive Files-On-Demand downloads.

Output is a JSON report with:
- duplicate_groups: groups of 2+ files sharing the same name + size
- total_recoverable_mb: bytes that could be freed by keeping one of each group
- top_groups: largest groups for manual review
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict


WATCHED_PATHS = [
    "C:/Users/Slash/Desktop",
    "C:/Users/Slash/Downloads",
    "C:/Users/Slash/Documents",
    "C:/Users/Slash/OneDrive",
]

# Skip rules per Thomas
SKIP_EXTENSIONS = {
    # festival footage
    ".insv", ".lrv",
    # music
    ".wav", ".mp3", ".flac", ".m4a", ".aiff", ".aif", ".alac",
}
SKIP_PATH_FRAGMENTS = [
    "lost lands",
    "360 videos",
    "/festival",
    "\\festival",
]
OLD_FILE_DAYS = 365


def should_skip(path: Path, mtime: datetime, now: datetime) -> bool:
    if path.suffix.lower() in SKIP_EXTENSIONS:
        return True
    p_lower = str(path).lower()
    if any(frag in p_lower for frag in SKIP_PATH_FRAGMENTS):
        return True
    if (now - mtime) > timedelta(days=OLD_FILE_DAYS):
        return True
    return False


def smart_dedupe():
    now = datetime.now()
    by_key = defaultdict(list)
    scanned = 0
    skipped = 0

    for watched in WATCHED_PATHS:
        path = Path(watched)
        if not path.exists():
            continue
        for item in path.rglob("*"):
            if not item.is_file():
                continue
            try:
                stat = item.stat()
            except (PermissionError, OSError):
                continue
            mtime = datetime.fromtimestamp(stat.st_mtime)

            if should_skip(item, mtime, now):
                skipped += 1
                continue

            scanned += 1
            key = (item.name.lower(), stat.st_size)
            by_key[key].append({
                "path": str(item),
                "size": stat.st_size,
                "mtime": mtime.isoformat(),
            })

    duplicate_groups = {
        f"{name}|{size}": files
        for (name, size), files in by_key.items()
        if len(files) > 1 and size > 0  # ignore zero-byte coincidences
    }

    # Recoverable = total size of all duplicates minus one keeper per group
    recoverable_bytes = 0
    for files in duplicate_groups.values():
        size = files[0]["size"]
        recoverable_bytes += size * (len(files) - 1)

    top = sorted(
        ({"key": k, "count": len(v), "size_mb": round(v[0]["size"]/1024/1024, 2),
          "wasted_mb": round(v[0]["size"]/1024/1024 * (len(v)-1), 2),
          "files": v}
         for k, v in duplicate_groups.items()),
        key=lambda g: -g["wasted_mb"],
    )[:50]

    return {
        "timestamp": now.isoformat(),
        "scanned_files": scanned,
        "skipped_files": skipped,
        "duplicate_groups": len(duplicate_groups),
        "total_recoverable_mb": round(recoverable_bytes / 1024 / 1024, 1),
        "total_recoverable_gb": round(recoverable_bytes / 1024 / 1024 / 1024, 2),
        "top_50_groups": top,
        "rules": {
            "skip_extensions": sorted(SKIP_EXTENSIONS),
            "skip_path_fragments": SKIP_PATH_FRAGMENTS,
            "skip_older_than_days": OLD_FILE_DAYS,
        },
    }


if __name__ == "__main__":
    out = smart_dedupe()
    json.dump(out, sys.stdout, indent=2)
