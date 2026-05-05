# Audit Brief — 10 Research Group + TENx10
**Prepared:** 2026-05-04 23:00 ET
**For:** A Claude session asked to audit Thomas's vision and execution
**Author:** Claude Sonnet 4.6 (the building Claude — not the auditing one)

You are walking into a portfolio of in-flight businesses. This document is everything you need to understand what Thomas is trying to build, how the pieces fit, what decisions have already been made, and where to push back. The codebase is yours to explore from there — file paths are provided.

---

## Top-line: who Thomas is

Thomas Nalian. Operator of multiple businesses, all routed through one umbrella. Music industry background — manages artists, runs a label, owns publishing companies — and is using that operating context to build software that solves his own problems first, then sells it.

The strategic posture is **operator-first, platform-second.** Every product was built to fix something he was hitting in his own work. Once it works for him, it gets productized.

---

## The two names — they are NOT separate entities

This catches every new contributor. Read carefully.

**10 Research Group** ≡ **10RG** is **one business** with two ways of writing the name. There is exactly one company, one umbrella, one git repo (`Gibsomtom06/10-research-group`), one OneDrive folder. Documents and prose use "10 Research Group". File paths and code identifiers use `10rg` / `10-research-group`. **They are never separate things.**

If you see two entries in any system that treat them as different, that's a bug to fix, not a relationship to model.

**TENx10** is a different name pointing at two distinct things, ALSO not to be confused:
1. **TENx10 (the platform)** — the SaaS product at https://tenx10.co (Next.js, Supabase, deployed via Vercel). Code repo: `Gibsomtom06/tenx10`. Active dev clone at `C:\Users\slash\Projects\tenx10\`.
2. **TENx10 (the management business / "MANAGEMENT-TENx10")** — Thomas's artist management company. Roster, booking team, contracts. Lives at `MANAGEMENT-TENx10/` inside the umbrella.

Both **TENx10** entities are products under **10 Research Group**.

```
10 Research Group (umbrella, the AI agency)
├── products/
│   ├── tenx10-platform/         ← READ-ONLY MIRROR of the SaaS source
│   ├── digital-booking-agent/   ← DBA — autonomous booking automation
│   ├── trading-shadow/          ← shadow-traded options-style A/B test
│   ├── mhp/                     ← MyHydrationPack (e-commerce)
│   ├── rim-shop/                ← Wheel Repair Specialists of MI (client engagement)
│   └── system-steward/          ← local-only Python utilities (DAD precursor)
├── MANAGEMENT-TENx10/           ← the management business
│   ├── artists/{dirtysnatcha, whoisee, dark-matter, kotrax, hvrcrft}
│   └── labels/DirtySnatcha Records/
└── ventures/
    └── comics-resale/
```

