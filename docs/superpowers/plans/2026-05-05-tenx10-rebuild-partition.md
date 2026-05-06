# TENx10.co Rebuild — Partition Plan

**Date:** 2026-05-05
**Process:** 3-phase build cycle (Alignment → Translation → Partitioning) per `.claude/skills/build-cycle/SKILL.md`
**Status:** APPROVED. Foundation tasks (F1, F2) launch first; everything else parallels behind them.

---

## Boris 4 — locked

**1. Core problem:** Smart outreach + autonomous-or-augmented booking so booking capacity scales from 1.5 effective touring artists to 5+ (then international, then sellable to booking agencies) — without me, my agents, or the artist being the bottleneck. The system works in two modes per artist (augment vs replace), never hallucinates numbers, never violates artist consent, never breaks compliance.

**2. Who it's for:**
- **Multi-capability users** (Thomas) who shift contexts based on what they're doing
- **Single-capability users**: artist (Leigh / Brett / etc.), booking_agent (Brian / Andrew / Hunter), label, etc.
- **Booking agencies** as commercial tenants (Brian's WHOiSEE work = design partner + first paying tenant)
- **Solo artists** without dedicated agents (DBA acts in replace mode)
- The platform meets users where they are based on **what they're actively doing**, not what they "fundamentally are"

**3. Success looks like:**
- 1.5 → 5 effective touring artists in 90 days; international shows added
- Brian saves measurable hours/week on WHOiSEE → first paying agency tenant → sellable case
- Outreach pipeline runs autonomously after Thomas approval — opportunities surface → "ok" → DBA sends end-to-end
- All tracks fully hardened: royalty (R3), metadata (R19), chart-eligibility (R26), cert progress (R18) — all green
- Marketing cost per song tracked; compilation release shipped with growth marketing plan
- Posting calendar running; content engine generates platform-native posts in voice
- Zero hallucinated numbers — every estimate explainable + confidence-banded + override-able
- Zero unauthorized data sharing — artist consent gating + agency-tenant isolation
- Artists don't text Thomas dumb questions — they text Xai

**4. Should NOT do:**
- NOT force-replace agents — augment mode first-class; replace is opt-in per artist
- NOT auto-send outbound (email/social) without confidence-graded approval gates (R6 sandboxed pilot is the only constrained exception)
- NOT hallucinate numbers — every estimate routes through `<EstimateCard>` (F1) with reasoning chain + confidence band + override surface
- NOT make false promises based on perceived value
- NOT share data without explicit owner consent (W4 + R23 multi-tenant isolation)
- NOT operate non-compliantly — GDPR / CCPA / state privacy law / music industry standards (R20 verifies)
- NOT puff the artist's story — R21 differentiates honestly
- NOT manage non-music businesses — 10RG products live on `10researchgroup.com` (R9)

---

## The role-context primitive

Every user has `role_capabilities text[]`. The active role at any moment is determined by URL routing (with manual `<PersonaSwitcher>` override for ambiguous cases). Same UI for any user whose active role matches — Brian's `/booking` is identical to Andrew's is identical to Thomas-in-booking-context.

```
THOMAS (capabilities: artist[DirtySnatcha] + manager + booking_agent + label + label_manager)
  /booking                        → booking_agent
  /artist/dirtysnatcha/catalog    → artist (own)
  /dashboard/label                → label
  /artist/whoisee/morning-brief   → manager (managed artist)

BRIAN (capabilities: booking_agent for WHOiSEE's agency)
  /booking                        → booking_agent

LEIGH BRAY (capabilities: artist)
  /artist                         → artist

ANDREW BASS (capabilities: booking_agent)
  /booking                        → booking_agent
```

Server validates active_role ∈ user's capabilities on every API call; RLS scopes data per active_role.

---

## DBA dual-mode

Per-artist toggle:
- **Augment mode** — human agent stays. DBA drafts → agent approves → send. Brian/Andrew/Hunter use it as their tool.
- **Replace mode** — no human agent slot filled. DBA drafts → Thomas (or directly to artist if signed off) → send.

Brian flips WHOiSEE to augment. New solo-artist tenants default to replace.

---

## Build outline (37 tasks, dependency-ordered)

```
FOUNDATION ────────────────────────────────────────────
  F1  Persistent Xai shell + <PersonaSwitcher> + <EstimateCard> primitive
  F2  Supabase schema (consolidated migration 043 — role_capabilities array,
      consent gating, offer cols, email buckets, brand_mentions, intel_relays,
      drive_folder linking, agency tenant scope)

MVP WEDGE — booking-first ─────────────────────────────
  W1   Booking section UI (primary user: active_role = booking_agent)
  W1.1 Email open + interaction widget (small)
  W1.2 Multi-axis grading (promoter / venue / talent buyer)
  W1.3 Venue/promoter photo + sellout-history scrapers
  W1.4 Promoter background-check / red-flag detector
  W2   Google Sheets ↔ Supabase live two-way sync (DirtySnatcha sheet only)
  W3   Homepage persona-aware dashboard (revenue rollup + email triage +
       shows feed; role-context-conditioned content)
  W4   Artist consent settings UI (opt-in, scope-by-scope, per-team-member
       grants; framed as "as <role> for <artist>, grant <scope> to <viewer>")
  W5   Email auto-classifier extension in DBA (broader buckets)

PERSONALITY — make it feel like a team ────────────────
  P1   AI team UI surface (KB Module 24 personas as cards)
  P2   Super-agent / Intelligence Scout (3 watch-feeds + relay)

ROADMAP ───────────────────────────────────────────────
  R1   DAD-in-TENx10 Drive auto-organize (uses Gemini File Search for offer
       PDF parsing post-Apr-2026 multimodal RAG release)
  R2   Catalog Health Engine (KB Module 25 build, post-R16 popularity proxy)
  R3   Publishing automation (Songtrust killer — direct registration to
       BMI/ASCAP/MLC/SoundExchange/CMRRA + 42 international societies)
  R4   Social + content engine (Twitter/IG/TikTok/YouTube/FB/Pinterest/
       Snapchat OAuth + scheduling + platform-native composer)
  R5   Merch dashboard widget (multi-artist, MHP-as-default-supplier;
       reads from R25's Shopify-synced tables in real time)
  R6   AI-Twitter autonomous pilot (4 sandboxed accounts: Thomas / DSR /
       MHP / 10RG; CONFIDENCE-GRADED autonomy + audit + kill switch — NOT
       "completely autonomous")
  R7   Reputation Manager (entities + venues + promoters + talent buyers —
       brand mentions, sentiment, Google KG, Wikipedia, press)
  R8   Global pitching UI (extends W1; international booking + editorial +
       sync + press)
  R9   10RG agency surface separation (10researchgroup.com Command Center;
       remove all 10RG-product references from tenx10.co)
  R10  Music videos pipeline                                    [DEFERRED]
  R11  Audience convergence map (social vs DSP geographic)
  R12  Gamification (levels / XP / badges / quest chains)
  R13  Artist Onboarding Flow (gamified end-to-end; flips focus from
       "learn the booking section" to "set up comms + data + Xai trust")
  R14a DSP top-3 priority (Spotify S4A Insights + Apple Music Connect 2026
       + SoundCloud)
  R14b DSP rest (YouTube Music + Tidal + Deezer + Amazon Music + Bandcamp
       scrape + Beatport portal+scrape + Pandora AMP + Sirius XM scrape)
  R15  Royalty Statement Ingester (Gmail + portal scrape hybrid)
  R16  Spotify migration (Feb 2026 breakage adaptation) + Xai upgrade to
       Gemini 3 Flash GA + thinking_level routing                [BLOCKER]
  R17  Conversion pixel deployment (GA4 + Meta + TikTok + Pinterest +
       Snapchat) + per-song marketing-cost attribution
  R18  RIAA + international cert tracker (US RIAA + UK BPI + DE BVMI + FR
       SNEP + AU ARIA + CA CRIA + IFPI Brazil + AMPROFON Mexico + RIAJ
       Japan + ...)
  R19  Lyrics + metadata authority registration (Musixmatch + LyricFind +
       Genius + Gracenote + MusicBrainz + Discogs + AllMusic)
  R20  Compliance Verifier (GDPR + CCPA + state privacy laws + music
       industry data-sharing standards; blocks production launch)
  R21  Artist Positioning / Whitespace Engine (honest differentiation
       narrative + compilation release planning + growth marketing
       playbook; feeds R4 + R5 + R3 with positioning narrative)
  R22  Artist Morning Brief + Multi-Channel Xai (SMS/iMessage/Discord/
       email/in-app delivery; Xai answers from data, escalates when stuck;
       Gemini 3.1 Flash TTS for native voice)
  R23  Booking Agency Multi-Tenant Mode (sellable; Brian's WHOiSEE
       agency = first paying tenant; F2's RLS gets agency-scope)
  R24  DBA Mode Toggle per Artist (augment vs replace router)
  R25  MHP Shopify Connector (myhydrationpack.com Shopify GraphQL Admin
       API + webhooks; real-time pre-orders, threshold trigger, fulfillment)
  R26  Industry Data Registration (Luminate + OCC + GfK + ARIA + Mediabase
       + Chartmetric + Songstats; chart-eligibility + industry tracking)
```

---

## Migration ledger (no two tasks claim the same)

TENx10 migrations start at `043` (highest existing = `042`). DBA migrations start at `0026`.

| Migration | Owner | Purpose |
|---|---|---|
| TENx10 `043` | F2 | role_capabilities + consent + offer cols + email buckets + brand_mentions + intel_relays + drive_folder + agency tenant scope |
| TENx10 `043a` | W1.2 (or folded into 043) | `contact_grades` lookup |
| TENx10 `043b` | W1.3 | `venue_show_photos` + `venue_sellout_history` |
| TENx10 `043c` | W1.4 | `contact_red_flags` |
| TENx10 `044` | W3 | `v_user_revenue_rollup` view |
| TENx10 `045` | P1 | `agent_conversations` |
| TENx10 `046` | R2 | catalog scoring tables |
| TENx10 `046b` | R11 (or folded into 046) | `v_audience_convergence` view |
| TENx10 `047` | R3 | `publishing_submission_audit` |
| TENx10 `048` | R4 | `social_accounts` + `scheduled_posts` + `post_analytics_extended` |
| TENx10 `049` | R5 | `merch_drops` + `merch_preorders` + `merch_thresholds` + `merch_orders_to_supplier` |
| TENx10 `050` | R6 | `twitter_audit` + `twitter_kill_switch` |
| TENx10 `051` | R7 | `brand_mentions` extended (sentiment, response_status) |
| TENx10 `052` | R12 | gamification: `user_levels` + `user_xp` + `user_badges` + `quest_chains` + `quest_steps` + `user_quest_progress` |
| TENx10 `053` | R14a | `dsp_account_connections` + `dsp_metrics_extended` |
| TENx10 `054` | R15 | `royalty_statements` + `royalty_lines` + `royalty_unmatched_lines` |
| TENx10 `055` | R16 | replace `dsp_metrics` PS columns with proxy-derived; Xai model config table |
| TENx10 `056` | R17 | `pixel_events` + `attribution_chains` + `lookalike_audiences` |
| TENx10 `057` | R18 | `certification_thresholds` + `certification_progress` + `certification_achievements` + `certification_applications` |
| TENx10 `058` | R14b (Beatport) | `beatport_sales` + `beatport_chart_history` + `beatport_dj_charts` |
| TENx10 `059` | R19 | `metadata_audits` + `lyrics_registrations` + `metadata_discrepancies` |
| TENx10 `060` | R22 | `artist_comms_preferences` + `xai_conversations_external` + `xai_escalations` |
| TENx10 `061` | R23 | `booking_agencies` + `agency_members` + `agency_subscriptions` + agency RLS policies |
| TENx10 `062` | R24 | `artist_dba_mode` enum + per-artist routing config |
| TENx10 `063` | R25 | `shopify_stores` + `shopify_products` + `shopify_orders` + `shopify_order_lines` + `shopify_inventory` + `shopify_webhook_events` |
| TENx10 `064` | R26 | `industry_data_registrations` + `chart_positions` + `radio_airplay` |
| TENx10 `065` | R20 | `compliance_audits` + `consent_jurisdiction_map` |
| TENx10 `066` | R21 | `artist_positioning` + `compilation_releases` + `positioning_audit` |
| DBA `0026` | W5 | `email_threads.bucket` enum + column |

Numbers `067+` reserved for emergent migrations during builds.

---

## Per-task partition matrix (shorthand — full detail in plan execution)

> **Reality-check 2026-05-05 (post-audit):** This partition was drafted greenfield. A source-code audit (see `docs/superpowers/specs/2026-05-05-booking-agent-current-state.md`) found ~70% of W1's intended behavior is **already shipped** under existing route names: `/artist/booking` (BookingAgentClient w/ SSE streaming), `/dashboard/deals` (full Mission Control / Timeline / Map Kanban), `/dashboard/gmail` (OfferAnalyzerClient — 6-step decision engine), `/dashboard/outreach` (MarketEstimator). DBA-side, outbound + inbound + supervisor + sender are all LIVE with safety gates. The platform's latest applied migration is **`045`**; promoter grading shipped via dated migration `20260428_promoter_grading.sql`. Rebase migration numbering accordingly: `043 → 046`, `044 → 047`, `045 → 048`, etc. before running F2. Treat W1 as **consolidate + extend** (unify the four scattered surfaces, add multi-axis grading + email-engagement events table), not full rebuild.

Each task block: `cwd · files · migrations · deps · parallel-with · verification`.

### F1 — Persistent Xai shell + primitives

`products/tenx10-platform/` · NEW: `src/app/(authenticated)/layout.tsx`, `src/components/xai/{Shell,MicButton,DockedBar,NotificationStream}.tsx`, `src/components/personas/PersonaSwitcher.tsx`, `src/components/estimates/{EstimateCard,ReasoningChain}.tsx`, `src/lib/estimates/types.ts` · EDIT: `src/app/layout.tsx` · MIGRATIONS: none · DEPS: none · PARALLEL: F2 · VERIFY: shell visible on every authenticated route + persona switcher works + EstimateCard renders sample with reasoning chain.

### F2 — Schema (consolidated)

`products/tenx10-platform/` · NEW: `supabase/migrations/043_role_consent_offers_agency.sql` · EDIT: `src/lib/types.ts` (regen) · MIGRATIONS: `043` (+ optional `043a/b/c` per W1.x decisions) · DEPS: none · PARALLEL: F1 · VERIFY: all new tables/cols present, RLS enforces role_capabilities + agency tenant scope, type regen passes `npx tsc --noEmit`.

### W1 — Booking section UI

`products/tenx10-platform/` · NEW: `src/app/booking/page.tsx`, `src/app/booking/[artist_slug]/page.tsx`, `src/app/booking/server-actions.ts`, `src/components/booking/{Kanban,AgentOverlapCanary,ShowCard,MarketValueWidget,CounterOfferDrawer}.tsx` · MIGRATIONS: none (uses F2's offer cols) · DEPS: F1, F2, DBA `v_offer_contract_status` + `v_agent_workload` · PARALLEL: W2-W5, P1, P2, most R · VERIFY: 5 artists visible, Brian (test) sees only his pipeline + canary, counter-offer uses EstimateCard.

### W1.1 — Email open + interaction widget

`products/tenx10-platform/` · NEW: `src/components/booking/EmailInteractionPanel.tsx`, `src/lib/booking/queries/email-interactions.ts` · MIGRATIONS: none · DEPS: W1, F2 · PARALLEL: W1.2-W1.4, all of W2-W5, P, R · VERIFY: per-recipient open count visible.

### W1.2 — Multi-axis grading

`products/tenx10-platform/` · NEW: `src/components/booking/GradeWidget.tsx`, `src/lib/booking/grading.ts` · MIGRATIONS: `043a` · DEPS: W1, F2 · PARALLEL: W1.1, W1.3, W1.4, all of W2-W5, P, R · VERIFY: 3 grade fields per contact (promoter/venue/talent_buyer).

### W1.3 — Venue/promoter photo + sellout-history scrapers

`products/tenx10-platform/` · NEW: `workers/venue-photo-scraper.ts`, `workers/venue-sellout-scraper.ts`, `src/lib/scrapers/{instagram-venue,facebook-events,eventbrite-venue,ticketmaster-status}.ts` · MIGRATIONS: `043b` · DEPS: F2, `agent-browser` skill · PARALLEL: same · VERIFY: photos + sellout history populate per venue.

### W1.4 — Promoter background-check / red-flag detector

`products/tenx10-platform/` · NEW: `workers/contact-redflag-scanner.ts`, `src/lib/scrapers/{court-records,bbb,linkedin-network,news-search,reddit-edm,residentadvisor}.ts` · MIGRATIONS: `043c` · DEPS: F2, `agent-browser` skill · PARALLEL: same (heavier; consider solo) · VERIFY: red-flag panel surfaces real findings; no false-positive on AB Touring.

### W2 — Sheet sync (DirtySnatcha sheet only)

`products/tenx10-platform/workers/sheet-sync/` · NEW: `workers/sheet-sync.ts`, `scripts/sheet-sync/{setup.md,apps-script.gs}` · SHEET: `1nDAAwaflZ7ivOU6vMIL6nA_jUa1HUkwFx1lTBnX3dJI` · MIGRATIONS: none · DEPS: F2 · PARALLEL: same · VERIFY: bidirectional 60-sec sync + audit row.

### W3 — Homepage dashboard

`products/tenx10-platform/` · NEW: `src/components/dashboard/{RevenueRollup,EmailTriage,ShowsFeed,AudienceConvergenceWidget}.tsx`, `src/lib/supabase/queries/revenue-rollup.ts` · EDIT: `src/app/page.tsx` (rewrite — role-conditioned) · MIGRATIONS: `044` · DEPS: F1, F2 · PARALLEL: same · VERIFY: per-role correct content (artist sees own; manager sees roster; label_manager sees all).

**Design brief (locked 2026-05-05) — public/logged-out variant of `/`:**
- **Easy to read** — clear hierarchy, generous whitespace, no clever typography that fights legibility
- **Sells** — this is a sales page, not a portfolio. Reader leaves either signed up or with one specific reason they didn't.
- **Doesn't look AI** — no generic gradient hero, no "trusted by" stock-logo bar, no three-column "why us" with feather icons, no Inter-everywhere, no marketing-voice copy. Tells of AI slop are a hard fail.

**Precondition before W3 alignment phase runs:** Thomas collects 3-5 reference URLs (any industry — Stripe, Apple, agency sites, Substack, label sites, anything that "feels right"). References are the alpha; W3 alignment uses them as input. Don't start W3 without them.

**Workflow when W3 launches:**
1. Alignment phase runs the 4 build-cycle questions specifically for the homepage, with refs as input
2. v0.dev generates 2-3 directions in real React + Tailwind (not standalone HTML)
3. Iterate in the actual Next.js codebase — no static-HTML mockups
4. Voice/copy comes from the DBA outbound composer's locked rules + actual content corpus, not generic AI marketing voice (per `2026-05-05-content-meme-generation-framework.md`)

**Scrapped reference (don't anchor on this):** `_archive/scrapped-mockups/2026-05-04-homepage-v2.html` — earlier mockup; user reaction *"ugly, not right, looks AI."* Kept as a data point of what to avoid.

### W4 — Artist consent settings UI

`products/tenx10-platform/` · NEW: `src/app/artist/settings/consent/page.tsx`, `src/app/artist/settings/consent/server-actions.ts`, `src/components/consent/{ScopeToggle,AuditLog}.tsx` · MIGRATIONS: none (uses F2) · DEPS: F2, F1 · PARALLEL: same · VERIFY: toggle scope → manager view changes accordingly; audit log captures all grants/revocations.

### W5 — Email classifier extension (DBA)

`products/digital-booking-agent/` · EDIT: `prompts/inbound_classifier.md`, `agents/inbound.py` · NEW: `migrations/0026_email_threads_bucket.sql` · MIGRATIONS: DBA `0026` · DEPS: none · PARALLEL: ALL (different product) · VERIFY: 16 buckets classify correctly; W3 email-triage consumes.

### P1 — AI team UI surface

`products/tenx10-platform/` · NEW: `src/app/team/page.tsx`, `src/app/team/[agent_slug]/page.tsx`, `src/components/team/{AgentCard,PersonaChat}.tsx`, `src/lib/agents/personas.ts` (KB Module 24 codified) · MIGRATIONS: `045` · DEPS: F1, F2 · PARALLEL: same · VERIFY: 6 cards; chat with each persona uses locked voice.

### P2 — Intelligence Scout (super-agent)

NEW `products/intelligence-scout/` · NEW: `agents/scout.py`, `prompts/{music_industry,dsp_algorithms,llm_news}.md`, `CLAUDE.md`, `BRAIN.md`, `TASKS.md` · MIGRATIONS: F2's `intel_relays` table · DEPS: F2 · PARALLEL: ALL (different product) · VERIFY: 3 watch-feeds populate intel_relays; W3 notification stream surfaces.

### R1 — DAD-in-TENx10 Drive auto-organize

`packages/dad-core/` (NEW shared) + `products/tenx10-platform/` · NEW: `packages/dad-core/{rename-rules,folder-templates,drive-client,gemini-file-search}.ts`, `products/tenx10-platform/workers/drive-watcher.ts`, `server-actions/approve-offer.ts` · MIGRATIONS: F2's drive_folder columns · DEPS: F2, `show_folder_structure.md` canonical · PARALLEL: ALL R · VERIFY: PDF dropped in Pending Offers → renamed + linked + show folder created with 7 subfolders + offer file moved.

### R2 — Catalog Health Engine

`products/tenx10-platform/` · NEW: `src/app/catalog/page.tsx`, `src/app/catalog/[track_id]/page.tsx`, `src/components/catalog/{HealthScore,SyncLicensingPipeline}.tsx`, `src/lib/catalog/scoring.ts` · MIGRATIONS: `046` · DEPS: F1, F2, R14a, R16 · PARALLEL: ALL R · VERIFY: 4-D scores per track via EstimateCard with reasoning.

### R3 — Publishing automation (Songtrust killer)

`products/tenx10-platform/` · NEW: `src/app/publishing/page.tsx`, `src/components/publishing/RegistrySubmitter.tsx`, `workers/publishing-submitter.ts`, `src/lib/publishing/registries/{bmi,ascap,sesac,mlc,soundexchange,prs,gema,sacem,buma,stim,jasrac,komca,apra,...}.ts` · MIGRATIONS: `047` · DEPS: F1, F2, existing migration `037` · PARALLEL: ALL R · VERIFY: per-track registration matrix; submit writes audit + submits where API exists.

### R4 — Social + content engine

`products/tenx10-platform/` · NEW: `src/app/social/page.tsx`, `src/app/social/calendar/page.tsx`, `workers/social-poster.ts`, `src/components/social/Composer.tsx`, `src/lib/social/{twitter,instagram,tiktok,youtube,facebook,pinterest,snapchat}.ts` · MIGRATIONS: `048` · DEPS: F1, F2 · PARALLEL: most R (R6 depends on R4) · VERIFY: scheduled cross-platform post fires correctly with voice profile.

### R5 — Merch dashboard widget

`products/tenx10-platform/` · NEW: `src/components/dashboard/MerchPillar.tsx`, `src/app/merch/page.tsx`, `src/lib/merch/mhp-handoff.ts` · MIGRATIONS: `049` · DEPS: F1, F2, R25 (Shopify integration) · PARALLEL: most R · VERIFY: pre-order counter increments in real time from R25's Shopify webhooks; threshold-trigger fires.

### R6 — AI-Twitter pilot (4 sandboxed accounts; CONFIDENCE-GRADED)

NEW `products/social-pilot/` · NEW: `agents/twitter_runner.py`, `prompts/{thomas,dsr,mhp,10rg}_voice.md`, `data/voice_corpora/{thomas,dsr,mhp,10rg}/` (gitignored), `CLAUDE.md`, `BRAIN.md`, `TASKS.md` · MIGRATIONS: `050` · DEPS: F2, R4 · PARALLEL: most R (after R4) · VERIFY: confidence-graded posting (>95% auto-queue, 80-94% review, <80% hold); kill switch tested.

### R7 — Reputation Manager

NEW `products/reputation-manager/` · NEW: `agents/scanner.py`, `prompts/{sentiment,response_router}.md`, `CLAUDE.md`, `BRAIN.md`, `TASKS.md` · MIGRATIONS: `051` · DEPS: F2 · PARALLEL: ALL · VERIFY: scans entities + venues + promoters + talent_buyers; sentiment + source written; W3 notification stream surfaces.

### R8 — Global pitching UI

`products/tenx10-platform/` · NEW: `src/app/booking/international/page.tsx`, `src/components/booking/{TerritoryFilter,VisaStatus,CurrencyConverter,WithholdingTaxCalculator}.tsx` · MIGRATIONS: none · DEPS: W1 · PARALLEL: most R · VERIFY: territory filter + visa + currency + withholding-tax all functional.

### R9 — 10RG agency surface separation

NEW `products/10rg-agency-site/` + cleanup pass on `products/tenx10-platform/` · NEW: full new product for `10researchgroup.com` · EDIT: `products/tenx10-platform/src/app/` (remove DAD/MHP/RimShop/Trading/system-steward references), `BUSINESS_HIERARCHY.md`, `2026-04-30-positioning-and-site-hierarchy.md` · MIGRATIONS: none · DEPS: F1 · PARALLEL: ALL R · VERIFY: tenx10.co clean of 10RG products; 10researchgroup.com Command Center renders.

### R11 — Audience convergence map

`products/tenx10-platform/` · NEW: `src/components/dashboard/AudienceConvergenceMap.tsx`, `src/app/audience/page.tsx`, `src/lib/audience/convergence.ts` · MIGRATIONS: `046b` (or fold into `046`) · DEPS: F1, F2, R4, R14 · PARALLEL: most R · VERIFY: per-city social + DSP side-by-side; click city → action recommendation via EstimateCard.

### R12 — Gamification

`products/tenx10-platform/` · NEW: `src/components/gamification/{LevelBadge,XPBar,BadgeCase,QuestChain,ProgressDashboard}.tsx`, `src/lib/gamification/{xp,levels,badges,quests}.ts` · MIGRATIONS: `052` · DEPS: F1, F2 · PARALLEL: ALL · VERIFY: onboarding +100 XP; first-show +50 XP + badge; tier transition unlocks `/catalog`.

### R13 — Artist Onboarding Flow (gamified)

`products/tenx10-platform/` · NEW: `src/app/artist/onboarding/{step-N}/page.tsx`, `src/components/onboarding/{IdentityStep,DspConnectStep,SocialConnectStep,ConsentStep,AiTeamMeetStep,FirstQuestStep,CommsPreferenceStep}.tsx`, `src/lib/onboarding/wizard-state.ts` · EDIT: replace existing `src/app/artist/join/[token]/page.tsx` · MIGRATIONS: none · DEPS: F1, F2, R12, R14a, R4, W4, P1, R22 (comms preference step) · PARALLEL: most R after deps · VERIFY: invite → 7-step gamified flow → ends with first quest assigned + XP transition.

### R14a — DSP top-3 (Spotify + Apple + SoundCloud)

`products/tenx10-platform/` · NEW: `workers/dsp-{spotify,apple,soundcloud}-poller.ts`, `src/lib/dsp/{spotify-insights,apple-music-connect,soundcloud}.ts` · MIGRATIONS: `053` · DEPS: F2, R16 · PARALLEL: R14b, ALL R · VERIFY: each platform daily polls write to dsp_metrics_extended; W3 surfaces.

### R14b — DSP rest

`products/tenx10-platform/` · NEW: `workers/dsp-{youtube,tidal,deezer,amazon,bandcamp,beatport,pandora,sirius}-poller.ts`, `src/lib/dsp/{youtube-music,tidal,deezer,amazon-music,bandcamp,beatport,pandora-amp,sirius-xm}.ts` · MIGRATIONS: `058` (Beatport-specific tables; others use shared schema from R14a) · DEPS: F2, R14a · PARALLEL: R14a, ALL R · VERIFY: each platform pulls metrics; Beatport chart history captured.

### R15 — Royalty Statement Ingester

NEW `products/royalty-ingester/` · NEW: `agents/{statement_parser,portal_scraper}.py`, `prompts/{bmi,ascap,soundexchange,mlc,cmrra,vmg-distribution}.md`, `CLAUDE.md`, `BRAIN.md`, `TASKS.md` · MIGRATIONS: `054` · DEPS: F2, W5, `agent-browser` skill · PARALLEL: ALL R · VERIFY: BMI test PDF → per-track / per-quarter detail in royalty_lines; W3 revenue rollup updates; R3 cross-checks unmatched.

### R16 — Spotify migration + Xai upgrade to Gemini 3 Flash [BLOCKER]

`products/tenx10-platform/` · NEW: `src/lib/spotify/insights-client.ts`, `workers/dsp-spotify-poller.ts` (rewrite), `src/lib/xai/model-config.ts` (Gemini 3 Flash GA + thinking_level routing) · EDIT: existing migration `030` consumers; `src/app/api/agent/route.ts` (Xai endpoint) to Gemini 3 Flash · MIGRATIONS: `055` · DEPS: F2 · PARALLEL: ALL R EXCEPT R14a + R2 (those wait for R16) · VERIFY: poller writes proxy popularity; Xai responds via Gemini 3 Flash with thinking_level routing; KB Module 14 amended.

### R17 — Conversion pixel deployment + per-song marketing-cost attribution

`products/tenx10-platform/` (frontend) + NEW `products/pixel-tracker/` (backend) · NEW: `src/lib/pixels/{ga4,meta,tiktok,pinterest,snapchat}.ts`; `products/pixel-tracker/agents/ingester.py`, `CLAUDE.md`, `BRAIN.md`, `TASKS.md` · EDIT: F1's `(authenticated)/layout.tsx` (pixel scripts — coordinate with F1 owner) · MIGRATIONS: `056` · DEPS: F1, F2 · PARALLEL: ALL R · VERIFY: pixel events captured + attribution chains build; per-song marketing cost queryable.

### R18 — RIAA + international cert tracker

`products/tenx10-platform/` · NEW: `src/lib/certifications/{riaa,bpi,bvmi,snep,aria,cria,ifpi-br,amprofon-mx,riaj-jp,...}.ts`, `workers/cert-progress-poller.ts`, `src/components/certifications/CertProgressBar.tsx`, `src/app/catalog/[track_id]/certifications/page.tsx`, `src/app/dashboard/certifications/page.tsx` · MIGRATIONS: `057` · DEPS: F2, R14, R12, R15 · PARALLEL: most R · VERIFY: multi-country progress bars; threshold-cross fires achievement event → +5K XP via R12.

### R19 — Lyrics + metadata authority registration

`products/tenx10-platform/` · NEW: `src/lib/metadata/{musixmatch,lyricfind,genius,gracenote,musicbrainz,discogs,allmusic}.ts`, `workers/metadata-auditor.ts`, `src/app/catalog/[track_id]/metadata/page.tsx` · MIGRATIONS: `059` · DEPS: F2, R3 · PARALLEL: ALL R · VERIFY: per-track audit surfaces discrepancies + auto-fill workflow.

### R20 — Compliance Verifier

`products/tenx10-platform/` · NEW: `src/lib/compliance/{gdpr,ccpa,state-laws,music-industry-standards}.ts`, `workers/compliance-auditor.ts`, `src/app/compliance/page.tsx` · MIGRATIONS: `065` · DEPS: F2, W4 · PARALLEL: ALL R · VERIFY: WebFetch current law sources → audit consent flows + data sharing → green light or block production launch.

### R21 — Artist Positioning / Whitespace Engine

`products/tenx10-platform/` · NEW: `src/lib/positioning/{differentiator,compilation-planner,growth-marketing-playbook}.ts`, `workers/positioning-auditor.ts`, `src/app/artist/[slug]/positioning/page.tsx` · MIGRATIONS: `066` · DEPS: F2, R2 (catalog), R4 (social signal), R11 (audience convergence) · PARALLEL: ALL R · VERIFY: per-artist positioning narrative + compilation candidates + growth playbook output via EstimateCard reasoning chain.

### R22 — Artist Morning Brief + Multi-Channel Xai

`products/tenx10-platform/` · NEW: `workers/morning-brief-generator.ts`, `src/lib/comms/{sms-twilio,imessage,discord-webhook,email-resend,push,in-app}.ts`, `src/app/artist/comms-preferences/page.tsx`, `src/lib/xai/escalation-router.ts` · MIGRATIONS: `060` · DEPS: F1, F2 · PARALLEL: most R · VERIFY: artist sets channel = SMS → daily brief arrives at phone; "what's my next show?" → Xai answers from data; "tell my manager X" → Xai pings manager; voice via Gemini 3.1 Flash TTS.

### R23 — Booking Agency Multi-Tenant Mode

`products/tenx10-platform/` · NEW: `src/app/agency/[agency_slug]/page.tsx`, `src/app/agency/[agency_slug]/agents/[agent_slug]/page.tsx`, `src/app/agency/settings/billing/page.tsx`, `src/lib/agency/{tenant-isolation,roster-management,billing}.ts` · MIGRATIONS: `061` · DEPS: F2, R13 · PARALLEL: most R · VERIFY: test agency with Brian + 2 agents → each sees own pipeline + agency-shared rolodex + cross-agent canary scoped to agency only.

### R24 — DBA Mode Toggle per Artist

`products/tenx10-platform/` + `products/digital-booking-agent/` · NEW: `src/components/artist/AgentModeToggle.tsx`, `src/lib/dba/mode-router.ts`, DBA `agents/mode_router.py` · MIGRATIONS: `062` · DEPS: W1, R23 · PARALLEL: most R · VERIFY: WHOiSEE → augment routes drafts to Brian; soloist → replace routes to Thomas.

### R25 — MHP Shopify Connector

`products/tenx10-platform/` (or NEW `products/shopify-connector/` if abstracting for multi-tenant future) · NEW: `workers/shopify-webhook-receiver.ts`, `src/lib/shopify/{client,webhooks,products,orders,customers,inventory}.ts`, `src/app/api/webhooks/shopify/route.ts` · MIGRATIONS: `063` · DEPS: F2, R20 (compliance) · PARALLEL: ALL R · VERIFY: install Shopify app on `myhydrationpack.com` → webhook test event captured; create test order → R5 widget pre-order counter increments live.

### R26 — Industry Data Registration

`products/tenx10-platform/` · NEW: `src/lib/industry-data/{luminate,occ,gfk,aria,mediabase,chartmetric,songstats}.ts`, `workers/industry-data-verifier.ts`, `src/app/catalog/[track_id]/chart-eligibility/page.tsx` · MIGRATIONS: `064` · DEPS: F2, R3, R14 · PARALLEL: most R · VERIFY: per-track chart-eligibility status + last-week chart positions across all services + radio airplay totals; gaps flagged.

---

## Parallel-execution rounds

```
ROUND 1 — FOUNDATION (2 sessions parallel)
  A: F1   B: F2

ROUND 2 — BLOCKER (1 session blocking, ~15 in parallel)
  Blocker: R16 (Spotify migration + Gemini 3 Flash upgrade)
  Parallel: W1-W5, P1, P2, R1, R3, R4, R5 (waits R25),
            R7, R8 (waits W1), R9, R12, R15, R17, R20,
            R23, R24 (waits R23), R26
  Wait for R16: R14a, R2 (catalog uses popularity proxy), R11 (uses R4)

ROUND 3 — MOSTLY EVERYTHING (up to ~20 sessions parallel)
  After Round 2: R14a, R14b, R2, R11, R6 (waits R4), R13 (deps R12+R14a+R4+W4+P1+R22),
                R18 (deps R14+R12+R15), R19 (deps R3), R21 (deps R2+R4+R11),
                R22, R25 (Shopify) → R5 (uses R25)
  W1.1, W1.2, W1.3, W1.4 in parallel anywhere after W1

ROUND 4 — DEFERRED
  R10 (music videos)
```

**Hard exclusivity rules:**

1. No two sessions claim the same migration number (ledger above is canonical).
2. No two sessions edit the same file (file lists above are non-overlapping by design).
3. Umbrella OS files (`BRAIN.md`, `CLAUDE.md`, `AUTONOMOUS_QUEUE.md`, `HIERARCHY.md`, `BUSINESS_HIERARCHY.md`, `EMPLOYEE_DIRECTORY.md`, `SKILL_DIRECTORY.md`, `FILE_INVENTORY.md`) — only one session edits at a time. R9 explicitly edits `BUSINESS_HIERARCHY.md`.
4. Cross-product changes claim BOTH cwds (R1 spans `packages/dad-core/` + `products/tenx10-platform/`; R24 spans `products/tenx10-platform/` + `products/digital-booking-agent/`).
5. tenx10-platform submodule pointer bumps coordinated by one session at a time.
6. `<EstimateCard>` and `<PersonaSwitcher>` primitives owned by F1; consumers import, F1 owner edits.

---

## Open decisions to lock before Round 1 starts

1. **DAD shared library** at `packages/dad-core/`? Recommended: yes.
2. **Intelligence Scout** own product? Recommended: yes (`products/intelligence-scout/`).
3. **Social Pilot** own product? Recommended: yes (`products/social-pilot/`).
4. **Reputation Manager** own product? Recommended: yes (`products/reputation-manager/`).
5. **Royalty Ingester** own product? Recommended: yes (`products/royalty-ingester/`).
6. **Pixel Tracker** own product? Recommended: yes (`products/pixel-tracker/`).
7. **Shopify connector**: live in `products/tenx10-platform/` or new `products/shopify-connector/`? Recommended: tenx10-platform initially; abstract to its own product if a 2nd tenant requires Shopify integration.
8. **HVRCRFT real name + email + agency** (TBD per artist BRAIN gap).
9. **Kotrax real name + email + agency** (TBD per artist BRAIN gap).
10. **Dark Matter** — one shared account or two (Isaac Tullos + Joseph Kalina)?
11. **Hunter** — full name + email + agency.
12. **Brian** — full name + agency name + which WHOiSEE roster he manages.

Items 8-12 needed before F2 seeds the auth.users accounts.

---

## End-to-end smoke test (after all 36 active tasks complete)

1. **Onboarding** — invite test artist → 7-step gamified flow → DSP + social + consent + AI team + comms preference set + first quest assigned.
2. **Booking augment** — Brian logs in (booking_agent role) → sees only WHOiSEE pipeline + agency-shared canary + counter-offer with EstimateCard reasoning.
3. **Booking replace** — solo artist tenant → DBA drafts route to Thomas → ok → email sent.
4. **Homepage** — Thomas (label_manager) → revenue rollup across 5 artists + DSR; switch to artist (DirtySnatcha) → own dashboard.
5. **Catalog** — per-track health score with multi-country cert progress + sync licensing pipeline.
6. **Social** — schedule cross-platform post → fires with voice profile.
7. **AI-Twitter pilot** — confidence-graded posting daily; kill switch tested.
8. **Reputation** — nightly scan across all entities + venues + promoters + talent_buyers; negative mentions surface in W3 stream.
9. **Drive auto-organize** — offer PDF dropped → renamed + linked + per-show folder created.
10. **Royalty** — BMI statement parses → revenue rollup updates → unmatched lines flag registration gaps for R3.
11. **Cert tracker** — track crosses 500K-equivalent → Gold achievement → +5K XP → application generated.
12. **Sheet sync** — DirtySnatcha sheet edit → row updates in TENx10 within 60 sec; reverse direction works.
13. **10RG separation** — tenx10.co clean of 10RG products; 10researchgroup.com Command Center renders.
14. **Compliance** — R20 audit returns green for current consent + data flows.
15. **Positioning** — per-artist positioning narrative + compilation candidate + growth playbook output.
16. **Morning brief + multi-channel Xai** — DirtySnatcha SMS → daily brief at phone; voice question → Gemini 3.1 Flash TTS reply; "tell my manager X" → Thomas pinged.
17. **Agency multi-tenant** — Brian's agency isolated from Andrew's; data not cross-readable.
18. **DBA mode toggle** — flip WHOiSEE augment ↔ replace; routing changes accordingly.
19. **Shopify** — `myhydrationpack.com` order → webhook → R5 pre-order counter increments live.
20. **Industry data** — Luminate + OCC + GfK + ARIA registered; Beatport chart positions captured weekly.

If all 20 pass, the rebuild is shipped.

---

## Cross-references

- Build-cycle skill: `.claude/skills/build-cycle/SKILL.md`
- Reading-discipline rule: `~/.claude/projects/<project>/memory/feedback_reading_discipline.md` + umbrella `CLAUDE.md` § "Read before writing"
- Factory architecture (5-layer agent OS): `docs/superpowers/specs/2026-04-27-factory-architecture-design.md`
- Music Meme content framework (3-folder voice profile): `docs/superpowers/specs/2026-05-05-content-meme-generation-framework.md`
- AI Studio prototype extraction: `docs/superpowers/specs/2026-05-05-aistudio-prototype-extraction.md`
- DSR ownership canonical: `MANAGEMENT-TENx10/labels/DirtySnatcha Records/BRAIN.md` § Ownership
- KB Module 24 (agent personas): `products/tenx10-platform/TENx10_Knowledge_Base/24_Agent_Team_Architecture.md`
- KB Module 25 (catalog evaluation): `products/tenx10-platform/TENx10_Knowledge_Base/25_Catalog_Evaluation_Engine.md`
- DBA architecture: `products/digital-booking-agent/{CLAUDE.md, BRAIN.md, docs/DOMAIN_MODEL.md, docs/FLOWS.md}`

---

*Partition Plan v2.0 — 2026-05-05 — generated via the build-cycle skill. APPROVED for execution per Thomas Nalian's "build" command.*
