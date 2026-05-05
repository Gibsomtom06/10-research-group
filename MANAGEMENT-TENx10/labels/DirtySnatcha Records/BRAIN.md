# DirtySnatcha Records — Brain (project brief / context file / north star doc)

Living context for DSR label operations.

---

## What It Is

DirtySnatcha Records (DSR) is a music label co-owned by **Leigh Bray (70%)** and **Thomas Nalian (30%)**. Leigh Bray founded the label; Thomas earned 30% ownership through work he's done for the label. **DirtySnatcha (the artist) is Leigh Bray** performing under the artist name; Leigh Bray owns 100% of the artist project separately from the label.

**DSR is a client of TENx10**, not a subsidiary. DSR hires TENx10 for **partial management services** (booking, releases, royalty admin where useful — not full management) and uses the **TENx10 platform** (`products/tenx10-platform/`) as the SaaS that runs the label's catalog + roster + financials. The TENx10 ↔ DSR relationship is customer ↔ vendor with Thomas standing in both businesses.

DSR is also the live **proof-of-concept** / dogfood for the TENx10 platform — real artists, real shows, real data — but that's a side effect of Thomas's dual stake, not a structural relationship.

### Ownership

| Stakeholder | Stake in DSR (the label) | Stake in DirtySnatcha (the artist) |
|---|---|---|
| **Leigh Bray** | 70% | 100% |
| **Thomas Nalian** | 30% (earned through work) | 0% (manages, takes 10% gross commission on artist income) |

**Distributions:** **None paid to either owner yet.** Earnings accumulate inside the label entity. Equity stakes are real (signed/structural) but no cash is being drawn from DSR by either owner at this time. Thomas's 10% manager commission is paid from **DirtySnatcha-the-artist's** gross income, not from DSR's books — those are separate income streams.

### PRO / publishing

PRO: ASCAP. IPI: 1238282844. Member ID: 7423184.
Publisher entity: **DSR Records Publishing** (ASCAP).

---

## Roster (DSR label acts — not all are TENx10-managed)

| Artist | Notes |
|--------|-------|
| DirtySnatcha | Flagship artist. **Leigh Bray** performing as DirtySnatcha (NOT Thomas Nalian — Thomas manages). BMI IPI 01017500116. Owns 100% of the artist project + 70% of DSR (the label). Managed by Thomas (10% gross commission on artist income). |
| OZZTIN | DSR label act |
| MAVIC | DSR label act |
| PRIYANX | DSR label act |
| WHOiSEE | DSR label + TENx10-managed. BMI. IPI unknown — in emails/contracts, not in DB. |
| Kotrax | 7 DSR tracks. TENx10-managed. |
| CRiiOZ | DSR label act. Had hockey jersey drop via MHP — sold out at $125. Proven MHP x DSR merch process. |
| Dark Matter | TENx10-managed only (not on DSR label). ASCAP. IPI unknown. |

---

## Publishing State

- **DSR Records Publishing**: 54 tracks registered at MLC (migration 020 — done). mlc_work_id stored per track.
- **LAB10 Publishing** (Leigh Bray / DirtySnatcha tracks, BMI): 0 of 82 registered at MLC — critical gap.
- International mechanicals: no Songtrust. Registering directly. Priority order TBD from global royalty map.
- SoundExchange: 0 tracks registered. Leigh Bray as performer + DSR as rights holder.
- CMRRA: accounts 02274554 / 02274555 — not yet activated.

---

## Distribution

VMG (Virgin Music Group) via Assets platform. Platform is distributor-agnostic — VMG is DSR-specific.

---

## Key Gaps

- WHOiSEE BMI IPI not in DB
- Dark Matter ASCAP IPI not in DB
- LAB10 Publishing MLC submission not done
- SoundExchange not set up
- CMRRA not activated
- International collection societies not registered

---

## Entity registry — pending data

Thomas has additional IPI numbers, publishing entity info, and FEIN numbers to provide. Capture them here as the canonical reference once given:

### DirtySnatcha Records (DSR — the label)

- **PRO / IPI:** ASCAP 1238282844 (Member ID 7423184) — **confirmed**
- **Publisher entity name:** DSR Records Publishing (ASCAP) — **confirmed**
- **FEIN:** _pending — Thomas to provide_
- **State of incorporation / LLC formation state:** _pending_
- **Registered agent / mailing address:** _pending_
- **CMRRA accounts:** 02274554 / 02274555 — exist, not activated

### DirtySnatcha (the artist — Leigh Bray)

- **PRO / IPI:** BMI 01017500116 — **confirmed**
- **Publisher entity name:** LAB10 Publishing (BMI) — **confirmed**
- **LAB10 IPI:** _pending — Thomas to provide_
- **SoundExchange ID (artist + sound recording rights holder):** _pending_

### Thomas Nalian (manager)

- Management agreement with DirtySnatcha: 10% of artist gross income — **confirmed**
- DSR equity stake: 30% — **confirmed**
- **Personal IPI (if relevant for any role):** _pending_
- **FEIN of any management entity (if separate from personal):** _pending_

### Leigh Bray (artist + label majority owner)

- DirtySnatcha artist project: 100% owned — **confirmed**
- DSR equity stake: 70% — **confirmed**
- Founded DSR; offered Thomas 30% for work performed — **confirmed**
- **Other publishing entities owned by Leigh Bray:** _pending_

When Thomas provides the pending data, replace the `_pending_` lines with the values + the date received. This file is the single canonical source — don't duplicate this into other files; cross-reference instead.
