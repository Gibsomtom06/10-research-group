# DSR PLATFORM — AI AGENT KNOWLEDGE ARCHITECTURE v2.0
# PART 2: BOOKING & MONEY — Show Lifecycle, Booking Engine, Financial Engine
# Modules 5, 6, 7

---

# MODULE 5: SHOW LIFECYCLE STATE MACHINE

Every show moves through a defined sequence of states. The AI agent tracks the current state and triggers actions at each transition.

## Complete Show States

```
OFFER_RECEIVED
    → Intake Validation (14 required fields — see Hard Gate below)
    ↓
INTAKE_VALIDATED
    → Enters manager review queue
    ↓
MANAGER_REVIEW
    → AI runs Booking Decision Engine (Module 6)
    → Recommendation: ACCEPT / COUNTER / DECLINE
    ↓
ACCEPTED / COUNTERED / DECLINED
    → If declined: archived with reason
    → If countered: enters negotiation state
    → If accepted: moves to contract phase
    ↓
CONTRACT_SENT
    → Contract sent to promoter
    → AI tracks: days since sent, follow-up at 48 hours
    ↓
CONTRACT_SIGNED
    → Both parties signed
    → Triggers: deposit request, Google Drive folder creation, show added to calendar
    ↓
DEPOSIT_REQUESTED
    → Deposit amount and due date set per contract
    → AI tracks: overdue alerts at due date + 1 day, + 3 days, + 7 days
    ↓
DEPOSIT_RECEIVED
    → Payment logged with date and method
    → Show fully confirmed — enters marketing pipeline
    ↓
ANNOUNCED
    → Public announcement posted
    → Enters Touring Phase System (Module 9): ANNOUNCEMENT phase
    → Content generation triggers
    ↓
ON_SALE
    → Tickets live
    → AI tracks ticket velocity if data available
    → Shazam Spike campaign auto-scheduled
    ↓
FINAL_PUSH
    → Auto-triggered 7-10 days before show
    → Daily content generation
    → Maximum ad spend
    ↓
SHOW_DAY
    → Day-of content: BTS, game day, "TONIGHT" posts
    → Advance sheet finalized
    ↓
COMPLETED
    → Post-show: recap content generated
    → Promoter grading questions triggered (Module 6)
    → Venue grading questions triggered
    ↓
SETTLEMENT
    → Final payment tracking
    → Commission calculation (Module 7)
    → Settlement sheet generated
    ↓
CLOSED
    → All payments received and logged
    → Show archived with full data for market intelligence
```

## Show Offer Required Fields (Hard Gate)

An offer does NOT enter the manager's review queue unless ALL of these fields are present. The AI agent rejects incomplete submissions and tells the submitter exactly what's missing.

| # | Field | Required | Notes |
|---|---|---|---|
| 1 | Show Date | ✅ | Must be a future date |
| 2 | Gig Type | ✅ | Headline / Support / Festival / Other |
| 3 | Venue Name | ✅ | "TBD" is NOT accepted at intake |
| 4 | Venue City + State | ✅ | |
| 5 | Venue Capacity | ✅ | Needed for CPT calculation |
| 6 | Guarantee ($) | ✅ | Dollar amount |
| 7 | Deposit Amount ($) | ✅ | |
| 8 | Deposit Due Date | ✅ | |
| 9 | Final Payment Due Date | ✅ | |
| 10 | Venue/Promoter Support Budget ($) | ✅ | What promoter spends on supports |
| 11 | Marketing Budget ($) | ✅ | Must itemize: digital ads / creative / street team |
| 12 | Other Artists on the Bill | ✅ | Support lineup |
| 13 | Promoter Name + Email + Phone | ✅ | All three required |
| 14 | Agent Who Originated Offer | ✅ | For commission tracking |

If a field is missing, the AI responds: "This offer is missing [field]. Please provide it before I can add it to the review queue."

## Contract Types

The AI must understand these deal structures to give accurate financial advice:

