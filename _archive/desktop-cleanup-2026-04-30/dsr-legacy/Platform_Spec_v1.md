# PLATFORM SPEC — WORKING DOCUMENT
### Product Name: TBD (working references: AMOS / TENx10)
### Last Updated: March 3, 2026 (v1.1 — Dual-Engine Architecture + Content Creation + Module 21/22)
### Built from: DirtySnatcha Records as test case

---

## WHAT THIS IS

A music industry management platform that combines a Knowledge Architecture (decision logic) with live operational data (shows, contracts, emails, metrics) to give managers, artists, and labels an AI-powered command center. Every workflow defined here was built from real operational problems encountered managing DirtySnatcha Records.

The platform ingests live data from Gmail, Google Calendar, Google Drive, Spotify, Eventbrite, and Meta Ads — and runs it through decision engines to produce specific, actionable outputs. Not generic advice. Real numbers, real names, real deadlines.

---

## CORE ARCHITECTURE

### Three-Layer System
1. **Knowledge Architecture (KA)** — The decision brain. 20+ modules covering booking logic, financial engines, DSP playbooks, content generation, alert triggers, and agent behavior rules.
2. **Operational Documents** — The memory. Live show data, contracts, promoter contacts, campaign specs, tour status.
3. **Live Integrations** — The nervous system. Gmail, Google Calendar, Google Drive, Spotify for Artists, Meta Ads, Eventbrite, Bandsintown.

### Dual-Engine System (Locked — March 3, 2026)
The platform runs two AI engines. One unified chat UI. The user never sees the seam.

```
USER MESSAGE (single chat interface)
         ↓
   ROUTER AGENT
   (lightweight classifier)
         ↓
┌────────────────────┬─────────────────────┐
│      CLAUDE        │       GEMINI        │
│  "Think & Write"   │  "Build & Execute"  │
│                    │                     │
│ Booking evaluation │ Gmail write/send    │
│ Financial modeling │ Drive create/save   │
│ Strategy/decisions │ Calendar write      │
│ Email drafting     │ Image gen (Imagen3) │
│ Voice/tone/content │ Post scheduling     │
│ Daily briefing     │ Meta Ads execute    │
│   reasoning        │ Eventbrite pull     │
│ Release planning   │ Folder creation     │
│ Spec/doc building  │ Label/archive inbox │
└────────┬───────────┴──────────┬──────────┘
         └──────────┬───────────┘
                    ↓
          SHARED SCHEMA (Supabase)
     Both engines read/write same data
                    ↓
          UNIFIED CHAT RESPONSE
```

**One sentence:** Claude thinks and writes. Gemini builds and executes.

**Migration path:** Option 3 now (Claude primary, Gemini execution layer). Option 4 long term (single engine, full toolset on Claude) as MCP write tools mature — estimated 12-18 months.

### Routing Logic
Routing is **tools-based within engine-based** — the router first determines think/write vs. build/execute, then checks which engine has the required tools connected.

| Request Type | Engine | Reason |
|---|---|---|
| "Should I take this offer?" | Claude | 6-step reasoning engine |
| "Send the counter offer" | Gemini | Gmail write/send |
| "Write the advance email" | Claude | Voice + template logic |
| "Archive inbox noise" | Gemini | Gmail label/archive |
| "What should I post today?" | Claude | Content engine + voice |
| "Generate the show graphic" | Gemini | Imagen 3 |
| "Schedule the post" | Gemini | Meta/TikTok API |
| "What's tour P&L?" | Claude | Financial engine |
| "Pull ticket counts" | Gemini | Live Eventbrite data |
| "Daily briefing" | Both | Claude reasons, Gemini pulls live data |
| "Create show folder in Drive" | Gemini | Drive write |

### Shared Schema (Supabase)
Both engines read from and write to the same source of truth.
```
├── artist_profiles
├── shows (status, guarantees, deposits, contacts)
├── releases (ISRCs, dates, Popularity Scores)
├── dsp_metrics
├── campaigns
├── contacts (promoters, agents, venues)
├── content_calendar (posts, assets, status)
├── inbox_rules (Module 21 logic)
├── ai_conversations (full history, both engines)
└── platform_spec (KA modules as structured data)
```

