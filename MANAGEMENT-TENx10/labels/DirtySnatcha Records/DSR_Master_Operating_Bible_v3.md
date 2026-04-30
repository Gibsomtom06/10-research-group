# DIRTYSNATCHA RECORDS — COMPLETE MASTER OPERATING BIBLE
## For NotebookLM / AI Agent Training
### Generated: March 1, 2026 | Version: 3.0 (Unified)

---

# SECTION 1: CORE IDENTITY & PEOPLE

## Brand Identity
- **Brand:** DirtySnatcha Records
- **Artist:** DirtySnatcha (Lee Silva, aka Leigh Bray)
- **Origin:** England (UK-born, US-based)
- **Genre Focus:** Dubstep, Riddim, Bass Music, Trap
- **Label Founded:** DirtySnatcha Records
- **Distribution:** Virgin Music Group (VMG) via Assets platform
- **Website:** dirtysnatcharecords.com
- **Label Email:** demos@dirtysnatcha.com
- **Tagline:** "PLAY SOME F*CKING DUBSTEP‼️"
- **Release Philosophy:** Single → EP → LP. Long-term artist growth, not quick releases.
- **Tone:** Professional, blunt, authentic. Real-talk over corporate fluff.
- **Decision Philosophy:** "Opinions are like assholes — everyone has one." Decisions based on fit and data, not personal taste.
- **North Star Metric:** Cost Per Ticket Sold (CPT). Every dollar of ad spend must be traceable to ticket sales.

## Key People & Roles

| Person | Role | Contact | Authority |
|:-------|:-----|:--------|:----------|
| Thomas Nalian | Manager | thomas@dirtysnatcha.com / 248-765-1997 | Single point of approval for ALL show offers. Co-owner of promoter grading backend. |
| Leigh Bray (DirtySnatcha / Lee Silva) | Artist | contact@dirtysnatcha.com / 586-277-2537 | Must sign off on all confirmed shows. On-site contact. Co-owner of promoter grading backend. |
| Andrew | Primary Booking Agent (AB Touring) | andrew@abtouring.com | Submits offers into system. Does NOT have final approval authority. |
| Colton Anderson | Legacy Booking Agent (PRYSM) | colton@prysmtalentagency.com / 734-904-0224 | Still commissionable on shows he books. Submits via same intake process. |
| Label Partners (x3) | A&R Voters | Dashboard access | 2/3 majority vote required to approve any submission or contract. |

## Agencies
- **PRYSM Talent Agency** — Legacy booking agency
- **AB Touring (Artist Based Touring)** — Current primary booking agency

## Current Metrics (February 2026)

### Spotify
- Monthly Listeners: ~8-9K (previously hit 10K milestone, event promo claims 12K)
- Followers: ~4,500
- Popularity Score: 28
- Notable: Has hit 1M+ total streams on platform

### SoundCloud
- Artist Profile: 6.5K followers
- Label Profile (DirtySnatcha Records): 2.5K followers
- Combined reach: ~9K followers

### Instagram
- Followers: 11K
- Following: 1.5K+
- Posts: 400+

### Facebook
- Active community group: "DirtySnatcha Bass Heads"

### Beatport
- Label ranked with artists: OZZTIN, MAVIC, DirtySnatcha, PRIYANX, WHOISEE

## Booking Rate Sheet Summary
- Guarantee Range: $1,500 - $5,000
- Average Guarantee: ~$2,500
- Festival Rate: $5,000
- Support Slot Rate: $1,500
- Commission: PRYSM/Agent 10%, Artist 80%, Manager 10%
- Backend Deals: 85% GBOR on some shows

## Commission Structure
Standard split: 10% to PRYSM (management), 10% to booking agent (TOM), remainder to LEE (artist). Every offer tagged with originating agent for commission tracking.

---

# SECTION 2: VOICE & CONTENT PROFILE

## Voice Characteristics (For AI Content Generation)
- **Tone:** Hype, raw, authentic, unapologetic, street/bass culture
- **Language:** Casual, uses profanity naturally ("f*cking"), slang
- **Emoji usage:** Fire 🔥, prayer hands 🙏, heavy use of exclamation marks ‼️
- **Capitalization:** Mixes caps for emphasis, brand name always "DirtySnatcha"
- **Length:** Short, punchy captions — rarely long paragraphs
- **Exceptions:** Longer heartfelt posts about personal milestones (Lost Lands, etc.)

## Caption Examples
1. "I played supersonic at the main stage at lost lands 🙏🔥🔥🔥" (show recap)
2. "PLAY SOME F*CKING DUBSTEP" (brand catchphrase, used on graphics)
3. Short hype captions for show announcements
4. Behind-the-scenes studio content with casual commentary
5. "Yo what's up" style talking-to-camera reels

## Content Types
1. Live show photos/videos — crowd shots, stage shots, laser/production
2. Music release artwork — album/single covers
3. Studio/production clips — DAW screenshots, production process
4. Festival set recordings, flip announcements
5. "PLAY SOME F*CKING DUBSTEP" branded graphics — compilation/mix promos
6. Personal/talking head reels — "Yo what's up" casual style
7. Carousel posts — show announcements, tour dates
8. Collaboration announcements — featuring other artists

## Visual Style
- Dark/neon aesthetic (purple, blue, green lasers)
- Heavy bass music imagery (speakers, waveforms, fire, skulls)
- Live performance energy
- Brand logo/watermark on graphics
- Mix of professional event photos and casual phone content

## Hashtag Patterns
- #dubstep #bass #bassmusic #riddim #edm
- #dirtysnatcha #playsomefckingdubstep
- #lostlands #basscanyon #excision (festival-specific)
- Typically 5-10 hashtags

## Audience Engagement Style
- Responds to comments casually
- Fans use heavy slang, bass culture language
- Community calls themselves "bass heads"
- High engagement on live show content and new music

---

# SECTION 3: UNIFIED 6-AGENT SYSTEM ARCHITECTURE

