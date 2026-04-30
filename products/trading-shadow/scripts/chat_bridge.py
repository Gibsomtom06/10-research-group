"""Discord chat bridge — single bot, multi-channel routing.

Three channels, one bot, one token:

  IDEAS_INBOX_CHANNEL_ID   ->  appends every message to data/ideas_inbox.jsonl
                               (mirrors ideas_inbox_listener.py behavior)

  XAI_CHAT_CHANNEL_ID      ->  forwards to Xai (Anthropic Claude with the
                               TENx10 platform's Xai system prompt). Replies
                               in-channel. Keeps last N turns per channel for
                               continuity.

  CLAUDE_CHAT_CHANNEL_ID   ->  forwards to Claude (Anthropic Claude with a
                               "you are Claude helping Thomas across his
                               business operations" prompt). Replies in-
                               channel. Same memory model.

Required env vars (in the .env file the bot loads — defaults to .env.paper):

  DISCORD_BOT_TOKEN         (from https://discord.com/developers/applications)
  IDEAS_INBOX_CHANNEL_ID    (right-click Discord channel -> Copy ID; needs Dev Mode)
  XAI_CHAT_CHANNEL_ID       (same)
  CLAUDE_CHAT_CHANNEL_ID    (same)
  ANTHROPIC_API_KEY         (sk-ant-api03-...)

Optional:
  XAI_MODEL                 (default: claude-sonnet-4-6 — matches platform)
  CLAUDE_MODEL              (default: claude-opus-4-7 — best reasoning)
  CHAT_HISTORY_TURNS        (default: 12 — keep last N user+assistant pairs)

Usage:
    .\\.venv\\Scripts\\python.exe scripts\\chat_bridge.py
or:
    Double-click scripts\\start_chat_bridge.bat

Architecture note: this is the MVP. It does NOT yet call into the
tenx10-platform /api/agent endpoint (which would inject live Supabase
roster/deals/tasks data). Xai responses here are prompt-only — useful for
testing voice and style, NOT for testing live data flow. Phase 2: add a
service-role-authenticated Discord endpoint to the platform and switch
the Xai handler to call it.
"""
from __future__ import annotations

import asyncio
import json
import os
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import discord
from anthropic import Anthropic
from dotenv import load_dotenv


# Load .env.{MODE} like config.py does. Default paper because it has the
# Anthropic key + Discord webhook + Discord bot token in one place.
MODE = os.environ.get("MODE", "paper")
ENV_FILE = Path(f".env.{MODE}")
if ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=False)
else:
    load_dotenv(override=False)


DISCORD_BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
IDEAS_INBOX_CHANNEL_ID = os.environ.get("IDEAS_INBOX_CHANNEL_ID")
XAI_CHAT_CHANNEL_ID = os.environ.get("XAI_CHAT_CHANNEL_ID")
CLAUDE_CHAT_CHANNEL_ID = os.environ.get("CLAUDE_CHAT_CHANNEL_ID")

XAI_MODEL = os.environ.get("XAI_MODEL", "claude-sonnet-4-6")
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-4-7")
CHAT_HISTORY_TURNS = int(os.environ.get("CHAT_HISTORY_TURNS", "12"))

QUEUE_PATH = Path("data/ideas_inbox.jsonl")
QUEUE_PATH.parent.mkdir(parents=True, exist_ok=True)
QUEUE_PATH.touch(exist_ok=True)


# Discord's per-message char limit. Long Claude responses get split.
DISCORD_MSG_LIMIT = 2000


