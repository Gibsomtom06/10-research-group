# GMAIL & EMAIL SYSTEM
## Module 21: Inbox Intelligence + Label Schema + Filter Routing + Multi-Artist Parsing
### Last Updated: April 2026 | Engine: Gemini (execute) + Claude (classify/prioritize)

---

## WHY THIS EXISTS

Critical emails were sitting unread for days:
- SiriusXM BPM VP (geronimo@siriusxm.com) sat 29 days with no response — music submission never sent
- Houston artwork approval missed with no notification
- 3 unsent drafts to Colton (Butte rider, Pittsburgh follow-up) found in session audit
- Michigan LLC filing sitting unread
- SoundExchange dispute thread unresolved
- WHOiSEE EP (Circus Records) thread needing response

This module exists so nothing sits. Every email that matters gets labeled, prioritized, and surfaced. Everything else gets archived automatically.

---

## GMAIL LABEL SCHEMA

10 labels with emoji prefixes for instant visual triage:

| Label | Purpose | Who Applies It |
|---|---|---|
| TENx10/🔴 Urgent | Action required TODAY. Offers expiring, deposits overdue, show <7 days with missing info, VIP contacts | Auto + manual |
| TENx10/🟡 This Week | Action needed this week but not today | Auto + manual |
| TENx10/💰 Financial | Deposits, payments, settlements, royalty statements, invoices | Auto |
| TENx10/📄 Contracts | Offers, contracts, riders, signed docs | Auto |
| TENx10/🎤 DirtySnatcha | All DS show/booking/marketing/advance threads | Auto |
| TENx10/🎵 WHOiSEE | All WHOiSEE threads | Auto |
| TENx10/🏷️ Label Operations | DSR label business, VMG, SoundExchange, LLC filings | Auto |
| TENx10/🤝 Collabs & A&R | Demo submissions, collab threads, split sheets, SiriusXM | Auto |
| TENx10/🛠️ SaaS Build | Platform development, tech threads | Manual |
| TENx10/⬜ Archive | Auto-archived noise — promos, newsletters, OTPs | Auto |

---

## AUTO-CLASSIFICATION RULES

### Priority & Artist Routing

| Trigger | Label(s) | Alert Level | Notes |
|---|---|---|---|
| from: andrew@abtouring.com | 🎤 DirtySnatcha + 📄 Contracts | 🔴 if subject = offer | Andrew is DS primary agent |
| from: colton@prysmtalentagency.com | 🎤 DirtySnatcha + 📄 Contracts | 🔴 if subject = offer | Colton is DS legacy agent |
| from: alyssa@prysmtalentagency.com | 🎤 DirtySnatcha | 🟡 | PRYSM support contact |
| from: Corson Agency (any @corsonagency domain) | 🎵 WHOiSEE | 🔴 if subject = offer | WHOiSEE's booking agent |
| from: known promoter/venue + DS context | 🎤 DirtySnatcha | 🟡 | |
| from: known promoter/venue + WHOiSEE context | 🎵 WHOiSEE | 🟡 | |
| from: geronimo@siriusxm.com | 🔴 Urgent + 🤝 Collabs & A&R | 🔴 always | SiriusXM BPM — VIP, never sits |
| from: emily.doherty@siriusxm.com | 🔴 Urgent + 🤝 Collabs & A&R | 🔴 always | SiriusXM BPM secondary |
| from: VMG / assets@virginmusic | 🏷️ Label Operations | 🟡 | Distribution notices |
| from: noreply@event.eventbrite.com | 🎤 DirtySnatcha | Auto-parse | Eventbrite ticket updates → tour grid |

### Subject Line Classification

| Subject Contains | Label | Alert Level | Notes |
|---|---|---|---|
| offer / booking / hold / guarantee | 📄 Contracts + 🔴 Urgent | 🔴 | Triggers booking evaluator auto-run |
| contract / agreement / sign | 📄 Contracts | 🔴 | |
| deposit / payment / invoice / receipt / settlement | 💰 Financial | 🔴 if overdue | |
| artwork / approval / flyer / graphic / announce / billing | 🎤 DirtySnatcha | 🔴 regardless of TO/CC | Houston incident — artwork approvals missed because CC'd |
| advance / rider / day of show / ROS / run of show | 🎤 DirtySnatcha or 🎵 WHOiSEE | 🟡 | Route by artist context |
| demo / submission / collab / split sheet | 🤝 Collabs & A&R | 🟡 | |
| re: [existing show thread] | Same label as original thread | Inherit from thread | |

### Auto-Archive Rules (No Human Review Needed)

| Pattern | Action |
|---|---|
| CATEGORY_PROMOTIONS + sender not in contacts | ⬜ Archive immediately |
| Calendly reminders for past dates | ⬜ Archive immediately |
| Login codes / OTPs / 2FA | ⬜ Archive immediately |
| Newsletter / webinar / promo from non-industry sender | ⬜ Archive immediately |
| Unsubscribe-eligible marketing (CAN-SPAM header) + unknown sender | ⬜ Archive immediately |