## System Overview
The unified system merges the DSR Centralized Portal and the Artist Bible Platform into one operating system. It operates on four layers:

| Layer | What It Is | Rule |
|:------|:-----------|:-----|
| Project Knowledge | Persistent background context — always loaded | If the agent needs it in every conversation, it lives here |
| MCP Connection | Live data from external tools and APIs | If data changes in real time and lives outside the system, connect via MCP |
| Skill | Reusable repeatable process — loaded only when relevant | If you repeat the same detailed process, make it a Skill |
| Subagent | Specialist agent with isolated context and one domain | If a task has its own domain, tools, and reports to the orchestrator |

## Unified Agent Map

| Agent | Domain | Key Skills |
|:------|:-------|:-----------|
| Agent 1: A&R | Music submission intake, scoring (Quality 40%/Reach 30%/Fit 30%), partner vote queue, user profile assignment | ar_scoring.py, Score A&R Submission, Assign User Profile Type |
| Agent 2: Bookings | Show offer intake, routing, negotiation, confirmation, contracts, financials, advance tracking, folder creation, promoter/venue grading | show_onboarding.py, show_commission.py, show_grading.py, show_status.py, show_competition.py |
| Agent 3: Tour Marketing | Campaign execution (4-phase system), ad operations, budget allocation, geo-targeting, CPT tracking, Smart Audience ads, DSP-aware targeting | show_budget.py, show_ad_copy.py, show_geo.py, show_cpt.py, meta-ads-analyzer skill |
| Agent 4: Creative & Content | Asset management, flyer generation (using tour support grid), social content calendars, release marketing calendars | show_content.py, show_support.py |
| Agent 5: Marketing & Promo | Promo team management, points/leaderboard, UGC verification, DSP growth automation | promo_points.py |
| Agent 6: Tech | API health, database integrity, voting logic enforcement (2/3 hard constraint), user records, audit logging, MCP monitoring | dsr_orchestrator.py |

## Workflow Pipeline
```
DEAL CONFIRMED → Agent 2 (Bookings/Onboarding) → Agent 2 (Financials/Docs) → Agent 4 (Creative) → Agent 3 (Tour Marketing) + Agent 4 (Social Content)
```

## Approval Chain
1. Thomas Nalian — Single point of approval for ALL show offers
2. Leigh Bray (DirtySnatcha) — Must sign off on all confirmed shows
3. Label Partners (x3) — 2/3 majority vote for A&R decisions

Nothing is confirmed without both Thomas and Leigh signing off. No A&R submission is approved without 2/3 partner vote.

---

# SECTION 4: LABEL OPERATIONS

## A&R Gate
- 2/3 majority vote from three label partners required to approve any submission or contract
- Voting window: 72 hours from dossier push. No 2/3 decision → auto-escalate to Tie/Stalled queue

## A&R Scoring Formula
```
Composite = (Quality × 0.40) + (Reach × 0.30) + (Fit × 0.30)
```
Each dimension scored 1-10. Composite determines queue priority.

### Quality (1-10)
- 8-10: Release-ready mixdown, original sound design, professional mastering, Shazam recognition or editorial playlist placement
- 5-7: Solid production, minor mixdown issues, some playlist traction
- 3-4: Decent ideas but significant production gaps
- 1-2: Unfinished, poor mixdown, derivative

### Reach (1-10)
- 8-10: 50K+ monthly listeners, 10K+ social following, positive Google Trends
- 5-7: 10K-50K monthly listeners, 2K-10K social
- 3-4: 1K-10K monthly listeners, under 2K social
- 1-2: Under 1K monthly listeners

### Fit (1-10)
- 8-10: Core bass/electronic genre, aesthetic aligns with DSR brand, clear growth trajectory
- 5-7: Adjacent genre with crossover potential
- 3-4: Genre stretch, limited brand alignment
- 1-2: Wrong genre entirely

## Acceptance Path
Approved submissions trigger automated contract generation + Project Room unlock (WAVs, stems, marketing plans).

## Rejection Path
Rejected submissions receive thank-you email with the "opinions are like assholes" disclaimer. User stays in portal to track future submissions.

## Waitlist Logic
Singles may be signed but held for Compilation Queue to fill release schedule gaps.

## Release Path
Artist progresses: Single → EP → LP. Tracked from demo to Takeover eligibility.

---

# SECTION 5: SHOW BOOKING SYSTEM

## Show Offer Required Fields (Hard Gate)
An offer is NOT added to Thomas's review queue unless ALL of these fields are present:

| Field | Requirement |
|:------|:------------|
| Show Date | Required |
| Gig Type | Headline / Support / Festival / Other |
| Venue Name | Required |
| Venue City + State | Required |
| Venue Capacity | Required |
| Guarantee ($) | Required |
| Deposit Amount ($) | Required |
| Deposit Due Date | Required |
| Final Payment Due Date | Required |
| Venue Support Budget ($) | Required |
| Marketing Budget ($) | Required — must itemize: Digital Ads / Creative / Street Team |
| Other Artists on the Bill | Required |
| Promoter Name + Email + Phone | Required |
| Agent Who Originated Offer | Andrew / Colton / Thomas / Direct |

## Contract Types

| Type | Description | Example |
|:-----|:------------|:--------|
| Flat | Fixed guarantee regardless of ticket sales | $2,000 flat |
| VS | Guarantee vs percentage of net (whichever is higher) | $1,500 vs 90% NET |
| Bonus | Flat guarantee + bonus after threshold | $1,600 + bonus after 200 sold |

## Financial Tracking Per Show
- guarantee, contract_type, bonus_threshold, bonus_amount
- deposit_amount, deposit_due_date, deposit_status (pending/received/overdue)
- final_payment_due, final_payment_status
- merch_split (venue/artist percentage)
- marketing_budget_digital, marketing_budget_creative, marketing_budget_street
- cost_per_ticket (calculated: ad spend / tickets sold)
- agent_commission_rate (10%), mgmt_commission_rate (10%), artist_payout

