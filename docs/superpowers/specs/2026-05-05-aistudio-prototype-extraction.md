# AI Studio Prototype — extraction + integration plan

**Date:** 2026-05-05
**Source app:** Google AI Studio app `c18d9c42-cb92-4740-bc79-9efa560e4fb4`, name **"TENx10"**, description *"The AI operations manager for artist management platforms. Multi-tenant SaaS for managers, labels, and artists to multiply operational efficiency across booking, streaming, and financials."*
**Local clone:** `C:\Users\slash\Projects\aistudio\` (Apr 29, 2026)
**Status:** Spec — captures what's in the prototype, what's already absorbed into the live umbrella, what's NOT yet absorbed (the parts to bring over).

---

## What the prototype is

A working Gemini-flash-powered SPA that prototyped the TENx10 platform's AI surface BEFORE the current Vercel/Supabase build. It's a single React app with a Node/Express server. Tech stack: Vite + React 19 + Tailwind + shadcn/ui + recharts + motion + lucide-react + `@google/genai` + `@anthropic-ai/sdk` + `googleapis` + `pdf-parse` + multer + cookie-parser.

The app contains **8 Gemini prompts** (one per workflow), **multi-platform OAuth** (Google / Spotify / Meta / TikTok), **Bandsintown** events integration, and a **generic `/api/guru/claude` Anthropic proxy**.

---

## Inventory: what's in the prototype

### A. Gemini system prompts (`src/lib/gemini.ts`)

| Function | Role | Notable |
|---|---|---|
| **`getGuruAdvice`** | The "X" (now Xai) operations manager — covers all 6 operational pillars | Has the canonical 6-pillar definition + voice rules + strict accuracy rules |
| **`analyzeOffer`** | TENx10 OFFER INTAKE AGENT — 6-step booking decision engine | Floor/Market/CPT/Calendar/Promoter/Marketing checks + counter-amount formula (MAX of 4 calculations) |
| **`researchPromoter`** | Google-Search-grounded promoter grading | JSON schema: `{name, grade A-F, city, social, contact, why}` |
| **`researchShowDetails`** | Show research with social grading | Pulls FB Event, ticket link, social posts; computes 0-100 social grade + HGR likely flag + ticket sales estimate |
| **`getOutreachSuggestions`** | Routing analyst | Identifies geographic/chronological gaps in tour dates → suggests target cities |
| **`parseDealInfo`** | Deal-term extractor from offer text | JSON: `{guarantee, netProfit, agentCommission, managerCommission, depositAmount, hgrIncluded, capacity}` |
| **`summarizeEmailThread`** | Thread analyzer | Last-email summary + extracted terms + pending actions |
| **`generatePitch`** | Booking pitch generator | Personalized email + pitch deck bullets + music link suggestions |

Model: `gemini-3-flash-preview` (worth flagging — that's a Gemini 3 preview model).

### B. Server-side integrations (`server.ts`)

| Endpoint | Purpose | Notable |
|---|---|---|
| `/api/auth/google/url` + `/auth/callback` | Google OAuth (Gmail/Drive/Analytics/YouTube) | Scopes incl. yt-analytics + analytics.readonly |
| `/api/auth/spotify/url` + `/auth/spotify/callback` | Spotify OAuth | Used `user-read-private user-read-email` |
| `/api/auth/meta/url` + `/auth/meta/callback` | Meta OAuth | `public_profile email instagram_basic` |
| `/api/auth/tiktok/url` + `/auth/tiktok/callback` | TikTok OAuth | `user.info.basic` |
| `/api/integrations/gmail/send` | Send Gmail with tracking pixel | Generates trackingId, embeds 1x1 pixel `<img>` linking to `/api/track/:id` |
| `/api/track/:id` | Email open tracker | Returns base64 GIF, logs opens |
| `/api/integrations/gmail/offers` | Find emails with subject:(booking OR offer OR inquiry), include attachments | |
| `/api/integrations/gmail/attachment/parse` | Download Gmail attachment + parse PDF | Uses `pdf-parse` |
| `/api/parse-pdf` | Parse uploaded PDF | Multer-based upload |
| `/api/integrations/gmail/thread` + `/api/integrations/gmail/search` | Thread fetch + global search | |
| `/api/integrations/drive/files` + `/api/integrations/drive/search` + `/api/integrations/drive/extract` | Drive list/search/text-extract | Handles PDFs + Google Docs/Sheets via export endpoint |
| `/api/integrations/bandsintown/events` | **Bandsintown public API for artist events** | App ID `bassbooking_guru` — pulls `https://rest.bandsintown.com/artists/{name}/events` |
| `/api/guru/claude` | Anthropic Claude proxy | Generic — accepts `{messages, systemPrompt}`, returns text. Uses `claude-3-5-sonnet-20240620`. |
| `/api/integrations/lovable/sync` | Lovable.co sync (probably legacy) | Generic API forward to `LOVABLE_API_URL` |

