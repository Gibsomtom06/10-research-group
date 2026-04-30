# Revenue Streams That Fund Trading Capital

**Date:** 2026-04-28 (revised same day)
**Author:** Thomas + Claude (synthesized from `2026-04-28-strategic-review-and-gaps.md` case studies)
**Status:** Spec — pivoted to zero-capital streams. Implementation plan dispatched on Stream 1.
**Companion docs:** `2026-04-28-strategic-review-and-gaps.md`, `2026-04-27-trading-shadow-test-design.md`, `products/mhp/BRAIN.md`

---

## Hard constraint: zero starting capital

Thomas has $0 in seed capital for revenue products. Every stream below is either:
- **Zero capital required** (digital product, service, agent), OR
- **Customer-funded** (pre-order, deposit, or print-on-demand where customer pays before fulfillment cost)

Anything requiring vendor MOQ, inventory buy, or upfront ad spend is parked until earlier streams generate it.

---

## Thesis

Three industry case studies from the NotebookLM strategic review become three revenue products. Each funds the trading-shadow account, currently $40 live, auto-halt floor at $100. We can't scale trading capital from trading itself at that size. Revenue funds it.

Each revenue product also runs the Claude → Ollama shadow graduation pattern. So they double as factory agents in training. Profit compounds. Shadow accuracy compounds. Trading capital compounds.

---

## Streams ranked by speed-to-first-dollar (zero capital)

### Stream 1 — DirtySnatcha digital products to existing fanbase

**Pattern source:** Not from the case studies — this is the asset already in hand. 14M streams, 136 tracks, producer with stems. Existing audience. Education / Services pillar from the platform Revenue-First Framework.

**Products:**
- **Sample pack** (drums, basses, stems from released tracks): $25-50 retail, ~95% margin
- **Project files** (Ableton / FL sessions for chosen released tracks): $30-75 retail
- **Production tutorial** (one signature track broken down): $20-40 retail
- **Patreon-style subscription** for early demos + monthly stems: $5-15/mo recurring

**Capital required:** $0. Stems already exist. Distribution via Gumroad / Bandcamp / direct site.

**Speed to first revenue:** 3-7 days from go-decision (assemble pack, write listing, market to existing audience).

**Margin:** ~95% net after platform fee.

**Why this is Stream 1:** existing audience, existing asset, no production cost, instant digital delivery, no shipping, no returns risk.

### Stream 2 — MHP print-on-demand drops (customer-funded)

**Pattern source:** Same Retail AI Arbitrage Flipper case study, but pivoted off vendor-MOQ to print-on-demand (Printful / Printify) so customer cash funds fulfillment.

**Mechanic:**
1. Trend / cultural moment identified by agent
2. Concept designed, mockup generated
3. Listed as pre-order or POD on MHP storefront
4. Customer pays full retail
5. Print-on-demand vendor fulfills, MHP keeps margin

**Capital required:** $0 (POD has no MOQ). Margin is lower than vendor-MOQ model but risk is zero.

**Speed to first revenue:** 7-14 days per drop after Stream 1 first dollars in.

**Margin:** 25-40% per unit on POD vs 60-75% on vendor-MOQ. Tradeoff is margin for zero risk.

**Note:** Once Stream 1 generates a few hundred dollars, we can mix in low-MOQ vendor drops for higher-margin items (jerseys, hats) where the risk-reward is favorable.

### Stream 3 — SKU Cleanup-as-a-Service for Shopify merchants

**Pattern source:** Mid-market retailer cut return rate 3.2% → 1.1% with multi-step agent on 80,000 SKUs.

**Pricing:**
- $500-1,500/month per merchant depending on SKU count
- Setup fee: $500-2,000 (this is the FIRST cash in for this stream)

**Capital required:** $0 to build the agent. First setup fee from first client = first dollars.

**Speed to first revenue:** 2-4 weeks per outbound cycle, first paying client month 1.

**Why third instead of first:** sales motion takes weeks. Stream 1 produces dollars in days. But this stream compounds harder because it's recurring B2B.

### Stream 4 — Existing inventory flips (anything sitting around)

**Pattern source:** Retail AI Arbitrage Flipper, but the inventory already exists.

**Candidates:**
- Comics from the eBay venture mentioned in pending items
- Any old MHP samples / overstock
- Decluttered items surfaced by DAD

**Capital required:** $0 (already owned). Listing fees minimal.

**Speed to first revenue:** 7-14 days to list and sell first item.

**Why fourth:** need to inventory what actually exists before sizing this. Could leapfrog to Stream 1 territory if there's meaningful sellable inventory already in hand.

