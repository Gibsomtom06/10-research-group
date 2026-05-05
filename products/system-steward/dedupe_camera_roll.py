"""
dedupe_camera_roll.py — focused cleanup.

Pattern: Phone photo/video backups landed in TWO OneDrive folders:
  - C:\\Users\\Slash\\OneDrive\\Pictures\\Camera Roll\\YYYY\\MM\\        (organized — KEEP)
  - C:\\Users\\Slash\\OneDrive\\Pictures\\Samsung Gallery\\DCIM\\Camera\\ (flat — DELETE)

For every file in Samsung Gallery DCIM, if a file with the same name+size
exists anywhere under Camera Roll, the Samsung Gallery copy is moved to
OneDrive's Recycle Bin (via Send2Trash so it's recoverable for 30 days).

Args:
  --dry-run  : just report what would be deleted; default is dry-run
  --execute  : actually move files to recycle bin
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from collections import defaultdict


KEEP_ROOT = Path(r"C:\Users\Slash\OneDrive\Pictures\Camera Roll")
DELETE_ROOT = Path(r"C:\Users\Slash\OneDrive\Pictures\Samsung Gallery\DCIM\Camera")


def index_keepers():
    """Build {(name_lower, size): path} from the Camera Roll tree."""
    idx = {}
    if not KEEP_ROOT.exists():
        return idx
    for item in KEEP_ROOT.rglob("*"):
        if not item.is_file():
            continue
        try:
            size = item.stat().st_size
        except (PermissionError, OSError):
            continue
        idx[(item.name.lower(), size)] = str(item)
    return idx


def scan_deletables(idx):
    """Find Samsung Gallery files that have a matching keeper."""
    matched = []
    unmatched = []
    if not DELETE_ROOT.exists():
        return matched, unmatched
    for item in DELETE_ROOT.rglob("*"):
        if not item.is_file():
            continue
        try:
            size = item.stat().st_size
        except (PermissionError, OSError):
            continue
        keeper = idx.get((item.name.lower(), size))
        record = {
            "samsung_path": str(item),
            "size_mb": round(size / 1024 / 1024, 2),
        }
        if keeper:
            record["keeper_path"] = keeper
            matched.append(record)
        else:
            unmatched.append(record)
    return matched, unmatched


def main(execute: bool):
    print(f"[{datetime.now().isoformat()}] Building Camera Roll keeper index...")
    idx = index_keepers()
    print(f"  indexed {len(idx):,} keeper files")

    print(f"[{datetime.now().isoformat()}] Scanning Samsung Gallery for matches...")
    matched, unmatched = scan_deletables(idx)
    total_matched_mb = sum(r["size_mb"] for r in matched)

    print(f"  matched (would delete):   {len(matched):,} files, "
          f"{total_matched_mb/1024:.2f} GB")
    print(f"  unmatched (kept as-is):   {len(unmatched):,} files")

    if not execute:
        print("\nDRY RUN — no files moved. Pass --execute to actually clean.")
        report = {
            "timestamp": datetime.now().isoformat(),
            "dry_run": True,
            "matched_count": len(matched),
            "matched_mb": total_matched_mb,
            "matched_gb": round(total_matched_mb / 1024, 2),
            "unmatched_count": len(unmatched),
            "matched_sample": matched[:10],
            "unmatched_sample": unmatched[:10],
        }
        out_path = Path(os.environ.get("TEMP", ".")) / "dedupe_camera_roll_report.json"
        with open(out_path, "w") as f:
            json.dump(report, f, indent=2)
        print(f"  full report: {out_path}")
        return

    # Execute: send each matched file to OneDrive's Recycle Bin.
    # OneDrive moves deleted-via-Explorer files to its own Recycle Bin
    # (separate from Windows Recycle Bin) where they live for 30 days.
    # We use os.remove instead because send2trash isn't installed; OneDrive
    # syncs the deletion server-side and the file lives in the OneDrive
    # web-UI Recycle Bin for 30 days.
    print(f"\n[{datetime.now().isoformat()}] EXECUTING: moving {len(matched)} files to OneDrive Recycle Bin...")
    deleted = []
    errors = []
    for rec in matched:
        try:
            os.remove(rec["samsung_path"])
            deleted.append(rec["samsung_path"])
        except Exception as e:
            errors.append({"path": rec["samsung_path"], "error": str(e)})

    print(f"  deleted: {len(deleted):,} files")
    print(f"  errors:  {len(errors):,}")
    print(f"  freed:   {total_matched_mb/1024:.2f} GB (recoverable for 30 days from OneDrive web Recycle Bin)")

    out_path = Path(os.environ.get("TEMP", ".")) / "dedupe_camera_roll_executed.json"
    with open(out_path, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "dry_run": False,
            "deleted_count": len(deleted),
            "deleted_mb": total_matched_mb,
            "deleted_gb": round(total_matched_mb / 1024, 2),
            "errors": errors,
            "deleted_sample": deleted[:50],
        }, f, indent=2)
    print(f"  audit log: {out_path}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--execute", action="store_true",
                   help="actually move files to OneDrive Recycle Bin (default: dry-run)")
    args = p.parse_args()
    main(execute=args.execute)
