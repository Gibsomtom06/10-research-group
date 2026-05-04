# KNOWLEDGE ARCHITECTURE — PATCH v2.1
## Popularity Score Automation + Artist Visibility Layer
### Generated: March 3, 2026 | Patches: Modules 3, 15, 17, 20
### Status: SUPERSEDES all previous manual Musicstax workflows

---

## WHAT THIS PATCH DOES

Formally integrates the Spotify API Direct + AI Interpretation Layer into the TENx10 Knowledge Architecture. No user should ever be asked to manually record a Popularity Score after this patch.

Patches four modules:
- **Module 17** — Spotify PS data pipeline spec
- **Module 15** — Threshold trigger rules and alert schemas
- **Module 20** — Daily DSP Interpretation Protocol
- **Module 3** — Artist-tier visibility rules for PS data

This patch is **additive** — no existing module content is removed.

---

## MODULE 17 PATCH — Integration Specs

### Addition: Popularity Score Pipeline

Add the following row to the Required Integrations table in Module 17:

| Service | Data Pulled | Refresh Rate | Method | Storage |
|---|---|---|---|---|
| Spotify Popularity Score | Artist PS (profile level) + Track PS per active ISRC | Daily — midnight cron | Spotify Web API: `GET /artists/{id}` → `popularity` field. `GET /tracks/{id}` → `popularity` field. Same OAuth token as S4A integration. | `dsp_metrics` table: `artist_ps`, `track_ps_by_isrc` (JSON), `ps_delta_1d`, `ps_delta_7d`, `captured_at` timestamp |

### Catalog Ingestion Baseline Rule

When a new artist is onboarded or a new release is added to the catalog, the system MUST capture a baseline PS reading within 24 hours of the track appearing on Spotify. This baseline becomes `day_0` for all future delta calculations. The AI agent cannot generate trajectory analysis without a `day_0` anchor.

### Data Schema — dsp_metrics table additions

```json
{
  "artist_id": "uuid",
  "captured_at": "2026-03-04T00:00:00Z",
  "artist_ps": 22,
  "artist_ps_delta_1d": +2,
  "artist_ps_delta_7d": +5,
  "artist_ps_delta_30d": -3,
  "track_scores": [
    {
      "isrc": "USRC12345678",
      "track_name": "Get Down",
      "release_date": "2026-03-04",
      "track_ps": 11,
      "track_ps_delta_1d": +11,
      "track_ps_delta_7d": null,
      "days_since_release": 0,
      "is_active_release": true
    },
    {
      "isrc": "USRC98765432",
      "track_name": "Magic - Original Mix",
      "release_date": "2025-11-15",
      "track_ps": 31,
      "track_ps_delta_1d": -1,
      "track_ps_delta_7d": -4,
      "days_since_release": 109,
      "is_active_release": true
    }
  ]
}
```

### Cron Job Spec

**Schedule:** Daily at 00:00 UTC

For each artist in `artists` table where `status = active`:
1. `GET /artists/{spotify_artist_id}` → store popularity as `artist_ps`
2. For each ISRC in catalog where `is_active_release = true`: `GET /tracks/{spotify_track_id}` → store as `track_ps`
3. Calculate deltas vs previous record
4. Write new row to `dsp_metrics`
5. Trigger alert evaluation (Module 15)
6. Flag daily briefing for AI interpretation (Module 20)

---

## MODULE 15 PATCH — Alert & Notification System

### Addition: Popularity Score Alert Triggers

All alerts fire immediately after the nightly cron job. Priority levels follow existing RED/YELLOW/GREEN conventions.

| Alert ID | Trigger Condition | Priority | Who Sees It | Auto-Action |
|---|---|---|---|---|
| `track_ps_release_radar_approach` | `track_ps >= 15 AND track_ps < 20 AND days_to_friday <= 3 AND days_since_release <= 14` | 🔴 RED | Manager + Artist | Insert into daily briefing with save campaign spend recommendation |
| `track_ps_release_radar_crossed` | `track_ps_delta_1d` pushes `track_ps` from <20 to >=20 | 🟢 GREEN | Manager + Artist | Briefing notification: Release Radar unlocked. Shift focus to Discover Weekly. |
| `track_ps_discover_weekly_approach` | `track_ps >= 25 AND track_ps < 30 AND days_to_monday <= 3` | 🔴 RED | Manager + Artist | Insert into briefing: push before Monday refresh |
| `track_ps_discover_weekly_crossed` | `track_ps_delta_1d` pushes `track_ps` from <30 to >=30 | 🟢 GREEN | Manager + Artist | Briefing: Discover Weekly unlocked. Reduce paid spend — organic should compound. |
| `track_ps_decay_active_release` | `track_ps_delta_7d <= -5 AND days_since_release <= 28` | 🔴 RED | Manager only | Alert: early decay signal. Check save-to-stream ratio. May indicate wrong audience or bad playlist placement. |
| `track_ps_decay_catalog` | `track_ps_delta_30d <= -8 AND days_since_release > 28` | 🟡 YELLOW | Manager only | Catalog decay. Consider Discovery Mode toggle or new release to restore Artist PS. |
| `artist_ps_decay` | `artist_ps_delta_7d <= -3` | 🟡 YELLOW | Manager only | Artist PS dropping. Check `days_since_last_release`. If >35 days, escalate to RED. |
| `artist_ps_decay_critical` | `artist_ps_delta_7d <= -3 AND days_since_last_release >= 35` | 🔴 RED | Manager only | Release cadence breach imminent. Artist PS decay compounding. Lock next release immediately. |
| `artist_ps_milestone` | `artist_ps` crosses 30, 40, or 50 | 🟢 GREEN | Manager + Artist | Milestone alert with context: what this score unlocks algorithmically. |
| `baseline_missing` | `is_active_release = true AND day_0_ps IS NULL AND days_since_release >= 1` | 🟡 YELLOW | Manager only | Baseline not captured for {track_name}. API pull may have failed. Retry. |
| `ps_momentum_window` | `track_ps_delta_1d >= +3` for 3 consecutive days | 🟢 GREEN | Manager + Artist | Momentum signal: {track_name} trending up {delta} pts/day. Sustain current strategy. |

