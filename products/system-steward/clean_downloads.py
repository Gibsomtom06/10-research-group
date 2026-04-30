import json
import shutil
from pathlib import Path
from datetime import datetime

DOWNLOADS_PATH = Path("C:/Users/Slash/Downloads")

CATEGORIES = {
    "Archives":   {".zip", ".tar", ".gz", ".7z", ".rar", ".bz2", ".xz"},
    "Installers": {".exe", ".msi", ".pkg", ".dmg", ".deb", ".rpm", ".appimage"},
    "Media":      {".mp4", ".mp3", ".avi", ".mkv", ".mov", ".jpg", ".jpeg",
                   ".png", ".gif", ".wav", ".flac", ".webm", ".heic"},
    "Documents":  {".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt",
                   ".txt", ".csv", ".odt", ".ods"},
    "Code":       {".py", ".js", ".ts", ".json", ".yaml", ".yml", ".sh",
                   ".bat", ".ps1", ".ipynb"},
    "Trash":      {".tmp", ".bak", ".old", ".cache", ".crdownload", ".part"},
}


def clean_downloads(dry_run=False):
    moved = []
    errors = []

    if not DOWNLOADS_PATH.exists():
        return {"error": "Downloads path not found"}

    for item in DOWNLOADS_PATH.iterdir():
        if item.is_dir() and item.name in CATEGORIES:
            continue
        if not item.is_file():
            continue

        suffix = item.suffix.lower()
        target_category = next(
            (cat for cat, exts in CATEGORIES.items() if suffix in exts), None
        )
        if not target_category:
            continue

        dest_dir = DOWNLOADS_PATH / target_category
        if not dry_run:
            dest_dir.mkdir(exist_ok=True)

        dest = dest_dir / item.name
        if dest.exists():
            dest = dest_dir / f"{item.stem}_{int(datetime.now().timestamp())}{item.suffix}"

        try:
            if not dry_run:
                shutil.move(str(item), str(dest))
            moved.append({"from": str(item), "to": str(dest), "category": target_category})
        except (PermissionError, OSError) as e:
            errors.append({"file": str(item), "error": str(e)})

    return {"moved": moved, "errors": errors, "dry_run": dry_run}


if __name__ == "__main__":
    print(json.dumps(clean_downloads(dry_run=False), indent=2))
