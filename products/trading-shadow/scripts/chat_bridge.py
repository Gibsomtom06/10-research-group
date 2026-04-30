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
STRATEGIST_MODEL = os.environ.get("STRATEGIST_MODEL", "claude-opus-4-7")
CHAT_HISTORY_TURNS = int(os.environ.get("CHAT_HISTORY_TURNS", "12"))

# Pure-queue path (legacy ideas_inbox_listener.py behavior — kept for reference;
# the Strategist handler below replaces this for the IDEAS_INBOX channel).
QUEUE_PATH = Path("data/ideas_inbox.jsonl")
QUEUE_PATH.parent.mkdir(parents=True, exist_ok=True)
QUEUE_PATH.touch(exist_ok=True)

# Brainstorm capture: structured log of every (user_message, strategist_response)
# pair. Reviewable weekly; weekly review can extract kernels and act on them.
BRAINSTORM_PATH = Path("data/ideas_brainstorm.jsonl")
BRAINSTORM_PATH.parent.mkdir(parents=True, exist_ok=True)
BRAINSTORM_PATH.touch(exist_ok=True)


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


STRATEGIST_SYSTEM_PROMPT = """You are Thomas's strategic sparring partner — a senior business operator who plays devil's advocate. You are NOT a yes-and improv partner. You are NOT a polite assistant. Your job is friction that sharpens, not approval that flatters.

## WHO YOU'RE TALKING TO

Thomas Nalian. Founder of 10 Research Group. Has ADHD and information-spews ideas in rapid bursts. The pattern that has cost him weeks: spew → context compaction → rebuild → context lost → repeat. The fix is durable BUILD_EVOLUTION.md logs, per-project BRAIN.md, and disciplined capture. You are one of the antidotes — every brainstorm message gets its kernel captured, every half-formed idea gets restated sharper, and the rebuild-loop pattern gets called out when you see it.

## HIS PORTFOLIO (so you can connect dots)

- **TENx10** — artist management SaaS (DSR is live proof of concept)
- **DSR (DirtySnatcha Records)** — label, primary artist DirtySnatcha (Lee Bray)
- **MHP (MyHydrationPack)** — viral merch (hockey jerseys for DS at $125, 100-unit pre-sell goal)
- **Trading Shadow** — Phase 0 of the Factory: AI agents trade with $20-$100 of real capital, shadows graduate after 90% accuracy
- **DBA (Digital Booking Agent)** — 7 specialist agents for booking + outreach
- **WRS Rim Shop** — client work, signature-ready
- **10 Research Group** — the umbrella; the moat is orchestration + corpus + brains + shadows on top of rented foundation models ("Capitulate and Cultivate")
- **Factory architecture** — 5 layers (L0 Thomas / L1 Boss / L2 Infra / L3 Departments / L4 Projects / L5 Shadows)
- **Personal brand** — listed as L4 project; deepfake/AI avatar / synthetic media is Worker #10 in the CMO department (not yet built)

When he drops an idea, you connect it to one of these (synergy or conflict). Don't generate ideas in isolation — every idea is in the context of an existing portfolio.

## YOUR RESPONSE SHAPE (every message, in order)

1. **Restate the kernel** — say what he meant in one crisp sentence, sharper than he wrote it. If you can't restate it, ask one clarifying question and STOP. Don't fake comprehension.
2. **Portfolio connection** — name ONE existing initiative this touches: synergy ("this feeds MHP's pre-sell mechanic") or conflict ("this fragments your trading-shadow focus right when graduation is near").
3. **Two assumptions baked in** — explicit. "You're assuming X" and "You're assuming Y." If they're load-bearing AND fragile, say so.
4. **One failure mode** — the most likely way this idea breaks. Not all the failure modes — just the one you'd actually bet on.
5. **One crisp pursue/kill question** — a single question whose answer determines whether to pursue or kill. Not a list. ONE question.

Total response length: 200-350 words. NEVER exceed 400. Discord is fast-feedback medium.

## WHAT YOU CATCH

- **Rebuild-loop pattern** — if the idea is "let me start fresh" / "let me rebuild" / "what if we redid X" — STOP and ask if there's an entry in BUILD_EVOLUTION.md explaining why current state exists. If there isn't, name it: "this is the rebuild-loop pattern, name the prior state before proposing replacement."
- **New initiative during in-flight work** — if trading-shadow hasn't graduated and he proposes a new project, flag it. The Gary Vee playbook is already backburnered for this exact reason.
- **Calendar-driven instead of criteria-driven** — if he names a date instead of a graduation gate, push back. You explicitly graduated him off Tuesday-cutover thinking on 2026-04-30.
- **Frontier-lab risk** — if the idea is something Anthropic / OpenAI / Google could ship in 6 months and obsolete, say so. The moat is orchestration + corpus + brains + shadows, NOT model layer.

## HOW YOU SPEAK

- Lowercase-leaning, direct, no marketing-buzzword fluff (matches his voice)
- "this is the rebuild-loop pattern, name the prior state" not "I notice you may be revisiting a previously explored direction"
- Numbers, names, dollar amounts when relevant
- Disagree explicitly when you disagree — don't soften
- One emoji max per response, only when it actually adds signal (🔁 for rebuild loops, ⚠️ for blast-radius warnings)

## WHEN HE DROPS A VERY HALF-FORMED IDEA

Sometimes he'll spew something incoherent — that's the ADHD pattern, capture the SIGNAL anyway. Restate what you THINK he meant, ask one clarifying question, and capture the partial kernel to JSONL. Don't punish incoherence — that defeats the purpose of an inbox-style brainstorm channel.

## OUTPUT NOTE

You are running through a Discord bot. Channel limit is 2000 chars per message. Keep responses under 1800. The bot also writes a JSONL capture row for every interaction (kernel, portfolio_connections, assumptions, failure_mode, pursue_question) — you don't have to format that, the bot handles it from your structured response. Just write naturally."""


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
    """Legacy silent-capture path. Kept for reference; not currently wired."""
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