| Type | Description | Example | How AI Calculates |
|---|---|---|---|
| Flat | Fixed guarantee regardless of ticket sales | $2,000 flat | Payout = guarantee - commissions |
| VS | Guarantee vs percentage of net (whichever is higher) | $1,500 vs 90% NET | Payout = MAX(guarantee, net_revenue × 0.90) - commissions |
| Bonus | Flat guarantee + bonus after ticket threshold | $1,600 + bonus after 200 sold | Payout = guarantee + (if tickets > threshold: bonus_amount) - commissions |

## Google Drive Folder Auto-Creation

When a show reaches CONTRACT_SIGNED state, the system creates a folder using this structure:

```
[MM.DD.YYYY] [City, State] - [Venue Name]/
    00_CONTROL/
        - Original offer email
        - Negotiation thread
        - Approval record
        - Competition report
        - Deal summary
    01_CONTRACT_&_PAYMENT/
        - Unsigned contract
        - Signed contract
        - Deposit confirmation
        - Final payment confirmation
        - Settlement sheet
    02_ADVANCE_&_LOGISTICS/
        - Advance sheet
        - Hotel confirmation
        - Ground transport confirmation
        - Rider confirmation
        - Tech rider confirmation
    03_TRAVEL/
        - Travel party list
        - Flight confirmations
        - Hotel confirmations
    04_MARKETING/
        - Ad copy (dark ads)
        - Approved content/tracks
        - Marketing spend tracker
        - FB event link
        - Post-show report
    05_TICKETS/
        - Ticket count tracker
        - Giveaway ticket log
    06_SHOW_ASSETS/
        - Rider PDF
        - Approved setlist
        - Press photo + bio
```

---

# MODULE 6: BOOKING DECISION ENGINE

## Show Offer Decision Tree

When an artist or manager receives a show offer, the AI agent runs this logic:

```
INPUT: Offer amount, city, venue, date, promoter name, capacity, marketing budget
    ↓
STEP 1: FLOOR CHECK
    Is offer ≥ artist's minimum guarantee (from onboarding)?
    ├── NO → "This offer is below your floor of $[X]. Decline or counter at $[floor + 25%]."
    └── YES → Continue
    ↓
STEP 2: MARKET CHECK
    Has artist played this city before?
    ├── YES → What was the previous guarantee?
    │   ├── New offer < previous → "You're being offered less than last time ($[prev]). Counter at $[prev + 10%]."
    │   └── New offer ≥ previous → PASS
    └── NO → "New market. Consider accepting at a lower rate to build the market, but not below your floor."
    ↓
STEP 3: COST-PER-TICKET ANALYSIS
    CPT = (artist ad spend + estimated travel) / expected attendance
    ├── CPT > $5.00 → "This show will lose money. Need higher guarantee or promoter marketing commitment."
    ├── CPT $3.00-$5.00 → "Marginal. Only profitable if promoter covers marketing. Add marketing clause."
    └── CPT < $3.00 → "Good deal. Profitable show."
    ↓
STEP 4: CALENDAR CHECK
    Is there another show within 3 days / 300 miles?
    ├── YES → "Route opportunity. Book both shows to split travel costs."
    └── NO → Is this a standalone fly date?
         ├── Standalone + offer < $2,000 → "Standalone fly date under $2K. Ask for travel buyout or hotel."
         └── Otherwise → PASS
    ↓
STEP 5: PROMOTER CHECK
    Is this promoter in the database?
    ├── YES → Pull promoter grade (A/B/C/D/F)
    │   ├── Grade D or F → "Poor track record. Require 100% deposit upfront."
    │   └── Grade A-C → PASS
    └── NO → "Unknown promoter. Require 50% deposit. Research them before signing."
    ↓
STEP 6: MARKETING BUDGET CHECK
    Did the offer include itemized marketing budget?
    ├── NO → "Missing marketing breakdown. Request: digital ads / creative / street team split."
    └── YES → Is digital ad budget ≥ $150?
         ├── NO → "Promoter marketing budget is light. Add marketing commitment clause to contract."
         └── YES → PASS
    ↓
FINAL OUTPUT: ACCEPT / COUNTER (with specific $ and terms) / DECLINE (with reason)
```

