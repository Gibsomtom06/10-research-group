import time
from datetime import datetime

from scan_drives import scan_drives
from clean_downloads import clean_downloads
from map_onedrive import map_onedrive
from resolve_onedrive_conflicts import resolve_onedrive_conflicts
from dedupe_files import dedupe_files
from log_status import log_status

LOOP_INTERVAL_MINUTES = 30


def run_cycle():
    print(f"\n[{datetime.now().isoformat()}] Starting steward cycle...")

    scan_report = scan_drives()
    log_status("scan_drives", scan_report)

    clean_report = clean_downloads()
    log_status("clean_downloads", clean_report)

    onedrive_report = map_onedrive()
    log_status("map_onedrive", onedrive_report)

    conflict_report = resolve_onedrive_conflicts()
    log_status("resolve_conflicts", conflict_report)

    dedupe_report = dedupe_files(auto_remove=False)
    log_status("dedupe_files", dedupe_report)

    log_status("Cycle complete")


if __name__ == "__main__":
    while True:
        run_cycle()
        print(f"Sleeping {LOOP_INTERVAL_MINUTES}m...")
        time.sleep(LOOP_INTERVAL_MINUTES * 60)
