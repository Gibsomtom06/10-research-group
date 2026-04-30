# Digital Booking Agent (DBA)

**Status:** Product spec. Supersedes the earlier "Booking Evaluator" scope.
**Owner venture:** 10 Research Group → product line (sold to artists/managers, used internally on DSR roster).
**First deployment:** DirtySnatcha (Thomas's artist). Dogfood, then sell.
**Positioning:** Not a tool. A top-tier autonomous booking agent that works a roster 24/7, takes initiative, and is indistinguishable from a human agent on the other end of email/DM.

---

## 1. What this actually is

Top-tier booking agents don't just respond to offers. They:
- Keep a living map of every talent buyer, venue, promoter, and manager they've ever worked with.
- Pitch proactively — they pick up the phone (or the email, or the DM) before an offer exists.
- Route tours. They know which cities pair with which, which venues are Tues/Wed plays, which promoters return calls, and which weekday holes can be filled with secondary markets.
- Evaluate offers against a decision engine (guarantee vs expenses vs audience growth vs strategic value).
- Counter, negotiate, and close.
- Build new market relationships — cold outreach to buyers in cities the artist has never played.
- Keep the artist's reputation intact — tone, cadence, subject lines, follow-up rhythm all match a real human professional.

**DBA is all of that, run by Claude, wearing Thomas's name.** No one on the receiving end should suspect AI. The tell for AI-written outreach is wrong tone, wrong cadence, wrong context, and no memory of prior relationships. DBA fixes all four by being grounded in real CRM, real history, and a brand-voice model trained on Thomas's actual sent mail.

## 2. Core capabilities (what DBA does autonomously)

| # | Capability | Trigger | Supervisor check |
|---|---|---|---|
| 1 | **Inbound offer evaluation** | New email/DM matches offer pattern | Reuses existing `dsr-booking-evaluator` skill as subroutine; flags YELLOW/RED for Thomas review |
| 2 | **Counter-offer drafting** | Evaluator says GREEN with adjustments | Drafts in Thomas's voice; sends autonomously if counter is within pre-approved band, else queues |
| 3 | **Tour routing** | Any confirmed date creates route planning pass | Fills gaps: identifies compatible cities within driving distance + compatible day-of-week slots |
| 4 | **Proactive outreach — known contacts** | Weekly cadence, or when a tour gap exists | Pulls from CRM, sends personalized pitch referencing prior history (last show, last conversation, mutual connections) |
| 5 | **Proactive outreach — new markets** | Gap in a region, or strategic market expansion goal | Researches venues + buyers + promoters in target city, drafts cold outreach that mentions specific local context (other acts booked, room capacity, local scene) |
| 6 | **Weekday-fill hunting** | Any confirmed Fri/Sat in a region | Finds nearby secondary/tertiary markets with Tue/Wed/Thu slots, pitches fill dates |
| 7 | **Contract + rider handling** | Offer moves to contract stage | Drafts from templates, flags non-standard clauses, never signs — always queues for Thomas |
| 8 | **Relationship hygiene** | Contacts not reached in 90+ days | Drafts a non-salesy touchpoint (congrats on their recent booking, check-in, forward a track) |
| 9 | **Follow-up loop** | Any outbound pitch sitting unreplied 7 days | Follow-up #1; 14 days → follow-up #2; 30 days → move to cold, resume in 90 |
| 10 | **Reporting back to Thomas** | Daily briefing + weekly digest | Summarizes what went out, what came back, what needs his decision, hot opportunities |
| 11 | **Data-backed pitch packs** | Every outbound pitch | Analyst agent generates 2–3 hard numbers per pitch that sell the artist to THIS buyer for THIS market |
| 12 | **Personability layer** | Every outbound touch | Surfaces specific, recent, true praise about the buyer/venue — the stuff a well-connected human agent would know |

## 3. The Analyst agent — data-backed, personable pitches

Pitches close when they do two things at once: **prove the artist will draw** and **make the recipient feel known**. Generic "we'd love to play your venue" emails die. DBA's Analyst agent is what makes every outbound personable, specific, and defensible with numbers.

### 3.1 Artist-side data (selling DirtySnatcha to the buyer)

The Analyst agent maintains a living data pack on the artist and pulls the right slice for each pitch.

| Data source | What it gives us | Use in pitch |
|---|---|---|
| Spotify for Artists | Monthly listeners by metro, top 10 cities, audience age/gender, growth trend | "You've got ~4,200 monthly listeners in the Detroit DMA, up 38% in the last 90 days" |
| YouTube Analytics | Views + watch time by geo, top-performing videos by market | "The most-viewed DirtySnatcha track in your market is X with Y watch hours last 28 days" |
| Instagram / TikTok insights | Followers by city, engagement rate, top posts by region | "~6.8K engaged IG followers in the metro, top city for the last reel" |
| Past show attendance | Tickets sold, sell-through %, capacity comparison | "Last play in Cleveland: 312 paid at a 400-cap, sold out the balcony" |
| Chartmetric / Soundcharts (when budget allows) | Playlist reach, radio adds, competitor benchmarks | "Playlisted next to [similar act that just played your room]" |
| Streaming trend curves | Growth velocity, not just raw numbers | "Track Z is up 4x month-over-month — we're timing the tour to that window" |

**Rule:** every pitch contains at least one number that ties the artist to the buyer's specific market. No market data = pitch doesn't send.

### 3.2 Buyer/venue/market-side data (showing we know their world)

| Data source | What it gives us | Use in pitch |
|---|---|---|
| Past booking history at that venue | Who they've hosted, what drew well, gaps in their calendar | "Noticed you hosted [similar act] in February — similar BPM range, same demo" |
| Songkick / Bandsintown / venue calendars | What's coming up, what nights are empty | "I see Tuesdays are open through May" |
| Local scene signals (Reddit, regional Substacks, IG geo-tags) | What's trending in that city right now | "The [local festival] announcement last week puts this window in a good light" |
| Metro demographic data (Census, Nielsen DMAs) | Population age distribution, income, music consumption indexes | For cold markets where we have no prior play history |
| Ticket aggregators | Avg ticket price for comparable acts in that market | Supports our guarantee ask or counter |
| The buyer's recent wins (social posts, press mentions, Pollstar) | Genuine praise material | "Saw the [specific show] sold through in 4 days — congrats on that one" |

**Rule:** every cold-market pitch references at least one specific, verifiable thing about the buyer or venue. No generic "I love your venue." Either we know something true about them or we don't send.

### 3.3 Personability — how praise lands

Praise only works when it's **specific, recent, and true**. The Analyst agent feeds the Outbound agent three categories of praise material:

1. **Recent win** — a show they sold, an act they broke, a press mention, a room renovation. Dated within 90 days.
2. **Taste signal** — something they booked that shows they share DirtySnatcha's genre sensibility. "You had [X] in October — that's exactly the crowd we draw."
3. **Personal thread** — if CRM has a real note (their dog, their move, their new baby), use it. If not, skip — never fabricate.

Hard rules:
- Never generic flattery. "Great venue" is banned.
- Never invent a detail. If we can't verify it, we don't say it.
- Max one praise element per pitch. More than one reads sycophantic.
- Praise comes in the first 2 sentences or not at all — buried praise feels tacked-on.

### 3.4 The pitch-pack format (what Analyst hands to Outbound)

Before any outbound pitch, Analyst produces a short JSON block that Outbound composes from:

```
{
  "recipient": "Jane Promoter, Jane@SmallRoom.com",
  "venue": "Small Room, Columbus OH",
  "praise_hook": "Noticed Small Room just announced the spring weekender — Thursday lineup looks tight",
  "artist_market_stat": "DirtySnatcha has 3,100 monthly Spotify listeners in the Columbus DMA, up 22% in 60 days",
  "fit_rationale": "Your April booking of [Comp Act] drew ~280 paid; our Cleveland show in Feb pulled 312 in a 400-cap — similar audience, similar size room",
  "ask": "Tuesday May 19 or Wednesday May 20, routing between Cleveland (May 17) and Chicago (May 22)",
  "counter_bounds": { "min_guarantee": 1200, "target": 1800, "walk_away": 800 },
  "references": ["https://artists.spotify.com/...", "https://songkick.com/..."]
}
```

The Outbound agent then writes the email in Thomas's voice using this as the skeleton — never dumping the JSON, always prose. Analyst's output is the brief; Outbound is the writer.

## 4. The "undetectable as AI" requirements

This is the product differentiator. If the buyer on the other end thinks "this is an agent using AI," the deal is dead. Personable, data-backed pitches are the single biggest thing that makes Thomas look like Thomas and not like a bot.

**Voice grounding:**
- Trained on Thomas's actual sent mail (Gmail export + Slack DMs with industry contacts if available).
- Matches his idiom, punctuation, how he signs off, whether he uses "hey" or "hi" or first-name only, his typical email length.
- The `brand-voice` skill runs on every outbound draft before send.

**Cadence grounding:**
- Real humans don't email at 3:47am. DBA schedules sends within Thomas's historical active hours (+/- jitter).
- Real humans don't send 40 emails in 6 minutes. DBA paces outbound with natural gaps.
- Real humans take weekends off (unless Thomas doesn't — learn from his pattern).

**Memory grounding:**
- Every contact has a relationship file: last show, last email, mutual acts, open threads, personal notes (their kid's name if Thomas has ever mentioned it, the venue's recent renovation, the promoter's move to a new city).
- Every pitch references real shared history, not generic flattery.

**Tell-avoidance:**
- No em-dashes in outbound email (LLM tell).
- No "I hope this finds you well."
- No tri-colons ("our goals, our vision, our values").
- No "Let me know if you have any questions!" sign-off unless Thomas uses it.
- No bullet points in short pitches — prose only, the way humans write email.
- Subject lines matter: short, lower-case preferred if that's Thomas's pattern, no sales-copy flavor.

**Fallback on ambiguity:**
- If DBA is 95% confident in a response: send.
- 80–95%: queue for Thomas with a one-line summary, auto-send at 2hr cutoff unless he pauses.
- <80%: hold for Thomas.
- Anything touching money over a threshold, contracts, or a relationship Thomas flags as sensitive: always hold.

## 5. Architecture — Supervisor + PES + Reversible

Maps directly to `funding-my-life` patterns. Analyst sits upstream of Outbound — every pitch gets a pitch-pack before a draft is written.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SUPERVISOR (Claude)                           │
│  Routes work, verifies output, handles escalation to Thomas           │
└───┬───────────┬────────────┬────────────┬────────────┬────────────┬──┘
    │           │            │            │            │            │
    ▼           ▼            ▼            ▼            ▼            ▼
┌────────┐ ┌─────────┐  ┌────────┐  ┌─────────┐  ┌──────────┐ ┌──────────┐
│INBOUND │ │ ANALYST │→→│OUTBOUND│  │ ROUTING │  │ RESEARCH │ │ REPORTING│
│ agent  │ │ (data + │  │ agent  │  │  agent  │  │  agent   │ │  agent   │
│        │ │ pitch   │  │        │  │         │  │          │ │          │
│        │ │ packs)  │  │        │  │         │  │          │ │          │
└───┬────┘ └────┬────┘  └───┬────┘  └────┬────┘  └────┬─────┘ └────┬─────┘
    │          │            │            │            │             │
    └──────────┴────┬───────┴────────────┴────────────┴─────────────┘
                   ▼
    ┌───────────────────────────────────────────────┐
    │  Shared state (Supabase)                      │
    │  - contacts (CRM)                             │
    │  - venues                                     │
    │  - markets                                    │
    │  - offers (in-flight)                         │
    │  - confirmed shows                            │
    │  - outreach_log (every send + reply)          │
    │  - voice_samples (Thomas's writing)           │
    │  - decisions (audit trail)                    │
    │  - artist_data (Spotify, YT, IG, attendance)  │  ← Analyst reads/refreshes
    │  - buyer_signals (recent wins, venue history) │  ← Analyst reads/refreshes
    │  - pitch_packs (what Outbound composes from)  │  ← Analyst writes
    └───────────────────────────────────────────────┘
```

**Analyst agent responsibilities:**
- Nightly refresh of artist-side data (Spotify/YT/IG/TikTok by market).
- On-demand lookup of buyer/venue signals when a pitch is queued.
- Generate the pitch-pack JSON before Outbound composes.
- Maintain a freshness index — no praise older than 90 days, no stat older than 30.
- Surface "opportunity flags" to Supervisor when data reveals a moment (a market is trending up 50% MoM, a venue just announced a gap).

Each specialist agent runs **Plan-Execute-Summarize**:
1. **Plan** — state what it's about to do and why, reference CRM + history.
2. **Execute** — draft, research, or send.
3. **Summarize** — log what happened, update state, surface to supervisor.

**Reversible Reasoning:** before any outbound send the draft is written to `outreach_log` with status=draft. If evaluation catches a mistake at any step (wrong tone, wrong market, stale context), the draft is rolled back without firing. No ghost emails go out.

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Orchestration | LangGraph | Graph-based agent routing, native checkpointing = Reversible Reasoning for free |
| LLM | Claude (API, not Claude Max — this is a hosted product eventually) | Voice quality, reasoning, tool use |
| Email | Agent Mail (from funding-my-life stack) or Gmail API | Autonomous send, thread awareness |
| CRM / state | Supabase | Already our standard; artist can own their data |
| **Analyst — artist data** | Spotify for Artists API, YouTube Data API, Meta Graph API (IG), TikTok Business API | Monthly listeners by metro, watch time by geo, follower-by-city, engagement rates |
| **Analyst — buyer/market data** | Songkick + Bandsintown APIs, Pollstar (when budget), Nielsen DMA reference data, Census demographic API, targeted scrapers for local venue calendars | What's on their calendar, what drew, market demographics |
| **Analyst — praise material** | Custom IG / Substack / Reddit scrapers + Google Alerts on buyer names and venue names | Fresh, specific, true praise hooks |
| **Analyst — trend detection** | Chartmetric or Soundcharts API (paid tier when revenue justifies) | Growth velocity, playlist reach, competitor benchmarking |
| Research | Claude with web_search + custom venue/promoter scrapers | Local context for new markets |
| Voice training | Claude + few-shot from Thomas's sent-mail corpus | No fine-tune needed; prompt-level is sufficient with Claude |
| Scheduling | Vercel cron for cadence jobs (weekly pitches, follow-ups, nightly data refresh) | Zero infra |
| UI | Next.js dashboard for Thomas: inbox view, pending approvals, pipeline, tour map, **artist data heat map by market** | Same stack as TENx10 |

## 7. The dogfood plan — DirtySnatcha first

**Phase 0 — CRM build (week 1)**
- Import every promoter, venue, buyer, manager Thomas has ever worked with.
- Pull from: Gmail contacts, past show contracts, Instagram DM history, any spreadsheet he's got.
- Enrich each record: venue capacity, typical nights of week, last known booking contact, last interaction date, notes.
- Target: 200+ contacts minimum, ranked by strength of relationship.

**Phase 1 — Voice training + data wiring (week 1–2, in parallel)**
- **Voice:** Export Thomas's last 2 years of sent mail. Sample 30–50 representative emails across: cold outreach, negotiation, confirming, following up, casual check-in. Build a voice reference file (`voice-samples.md`) that DBA always consults.
- **Data integrations:** Connect Spotify for Artists, YouTube Analytics, Meta Graph (IG), TikTok Business. Pull 90 days of history. Build the artist data layer: monthly listeners by metro, top cities, audience age/gender, growth velocity, engagement by city.
- **Market seed data:** Songkick + Bandsintown ingest for every city in Thomas's CRM. Pull past 12 months of comparable-act bookings + attendance where available.
- **Output:** An "artist market heat map" Thomas can look at on day 10 showing where DirtySnatcha draws and where the growth curve is trending — before any pitch goes out.

**Phase 2 — Shadow mode (weeks 2–3)**
- DBA runs on inbound. Drafts responses. Does NOT send.
- Thomas reviews every draft, corrects, sends.
- Each correction becomes a new training example.
- Goal: 80%+ of drafts require zero edits by end of week 3.

**Phase 3 — Semi-autonomous (weeks 4–6)**
- DBA handles routine inbound unassisted (confirmations, scheduling, standard counters).
- Proactive outreach starts — known contacts first, 10 pitches/week, Thomas approves before send.
- Weekly briefing to Thomas.

**Phase 4 — Full autonomous (week 7+)**
- Cold-market outreach live.
- Weekday-fill hunting live.
- Tour routing live.
- Thomas reviews weekly digest + escalations only.

**Success metric for DSR deployment:**
- 30% more confirmed shows/quarter vs. Thomas alone.
- Zero "that email felt off" feedback from buyers.
- 5+ new-market bookings in first 90 days.
- Reply rate on outbound pitches ≥ 2x industry cold-email baseline (industry ~2%, target ≥ 5%) — driven by Analyst's market-specific data hooks.
- Praise-hook verification rate = 100% (every pitch's praise must trace to a real, dated source).

## 8. Productization — selling to other artists/managers

Once DSR dogfood shows it works, this becomes the flagship 10 Research Group product.

**Target customer:**
- Independent touring artists doing $50K–$500K/year in performance revenue
- Small management companies with 3–10 artists
- Mid-tier booking agencies that want to 3x their agent headcount without hiring

**Pricing (aligns with funding-my-life cost bands):**

| Tier | Price | Scope |
|---|---|---|
| MVP build for a single artist | **$25K one-time + $2K/mo** | CRM import, voice training, supervisor + 3 specialist agents, inbox integration, dashboard. 6–8 week delivery. |
| Enterprise (management company, 5+ artists) | **$150K one-time + $8K/mo** | Multi-tenant, per-artist voice models, shared venue DB, team dashboard, white-label option. 3–4 month delivery. |
| Agency platform (10+ agents worth of load) | **$300K+ custom** | Full org deployment, custom integrations (Prism, SMF, FastTrax), SOC2 path. 4–6 months. |

**Why they pay:**
- A human assistant booking agent costs $50K–$80K/yr + benefits. DBA replaces 60–80% of their work at a fraction of the cost and works 24/7.
- Bigger agencies pay because each DBA-equipped agent can carry 2–3x their current roster.

**Moat:**
- Voice training + relationship memory compound over time — ripping out DBA means starting over.
- Every artist we onboard teaches the shared market/venue intelligence layer (opt-in, anonymized).

## 9. Risks and guardrails

| Risk | Mitigation |
|---|---|
| DBA sends a bad email that embarrasses Thomas | Reversible Reasoning catches at draft stage; anything <80% confidence holds; daily audit log |
| Tone drift over time | Weekly regression test: sample 20 recent sends, score against voice rubric |
| Buyer figures out it's AI | Human-cadence scheduling + voice grounding + no sales-copy fingerprints + fallback to hold on ambiguity |
| Fake or stale stats in a pitch | Analyst enforces freshness window (stats ≤ 30 days, praise ≤ 90 days). Every stat in outbound mail links to a source row in `artist_data` or `buyer_signals` with a timestamp. Any unverifiable claim = pitch blocked. |
| Sycophantic or generic praise | Praise bank is dated and specific. If the top-ranked praise hook is older than 90 days or too generic, Outbound omits praise entirely rather than faking it. |
| Prompt injection via inbound email | Inbound agent isolates email content; never executes instructions from emails; flags suspicious inbound to Thomas |
| Legal (contracts, riders) | DBA drafts only. Humans sign. No exceptions. |
| Artist privacy / CRM leakage | Per-artist Supabase project with RLS; no cross-tenant access; encrypted voice samples |

## 10. What ships first (2-week milestone)

1. CRM schema + import script for Thomas's existing contacts
2. Voice-samples corpus + brand-voice reference doc
3. **Analyst agent v0 — artist data layer:** Spotify for Artists + YouTube + IG pulls, nightly refresh, metro-level rollups, market heat map on the dashboard
4. **Analyst agent v0 — buyer signals:** Songkick/Bandsintown ingest for every CRM contact's venue, Google Alerts on buyer/venue names for the praise bank
5. **Pitch-pack generator:** the JSON skeleton every outbound draft composes from
6. Inbound-only supervisor + evaluator subroutine (reuses existing `dsr-booking-evaluator` skill)
7. Draft-mode email composer (no auto-send yet) — composes from pitch-packs when outbound, from thread + evaluator when inbound
8. Simple dashboard: "Drafts awaiting Thomas" + "Market heat map"
9. First draft sent through shadow-mode review

**Demo moment for future sales:** record a 4-minute walkthrough showing (1) DBA pulling up a cold market, (2) Analyst surfacing a specific venue with a dated praise hook and a real local stat, (3) Outbound drafting the pitch in Thomas's voice with the hard number baked in, and (4) a side-by-side with Thomas's actual historical cold email to a similar buyer — so the prospect can see the agent indistinguishable from Thomas's own writing but better-armed with data. That's the sales asset.

## 11. How this fits the factory

- **Income architecture:** Automated Micro-SaaS / Agent-as-a-Service (from funding-my-life)
- **Agent patterns:** Supervisor Loop (routing) + PES (every specialist) + Reversible Reasoning (drafts before send)
- **Vertical:** Music industry — same vertical as TENx10 and DSR, so every tool feeds the others.
- **Bundling path:** DBA + TENx10 + brand-voice skill = "10 Research Group's full music stack" — single ARR customer buying three products.

**After Rim Shop (Client 0) proves we can ship paid agent systems, DBA is the flagship that opens the music-industry wallet.**
