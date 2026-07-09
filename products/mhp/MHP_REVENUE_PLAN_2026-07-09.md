# MHP (MyHydrationPack) — Revenue Plan
**Written:** 2026-07-09 · **Target:** $100,000 gross revenue by 2026-12-31 (25 weeks) · **Capital available:** $0

> **CORRECTION, 2026-07-09, verified live.** MHP is not pre-launch. **myhydrationpack.com is a
> live Shopify store with a working cart and checkout**, currently listing five products,
> including **Squarebass V2 Hockey Jersey at $125–135, in stock right now**. Socials:
> @myhydrationpack.
>
> Two consequences for everything below:
> 1. **The $70 retail price in §1/§2 is wrong.** MHP's proven price is **$125**. At $125 the
>    $100k target is ~800 jerseys (~32/week), not ~1,430. All margin math needs re-running.
> 2. **The "no payment rail" blocker in §3 does not exist.** That was a misread of
>    `merch-store/index.html`, which is DirtySnatcha's page, not MHP's.
>
> What remains true and unchanged: the 9-week vendor-invoice stall is the #1 risk; seasonality
> still favours football/soccer over hockey in this window; and artist-collab revenue for a
> *managed* artist still belongs to that artist, not MHP.

---

## 0b. REAL vendor costs — supersedes §1 entirely

Thomas supplied actual per-unit FOB pricing from the Pakistan manufacturer on 2026-07-09. These
are real quotes, not estimates. **They invert this plan's original recommendation.**

| product | FOB/unit |
|---|---|
| Hockey jersey, embroidered (the DirtySnatcha build) | **$28** |
| Football jersey, sublimated | $22 |
| Football jersey, sublimated + embroidery | $23 |
| Soccer shirt, plain | $11 |
| Soccer shirt, embroidered logos front | $13 |

Plus tariff, rate **not yet verified** (see risk below).

### Contribution margin per unit

Freight is a per-unit estimate ($2.50–$4.00 by weight). Payment fee 2.9% + $0.30. Tariff applied
to FOB customs value. Retail for hockey is MHP's **proven** $125; the others are market comps.

| product | FOB | retail | CM @0% tariff | CM @19% | CM @32% | margin @32% |
|---|---|---|---|---|---|---|
| **Hockey jersey (embroidered)** | 28.00 | **125.00** | 89.08 | 83.76 | **80.11** | **64%** |
| Football jersey (sublimated) | 22.00 | 70.00 | 42.17 | 37.99 | 35.13 | 50% |
| Football jersey (subl + embroidery) | 23.00 | 75.00 | 46.02 | 41.66 | 38.66 | 52% |
| Soccer shirt (plain) | 11.00 | 40.00 | 25.04 | 22.95 | 21.52 | 54% |
| Soccer shirt (embroidered front) | 13.00 | 45.00 | 27.89 | 25.43 | 23.73 | 53% |

### The $100k question, answered with real numbers

Assuming the worst-case 32% tariff:

| product | units to $100k gross | units/week over 25 wks | total contribution |
|---|---|---|---|
| **Hockey jersey @ $125** | **800** | **32** | **$64,092** |
| Football (sublimated) @ $70 | 1,429 | 57 | $50,186 |
| Football (subl+emb) @ $75 | 1,333 | 53 | $51,553 |
| Soccer (plain) @ $40 | 2,500 | 100 | $53,800 |
| Soccer (embroidered) @ $45 | 2,222 | 89 | $52,744 |

**The hockey jersey wins on every axis.** Fewest units to target (800 vs 1,429), highest
contribution per unit ($80 vs $35), highest margin (64% vs 50%), *and* it is the only SKU with
proven sell-through — CRiiOZ sold out at exactly this price. §1's recommendation to pivot away
from it to $70 sublimated team jerseys was made on a **$70 assumed retail and no knowledge that
the store was live**. Both were wrong. Disregard that pivot.

### Why this is zero-capital native

Sell as **pre-order collab drops**: the partner artist/brand promotes to their fanbase, orders
close, cash is collected, *then* the vendor is paid. Cash never leaves before it arrives.

