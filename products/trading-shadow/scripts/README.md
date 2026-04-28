# Trading Shadow Scripts

Operational scripts for the trading shadow + ideas inbox.

## Trading

- `halt_all.py` — emergency kill switch (closes all open positions)
- `run_track_a.py`, `run_track_b.py` — individual track runners (created later in plan)
- `daily_report.py`, `go_no_go.py` — reporting + graduation gates (created later)

## Ideas Inbox (Task 0b)

- `ideas_inbox_listener.py` — Discord bot, watches a channel, logs to `data/ideas_inbox.jsonl`. Run as long-lived process: `uv run python scripts/ideas_inbox_listener.py`.
- `review_inbox.py` — walk through unreviewed entries. `--mark-reviewed` flag clears them after display.
