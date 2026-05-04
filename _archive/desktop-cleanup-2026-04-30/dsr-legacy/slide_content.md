# Artist Bible Platform — Complete System Architecture Presentation

---

## Slide 1: Title Slide
**Heading:** Artist Bible: The AI-Powered Operating System for Touring Artists
**Subheading:** Complete System Architecture — 7 Agents, 8 Platforms, 1 Unified Pipeline
**Footer:** Built for DirtySnatcha's "Take Me To Your Leader" National Tour 2026 | Confidential

---

## Slide 2: The Problem Every Independent Artist Faces
**Heading:** Touring Operations Are Fragmented, Manual, and Leaking Revenue

Independent and mid-tier touring artists face a brutal operational reality. Marketing campaigns are inconsistent across shows — some get professional rollouts, others get a last-minute Instagram post. Contracts and deposits fall through the cracks. Artwork approvals stall. Promoter communication is scattered across dozens of email threads with no central system of record.

The result: missed revenue, wasted ad spend, and a team that's constantly firefighting instead of building.

Key pain points:
- No standardized marketing rollout across tour dates
- No visibility into whether promoters are executing their marketing commitments
- No true cost-per-ticket-sold metric — just guesses
- Asset approvals bottleneck every campaign launch
- Contract and deposit tracking lives in spreadsheets and memory

**Real example:** DirtySnatcha's Lincoln, NE show is tomorrow. There is no ad campaign running, no confirmed marketing budget breakdown, and no standardized reporting in place.

---

## Slide 3: The Solution — A Multi-Agent AI System
**Heading:** Artist Bible Replaces Manual Chaos with 7 Specialized AI Agents Working in Concert

Artist Bible is not a single tool — it is a coordinated system of 7 AI agents, each with a specific job, that together form a complete operating system for a touring artist's business. Each agent has its own skills (domain expertise), its own tools (platform connections), and its own deliverables (professional documents, campaigns, reports).

The agents don't work in isolation. They are orchestrated by a central intelligence layer that ensures information flows from one agent to the next in the correct order, at the correct time, triggered by real-world events like a confirmed booking or an approaching show date.

Think of it as a virtual team: a tour coordinator, a compliance officer, a logistics manager, a designer, a media buyer, a social media manager, and a growth strategist — all working 24/7, all sharing the same data, all producing at a professional standard that matches or exceeds what the top agencies deliver.

---

## Slide 4: Architecture Overview — The 7-Agent Pipeline
**Heading:** Every Show Flows Through a Structured Pipeline from Confirmation to Closeout

The system is organized as a top-to-bottom pipeline. When a show is confirmed, Agent 5 (Show Onboarding) fires first, setting up the infrastructure. Agent 4 (Documents) verifies paperwork. Agent 3 (Assets) collects creative materials. Agent 6 (Creative Production) builds the marketing assets. Then Agent 1 (Tour Marketing) and Agent 2 (Social Media) distribute those assets through paid and organic channels. Agent 7 (DSP Growth) runs continuously in the background, building audiences in tour markets.

Pipeline flow:
- Agent 7: DSP & Audience Growth (continuous — builds warm audiences in tour markets)
- Agent 5: Show Onboarding (triggered on deal confirmation)
- Agent 4: Documents & Contracts (verifies compliance gates)
- Agent 3: Asset Manager (collects and approves raw materials)
- Agent 6: Creative Production (produces finished marketing assets)
- Agent 1: Tour Marketing (executes paid campaigns + email/SMS across all platforms)
- Agent 2: Social Media Content (publishes organic content across all platforms)

---

## Slide 5: Agent 1 — Tour Marketing Campaign Agent
**Heading:** Agent 1 Executes a 4-Phase Paid Campaign for Every Show Across 8 Platforms

The Tour Marketing Agent is the revenue engine of the system. For every show on the tour, it generates and executes a structured 4-phase campaign: Announcement (awareness/hype, 40% of digital budget), On-Sale (buy now CTA, included in Announcement allocation), Maintenance (retargeting/top-of-mind, 10%), and Final Push/Backend (urgency/last tickets, 50%).

Each phase has specific ad copy, creative specs, targeting parameters, platform assignments, flight dates, and objectives — matching the professional standard set by the Crankdat x Tabernacle rollout example.

