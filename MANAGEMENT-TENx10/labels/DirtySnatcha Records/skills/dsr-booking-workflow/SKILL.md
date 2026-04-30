---
name: dsr-booking-workflow
description: "Complete show booking workflow for DirtySnatcha Records — from offer intake through confirmation, folder creation, rider generation, advance tracking, and post-show settlement. Use for: processing new show offers, routing to Thomas for approval, creating Google Drive show folders, generating rider PDFs, tracking advance checklists, monitoring travel, grading promoters and venues, and managing agent commissions."
---

# DSR Booking Workflow

Unified booking pipeline for DirtySnatcha Records. Covers the full lifecycle from offer intake to post-show settlement. Integrates with the Artist Bible financial tracking system.

## Approval Chain

1. ALL offers route to Thomas Nalian regardless of source
2. Thomas approves first → forwards to Leigh for sign-off (48hr window)
3. No response from Leigh = second ping. No confirmation without both sign-offs
4. Every offer tagged with originating agent (Andrew / Colton / Thomas / Direct) for commission tracking

## Offer Intake (Hard Gate)

An offer is NOT added to Thomas's review queue unless ALL required fields are present. If any field is missing, auto-reply to the sender requesting the missing information.

**Required fields:** Show Date, Gig Type, Venue Name, Venue City+State, Venue Capacity, Guarantee ($), Deposit Amount ($), Deposit Due Date, Final Payment Due Date, Venue Support Budget ($), Marketing Budget ($), Other Artists on the Bill, Promoter Name+Email+Phone, Agent Who Originated Offer.

**Marketing budget must itemize three buckets:**
- Paid Digital Ads (Meta, TikTok, Google) — trackable
- Design & Creative (flyers, posters, digital assets) — one-time
- Street Team / Physical (flyering, postering) — hard to attribute

Flag any offer missing this breakdown for negotiation.

### Intake Workflow

```
1. Email arrives (Gmail MCP) or direct submission
2. Parse all required fields
3. IF fields missing → auto-reply requesting missing info → hold in Pending queue
4. IF complete → run Competition Report (scan Bandsintown/Songkick for competing shows)
5. Add to Thomas's review queue with Competition Report attached
6. Check promoter history → IF grade D or F → flag warning on offer
7. Check venue history → IF low grade → flag warning on offer
```

## On Confirmation

When Thomas approves AND Leigh signs off:

```
1. Create Show Folder in Google Drive
   → 01_TOUR_STOPS/[MM.DD.YYYY] [City, State] - [Venue Name]
   → Auto-populate 6 subfolders from 00_MASTER_TEMPLATE
2. Generate Rider PDF
   → Prompt Thomas for Queen of England demand
   → Update agent contact (Andrew primary, Colton legacy)
   → Output PDF to 06_SHOW_ASSETS
3. Start Advance Checklist Tracker
4. Start Travel Monitoring (Thomas sets travel party)
5. Create Google Calendar events (deposit due, final payment, show date)
6. Create promoter record if new
7. Log agent commission record
8. Trigger Show Content Calendar for marketing timeline
9. Look up Tour Support Grid for support artist lineup
```

## Advance Checklist

Every confirmed show must have all items checked. Unchecked item 7 days before show → alert to Thomas.

| Item | Track |
|:-----|:------|
| Hotel (min 4-star, king bed, paid in full) | Pending / Confirmed |
| Ground transportation (sober transport or Uber+tip) | Pending / Confirmed |
| Rider sent to promoter | Pending / Confirmed |
| Rider signed and returned | Pending / Confirmed |
| Technical requirements confirmed | Pending / Confirmed |
| Green room with private bathroom | Pending / Confirmed |
| Visuals pack sent to VJ | Pending / Confirmed |
| FB event page created by promoter | Pending / Confirmed |
| Marketing assets delivered to promoter | Pending / Confirmed |
| Deposit received | Pending / Confirmed |

## Post-Show Settlement

```
1. Verify final payment received
2. Fill settlement sheet
3. Grade Promoter — auto-calculate from: paid on time, marketing delivered,
   rider fulfilled (full/partial/no), turnout vs projection, green room, rebook, notes
4. Grade Venue — separate from promoter: production, sound, green room,
   hospitality, capacity vs turnout, market value, would return, notes
5. Pull marketing performance report → calculate Cost Per Ticket Sold
6. Complete ticket reconciliation
7. Update agent commission record
```

## Financial Tracking (Artist Bible Integration)

Track per show: contract type (flat/vs/bonus), payment status, bonus thresholds, merch split, commission auto-calculation. See `references/financial_tracking.md` for field details.

## Reference Files

- `references/show_folder_structure.md` — Complete subfolder contents
- `references/rider_template.md` — Standard rider with variable Queen line
- `references/grading_criteria.md` — Promoter and venue grading rubric
- `references/financial_tracking.md` — Contract types and payment tracking
