# DSR PLATFORM — AI AGENT KNOWLEDGE ARCHITECTURE v2.0
# MASTER INDEX
# Generated: March 2, 2026

---

## FILES

| File | Contents | Modules |
|---|---|---|
| KA_v2_Part1_Foundation.md | System Architecture, User Identity Model, Permissions, Onboarding Pipeline | 1, 2, 3, 4 |
| KA_v2_Part2_Booking_Money.md | Show Lifecycle State Machine, Booking Decision Engine, Financial Engine | 5, 6, 7 |
| KA_v2_Part3_DSP_Content_Voice.md | DSP Algorithmic Playbook, Touring Phases, Content & Asset Engine, Voice Profile System | 8, 9, 10, 11 |
| KA_v2_Part4_Releases_Alerts_Integrations.md | Release Cadence, A&R Demo Intake, Multi-Artist Logic, Alerts, Dashboard KPIs, Integration Specs | 12, 13, 14, 15, 16, 17 |
| KA_v2_Part5_Templates_Networks_Rules.md | Template Library, Industry Networks & Contacts, AI Agent Behavior Rules | 18, 19, 20 |

---

## ALL 20 MODULES

| # | Module | File | Purpose |
|---|---|---|---|
| 1 | System Architecture & Data Flow | Part 1 | How user questions flow through the system to AI response |
| 2 | User Identity Model | Part 1 | Context object shapes per tier (artist/manager/label) |
| 3 | Permission & Access Logic | Part 1 | Who sees what — enforced at DB and AI level |
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
| 15 | Alert & Notification System | Part 4 | Trigger conditions, priority levels, delivery channels |
| 16 | Dashboard KPIs by Tier | Part 4 | What each tier sees on their home dashboard |
| 17 | Integration & OAuth Specs | Part 4 | What data is pulled from which service, refresh rates |
| 18 | Template Library | Part 5 | Promoter emails, social captions, all with variables |
| 19 | Industry Networks & Contacts | Part 5 | Festivals, promoter networks, support artists, rider specs |
| 20 | AI Agent Behavior Rules | Part 5 | Persona, tone, guardrails, escalation, context window management |

---

## CHANGELOG: v1.0 → v2.0

### New Modules (Not in v1)
- **Module 2: User Identity Model** — Context objects per tier with full JSON schemas
- **Module 3: Permission & Access Logic** — Full permission matrix + AI enforcement rules
- **Module 5: Show Lifecycle State Machine** — Complete state flow from offer to close (v1 jumped from offer to phase system)
- **Module 7: Financial Engine** — Commission calc, payment tracking, settlement sheets, CPT, tour P&L
- **Module 11: Voice Profile System** — Per-artist voice profiles with JSON schema + generation rules
- **Module 14: Multi-Artist Context Switching** — Roster management, priority scoring, cross-artist briefings
- **Module 15: Alert & Notification System** — All trigger conditions consolidated with priority levels
- **Module 16: Dashboard KPIs by Tier** — What each tier sees on their home screen
- **Module 17: Integration & OAuth Specs** — Data pull specs, refresh rates, OAuth flow
- **Module 19: Industry Networks & Contacts** — Festival tracker, promoter directory, support pool, rider/hospitality

### Expanded Modules (Were in v1 but incomplete)
- **Module 4: Onboarding** — Added Bible auto-generation pipeline (onboarding answers → structured output)
- **Module 6: Booking Engine** — Added Step 6 (marketing budget check), promoter grading inputs, venue grading as separate system
- **Module 8: DSP Playbook** — Added VMG Smart Audience ads, algorithmic test group sizes, Popularity Index targets
- **Module 10: Content Engine** — Added full asset management system (upload, link, tag), video script templates, Shazam Spike ad scripts, content-to-approval pipeline
- **Module 13: A&R** — Added reach/quality/fit scoring scales with explicit criteria
- **Module 18: Templates** — Added back-to-back show template, deposit overdue, settlement, venue confirmation missing
- **Module 20: Agent Rules** — Added escalation protocol, context window token budget, module selection priority

### Corrections
- Fixed artist name: "Lee Silva" removed. Correct names: Lee Bray, Leigh Bray, or DirtySnatcha. No other aliases.
- White-labeled all templates with {variable} syntax instead of hardcoded DSR references
- Clarified 2/3 voting is DSR-ONLY, not a universal platform feature (was already noted in v1 but reinforced)

### Data From Original Documents Now Incorporated
- Technical rider details (exact equipment specs, hospitality items, Queen of England clause)
- Festival submission tracker framework
- Promoter network directory (by region)
- Collaboration/support artist pool with tier assignments
- Google Drive folder structure and naming conventions
- Commission structure (10/10/80) with agent tracking
- Contract types (Flat, VS, Bonus) with calculation logic
- AI Content Engine automation system reference
- VMG Smart Audience ad types (Fan Engagement vs Stream Growth)
- Market intelligence framework (city-by-city intel feeds back into system)

---

## DSR REFERENCE DATA (Pre-Loaded for Test Case)

This platform is being built with DirtySnatcha Records as the first test case. The following DSR-specific data should be pre-loaded into the Tier 3 label account:

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

*Master Index — Knowledge Architecture v2.0*
