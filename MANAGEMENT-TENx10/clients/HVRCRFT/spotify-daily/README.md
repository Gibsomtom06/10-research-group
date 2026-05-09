# HVRCRFT Spotify Daily Autopull

Pulls HVRCRFT's Spotify Web API data once a day, appends a row to the rolling CSV, writes a markdown snapshot, and (optionally) pushes the snapshot to the HVRCRFT NotebookLM.

What gets pulled per day:
- Artist popularity (Spotify's official 0–100 score — what Musicstax / artist.tools surface)
- Follower count
- Top-10 tracks for market=US, each with their popularity score
- Audio features for those top 10 (BPM, key, energy, danceability, valence, loudness, acousticness)

## One-time setup

### 1. Create a Spotify app
- Go to https://developer.spotify.com/dashboard
- Click **Create app** → name "HVRCRFT Daily Pull" → no redirect URL needed
- Copy the **Client ID** and **Client secret**

### 2. Add credentials to `.env`
Either:
- Local: copy `.env.example` to `.env` in this folder and fill in the values, or
- Umbrella: add `SPOTIFY_CLIENT_ID=...` and `SPOTIFY_CLIENT_SECRET=...` to `10 Research Group/.env`

### 3. Install dependencies
```powershell
cd "MANAGEMENT-TENx10\clients\HVRCRFT\spotify-daily"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4. Test it manually
```powershell
.\.venv\Scripts\python.exe spotify_daily.py
```
You should see a row appended to `spotify_daily.csv` and a file in `snapshots/`.

To also push the snapshot to NotebookLM:
```powershell
.\.venv\Scripts\python.exe spotify_daily.py --notebook
```
(Requires `notebooklm-mcp` to be on PATH and authenticated — `notebooklm-mcp-auth` if you ever see auth errors.)

### 5. Schedule it daily

PowerShell (run as your user, not admin) — registers a task that fires every day at 09:00 ET:

```powershell
$action = New-ScheduledTaskAction `
  -Execute "$env:USERPROFILE\OneDrive\10 Research Group\MANAGEMENT-TENx10\clients\HVRCRFT\spotify-daily\.venv\Scripts\python.exe" `
  -Argument 'spotify_daily.py --notebook' `
  -WorkingDirectory "$env:USERPROFILE\OneDrive\10 Research Group\MANAGEMENT-TENx10\clients\HVRCRFT\spotify-daily"

$trigger = New-ScheduledTaskTrigger -Daily -At 9am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries

Register-ScheduledTask `
  -TaskName "HVRCRFT-Spotify-Daily" `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Daily Spotify Web API pull for HVRCRFT, snapshot + NotebookLM update"
```

Verify with:
```powershell
Get-ScheduledTask -TaskName "HVRCRFT-Spotify-Daily" | Get-ScheduledTaskInfo
```

Run on demand:
```powershell
Start-ScheduledTask -TaskName "HVRCRFT-Spotify-Daily"
```

Remove (if you ever want to):
```powershell
Unregister-ScheduledTask -TaskName "HVRCRFT-Spotify-Daily" -Confirm:$false
```

## Files this script writes

- `spotify_daily.csv` — one row per day, all-time rolling timeseries
- `snapshots/snapshot_<YYYY-MM-DD>.md` — today's snapshot in markdown
- `spotify_daily.log` — append-only run log

## Constants in the script

- Artist Spotify ID: `7F5MkQ9b2m12d1mujO8fpw`
- NotebookLM notebook ID: `7c9082fc-66ca-470c-a477-3b6f594d3921`

If the artist or notebook ever changes, edit the top of `spotify_daily.py`.

## What this does NOT pull

The Spotify Web API does not expose: monthly listeners, daily streams, save count, playlist-add count, super listeners, city-level breakdown, source-of-streams, skip rate. Those live in **Spotify for Artists** (S4A). Pull S4A separately (manual export, agent-browser session, or Soundcharts/Chartmetric API).

## Troubleshooting

**`SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing from .env`** — credentials not loaded. Confirm `.env` exists at one of the search paths and the variable names are exact.

**`401 Unauthorized` from Spotify** — credentials wrong or app revoked. Regenerate at developer.spotify.com.

**`429 Too Many Requests`** — rate limited. Script makes 3 API calls per run; this should never trigger from daily runs alone.

**NotebookLM update fails with auth error** — run `notebooklm-mcp-auth` in a terminal to refresh the cached session.
