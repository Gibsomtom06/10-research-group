# SPOTIFY POPULARITY SCORE SYSTEM — DSR INTELLIGENCE UPDATE
## Replacing "Hidden Score" / Generic "Popularity Index" Terminology
### Updated: March 2, 2026

---

## WHAT CHANGED AND WHY

The previous knowledge base used vague terminology — "Track Quality Score," "Artist Quality Score," "Popularity Index (PI)" — which conflated Spotify's internal scoring into one generic concept. In reality, Spotify operates **two separate Popularity Scores** that function differently, have different thresholds, and require different strategies to spike.

This document replaces all previous Popularity Index / hidden score references with the correct dual-score system.

---

## THE TWO SPOTIFY POPULARITY SCORES

### 1. Artist Popularity Score (Profile Level)
- **What it is:** A 0–100 score assigned to the DirtySnatcha **artist profile** on Spotify
- **What drives it:** Aggregate recent engagement across your entire catalog — streams, saves, playlist adds, search volume, follower growth, skip rates. Recent activity weighted far more than historical.
- **Current DirtySnatcha score:** 28
- **Where to check:** https://metrics.musicstax.com (not visible in Spotify for Artists or the Spotify app)
- **Update frequency:** Approximately every 24 hours
- **Why it matters:** A higher Artist Popularity Score gives every new release a larger algorithmic test group. At 28, DirtySnatcha's new tracks get tested with ~500 listeners. At 40+, that jumps to ~5,000. The score is the multiplier on everything else.

### 2. Track Popularity Score (ISRC Level)
- **What it is:** A 0–100 score assigned to each individual **track** (tied to ISRC)
- **What drives it:** Recent streams, saves, playlist adds, completion rate, skip rate, and share activity — all for that specific track. Recency is king — a track with 1M streams last year but none this month scores lower than a new track with 10K streams this week.
- **Where to check:** https://metrics.musicstax.com or Spotify API via third-party tools (SubmitHub Popularity Checker, artist.tools, Chartmetric)
- **Update frequency:** Approximately every 24 hours
- **Why it matters:** Track Popularity Score determines whether a specific song gets pushed into algorithmic playlists for non-followers.

---

## CRITICAL THRESHOLD TRIGGERS

These are the numbers that matter. The entire promotional strategy should be oriented around pushing past these thresholds at the right time.

| Score | What Unlocks | Timing Consideration |
|-------|-------------|---------------------|
| **Track 20+** | **Release Radar for non-followers.** Below 20, you only appear on Release Radar for existing followers. Above 20, Spotify starts testing your track with non-followers. | Release Radar refreshes every **Friday**. If your track is approaching 20 mid-week, intensify promotional spend to push past the threshold before Friday's refresh. |
| **Track 30+** | **Discover Weekly placement.** This is the major unlock — Spotify starts inserting your track into personalized Discover Weekly playlists for listeners who match your sound profile. | Discover Weekly refreshes every **Monday**. If approaching 30 heading into a weekend, push hard to cross the line before Monday's refresh. |
| **Artist 30+** | **Algorithmic test groups expand to ~1,000+ listeners** per new release. Below 30, new ISRCs get minimal testing (~100-500 listeners). Above 30, every new release gets a meaningful shot. | This is cumulative — driven by consistent release cadence, not single-track spikes. |
| **Artist 40+** | **Strong algorithmic push.** Test groups of ~5,000 listeners. Release Radar delivery expands. Radio/mix placement becomes likely. | Requires sustained momentum across multiple releases. |

---

## POPULARITY SCORE SPIKING STRATEGY

### The Core Principle
The Popularity Score rewards **concentrated momentum from the right listeners**, not raw volume from passive audiences. 100 saves from genuine bass music fans > 10,000 streams from a random playlist with 50% skip rate.

