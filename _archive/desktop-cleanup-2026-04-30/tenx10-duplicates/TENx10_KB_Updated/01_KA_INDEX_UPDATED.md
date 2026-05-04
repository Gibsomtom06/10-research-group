# DSR PLATFORM — AI AGENT KNOWLEDGE ARCHITECTURE v2.1
# MASTER INDEX
# Updated: April 2026 (v2.1 — PS Automation Patch + WHOiSEE Profile)

---

## FILES

| File | Contents | Modules |
|---|---|---|
| KA_v2_Part1_Foundation.md | System Architecture, User Identity Model, Permissions, Onboarding Pipeline | 1, 2, 3, 4 |
| KA_v2_Part2_Booking_Money.md | Show Lifecycle State Machine, Booking Decision Engine, Financial Engine | 5, 6, 7 |
| KA_v2_Part3_DSP_Content_Voice.md | DSP Algorithmic Playbook, Touring Phases, Content & Asset Engine, Voice Profile System | 8, 9, 10, 11 |
| KA_v2_Part4_Releases_Alerts_Integrations.md | Release Cadence, A&R Demo Intake, Multi-Artist Logic, Alerts, Dashboard KPIs, Integration Specs | 12, 13, 14, 15, 16, 17 |
| KA_v2_Part5_Templates_Networks_Rules.md | Template Library, Industry Networks & Contacts, AI Agent Behavior Rules | 18, 19, 20 |
| KA_v2_Patch_PSIntegration.md | **PATCH v2.1** — Spotify PS API pipeline, 11 PS alert triggers, Daily DSP Interpretation Protocol, Artist-tier PS visibility | Patches 3, 15, 17, 20 |

---

## ALL 20 MODULES

| # | Module | File | Purpose |
|---|---|---|---|
| 1 | System Architecture & Data Flow | Part 1 | How user questions flow through the system to AI response |
| 2 | User Identity Model | Part 1 | Context object shapes per tier (artist/manager/label) |
| 3 | Permission & Access Logic | Part 1 + **PS Patch** | Who sees what — enforced at DB and AI level. PS patch adds artist-tier visibility rules. |
| 4 | Onboarding → Bible Pipeline | Part 1 | How onboarding answers become the auto-generated Operating Bible |
| 5 | Show Lifecycle State Machine | Part 2 | Every state a show passes through from offer to close |
| 6 | Booking Decision Engine | Part 2 | Accept/counter/decline logic with 6-step decision tree |
| 7 | Financial Engine | Part 2 | Commissions, deposits, settlements, CPT, tour-wide P&L |
| 8 | DSP Algorithmic Playbook | Part 3 | Platform-by-platform release week hacks + ongoing strategy |
| 9 | Touring Phase System | Part 3 | 4-phase marketing with auto-transitions and content rules |
| 10 | Content & Asset Engine | Part 3 | Asset upload/linking, content generation pipeline, video scripts |
| 11 | Voice Profile System | Part 3 | How AI writes in each artist's unique voice |
| 12 | Release Cadence & Decay Prevention | Part 4 | The 6-week rule, waterfall strategy, editorial pitch checklist |
| 13 | A&R Demo Intake (Configurable) | Part 4 | Submission scoring, voting system, label-configurable rules |
| 14 | Multi-Artist Context Switching | Part 4 | How AI handles manager/label rosters with multiple artists |
| 15 | Alert & Notification System | Part 4 + **PS Patch** | Trigger conditions, priority levels, delivery channels. PS patch adds 11 PS-specific alert triggers. |
| 16 | Dashboard KPIs by Tier | Part 4 | What each tier sees on their home dashboard |
| 17 | Integration & OAuth Specs | Part 4 + **PS Patch** | What data is pulled from which service, refresh rates. PS patch adds Spotify PS API cron pipeline. |
| 18 | Template Library | Part 5 | Promoter emails, social captions, all with variables |
| 19 | Industry Networks & Contacts | Part 5 | Festivals, promoter networks, support artists, rider specs |
| 20 | AI Agent Behavior Rules | Part 5 + **PS Patch** | Persona, tone, guardrails, escalation, context window management. PS patch adds 5-step Daily DSP Interpretation Protocol. |

