# DirtySnatcha Records

The label. Organized **by release** (canonical).

## Folder rules

- `releases/<release-title>_<primary-artist>/` — one folder per release. Each has:
  - `metadata.yaml` (artists, ISRCs, release_date, splits, distributor, status)
  - `contract.pdf`
  - `masters/` (WAVs, stems)
  - `artwork/`
  - `marketing/`
- `operations/` — label-wide, release-agnostic stuff (royalty statements, distribution agreements, W9s, email config).
- `catalog-views/` — derived views (by-artist manifests, by-year indexes). NEVER duplicate files here; only pointers or index data.
- `brand/` — DSR label brand (logo, templates).

## The rule: one canonical home

A track belongs in exactly one release folder. To get "all Dark Matter releases," query Supabase (`SELECT * FROM artist_releases JOIN releases WHERE artist = 'Dark Matter'`), or look at the `catalog-views/by-artist/Dark Matter.md` manifest — never a duplicate folder.

## Roster (artists with DSR releases — managed via catalog, not folders)

Dark Matter, BBX, Kotrax, Yunit, Brainwash, Ozztin, Mavic, Azella, Zubah, Rivibes, Sloth & Chackk, Walter Wilde, Dimension, Carbin, plus any DSR-signed DirtySnatcha tracks.
