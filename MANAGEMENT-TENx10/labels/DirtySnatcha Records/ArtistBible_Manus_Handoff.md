# Artist Bible Platform — Manus Handoff Brief
## Context: Continuing from Claude conversation, February 26, 2026

---

## What We're Building

A **multi-artist B2B SaaS platform** for music artists and their managers to manage tour marketing, booking offers, and campaign analytics from one collaborative workspace. Think of it as the operating system for a touring artist's career.

The original full project brief is in: `Artist_Bible_Platform___Complete_Project_Brief.md`

---

## What We Decided in This Session

### 1. Start with DirtySnatcha's National Tour (LIVE NOW)
- A national tour was announced **yesterday** — we are currently in **Phase 1 (Announcement)** of the marketing cycle
- This tour is our **real-world test case** to build and validate the entire platform
- Priority: get this tour's data into the system and start running paid awareness ads immediately
- Still need: all confirmed dates, venues, capacities, ticket prices, promoter per show, ticket links

---

### 2. The Tour Marketing Agent is Priority #1

The platform needs a **Tour Marketing Campaign Agent** built first. This agent orchestrates a **4-phase campaign system** for every show:

| Phase | Timing | Focus | Budget % |
|-------|--------|-------|----------|
| 1 — Announcement | Show just confirmed | Awareness / hype | Part of artist budget |
| 2 — On-Sale | Tickets just live | Direct "buy now" CTA | 40% combined w/ Phase 1 |
| 3 — Maintenance | Mid-period | Retargeting / top-of-mind | 10% |
| 4 — Final Push | Last 1-2 weeks | Urgency / last tickets | 50% |

**Important distinction decided:** Phase 1 (Awareness) comes from the **artist's overall marketing budget**, NOT the per-show deal. Phases 2-4 are where promoter co-spend applies.

---

### 3. Marketing Budget Must Be Itemized Per Offer

"Marketing budget" in a booking offer is vague. The agent must break it into three distinct buckets when reviewing any offer:

- **Paid Digital Ads** — Meta, TikTok, Google (the only trackable-to-sales bucket)
- **Design & Creative** — Flyer, poster, digital assets (one-time cost)
- **Street Team / Physical** — Flyering, postering (hard to attribute)

The agent should flag any offer that doesn't clearly separate these and prompt negotiation before acceptance.

---

### 4. Spend Transparency — Two Directions

The platform needs transparent reporting for both sides of every deal:

- **When venue/promoter runs ads** → Artist + manager can see spend, targeting, and results
- **When we run ads for a show** → Promoter gets a clean report of our spend and results

This builds trust, protects everyone, and becomes a negotiation tool for future offers.

---

### 5. Ticket Sales Must Connect to Marketing Spend

Every campaign needs to close the loop with ticket sales data. The key metric is **cost per ticket sold**:

> "$500 spent → 120 tickets sold → $4.17 per ticket"

This makes marketing performance concrete and comparable across shows and promoters.

Ticket data sources (TBD/to confirm): Ticketmaster, Eventbrite, Dice, or manual promoter reports.

---

## Recommended Agent Architecture

```
ORCHESTRATOR
    └── TourMarketingAgent (subagent)
            ├── SKILLS (atomic, reusable)
            │     ├── calculate_budget_allocation
            │     ├── generate_campaign_phases
            │     ├── generate_ad_copy
            │     ├── create_geo_targeting
            │     └── build_show_folder_structure
            ├── MCP TOOLS (external calls)
            │     ├── meta_pixel → launch/track campaigns
            │     ├── ga4 → analytics events
            │     └── bandsintown → pull tour dates
            └── PROJECT CONTEXT (per artist workspace)
                  ├── artist_profile (DirtySnatcha)
                  ├── show_data (tour dates)
                  └── campaign_history
```

The agent system prompt should be **under 600 tokens**. Skills load on-demand. Context injects per artist at runtime.

---

## Integrations Already Defined
| Tool | Credential |
|------|------------|
| Meta Pixel | ID: 701854965266742 |
| Google Analytics 4 | Measurement ID: G-PPES7BDNF3 |
| Bandsintown | API Key: 3c7e62970f53fe395752f55139bbd81a |

---

## DirtySnatcha — Take Me To Your Leader Tour 2026 (Live Data)