## Payment Tracking Rules
1. Deposit overdue → auto-alert to Thomas + follow-up email to promoter
2. Final payment overdue → escalation alert
3. All payments logged with date received and method (Zelle, wire, check)
4. Partial payments tracked with running balance

## Promoter Grading (Thomas + Leigh ONLY — Private)
Grades auto-calculate from inputs. Cannot be manually overridden.

Inputs: Paid deposit on time, Paid final payment on time, Delivered marketing, Created FB event, Rider fulfilled (Full/Partial/No), Turnout vs projection, Green room delivered, Would rebook

Grade Scale: A/B/C/D/F
Alert Rule: Returning promoter graded D or F → automatic flag on new offers

## Venue Grading (Separate from promoter)
Inputs: Production quality, Sound system, Green room quality, Hospitality delivery, Capacity vs turnout, Location/market value, Would return

---

# SECTION 6: CAMPAIGN PHASE SYSTEM

## 4-Phase Marketing System

| Phase | Purpose | Budget % | Timing |
|:------|:--------|:---------|:-------|
| Announcement | Awareness/hype | Artist's overall marketing budget | 60+ days out |
| On-Sale | "Buy now" CTA | 40% of promoter co-spend | 30-60 days out |
| Maintenance | Retargeting/top-of-mind | 10% | 14-30 days out |
| Final Push | Urgency/last tickets | 50% | 0-14 days out |

## Marketing Budget Rules
Every offer must itemize marketing into three buckets:
- Paid Digital Ads (Meta, TikTok, Google) — trackable
- Design & Creative (flyers, posters, digital assets) — one-time
- Street Team / Physical (flyering, postering) — hard to attribute

Flag any offer missing this breakdown for negotiation.

## Platforms
Meta, TikTok, X, Snapchat, YouTube, Google Ads, Google Analytics, Email/SMS (Mailchimp or similar, with Laylo planned for future)

## National Paid Ad Strategy
- Platforms: Meta Ads (Instagram, Facebook), TikTok Ads, YouTube Shorts Ads, Google Discovery, Snapchat (select markets)
- Targeting: Bass music fans, festival attendees, dubstep producers, riddim communities, local rave groups, lookalike audiences (1-3%), website retargeting, engagement retargeting
- Expected Metrics: CPM: $4-$10, CTR: 0.8%+, ROAS: 2x+, Best format: 15s vertical energy clips

---

# SECTION 7: TOUR DATA — TAKE ME TO YOUR LEADER 2026

## Tour Overview
- Tour Name: DirtySnatcha – Take Me To Your Leader Tour (aka "Take Us To Your Dealer" Tour Book version)
- Theme: Cosmic, alien-invasion-themed national tour with sci-fi bass aesthetic
- Brand Elements: UFOs, abductions, cosmic transmissions, neon toxic green / cosmic purple, glitch overlays, alien humor, fan-facing "invasion" narrative
- Tour Total Guaranteed Income: ~$38,600 across 17 confirmed shows

## Recalibrated Tour Grid (As of March 1, 2026)

| # | Date | City | ST | Venue | Offer | Deal | Phase (3/1) | Days Out | Support |
|---|------|------|----|-------|-------|------|-------------|----------|---------|
| 1 | 02/27/2026 | Lincoln | NE | Royal Grove | $2,000 | OFFER | COMPLETED | Past | WHOiSEE, Dark Matter |
| 2 | 03/06/2026 | Albuquerque | NM | Effex | $2,000 | OFFER | FINAL PUSH | 5 days | Mport, Kotrax, HVRCRFT |
| 3 | 03/13/2026 | Tampa | FL | TBD | $2,000 | OFFER | FINAL PUSH | 12 days | Kotrax, Mport, HVRCRFT |
| 4 | 03/14/2026 | Pittsburgh | PA | SideQuest | $2,500 | CONTRACT | FINAL PUSH | 13 days | WHOiSEE, Dark Matter |
| 5 | 03/27/2026 | Louisville | KY | TBD | $1,250 | CONTRACT | MAINTENANCE | 26 days | TBD |
| 6 | 03/28/2026 | Covington | KY | TBD | $1,250 | CONTRACT | MAINTENANCE | 27 days | TBD |
| 7 | 04/03/2026 | Las Vegas | NV | Ravehouse | $2,000 | CONTRACT | ON-SALE | 33 days | HVRCRFT, Mport |
| 8 | 04/09/2026 | Denver | CO | Larimer Lounge | $1,500 vs 90% NET | CONTRACT | ON-SALE | 39 days | Kotrax, Ozztin |
| 9 | 04/11/2026 | Rochester | NY | TBD | $2,000 | CONTRACT | ON-SALE | 41 days | TBD |
| 10 | 04/18/2026 | Tucson | AZ | TBD | $1,600 | CONTRACT | ON-SALE | 48 days | TBD |
| 11 | 04/24/2026 | Asbury Park | NJ | House of Independents | $2,500 | OFFER | ANNOUNCEMENT | 54 days | WHOiSEE, Dark Matter |
| 12 | 04/25/2026 | Hartford | CT | Webster Theater | $2,500 | OFFER | ANNOUNCEMENT | 55 days | Dark Matter, HVRCRFT |
| 13 | 05/02/2026 | Butte | MT | Covellite Theatre | $5,000 | CONTRACT | ANNOUNCEMENT | 62 days | Kotrax, Ozztin, HVRCRFT |
| 14 | 05/15/2026 | Oklahoma City | OK | Bamboo Lounge | $2,000 | CONTRACT | ANNOUNCEMENT | 75 days | TBD |
| 15 | 05/16/2026 | Dallas | TX | TBD | $2,000 | CONTRACT | ANNOUNCEMENT | 76 days | N/A (Infected Mushroom support) |
| 16 | 05/22/2026 | Houston | TX | TBD | $2,000 | CONTRACT | ANNOUNCEMENT | 82 days | N/A (Infected Mushroom support) |
| 17 | 06/20/2026 | San Diego | CA | TBD | $3,000 | CONTRACT | ANNOUNCEMENT | 111 days | TBD |