# ---------------------------------------------------------------------------
# Xai system prompt (mirrored from products/tenx10-platform/src/app/api/agent/route.ts)
#
# This is the Xai prompt as of 2026-04-30. When the platform updates its
# prompt, this string should be re-synced. For now there are TWO copies of
# truth (TS + Python) — TODO: extract to a shared YAML and load from both.
# ---------------------------------------------------------------------------
XAI_SYSTEM_PROMPT = """You are Xai — the AI management team behind TENx10.

You are not a chatbot. You are a senior music industry operator: manager, booking strategist, label operator, and revenue architect — all running in parallel. You have managed touring artists, negotiated with promoters, run ad campaigns, and understand DSP algorithms at a technical level. You speak with authority because you have the data to back it up.

When the user is logged in, you already know who they are. Do not ask "who am I talking to?" — they're already in the system. Get straight to work.

## HOW YOU SPEAK
- Direct and specific. Never vague. Dollar amounts, dates, names, links.
- Say "Post this tonight at 7pm" not "You might want to consider posting something."
- Say "This show loses money at $4.80 CPT. Counter at $2,750 or walk." not "This offer may not align with your financial goals."
- Blunt but not rude. If something is bad, say it's bad and say why.
- Prioritize ruthlessly. Give 3 things that matter today, not 20 that matter eventually.

## CORE RULES
- The 2/3 majority vote applies ONLY to A&R demo submissions. Nothing else.
- The manager has final approval on all show offers.
- Promoter grades and venue grades are PRIVATE.
- Default commission: 10/10/80 (agent-routed) or 20/80 (direct).
- CPT is the north star metric for ad spend. Kill at $8+. Target <$5.
- Save-to-stream ratio > 10% triggers Discover Weekly + Release Radar.
- Track Popularity 20+ unlocks Release Radar; 30+ unlocks Discover Weekly.
- New ISRC every 6-8 weeks or Spotify Artist Popularity Score decays.
- An offer is NOT valid without all required fields. Run the 11-step decision engine.
- Each artist has a minimum guarantee floor; never recommend below floor without explicit strategic reasoning.

## WHAT YOU NEVER DO
- Never give legal advice. Say: "Flag this for a music attorney."
- Never guarantee outcomes.
- Never fabricate data.
- Never apply the 2/3 voting rule outside A&R submissions.
- Never use "Lee Silva" — the artist's real name is Leigh Bray (aka Lee Bray / DirtySnatcha).
- Never write content that sounds like a press release.

## WHO YOU WORK FOR — DSR / TENx10
- **Label:** DirtySnatcha Records
- **Primary Artist:** DirtySnatcha (Lee Bray, aka Leigh Bray)
- **Manager:** Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- **Primary Booking Agent:** Andrew Bass at AB Touring — andrew@abtouring.com
- **Distribution:** Virgin Music Group (VMG)
- **Default DS guarantee floor:** $1,500
- **Default ad spend per show:** $125 baseline (Shazam Spike $75 + Save Campaign $50)

## DISCORD-SPECIFIC NOTE
You are speaking through a Discord bot in Thomas's private server. You do NOT have live access to Supabase data here (no roster snapshot, no deals, no metrics). When asked something that needs live data ("show me today's bookings"), say so and tell Thomas to check the platform directly. For strategy, voice, framework, and decision-tree questions, you have everything you need — answer fully.

Keep responses under 1800 characters when possible (Discord splits messages awkwardly above 2000). For long answers, split into 2 messages with "(1/2)" "(2/2)" markers."""


CLAUDE_SYSTEM_PROMPT = """You are Claude — the same Claude assistant Thomas works with in his Claude Code terminal. You are speaking with him through a Discord bot in his private server.

Thomas runs 10 Research Group, an umbrella that includes:
- TENx10 (artist management platform — DSR is the live proof of concept)
- DirtySnatcha Records (artist label)
- MyHydrationPack (merch / hockey jerseys)
- Trading Shadow (Phase 0 of the Factory: AI agents that learn to trade with $20-$100 of real capital)
- Digital Booking Agent (DBA — booking + outreach for artists)
- WRS Rim Shop (client work)
- A "Factory" architecture: 5 layers of AI agents (Boss, Infrastructure, Departments, Projects, Shadows)
- A "Capitulate and Cultivate" strategy: rent foundation models, build orchestration + corpus + brains + shadows on top.

He has ADHD and information-spews ideas. The pattern that has cost him weeks is: spew ideas → context compaction → rebuild from scratch → context lost → repeat. The fix is durable BUILD_EVOLUTION.md logs and per-project BRAIN.md files. Do NOT propose "starting over" or "rebuilding from scratch" without an explicit log entry. Extend the foundation.

## HOW YOU HELP HIM HERE
- Be concise. Discord is a quick-fire medium.
- Be specific. File paths, dollar amounts, dates.
- Don't ask permission for trivial things — just do them.
- For risky/destructive things — confirm first.
- If you don't know something, say so. Don't fabricate.
- You do NOT have file system access from this Discord bot — you are pure conversation. If he wants you to do something with files, tell him to switch to Claude Code.

## CONTEXT
- Today is 2026-04-30 (or whatever the current date is)
- Trading Shadow's Friday cutover slipped to Tuesday 5/5 (foundation issues caught late)
- Multiple in-progress projects across the umbrella
- Thomas's voice: casual, direct, lowercase, no marketing buzzwords

Keep responses under 1800 characters when possible. For long answers, split into 2 messages with "(1/2)" "(2/2)" markers."""


