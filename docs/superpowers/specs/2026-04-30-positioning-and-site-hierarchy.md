# Positioning + Site Hierarchy

**Date:** 2026-04-30 (very late session)
**Status:** Strategy spec. Captures Thomas's late-session product/positioning clarification.

---

## The hierarchy

```
10 Research Group (umbrella / parent brand)
│   Site: 10researchgroup.com (sandbox/staging-quality for now;
│   acts as hierarchy index linking to each product)
│
├── TENx10 (MANAGEMENT-first, software secondary)
│   Site: tenx10.co
│   Pitch: "Full-service AI-augmented artist management"
│   Tooling: proprietary stack (DSR_CLEAN_DATABASE schema, Xai, booking eval, label dashboard)
│   Proof: DSR (DirtySnatcha Records) runs on it
│   Customer: indie artists, managers, small-mid labels
│
├── DSR (DirtySnatcha Records)
│   Site: dirtysnatcharecords.com
│   Pitch: working bass-music label
│   Roster: DirtySnatcha (Lee Bray) + WHOiSEE + Kotrax + Dark Matter (managed) + label-side-only artists
│   Role: dogfood for TENx10
│
├── DBA (Digital Booking Agent)
│   Site: TBD (subdomain or own .com)
│   Pitch: "Replace your booking agent with AI"
│   Status: 7 specialists scaffolded, blocked on Supabase Phase 1
│
├── DAD (Digital Asset Declutter)
│   Site: TBD
│   Pitch: "Auto-organize your label's accumulated digital sprawl + register every track everywhere"
│   Status: pattern captured tonight (CONSOLIDATION_PATTERN.md), system-steward Python utilities exist
│
├── MHP (MyHydrationPack)
│   Site: dirtysnatcharecords.com/merch (current) — eventually own domain
│   Pitch: viral merch line; on-demand vendor pipeline
│   Status: hockey jersey for DirtySnatcha launching
│
├── WRS Rim Shop
│   Site: deployed locally for client; template for Gary Vee playbook
│   Pitch: local agency 2.0 ($500 sites, $500/mo retainers w/ 30-day-leads-or-no-pay)
│   Status: site signature-ready, not deployed
│
└── Trading Shadow (Phase 0 of the Factory)
    Status: research, paper-trading, graduation-gated
    Customer-facing: not yet
```

---

## "Management first, software secondary" — what it actually means

When TENx10 goes to market, the pitch order is:

1. **Lead with management capability** — "We manage artists. Here's our roster. Here's the revenue we've generated. Here's how we approach it."
2. **Reveal the tooling as the proof** — "We do this at scale because we built our own platform. Here's what it does."
3. **License the platform separately** — "If you'd rather DIY, we license the same tools other managers use, $XX/mo."

The reverse order (software first) is what every other AI-music-tool startup does. It commoditizes immediately. **Management-first is defensible because the human expertise + roster + relationships are wrapped around the software — you can't copy it overnight.**

---

## What this changes for tonight's work

- **DSR_CLEAN_DATABASE.xlsx** is correctly positioned: it's the data model behind the management capability, not a SaaS product itself
- **The label dashboard spec** (`2026-04-30-dsr-label-dashboard.md`) is correctly positioned: it's the management-team's internal dashboard, also exposed as a feature for licensed users
- **Xai** is correctly positioned: it's the management-AI that DSR uses; ALSO licensed to other managers
- **The website work** in `products/tenx10-platform/` needs a UX revision before public — currently looks like a SaaS marketing site; should look like a management firm's site that happens to license its tools

---

## What needs to ship for the public-facing flow

### Phase 1 — 10 Research Group umbrella site (sandbox-quality)
Goal: a hierarchy index page that links to every product. Like a brand-portfolio one-pager. Could be a single Next.js page or even a static HTML deployment.

**Content:**
- 10 Research Group masthead + tagline ("Umbrella for portfolio of agentic businesses")
- 8-product grid with name + 1-line description + status flag (LIVE / BETA / RESEARCH) + link
- "Capitulate and Cultivate" principle as a footer line

**Effort:** 2-4 hours.

### Phase 2 — TENx10 site UX revision (management-first)
Currently the tenx10.co site (per CLAUDE.md TASKS) has hardcoded DSR content and looks SaaS-first. Revise:

- Hero: management capability + roster proof
- Features section: secondary, after roster + case studies
- "License the platform" as a tertiary CTA, not primary
- Apply gating/approval logic that matches management-firm reality

**Effort:** 1-2 days.

### Phase 3 — Per-product subsites (as products go live)
Each product gets its own surface as it ships (DBA, DAD, etc.). NOT all at once. Lean into 10researchgroup.com as the hierarchy hub.

---

## Sandbox approach for the umbrella site

Cheapest options (in order):
1. **Vercel + Next.js single-page** under tenx10.co subdomain initially (~free, deploy in 1 hour)
2. **Webflow / Framer** for marketing-quality static (paid, designer-friendly, fast)
3. **GitHub Pages or Cloudflare Pages** (~free, static HTML, fastest if no auth needed)
4. **Custom Next.js app** in `products/10rg-umbrella-site/` — proper but slower

Recommend (1) for sandbox/staging — single Next.js page deployed to a Vercel preview URL at no cost, swap to 10researchgroup.com once happy.

---

## Cross-references

- TENx10 platform code: `products/tenx10-platform/`
- TENx10 platform CLAUDE.md TASKS: lists multi-artist onboarding, artist join, RSE dashboard, artist Xai chat, morning briefings, **fix live site (remove hardcoded DSR content)** — that last task fits the management-first revision
- Label dashboard spec: `2026-04-30-dsr-label-dashboard.md`
- Booking flow spec: `2026-04-30-dsr-booking-flow-vision.md`
- Personal brand spec: `2026-04-30-personal-brand-launch.md` (BACKBURNERED — connects to 10 Research Group brand once Thomas's personal positioning fires)

---

*Spec v1 — 2026-04-30. Update once 10 Research Group umbrella site lands and TENx10 site UX revision ships.*