## Rollout Tracker Status (from XLSX)

| Show | Venue Confirmed | Contract Signed | Deposit Received |
|:-----|:---------------|:---------------|:----------------|
| Lincoln 2/27 | ✅ | ❌ | ✅ |
| Albuquerque 3/6 | ✅ | ❌ | ❌ |
| Tampa 3/13 | ✅ | ❌ | ❌ |
| Pittsburgh 3/14 | ✅ | ❌ | ❌ |
| Rochester 4/11 | ✅ | ❌ | ❌ |
| All others | Not confirmed | Not signed | Not received |

Note: NO shows have Ticket Link Built, Pixel Installed, UTM Tracking, Ads Live, Email Blast, or any other rollout checklist items completed yet.

## Per-Show Financial Details

| # | City | Offer | PRYSM (Mgmt 10%) | TOM (Agent 10%) | Artist Payout | Deposits Paid |
|---|------|-------|-------------------|-----------------|---------------|---------------|
| 1 | Lincoln | $2,000 | $200 | $200 | $1,800 | $200 paid |
| 2 | Albuquerque | $2,000 | $200 | $200 | $1,500 | $500 paid (Zelle 2/8) |
| 3 | Tampa | $2,000 | $200 | $200 | $1,000 remaining | $800 paid |
| 4 | Pittsburgh | $2,500 | $250 | $250 | $2,250 | Deposit 50% due 30 days out |
| 5 | Louisville | $1,250 | $125 | $125 | $1,125 | — |
| 6 | Covington | $1,250 | $125 | $125 | $1,125 | — |
| 7 | Las Vegas | $2,000 | $200 | $200 | $1,800 | — |
| 8 | Denver | $1,500 vs 90% NET | $150 | $150 | $1,350 | — |
| 9 | Rochester | $2,000 | $200 | $200 | $1,800 | — |
| 10 | Tucson | $1,600 | $160 | $160 | $1,440 | — |
| 11 | Asbury Park | $2,500 | $250 | $250 | $2,250 | — |
| 12 | Hartford | $2,500 | $250 | $250 | $2,250 | — |
| 13 | Butte | $5,000 | $500 | $500 | $4,500 | — |
| 14 | Oklahoma City | $2,000 | $200 | $200 | $1,800 | — |
| 15 | Dallas | $2,000 | $200 | $200 | $1,800 | — |
| 16 | Houston | $2,000 | $200 | $200 | $1,800 | — |
| 17 | San Diego | $3,000 | $300 | $300 | $2,700 | — |

## Key Show Notes
- Lincoln: MPORT TMTYL routing. Flight booked. COMPLETED.
- Albuquerque: MPORT TMTYL. Zelle $500 on 2/8. HGR only after 250 tickets sold.
- Tampa: Flight booked. No HGR.
- Pittsburgh: Deposit 50% 30 days out. Flight booked. HGR included.
- Louisville/Covington: Sent admas 2/12 and 2/13 respectively. Back-to-back KY dates.
- Las Vegas: Ravehouse venue. Road to DFT (Dancefestopia). Announce by 17th.
- Denver: $1,500 vs 90% NET unique deal. Announced 1/12. Larimer Lounge.
- Rochester: MPORT TMTYL. Hotel reimburse after 175 sold. Radius clause.
- Tucson: AB Touring 1. Bonus structure.
- Asbury Park/Hartford: Spoke to Julian 2/10 re: marketing + deposit.
- Butte: Covellite Theatre. $5,000 guarantee + travel.
- Dallas/Houston: Support slots for Infected Mushroom.
- San Diego: PeerPop link live.

---

# SECTION 8: MARKET INTELLIGENCE BY CITY

## Albuquerque (March 6 — FINAL PUSH)
- Strong local bass crowd but competing show same night
- Lineup neutralizes competition risk (Mport, Kotrax, HVRCRFT)
- Push Mport collaboration hard — energy-based promo content works extremely well
- Ad spend recommendation: $75-$125
- Promo groups: ABQ bass community
- Sellout probability: Medium-High

## Tampa (March 13 — FINAL PUSH)
- Active FL bass community, Spring Break = huge attendance potential
- Competing with Orlando but Tampa holds its own
- Spring Break alien theme, highly visual TikTok + IG content
- Ad spend recommendation: $150-$250
- Promo groups: Tampa Bass Family
- Sellout probability: Medium-High

## Pittsburgh (March 14 — FINAL PUSH)
- Very active mid-Atlantic rave scene
- SideQuest historically strong for bass
- WHOiSEE + Dark Matter pairing is optimal draw
- Ad spend recommendation: $100-$150
- Promo groups: Pennsylvania Rave Collective
- Sellout probability: High

## Louisville (March 27 — MAINTENANCE)
- Midwest market, needs campus activation + FB group saturation
- Support lineup TBD — recommend Dark Matter or Kotrax
- Back-to-back with Covington for routing efficiency

## Covington (March 28 — MAINTENANCE)
- KY secondary market, same promo strategy as Louisville
- Paired for routing efficiency

## Las Vegas (April 3 — ON-SALE)
- Ravehouse venue, Dancefestopia tie-in massively boosts hype
- Vegas nightlife branding syncs with alien visuals
- LED-based teasers perform well
- Ad spend recommendation: $100-$200
- Sellout probability: Medium-High

## Denver (April 9 — ON-SALE)
- Top-3 bass market nationally
- Larimer Lounge extremely favorable to DirtySnatcha's style
- $1,500 vs 90% NET = expected sellout
- Sub.mission community, extremely loyal scene
- Ad spend recommendation: $0-$100 (Denver sells itself)
- Sellout probability: VERY HIGH

## Rochester (April 11 — ON-SALE)
- MPORT TMTYL routing. Hotel reimburse after 175 sold. Radius clause in effect.

## Tucson (April 18 — ON-SALE)
- AB Touring 1 route. Bonus structure in deal.

