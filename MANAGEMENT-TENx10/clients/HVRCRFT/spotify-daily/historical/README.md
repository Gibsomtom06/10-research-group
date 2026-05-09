# HVRCRFT historical data ingest

This folder is the canonical historical-data store for HVRCRFT. The daily Spotify Web API autopull (`spotify_daily.py` in the parent folder) extends the timeseries forward; this folder holds everything from before the autopull existed.

## Files

- **`HVRCRFT-audience-timeline-2024-01-01_2026-05-06.csv`** — daily Spotify-for-Artists audience metrics
  - Columns: `date, listeners, monthly_listeners, monthly_active_listeners, super_listeners, streams, playlist_adds, saves, followers`
  - Source: S4A export, 857 days
  - This is the all-time history through 2026-05-06. The daily autopull (forward-only) does NOT replicate these columns — the autopull captures `artist_popularity` + `followers` + per-track `popularity`, which the Web API exposes. Monthly listeners, daily streams, saves, super listeners come only from S4A and need to be re-exported periodically (recommend monthly).

- **`HVRCRFT-songs-28day-2026-05-06.csv`** — top tracks snapshot
  - Columns: `song, listeners, streams, saves, release_date`
  - Source: S4A export, 28-day window ending 2026-05-06
  - This is a single point-in-time snapshot, NOT a timeseries. Re-export after each release or quarterly.

## What gets refreshed when

| Cadence | What | Source | How |
|---|---|---|---|
| Daily 9am | artist popularity + follower count + top-10 track popularity | Spotify Web API | `spotify_daily.py --notebook` (Task Scheduler) |
| Monthly | full audience timeseries (monthly listeners, streams, saves, super listeners) | Spotify for Artists export | manual export or agent-browser session, drop into this folder with a date-suffixed filename |
| Per release | top tracks 28-day window | Spotify for Artists export | manual, drop here |
| Per release | playlist add events, source-of-streams, city distribution | Spotify for Artists | agent-browser session (paused 2026-05-07 pending S4A pull) |

## Naming convention for new exports

Use the same shape:
- `HVRCRFT-audience-timeline-<start>_<end>.csv`
- `HVRCRFT-songs-28day-<as_of_date>.csv`
- `HVRCRFT-cities-<as_of_date>.csv`
- `HVRCRFT-source-of-streams-<as_of_date>.csv`
- `HVRCRFT-playlist-adds-<as_of_date>.csv`

## Joining historical + daily for analysis

The two streams have different columns. To analyze them together:

```python
import pandas as pd

historical = pd.read_csv("historical/HVRCRFT-audience-timeline-2024-01-01_2026-05-06.csv", parse_dates=["date"])
daily = pd.read_csv("spotify_daily.csv", parse_dates=["date"])

# left-join historical onto daily on date; daily provides popularity, historical provides everything else
merged = pd.merge(daily, historical, on="date", how="outer", suffixes=("_daily", "_hist"))
merged = merged.sort_values("date")
```

The historical timeline's `followers` column should match the daily pull's `followers` column on overlapping dates — sanity-check by comparing `followers_daily` vs `followers_hist` in the merged frame.
