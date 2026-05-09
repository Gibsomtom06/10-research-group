# lyric-flagger

Take a SoundCloud / Spotify / local audio input and produce: lyrics, language, explicit flag.

Built for DSR release prep — output writes into the per-release folder in the DSR Releases Google Shared Drive (mounted locally), and feeds Ingrooves metadata.

## Install

One-time, in any Python 3.10+ env:

```powershell
pip install -r requirements.txt
```

`faster-whisper` needs **ffmpeg** on PATH. On Windows: `winget install Gyan.FFmpeg` (then restart the shell).

Spotify creds are auto-loaded from `products/tenx10-platform/.env.local`. No setup needed if those are present.

## Usage

```powershell
# Confirm a release first (creates the Drive folder + lyrics/ subfolder + metadata.yaml)
python scripts/release/confirm_release.py --artist DirtySnatcha --title "Rise EP" --date 2026-05-29

# Then run lyric-flagger pointing at the release — auto-resolves to L:/My Drive/DSR Releases/<year>/<release>/lyrics/
python scripts/lyric-flagger/lyric_flagger.py `
  --release "DirtySnatcha - Rise EP" --release-year 2026 `
  "https://soundcloud.com/dirtysnatcha/rush" `
  "https://on.soundcloud.com/tyBhn6Jk9QHlMP3y2s"

# Or point directly at a release folder
python scripts/lyric-flagger/lyric_flagger.py --release-dir "L:/My Drive/DSR Releases/2026/DirtySnatcha - Rise EP" `
  "https://soundcloud.com/dirtysnatcha/rush"

# Single SoundCloud URL → JSON to stdout
python scripts/lyric-flagger/lyric_flagger.py "https://soundcloud.com/dirtysnatcha/rush"

# Spotify URL (uses official explicit flag + LRCLIB lyrics, no transcription)
python scripts/lyric-flagger/lyric_flagger.py "https://open.spotify.com/track/<id>"

# Local file
python scripts/lyric-flagger/lyric_flagger.py "C:\path\to\track.wav"

# Heavy bass / drops cutting off vocals? Disable VAD
python scripts/lyric-flagger/lyric_flagger.py --no-vad "<url>"
```

## What you get

For each input, a `TrackResult` with:

- `title`, `artist`, `source`, `source_url`, `isrc`
- `language` — ISO 639-1 (e.g. `en`, `es`)
- `explicit` — `explicit | clean | not_explicit | unknown`
- `explicit_source` — `spotify` (authoritative) or `keyword_scan`
- `explicit_words` — which profanity words were detected
- `lyrics`, `lyrics_source` — `lrclib | whisper`

With `--txt-dir`, each track lands in its own `<slug>.txt` with a header block above the lyrics.

With `--csv`, rows append to one CSV (good for batch release prep).

## How it decides

1. **Spotify URL** → official Spotify explicit flag + LRCLIB lyrics (by ISRC / title-artist).
2. **SoundCloud / other URL** → first try LRCLIB by parsed title-artist; if no match, `yt-dlp` downloads audio and `faster-whisper` transcribes.
3. **Local file** → straight to `faster-whisper`.
4. **Language** — Whisper auto-detects; for LRCLIB lyrics, `lingua` detects.
5. **Explicit** — Spotify's flag wins when present. Otherwise, profanity scan against `profanity_list.txt`.

## Tuning

- `--whisper-model tiny|base|small|medium|large-v3` — default `small` (decent EN accuracy on CPU).
- `LYRIC_FLAGGER_DEVICE=cuda` and `LYRIC_FLAGGER_COMPUTE=float16` for GPU.
- Edit `profanity_list.txt` to extend / soften the explicit threshold.