Platforms covered: Meta (Facebook + Instagram), TikTok, X (Twitter), Snapchat, YouTube (via Google Ads), Google Search/Display, Email Blasts, SMS.

Key capabilities:
- Generates per-phase ad plans with platform, flight dates, creative specs, copy, targeting, and objectives
- Executes campaigns automatically on Meta (live now), with other platforms planned for API integration
- Tracks cost-per-ticket-sold using Google Analytics conversion data
- Auto-populates performance reports using the meta-ads-analyzer skill for intelligent interpretation
- Triggers phase-based email/SMS blasts to fan lists (presale, on-sale, maintenance, week-of)

Skills: Budget Allocation, Campaign Phase Generation, Ad Copy, Geo-Targeting, Meta Ads Analyzer
MCP Tools: meta-marketing (live), Google Ads API (planned), TikTok API (planned), X API (planned), Snapchat API (planned), Email Marketing API (planned)

---

## Slide 6: Agent 2 — Social Media Content Agent
**Heading:** Agent 2 Builds the Artist's Brand Through Consistent, On-Voice Organic Content

While Agent 1 handles paid advertising, Agent 2 manages the organic social media presence — the posts, stories, reels, carousels, and collab posts that keep the artist visible and engaged with their audience between campaigns.

This agent operates on a content calendar rather than campaign phases. It generates content in the artist's voice, formats it for each platform's specifications, and schedules it for optimal engagement. All content goes through an approval gate before publishing.

Content types: Hard posts (feed), Stories, Reels/short-form video, Carousel posts, Collab posts with support acts and promoters, Countdown stickers, Giveaway posts, Artist highlight/bio content, Instagram Takeover coordination.

Platforms: Instagram, Facebook, TikTok, X, Snapchat, YouTube (Shorts/Community).

Key capabilities:
- Generates captions in the artist's voice using approved brand guidelines
- Formats content for each platform's specs (1080x1080 feed, 1080x1920 stories, etc.)
- Coordinates collab posts with support acts and venue/promoter accounts
- Schedules posts based on content calendar aligned with tour dates and release schedule
- All content requires artist/manager approval before publishing

---

## Slide 7: Agent 3 — Asset Manager Agent
**Heading:** Agent 3 Ensures Every Piece of Raw Creative Material Is Collected, Approved, and Accessible

The Asset Manager is the prep cook of the system. Before any marketing can happen, someone needs to confirm that the artwork is approved, the press photos are current, the video clips are formatted, and the logos are in the right file types. This agent automates that entire process.

It monitors Google Drive folders for each show, tracks approval status of every asset, and flags gaps before they become blockers. When the Tampa show is 15 days out and there's still no approved artwork, this agent raises the alarm — not the day before, not the day of.

Asset categories tracked: Tour flyers/posters, city-specific localized artwork, press photos, performance photos, logo files (SVG, PNG, PSD), video clips for reels/ads, audio clips for stories/TikTok, approved music for ad use, font files for brand consistency.

Key capabilities:
- Monitors Google Drive asset folders per show
- Tracks approval status (pending, approved, needs revision)
- Flags missing assets with time-based urgency (30 days out = warning, 14 days = critical)
- Chases promoters via Gmail for missing venue photos, logos, or co-branded assets
- Provides approved asset links to Agent 6 (Creative Production) and Agent 1 (Tour Marketing)

MCP Tools: Google Drive (connected), Gmail (connected)

---

## Slide 8: Agent 4 — Documents & Contracts Agent
**Heading:** Agent 4 Tracks Every Contract, Deposit, Rider, and Deadline Across the Entire Tour

This agent is the compliance backbone. For every show, it verifies that the signed contract exists, the rider was acknowledged, the deposit was paid on time, and any radius clauses or bonus structures are documented and calendared.

It scans Gmail for incoming contracts and confirmations, checks Google Drive for signed documents, and sets Google Calendar reminders for every deadline. When the Pittsburgh deposit is 50% due 30 days before the show, this agent knows — and it alerts you if it hasn't been received.

