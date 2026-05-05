"""
Sweep this machine for Claude / 10RG / project-related files outside the umbrella.

Run from any directory. Writes JSON dumps to OneDrive\10 Research Group\docs\.
Markdown report is written by the calling Claude session (which can read the JSON).

Usage:
    python "C:\\Users\\slash\\OneDrive\\10 Research Group\\scripts\\sweep_for_claude_files.py" <machine-label>

<machine-label> examples: thispc, laptop. Output filenames use this suffix.
"""

import os
import re
import json
import sys
import time
from pathlib import Path


def get_user_root():
    """Best-effort detection of the current user's home directory."""
    home = os.environ.get("USERPROFILE") or os.environ.get("HOME")
    if home and os.path.isdir(home):
        return home
    return r"C:\Users\slash"


def get_onedrive_root():
    """Find the OneDrive root for the current user."""
    od = os.environ.get("OneDrive") or os.environ.get("ONEDRIVE") or os.environ.get("OneDriveCommercial")
    if od and os.path.isdir(od):
        return od
    home = get_user_root()
    candidate = os.path.join(home, "OneDrive")
    return candidate if os.path.isdir(candidate) else None


def get_drives():
    """Return drive letters with mounted FS, excluding C:."""
    drives = []
    if os.name == "nt":
        for letter in "DEFGHIJKLMNOPQRSTUVWXYZ":
            path = f"{letter}:\\"
            if os.path.isdir(path):
                drives.append(path)
    return drives


KEYWORDS_LOWER = [
    "claude", "10rg", "10-research", "10 research", "tenx10", "tenx-10",
    "dba", "dirtysnatcha", "dsr", "trading-shadow", "trading_shadow",
    "system-steward", "system_steward", "rim-shop", "rim_shop", "rim shop",
    "mhp", "myhydrationpack", "hvrcrft", "whoisee", "kotrax", "dark matter",
    "dark-matter", "brain.md", "claude.md", "hierarchy.md", "skill_directory",
    "employee_directory", "autonomous_queue", "autonomous_mode_protocol",
    "delegation_playbook", "factory", "barooka", "ozztin", "mavic", "lab10",
    "leigh bray", "lee bray", "anthropic",
]

EXTS_INVENTORY = {".md", ".txt", ".json", ".yaml", ".yml", ".csv", ".docx",
                  ".xlsx", ".pdf"}
EXTS_ARCHIVE = {".zip", ".tar", ".tgz", ".7z", ".rar", ".gz", ".bz2", ".xz"}
INVENTORY_BARE = {".md"}  # any .md gets inventoried even without keyword match

SKIP_PATH_FRAGMENTS = [
    "OneDrive/10 Research Group", "OneDrive\\10 Research Group",
    "node_modules", ".git", "__pycache__", ".venv", ".next", "dist",
    "build", ".cache", ".pytest_cache", "$RECYCLE.BIN",
    "System Volume Information", "PIONEER",
]


def should_skip(path_str: str) -> bool:
    low = path_str.lower()
    return any(s.lower() in low for s in SKIP_PATH_FRAGMENTS)


def sweep(roots, output_path: str, machine_label: str):
    """Walk roots, accumulate keyword + bare-md hits, write JSON."""
    print(f"Output -> {output_path}", file=sys.stderr)
    keyword_hits = []
    archive_hits = []

    for root in roots:
        if not os.path.exists(root):
            print(f"[skip — does not exist] {root}", file=sys.stderr)
            continue
        print(f"[scan] {root}", file=sys.stderr)
        try:
            for dirpath, dirnames, filenames in os.walk(root):
                # prune skip dirs in-place
                dirnames[:] = [d for d in dirnames
                               if not should_skip(os.path.join(dirpath, d))]
                if should_skip(dirpath):
                    continue
                for fn in filenames:
                    fn_low = fn.lower()
                    full = os.path.join(dirpath, fn)
                    full_low = full.lower()
                    ext = os.path.splitext(fn_low)[1]

                    matched_kw = next((k for k in KEYWORDS_LOWER
                                       if k in fn_low or k in full_low), None)
                    is_archive = ext in EXTS_ARCHIVE

                    if ext in EXTS_INVENTORY and (matched_kw or ext in INVENTORY_BARE):
                        try:
                            stat = os.stat(full)
                            keyword_hits.append({
                                "path": full.replace("\\", "/"),
                                "ext": ext,
                                "size_bytes": stat.st_size,
                                "mtime": time.strftime("%Y-%m-%d",
                                                        time.localtime(stat.st_mtime)),
                                "matched_kw": matched_kw,
                                "inventory_only": (matched_kw is None),
                                "root": root,
                            })
                        except OSError:
                            pass
                    elif is_archive:
                        try:
                            stat = os.stat(full)
                            archive_hits.append({
                                "path": full.replace("\\", "/"),
                                "size_bytes": stat.st_size,
                                "size_mb": round(stat.st_size / (1024 * 1024), 1),
                                "mtime": time.strftime("%Y-%m-%d",
                                                        time.localtime(stat.st_mtime)),
                                "ext": ext,
                                "matched_kw": matched_kw,
                                "root": root,
                            })
                        except OSError:
                            pass
        except (OSError, PermissionError) as e:
            print(f"  walk error: {e}", file=sys.stderr)

    out = {
        "machine_label": machine_label,
        "computer_name": os.environ.get("COMPUTERNAME", "?"),
        "username": os.environ.get("USERNAME", "?"),
        "swept_roots": roots,
        "keyword_hits_count": len(keyword_hits),
        "archive_hits_count": len(archive_hits),
        "keyword_hits": keyword_hits,
        "archive_hits": archive_hits,
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print(f"\n=== Summary ===", file=sys.stderr)
    print(f"  keyword/markdown hits: {len(keyword_hits)}", file=sys.stderr)
    print(f"  archive hits:          {len(archive_hits)}", file=sys.stderr)
    print(f"  output:                {output_path}", file=sys.stderr)


def main():
    machine_label = sys.argv[1] if len(sys.argv) > 1 else "unknown"
    home = get_user_root()
    onedrive = get_onedrive_root()
    drives = get_drives()

    roots = [
        os.path.join(home, "Downloads"),
        os.path.join(home, "Desktop"),
        os.path.join(home, "Documents"),
        os.path.join(home, "Projects"),
        os.path.join(home, ".claude"),
    ]
    if onedrive:
        roots.extend([
            os.path.join(onedrive, "Desktop"),
            os.path.join(onedrive, "Documents"),
            os.path.join(onedrive, "Downloads"),
            os.path.join(onedrive, "Pictures"),
            onedrive,  # top-level non-recursive will catch loose root files via walk
        ])
    roots.extend(drives)

    if not onedrive:
        print("WARNING: OneDrive root not detected. Output will go to ~/sweep_out.json",
              file=sys.stderr)
        output_path = os.path.join(home, f"FILE_SWEEP_2026-05-05_{machine_label}.json")
    else:
        output_path = os.path.join(onedrive, "10 Research Group", "docs",
                                    f"FILE_SWEEP_2026-05-05_{machine_label}.json")

    sweep(roots, output_path, machine_label)


if __name__ == "__main__":
    main()
