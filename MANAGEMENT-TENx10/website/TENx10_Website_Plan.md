# TENx10 — Website Plan (the "information vision")

**Date:** 2026-06-18
**Scope:** Public site tenx10.co for TENx10 the **management company**. Content + structure first; visual design deferred.
**Companion:** `../brand/TENx10_Brand_Foundation.md` (strategy locked; look TBD).

---

## 1. What the site is for

Presence and credibility — not a lead funnel. The site exists to **say clearly who TENx10 is** (a boutique artist management company), **show the current roster**, and make plain that TENx10 also **manages the record label DirtySnatcha Records (DSR) and its publishing.** A reader — an artist, an agent, a label, a promoter at an event — should come away thinking "this is a real, serious management operation."

No hard conversion funnel. A simple, low-pressure **Contact** is enough. The platform stays behind the curtain; we show seriousness through the roster and the work, not by selling software.

**Primary action:** Get in touch.
**Secondary action:** See the roster.

---

## 2. Sitemap (simple, presence-first)

| Page | Purpose | Primary action |
|---|---|---|
| **Home / Who we are** | Who TENx10 is, in a few seconds: a boutique management company + roster teaser + a line that we also run DSR and publishing | See the roster |
| **Roster** | Grid of managed artists → individual pages | Open an artist |
| **Artist page** (template × N) | One per managed artist; the showcase | Listen |
| **What we do** | Artist management + **label management (DSR)** + **publishing administration** | Get in touch |
| Footer | Contact, socials, quiet platform login | — |

Four top-level pages (Home, Roster, artist pages, What we do). "About" folds into Home. Add more only if needed.

---

## 3. Page-by-page content

### Home / Who we are
- **Hero:** who TENx10 is in one line — a boutique artist management company — plus a sentence of philosophy ("Fewer artists. Deeper work.").
- **Who we are:** a short paragraph — the firm, what it stands for, Thomas's credibility. (Absorbs the old "About.")
- **Roster teaser:** the artist portraits linking into their pages.
- **What we do, in brief:** three short lines — artist management · label management (DSR) · publishing administration.
- **Footer CTA:** Get in touch.

### Roster
Grid of artist cards (portrait, name, one-line descriptor, genre tag). Each opens the artist page. The credibility centerpiece.

### Artist page (the template — see §4)
Built once as a template, filled per artist from intake + live data.

### What we do
Three plain-language pillars:
1. **Artist management** — booking & routing, releases, royalties, content, strategy. A small team backed by a purpose-built system, so every artist gets major-label attention. No jargon, no "AI" buzzwords.
2. **Label management — DirtySnatcha Records (DSR).** TENx10 manages the DSR label operation (catalog, releases, distribution coordination). State it plainly and proudly. *(Internal note: DSR is a co-owned client of TENx10, not a subsidiary — public copy can simply say "we manage DSR." Keep ownership nuance off the public page.)*
3. **Publishing administration** — registering works and collecting royalties across PROs/MLC/etc. for the roster and the DSR catalog.

---

## 4. The artist page template

Modeled on the clean references (Red Light's per-artist pages). Built **once** as a template; the roster is **curated by Thomas** — a controlled list of who TENx10 actually manages. Content is entered by you (a simple admin/CMS entry), **never** auto-added by a public form.

| Block | Content | Source |
|---|---|---|
| Hero | Portrait, artist name, genre, one-line descriptor | You (curated) |
| Bio | Short bio | You (curated) |
| Music | Embedded Spotify / Apple / SoundCloud / YouTube | You (links) |
| Shows | Upcoming dates (optional) | You, or live from platform later |
| Socials + links | IG / TikTok / site | You |
| Stat block (optional) | Listeners / popularity | Optional — can pull live from the platform's Supabase later |

Live stats are an *optional later upgrade*, not required. Start with a clean curated page.

**The payoff of the architecture decision:** because the public site and the platform share one Supabase, an artist page can show *real, current* listener and show data with no manual updating. That's the "operating system" showing through, honestly.

---

## 5. Adding artists (curated — not public intake)

The roster is **yours to control.** You add an artist through a simple admin entry (Webflow CMS item, or a private form only you use) — fill the fields once and the artist page renders from the template. The public **never** adds artists; no form auto-populates the roster. This is the correction from the earlier plan.

A simple public **Contact** (name, email, message) is the only public form — for anyone who wants to reach out. No elaborate funnel.

---

## 6. How it connects downstream (full story)

```
Prospect → Work with us form → lead captured → (platform / Instantly follow-up)
Signed artist → onboarding intake → Supabase artist record → artist page auto-renders
Platform (already live) → Supabase → live stats + shows on the public artist page
```

One database, two front-ends (public site + internal platform). Nothing duplicated. Consistent with the org's "every record has one home" rule.

---

## 7. KPIs & signals (light — it's a presence site)

Not a conversion machine, so keep measurement simple: roster page views, artist-page views, DSP click-outs, and the occasional contact message. GA4 is already wired via the platform if we want the numbers later.

---

## 8. Open decisions before build
1. Confirm the **four-page** shape (Home/who-we-are, Roster, artist pages, What-we-do) — good, or want a separate Contact/About page?
2. How to frame **DSR** publicly — "we manage DSR" is the plan; confirm that wording sits right with you and Leigh.
3. Intake tooling for the onboarding form (recommend custom-to-Supabase so artist pages auto-fill).

_Visual design picks up after this is agreed — anchored to these real pages, not abstract swatches._
