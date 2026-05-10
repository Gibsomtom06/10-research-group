# MANAGEMENT-TENx10 — BRAIN

The TENx10 management business — Thomas Nalian's artist management company. **Distinct from the platform product** (`/products/tenx10-platform/`). The business uses the platform; the business is the canonical proof of concept.

**Last updated:** 2026-05-10

---

## What this is

TENx10 the **company** is Thomas's full-service artist management firm. It manages a roster of bass-music artists end-to-end (bookings, releases, royalty admin, content, contracts, financials).

**Relationship to DSR (DirtySnatcha Records):** **DSR is a client of TENx10**, not a subsidiary. DSR is a co-owned label (Leigh Bray 70% + Thomas Nalian 30%) that hires TENx10 for **partial management services** AND uses the **TENx10 platform** (the SaaS) to run the business. TENx10 doesn't own DSR; DSR pays/uses TENx10 like any other label client would. See `labels/DirtySnatcha Records/BRAIN.md` § Ownership for the full structure.

The DSR-as-client relationship has TWO surfaces:
1. **Management services** — TENx10 provides partial mgmt to DSR (not full — DSR runs its own A&R, label-level decisions; TENx10 layers on top for booking, releases, royalty admin where useful)
2. **Platform usage** — DSR uses `products/tenx10-platform/` SaaS to operate the catalog + roster + financials

This makes DSR the **dogfood** for the platform (since Thomas is a stakeholder in DSR + operator of TENx10), but the legal/financial relationship is still customer ↔ vendor, not parent ↔ subsidiary.

**Thomas's three hats:** (1) co-owner of DSR (30% equity, no current draw), (2) manager of DirtySnatcha-the-artist (10% gross commission on artist income), (3) operator of TENx10 the management firm (which serves DSR plus a broader roster: DirtySnatcha + WHOiSEE + Dark Matter + Kotrax + HVRCRFT). Keep these income streams + roles clearly separated in any financial discussion.

The TENx10 **platform** (separate folder, separate codebase at `products/tenx10-platform/`) is the SaaS tool the business runs on. The mutually reinforcing loop:

```
Real management work → operational gaps → platform feature
       ↓                                          ↓
  Better tooling ← platform shipped → more managed artists
```

DSR is the canonical training corpus. Every Thomas decision generates shadow data + Xai context. The label IS the customer-success case study + the dogfood + the moat.

---

## Folder structure

```
MANAGEMENT-TENx10/
├── BRAIN.md                                ← this file
├── GMAIL_LABEL_TREE.md                     ← Gmail label setup spec
├── gmail_filters_import.xml                ← portable Gmail filter import
├── artists/                                ← TENx10's managed roster
│   ├── dirtysnatcha/                       ← flagship: Lee Bray (Leigh Bray)
│   │   ├── BRAIN.md
│   │   └── publishing/DirtySnatcha_Master.xlsx
│   ├── whoisee/                            ← Brett Hopkin
│   │   └── publishing/WHOiSEE_Master.xlsx
│   ├── dark-matter/                        ← Isaac Tullos + Joseph Kalina (signed to Wakaan, TENx10-managed)
│   │   └── publishing/Dark_Matter_Master.xlsx
│   ├── kotrax/                             ← TBD; managed
│   │   └── publishing/Kotrax_Master.xlsx
│   └── hvrcrft/                            ← managed; data not yet ingested
│       └── publishing/HVRCRFT_Master.xlsx
└── labels/
    └── DirtySnatcha Records/               ← DSR (Thomas + Lee's label)
        ├── BRAIN.md
        ├── DSR_Records_Master.xlsx         ← canonical catalog + per-artist breakdown
        ├── DSR_CLEAN_DATABASE.xlsx         ← 14-table normalized view of God Sheet (Supabase migration target)
        ├── DS Full BMI.csv                 ← BMI Songview export
        ├── catalog/                        ← per-RELEASE folders (DSR002–DSR178)
        ├── contracts/                      ← VMG distribution + label-artist agreements (29+ files)
        ├── publishing/                     ← MLC, BMI, ASCAP, CMRRA, SoundExchange data + glossary
        ├── operations/ ops/                ← demo intake, label playbooks, editorial
        ├── releases/ releases-refs/        ← release coordination
        ├── brand/ brand-assets/            ← visual identity
        ├── career-dev/                     ← per-artist career trajectory
        ├── catalog-views/                  ← saved sorts/filters of the catalog
        ├── merch/                          ← MHP coordination + merch tracking
        ├── mgmt-contracts/                 ← TENx10 ↔ artist management agreements
        ├── socials/                        ← label-side social channels
        └── tours/                          ← per-tour folders (advance/marketing/tickets)
```