### What Moves the Score UP
1. **Saves** — Strongest intent signal. A save says "I want to hear this again." This is why the Meta Ads save campaign is the #1 priority.
2. **User playlist adds** — When a listener adds your track to their personal playlist, it signals deep engagement.
3. **Repeat listening** — Same listener coming back multiple times = strong signal.
4. **Low skip rate** — Listeners completing the full track (or close to it). Skip before 30 seconds is actively harmful.
5. **Active search** — People typing "DirtySnatcha" into Spotify search is the #1 driver of Artist Popularity Score specifically. Every social post should drive people to search, not click a link.
6. **Concentrated timing** — 500 saves in 3 days moves the score more than 500 saves over 3 months.

### What Kills the Score
1. **Passive playlist streams** — Low-quality playlists where listeners skip or don't engage. Inflated stream count + bad engagement = score drops.
2. **Fake/bot traffic** — Spotify detects this. Score tanks, and recovery is slow.
3. **Wrong audience** — Driving pop fans to a dubstep track. They skip, they don't save, the algorithm learns your track doesn't resonate.
4. **Silence between releases** — No new ISRC in 6-8 weeks = Artist Popularity Score decays.
5. **Geographic mismatch** — Streams from regions that don't match your tour markets or genre profile look suspicious.

### The Spiking Playbook (Release Week)

**Days 1-3: Controlled Burn**
- Activate all owned channels: Instagram, TikTok, email list, Discord
- CTA should be **"Search DirtySnatcha on Spotify"** not a direct link — search activity directly boosts Artist Popularity Score
- Launch Meta Ads save campaign ($50-100, targeting tour markets + bass music fans)
- Toggle Discovery Mode ON
- Upload Canvas + Clips

**Days 3-5: Momentum Check**
- Check Track Popularity Score on Musicstax daily
- If approaching 20 and it's mid-week → increase ad spend to push past threshold before Friday (Release Radar refresh)
- If approaching 30 and it's late week → push hard before Monday (Discover Weekly refresh)
- Monitor save-to-stream ratio (target >10%)

**Days 5-7: Sustain or Pivot**
- If score is rising: maintain spend, let algorithmic placement compound
- If score is flat despite spend: shift budget to best-performing creative, or reallocate to Shazam spike
- If score is dropping: check for bad playlist placements or high skip rates, cut any low-quality traffic sources immediately

**Days 7-14: Algorithmic Handoff**
- If track hit 20+ or 30+, algorithmic playlists should be kicking in
- Reduce paid spend gradually — organic algorithmic streams should be replacing paid traffic
- Monitor for decay — if score starts dropping, short burst of save campaign can re-spike

---

## MONITORING TOOLS

| Tool | What It Shows | Cost | URL |
|------|--------------|------|-----|
| **Musicstax Metrics** | Artist + Track Popularity Scores, historical trends, health indicators | Free (basic) / Paid (advanced) | https://metrics.musicstax.com |
| **SubmitHub Checker** | Quick Track Popularity Score lookup | Free | https://www.submithub.com/popularity-checker |
| **artist.tools** | Real-time Popularity Score tracking, charts | Free/Paid | https://www.artist.tools |
| **Spotify for Artists** | Streams, saves, listeners, cities (but NOT Popularity Score directly) | Free | https://artists.spotify.com |

**Daily monitoring protocol during release week:**
1. Morning: Check Musicstax for overnight Popularity Score movement
2. Afternoon: Check S4A for save-to-stream ratio
3. Evening: Check Meta Ads Manager for campaign performance
4. Decision: Increase/maintain/reduce spend based on score trajectory vs. threshold proximity

---

## UPDATED POPULARITY SCORE TARGETS (Replaces Old "PI Targets" Table)

### Track Popularity Score Targets