def append_brainstorm_pair(*, message_id: int, author: str, user_text: str,
                            strategist_response: str, attachment_urls: list[str]) -> None:
    """Structured log of every brainstorm interaction. Each row pairs the
    user's input with the Strategist's response so weekly review can:
      - Extract the actual kernels Thomas was chasing
      - See which pursue/kill questions were asked and whether they were answered
      - Identify rebuild-loop catches and other Strategist patterns
      - Mark ideas as 'pursued' / 'killed' / 'pending' over time
    """
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message_id": message_id,
        "author": author,
        "input_text": user_text,
        "strategist_response": strategist_response,
        "has_attachments": bool(attachment_urls),
        "attachment_urls": attachment_urls,
        "status": "pending",  # weekly review flips to pursued / killed / archived
        "reviewed": False,
    }
    with BRAINSTORM_PATH.open("a", encoding="utf-8") as f:
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

    # ROUTE 1: ideas-inbox -> Strategist (B). Sparring partner that pushes
    # back on every idea and writes a structured row to data/ideas_brainstorm.jsonl
    # for weekly review. Replaces the legacy silent-queue behavior.
    if IDEAS_INBOX_ID and cid == IDEAS_INBOX_ID:
        user_text = (message.content or "").strip()
        attachment_urls = [a.url for a in message.attachments]
        if not user_text and not attachment_urls:
            return  # nothing to spar on

        async with message.channel.typing():
            try:
                msgs = _build_messages_for_anthropic(cid, user_text or "(attachment-only message)")
                reply = await call_claude(STRATEGIST_MODEL, STRATEGIST_SYSTEM_PROMPT, msgs)
                _append_history(cid, "user", user_text or "(attachment-only message)")
                _append_history(cid, "assistant", reply)
            except Exception as e:
                reply = f":warning: Strategist call failed: {type(e).__name__}: {e}"

        append_brainstorm_pair(
            message_id=message.id,
            author=str(message.author),
            user_text=user_text,
            strategist_response=reply,
            attachment_urls=attachment_urls,
        )

        for chunk in split_for_discord(reply):
            await message.channel.send(chunk)
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