Document types tracked: Signed performance agreements, rider acknowledgments, deposit receipts and payment confirmations, radius clause terms and expiration dates, bonus structure thresholds, hospitality/green room rider (HGR) confirmations, label release forms, distribution agreements, sync licensing paperwork.

Key capabilities:
- Verifies document existence in Google Drive per show folder
- Tracks deposit payment deadlines and sends reminders
- Flags missing documents with escalating urgency
- Monitors radius clause windows to prevent conflicting bookings
- Extends beyond touring to label/release paperwork when applicable

MCP Tools: Gmail (connected), Google Calendar (connected), Google Drive (connected)

---

## Slide 9: Agent 5 — Show Onboarding Agent
**Heading:** Agent 5 Sets Up the Complete Infrastructure for Every Confirmed Show in Minutes

The moment a deal moves from "offer" to "confirmed," Agent 5 fires. It creates the Google Drive folder structure, archives the full email negotiation thread, builds a contact sheet with every relevant person, and sends a professional marketing expectations email to the promoter.

That email — modeled after the Crankdat x Tabernacle marketing letter but customized per show — lays out the full timeline (announce, presale, on-sale), the budget allocation recommendation, links to the ad planning and reporting docs, social media support requests, CRM send expectations, a checklist of questions for the promoter, and links to all approved assets.

This is the document that sets the professional tone for the entire show relationship. It replaces scattered emails and verbal agreements with a single, comprehensive, branded communication.

Deliverables per show:
- Google Drive folder: /Tour/YYYY-MM-DD_City_ST/ with subfolders (contracts, assets, marketing, reports)
- Archived email thread from the booking negotiation
- Contact sheet: promoter name/email, venue contact, talent buyer, marketing contact, production/advance, merch contact
- Marketing expectations email customized by deal type (headliner vs. support, with/without HGR, deposit terms, bonus structure)

MCP Tools: Gmail (connected), Google Drive (connected), Google Calendar (connected)

---

## Slide 10: Agent 6 — Creative Production Agent
**Heading:** Agent 6 Produces Professional Marketing Assets from Approved Materials at Scale

This agent takes the raw ingredients collected by Agent 3 (approved artwork, photos, logos, fonts) and the show details confirmed by Agent 4 (city, date, venue, support acts, ticket link) and produces finished, platform-ready marketing assets.

It generates localized show flyers, social media graphics in every required format, ad creative variations for A/B testing, and co-branded assets when the promoter has branding requirements. Everything it produces uses only approved base materials — no guessing, no unauthorized artwork.

Output formats: 1x1 localized static flyer (Instagram feed, Facebook), 9x16 localized static flyer (Stories, TikTok, Snapchat), 1x1 video trailer, 9x16 video trailer, Facebook event cover image, co-branded promoter assets, multiple ad creative variations for testing.

Key capabilities:
- Generates city-specific localized artwork using approved tour template
- Produces assets in all required platform dimensions
- Creates multiple ad creative variations for A/B testing
- Merges promoter branding with artist branding for co-branded assets
- Packages finished assets for the marketing expectations email (Agent 5)

---

## Slide 11: Agent 7 — DSP & Audience Growth Agent
**Heading:** Agent 7 Grows the Fanbase in Tour Markets Before Shows Are Even Announced

This is the strategic long-game agent. While the other agents react to confirmed shows, Agent 7 proactively builds the audience in cities where shows are planned. It cross-references tour routing with streaming data to identify weak markets, then targets music promotion (playlist pitching, DSP ads, social promotion of tracks) to grow the listener base in those specific cities.

When a new track drops, Agent 7 recommends which markets to push it in based on upcoming shows. When a show is 60-90 days out, it runs low-cost awareness campaigns to grow listeners in that DMA. After a show, it retargets attendees with new music to convert them into long-term fans.

The result is a flywheel: music promotion builds the audience, show marketing converts them into ticket buyers, show attendance creates new fans, who then stream the music, which grows the audience further.

Data sources: Spotify for Artists (listener demographics by city), Apple Music for Artists, YouTube Analytics (watch time by geography), SoundCloud (play data by region), Meta Ads (music promotion campaigns by city).

Key capabilities:
- Maps tour routing against DSP listener data to identify weak markets
- Recommends release targeting strategy aligned with tour dates
- Identifies playlists with high listener concentration in tour markets
- Runs pre-show audience building campaigns 60-90 days before announcement
- Retargets show attendees with new music post-show

