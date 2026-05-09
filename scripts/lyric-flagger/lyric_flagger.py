#!/usr/bin/env python3
"""
lyric_flagger.py — extract lyrics from a song and flag explicit / language.

Inputs (any mix, multiple allowed):
  - Spotify track URL  (preferred for released tracks; gives authoritative explicit flag)
  - SoundCloud track URL
  - Local audio file (mp3, wav, m4a, flac, etc.)

Outputs (per track):
  title, artist, source, source_url, language, explicit, lyrics, lyrics_source

Default output: JSON to stdout. With --csv PATH, also appends rows to a CSV.

Pipeline:
  1. Identify input type.
  2. Spotify: API metadata (incl. explicit) + LRCLIB for lyrics by ISRC/title-artist.
  3. SoundCloud / local file: download (yt-dlp) if URL, then faster-whisper transcribe.
  4. Lingua language detection on the lyrics.
  5. Profanity scan -> explicit / clean (Spotify flag wins when present).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import tempfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

# Optional deps loaded lazily so missing ones only error when actually needed.

DEFAULT_ENV_PATHS = [
    Path(__file__).resolve().parents[2]
    / "products"
    / "tenx10-platform"
    / ".env.local",
    Path(__file__).resolve().parents[2]
    / "products"
    / "tenx10-platform"
    / ".env.production.local",
]

AUDIO_SUFFIXES = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac", ".opus", ".wma"}


@dataclass
class TrackResult:
    title: str = ""
    artist: str = ""
    source: str = ""           # spotify | soundcloud | local | url
    source_url: str = ""
    isrc: str = ""
    duration_sec: float = 0.0  # length of the audio
    duration: str = ""         # mm:ss display
    language: str = ""         # ISO-639-1
    language_prob: float = 0.0
    explicit: str = "unknown"  # explicit | clean | not_explicit | unknown
    explicit_source: str = ""  # spotify | keyword_scan | none
    explicit_words: list[str] = field(default_factory=list)
    lyrics: str = ""
    lyrics_source: str = ""    # lrclib | genius | whisper | none
    # Accuracy metrics (Whisper transcripts only)
    whisper_model: str = ""
    whisper_avg_logprob: float = 0.0      # closer to 0 = more confident; <-1.0 is shaky
    whisper_no_speech_prob: float = 0.0   # high = Whisper thought it was non-speech
    whisper_compression_ratio: float = 0.0  # >2.4 often signals hallucination
    confidence: str = ""                   # high | medium | low | n/a
    repetition_score: float = 0.0          # 0..1, fraction of duplicate lines (high = hallucination)
    error: str = ""


# ---------- env loading ----------

def load_env() -> None:
    """Load .env files (tenx10-platform first) without overriding pre-set env vars."""
    for path in DEFAULT_ENV_PATHS:
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v


# ---------- input classification ----------

def classify(input_str: str) -> str:
    if Path(input_str).expanduser().exists():
        return "local"
    parsed = urlparse(input_str)
    host = (parsed.hostname or "").lower()
    if "spotify.com" in host or input_str.startswith("spotify:"):
        return "spotify"
    if "soundcloud.com" in host:
        return "soundcloud"
    if parsed.scheme in {"http", "https"}:
        return "url"
    return "query"


# ---------- spotify ----------

_spotify_token: Optional[str] = None


def spotify_token() -> Optional[str]:
    global _spotify_token
    if _spotify_token:
        return _spotify_token
    cid = os.environ.get("SPOTIFY_CLIENT_ID")
    secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not cid or not secret:
        return None
    import base64
    import requests
    auth = base64.b64encode(f"{cid}:{secret}".encode()).decode()
    r = requests.post(
        "https://accounts.spotify.com/api/token",
        headers={"Authorization": f"Basic {auth}"},
        data={"grant_type": "client_credentials"},
        timeout=15,
    )
    r.raise_for_status()
    _spotify_token = r.json()["access_token"]
    return _spotify_token


def spotify_track_id(url: str) -> Optional[str]:
    m = re.search(r"track[/:]([A-Za-z0-9]+)", url)
    return m.group(1) if m else None


def spotify_track(track_id: str) -> Optional[dict]:
    import requests
    token = spotify_token()
    if not token:
        return None
    r = requests.get(
        f"https://api.spotify.com/v1/tracks/{track_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    if r.status_code != 200:
        return None
    return r.json()


# ---------- lyric sources ----------

def lrclib_lyrics(title: str, artist: str, album: str = "", duration: Optional[int] = None) -> Optional[str]:
    """Pull plain (or synced) lyrics from LRCLIB. Returns plain text or None."""
    import requests
    params = {"track_name": title, "artist_name": artist}
    if album:
        params["album_name"] = album
    if duration:
        params["duration"] = duration
    try:
        r = requests.get("https://lrclib.net/api/get", params=params, timeout=15)
        if r.status_code == 200:
            data = r.json()
            text = data.get("plainLyrics") or _strip_lrc(data.get("syncedLyrics") or "")
            return text or None
    except Exception:
        pass
    # fallback: search
    try:
        r = requests.get(
            "https://lrclib.net/api/search",
            params={"track_name": title, "artist_name": artist},
            timeout=15,
        )
        if r.status_code == 200:
            results = r.json() or []
            if results:
                d = results[0]
                return d.get("plainLyrics") or _strip_lrc(d.get("syncedLyrics") or "") or None
    except Exception:
        pass
    return None


def _strip_lrc(synced: str) -> str:
    return "\n".join(re.sub(r"^\[\d+:\d+\.\d+\]\s*", "", ln) for ln in synced.splitlines()).strip()


# ---------- transcription ----------

def download_audio(url: str, dest_dir: Path) -> Path:
    """Use yt-dlp (Python module) to download bestaudio. Returns path to file."""
    try:
        import yt_dlp
    except ImportError as e:
        raise RuntimeError("yt-dlp not installed. pip install yt-dlp") from e

    out_template = str(dest_dir / "%(id)s.%(ext)s")
    # No FFmpeg postprocessing: take whatever native audio container the host serves
    # (SoundCloud is typically m4a/opus). faster-whisper reads via PyAV, which bundles ffmpeg libs.
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": out_template,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
    track_id = info["id"]
    for f in sorted(dest_dir.iterdir()):
        if f.stem == track_id:
            return f
    raise RuntimeError(f"yt-dlp downloaded but file not found in {dest_dir}")


def yt_dlp_metadata(url: str) -> dict:
    try:
        import yt_dlp
    except ImportError as e:
        raise RuntimeError("yt-dlp not installed. pip install yt-dlp") from e
    with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "skip_download": True}) as ydl:
        return ydl.extract_info(url, download=False)


def whisper_transcribe(audio_path: Path, model_size: str = "medium",
                       initial_prompt: str = "", vad_filter: bool = True,
                       vad_parameters: Optional[dict] = None) -> dict:
    """Transcribe audio. Returns dict with text, language, and confidence metrics.

    When `vad_filter=True`, faster-whisper runs Silero VAD first and only feeds
    detected speech regions to Whisper — so the slow large-v3 pass scales with
    actual vocal duration, not full track length. `vad_parameters` lets the
    caller relax thresholds for music (quiet/processed vocals over heavy bass).
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        raise RuntimeError("faster-whisper not installed. pip install faster-whisper") from e

    compute_type = os.environ.get("LYRIC_FLAGGER_COMPUTE", "int8")
    device = os.environ.get("LYRIC_FLAGGER_DEVICE", "cpu")
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    transcribe_kwargs: dict = {
        "beam_size": 5,
        "vad_filter": vad_filter,
        "initial_prompt": initial_prompt or None,
    }
    if vad_filter and vad_parameters:
        transcribe_kwargs["vad_parameters"] = vad_parameters
    segments, info = model.transcribe(str(audio_path), **transcribe_kwargs)
    seg_list = list(segments)  # consume the generator so info fields stabilize
    text = "\n".join(s.text.strip() for s in seg_list).strip()

    # weight metrics by segment duration so a single noisy 0.2s segment doesn't dominate
    if seg_list:
        total = sum(max(s.end - s.start, 0.01) for s in seg_list)
        avg_lp = sum(s.avg_logprob * (s.end - s.start) for s in seg_list) / total
        avg_nsp = sum(s.no_speech_prob * (s.end - s.start) for s in seg_list) / total
        avg_cr = sum(s.compression_ratio * (s.end - s.start) for s in seg_list) / total
    else:
        avg_lp = avg_nsp = avg_cr = 0.0

    # repetition heuristic: dedupe consecutive lines, compare to total
    lines = [ln.strip().lower() for ln in text.splitlines() if ln.strip()]
    rep_score = 0.0
    if len(lines) >= 4:
        unique_consecutive = sum(1 for i, ln in enumerate(lines) if i == 0 or ln != lines[i - 1])
        rep_score = round(1.0 - (unique_consecutive / len(lines)), 3)

    return {
        "text": text,
        "language": info.language or "",
        "language_prob": round(float(info.language_probability or 0.0), 3),
        "duration_sec": round(float(getattr(info, "duration", 0.0) or 0.0), 3),
        "avg_logprob": round(avg_lp, 3),
        "no_speech_prob": round(avg_nsp, 3),
        "compression_ratio": round(avg_cr, 3),
        "repetition_score": rep_score,
        "model": model_size,
        "segment_count": len(seg_list),
    }


