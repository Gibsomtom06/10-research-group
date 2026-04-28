"""Discord listener for voice-memo ideas inbox.

Watches a single Discord channel. Every message (text or auto-transcribed voice)
is appended to data/ideas_inbox.jsonl.

Usage:
    uv run python scripts/ideas_inbox_listener.py

Required env vars:
    DISCORD_BOT_TOKEN
    IDEAS_INBOX_CHANNEL_ID  (right-click channel → Copy ID; needs Developer Mode)
"""
import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import discord
from dotenv import load_dotenv

load_dotenv()

QUEUE_PATH = Path("data/ideas_inbox.jsonl")
QUEUE_PATH.parent.mkdir(parents=True, exist_ok=True)
QUEUE_PATH.touch(exist_ok=True)

CHANNEL_ID = int(os.environ["IDEAS_INBOX_CHANNEL_ID"])

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)


def append_to_queue(*, message_id: int, author: str, text: str, has_attachments: bool, attachment_urls: list[str]) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message_id": message_id,
        "author": author,
        "text": text,
        "has_attachments": has_attachments,
        "attachment_urls": attachment_urls,
        "reviewed": False,
    }
    with QUEUE_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


@client.event
async def on_ready():
    print(f"✅ Logged in as {client.user}. Watching channel {CHANNEL_ID}.")


@client.event
async def on_message(message: discord.Message):
    if message.author == client.user:
        return
    if message.channel.id != CHANNEL_ID:
        return

    text = message.content or ""
    attachment_urls = [a.url for a in message.attachments]
    has_attachments = bool(message.attachments)

    # Voice messages: Discord includes transcript in message.content on mobile
    # Attachments include the .ogg audio file URL — kept for archival
    append_to_queue(
        message_id=message.id,
        author=str(message.author),
        text=text,
        has_attachments=has_attachments,
        attachment_urls=attachment_urls,
    )
    print(f"[{datetime.now(timezone.utc).isoformat()}] queued from {message.author}: {text[:80]}{'...' if len(text) > 80 else ''}")


def main():
    token = os.environ["DISCORD_BOT_TOKEN"]
    client.run(token)


if __name__ == "__main__":
    main()