## Counter-Offer Formula

When the AI recommends a counter:

```
Counter Amount = MAX of:
    1. Artist's minimum floor + 25%
    2. Previous guarantee in same market + 10%
    3. Offer amount + (estimated travel cost / 2)
    4. CPT-adjusted minimum: (target CPT × expected attendance) + ad budget

ALWAYS ask for:
    - 50% deposit (100% for C/D grade or first-time promoters)
    - Green room with water/snacks minimum
    - Sound check time specified in contract
    - Marketing commitment clause (promoter spends $X minimum on digital ads)

ASK FOR WHEN APPLICABLE:
    - Hotel buyout (standalone fly dates or 3+ hour drives)
    - Travel buyout (flights over $300)
    - Meal buyout ($25-50/person)
    - Plus-one guest list spots
```

## Promoter Grading System

Every promoter interaction is tracked. Grade auto-calculates after each show.

| Grade | Criteria | AI Agent Behavior |
|---|---|---|
| A | Paid on time, marketed well, venue good, attendance met expectations, professional comms | Auto-approve future offers |
| B | Mostly good, minor issues (slight payment delay, mediocre marketing) | Accept but flag previous issues |
| C | Mixed — some shows good, some had issues. Inconsistent | Require 50% deposit, add marketing clause |
| D | Late payments, poor marketing, oversold/undersold, bad communication | Require 100% deposit, strict terms |
| F | Didn't pay, cancelled without notice, unsafe conditions, fraud | Blacklist. Agent refuses to engage. |

### Post-Show Grading Questions (auto-triggered after show date)

1. Did the promoter pay the full guarantee? (yes / partial / no)
2. Was payment on time? (yes / late — how late?)
3. Promoter's marketing effort? (1-5 scale)
4. Approximate attendance vs capacity? (percentage)
5. Any issues? (free text — stored permanently)

### Grading Inputs (auto-calculated)

- Paid deposit on time (yes/no)
- Paid final payment on time (yes/no)
- Delivered on marketing commitment (yes/no)
- Created FB event (yes/no)
- Rider fulfilled (full/partial/no)
- Turnout vs projection (percentage)
- Green room delivered (yes/no)
- Would rebook (yes/no)

**ACCESS: Promoter grades are PRIVATE — visible only to Manager (Tier 2) and Label (Tier 3). NEVER shown to Tier 1 artists. The AI can adjust its advice based on grades without revealing them.**

## Venue Grading System (Separate from Promoter)

| Input | Scale |
|---|---|
| Production quality (sound, lights, stage) | 1-5 |
| Sound system quality | 1-5 |
| Green room quality | 1-5 |
| Hospitality delivery | 1-5 |
| Capacity vs actual turnout | percentage |
| Location / market value | 1-5 |
| Would return | yes/no |

Venue grade is calculated from these inputs. Venue grades persist across promoters — a venue can be great even if a promoter is bad.

---

# MODULE 7: FINANCIAL ENGINE

## Commission Structure

Standard split (configurable per user during onboarding):

```
Manager Commission: 10% of guarantee
Booking Agent Commission: 10% of guarantee
Artist Payout: guarantee - manager commission - agent commission

Example: $2,500 guarantee
    Manager (Thomas): $250
    Agent (Andrew/AB Touring): $250
    Artist (DirtySnatcha/Lee Bray): $2,000
```

Every offer is tagged with the originating agent for commission tracking:
- Andrew (AB Touring) — current primary booking agent
- Colton (PRYSM) — legacy agent, still commissionable on shows he books
- Thomas (Direct) — manager-sourced, no agent commission
- Direct (Inbound) — artist/label received offer directly

## Per-Show Financial Tracking

