# DSR PLATFORM — AI AGENT KNOWLEDGE ARCHITECTURE v2.0
# PART 1: FOUNDATION — System Architecture, Identity, Permissions, Onboarding
# Builder: Claude (Layer 1) | Consumer: Gemini API (Layer 3)
# Generated: March 2, 2026

---

# MODULE 1: SYSTEM ARCHITECTURE & DATA FLOW

## Three-Layer Pipeline

Every AI response follows this exact pipeline:

```
USER INPUT → User asks question or triggers action via frontend (desktop or mobile PWA)
    ↓
INTENT CLASSIFIER → Backend classifies user intent to select knowledge module(s)
    ↓
CONTEXT ASSEMBLY → Backend queries Supabase for user-specific data
    → Filtered by Row Level Security (user only sees their permitted data)
    → Pulls: artist_profile, shows, releases, dsp_metrics, campaigns, assets
    ↓
KNOWLEDGE INJECTION → Attaches relevant module(s) from this document
    ↓
AI AGENT (Gemini API) → Receives: system prompt + knowledge module(s) + user data + message
    ↓
RESPONSE → Agent responds using artist's actual data + operational rules
    ↓
ACTION LOG → Response and any triggered actions stored in ai_conversations table
```

## Intent Classification Map

| User Intent | Modules Loaded | Data Tables Queried |
|---|---|---|
| Booking / show offer | 5, 6, 7 | shows, artist_profiles, promoters, venues |
| DSP / streaming | 8 | dsp_metrics, releases |
| Content / marketing | 9, 10, 11 | shows, releases, campaigns, assets |
| Release planning | 12 | releases, dsp_metrics |
| Demo submission (label only) | 13 | submissions, label settings |
| Email / outreach | 18 | shows, artist_profiles, promoters |
| Multi-artist overview | 14, 16 | All artist_profiles under manager/label |
| Daily briefing | 14, 15, 16 | Full profile scan across all artists |
| Financial question | 7 | shows, payments, commissions |
| Who / contact info | 2, 19 | users, contacts, promoters |

---

# MODULE 2: USER IDENTITY MODEL

Every Gemini API call includes the user's context object. This defines the exact shape per tier. Null fields mean the AI should ask for the data or skip that logic.

## Tier 1 — Artist Context Object

```json
{
  "user_type": "artist",
  "tier": "free | paid",
  "profile": {
    "artist_name": "string",
    "real_name": "string",
    "home_city": "string",
    "home_state": "string",
    "genre": "string",
    "subgenre": "string",
    "bio": "string",
    "profile_image_url": "string | null"
  },
  "socials": {
    "instagram": "string | null",
    "tiktok": "string | null",
    "twitter": "string | null",
    "youtube": "string | null",
    "soundcloud": "string | null",
    "facebook_group": "string | null"
  },
  "dsp": {
    "spotify_url": "string | null",
    "apple_music_url": "string | null",
    "monthly_listeners": "int",
    "spotify_popularity": "int",
    "spotify_followers": "int",
    "soundcloud_followers": "int"
  },
  "distribution": {
    "distributor": "string",
    "label_name": "string | null",
    "label_id": "uuid | null"
  },
  "booking": {
    "minimum_guarantee": "int",
    "typical_guarantee_range": "string",
    "shows_last_12_months": "int",
    "tier": "emerging | development | mid-level | established | headliner"
  },
  "goals": {
    "primary_goal_6mo": "string",
    "biggest_pain_point": "string",
    "optimization_focus": "viral_growth | touring_longevity"
  },
  "voice_profile_id": "uuid | null",
  "upcoming_shows": [],
  "latest_release": {},
  "active_campaigns": [],
  "decay_deadline": "date | null",
  "integrations": {
    "meta_pixel_id": "string | null",
    "ga4_id": "string | null",
    "bandsintown_id": "string | null"
  }
}
```

## Tier 2 — Manager Context Object

```json
{
  "user_type": "manager",
  "company_name": "string",
  "commission_rate": "float (e.g. 0.10)",
  "booking_handler": "manager | artist | booking_agent",
  "monthly_marketing_budget": "int",
  "budget_approver": "manager | artist",
  "roster": [
    "...full artist context objects..."
  ],
  "roster_count": "int",
  "total_guaranteed_income": "int (sum of all show offers across roster)",
  "outstanding_deposits": "int (count overdue/pending)",
  "next_show": "...nearest show across entire roster...",
  "active_alerts": []
}
```