def confidence_label(avg_logprob: float, no_speech_prob: float,
                     compression_ratio: float, repetition_score: float,
                     has_segments: bool, has_text: bool) -> str:
    if not has_segments or not has_text:
        return "no_speech_detected"
    # avg_logprob: -0.3+ excellent, -0.6 ok, < -1.0 shaky (0.0 = no data — penalise)
    # no_speech_prob: < 0.2 fine, > 0.5 mostly silence
    # compression_ratio: > 2.4 strong hallucination signal (0.0 = no data — penalise)
    # repetition_score: > 0.4 means lots of dup lines
    score = 0
    score += 2 if -0.5 < avg_logprob < 0 else 1 if -0.9 < avg_logprob < 0 else 0
    score += 2 if no_speech_prob < 0.3 else 1 if no_speech_prob < 0.6 else 0
    score += 2 if 0.5 < compression_ratio < 2.0 else 1 if compression_ratio < 2.4 else 0
    score += 2 if repetition_score < 0.2 else 1 if repetition_score < 0.4 else 0
    if score >= 8:
        return "high"
    if score >= 5:
        return "medium"
    return "low"


# ---------- language ----------

def detect_language(text: str) -> str:
    if not text.strip():
        return ""
    try:
        from lingua import Language, LanguageDetectorBuilder
        detector = LanguageDetectorBuilder.from_all_languages().with_low_accuracy_mode().build()
        lang = detector.detect_language_of(text)
        if lang is None:
            return ""
        return lang.iso_code_639_1.name.lower()
    except ImportError:
        return ""