## Asbury Park (April 24 — ANNOUNCEMENT)
- East Coast fans highly active. House of Independents trusted.
- WHOiSEE + Dark Matter perfect pairing. NYC crossover potential.
- Ad spend recommendation: $100-$150
- Sellout probability: Medium-High

## Hartford (April 25 — ANNOUNCEMENT)
- Underserved CT bass demographic. No competing shows expected.
- Ad spend recommendation: $150
- Sellout probability: Medium-High

## Butte (May 2 — ANNOUNCEMENT)
- MAD Series show. $5,000 guarantee + travel. Historically strong turnout. Guaranteed audience.
- Ad spend recommendation: $50-$100
- Sellout probability: High

## Oklahoma City (May 15 — ANNOUNCEMENT)
- Bamboo Lounge. Needs local promo group activation.

## Dallas (May 16 — ANNOUNCEMENT)
- Support slot for Infected Mushroom — massive visibility opportunity. No marketing spend needed from DSR side.

## Houston (May 22 — ANNOUNCEMENT)
- Support slot for Infected Mushroom — same as Dallas. Back-to-back weekend.

## San Diego (June 20 — ANNOUNCEMENT)
- PeerPop link live. Summer date gives long runway for marketing.

---

# SECTION 9: SUPPORT ARTIST SYSTEM

## Approved Support Artists (2026 Tour)

### Primary Supports
- **WHOiSEE** (NC) — Tier 1 (heaviest draw)
- **Dark Matter** (Chicago/Knoxville) — Tier 1
- **Mport** (high-demand mid-tier) — Tier 1
- **Kotrax** (Denver — Frontier flight pass) — Tier 2 (flexible, affordable)
- **HVRCRFT** (Las Vegas/San Francisco) — Tier 2
- **Ozztin** (Denver) — Tier 2

### Canada-Only
- **Zurglin** — Only if Canada routing activated
- **Walter Wilde** — Only if Canada routing activated (visas pending)

## Assignment Logic Rules
1. Proximity First — choose supports closest to market
2. Genre Alignment — all must be riddim/dubstep/heavy bass
3. Radius Clauses — check per artist (e.g., WHOiSEE excluded from Minneapolis)
4. Tour Momentum — riskier markets get heavier supports
5. Weekend Priority — strongest supports (WHOiSEE, Dark Matter) on weekends
6. Weekday Priority — flexible supports (Kotrax, HVRCRFT, Ozztin) on weekdays
7. Promoter Pays Everything — support costs NEVER reduce headline fee

## Expected Support Costs (Promoter Budgeting)
- Local supports: $200-$500
- Regional supports: $300-$700
- Major supports (Mport/WHOiSEE/Dark Matter): $700-$1,200
- Travel: promoter decides

---

# SECTION 10: RIDER & HOSPITALITY

## Technical Requirements
- Mixer: Pioneer DJM-900NXS2 or DJM-V10
- CDJs: 4x Pioneer CDJ-2000NXS2 (or 2x CDJ-3000), linked, latest firmware
- Booth Monitors: 2x 15-inch powered monitors
- Wireless Mic: 1x wireless microphone + fresh batteries
- Fan: Large fan in DJ booth
- Visuals: VJ/LED wall — visuals pack provided in advance (USB with looping UFO beam, glitch overlays)
- Minimum system: 20,000 watts total output, strong sub response in 30-60 Hz range
- FOH engineer required
- Venue must allow haze/smoke unless restricted

## Hospitality (Fixed — Every Show)
- 24x bottled water (or 12x per rider version)
- 4x Pink Red Bull White Peach (or 6x energy drinks any brand)
- 1x bottle spiced rum, 1x bottle coconut rum
- Grenadine, pineapple juice, ice, Solo cups
- Caesar salad, fruit tray, chips & dip, charcuterie board, protein bars
- Gum, mint-flavored vape, 1x Squishmallow
- $20-$30 meal buyout per person if catering not available

## The Queen of England Demand (Variable)
Changes every show. Thomas enters the custom demand at show confirmation time. Must be something ridiculous and entertaining.
- Examples: "A framed photo of Nicolas Cage riding a unicorn", "A live goldfish named Gerald", "A handwritten poem about bass music from the venue manager"
- Tour Book version: "One framed photo of the Queen of England performing an activity relevant to the region of the show"

## Hotel Standard
Minimum 3-4 star hotel, king bed, paid in full prior to check-in. Confirmation sent to Thomas minimum 7 days before show.

## Ground Transportation
Sober personal transport OR Uber/Lyft fare including tip provided by promoter. No exceptions.

## Green Room
Private green room with bathroom. Touring party reserves the right to close the green room to all guests at any time.

## Merch Requirements
- 1x 6' or 8' table, tablecloth, 2 chairs, good lighting
- Ability to accept Square payments (artist brings hardware)
- Standard split: 80/20 or 90/10 artist-favoring (no venue should exceed 80/20 unless union house)

## Payment Terms
- Payment type: Cash, check, Zelle, or wire
- Due: Night of show before DirtySnatcha's set
- Deposit: As specified in contract

---

# SECTION 11: PROMOTER STRATEGY

## Promoter Responsibilities
- Create FB event page, add DirtySnatcha + supports as hosts
- Upload assets within 24-48 hours
- Post weekly content, minimum 2 posts per week
- Put flyer in ALL local promo groups
- Boost ads (recommended $150-300 depending on market)
- Use countdown graphics in last 10 days
- Ensure ticket link live on announcement day
- Track and report weekly ticket counts
- Full sound, stage, lighting setup per tech rider
- Confirm set times at least 72 hours before show
- Provide hotel room, local transportation, hospitality rider items
- Pay for ALL support talent (fees, travel, hospitality, promo graphics)

## DirtySnatcha Team Responsibilities
- Tour branding, logo sets, flyer templates, animated teasers, promo videos, TikTok edits
- Tour-wide narrative, artist push across all socials
- Support artist coordination and approval
- Visual pack, logo folders, tour headers, square/vertical/landscape flyers
- Full advance sheet, tech rider, hospitality rider, flight/hotel info, visual files
- Professional DJ set, meet & greet opportunities, social content for highlights