| drop size | drops needed for $100k | gross/drop | contribution/drop |
|---|---|---|---|
| 50 units | 16.0 | $6,250 | $4,006 |
| 75 units | 10.7 | $9,375 | $6,009 |
| **100 units** | **8.0** | **$12,500** | **$8,011** |
| 150 units | 5.3 | $18,750 | $12,017 |

If instead you buy inventory up front, the cash needed before a single sale is $2,048 (50 units),
$4,096 (100), or $6,144 (150) — money that does not exist. **Pre-order is not a preference here,
it is the only legal move under the $0 constraint.**

### Revised verdict on $100k

At $125 retail it is **plausible, where at $70 it was not.** It requires roughly **eight
successful collab drops of ~100 units, one every three weeks, for 25 weeks.** That is the whole
risk, and it is a *distribution* risk, not a margin risk: MHP does not need its own audience — it
borrows the partner's. Partner selection by fanbase size is therefore the single most important
decision in this plan.

Honest read: 4–6 drops is the realistic base case (~$50k–75k gross). Eight is the stretch. The
number is now within reach, which it was not an hour ago.

---

## 0c. THE MARKET, corrected — and the $550 that defines the whole model

**2026-07-09, from Thomas.** Two facts that supersede §1, §2, §3, §5 and §7 below:

1. **The buyers are not sports teams or beer leagues.** They are **musicians, artists, and
   friend-groups buying custom jerseys for their rave fam.** Beer leagues are a possible
   side-channel, not the market. Everything in this doc about league commissioners and tournament
   directors is off-target — read it as one optional channel, not the plan.
2. **There is a $550 minimum per production order** (shipping + overhead), on top of per-unit FOB.
3. **Lead time is ~4 weeks** from order submission *with payment*.

### $550 is a fixed cost per ORDER, so it is a per-unit tax that shrinks with volume

Hockey jersey, FOB $28, tariff assumed 32%, payment fee 2.9% + $0.30:

| units | $550/unit | landed/unit | CM @$125 | CM @$150 | CM @$175 |
|---:|---:|---:|---:|---:|---:|
| 1 | 550.00 | 586.96 | −465.89 | −441.61 | −417.34 |
| 5 | 110.00 | 146.96 | **−25.89** | −1.61 | 22.66 |
| 10 | 55.00 | 91.96 | 29.11 | 53.39 | 77.66 |
| 15 | 36.67 | 73.63 | 47.45 | 71.72 | 96.00 |
| 20 | 27.50 | 64.46 | 56.61 | 80.89 | 105.16 |
| 25 | 22.00 | 58.96 | 62.11 | 86.39 | 110.66 |
| 50 | 11.00 | 47.96 | 73.11 | 97.39 | 121.66 |
| 100 | 5.50 | 42.46 | 78.61 | 102.89 | 127.16 |

**A 5-jersey rave-fam order at the current $125 price LOSES $25.89 per unit.** Break-even retail
at 5 units is $151.66. This single fact forces two rules:

- **Hard MOQ of 10 units per design.** Below that the arithmetic never works at a sane price.
- **The current $125 is too low.** See pricing below.

### The batching unlock — the most valuable operational idea in this document

Six separate rave-fam orders of 10 units are six production orders: **$3,300** of fixed cost. Close
them in one monthly window and submit as a single 60-unit run: **$550**.

| approach | fixed | fixed/unit | CM @$150 | total CM |
|---|---:|---:|---:|---:|
| 6 separate orders of 10 | $3,300 | $55.00 | $53.39 | $3,203 |
| **1 batched order of 60** | **$550** | **$9.17** | **$99.22** | **$5,953** |

Same product, same customers, **+86% contribution.** The 4-week lead time makes this easy: custom
orders close on the 1st of each month, production runs, everything ships ~5 weeks out. **Monthly
drop cadence is the operating rhythm of this business.**

### Market comps — price against artist merch, not sports uniforms

Embroidered EDM/rave hockey jerseys (the actual competitive set):

| source | price |
|---|---|
| Zingara EDM hockey jersey (eBay) | $135, category range $75–189 |
| Excision embroidered hockey jersey | premium artist tier |
| Scummy Bears / Drip Drop Labs / Rave Bonfire | embroidered, artist-designed |
| RaveJersey custom baseball | from $75.95 |
| *Commodity sublimated sports (Alkali, Dynasty)* | *$35–70 — different product, ignore* |

