# MANAGEMENT-TENx10 — BRAIN

The TENx10 management business — Thomas Nalian's artist management company. **Distinct from the platform product** (`/products/tenx10-platform/`). The business uses the platform; the business is the canonical proof of concept.

**Last updated:** 2026-04-30

---

## What this is

TENx10 the **company** is Thomas's full-service artist management firm. It manages a roster of bass-music artists end-to-end (bookings, releases, royalty admin, content, contracts, financials) AND operates DirtySnatcha Records (DSR) — one of the labels under the umbrella.

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
| **DirtySnatcha** | Lee Bray (aka Leigh Bray) | Dubstep, Riddim, Bass, Trap | BMI / 01017500116 | DSR (own label) | Flagship; 136 tracks; ~8-9K MAU; PS 28; 17-show TMTYL 2026 tour |
| **WHOiSEE** | Brett Hopkin | Bass | BMI / IPI in emails NOT in DB | DSR | NC-based; Circus Records UK EP; cross-promo opportunity |
| **Dark Matter** | Isaac Tullos + Joseph Kalina | Bass | ASCAP / artist-level IPI unknown | **Wakaan** (NOT DSR) | Chicago/Knoxville duo; managed but signed to Wakaan label |
| **Kotrax** | (TBD) | (TBD) | TBD | DSR | Roster artist; BRAIN.md exists but not yet detailed |
| **HVRCRFT** | (TBD) | (TBD) | TBD | TBD | Managed; data not yet ingested |

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
| Fill Kotrax + HVRCRFT BRAIN with real artist context | Pending | Manual entry |
| Capture WHOiSEE BMI IPI from email and add to artists table | Pending | Lookup + entry |
| Confirm Dark Matter ASCAP IPI numbers | Pending | ASCAP Member Services lookup |
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

*BRAIN v1 (real content) — 2026-04-30. Replaces stub. Update as roster + entity state changes.*
