# Gmail Inbox Intelligence — Design Spec
**Date:** April 21, 2026
**Product:** TENx10 / DAD (standalone + integrated)
**Scope:** Google OAuth, one-time deep clean, ongoing auto-labeling, thread archiving, daily briefing integration

---

## Problem

Thomas manages 3 active business inboxes and 2 personal inboxes from a single Gmail account (`thomas@dirtysnatcharecords.com`, which also receives `thomas@dirtysnatcha.com`). The inbox has years of accumulated mess: inconsistent labels, broken filters, old promoter threads, royalty emails, booking offers, and fan submissions all mixed together. Old labels (AMOS/*, GIGWELL/*, BIBLE_*, etc.) are obsolete. No ongoing system keeps new emails organized. Critical emails have been missed as a result (29-day SiriusXM thread, Houston artwork approval, 3 unsent drafts).

The same problem exists for every TENx10/DAD user connecting their inbox.

---

## Inboxes in Scope

### Thomas's Inboxes (Priority Order)
| Account | Entity | Phase |
|---|---|---|
| `thomas@dirtysnatcharecords.com` | DSR + Artist Management hub (also receives dirtysnatcha.com) | Phase 1 — build first |
| `thomasevan.nalian@gmail.com` | Personal | Phase 2 |
| `tom@myhydrationpack.com` | MyHydrationPack (merch company) | Phase 3 |
| `tom@trelliswork.com` | Trelliswork (passive/training) | Phase 4 |
| `10researchgroup@gmail.com` | 10 Research Group LLC | Phase 4 |

### Retire / Leave Alone
| Account | Action |
|---|---|
| `thomasnalian@gmail.com` | Migrate Alibaba login → retire |
| `slashgnr06@hotmail.com` | Service logins only (Microsoft, Amazon, Apple) — leave running, don't consolidate |
| `tnalianphotos@gmail.com` | Drive archive only — leave alone |

### Long-Term Hub
`thomas@tenx10.co` on Google Workspace — all active inboxes forward here once tenx10.co is live.

---

## Label Structure

### `thomas@dirtysnatcharecords.com`

```
📁 Status
    🔴 Urgent
    🟡 This Week
    👀 Watching

📁 Artists
    🎤 DirtySnatcha
    🎵 WHOiSEE
    🎧 Kotrax
    🎶 HVRCRFT
    🌑 Dark Matter

📁 Deals
    🎯 Offers
    📄 Contracts
    💰 Financial

📁 DSR
    🏷️ Label Ops
    🤝 Collabs & A&R
    🎵 Publishing & Royalties   ← MLC, SoundExchange, BMI/ASCAP, sync
    🎙️ Demo Submissions         ← release requests, A&R inquiries
    📚 History & Past Deals     ← old shows, settled contracts (archived)

📁 TENx10
    🛠️ SaaS Build

📁 Triage
    📥 Needs Review
    ⬜ Archive
```

### `thomasevan.nalian@gmail.com`

```
📁 Status
    🔴 Urgent
    🟡 This Week

📁 Personal
    🏠 Home & Family
    💳 Finance
    🛒 Shopping & Orders
    🔐 Accounts & Logins
    📋 Admin & Legal

📁 Triage
    📥 Needs Review
    ⬜ Archive
```

### `tom@myhydrationpack.com`

```
📁 Status
    🔴 Urgent
    🟡 This Week

📁 Business
    💰 Financial
    🖨️ Print & Production
    📦 Orders
    🚚 Shipping & Returns
    🤝 Vendors & Suppliers
    👥 Customers
    📄 Contracts

📁 Triage
    📥 Needs Review
    ⬜ Archive
```

---

## Auto-Labeling Rules — `dirtysnatcharecords.com`

### Pass 1: Known Senders (covers ~80% of inbox)

| Sender | Labels Applied | Alert |
|---|---|---|
| andrew@abtouring.com | 🎯 Offers + 🎤 DirtySnatcha | 🔴 if subject = offer |
| colton@prysmtalentagency.com | 🎯 Offers + 🎤 DirtySnatcha | 🔴 if subject = offer |
| alyssa@prysmtalentagency.com | 🎤 DirtySnatcha | 🟡 |
| @corsonagency.com (any) | 🎯 Offers + 🎵 WHOiSEE | 🔴 if subject = offer |
| geronimo@siriusxm.com | 🔴 Urgent + 🤝 Collabs & A&R | 🔴 always (VIP) |
| emily.doherty@siriusxm.com | 🔴 Urgent + 🤝 Collabs & A&R | 🔴 always (VIP) |
| @virginmusic / assets@virginmusic | 🏷️ Label Ops | 🟡 |
| noreply@event.eventbrite.com | 🎤 or 🎵 (matched by event name) | auto-parse ticket count |
| @soundexchange.com | 🎵 Publishing & Royalties | 🟡 |
| @themlc.com | 🎵 Publishing & Royalties | 🟡 |
| @bmi.com / @ascap.com | 🎵 Publishing & Royalties | 🟡 |
| Known promoters (in contacts DB) | Artist label + 🟡 This Week | 🟡 |

### Pass 2: Subject-Line Rules

| Subject Contains | Labels | Alert |
|---|---|---|
| offer / booking / hold / guarantee | 🎯 Offers + 📄 Contracts | 🔴 |
| contract / agreement / sign | 📄 Contracts | 🔴 |
| deposit / payment / invoice / settlement | 💰 Financial | 🔴 if overdue |
| artwork / approval / flyer / graphic / billing / announce | Artist label + 🔴 Urgent | 🔴 regardless of TO/CC (Houston rule) |
| advance / rider / day of show / run of show | Artist label | 🟡 |
| demo / submission / collab / split sheet | 🎙️ Demo Submissions | 🟡 |
| royalt / mechanical / performance / sync / license | 🎵 Publishing & Royalties | 🟡 |

### Pass 3: Triage

| Pattern | Action |
|---|---|
| CATEGORY_PROMOTIONS + not in contacts | ⬜ Archive |
| Newsletters with unsubscribe header + unknown sender | ⬜ Archive |
| OTP / 2FA / login codes | ⬜ Archive |
| Calendly reminders for past dates | ⬜ Archive |
| Everything else | 📥 Needs Review |

---

## Critical Rules

### Houston Rule
Any email containing "artwork", "approval", "flyer", "graphic", "billing", or "announce" → 🔴 Urgent immediately, regardless of whether Thomas is in TO or CC. Exists because a Houston show approval was missed when Thomas was CC'd only.

### VIP Contact Rule
Contacts flagged as VIP (Geronimo/SiriusXM, Emily Doherty/SiriusXM) → always 🔴 Urgent, same-day surfacing in briefing. Never sits unread.

### Draft Staleness Rule
Any draft unsent for >48 hours → flagged in daily briefing.

### Copro Contract Rule
Co-promotion contracts require two confirmed signatures. Thread stays 🔴 Urgent until both are confirmed — agent saying "all set" does not close the alert.

### Watched Thread Rule
Thread Thomas has seen but isn't acting on → moves to 👀 Watching. Resurfaces as 🔴 if no action after 48 hours.

---

## One-Time Deep Clean — Order of Operations

```
STEP 1 — Delete old labels
Remove: AMOS/*, OFFERS/*, GIGWELL/*, BIBLE_*,
Artist Management/DirtySnatcha/*, WHOiSEE/Confirmed,
DSR TAKEOVERS/*, DSR Business Files, District/Virgin/*,
Streaming Sites/*, Symphonic, Repost Chain, Approved Tracks
Note: emails lose labels but are NOT deleted

STEP 2 — Delete old filters
Remove all auto-rules pointing to old labels

STEP 3 — Create new labels
Build full new label structure per spec above

STEP 4 — Create new filters
Build sender + subject rules per auto-labeling spec

STEP 5 — Run 3-pass sort on all existing threads
Pass 1: Known senders → labels
Pass 2: Subject rules → labels
Pass 3: Noise → Archive | Unknown → Needs Review

STEP 6 — Stale draft audit
Flag all drafts >48h unsent in briefing

STEP 7 — Ongoing
New emails auto-labeled as they arrive via filter rules
```

---

## Thread Archiving — Keeping History Without Inbox Clutter

Once a deal, show, or submission closes, threads are archived from inbox but remain linked to their record in Supabase:

```
Show closes / deal settles / submission decided
        ↓
Thread linked to Supabase record
├── Show thread → shows table (show_id)
├── Promoter deal → promoters table (promoter_id)
├── Demo submission → submissions table (submission_id)
└── Label business → label_ops record
        ↓
Email archived from inbox (no longer clutters active view)
        ↓
Accessible anytime from the record:
"Show: Pittsburgh 2024 → view email thread"
```

**Promoter/contact history** persists in the CRM (`contacts` + `promoters` tables in Supabase). Every email from a promoter updates their last-contact date and links the thread. Searchable for future outreach.

---

## Tenant Isolation

Every email record tagged with `tenant_id`. RLS enforced at DB level:
- DSR threads invisible to MyHydrationPack tenant
- MyHydrationPack order threads invisible to DSR
- No crossover between any business entities
- Thomas's personal inbox isolated from all business tenants

---

## Daily Briefing Integration

Email surfaces in the morning briefing under:

```
📬 INBOX

🔴 URGENT
- [Sender] Subject → action required
- Draft unsent 3 days → [subject]

🟡 THIS WEEK
- [X] contracts pending signature
- [X] deposit follow-ups overdue
- [X] promoter threads unanswered >48h

📥 NEEDS REVIEW ([X] unsorted emails)
```

Briefing is tenant-scoped — each business sees only their inbox alerts.

---

## Google OAuth — Connection Flow

```
User signs up / logs in to TENx10 or DAD
        ↓
Onboarding: "Connect your Gmail" button
        ↓
Google OAuth popup
Scopes requested:
- gmail.modify (read + label + archive)
- gmail.compose (drafts)
        ↓
Auth token stored in Supabase (encrypted, per tenant)
        ↓
App calls Gmail API directly using stored token
No Claude MCP dependency in production
        ↓
Deep clean runs automatically on first connect
```

Supports any Gmail or Google Workspace account. Works for all tenants on TENx10, DAD, or standalone.

---

## Supabase Tables

### `email_threads`
```json
{
  "thread_id": "gmail_thread_id",
  "tenant_id": "uuid",
  "artist_id": "uuid or null",
  "show_id": "uuid or null",
  "label": "TENx10/🔴 Urgent",
  "subject": "string",
  "from": "email",
  "last_reply_at": "timestamp",
  "status": "unread | watched | actioned | archived",
  "classification": "offer | advance | contract | deposit | collab | media | label | publishing | demo | noise",
  "parsed_fields": "jsonb",
  "draft_id": "gmail_draft_id or null",
  "draft_sent_at": "timestamp or null"
}
```

### `gmail_outbox`
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
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

### `inbox_rules`
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "rule_type": "sender | subject | pattern",
  "match_value": "string",
  "target_label": "string",
  "alert_level": "red | yellow | green | archive | review",
  "artist_id": "uuid or null",
  "auto_action": "string or null",
  "active": "boolean"
}
```

### `google_oauth_tokens`
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "email": "string",
  "access_token": "encrypted text",
  "refresh_token": "encrypted text",
  "token_expiry": "timestamp",
  "scopes": ["gmail.modify", "gmail.compose"],
  "connected_at": "timestamp"
}
```

---

## What Is NOT Built in This Spec

- Google Drive organization (separate DAD brainstorm)
- OneDrive / local file cleanup (separate DAD brainstorm)
- MyHydrationPack and personal inbox deep clean (Phase 2+)
- TikTok, Spotify, Meta, Apple login providers (Phase 2)
- `thomas@tenx10.co` Google Workspace consolidation (when tenx10.co is built)

---

*Gmail Inbox Intelligence Design Spec — April 21, 2026 | TENx10 / DAD*