MHP sells an embroidered, applique, laced-neck, auth-tagged jersey at **$125 — below Zingara's
plain $135.** Underpriced.

### Recommended price list

| tier | price | applies to |
|---|---:|---|
| Stock / collab drop | **$165** | MHP designs, artist collabs |
| Custom group, 10–24 units | **$175** | rave fam, customer's design |
| Custom group, 25+ units | **$155** | volume break |
| Full-custom one-off design | **$185** | includes art + setup |
| **Minimum order** | **10 units per design** | non-negotiable |

At $165 inside a batched 60-unit run: landed **$46.13**, contribution **$113.79/unit**, **69% margin**.

### $100k, re-answered at $165

| retail | units to $100k | per week | contribution |
|---:|---:|---:|---:|
| $125 (current) | 800 | 32.0 | $59,959 |
| **$165 (recommended)** | **606** | **24.2** | **$68,963** |

Raising the price is worth ~$9,000 of contribution *and* removes 194 jerseys of selling work.

### Full line at recommended pricing (batched run of 60, 32% tariff)

| product | FOB | retail | landed | CM | margin |
|---|---:|---:|---:|---:|---:|
| Hockey jersey (embroidered) | 28.00 | 165.00 | 46.13 | 113.79 | 69% |
| Football jersey (subl+emb) | 23.00 | 110.00 | 39.53 | 66.98 | 61% |
| Football jersey (sublimated) | 22.00 | 100.00 | 38.21 | 58.59 | 59% |
| Soccer shirt (embroidered) | 13.00 | 75.00 | 26.33 | 46.20 | 62% |
| Soccer shirt (plain) | 11.00 | 65.00 | 23.69 | 39.13 | 60% |

---

## 0d. Rebrand — ur10fakind.com

Reads "**YOU'RE ONE OF A KIND**" (UR 1 0F A KIND, the 0 doing double duty). The `10` also rhymes
with TENx10 / 10 Research Group, which is a genuine asset, not a coincidence.

**Status: `ur10fakind.com` is REGISTERED, not available.** It resolves (HTTP 200) to an IONOS IP
(74.208.236.130) serving an empty placeholder — the signature of a domain bought and never built.
Thomas thinks he may own it. Confirm via the IONOS account or an IONOS receipt in one of the nine
inboxes (not present in thomas@dirtysnatcharecords.com).

If he does not own it, available as of 2026-07-09:

| domain | $/yr | reads as |
|---|---:|---|
| **ur1ofakind.com** | 11.25 | cleanest; "UR 1 OF A KIND" |
| ur10fakind.co | 29.99 | keeps the exact spelling |
| ur10fakind.shop | 2.99 | keeps spelling, weaker TLD |
| ur10ofakind.com | 11.25 | reads "10 of a kind" — off-message |
| youre1ofakind.com | 11.25 | unambiguous, longer |

Naming caution: the current brand is **MyHydrationPack**, but the live store's own title is already
"Custom Jerseys, Merch, Hydrationpacks." The hydration pack is no longer the product. A rebrand is
justified on those grounds alone — the name actively misdescribes the business.

### What must be verified before taking a customer's money

1. **The tariff rate.** Unverified. US MFN duty on man-made-fibre knit apparel is commonly ~32%
   (HTS 6110/6109), but rates on Pakistan may have changed and I will not assert a number I have
   not confirmed. One call to a customs broker settles it. The good news: **hockey wins at 0%,
   19%, and 32% alike**, so this does not change the decision — only the profit.
2. **MOQ.** $28/unit almost certainly carries a minimum order quantity. Unknown. If MOQ > drop
   size, pre-order economics break.
3. **Lead time**, to know how early a pre-order window must close before a season or event.
4. Whether the $28 includes the authentication tag, laced neck, and name/number plates that the
   live Squarebass V2 listing advertises — or whether those are extra.

---

## 0. What's actually true right now (read this before the plan)

Three facts from the repo change the shape of this plan. State them up front so nothing below is built on a false premise.

