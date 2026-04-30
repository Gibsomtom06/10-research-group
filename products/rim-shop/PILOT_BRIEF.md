# Client 0 — Wheel Repair Specialists of Michigan (WRS) — Performance-Share Pilot

**Status:** Pre-engagement. Notebook intel captured, pilot structure drafted, awaiting verbal confirmation with the owner.
**Engagement type:** Performance-share. Zero upfront. 10 Research Group earns margin above wholesale on everything we sell.
**Strategic purpose:** This is the proof-of-concept. Success here = case study that lets us charge $25K–50K for MVP builds and $150K–300K+ for enterprise systems to subsequent clients.

---

## 1. Client profile

| | |
|---|---|
| Business | Wheel Repair Specialists of Michigan (WRS) |
| Location | 10500 W 8 Mile Rd, Metro Detroit, MI |
| Hours | Mon–Fri 8:00–5:00, closed weekends |
| Tenure | 60+ years combined experience |
| Service area | Greater Metropolitan Detroit (25-mile radius for local service) |
| Existing channels | Walk-in shop, eBay store (existing, underperforming, hard to find) |

## 2. What they sell (two revenue streams)

### A. Local services (high margin, urgent demand)
- Cosmetic & structural wheel repair (curb rash, bends, cracks)
- Custom powder coating
- Full-service mount & balance (the differentiator — most shops require loose rim drop-off)
- Vehicle indoor storage
- OEM replacements when repair isn't viable

**Powder coating pricing (per wheel):**

| Wheel size | Price |
|---|---|
| 13"–15" | $105–$110 |
| 16"–17" | $115–$120 |
| 18"–19" | $125 |
| 20"–21" | $135–$145 |
| 22"–23" | $145–$155 |
| 24"–26" | $165–$175 |

Adders: chemical stripping +$35/wheel, protective clear coat +$25/wheel.

**Other coating services:** brake calipers $45–75 each, suspension parts $35–80, full car frame $1,200–1,400.

**Turnaround:** 2 days if vehicle dropped off (indoor storage); 1–2 weeks for loose wheel drop-offs.

**Gross margin on a set of 4 powder-coated wheels:** ~$450 revenue / ~$50 direct cost = **89% gross margin.**

### B. National e-commerce (refurbished OEM wheels)
Ready-to-sell inventory across 5 hot finishes, plus a large "Not Ready" backlog that's directly lost revenue.

**Ready-to-sell (partial list):**

| Finish | Avg price | Example SKUs |
|---|---|---|
| Machined Gunmetal (top 2026 luxury SUV trend) | ~$325 | 10251-MGM, 86350 MGM, 3808 MGM, 10106 MGM |
| PVD Chrome (rare, high demand) | ~$285 | 4577 PPP, 5208 PPP, 5210 PPP, 4681 PPP |
| Gloss Black (sport trims) | ~$215 | 95749 GB, 10465 GB, 2516 GB, 71488 GB |
| Hyper Graphite (BMW/Audi style) | ~$265 | 10020 HG, 2664 HG, 10123-HG |
| Matte Black Machined (truck/SUV) | ~$245 | 3908-MBM, 95213 MBM |

**Not Ready backlog (represents lost revenue):** significant quantity across all 5 finishes. First agent output = a prioritized refinish work order that tells the shop which "Not Ready" units to process first based on search demand × price.

## 3. Market financials (2025/2026 benchmarks)

| Metric | Benchmark |
|---|---|
| Automotive CPC (Google Search) | $2.41 |
| Automotive CPA (ecommerce) | $33.59 |
| Automotive ROAS (industry avg) | 3.08 |
| Local service search conversion | 14.67% |
| Automotive ecommerce conversion | 1.59% |
| Cart abandonment | 70.22% |
| Abandoned-cart email revenue (automotive) | $9.86/recipient |
| Avg set of 4 powder-coated wheels (AOV) | $450 |
| Avg new wheel set (AOV) | $1,200 |
| US automotive wheel market (projection) | $21.83B by 2032 |
| Avg vehicle age on US roads | 12.8 years (record high — drives aftermarket) |

## 4. The deal — 10 Research Group's terms

**Proposed structure (to confirm with WRS):**

- Zero fee upfront. Zero retainer. Zero hourly.
- On any sale we generate that they wouldn't have closed otherwise: **10 Research Group keeps the margin above wholesale**, minus ad spend passthrough.
- Wholesale = WRS's direct cost (powder, labor, energy, and for refurbished wheels, acquisition cost).
- Ad spend passes through at cost (or split — to negotiate).
- **Term:** 90-day pilot. Mutual review at day 90. Extension terms renegotiated with the case-study in hand.
- WRS commits to: (a) expediting the prioritized "Not Ready" backlog we flag, (b) honoring the pricing list we build campaigns around, (c) responding to chatbot-captured leads within 24 hours.

