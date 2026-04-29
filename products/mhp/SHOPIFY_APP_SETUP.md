# MHP Shopify App — Setup

This document tells you (Thomas) how to scaffold and run the My Hydration Pack
Shopify app in `products/mhp/shopify-app/`.

## Why this isn't pre-scaffolded

The agent that prepared this doc could not run `npm` or `git` inside the
sandbox (both commands are on the harness denylist). Rather than hand-rolling
an out-of-date copy of the official `shopify-app-template-remix` repo, the
honest move is to leave the actual scaffolding to you — it's a single command
and takes ~60s. Everything else (gitignore, this doc) is wired up and ready.

---

## One-time setup

### 1. Shopify Partner account

You need a Shopify Partners account to create custom apps and install them on
your MHP store.

- Sign in (or create the account) at: <https://partners.shopify.com/>
- Use `tom@myhydrationpack.com` so the Partner org is tied to the MHP store
  owner email. (You can add other team logins later.)

### 2. Install the Shopify CLI globally (one-time)

```powershell
npm install -g @shopify/cli @shopify/app
```

Confirm:

```powershell
shopify version
```

### 3. Authenticate the CLI to your Partner account

```powershell
shopify auth login
```

This opens a browser, you sign in to Partners, the CLI gets a token. You only
do this once per machine.

---

## Scaffold the app

From `C:\Users\Slash\10 Research Group\products\mhp\` run:

```powershell
npm init @shopify/app@latest -- --name=mhp-shopify-app --template=remix --package-manager=npm
```

When it asks where to put the project, point it at this folder so it creates
`./shopify-app/` (or whatever the prompt names it — rename the directory to
`shopify-app` afterward if needed; the rest of this repo expects that path).

That command writes:

- `package.json`, `package-lock.json`
- `app/` — Remix routes, components, server entry
- `prisma/` — default SQLite schema for session storage
- `shopify.app.toml` — app config (name, scopes, URLs)
- `shopify.web.toml` — web process config
- `extensions/` — empty, for theme app extensions / functions / blocks
- `vite.config.ts`, `tsconfig.json`, `remix.config.js`
- `.env.example`

It auto-runs `npm install`. If it doesn't, run it yourself from
`products/mhp/shopify-app/`.

### Verify the scaffold

```powershell
cd "C:\Users\Slash\10 Research Group\products\mhp\shopify-app"
npm run lint
npx tsc --noEmit
```

Both should pass cleanly on the untouched template. If they don't, you've got
a Node version mismatch — check `.nvmrc` if the template ships one.

---

## Connect the app to your MHP store

```powershell
shopify app dev
```

The first run will:

1. Prompt you to select / create the app inside your Partner org. Pick
   "Create new app" — name it something like "MHP Internal Tools".
2. Give you an install URL. Open it, log in to your MHP admin
   (myhydrationpack.com/admin), and click Install.
3. Start a Cloudflare tunnel so Shopify can reach your laptop's dev server.

Shopify writes the API key + secret into `.env` in the project root after the
app is created. **`.env` is gitignored** — never commit it.

You can also pull the keys manually from
<https://partners.shopify.com/> → Apps → MHP Internal Tools → API credentials.

---

## Day-to-day commands

| Command | What it does |
|---------|--------------|
| `shopify app dev` | Run the dev server + tunnel. Hot-reloads on file changes. |
| `shopify app deploy` | Push extensions, scopes, and config to Shopify. Does NOT deploy your Remix server — host that on Vercel/Fly/Render. |
| `shopify app generate extension` | Scaffold a new theme app extension, function, or admin UI block. |
| `shopify app info` | Show which Partner app + dev store this directory is wired to. |
| `npm run dev` | Same as `shopify app dev` for this template. |

---

## What is a Shopify Remix app?

A Shopify Remix app is a normal Node/Remix server that authenticates to a
Shopify store via OAuth. Once installed, the store gives the app an access
token; the Remix server uses that token to call Shopify's Admin GraphQL API
and read or write data (orders, products, customers, inventory, fulfillments,
etc.). The app can also embed UI inside the merchant's Shopify admin via App
Bridge + Polaris, register webhooks, ship Shopify Functions (server-side
checkout customization), and add theme app extensions to the storefront.

For MHP this means: anything you'd want to automate or surface inside the
admin panel — bulk inventory edits, custom order tags, customer segmentation,
a private dashboard, automated email/SMS triggers off webhooks — lives in
this Remix app.

The Remix server has to be hosted somewhere reachable by Shopify (Vercel
works, Fly works). `shopify app deploy` does NOT host the Remix server — it
only pushes the app's metadata + extensions. Host the Remix server
separately and put its URL into `shopify.app.toml > application_url`.

---

## After scaffold — commit it

Once the scaffolder finishes, from the monorepo root
`C:\Users\Slash\10 Research Group\`:

```powershell
git add products/mhp/shopify-app/ products/mhp/SHOPIFY_APP_SETUP.md .gitignore
git commit -m "scaffold MHP Shopify app (Remix template)"
```

The root `.gitignore` already excludes `.env*` and `node_modules/` for this
path — verify with `git status` before committing that neither shows up.

---

## Constraints / reminders

- Don't run `shopify app deploy` until you've reviewed `shopify.app.toml`.
  Deploy hits production Partner config.
- Never commit `.env`, `.env.development`, `prisma/dev.sqlite`, or
  `node_modules/`.
- The default template uses Prisma + SQLite for session storage. That's fine
  for dev. For production hosting, swap to Postgres (or use the existing
  TENx10 Supabase project if you want shared infra — separate schema).
- This app belongs to MHP, not DSR / TENx10. Keep its Partner org, billing,
  and webhooks scoped to `tom@myhydrationpack.com`.