### Data Flow
`User message → Router classifies → Engine selected → KA module(s) injected → Schema data pulled → Action or response → Logged to ai_conversations`

---

## ARTIST PROFILES

Each artist on the platform has their own profile. The profile controls:
- What data they see (permission tier)
- How the AI writes in their voice
- Their specific rider customizations
- Their commission structure
- Their booking agent and manager contacts

### DirtySnatcha Profile (Test Case)
- **Legal name:** Leigh Bray / Lee Bray
- **Manager:** Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- **Primary agent:** Andrew Lehr — andrew@abtouring.com (AB Touring)
- **Legacy agent:** Colton Anderson — colton@prysmtalentagency.com (PRYSM) / 734-904-0224
- **Label:** DirtySnatcha Records
- **Distributor:** Virgin Music Group (VMG) — Assets platform
- **Commission (direct booking):** 20% manager / 80% artist
- **Commission (agent booking):** 10% manager / 10% agent / 80% artist
- **Ticket forwarding:** ticketsales@dirtysnatcha.com
- **Visual assets:** https://drive.google.com/drive/folders/1LU5mYuipgEQYHN1Osae_ofuvZo7pK8PK
- **Current metrics (March 2026):** 8-9K monthly listeners, 4,500 Spotify followers, Popularity Score 28, 11K Instagram

---

## MODULES BUILT (from KA v2)

### Module 6 — Booking Decision Engine
6-step accept/counter/decline logic. Inputs: guarantee, deal type (flat/VS/bonus), deposit terms, routing, competition, promoter grade, marketing commitment. Output: specific recommendation with counter terms if applicable.

### Module 7 — Financial Engine
Commission calculations, deposit tracking, CPT (cost per ticket), tour P&L, settlement sheets. Direct vs. agent booking handled separately (20/80 vs. 10/10/80).

### Module 8 — DSP Playbook
Platform-by-platform release week tactics. Spotify, Apple Music, SoundCloud. VMG Smart Audience ad types (Fan Engagement vs. Stream Growth). Popularity Score system — Artist Score and Track Score tracked separately via Musicstax (metrics.musicstax.com). Score targets: 30 for Discover Weekly threshold.

### Module 9 — Touring Phases
4-phase marketing system: Announcement → On-Sale → Maintenance → Final Push. Phase triggers by days-out from show date.

### Module 10 — Content Engine
Post types, asset specs, caption generation in artist voice. DirtySnatcha theme: Take Me To Your Leader 2026 — alien/cosmic narrative, sci-fi bass aesthetic.

### Module 11 — Voice Profile System
Per-artist voice profiles. DirtySnatcha voice: direct, high energy, "PLAY SOME F*CKING DUBSTEP" — not corporate. Each artist configures their own.

### Module 12 — Release Cadence
6-week minimum rule between releases. Waterfall strategy. Editorial pitch checklist.

### Module 18 — Template Library
Pre-built email templates with {variable} syntax. Advance email, promoter follow-up, deposit overdue, settlement, venue confirmation.

### Module 20 — Agent Behavior Rules
Persona: elite music industry manager. Direct, specific, no hedging. Daily briefing format. Escalation protocols. Guardrails.

### Module 21 — Inbox Intelligence
**Engine: Gemini (execute) + Claude (classify/prioritize)**
**Problem solved:** Critical emails sitting unread for days. SiriusXM VP sat 29 days with no response. Houston artwork approval missed with no notification.

**Auto-classification rules:**
| Trigger | Label | Alert Level |
|---|---|---|
| from: known promoter/agent/venue | TENx10/🎤 or TENx10/🎵 | 🟡 |
| subject contains: offer, booking, hold, guarantee | TENx10/🎤 | 🔴 |
| subject contains: contract, agreement, sign | TENx10/📄 Contracts | 🔴 |
| subject contains: deposit, payment, invoice, receipt | TENx10/💰 Financial | 🔴 |
| subject contains: artwork, approval, billing, announce, flyer, graphic | TENx10/🎤 | 🔴 regardless of TO/CC |
| from: eventbrite (noreply@event.eventbrite.com) | TENx10/🎤 | Auto-parse ticket count → tour grid |
| from: VIP contacts (geronimo@siriusxm.com etc.) | TENx10/🔴 Urgent | 🔴 always |
| CATEGORY_PROMOTIONS + no TENx10 sender | ⬜ Archive | Auto-archive |
| Calendly reminders for past dates | ⬜ Archive | Auto-archive |
| Login codes / OTPs | ⬜ Archive | Auto-archive |
| Newsletter / webinar / promo from non-industry sender | ⬜ Archive | Auto-archive |

