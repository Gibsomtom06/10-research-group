"""
smart_dedupe_full.py — same rules as smart_dedupe, but exports ALL
duplicate groups (not just top 50) so we can plan the next cleanup pass.
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

SKIP_EXTENSIONS = {
    ".insv", ".lrv",
    ".wav", ".mp3", ".flac", ".m4a", ".aiff", ".aif", ".alac",
}
SKIP_PATH_FRAGMENTS = ["lost lands", "360 videos", "/festival", "\\festival"]
OLD_FILE_DAYS = 365


def main():
    now = datetime.now()
    by_key = defaultdict(list)
    cutoff = now - timedelta(days=OLD_FILE_DAYS)

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
            if mtime < cutoff:
                continue
            if item.suffix.lower() in SKIP_EXTENSIONS:
                continue
            p_lower = str(item).lower()
            if any(frag in p_lower for frag in SKIP_PATH_FRAGMENTS):
                continue
            key = (item.name.lower(), stat.st_size)
            by_key[key].append(str(item))

    groups = [
        {
            "name": k[0],
            "size": k[1],
            "size_mb": round(k[1] / 1024 / 1024, 2),
            "count": len(v),
            "wasted_mb": round(k[1] / 1024 / 1024 * (len(v) - 1), 2),
            "files": v,
        }
        for k, v in by_key.items()
        if len(v) > 1 and k[1] > 0
    ]
    groups.sort(key=lambda g: -g["wasted_mb"])

    total_wasted_mb = sum(g["wasted_mb"] for g in groups)

    out = {
        "timestamp": now.isoformat(),
        "total_groups": len(groups),
        "total_wasted_mb": round(total_wasted_mb, 1),
        "total_wasted_gb": round(total_wasted_mb / 1024, 2),
        "groups": groups,
    }
    json.dump(out, sys.stdout)


if __name__ == "__main__":
    main()
