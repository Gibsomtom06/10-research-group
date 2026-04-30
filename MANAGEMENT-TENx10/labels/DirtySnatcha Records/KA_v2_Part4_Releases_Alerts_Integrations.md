# DSR PLATFORM — AI AGENT KNOWLEDGE ARCHITECTURE v2.0
# PART 4: RELEASES, A&R, MULTI-ARTIST, ALERTS, DASHBOARDS, INTEGRATIONS
# Modules 12, 13, 14, 15, 16, 17

---

# MODULE 12: RELEASE CADENCE & DECAY PREVENTION

## The Decay Rule
No new ISRC every 6-8 weeks = Spotify Artist Quality Score decays. The AI agent tracks the last release date and auto-alerts at the 4-week mark.

## Release Cycle Timeline

| Milestone | When | Action |
|---|---|---|
| Track Finalized | 6 weeks before release | Master is done. Lock the release date. |
| Upload to Distributor | 4 weeks before release | Send to VMG/DistroKid/etc. |
| Pitch to Spotify Editorial | 3 weeks before release | Via S4A. Include genre, mood, story, tour dates. STORY not description. |
| Pre-Save Campaign Launch | 2 weeks before release | Create pre-save link. Launch Meta ads. |
| Content Tease | 1 week before release | Snippet on TikTok/IG. Build anticipation. |
| RELEASE DAY | Day 0 | Execute full DSP Playbook (Module 8). All 9 hacks go live. |
| Week 1 Monitoring | Day 1-7 | Track save ratio, PI, playlist adds daily. |
| Decay Alert | 4 weeks after release | AI alerts: "2 weeks to lock next release before decay." |

## Waterfall Strategy

Release singles individually, then bundle into EP/album using SAME ISRCs under a new UPC. The EP inherits all accumulated Track Quality Scores.

```
Single 1 (Week 0)  → ISRC-A, UPC-1 → Accumulates streams/saves
Single 2 (Week 6)  → ISRC-B, UPC-2 → Accumulates streams/saves
Single 3 (Week 12) → ISRC-C, UPC-3 → Accumulates streams/saves
    ↓
EP Release (Week 18) → ISRC-A + ISRC-B + ISRC-C + bonus tracks, UPC-4
    → EP launches as "new release" but carries ALL accumulated scores
    → Wait for Spotify to link ISRCs (48 hours) before taking down individual singles
```

## Editorial Pitch Checklist (Every Release)

- [ ] High-res artwork (3000x3000 minimum)
- [ ] Synced lyrics (Musixmatch)
- [ ] Canvas uploaded (Spotify — 3-8 sec loop)
- [ ] Clips uploaded (Spotify — 30-60 sec)
- [ ] Artist bio updated on all DSPs
- [ ] Pitch angle written (STORY not description)
- [ ] Similar artists tagged (e.g., Luci, Mersiv, Rezz)
- [ ] BPM/key/mood metadata complete
- [ ] ISRC registered
- [ ] ISWC if cover/flip (mechanical license via HFA/Songfile)
- [ ] BMI/ASCAP registration confirmed
- [ ] SoundExchange registration confirmed
- [ ] CMRRA/The MLC registration confirmed
- [ ] Pandora AAM recorded
- [ ] Amazon Alexa intro text written
- [ ] Discovery Mode enabled on release day
- [ ] Featured Track set on Pandora AMP
- [ ] YouTube Shorts created with track audio
- [ ] TikTok Sound made available
- [ ] SoundCloud posted + label reposted

## Multi-Distributor 48-Hour Rule

If switching distributors or re-uploading:
1. Upload to new distributor with IDENTICAL metadata
2. Wait for Spotify to link the ISRC (48 hours)
3. ONLY THEN take down from old distributor
4. Preserves all stream history and playlist placements

## Cover/Flip Protocol

1. Locate original ISWC (International Standard Musical Work Code)
2. Secure Mechanical License via HFA/Songfile
3. Link new ISRC to original ISWC in distributor portal
4. All royalties flow correctly to original songwriter
5. Tag correctly in editorial pitch: "cover" or "remix"

## 3-Pillar Rights Safety Net