**Copro contract rule:** Two signatories required — thread stays 🔴 until BOTH confirmed signed. Agent saying "all set" does not close the alert.

**Watched thread status:** Thread flagged as watched (user has seen it, not acting yet) moves to monitored queue — visible in dashboard, not in urgent tray.

**Inbox labels schema:**
- TENx10/🔴 Urgent
- TENx10/🟡 This Week
- TENx10/💰 Financial
- TENx10/📄 Contracts
- TENx10/🎤 DirtySnatcha
- TENx10/🎵 WHOiSEE
- TENx10/🏷️ Label Operations
- TENx10/🤝 Collabs & A&R
- TENx10/🛠️ SaaS Build
- TENx10/⬜ Archive

### Module 22 — Dual-Engine Router + Auto Content Creation
**Engine split: Claude (creative director) + Gemini (production studio)**

**Content Creation Pipeline:**
```
TRIGGER
Show confirmed / Phase change / Release drop / Manual request
        ↓
CLAUDE — Creative Director
- Identifies touring phase (Module 9)
- Pulls artist voice profile (Module 11)
- Pulls show/release data from schema
- Writes all captions in artist voice
- Writes asset briefs (what each graphic needs)
- Outputs structured content package to schema
        ↓
GEMINI — Production Studio
- Reads Claude's asset briefs from schema
- Generates visuals via Imagen 3
- Saves assets to Drive show folder
- Schedules posts via Meta/TikTok API
- Logs what went out, when, to what platform
        ↓
SHARED SCHEMA
- Content logged against show/release
- Performance data pulled post-publish
- Claude reads performance → adjusts next content package
```

**Content trigger events (auto-fire):**
| Event | Phase | Content Package Generated |
|---|---|---|
| Show confirmed | Announcement | 3x announcement posts, 1x story, asset briefs |
| Tickets on sale | On-Sale | Ticket link posts, urgency copy, swipe-up assets |
| 14 days out | Maintenance | Weekly countdown, support artist tags, Drugs In Da Club push |
| 7 days out | Final Push | Daily posts, geo-targeted ads brief, Alexa CTA posts |
| Day of show | Day-Of | Day-of hype, venue directions, soundcheck content |
| Post-show | Recap | Recap posts, media coverage share, thank you copy |
| Release Friday | Release | DSP push posts, Alexa CTA x2, Shazam angle content |

**Router fallback rule:** If Gemini execution fails → Claude drafts manual version + flags for human send. No action ever drops silently.

---

## WORKFLOWS BUILT

### 1. Show Advance Workflow
**Trigger:** Show confirmed
**Process:**
- Day 0: Customize rider for market. Update "wildcard hospitality item" for the artist (see Rider System below). Create show folder in Drive.
- Day 1-2: Send advance email with rider attached. Include visual assets link, flight info, ticket forwarding request, ROS template for promoter to complete.
- Day 3: Confirm receipt. Rider signed back. Ticket link confirmed. FB event active.
- Day 7: Hotel confirmed in writing. Ground transport confirmed. Set times window. Marketing budget confirmed. Ticket count baseline.
- If any item missing by Day 7 → 🔴 Alert

**Template:** DirtySnatcha_Advance_Email_Template.md
**Rider:** Customized per show (see Rider System)

**Deal inclusions check (required before sending):**
- Hotel included? YES / NO → include/exclude hotel section
- Ground transportation included? YES / NO → include/exclude ground section
- Rider included? YES / NO → attach/don't attach rider
- Flight/travel included? YES / NO → include/exclude flight section