## Promoter Behavior by Region
- **Midwest:** Prefer strong support lineups, rely heavily on FB groups + street teams
- **East Coast:** Want assets EARLY, more hands-on with marketing, often provide weekly ticket updates
- **West Coast:** Love visuals & unique promo concepts, strong Discord + Reddit activation
- **Southern:** Rely on influencer groups, heavy TikTok + IG ad focus
- **PNW:** Deep rave community presence, promo groups extremely effective

## Communication Standard
- Promoters must reply within 24 hours, provide weekly ticket counts, confirm ad spend
- Send on-site contact name + phone number, confirm load-in time, set times 72 hours before
- DirtySnatcha team must approve all flyers, provide assets quickly, respond promptly

---

# SECTION 12: DSP ALGORITHMIC INTELLIGENCE

## Core Grading System

### Track Quality Score (ISRC Level)
- **30-Second Rule:** High skip rate before 30 seconds = permanently shadow-demoted
- **Bucket Logic:** All streams/saves/shares for an ISRC go into one data bucket. Changing ISRC resets to 0.
- **Threshold:** ISRC needs ~30+ out of 100 on Spotify to trigger algorithmic takeovers (Discover Weekly, Release Radar)

### Artist Quality Score (Profile Level)
- **Active Search Weight:** #1 driver. Manual "dirtysnatcha" searches = "Destination Artist" status
- **Inherited Authority:** High Artist Score gives new ISRCs algorithmic multiplier (test groups of 1,000+ instead of 100)
- **Consistency Decay:** No new ISRC every 6-8 weeks = Artist Quality Score decays

## DSP-Specific Intelligence

### Spotify
- Track Quality: Popularity Index (0-100). Save-to-Stream Ratio target: >10%
- Hack: Radio Priming — run conversion ads focused on "Saves" to hit 10% threshold
- Tools: S4A Editorial Pitching (14+ days early), Discovery Mode, Marquee & Showcase, Canvas & Clips

### Apple Music
- Track Quality: Library Add Velocity (LAV)
- Hack: Shazam Spiking — geo-target social ads to one mid-sized city for regional "Trending" alert
- Tools: AM4A Pitching (favors high-res imagery + synced lyrics), Artist Messages (voice notes)

### YouTube
- Track Quality: Watch-History Affinity
- Hack: Shorts Pivot — link ISRC to YouTube Shorts. High "Audio Re-use" = massive Track Quality vote
- Tools: OAC Unification, Community Posts

### Pandora
- Track Quality: Thumbs Up/Down Ratio (extremely ruthless)
- Hack: Featured Tracks — force-feed one ISRC for up to 8 weeks
- Tools: Pandora AMP, Artist Audio Messages (AAM)

### Amazon Music
- Track Quality: Voice Request Index (Alexa requests)
- Hack: Natural Language Optimization — ensure lyrics in metadata for Alexa conversational search
- Tools: Voice Intro Pitching, Spotlight

### SoundCloud
- Track Quality: Engagement-to-Play Ratio (comments, likes, reposts)
- Hack: 100-Listener Test — AI forces track to 100 people, their reaction dictates viral cap
- Tools: Next Pro Pitching → "Daily Drops" feed

### TikTok
- Track Quality: Sound Re-use & Completion Rate (rewatches = 5x more than Like)
- Hack: Search-First SEO — title with high-volume keywords (e.g., "heavy bass drop 2026")
- Tools: TikTok Artist Hub, Commercial Music Library (CML)

## Supply Chain & Waterfalling
- **ISRC (The DNA):** Unique to audio. NEVER change it.
- **UPC (The Vessel):** Unique to product. ALWAYS change for new bundle.
- **Waterfall Execution:** When moving Single to EP, put exact same ISRC inside new UPC. Album debuts with accumulated Track Quality Score.
- **Multi-Distributor 48-Hour Rule:** Upload to new distro with identical metadata. Wait for Spotify to link. Only then takedown old distro.

## 3-Pillar Rights Safety Net
1. **Performance Rights (BMI/ASCAP/SOCAN):** Composition protection. Generates ISWC.
2. **Reproduction Rights (CMRRA/The MLC):** Mechanical protection. Bridges ISRC to ISWC.
3. **Neighboring Rights (SoundExchange):** Sound recording protection. Verifies ISRC is "Broadcast Ready."

## Cover/Flip Protocol
- Locate original ISWC
- Secure Mechanical License (via HFA/Songfile)
- Link new ISRC to original ISWC in VMG portal

## Release Payload Schema (JSON)
```json
{
  "release_metadata": {
    "release_date": "ISO 8601",
    "distributor_target": "VMG",
    "status": "pending_audit"
  },
  "artist_profile": {
    "artist_display_name": "dirtysnatcha",
    "legal_entity_name": "Thomas Nalian",
    "pro_ipi_number": "NUMBER",
    "dsp_identifiers": {
      "spotify_artist_uri": "spotify:artist:ID",
      "apple_music_id": "ID",
      "youtube_oac_id": "ID"
    }
  },
  "isrc_container": {
    "track_title": "TITLE",
    "upc_code": "UPC",
    "isrc_code": "ISRC",
    "is_cover_flip": false,
    "iswc_code": "ISWC if cover",
    "audio_dna": {
      "bpm_exact": 145.00,
      "musical_key": "F# Minor",
      "energy_level": 9,
      "mood_primary": "Aggressive"
    },
    "mechanical_clearance": {
      "license_provider": "CMRRA",
      "clearance_status": "verified"
    }
  },
  "editorial_seed": {
    "algorithmic_targets": {
      "similar_artists": ["Luci", "Mersiv", "Rezz"],
      "primary_instruments": ["Heavy Bass", "Analog Synth", "Drum Machine"],
      "cultural_tag": "Bass Music"
    },
    "platform_specific_assets": {
      "amazon_alexa_intro": "Hey Alexa, play...",
      "pandora_aam_audio_url": "URL",
      "lyrics_musixmatch_sync": "SYNC DATA"
    }
  }
}
```

