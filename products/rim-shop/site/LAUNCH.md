# Rim Shop — Launch instructions

Self-contained single-page site for Wheel Repair Specialists of Michigan. One HTML file, one JSON fixture, no dependencies, no build step.

---

## What's in this folder

- **`index.html`** — the site (916 lines, 45KB)
- **`_products.json`** — 60 ready-to-sell products extracted from WRS_Merchant_Feed_FINAL.csv
- **`package.json` / `tsconfig.json`** — scaffolding for a future Next.js upgrade (ignore for now)

---

## Preview locally

The site fetches `_products.json` via JavaScript, which browsers block when opening an HTML file directly from disk (`file://` protocol). You need a tiny static server.

```powershell
# From this folder:
cd "C:\Users\Slash\10 Research Group\products\rim-shop\site"

# Option A — Python (if installed):
python -m http.server 8000
# Open: http://localhost:8000

# Option B — Node:
npx serve .
# Open: the URL it prints

# Option C — VS Code: right-click index.html → Open with Live Server
```

---

## Deploy to production (free)

### Fastest: Netlify Drop (2 minutes, no account required for preview)

1. Go to https://app.netlify.com/drop
2. Drag this entire `site/` folder into the drop zone
3. Netlify gives you a URL like `https://random-name.netlify.app` — that's live
4. (Optional) Sign in and claim the site, then point `wrs-mi.com` DNS at it

### More permanent: Vercel

```powershell
cd "C:\Users\Slash\10 Research Group\products\rim-shop\site"
npx vercel deploy --prod
# First run: sign in / link project. Subsequent: instant deploy.
```

### Or: any static host

The folder is 100% static. GitHub Pages, Cloudflare Pages, S3 + CloudFront — any of them work with zero configuration.

---

## Google Merchant Center setup (after site is live)

1. Verify domain ownership in Google Search Console (TXT record or HTML file)
2. Claim the domain in Merchant Center: https://merchants.google.com
3. Upload `_products.json` as the product feed — OR submit the URL of `/_products.json` on your live site as a scheduled fetch
4. Wait 1-3 days for initial product review (refurbished condition, no GTIN required)
5. Products show up in Google Shopping with organic listings (free) + optional Shopping Ads

The site has proper schema.org Product markup baked into every inventory card, so GMC's crawler can also ingest products directly from the live pages if the feed upload fails.

---

## What the chatbot can handle right now (no API key needed)

The FAB button at bottom-right opens an inline chat. It knows:
- **Pricing** — extracts wheel size from user text, returns the right tier ("for 22\" wheels, $145-$155")
- **Full pricing table** on demand
- **Turnaround** — 2 days vehicle drop vs 1-2 weeks loose wheels
- **Hours / location / phone** — all from the SYSTEM_PROMPT
- **Damage severity** — deflects to photo submission + phone
- **Specific wheel availability** — points at the inventory search
- **Appointment booking** — nudges to the form
- **OEM replacement inquiries**
- **Brake caliper / suspension / frame pricing**

Quick-reply buttons show on the opening message for most-common questions.

To upgrade to full Claude-powered chat: add a serverless function at `/api/chat` that proxies to Anthropic with the SYSTEM_PROMPT, update `routeChat()` in index.html to call that endpoint instead of the local regex. Leaves the fallback intact if the API is down.

---

## Contact form

Form submission uses `mailto:info@wrs-mi.com` as a zero-backend fallback. It opens the user's email client with subject + body pre-filled. For production:
- Better: point to a Formspree / Getform / Netlify Forms endpoint so submissions land in a dashboard
- Best: serverless function that writes to a database + sends Thomas a Slack ping

---

## What still needs adjustment before full launch

- **Real product images** — currently using `shutterstock_1834461940-scaled.jpg` placeholder from wrs-mi.com for every product. Need individual photos or a consistent finish-based placeholder set.
- **Replace `info@wrs-mi.com`** in the mailto fallback with a real monitored inbox (or swap to a form backend).
- **Google Analytics / Meta Pixel** — not installed. Add tags if running paid campaigns.
- **Privacy policy + Terms** — required for GMC approval. Add `/privacy` and `/terms` pages before submitting the feed.
- **CSV → JSON update script** — right now `_products.json` is a one-time extract. For live inventory sync, point the site at `/_products.json` on a server that regenerates from the WRS spreadsheet daily.

---

## Origin

Built overnight 2026-04-24 from:
- `notebook-raw.txt` (NotebookLM dump, 949 lines)
- `chatbot/SYSTEM_PROMPT.md` (86 lines)
- `PILOT_BRIEF.md` (145 lines)
- `WRS_Merchant_Feed_FINAL.csv` (981 rows, 60 ready-to-sell filtered)

All real WRS info — 10500 W 8 Mile Rd Ferndale MI, (248) 900-9100, Mon-Fri 8-5, 60+ years, actual pricing tiers. No placeholder content except product images.