# ---------------------------------------------------------------------------
# Per-channel conversation memory.
# Maps channel_id -> deque of (role, content) tuples. Bounded.
# ---------------------------------------------------------------------------
HISTORY: dict[int, deque[tuple[str, str]]] = {}


def _history_for(channel_id: int) -> deque[tuple[str, str]]:
    if channel_id not in HISTORY:
        # Each turn is user+assistant, so deque size = 2 * turns
        HISTORY[channel_id] = deque(maxlen=CHAT_HISTORY_TURNS * 2)
    return HISTORY[channel_id]


def _append_history(channel_id: int, role: str, content: str) -> None:
    _history_for(channel_id).append((role, content))


def _build_messages_for_anthropic(channel_id: int, new_user_msg: str) -> list[dict]:
    msgs = []
    for role, content in _history_for(channel_id):
        msgs.append({"role": role, "content": content})
    msgs.append({"role": "user", "content": new_user_msg})
    return msgs


# ---------------------------------------------------------------------------
# Anthropic call (sync — wrapped in run_in_executor to keep Discord async
# loop happy)
# ---------------------------------------------------------------------------
_anthropic_client: Optional[Anthropic] = None


def _client() -> Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        if not ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY missing in env")
        _anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
    return _anthropic_client


def _call_claude_sync(model: str, system_prompt: str, messages: list[dict], max_tokens: int = 1024) -> str:
    resp = _client().messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=messages,
    )
    # Concatenate all text blocks (Claude can return multiple).
    parts = [block.text for block in resp.content if hasattr(block, "text")]
    return "".join(parts).strip() or "(empty response)"


async def call_claude(model: str, system_prompt: str, messages: list[dict]) -> str:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None, _call_claude_sync, model, system_prompt, messages
    )


# ---------------------------------------------------------------------------
# Long-message splitter for Discord (2000 char limit)
# ---------------------------------------------------------------------------
def split_for_discord(text: str, limit: int = DISCORD_MSG_LIMIT - 20) -> list[str]:
    """Split text on paragraph boundaries first, then sentence, then hard."""
    if len(text) <= limit:
        return [text]
    chunks: list[str] = []
    remaining = text
    while len(remaining) > limit:
        # Try paragraph split
        cut = remaining.rfind("\n\n", 0, limit)
        if cut < limit // 2:
            cut = remaining.rfind("\n", 0, limit)
        if cut < limit // 2:
            cut = remaining.rfind(". ", 0, limit)
        if cut < limit // 2:
            cut = limit
        chunks.append(remaining[:cut].rstrip())
        remaining = remaining[cut:].lstrip()
    if remaining:
        chunks.append(remaining)
    # Add (n/m) markers
    if len(chunks) > 1:
        total = len(chunks)
        chunks = [f"{c}\n\n_({i + 1}/{total})_" for i, c in enumerate(chunks)]
    return chunks


# ---------------------------------------------------------------------------
# ideas-inbox queue append (mirrors ideas_inbox_listener.py)
# ---------------------------------------------------------------------------
def append_to_ideas_queue(*, message_id: int, author: str, text: str,
                          attachment_urls: list[str]) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message_id": message_id,
        "author": author,
        "text": text,
        "has_attachments": bool(attachment_urls),
        "attachment_urls": attachment_urls,
        "reviewed": False,
    }
    with QUEUE_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


# ---------------------------------------------------------------------------
# Discord client
# ---------------------------------------------------------------------------
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)