# ---------- explicit scan ----------

def load_profanity_list() -> set[str]:
    p = Path(__file__).with_name("profanity_list.txt")
    if not p.exists():
        return set()
    words = set()
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip().lower()
        if line and not line.startswith("#"):
            words.add(line)
    return words


def scan_explicit(text: str, profanity: set[str]) -> tuple[str, list[str]]:
    if not text.strip() or not profanity:
        return "unknown", []
    tokens = re.findall(r"[A-Za-z']+", text.lower())
    hits = sorted({t for t in tokens if t in profanity})
    return ("explicit" if hits else "clean"), hits


# ---------- per-input handlers ----------

def handle_spotify(url: str, profanity: set[str]) -> TrackResult:
    res = TrackResult(source="spotify", source_url=url)
    tid = spotify_track_id(url)
    if not tid:
        res.error = "Could not parse Spotify track id"
        return res
    data = spotify_track(tid)
    if not data:
        res.error = "Spotify lookup failed (no creds or not found)"
        return res
    res.title = data["name"]
    res.artist = ", ".join(a["name"] for a in data.get("artists", []))
    res.isrc = (data.get("external_ids") or {}).get("isrc", "")
    res.explicit = "explicit" if data.get("explicit") else "not_explicit"
    res.explicit_source = "spotify"
    duration = int(round((data.get("duration_ms") or 0) / 1000)) or None
    if duration:
        res.duration_sec = float(duration)
        res.duration = f"{duration // 60}:{duration % 60:02d}"
    album = (data.get("album") or {}).get("name", "")
    lyrics = lrclib_lyrics(res.title, data["artists"][0]["name"] if data.get("artists") else "", album, duration)
    if lyrics:
        res.lyrics = lyrics
        res.lyrics_source = "lrclib"
        res.language = detect_language(lyrics)
    else:
        res.error = "No lyrics found on LRCLIB; rerun with --transcribe-fallback to use Whisper"
    if res.explicit == "not_explicit" and lyrics:
        # also surface keyword hits even when Spotify says clean (informational)
        _, hits = scan_explicit(lyrics, profanity)
        res.explicit_words = hits
    elif res.explicit == "explicit" and lyrics:
        _, hits = scan_explicit(lyrics, profanity)
        res.explicit_words = hits
    return res


