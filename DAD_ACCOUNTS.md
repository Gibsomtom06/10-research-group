# DAD — Digital Asset Declutterer: Thomas's Account Map

Recovered from session transcripts 2026-04-24. This file is the canonical account map for DAD.
Do NOT lose this between sessions — it represents 3 sessions of setup work.

---

## The 9 Email Accounts

| # | Email | Business / Purpose |
|---|-------|-------------------|
| 1 | thomasevan.nalian@gmail.com | Personal primary (main Google account) |
| 2 | thomasnalian@gmail.com | Personal secondary / overflow |
| 3 | tnalianphotos@gmail.com | Photography business |
| 4 | thomas@dirtysnatcha.com | DirtySnatcha artist + management (dirtysnatcha.com alias) |
| 5 | whoisdadmusic@gmail.com | WHOisDad music project |
| 6 | tom@myhydrationpack.com | My Hydration Pack (MHP) business |
| 7 | Tom@treliswork.com | Trelis Work business |
| 8 | 10researchgroup@gmail.com | 10 Research Group / TENx10 company |
| 9 | slashgnr06@hotmail.com | Personal Hotmail / OneDrive backup account |

---

## Cloud Storage in Scope

| Service | Account(s) | Notes |
|---------|-----------|-------|
| Google Drive | thomasevan.nalian@gmail.com (primary), + others above | Multiple Drive accounts |
| OneDrive | slashgnr06@hotmail.com | Backup storage |
| Amazon Prime Photos | thomasevan.nalian@gmail.com | Photos + Videos |

---

## Google Services in Scope (per account)
- Gmail — all 9 accounts (7 Gmail + 1 Hotmail + 1 custom domain)
- Google Drive — multiple accounts
- Google Contacts — needs deduplication + cleanup
- Google Calendar — cleanup

---

## Businesses Thomas Runs
| Business | Email(s) | Description |
|----------|---------|-------------|
| 10 Research Group / TENx10 | 10researchgroup@gmail.com | Artist management + AI agency |
| DirtySnatcha Records (DSR) | thomas@dirtysnatcha.com | Record label + artist |
| My Hydration Pack (MHP) | tom@myhydrationpack.com | Hydration product business |
| Trelis Work | Tom@treliswork.com | (scope TBD) |
| Photography | tnalianphotos@gmail.com | Photography business |
| WHOisDad | whoisdadmusic@gmail.com | Music project |
| Personal | thomasevan.nalian@gmail.com, thomasnalian@gmail.com | General personal |

---

## DAD Product Status (as of 2026-04-24)
- Landing page: tenx10.co/dad (live, marketing only)
- Waitlist: /api/dad-waitlist → Supabase dad_waitlist table (0 real users yet)
- Payment: /api/dad-checkout → PayPal link ($39/mo Solo, $69/mo Portfolio)
- Agent pipeline: NOT YET BUILT — this is what needs to be built
- MCP workers for each account: auth scripts started in previous session, location unclear — may be in session temp dirs

---

## What DAD Needs to Do
1. Connect all 9 email accounts → unified inbox view + smart labeling by business
2. Autonomous daily triage: archive noise, flag action-required
3. Google Drive cleanup: deduplicate, organize by business bucket
4. OneDrive backup check: slashgnr06@hotmail.com
5. Amazon Prime Photos/Videos: organize + cleanup
6. Contacts dedup: merge duplicates across accounts
7. Calendar cleanup: deduplicate events
8. Daily briefing: one digest of what needs attention across all accounts

---

## Notes for Next Session
- Gmail MCP currently connected to thomas@dirtysnatcha.com only (one account)
- Other 8 accounts need OAuth connections or computer-use approach
- Previous session built auth scripts — check session temp dirs or rebuild from scratch
- thomas@dirtysnatcharecords.com Gmail OAuth expired — needs reconnect on tenx10.co/dashboard/gmail