### C. Frontend data shapes (`src/App.tsx`)

Has typed interfaces that overlap with what TENx10 platform now models in Supabase:
- `TourDate` — confirmed/pending/gap status, guarantee, projected backend, ticket sales, capacity, FB event, social posts, social interactions, promo flyer, ticket rider, advance status, HGR included, email thread ID, offer sheet ID, assets folder ID, social grade, net profit, agent commission, manager commission, confirmation status, deposit amount + status, ticket link, follower count, last email summary, pending actions, media[]
- `MediaFile`, `CatalogItem`, `EmailLog`, `Lead`, `AudienceMarket`

These were the data model concepts. The current Supabase schema is more normalized but the prototype's flat `TourDate` interface is a useful "what does a tour-date row need on the dashboard" reference.

---

## What's already absorbed into the live umbrella

| Prototype feature | Live equivalent | Status |
|---|---|---|
| Xai operations manager prompt (6 pillars) | TENx10 platform `src/app/api/agent/route.ts` (Xai endpoint, Gemini flash) + `TENx10_Knowledge_Base/24_Agent_Team_Architecture.md` (specialist team architecture) | ✅ Live, evolved |
| 6-step booking decision engine | DBA `prompts/outbound_composer.md` § "Universal hard rules" + `TENx10_Knowledge_Base/29_Booking_Evaluator_Skill.md` (canonical) | ✅ Live, more comprehensive (KB 29 has 11 steps now incl. PDF parsing + radius matrix) |
| Email thread analysis | DBA `agents/inbound.py` + `prompts/inbound_classifier.md` | ✅ Live |
| Email send with tracking pixel | DBA `workers/sender.ts` (HMAC click redirect + 1x1 pixel + multipart MIME) | ✅ Live, hardened |
| Gmail offer fetching | DBA inbound supervisor loop + Gmail OAuth setup at `docs/GMAIL_OAUTH_SETUP.md` | ✅ Live (credentials pending paste) |
| PDF attachment parsing | DBA inbound classifier (Module 29 mandates PDF parsing on offer emails) | ✅ Live (in spec, implementation TBD) |
| Drive integration | TENx10 `/api/agent` Xai context loader (partial) + `mcp__claude_ai_Google_Drive__*` MCP tools | ✅ Partial |
| Pitch generator | DBA outbound composer + analyst pitch pack | ✅ Live, integrated with semantic voice retrieval (post-0017) |
| Anthropic Claude proxy | DBA `agents/model_router.py` (Python) — same generic shape, but server-side and with cost logging | ✅ Live, with cost ledger |
| Multi-platform OAuth (Google) | TENx10 platform Supabase Auth + Gmail OAuth via `gmail_oauth_setup.py` | ✅ Live |
| Spotify OAuth | TENx10 platform OAuth (Spotify for Artists connect on artist onboarding) | ✅ Live |

---

## What's NOT yet absorbed — bring these over

### 1. Bandsintown integration ⚠ NEW

