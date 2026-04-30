import os
import hashlib
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

WATCHED_PATHS = [
    "C:/Users/Slash/Desktop",
    "C:/Users/Slash/Downloads",
    "C:/Users/Slash/Documents",
    "C:/Users/Slash/OneDrive",
]


def hash_file(path, chunk_size=65536):
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            while chunk := f.read(chunk_size):
                h.update(chunk)
        return h.hexdigest()
    except (PermissionError, OSError):
        return None


def dedupe_files(auto_remove=False):
    hashes = defaultdict(list)

    for watched in WATCHED_PATHS:
        path = Path(watched)
        if not path.exists():
            continue
        for item in path.rglob("*"):
            if not item.is_file():
                continue
            digest = hash_file(item)
            if digest:
                hashes[digest].append(str(item))

    duplicates = {h: paths for h, paths in hashes.items() if len(paths) > 1}
    removed = []
    errors = []

    if auto_remove:
        for paths in duplicates.values():
            for dupe in paths[1:]:
                try:
                    os.remove(dupe)
                    removed.append(dupe)
                except (PermissionError, OSError) as e:
                    errors.append({"file": dupe, "error": str(e)})

    return {
        "timestamp": datetime.now().isoformat(),
        "duplicate_groups": len(duplicates),
        "duplicates": duplicates,
        "removed": removed,
        "errors": errors,
        "auto_remove": auto_remove,
    }


if __name__ == "__main__":
    print(json.dumps(dedupe_files(auto_remove=False), indent=2))