Active dev for the TENx10 platform code is at `C:\Users\slash\Projects\tenx10\` (off OneDrive — avoids OneDrive lock contention + faster file watcher). The OneDrive copy is a read-only mirror synced via `scripts/sync_tenx10_mirror.ps1`.

---

## The strategic thesis: "Capitulate and Cultivate"

This is the load-bearing principle. If you're auditing strategy, this is what to push on first. Captured in `BRAIN.md` "Capitulate and Cultivate" section.

> We **rent** foundation models from Anthropic (Claude) and Ollama (local). We do NOT try to build models or compete with frontier labs — that's capitulation. **Our moat is what we build ON TOP of the rented models:**
>
> 1. **The orchestration layer** — Factory Boss, Department Leads, Subs, the routing logic, the guardrails, the human-in-loop checkpoints
> 2. **The conversation corpus** — every Thomas ↔ Claude session auto-logs to `data/conversation_log/` (since 2026-04-27). This corpus is uniquely ours; no competitor has it.
> 3. **The per-project BRAIN.md files** — operational context for every business unit, written in Thomas's voice. Subagents read these to act in-character.
> 4. **The shadow team** — Ollama agents that learn from the corpus + task execution and graduate to handle work independently.

**Practical implication:** never build something a frontier lab will commoditize in 6 months. Build everything that's specific to Thomas's businesses, his voice, his judgment, his portfolio.

**Audit angle:** is this thesis still defensible in light of recent foundation-model pricing collapses and the rise of open-source models that approach frontier quality? Where is the moat actually deep enough to defend?

---

## The portfolio (with current status)

### TENx10 (the platform — `Gibsomtom06/tenx10`)
**SaaS for artist management.** Manager logs in, sees their roster, manages deals, tracks revenue across 7 pillars (live performance, streaming, publishing/sync, merch, content, education, brand deals), runs the booking pipeline.

- Stack: Next.js 16 (Turbopack), React 19, Supabase Postgres, Vercel deploy
- DB: project ref `ocscxqaythiuidkwjuvg` (Supabase) — **single project for everything in this portfolio post-2026-05-04 merger**
- Auth: Supabase auth with `artist_members` join table (admin/artist/agent roles per artist)
- Live tables include: 233 deals, 166 contacts, 171 venues, 8 artists, 19 promoters, 9098 VMG royalty lines
- New as of 2026-05-04: per-artist dashboard with revenue pie chart + US fan map

**Audit angles:**
- Is the data model right? Artists ↔ PRO is 1:1 (BMI XOR ASCAP), publishers can be many-to-many on songs. Labels own publishers. None of that is fully enforced in the schema yet.
- The user-role model has 5 distinct personas (label owners, label artists, label-side managers, self-managed artists, independent managers). Each needs a different view. Nav restructure pending.
- The /dashboard/deals page had a long-running blank-state bug (auth user not in artist_members). Now fixed but there are other RLS-vs-service-client mismatches throughout.

### DBA — Digital Booking Agent (under `products/digital-booking-agent/`)
**The booking automation layer for TENx10.** Scans inbound offers, runs Analyst → Outbound → Sender pipeline to compose and send pitch emails to talent buyers / promoters.

- Stack: Next.js dashboard + Node/TS workers (`workers/sender.ts`) + Python agents (`agents/`)
- Was a separate Supabase project that died 2026-05-04 (`erwlfjlgrrfuqnjzitor` — DNS no longer resolves)
- Merged into the TENx10 Supabase project tonight (12 migrations applied: 0017–0024)
- `offers` is a view-over-`deals` (compatibility layer mapping DBA's expected columns to TENx10's deal lifecycle)
- Worker is functional — `npm run sender:dryrun` exits clean. SENDER_DRY_RUN=true until first real send.

**Audit angles:**
- The compatibility view + denormalized promoter columns is a band-aid. Should DBA's `offers` concept be merged into TENx10's `deals` schema permanently?
- 7 of DBA's pre-existing migrations (0001/0005-0007/0009-0015) reference `offers` in ways that don't apply yet — features like score-ranked outreach (`v_target_score`), agent_workload anti-double-pitch, radius_audit are not active.
- The Analyst agent has a `praise_bank` table but it's empty. No real pitches have shipped.

### Trading Shadow (`products/trading-shadow/`)
**A/B test for AI-driven trading decisions.** Runs Claude (paper trader, "Trader") and Ollama (shadow trader) in parallel on the same market data; logs decisions; tracks accuracy. Goal: find when local models can graduate to handle work the frontier model is doing.

- Has Discord bot, rollback handler, market data feeds, voice-memo intake
- Broader thesis tie-in: the shadow team principle (item 4 of "Capitulate and Cultivate")

**Audit angles:**
- Does paper-trade A/B testing actually translate to a sellable product?
- Or is this purely an internal R&D project that earns its keep by training the shadow team?

### MyHydrationPack (`products/mhp/`)
**E-commerce — Shopify Remix template for a fiber-optic hydration pack.** Marketing/branding stage. Real product, real inventory.

### RIM Shop (`products/rim-shop/`)
**Client engagement.** Wheel Repair Specialists of Michigan. First non-music vertical. Performance-share pilot — 10 Research Group builds an AI customer-engagement stack (chatbot, GMC feed, Google Ads, refinishing-prioritization agent), takes a slice of revenue. Tests whether the agency model works on a non-creative business.

### DAD — Digital Asset Declutterer (`/dad` route in TENx10 platform + `system-steward/`)
**The DAD product.** Local agent walks user's filesystem, only metadata leaves the machine, cloud orchestrator (Claude) classifies / dedupes / recommends, user approves moves via UI, local executor performs them.

- Currently running on Thomas's own 1TB OneDrive as dogfood
- 87.82 GB freed tonight by deduping Camera Roll ↔ Samsung Gallery DCIM (3,899 files)
- Waitlist tables exist (migrations 013–016 in `tenx10` repo), Stripe-connected
- Has the strongest "tell me your story" pitch hook in the portfolio: "I run 4 businesses out of one drive. Built DAD to fix it. Watch."

### MANAGEMENT-TENx10 (the management business)
Thomas's actual artist roster + booking team. 5 artists (DirtySnatcha [Leigh Bray, Thomas's primary act], WHOiSEE, Dark Matter, Kotrax, HVRCRFT). Booking team includes Andrew Bass (AB Touring) and Colton Anderson (PRYSM Talent Agency, being phased out).

DirtySnatcha 2026: 14 booked shows, ~$24,500 gross. Includes Electric Forest, Lost Lands, Rappin' the Rivers MT.

### DirtySnatcha Records (`MANAGEMENT-TENx10/labels/DirtySnatcha Records/`)
The label. ~110 artists in catalog, 154 releases (DSR002–DSR178). Distributed via VMG. Owns LAB10 Publishing (BMI) + DirtySnatcha Records Publishing (ASCAP). Thomas owns 30%.

---

## What's actually happening on the machines tonight

If you're auditing the codebase you'll see all of this:

- **Live and pushing:** umbrella repo (`Gibsomtom06/10-research-group`) at commit `fe3a032`. TENx10 platform (`Gibsomtom06/tenx10`) at commit `cce34f9`, deployed to tenx10.co.
- **DBA web stack:** all 11 routes return 200 (`/dashboard /offers /drafts /outreach /reports /contacts /reminders /markets /history /dashboard/costs /outreach/priorities`). Funnel renders 233 real deals with promoter names + grades.
- **TENx10 platform:** revenue pie chart + US fan map deployed to per-artist dashboard. Roster nav now populated for Thomas's three auth emails.
- **Supabase:** one project (`ocscxqaythiuidkwjuvg`). All data live.
- **OneDrive:** 234,354 files / 960 GB → 87.82 GB freed by tonight's dedupe pass; 1.5+ GB more identified as recoverable from `node_modules`/`.venv`/`.next` directories that shouldn't sync.

---

## The big architectural decisions made (audit these)

1. **One Supabase project, not several.** Made 2026-05-04 when the dedicated DBA project went dead. DBA, TENx10 platform, MHP analytics, DAD waitlist — all share `ocscxqaythiuidkwjuvg`. This eliminates double-work syncing `contacts/venues/artists` between projects but couples blast radius (one outage = everything down).

2. **Single Source of Truth file system.** Per `BRAIN.md` "Single Sources of Truth — Index", every important file is indexed. If a file isn't in that table, it isn't authoritative. If a doc tells you something contradictory, the SST table wins.

3. **Local agents stream metadata; brains run in cloud.** From DAD: "You cannot upload Thomas's entire OneDrive + Desktop + Downloads to a SaaS to be classified. It's terabytes, it's slow, it includes contracts and half-finished tax filings." Same pattern for any future user-filesystem-touching product.

4. **Unified observability contract.** Every agent in the portfolio MUST report `agent_invocations` rows with the schema in `BRAIN.md` "Unified Observability — the agent contract". Cost tracking is portfolio-wide, not per-project. Enforcement is the Factory Boss orchestrator refusing to dispatch agents that don't write rows.

5. **Capitulate and Cultivate.** Don't compete with frontier labs. Build the orchestration + corpus + brains + shadow team.

---

## Strategic questions worth your audit

These are the ones the building Claude has been pushing through but hasn't gotten an independent read on:

1. **Is the portfolio too wide?** Thomas is running TENx10 platform, DBA, trading-shadow, MHP, rim-shop, DAD, plus the management business plus the label plus active artist work plus 30% ownership of DSR. Where is focus actually going? What dies tomorrow if Thomas had to cut to two products?

2. **Does the "Capitulate and Cultivate" thesis hold?** What if Anthropic's prices drop 90%? What if Llama-4 matches Sonnet-4? Does the orchestration layer survive that? What's the actual switching cost a customer of TENx10 would have if a competitor launched on the same Claude API?

3. **Who is the actual TENx10 buyer?** Independent managers managing 1–10 artists? Labels managing 50+? Self-managed artists? The current product tries to serve all 5 personas with one nav. Should it pick one?

4. **DBA + TENx10 platform overlap.** They're both booking-management products with overlapping schemas. The merger that happened tonight was forced by the dead DBA project. Are they really one product? Or should DBA be killed and its features absorbed into TENx10?

5. **DAD's go-to-market.** Strong pitch hook ("I freed 88 GB of my own drive in 18 seconds"). Competitive landscape includes Gemini Drive cleanup, Mac's "Manage Storage", CleanMyMac, etc. What's defensible? Is the music-industry niche the right wedge?

6. **The conversation corpus moat.** It's been logging since 2026-04-27. Is anyone actually training on it yet? What's the corpus → product pipeline?

7. **Risk of OneDrive as the operating filesystem.** Almost everything Thomas does lives in OneDrive (1TB). Active dev clones now live off OneDrive (`Projects/tenx10`) because of file-watcher contention. Is OneDrive the right substrate or is it a chronic latent risk?

---

## Key files to read (in this order)

In the umbrella (`C:\Users\slash\OneDrive\10 Research Group\` or via GitHub):

1. `BRAIN.md` — the operating system / north star
2. `HIERARCHY.md` — canonical folder structure rules
3. `CLAUDE.md` — org-level Claude operating rules (delegation playbook, cost-sensitive defaults)
4. `EMPLOYEE_DIRECTORY.md` — current agent roster
5. `SKILL_DIRECTORY.md` — skill index
6. `docs/superpowers/specs/2026-04-27-factory-architecture-design.md` — current factory architecture
7. `docs/superpowers/specs/2026-04-28-strategic-review-and-gaps.md` — last strategic audit (most relevant for this one)
8. `products/digital-booking-agent/HANDOFF.md` — DBA state + DS booked shows
9. `products/digital-booking-agent/MORNING_BRIEF_2026-05-04.md` — DBA deployment status
10. `products/digital-booking-agent/CLAUDE.md` — DBA-specific operating rules
11. `~/.claude/plans/replicated-stargazing-squid.md` — the merger plan executed tonight
12. `MANAGEMENT-TENx10/BRAIN.md` — management business state

In the TENx10 platform repo (`Gibsomtom06/tenx10` or `C:\Users\slash\Projects\tenx10\`):

1. `BRAIN.md` — platform-specific brain
2. `CLAUDE.md` — platform Claude rules
3. `BUILDPLAN.md` — current build plan
4. `BUILDPLAN_DAD.md` — DAD product plan
5. `DEALS_HANDOFF.md` — last work session on deals
6. `SESSIONS.md` — session log

---

## What I'd specifically like your audit to surface

If I were the building Claude looking at this portfolio with fresh eyes, the questions I'd want to be challenged on:

1. **Thomas's day.** Realistically, how many of these products is Thomas actually moving forward this week vs. parked? Of the parked ones, which are still real and which are zombies?
2. **The product that pays the bills.** Right now Thomas's primary income is the management/label business + booking work he does himself. Which of the SaaS products is closest to actually paying its own way? When?
3. **Anti-pattern check.** Is there anything in the codebase that smells like "built because we could, not because we needed to"? Specifically — too many docs, too many BRAINs, too many migrations, too many experiments.
4. **The booking funnel as the wedge.** DBA + TENx10 platform are both attacking the same problem (artist booking). The 233 deals already in the database are real revenue. Could the entire portfolio be re-pitched as "TENx10 = the booking-first artist OS, everything else is a feature" rather than 7 separate products?
5. **DAD as the loss-leader.** DAD's pitch is universal (everyone has 1TB of shit). It could be the front door that sells everything else. Is that the right move, or does it dilute the music-industry positioning?
6. **The 5-persona nav.** Thomas explicitly wants 5 user types served by one TENx10 platform. Is that actually achievable in v1, or should it be one-persona-then-expand?

---

## Tone for the audit

Thomas appreciates direct feedback. He doesn't want validation; he wants the things he's avoiding looking at. He pushes back on suggestions he thinks are off-base — that's healthy, take it as engagement. The bar for proposing changes is "would this make the portfolio more focused or more defensible?" — not "would this make the codebase tidier?"

If you find something you'd kill, say so plainly. If you find something that needs a deeper dive, name the file and line numbers. Avoid postambles, avoid summary paragraphs that restate what you just said. Brief, sharp, evidence-backed.

---

**Last note.** The building Claude is still sometimes confused by the multi-name ambiguity (10RG vs TENx10 vs TENx10-platform vs MANAGEMENT-TENx10). If your audit notices any place where that confusion is calcified into the codebase or the docs, flag it — that's bug-class.
