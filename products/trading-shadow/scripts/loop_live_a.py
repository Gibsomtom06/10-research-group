"""Track A LIVE loop — every 30 min during market hours."""
import os
os.environ["MODE"] = "live"

import time
from datetime import datetime, time as dt_time
from zoneinfo import ZoneInfo

from trading_shadow.runner import run_one_pass

ET = ZoneInfo("America/New_York")
OPEN = dt_time(9, 35)
CLOSE = dt_time(15, 55)


def is_market_open() -> bool:
    now = datetime.now(ET)
    if now.weekday() >= 5:
        return False
    return OPEN <= now.time() <= CLOSE


if __name__ == "__main__":
    while True:
        if is_market_open():
            try:
                run_one_pass(track="A", live=True)
            except Exception as e:
                print(f"Live pass error: {e}")
        time.sleep(30 * 60)
