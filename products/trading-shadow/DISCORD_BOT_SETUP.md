# Discord Chat Bridge — Setup

A single Discord bot that listens on three channels:
- **#ideas-inbox** — every message gets appended to `data/ideas_inbox.jsonl` for later review (existing functionality from `ideas_inbox_listener.py`)
- **#xai-chat** — type a message, Xai (the TENx10 management AI) replies in-channel
- **#claude-chat** — type a message, Claude (general assistant for the umbrella) replies in-channel

One bot, one token, one process. You can have all three channels active or just one — the bot only routes channels you've configured.

---

## Step 1 — Create the Discord application + bot

1. Go to https://discord.com/developers/applications
2. Top-right: **"New Application"**. Name it `TENx10 Chat Bridge` (or whatever — only you see it).
3. In the left sidebar: **"Bot"**. Click **"Add Bot"** → confirm.
4. Click **"Reset Token"** → copy the token. **This is shown ONCE.** Save it temporarily in a notepad — you'll paste it into `.env.paper` in Step 4.
5. **CRITICAL:** Toggle on **"MESSAGE CONTENT INTENT"** (under "Privileged Gateway Intents"). Without this, the bot can't read message text. Save changes.
6. The "Public Bot" toggle: leave OFF (you don't want random servers inviting your bot).

---

## Step 2 — Invite the bot to your server

1. In the same app's left sidebar: **"OAuth2"** → **"URL Generator"**.
2. Scopes: check **`bot`**.
3. Bot Permissions: check **`Send Messages`**, **`Read Message History`**, **`Add Reactions`**, **`View Channels`**. (You can add more later, but these are the minimum.)
4. Copy the generated URL at the bottom and paste it into your browser.
5. Pick your server, authorize. The bot now appears in your server's member list (offline until you start it).

---

## Step 3 — Get the channel IDs

Discord channel IDs are 18-19 digit numbers. To copy them:

1. In Discord (desktop or mobile), open **Settings → Advanced** → toggle **"Developer Mode"** ON.
2. Right-click any channel → **"Copy Channel ID"** (or press-and-hold on mobile).

You need three channel IDs. Recommended setup:
- Create a category called `xai-bridge` (optional but tidy)
- Create three text channels:
  - `#ideas-inbox` (for voice memos and quick captures)
  - `#xai-chat` (for talking to Xai)
  - `#claude-chat` (for talking to Claude / general help)
- Copy each channel's ID

You don't have to create all three. If you only want #xai-chat right now, skip the others — the bot only routes channels you've configured.

---

## Step 4 — Paste into `.env.paper`

Open `C:\Users\slash\OneDrive\10 Research Group\products\trading-shadow\.env.paper` in a text editor. Add these lines (or update if present):

```
DISCORD_BOT_TOKEN=<paste the token from Step 1.4>
IDEAS_INBOX_CHANNEL_ID=<paste channel ID, or leave empty>
XAI_CHAT_CHANNEL_ID=<paste channel ID, or leave empty>
CLAUDE_CHAT_CHANNEL_ID=<paste channel ID, or leave empty>
```

Optional tuning (defaults shown):
```
XAI_MODEL=claude-sonnet-4-6
CLAUDE_MODEL=claude-opus-4-7
CHAT_HISTORY_TURNS=12
```

Save the file.

---

## Step 5 — Start the bot

**Easy:** Double-click `scripts/start_chat_bridge.bat`. A console window opens, the bot logs in, and you'll see:

```
Logged in as TENx10 Chat Bridge#1234.
Listening on:
  ideas-inbox: channel 1234567890123456789
  xai-chat:    channel 9876543210987654321 (model=claude-sonnet-4-6)
  claude-chat: channel 5555555555555555555 (model=claude-opus-4-7)
```

The bot is now live. Closing the console window stops the bot.

**From terminal** (alternative):
```
cd "C:\Users\slash\OneDrive\10 Research Group\products\trading-shadow"
$env:MODE='paper'
.\.venv\Scripts\python.exe scripts\chat_bridge.py
```

---

## Step 6 — Test each channel

### #ideas-inbox
Just type any message. The bot reacts with ✅ and the message lands in `data/ideas_inbox.jsonl`. No reply.

### #xai-chat
Type: `what's the move on a $1500 offer for a 200-cap room with no marketing budget commitment?`

Expected: Xai responds with a specific recommendation, references promoter-grading framework, gives a dollar counter or a walk recommendation. Direct, lowercase-ish, no marketing-buzzword fluff.

### #claude-chat
Type: `summarize what we shipped today on trading-shadow`

Expected: Claude replies with a concise summary referencing the rollback handler + cutover slip + env fixes. Says "I don't have file system access from this Discord bot — switch to Claude Code if you want me to do something with files."

---

## Troubleshooting

**Bot stays offline / doesn't appear in member list**
- Token expired or wrong. Reset it in the Developer Portal, paste new value into `.env.paper`.

**Bot is online but doesn't respond to messages**
- Did you toggle ON "MESSAGE CONTENT INTENT" in the Developer Portal? Without it, `message.content` is always empty.
- Did you copy the right channel IDs? They must be the long numeric IDs, not the channel name.

**Bot responds but says "Xai call failed"**
- Anthropic key issue. Run `.\.venv\Scripts\python.exe scripts\verify_live_env.py --paper-only` to confirm the Anthropic key authenticates.

**Bot crashes on start with `ConnectionRefused` or rate-limit errors**
- Discord throttles new bots. Wait 60 seconds and retry.

**Bot says "(empty response)"**
- Anthropic returned no text. Usually means the prompt was empty or the model hit a content filter. Check the input.

**I want long answers without (1/2)(2/2) splits**
- Currently messages over ~1980 chars get split. The system prompt asks Claude to keep responses under 1800 chars. If splits are still happening too often, add `Be concise.` as the first line of your message.

---

## Architecture notes

- **One bot, multi-channel:** simpler to operate than three separate bots. One token to manage, one process to keep running.
- **In-memory conversation history:** keeps the last 12 user-assistant turn pairs per channel. Restart loses memory. For persistent memory, future work would write to Supabase or a JSONL file.
- **No Supabase live data in Xai bot yet:** the platform's `/api/agent` route injects roster, deals, and tasks into the prompt. The Discord version doesn't (would require a service-key endpoint on the platform). This means Xai-via-Discord is good for testing voice/style/frameworks but won't answer "what shows are confirmed for May?" — for that, use the platform UI.
- **Models:** Sonnet 4.6 for Xai (matches platform), Opus 4.7 for Claude general. Both configurable via `XAI_MODEL` / `CLAUDE_MODEL` env vars.

---

## Cost expectations

Anthropic API pricing as of 2026-04-30:
- Claude Sonnet 4.6: ~$3/MTok input, ~$15/MTok output
- Claude Opus 4.7: ~$15/MTok input, ~$75/MTok output

A typical 50-turn day in #xai-chat with ~500 token user inputs and ~800 token responses: roughly $0.20-$0.40/day.

Discord chat bots can run up costs fast if you leave them in a spammy channel. The bot only responds to YOUR messages (and ignores other bots), so as long as #xai-chat and #claude-chat are private to you, this is bounded.

---

*Setup doc v1 — 2026-04-30. Update if Discord changes its OAuth UI.*
