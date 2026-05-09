# scripts/release

Tools for managing the lifecycle of a DSR release on disk.

Canonical storage is the DSR Google Shared Drive (id `0AFR5kVe9DGXCUk9PVA`), mounted locally via the Drive desktop client. Releases live under `DSR Releases/<year>/<Artist> - <Title>/`. Default tooling root on Thomas's PC: `L:/My Drive/DSR Releases`. Override with env `DSR_RELEASES_ROOT`.

(Pre-2026 flat releases sit in `_DSR Releases (legacy)/` until the DAD migration lifts them into year folders. The `_` prefix sorts the legacy folder visually below the active one.)

## Standard release workflow

```
1. python scripts/release/confirm_release.py --artist X --title Y --date YYYY-MM-DD ...
   → creates DSR Releases/<year>/<Artist - Title>/ + lyrics/ + metadata.yaml
2. Drop WAVs (final masters) at the top of the release folder
3. Re-run confirm_release.py with the same args
   → confirm_release sees the WAVs and auto-runs lyric_flagger on them
   → lyrics/<track-slug>.txt + lyrics.csv land in the release folder's lyrics/ subfolder
4. Eyeball-verify the lyrics, mark as human-verified if good
5. (When ready) python scripts/release/drive_shortcut.py to mirror the release
   into the per-artist folder via Drive shortcut
6. Upload to Ingrooves / Virgin
```

Lyric-checking is part of the workflow by default — pass `--no-lyrics` to skip.

## confirm_release.py

Creates the per-release folder skeleton when a release is confirmed. Idempotent — safe to re-run; only the bits that don't already exist get created. After creation, scans for audio files at the top of the release folder and runs `lyric_flagger.py` on them automatically. Skips re-running on releases whose `lyrics/` folder already contains `human-verified` files (delete or move those files to force a re-run).

```powershell
python scripts/release/confirm_release.py `
  --artist DirtySnatcha `
  --title "Rise EP" `
  --date 2026-05-29 `
  --tracks "Rush, Get Fucked" `
  --soundcloud "https://soundcloud.com/dirtysnatcha/rush, https://on.soundcloud.com/tyBhn6Jk9QHlMP3y2s"
```

Output:

```
L:/My Drive/DSR Releases/2026/DirtySnatcha - Rise EP/
├── metadata.yaml      (auto-seeded; edit by hand to fill ISRC/UPC/splits)
└── lyrics/            (where lyric-flagger writes)
```

Audio masters, contracts, and artwork sit at the top of the release folder when you drop them in (matches the Kaime convention). No `audio/` / `art/` / `contract/` subfolders — keep it flat.

### Flags

| Flag | Required | Description |
|---|---|---|
| `--artist` | yes | Primary artist or "A x B" for collab |
| `--title` | yes | Release title (e.g. "Rise EP") |
| `--date` | yes | Release date YYYY-MM-DD; year derived from this |
| `--year` | no | Override year folder (default: year from `--date`) |
| `--tracks` | no | Comma-separated track titles |
| `--soundcloud` | no | Comma-separated SoundCloud URLs (positionally aligned with `--tracks`) |
| `--spotify` | no | Comma-separated Spotify URLs (positionally aligned with `--tracks`) |
| `--durations` | no | Comma-separated track durations as "m:ss" (positionally aligned with `--tracks`). Example: `"3:15, 3:15, 3:18, 3:05"` |
| `--label` | no | Default: "DirtySnatcha Records" |
| `--distributor` | no | Default: "Ingrooves" |
| `--drive-root` | no | Releases root path (default `L:/My Drive/DSR Releases`, env `DSR_RELEASES_ROOT`) |
| `--no-metadata` | no | Skip metadata.yaml creation |
| `--no-lyrics` | no | Skip the auto lyric_flagger pass (default: ON when audio files exist) |
| `--whisper-model` | no | Whisper model for lyric pass (default: medium) |
| `--vocab` | no | Path to vocab/initial_prompt file. Default: auto-located at `scripts/lyric-flagger/vocab/<artist-slug>-<release-slug>.txt` if present |
| `--print-paths` | no | Emit JSON with resolved paths (year_dir, release_dir, lyrics_dir) |

### Then run lyric-flagger

```powershell
python scripts/lyric-flagger/lyric_flagger.py `
  --release "DirtySnatcha - Rise EP" `
  --release-year 2026 `
  "https://soundcloud.com/dirtysnatcha/rush" `
  "https://on.soundcloud.com/tyBhn6Jk9QHlMP3y2s"
```

This auto-resolves to `L:/My Drive/DSR Releases/2026/DirtySnatcha - Rise EP/lyrics/`, writes per-track `.txt` files and a `lyrics.csv`. See `scripts/lyric-flagger/README.md`.
