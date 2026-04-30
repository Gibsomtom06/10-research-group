# Gmail OAuth setup — one-time bootstrap

**Goal:** let `workers/sender.ts` send email AS `thomas@dirtysnatcha.com` via Gmail API.

**Time:** 10–15 minutes in Google Cloud Console + 1 minute running a Python script.

**Output:** three values (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN) pasted into `app/.env.local` and `workers/.env`.

---

## 1. Create / pick a Google Cloud project

1. Go to https://console.cloud.google.com/
2. Sign in as **thomas@dirtysnatcha.com** (important — this is the identity the booking inbox will send as)
3. Top bar → project dropdown → **New Project**
   - Name: `dba-booking` (or reuse an existing personal project)
   - Skip organization if personal Gmail
4. Wait ~30s for provisioning, then select the project

---

## 2. Enable the Gmail API

1. Left nav → **APIs & Services** → **Library**
2. Search `Gmail API` → click it → **Enable**

---

## 3. Configure the OAuth consent screen

1. Left nav → **APIs & Services** → **OAuth consent screen**
2. User type: **External** → Create
3. App info:
   - App name: `DBA — DirtySnatcha Booking`
   - User support email: `thomas@dirtysnatcha.com`
   - Developer contact: `thomas@dirtysnatcha.com`
   - Leave logo/domain blank for now
4. **Scopes** step → Add or remove scopes → filter `gmail.send` → check it → Update → Save & Continue
   - (Only `.../auth/gmail.send` — we are NOT reading Thomas's inbox with this client)
5. **Test users** step → Add Users → `thomas@dirtysnatcha.com` → Save
6. Back to summary. Publishing status will be **Testing** — that's fine. Tokens issued to test users don't expire as long as used within 6 months.

> **Why Testing is OK:** "Testing" mode only restricts _which users_ can consent (must be in the test-user list). It does NOT impose token lifetime limits for those test users. The 7-day refresh-token expiry only applies to External + Testing apps where the scope is _sensitive_; `gmail.send` is sensitive, but test-user refresh tokens issued for it stick around. If this ever breaks, publish the app or re-run `gmail_oauth_setup.py`.

---

## 4. Create the OAuth Client ID (Desktop app)

1. Left nav → **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Desktop app**
4. Name: `DBA sender worker` (any string)
5. **Create** → download the JSON → save as:
   ```
   C:\Users\Slash\10 Research Group\products\digital-booking-agent\scripts\client_secret.json
   ```
   Don't commit this file (already in `.gitignore`).

---

## 5. Run the setup script

```powershell
cd "C:\Users\Slash\10 Research Group\products\digital-booking-agent\scripts"
pip install google-auth-oauthlib google-auth
python gmail_oauth_setup.py
```

Flow:

1. Terminal prints a URL + opens a browser tab
2. Sign in as **thomas@dirtysnatcha.com**
3. Google warns "app isn't verified" → **Advanced** → **Go to DBA (unsafe)** (it's your own app)
4. Grant `Send email on your behalf` → **Continue**
5. Browser shows "authentication complete, you may close this tab"
6. Terminal prints:
   ```
   GOOGLE_OAUTH_CLIENT_ID=123456789012-abc...apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
   GOOGLE_OAUTH_REFRESH_TOKEN=1//0g...
   ```

---

## 6. Paste into env files

Open both files and fill in the three values:

- `app/.env.local`
- `workers/.env`

Both files already have the key names — just fill the `=` blanks.

**Double-check `SENDER_FROM_EMAIL=thomas@dirtysnatcha.com`** in `workers/.env` — must match the account you just consented as.

---

## 7. Dry-run verification

`workers/.env` ships with `SENDER_DRY_RUN=true`. First pass just logs what it would send.

```powershell
cd "C:\Users\Slash\10 Research Group\products\digital-booking-agent\workers"
npm install   # if not already
npm run worker:sender -- --once
```

Expected output: pulls one queued draft, logs "would send to ..." with subject + body preview + tracking-pixel URL, exits 0.

If that looks right:

1. In `workers/.env`, flip `SENDER_DRY_RUN=false`
2. In `/drafts` UI approve one low-stakes draft (a warm contact, not a cold one)
3. Re-run `npm run worker:sender -- --once`
4. Check the recipient received it + the `outreach_log` row shows `status='sent'` with `sent_at` stamped
5. If good: start the long-running worker with `npm run worker:sender` (no `--once`)

---

## Troubleshooting

**"google returned no refresh_token"** — you've consented before and Google won't re-issue. Revoke at https://myaccount.google.com/permissions → re-run the script.

**"invalid_grant" on first send** — refresh token was copied with leading/trailing whitespace, or the CLIENT_ID/SECRET in `.env` doesn't match the project the refresh token came from. Re-check all three values.

**"Precondition check failed"** — the Google account that consented doesn't match `SENDER_FROM_EMAIL`. Gmail won't let you send AS a different address via that token.

**App expires in 7 days** — shouldn't happen for test users on sensitive scopes, but if it does: publish the consent screen (**OAuth consent screen** → **Publish App**), or add verified-domain ownership later.

**Want to add inbound classification later** — bump `SCOPES` in `gmail_oauth_setup.py` to include `gmail.readonly` or `gmail.modify`, re-run the script, replace the refresh token. Don't keep stale tokens around.

---

## Cost

$0. Gmail API is free for personal use up to 1 billion quota units per day (we'll burn ~250/day max at current send cap).

---

## What we're NOT doing here

- No domain verification / DKIM — we send through Gmail's SMTP, it handles signing
- No app verification with Google — keeping Testing status until we're public
- No service account / domain-wide delegation — this is OAuth for a single user
- No separate OAuth for YouTube / Spotify — those are different scopes, different flows, wired separately
