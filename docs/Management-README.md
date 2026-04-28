# Management

The artist management business. Organized **by artist** (canonical).

Each `clients/<artist>/` folder holds career-level work for that artist:
- `tours/` — tour routing, budgets, shows
- `releases-refs/` — pointers to release work that lives elsewhere (usually in `../../../DirtySnatcha Records/releases/` if signed to DSR, or external notes for releases on other labels)
- `merch/` — artist-branded merch
- `brand-assets/` — logos, photos, visual identity
- `mgmt-contracts/` — YOUR management agreement with the artist
- `career-dev/` — strategy, goals, analytics
- `socials/` — content calendar, platform accounts

## Release rule (no duplication)

When an artist has a release on DSR, the release files live in `DirtySnatcha Records/releases/<release>/`. Their `releases-refs/README.md` in this folder lists the release and points to the canonical location. For releases on external labels (e.g. Circus Records, FX), `releases-refs/` notes the label + reference only.

## Current clients

- **DirtySnatcha** — flagship managed artist. Some tracks on DSR, some elsewhere (e.g., Circus Records).
