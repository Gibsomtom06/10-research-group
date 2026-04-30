import json
from pathlib import Path
from datetime import datetime, timedelta

WATCHED_PATHS = [
    "C:/Users/Slash/Desktop",
    "C:/Users/Slash/Downloads",
    "C:/Users/Slash/Documents",
    "C:/Users/Slash/OneDrive",
]

LARGE_FILE_THRESHOLD_MB = 100
OLD_FILE_DAYS = 365
TRASH_EXTENSIONS = {".tmp", ".bak", ".old", ".cache"}


def scan_drives():
    results = {
        "timestamp": datetime.now().isoformat(),
        "large_files": [],
        "old_files": [],
        "trash_files": [],
        "summary": {},
    }

    cutoff = datetime.now() - timedelta(days=OLD_FILE_DAYS)
    threshold_bytes = LARGE_FILE_THRESHOLD_MB * 1024 * 1024

    for watched in WATCHED_PATHS:
        path = Path(watched)
        if not path.exists():
            continue

        file_count = 0
        total_size = 0

        for item in path.rglob("*"):
            if not item.is_file():
                continue
            try:
                stat = item.stat()
                size = stat.st_size
                mtime = datetime.fromtimestamp(stat.st_mtime)
                file_count += 1
                total_size += size

                if size > threshold_bytes:
                    results["large_files"].append(
                        {"path": str(item), "size_mb": round(size / 1024 / 1024, 1)}
                    )

                if mtime < cutoff:
                    results["old_files"].append(
                        {"path": str(item), "last_modified": mtime.isoformat()}
                    )

                if item.suffix.lower() in TRASH_EXTENSIONS or item.name.endswith("~"):
                    results["trash_files"].append(str(item))

            except (PermissionError, OSError):
                continue

        results["summary"][watched] = {
            "files": file_count,
            "total_size_mb": round(total_size / 1024 / 1024, 1),
        }

    return results


if __name__ == "__main__":
    print(json.dumps(scan_drives(), indent=2))
