# TENx10 / 10 Research Group — canonical hierarchy

Where everything is supposed to live. This is the reference — if something on disk doesn't match this, it's the disk that's wrong, not the map.

**Rim Shop lives under `10 Research Group/products/rim-shop/`** (first non-music vertical — Wheel Repair Specialists of Michigan, client 0 of the performance-share pilot program). It is a 10 Research Group CLIENT ENGAGEMENT, not a separate personal venture. Previous versions of this doc said otherwise; that was wrong and is superseded. The old `C:\Users\Slash\Rim Shop\` folder is archival — delete once you've confirmed everything moved.

---

## Top level — `C:\Users\Slash\`

This is the Cowork workspace root. It holds the parent company folder, personal memory, and anything cross-project.

```
C:\Users\Slash\
├── 10 Research Group\          ← the TENx10 parent folder (this doc covers it)
├── memory\                      ← Thomas's cross-project memory cache
│   ├── glossary.md
│   ├── people\                  (andrew-bass.md, colton-anderson.md, …)
│   └── projects\                (ten-research-group.md, digital-booking-agent.md,
│                                  dirtysnatcha-records.md, whoisee.md,
│                                  dark-matter.md, kotrax.md, rim-shop.md)
├── CLAUDE.md                    ← user-memory file; auto-loaded by Cowork
├── .claude\                     ← Cowork plugin installs (skills, agents, hooks)
│   └── CLAUDE.md                ← the "true" auto-load target; mirror of ~\CLAUDE.md
├── Rim Shop\                    ← DEPRECATED/STALE — moved to 10 Research Group\products\rim-shop\. Delete this folder.
└── (anything else personal/OS — leave alone)
```

Rules:
- `CLAUDE.md` at the workspace root is the memory file. `.claude/CLAUDE.md` is the one Cowork actually auto-loads; keep them identical.
- `memory/` is personal context across all projects — don't copy it into a product folder.
- Rim Shop is a 10 Research Group product at `products/rim-shop/` — same tier as DBA and tenx10-platform. The root `Rim Shop/` folder is stale and should be deleted.

---

## `C:\Users\Slash\10 Research Group\` — company folder

```
10 Research Group\
├── 10-research.code-workspace   ← VS Code multi-root (opens products + root together)
├── HIERARCHY.md                  ← this file
├── CLAUDE_CODE_REORG_PROMPT.md  ← sibling doc; prompt for Claude Code to enforce this map
│
├── products\                     ← every piece of SOFTWARE TENx10 builds lives here
│   ├── digital-booking-agent\   ← DBA — Next.js 15 + Supabase + Python agents
│   │   ├── CLAUDE.md
│   │   ├── TASKS.md
│   │   ├── docs\SESSION_STATE.md
│   │   ├── app\                 (Next.js app)
│   │   ├── agents\              (Python workers)
│   │   ├── scripts\
│   │   ├── migrations\
│   │   ├── prompts\
│   │   └── schema.sql
│   ├── tenx10-platform\          ← the tenx10.co website source
│   └── rim-shop\                 ← Wheel Repair Specialists of MI — first non-music vertical
│       ├── PILOT_BRIEF.md       (performance-share engagement spec)
│       ├── SOW_v1.md            (statement of work)
│       ├── notebook-raw.txt     (NotebookLM research dump, 949 lines)
│       ├── chatbot\             (on-site chatbot — SYSTEM_PROMPT.md)
│       ├── gmc-feed\            (Google Merchant Center inventory feed + generator)
│       ├── google-ads\          (Search + Shopping campaign plans + keywords)
│       ├── email-sequences\     (abandoned cart flows)
│       ├── refinishing-agent\   ("Not Ready" inventory prioritization agent)
│       └── site\                (Next.js site — WIP, launches tomorrow)
│
├── artists\                      ← per-roster-ARTIST assets + data (no code)
│   ├── dirtysnatcha\            ← the ARTIST (Leigh Bray). NOT the label.
│   │   ├── press-kit\
│   │   ├── voice-corpus\        (source for voice_samples ingestion)
│   │   ├── contracts\           (Leigh's performer contracts — shows, features)
│   │   └── assets\              (his logos, photos, riders)
│   ├── whoisee\
│   ├── dark-matter\
│   └── kotrax\
│
├── labels\                       ← record LABELS TENx10 manages / co-manages
│   └── DirtySnatcha Records\    ← DSR (more labels will sign up here over time)
│       ├── catalog\             (154 releases, DSR002–DSR178 metadata)
│       ├── contracts\           (VMG distribution, label artist agreements)
│       ├── releases\            (per-release assets, marketing, timelines)
│       └── ops\                 (demo intake, label playbooks, editorial)
│
├── docs\                         ← COMPANY-level docs (not product-specific)
│   ├── brand\                   (TENx10 brand guide, voice guidelines)
│   ├── legal\                   (company ops, not per-artist contracts)
│   └── playbooks\
│
├── contracts\                    ← OPTIONAL: cross-artist master agreements
│                                  (per-artist contracts live in artists\<name>\contracts\)
│
└── _archive\                     ← legacy dumps; nothing new goes here
    └── scattered-sources\        (DL_*, OD_*, pre-consolidation)
```

---

## Where each thing goes — the one-line rules

| If it's… | Put it in… |
|---|---|
| Software TENx10 ships | `10 Research Group\products\<product>\` |
| DBA code, agents, schema, migrations | `10 Research Group\products\digital-booking-agent\` |
| tenx10.co site source | `10 Research Group\products\tenx10-platform\` |
| Rim Shop (Wheel Repair Specialists MI) — chatbot, GMC feed, site, google-ads, refinishing agent | `10 Research Group\products\rim-shop\` |
| A single artist's press kit, voice corpus, or performer contracts | `10 Research Group\artists\<slug>\` |
| Leigh's own performer show contracts / booking deal memos (he's the artist here) | `10 Research Group\artists\dirtysnatcha\contracts\` |
| DSR label ops — catalog, VMG distribution, demo intake, label artist rosters | `10 Research Group\labels\DirtySnatcha Records\` |
| DSR release paperwork + marketing assets for a specific catalog release | `10 Research Group\labels\DirtySnatcha Records\releases\` |
| A new label signing up with TENx10 | `10 Research Group\labels\<Label Name>\` |
| TENx10 brand / voice / playbook docs (not product-specific) | `10 Research Group\docs\` |
| Legacy dumps that predate this map | `10 Research Group\_archive\scattered-sources\` |
| Thomas's cross-project notes, people cards, glossaries | `C:\Users\Slash\memory\` — OUT of this folder |
| The TENx10 website code that runs tenx10.co | inside `products\tenx10-platform\`, never at the root |

---

## Anti-patterns — things that should NEVER happen

- A product folder living at the `10 Research Group\` top level instead of under `products\`.
- A duplicate `tenx10-platform\`, `digital-booking-agent\`, or `rim-shop\` at the Cowork workspace root (`C:\Users\Slash\`) when one already exists under `products\`. If `C:\Users\Slash\Rim Shop\` still exists, it's stale — delete it.
- Artist assets (voice corpus, press kit, contracts) copied into a product folder — they belong under `artists\<slug>\`.
- **DSR label files nested under `artists\dirtysnatcha\`.** DirtySnatcha the artist and DirtySnatcha Records the label are DIFFERENT entities. Leigh is both the artist AND co-owns the label, but the label has 110+ other artists and its own ops — label stuff goes under `labels\DirtySnatcha Records\`, artist-Leigh stuff goes under `artists\dirtysnatcha\`.
- A label folder (DSR or any future label) sitting at the `10 Research Group\` root instead of inside `labels\` — all labels live under the `labels\` bucket so new ones slot in cleanly.
- `memory\` copied into `10 Research Group\`.
- A second `CLAUDE.md` at `10 Research Group\` top level that conflicts with the product-scoped ones. Product CLAUDE.md files belong inside the product folder only.
- Anything new dropped into `_archive\`. That folder is read-only / historical.

---

## Verification checklist (what "correct" looks like)

After any reorg, these should all be true:

- `10 Research Group\products\digital-booking-agent\CLAUDE.md` exists and is the DBA project memory.
- `10 Research Group\products\tenx10-platform\` exists with the website source.
- `10-research.code-workspace` opens cleanly with both product folders + the root.
- `git status` inside `products\digital-booking-agent\` shows no unexpected "moved" files (unless a move is intentional and imports have been updated).
- `python agents/outbound.py --help` (or any other agent) still runs — meaning the dual-import paths in `agents/` still resolve.
- `npm run build` inside `products\digital-booking-agent\app\` still compiles.
- No files live at `10 Research Group\` root except this doc, the `.code-workspace` file, and the `CLAUDE_CODE_REORG_PROMPT.md` sibling.