**Alert Delivery Rules:**
- All PS alerts are inserted into the daily briefing (Module 20)
- RED alerts also trigger a push notification to the manager's mobile device
- Artist-tier users receive alerts via in-app notification center only — no push unless explicitly enabled

---

## MODULE 20 PATCH — Agent Behavior Rules

### Addition: Daily DSP Interpretation Protocol

**The Core Rule:** NEVER display a raw Popularity Score number without interpretation. Every PS value shown must be accompanied by: (1) what the number means, (2) the nearest threshold, (3) the gap to close, (4) the specific action that closes it.

### Daily DSP Interpretation Protocol — Step by Step

**STEP 1 — PULL**
- Load latest `dsp_metrics` record for the artist
- Extract: `artist_ps`, `artist_ps_delta_1d`, `artist_ps_delta_7d`
- Extract: `track_ps`, `track_ps_delta_1d` for each active ISRC
- Extract: `days_since_release` for each active ISRC

**STEP 2 — CALCULATE**
```
gap_to_release_radar = max(0, 20 - track_ps)
gap_to_discover_weekly = max(0, 30 - track_ps)
days_to_friday = calculate from today's date
days_to_monday = calculate from today's date
trajectory = 'rising' | 'flat' | 'decaying' based on delta_7d
```

**STEP 3 — CLASSIFY**
```
IF gap_to_release_radar <= 5 AND days_to_friday <= 3 → URGENT_WINDOW
IF gap_to_discover_weekly <= 5 AND days_to_monday <= 3 → URGENT_WINDOW
IF track_ps_delta_7d <= -5 AND days_since_release <= 28 → EARLY_DECAY
IF track_ps >= 30 → ALGORITHMIC_ACTIVE
IF artist_ps_delta_7d <= -3 → ARTIST_DECAY
IF artist_ps_delta_7d >= +3 → ARTIST_GROWTH
```

**STEP 4 — GENERATE RECOMMENDATION**
```
URGENT_WINDOW → 'Increase save campaign by $X before [day]'
EARLY_DECAY → 'Check save-to-stream ratio. Cut low-quality traffic sources.'
ALGORITHMIC_ACTIVE → 'Organic compounding. Reduce paid spend by 50%.'
ARTIST_DECAY → 'Lock next release. {X} days until critical decay threshold.'
```

**STEP 5 — FORMAT FOR BRIEFING**
- Insert into METRICS CHECK section
- Use plain English. No jargon. Specific numbers. Clear deadline.

**Example output:**
> "Get Down — Track PS: 17 (+6 from yesterday). Release Radar threshold is 20. Friday is 2 days away. Gap: 3 points. Add $35 to save campaign today to push past the threshold before Friday's refresh."

### PS Interpretation in Non-Briefing Contexts

If a user asks any question involving streams, saves, algorithm performance, or release momentum, the AI agent checks the latest `dsp_metrics` record and includes the current PS context in the response even if not directly asked. "How is Get Down doing?" always includes Track PS, trajectory, and nearest threshold — not just stream counts.

### Catalog Digest Integration

When generating a catalog digest or artist intelligence report, render a **PS Health Card** for each track:

```
Track name | Days since release | Current Track PS
Delta (1d, 7d, 30d) | Trajectory indicator (↑ ↓ →)
Nearest threshold | Gap | Recommended action
Discovery Mode status | Canvas status | Active campaign Y/N
```

The catalog digest PS Health Card replaces all manual Musicstax workflows. Generated automatically from `dsp_metrics` on demand or as part of weekly Sunday Bible regeneration.

---

## MODULE 3 PATCH — Permission & Access Logic

### Addition: Artist-Tier Popularity Score Visibility

Previously PS data was manager-only. This update grants artists meaningful visibility without exposing label-level financial or roster data.

