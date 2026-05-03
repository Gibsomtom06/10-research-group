# WRS Rim Shop — Agency Pilot Log
**Last updated:** 2026-05-03
**Status:** STALLED — signature-ready since 2026-04-22, no verbal had

---

## What this is

Client 0 for the TENx10 agency offering. WRS = Wheel Repair Specialists of Michigan. Performance-share model: no upfront retainer, flat $ per booked appointment attributed to TENx10 channels. 90-day pilot.

Proving this model with one trades business = the case study that opens Client 1 conversations.

---

## Assets ready (all in `products/rim-shop/`)

| Asset | File | Status |
|---|---|---|
| SOW (1-page contract) | `SOW_v1.md` | Ready to send after verbal |
| Pilot brief | `PILOT_BRIEF.md` | Ready to share |
| GMC feed generator | `gmc-feed/inventory_to_feed.py` | Ready — needs WRS inventory CSV |
| Google Ads campaign | `google-ads/CAMPAIGN_PLAN.md` + `keywords.csv` | Ready |
| Abandoned cart email sequence | `email-sequences/ABANDONED_CART.md` | Ready |
| Chatbot system prompt | `chatbot/SYSTEM_PROMPT.md` | Ready |

---

## Decision log

| Date | Event | Outcome |
|---|---|---|
| 2026-04-22 | All assets declared "signature-ready" | No movement since |
| 2026-05-03 | Audit identifies 11-day stall | Next action: verbal with owner |

---

## Contact info

| Role | Name | Contact |
|---|---|---|
| WRS owner | [Name] | [Phone] |
| Shop main line | — | [Number] |

---

## Verbal call — talking points

**Open:**
> "Hey [Name], Thomas Nalian. Got a minute? Wanted to walk you through what I put together — figured easier on the phone, then I'll send the paper version after."

**Frame (no jargon, 45 seconds):**
> "Short version — I get your shop in front of people actively Googling for wheel repair in your radius, with a chatbot that answers their questions before they even call. No upfront retainer. I make money when you make money — flat $ per booked appointment that came through me. Zero bookings, you owe nothing."

**The number:**
> "I'm thinking [$X] per confirmed appointment. We track it with a dedicated phone number and a unique landing page so there's zero ambiguity."

**Pilot:**
> "90-day pilot. End of pilot we both look at the numbers. If it's working, we keep going. If not, we shut it down clean — no recurring contract."

**Then shut up.**

---

## Per-appointment rate math

Fill before calling:

| Input | Value |
|---|---|
| WRS avg ticket size | $ |
| Target % as CAC | 13–20% |
| **Target per-appointment rate** | **$** |
| Breakeven rate (min viable) | $ |

---

## Call outcome

| Field | Value |
|---|---|
| Date of call | |
| Outcome (YES / MAYBE / NO) | |
| Their concern (if any) | |
| Follow-up committed to | |
| SOW sent (y/n + timestamp) | |

---

## YES signal responses

| Signal | What to do |
|---|---|
| "How does the tracking work?" | Explain dedicated phone number + unique landing page — zero attribution ambiguity |
| "What do you need from me?" | "Just Google Ads account access, inventory CSV, and we go" |
| "Send it over" | Send SOW within 60 minutes. Subject: `Wheel Repair Specialists — SOW (per our call)` |

## NO signal responses

| Signal | What to do |
|---|---|
| "I don't do contracts" | Offer 30-day handshake trial, paper at day 30 |
| "Need to talk to partner/accountant" | Pin callback date THIS WEEK. Not "soon." |
| "Not sure I have the volume" | Drop rate or cap monthly liability |

---

## SOW send protocol (if verbal YES)

1. Open `SOW_v1.md`
2. Fill: owner name, per-appointment rate agreed verbally, start date
3. Export to PDF → filename: `WRS-SOW-YYYY-MM-DD.pdf`
4. Email subject: `Wheel Repair Specialists — SOW (per our call)`
5. Body (4 lines max):
   > Per our conversation, attached is the SOW for the 90-day pilot. Numbers reflect what we discussed. If it reads right, sign and send back. Any questions, call my cell. — Thomas
6. Send. Log timestamp below.

---

## Execution timeline (after signed SOW)

| Task | ETA | Status |
|---|---|---|
| Set up dedicated tracking phone number (CallRail or similar) | Day 1-2 | |
| Deploy unique landing page for WRS | Day 1-2 | |
| Submit GMC feed (run `inventory_to_feed.py` against real inventory CSV) | Day 2-3 | |
| Load `keywords.csv` into Google Ads, launch Local campaign at $30/day | Day 3 | |
| Deploy chatbot system prompt | Day 3 | |
| First booked appointment tracked | TBD | |

---

## Performance tracking (post-launch)

| Week | Attributed leads | Booked appointments | Revenue to WRS | Thomas fee |
|---|---|---|---|---|
| Week 1 | | | | |
| Week 2 | | | | |
| Week 3 | | | | |
| Week 4 | | | | |

---

## 30-day checkpoint (mid-pilot review)

- Leads generated:
- Appointments booked:
- Revenue attributed:
- Thomas fee earned:
- WRS owner's sentiment:
- Decision: continue / expand / adjust / exit?

---

## 90-day retrospective

- Total booked appointments:
- Total attributed revenue to WRS:
- Thomas net:
- Case study usable (y/n):
- Lessons for Client 1:

---

*Created 2026-05-03 from audit action plan. Update after every meaningful event.*