1. **The existing "jersey launch" is stalled, and it isn't a market problem.** `MANAGEMENT-TENx10/BRAIN.md` (2026-07-09 audit) says MHP has been graded BETA / "jersey launching" for over two months, and is **"stalled 9 weeks on one vendor-invoice approval."** The Electric Forest 2026 deadline that anchored the original plan (`MHP_JERSEY_DROP.md`, `2026-EF-Hockey-Jersey/CAMPAIGN_PLAN.md`) has already passed with the jersey never launched. The blocker was never engineering or demand — it was one decision Thomas didn't make. That pattern is this plan's #1 risk (see §8).
2. **There are two different jerseys in this repo, and they are two different businesses.** The "DSR × MHP Hockey Jersey" (dirtysnatcharecords.com/merch, TMTYL tour merch, heavily embroidered — applique front, embroidered "7" logo, embroidered shield, embroidered shoulder patches, embroidered back scene) is **DirtySnatcha's tour merch**. It sells to DirtySnatcha's ~11K IG fanbase, it's capped at a few hundred units ever, and by the hard constraint in this brief, **that revenue belongs to the artist (Leigh Bray), not to MHP.** It cannot be the engine for MHP's $100k target. The engine has to be a **different, simpler product: custom team jerseys sold to outside teams/leagues who have never heard of DirtySnatcha.** This plan treats the artist jersey as a proof-of-quality sample (§3) and a later phase (§7) — not the revenue driver.
3. **MHP already has a real production/vendor relationship, with real numbers.** A Shopify invoice from MHP's own store (myhydrationpack.com) to DSR/Leigh, dated 2025-11-15, shows MHP fulfilling 110 basic garments at cost-basis pricing: T-shirt w/ auth tag $14.00/unit, hoodie $30.00/unit, long-sleeve $19.00/unit (order #1205, $1,855 total, paid). This is not a jersey, but it's real, not estimated, and it anchors the low end of MHP's production cost structure. Separately, `DirtySnatcha Records/BRAIN.md` confirms **CRiiOZ's $125 hockey jersey via MHP sold out** — proof the MHP-produced hockey jersey product and price point work in market, at least once, at small scale.

---

## 1. Unit economics — team jersey (the actual product for this plan)

The product for the $100k push is **not** the DirtySnatcha artist jersey. It's a simpler custom sublimated jersey (team colors, team logo, player name/number — no multi-patch embroidery) sold to beer-league, youth, and rec teams. Simpler construction = lower cost = real margin. This is deliberate: the embroidery-heavy artist jersey is a niche collectible; a clean sublimated team jersey is a commodity product with a large addressable market and is what Pakistani sublimation manufacturers are actually cheap and fast at.

**Source basis:** MHP's own November 2025 invoice (real, at-cost apparel pricing above) plus a live web check of Pakistan sublimation-jersey suppliers (Alibaba/Tradewheel listings) and US beer-league jersey retail comps. No live vendor quote for THIS product exists yet — every number below is an estimate, labeled, with a range. Do not commit customer money against these numbers without a real vendor quote (see §3, action 1).

### Landed cost per unit, by order size (ESTIMATE)

| Qty | FOB Pakistan (sublimated, name/number/logo, no heavy embroidery) | + Freight (air/courier at low qty, consolidated at high qty) | + US import duty (est. 15–32% of FOB — polyester knit apparel; **verify exact HTS code with a customs broker before committing**) | **Landed cost/unit** |
|---|---|---|---|---|
| 1 (sample) | $30–45 | $10–20 | $6–13 | **$45–70** |
| 10 | $22–35 | $8–12 | $5–7 | **$35–54** |
| 50 | $16–28 | $4–7 | $3–6 | **$23–41** |
| 100 | $14–22 | $3–5 | $3–4 | **$20–31** |

Source for the FOB range: Pakistan supplier listings quote hockey jersey sets at $16–30/set with MOQ ~100, and $5–10/piece at MOQ ~25 for lower-spec sublimation (Alibaba/Tradewheel, checked 2026-07-09). Freight and duty are not vendor-quoted anywhere in the repo — they are the two biggest unknowns in this entire plan and the two things to nail down first.

### Retail price and margin

