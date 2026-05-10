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
import time
import traceback
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import discord
from anthropic import Anthropic
from dotenv import load_dotenv

try:
    from supabase import create_client as _supabase_create_client, Client as _SupabaseClient
except ImportError:  # pragma: no cover — bot will fall back to no-live-context mode
    _supabase_create_client = None
    _SupabaseClient = None


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

# Supabase (read-only, service-role) — used to inject live manager context into
# the Xai system prompt on every #briefing turn. NEXT_PUBLIC_SUPABASE_URL is
# accepted as an alias because tenx10's .env.local uses that name.
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
# Manager identity for the live-context block. The platform's /api/agent route
# resolves this from the authenticated user; here we hard-code Thomas's manager
# row since Discord doesn't have an auth concept.
MANAGER_USER_ID = os.environ.get("MANAGER_USER_ID")  # uuid in auth.users / artists.manager_id
MANAGER_EMAIL = os.environ.get("MANAGER_EMAIL", "thomas@dirtysnatcha.com")

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
You are speaking through a Discord bot in Thomas's private server. A live Supabase manager-context block (roster, upcoming confirmed shows, pipeline negotiations, open tasks, 90-day revenue) is prepended to this prompt on every turn — refresh window is 5 minutes per channel. Use the data first; don't tell Thomas to "check the platform directly" for things you can already see.

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
# Live Supabase manager context (Phase 1 of "everything connected").
#
# Mirrors src/app/api/agent/route.ts:138 buildManagerContext from the tenx10
# platform: pull the manager's roster, upcoming confirmed shows, active
# pipeline deals, open tasks, and 90-day confirmed revenue. Cache per Discord
# channel for 5 minutes — long enough to avoid hammering Supabase on rapid-
# fire turns, short enough that #briefing answers reflect today's reality.
#
# Failure mode: if Supabase is unreachable (no key, network error, schema
# drift), log to stdout and fall through to the original prompt minus the
# live-context block. The bot must keep responding even when live data is
# down.
# ---------------------------------------------------------------------------
LIVE_CONTEXT_TTL_SECONDS = 5 * 60
_live_context_cache: dict[int, tuple[float, str]] = {}
_supabase_singleton = None  # lazy init; keep optional supabase import safe


def _supabase_client():
    global _supabase_singleton
    if _supabase_singleton is not None:
        return _supabase_singleton
    if _supabase_create_client is None:
        return None
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    try:
        _supabase_singleton = _supabase_create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        return _supabase_singleton
    except Exception as e:  # pragma: no cover
        print(f"[live-context] supabase client init failed: {type(e).__name__}: {e}")
        return None