---

## Slide 12: Platform Integration Map — 8 Platforms, Full Funnel Coverage
**Heading:** The System Covers Every Major Digital Platform from Paid Ads to Organic Content to Analytics

The 7 agents connect to 8 platforms through a combination of live MCP integrations and planned API connections. Meta is fully operational today. Google (Ads + Analytics + YouTube) is the highest-priority integration because it enables true cost-per-ticket-sold tracking across all platforms. TikTok, X, Snapchat, and email/SMS marketing follow.

| Platform | Paid Ads | Organic Content | Analytics/Reporting | Status |
|---|---|---|---|---|
| Meta (FB + IG) | Agent 1 | Agent 2 | meta-marketing MCP + meta-ads-analyzer | Live |
| TikTok | Agent 1 | Agent 2 | TikTok Ads Manager | API Planned |
| X (Twitter) | Agent 1 | Agent 2 | X Ads Manager | API Planned |
| Snapchat | Agent 1 | Agent 2 | Snapchat Ads Manager | API Planned |
| YouTube | Agent 1 (via Google Ads) | Agent 2 (Shorts) | Google Analytics | API Planned |
| Google Ads | Agent 1 | N/A | Google Analytics | API Planned |
| Google Analytics | N/A | N/A | Full-funnel ticket tracking | API Planned |
| Email / SMS | Agent 1 (blasts) | Agent 2 (newsletters) | Open rate, click rate, conversions | API Planned (Mailchimp/Laylo) |

---

## Slide 13: The Skills Layer — Domain Expertise That Prevents Costly Mistakes
**Heading:** Skills Give Each Agent Expert-Level Knowledge, Not Just Task Execution

Skills are the domain expertise loaded into agents on demand. The most critical skill in the system is the meta-ads-analyzer, which contains 9 reference documents covering Meta's ad auction mechanics, the Breakdown Effect, learning phase behavior, bid strategies, and performance fluctuation analysis.

Without this skill, the agent would report raw numbers. With it, the agent provides intelligent analysis — like explaining why a segment with higher average CPA is actually protecting overall campaign efficiency, or why you shouldn't kill a campaign that's still in its learning phase.

Core skills across the system:
- Budget Allocation Calculator — Phase-based budget splits per show
- Campaign Phase Generator — Timeline and milestone creation
- Ad Copy Generator — Phase-appropriate copy with city/venue/date variables
- Geo-Targeting Builder — DMA-based audience targeting per market
- Meta Ads Analyzer — Expert interpretation of Meta Ads performance data (9 reference docs)
- Show Folder Builder — Standardized Google Drive folder structure
- Artist Voice Profile — Generates organic content in the artist's authentic voice
- Contract Compliance Checker — Validates document completeness per show

---

## Slide 14: Real-World Application — DirtySnatcha National Tour 2026
**Heading:** 17 Confirmed Shows, 4 Campaign Phases Each, All Managed by One System

The DirtySnatcha "Take Me To Your Leader" national tour is the live test case for the entire system. The tour spans February through June 2026 with 17 confirmed dates across the United States, ranging from $1,250 to $5,000 offers, with a mix of headlining shows and support slots.

As of today (February 26, 2026), the tour status breaks down as follows:
- 2 shows in Final Push phase (Lincoln tomorrow, Albuquerque March 6)
- 4 shows in Maintenance phase (Tampa, Pittsburgh, Louisville, Covington)
- 6 shows in On-Sale phase (Las Vegas through Hartford)
- 5 shows in Announcement phase (Butte through San Diego)

Total tour gross (offers): approximately $36,100
Deal types: Mix of contracts and offers, most with HGR (hospitality/green room rider)

This is not a hypothetical — the system is being built and tested against real data, real deadlines, and real revenue.

---

## Slide 15: The Campaign Lifecycle — Lincoln, NE as a Walkthrough
**Heading:** From Confirmed Deal to Post-Show Report: How One Show Flows Through All 7 Agents

Lincoln, NE (February 27, 2026) demonstrates the full lifecycle:

1. **Agent 5 (Onboarding)** — Created the show folder, archived the booking thread, sent the marketing expectations email to the promoter with timeline, budget allocation, and asset links.