### Stream 5 — Tier-2 Support Agent for agencies / labels

**Pattern source:** B2B SaaS Tier-2 support agent. Response time 18hr → 4min. $140K/yr saved.

**Pricing:**
- $2,000-5,000/month per agency
- Setup: $5,000-15,000

**Capital required:** $0 to build. Long sales cycle.

**Speed to first revenue:** 4-8 weeks. Saved for later because Streams 1-3 generate cash faster.

### Parked — Viral merch with vendor MOQ

**Why parked:** $300-500 seed cost per drop. No capital available now. Unparks once Stream 1 + Stream 2 + Stream 4 produce ~$2K cumulative, at which point selective vendor-MOQ drops on highest-confidence designs make sense for the higher margin.

---

## Funding flow

```
Stream 1: DirtySnatcha digital products
   ~95% net margin per sale  →  10 Research Group ops account  →  trading-shadow

Stream 2: MHP POD drops
   ~30% net margin per sale  →  10 Research Group ops account  →  trading-shadow

Stream 3: SKU Cleanup SaaS
   monthly recurring per client  →  10 Research Group ops  →  trading-shadow

Stream 4: Inventory flips
   one-time margin per item  →  10 Research Group ops  →  trading-shadow
```

Bridge account between revenue and trading is intentional, NOT a direct pipe. Bad month on any single stream can't starve trading capital.

---

## Trading capital milestones (proposed)

| Window | Account size | Unlock |
|---|---|---|
| Day 0 (now) | $40 live | $5 max per trade, equities only |
| Day 30 | $1,000 | $25 max per trade, equities only |
| Day 90 | $5,000 | options unlocked, $50 max per trade |
| Day 180 | $25,000 | full agent autonomy on per-trade sizing within strategy bounds |

Each milestone gated by trading-shadow accuracy thresholds AND capital available. If shadow isn't beating Claude on its metric, capital doesn't unlock no matter how much sits in the bridge.

---

## Shadow graduation aligned to revenue

Each revenue product runs Claude day 1 with an Ollama shadow learning. Graduation criteria:

| Stream | Shadow graduates when |
|---|---|
| Digital products | Shadow's pack-curation pick beats Claude's pick on conversion 60%+ over 20 packs |
| POD merch | Shadow's trend → concept pick beats Claude's pick on conversion 60%+ over 20 drops |
| SKU Cleanup | Shadow's listing rewrite beats Claude's on return-rate delta 80%+ over 1,000 SKUs |
| Inventory flips | Shadow's listing/pricing beats Claude on sell-through speed 70%+ over 50 items |
| Tier-2 Support | Shadow's response approval rate ≥ 85% over 500 tickets |

---

## Implementation order

1. **Stream 1 implementation plan** dispatched to subagent now: `docs/superpowers/plans/2026-04-28-dirtysnatcha-sample-pack-implementation.md`
2. Stream 4 (inventory inventory): one-shot question to Thomas about what exists, then captured inline.
3. Stream 2 spec: drafted after Stream 1 first sale.
4. Stream 3 spec: drafted week 2.
5. Stream 5 spec: drafted week 4.

---

## Risks specific to zero-capital plan

1. **Audience activation risk:** 14M streams ≠ 14M emails. Need to verify what direct-reach audience looks like (Spotify followers, IG, mailing list, Discord). Without direct channel, Stream 1 has to rely on social posting which has lower conversion.
2. **Time-to-cash dependency on a single producer (Thomas):** Stream 1 = Thomas curating stems. If Thomas is the bottleneck, can't parallelize across other DSR artists until Stream 1 is documented as a repeatable process.
3. **POD margin compression:** Stream 2 at 30% margin means small drops don't materially fund trading. Volume matters; ad spend (which is capital) matters; so Stream 2 only contributes meaningfully once we have ad budget from Stream 1.
4. **Bridge account discipline:** with no buffer, any 10 Research Group ops cost (domain renewals, software, etc.) could pull from revenue before it reaches trading. Need explicit allocation rule (e.g., 50% of revenue → trading, 50% → ops + reinvestment).

---

## Out of scope

- Pricing pages, brand assets, marketing infrastructure beyond what each stream minimally needs
- Legal structure between MHP, 10 Research Group, DSR, and trading entity (CPA + lawyer question)
- Any stream requiring upfront capital until earlier streams generate it

---

*Spec v2.0 — 2026-04-28 (zero-capital revision). Re-run after each milestone hit or missed, or when capital constraint changes.*