## Tier 3 — Label Context Object

```json
{
  "user_type": "label",
  "label_name": "string",
  "genre_focus": ["string"],
  "distributor": "string",
  "website": "string | null",
  "roster": [
    "...full artist context objects with permission_level..."
  ],
  "roster_count": "int",
  "also_manages": "boolean",
  "manager_context": "...manager context if also_manages...",
  "ar_config": {
    "accepts_demos": "boolean",
    "voter_count": "int",
    "voting_rule": "string (e.g. '2 of 3')",
    "scoring_criteria": [
      { "name": "Quality", "weight": 0.40 },
      { "name": "Reach", "weight": 0.30 },
      { "name": "Fit", "weight": 0.30 }
    ],
    "auto_reject_threshold": "int | null"
  },
  "release_pipeline": [],
  "marketing_budget": "int",
  "budget_allocation_method": "equal | weighted | manual"
}
```

## Artist Tier Auto-Classification

The AI auto-calculates tier from onboarding data:

| Tier | Monthly Listeners | Spotify Popularity | Shows (12mo) | Typical Guarantee |
|---|---|---|---|---|
| Emerging | < 10,000 | < 20 | 0-5 | $0 - $500 |
| Development | 10,000 - 50,000 | 20-35 | 5-15 | $500 - $1,500 |
| Mid-Level | 50,000 - 250,000 | 35-50 | 15-40 | $1,500 - $5,000 |
| Established | 250,000 - 1,000,000 | 50-70 | 40+ | $5,000 - $15,000 |
| Headliner | 1,000,000+ | 70+ | 50+ | $15,000+ |

---

# MODULE 3: PERMISSION & ACCESS LOGIC

**CRITICAL: If these permissions are wrong, you get sued.** An artist on a label roster must NEVER see another artist's guarantee, the label's internal financials, or promoter grades.

## Permission Matrix

| Data Type | Artist (Tier 1) | Manager (Tier 2) | Label (Tier 3) |
|---|---|---|---|
| Own DSP metrics | ✅ | ✅ (all roster) | ✅ (all roster) |
| Own show details | ✅ | ✅ (all roster) | ✅ (all roster) |
| Show guarantee amount | Only if label allows | ✅ | ✅ |
| Commission breakdown | ❌ | ✅ | ✅ |
| Promoter grades | ❌ | ✅ | ✅ |
| Venue grades | ❌ | ✅ | ✅ |
| Other artists' data | ❌ | Only their roster | Only their roster |
| Label financials | ❌ | ❌ (unless label owner) | ✅ |
| Marketing budget allocation | Own campaigns only | ✅ (all roster) | ✅ |
| A&R submissions | Own submissions only | ❌ | ✅ (full queue) |
| Release pipeline | Own releases only | ✅ (all roster) | ✅ |
| Content calendar | ✅ | ✅ (all roster) | ✅ |
| Asset library | Own assets | All roster assets | All roster + label assets |

## Label → Artist Visibility Control

When a label adds an artist and gives them a Tier 1 login, the label sets visibility:

- **Full Visibility:** Artist sees their guarantee, show details, DSP metrics, content calendar, campaigns. Does NOT see other artists or label financials.
- **Limited Visibility:** Artist sees show dates and content calendar but NOT guarantee amounts, ad spend, or promoter details.
- **No Access:** Artist has no login. All management through the label dashboard.

## AI Agent Permission Enforcement

Even if broader data leaks into the Gemini prompt, the agent MUST:

- Never mention another artist's guarantee or financials to a Tier 1 user
- Never reveal promoter grades to Tier 1 users — say "I'd recommend requiring a deposit for this promoter" without revealing why
- Never reveal label marketing budgets or allocation to Tier 1 users
- If Tier 1 asks "how much is [other artist] getting paid?" → "I can only share your own financial details."
- If Tier 2 asks about an artist NOT on their roster → "That artist isn't in your roster."

---

# MODULE 4: ONBOARDING → BIBLE PIPELINE

## Onboarding Design Principle

Onboarding is a CONVERSATION, not a form. The AI agent asks questions one at a time (or in logical groups of 2-3), adapts based on answers, and skips questions when OAuth data is available. Must feel like talking to a manager, not doing taxes.

## Tier 1 — Independent Artist (17 questions, ~5 minutes)