---

## Roster (TENx10 managed)

| Artist | Real name | Genre | PRO / IPI | Label home | Status |
|---|---|---|---|---|---|
| **DirtySnatcha** | Lee Bray (aka Leigh Bray) | Dubstep, Riddim, Bass, Trap | BMI / 01017500116 | **Multi-label** — self-release + DSR (own label) + Dim Mak + Circus + Wakaan + Subsidia | Flagship; 136 tracks; ~8-9K MAU; PS 28; 17-show TMTYL 2026 tour (correction 2026-05-10: prior BRAIN entry only said "DSR (own label)") |
| **WHOiSEE** | Brett Hopkin | Bass | BMI / 00779461097 (confirmed 2026-05-03, in DB) | **Multi-label** — releases on DSR + Circus + Subcarbon; Monstercat release upcoming | NC-based; cross-label artist (correction 2026-05-10: prior BRAIN entry said "DSR" only) |
| **Dark Matter** | Isaac Tullos + Joseph Kalina | Bass | ASCAP / artist-level IPI unknown | **Multi-label** — releases on DSR + Wakaan + Circus | Chicago/Knoxville duo; managed; cross-label artist (correction 2026-05-10: prior BRAIN entry incorrectly said "Wakaan (NOT DSR)" — they release on all three) |
| **Kotrax** | (TBD — TODO) | Bass Music / Dubstep | TODO | **Multi-label** — releases on DSR + self-release | Denver-based; Mountain West specialist; 7 DSR tracks; TMTYL support (ABQ, Tampa, Butte) (correction 2026-05-10: prior BRAIN entry only said "DSR") |
| **HVRCRFT** | (TBD — TODO) | Bass Music / Dubstep | TODO | Independent (mgmt only) | Las Vegas + SF; West Coast specialist; Tier 2 support; DB ID 21454e1e |

DSR's label-side roster has **additional artists who are signed to DSR but NOT under TENx10 management** — they're DSR releases only. See `labels/DirtySnatcha Records/BRAIN.md` for that distinction.

---

## Booking team (canonical, per DirtySnatcha BRAIN.md + memory)

- **Andrew Lehr** — primary booking agent, AB Touring, andrew@abtouring.com, (814) 602-5613. Birthday April 29. *Confirmed correct name 2026-04-30 — earlier docs that said "Andrew Bass" were wrong.*
- **Colton Anderson** — legacy agent, PRYSM Talent Agency, colton@prysmtalentagency.com / 734-904-0224. Being transitioned out.

---

## Active tour state (DirtySnatcha)

- **TMTYL 2026:** 17 shows, ~$38,600 guaranteed
- **Electric Forest 2026:** confirmed (late June)
- **Lost Lands 2026:** confirmed (late September)

---

## Commission structure

- **Default agent-routed:** 10% manager / 10% agent / 80% artist (10/10/80)
- **Direct deals:** 20% manager / 80% artist (20/80)
- Every offer is tagged with originating agent for commission tracking
- Per-artist override possible (captured in `mgmt-contracts/`)

---

## Distribution + Publishing entities