1. **Performance Rights (BMI/ASCAP/SOCAN):** Composition protection. Generates ISWC.
2. **Reproduction Rights (CMRRA/The MLC):** Mechanical protection. Bridges ISRC to ISWC.
3. **Neighboring Rights (SoundExchange):** Sound recording protection. Verifies ISRC is "Broadcast Ready."

---

# MODULE 13: A&R DEMO INTAKE SYSTEM

## SCOPE: This is NOT a universal feature.
The 2/3 voting system is SPECIFIC to DirtySnatcha Records' demo submission process. It does NOT apply to booking decisions, marketing budgets, release scheduling, or any other feature. Other labels configure their own A&R rules during onboarding.

## DSR Demo Pipeline

### Step 1: Submission Intake
Artist submits via form (public on DSR website or in-platform):
- Artist name
- Track title
- Private SoundCloud or Google Drive link (streaming, NOT download)
- Genre/subgenre
- Social links (minimum: Spotify + 1 social)
- Brief track description (optional but weighted)

### Step 2: Auto-Scoring (AI Pre-Filter)

| Criteria | Weight | What It Measures | Data Source |
|---|---|---|---|
| Quality | 40% | Production value, mixdown, mastering, originality | Human review only |
| Reach | 30% | Monthly listeners, social following, engagement rate | Auto-pulled from Spotify API |
| Fit | 30% | Does this belong on this label? Genre alignment, brand fit | Human review only |

Each dimension scored 1-10. Composite = (Quality × 0.40) + (Reach × 0.30) + (Fit × 0.30)

### Reach Auto-Scoring Scale
- 8-10: 50K+ monthly listeners, 10K+ social, positive Google Trends
- 5-7: 10K-50K monthly listeners, 2K-10K social
- 3-4: 1K-10K monthly listeners, under 2K social
- 1-2: Under 1K monthly listeners

### Quality Scoring Scale
- 8-10: Release-ready mixdown, original sound design, professional mastering
- 5-7: Solid production, minor mixdown issues
- 3-4: Decent ideas but significant production gaps
- 1-2: Unfinished, poor mixdown, derivative

### Fit Scoring Scale
- 8-10: Core bass/electronic genre, aesthetic aligns with label brand, clear growth trajectory
- 5-7: Adjacent genre with crossover potential
- 3-4: Genre stretch, limited brand alignment
- 1-2: Wrong genre entirely

### Step 3: The Vote (DSR uses 2/3 rule)
3 decision-makers each vote:
- **YES** — I want this on the label
- **NO** — Pass
- **MAYBE** — Needs discussion (counts as abstain)

**Rule: 2 out of 3 YES = accepted. 2 out of 3 NO = rejected. Any other combination = discussion needed.**

Voting window: 72 hours from dossier push. No 2/3 decision → auto-escalate to Tie/Stalled queue.

### Step 4: Response
- **Accepted:** AI drafts acceptance email with next steps (contract, release timeline, asset requests)
- **Rejected:** AI drafts polite rejection. DSR tone: "Opinions are like assholes — everyone has one." User stays in portal to track future submissions.
- **Discussion:** Flag for team meeting. AI summarizes each voter's notes.

## Configurable for Other Labels

During Tier 3 onboarding, labels configure their own A&R:
- Number of decision-makers (1-5)
- Voting threshold (majority, unanimous, custom)
- Scoring criteria and weights (fully customizable)
- Whether to accept outside demos at all
- Auto-reject threshold (e.g., if Reach < 20, auto-reject without human review)

---

# MODULE 14: MULTI-ARTIST CONTEXT SWITCHING

## The Problem
A manager with 5 artists needs the AI to seamlessly switch between them. The daily briefing covers all 5. A question about "the Tampa show" needs to know which artist is playing Tampa.

## Context Switching Rules

1. **Default view:** Manager's dashboard shows ALL artists, sorted by urgency (nearest show date first).
2. **Explicit switch:** Manager says "switch to {artist_name}" or "what's happening with {artist_name}" → AI loads that artist's full context.
3. **Implicit switch:** Manager asks "how's the Tampa show?" → AI checks which artist has a Tampa show and loads that context. If multiple artists have Tampa shows, ask for clarification.
4. **Cross-roster queries:** "Compare DSP metrics for all my artists" or "which artist has the most urgent tasks?" → AI loads all artist contexts and compares.
5. **Return to overview:** "Go back to roster view" or "show me everything" → AI returns to multi-artist summary.

