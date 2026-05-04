# DirtySnatcha Records — Unified System Architecture

## System Identity

**Platform:** DirtySnatcha Records Centralized Portal + Artist Bible
**Framework:** Skills + MCP + Subagents + Project Knowledge
**Build Target:** Manus.ai with Claude agent stack
**Version:** 2.0 (Unified)
**Date:** 2026-02-27

---

## Architecture Overview

This system merges two previously separate architectures into one unified operating system for DirtySnatcha Records:

1. **DSR Centralized Portal** — User portal, music submission pipeline, promo team management, label operations, show booking workflow, promoter/venue grading
2. **Artist Bible Platform** — 7-agent tour marketing automation, campaign execution, financial tracking, creative production, DSP growth

The unified system operates on four layers. Every piece of functionality maps to exactly one layer.

| Layer | What It Is | Rule |
|:------|:-----------|:-----|
| Project Knowledge | Persistent background context — always loaded | If the agent needs it in every conversation, it lives here |
| MCP Connection | Live data from external tools and APIs | If data changes in real time and lives outside the system, connect via MCP |
| Skill | Reusable repeatable process — loaded only when relevant | If you repeat the same detailed process, make it a Skill |
| Subagent | Specialist agent with isolated context and one domain | If a task has its own domain, tools, and reports to the orchestrator |

---

## Unified Agent Map

The original Artist Bible had 7 agents. The DSR Portal had 4 subagents. The unified system consolidates into **6 subagents** that cover all functionality without overlap.

| Unified Agent | Merges From | Domain |
|:---|:---|:---|
| **Agent 1: A&R Agent** | DSR Subagent 01 | Music submission intake, scoring, partner vote queue, user profile assignment |
| **Agent 2: Bookings Agent** | DSR Subagent 02 + Artist Bible Agent 4 (Docs) + Agent 5 (Onboarding) | Show offer intake, routing, negotiation, confirmation, contracts, financials, advance tracking, folder creation |
| **Agent 3: Tour Marketing Agent** | DSR Subagent 03 (partial) + Artist Bible Agent 1 (Tour Marketing) | Campaign execution (4-phase system), ad operations, budget allocation, geo-targeting, CPT tracking, Smart Audience ads |
| **Agent 4: Creative & Content Agent** | Artist Bible Agent 2 (Social) + Agent 3 (Assets) + Agent 6 (Creative) | Asset management, flyer generation, social content, show content calendars, release marketing calendars |
| **Agent 5: Marketing & Promo Agent** | DSR Subagent 03 (promo team) + Artist Bible Agent 7 (DSP Growth) | Promo team management, points/leaderboard, UGC verification, DSP growth, streaming analytics |
| **Agent 6: Tech Agent** | DSR Subagent 04 | API health, database integrity, voting logic enforcement, user records, audit logging, MCP monitoring |

---

## Unified Skill Map

All 13 DSR skills + Artist Bible skills consolidated into a single skill library. Skills are portable across agents.

| Skill ID | Skill Name | Primary Agent | Trigger |
|:---|:---|:---|:---|
| SK-01 | Score A&R Submission | Agent 1 | New artist music submission received |
| SK-02 | Assign User Profile Type | Agent 1 / Agent 6 | Any of five entry events occur |
| SK-03 | Create Show Folder | Agent 2 | Show confirmed (Thomas + Leigh approved) |
| SK-04 | Generate Rider PDF | Agent 2 | Show confirmed and folder created |
| SK-05 | Competition Report | Agent 2 | New show offer enters queue |
| SK-06 | Advance Checklist Tracker | Agent 2 | Show folder created |
| SK-07 | Travel Monitoring | Agent 2 | Show confirmed, travel party set |
| SK-08 | Grade Promoter | Agent 2 | Post-show settlement complete |
| SK-09 | Grade Venue | Agent 2 | Post-show settlement complete |
| SK-10 | Promo Team Points Calculation | Agent 5 | Task completion verified |
| SK-11 | Weekly Promo Leaderboard | Agent 5 | Every Monday (automated) |
| SK-12 | Build Release Marketing Calendar | Agent 4 | New release confirmed on label |
| SK-13 | Show Content Calendar | Agent 4 | Show confirmed |
| SK-14 | Calculate Budget Allocation | Agent 3 | Campaign phase requires budget math |
| SK-15 | Generate Campaign Phases | Agent 3 | New show enters marketing pipeline |
| SK-16 | Generate Ad Copy | Agent 3 | Campaign phase requires ad creative |
| SK-17 | Create Geo Targeting | Agent 3 | Campaign launch for specific market |
| SK-18 | Build Show Folder Structure | Agent 2 | Show confirmed (drives Google Drive structure) |
| SK-19 | Meta Ads Analyzer | Agent 3 | Meta campaign performance review |
| SK-20 | Tour Support Grid Lookup | Agent 4 | Show assets need support artist lineup |
| SK-21 | Financial Tracker | Agent 2 | Deposit/payment status check or update |

