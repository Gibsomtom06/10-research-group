# Dark Matter — Brand System

*Built 2026-09-16 · the WHOiGROW equivalent for Dark Matter*

> ## ⚠️ READ THIS FIRST
> **This is a scaffold, not a brand system.** Unlike WHOiSEE, DirtySnatcha and
> HVRCRFT, there is **no social data for Dark Matter at all** — zero rows in
> `ig_posts`, zero in `fb_posts`. Nothing below §2 could be measured, because
> there is nothing to measure.
>
> Every other artist's file is built on hundreds of scored posts. This one is
> built on a booking record and a publishing registration. **Filling it is an
> onboarding job, not an analysis job.**

**Tags:** **[MEASURED]** real rows · **[SOURCED]** real email/contract · **[HYPOTHESIS]** inference · **[UNKNOWN]** unanswered.

---

## 1 · Identity

| | |
|---|---|
| Artist | **Dark Matter** — a **duo**, not a solo act |
| Members | **Isaac Tullos** · **Joseph Kalina** **[SOURCED: ASCAP registration]** |
| PRO | ASCAP — Isaac `1262457258` · Joseph `1262457454`. In `recording_writers` (12 rows / 6 ISRCs, 2026-07-20). `artists.pro_ipi` intentionally null — **a duo has two IPIs, so the single-value column is deliberately empty** |
| Based | Chicago / Knoxville |
| Label association | Wakaan |
| Management | TENx10, `managed_by = 'tenx10'`, `is_managed = true` |
| Spotify | `71c783dJDlJ3pqD7cFIOQq` · 4,746 monthly listeners / 11,710 streams-28d **[MEASURED: S4A attended pull 2026-07-31 — 6 weeks old]** |

**[SOURCED]** Playing **Phoenix 10/9**, DSR Takeover at Alchemist's Enclave — lineup has DARKMATTER at **10:35–11:35pm**, directly before the headline slot.

**[UNKNOWN]:** which member is which handle, who speaks for the duo, how they split roles, how they describe their own sound.

---

## 2 · What works — NOTHING MEASURED

**[MEASURED]** `ig_posts` = **0 rows.** `fb_posts` = **0 rows.**

This is the finding. It is not that Dark Matter posts badly — **it is that nothing they post is being captured**, so the platform is blind to an artist it manages and books.

Their `/entity/` page renders the posting-style panel with *"no Instagram posts have ever been captured for this artist — this is absence, not a zero."* That is correct behaviour and it should stay correct until real data lands.

**✅ RESOLVED 2026-09-16 — it is an ACCESS problem. [MEASURED]**

`daily-meta-organic` selects artists with `.or('meta_page_access_token.not.is.null, threads_access_token.not.is.null')`. Dark Matter's `meta_page_id` and `meta_page_access_token` are **both NULL**, so he is **filtered out of the query entirely** — he has never appeared in a single cron run's `artists[]` array, while the other three appear every day. His `entity_channels` row for `meta` exists but carries `external_id = NULL`, and there is no `instagram` row at all.

**Nothing is broken in the code. Nobody ever connected him.**

**Fix:** run the Connect Wizard and authorise his Facebook page + linked Instagram business account. He is a **duo** — establish which of Isaac or Joseph administers the accounts first, because the Meta page admin has to be the one to grant it.

---

## 3 · Content pillars — CANNOT BE PROPOSED

For every other artist these were derived from their own top posts. With zero posts there is no honest basis, and inventing five plausible pillars for a Wakaan-adjacent duo would be exactly the fabrication this file format exists to prevent.

**[UNKNOWN] — build these with Isaac and Joseph directly.** Starting questions:
- What do you already post that works, in your own judgement?
- Who handles the account — one of you, both, or neither?
- Is Dark Matter faceless, or are you both visible?
- What does the Wakaan association let you say that you couldn't otherwise?

---

## 4 · Voice

**[UNKNOWN]** — entirely. No captured captions, no corpus, no doc.

One structural note **[HYPOTHESIS]**: a duo has a voice problem a solo act does not — whether the account speaks as "we", as a shared persona, or as two named people. That decision comes before any pillar work.

---

## 5 · Revenue context

**[SOURCED]** `BRAIN.md` in this folder tracks **7 revenue pillars** with roughly **1 of 7 active** (live performance assumed active, publishing unverified).

⚠️ **Naming collision:** those are **revenue** pillars. The **content** pillars in §3 are a different thing entirely. Do not conflate them — a reader skimming both files will.

---

## 6 · Gaps for onboarding — ordered

1. [x] ~~Resolve the zero-data cause~~ — **ANSWERED 2026-09-16: it is ACCESS. He was never connected.** The cron selects on `meta_page_access_token.not.is.null`; his is NULL, so he is filtered out of the query and has never appeared in a single run. Nothing is broken in the code.
2. [ ] Connect Instagram, and Facebook if it exists
3. [ ] Confirm handles across IG / TikTok / YouTube / Spotify — **[UNKNOWN]**
4. [ ] Who runs the accounts — Isaac, Joseph, both, or a third party?
5. [ ] Identity + voice blanks (§1, §4)
6. [ ] Content pillars, **with the duo** (§3)
7. [ ] Visual identity — **[UNKNOWN]** entirely
8. [ ] Refresh S4A — the only numbers on record are 6 weeks old
9. [ ] Verify publishing beyond the 6 registered ISRCs

---

## 7 · Cross-references

`BRAIN.md` (this folder) · sibling systems: `../dirtysnatcha/BRAND_SYSTEM.md`, `../hvrcrft/BRAND_SYSTEM.md` · posting-style panel on `/entity/8a3fbde2-f840-455c-97be-86d976566e42`