def _channel_id_int(env_value: Optional[str]) -> Optional[int]:
    if not env_value:
        return None
    try:
        return int(env_value)
    except ValueError:
        return None


IDEAS_INBOX_ID = _channel_id_int(IDEAS_INBOX_CHANNEL_ID)
XAI_CHAT_ID = _channel_id_int(XAI_CHAT_CHANNEL_ID)
CLAUDE_CHAT_ID = _channel_id_int(CLAUDE_CHAT_CHANNEL_ID)


@client.event
async def on_ready():
    print(f"Logged in as {client.user}.")
    routes = []
    if IDEAS_INBOX_ID:
        routes.append(f"  ideas-inbox: channel {IDEAS_INBOX_ID}")
    if XAI_CHAT_ID:
        routes.append(f"  xai-chat:    channel {XAI_CHAT_ID} (model={XAI_MODEL})")
    if CLAUDE_CHAT_ID:
        routes.append(f"  claude-chat: channel {CLAUDE_CHAT_ID} (model={CLAUDE_MODEL})")
    if not routes:
        print("WARN: no channel IDs configured. Set IDEAS_INBOX_CHANNEL_ID, "
              "XAI_CHAT_CHANNEL_ID, or CLAUDE_CHAT_CHANNEL_ID in .env.paper.")
    else:
        print("Listening on:")
        for r in routes:
            print(r)


async def _handle_chat(message: discord.Message, *, system_prompt: str, model: str, label: str) -> None:
    """Common path for xai-chat and claude-chat: send typing, call Claude,
    persist memory, post reply (split if needed)."""
    user_text = (message.content or "").strip()
    if not user_text:
        return

    async with message.channel.typing():
        try:
            channel_id = message.channel.id
            messages = _build_messages_for_anthropic(channel_id, user_text)
            reply = await call_claude(model, system_prompt, messages)
            _append_history(channel_id, "user", user_text)
            _append_history(channel_id, "assistant", reply)
        except Exception as e:
            reply = f":warning: {label} call failed: {type(e).__name__}: {e}"

    for chunk in split_for_discord(reply):
        await message.channel.send(chunk)


@client.event
async def on_message(message: discord.Message):
    if message.author == client.user:
        return  # ignore self
    if message.author.bot:
        return  # ignore other bots

    cid = message.channel.id

    # ROUTE 1: ideas-inbox (queue everything; no reply)
    if IDEAS_INBOX_ID and cid == IDEAS_INBOX_ID:
        text = message.content or ""
        attachment_urls = [a.url for a in message.attachments]
        append_to_ideas_queue(
            message_id=message.id,
            author=str(message.author),
            text=text,
            attachment_urls=attachment_urls,
        )
        # React so Thomas knows it landed
        try:
            await message.add_reaction("✅")  # ✅
        except Exception:
            pass
        return

    # ROUTE 2: Xai chat
    if XAI_CHAT_ID and cid == XAI_CHAT_ID:
        await _handle_chat(message, system_prompt=XAI_SYSTEM_PROMPT, model=XAI_MODEL, label="Xai")
        return

    # ROUTE 3: Claude chat
    if CLAUDE_CHAT_ID and cid == CLAUDE_CHAT_ID:
        await _handle_chat(message, system_prompt=CLAUDE_SYSTEM_PROMPT, model=CLAUDE_MODEL, label="Claude")
        return

    # Other channels: ignore.


def main() -> None:
    if not DISCORD_BOT_TOKEN:
        raise SystemExit(
            "DISCORD_BOT_TOKEN missing. See DISCORD_BOT_SETUP.md to create a bot "
            "and get a token, then paste it into .env.paper."
        )
    if not ANTHROPIC_API_KEY:
        raise SystemExit("ANTHROPIC_API_KEY missing in env.")
    if not (IDEAS_INBOX_ID or XAI_CHAT_ID or CLAUDE_CHAT_ID):
        raise SystemExit(
            "No channel IDs configured. Set at least one of "
            "IDEAS_INBOX_CHANNEL_ID, XAI_CHAT_CHANNEL_ID, CLAUDE_CHAT_CHANNEL_ID."
        )
    client.run(DISCORD_BOT_TOKEN)


if __name__ == "__main__":
    main()
