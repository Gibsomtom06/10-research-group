# DBA App

Next.js 15 (app router) + Supabase + Tailwind. The UI layer for the Digital Booking Agent.

## First-run

```bash
cd "products/digital-booking-agent/app"
npm install
cp .env.example .env.local      # fill in Supabase + Anthropic + OAuth keys

# create Supabase project, then push schema
# (requires supabase CLI: `npm i -g supabase`)
supabase link --project-ref <your-project-ref>
supabase db push ../schema.sql

npm run dev                     # http://localhost:3000
```

## Routes

| Path | Purpose |
|---|---|
| `/` | Landing grid |
| `/dashboard` | Phase 0 progress bars + queue counters |
| `/drafts` | Outreach pipeline (approve / edit / reject) |
| `/contacts` | CRM table |
| `/markets` | Artist heat map (per-metro Spotify/YT/IG data) |

## What's missing (intentionally, for Phase 0)

- Auth — localhost-only until we deploy. Add NextAuth when we go live.
- Approve/edit/reject actions are wired as buttons but the server actions aren't implemented yet. Next step: `app/drafts/actions.ts` with `approveDraft(id)`, `editDraft(id, body)`, `rejectDraft(id, reason)` — all writing to `outreach_log` + `decisions`.
- No ingestion jobs yet — those live in `../scripts/` as Python runners, wired to cron via Supabase scheduled functions or Vercel cron in Phase 1.
