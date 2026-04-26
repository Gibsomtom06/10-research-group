# Session Changelog (reference only)

> **Not required reading.** Critical state (pending work, platform state, publishing state) is now in `CLAUDE.md` which loads automatically. This file is a detailed log of what was done each session.

**Last updated:** 2026-04-25 (end of publishing audit + ops dashboard session — catalog workflow + map planning)

---

## Platform State

TENx10 Supabase (`ocscxqaythiuidkwjuvg`) is the only live DB. DBA's Supabase (`erwlfjlgrrfuqnjzitor`) is an orphan — ignore it.

Git: `master` branch → `Gibsomtom06/tenx10` → Vercel auto-deploy. Last push: `c256db6`.

---

## Publishing — Current State (critical — mid-stream work)

Two publisher accounts under management:

| Publisher | PRO | IPI | MLC Status |
|-----------|-----|-----|------------|
| **LAB10 Publishing** | BMI | — | **0 of 82 Leigh Bray tracks registered — NOTHING DONE YET** |
| **DSR Records Publishing** | ASCAP | 1238282844 (Member ID 7423184) | **54 tracks registered — in DB via migration 020** |

Artist PRO status in DB:

| Artist | PRO | IPI | DB Status |
|--------|-----|-----|-----------|
| DirtySnatcha (Leigh Bray) | BMI | 01017500116 | ✅ in DB |
| DSR Records Publishing | ASCAP | 1238282844 | ✅ in DB (migration 019) |
| WHOiSEE (Brett) | BMI | **UNKNOWN — in emails/contracts** | ❌ NOT in DB |
| Dark Matter | ASCAP | **unknown** | ❌ IPI missing from DB |

SoundExchange: 0 tracks registered (Leigh Bray as performer + DSR as rights holder). Not started.
CMRRA: accounts 02274554/02274555 — not activated.

---

## What Was Done This Session (April 25)

- **Migration 019** applied: adds `pro_member_id` col to artists, sets DSR ASCAP credentials, confirms DirtySnatcha BMI IPI
- **Migration 020** applied: adds `mlc_work_id` col to publishing_registrations, inserts all 54 DSR Records Publishing tracks from MLC work report CSV (mlc_registered=true, mlc_work_id set)
- **Ops dashboard work log** complete — all sessions April 22–25 logged, verifyNote on every item, color-coded area badges, gap items for WHOiSEE/eBay/Rim Shop added
- **Discord notify endpoint** built and confirmed working: `POST /api/discord/notify` — one-way webhook, amber/red/violet/green embeds, auth by session or CRON_SECRET
- **DiscordTestButton** on ops dashboard — confirmed by Thomas ("the png button works")

---

## Key Decision — International Publishing (made April 25)

**No Songtrust.** Thomas wants to register directly with each international collection society rather than use a publishing admin service. BMI/ASCAP handle international **performance** royalties automatically via CISAC reciprocal agreements — no per-country registration needed for performance.

For international **mechanical** royalties, register directly with:

| Society | Territory | Type |
|---------|-----------|------|
| CMRRA | Canada | Mechanical (accounts 02274554 / 02274555) |
| PRS for Music (MCPS) | UK | Mechanical + Performance |
| GEMA | Germany | Mechanical + Performance |
| SACEM | France | Mechanical + Performance |
| APRA AMCOS | Australia / NZ | Mechanical + Performance |
| BUMA/STEMRA | Netherlands | Mechanical + Performance |
| STIM | Sweden | Mechanical + Performance |
| JASRAC | Japan | Mechanical + Performance |
| KOMCA | South Korea | Mechanical + Performance |

**Build the global royalty map first** (listener volume by country from Spotify data) to prioritize which societies to register with — only register where the money actually is.

---

## Catalog Workflow — Post-VMG Upload (planned, not built yet)

After a track is delivered to DSPs via VMG, the registration pipeline is:
1. ISRC confirmed in DB
2. BMI/ASCAP performance registration (US)
3. MLC mechanical registration (US streaming) — batch CSV upload
4. SoundExchange — Leigh Bray as performer + DSR as rights holder
5. CMRRA — Canada mechanical
6. International societies (priority order from map data)

Platform will auto-generate a task checklist per track when status flips to "delivered." Not yet built.

---

## Pending — Next Session Priority Order

1. **WHOiSEE BMI IPI** — pull from emails/contracts, then:
   ```sql
   UPDATE artists SET pro_affiliation = 'bmi', pro_ipi = '[IPI]'
   WHERE id = 'dcc18841-25d9-4d2b-9f14-d6e9f8e0660f';
   ```
2. **LAB10 Publishing MLC submission file** — generate CSV of all 82 Leigh Bray tracks (from publishing_registrations where artist_id = '3816c060-...') formatted for mlc.com upload
3. **Dark Matter ASCAP IPI** — find and store in artists table (id: 8a3fbde2)
4. **Discord bot (two-way)** — build Discord Application + bot + listener endpoint so Thomas can reply from Discord
5. **New release registration skill** — auto-register BMI/ASCAP/MLC on new release added to platform
6. **SoundExchange** — register Leigh Bray as performer + DSR as rights holder
7. **CMRRA** — activate accounts 02274554/02274555, file catalog
8. **Mobile optimization** — ops dashboard responsive layout
9. **eBay context** — Thomas to clarify (eBay = comics-resale venture at `ventures/comics-resale/`, needs dashboard presence TBD)
10. **Rim Shop** — Google Merchant integration, website scope TBD

---

## Session Start Prompt

```
Pick up work on TENx10 platform. Read:
1. C:\Users\Slash\10 Research Group\_READ_FIRST_WHEN_YOU_WAKE_UP.md
2. C:\Users\Slash\CLAUDE.md

Publishing is mid-stream. Two priorities:
1. Pull WHOiSEE's BMI IPI from Gmail/contracts and add to artists table
2. Generate the LAB10 Publishing MLC submission CSV (82 Leigh Bray tracks)

After that: build the global royalty map on the publishing page (world map, listener density + collection society coverage). react-simple-maps already installed. No Songtrust — registering directly with each society.
```