### Identity (auto-pull where possible)
1. What's your artist name?
2. What genre do you make? (dropdown: bass music, dubstep, house, DnB, trap, experimental, other)
3. What subgenre? (free text — critical for ad targeting)
4. Where are you based? (city, state)
5. Are you signed to a label? If yes, which one?
6. Do you have a manager? If yes, their name and email.

### DSP & Distribution
7. Connect Spotify for Artists (OAuth) — auto-pulls monthly listeners, popularity, top cities
8. Who is your distributor? (dropdown: DistroKid, TuneCore, VMG, CD Baby, AWAL, United Masters, other)
9. When was your last release? (date)
10. How often do you release music? (dropdown: weekly, biweekly, monthly, every 6-8 weeks, quarterly, irregularly)

### Touring & Booking
11. Have you played live shows? (yes/no — gates different paths)
12. What's the lowest guarantee you'd accept? (dollar amount — becomes floor)
13. How many shows in the last 12 months? (number)
14. Any upcoming shows? (if yes → intake form per show)

### Goals (Psychological Questions)
15. What's your #1 goal for the next 6 months? (dropdown: grow streams, book more shows, get signed, build fanbase, make money, release EP/album)
16. What's your biggest pain point right now? (free text — shapes AI priorities)
17. Are you optimizing for viral growth or touring longevity? (binary — fundamentally changes all advice)

## Tier 2 — Manager (11 additional questions + Tier 1 per artist)

1. Management company name (or your name if solo)
2. How many artists do you manage? (determines roster slots)
3. Your commission rate (percentage — typically 15-20%)
4. Who handles booking — you, the artist, or a booking agent? (per artist)
5. [Run full Tier 1 for each artist on roster]
6. Per artist: what phase is this artist in? (development, emerging, mid-level, established)
7. Per artist: what's their priority this quarter? (free text)
8. Per artist: any active contracts or deadlines? (free text)
9. Total monthly marketing budget across all artists? (dollar amount)
10. Who approves marketing spend — you or the artist? (per artist)
11. Auto-generate daily task lists? (yes/no)

## Tier 3 — Label (16 additional questions + Tier 1 per artist)

1. Label name
2. Genre focus (can be multiple)
3. Distributor (label default)
4. Roster count
5. Do your artists have their own management, or do you manage them?
6. [Add each artist → runs Tier 1]
7. Permission level per artist (full / limited / no access)
8. Does each artist get their own login? (per artist)
9. Standard release cycle (e.g., 1 release every 6 weeks across roster)
10. Accept outside demo submissions? (yes/no → gates A&R module)
11. If yes: how many decision-makers vote?
12. Voting rule (e.g., 2 of 3 must approve)
13. Scoring criteria and weights (configurable)
14. Monthly marketing budget
15. How do you split ad spend across roster? (equal, weighted, manual)
16. Track royalties through platform? (yes/no — future feature flag)

## Bible Auto-Generation

After onboarding, the system auto-generates the user's Operating Bible. The AI takes all answers + OAuth data and produces a structured document with these sections:

### Artist Bible Structure
1. **Identity** — Artist name, genre, subgenre, home market, label/management status
2. **Market Position** — Tier classification, monthly listeners, popularity index, comparable artists
3. **Booking Rules** — Minimum guarantee (floor), target range, market history, cost-per-ticket targets
4. **DSP Baseline** — Current metrics across all platforms, save ratio, decay deadline
5. **Release Strategy** — Release frequency, next release deadline, waterfall plan
6. **Content Voice** — Tone, emoji patterns, caption style, platform rules (from voice profile)
7. **Goals & Priorities** — Primary goal, optimization focus, pain points, quarterly priorities
8. **Active Operations** — Upcoming shows, active campaigns, pending tasks

### Manager Bible adds:
9. **Roster Overview** — All artists with tier, priority, and status
10. **Financial Summary** — Total guaranteed income, outstanding deposits, commission projections
11. **Calendar View** — All shows across roster, sorted by date

### Label Bible adds:
12. **Roster Permissions** — Who sees what
13. **A&R Configuration** — Voting rules, scoring criteria, submission pipeline
14. **Release Pipeline** — All upcoming releases across catalog
15. **Marketing Allocation** — Budget split across roster

The Bible is regenerated weekly (Sunday night) to reflect updated metrics, new shows, and completed tasks. Users can also trigger a manual refresh.

---

*End of Part 1 — Foundation*