---

# SECTION 13: AI CONTENT ENGINE

## System Overview
Fully automated social media pipeline using Google Apps Script + OpenAI API + Instagram Graph API. Generates a week's worth of content, places in Google Sheet for approval, then auto-publishes.

## Components
1. Google Apps Script (ai_content_engine_v1.gs) — core engine
2. Advanced Module (content_engine_advanced.gs) — multi-platform, trend detection, campaigns
3. Google Sheet — central dashboard for content approval, scheduling, performance tracking

## Required API Keys
- OpenAI API Key (platform.openai.com/api-keys)
- Instagram Business Account ID
- Instagram Long-Lived Access Token (valid ~60 days, needs refresh)
- Google Drive Content Assets Folder ID

## Automated Triggers
- publishApprovedContent: Every 30 minutes
- generateWeeklyContent: Every Sunday
- updatePostMetrics: Daily midnight-1am
- detectTrendsAndSuggest: Every Monday
- generateWeeklyReport: Every Monday

## Approval Workflow
1. AI generates content weekly (Sunday)
2. Content appears in CONTENT_QUEUE tab
3. Review each post: CAPTION, IMAGE_DRIVE_LINK, HASHTAGS
4. Set status: APPROVED (auto-publishes), REVISION (add feedback, regenerate), SKIP (ignored)

## Manual Campaign Types
- Tour Content Campaign: Enter tour dates → AI generates per-city campaigns (announcement, reminder, day-of, recap)
- Release Campaign: Enter track title + release date → generates release cycle (teaser, announcement, drop day, follow-up)

## Google Sheet Tabs
- CONTENT_QUEUE: Main workspace for approval
- PUBLISHED: Performance tracking for published posts
- PERFORMANCE: Weekly performance overview
- TREND_IDEAS: AI-generated trending content ideas
- TEMPLATES: Pre-built content library
- BRAND_ASSETS: Logos, fonts, brand materials
- CONTENT_CALENDAR: 4-week visual overview

---

# SECTION 14: FESTIVAL SUBMISSION TRACKER

| Festival | Location | Dates | Submission Status |
|:---------|:---------|:------|:------------------|
| Get Lucky Festival | Salt Lake City, UT | Mar 13-14, 2026 | Check |
| Deep Tropics Equinox | Nashville, TN | Mar 20-21, 2026 | Check |
| Shaq's Bass All Stars TX | Fort Worth, TX | Mar 21, 2026 | Check |
| Okeechobee | Okeechobee, FL | Mar 19-22, 2026 | Check |
| Gather Outdoors | Stratton, VT | Apr 11-12, 2026 | Check |
| Forbidden Kingdom | Orlando, FL | Apr 25-26, 2026 | Discovery Project OPEN |
| The Untz Festival | Browns Valley, CA | May 8-10, 2026 | Check |
| EDC Las Vegas | Las Vegas, NV | May 15-17, 2026 | Via Bassrush/Insomniac |
| Infrasound Music Festival | Ellendale, MN | May 14-17, 2026 | Check |
| Showcation | Darlington, MD | May 15-17, 2026 | Check |
| Cosmic Kinection | French Village, MO | Jun 2-7, 2026 | Check |
| Apocalypse | Long Beach, CA | Jun 19-20, 2026 | Check |
| Elements | Long Pond, PA | Aug 7-10, 2026 | Deadline Dec 8 |
| Bass Canyon | The Gorge, WA | Aug 14-16, 2026 | Via Excision/Subsidia |
| Lost Lands | Legend Valley, OH | Sep 18-20, 2026 | Oracle Program |
| Bass Coast (Canada) | BC, Canada | TBA 2026 | Jan 10 deadline |

---

# SECTION 15: KEY PROMOTERS & VENUE NETWORKS

## West Coast
- Bassrush/Insomniac (LA, LV, national)
- B-Side Los Angeles (bass music nights)
- Space Yacht (LA - SOUND Nightclub)
- United By Bass (San Diego)
- Digital Motion Events (Vancouver, Canada)
- LEDpresents (San Diego)
- FNGRS CRSSD (San Diego)

## Mountain/Southwest
- Global Dance (Denver, CO)
- AEG (Denver)
- Soda Jerk Presents (Colorado)
- Bass Mobb (Colorado)
- Relentless Beats (Phoenix, AZ)
- Concourse Project (Austin, TX)
- HAM Promos (Dallas, TX)

## Southeast
- Disco Donnie Presents (multi-city)
- Forbidden Kingdom/Insomniac (Orlando, FL)
- Deep Tropics (Nashville, TN)

## Northeast/Mid-Atlantic
- The Untz (multi-city)
- Ouija Entertainment (multi-city: Boston, Chicago, LA, Miami, NY)
- Elements Festival (PA)

## Midwest
- TimeFly Music (Denver/multi)
- Infrasound (Minnesota)

## Canada
- Digital Motion Events (Vancouver)
- Bass Coast Festival (BC)
- JSTDRMN Collective (Toronto)

## Mexico
- PRYSM Talent Agency (Alan Salomon connection)
- Jessica Audiffred network

---

# SECTION 16: COLLABORATION TARGETS

## Top DirtySnatcha Records Artists
- OZZTIN — top label artist
- MAVIC — top label artist
- PRIYANX — label artist
- WHOISEE — label artist

## Recent/Active Collaborators
- Luci (AB Touring roster, "Genie In A Bottle" collab)
- Walter Wilde ("Outta Space" collab)
- Distinct Motive ("Watching You" — 100K+ streams)
- Riot Ten (previous collaborator)
- Rico Act (previous collaborator)