**Endpoint:** `https://rest.bandsintown.com/artists/{name}/events?app_id={app_id}`
**App ID used:** `bassbooking_guru` (or set `BANDSINTOWN_APP_ID` env var)
**Why useful:** Pulls confirmed events for any artist by name. Good source for:
- Routing analysis (where is artist X playing?)
- Tour calendar verification (does the public BIT page match what's in the booking system?)
- Competitive intel (what is competitor / collaborator artist booked for?)

**Recommended landing:** New DBA task — call from DBA's research agent + the TENx10 platform's tour grid for cross-reference. Add Bandsintown App ID to `app/.env.example`.

### 2. Promoter research with Google-Search grounding ⚠ NEW SCHEMA

The prototype's `researchPromoter` returns a structured JSON array:
```typescript
{
  name: string,
  grade: 'A' | 'B' | 'C' | 'D' | 'F',
  city: string,
  social: string,        // Instagram/FB link
  contact: string,       // email or website contact page
  why: string            // grade justification
}
```
Uses Gemini's `googleSearch` tool for grounding.

**Already in 10RG:** DBA has a `promoter_grade` field on offers and a manual grading process. The Layer-1 booking-intelligence-engine spec mentions promoter research but doesn't lock the schema.

**Recommended landing:**
- Add this JSON schema to the booking-intelligence-engine spec.
- DBA task: implement a `research_promoter` tool that runs the prompt + Google Search and writes results to a `promoter_research` table.
- TENx10 platform: surface the promoter research output on the `/dashboard/contacts/[id]` view.

### 3. Show details researcher with social grading ⚠ NEW

`researchShowDetails` returns:
```typescript
{
  fbEvent: string,
  ticketLink: string,
  socialPosts: string[],
  hgrLikely: boolean,            // High Guarantee Rider likely required
  socialGrade: number,           // 0-100 from engagement
  socialAnalysis: string,        // explanation
  followerCount: number,
  postInteractions: number,
  ticketSalesEstimate: number    // forecast from social signals
}
```
**Why valuable:** Automates the "is this show actually going to sell" question by triangulating FB events + venue + promoter social signals.

**Recommended landing:** TENx10 platform per-show dashboard widget. Could feed into TENx10 KB Module 28 (Shazam Spike Campaign Spec) for pre-show forecasting.

### 4. Routing analyst ⚠ NEW

`getOutreachSuggestions` identifies geographic/chronological gaps in tour dates and suggests target cities.

**Why valuable:** Today DBA's outreach prioritizer (`v_target_score`) ranks specific (artist × contact × venue × tour) combos but doesn't actively suggest *new cities* the routing should fill. This is complementary.

**Recommended landing:** DBA task — call this prompt against `tour_targets` to surface routing gaps + suggest target cities. Show in `/outreach/priorities` UI as a "routing gaps" panel.

### 5. Deal-term extractor ⚠ NEW SCHEMA

`parseDealInfo` extracts:
```typescript
{
  guarantee, netProfit, agentCommission, managerCommission,
  depositAmount, hgrIncluded, capacity
}
```
from arbitrary offer text.

**Already in 10RG:** DBA has `offers` table with these fields, but population is currently a mix of structured input (offer form) + analyst-pitch-pack derivation. A clean extractor on raw email text complements existing flows.

**Recommended landing:** DBA task — wire this prompt into `agents/inbound.py` so when an inbound email is classified as `offer`, the extractor auto-populates the offer fields for Thomas to confirm.

### 6. Multi-platform OAuth (Meta + TikTok) ⚠ NEW SURFACES

The prototype already has the OAuth dance for Meta (Instagram Basic) and TikTok. Currently:
- DBA has Gmail OAuth setup
- TENx10 has Spotify (S4A) connect at onboarding
- Meta Ads MCP exists at the Claude / Anthropic side (read-only on ad accounts)
- **No Meta Instagram-Basic or TikTok** in the live stack yet

**Recommended landing:** TENx10 platform — add Meta + TikTok connect to the artist onboarding flow. Useful for content engine + post-publishing analytics.

### 7. Email-thread summarizer prompt ⚠ NEW

`summarizeEmailThread` returns `{lastEmailSummary, extractedTerms, pendingActions}` from a raw email thread.

**Already in 10RG:** DBA has `agents/inbound.py` + `prompts/inbound_classifier.md` for classification but doesn't summarize multi-message threads explicitly.

**Recommended landing:** DBA — a new agent or sub-skill that runs on `email_threads` rows to produce a per-thread summary + pending actions. Could feed `/drafts` and `/reminders` UIs.

### 8. The "X / Xai" 6-pillar prompt — verbatim canonical version ⚠ COPY-OVER

The prototype's `getGuruAdvice` system prompt is a clean canonical articulation of the 6 operational pillars + voice rules + accuracy rules. Worth fold-in:

> ## THE SIX OPERATIONAL PILLARS:
> 1. Booking & Touring: Offer evaluation, 6-step logic, CPT analysis, tour P&L.
> 2. DSP & Streaming Strategy: Platform playbooks, 10-15% save-to-stream ratios, Discovery Mode.
> 3. Release Management: 6-week cadence, Waterfall ISRC strategy, distribution coordination.
> 4. Content & Marketing: Platform calendars, [BUILD]/[SHOW]/[SONG] campaign tagging.
> 5. A&R & Label Operations: Demo scoring, catalog health grading (S-F), 5-bucket system.
> 6. Financial Engine: Commission calculations, deposit tracking, settlement reconciliation.

> STRICT ACCURACY RULES:
> 1. Only reference tour dates and leads provided in the CURRENT PLATFORM CONTEXT.
> 2. If the user asks about a date not in the context, state clearly that it's not in the current routing.
> 3. Do NOT hallucinate venue names or ticket sales numbers.
> 4. If you don't know something, say "I don't have that data in the platform yet."
> 5. Never give legal advice. Recommend a music attorney.
> 6. Never guarantee outcomes. Use "projected" or "based on comparable data".

**Recommended landing:** Update `products/tenx10-platform/src/app/api/agent/route.ts` Xai system prompt to incorporate the strict accuracy rules verbatim if they're not already there. Cross-reference KB Module 24 (Agent Team Architecture) so future agent additions inherit the same rules.

### 9. The `gemini-3-flash-preview` model reference ⚠ INFO

The prototype uses `gemini-3-flash-preview` — that's the Gemini 3 preview line. The current TENx10 Xai uses Gemini flash (probably 2.x). When Gemini 3 hits GA, the agent should upgrade. Worth flagging as a TODO in TENx10 BRAIN.md.

---

## Implementation tasks (action list)

Add the following to `AUTONOMOUS_QUEUE.md` or per-product TASKS.md:

| # | Task | Where | Priority |
|---|---|---|---|
| A | Add Bandsintown integration to DBA research agent + TENx10 tour grid cross-reference | DBA + TENx10 platform | P1 |
| B | Add `researchPromoter` Gemini prompt + `promoter_research` Supabase table | DBA + TENx10 platform | P1 |
| C | Add `researchShowDetails` widget to TENx10 per-show dashboard | TENx10 platform | P2 |
| D | Add routing-gaps panel to DBA `/outreach/priorities` | DBA | P2 |
| E | Wire `parseDealInfo` into `agents/inbound.py` for auto-populating offer fields | DBA | P1 |
| F | Add Meta Instagram-Basic + TikTok OAuth to TENx10 artist onboarding | TENx10 platform | P2 |
| G | Add email-thread summarizer agent for `email_threads` rows | DBA | P2 |
| H | Verify Xai system prompt incorporates the strict accuracy rules + 6 pillars verbatim | TENx10 platform `src/app/api/agent/route.ts` | P1 |
| I | TODO in TENx10 BRAIN.md: upgrade Xai to Gemini 3 when GA | TENx10 platform | P3 |

---

## What to do with `Projects\aistudio\` itself

The local clone has 18 KB `server.ts` + 6 KB `gemini.ts` + frontend code. It's a useful **reference** but no longer the canonical implementation (TENx10 platform supersedes it).

**Options:**
1. **Archive as-is** — move to `_archive/aistudio-prototype-2026-04/` inside the umbrella so the source is preserved as historical reference.
2. **Keep at `Projects\aistudio\`** as a reference clone — don't include in umbrella git.
3. **Delete** — once this spec captures everything worth pulling, the local clone is redundant. NotebookLM also has the source via the AI Studio link.

**Recommendation:** Option 2 — keep at `Projects\aistudio\` as a private reference clone. This spec captures the lessons. If specific code is needed (e.g., the exact Gemini search-grounding config for promoter research), the reference is one path-cd away.

---

## Cross-references

- TENx10 platform Xai endpoint: `products/tenx10-platform/src/app/api/agent/route.ts`
- DBA outbound composer voice rules: `products/digital-booking-agent/prompts/outbound_composer.md`
- KB Module 24 agent team architecture: `products/tenx10-platform/TENx10_Knowledge_Base/24_Agent_Team_Architecture.md`
- KB Module 29 booking evaluator: `products/tenx10-platform/TENx10_Knowledge_Base/29_Booking_Evaluator_Skill.md`
- Factory architecture spec: `docs/superpowers/specs/2026-04-27-factory-architecture-design.md`
- DBA model router (Anthropic proxy equivalent): `products/digital-booking-agent/agents/model_router.py`

---

*Spec v1.0 — 2026-05-05. Lifted from `C:\Users\slash\Projects\aistudio\` (NotebookLM-linked AI Studio app `c18d9c42`). Implementation tasks A–I queued.*
