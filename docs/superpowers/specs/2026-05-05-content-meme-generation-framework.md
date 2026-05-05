# Content / Meme Generation Framework — 3-Folder System

**Date:** 2026-05-05
**Source:** NotebookLM `d3c9f2f7-4dd1-43bd-a9d4-cc16d6f31296` (Music Meme Generator)
**Origin:** Alex Hormozi's AI content workflow, transcribed + adapted
**Status:** Spec — feeds the **CMO Sub** (factory L3 Marketing dept) and **Brand Voice Steward** (factory L2 infra) per `2026-04-27-factory-architecture-design.md`

---

## TL;DR

To generate brand-voice content at scale without "AI slop," every brand voice gets a parent folder with **exactly 3 sub-folders**: `business_context/`, `data/`, `prompts/`. The AI never invents the core idea — Thomas (or the brand's owner) supplies the concept; the AI applies the voice + format templates extracted from the brand's own past content. This is the antidote to generic AI output.

> *"AI sounds like the internet because it's been trained on the internet. But if you train it on the work you've done, it sounds like the work you've done."*

---

## The 3-folder structure (`AI_assets/<brand>/`)

```
AI_assets/<brand>/                      ← parent folder per brand voice
├── business_context/
│   └── 12_question_baseline.txt        ← single doc, one-time setup
├── data/
│   ├── tweets.csv                       ← thousands of past posts WITH metrics
│   ├── newsletter_archive.txt           ← past long-form
│   ├── youtube_transcripts/             ← 1-5 high-performing video transcripts
│   └── (one platform-specific archive per surface)
└── prompts/
    ├── twitter_style_extractor.md       ← per-platform, lengthy, specific
    ├── youtube_script_extractor.md
    └── shorts_extractor.md
```

### Folder 1 — `business_context/`

**What:** A single text doc with answers to a 12-question baseline. Sample questions:
- What does your company / brand / artist do in one sentence?
- What's the niche?
- What's the business model?
- What's the offer?
- What transformation do customers / fans experience?

**Why:** Foundational identity. Ensures every output aligns to the brand's mission + audience.

**How the AI uses it:** Loaded into context on every prompt as the baseline frame.

### Folder 2 — `data/`

**What:** Platform-specific archives of past content + performance metrics:
- Tweets: every past tweet as a row, with views / replies / favorites per row
- Newsletters: full text archive
- YouTube: 1–5 transcripts of top-performing videos
- Long-form: blog / podcast / press writeups

**Why:** Trains the AI on YOUR voice, not the internet's. Performance metrics let the AI distinguish winners from losers.

**How the AI uses it:** "Deep style analysis" extracts voice + structure + style patterns from this corpus.

### Folder 3 — `prompts/`

**What:** Highly specific, lengthy prompts per platform. Hormozi's rule:

> *"The longer the prompt, the shorter the output. The shorter the prompt, the longer the output. You have to give more context so it answers exactly what you want."*

**Why:** Specific instructions force the AI to execute style analysis correctly + structure the output to fit the platform.

**How the AI uses it:** These prompts COMMAND the deep style analysis + the final output format.

---

## The deep style analysis step (verbatim instructions from the source)

**For written content:**
> *"Analyze writing samples. Extract voice, structure, style patterns. Reproduce them with new ideas while maintaining the same feel and reader impact."*

**For video scripts:**
> *"Extract tone, pacing, narrative mechanics, emotional beats, comedic timing (if any), hooks, story arcs, call-to-action patterns, and signature stylistic choices."*

### Outputs of the analysis step

1. **Voice profile** — example from Hormozi's analysis of his own corpus:
   > *"Declarative, never hedged. No 'I think.' No 'may.' No questions as engagement bait. Stoic working-class oracle. Wisdom dressed in plain words. Speak directly to you."*

2. **Template library** — skeletal formulas extracted from past winners. Examples:
   - "One-word imperative openers"
   - "The [superlative noun] is the ability to [counterintuitive verb] when [adverse condition]"

These two artifacts (voice profile + template library) become the reusable output that all subsequent generations use as the lens.

---

## Concrete inputs needed to generate a post

The AI requires ALL of these at runtime:

1. **`business_context/12_question_baseline.txt`** — loaded as system prefix
2. **`data/<platform>_archive.csv`** — the corpus to extract style from
3. **`prompts/<platform>_extractor.md`** — the lengthy execution prompt
4. **The core idea / topic** — *human-supplied, not AI-generated*. Hormozi's hard rule:
   > *"AI does not come up with the idea. The idea is actually the alpha. The idea is where the highest returns actually come. AI can flesh it out, but the core idea is always yours."*
5. **User feedback loop** — after the AI generates N drafts (typically 10), the human marks which ones they like / don't. The AI machine-learns from feedback.

---

## How this maps to the 10RG factory

Per `2026-04-27-factory-architecture-design.md`:

| Factory layer | Role | Use of this framework |
|---|---|---|
| **L2 — Brand Voice Steward** (`brand-voice-steward` skill, infra agent D in updated naming) | Owns voice profiles per project | Maintains the `business_context/` doc + the extracted **voice profile** for every brand under 10RG. Refreshes the voice profile when corpus shifts. |
| **L3 — Marketing Dept → Content Strategist** (CMO Sub #1) | Long-form copy: blog, press, EPK, scripts | Consumes voice profile + template library from L2; runs the per-platform extractor prompts on `data/`. |
| **L3 — Marketing Dept → Social Operator** (CMO Sub #2) | Multi-platform short-form (TikTok, IG, FB, Pinterest, X, YouTube, LinkedIn) | Same pipeline; per-platform prompt files in `prompts/`. |
| **L3 — Marketing Dept → Brand Voice Steward** (CMO Sub #4 — same name, lower-tier instance for review) | Voice review across all outputs | Audits CMO output against the voice profile before approval. |

L0 (Thomas) supplies the **idea** for any campaign; the factory layers execute the framework end-to-end through the agent stack.

---

## Per-brand `AI_assets/` folder candidates inside 10RG

Each brand voice in the 10RG portfolio gets its own folder. Suggested structure inside the umbrella:

```
data/voice_corpora/                       ← (gitignored — large + private)
├── DirtySnatcha/
│   ├── business_context.txt
│   ├── data/{tweets.csv, ig_captions.csv, newsletter.txt, ...}
│   └── prompts/{twitter.md, ig.md, shorts.md, ...}
├── DSR/                                  ← label voice (distinct from artist)
├── TENx10/                               ← management firm voice
├── 10RG/                                 ← agency voice
├── MHP/                                  ← consumer brand voice (gear, charity tone)
├── WRS/                                  ← Rim Shop client voice
├── DAD/
└── Thomas-personal/                      ← future personal-brand work
```

**Why per-brand:** voice DOES NOT generalize across brands. DirtySnatcha (lowercase, no exclamations, raw bass culture) is the opposite of TENx10 the management firm (professional, label-facing). One folder per voice.

**Where data lives:** `data/voice_corpora/` should be **gitignored** by default — it contains potentially-sensitive past content + can grow large. Voice profiles + extracted template libraries (the *outputs* of the analysis) can be checked in under `MANAGEMENT-TENx10/labels/<label>/voice/` or per-product equivalents.

---

## Existing 10RG voice work this builds on

Already in flight (do not redo):

- **DirtySnatcha voice rules** locked 2026-04-23 in `products/digital-booking-agent/prompts/outbound_composer.md` § "Universal hard rules" (10 rules: no em-dashes, deal-structure-per-artist, date specificity, no bullets, no filler, no sales voice, no AI mention, no invented facts, take initiative, no suppressed artists). DBA's outbound composer applies these on every email draft.
- **TENx10 KB Module 11 Voice Profile System** — schema + per-artist voice profile structure (in `products/tenx10-platform/TENx10_Knowledge_Base/04_KA_Part3_DSP_Content_Voice.md`).
- **Voice-sample retrieval** in DBA — `agents/embeddings.py` + `voice_samples` Supabase table + Voyage `voyage-3-large` semantic retrieval (post-migration 0017). Already implements the "learn from your past corpus" half of the framework, just for outbound emails specifically.

The 3-folder framework generalizes that DBA-specific approach to **every brand voice** in the portfolio, on **every platform**.

---

## Implementation phasing

### Phase 1 — codify the framework (no code yet)

- This spec lands. No tooling.
- Each brand owner (Thomas for most; potentially Brett for WHOiSEE) writes their `business_context/12_question_baseline.txt`.

### Phase 2 — DirtySnatcha as the proof of concept

- Set up `data/voice_corpora/DirtySnatcha/` with: tweets export (from X data export), past IG captions, top show-announcement transcripts.
- Write the platform-specific style extractor prompts in `prompts/`.
- Run the deep style analysis. Capture the voice profile + template library as committed artifacts at `MANAGEMENT-TENx10/artists/dirtysnatcha/voice/profile.md` and `templates.md`.
- Cross-reference the existing locked voice rules from `outbound_composer.md` so the email-side and social-side voices stay in lockstep.

### Phase 3 — extend to the rest

- DSR (label voice), TENx10 (firm voice), 10RG (agency voice), MHP, WRS, DAD, Thomas personal.
- Each gets its own corpus + voice profile + template library.

### Phase 4 — automate per-platform generation

- The L2 Brand Voice Steward agent reads the framework artifacts.
- The L3 Social Operator + Content Strategist generate drafts using the artifacts.
- Drafts surface for L0 (Thomas) approval before any send.

---

## Hard rules carried over from the source

1. **AI never invents the idea.** Always human-supplied. The idea is the alpha; AI fleshes out.
2. **The longer the prompt, the shorter the output.** Specific input → specific output.
3. **Past performance metrics in the data file** (views / saves / replies / shares) — the AI machine-learns from winners vs losers.
4. **User feedback loop is non-optional.** Generate 10 drafts, mark like/dislike, AI learns. Don't ship the first draft.
5. **Per-brand folder, per-platform prompt.** Don't pool voices. Don't share prompts across platforms.

---

## Open questions

- **Voice corpora location:** under `data/voice_corpora/` (gitignored) or somewhere else (per-product `voice/`)? Decide on storage + sync strategy before bulk-importing.
- **Tooling:** the framework is stack-agnostic. Could run via Claude API, Gemini, or a local Ollama route via the DBA-style model_router. Pick the route per cost / latency / sensitivity.
- **Performance metrics ingest:** how do we keep the data files current? Scheduled tasks pulling from X / IG / YouTube APIs? Manual exports? Probably automated via the API integrations TENx10 already has (Meta Ads, Spotify, Gmail).
- **Voice drift detection:** when the corpus shifts (a new style era), the profile needs re-extraction. The Brand Voice Steward should monitor and flag drift.

---

*Spec v1.0 — 2026-05-05. Lifted from NotebookLM Music Meme Generator notebook + Hormozi's transcript. Ready to feed the L2/L3 voice infrastructure once the factory builds.*