def _build_xai_live_context_sync() -> Optional[str]:
    """Mirror of buildManagerContext() in tenx10's src/app/api/agent/route.ts.

    Pulls Thomas's roster + deals + tasks + 90d revenue using the service-role
    key (Discord has no auth concept). Returns a formatted string ready to
    prepend to the Xai system prompt, or None on any failure (so the caller
    can fall back to prompt-only mode).
    """
    sb = _supabase_client()
    if sb is None:
        return None
    if not MANAGER_USER_ID:
        return None

    today = datetime.now(timezone.utc).date().isoformat()
    ninety_days_ago = (datetime.now(timezone.utc).date()).isoformat()
    # 90-day window: today minus 90 days
    from datetime import timedelta
    ninety_days_ago = (datetime.now(timezone.utc).date() - timedelta(days=90)).isoformat()

    try:
        artists_resp = (
            sb.table("artists")
            .select("id, name, stage_name, genre, spotify_artist_id, is_managed")
            .eq("manager_id", MANAGER_USER_ID)
            .order("name")
            .execute()
        )
        artists = artists_resp.data or []
    except Exception as e:
        print(f"[live-context] artists query failed: {type(e).__name__}: {e}")
        return None

    if not artists:
        return (
            f"MANAGER CONTEXT — THOMAS NALIAN / TENx10\n"
            f"Today: {today}\n"
            f"Manager: {MANAGER_EMAIL}\n"
            f"No artists on roster yet."
        )

    artist_ids = [a["id"] for a in artists]
    artist_map = {a["id"]: (a.get("stage_name") or a.get("name") or "Unknown") for a in artists}

    upcoming_deals: list = []
    pending_deals: list = []
    open_tasks: list = []
    recent_deals: list = []

    try:
        upcoming_deals = (
            sb.table("deals")
            .select("id, title, show_date, offer_amount, status, artist_id, deal_points")
            .in_("artist_id", artist_ids)
            .eq("status", "confirmed")
            .gte("show_date", today)
            .order("show_date", desc=False)
            .limit(15)
            .execute()
        ).data or []
    except Exception as e:
        print(f"[live-context] upcoming_deals failed: {type(e).__name__}: {e}")

    try:
        pending_deals = (
            sb.table("deals")
            .select("id, title, show_date, offer_amount, status, artist_id, deal_points")
            .in_("artist_id", artist_ids)
            .in_("status", ["inquiry", "offer", "negotiating"])
            .order("show_date", desc=False)
            .limit(10)
            .execute()
        ).data or []
    except Exception as e:
        print(f"[live-context] pending_deals failed: {type(e).__name__}: {e}")

    try:
        open_tasks = (
            sb.table("tasks")
            .select("id, title, due_date, status, artist_id")
            .in_("artist_id", artist_ids)
            .neq("status", "done")
            .order("due_date", desc=False)
            .limit(10)
            .execute()
        ).data or []
    except Exception as e:
        print(f"[live-context] open_tasks failed: {type(e).__name__}: {e}")

    try:
        recent_deals = (
            sb.table("deals")
            .select("offer_amount, status, artist_id, show_date")
            .in_("artist_id", artist_ids)
            .in_("status", ["confirmed", "completed"])
            .gte("show_date", ninety_days_ago)
            .execute()
        ).data or []
    except Exception as e:
        print(f"[live-context] recent_deals failed: {type(e).__name__}: {e}")

    # Roster lines
    roster_lines = []
    for a in artists:
        name = a.get("stage_name") or a.get("name") or "Unknown"
        role = "label act" if a.get("is_managed") is False else "managed"
        suffix = ""
        if a.get("genre"):
            suffix += f" · {a['genre']}"
        if a.get("spotify_artist_id"):
            suffix += " · Spotify linked"
        roster_lines.append(f"- {name} ({role}){suffix}")
    roster_block = "\n".join(roster_lines)

    # Confirmed upcoming shows
    confirmed_lines = []
    for d in upcoming_deals:
        pts = d.get("deal_points") or {}
        if not isinstance(pts, dict):
            pts = {}
        city = pts.get("city") or d.get("title") or "?"
        state = f", {pts.get('state')}" if pts.get("state") else ""
        artist = artist_map.get(d.get("artist_id"), "Unknown")
        amt = d.get("offer_amount")
        amt_str = f" · ${int(amt):,}" if amt not in (None, "") else ""
        confirmed_lines.append(f"- {d.get('show_date')}: {city}{state} · {artist}{amt_str}")
    confirmed_block = "\n".join(confirmed_lines) or "None confirmed."

    # Pipeline (negotiating / offer / inquiry)
    pipeline_lines = []
    for d in pending_deals:
        pts = d.get("deal_points") or {}
        if not isinstance(pts, dict):
            pts = {}
        city = pts.get("city") or d.get("title") or "?"
        artist = artist_map.get(d.get("artist_id"), "Unknown")
        amt = d.get("offer_amount")
        amt_str = f" · ${int(amt):,}" if amt not in (None, "") else ""
        status_str = (d.get("status") or "?").upper()
        pipeline_lines.append(f"- [{status_str}] {city} · {artist}{amt_str}")
    pipeline_block = "\n".join(pipeline_lines) or "Pipeline clear."

    # Open tasks (no priority column on tasks today; route.ts handles missing
    # priority with a NORMAL fallback — match that behavior)
    task_lines = []
    for t in open_tasks:
        due = f" · due {t.get('due_date')}" if t.get("due_date") else ""
        whose = artist_map.get(t.get("artist_id"), "General")
        task_lines.append(f"- [NORMAL] {t.get('title')}{due} · {whose}")
    task_block = "\n".join(task_lines) or "No open tasks."

    # 90-day confirmed revenue
    total_90d = 0
    for d in recent_deals:
        try:
            total_90d += int(float(d.get("offer_amount") or 0))
        except (TypeError, ValueError):
            pass

    return (
        f"MANAGER CONTEXT — THOMAS NALIAN / TENx10\n"
        f"Today: {today}\n\n"
        f"ROSTER ({len(artists)} artists):\n{roster_block}\n\n"
        f"UPCOMING CONFIRMED SHOWS:\n{confirmed_block}\n\n"
        f"PIPELINE ({len(pending_deals)} active negotiations):\n{pipeline_block}\n\n"
        f"OPEN TASKS:\n{task_block}\n\n"
        f"90-DAY CONFIRMED REVENUE: ${total_90d:,}"
    )