| Current Score | Target | Action | Timeline |
|--------------|--------|--------|----------|
| 0-10 | 20+ | Heavy save campaign + Discovery Mode + Canvas + social push. Goal: cross Release Radar threshold. | Days 1-7 post-release |
| 10-20 | 20+ before Friday | Intensify spend if mid-week. Release Radar refresh = Friday. Every save counts. | Urgent — before next Friday |
| 20-30 | 30+ before Monday | You're on Release Radar for non-followers. Now push for Discover Weekly (refreshes Monday). | Days 7-14 post-release |
| 30-50 | Sustain 30+ | You're in Discover Weekly territory. Maintain momentum, focus on editorial pitch, reduce paid spend as organic kicks in. | Weeks 2-4 |
| 50+ | Maintain | Organic momentum is working. Monitor for decay. Re-spike if it drops below 30. | Ongoing |

### Artist Popularity Score Targets

| Current Score | Target | Action | Timeline |
|--------------|--------|--------|----------|
| 28 (current) | 35+ | Consistent release cadence (every 6 weeks), save campaigns on every release, drive search activity via social CTAs | Next 3 months |
| 35+ | 45+ | Maintain cadence, compound algorithmic gains from each release, grow follower base through live shows + ads | 6 months |
| 45+ | 55+ | At this level, every new release gets serious algorithmic testing. Focus shifts to editorial relationships and sustaining momentum. | 12 months |

---

## HOW THIS INTEGRATES WITH EXISTING DSR SYSTEMS

### Booking Decision Engine (Module 6)
- When evaluating show offers, factor in: does this market help or hurt the Popularity Score? Shows in cities where we have active listeners compound the score. Shows in random markets with no listener base = wasted effort from a Popularity Score perspective.

### Release Cadence (Module 12)
- The 6-week release rule isn't just about "decay" — it's about Artist Popularity Score decay specifically. Every 6-8 weeks without a new ISRC, the Artist Popularity Score drops, which means the NEXT release gets a smaller test group. The cadence rule protects the multiplier.

### Content Engine (Module 10)
- Social CTAs should prioritize **"Search DirtySnatcha on Spotify"** over direct links. Direct links bypass the search signal. Search activity is the #1 driver of Artist Popularity Score.

### Meta Ads Strategy
- Save campaigns aren't just about save-to-stream ratio — they're about pushing Track Popularity Score past 20 (Release Radar) and 30 (Discover Weekly) at the right time relative to playlist refresh days (Friday and Monday).

### Financial Engine (Module 7)
- Musicstax Metrics should be added to the daily monitoring stack alongside S4A, Meta Ads Manager, and Bandsintown. It's the only way to see the actual Popularity Scores that drive algorithmic placement.

---

## CURRENT STATUS: "DRUGS IN DA CLUB"

- **Release date:** February 27, 2026
- **Artist Popularity Score:** 28
- **Track Popularity Score:** Check Musicstax immediately — this is Day 3 post-release, the critical window
- **Save campaign status:** Should be live (DSR_RadioPriming_DITC_Mar2026)
- **Immediate action:** Check if Track PS is approaching 20. If close, increase spend before Friday's Release Radar refresh.

---

## TERMINOLOGY CHANGELOG

| Old Term (Retire) | New Term (Use) | Notes |
|-------------------|---------------|-------|
| Hidden Score | Spotify Popularity Score | It's not "hidden" — it's just not shown in the Spotify app. Checkable via Musicstax. |
| Popularity Index (PI) | Track Popularity Score or Artist Popularity Score | Always specify WHICH level. They're different scores with different drivers. |
| Track Quality Score | Track Popularity Score | "Quality Score" was our internal shorthand. The actual Spotify metric is Popularity Score. |
| Artist Quality Score | Artist Popularity Score | Same — use Spotify's actual terminology. |
| "Popularity 28" | Artist Popularity Score: 28 | Specify it's the artist-level score. |

---

*Source: Spotify API documentation, Musicstax Metrics, LoudLab.org algorithmic analysis, industry consensus from multiple 2025-2026 sources. Video reference: https://www.youtube.com/watch?v=N5LA8ve6iA4*

*DSR Platform — Popularity Score Intelligence Update v1.0*
*March 2, 2026*