## Daily Briefing Format (Manager/Label Tier)

```
Good morning, {manager_name}. Here's your briefing for {date}.

🔴 URGENT — DO TODAY:
• [{artist_1}] Pittsburgh deposit is OVERDUE ($1,250). Follow up with promoter.
• [{artist_2}] Release decay deadline in 12 days. Lock next track by {date}.

🟡 THIS WEEK:
• [{artist_1}] Tampa show in 4 days. Final Push content queued — review and approve.
• [{artist_3}] Shazam Spike campaign launching tomorrow for {city}.

📊 ROSTER HEALTH:
| Artist | Monthly Listeners | PI | Next Show | Phase | Decay |
|--------|------------------|----|-----------|-------|-------|
| {artist_1} | {ML} ({change}) | {PI} | {city} in {days}d | {phase} | {days_to_decay}d |
| {artist_2} | {ML} ({change}) | {PI} | {city} in {days}d | {phase} | {days_to_decay}d |
| {artist_3} | {ML} ({change}) | {PI} | None booked | — | {days_to_decay}d |

💡 RECOMMENDATION:
{one strategic recommendation based on cross-roster analysis}
```

## Priority Scoring for Multi-Artist

When ranking across artists, the AI uses this priority score:

```
Priority = (show_urgency × 3) + (deposit_urgency × 2) + (decay_urgency × 2) + (content_urgency × 1)

Where:
    show_urgency = 10 if show in 0-3 days, 7 if 4-7 days, 4 if 8-14 days, 1 if 15+ days
    deposit_urgency = 10 if overdue, 5 if due this week, 0 if not due
    decay_urgency = 10 if < 7 days to decay, 5 if 7-14 days, 0 if 15+ days
    content_urgency = 5 if in Final Push with no approved content, 0 otherwise
```

---

# MODULE 15: ALERT & NOTIFICATION SYSTEM

## Alert Priority Levels

| Level | Color | Delivery | Examples |
|---|---|---|---|
| 🔴 CRITICAL | Red | Push notification + in-app + email | Deposit overdue, show in 48 hours with no contract, decay deadline tomorrow |
| 🟡 WARNING | Yellow | In-app + email | Show entering Final Push, content not approved, save ratio dropping |
| 🟢 INFO | Green | In-app only | Show announced, content approved, metrics update |

## Trigger Conditions

### Show Alerts
- Show in 7 days + no contract signed → 🔴 CRITICAL
- Show in 7 days + no deposit received → 🔴 CRITICAL
- Show in 14 days + no ticket link → 🟡 WARNING
- Show in 3 days + no advance sheet sent → 🔴 CRITICAL
- Show entering Final Push phase → 🟡 WARNING
- Show completed → 🟢 INFO + trigger promoter/venue grading

### Financial Alerts
- Deposit overdue (past due date) → 🔴 CRITICAL
- Deposit overdue 3+ days → 🔴 CRITICAL (escalated)
- Deposit overdue 7+ days → 🔴 CRITICAL (recommend cancellation)
- Final payment not received by show day → 🔴 CRITICAL

### DSP Alerts
- Save ratio dropped below 8% (target is 10%) → 🟡 WARNING
- Popularity Index dropped 5+ points → 🟡 WARNING
- Decay deadline in 14 days → 🟡 WARNING
- Decay deadline in 7 days → 🔴 CRITICAL
- Release day → 🟢 INFO + auto-generate DSP checklist

### Content Alerts
- Content calendar has gaps (no posts scheduled for 2+ days) → 🟡 WARNING
- Approved content ready to post → 🟢 INFO
- Content in queue for 48+ hours with no approval → 🟡 WARNING

### A&R Alerts (Label Tier Only)
- New demo submission received → 🟢 INFO
- Demo in voting queue for 48+ hours → 🟡 WARNING
- Vote deadline (72 hours) approaching → 🟡 WARNING
- Vote complete — demo accepted/rejected → 🟢 INFO