def _get_cached_live_context(channel_id: int) -> Optional[str]:
    """Return cached live-context for this channel if fresh, else rebuild.

    Cache is keyed per channel so each Discord room sees its own refresh
    window. Returns None on any failure path; caller treats None as
    "skip the live block, use the bare system prompt."
    """
    now = time.time()
    cached = _live_context_cache.get(channel_id)
    if cached and (now - cached[0]) < LIVE_CONTEXT_TTL_SECONDS:
        return cached[1]
    try:
        block = _build_xai_live_context_sync()
    except Exception as e:
        print(f"[live-context] unhandled error: {type(e).__name__}: {e}")
        traceback.print_exc()
        block = None
    if block:
        _live_context_cache[channel_id] = (now, block)
    return block


async def get_live_context_for_channel(channel_id: int) -> Optional[str]:
    """Async wrapper — supabase-py is sync, so push to executor like Anthropic."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _get_cached_live_context, channel_id)


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
        live = "live-supabase" if (_supabase_client() is not None and MANAGER_USER_ID) else "prompt-only"
        routes.append(f"  xai-chat:    channel {XAI_CHAT_ID} (model={XAI_MODEL}, {live})")
    if CLAUDE_CHAT_ID:
        routes.append(f"  claude-chat: channel {CLAUDE_CHAT_ID} (model={CLAUDE_MODEL})")
    if not routes:
        print("WARN: no channel IDs configured. Set IDEAS_INBOX_CHANNEL_ID, "
              "XAI_CHAT_CHANNEL_ID, or CLAUDE_CHAT_CHANNEL_ID in .env.paper.")
    else:
        print("Listening on:")
        for r in routes:
            print(r)


async def _handle_chat(message: discord.Message, *, system_prompt: str, model: str, label: str,
                        inject_live_context: bool = False) -> None:
    """Common path for xai-chat and claude-chat: send typing, call Claude,
    persist memory, post reply (split if needed).

    When inject_live_context=True (Xai channel), prepend a fresh-or-cached
    Supabase manager-context block to the system prompt. 5-min TTL per
    channel. If Supabase is unreachable, fall through to the bare prompt
    so the bot keeps responding.
    """
    user_text = (message.content or "").strip()
    if not user_text:
        return

    async with message.channel.typing():
        try:
            channel_id = message.channel.id
            effective_system_prompt = system_prompt
            if inject_live_context:
                live_block = await get_live_context_for_channel(channel_id)
                if live_block:
                    effective_system_prompt = f"{live_block}\n\n---\n\n{system_prompt}"
            messages = _build_messages_for_anthropic(channel_id, user_text)
            reply = await call_claude(model, effective_system_prompt, messages)
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

    # ROUTE 2: Xai chat — gets live Supabase manager context prepended on every
    # turn (Phase 1 of "everything connected", 2026-05-09). Cached 5 min/channel.
    if XAI_CHAT_ID and cid == XAI_CHAT_ID:
        await _handle_chat(
            message,
            system_prompt=XAI_SYSTEM_PROMPT,
            model=XAI_MODEL,
            label="Xai",
            inject_live_context=True,
        )
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