---

## CRITICAL RULES

### Copro Contract Rule
Two signatories required on any co-promotion contract. Thread stays 🔴 Urgent until BOTH are confirmed signed. Agent saying "all set" does NOT close the alert. System watches for two distinct confirmation signals (two separate replies or one reply with both names confirmed).

### Watched Thread Queue
Thread flagged as "watched" (Thomas has seen it, not acting yet) → moves to monitored queue. Visible in dashboard but removed from urgent tray. Watched threads resurface as 🔴 if no action after 48 hours.

### Draft Staleness Rule
Any draft sitting in Gmail for >48 hours without being sent → flagged in daily briefing. Prevents forgotten replies.

### VIP Contact Rule
Contacts in the VIP list are ALWAYS 🔴 Urgent regardless of subject, CC/TO position, or time of day. Never sits unread. Briefing surfaces same-day.

**VIP Contact List:**
| Name | Email | Context |
|---|---|---|
| Geronimo | geronimo@siriusxm.com | SiriusXM BPM — music submissions + live set + interview |
| Emily Doherty | emily.doherty@siriusxm.com | SiriusXM BPM secondary |
| *(add as needed)* | | |

### Artwork/Approval Rule
Any email containing "artwork", "approval", "flyer", "graphic", "billing", or "announce" gets 🔴 immediately — regardless of whether Thomas is on TO or CC. Houston show approval was missed because Thomas was CC'd and it didn't surface. This rule exists to prevent that.

---

## OFFER PARSING — AUTO-DETECTION LOGIC

When an email is classified as an offer (subject contains: offer/booking/hold/guarantee OR from known agent), the system runs the booking evaluator automatically.

### Fields to Extract from Offer Email
```
artist: [DS / WHOiSEE / other]
date: [show date or date window]
venue: [venue name]
city: [city, state]
capacity: [venue cap if mentioned]
guarantee: [$X]
deal_type: [flat / VS / bonus / door split]
deposit_terms: [X% on signing, balance X days before]
hotel_included: [yes / no / not mentioned]
flights_included: [yes / no / not mentioned]
radius_clause: [mentioned / not mentioned]
promoter_name: [name]
promoter_email: [email]
agent: [Andrew / Colton / direct]
```

### Parsed Output → Booking Evaluator
Extracted fields are passed directly to Module 6 (Booking Decision Engine). Output: Accept / Counter / Decline with specific counter terms and reasoning. Draft reply attached.

---

## EVENTBRITE AUTO-PARSE

**Trigger:** Email from noreply@event.eventbrite.com

**Parse logic:**
- Extract: event name, ticket count, date
- Match event to show in `shows` table by date + city
- Update `shows.ticket_count` field
- Calculate capacity fill rate: `(ticket_count / venue_cap) * 100`
- If fill rate < 10% AND show > 30 days out → 🔴 Alert: low ticket velocity
- If fill rate < 25% AND show < 14 days out → 🔴 Alert: escalate marketing
- Log to `email_threads` table with parse status

---

## MULTI-ARTIST ROUTING

Thomas manages both DirtySnatcha and WHOiSEE from the same inbox. Routing logic:

