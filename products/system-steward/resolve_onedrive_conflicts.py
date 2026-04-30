import json
import shutil
from pathlib import Path

from map_onedrive import map_onedrive, CONFLICT_PATTERNS

CONFLICT_ARCHIVE = Path("C:/Users/Slash/system_steward/conflict_archive")


def resolve_onedrive_conflicts(dry_run=False):
    report = map_onedrive()
    resolved = []
    errors = []

    if "error" in report:
        return report

    for conflict in report.get("conflicts", []):
        conflict_path = Path(conflict["path"])
        if not conflict_path.exists():
            continue

        parent = conflict_path.parent
        base_name = conflict_path.name
        for pattern in CONFLICT_PATTERNS:
            base_name = pattern.sub("", base_name).strip()

        original = parent / base_name

        try:
            if original.exists() and original != conflict_path:
                orig_mtime = original.stat().st_mtime
                conf_mtime = conflict_path.stat().st_mtime
                newer_is_conflict = conf_mtime > orig_mtime

                to_archive = original if newer_is_conflict else conflict_path

                if not dry_run:
                    CONFLICT_ARCHIVE.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(to_archive), str(CONFLICT_ARCHIVE / to_archive.name))
                    if newer_is_conflict:
                        conflict_path.rename(original)

                resolved.append({
                    "conflict": str(conflict_path),
                    "original": str(original),
                    "archived": str(to_archive),
                    "kept_newer": newer_is_conflict,
                })
            else:
                # Orphaned conflict — archive it
                if not dry_run:
                    CONFLICT_ARCHIVE.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(conflict_path), str(CONFLICT_ARCHIVE / conflict_path.name))
                resolved.append({"archived_orphan": str(conflict_path)})

        except (PermissionError, OSError) as e:
            errors.append({"file": str(conflict_path), "error": str(e)})

    return {"resolved": resolved, "errors": errors, "dry_run": dry_run}


if __name__ == "__main__":
    print(json.dumps(resolve_onedrive_conflicts(dry_run=False), indent=2))
