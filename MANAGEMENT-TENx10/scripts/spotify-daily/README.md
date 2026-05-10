# Roster Spotify daily — multi-artist runner

Shared Spotify Web API autopull for the 4 managed artists that don't have a
dedicated script. HVRCRFT keeps its standalone runner + scheduled task at
`MANAGEMENT-TENx10/clients/HVRCRFT/spotify-daily/spotify_daily.py` for now;
fold it in after the 2026-05-13 networking event.

## What it does

Per run, for each artist in `REGISTRY`:
1. Calls Spotify Web API: artist endpoint + top-tracks (market=US)
2. Appends one row to `clients/<stage_name>/spotify-daily/spotify_daily.csv`
   (rolling timeseries; idempotent on `date`)
3. Writes `clients/<stage_name>/spotify-daily/snapshots/snapshot_<YYYY-MM-DD>.md`
4. Logs to `multi_pull.log`

File shape matches HVRCRFT's standalone script, so the tenx10 backfill
(`scripts/backfill/057_spotify_daily.ts`) mirrors all of them into the
`spotify_daily_snapshots` Supabase table without modification.

## Run it

```powershell
# All 4 artists in REGISTRY
"C:\Users\slash\OneDrive\10 Research Group\MANAGEMENT-TENx10\clients\HVRCRFT\spotify-daily\.venv\Scripts\python.exe" `
  "C:\Users\slash\OneDrive\10 Research Group\MANAGEMENT-TENx10\scripts\spotify-daily\multi_pull.py"

# One artist
"...\python.exe" "...\multi_pull.py" DirtySnatcha
```

Reuses HVRCRFT's existing `.venv` and the umbrella `.env`
(`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`). No separate setup.

## Mirror to Supabase

After a run, push the new file rows into `spotify_daily_snapshots`:

```powershell
cd C:\Users\slash\Projects\tenx10
$env:TENX10_UMBRELLA_PATH = "C:\Users\slash\OneDrive\10 Research Group"
# Loads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local
npx tsx scripts/backfill/057_spotify_daily.ts
```

Idempotent; safe to re-run. Drives the `/dashboard/artists` Spotify drawer.

## Schedule daily (one task instead of four)

```powershell
$python = "$env:USERPROFILE\OneDrive\10 Research Group\MANAGEMENT-TENx10\clients\HVRCRFT\spotify-daily\.venv\Scripts\python.exe"
$script = "$env:USERPROFILE\OneDrive\10 Research Group\MANAGEMENT-TENx10\scripts\spotify-daily\multi_pull.py"

$action = New-ScheduledTaskAction `
  -Execute $python `
  -Argument "`"$script`"" `
  -WorkingDirectory "$env:USERPROFILE\OneDrive\10 Research Group\MANAGEMENT-TENx10\scripts\spotify-daily"
$trigger = New-ScheduledTaskTrigger -Daily -At 9am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries

Register-ScheduledTask `
  -TaskName "TENx10-Roster-Spotify-Daily" `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Daily Spotify pull for the 4 managed artists (DSR + WHOiSEE + Dark Matter + Kotrax)"
```

The backfill is a separate concern; either invoke it after the pull (chained
in a wrapper script) or let it run on the Tenx10 side via a Vercel cron.

## Artist registry

| Stage name | Spotify ID | Folder |
|---|---|---|
| DirtySnatcha | `13dsmcZVkb1XlhT6RQYh1n` | `clients/DirtySnatcha/spotify-daily/` |
| WHOiSEE | `7pA2OyYV0LxwdOvzJJe7CH` | `clients/WHOiSEE/spotify-daily/` |
| Dark Matter | `71c783dJDlJ3pqD7cFIOQq` | `clients/Dark Matter/spotify-daily/` |
| Kotrax | `2uqBhmfMSA63cRR61btTdp` | `clients/Kotrax/spotify-daily/` |
| HVRCRFT | `7F5MkQ9b2m12d1mujO8fpw` | `clients/HVRCRFT/spotify-daily/` (separate script) |

Folder names match `artists.stage_name` (case-insensitive) — that's what the
tenx10 backfill uses to resolve the right `artist_id`. Renaming the folder
without updating the artist row will silently break the backfill match.
