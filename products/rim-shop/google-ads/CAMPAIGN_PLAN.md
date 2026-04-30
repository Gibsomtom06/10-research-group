# WRS Google Ads — Campaign Plan v0

Targets: (A) local services within 25mi of 10500 W 8 Mile Rd, (B) national e-commerce for refurbished wheels.

Baseline benchmarks (automotive):
- CPC: $2.41
- CPA (e-commerce): $33.59
- ROAS target: 3.08
- Local search conversion rate: 14.67%
- E-commerce conversion rate: 1.59%

Start budget: $50/day ($1,500/mo) total, split 60% local services, 40% e-commerce. Scale up on winners week 2.

---

## Campaign 1 — Local Services (Search, Detroit metro)

**Goal:** capture high-intent local searchers for wheel repair, powder coating, and mount+balance.

**Geo targeting:** 25-mile radius around 10500 W 8 Mile Rd, Ferndale MI. Exclude clicks outside radius.

**Schedule:** Mon–Fri 7am–6pm (matches WRS hours + buffer). Paused weekends.

**Budget:** $30/day

### Ad groups

**AG1 — Wheel repair (curb rash, bent)**
Keywords (phrase + exact):
- "wheel repair near me"
- [wheel repair detroit]
- "curb rash repair"
- [bent wheel repair]
- "rim repair shop"
- [cracked rim repair]
- "alloy wheel repair"

Negatives: free, diy, how to, video, youtube, parts only

**AG2 — Powder coating**
Keywords:
- "powder coat wheels"
- [powder coating near me]
- "custom wheel color"
- [rim powder coat]
- "caliper powder coating"
- "frame powder coating"

Negatives: service near me (generic), diy, kit

**AG3 — Mount & balance (differentiator)**
Keywords:
- "mount and balance shop"
- [tire mount balance near me]
- "wheel mount balance on car"
- "loose tire mount balance"

Negatives: free, discount tire, belle tire (competitor brand terms — or bid on them separately with comparison ad copy)

### Ad copy (Responsive Search Ads — 3 per ad group)

AG1 headlines (pick 15, pin top 3):
1. Wheel Repair — Ferndale
2. Curb Rash. Bent. Cracked.
3. 60 Years Combined Experience
4. Same-Week Turnaround
5. Indoor Vehicle Storage Available
6. Mount & Balance On Car
7. Free Quote — Call or Text
8. OEM Replacements Available
9. Insurance Estimates Welcome
10. Powder Coat Any Color
11. Full-Service, Not Just Repair
12. 10500 W 8 Mile — Ferndale
13. Open Mon–Fri 8–5
14. Cosmetic + Structural Repair
15. Your Wheels. Fixed Right.

Descriptions (4):
1. Curb rash, bends, cracks — cosmetic and structural repair at Ferndale's full-service wheel shop. Mount and balance included.
2. 60+ years combined experience. Indoor vehicle storage so you drive in and out on the same wheels. Call for a same-day quote.
3. The only shop in metro Detroit doing full mount and balance on car — no loose rim drop-off required.
4. OEM replacements when repair isn't viable. Custom powder coat. Insurance estimates accepted.

Callouts: "Free Quotes", "Same-Week Turnaround", "Mount & Balance On Car", "Indoor Storage"
Sitelinks: /services, /powder-coating, /contact-us, /about-us
Call extension: 248-900-9100

### Conversion tracking

- Primary: phone calls from ad (set up call tracking)
- Primary: form submit on /contact-us
- Secondary: directions clicks, website clicks to /shop/*

---

## Campaign 2 — Performance Max (refurbished wheel e-commerce)

**Goal:** move ready-to-sell refurbished inventory across US.

**Feed:** the Merchant Center feed built from `gmc-feed/inventory_to_feed.py`.

**Geo:** United States. De-emphasize AK/HI (shipping cost kills margin).

**Budget:** $20/day

**Asset groups (one per finish):**

1. **Machined Gunmetal** — highest-trend for 2026 luxury SUVs
   - Headlines: Refurbished OEM Wheels, Machined Gunmetal Finish, Ship Today, Warrantied, 60 Yrs Experience
   - Long headline: Refurbished OEM Wheels — Machined Gunmetal — Ships in 2 Business Days
   - Description: Powder coated and balanced in-house. Each wheel inspected for bends and cracks. 30-day satisfaction guarantee.
   - Images from the feed
2. **PVD Chrome** — rare, high-demand
3. **Gloss Black** — sport trim
4. **Hyper Graphite** — BMW/Audi style
5. **Matte Black Machined** — truck/SUV

**Audience signals:** custom segments based on searches like "OEM wheels", "refurbished rims", "replacement alloy wheels", plus competitor site visitors (OriginalWheels.com, AlloyWheelsDirect, etc. — add via remarketing list feature).

**Conversion tracking:** standard e-com purchase event via GA4 + Google Ads conversion tag. AOV target: $285 avg.

---

## Campaign 3 — Shopping (fallback / standard)

Some PMax ROAS watchers recommend running a traditional Shopping campaign alongside PMax for transparency. Add once PMax has 2 weeks of data.

**Budget:** $10/day
**Feed:** same GMC feed
**Structure:** single campaign, sub-divided by `product_type`

---

## Week-by-week budget ramp

| Week | Local/day | PMax/day | Shopping/day | Total/mo |
|---|---|---|---|---|
| 1 | $30 | $20 | — | $1,500 |
| 2 | $40 | $25 | $10 | $2,250 |
| 3 | $50 | $35 | $15 | $3,000 |
| 4 | $60 | $50 | $20 | $3,900 |

Scale up only if the prior week hit ≥ 2.5 ROAS on PMax + Shopping AND local services hit ≥ 5% CTR + ≥ 8% conversion.

---

## KPI dashboard (weekly review with WRS)

- Spend by campaign
- Clicks, CTR, CPC
- Conversions (calls, forms, purchases) split local vs e-com
- Revenue attributed (e-com only — local revenue tracked via WRS back-office, reported separately)
- ROAS (e-com)
- Top 10 converting keywords
- Bottom 10 converting keywords (pause or negative)