| Data Point | Artist Tier | Manager Tier | Label Tier | Notes |
|---|---|---|---|---|
| Artist PS — current score | ✅ Visible | ✅ Visible | ✅ Visible | Shown with interpretation, never raw number alone |
| Artist PS — historical trend (30d chart) | ✅ Visible | ✅ Visible | ✅ Visible | Visual chart in artist dashboard |
| Artist PS — delta vs other roster artists | ❌ Hidden | ✅ Visible | ✅ Visible | Artists cannot see comparative roster data |
| Track PS — own tracks only | ✅ Visible | ✅ Visible | ✅ Visible | Artist sees only their own ISRCs |
| Track PS — other artists' tracks | ❌ Hidden | ✅ Visible | ✅ Visible | |
| Threshold proximity alerts | ✅ Visible | ✅ Visible | ✅ Visible | Artist sees RED/GREEN alerts for own tracks |
| Recommended actions (spend amounts) | ⚠️ View only | ✅ Full control | ✅ Full control | Artist can see but cannot trigger ad spend |
| Save-to-stream ratio | ✅ Visible | ✅ Visible | ✅ Visible | Shown with 10% threshold context |
| Decay alerts — own Artist PS | ✅ Visible | ✅ Visible | ✅ Visible | Framed constructively: 'time to release new music' |
| Decay alerts — financial impact | ❌ Hidden | ✅ Visible | ✅ Visible | CPT and booking rate implications hidden from artist |
| Competitor PS benchmarks | ❌ Hidden | ✅ Visible | ✅ Visible | |
| Label catalog PS overview | ❌ Hidden | ❌ Hidden | ✅ Visible | Label only |

### Artist Dashboard — PS Widget Spec

| Widget Component | What It Shows | Update Frequency |
|---|---|---|
| Artist PS Gauge | Animated 0–100 arc. Color: green ≥30, amber 20–29, red <20. Target marker at 30+. | Daily |
| Track PS Cards | One card per active release: current Track PS, 7-day delta arrow, trajectory bar, nearest threshold with gap count. | Daily |
| Threshold Map | Visual grid: Release Radar (20), Discover Weekly (30), test group milestones (30/40/50). Locked/close/unlocked status. | Daily |
| Next Action Banner | Plain-English instruction from Module 20 protocol. Example: 'Magic is 4 points from Discover Weekly. Ask Thomas to run a save campaign this week.' | Daily |
| 30-Day PS Chart | Line chart of Artist PS over 30 days. Release dates shown as vertical markers. | Daily |
| Momentum Feed | Chronological PS milestone events: 'Get Down crossed 20 — Release Radar unlocked'. | Event-driven |

### Artist-Facing Language Rules

| Situation | Manager Language | Artist Language |
|---|---|---|
| Track PS at 17, Release Radar at 20 | Get Down Track PS: 17. Gap: 3 points to Release Radar. Increase save campaign by $35 before Friday. | Get Down is 3 points away from getting pushed to new listeners automatically. Ask Thomas to boost the campaign this week — Friday is the deadline. |
| Artist PS decaying | Artist PS delta -4 in 7 days. Days since last release: 38. Cadence breach in 4 days. | Your Artist score is dipping — this is normal between releases. Time to start thinking about what drops next. Talk to Thomas about the next single. |
| Track PS crossed 30 | Get Down Track PS crossed 30 threshold. Discover Weekly active. Reduce paid spend 50%. | Get Down just hit a major milestone — Spotify is now putting it in front of new listeners automatically every Monday. The algorithm is working. Keep posting. |
| Magic PS sustaining | Magic Track PS: 31. Delta +0 (stable). Discovery Mode off. Canvas uploaded. | Magic is holding strong algorithmically. It's still reaching new people every week on its own. |

**Rule:** Artist-tier users should never feel like they are reading a technical dashboard. Every number is translated into a human sentence with a clear implication. The manager sees raw decision data. The artist sees what it means for them.

---

## PATCH SUMMARY — WHAT CHANGED

| Module | Before | After |
|---|---|---|
| Module 17 | Musicstax listed as manual monitoring tool. No automated PS pipeline. | Spotify API cron job pulls Artist PS + Track PS daily. Stored in `dsp_metrics` with delta fields. Baseline captured on catalog ingestion. |
| Module 15 | No PS-specific alert triggers. | 11 new alert conditions: threshold approach, crossing, decay, momentum, baseline capture failure. |
| Module 20 | Briefing included PS as a manual check item. No interpretation protocol. | Full 5-step Daily DSP Interpretation Protocol. AI converts raw PS data into plain-English recommendations with dollar amounts and deadlines. Raw numbers never shown without context. |
| Module 3 | PS data was manager-only. No artist visibility. | Artist tier gets full PS visibility for own tracks — gauges, charts, threshold maps, momentum feed — with translated language and view-only action recommendations. |

---

*KA Patch v2.1 | March 3, 2026 | Modules 3, 15, 17, 20 | TENx10 Platform*
