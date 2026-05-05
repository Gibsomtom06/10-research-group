# DBA — Digital Booking Agent

Autonomous booking system for **TENx10** (10 Research Group, Thomas Nalian's artist management company — `https://tenx10.co` · platform source at `../tenx10-platform/`).

This file is the project memory file. Read it at the start of every session, then read `BRAIN.md` (current architectural state), then `docs/SESSION_STATE.md` (active work), then `TASKS.md` (open backlog).

> **DBA → TENx10 Supabase merger (post-0018):** DBA shares the TENx10 Supabase project `ocscxqaythiuidkwjuvg`. The old standalone DBA project `erwlfjlgrrfuqnjzitor` is dead — ignore it. The `offers` table is currently a STUB VIEW returning zero rows; pass 2 will replace with a real view over `deals`. See `BRAIN.md` for full migration history; `HANDOFF.md` for the DirtySnatcha 14 booked 2026 shows.

---

## Stack

- **App**: Next.js 15 App Router, React 19 server components, TypeScript, Tailwind
- **DB**: Supabase Postgres (service role from server), RPC functions, views, enums, generated columns
- **Workers**: Node/TS (`workers/*.ts`) — bounce handler, freshness sweep, reminder sweep, follow-up queue
- **Agents**: Python (`agents/*.py`) — supervisor, analyst, inbound classifier, outbound composer, routing, research, reporting
- **Scripts**: Python (`scripts/*.py`) — seed drafts, import contacts, preflight
- **PDFs**: `pdf-lib` (pure JS, no native deps) — generated via `app/lib/deal-memo.ts`
- **Storage**: Supabase Storage bucket `deal-memos` with 10-year signed URLs

## Repo layout

```
digital-booking-agent/
├── CLAUDE.md                   ← you are here (operating rules)
├── BRAIN.md                    ← current architectural state, migration history
├── docs/
│   ├── DOMAIN_MODEL.md         ← offers ARE contracts, agent relays, standard deal terms, RPCs
│   ├── FLOWS.md                ← outreach flow, counter-offer flow, deal-memo PDF gen, radius audit
│   ├── SESSION_STATE.md        ← active work, updated end of each session
│   └── GMAIL_OAUTH_SETUP.md
├── TASKS.md                    ← open backlog
├── PRD_model_routing.md, PRODUCT_BRIEF.md, PHASE_0_PLAYBOOK.md, DEPLOYMENT.md, ANALYST_AGENT.md
├── migrations/NNNN_*.sql       ← numbered, idempotent (do $$ … exists checks), re-runnable
├── app/
│   ├── lib/supabase.ts         ← serverClient() — service role
│   ├── lib/deal-memo.ts        ← PDF generator
│   └── app/{dashboard,contacts,markets,outreach,drafts,reminders,reports,offers}/
├── agents/{supervisor,analyst,inbound,outbound,routing,research,reporting}.py
├── scripts/{seed_*,import_*,preflight}.py
├── prompts/*.md                ← LLM prompts by role
└── workers/*.ts
```

## Conventions

### Migrations
- Numbered `NNNN_description.sql`, zero-padded
- **Always idempotent** — `do $$ begin if not exists …`, `create … if not exists`, `add column if not exists`
- Safe to re-run
- Include a sanity query at the bottom (`select 'info:' …, count(*)`)

### Next App Router
- Server components by default (`app/app/**/page.tsx`)
- `export const dynamic = "force-dynamic"` for live data pages
- Client components only when needed: forms with `useTransition`, interactive widgets — file as `row-actions.tsx` / `actions.tsx` / `notes-client.tsx` next to the page
- Server actions in `server-actions.ts` — always call `revalidatePath()` after mutation
- No `localStorage` / `sessionStorage`

### Styling
- Tailwind. Tokens: `bg-white/[0.02]` for cards, `bg-white/[0.03]` for hover, `text-accent` (cyan-ish), `text-muted`.
- **Lowercase UI labels** — Thomas's aesthetic. `<h1 className="text-2xl">offers</h1>`.
- Compact info density — workbench, not landing page.

### Python agents
- Entry: `agents/outbound.py`, `agents/inbound.py`, etc.
- Composer takes `--pitch-pack <path>` OR `--from-counter-payload` (reads `DBA_COUNTER_PAYLOAD` env var JSON)
- `synthetic_pack_from_counter(payload)` lets us skip the analyst pass when we already know what to say
- All agents log to `outreach_log` table via service-role Supabase client

### Scripts
- Always importable AND runnable (`if __name__ == "__main__"`)
- Idempotency guards on anything that writes drafts (check `outreach_log` for fresh timestamps)
- Use `rich` for CLI output where installed

### Environment / secrets
- `.env` at `app/.env.local` and `workers/.env`
- Supabase URL + service role key
- Gmail OAuth creds (tasks #27 #28)

---

## Hard rules — never forget

### Voice rules (locked 2026-04-23 from Thomas's first-real-draft feedback)

The composer MUST respect these. Source of truth: `prompts/outbound_composer.md` §"Universal hard rules" rules 1-3. Any change here must update there too.

1. **No dashes as pause-construction.** Em-dash (—), en-dash (–), AND spaced hyphen ( - ) used between clauses are all banned. "X - whichever works" reads AI instantly. Restructure into two sentences or a comma. Only legal hyphens: compound words and date ranges.
2. **Deal structure is per-artist, not universal.**
   - **DirtySnatcha (`dirtysnatcha`)**: NEVER lead with door split. Guarantee-first, small base + override (bonus). Offer flexibility on the number, not the structure.
   - **Dark Matter, Kotrax**: door splits OK market-dependent. Prefer guarantee-first for warmer markets (Denver, Chicago, LA); door splits fine for smaller markets or relationship-building venues.
   - **Others**: guarantee-first default.
   - Never phrase money as "X or Y, whichever works on your side" — that hands negotiation to the buyer. Pick a lead shape, offer to discuss the number.
3. **Date specificity on touchback.** When referencing a past conversation / hold, name the concrete month or date ("November hold", "the 11/21 date"). Never "that Q4 hold". Quarter-naming is ONLY acceptable for future / speculative windows that haven't been pinned ("routing Q2 2026").

### Architecture invariants

- **Offers ARE contracts.** No separate contracts table. Ever. (Migration 0009.) Full model in `docs/DOMAIN_MODEL.md`.
- **Use `net_to_artist`, not `guarantee`** for anything Thomas-facing about take-home.
- **Reply-to routing**: use `fn_offer_reply_to()` or the `coalesce(reply_to, relayed_by, contact_id)` pattern. Don't assume `contact_id` is the promoter.
- **`!fkey_name`** when joining `contacts` multiple ways (see `docs/DOMAIN_MODEL.md`).
- **Multi-artist**: WHOiSEE, Dark Matter, Kotrax all need the same pipeline. Don't hardcode `artist_slug = 'dirtysnatcha'`. Task #34.
- **No silent `artist_slug` fallbacks**: a missing `artist_slug` is a data bug, never a routing default. Raise, don't default.

### Terminology traps (we got these wrong before)

- **AB Touring**, not "AB Talent". The agency name had been miscaptured in older memory.
- **PRYSM email domain is `@prysmtalentagency.com`**, NOT `@prysmagency.com`. Migration 0010 made that mistake; 0012 fixes it.
- **Licensor on DSR deal memos is "Leigh Bray aka DirtySnatcha · Licensor"** — Thomas's actual legal signing identity. Was previously the double-wrong "Thomas Clay · DirtySnatcha Records" before 2026-04-22 fix.

### Model routing (post-0016) — never instantiate Anthropic() directly

NEVER `from anthropic import Anthropic; Anthropic()` inside an agent. Use `from agents.model_router import call_json` (or `run_agent_model` for the full response dict). The router routes via `agents/model_config.py::MODEL_ROUTING`, enforces the Tier-A floor (`outbound`, `supervisor`, `research` can't be downgraded even via env), logs every call to `model_calls`, and fails loud on unparseable JSON. See `BRAIN.md` for the cost-monitoring views and Phase-1 plan.

### Voice-sample retrieval (post-0017) — use the helper, don't reinvent the query builder

`outbound.py::load_voice_samples()` does semantic retrieval with silent fallback. Never re-invent the query-text builder inline — use `_build_retrieval_query(pack_payload, email_type, role)` or edit it in one place. See `BRAIN.md` for backfill / coverage details.

### Radius signing guard (post-0015)

`signThomasAction` refuses `hard_block` from `fn_offer_radius_check()` unless called with `{force: true}`. Mirror this guard for any new server action that materially binds Thomas. Full severity ladder in `docs/FLOWS.md`.

---

## Verification (before reporting any change done)

State your verification approach BEFORE the change, not after.

- **App / route changes:** `npm run dev` from `app/`, hit the affected route (`/offers`, `/drafts`, `/outreach/priorities`, etc.), confirm 200 + correct render.
- **Migrations:** apply via Supabase MCP `apply_migration`, then run the bottom-of-file sanity query, then re-run the migration (it should be idempotent — second run = same result).
- **Python agent changes:** for `outbound`, dry-run via `agents/outbound.py --pitch-pack <fixture>` against a staging contact and confirm the draft lands in `email_drafts` with the right `decision_trace.retrieval_mode`. For `inbound`, paste a sample email through the classifier and check the structured output.
- **Worker changes:** trigger the worker manually with `node workers/<name>.ts` (or the cron command in `DEPLOYMENT.md`) and check the side-effect table.
- **Scripts:** every script must be safe to re-run; verification = run twice and confirm idempotency guards fire on the second run.
