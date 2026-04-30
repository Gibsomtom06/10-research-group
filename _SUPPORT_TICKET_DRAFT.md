# Anthropic Support Ticket — Credit Request

**Where to send:**
- Primary: https://support.anthropic.com → open a ticket under "Billing / Usage Credits" or "Report an issue"
- Alternative: support@anthropic.com (email)

**Before you send:**
- Replace anything in `[brackets]` with your actual info
- The session transcript is saved on your machine at the path noted in the footer — mention it's available if support asks
- Tone is factual and specific, not angry. Anthropic support responds better to evidence than frustration.

---

## Copy from this line down into the ticket

---

**Subject:** Credit request — Cowork mode session on 2026-04-23/24, significant rework from missed context

**Account email:** thomas@dirtysnatcha.com
**Product:** Cowork mode (Claude desktop app)
**Subscription tier:** Claude Max
**Session date:** 2026-04-23 evening, continuing through 2026-04-24 early morning (EDT)
**Approximate session length:** 7–9 hours (single sitting, across multiple Cowork turns)

---

### Summary

I spent a roughly 7-to-9-hour Cowork session working on a multi-project build (TENx10 artist management platform, Digital Booking Agent, Rim Shop client site). A substantial portion of that session — I estimate 50–60% — was spent on work that had to be redone, reverted, or rebuilt because Claude did not consult readily available context before acting. The specifics are documented on my own filesystem by Claude itself, making this verifiable without access to session logs.

I'm requesting a usage credit or an extended rate-limit reset commensurate with the rework portion.

---

### Specific examples of rework, with on-disk evidence

**1. ~90 min on manual SQL migrations when a Supabase MCP connector was available.**

I asked early in the session whether there was a connector for Supabase. Claude told me to paste SQL into the Supabase dashboard directly. We hit five separate error classes doing this manually:

- Postgres error `22P02: invalid input value for enum show_status: "onsale"` (typo in migration 0005)
- Postgres error `42601: syntax error at or near "insert"` (missing semicolon between migrations)
- Postgres error `42P16: cannot change name of view column` (view column-order change not handled)
- Postgres error `42703: column "notes" does not exist` (missing column on contacts)
- Postgres error `55P04: unsafe use of new value "memo_sent" of enum type offer_status` (enum-commit ordering issue)

After I asked again whether there was a connector, Claude found the Supabase MCP in the registry in one search and completed the migrations through it in minutes. This entire 90-minute chunk was avoidable if the connector search had been run in the opening turns.

**Evidence on disk:** `C:\Users\Slash\10 Research Group\products\digital-booking-agent\migrations\ALL_MIGRATIONS.sql` (a file Claude created for the manual paste approach that was ultimately discarded in favor of the MCP)

**2. ~60 min duplicating data into DBA's Supabase project that I had already told Claude was separate from TENx10's.**

I asked directly whether migrations would affect another database. Claude said the DBA work was nested under the TENx10 project I was working in. It was not — TENx10 Supabase (`ocscxqaythiuidkwjuvg`) and DBA Supabase (`erwlfjlgrrfuqnjzitor`) are entirely separate projects in different organizations, and Claude had enough information to verify this before writing but did not.

Once the error was found, Claude then ported data from TENx10's 011_ds_offers_history migration into DBA's Supabase — more duplication — and I had to tell Claude again that TENx10 is the source of truth. The ported rows were then deleted. All of that INSERT/DELETE activity is visible in Supabase's project audit log.

**Evidence on disk:** `C:\Users\Slash\10 Research Group\products\tenx10-platform\OVERNIGHT_STATUS.md` (a file Claude wrote itself that explicitly says "What I built in DBA tonight was redundant. The 12 seeded contacts were duplicating shape that's already here.")

**3. ~45 min of architectural flip-flopping on folder hierarchy that I had already resolved.**

There is a prior Cowork session on my machine titled "Fix folder hierarchy and organization structure" where I resolved where Rim Shop lives (under `10 Research Group/products/`), where DSR labels live, and so on. Claude did not read that session's transcript until I explicitly pointed at it later in the night, despite having tool access to `list_sessions` and `read_transcript` from the start. Before I pointed at it, Claude told me Rim Shop was NOT under 10 Research Group — directly contradicting the resolution I had already captured in HIERARCHY.md.

