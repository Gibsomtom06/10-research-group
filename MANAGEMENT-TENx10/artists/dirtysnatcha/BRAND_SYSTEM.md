# DirtySnatcha — Brand System

*Built 2026-09-16 · the WHOiGROW equivalent for DirtySnatcha*

**How to read this file.** Every claim is tagged:
- **[MEASURED]** — computed from real rows. Reproducible.
- **[SOURCED]** — quoted from a real email, contract or doc. Attributed.
- **[HYPOTHESIS]** — an inference. Not fact. Test it.
- **[UNKNOWN]** — nobody has answered this. **Onboarding fills these.**

---

## 1 · Identity

| | |
|---|---|
| Artist | **DirtySnatcha** |
| Legal / contract identity | **Leigh Bray** — signs as Licensor on all DSR booking contracts |
| ⚠️ | **DirtySnatcha is Leigh Bray, NOT Thomas.** Thomas is his manager. Four distinct entities: DirtySnatcha ≠ DirtySnatcha Records ≠ DSR Publishing (ASCAP) ≠ LAB10 (BMI) |
| Pronouns | he/him |
| Label | DirtySnatcha Records (DSR) — his own |
| Booking | Andrew Lehr, AB Touring · `andrew@abtouring.com` |
| Contacts | `contact@dirtysnatcha.com` (artist) · `thomas@dirtysnatcha.com` (mgmt) |
| Catalog | 136 tracks · ~14M streams · popularity 28 |
| Spotify | `13dsmcZVkb1XlhT6RQYh1n` · 41,031 monthly listeners / 77,605 streams-28d **[MEASURED: S4A 2026-07-31]** |

**Scale note:** he is roughly **14× WHOiSEE** on median engagement. Nothing from WHOiSEE's playbook transfers by default.

---

## 2 · What actually works — MEASURED

From **290 Instagram posts**, all scored. **Median: 768 likes.**

### Top performing **[MEASURED]**
| Likes | Post |
|---|---|
| **9,319** | "Them lasers on the drop 🔥 Massive shoutout to **@excision** dropping…" |
| **6,672** | "SORRY FAMILY 🎄 #christmas #dubstep…" |
| **5,222** | "JINGLE BELL RIDDIM 🎄 #christmas #dubstep…" |

### Worst performing **[MEASURED]**
| Likes | Post |
|---|---|
| 98 | "Who loves deep dubstep?" |
| 91 | "I HAVE 400 GUEST LISTS FOR TONIGHT WHO WANTS ONE?" |
| 70 | "DirtySnatcha Records takes over Cabana Live on June 1 after…" |

### Caption signals vs his 768-like median **[MEASURED, n≥5 only]**
| Signal | n | Median | vs account |
|---|---|---|---|
| very short (<40 chars) | 108 | 795 | +4% — **noise, do not act on this** |
| @-mentions an account | 75 | 709 | −8% |
| asks a question | 51 | 634 | −17% |
| 4+ hashtags | 9 | 634 | −17% |
| points at a link / tickets | 50 | 572 | **−26%** |
| long caption (200+ chars) | 37 | 537 | **−30%** |

### The read — he is the exact inverse of WHOiSEE
**[MEASURED]** **Every signal is flat or negative.** Nothing a caption can do reliably lifts him; several things reliably hurt. Long captions are his worst (−30%) — where WHOiSEE gains **+51%** from exactly that.

⚠️ **The +4% on short captions is not a finding — do not build on it.** His median is 768 and his top post is 9,319, a **12× range**. When every caption feature lands within a few percent of the median across that spread, the honest conclusion is that **caption text does not explain his variance at all.** A table of near-zero deltas invites someone to chase +4%. There is nothing there to chase.

**[HYPOTHESIS]** At his scale the post is not what earns reach — **the moment is.** His #1 is Excision playing his track. His #2 and #3 are a holiday riddim bit with a genuine idea. His three worst are all **asks**: a question with no substance, a guest-list giveaway, and a label-takeover promo.

**The rule this implies: DirtySnatcha's audience rewards the event and punishes the request.** Announce less. Show more.

**[MEASURED]** Facebook: **1,203 posts** — his largest channel by volume and entirely unanalysed. **[UNKNOWN]** Do this before any FB spend.

---

## 3 · Content pillars — PROPOSED, not agreed

⚠️ **[HYPOTHESIS]** Derived from his own data, not agreed with Leigh. **Needs one session with him.**

| Pillar | Share | Evidence |
|---|---|---|
| **The moment** — his track in someone else's hands, festival drops, crowd reactions | 40% | #1 post (9,319) is exactly this |
| **Bit / seasonal character** — riddim with a joke behind it | 20% | #2 and #3 (6,672 / 5,222) |
| **Releases, shown not announced** | 20% | **[UNKNOWN]** — needs isolating |
| **Live & shows** | 15% | **[UNKNOWN]** |
| **Label / DSR** | 5% | Worst post on record is a label takeover promo (70) — keep it minimal on the artist account |
| ~~Bare asks and giveaways~~ | **0%** | Two of his three worst. Stop. |

---

## 4 · Voice

**[MEASURED]** All-caps for energy, heavy emoji, short. Brevity is his only positive signal — the opposite of the advice for WHOiSEE and HVRCRFT.

**[UNKNOWN]:** who writes the captions — Leigh or Thomas? Profanity policy? Is there a separation between the DirtySnatcha voice and the DSR label voice? (One exists in the KB at `TENx10_Knowledge_Base/04_KA_Part3_DSP_Content_Voice.md` for the **label** — not the artist.)

⚠️ `artists/dirtysnatcha/voice-corpus/` **exists and is empty.** It looks like an artifact. It is not one.

---

## 5 · Live & commercial context

**[MEASURED/SOURCED]** Lost Lands Day 1 (Legend Valley, Thornville OH) **Fri 2026-09-18, $2,500** — confirmed; the 9/19 and 9/20 rows are cancelled. Phoenix 10/9 DSR Takeover. The Foundry SF 10/30. "Take Me To Your Leader" tour, Leg 2.

**[SOURCED]** HappyBelly Vending handles Lost Lands merch: **75/25** split, 90/10 media, 2 items max / 200 units, $20 minimum price. A merch-terms chase to Apex has had **no answer since 2026-09-09**.

---

## 6 · Gaps for onboarding

- [ ] Agree the pillars **with Leigh** — §3 is a proposal
- [ ] Analyse the **1,203 Facebook posts** — his biggest channel, never looked at
- [ ] ⚠️ **CORRECTED 2026-09-16 — Instagram is NOT broken.** Zero IG fetch errors on any run; `igPosts: 0` means nothing was posted that day. **If his newest IG post really is 2026-08-13, he genuinely has not posted in five weeks** — worth confirming with Leigh, because he is mid-tour. **Facebook IS broken**: `(190) Any of the pages_read_engagement, pages_manage_metadata, pages_read_user_content, pages_manage_ads, pages_show_list or pages_messaging permission(s) must be granted` — missing scopes, a re-auth fix. His 1,203 FB posts have not updated since.
- [ ] Voice ownership: who writes? **[UNKNOWN]**
- [ ] Visual identity: **[UNKNOWN]** — no logo rules, palette or type on record
- [ ] Fill or delete the empty `voice-corpus/` folder
- [ ] Separate artist voice from DSR label voice explicitly

---

## 7 · Cross-references

`BRAIN.md` (this folder) · `TENx10_Knowledge_Base/04_KA_Part3_DSP_Content_Voice.md` (label-level) · posting-style panel on `/entity/3816c060-2bee-4b0e-bb27-90e8fa6392c8`