def _apply_whisper_result(res: TrackResult, w: dict) -> None:
    res.lyrics = w["text"]
    res.lyrics_source = "whisper"
    res.language = w["language"] or detect_language(w["text"])
    res.language_prob = w.get("language_prob", 0.0)
    res.duration_sec = w.get("duration_sec", 0.0)
    if res.duration_sec:
        m, s = divmod(int(round(res.duration_sec)), 60)
        res.duration = f"{m}:{s:02d}"
    res.whisper_model = w["model"]
    res.whisper_avg_logprob = w["avg_logprob"]
    res.whisper_no_speech_prob = w["no_speech_prob"]
    res.whisper_compression_ratio = w["compression_ratio"]
    res.repetition_score = w["repetition_score"]
    res.confidence = confidence_label(
        w["avg_logprob"], w["no_speech_prob"], w["compression_ratio"], w["repetition_score"],
        has_segments=w.get("segment_count", 0) > 0,
        has_text=bool(w["text"].strip()),
    )
    if res.confidence == "no_speech_detected" and not res.error:
        res.error = "No speech detected by Whisper (likely instrumental, or VAD filter cut all vocals — try --no-vad)"


def handle_audio_url(url: str, profanity: set[str], whisper_model: str,
                     source_label: str, vocab: str = "", vad_filter: bool = True,
                     vad_parameters: Optional[dict] = None) -> TrackResult:
    res = TrackResult(source=source_label, source_url=url)
    try:
        meta = yt_dlp_metadata(url)
        res.title = meta.get("title", "")
        res.artist = meta.get("uploader") or meta.get("uploader_id", "")
        if meta.get("duration"):
            res.duration_sec = float(meta["duration"])
            d = int(round(res.duration_sec))
            res.duration = f"{d // 60}:{d % 60:02d}"
    except Exception as e:
        res.error = f"metadata: {e}"
    # try LRCLIB first if we have plausible title+artist
    if res.title:
        guess_artist = res.artist or ""
        if " - " in res.title and not guess_artist:
            parts = res.title.split(" - ", 1)
            guess_artist, clean_title = parts[0].strip(), parts[1].strip()
        else:
            clean_title = res.title
        lyrics = lrclib_lyrics(clean_title, guess_artist) if guess_artist else None
        if lyrics:
            res.lyrics = lyrics
            res.lyrics_source = "lrclib"
            res.language = detect_language(lyrics)
            res.confidence = "high"  # LRCLIB lyrics are human-verified
            verdict, hits = scan_explicit(lyrics, profanity)
            res.explicit, res.explicit_source, res.explicit_words = verdict, "keyword_scan", hits
            return res
    # otherwise download + transcribe
    with tempfile.TemporaryDirectory() as tmp:
        try:
            audio = download_audio(url, Path(tmp))
        except Exception as e:
            res.error = f"download: {e}"
            return res
        try:
            w = whisper_transcribe(audio, whisper_model, initial_prompt=vocab, vad_filter=vad_filter, vad_parameters=vad_parameters)
        except Exception as e:
            res.error = f"whisper: {e}"
            return res
    _apply_whisper_result(res, w)
    verdict, hits = scan_explicit(res.lyrics, profanity)
    res.explicit, res.explicit_source, res.explicit_words = verdict, "keyword_scan", hits
    return res


def handle_local(path_str: str, profanity: set[str], whisper_model: str,
                 vocab: str = "", vad_filter: bool = True,
                 vad_parameters: Optional[dict] = None) -> TrackResult:
    path = Path(path_str).expanduser().resolve()
    res = TrackResult(source="local", source_url=str(path), title=path.stem)
    try:
        w = whisper_transcribe(path, whisper_model, initial_prompt=vocab, vad_filter=vad_filter, vad_parameters=vad_parameters)
    except Exception as e:
        res.error = f"whisper: {e}"
        return res
    _apply_whisper_result(res, w)
    verdict, hits = scan_explicit(res.lyrics, profanity)
    res.explicit, res.explicit_source, res.explicit_words = verdict, "keyword_scan", hits
    return res