**Evidence on disk:** `C:\Users\Slash\10 Research Group\HIERARCHY.md` (was internally contradictory until Claude edited it after I pointed at the prior session)

**4. ~45 min of reframing the "Brian" pitch because Claude assumed rather than asked.**

Over four separate messages I told Claude, progressively, who Brian is: (1) partner, (2) actually a booking agent, (3) at Corson specifically, (4) with a 40-artist roster. Each reframe required Claude to rebuild deliverables — a merger brief, then a roster-signing pitch, then an outsourcing proposal. The final deliverable (`demo-for-brian.html`) is the one I wanted from the start; it could have been the first version if Claude had opened with one question instead of building the wrong shape.

**Evidence on disk:** `C:\Users\Slash\10 Research Group\products\digital-booking-agent\demo-for-brian.html` (final version) + revision history in git

**5. Ignored research inputs until pushed three times.**

I pointed Claude at an AI Studio app showing the kind of market-research / HGR-detection functionality I wanted. Claude said "okay whatever" (paraphrasing) and continued its own path. On the third push Claude loaded the Chrome MCP to actually view the page. Similarly for `notebook-raw.txt` — a 949-line NotebookLM export sitting in the Rim Shop folder — which Claude did not read until asked directly.

**6. Built the Rim Shop site at the wrong path initially**, then had to move everything to `products/rim-shop/` after I pointed out HIERARCHY.md had said so all along.

---

### Dollar impact estimate

Based on Claude's own estimate during the session, API costs for this session were approximately $40–$80 total, of which $25–$45 is attributable to rework from the causes above. If I'm on a subscription tier (Pro/Max/Team), the equivalent ask is to restore the portion of my usage budget that was consumed by rework.

---

### What I'm asking for

I'm on the **Claude Max** tier, so the most useful remedy is likely one of:

1. **Restore the rate-limit window consumed by the rework** — reset or significantly extend my current usage cap so I can continue the productive work this week without hitting the cap from tonight's burn
2. **Account credit toward an upcoming month of Max** — equivalent value of the rework portion applied to next month's subscription
3. **Whichever is standard Anthropic practice for a documented Max-tier session-rework complaint** — I'll defer to your team's usual process

I'd also welcome any internal-facing signal the team wants to act on — this session is a useful case study in how Cowork mode consumes usage when context-gathering heuristics (reading prior sessions, checking the MCP registry, reading the user's own files) get skipped.

---

### What I'm NOT asking for

A full refund. The session produced real, valuable work — a Rim Shop site ready to launch, a Brian pitch page, HGR detection code in TENx10, and the TENx10 features consolidated onto one dashboard page. I'm not disputing the productive portion of the session. I'm asking for credit specifically for the rework portion that should not have happened.

---

### Session artifacts available if you need them

- Full session transcript at: `C:\Users\Slash\AppData\Roaming\Claude\local-agent-mode-sessions\[session-folder]\`
- Overnight status doc Claude wrote itself: `C:\Users\Slash\10 Research Group\products\tenx10-platform\OVERNIGHT_STATUS.md`
- Morning-summary doc Claude wrote itself: `C:\Users\Slash\10 Research Group\_READ_FIRST_WHEN_YOU_WAKE_UP.md`
- Supabase audit logs for the two projects (`erwlfjlgrrfuqnjzitor` DBA, `ocscxqaythiuidkwjuvg` TENx10) — show the duplicate INSERTs and subsequent DELETEs

Happy to provide any of these or answer questions.

Thank you.

---

### Footer note (not in the ticket, just for you)

If they ask for one or two specific time stamps to verify, the clearest ones are:

- Pre-connector SQL errors: check your Supabase dashboard SQL editor history around the first 1-2 hours of the session
- Post-connector fix: around the 2-hour mark when Claude found the connector
- Duplicate DBA inserts: Supabase project `erwlfjlgrrfuqnjzitor` around mid-session, then deletes later
- Architecture flip: the HIERARCHY.md edit history in git

You can paste just the numbered section (1–6) and the "what I'm asking for" section if the full ticket feels too long. Shorter usually helps.
