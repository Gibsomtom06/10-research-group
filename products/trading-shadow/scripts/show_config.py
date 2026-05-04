"""Print the active Config so we can verify floor settings."""
from trading_shadow.config import Config

c = Config.from_env()
print(f"HARD_FLOOR_USD:           ${c.HARD_FLOOR_USD}")
print(f"PER_TRADE_MAX_USD:        ${c.PER_TRADE_MAX_USD}")
print(f"LIVE_CAPITAL_PER_TRACK:   ${c.LIVE_CAPITAL_PER_TRACK}")
print(f"MAX_CONSECUTIVE_LOSSES:   {c.MAX_CONSECUTIVE_LOSSES}")
print(f"MAX_POSITION_SIZE_PCT:    {c.MAX_POSITION_SIZE_PCT * 100}%")
print(f"GRADUATION_ACCURACY:      {c.GRADUATION_ACCURACY * 100}%")
print(f"GRADUATION_MIN_TRADES:    {c.GRADUATION_MIN_TRADES}")
print(f"AUTO_ROLLBACK_ON_FLOOR:   {c.AUTO_ROLLBACK_ON_HARD_FLOOR} (gated off by design)")