---

## Unified MCP Connections

| MCP Server | What It Connects | Used By |
|:---|:---|:---|
| Gmail MCP | Inbound show offers, negotiation threads, promo team comms | Agent 2, Agent 5 |
| Google Drive MCP | 01_TOUR_STOPS folder, show folders, templates, all show assets | Agent 2, Agent 4 |
| Google Calendar MCP | Show dates, deposit due dates, advance deadlines, release dates | Agent 2, Agent 3, Agent 4 |
| Square MCP | Purchase history for loyalty tracking, user type assignment | Agent 1, Agent 5 |
| Spotify / SoundCloud API | Monthly listeners, follower counts for A&R scoring | Agent 1 |
| Apple Music Toolbox | Shazam data, playlisting stats for Quality tag | Agent 1 |
| Google Trends API | Organic interest measurement for Reach score | Agent 1 |
| Meta Marketing MCP | Ad campaign creation, monitoring, CAPI signals, post verification | Agent 3, Agent 5 |
| TikTok API | Video verification for promo team (beta) | Agent 5 |
| Bandsintown / Songkick | Competition scanning for show offers | Agent 2 |
| Google Flights | Travel cost monitoring, buy window alerts | Agent 2 |
| Virgin Music Assets | Smart Audience ad management (manual workflow integrated) | Agent 3 |
| Wix MCP | dirtysnatcharecords.com portal — user management, submission forms | Agent 1, Agent 6 |

---

## Approval Chain

All decisions flow through the same chain regardless of which agent initiates:

1. **Thomas Nalian** — Single point of approval for ALL show offers. Manager. Co-owner of promoter grading backend.
2. **Leigh Bray (DirtySnatcha)** — Must sign off on all confirmed shows. On-site contact. Co-owner of promoter grading backend.
3. **Label Partners (x3)** — Vote on A&R decisions. 2/3 majority required. Dashboard access for submission queue.

Nothing is confirmed without both Thomas and Leigh signing off. No A&R submission is approved without 2/3 partner vote.

---

## Database Schema

The unified system uses the complete database schema from the DSR System Brief (Section 6), extended with Artist Bible financial tracking fields:

**Core Tables:** users, promo_members, tasks, task_completions, post_analytics, shows, promoters, promoter_show_grades, venues, venue_show_grades, agent_commissions, submissions, contracts, releases, release_marketing

**Extended Fields on `shows` table:**
- `contract_type` — flat / vs / bonus
- `bonus_threshold` — Integer (ticket count trigger)
- `bonus_amount` — Decimal
- `merch_split` — Text (venue/artist percentage)
- `support_artists` — JSON array from tour support grid
- `campaign_phase` — announcement / on_sale / maintenance / final_push / completed
- `marketing_budget_digital` — Decimal (trackable paid ads)
- `marketing_budget_creative` — Decimal (design/flyers)
- `marketing_budget_street` — Decimal (physical/street team)
- `cost_per_ticket` — Decimal (calculated from ad spend / tickets sold)

---

## Build Order

### Phase 1 — Foundation (Immediate)
1. Project Knowledge — Load unified identity, voice, key people, label logic
2. Gmail MCP + Google Drive MCP — Foundation for all booking workflows
3. Agent 2 (Bookings) — Show intake, routing to Thomas, folder creation on confirmation
4. Agent 6 (Tech) — 2/3 voting constraint, user record creation, audit logging
5. Agent 1 (A&R) — Submission scoring, dossier, partner dashboard queue
6. Agent 3 (Tour Marketing) — Campaign execution with 4-phase system + Smart Audience

### Phase 2 — Expansion
7. Square MCP — Loyalty tracking, user type assignment
8. Spotify + SoundCloud + Apple Music Toolbox — A&R scoring data
9. Travel monitoring — Google Flights integration
10. Agent 5 (Marketing & Promo) — Promo team beta OAuth, points, leaderboard
11. Agent 4 (Creative & Content) — Asset management, calendars, tour support grid
12. Wix MCP — Portal integration for dirtysnatcharecords.com

### Phase 3 — Advanced
13. Promoter + venue grading backend
14. Virgin Music Assets Smart Audience workflow
15. Full promo team launch (tracking links replace OAuth)
16. DSP growth automation
