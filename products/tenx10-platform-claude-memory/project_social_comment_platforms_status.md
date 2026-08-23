---
name: project_social_comment_platforms_status
description: "Status and blockers for YouTube/SoundCloud/TikTok comment ingestion in TENx10 — researched 2026-08-21, none exist yet"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3da292d4-a88d-4dc3-8a64-6bde3e5acfb8
  modified: 2026-08-21T13:04:48.610Z
---

Researched 2026-08-21 while scoping the contact-promotion feature (R255(d) item 3, `ARCHITECT_QUEUE.md`). Only Facebook/Instagram comments are actually captured today (`social_comments` table, `platform` CHECK constraint literally only allows `facebook`/`instagram`). Thomas asked whether YouTube/SoundCloud/TikTok comments should work differently — they don't work at all yet. Findings, so this doesn't need re-researching:

**YouTube — buildable, not blocked.** OAuth already works (`src/lib/youtube/oauth.ts`) and is live-wired from Settings, but the requested scopes (`youtube.readonly`, `yt-analytics.readonly`, `userinfo.email`, `youtube.upload`, `yt-analytics-monetary.readonly`) don't include comment access — no `youtube.force-ssl`, and zero comment-reading code exists anywhere in the repo. Cost estimate: similar to Meta's comment pipeline (~90-line normalizer + ~80 lines of cron wiring), plus a scope change that likely requires re-consent from connected accounts.

**SoundCloud — hard-blocked on a purchase, not code.** The app cannot even register with SoundCloud's API without an active SoundCloud Artist Pro subscription — `SOUNDCLOUD_CLIENT_ID`/secret are unset in this environment. OAuth scaffolding exists (`src/lib/soundcloud/oauth.ts`) but is `ingest: 'dormant'` in `src/lib/connect/platforms.ts` and gated by a preflight warning. No comment code exists. **Needs Thomas to decide whether to buy Artist Pro before any SoundCloud work — including comments — can start.**

**TikTok — likely blocked by the platform itself.** OAuth (Login Kit) completes and issues a real token (`src/lib/tiktok/oauth.ts`), but TikTok's official third-party API has **no comment-read scope at all** for outside apps — not a tier/paywall issue, the capability doesn't exist officially. The only path around that is unofficial scraping, a different risk category (ToS, fragility, no support). `ingest: 'auth_only'` in `platforms.ts` — even video-list ingest is stubbed, let alone comments. **Needs Thomas to decide whether unofficial scraping is worth the risk, or to drop TikTok comment capture entirely.**

**How to apply:** Thomas's decision 2026-08-21: ship the already-scoped FB/IG contact-promotion feature first (`[[project_tenx10_contacts_next_action]]`'s sibling — R255(d) item 3), then brainstorm YouTube comments as its own project next. SoundCloud and TikTok stay parked until he resolves their respective blockers — don't propose building either without him raising it, and don't re-research their API status without checking this memory first (dated 2026-08-21 — Anthropic/API landscape or SoundCloud's subscription terms could change, so re-verify if this memory is old when it resurfaces).