**Why WRS says yes:** zero risk. Zero cash out of pocket beyond ad spend (which we justify with ROAS). Uncapped upside to them — their wholesale cost is covered on every sale.

**Why 10 Research Group says yes:** proves the factory works, generates the case study, uncapped margin upside, builds the reusable agent stack we'll sell to clients 1-N.

## 5. Scope — what we build and deploy

Seven deliverables, all reusable IP for subsequent clients. Everything maps back to agent patterns from the `funding-my-life` strategic playbook.

| # | Deliverable | Supervisor/PES/Reversible pattern | Tech |
|---|---|---|---|
| 1 | **Google Merchant Center feed** for refurbished wheels (condition=refurbished, no GTIN required, proper title/description/category) | PES — agent plans title variants, executes upload, summarizes approval rate | Google Merchant Center, Shopify/WooCommerce feed, or custom Vercel endpoint |
| 2 | **Google Performance Max + Shopping campaigns** on inventory feed | Supervisor loop — monitors CPA/ROAS, pauses underperformers | Google Ads MCP (if connected) or manual + dashboard |
| 3 | **Local Google Search Ads** targeting 25-mile radius of 8 Mile Rd for high-intent service keywords | PES — keyword research → bid → conversion tracking | Google Ads |
| 4 | **Refinishing prioritization agent** — ranks "Not Ready" inventory by search demand × price | PES — reads Google Trends + their backlog, outputs weekly work order | Claude + Supabase + inventory spreadsheet |
| 5 | **AI chatbot** on their site (and optionally eBay messages) — inventory matching, photo-based repair quotes, abandoned-cart triggers | Supervisor with Reversible Reasoning for edge-case fallbacks | Claude API + their site (WordPress or static) |
| 6 | **Abandoned-cart email sequence** (3-step sequence: 1hr gentle nudge, 24hr discount, 72hr urgency) | PES — tracks open/click/recover, adjusts copy | Klaviyo or equivalent |
| 7 | **eBay store audit + optimization** — find the existing store, rebuild listings with GMC-aligned titles, photos, descriptions; run eBay Promoted Listings | PES — audit → fix → measure weekly | eBay seller hub + our feed |

## 6. Targets (90-day pilot)

Conservative base case:

| Milestone | Metric | Target |
|---|---|---|
| Day 14 | GMC account approved, first shopping feed live | Yes/no |
| Day 14 | Local Google Search ads live | Yes/no |
| Day 30 | First ad-attributed sale (e-commerce) | ≥ 1 |
| Day 30 | First chatbot-captured service lead | ≥ 5 |
| Day 60 | Monthly ad-attributed revenue | ≥ $10,000 |
| Day 60 | ROAS | ≥ 2.5 (below benchmark, ramping) |
| Day 90 | Monthly ad-attributed revenue | ≥ $25,000 |
| Day 90 | ROAS | ≥ 3.08 (at benchmark) |
| Day 90 | Abandoned-cart recovery revenue | ≥ $1,500/mo |
| Day 90 | eBay store revenue | ≥ 3× baseline |

**10 Research Group's revenue at targets (estimated):**
- E-com gross at $25K/mo with ~30-40% margin above wholesale = $7.5K–$10K/mo to us
- Local powder coating upsell at 89% gross × our share = additional $3K–$5K/mo
- **Projected 10RG monthly revenue by day 90: $10K–$15K/mo from Client 0 alone**

## 7. Immediate next actions

1. **Find WRS's existing eBay store** (web search: "wheel repair specialists michigan ebay", "WRS ferndale ebay", "10500 8 mile ebay") — completes the channel map.
2. **Verbal confirmation with WRS owner** on the performance-share structure. Thomas leads this conversation.
3. **Signed 1-page SOW** (performance-share terms, 90-day pilot, scope of 7 deliverables, exit clause).
4. **Kick off Deliverable #1 (GMC feed) + #4 (refinishing prioritization agent)** — both can ship in week 1 and produce visible wins fast.

## 8. What makes this pilot worth everything

This one engagement covers:
- The income architecture: **Automated Micro-SaaS / Agent-as-a-Service** (from `funding-my-life`)
- The agent patterns: **Supervisor Loop** + **Plan-Execute-Summarize** + **Reversible Reasoning** (all three, deployed on a real P&L)
- The case study format for the next client deck: "Day 0 baseline → Day 90 revenue, ROAS, leads generated, inventory cleared."
- The reusable IP stack: GMC feed builder, local ads framework, inventory prioritization agent, chatbot, abandoned-cart sequence — all become productized offerings.

**When Client 0 finishes successfully, every subsequent client conversation starts with: "Here's what we did for a Michigan wheel shop in 90 days. Your contract is $50K for the MVP build."**