US retailer comps for beer-league custom jerseys run $49–90+ per unit already assembled (CustomHockeyUniforms.com, Men's League Sweaters, GNB Sporting — checked 2026-07-09). Set **retail at $70/unit** as the base case — mid-market, easy to say out loud on a phone call, room to bundle.

| Line item | Amount | % of retail |
|---|---|---|
| Retail price | $70.00 | 100% |
| Landed cost (blended, 20–100 unit batch) | $25–35 (est., midpoint $30) | ~43% |
| Payment processing (Stripe, 2.9% + $0.30) | $2.33 | ~3% |
| Returns / rework allowance (sizing errors on custom goods — real but low since fully pre-paid) | $2.80 (4%) | ~4% |
| **Contribution margin per unit** | **~$35 (midpoint)** | **~50%** |

A single team order (15–20 units, avg 17) at $70 = **~$1,190 gross revenue, ~$595 contribution margin, per order.**

This assumes the simpler team jersey. The DirtySnatcha embroidered jersey is a different cost structure — every embroidered patch/applique adds labor cost, plausibly $5–15/unit on top of the sublimation base, which is consistent with why that product is priced at $85–125, not $70. Don't apply the team-jersey economics to the artist jersey or vice versa.

---

## 2. The $100k math, honestly

$100,000 ÷ 25 weeks = **$4,000/week gross revenue required, sustained, from week 1.**

At $70/unit and ~17 units per team order (~$1,190/order):

$4,000 ÷ $1,190 ≈ **3.4 team orders every single week for 25 straight weeks** ≈ **~85 orders, ~1,450 jerseys total.**

**That is not achievable from a standing start, solo, at $0 capital.** Closing 3+ bulk team deals a week — each one requiring finding the team, pitching the manager, collecting 15–20 people's sizes and payment, and managing an 8–12 week production cycle — is not a one-person cold-outreach motion, no matter how fast Thomas moves. Nothing in the repo shows an existing warm channel (email list, past customer base, ad account) that would make this rate plausible immediately.

**Realistic ramp, honestly modeled:**

| Weeks | Orders/week (ramping) | Orders in period | Cumulative revenue |
|---|---|---|---|
| 1–4 | 0.5 | 2 | ~$2,400 |
| 5–12 | 1.0 | 8 | ~$11,900 |
| 13–20 | 1.5 | 12 | ~$14,300 |
| 21–25 | 1.5 | 7.5 | ~$8,900 |
| **Total** | | **~30 orders / ~510 units** | **~$35,000–40,000** |

**Verdict: $35,000–$45,000 is the realistic, achievable number by 2026-12-31 from cold/warm solo outreach at $0 capital.** That's the number to plan against, track weekly, and report — not $100k.

**What would have to be true for $100k:** the gap between ~$40k and $100k (~$60k) isn't closed by more DMs — it's closed by **landing 2–3 whole-league or tournament contracts** instead of one team at a time. A league commissioner or tournament director who mandates all 10–20 participating teams order through one vendor turns a single relationship into $12,000–$28,000 in one deal (10–20 teams × 17 units × $70). Three of those over 25 weeks, on top of the steady-state single-team ramp above, gets within range of $100k. This is the one lever worth spending disproportionate effort on — see §5, Thursday cadence. Paid Meta ads to accelerate discovery would also help, but spending ad dollars before any order has funded itself violates the zero-capital constraint; revisit ad spend only once it can be funded from margin already collected on completed orders (see §4, cash-flow mechanic).

---

## 3. Sequence to first dollar this week

**Important distinction: "first dollar" this week means a paid deposit or full payment, not a delivered jersey.** Production is 6–8 weeks per the existing storefront copy, plus unverified Pakistan freight/customs (add 2–4 weeks) = **8–12 weeks order-to-delivery, realistically.** Say this to every customer up front — a team ordering now is buying "jerseys by [date 8–12 weeks out]," not "jerseys next week."

**Cash-flow mechanic (how this stays $0-capital):** the customer's payment funds the supplier PO. Concretely: team pays 100% up front (not a partial deposit — MHP has no float to cover the gap between a deposit and the supplier invoice) → that cash pays the vendor deposit/invoice → vendor produces → ships → MHP fulfills. For the very first order, if it's below the vendor's MOQ (see cost table — meaningful pricing starts around 20–50 units), that one team's payment sits until 2–3 more orders pool into one production batch. Tell the first customer this explicitly ("your order joins the next production batch, target ship date is X, here's what triggers that batch") rather than implying immediate individual production — an unexplained delay on a fully-paid custom order is the fastest way to lose trust with a tight-knit local sports community.

**The five actions, in order, this week:**

1. **Thomas lists every warm contact he has in team sports** — beer-league teammates/captains, any coach or team parent he knows, rink or field staff, tournament directors, anyone from his own hockey/football/soccer circles. This determines whether week 1 is warm outreach (fast) or cold outreach (slower, same playbook, longer runway needed). This list does not exist in the repo — it has to come from Thomas directly, today, before anything else below.
2. **Get a real vendor quote — 24–48 hours, not an estimate.** Contact 2–3 Pakistan sublimation suppliers (Formative Sports, Cheez Clothing, or others surfaced via Alibaba/Tradewheel) for a firm quote on 20/50/100-unit team jerseys (sublimated, name/number/logo), MOQ, and production lead time in writing. Separately, get one call with a customs broker or freight forwarder to confirm the actual duty rate and realistic freight cost for this HTS category — this is the biggest unknown in §1 and it directly sets the real margin.
3. ~~**Stand up a live payment link this week.**~~ **CORRECTED 2026-07-09 — already done, skip this.** Verified live against myhydrationpack.com: MHP runs a **working Shopify storefront with a real cart and checkout**. The `mailto:`-only file (`products/tenx10-platform/merch-store/index.html`, which emails `contact@dirtysnatcha.com`) is **DirtySnatcha's merch page, not MHP's** — confusing the two is the exact brand-separation error this repo warns about.

   Live MHP catalogue, pulled from `myhydrationpack.com/products.json`:

   | product | price | stock | type |
   |---|---|---|---|
   | Squarebass V2 Hockey Jersey | $125.00–$135.00 | 5 of 8 variants | jersey |
   | CRiiOZ Hockey Jersey | $125.00 | **0 — sold out** | preorder |
   | Official Megahurtz Riddim Gang Basketball Jersey | $50.00 | 4 of 5 | jersey |
   | The Brain Eaters / Flint Underground Limited | $60.00 | 1 of 5 | — |
   | Dad? Hats Pre-Order | $20.00 | 2 of 2 | — |

   **This materially changes §1 and §2.** MHP's proven retail is **$125**, not the $70 modelled below, and MHP's *existing, working* motion is bass-music brand/artist collab jerseys (Squarebass, CRiiOZ, Megahurtz, Brain Eaters) — not beer-league teams. At $125 the $100k target needs ~800 jerseys (~32/week), not ~1,430. Re-run §1 and §2 against $125 retail and a real vendor quote before acting on the $70 figures. The beer-league pivot may still be right for *volume*, but it is no longer the only path, and it discards a channel that has already sold out once.

   Replacement action: **put a real vendor quote against the $125 price point** and decide whether the next drop is another collab (proven) or a team order (unproven, larger market).
4. **Identify 10–15 target teams/leagues in Thomas's area** (Michigan) via local Facebook groups ("[City] Beer League Hockey," "[City] Men's/Women's Rec," youth flag-football and rec-soccer league pages) and DM team managers/captains directly with the offer: team jersey, $70/unit, name+number+team logo, order by [date] to have them for [season start], 100% payment up front, ships in 8–12 weeks.
5. **Convert one contact into a paid order this week.** Use the DirtySnatcha jersey prototype photos and the CRiiOZ sold-out result as the proof-of-quality asset ("this is the same production pipeline that made this jersey, which sold out") — even though the team jersey itself is a simpler, cheaper product. First payment in hand, this week, is the actual goal — not a fully staffed campaign.

---

## 4. Why teams, not individuals

One team sale = 15–20 units, sizes collected up front by one point person (the captain/manager), fully paid before production starts. This is the only motion compatible with $0 capital: it front-loads cash before MHP owes the supplier anything, and it converts one relationship into 15–20x the revenue of a single-item sale for roughly the same outreach effort.

**Pressure test — where this breaks:**

- **MOQ vs. team size mismatch.** A single team of 15–20 may sit below the supplier's most efficient MOQ (best pricing starts ~20–50+ units per §1). This means batching 3–5 team orders into one production run to get good per-unit pricing, which means the first few customers wait longer than "their team's turnout" would otherwise imply. Communicate this up front (§3) rather than let it surface as a surprise.
- **Single point of failure per team.** The whole order depends on one captain/manager actually collecting sizes and money from 15–20 teammates. If that person is slow or flakes, the order stalls or dies. Mitigate with a simple size-collection link (Google Form or the Stripe-linked storefront) the captain can forward, rather than manual size-collection by Thomas.
- **Per-team customization cost.** Each team wants its own colors/logo — sublimation has low per-design setup cost (a real advantage over screen printing), so this is a manageable, not a killer, friction point.

Despite the friction, this is still the only zero-capital-compatible motion available — individual-consumer jersey sales require holding inventory or eating pre-production cash-flow risk with no team-level batching efficiency, which the $0 capital constraint rules out.

---

## 5. Marketing plan — four sports, near-zero cost, repeatable weekly loop

| Sport | Where buyers congregate | Outreach asset | Channel cost |
|---|---|---|---|
| **Hockey** | Local beer-league / adult rec Facebook groups, rink pro-shop bulletin boards, USA Hockey travel-team parent groups, tournament directors (e.g., local holiday/silver-stick-style tournaments) | Direct message to team captain/manager + jersey sample photos | $0 |
| **Football** | Adult flag-football league Facebook groups, Pop Warner/rec league parent groups, high school intramural/booster clubs — **registration for fall season is closing now** | Same DM template, football-specific sample mockup | $0 |
| **Soccer** | Rec/club soccer Facebook groups, adult coed rec league groups, AYSO-style parent groups, tournament organizers | Same DM template | $0 |
| **Baseball** | Fall ball / travel showcase teams only in this window (see §6 — mostly off-season) | Lower priority this cycle | $0 |

**Weekly cadence (repeatable, built for an ADHD operator who fires fast — not a 40-step funnel):**

- **Monday:** Scan 5 local league/team Facebook groups across the 4 sports. DM 5 team managers/captains with the offer template.
- **Tuesday:** Follow up every warm lead from the prior week — send the Stripe payment link to anyone who said yes.
- **Wednesday:** Post one proof-of-quality piece (jersey photo, a completed team's gear) to IG/FB — personal account + MHP page.
- **Thursday:** One outreach to a league commissioner or tournament director — the multi-team lever from §2. This is the single highest-leverage touch of the week; don't skip it even in a busy week.
- **Friday:** Update the running order tracker (reuse the `MHP_JERSEY_DROP.md` tracker format — it already exists and works). Check whether any pooled batch has hit vendor MOQ; if yes, send the supplier PO.

Five touches a week, same five slots, every week. No paid spend until a completed order has funded it.

---

## 6. Seasonality reality check

This materially changes the plan — do not treat all four sports as equally timed.

| Sport | Typical buying/registration season | Overlap with Jul–Dec 2026 | Verdict |
|---|---|---|---|
| **Football** | Registration Jun–Aug, season Aug–Nov | Registration closing **right now** | **Move first — this week** |
| **Soccer** | Fall registration Jul–Aug, season Aug–Nov | Same window as football | **Move first — this week** |
| **Hockey** | Team formation / ordering Aug–Sept for a Sept–Mar season | Narrow — roughly 4–6 weeks from today | **Move fast, but the window is short** |
| **Baseball** | Primary season spring/summer; registration Jan–Mar; fall ball (Sept–Oct) is a much smaller niche | Mostly **off-season** in this window | **Deprioritize — target Jan–Feb 2027 for spring-season prep instead** |

**Lead-time math sets the real deadline, not Dec 31.** Production (6–8 weeks per the existing storefront copy) + unverified Pakistan freight/customs (2–4 weeks, per §3 action 2) = **8–12 weeks order-to-delivery.** For a team to have jerseys in hand at fall-season start (early-to-mid September), the order needs to be fully paid by **roughly late July to early August 2026 — 3 to 4 weeks from today.** That is the actual hard deadline this plan is racing against for football/soccer/hockey, not December 31. Orders placed after early August still sell, but arrive mid-season, which is a harder pitch (still worth making — "ready for the second half of the season" is a real angle, just weaker).

---

## 7. Artist-merch tie-in — separate, later phase

Selling managed artists' merch (DirtySnatcha, WHOiSEE, Dark Matter, HVRCRFT) through MHP's production pipeline is a real future phase, but it is explicitly **not** part of the $100k MHP number, and it needs two things nailed down before it launches, not after:

**1. Accounting boundary.** Artist merch revenue belongs to the artist, not to MHP or to Thomas's 10RG umbrella. The existing "DSR × MHP Hockey Jersey" naming already blurs this — the storefront is `dirtysnatcharecords.com/merch`, branded as DirtySnatcha tour merch, but the campaign doc calls it "DSR × MHP." Before that jersey (or any future artist drop) launches, resolve explicitly whether that revenue is (a) DirtySnatcha artist revenue, where Thomas takes his 10% management fee, or (b) DSR label revenue, where Thomas's stake is his 30% label equity. It should almost certainly be (a) — it's fan-facing tour merch tied to the artist's brand, not a release — but this needs to be written down once, not inferred from folder names.

**2. Conflict of interest.** Thomas owns MHP (the vendor), manages DirtySnatcha (10% of the artist's income), and co-owns DSR (30% of the label, with Leigh Bray at 70%). When MHP produces merch for DirtySnatcha or DSR, Thomas is on both sides of that vendor transaction. Document an arm's-length pricing policy — MHP invoices the artist/label at a fair, defensible rate (the November 2025 invoice in §0 is a reasonable model: itemized, at cost or near-cost, paid) — so there's never a question about whether Thomas priced a related-party deal in his own favor. Leigh Bray, at 70% of DSR, is entitled to that transparency.

Once the outside-team jersey engine (§1–§6) is actually running and generating real weekly cash, revisit the artist tie-in as a second product line for MHP — using the same production pipeline, same supplier, same operational playbook, just a different (smaller, artist-branded, higher-margin, fan-driven) customer base.

---

## 8. Risks, ranked

1. **Operator decision-paralysis — the risk that already killed the last attempt.** The DSR × MHP jersey has sat "9 weeks" stalled on one vendor-invoice approval that only Thomas can make, per the 2026-07-09 audit in `MANAGEMENT-TENx10/BRAIN.md`. This is not a market, capital, or engineering problem — it's a single person not making a go/no-go call. If this plan repeats that pattern (waiting on "the right vendor," "the perfect landing page," "one more design revision") instead of shipping the $0-cost first steps in §3 this week, it fails the same way MHP has failed for two months already. This is the risk that kills the business first.
2. **No confirmed warm channel.** This plan assumes Thomas can reach team managers/captains/league organizers. That contact list does not exist anywhere in the repo (§3, action 1). If it turns out to be thin or nonexistent, the ramp in §2 slips right and the realistic ~$35–45k number gets harder to hit, not easier.
3. **Landed cost / duty uncertainty.** Every number in §1 is an estimate from public listings, not a vendor quote. If actual duty lands at the high end (32%) or the real vendor MOQ pricing is worse than estimated, margin compresses materially — possibly below the point where $70 retail still works. Get the real quote (§3, action 2) before taking a single customer's money.
4. **MOQ/batching cash-flow mismatch.** A fully-paid customer sitting in a production queue for weeks while MHP waits to pool enough orders to hit vendor MOQ is a trust risk with no easy fix except honest, proactive communication (§3, §4).
5. **Lead-time slippage vs. season start.** Pakistan dropship/production timelines are unverified in this repo. If actual lead time is 12+ weeks instead of 8–10, fall-season orders arrive mid-season, undermining the pitch that got the sale in the first place.
6. **Quality/sizing errors on custom overseas production.** A sizing mistake on an individual sale is one unhappy customer; a sizing mistake on a 17-person team order is reputational damage inside a small, tightly-networked local sports community where word travels fast.
7. **Thomas's attention is split across five other stalled products** (DBA, DAD, WRS, Trading Shadow, plus DSR/TENx10 day-to-day). Per the same BRAIN.md audit, WRS is "stalled 11 weeks" and Trading Shadow is "silently dead." MHP competing for the same single operator's limited weekly hours is a real constraint on the weekly cadence in §5 actually happening every week.
8. **Artist-merch boundary muddying the books** if §7 isn't resolved before any artist-branded product launches — creates avoidable accounting/conflict-of-interest cleanup later.

---

*Plan written 2026-07-09. Every unit-economics figure not sourced to the November 2025 MHP invoice or the CRiiOZ precedent is an estimate — validate against real vendor quotes before committing customer money. Update this file directly as real numbers (vendor quotes, actual orders, actual duty rate) replace estimates; don't create a v2 file.*
