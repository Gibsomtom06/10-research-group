# Thomas Nalian — Personal Brand Launch / Deepfake Stream — BACKBURNERED

**Date:** 2026-04-30 night
**Status:** Backburnered. Captured to funnel, NOT started. Resume condition below.
**Resume condition:** Trading-shadow Phase 0 shadows graduate (90%+ accuracy, 50+ pairs, $1+/day profit on paper) OR explicit Thomas override after foundation work proves the build.
**Reason for backburner:** Rebuild-loop discipline. Starting a personal-brand initiative tonight while trading-shadow is mid-flight is the exact context-switch pattern that has cost weeks. Captured here so the idea doesn't get lost; deliberately not advanced.

---

## What Thomas asked

> "is there anything about the deep fake project to help me launch my brand as a TENx10 10 Research Group etc as an expert in the field of shit im doing"

Translation: he wants to launch his personal brand as the expert in what he's actually building (factory orchestration, multi-agent systems, AI-agents-as-business-infrastructure, ADHD-friendly orchestration patterns, the rebuild-loop fix, music industry tech). Synthetic media (AI avatar / deepfake / voice clone) is one possible production lever.

---

## What's already in the foundation (3 references)

These already exist in his brain — this stub points at them so a future resume doesn't start from scratch:

1. **Factory architecture spec** — `docs/superpowers/specs/2026-04-27-factory-architecture-design.md` line 102. Worker #10 in the CMO department is **Video & Synthetic Media Producer** with explicit scope: "Long-form video, short-form clipping, AI avatar / deepfake / voice clone." This agent role exists in the architecture but has not been instantiated.

2. **Same spec, line 185** — Thomas Nalian (personal brand) is listed as a Layer-4 project. Stated thesis: **"Industry leader → drives upmarket TENx10 clients."** This is the strategic role of the personal brand within the umbrella: authority pulls upmarket clients in.

3. **Gary Vee Local Agency Playbook spec** — `docs/superpowers/specs/2026-04-28-gary-vee-local-agency-playbook.md`. Already backburnered with the SAME resume condition (after trading-shadow Phase 0). Covers go-to-market for an authority-driven brand: LinkedIn content → authority → inbound, automated email sequences for outbound, no-calls close model, $500 websites / $500/mo retainers, tools (Perplexity, Gemini, Opus Clip, Canva AI). Personal brand work would feed directly into this agency engine.

---

## What does NOT exist yet (open work for when resumed)

| Topic | Open question |
|---|---|
| **Topic taxonomy** | What is Thomas the expert in? Multi-agent factory architecture? AI-agents-as-business-infra? ADHD-friendly orchestration / "BUILD_EVOLUTION as cognitive prosthesis"? Music industry agentic tooling? "Capitulate and Cultivate" thesis? Likely a 2-3 topic stack, not one. |
| **Distribution loop** | Primary channel: LinkedIn (long-form authority)? X/Twitter (hot takes)? YouTube long-form? Substack? TikTok? Probably 1 primary + 1 amplifier, not all of them. |
| **Tool stack** | HeyGen / D-ID / Synthesia for AI avatar video? ElevenLabs for voice clone? Opus Clip for repurposing? Lovable for landing pages? — names already in the gary-vee playbook. **Reference avatar Thomas flagged 2026-04-30 (kind of wants this style, but better):** https://youtu.be/KvrTS66faFo?si=Q_96lQ6ndKCOVsPh — when resume condition fires, fetch this video and analyze the avatar production style + tooling so the deepfake stream output beats it rather than copies it. |
| **Cadence** | How often to publish? Daily impossible while building, weekly probably right. |
| **Cross-pollination** | How does this connect to TENx10 (B2B SaaS for managers/labels), DSR (artist), MHP (merch), DBA (booking)? Each amplifies the brand differently. |
| **Production workflow** | Manual vs. orchestrated. The whole point of the factory is that it produces content as a side-effect of operating. Personal brand content should ride on existing operations (build logs become posts, decisions become threads, shipped products become case studies). |
| **Legal/reputational fence** | Deepfake/AI avatar specifically: when used, ALWAYS disclosed. Never impersonate other humans. Never deceive about the AI nature of the medium. |
| **The unfair advantage** | What's the hook nobody else has? Probably: real businesses, real money flowing, real shipped agent infrastructure (not just demos). Most "AI agent" content creators don't run a label / merch line / trading shadow / booking platform. |

---

## Why this is a real opportunity (not a vanity project)

The thesis listed in the factory spec — "Industry leader → drives upmarket TENx10 clients" — is correct. Specifically:

- TENx10's target customer is managers/labels who can afford a SaaS. Authority-driven inbound is cheaper-per-lead than ads.
- DBA's target customer is artists/agents. Same authority-flywheel.
- The Gary Vee local agency playbook explicitly depends on inbound from authority content.
- The factory architecture itself is genuinely novel — there is no public canonical for "5-layer agent OS with shadow graduation gates and rollback contracts." That gap is content-rich.
- ADHD-orchestration angle (BUILD_EVOLUTION as cognitive prosthesis, MEMORY.md as cross-session memory, BRAIN.md as project state) is a hook nobody else has and many people would relate to.

What it is NOT: a vanity-metrics influencer thing. The brand serves the businesses; it's not the end state.

---

## What to capture now (so funnel is durable)

This file. Plus:

- A memory entry of type `project` with description: "Personal brand / deepfake stream — backburnered. Stub spec captured. Resume after trading-shadow shadows graduate."
- Cross-reference from `BRAIN.md` (umbrella) — pointer to this file under "Backburnered initiatives"

---

## Ambient content-idea capture (started 2026-04-30 — STREAM ONLY, not production)