### 2. Inbox Ingestion Workflow
**Problem being solved:** Critical emails (ticket counts, advance requests, offers) were sitting unread for days. VP at SiriusXM BPM sat with no music submission for 29 days.

**Logic:**
- Eventbrite daily updates → auto-parse ticket count, flag shows under 10% capacity with 30+ days out
- Subject line patterns → classify as: Offer / Advance Request / Ticket Count / Contract / Deposit / Promoter Follow-up / Label / Media
- VIP contacts (e.g., geronimo@siriusxm.com) → always 🔴 Urgent, never sits unread
- Drafts sitting over 48 hours → flag for review

**Labels schema:**
- TENx10/🔴 Urgent
- TENx10/🟡 This Week
- TENx10/💰 Financial
- TENx10/📄 Contracts
- TENx10/🎤 DirtySnatcha
- TENx10/🎵 WHOiSEE
- TENx10/🏷️ Label Operations
- TENx10/🤝 Collabs & A&R
- TENx10/🛠️ SaaS Build
- TENx10/⬜ Archive

### 3. Booking Evaluation Workflow
**Trigger:** Offer email received
**Process:** Parse offer from email (auto) → Run 6-step engine → Output: Accept / Counter / Decline with specific terms and math
**Handles:** Direct offers (20/80) vs. agent offers (10/10/80). Multiple date windows (MAD-style). Calendar conflict check. Routing logic.

### 4. Daily Briefing Workflow
**Trigger:** Morning / on demand
**Format:**
```
Good {morning/afternoon}, {name}. Here's what matters today.

🔴 URGENT — DO TODAY:
• [Specific action with exact details, amounts, names]

🟡 THIS WEEK:
• [Action with deadline]

📊 METRICS CHECK:
• {key_metric}: {value} ({trend})

💡 RECOMMENDATION:
{One strategic recommendation based on actual data}
```

### 5. Music Submission Workflow (Industry Contacts)
**Trigger:** Inbound from media/radio/DSP contact or outbound pitch
**Process:** Build playlist on SoundCloud (one link, press play — not multiple links). Include released + unreleased (cleared) tracks. Label tracks as collabs (Artist x Artist) not "ft." for equal collaborations. Offer broadcast WAVs on request, don't attach cold. Follow up in 5 business days if no response.
**VIP contact logged:** Geronimo @ SiriusXM BPM — geronimo@siriusxm.com / emily.doherty@siriusxm.com. Live set + interview committed.

### 6. Release Payload Workflow
**Standard fields per release:**
- release_date, distributor (VMG), artist_display_name (lowercase)
- spotify_uri, apple_id (filled post-delivery)
- isrc_code, bpm, mood_purity_tag, energy_grade
- spotify_pop_index_target (default 30), apple_lav_target (default 0.65)
- amazon_alexa_script, pandora_aam_wav_url, shorts_pivot_status

---

## RIDER SYSTEM
**Scope: GLOBAL — applies to every artist on the platform**

### Structure
Every artist on the platform has a rider with two sections:
1. **Technical** — equipment specs (standard per artist, updated per venue when needed)
2. **Hospitality** — fixed items + one wildcard item per show

### Wildcard Hospitality Item (Global Feature)
Every artist has one wildcard hospitality item that rotates per show market. This is a platform-level feature, not artist-specific.
- Changes every show — must be regional and specific to the market
- Tracked historically per show across the artist's profile
- Becomes part of the artist's brand identity with promoters
- Delivery: two framed/physical copies (one DJ booth, one green room) + optional third for promoter to keep
- Each artist defines their own wildcard rule in their profile (see below)
- Platform generates the market-specific version automatically when building the advance

### Artist Wildcard Configuration (Set in Artist Profile)
Each artist sets their wildcard rule once in their profile. The platform applies it to every new market.

| Field | Description | Example |
|---|---|---|
| wildcard_item_name | What to call it | "The Queen of England Demand" |
| wildcard_rule | The rule for generating it | "Queen of England doing something a tourist would do in the show's city" |
| wildcard_tone | Ridiculous / Heartfelt / Absurd / etc. | "Ridiculous" |
| wildcard_history | Log of past markets + items | Auto-populated per show |

