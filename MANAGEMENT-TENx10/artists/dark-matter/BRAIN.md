# Dark Matter — BRAIN.md
**Last Updated:** 2026-05-03
**Manager:** Thomas Nalian (TENx10)
**Label:** Wakaan Records (NOT DSR)
**Management type:** Managed only — TENx10 handles booking/management; Wakaan owns the label deal

---

## Identity
- **Legal name:** Two-member duo
  - Isaac Tullos
  - Joseph Kalina
- **Stage name:** Dark Matter
- **Base:** Chicago, IL + Knoxville, TN
- **PRO:** ASCAP (both members)
  - Isaac Tullos IPI: **01262457258**
  - Joseph Kalina IPI: **01262457454**
  - Artist-level ASCAP IPI (for the project entity): TODO — call ASCAP Member Services or search ASCAP Repertoire. Answer-by: 2026-05-10.
- **Genre:** Bass Music / Dubstep

## Contact
- **Email:** TODO
- **Phone:** TODO
- **Booking contact:** Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997

## Current Status
- **Active:** Yes
- **Signed to:** Wakaan Records (independent from DSR)
- **Managed by:** TENx10 (Thomas Nalian) — management only, no label rights
- **DB artist_id:** `8a3fbde2` (partial — confirm full UUID in Supabase)

## Metrics (verify before using)
- Monthly listeners: TODO
- Spotify Popularity Score: TODO
- Social following: TODO
- **Market:** Midwest (Chicago) + Southeast (Knoxville) + national via Wakaan audience

## Booking
- **Floor guarantee:** $500 – $1,500 depending on market
- **Booking source:** Thomas Nalian direct (thomas@dirtysnatcha.com)
- **Agent:** No dedicated agent — TENx10 management handles direct
- **Tour role:** Support on TMTYL 2026 — Hartford CT (Apr 25)
- **Label note:** Wakaan releases create booking leverage; always reference in pitches

## Catalog
- Wakaan Records release(s) — TODO: capture title(s) and stream counts
- Publishing master sheet: `publishing/Dark_Matter_Master.xlsx`
- Member IPIs known (Isaac 01262457258, Joseph 01262457454) — MLC registration status unknown

## Revenue State (7 Pillars)
1. Live Performance — active as support act; no headline guarantee data yet
2. Streaming Royalties — TODO (monthly listeners unknown; Wakaan release = catalog exists)
3. Publishing / Sync — TODO — member IPIs known but artist-level ASCAP IPI not confirmed; MLC registration status unknown
4. Merch — TODO
5. Content Monetization — TODO
6. Education / Services — TODO
7. Brand Deals — TODO

**Pillars active: 1/7 estimated** (live performance assumed active; publishing unverified)

## Strategic Notes
- Wakaan affiliation = strong underground credibility; use in every booking pitch
- Two-member act: logistics require 2x flights, 2x hotel rooms — factor into show math
- Chicago + Knoxville bases = Midwest + Southeast routing is natural home turf
- Cross-promotion with DirtySnatcha: shared bass music audience, different geographic cores

## Open Items
- [ ] Find artist-level ASCAP IPI (call ASCAP Member Services — answer-by 2026-05-10)
- [ ] Confirm DB artist_id full UUID in Supabase
- [ ] Capture contact email + phone for both members
- [ ] Capture monthly listeners / followers / PS
- [ ] Document Wakaan release title(s) + stream counts
- [ ] Confirm MLC registration status for Wakaan tracks
- [ ] Capture any upcoming shows

## DB Fix Needed
```sql
-- Once artist-level ASCAP IPI is found:
UPDATE artists SET pro = 'ascap', ipi_number = '[ARTIST_LEVEL_IPI]'
WHERE id LIKE '8a3fbde2%';
-- Note: member IPIs (Isaac: 01262457258, Joseph: 01262457454) are writer-level, not artist entity IPI
```

## Cross-references
- Publishing: `publishing/Dark_Matter_Master.xlsx`
- Wakaan Records: external label — no DSR folder
- Outreach profile: `tenx10/src/lib/outreach/artist-profiles.ts` → slug `dark-matter`