| Entity | Type | Affiliation |
|---|---|---|
| **DirtySnatcha Records** | Label | VMG distribution (formerly Symphonic) |
| **DirtySnatcha Records Publishing** | Publisher | ASCAP, IPI 1238282844, Member ID 7423184 |
| **LAB10 Publishing** | Publisher (Lee Bray's personal pub co) | BMI |
| **DirtySnatcha (artist)** | Performer + Writer | BMI, IPI 01017500116 |

---

## Strategic principles (this management company specifically)

1. **Capitulate and Cultivate.** Rent foundation models from Anthropic + Ollama. Build the orchestration + per-artist context + shadow team. The model layer commoditizes; the moat compounds.
2. **DSR is dogfood, not marketing.** Every TENx10 platform feature ships because Thomas needed it for DSR yesterday. Real artists, real shows, real contracts, real revenue.
3. **The platform sells the management capability.** Other managers / labels buy TENx10 because they want what DSR has — full management team via AI agents at flat SaaS cost.
4. **Single approval point.** Thomas approves all show offers, label decisions, sent communications. AI does research + drafting; human does decision.
5. **Per-track financial visibility.** Per the label dashboard spec — every track's payouts, marketing spend, recoupment status surface in real time. No quarterly statement guesswork.

---

## Open work specific to the management business

| Item | Status | Owner |
|---|---|---|
| Fill Kotrax + HVRCRFT BRAIN with real artist context | **Done 2026-05-03** | All 4 artist BRAINs updated |
| Capture WHOiSEE BMI IPI from email and add to artists table | **Done 2026-05-03** | 00779461097 in DB |
| Confirm Dark Matter ASCAP IPI numbers | Pending — needs ASCAP Member Services call | Isaac/Joseph writer IPIs known (1262457258 / 1262457454); the act-level "Dark Matter" IPI (if one exists) requires a phone lookup. ACE Repertoire web search is SPA-blocked + "Dark Matter" returns too many false positives to be useful. |
| LAB10 Publishing MLC submission (0 of ~82 tracks registered) | Submission-ready | `DirtySnatcha_MLC_Submissions.xlsx` → `LAB10_Pub_Full` sheet |
| SoundExchange registration (DSR rights owner + Lee Bray performer) | Submission-ready | `SoundExchange_DSR_RightsOwner_Prep.csv` |
| CMRRA accounts 02274554 / 02274555 activation | Pending | Activate before submitting |
| Migrate God Sheet to Supabase tables | Pending | DBA Phase 1 unblocks |
| Label dashboard (TENx10 platform feature) | Spec captured | See `2026-04-30-dsr-label-dashboard.md` |

---

## Cross-references

- **Platform repo:** `products/tenx10-platform/` (the SaaS this business runs on)
- **DBA project:** `products/digital-booking-agent/` (booking automation; future SaaS for other artists)
- **Per-project context:** `artists/<artist>/BRAIN.md` and `labels/DirtySnatcha Records/BRAIN.md`
- **Operational specs (2026-04-30):**
  - `docs/superpowers/specs/2026-04-30-dsr-booking-flow-vision.md`
  - `docs/superpowers/specs/2026-04-30-booking-intelligence-engine.md`
  - `docs/superpowers/specs/2026-04-30-dsr-label-dashboard.md`
  - `docs/superpowers/specs/2026-04-30-contacts-inbox-cleanup.md`
- **Catalog source-of-truth:** `labels/DirtySnatcha Records/DSR_CLEAN_DATABASE.xlsx` (replaces messy God Sheet for canonical use)
- **Schema map:** `products/tenx10-platform/TENx10_Knowledge_Base/GODSHEET_SCHEMA_MAP_FULL.md`
- **Memory references:** `~/.claude/projects/.../memory/reference_andrew_lehr_contact.md`, `reference_lee_bray_contact.md`, `project_portfolio_status_apr29.md`

---

## Revenue state per artist (2026-05-03)

| Artist | Live (shows/mo) | Streaming (~$0.004/stream) | Publishing | Merch | Content | Education | Brand | Active pillars |
|---|---|---|---|---|---|---|---|---|
| **DirtySnatcha** | $2,270 avg × 17 shows (TMTYL) | ~8-9K MAU = ~$35/mo | **$0 — LAB10 0/82 tracks registered, DSR 54/82 at MLC only** | **$0 live** (jersey drop pending) | $0 | $0 | $0 | 1 of 7 |
| **WHOiSEE** | Unknown | Unknown | **$0 — IPI not in DB** | $0 | $0 | $0 | $0 | 0 of 7 |
| **Dark Matter** | Unknown | Unknown | **$0 — artist IPI unknown** | $0 | $0 | $0 | $0 | 0 of 7 |
| **Kotrax** | Unknown | Unknown | Unknown | $0 | $0 | $0 | $0 | 0 of 7 |

**Key insight:** DirtySnatcha is the only revenue-generating artist and is on 1 of 7 pillars. Streaming royalties are nearly uncollected (~$35/mo vs. potential $200-500/mo if streams grow + publishing is registered). Publishing is the nearest zero-to-active unlock for 3 of 4 artists.

---

## Pilots + experiments in flight (2026-05-03)

### WRS Rim Shop — agency Client 0
- **Status:** Verbal pending. SOW_v1.md and PILOT_BRIEF.md ready since 2026-04-22. No movement.
- **Next action:** Verbal with WRS owner → send SOW same day.
- **Structure:** Performance-share, flat $ per booked appointment (no upfront retainer)
- **Success criteria:** Signed SOW + 1 booked appointment attributed
- **Detail doc:** `products/rim-shop/` (SOW_v1.md, PILOT_BRIEF.md, PILOT_RUN_LOG.md)

### LAB10 Publishing registration
- **Status:** 0 of 82 Leigh Bray tracks registered at BMI/MLC/SoundExchange. CSV tooling ready. Never run live.
- **Next action:** Run one track end-to-end (BMI → MLC → SoundExchange), validate Supabase tracker + CSV output. Document as `LAB10_PILOT_TRACK_RUN.md`.
- **Registry order:** BMI first (source of truth for composition) → MLC second (needs BMI Work ID) → SoundExchange third (independent channel)
- **Success criteria:** 1 track with BMI Work ID + MLC Song Code + SoundExchange confirmation, all in Supabase with timestamps, CSV clean
- **Chain reaction:** Unblocks 81 remaining tracks (~40 hrs batch), MLC back-claim up to 3.5 years, DAD product UX validation
- **Detail doc:** `MANAGEMENT-TENx10/LAB10_PILOT_TRACK_RUN.md`

### MHP × DSR Hockey Jersey pre-sale
- **Status:** Physical prototype exists. Vendor invoice pending Thomas approval. Goal: 100 units × $125 before Electric Forest (late June, ~7 weeks out).
- **Next action:** Approve vendor invoice → stand up dirtysnatcharecords.com/merch → launch pre-sale.
- **Success criteria:** 100 units pre-sold = $12,500 gross, ~$5,000 net; first Factory shadow training signal
- **Detail doc:** `MANAGEMENT-TENx10/MHP_JERSEY_DROP.md`

---

## Operating cadence

### Daily
- Morning brief: pull from TENx10 dashboard (`/dashboard`) — show status, DSP alerts, publishing gaps, Xai escalations from artist chat
- Gmail triage: DSR management inbox (thomas@dirtysnatcharecords.com). Note: OAuth must stay valid — add token-expiry alert to morning brief.
- Discord check: trading-shadow heartbeat, ideas-inbox items, agent alerts

### Weekly (Monday)
- Revenue review: shows with deposits outstanding, new offers in pipeline, publishing registration progress
- Platform health: any 404s, auth failures, MCP tool errors
- Pilot status: WRS units/week, LAB10 tracks registered count, MHP jersey pre-sale unit count
- BRAIN.md update: bump "Last updated" timestamp, close any resolved open items

### Monthly
- P&L: shows settled, streaming royalty deposits, merch net, publishing deposits (quarterly rhythm)
- Roster review: per-artist KPIs (PS, MAU, save-to-stream ratio vs. targets)
- Pipeline planning: upcoming show submissions, release schedule, 90-day goals

---

## Open decisions — answer-by dates

| Decision | Answer-by | Context |
|---|---|---|
| ~~Management vs. SaaS as primary~~ | ~~2026-05-10~~ | **Resolved 2026-05-10 — MANAGEMENT PRIMARY.** The platform exists to run TENx10's management work. Stripe / multi-tenant / signup are NOT P0. Public sign-up demoted to a footer link on tenx10.co (preserves optionality without making SaaS the surface). Forcing function: Thomas leaves Wednesday 2026-05-13 for a major networking event and the platform needs to read as "the operating system I built to manage my roster and run DSR" by then. Build cadence shifts to **21-day cycles** (Cycle 1: 2026-05-10 → 2026-05-31; cycles align to the 21-day cadence going forward instead of 90-day horizons). |
| ~~DBA: standalone or absorb into TENx10~~ | ~~2026-05-10~~ | **Resolved 2026-05-10 — ABSORB.** DBA's logic moves into TENx10's booking-agent module. DBA repo becomes snapshot/archive. No second SaaS product. The Booking Agent v2 B1/B2/B3 work already in flight is the consolidation path. Removes territorial overlap; one codebase to maintain. |
| **Revenue-funds-trading** | Before live Alpaca cutover | Does umbrella revenue capitalize the live account, or does trading raise its own capital? $0 in live account currently. |
| **ReAgent vs. Orchestral AI evaluation** | Before next agent ships | Which orchestration substrate does Factory Boss sit on? |
| ~~WHOiSEE BMI IPI~~ | ~~2026-05-10~~ | **Resolved 2026-05-03** — 00779461097, in DB |
| **Dark Matter ASCAP artist IPI** | 2026-05-10 (still pending) | ASCAP Member Services phone call required — ACE Repertoire is a SPA so web lookup is blocked; "Dark Matter" name search returns too many false positives. Writer IPIs known: Isaac Tullos 1262457258, Joseph Kalina 1262457454. Open question: does the act "Dark Matter" have its own act-level IPI distinct from the writers, or is the writer IPI sufficient for ASCAP OnStage filings? Either resolves the gap. |

---

*BRAIN v3 — 2026-05-10 weekly review. WHOiSEE BMI IPI resolved (00779461097, in DB since 2026-05-03 — was already done but not reflected here). Dark Matter ASCAP IPI lookup deferred to phone call (ACE Repertoire blocked). Two strategic decisions still pending Thomas's call: Management vs SaaS as primary; DBA standalone vs absorb into TENx10. Next update due: 2026-05-17.*