### DirtySnatcha Wildcard — "The Queen of England Demand"
**DirtySnatcha-specific configuration. Not the default for other artists.**
- wildcard_item_name: "The Queen of England Demand"
- wildcard_rule: The Queen of England doing something a tourist would do in the show's city/region
- wildcard_tone: Ridiculous
- History:
  - Lincoln, NE: Queen riding Archie the mammoth / doing tourist things in Nebraska
  - Albuquerque, NM: Queen eating green chile in Old Town Albuquerque
  - Butte, MT: Queen panning for gold at the Berkeley Pit / drinking a Butte Special at a local bar

### Rider Naming Convention (Global)
`{ArtistName}_Rider_{City}_{MMDDYYYY}.docx`
- DirtySnatcha_Rider_ABQ_03062026.docx
- DirtySnatcha_Rider_Butte_05022026.docx

---

## PLATFORM UI

### Unified Chat Interface
One chat box. Dual engine backend. User never sees which engine handled it. Optional small tag ("via Claude" / "via Gemini") — TBD on visibility.

### React App Prototype (tenx-app.jsx) — Built March 3
Four tabs — all hitting Claude API with Gmail MCP:
1. **Daily Briefing** — Gemini pulls live data, Claude reasons and prioritizes
2. **Tour Status** — scans confirmed show emails, builds tour grid with alerts
3. **Offer Evaluator** — scans new offer emails, runs 6-step engine, outputs recommendation + draft reply
4. **Chat** — free-form unified command interface

### Data Sources Connected
- Gmail (MCP) — read + draft (Claude side). Full read/write/label/archive (Gemini side)
- Google Calendar (MCP) — routing conflicts, availability checks
- Google Drive — read (Claude). Full create/save/organize (Gemini + Imagen 3)
- Meta Ads (MCP) — campaign spend, performance, execution
- Anthropic API — claude-sonnet-4-20250514
- Gemini API — content generation, execution layer (to be connected)

---

## KNOWN GAPS / NEXT TO BUILD

**Architecture:**
- [ ] Gemini API connection + tool setup (Gmail write, Drive write, Imagen 3, Meta execute)
- [ ] Router agent build (lightweight classifier, tools-based routing)
- [ ] Supabase schema setup (shared data layer)
- [ ] ai_conversations table (unified history across both engines)

**Content:**
- [ ] Auto content creation pipeline (Module 22) — trigger events wired to shows table
- [ ] Imagen 3 asset generation connected to Claude content briefs
- [ ] Post scheduling via Meta/TikTok API (Gemini side)
- [ ] Content performance tracking → feed back to Claude

**Data:**
- [ ] Catalog ingestion (DirtySnatcha tracks, ISRCs, Popularity Scores per track)
- [ ] Eventbrite auto-parse (ticket count → tour grid update)
- [ ] Show folder auto-creation in Drive on confirmation
- [ ] Auto-save rider to show folder after generation
- [ ] VMG/Assets platform integration for release delivery tracking

**Artists:**
- [ ] WHOiSEE artist profile
- [ ] Dark Matter artist profile
- [ ] OZZTIN / MAVIC / PRIYANX label profiles
- [ ] Promoter grade system (post-show scoring)

**Product:**
- [ ] Product name — TBD (working names: AMOS / TENx10)
- [ ] Module 21 inbox rules wired to Gemini Gmail execution
- [ ] Watched thread queue in dashboard UI

---

## LABEL ROSTER (DirtySnatcha Records)
- DirtySnatcha (headline artist, test case)
- WHOiSEE (NC) — active, Circus Records UK EP deal in progress
- Dark Matter (Chicago/Knoxville) — active, Wakaan release
- OZZTIN
- MAVIC
- PRIYANX

---

## GUARDRAILS (Non-Negotiable)
- Never give legal advice
- Never guarantee outcomes — use "based on comparable shows, expected X"
- Never fabricate metrics — if data isn't available, say so
- Never auto-execute financial transactions
- Never share label financials with artist-tier users
- Always cite data source
- Always check permission level before revealing data

---

*Built session by session from real operational problems — DirtySnatcha Records, March 2026*
