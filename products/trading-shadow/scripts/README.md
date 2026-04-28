# Trading Shadow Scripts

Operational scripts for the trading shadow + ideas inbox.

## Trading

- `halt_all.py` — emergency kill switch (closes all open positions)
- `run_track_a.py`, `run_track_b.py` — individual track runners (created later in plan)
- `daily_report.py`, `go_no_go.py` — reporting + graduation gates (created later)

## Ideas Inbox (Task 0b)

- `ideas_inbox_listener.py` — Discord bot, watches a channel, logs to `data/ideas_inbox.jsonl`. Run as long-lived process: `uv run python scripts/ideas_inbox_listener.py`.
- `review_inbox.py` — walk through unreviewed entries. `--mark-reviewed` flag clears them after display.

## Conversation Shadow (Task 0c)

- `conversation_shadow_runner.py` — periodically reads `../../data/conversation_log/*.jsonl`, has Ollama (`llama3.1:8b`) predict what Claude would say to each user prompt, saves to `data/shadow_predictions.jsonl`. Run as long-lived process: `uv run python scripts/conversation_shadow_runner.py --watch`.

The shadow doesn't act on these predictions — it just learns by predicting and storing. Future accuracy scoring will compare predictions to actual Claude responses.
