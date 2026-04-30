"""Run both tracks every 30 minutes during market hours (9:30-16:00 ET, M-F)."""
import time
from datetime import datetime, time as dt_time
from zoneinfo import ZoneInfo

from trading_shadow.runner import run_one_pass

ET = ZoneInfo("America/New_York")
OPEN = dt_time(9, 30)
CLOSE = dt_time(16, 0)


def is_market_open() -> bool:
    now = datetime.now(ET)
    if now.weekday() >= 5:
        return False
    return OPEN <= now.time() <= CLOSE


if __name__ == "__main__":
    while True:
        if is_market_open():
            try:
                run_one_pass(track="A", live=False)
                run_one_pass(track="B", live=False)
            except Exception as e:
                print(f"Pass error: {e}")
        time.sleep(30 * 60)