# ---------- CSV ----------

CSV_COLUMNS = [
    "title", "artist", "source", "source_url", "isrc",
    "duration", "duration_sec",
    "language", "language_prob",
    "explicit", "explicit_source", "explicit_words",
    "lyrics_source", "confidence",
    "whisper_model", "whisper_avg_logprob", "whisper_no_speech_prob",
    "whisper_compression_ratio", "repetition_score",
    "lyrics", "error",
]


def append_csv(csv_path: Path, results: list[TrackResult]) -> None:
    new_file = not csv_path.exists()
    with csv_path.open("a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        if new_file:
            w.writeheader()
        for r in results:
            row = asdict(r)
            row["explicit_words"] = ", ".join(row["explicit_words"])
            row = {k: row.get(k, "") for k in CSV_COLUMNS}
            w.writerow(row)


# ---------- main ----------

def main() -> int:
    # Force UTF-8 stdout so non-ASCII lyrics don't crash the final JSON dump on Windows (cp1252 default).
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("inputs", nargs="+", help="Spotify URL, SoundCloud URL, or local audio file (one or more).")
    p.add_argument("--csv", type=Path, help="Append a row per track to this CSV.")
    p.add_argument("--txt-dir", type=Path, action="append", default=[],
                   help="Write per-track .txt files into this directory. May be passed multiple times to mirror to several destinations.")
    p.add_argument("--release-dir", type=Path,
                   help="Release folder (e.g. 'L:/My Drive/2026/DirtySnatcha - Rise EP'). Implies --txt-dir <release-dir>/lyrics and --csv <release-dir>/lyrics/lyrics.csv unless overridden.")
    p.add_argument("--release", help="Release folder name like 'DirtySnatcha - Rise EP'. Resolved via env DSR_RELEASES_ROOT (default L:/My Drive) + --release-year.")
    p.add_argument("--release-year", help="Year folder for --release. Default: current year.")
    p.add_argument("--whisper-model", default=os.environ.get("LYRIC_FLAGGER_MODEL", "medium"),
                   help="faster-whisper model size: tiny|base|small|medium|large-v3 (default: medium).")
    p.add_argument("--vocab", type=Path,
                   help="Path to a vocabulary/initial_prompt file (artist names, slang, ad libs). Boosts Whisper accuracy without fine-tuning.")
    p.add_argument("--no-vad", action="store_true",
                   help="Disable Whisper VAD filter. Use when VAD strips quiet/processed vocals (heavy bass, drops, vocal chops).")
    p.add_argument("--vad-music", action="store_true",
                   help="Music-tuned VAD: lower threshold + longer pad so quiet/processed vocals over heavy bass survive, "
                        "while instrumental drops still get skipped. Speeds up large-v3 dramatically (transcribes only vocal regions). "
                        "Overrides --no-vad when both are set.")
    p.add_argument("--lyrics-only", action="store_true", help="Print only the raw lyrics, no JSON.")
    args = p.parse_args()

    load_env()

    # Resolve --release / --release-dir into --csv + --txt-dir if user didn't pass them.
    release_dir = args.release_dir
    if release_dir is None and args.release:
        from datetime import date as _date
        year = args.release_year or str(_date.today().year)
        root = Path(os.environ.get("DSR_RELEASES_ROOT", r"L:/My Drive/DSR Releases"))
        release_dir = root / year / args.release
    if release_dir is not None:
        if not release_dir.exists():
            print(f"ERROR: --release-dir not found: {release_dir}", file=sys.stderr)
            print("       Run: python scripts/release/confirm_release.py --artist ... --title ... --date ... first.", file=sys.stderr)
            return 2
        lyrics_dir = release_dir / "lyrics"
        lyrics_dir.mkdir(parents=True, exist_ok=True)
        if not args.txt_dir:
            args.txt_dir = [lyrics_dir]
        if args.csv is None:
            args.csv = lyrics_dir / "lyrics.csv"

    profanity = load_profanity_list()
    if not profanity:
        print("WARN: profanity_list.txt missing or empty; explicit detection disabled.", file=sys.stderr)

    vocab_text = ""
    if args.vocab:
        if args.vocab.exists():
            vocab_text = args.vocab.read_text(encoding="utf-8").strip()
        else:
            print(f"WARN: vocab file not found: {args.vocab}", file=sys.stderr)

    # VAD mode: --vad-music wins over --no-vad. Music params relax Silero defaults
    # to keep quiet/processed vocals (the kind buried under DSR-style bass) while
    # still skipping pure-instrumental drops.
    if args.vad_music:
        vad_filter = True
        vad_parameters: Optional[dict] = {
            "threshold": 0.3,
            "min_speech_duration_ms": 100,
            "min_silence_duration_ms": 300,
            "speech_pad_ms": 800,
        }
    else:
        vad_filter = not args.no_vad
        vad_parameters = None

    results: list[TrackResult] = []
    for item in args.inputs:
        kind = classify(item)
        try:
            if kind == "spotify":
                r = handle_spotify(item, profanity)
            elif kind == "soundcloud":
                r = handle_audio_url(item, profanity, args.whisper_model, "soundcloud", vocab_text, vad_filter=vad_filter, vad_parameters=vad_parameters)
            elif kind == "url":
                r = handle_audio_url(item, profanity, args.whisper_model, "url", vocab_text, vad_filter=vad_filter, vad_parameters=vad_parameters)
            elif kind == "local":
                r = handle_local(item, profanity, args.whisper_model, vocab_text, vad_filter=vad_filter, vad_parameters=vad_parameters)
            else:
                r = TrackResult(source="unknown", source_url=item, error=f"Unrecognized input: {item}")
        except Exception as e:
            r = TrackResult(source=kind, source_url=item, error=f"unhandled: {e}")
        results.append(r)

    if args.csv:
        append_csv(args.csv, results)

    for txt_dir in args.txt_dir:
        txt_dir.mkdir(parents=True, exist_ok=True)
        for r in results:
            slug = re.sub(r"[^A-Za-z0-9_\-]+", "-", (r.title or "untitled")).lower()
            slug = re.sub(r"-+", "-", slug).strip("-") or "untitled"
            out = txt_dir / f"{slug}.txt"
            accuracy_block = ""
            if r.lyrics_source == "whisper":
                accuracy_block = (
                    f"Confidence: {r.confidence}\n"
                    f"  whisper_model:        {r.whisper_model}\n"
                    f"  avg_logprob:          {r.whisper_avg_logprob}   (closer to 0 = more confident; <-1.0 = shaky)\n"
                    f"  no_speech_prob:       {r.whisper_no_speech_prob}   (>0.5 = lots of non-speech audio)\n"
                    f"  compression_ratio:    {r.whisper_compression_ratio}   (>2.4 often = hallucination)\n"
                    f"  repetition_score:     {r.repetition_score}   (>0.4 = many duplicate lines)\n"
                    f"  language_prob:        {r.language_prob}\n"
                )
            header = (
                f"Title: {r.title}\n"
                f"Artist: {r.artist}\n"
                f"Source: {r.source} ({r.source_url})\n"
                f"Duration: {r.duration or '?'}\n"
                f"Language: {r.language or '?'}\n"
                f"Explicit: {r.explicit} (via {r.explicit_source or 'n/a'})\n"
                f"Explicit words found: {', '.join(r.explicit_words) if r.explicit_words else 'none'}\n"
                f"Lyrics source: {r.lyrics_source or 'n/a'}\n"
                + (accuracy_block if accuracy_block else f"Confidence: {r.confidence or 'n/a'}\n")
                + f"{'-' * 60}\n\n"
            )
            out.write_text(header + (r.lyrics or f"(no lyrics — error: {r.error})") + "\n", encoding="utf-8")

    if args.lyrics_only:
        for r in results:
            print(f"\n# {r.title} — {r.artist} [{r.language or '?'}, {r.explicit}]")
            print(r.lyrics or f"(error: {r.error})")
    else:
        print(json.dumps([asdict(r) for r in results], indent=2, ensure_ascii=False))

    return 0 if all(not r.error for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
