# Contacts + Inbox Cleanup Spec (Two-Layer)
## 2026-04-30

Thomas's vision for cleaning \	homas@dirtysnatcharecords.com\ and \	homas@dirtysnatcha.com\ inboxes with proper Gmail label tree + filters across DSR / DirtySnatcha / Kotrax / WHOiSEE / Dark Matter / Publishing entities.

---

## Layer 1: Operational (Ship-Ready)

**Timeline:** 6-8 hours over one week  
**Dependencies:** None — operational work only  
**Deliverables:**
- Google Contacts deduplication (Apollo or alternative verification)
- Gmail label tree hierarchy (entity + functional)
- 15-20 email filters (inbound routing by sender domain, recipient, subject patterns)
- Inbox-zero triage workflow
- Quick win: 5 filters + today-only triage (~1 hour)

**Actions:**
1. Run Contacts dedupe pass (manual + Apollo integration if available)
2. Create label structure:
   - DSR / (shows, finance, marketing, etc.)
   - DirtySnatcha / (artist comms, booking)
   - Kotrax / / WHOiSEE / / Dark Matter / (per-artist inbound)
   - Publishing / (BMI, ASCAP, MLC, SoundExchange)
   - Operational / (systems, accounts, administrative)
3. Set up filters for automatic routing
4. Triage existing mail into labels
5. Lock inbox to zero pending

---

## Layer 2: Tooling (BACKBURNERED — DBA Phase 1)

**Status:** Not active until Digital Booking Agent Phase 1 ships  
**Capabilities (when ready):**
- Inbound Classifier — auto-route by entity
- Voyage semantic search across inbox history
- Auto-archive low-priority transactional
- Daily Discord digest (key messages by entity)
- Apollo enrichment via Digital Booking Agent Research agent
- Promoter sentiment scoring (booking-flow signal)

---

## Cross-References

- **booking-flow-vision** — clean inbox = better Stage 1 signal
- **booking-intelligence-engine** — capability 10 contacts in market depends on this
- **unified-inbox memory** — multi-account consolidation vision
- **portfolio-status memory** — WHOiSEE BMI gap, Dark Matter ASCAP gap, LAB10 0/82 tracks
- **CLAUDE.md Account Map** — DSR vs personal vs umbrella email breakdown

---

## First Slice (Quick Win)

**Effort:** ~1 hour  
**Dependencies:** None  
**Actions:**
1. Create 5 core filters (DSR booking, artist comms, publishing, finance, operational)
2. Triage today's mail only
3. Lock inbox to zero pending

**Why this matters:** Clean inbox signals better booking decision-making. Booking intelligence engine depends on fast contact surfacing.