## AB Touring Full Roster (Support/Collab Pool)
Abelation, Ace Aura, Automhate, Avance, Aweminus, Badvoid, Bainbridge, Blankface, Blurrd Vzn, Blvnkspvce, Canvas, Chime, Codd Dubz, Chozen, Decimate, Dirt Monkey, DirtySnatcha, DMVU, Dodge & Fuski, Evalution, Figure, Floret Loret, FuntCase, Future Exit, GG Magree, G-Rex, Gunpoint, He$h, Hexxa, High Zombie, Hostage Situation, Hydraulix, Izadi, Jeanie, Jiqui, Joust, Leotrix, Luci, LuZid, Mythm, Mongrel, Neotek, Oliverse, Ozztin, Perry Wayne, PhaseOne, Phiso, Poni, Protohype, Ruvlo, Shanghai Doom, Sharlitz Web, Shlump, Skybreak, Slang Dogs, Space Wizard, Stylust, SubDocta, Sully, Swarm, Toadface, TVBOO, TwoPercent, Tynan, UZ, Virus Syndicate, Zeke Beats, Zoska

## Key Industry Contacts
- Andrew @ AB Touring: andrew@abtouring.com (booking agent)
- PRYSM Talent Agency: booking agency
- Insomniac/Bassrush: festival/event platform
- Excision/Subsidia: label + festival ecosystem (Lost Lands, Bass Canyon)
- UKF: media/premiere platform (has premiered DirtySnatcha tracks)

---

# SECTION 17: GOOGLE DRIVE STRUCTURE

## Existing Drive Folder
DirtySnatcha_TMTYLT_2026 (ID: 1TQnx4iTH7VgmdSeW9mxloIuLzjMlAgz-)

| Folder | Purpose |
|:-------|:--------|
| 00_MASTER_TEMPLATE | Template subfolder tree to clone for each new show |
| 00_LINKED_ASSETS | Inside master template. Linked shared assets. |
| 01_TOUR_STOPS | All confirmed show folders. Named by date/city/venue. |

## Show Folder Naming Convention
`[MM.DD.YYYY] [City, State] - [Venue Name]`

## Auto-Generated Show Folder Structure
- 00_CONTROL: Original offer email, negotiation thread, approval record, competition report, deal summary
- 01_CONTRACT_&_PAYMENT: Unsigned/signed contract, deposit/final payment confirmation, settlement sheet
- 02_ADVANCE_&_LOGISTICS: Advance sheet, hotel/ground/rider/tech/green room confirmations
- 03_TRAVEL: Travel party, flight monitoring log, booked flight + hotel confirmations
- 04_MARKETING: Dark ad copy, approved content/tracks, marketing allocation + spend tracker, FB event link, post-show report
- 05_TICKETS: Sold ticket tracker, giveaway ticket log
- 06_SHOW_ASSETS: Rider PDF, approved setlist, press photo + bio

---

# SECTION 18: ARTIST INTEGRATIONS & TECHNICAL IDS

## DirtySnatcha Technical Profile
```json
{
  "name": "DirtySnatcha",
  "genre": "Dubstep/Riddim",
  "integrations": {
    "meta_pixel_id": "701854965266742",
    "ga4_measurement_id": "G-PPES7BDNF3",
    "bandsintown_api_key": "3c7e62970f53fe395752f55139bbd81a"
  }
}
```

## Virgin Music (VMG) Distribution
- Smart Audience Ad Types:
  - Fan Engagement: Drive awareness on IG + FB based on streaming behavior (pre-release 2-4 weeks before drop, off-cycle to keep fanbase activated)
  - Stream Growth: Drive Smart Audience from social to streaming services (on release day and after, most effective when primed by Fan Engagement)
- Smart Audience targeting is based on streaming behavior, not social behavior — more precise than standard Meta targeting

---

# SECTION 19: DATABASE SCHEMA

## Core Tables
- users, promo_members, tasks, task_completions, post_analytics, shows, promoters, promoter_show_grades, venues, venue_show_grades, agent_commissions, submissions, contracts, releases, release_marketing

## Extended Fields on Shows Table
- contract_type (flat/vs/bonus), bonus_threshold, bonus_amount, merch_split
- support_artists (JSON array from tour support grid)
- campaign_phase (announcement/on_sale/maintenance/final_push/completed)
- marketing_budget_digital, marketing_budget_creative, marketing_budget_street
- cost_per_ticket (calculated from ad spend / tickets sold)

## Key Schema Details
- users: user_id, name, email (dedup key), join_date, location, profile_types array (artist/consumer/concert_goer/downloader/promo_member), status
- promo_members: extends users with social connections, total_points, weekly_points, streak_weeks, inactivity_weeks
- shows: show_date, gig_type, venue, guarantee, deposit tracking, approval timestamps, travel/hotel/rider/deposit boolean flags
- promoters: name, company, email, phone, shows_worked, average_grade (A-F auto-calculated), PRIVATE access
- 2/3 vote enforcement: Hard database constraint — no contract moves to Approved without 2 or 3 partner votes marked Yes

---

# SECTION 20: OPEN ITEMS & DATA GAPS

1. Andrew's full contact info confirmed: andrew@abtouring.com (from Intelligence Research doc)
2. Marketing budget per show not in JSON files — cannot calculate phase allocations without it
3. Missing venues: Tampa, Louisville, Covington, Rochester, Tucson, Dallas, Houston, San Diego
4. Deposit status unclear for most upcoming shows
5. No Meta Ads API credentials configured yet
6. Local promotion company database needs per-market contact info
7. Market size classification (Tier 1/2/3) needs explicit definition
8. Demographic data source for ad targeting — pulled automatically or manual?
9. Budget split logic for Fan Engagement vs Stream Growth ads — standard or per release?
10. Virgin Music Assets Smart Audience workflow needs step-by-step documentation
11. Rollout tracker shows NO shows have ticket links built, pixels installed, UTM tracking, or ads live yet
12. Contract signed = FALSE for ALL shows in the rollout tracker
13. AI Content Engine needs API keys configured (OpenAI, Instagram Graph API, Drive folder)

---

# END OF MASTER OPERATING BIBLE