| # | Date | City | ST | Venue | Status | Deposit | Artwork | On-Sale Set | Promoter | Phase |
|---|------|------|----|-------|--------|---------|---------|-------------|----------|-------|
| 1 | 02/27/2026 | Lincoln | NE | The Royal Grove | ON SALE | ✅ | ❌ | ✅ | Management@GriGmusic.com / bennettwoody@theroyalgrove.com | 🔴 FINAL PUSH |
| 2 | 03/06/2026 | Albuquerque | NM | TBD | ON SALE | ✅ | ❌ | ❌ | blacksheeppresents@gmail.com | 🔴 FINAL PUSH |
| 3 | 03/13/2026 | Tampa | FL | TBD | ON SALE | ✅ | ❌ | ❌ | cre_chur@yahoo.com / hvrcrft@hvrcrft.com | 🟢 ON-SALE |
| 4 | 03/14/2026 | Pittsburgh | PA | TBD | ON SALE | ✅ | ❌ | ❌ | mike@noizpresents.com | 🟢 ON-SALE |
| 5 | 03/27/2026 | Louisville | KY | TBD | SCHEDULED | — | — | — | justin@kyedm.org | 🔵 ANNOUNCEMENT |
| 6 | 03/28/2026 | Covington | KY | TBD | SCHEDULED | — | — | — | justin@kyedm.org | 🔵 ANNOUNCEMENT |
| 7 | 04/03/2026 | Las Vegas | NV | ⚠️ REDACTED | ⚠️ REDACTED | ? | ? | ? | ⚠️ REDACTED | 🔵 ANNOUNCEMENT |
| 8 | 04/09/2026 | Denver | CO | Larimer Lounge | ON SALE | — | — | — | jackson@larimerlounge.com | 🔵 ANNOUNCEMENT |
| 9 | 04/11/2026 | Rochester | NY | Photo City Music Hall | SCHEDULED | ✅ | ❌ | ❌ | blacksheeppresents@gmail.com | 🔵 ANNOUNCEMENT |
| 10 | 04/17/2026 | Phoenix | AZ | ⚠️ NO INFO | TBD | — | — | — | — | 🔵 ANNOUNCEMENT |
| 11 | 04/18/2026 | Tucson | AZ | TBD | ON SALE | — | — | — | hiatusevents@gmail.com | 🔵 ANNOUNCEMENT |
| 12 | 04/24/2026 | Hartford | CT | TBD | ON SALE | — | — | — | julian@concertcrave.com | 🔵 ANNOUNCEMENT |
| 13 | 04/25/2026 | Asbury Park | NJ | TBD | ON SALE | — | — | — | julian@concertcrave.com | 🔵 ANNOUNCEMENT |
| 14 | 05/02/2026 | Butte | MT | Covellite Theatre | SCHEDULED | — | — | — | nick@summitsoundproductions.com | 🔵 ANNOUNCEMENT |
| 15 | 05/15/2026 | Oklahoma City | OK | Bamboo Lounge | SCHEDULED | — | — | — | blacksheeppresents@gmail.com | 🔵 ANNOUNCEMENT |
| 16 | 05/16/2026 | Dallas | TX | ⚠️ REDACTED | ⚠️ REDACTED | ? | ? | ? | ⚠️ REDACTED | 🔵 ANNOUNCEMENT |
| 17 | 05/22/2026 | Houston | TX | ⚠️ REDACTED | ⚠️ REDACTED | ? | ? | ? | ⚠️ REDACTED | 🔵 ANNOUNCEMENT |
| 18 | 06/20/2026 | San Diego | CA | TBD | SCHEDULED | — | — | — | plurfactory.sd@gmail.com | 🔵 ANNOUNCEMENT |

**Deposit / Artwork / On-Sale Set** = the three hard gates before a show can be announced.  
**REDACTED** = data was blurred in source — needs follow-up.  
**Missing from all shows:** Venue capacity, ticket price, marketing budget breakdown per show.

### 🚨 Critical Issues (address before Manus builds anything)
1. **Lincoln is TOMORROW (2/27)** — Final Push ads should be live right now. Is anything running?
2. **Las Vegas, Dallas, Houston** — All details redacted. Major markets. Full info needed urgently.
3. **Phoenix (4/17)** — Absolutely zero information on record.
4. **Artwork gate open on 7 shows** — Announcement campaigns can't fully launch without approved artwork.
5. **No venue capacity or ticket prices anywhere** — Can't calculate cost-per-ticket-sold without these.

---

## Immediate Next Steps

1. **Collect DirtySnatcha tour data** — all dates, venues, capacities, ticket prices, promoter per show
2. **Build Tour Marketing Agent** — 4-phase system as first working subagent
3. **Define offer review skill** — marketing budget itemization + red flag detection
4. **Connect ticket sales data** — confirm ticketing platform(s) in use
5. **Build promoter transparency reports** — separate views per stakeholder

---

## What to Ask Manus to Do First

> *"Using the architecture and decisions in this brief, build the Tour Marketing Campaign Agent as the first subagent of the Artist Bible platform. Start with DirtySnatcha's national tour as the real-world test case. The agent should handle the 4-phase campaign system, itemize marketing budgets per offer, and track cost-per-ticket-sold. Use the Max agent. Build the system prompt under 600 tokens with skills as separate callable modules."*

---

## Notes on Manus Setup
- Use **Manus 1.6 Max agent** for this project (handles complex multi-step workflows best)
- Manus runs Claude + Qwen under the hood — you don't need to select a model manually
- Connect your existing integrations (Gmail, Meta, GA4) via Manus's MCP tool connections

---

## Should You Start a New Thread or Continue the Old One?

**Start a new thread. Do not continue the old one.**

Here's why: the existing thread you were trying to fix already has corrupted context — the agent in that thread has absorbed whatever went wrong before, including bad assumptions, incomplete logic, and muddled instructions. Continuing there means you're constantly fighting its prior mental model.

A **fresh thread with this handoff doc as your very first message** means:
- The agent starts with a clean, accurate understanding of the full system
- No baggage from previous failed attempts
- The architecture decisions from this session are baked in from message 1
- You'll move faster because you're not course-correcting constantly

**What to do with the old thread:** Keep it open for reference only. If there's any working code or logic in there worth saving, have Manus extract it into a file first, then bring that file into the new thread as an attachment — not as conversation history.

**The opening message for your new thread should be:**
> *"I'm attaching a full project brief and architecture handoff. Read it completely before doing anything. Then confirm your understanding of the Tour Marketing Campaign Agent structure and DirtySnatcha's tour as the test case. Use Max agent. We'll build from there."*

Then attach both this document and the original `Artist_Bible_Platform___Complete_Project_Brief.md`.