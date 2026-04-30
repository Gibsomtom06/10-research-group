# Label Catalog Evaluator — STUB / IN FUNNEL

**Date:** 2026-04-30 night
**Status:** Captured to funnel. NOT a project yet. Needs pursue/kill question answered before becoming a real spec.
**Resume condition:** Thomas answers the pursue/kill question below + DSR roster grows past ~10 active artists OR a specific label-tier decision becomes recurring-painful enough to need framework support.

---

## What Thomas asked

> "i need to write out catalog management for both label and artists. i know for the artist we have the buckets, for the label lets do something similar"

---

## What already exists (artist side)

`TENx10_Knowledge_Base/25_Catalog_Evaluation_Engine.md` (Module 24-25 in the KB) defines per-track health scoring across 4 dimensions, weighted:

| Dimension | Weight | What it measures |
|---|---|---|
| Momentum | 35% | Stream/save velocity, Shazam, TikTok audio re-use, SC reposts |
| Engagement Quality | 30% | Save-to-stream ratio, listener-to-follower conversion, completion rate |
| Popularity Score | 25% | Spotify Track PS thresholds (20/30/50/70+) |
| Revenue Potential | 10% | Per-stream rate, sync potential, merch tie-in |

Output: S/A/B/C/D/F grade per track. S-tier gets 40% of marketing budget; F-tier gets zero. Triggered actions: save campaigns, Shazam Spike, decay deadline alerts, etc.

This is a TRACK-level evaluator. Each track is the unit of evaluation.

---

## What "label catalog" mirroring would look like (sketch, not spec)

The unit of evaluation shifts from **track** to **roster + release pipeline + rights inventory**. Possible parallel dimensions:

| Dimension (proposed) | Weight TBD | What it might measure |
|---|---|---|
| Roster Health | 30% | % of roster with active release in last 90d, average artist Popularity Score, monthly listener growth across roster, tier progression |
| Release Pipeline | 25% | # of confirmed releases in next 90 days, ISRC inventory, distribution status, A&R demo pipeline depth |
| Rights & Royalties Inventory | 20% | % of catalog registered with PRO / MLC / SoundExchange / int'l societies, uncollected royalty exposure (estimated $ left on table), publishing deal status |
| Cross-Catalog DSP Performance | 15% | Label-wide weekly streams trend, top-N tracks by revenue, decay rate across catalog, playlist placement depth |
| Catalog Optimization Opportunities | 10% | Waterfall candidates (singles ready to bundle), reissue candidates, cross-promo opportunities between roster artists, catalog gap analysis |

Output could mirror artist side: S-F grade for the LABEL's catalog health overall, plus per-dimension scores so weak dimensions surface clearly.

**This is a sketch, not a real proposal.** The real spec needs to be derived from the answer to the pursue/kill question below — only then will the dimensions and weights actually align with the decisions they're supposed to inform.

---

## Strategist's pushback (captured 2026-04-30)

**Two assumptions:**
1. The artist 4-dimension framework IS the right starting structure to mirror at label level. It might not be — label-level decisions are different (roster portfolio, rights inventory, A&R pipeline) and probably need a fundamentally different dimension set, not a parallel one.
2. The label evaluator is meaningful TODAY at DSR's current scale (~5 active artists, DirtySnatcha-dominant). At this size, gut-feel from Thomas beats a framework. The framework matters more at 15+ artists OR when DSR signs label-mate artists who Thomas doesn't manage as their personal manager (different mental model needed).

**Failure mode:** building a label-catalog framework before identifying the specific recurring decision it's supposed to drive. End up with a dashboard that LOOKS like Module 25 but doesn't answer any actual question Thomas asks himself weekly. Becomes a vanity feature that consumes build cycles.

**Pursue/kill question (open):**
> What's the ONE label-tier decision you make weekly (or want to be making weekly) that this framework would inform?

Examples of crisp answers that would unblock this:
- "Which artist gets the next $500 of ad spend?"
- "Which release window to defer?"
- "Which rights gap to close first?"
- "Which catalog candidates should we waterfall this quarter?"
- "Which artist do I prioritize for an EP push vs. a single push?"

Examples of NON-crisp answers (would NOT unblock):
- "I want to see how the catalog is doing." (Dashboard, not decision.)
- "I want to know what's working." (Vague — define "working" first.)
- "I want all the label data in one place." (Aggregation, not evaluation.)

---

## What to do now (until pursue/kill is answered)

1. ✅ Stub captured (this file)
2. ⏳ Cross-link from `BRAIN.md` (umbrella) under "Backburnered initiatives" — pointer to this file
3. ⏳ Memory entry: type `project`, name `label-catalog-evaluator-stub`, description "Label-level mirror of Module 25 artist catalog evaluator. Captured to funnel; needs pursue/kill question answered."
4. NOTHING ELSE. Don't start scoping dimensions, don't draft database schema, don't sketch UI. The pursue/kill question is the gate.

---

## What to do when pursue/kill is answered

If Thomas names a specific label-tier decision, this stub becomes a real spec:

1. Strip the speculative dimension table above; replace with dimensions DERIVED from the named decision
2. Define the weights so the framework actually points at the decision (not a generic dashboard)
3. Identify the data sources required (Supabase tables exist for artist DSP metrics; label-aggregate metrics may need new views or migrations)
4. Decide on the UI surface (label dashboard widget? Xai prompt context injection? scheduled Discord summary?)
5. Build it as a real Phase

Until then: this stub is the funnel entry. Don't advance.

---

*Stub spec v1 — 2026-04-30. Update when the pursue/kill question is answered.*