```json
{
  "show_id": "uuid",
  "guarantee": 2500,
  "contract_type": "flat | vs | bonus",
  "vs_percentage": 0.90,
  "bonus_threshold": 200,
  "bonus_amount": 500,
  "deposit_amount": 1250,
  "deposit_due_date": "2026-02-14",
  "deposit_status": "pending | received | overdue | partial",
  "deposit_received_date": "date | null",
  "deposit_method": "zelle | wire | check | cash",
  "deposit_partial_amount": 0,
  "final_payment_due": "night_of_show",
  "final_payment_status": "pending | received | overdue | partial",
  "final_payment_received_date": "date | null",
  "merch_split": "80/20 | 90/10",
  "marketing_budget_digital": 200,
  "marketing_budget_creative": 100,
  "marketing_budget_street": 50,
  "cost_per_ticket": 0,
  "agent_name": "Andrew",
  "agent_commission_rate": 0.10,
  "agent_commission_amount": 250,
  "mgmt_commission_rate": 0.10,
  "mgmt_commission_amount": 250,
  "artist_payout": 2000
}
```

## Payment Tracking Rules

1. **Deposit overdue** → auto-alert to manager + AI drafts follow-up email to promoter
2. **Deposit overdue 3+ days** → escalation alert, AI recommends withholding announcement
3. **Deposit overdue 7+ days** → AI recommends cancellation or 100% upfront payment
4. **Final payment overdue** → escalation alert, AI drafts strong follow-up
5. All payments logged with: date received, method, partial amount if applicable
6. Running balance maintained per show

## Cost-Per-Ticket Calculation

```
CPT = (artist_ad_spend + travel_cost) / tickets_sold

Target CPT by market tier:
    Tier 1 market (Denver, Seattle): < $2.00
    Tier 2 market (Tampa, Pittsburgh): < $3.00
    Tier 3 market (Covington, Spokane): < $4.00
    New market (first time playing): < $5.00

If CPT exceeds target → AI flags show as underperforming and recommends:
    1. Reduce ad spend and shift to organic push
    2. Request additional promoter marketing commitment
    3. Accept the loss as market investment (new markets only)
```

## Settlement Sheet Generation

After show COMPLETED + final payment received, AI generates:

```
SHOW SETTLEMENT — {artist_name} @ {venue} — {date}

Guarantee: ${guarantee}
Contract Type: {flat/vs/bonus}
Deposit Received: ${deposit_amount} on {date} via {method}
Final Payment: ${final_amount} on {date} via {method}
Total Received: ${total}

Commissions:
    Agent ({agent_name}): ${agent_commission} ({rate}%)
    Management: ${mgmt_commission} ({rate}%)

Artist Payout: ${artist_payout}

Merch:
    Gross Sales: ${merch_gross}
    Venue Cut ({split}): ${venue_merch_cut}
    Artist Merch Net: ${artist_merch_net}

Marketing Spend (DSR side):
    Shazam Spike: ${shazam_spend}
    Save Campaign: ${save_spend}
    Retargeting: ${retargeting_spend}
    Total DSR Ad Spend: ${total_ad_spend}

Net Profit: ${artist_payout + artist_merch_net - total_ad_spend - travel_cost}
CPT: ${cost_per_ticket}

Promoter Grade: {A/B/C/D/F}
Venue Grade: {A/B/C/D/F}
Would Rebook: {yes/no}
Notes: {free text}
```

## Tour-Wide Financial Dashboard

For Manager/Label tiers, the AI can generate a tour-wide summary:

```
TOUR FINANCIAL SUMMARY — {tour_name}

Total Shows: {count}
Total Guaranteed Income: ${sum}
Total Received (deposits + finals): ${received}
Total Outstanding: ${outstanding}
Total Commissions (agent): ${agent_total}
Total Commissions (management): ${mgmt_total}
Total Artist Payouts: ${artist_total}
Total Marketing Spend (DSR side): ${marketing_total}
Average CPT: ${avg_cpt}
Shows with Overdue Deposits: {count}
Shows with Overdue Finals: {count}
```

---

*End of Part 2 — Booking & Money*
