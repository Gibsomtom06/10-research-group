# DSP Playlists + Repost Chain — STUB / IN FUNNEL (operational components ship-ready)

**Date:** 2026-04-30 night
**Status:** Stub captured. Operational components (i.e. literally creating the playlists) could ship anytime — no build dependencies. Tooling components (repost-chain coordination agent) are BACKBURNERED until trading-shadow shadows graduate.
**Resume condition for tooling layer:** Trading-shadow Phase 0 graduation, OR explicit Thomas decision to pull it forward.

---

## What Thomas asked

> "also need to create spotify apple music playlist and soundcloud. i also want the repost chain to be created"

Translation: stand up DSR-branded playlists across the major DSPs (Spotify, Apple Music, SoundCloud) AND build the SoundCloud repost-chain network (peer-network mutual reposts that amplify catalog reach).

---

## Two layers, very different scopes

### Layer 1 — OPERATIONAL (no project, ship-ready)

| Task | What | Estimated time |
|---|---|---|
| Create "DSR Records" Spotify playlist | Existing DSR catalog tracks; cover art; description | 30 min |
| Create "DSR Records" Apple Music playlist | Same content; Apple's editorial submission process | 30 min |
| Create "DSR Records" SoundCloud playlist | Same; SoundCloud's social mechanics (likes/reposts visible) | 30 min |
| Genre/mood sub-playlists | "Heavy Bass," "Dubstep Drops," "Riddim Selects" — narrow themes that match algorithmic taxonomies | 1 hr each, plan 3-5 |
| Cross-artist roster playlists | "TENx10 Roster" or "Andrew Bass / DSR Roster" mixing DirtySnatcha + WHOiSEE + Dark Matter | 30 min |
| SoundCloud repost-chain network setup | Identify 8-12 peer artists/labels with overlapping audience; reach out individually to propose mutual-repost agreements; create a tracker spreadsheet | 4-6 hr over 2 weeks |

This work has **zero build dependencies**. Thomas can do it, or RJ Jackson agent can draft the outreach emails / playlist descriptions, or both.

### Layer 2 — TOOLING (BACKBURNERED — repost-chain coordination agent)

A future build that automates the repost-chain ops:
- Tracks which peer accounts have agreed to mutual reposts
- Monitors who actually reposts (vs. ghosts the deal)
- Schedules reposts so they're spread vs. clustered
- Surfaces grade-A peers (high-engagement reposters) vs grade-F (no-shows)
- Auto-drafts new outreach when a slot opens

This is genuinely useful but NOT trading-shadow-graduation-blocking. Captured as future work; resume after Phase 0 graduation.

---

## Strategist's pushback (captured 2026-04-30)

**Two assumptions:**
1. **Owned playlists move the algorithm.** Mostly NOT true at low follower counts. Own playlists are audience-retention tools, not discovery tools. The bigger Spotify lever is editorial submission + algorithmic placements (Discover Weekly = Track Popularity 30+; Release Radar = Track Popularity 20+ for non-followers). Module 8 (DSP Algorithmic Playbook) and Module 14 (Spotify Popularity Score) are the real frameworks for plays-driving.
2. **SoundCloud repost chains still work in 2026.** Repost networks have been gamed for years; quality > volume. Authentic peer-network reposts (from artists with overlapping audience) beat bought-repost-pack reposts by 10x. The operational work below is FINDING the right peers, not just adding follower count.

**Failure mode:** create "DSR Heat Bombs" playlist with 0 followers and 50 tracks, expecting it to drive plays. It won't. The playlist itself only matters as a curatorial SIGNAL (proves DSR is active and curating) — the actual work is GROWING the playlist's audience over months.

**Pursue/kill question:**

> **(a)** Drive plays to existing DSR catalog NOW → editorial submissions + Discover Weekly / Release Radar via Track PS thresholds are 10x more impactful than own-playlists. The Module 8 framework already covers this. Better lever for short-term revenue.
>
> **(b)** Build a CURATORIAL brand for DSR (multi-month follower-growth strategy where you become a recognized tastemaker in the bass scene) → own-playlists matter, BUT this is a 6-month bet, not a quick win.
>
> **(c)** Both, sequenced — execute Module 8 editorial submissions weekly (path a, gives short-term plays), AND launch own-playlists as a background slow-burn (path b, multi-month).

Most artist-managers default to (a) without realizing it. (b) is a separate strategic bet. (c) is the right answer if Thomas has bandwidth + believes in DSR-as-tastemaker.

---

## Existing portfolio connections to map

| Asset | Connection |
|---|---|
| **Module 8 — DSP Algorithmic Playbook** | Editorial submission process, playlist tier targeting, save-to-stream lever, decay management — already documents the "drive plays" path |
| **Module 14 — Spotify Popularity Score** | Track PS thresholds (20 = Release Radar, 30 = Discover Weekly) — own-playlists are NOT in this lever |
| **Module 25 — Catalog Evaluation Engine** | Playlist placement is a momentum signal in the evaluator |
| **RJ Jackson agent (CMO)** | Editorial pitching, cold outreach, social strategy — owns the brand-building voice for own-playlists |
| **DSR roster** (DirtySnatcha + WHOiSEE + Dark Matter + OZZTIN + MAVIC + PRIYANX + KOTRAX) | Source material for own-playlists, peer-network candidates for repost-chain |
| **Faceless music channel stub** | Same catalog; could feed both pipelines |

---

## What to do now (operational, no project required)

1. **Answer the pursue/kill question.** (a) / (b) / (c) — decide the strategic frame.
2. **If (a) or (c):** that's actually Module 8 work — pull the editorial submission checklist, ensure every release ships with proper editorial pitch + save campaign. No new playlist creation needed for short-term plays.
3. **If (b) or (c):** create the operational playlists this week. Manual work; can be done in 30-60 min each. Use RJ Jackson agent to draft playlist descriptions + cover-art briefs.

---

## What to NOT do

- Don't build the repost-chain coordination agent tonight — that's tooling, BACKBURNERED until graduation.
- Don't try to do both layers simultaneously — pick layer 1 first, layer 2 if layer 1 proves out the demand.
- Don't buy repost packages — they're spam, kill your SC reputation.

---

## When tooling layer resumes

Read this stub. Look at how the operational work actually evolved — is the repost-chain working in spreadsheet form? If yes, the tooling automates a known pattern. If no (the spreadsheet got abandoned), the tooling problem isn't real and the stub stays closed.

Tooling spec should include: peer registry, repost agreement tracker, scheduling logic (avoid cluster), grade-A/F peer scoring, auto-outreach for slot fills, integration with SoundCloud API.

---

*Stub spec v1 — 2026-04-30. Operational layer is ship-ready. Tooling layer waits for graduation.*
