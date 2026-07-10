# TENx10 — Brand Foundation (v1)

**Date:** 2026-06-18
**Owner:** Thomas Nalian
**Scope:** Public brand for TENx10 the **management company** (tenx10.co). Distinct from DSR's brand and from the internal platform UI. This is the source of truth the website, deck, and any collateral derive from.
**Status:** Strategy locked (positioning, audience, promise, voice). **Visual identity (color/type/imagery) DEFERRED** per Thomas 2026-06-18 — "change the image later." Define content/structure first (see `../website/TENx10_Website_Plan.md`), then return to the look anchored to real pages and reference sites.

---

## 1. Strategy

### What TENx10 is
A modern, boutique artist-management firm for serious bass and electronic artists. Small, selective roster; deep per-artist work. Behind the scenes it runs on a purpose-built operating system, so a small team delivers what a 30-agent agency does — but that engine is the *quiet* differentiator, not the public pitch.

### Positioning
> A boutique management firm with a major-label engine.

Public face = elite management. The platform is the proof of seriousness, shown not sold. Per the 2026-05-10 decision: **management is the primary GTM; the platform is internal tooling**, surfaced only as evidence of how the firm operates.

### Primary audience
1. **Artists to sign / manage** — the site's #1 job is making ambitious bass/electronic artists want TENx10 in their corner.
2. **Industry credibility** (secondary) — managers, agents, labels, promoters at events should read the site and think "this is a real, modern operation."

### Brand promise
**Fewer artists. Deeper work.** TENx10 takes a small roster and runs each career like an operation, not a guess — booking, releases, royalties, and data handled with major-label rigor and boutique attention.

### Tagline options (pick one to lock)
- **Fewer artists. Deeper work.** (recommended — selectivity + depth)
- Management, engineered.
- A boutique firm with a major-label engine.
- Run your career like an operation.

### Personality
Confident, precise, understated, insider, modern. Not hypey, not "AI startup," not cluttered.

### Voice
Spare and declarative. Short lines, lots of whitespace. Sentence case. Knowledgeable without jargon. Let the roster, the stats, and the restraint do the talking.

### What the brand must NOT do
- Not read as a SaaS/AI product site (platform stays behind the curtain).
- Not over-claim or puff an artist's story — credibility is the currency.
- Not lean cheap-EDM-flyer. Premium restraint over neon maximalism.

---

## 2. Visual identity

### Color palette (v2 — warm + welcoming)
Direction shifted from the cold obsidian-led v1 to a **cream-led, warm** scheme: more inviting and far easier to read while staying premium.

| Role | Name | Hex | Use |
|---|---|---|---|
| Primary dark | Warm ink | `#241F1A` | Text, dark sections, primary buttons (warm near-black, not cold) |
| Surface dark | Umber | `#6E5E4A` | Dark duotones, secondary dark surfaces |
| Primary light | Cream | `#F7F2E9` | Default background — light, airy, premium paper feel |
| Surface light | Sand | `#E7DCC9` | Cards, borders, section breaks on cream |
| Accent | Amber | `#C0894A` | The single warm accent — links, rules, the "10" mark. Used sparingly. |
| Functional | Signal | `#4F7CF0` | **Reserved** for live data / platform / stats moments only — never decorative |

Discipline: **cream + warm ink** carry the design, **amber is the one warm accent**, signal blue strictly functional so the operating-system layer can show through without cheapening the brand. Default to light backgrounds; use warm ink sections for contrast, not as the dominant surface.

### Typography
- **Display serif** — headlines, the brand voice. Recommend **Fraunces** (free, Google Fonts, high-contrast modern serif) or **Canela** (paid) if budget allows.
- **Editorial italic** — accent lines and pull-quotes (the serif's italic).
- **Body / UI sans** — clean grotesque. Recommend **Inter** or **Geist** (Geist already used in the platform — keeps public + app visually related).
- **Mono** — stats, credentials, IPI/ISRC, the "OS cue." Recommend **Geist Mono** (already in the platform).

**Ramp (web):** Display 1 ~64–80px · Display 2 ~48px · H1 40 · H2 32 · H3 24 · Body lg 18 · Body 16 · Small 14 · Mono caption 13. Two weights only where possible (regular + medium).

### Imagery
Live photography and editorial portraits, **warm duotone-treated** (umber or amber) for cohesion across a mixed-source roster. Lots of negative space and air. Subtle film grain acceptable. Restraint over collage.

### Logo direction
Wordmark-led **TENx10**, with the **"10" set in amber** as a quiet multiplier mark. Friendly editorial-serif or refined letterforms, generous letterspacing. (Direction only — no logo file produced yet.)

---

## 3. How this flows downstream
- **Website (Webflow):** these tokens become Webflow style variables; serif display + sans body + mono stats; obsidian hero, bone content, brass accents.
- **Artist pages:** duotone portrait + mono stat block (MAU, PS, shows) → the OS cue, on-brand.
- **Platform UI (Next.js):** can adopt Bone/Obsidian/Brass tokens later for family resemblance, but is not blocked on this.

---

## Open decisions for Thomas
1. Lock the **tagline** (recommend "Fewer artists. Deeper work.").
2. Confirm **brass** as the accent (vs. a cooler metallic or a sharper accent).
3. Display serif: **Fraunces** (free) now, or budget for **Canela**?

_v1 — react and adjust; this becomes the locked reference before the Webflow build._
