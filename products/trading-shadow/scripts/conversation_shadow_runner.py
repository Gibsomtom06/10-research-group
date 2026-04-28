"""Conversation Shadow Runner — Ollama predicts what Claude would say to each user prompt.

Watches data/conversation_log/*.jsonl, parses Claude Code session transcripts,
extracts (user-prompt, claude-response) pairs, and asks the local Ollama model
to predict the response. Stores predictions to data/shadow_predictions.jsonl
for later accuracy scoring.

Usage:
    uv run python scripts/conversation_shadow_runner.py                # one pass
    uv run python scripts/conversation_shadow_runner.py --watch        # poll every 5 min

Env vars:
    OLLAMA_HOST (default http://localhost:11434)
    OLLAMA_MODEL (default llama3.1:8b)
"""
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import ollama
from dotenv import load_dotenv

load_dotenv()

CORPUS_DIR = Path("C:/Users/Slash/10 Research Group/data/conversation_log")
PREDICTIONS_PATH = Path("data/shadow_predictions.jsonl")
PROCESSED_INDEX_PATH = Path("data/shadow_processed_index.json")

OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")

SHADOW_SYSTEM = """You are predicting what Claude would say next in a conversation with Thomas Nalian.

Thomas runs a music industry / AI agency factory. He talks fast, has ADHD, and works with Claude on architecture, code, business decisions.

You are NOT Claude. You are a SHADOW that learns from Claude's responses by predicting them.

Given a user message, output your best guess at how Claude would respond.

Be concise. Match the tone Thomas+Claude use (terse, decisive, action-oriented). When in doubt, ask a clarifying question."""


def _ensure_dirs():
    PREDICTIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROCESSED_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    PREDICTIONS_PATH.touch(exist_ok=True)


def _load_processed_index() -> dict:
    if PROCESSED_INDEX_PATH.exists():
        return json.loads(PROCESSED_INDEX_PATH.read_text(encoding="utf-8"))
    return {}


def _save_processed_index(idx: dict) -> None:
    PROCESSED_INDEX_PATH.write_text(json.dumps(idx, indent=2), encoding="utf-8")


def _parse_session(jsonl_path: Path) -> list[dict]:
    """Parse a Claude Code session transcript and return turn pairs.

    Each turn pair = {user_message, claude_response, claude_turn_id}.
    Claude Code transcripts have one JSON object per line representing
    user messages, assistant responses, and tool calls.
    """
    pairs = []
    last_user_msg = None

    if not jsonl_path.exists():
        return pairs

    for line_no, line in enumerate(jsonl_path.read_text(encoding="utf-8").splitlines()):
        if not line.strip():
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue

        # Heuristic parsing — Claude Code JSONL shape varies. Extract type.
        msg_type = obj.get("type") or obj.get("role")
        msg = obj.get("message") or obj
        role = msg.get("role") if isinstance(msg, dict) else None

        if msg_type == "user" or role == "user":
            content = msg.get("content") if isinstance(msg, dict) else obj.get("content", "")
            if isinstance(content, list):
                # Multi-part content — take the text part(s)
                content = "\n".join(c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text")
            if content and isinstance(content, str):
                last_user_msg = {
                    "line_no": line_no,
                    "text": content,
                    "timestamp": obj.get("timestamp") or msg.get("timestamp"),
                }

        elif msg_type == "assistant" or role == "assistant":
            content = msg.get("content") if isinstance(msg, dict) else obj.get("content", "")
            if isinstance(content, list):
                content = "\n".join(c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text")
            if content and isinstance(content, str) and last_user_msg:
                pairs.append({
                    "user_text": last_user_msg["text"],
                    "claude_text": content,
                    "claude_turn_id": obj.get("uuid") or f"{jsonl_path.name}:{line_no}",
                    "user_timestamp": last_user_msg.get("timestamp"),
                    "claude_timestamp": obj.get("timestamp") or msg.get("timestamp"),
                    "session_file": jsonl_path.name,
                })
                last_user_msg = None

    return pairs


def _predict(user_text: str) -> str:
    """Have Ollama predict Claude's response."""
    truncated = user_text[:3000]  # cap input to keep latency reasonable
    resp = ollama.chat(
        model=OLLAMA_MODEL,
        messages=[
            {"role": "system", "content": SHADOW_SYSTEM},
            {"role": "user", "content": truncated},
        ],
        options={"temperature": 0.3, "num_predict": 800},
    )
    return resp["message"]["content"]


def _append_prediction(pair: dict, prediction: str) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_file": pair["session_file"],
        "claude_turn_id": pair["claude_turn_id"],
        "user_text": pair["user_text"][:1000],
        "claude_text": pair["claude_text"][:2000],
        "shadow_prediction": prediction,
        "model": OLLAMA_MODEL,
    }
    with PREDICTIONS_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def run_one_pass() -> int:
    """Process new turns from all session files. Returns count of new predictions."""
    _ensure_dirs()
    processed = _load_processed_index()
    new_predictions = 0

    if not CORPUS_DIR.exists():
        print(f"⚠ Corpus dir does not exist: {CORPUS_DIR}")
        return 0

    for session_file in CORPUS_DIR.glob("*.jsonl"):
        pairs = _parse_session(session_file)
        already_processed = set(processed.get(session_file.name, []))
        new_pairs = [p for p in pairs if p["claude_turn_id"] not in already_processed]

        if not new_pairs:
            continue

        print(f"[{session_file.name}] {len(new_pairs)} new turn(s) to shadow")
        for pair in new_pairs:
            try:
                prediction = _predict(pair["user_text"])
                _append_prediction(pair, prediction)
                already_processed.add(pair["claude_turn_id"])
                new_predictions += 1
                print(f"  shadowed turn {pair['claude_turn_id'][:16]}... ({len(prediction)} chars predicted)")
            except Exception as e:
                print(f"  shadow failed on {pair['claude_turn_id'][:16]}...: {type(e).__name__}: {e}")

        processed[session_file.name] = list(already_processed)

    _save_processed_index(processed)
    return new_predictions


def main():
    watch_mode = "--watch" in sys.argv
    if watch_mode:
        print(f"Watch mode: polling every 5 min. Model={OLLAMA_MODEL}")
        while True:
            n = run_one_pass()
            if n > 0:
                print(f"  --> {n} new predictions saved to {PREDICTIONS_PATH}")
            time.sleep(300)
    else:
        n = run_one_pass()
        print(f"Done. {n} new predictions saved to {PREDICTIONS_PATH}")


if __name__ == "__main__":
    main()
