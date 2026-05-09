# DSR Release Organizer (DAD workflow)

**Status:** spec, partially implemented (per-release skeleton + lyric-flagger live; legacy migration pending).
**Created:** 2026-05-06
**Owner:** DAD (Digital Asset Declutterer) — sibling product to TENx10. Today the logic lives in `scripts/release/` + `scripts/lyric-flagger/`; production home will be `products/system-steward/` (DAD precursor) and eventually a DAD UI.

---

## Problem

DSR's release files are scattered across multiple Drive folders, OneDrive, Desktop, Downloads, and the legacy "DSR Releases" Drive folder (40+ flat releases mixed with year-folder approach we just adopted for 2026). Plus DirtySnatcha-the-artist's catalog is split between DSR releases and releases on other labels (Disciple, Wakaan, etc.) with no single artist view. Files get re-uploaded, duplicated, lost. Finding "the master for that 2024 Dark Matter EP" takes 15 minutes of hunting.

DAD's pitch is exactly this: clean a chaotic drive into a canonical structure, autonomously, with human approval at each batch. Music-label release organization is the first concrete workflow.

## Canonical hierarchy (locked 2026-05-06)

```
[Shared Drive: 0AFR5kVe9DGXCUk9PVA, owner thomas@dirtysnatcharecords.com]
├── DSR Releases/                              ACTIVE label catalog
│   └── <YYYY>/<Artist> - <Title>/             canonical home for DSR releases
│       ├── <track>.wav                        masters at top (flat — no audio/ subfolder)
│       ├── <Artist> <Title> Contract.docx
│       ├── <Artist> <Title> Contract SIGNED.pdf
│       ├── cover/banner/spotify art.jpg
│       ├── metadata.yaml                      single source of truth for ISRC/UPC/splits
│       └── lyrics/                            lyric-flagger output (only tooling subfolder)
│           ├── lyrics.csv
│           └── <track-slug>.txt
├── _DSR Releases (legacy)/                    pre-2026 flat releases pending migration
├── <Artist>/                                  per-artist catalog folder (1:1 with DSR-signed artists)
│   └── <YYYY>/
│       ├── <Artist - Title>                   Drive shortcut to DSR Releases/<year>/<...> (NEVER copy)
│       └── (non-DSR releases live here canonically — released on other labels)
├── DS Offers/, Assets/, Bookings/, etc.       (unrelated; do not touch)
```

**Two key invariants:**
1. **One canonical home.** A release file lives in exactly one place. Other views are Drive shortcuts, never duplicated bytes.
2. **Per-artist views via shortcuts.** Each DSR-signed artist gets a folder; their DSR releases appear there as shortcuts to the DSR canonical location. Their non-DSR releases (released on other labels) are canonical in the artist folder since they don't belong to DSR's catalog.

## Tooling already shipped (2026-05-06)

| Script | Role |
|---|---|
| `scripts/release/confirm_release.py` | Creates `DSR Releases/<year>/<Artist - Title>/` skeleton + `lyrics/` subfolder + seeds `metadata.yaml` from CLI args. Idempotent. **Auto-runs `lyric_flagger.py` on any audio at the top of the release folder** (default behaviour; pass `--no-lyrics` to skip). Skips re-runs over `human-verified` files. |
| `scripts/release/drive_shortcut.py` | Creates Drive shortcuts (mimeType `application/vnd.google-apps.shortcut`) — used to populate per-artist folders without duplicating bytes. Uses tenx10 cloud project's OAuth client (auto-loaded from `tenx10-platform/.env.local`). |
| `scripts/lyric-flagger/lyric_flagger.py` | Pulls SoundCloud / Spotify URL or local audio → lyrics + language + explicit-flag + duration via Whisper / LRCLIB / Spotify API. Auto-resolves `--release "<name>" --release-year YYYY` to the canonical lyrics dir. |
| `scripts/lyric-flagger/vocab/<artist>-<release>.txt` | Per-release vocabulary prime for Whisper. Auto-located by `confirm_release.py`. Add corrected hooks/genre terms here for repeat artists so future EPs inherit them. |
| Memory: `reference_dsr_release_storage.md` | Authoritative reference for the hierarchy + shortcut rule. |

The end-to-end "confirm a new release" flow is live: see Rise EP at `L:/My Drive/DSR Releases/2026/DirtySnatcha - Rise EP/` (with shortcut at `L:/My Drive/DirtySnatcha/2026/`).

## What still needs to be built (DAD migration)

### Phase 0 — Inventory (read-only)

`products/system-steward/dsr_release_organizer.py --scan`

Walks:
- The DSR shared drive (`_DSR Releases (legacy)/`, plus stragglers anywhere else under root that match release-folder shape).
- Local roots on Thomas's PCs: OneDrive umbrella, Desktop, Downloads, both Drive desktop mounts. (Other PC scope TBD per Thomas.)

For each candidate release folder, infers:
- `artist` — from folder name `<Artist> - <Title>` parse, fallback to contained contract / metadata.yaml.
- `title` — same parse.
- `year` — from contract date (best), file modtime cluster (fallback), folder creation date (last resort).
- `is_dsr` — true if there's a DSR contract or contained metadata.yaml says `label: DirtySnatcha Records`.
- `proposed_target_path` — `DSR Releases/<year>/<Artist - Title>/` if DSR; `<Artist>/<year>/<Artist - Title>/` if non-DSR.
- `confidence` — high/medium/low based on signal quality.

Output: `MIGRATION_MANIFEST.csv` with `current_path | proposed_path | year | confidence | notes`. **No moves.**

### Phase 1 — Review + apply (per batch, with human OK)

`products/system-steward/dsr_release_organizer.py --apply --manifest MIGRATION_MANIFEST.csv --batch <name>`

- Splits the manifest into batches (e.g., by year, by artist, by confidence band).
- Each batch: dry-run preview → human confirms → moves applied → audit log written.
- Rollback log lets us undo any batch if something looks wrong.
- After moves, generates artist-folder shortcuts for each migrated DSR release where the artist has a folder.

### Phase 2 — Local PC sync

For each artist's local working files (DAWs, sample folders, etc.), the same scanner mirrors what's on Drive vs. local. Three actions per orphan:
- Move into Drive canonical (most common).
- Archive in `_archive_local/` (for stems / project files Drive shouldn't hold).
- Leave alone (working files mid-edit).

### Phase 3 — Recurring sweeps

Run as a DAD cron after the user approves: weekly scan, surface anything off-canonical, batch-confirm fixes. This is where DAD earns its keep — drift never accumulates again.

## Open questions

1. **Other PC scope.** Should the local-roots scan run on the second PC the same way? Need its drive mount paths and any non-OneDrive working dirs.
2. **Non-DSR DirtySnatcha releases.** Where are the masters today? (Personal Drive folder? Old OneDrive? Email attachments?) Need a list of where to look.
3. **Other artists' folders.** Same shortcut pattern for Dark Matter, BBX, Kotrax, Kaime, etc.? Or DirtySnatcha-only for now?
4. **Legacy folder strategy.** After Phase 1 migrates everything out, do we delete `_DSR Releases (legacy)/` or leave it as a frozen archive?

## Why DAD owns this

DAD's pitch is "I run 4 businesses out of one drive, watch me clean it autonomously." The DSR release workflow is the most concrete, highest-stakes example: the assets are valuable (released music), the chaos is real (40+ legacy folders), the rule is crisp (canonical + shortcut), and the audience cares (other label owners face the same mess). When DAD ships, this workflow becomes the demo.