Distinct from "starting the brand initiative." This is just **noticing** when something that's happening in Thomas's day-to-day work is content-worthy, and writing it down. Zero production effort. Reviewable when the resume condition fires.

**Mechanism:**
- File: `products/trading-shadow/data/content_ideas.jsonl` (lives there for now because the chat bridge already writes nearby; can move under `personal-brand/` when the resume condition fires)
- Each row: `{timestamp, source, what_happened, why_content_worthy, suggested_format, topic_tags, status}`
- `source`: where the moment happened (e.g. "claude session 2026-04-30", "discord brainstorm channel", "trading-shadow paper run")
- `suggested_format`: linkedin-long, twitter-thread, youtube-short, blog-post, etc.
- `topic_tags`: the topic taxonomy slot — agent-architecture, adhd-orchestration, capitulate-cultivate, factory-design, music-tech, ai-agents-money, etc.
- `status`: `pending` (default) → `pursued` / `killed` / `archived` on weekly review

**CLI capture helper:** `products/trading-shadow/scripts/log_content_idea.py` lets either Claude (in conversation) or Thomas (manually) append a row in one command. Implementation note: Thomas should NOT have to think about format — the script accepts a single arg "what happened" and Claude can fill the rest from session context.

**During active Claude sessions:** Claude is responsible for noticing content-worthy moments and dropping them in. This is documented as part of Claude's session-time behavior so it doesn't depend on Thomas remembering to ask.

**No production trigger:** filling the JSONL does NOT trigger any content production. Production starts only when the resume condition fires. The file is purely a funnel; the production engine doesn't exist yet on purpose.

---

## Voice / hands-free conversation mode (BACKBURNERED — for driving)

Thomas wants to talk to Claude / Xai / Strategist while driving. Three implementation options ranked easiest to hardest:

**A. Discord voice memos (one-way hands-free, works TODAY)**
- Record voice memo in Discord mobile (long-press mic icon)
- Discord's built-in auto-transcription produces text in `message.content`
- Bot already reads `message.content` — would respond as normal
- **Catch:** reply is text-only; Thomas must look at phone to read it. NOT safe while driving.

**B. + Text-to-Speech reply (true two-way, ~1-2 hours of work)**
- Same input path (voice memo → transcript → bot)
- Add: bot calls ElevenLabs / OpenAI TTS API to synthesize the reply as audio
- Posts the audio file back to the same Discord channel
- Thomas hears the response through phone speakers / car audio (Bluetooth)
- **Cost:** ~$0.30/1K characters via ElevenLabs; trivial for a personal-use bot
- **Implementation:** `_handle_chat()` in `chat_bridge.py` would dual-emit text + audio; `discord.File.from_bytes()` for the audio attachment
- **This is the right answer for the resume condition** — cheap, hands-free, doesn't require new infrastructure outside Discord

**C. Phone call via Twilio + OpenAI Realtime API (most polished, ~half day)**
- Twilio number forwards to OpenAI Realtime API (or similar voice-streaming endpoint)
- Thomas calls a real phone number, talks like a phone call
- ~$1-2/month for the Twilio number + per-minute usage
- Best fit for sustained conversations vs. one-off questions
- Defer until B's friction is observably too high

**Trigger to build B:** when content-idea capture from voice memos becomes the dominant input mode (i.e. Thomas is already using voice memos in the bot frequently in option-A mode). Then upgrade to two-way TTS. NOT building tonight.

### Considered alternatives (rejected for the hands-free use case, captured for completeness)

- **Google Assistant ("Ok Google") dictating Discord messages.** Possible via Android Tasker/Routine. Catch: reply readback isn't native — Google won't read Discord notifications back. Same look-at-phone problem.
- **Alexa Skills for Discord.** Same answer. Dictate works; reply readback awkward.
- **Why Discord voice memo + ElevenLabs TTS wins over both:** single app handles both directions (long-press to record, get audio reply automatically). Car Bluetooth makes audio replies hands-free. No app-switching mid-drive.

### Build progression (when resume condition fires)

1. **Voice IDEATION (Phase A)** — Discord voice memo → transcript → Claude/Strategist text reply. Useful immediately even without TTS; you read replies at next stoplight.
2. **Voice TWO-WAY (Phase B)** — same input, ElevenLabs/OpenAI TTS audio reply uploaded as audio file. True hands-free.
3. **Voice BUILD-QUEUE (Phase B+)** — voice memos accumulate as a pending build queue. When Thomas sits at desk, Claude shows the plan + diffs + tests, Thomas approves/rejects, Claude executes. Voice → spec → desk-execute.
4. **Voice EXECUTE (Phase C, probably never)** — actual code execution while driving. Risk: can't verify diffs at 70mph. Not building this even if technically possible.

The realistic destination is Phase B+: brainstorm/spec/plan in the car, execute at the desk. Builds happen faster from a clear spec than from staring at a blinking cursor anyway.

---

## What to NOT do tonight

- No content production
- No tool sign-ups (HeyGen, ElevenLabs, etc.)
- No LinkedIn restructure
- No avatar generation experiments
- No "let me just write one post real quick" — that IS the rebuild-loop pattern, just in disguise

---

## Resume protocol

When the resume condition fires (trading-shadow shadows graduated, evidence in `data/decisions.jsonl` and accuracy_tracker output):

1. Re-read this file
2. Re-read the gary-vee playbook spec (companion)
3. Pick ONE topic from the taxonomy section above (don't try to do all)
4. Pick ONE channel (don't try to do all)
5. Pick ONE cadence (start lower than feels right)
6. Define a 30-day evaluation window with a kill-switch criterion
7. Then start

The resume version of this spec should be a real plan, not a vibe-driven launch.

---

*Stub spec v1 — 2026-04-30. Update when the resume condition fires. Until then: don't start.*