| Signal | Route To |
|---|---|
| from: Andrew / Colton / PRYSM | 🎤 DirtySnatcha |
| from: Corson Agency | 🎵 WHOiSEE |
| subject contains "DirtySnatcha" or "Leigh" or "Lee" or "DSR" | 🎤 DirtySnatcha |
| subject contains "WHOiSEE" or "Brett" | 🎵 WHOiSEE |
| from: Kannibalen Records | 🎵 WHOiSEE (Brett's label for Get Down / Magic) |
| from: Circus Records | 🎵 WHOiSEE |
| from: VMG / Virgin Music | 🏷️ Label Operations (affects DSR catalog) |
| from: eventbrite + DS show name | 🎤 DirtySnatcha |
| from: eventbrite + WHOiSEE show name | 🎵 WHOiSEE |
| ambiguous promoter email — no artist named | Apply to most recent active thread with that promoter |

---

## DAILY INBOX INTEGRATION

The daily briefing scans Gmail for 5 action types:

1. **New emails from known agents** — offer detection, last 24h
2. **Overdue deposit threads** — 💰 Financial label + no resolution keyword + >7 days since last reply
3. **Unanswered promoter emails** — any 🎤 or 🎵 thread with Thomas as last reply recipient, >48h no response
4. **Contract threads pending signature** — 📄 Contracts without "signed" or "executed" keyword
5. **Drafts >48h old** — any draft in Gmail not yet sent

Top 3 most urgent items surface in the 🔴 URGENT section of the briefing. Remaining items in 🟡 THIS WEEK.

---

## MUSIC SUBMISSION WORKFLOW

**Trigger:** Inbound from media/radio/DSP contact OR outbound pitch

**Rules (established from SiriusXM submission):**
- SoundCloud playlist = one link, press play. Not multiple links.
- Include: released tracks + unreleased (if cleared by label)
- Label collabs as "Artist x Artist" not "ft." — signals equal collab, not feature
- Offer broadcast WAVs on request — do NOT attach cold
- Follow-up: 5 business days if no response
- VIP contacts (Geronimo, Emily) never wait 5 days — surface same day if no reply in 48h

**Submission sent March 3, 2026:** DirtySnatcha + WHOiSEE + Dark Matter → Geronimo @ SiriusXM BPM. Live set + interview committed. 5-day follow-up trigger set.

---

## EMAIL DRAFTING WORKFLOW

```
TRIGGER (offer received / advance needed / promoter follow-up)
         ↓
CLAUDE — Draft Engine
  - Selects correct template from Module 18
  - Injects real data: artist name, show date, city, guarantee, contacts
  - Applies artist voice profile (Module 11)
  - Checks deal inclusions: hotel / ground / rider / flights
  - Removes sections not applicable to this deal
  - Generates draft
         ↓
GEMINI — Gmail Execution
  - Saves draft via gmail.saveDraft()
  - Tags with correct TENx10 label
  - Logs to email_threads table in Supabase
         ↓
THOMAS — Reviews + Sends
  - Reviews draft in Gmail
  - Edits if needed
  - Sends manually
         ↓
SYSTEM — Confirmation
  - gmail.confirmSent() called after Thomas sends
  - email_threads.status updated to 'sent'
  - Timestamp logged
```

**THE AI NEVER SENDS EMAILS. IT ONLY DRAFTS. THOMAS SENDS.**

---

## GMAIL CLIENT FUNCTIONS (Supabase + Gemini Layer)

| Function | What It Does |
|---|---|
| `gmail.saveDraft(to, cc, subject, body, label)` | Creates draft in Gmail with correct label applied |
| `gmail.listByArtist(artist_id)` | Returns all threads labeled for a specific artist |
| `gmail.listAll()` | Returns all TENx10-labeled threads, sorted by priority |
| `gmail.approveDraft(draft_id)` | Marks draft as approved-for-send in Supabase (Thomas approval signal) |
| `gmail.confirmSent(thread_id)` | Updates thread status to sent after Thomas sends |
| `gmail.buildPromoterEmail(show_id, type)` | Assembles correct template for show_id: advance / follow-up / deposit / settlement |
| `gmail.subscribe(filter_rules)` | Registers new classification rule in inbox_rules table |

---

## SUPABASE SCHEMA — EMAIL TABLES

### email_threads
```json
{
  "thread_id": "gmail_thread_id",
  "artist_id": "uuid",
  "show_id": "uuid or null",
  "label": "TENx10/🔴 Urgent",
  "subject": "string",
  "from": "email",
  "last_reply_at": "timestamp",
  "status": "unread | watched | actioned | archived",
  "classification": "offer | advance | ticket_count | contract | deposit | collab | media | label | noise",
  "parsed_fields": "jsonb",
  "draft_id": "gmail_draft_id or null",
  "draft_sent_at": "timestamp or null"
}
```

### gmail_outbox
```json
{
  "id": "uuid",
  "thread_id": "gmail_thread_id or null",
  "artist_id": "uuid",
  "show_id": "uuid or null",
  "type": "advance | follow-up | deposit | settlement | offer-reply | collab",
  "draft_body": "text",
  "draft_created_at": "timestamp",
  "approved_by": "user_id or null",
  "sent_at": "timestamp or null",
  "status": "draft | approved | sent | expired"
}
```

### inbox_rules
```json
{
  "id": "uuid",
  "rule_type": "sender | subject | pattern",
  "match_value": "string (email, keyword, regex)",
  "target_label": "TENx10/🔴 Urgent",
  "alert_level": "red | yellow | green | archive",
  "artist_id": "uuid or null",
  "auto_action": "string or null",
  "active": "boolean"
}
```

---

## RETROACTIVE INBOX CLEANUP (One-Time Setup)

When first connecting Gmail, run a retroactive audit:

1. Search: `from:(andrew@abtouring.com OR colton@prysmtalentagency.com)` → apply 📄 Contracts label, sort by date
2. Search: `subject:(offer OR guarantee OR deposit OR settlement)` → apply 💰/📄 labels
3. Search: `from:noreply@event.eventbrite.com` → parse all, update tour grid ticket counts
4. Search: `from:(geronimo@siriusxm.com OR emily.doherty@siriusxm.com)` → apply 🔴 Urgent, flag all unresolved
5. Search: `in:drafts older_than:2d` → flag all stale drafts for review
6. Apply archive label to all CATEGORY_PROMOTIONS emails not from known contacts

---

*Gmail & Email System v2.0 — April 2026 | Module 21 | TENx10 Platform*