2. **Agent 4 (Documents)** — Verified the signed contract exists, confirmed the $2,000 offer terms, flagged the HGR rider status.

3. **Agent 3 (Assets)** — Collected approved artwork, press photos, and video clips. Flagged any missing assets.

4. **Agent 6 (Creative)** — Produced localized Lincoln flyer (1x1 and 9x16), video trailer variations, and ad creative for A/B testing.

5. **Agent 1 (Tour Marketing)** — Executed the 4-phase campaign: Announcement ads drove presale signups, On-Sale ads drove ticket purchases, Maintenance kept the show visible, and Final Push (now) is running urgency-based "last tickets" ads across Meta, TikTok, X, Snapchat, YouTube, and email/SMS.

6. **Agent 2 (Social Media)** — Published organic countdown posts, artist highlight stories, and day-of-show content.

7. **Agent 7 (DSP Growth)** — Had been running low-cost Spotify promotion in the Lincoln DMA for 8 weeks prior, growing the local listener base before the show was even announced.

---

## Slide 16: Reporting & Transparency — The Manager and Promoter Both Win
**Heading:** Every Dollar Is Tracked, Every Result Is Reported, Every Decision Is Data-Driven

The system produces two types of reports for every show:

**Manager Report** — Full visibility into all spend across all platforms, creative performance, audience insights, cost-per-ticket-sold, and recommendations for optimization. Uses the meta-ads-analyzer skill to provide intelligent analysis, not just raw numbers.

**Promoter Report** — Transparent accounting of how the marketing budget was spent, what results were achieved, and what the promoter's CRM sends delivered. Matches the Crankdat Atlanta Report format: Paid Media sheet (by phase: platform, budget spent, budget remaining, impressions, CPC, CPM, CPA/CTR, creative performance, audiences targeted, notes) plus CRM sheet (email/SMS send totals, open rates, click rates by phase).

The cost-per-ticket-sold metric is the north star. By connecting Google Analytics to the ticket page, the system tracks the full funnel: ad impression → click → ticket page visit → purchase. This enables true ROI calculation across all platforms, not just platform-reported vanity metrics.

---

## Slide 17: Build Roadmap — Phased Delivery with Immediate Impact
**Heading:** 7 Agents Built in Priority Order, Each Delivering Value from Day One

| Phase | Agent | Timeline | Immediate Impact |
|---|---|---|---|
| Phase 1 | Tour Marketing Agent (+ Email/SMS) | Now | Paid campaigns running for all 17 shows |
| Phase 2 | Show Onboarding Agent | Next | Every new show gets professional setup and promoter communication |
| Phase 3 | Documents & Contracts Agent | Following | No more missed deposits, unsigned contracts, or expired clauses |
| Phase 4 | Asset Manager Agent | Following | Creative materials collected and approved before deadlines |
| Phase 5 | Creative Production Agent | Following | Professional marketing assets produced at scale |
| Phase 6 | Social Media Content Agent | Following | Consistent, on-brand organic presence across all platforms |
| Phase 7 | DSP & Audience Growth Agent | Following | Strategic audience building in tour markets via music promotion |

API integration priority: Google Analytics (enables cost-per-ticket-sold) → Google Ads/YouTube → TikTok → X → Snapchat → Email/SMS (Mailchimp → Laylo) → DSP APIs (Spotify, Apple Music, SoundCloud)

---

## Slide 18: Closing — The Standard We're Setting
**Heading:** "If We Want to Be Better, We Need to Do Better and Have Higher Standards"

That quote comes directly from the DirtySnatcha team's own marketing brief. It is the founding principle of this entire system.

Artist Bible is not about replacing human creativity or judgment. It is about eliminating the operational chaos that prevents talented artists from executing at the level they deserve. Every show gets the same professional rollout. Every dollar is tracked. Every promoter receives clear expectations and transparent reporting. Every fan in every market is being cultivated before the show is even announced.

This is the operating system that turns a touring artist into a touring business.

**Current status:** Agent 1 is built and operational. The DirtySnatcha national tour data is loaded. The first campaign is ready to launch. We are building in public, testing against real shows, and delivering value from day one.