### Festival Alerts
- Festival submission deadline in 14 days → 🟡 WARNING
- Festival submission deadline in 3 days → 🔴 CRITICAL

---

# MODULE 16: DASHBOARD KPIs BY TIER

## Tier 1 — Artist Dashboard

**Top Bar:**
- Monthly Listeners (current + trend arrow)
- Spotify Popularity Index
- Next Show (city + days until)
- Decay Clock (days until next release needed)

**Cards:**
- Show Calendar (upcoming shows with phase badges)
- Latest Release Metrics (streams, saves, save ratio, playlist adds)
- Content Queue (pending approval / scheduled)
- Daily Tasks (AI-generated, ranked by urgency)
- Active Campaigns (running ads with spend and performance)

## Tier 2 — Manager Dashboard

**Top Bar:**
- Roster Size
- Total Guaranteed Income (all artists combined)
- Outstanding Deposits (count + total $)
- Next Show (across entire roster)

**Cards:**
- Roster Health Table (all artists: ML, PI, next show, phase, decay)
- Show Calendar (all artists, color-coded by artist)
- Financial Summary (total income, received, outstanding, commissions)
- Urgent Actions (cross-roster, ranked by priority score)
- Content Approval Queue (all artists combined)
- Promoter Tracker (grades, outstanding items per promoter)

## Tier 3 — Label Dashboard

**Everything in Tier 2 PLUS:**
- Release Pipeline (upcoming releases across catalog with timeline)
- A&R Submission Queue (new demos, voting status, scores)
- Marketing Budget Allocation (spend per artist, ROI tracking)
- Catalog Analytics (total streams, revenue, growth across roster)
- Permission Management (which artists see what)

---

# MODULE 17: INTEGRATION & OAUTH SPECS

## Required Integrations (MVP)

| Service | Data Pulled | Refresh Rate | Method |
|---|---|---|---|
| Spotify for Artists | Monthly listeners, followers, popularity, top cities, save counts, stream counts per track | Daily | OAuth + API |
| Apple Music for Artists | Shazam counts, listener counts, top cities | Daily | OAuth + API |
| Shazam for Artists | Shazam count by city, trending status | Daily | OAuth + API |
| Meta Ads Manager | Campaign performance (impressions, clicks, CTR, CPC, spend) | Real-time | API |
| Bandsintown | Show listings, RSVP counts, pixel tracking | Daily | API |
| Google Analytics (GA4) | Website traffic, ticket link clicks, UTM tracking | Real-time | API |

## Future Integrations (Post-MVP)

| Service | Purpose |
|---|---|
| Instagram Graph API | Auto-post scheduled content, pull engagement metrics |
| TikTok for Business | Pull view counts, sound re-uses, engagement |
| YouTube Studio | Pull Shorts views, audio re-use counts |
| Pandora AMP | Featured Track status, AAM plays |
| SoundCloud | Play counts, comment counts, repost counts |
| Google Drive | Sync show folders, asset library |
| Mailchimp / Laylo | Email/SMS list management, blast scheduling |

## Technical IDs (Template — Filled During Onboarding)

```json
{
  "artist_name": "{artist_name}",
  "integrations": {
    "meta_pixel_id": "{pixel_id}",
    "ga4_measurement_id": "{ga4_id}",
    "bandsintown_api_key": "{bt_api_key}",
    "bandsintown_smartlink": "{bt_smartlink}",
    "spotify_artist_uri": "spotify:artist:{id}",
    "apple_music_id": "{am_id}",
    "youtube_oac_id": "{yt_id}"
  }
}
```

## OAuth Data Flow

```
User clicks "Connect Spotify" in onboarding or settings
    → Redirects to Spotify OAuth consent screen
    → User grants permission
    → Platform receives access token + refresh token
    → Backend stores tokens in Supabase (encrypted)
    → Daily cron job pulls latest metrics using stored tokens
    → Metrics stored in dsp_metrics table with timestamp
    → AI agent reads latest metrics when assembling user context
```

---

*End of Part 4 — Releases, A&R, Multi-Artist, Alerts, Dashboards, Integrations*