---

## ARTIST PROFILES

| File | Artist | Status |
|---|---|---|
| 07_Artist_Bible.md | DirtySnatcha (Lee Bray) | ✅ Complete — primary test case |
| 26_WHOiSEE_Profile.md | WHOiSEE (Brett Hopkin) | ✅ New — DSP intelligence + voice profile + 14-day playbook |
| Dark Matter | Dark Matter (Chicago/Knoxville) | ❌ Pending |
| OZZTIN | OZZTIN | ❌ Pending |
| MAVIC | MAVIC | ❌ Pending |
| PRIYANX | PRIYANX | ❌ Pending |

---

## CHANGELOG: v2.0 → v2.1

### New Files Added
- **KA_v2_Patch_PSIntegration.md** — Spotify PS API automation patch across Modules 3, 15, 17, 20. Supersedes all manual Musicstax workflows.
- **26_WHOiSEE_Profile.md** — WHOiSEE artist profile: DSP snapshot, Popularity Score playbook, voice profile, 4-week content strategy, onboarding checklist.

### Module Patches (v2.1)
- **Module 17** — Spotify PS data pipeline: daily cron, `dsp_metrics` schema additions, baseline capture rule on catalog ingestion.
- **Module 15** — 11 new PS alert triggers: threshold approach (Release Radar, Discover Weekly), threshold crossed, decay signals, Artist PS decay/growth, baseline missing, momentum window.
- **Module 20** — 5-step Daily DSP Interpretation Protocol. AI converts raw PS data to plain-English briefing with dollar amounts and deadlines. Raw numbers never shown without context.
- **Module 3** — Artist-tier PS visibility: own Artist PS + Track PS visible with interpreted language. Comparative roster data, competitor benchmarks, and financial impact hidden from artist tier.

### Skills Installed
- **edm-booking-agent** — Installed to Claude skills directory. Booking Agent persona for bass music touring: routing, festival pitching, deal structure, radius clauses, data leverage strategy. Activates on booking, touring, guarantee, festival pitch queries.

---

## DSR REFERENCE DATA (Pre-Loaded for Test Case)

### Label Identity
- **Label:** DirtySnatcha Records
- **Artist (Owner):** DirtySnatcha (Lee Bray, aka Leigh Bray)
- **Origin:** England (UK-born, US-based)
- **Genre:** Dubstep, Riddim, Bass Music, Trap
- **Distribution:** Virgin Music Group (VMG) via Assets platform
- **Website:** dirtysnatcharecords.com
- **Tagline:** "PLAY SOME F*CKING DUBSTEP ‼️"

### Manager
- **Thomas Nalian** — thomas@dirtysnatcha.com / 248-765-1997
- Single point of approval for ALL show offers
- Commission: 10%

### Artist (Primary)
- **Lee Bray** (DirtySnatcha) — contact@dirtysnatcha.com / 586-277-2537
- Must sign off on all confirmed shows
- Monthly Listeners: ~8-9K (Feb 2026)
- Spotify Popularity: 28
- Spotify Followers: ~4,500
- Instagram: 11K followers
- SoundCloud: 6.5K + 2.5K (label) = 9K combined

### Booking Agents
- **Andrew** (AB Touring) — andrew@abtouring.com — Primary
- **Colton Anderson** (PRYSM) — colton@prysmtalentagency.com / 734-904-0224 — Legacy

### Technical IDs
- Meta Pixel: 701854965266742
- GA4: G-PPES7BDNF3
- Bandsintown API: 3c7e62970f53fe395752f55139bbd81a
- Bandsintown Smartlink: bnds.us/snzptw

### Label Roster
- OZZTIN (top label artist)
- MAVIC (top label artist)
- PRIYANX
- WHOISEE

### Current Tour: Take Me To Your Leader 2026
- 17 shows (1 completed)
- Total guaranteed income: ~$38,600
- Ad budget (DSR side): $850-1,350

---

*Master Index — Knowledge Architecture v2.1 | April 2026*
