import re
import json
from pathlib import Path
from datetime import datetime

ONEDRIVE_PATH = Path("C:/Users/Slash/OneDrive")

CONFLICT_PATTERNS = [
    re.compile(r"-\w+\s+\d{4}-\d{2}-\d{2}"),
    re.compile(r"\(conflicted copy", re.IGNORECASE),
    re.compile(r"\.conflict$", re.IGNORECASE),
]

DUPE_PATTERNS = [
    re.compile(r"\s\(\d+\)(\.[^.]+)?$"),
    re.compile(r"\s-\s(Copy|copy)\s*(\(\d+\))?"),
]


def map_onedrive():
    result = {
        "timestamp": datetime.now().isoformat(),
        "conflicts": [],
        "duplicates": [],
        "total_files": 0,
        "total_size_mb": 0.0,
    }

    if not ONEDRIVE_PATH.exists():
        return {"error": "OneDrive path not found"}

    for item in ONEDRIVE_PATH.rglob("*"):
        if not item.is_file():
            continue
        try:
            stat = item.stat()
            result["total_files"] += 1
            result["total_size_mb"] += stat.st_size / 1024 / 1024

            name = item.name

            if any(p.search(name) for p in CONFLICT_PATTERNS):
                result["conflicts"].append({
                    "path": str(item),
                    "size_mb": round(stat.st_size / 1024 / 1024, 2),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                })
            elif any(p.search(name) for p in DUPE_PATTERNS):
                result["duplicates"].append({
                    "path": str(item),
                    "size_mb": round(stat.st_size / 1024 / 1024, 2),
                })

        except (PermissionError, OSError):
            continue

    result["total_size_mb"] = round(result["total_size_mb"], 1)
    return result


if __name__ == "__main__":
    print(json.dumps(map_onedrive(), indent=2))
