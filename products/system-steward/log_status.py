from pathlib import Path
from datetime import datetime

LOG_FILE = Path("C:/Users/Slash/system_steward/logs/steward.log")


def log_status(message=None, data=None):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    parts = []

    if data:
        if "large_files" in data:
            parts.append(f"large_files={len(data['large_files'])}")
        if "trash_files" in data:
            parts.append(f"trash={len(data['trash_files'])}")
        if "conflicts" in data:
            parts.append(f"conflicts={len(data['conflicts'])}")
        if "duplicates" in data:
            count = len(data["duplicates"]) if isinstance(data["duplicates"], dict) else len(data["duplicates"])
            parts.append(f"dupes={count}")
        if "moved" in data:
            parts.append(f"moved={len(data['moved'])}")
        if "resolved" in data:
            parts.append(f"resolved={len(data['resolved'])}")

    detail = " | " + ", ".join(parts) if parts else ""
    line = f"[{timestamp}] {message or 'STATUS'}{detail}"

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

    print(line)
    return line


if __name__ == "__main__":
    log_status("Manual test run")
