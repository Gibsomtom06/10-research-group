"""Track B — paper until 2026-05-05, live thereafter."""
import os
import sys
from datetime import datetime, timezone

if "--live" in sys.argv:
    os.environ["MODE"] = "live"

from trading_shadow.runner import run_one_pass

if __name__ == "__main__":
    live = "--live" in sys.argv
    run_one_pass(track="B", live=live)
    print(f"Track B pass complete at {datetime.now(timezone.utc).isoformat()}")
