# Trading Shadow A/B Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a paper-to-live A/B trading test (2 Claude trader agents + 2 Ollama shadows) with Track A live Friday 2026-05-01 ($20 equities cap) and Track B live Tuesday 2026-05-05 ($20 equities cap), hard guardrails enforced pre-submission, and shadow learning instrumented from day one.

**Architecture:** Python service runs locally on Thomas's machine. Claude Trader = Anthropic SDK calls with strategy + market context, returns decisions. Ollama Shadow = local Llama 3.1 / Qwen running parallel predictions, scored against Claude's actual choices. Alpaca = paper + live broker (single-broker for simplicity). JSONL append-only decision log feeds shadow training corpus. Discord webhook = human-in-loop reporting. Pre-trade guardrails enforced as a hard filter before any submission.

**Tech Stack:**
- Python 3.11+ with `uv` for env management
- `anthropic` (Claude API)
- `alpaca-py` (broker)
- `ollama` (local LLM client)
- `yfinance` (historical data fallback)
- `requests` (Discord webhook)
- `pytest` + `pytest-mock` (testing)
- `python-dotenv` (config)

**Timeline (calendar-driven, hard deadlines):**
- **Mon 4/27 night** (TONIGHT, ~4 hrs): scaffold + accounts + decision log + Discord reporter (Tasks 1-7)
- **Tue 4/28** (~6 hrs): broker client + guardrails + market data + backtest engine (Tasks 8-14)
- **Wed 4/29** (~6 hrs): strategy + Claude trader + Ollama shadow + accuracy tracker (Tasks 15-21)
- **Thu 4/30** (~3 hrs): paper trading both tracks + Track A go/no-go review (Tasks 22-25)
- **Fri 5/1** (~2 hrs morning): Track A live cutover (Task 26)
- **Tue 5/5** (~1 hr morning): Track B live cutover (Task 27)

**Working principles:**
- TDD: every deterministic component (guardrails, decision log, backtest math, strategy signals, accuracy tracker) gets a failing test FIRST
- LLM-driven components (Claude Trader, Ollama Shadow) have integration tests with mocks; real-LLM smoke tests separately
- Commit after every task — frequent commits, never batch
- Hard guardrails block submission BEFORE the broker — never trust LLM output blindly
- Discord reports every meaningful event from day one — visibility is non-negotiable

---

## File Structure

```
10 Research Group/products/trading-shadow/
├── BRAIN.md                       # project context (per workflow rules)
├── README.md                      # quick start
├── pyproject.toml                 # dependencies
├── .env.example                   # required env vars (no secrets)
├── .gitignore
├── src/trading_shadow/
│   ├── __init__.py
│   ├── config.py                  # env loading + constants
│   ├── decision_log.py            # JSONL append-only log
│   ├── discord_reporter.py        # webhook poster
│   ├── alpaca_client.py           # broker wrapper
│   ├── guardrails.py              # pre-trade checks
│   ├── market_data.py             # live + historical
│   ├── backtest.py                # backtest engine
│   ├── strategy.py                # signal generation (deterministic)
│   ├── prompts.py                 # system prompts for traders
│   ├── claude_trader.py           # Anthropic-driven decisions
│   ├── shadow.py                  # Ollama shadow predictions
│   ├── accuracy_tracker.py        # shadow vs claude match
│   └── runner.py                  # main paper/live loop
├── scripts/
│   ├── run_track_a.py
│   ├── run_track_b.py
│   ├── halt_all.py                # emergency kill switch
│   └── daily_report.py
├── tests/
│   ├── test_decision_log.py
│   ├── test_discord_reporter.py
│   ├── test_alpaca_client.py
│   ├── test_guardrails.py
│   ├── test_market_data.py
│   ├── test_backtest.py
│   ├── test_strategy.py
│   └── test_accuracy_tracker.py
└── data/                          # local data (gitignored)
    ├── decisions.jsonl
    └── shadow_corpus/
```

Each file has one clear responsibility. `runner.py` is the only file that wires components together; everything else is independently testable.

---

## TONIGHT — Monday 2026-04-27

### Task 0a: Conversation Capture System (Layer B shadow corpus)

**Why this task exists:** Per the factory architecture spec, the shadow team captures TWO streams — (A) agent task execution, (B) Thomas+Claude strategic conversations. Layer B has zero infrastructure currently. This task fixes that BEFORE the trading build so every subsequent conversation (including the trading build itself) gets logged into the shadow corpus.

**Files:**
- Create: `10 Research Group/data/conversation_log/` (gitignored)
- Create: `10 Research Group/data/conversation_log/README.md`
- Create: `~/.claude/hooks/capture_conversation.sh` (or .ps1 on Windows)
- Modify: `~/.claude/settings.json` (add Stop hook entry)
- Modify: `10 Research Group/.gitignore` (exclude data/conversation_log/)
- Modify: `10 Research Group/BRAIN.md` (note capture is online)

- [ ] **Step 1: Create log directory + README**

```bash
mkdir -p "C:/Users/Slash/10 Research Group/data/conversation_log"
```

README content:
```markdown
# Conversation Log — Shadow Corpus Layer B

Captures every Thomas ↔ Claude session as JSONL. Feeds the Ollama shadow team training corpus per the factory architecture spec.

- One file per session, named `YYYY-MM-DD-<session-hash>.jsonl`
- Source: `~/.claude/projects/<encoded>/<session>.jsonl` (Claude Code transcripts)
- Captured by Stop hook in `~/.claude/settings.json`
- Gitignored — never commit
```

- [ ] **Step 2: Create the hook script**

`~/.claude/hooks/capture_conversation.sh`:
```bash
#!/usr/bin/env bash
# Stop hook: copies current session transcript to 10RG conversation log
TRANSCRIPT_DIR="$HOME/.claude/projects"
LOG_DIR="/c/Users/Slash/10 Research Group/data/conversation_log"
mkdir -p "$LOG_DIR"

# Find most-recently-modified .jsonl in transcript dir tree
LATEST=$(find "$TRANSCRIPT_DIR" -name "*.jsonl" -type f -printf "%T@ %p\n" 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
if [ -z "$LATEST" ]; then exit 0; fi

DATE=$(date +%Y-%m-%d)
HASH=$(basename "$LATEST" .jsonl)
DEST="$LOG_DIR/${DATE}-${HASH}.jsonl"
cp -f "$LATEST" "$DEST"
exit 0
```

`chmod +x` the script.

- [ ] **Step 3: Configure Stop hook in settings.json**

Read current `~/.claude/settings.json`. Add (or merge into existing) hooks section:
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [{"type": "command", "command": "bash ~/.claude/hooks/capture_conversation.sh"}]
      }
    ]
  }
}
```

- [ ] **Step 4: Initial retroactive dump of THIS session**

Find current session's transcript at `~/.claude/projects/C--Users-Slash/ff226ef9-6c68-4c44-ac42-ba9422a39723.jsonl` (or current session file). Copy to `10 Research Group/data/conversation_log/2026-04-27-ff226ef9.jsonl`.

This preserves the architecture/spec/plan conversation as the foundational corpus entry.

- [ ] **Step 5: Verify hook fires**

After installing the hook, trigger one assistant turn (any tool call). Confirm a new file appears in `data/conversation_log/` (or the date-stamped file is updated).

- [ ] **Step 6: Update gitignore + BRAIN.md**

`10 Research Group/.gitignore`: append `data/conversation_log/`
`10 Research Group/BRAIN.md`: in the workflow section, add a line:
> Conversation capture: every Thomas ↔ Claude session auto-logs to `data/conversation_log/` for shadow training corpus. Online since 2026-04-27.

- [ ] **Step 7: Commit**

```bash
git add 10\ Research\ Group/.gitignore 10\ Research\ Group/BRAIN.md
git commit -m "feat(shadow): conversation capture online — Layer B corpus"
```

(Note: hook script + settings.json changes live in `~/.claude/`, separate repo or no-repo — don't include in commit.)

---

### Task 1: Project scaffold

**Files:**
- Create: `10 Research Group/products/trading-shadow/pyproject.toml`
- Create: `10 Research Group/products/trading-shadow/.gitignore`
- Create: `10 Research Group/products/trading-shadow/.env.example`
- Create: `10 Research Group/products/trading-shadow/README.md`
- Create: `10 Research Group/products/trading-shadow/src/trading_shadow/__init__.py`
- Create: `10 Research Group/products/trading-shadow/tests/__init__.py`

- [ ] **Step 1: Create pyproject.toml**

```toml
[project]
name = "trading-shadow"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "anthropic>=0.39.0",
    "alpaca-py>=0.32.0",
    "ollama>=0.4.0",
    "yfinance>=0.2.40",
    "requests>=2.32.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "pytest-mock>=3.12", "ruff>=0.5"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["src"]
```

- [ ] **Step 2: Create .gitignore**

```
.env
data/
__pycache__/
*.pyc
.pytest_cache/
.venv/
.ruff_cache/
*.jsonl
```

- [ ] **Step 3: Create .env.example**

```
ANTHROPIC_API_KEY=sk-ant-...
ALPACA_PAPER_API_KEY=
ALPACA_PAPER_API_SECRET=
ALPACA_LIVE_API_KEY=
ALPACA_LIVE_API_SECRET=
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

- [ ] **Step 4: Create README.md**

```markdown
# Trading Shadow A/B Test

Phase 0 of the 10 Research Group factory. Paper-to-live trading with Claude+Ollama shadow learning.

See `BRAIN.md` for project context and `../../docs/superpowers/specs/2026-04-27-trading-shadow-test-design.md` for full spec.

## Quick start

    cp .env.example .env  # fill in keys
    uv sync
    uv run pytest
    uv run python scripts/run_track_a.py --paper
```

- [ ] **Step 5: Create empty __init__.py files**

`src/trading_shadow/__init__.py`:
```python
"""Trading Shadow A/B Test — Phase 0 of the 10RG factory."""
__version__ = "0.1.0"
```

`tests/__init__.py`: empty file.

- [ ] **Step 6: Initialize uv environment**

Run:
```bash
cd "C:/Users/Slash/10 Research Group/products/trading-shadow"
uv sync --all-extras
```
Expected: `.venv/` created, all deps installed, no errors.

- [ ] **Step 7: Commit**

```bash
git add pyproject.toml .gitignore .env.example README.md src/ tests/
git commit -m "feat(trading-shadow): project scaffold"
```

---

### Task 2: BRAIN.md for project context

**Files:**
- Create: `10 Research Group/products/trading-shadow/BRAIN.md`

- [ ] **Step 1: Write BRAIN.md**

```markdown
# Trading Shadow — Project Brain

**Last updated:** 2026-04-27
**Status:** Building. Track A live Friday 2026-05-01.
**Spec:** `../../docs/superpowers/specs/2026-04-27-trading-shadow-test-design.md`
**Plan:** `../../docs/superpowers/plans/2026-04-27-trading-shadow-implementation.md`

---

## What This Is

Phase 0 of the 10 Research Group factory. First production-grade test of the Claude → Ollama shadow graduation pipeline. Bounded loss exposure ($40 total live), focused on shadow learning over make-money.

## A/B Setup

- Track A: Friday 2026-05-01 live, $20 equities only
- Track B: Tuesday 2026-05-05 live, $20 equities only
- Both shadows learn from both tracks

## Hard Floor

Account < $100 → auto-halt. Per-trade max $5. Equities only week 1.

## Files

- `src/trading_shadow/` — implementation
- `scripts/` — runners + halt switch
- `data/decisions.jsonl` — every trade decision logged (gitignored)
- `tests/` — TDD coverage on deterministic parts
```

- [ ] **Step 2: Commit**

```bash
git add BRAIN.md
git commit -m "docs(trading-shadow): add project brain"
```

---

### Task 3: Account + service setup (manual, parallel to coding)

**No code — Thomas runs these in parallel.**

- [ ] **Step 1: Create Alpaca paper trading account**

Go to https://alpaca.markets/ → Sign Up → Paper Account. Get API key + secret. Paste into `.env`.

- [ ] **Step 2: Create Alpaca live account (defer funding)**

Same site, separate live account. Complete KYC. Bank link can wait until Thursday. Get keys, paste into `.env` (kept dormant until Friday).

- [ ] **Step 3: Confirm Anthropic API key**

If not already in environment, get from https://console.anthropic.com/. Paste into `.env`.

- [ ] **Step 4: Create Discord webhook**

Pick a Discord channel (e.g., #trading-shadow). Channel settings → Integrations → Webhooks → New Webhook → copy URL. Paste into `.env` as `DISCORD_WEBHOOK_URL`.

- [ ] **Step 5: Install Ollama and pull starter model**

```bash
# Install Ollama from https://ollama.com/download (Windows installer)
ollama pull llama3.1:8b
ollama list  # confirm llama3.1:8b is present
```

Expected: model downloaded (~4.7GB). Confirms model selected.

- [ ] **Step 6: Verify env file complete**

Open `.env`, confirm every variable from `.env.example` has a real value. **Do not commit `.env`.**

---

### Task 4: Config module

**Files:**
- Create: `src/trading_shadow/config.py`
- Test: `tests/test_config.py`

- [ ] **Step 1: Write the failing test**

`tests/test_config.py`:
```python
import os
from trading_shadow.config import Config


def test_config_loads_env_vars(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-test")
    monkeypatch.setenv("ALPACA_PAPER_API_KEY", "paper-key")
    monkeypatch.setenv("ALPACA_PAPER_API_SECRET", "paper-secret")
    monkeypatch.setenv("DISCORD_WEBHOOK_URL", "https://discord.test")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.1:8b")

    cfg = Config.from_env()

    assert cfg.anthropic_key == "sk-test"
    assert cfg.alpaca_paper_key == "paper-key"
    assert cfg.alpaca_paper_secret == "paper-secret"
    assert cfg.discord_webhook == "https://discord.test"
    assert cfg.ollama_model == "llama3.1:8b"


def test_config_constants():
    assert Config.HARD_FLOOR_USD == 100.0
    assert Config.PER_TRADE_MAX_USD == 5.0
    assert Config.LIVE_CAPITAL_PER_TRACK == 20.0
    assert Config.GRADUATION_ACCURACY == 0.90
    assert Config.GRADUATION_MIN_TRADES == 50
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_config.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'trading_shadow.config'`.

- [ ] **Step 3: Implement Config**

`src/trading_shadow/config.py`:
```python
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    anthropic_key: str
    alpaca_paper_key: str
    alpaca_paper_secret: str
    alpaca_live_key: str
    alpaca_live_secret: str
    discord_webhook: str
    ollama_host: str
    ollama_model: str

    HARD_FLOOR_USD: float = 100.0
    PER_TRADE_MAX_USD: float = 5.0
    LIVE_CAPITAL_PER_TRACK: float = 20.0
    GRADUATION_ACCURACY: float = 0.90
    GRADUATION_MIN_TRADES: int = 50
    GRADUATION_MIN_PROFIT_USD: float = 1.0

    @classmethod
    def from_env(cls) -> "Config":
        return cls(
            anthropic_key=os.environ["ANTHROPIC_API_KEY"],
            alpaca_paper_key=os.environ["ALPACA_PAPER_API_KEY"],
            alpaca_paper_secret=os.environ["ALPACA_PAPER_API_SECRET"],
            alpaca_live_key=os.environ.get("ALPACA_LIVE_API_KEY", ""),
            alpaca_live_secret=os.environ.get("ALPACA_LIVE_API_SECRET", ""),
            discord_webhook=os.environ["DISCORD_WEBHOOK_URL"],
            ollama_host=os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
            ollama_model=os.environ.get("OLLAMA_MODEL", "llama3.1:8b"),
        )
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_config.py -v
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/trading_shadow/config.py tests/test_config.py
git commit -m "feat(config): env var loading and trading constants"
```

---

### Task 5: Decision log (JSONL append-only)

**Files:**
- Create: `src/trading_shadow/decision_log.py`
- Test: `tests/test_decision_log.py`

- [ ] **Step 1: Write the failing test**

`tests/test_decision_log.py`:
```python
import json
from pathlib import Path
from trading_shadow.decision_log import DecisionLog, Decision


def test_decision_log_appends_jsonl(tmp_path: Path):
    log_path = tmp_path / "decisions.jsonl"
    log = DecisionLog(log_path)

    decision = Decision(
        timestamp="2026-04-27T20:00:00Z",
        track="A",
        agent="claude",
        ticker="AAPL",
        action="buy",
        size_usd=4.50,
        reasoning="Trend signal triggered",
        market_state={"price": 175.30, "volume": 1_000_000},
    )
    log.append(decision)

    lines = log_path.read_text().strip().split("\n")
    assert len(lines) == 1
    parsed = json.loads(lines[0])
    assert parsed["track"] == "A"
    assert parsed["ticker"] == "AAPL"
    assert parsed["size_usd"] == 4.50


def test_decision_log_reads_back(tmp_path: Path):
    log = DecisionLog(tmp_path / "decisions.jsonl")
    d1 = Decision(timestamp="t1", track="A", agent="claude", ticker="SPY", action="hold", size_usd=0, reasoning="r1", market_state={})
    d2 = Decision(timestamp="t2", track="A", agent="shadow", ticker="SPY", action="buy", size_usd=2, reasoning="r2", market_state={})
    log.append(d1)
    log.append(d2)
    decisions = log.read_all()
    assert len(decisions) == 2
    assert decisions[0].agent == "claude"
    assert decisions[1].agent == "shadow"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_decision_log.py -v
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement DecisionLog**

`src/trading_shadow/decision_log.py`:
```python
import json
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Decision:
    timestamp: str
    track: str  # "A" or "B"
    agent: str  # "claude" or "shadow"
    ticker: str
    action: str  # "buy" | "sell" | "hold"
    size_usd: float
    reasoning: str
    market_state: dict[str, Any] = field(default_factory=dict)


class DecisionLog:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.touch(exist_ok=True)

    def append(self, decision: Decision) -> None:
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(decision)) + "\n")

    def read_all(self) -> list[Decision]:
        if not self.path.exists():
            return []
        out = []
        for line in self.path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            out.append(Decision(**json.loads(line)))
        return out
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_decision_log.py -v
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/trading_shadow/decision_log.py tests/test_decision_log.py
git commit -m "feat(decision-log): JSONL append-only logger"
```

---

### Task 6: Discord reporter

**Files:**
- Create: `src/trading_shadow/discord_reporter.py`
- Test: `tests/test_discord_reporter.py`

- [ ] **Step 1: Write the failing test**

`tests/test_discord_reporter.py`:
```python
from unittest.mock import patch, MagicMock
from trading_shadow.discord_reporter import DiscordReporter


def test_discord_reporter_posts_message():
    reporter = DiscordReporter("https://discord.test/webhook")
    with patch("trading_shadow.discord_reporter.requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=204)
        reporter.send("Test message")
        mock_post.assert_called_once()
        kwargs = mock_post.call_args.kwargs
        assert kwargs["json"]["content"] == "Test message"


def test_discord_reporter_truncates_long_message():
    reporter = DiscordReporter("https://discord.test/webhook")
    long_msg = "x" * 3000  # Discord max is 2000
    with patch("trading_shadow.discord_reporter.requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=204)
        reporter.send(long_msg)
        sent = mock_post.call_args.kwargs["json"]["content"]
        assert len(sent) <= 2000


def test_discord_reporter_raises_on_failure():
    import pytest
    reporter = DiscordReporter("https://discord.test/webhook")
    with patch("trading_shadow.discord_reporter.requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=500, text="server error")
        with pytest.raises(RuntimeError, match="Discord webhook failed"):
            reporter.send("Test")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_discord_reporter.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement DiscordReporter**

`src/trading_shadow/discord_reporter.py`:
```python
import requests


class DiscordReporter:
    MAX_LEN = 2000  # Discord content limit

    def __init__(self, webhook_url: str):
        if not webhook_url:
            raise ValueError("Discord webhook URL required")
        self.webhook_url = webhook_url

    def send(self, content: str) -> None:
        if len(content) > self.MAX_LEN:
            content = content[: self.MAX_LEN - 3] + "..."
        resp = requests.post(self.webhook_url, json={"content": content}, timeout=10)
        if resp.status_code not in (200, 204):
            raise RuntimeError(f"Discord webhook failed: {resp.status_code} {resp.text}")
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_discord_reporter.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Smoke test against real Discord**

`scripts/_smoke_discord.py` (temporary, can delete after):
```python
from trading_shadow.config import Config
from trading_shadow.discord_reporter import DiscordReporter

cfg = Config.from_env()
DiscordReporter(cfg.discord_webhook).send("✅ Trading Shadow scaffolding online — Mon 2026-04-27 night.")
```

Run: `uv run python scripts/_smoke_discord.py`
Expected: message appears in your Discord channel.

- [ ] **Step 6: Commit**

```bash
git add src/trading_shadow/discord_reporter.py tests/test_discord_reporter.py
git commit -m "feat(discord): webhook reporter with truncation"
```

---

### Task 7: Halt switch script

**Files:**
- Create: `scripts/halt_all.py`

- [ ] **Step 1: Write halt_all.py**

```python
"""Emergency kill switch — closes all open positions in paper + live, posts to Discord."""
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import ClosePositionRequest

from trading_shadow.config import Config
from trading_shadow.discord_reporter import DiscordReporter


def halt(paper: bool = True):
    cfg = Config.from_env()
    if paper:
        client = TradingClient(cfg.alpaca_paper_key, cfg.alpaca_paper_secret, paper=True)
        label = "PAPER"
    else:
        client = TradingClient(cfg.alpaca_live_key, cfg.alpaca_live_secret, paper=False)
        label = "LIVE"

    positions = client.get_all_positions()
    closed = []
    for pos in positions:
        try:
            client.close_position(pos.symbol)
            closed.append(pos.symbol)
        except Exception as e:
            DiscordReporter(cfg.discord_webhook).send(
                f"⚠️ HALT: failed to close {pos.symbol} on {label}: {e}"
            )

    DiscordReporter(cfg.discord_webhook).send(
        f"🛑 HALT EXECUTED on {label}. Closed: {closed or 'no open positions'}"
    )


if __name__ == "__main__":
    import sys
    paper = "--live" not in sys.argv
    halt(paper=paper)
```

- [ ] **Step 2: Commit**

```bash
git add scripts/halt_all.py
git commit -m "feat(scripts): emergency halt switch for paper + live"
```

**END OF TONIGHT.** Status check: `uv run pytest -v` should show 6+ tests passing. Discord channel has at least one test message. Alpaca paper account exists. Ollama model pulled. Stop here, sleep.

---

## TUESDAY 4/28

### Task 8: Alpaca client wrapper

**Files:**
- Create: `src/trading_shadow/alpaca_client.py`
- Test: `tests/test_alpaca_client.py`

- [ ] **Step 1: Write the failing test**

`tests/test_alpaca_client.py`:
```python
from unittest.mock import MagicMock
from trading_shadow.alpaca_client import AlpacaWrapper, AccountState


def test_get_account_state_returns_struct():
    raw_account = MagicMock(cash="100.00", portfolio_value="100.00", equity="100.00")
    raw_client = MagicMock()
    raw_client.get_account.return_value = raw_account

    wrapper = AlpacaWrapper(raw_client)
    state = wrapper.account_state()

    assert isinstance(state, AccountState)
    assert state.cash == 100.0
    assert state.portfolio_value == 100.0
    assert state.equity == 100.0


def test_submit_market_order_calls_alpaca():
    raw_client = MagicMock()
    raw_client.submit_order.return_value = MagicMock(id="order-123")

    wrapper = AlpacaWrapper(raw_client)
    order_id = wrapper.submit_market_order(ticker="AAPL", notional_usd=4.50, side="buy")

    raw_client.submit_order.assert_called_once()
    assert order_id == "order-123"


def test_get_positions_returns_dict():
    raw_client = MagicMock()
    raw_client.get_all_positions.return_value = [
        MagicMock(symbol="AAPL", qty="0.025", market_value="4.50"),
    ]
    wrapper = AlpacaWrapper(raw_client)
    positions = wrapper.positions()
    assert "AAPL" in positions
    assert positions["AAPL"].qty == 0.025
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_alpaca_client.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement AlpacaWrapper**

`src/trading_shadow/alpaca_client.py`:
```python
from dataclasses import dataclass
from typing import Literal
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce


@dataclass(frozen=True)
class AccountState:
    cash: float
    portfolio_value: float
    equity: float


@dataclass(frozen=True)
class Position:
    symbol: str
    qty: float
    market_value: float


class AlpacaWrapper:
    def __init__(self, client: TradingClient):
        self.client = client

    @classmethod
    def paper(cls, key: str, secret: str) -> "AlpacaWrapper":
        return cls(TradingClient(key, secret, paper=True))

    @classmethod
    def live(cls, key: str, secret: str) -> "AlpacaWrapper":
        return cls(TradingClient(key, secret, paper=False))

    def account_state(self) -> AccountState:
        a = self.client.get_account()
        return AccountState(cash=float(a.cash), portfolio_value=float(a.portfolio_value), equity=float(a.equity))

    def positions(self) -> dict[str, Position]:
        out = {}
        for p in self.client.get_all_positions():
            out[p.symbol] = Position(symbol=p.symbol, qty=float(p.qty), market_value=float(p.market_value))
        return out

    def submit_market_order(self, ticker: str, notional_usd: float, side: Literal["buy", "sell"]) -> str:
        req = MarketOrderRequest(
            symbol=ticker,
            notional=notional_usd,
            side=OrderSide.BUY if side == "buy" else OrderSide.SELL,
            time_in_force=TimeInForce.DAY,
        )
        order = self.client.submit_order(req)
        return str(order.id)

    def close_position(self, ticker: str) -> None:
        self.client.close_position(ticker)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_alpaca_client.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Smoke test against real paper account**

`scripts/_smoke_alpaca.py`:
```python
from trading_shadow.config import Config
from trading_shadow.alpaca_client import AlpacaWrapper

cfg = Config.from_env()
client = AlpacaWrapper.paper(cfg.alpaca_paper_key, cfg.alpaca_paper_secret)
state = client.account_state()
print(f"Paper account: cash=${state.cash}, equity=${state.equity}")
```
Run: `uv run python scripts/_smoke_alpaca.py`
Expected: prints real cash + equity from your paper account.

- [ ] **Step 6: Commit**

```bash
git add src/trading_shadow/alpaca_client.py tests/test_alpaca_client.py
git commit -m "feat(alpaca): trading client wrapper with paper+live constructors"
```

---

### Task 9: Pre-trade guardrails

**Files:**
- Create: `src/trading_shadow/guardrails.py`
- Test: `tests/test_guardrails.py`

- [ ] **Step 1: Write the failing test**

`tests/test_guardrails.py`:
```python
import pytest
from trading_shadow.guardrails import GuardrailCheck, check_trade
from trading_shadow.alpaca_client import AccountState


def test_pass_when_all_guardrails_satisfied():
    state = AccountState(cash=20.0, portfolio_value=20.0, equity=20.0)
    result = check_trade(
        ticker="AAPL", notional_usd=3.0, side="buy",
        account=state, asset_class="equities", live=False,
    )
    assert result.allowed
    assert result.reason is None


def test_block_when_account_below_hard_floor_live():
    state = AccountState(cash=99.0, portfolio_value=99.0, equity=99.0)
    result = check_trade(
        ticker="AAPL", notional_usd=3.0, side="buy",
        account=state, asset_class="equities", live=True,
    )
    assert not result.allowed
    assert "hard floor" in result.reason.lower()


def test_block_when_per_trade_max_exceeded():
    state = AccountState(cash=20.0, portfolio_value=20.0, equity=20.0)
    result = check_trade(
        ticker="AAPL", notional_usd=10.0, side="buy",
        account=state, asset_class="equities", live=True,
    )
    assert not result.allowed
    assert "per-trade max" in result.reason.lower()


def test_block_non_equities_on_live():
    state = AccountState(cash=20.0, portfolio_value=20.0, equity=20.0)
    result = check_trade(
        ticker="BTC/USD", notional_usd=3.0, side="buy",
        account=state, asset_class="crypto", live=True,
    )
    assert not result.allowed
    assert "live" in result.reason.lower()


def test_allow_non_equities_on_paper():
    state = AccountState(cash=100.0, portfolio_value=100.0, equity=100.0)
    result = check_trade(
        ticker="BTC/USD", notional_usd=3.0, side="buy",
        account=state, asset_class="crypto", live=False,
    )
    assert result.allowed


def test_block_position_over_10pct():
    state = AccountState(cash=20.0, portfolio_value=20.0, equity=20.0)
    # 10% of 20 = 2.0; 3.0 exceeds
    result = check_trade(
        ticker="AAPL", notional_usd=3.0, side="buy",
        account=state, asset_class="equities", live=True,
    )
    assert not result.allowed
    assert "10%" in result.reason.lower() or "position cap" in result.reason.lower()
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_guardrails.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement guardrails**

`src/trading_shadow/guardrails.py`:
```python
from dataclasses import dataclass
from typing import Literal, Optional
from trading_shadow.alpaca_client import AccountState
from trading_shadow.config import Config


@dataclass(frozen=True)
class GuardrailCheck:
    allowed: bool
    reason: Optional[str]


AssetClass = Literal["equities", "etf", "crypto", "options", "forex"]


def check_trade(
    *,
    ticker: str,
    notional_usd: float,
    side: Literal["buy", "sell"],
    account: AccountState,
    asset_class: AssetClass,
    live: bool,
) -> GuardrailCheck:
    if live and account.equity < Config.HARD_FLOOR_USD:
        return GuardrailCheck(False, f"Hard floor breached: equity ${account.equity:.2f} < ${Config.HARD_FLOOR_USD}")

    if notional_usd > Config.PER_TRADE_MAX_USD:
        return GuardrailCheck(False, f"Per-trade max exceeded: ${notional_usd:.2f} > ${Config.PER_TRADE_MAX_USD}")

    if live and asset_class != "equities":
        return GuardrailCheck(False, f"Live trading restricted to equities; got {asset_class}")

    pos_pct = notional_usd / max(account.equity, 0.01)
    if pos_pct > 0.10 and live:
        return GuardrailCheck(False, f"Position cap: {pos_pct:.1%} > 10% of equity")

    return GuardrailCheck(True, None)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_guardrails.py -v
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/trading_shadow/guardrails.py tests/test_guardrails.py
git commit -m "feat(guardrails): pre-trade hard checks (floor, per-trade max, asset class, position cap)"
```

---

### Task 10: Market data module

**Files:**
- Create: `src/trading_shadow/market_data.py`
- Test: `tests/test_market_data.py`

- [ ] **Step 1: Write the failing test**

`tests/test_market_data.py`:
```python
from unittest.mock import patch, MagicMock
import pandas as pd
from trading_shadow.market_data import get_quote, get_historical_bars


def test_get_quote_returns_price():
    with patch("trading_shadow.market_data.yf.Ticker") as mock_yf:
        mock_yf.return_value.fast_info = {"last_price": 175.30}
        price = get_quote("AAPL")
        assert price == 175.30


def test_get_historical_bars_returns_dataframe():
    fake_df = pd.DataFrame({"Close": [100.0, 101.0, 102.0]})
    with patch("trading_shadow.market_data.yf.download") as mock_dl:
        mock_dl.return_value = fake_df
        bars = get_historical_bars("AAPL", start="2024-01-01", end="2024-01-04")
        assert len(bars) == 3
        assert bars["Close"].iloc[-1] == 102.0
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_market_data.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement market_data**

`src/trading_shadow/market_data.py`:
```python
import yfinance as yf
import pandas as pd


def get_quote(ticker: str) -> float:
    """Latest price for a ticker via yfinance."""
    info = yf.Ticker(ticker).fast_info
    return float(info["last_price"])


def get_historical_bars(ticker: str, start: str, end: str, interval: str = "1d") -> pd.DataFrame:
    """OHLCV DataFrame for a ticker over [start, end). Date format YYYY-MM-DD."""
    df = yf.download(ticker, start=start, end=end, interval=interval, progress=False)
    return df
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_market_data.py -v
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/trading_shadow/market_data.py tests/test_market_data.py
git commit -m "feat(market-data): yfinance wrapper for quotes + historical bars"
```

---

### Task 11: Strategy module (deterministic signal generator)

**Files:**
- Create: `src/trading_shadow/strategy.py`
- Test: `tests/test_strategy.py`

- [ ] **Step 1: Write the failing test**

`tests/test_strategy.py`:
```python
import pandas as pd
from trading_shadow.strategy import compute_signal, SignalType


def test_signal_is_buy_when_price_above_20sma_and_rsi_oversold():
    # 20-day SMA = 100, current price = 105 (above SMA = trend), RSI low = mean-revert
    closes = [100.0] * 19 + [105.0]
    df = pd.DataFrame({"Close": closes})
    sig = compute_signal(df, current_rsi=25.0)
    assert sig.signal == SignalType.BUY
    assert "trend" in sig.rationale.lower() or "oversold" in sig.rationale.lower()


def test_signal_is_sell_when_price_below_20sma_and_rsi_overbought():
    closes = [100.0] * 19 + [95.0]
    df = pd.DataFrame({"Close": closes})
    sig = compute_signal(df, current_rsi=78.0)
    assert sig.signal == SignalType.SELL


def test_signal_is_hold_when_neither_extreme():
    closes = [100.0] * 19 + [100.5]
    df = pd.DataFrame({"Close": closes})
    sig = compute_signal(df, current_rsi=50.0)
    assert sig.signal == SignalType.HOLD
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_strategy.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement strategy**

`src/trading_shadow/strategy.py`:
```python
from dataclasses import dataclass
from enum import Enum
import pandas as pd


class SignalType(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


@dataclass(frozen=True)
class Signal:
    signal: SignalType
    rationale: str
    sma20: float
    current_price: float
    rsi: float


def compute_signal(closes_df: pd.DataFrame, current_rsi: float) -> Signal:
    """Trend-following with mean-reversion overlay.

    - BUY when price > 20SMA (uptrend) AND RSI < 30 (oversold pullback)
    - SELL when price < 20SMA (downtrend) AND RSI > 70 (overbought rally)
    - HOLD otherwise
    """
    sma20 = closes_df["Close"].tail(20).mean()
    current = float(closes_df["Close"].iloc[-1])

    if current > sma20 and current_rsi < 30:
        return Signal(SignalType.BUY, f"Uptrend (price ${current:.2f} > SMA20 ${sma20:.2f}) + oversold (RSI {current_rsi:.1f})", sma20, current, current_rsi)
    if current < sma20 and current_rsi > 70:
        return Signal(SignalType.SELL, f"Downtrend (price ${current:.2f} < SMA20 ${sma20:.2f}) + overbought (RSI {current_rsi:.1f})", sma20, current, current_rsi)
    return Signal(SignalType.HOLD, f"No edge: price ${current:.2f} vs SMA20 ${sma20:.2f}, RSI {current_rsi:.1f}", sma20, current, current_rsi)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_strategy.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/trading_shadow/strategy.py tests/test_strategy.py
git commit -m "feat(strategy): trend-follow + mean-revert signal generator"
```

---

### Task 12: Backtest engine

**Files:**
- Create: `src/trading_shadow/backtest.py`
- Test: `tests/test_backtest.py`

- [ ] **Step 1: Write the failing test**

`tests/test_backtest.py`:
```python
import pandas as pd
from trading_shadow.backtest import run_backtest, BacktestResult


def test_backtest_on_uptrending_data_makes_money():
    # Synthetic strict uptrend: each day +1
    closes = [100.0 + i for i in range(60)]
    df = pd.DataFrame({"Close": closes})
    result = run_backtest(df, ticker="TEST", start_capital=100.0)
    assert isinstance(result, BacktestResult)
    assert result.total_trades >= 0
    assert result.final_equity >= 100.0  # uptrend -> shouldn't lose


def test_backtest_records_decisions():
    closes = [100.0 + (i % 5) for i in range(60)]  # oscillating
    df = pd.DataFrame({"Close": closes})
    result = run_backtest(df, ticker="TEST", start_capital=100.0)
    assert len(result.decisions) > 0
    assert all(d.ticker == "TEST" for d in result.decisions)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_backtest.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement backtest**

`src/trading_shadow/backtest.py`:
```python
from dataclasses import dataclass, field
from datetime import datetime, timezone
import pandas as pd

from trading_shadow.strategy import compute_signal, SignalType
from trading_shadow.decision_log import Decision


def _rsi(closes: pd.Series, period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    delta = closes.diff().dropna()
    gain = delta.clip(lower=0).tail(period).mean()
    loss = -delta.clip(upper=0).tail(period).mean()
    if loss == 0:
        return 100.0
    rs = gain / loss
    return 100.0 - (100.0 / (1.0 + rs))


@dataclass
class BacktestResult:
    ticker: str
    final_equity: float
    total_trades: int
    decisions: list[Decision] = field(default_factory=list)


def run_backtest(df: pd.DataFrame, ticker: str, start_capital: float = 100.0) -> BacktestResult:
    """Walk-forward backtest. At each bar (after warmup), generate signal, simulate fill."""
    cash = start_capital
    qty = 0.0
    decisions: list[Decision] = []
    trades = 0

    for i in range(20, len(df)):
        window = df.iloc[: i + 1]
        rsi = _rsi(window["Close"])
        sig = compute_signal(window, current_rsi=rsi)
        price = float(window["Close"].iloc[-1])
        ts = datetime.now(timezone.utc).isoformat()

        if sig.signal == SignalType.BUY and cash >= 1.0:
            spend = min(5.0, cash)  # per-trade max
            qty += spend / price
            cash -= spend
            trades += 1
            decisions.append(Decision(timestamp=ts, track="backtest", agent="strategy", ticker=ticker, action="buy", size_usd=spend, reasoning=sig.rationale, market_state={"price": price, "rsi": rsi}))
        elif sig.signal == SignalType.SELL and qty > 0:
            cash += qty * price
            decisions.append(Decision(timestamp=ts, track="backtest", agent="strategy", ticker=ticker, action="sell", size_usd=qty * price, reasoning=sig.rationale, market_state={"price": price, "rsi": rsi}))
            qty = 0.0
            trades += 1

    final_equity = cash + qty * float(df["Close"].iloc[-1])
    return BacktestResult(ticker=ticker, final_equity=final_equity, total_trades=trades, decisions=decisions)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_backtest.py -v
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/trading_shadow/backtest.py tests/test_backtest.py
git commit -m "feat(backtest): walk-forward backtest with strategy signals + decision log"
```

---

### Task 13: Backtest sprint — historical run on 5 years SPY

**No new code. Run the engine on real data, populate shadow training corpus.**

- [ ] **Step 1: Write `scripts/backtest_sprint.py`**

```python
"""Run backtest on 5 years of SPY + 9 other equities. Output decisions to data/decisions.jsonl as 'backtest' track."""
from pathlib import Path
from trading_shadow.backtest import run_backtest
from trading_shadow.decision_log import DecisionLog
from trading_shadow.market_data import get_historical_bars

TICKERS = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "AMD"]
START = "2021-04-27"
END = "2026-04-27"

log = DecisionLog(Path("data/decisions.jsonl"))
total = 0
for ticker in TICKERS:
    df = get_historical_bars(ticker, START, END)
    if df.empty:
        print(f"⚠ {ticker}: no data")
        continue
    result = run_backtest(df, ticker=ticker)
    for d in result.decisions:
        log.append(d)
    total += result.total_trades
    print(f"{ticker}: {result.total_trades} trades, final equity ${result.final_equity:.2f}")

print(f"\nTotal trades logged: {total}")
```

- [ ] **Step 2: Run the sprint**

```bash
uv run python scripts/backtest_sprint.py
```
Expected: prints per-ticker trade counts. `data/decisions.jsonl` populated with hundreds-to-thousands of decisions.

- [ ] **Step 3: Confirm corpus size**

```bash
wc -l data/decisions.jsonl
```
Expected: at least 500 lines (each line = one decision = one shadow training sample).

- [ ] **Step 4: Commit script (not data)**

```bash
git add scripts/backtest_sprint.py
git commit -m "feat(scripts): backtest sprint runner for shadow training corpus"
```

---

### Task 14: Daily report scaffolding

**Files:**
- Create: `scripts/daily_report.py`

- [ ] **Step 1: Write the script**

```python
"""Pull current state from Alpaca + last 24hr decisions, post to Discord."""
from datetime import datetime, timedelta, timezone
from pathlib import Path
from trading_shadow.config import Config
from trading_shadow.alpaca_client import AlpacaWrapper
from trading_shadow.decision_log import DecisionLog
from trading_shadow.discord_reporter import DiscordReporter


def build_report() -> str:
    cfg = Config.from_env()
    paper = AlpacaWrapper.paper(cfg.alpaca_paper_key, cfg.alpaca_paper_secret)
    paper_state = paper.account_state()

    log = DecisionLog(Path("data/decisions.jsonl"))
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    recent = [d for d in log.read_all() if d.timestamp >= cutoff]

    by_track = {"A": [], "B": []}
    for d in recent:
        if d.track in by_track:
            by_track[d.track].append(d)

    return (
        f"📊 TRADER UPDATE — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n"
        f"\n"
        f"Paper account: cash=${paper_state.cash:.2f}, equity=${paper_state.equity:.2f}\n"
        f"Track A trades (24h): {len(by_track['A'])}\n"
        f"Track B trades (24h): {len(by_track['B'])}\n"
        f"Total decisions logged: {len(log.read_all())}"
    )


if __name__ == "__main__":
    cfg = Config.from_env()
    msg = build_report()
    DiscordReporter(cfg.discord_webhook).send(msg)
    print(msg)
```

- [ ] **Step 2: Run it as smoke test**

```bash
uv run python scripts/daily_report.py
```
Expected: report appears in Discord. Numbers may show 0 trades because no live runner yet — that's fine.

- [ ] **Step 3: Commit**

```bash
git add scripts/daily_report.py
git commit -m "feat(scripts): daily report generator + Discord post"
```

---

## WEDNESDAY 4/29

### Task 15: Prompts module

**Files:**
- Create: `src/trading_shadow/prompts.py`

- [ ] **Step 1: Write prompts**

```python
"""System prompts for Claude Trader and Ollama Shadow."""

CLAUDE_TRADER_SYSTEM = """You are a disciplined trading agent for the 10 Research Group factory's Phase 0 A/B test.

Your job: given current market state and a strategy signal, decide whether to BUY, SELL, or HOLD.

## Your hard constraints (NEVER violate)

- Account equity must stay >= $100 at all times in live trading
- Per-trade size <= $5 USD
- In live trading, equities only (no crypto, options, forex)
- Position size <= 10% of equity in live trading

## Your context per request

- Strategy signal (BUY / SELL / HOLD with rationale)
- 20-day SMA + current price
- Current RSI
- Account state (cash, equity)
- Track (A or B)
- Mode (paper or live)

## Output format

Respond with valid JSON only:

```json
{
  "action": "buy" | "sell" | "hold",
  "size_usd": <number, 0 to 5.0>,
  "reasoning": "<one-paragraph explanation tying signal to action>",
  "confidence": <number, 0.0 to 1.0>
}
```

If unsure, hold. Never override your hard constraints."""


SHADOW_SYSTEM = """You are a shadow trading agent learning from a Claude trader. Given the same market state, predict what the Claude trader will decide.

Output the same JSON schema as the trader. Your goal is decision-match accuracy, not novel ideas."""
```

- [ ] **Step 2: Commit**

```bash
git add src/trading_shadow/prompts.py
git commit -m "feat(prompts): system prompts for Claude trader + Ollama shadow"
```

---

### Task 16: Claude Trader

**Files:**
- Create: `src/trading_shadow/claude_trader.py`
- Test: `tests/test_claude_trader.py`

- [ ] **Step 1: Write the failing test**

`tests/test_claude_trader.py`:
```python
from unittest.mock import MagicMock, patch
import json
from trading_shadow.claude_trader import decide
from trading_shadow.alpaca_client import AccountState


def test_claude_trader_parses_response():
    fake_resp = MagicMock()
    fake_resp.content = [MagicMock(text='{"action": "buy", "size_usd": 3.0, "reasoning": "trend up", "confidence": 0.7}')]
    fake_client = MagicMock()
    fake_client.messages.create.return_value = fake_resp

    decision = decide(
        client=fake_client,
        signal_summary="BUY: trend up",
        sma20=100.0, current_price=105.0, rsi=25.0,
        account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
        track="A", live=False,
    )

    assert decision.action == "buy"
    assert decision.size_usd == 3.0
    assert decision.confidence == 0.7


def test_claude_trader_falls_back_to_hold_on_invalid_json():
    fake_resp = MagicMock()
    fake_resp.content = [MagicMock(text="this is not json")]
    fake_client = MagicMock()
    fake_client.messages.create.return_value = fake_resp

    decision = decide(
        client=fake_client,
        signal_summary="HOLD: no signal",
        sma20=100.0, current_price=100.0, rsi=50.0,
        account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
        track="A", live=False,
    )
    assert decision.action == "hold"
    assert decision.size_usd == 0.0
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_claude_trader.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement claude_trader**

`src/trading_shadow/claude_trader.py`:
```python
import json
from dataclasses import dataclass
from typing import Literal
from anthropic import Anthropic
from trading_shadow.alpaca_client import AccountState
from trading_shadow.prompts import CLAUDE_TRADER_SYSTEM


@dataclass(frozen=True)
class TraderDecision:
    action: Literal["buy", "sell", "hold"]
    size_usd: float
    reasoning: str
    confidence: float


def _build_user_prompt(signal_summary: str, sma20: float, current_price: float, rsi: float, account: AccountState, track: str, live: bool) -> str:
    return f"""Track: {track}
Mode: {'LIVE' if live else 'PAPER'}
Account: cash=${account.cash:.2f}, equity=${account.equity:.2f}
Strategy signal: {signal_summary}
20-day SMA: ${sma20:.2f}
Current price: ${current_price:.2f}
RSI: {rsi:.1f}

Decide. Output JSON only."""


def decide(*, client: Anthropic, signal_summary: str, sma20: float, current_price: float, rsi: float, account: AccountState, track: str, live: bool, model: str = "claude-sonnet-4-6") -> TraderDecision:
    user = _build_user_prompt(signal_summary, sma20, current_price, rsi, account, track, live)
    resp = client.messages.create(
        model=model,
        max_tokens=512,
        system=CLAUDE_TRADER_SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    raw = resp.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`").lstrip("json").strip()
    try:
        parsed = json.loads(raw)
        return TraderDecision(
            action=parsed.get("action", "hold"),
            size_usd=float(parsed.get("size_usd", 0.0)),
            reasoning=parsed.get("reasoning", ""),
            confidence=float(parsed.get("confidence", 0.0)),
        )
    except (json.JSONDecodeError, ValueError, KeyError):
        return TraderDecision(action="hold", size_usd=0.0, reasoning=f"Parse failure: {raw[:100]}", confidence=0.0)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_claude_trader.py -v
```
Expected: 2 passed.

- [ ] **Step 5: Smoke test against real Claude**

`scripts/_smoke_claude.py`:
```python
from anthropic import Anthropic
from trading_shadow.config import Config
from trading_shadow.claude_trader import decide
from trading_shadow.alpaca_client import AccountState

cfg = Config.from_env()
client = Anthropic(api_key=cfg.anthropic_key)
d = decide(
    client=client,
    signal_summary="BUY: uptrend + oversold",
    sma20=100.0, current_price=105.0, rsi=25.0,
    account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
    track="A", live=False,
)
print(d)
```

Run: `uv run python scripts/_smoke_claude.py`
Expected: prints a TraderDecision with non-empty reasoning.

- [ ] **Step 6: Commit**

```bash
git add src/trading_shadow/claude_trader.py tests/test_claude_trader.py
git commit -m "feat(claude-trader): Anthropic-driven decision agent with JSON parsing"
```

---

### Task 17: Ollama Shadow

**Files:**
- Create: `src/trading_shadow/shadow.py`
- Test: `tests/test_shadow.py`

- [ ] **Step 1: Write the failing test**

`tests/test_shadow.py`:
```python
from unittest.mock import MagicMock, patch
from trading_shadow.shadow import shadow_predict
from trading_shadow.alpaca_client import AccountState


def test_shadow_predict_parses_response():
    with patch("trading_shadow.shadow.ollama.chat") as mock_chat:
        mock_chat.return_value = {"message": {"content": '{"action": "buy", "size_usd": 2.5, "reasoning": "match trader", "confidence": 0.8}'}}
        decision = shadow_predict(
            model="llama3.1:8b",
            signal_summary="BUY: trend up",
            sma20=100.0, current_price=105.0, rsi=25.0,
            account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
            track="A", live=False,
        )
        assert decision.action == "buy"
        assert decision.size_usd == 2.5


def test_shadow_predict_handles_garbage_response():
    with patch("trading_shadow.shadow.ollama.chat") as mock_chat:
        mock_chat.return_value = {"message": {"content": "garbage output"}}
        decision = shadow_predict(
            model="llama3.1:8b",
            signal_summary="HOLD",
            sma20=100.0, current_price=100.0, rsi=50.0,
            account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
            track="A", live=False,
        )
        assert decision.action == "hold"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_shadow.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement shadow**

`src/trading_shadow/shadow.py`:
```python
import json
import ollama

from trading_shadow.alpaca_client import AccountState
from trading_shadow.claude_trader import TraderDecision, _build_user_prompt
from trading_shadow.prompts import SHADOW_SYSTEM


def shadow_predict(*, model: str, signal_summary: str, sma20: float, current_price: float, rsi: float, account: AccountState, track: str, live: bool) -> TraderDecision:
    user = _build_user_prompt(signal_summary, sma20, current_price, rsi, account, track, live)
    resp = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": SHADOW_SYSTEM},
            {"role": "user", "content": user},
        ],
        options={"temperature": 0.2},
    )
    raw = resp["message"]["content"].strip()
    if raw.startswith("```"):
        raw = raw.strip("`").lstrip("json").strip()
    try:
        parsed = json.loads(raw)
        return TraderDecision(
            action=parsed.get("action", "hold"),
            size_usd=float(parsed.get("size_usd", 0.0)),
            reasoning=parsed.get("reasoning", ""),
            confidence=float(parsed.get("confidence", 0.0)),
        )
    except (json.JSONDecodeError, ValueError, KeyError):
        return TraderDecision(action="hold", size_usd=0.0, reasoning=f"Shadow parse failure: {raw[:100]}", confidence=0.0)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_shadow.py -v
```
Expected: 2 passed.

- [ ] **Step 5: Smoke test against real Ollama**

`scripts/_smoke_shadow.py`:
```python
from trading_shadow.config import Config
from trading_shadow.shadow import shadow_predict
from trading_shadow.alpaca_client import AccountState

cfg = Config.from_env()
d = shadow_predict(
    model=cfg.ollama_model,
    signal_summary="BUY: uptrend + oversold",
    sma20=100.0, current_price=105.0, rsi=25.0,
    account=AccountState(cash=20.0, portfolio_value=20.0, equity=20.0),
    track="A", live=False,
)
print(d)
```

Run: `uv run python scripts/_smoke_shadow.py`
Expected: prints a TraderDecision from local Ollama. Slower than Claude (~5-15 sec).

- [ ] **Step 6: Commit**

```bash
git add src/trading_shadow/shadow.py tests/test_shadow.py
git commit -m "feat(shadow): Ollama-driven shadow predictor mirroring trader interface"
```

---

### Task 18: Accuracy tracker

**Files:**
- Create: `src/trading_shadow/accuracy_tracker.py`
- Test: `tests/test_accuracy_tracker.py`

- [ ] **Step 1: Write the failing test**

`tests/test_accuracy_tracker.py`:
```python
from trading_shadow.accuracy_tracker import compute_accuracy
from trading_shadow.decision_log import Decision


def _d(agent, action, ticker="SPY", track="A"):
    return Decision(timestamp="t", track=track, agent=agent, ticker=ticker, action=action, size_usd=1.0, reasoning="", market_state={})


def test_accuracy_perfect_match():
    decisions = [
        _d("claude", "buy"), _d("shadow", "buy"),
        _d("claude", "hold"), _d("shadow", "hold"),
        _d("claude", "sell"), _d("shadow", "sell"),
    ]
    acc = compute_accuracy(decisions, asset_class="equities")
    assert acc.total_pairs == 3
    assert acc.matches == 3
    assert acc.accuracy == 1.0


def test_accuracy_partial_match():
    decisions = [
        _d("claude", "buy"), _d("shadow", "hold"),  # mismatch
        _d("claude", "hold"), _d("shadow", "hold"),  # match
        _d("claude", "sell"), _d("shadow", "sell"),  # match
    ]
    acc = compute_accuracy(decisions, asset_class="equities")
    assert acc.total_pairs == 3
    assert acc.matches == 2
    assert abs(acc.accuracy - 0.6667) < 0.01


def test_accuracy_filters_by_asset_class():
    decisions = [
        Decision("t", "A", "claude", "SPY", "buy", 1.0, "", {"asset_class": "equities"}),
        Decision("t", "A", "shadow", "SPY", "buy", 1.0, "", {"asset_class": "equities"}),
        Decision("t", "A", "claude", "BTC/USD", "buy", 1.0, "", {"asset_class": "crypto"}),
        Decision("t", "A", "shadow", "BTC/USD", "sell", 1.0, "", {"asset_class": "crypto"}),
    ]
    acc = compute_accuracy(decisions, asset_class="equities")
    assert acc.total_pairs == 1
    assert acc.matches == 1
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_accuracy_tracker.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement accuracy_tracker**

`src/trading_shadow/accuracy_tracker.py`:
```python
from dataclasses import dataclass
from collections import defaultdict
from trading_shadow.decision_log import Decision


@dataclass(frozen=True)
class AccuracyResult:
    asset_class: str
    total_pairs: int
    matches: int
    accuracy: float


def compute_accuracy(decisions: list[Decision], asset_class: str) -> AccuracyResult:
    """Pair claude+shadow decisions on the same (timestamp, ticker) and count action matches."""
    by_key: dict[tuple, dict[str, Decision]] = defaultdict(dict)
    for d in decisions:
        if d.market_state.get("asset_class", "equities") != asset_class:
            continue
        key = (d.timestamp, d.ticker)
        by_key[key][d.agent] = d

    total = 0
    matches = 0
    for key, agents in by_key.items():
        if "claude" in agents and "shadow" in agents:
            total += 1
            if agents["claude"].action == agents["shadow"].action:
                matches += 1
    accuracy = matches / total if total > 0 else 0.0
    return AccuracyResult(asset_class=asset_class, total_pairs=total, matches=matches, accuracy=accuracy)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
uv run pytest tests/test_accuracy_tracker.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/trading_shadow/accuracy_tracker.py tests/test_accuracy_tracker.py
git commit -m "feat(accuracy): shadow-vs-claude decision-match tracker per asset class"
```

---

### Task 19: Runner (main loop)

**Files:**
- Create: `src/trading_shadow/runner.py`

- [ ] **Step 1: Write runner**

```python
"""Main loop: fetch market state → strategy signal → claude+shadow decisions → guardrails → submit (or skip)."""
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from anthropic import Anthropic
import pandas as pd

from trading_shadow.config import Config
from trading_shadow.alpaca_client import AlpacaWrapper
from trading_shadow.market_data import get_historical_bars
from trading_shadow.strategy import compute_signal
from trading_shadow.backtest import _rsi
from trading_shadow.claude_trader import decide as claude_decide
from trading_shadow.shadow import shadow_predict
from trading_shadow.guardrails import check_trade
from trading_shadow.decision_log import Decision, DecisionLog
from trading_shadow.discord_reporter import DiscordReporter

TICKERS = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA"]
LOG_PATH = Path("data/decisions.jsonl")


def run_one_pass(track: Literal["A", "B"], live: bool) -> None:
    cfg = Config.from_env()
    log = DecisionLog(LOG_PATH)
    discord = DiscordReporter(cfg.discord_webhook)
    anthropic = Anthropic(api_key=cfg.anthropic_key)

    if live:
        if not (cfg.alpaca_live_key and cfg.alpaca_live_secret):
            raise RuntimeError("Live mode requested but Alpaca live keys missing")
        broker = AlpacaWrapper.live(cfg.alpaca_live_key, cfg.alpaca_live_secret)
    else:
        broker = AlpacaWrapper.paper(cfg.alpaca_paper_key, cfg.alpaca_paper_secret)

    state = broker.account_state()

    for ticker in TICKERS:
        # Get last 30 days of daily bars
        end = datetime.now(timezone.utc).date().isoformat()
        start = (datetime.now(timezone.utc).date() - pd.Timedelta(days=45)).isoformat()
        df = get_historical_bars(ticker, start, end)
        if df.empty or len(df) < 21:
            continue

        rsi = _rsi(df["Close"])
        sig = compute_signal(df, current_rsi=rsi)
        ts = datetime.now(timezone.utc).isoformat()

        # Claude decides
        c_dec = claude_decide(
            client=anthropic,
            signal_summary=f"{sig.signal.value.upper()}: {sig.rationale}",
            sma20=sig.sma20, current_price=sig.current_price, rsi=rsi,
            account=state, track=track, live=live,
        )
        log.append(Decision(timestamp=ts, track=track, agent="claude", ticker=ticker, action=c_dec.action, size_usd=c_dec.size_usd, reasoning=c_dec.reasoning, market_state={"price": sig.current_price, "rsi": rsi, "asset_class": "equities", "confidence": c_dec.confidence}))

        # Shadow predicts
        s_dec = shadow_predict(
            model=cfg.ollama_model,
            signal_summary=f"{sig.signal.value.upper()}: {sig.rationale}",
            sma20=sig.sma20, current_price=sig.current_price, rsi=rsi,
            account=state, track=track, live=live,
        )
        log.append(Decision(timestamp=ts, track=track, agent="shadow", ticker=ticker, action=s_dec.action, size_usd=s_dec.size_usd, reasoning=s_dec.reasoning, market_state={"price": sig.current_price, "rsi": rsi, "asset_class": "equities", "confidence": s_dec.confidence}))

        # Only Claude's decisions submit (shadow doesn't trade until graduated)
        if c_dec.action in ("buy", "sell") and c_dec.size_usd > 0:
            check = check_trade(
                ticker=ticker, notional_usd=c_dec.size_usd, side=c_dec.action,
                account=state, asset_class="equities", live=live,
            )
            if check.allowed:
                try:
                    order_id = broker.submit_market_order(ticker=ticker, notional_usd=c_dec.size_usd, side=c_dec.action)
                    discord.send(f"✅ Track {track} {'LIVE' if live else 'PAPER'}: {c_dec.action.upper()} {ticker} ${c_dec.size_usd:.2f} (order {order_id})")
                except Exception as e:
                    discord.send(f"⚠️ Track {track}: {ticker} order failed: {e}")
            else:
                discord.send(f"⛔ Track {track}: {ticker} {c_dec.action} blocked — {check.reason}")
```

- [ ] **Step 2: Commit**

```bash
git add src/trading_shadow/runner.py
git commit -m "feat(runner): main pass over watchlist — strategy → claude → shadow → guardrails → submit"
```

---

### Task 20: Track A + Track B run scripts

**Files:**
- Create: `scripts/run_track_a.py`
- Create: `scripts/run_track_b.py`

- [ ] **Step 1: Write run_track_a.py**

```python
"""Track A — paper until 2026-05-01, live thereafter."""
import sys
from datetime import datetime, timezone
from trading_shadow.runner import run_one_pass


if __name__ == "__main__":
    live = "--live" in sys.argv
    run_one_pass(track="A", live=live)
    print(f"Track A pass complete at {datetime.now(timezone.utc).isoformat()}")
```

- [ ] **Step 2: Write run_track_b.py**

```python
"""Track B — paper until 2026-05-05, live thereafter."""
import sys
from datetime import datetime, timezone
from trading_shadow.runner import run_one_pass


if __name__ == "__main__":
    live = "--live" in sys.argv
    run_one_pass(track="B", live=live)
    print(f"Track B pass complete at {datetime.now(timezone.utc).isoformat()}")
```

- [ ] **Step 3: First paper run for both tracks**

```bash
uv run python scripts/run_track_a.py
uv run python scripts/run_track_b.py
```
Expected: Discord posts trade decisions or "blocked" messages. `data/decisions.jsonl` grows.

- [ ] **Step 4: Commit**

```bash
git add scripts/run_track_a.py scripts/run_track_b.py
git commit -m "feat(scripts): track A + B runners with --live flag"
```

---

### Task 21: Schedule paper passes (Wed-Thu)

**Files:**
- (Optional) Windows Task Scheduler entry, OR a simple loop script

- [ ] **Step 1: Write scripts/loop_paper.py**

```python
"""Run both tracks every 30 minutes during market hours (9:30-16:00 ET, M-F)."""
import time
from datetime import datetime, time as dt_time
from zoneinfo import ZoneInfo

from trading_shadow.runner import run_one_pass

ET = ZoneInfo("America/New_York")
OPEN = dt_time(9, 30)
CLOSE = dt_time(16, 0)


def is_market_open() -> bool:
    now = datetime.now(ET)
    if now.weekday() >= 5:
        return False
    return OPEN <= now.time() <= CLOSE


if __name__ == "__main__":
    while True:
        if is_market_open():
            try:
                run_one_pass(track="A", live=False)
                run_one_pass(track="B", live=False)
            except Exception as e:
                print(f"Pass error: {e}")
        time.sleep(30 * 60)
```

- [ ] **Step 2: Run in a separate terminal Wed-Thu**

```bash
uv run python scripts/loop_paper.py
```
Leave running until Friday morning. Wakes every 30 min during market hours.

- [ ] **Step 3: Commit**

```bash
git add scripts/loop_paper.py
git commit -m "feat(scripts): market-hours paper trading loop for both tracks"
```

---

## THURSDAY 4/30 — Go/No-Go review

### Task 22: Run accuracy + go/no-go check

**Files:**
- Create: `scripts/go_no_go.py`

- [ ] **Step 1: Write the script**

```python
"""Thursday EOD — Track A go/no-go gate before Friday live.

Pass requires:
  - >= 50 paper trades since Tuesday on equities
  - Shadow accuracy >= 70% (graduation is 90% but go-live can ride at 70% with $20 cap)
  - Account paper P&L >= $1 net (paper account >= $100 + $1 = $101)
"""
from pathlib import Path
from trading_shadow.config import Config
from trading_shadow.decision_log import DecisionLog
from trading_shadow.accuracy_tracker import compute_accuracy
from trading_shadow.alpaca_client import AlpacaWrapper
from trading_shadow.discord_reporter import DiscordReporter


def main():
    cfg = Config.from_env()
    log = DecisionLog(Path("data/decisions.jsonl"))
    decisions = [d for d in log.read_all() if d.track == "A" and d.market_state.get("asset_class") == "equities"]

    acc = compute_accuracy(decisions, asset_class="equities")
    paper = AlpacaWrapper.paper(cfg.alpaca_paper_key, cfg.alpaca_paper_secret)
    state = paper.account_state()

    pnl = state.equity - 100.0  # assumes paper started at $100
    pass_trades = acc.total_pairs >= 50
    pass_accuracy = acc.accuracy >= 0.70
    pass_pnl = pnl >= 1.0

    verdict = "✅ GO" if (pass_trades and pass_accuracy and pass_pnl) else "❌ NO-GO"
    msg = (
        f"🎯 TRACK A GO/NO-GO — Thursday EOD\n"
        f"Verdict: {verdict}\n\n"
        f"Trade pairs (claude+shadow): {acc.total_pairs} {'✅' if pass_trades else '❌ need 50'}\n"
        f"Shadow accuracy: {acc.accuracy:.1%} {'✅' if pass_accuracy else '❌ need 70%'}\n"
        f"Paper P&L: ${pnl:+.2f} {'✅' if pass_pnl else '❌ need $1+'}\n"
    )
    print(msg)
    DiscordReporter(cfg.discord_webhook).send(msg)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run Thursday after market close**

```bash
uv run python scripts/go_no_go.py
```
Expected: Discord posts verdict. If GO → proceed to Task 23 Friday morning. If NO-GO → defer Track A live to next available window.

- [ ] **Step 3: Commit**

```bash
git add scripts/go_no_go.py
git commit -m "feat(scripts): Track A Thursday go/no-go gate (trades + accuracy + PnL)"
```

---

## FRIDAY 5/1 — Track A Live Cutover

### Task 23: Pre-market live setup

- [ ] **Step 1: Confirm Alpaca live account funded with $20**

Log into Alpaca live dashboard. Confirm $20 cash. Confirm market hours not yet open (9:30 ET = 14:30 UTC).

- [ ] **Step 2: Final smoke test of live path**

`scripts/_smoke_live.py`:
```python
from trading_shadow.config import Config
from trading_shadow.alpaca_client import AlpacaWrapper
from trading_shadow.discord_reporter import DiscordReporter

cfg = Config.from_env()
live = AlpacaWrapper.live(cfg.alpaca_live_key, cfg.alpaca_live_secret)
state = live.account_state()
DiscordReporter(cfg.discord_webhook).send(
    f"🎬 LIVE PRE-FLIGHT: account cash=${state.cash:.2f}, equity=${state.equity:.2f}. Ready for Friday cutover."
)
```

Run: `uv run python scripts/_smoke_live.py`
Expected: confirms live account online, $20 visible, Discord posts pre-flight.

- [ ] **Step 3: Run Track A live with first pass at 9:35 ET**

At 9:35 ET (5 minutes after open):
```bash
uv run python scripts/run_track_a.py --live
```
Expected: first live decision posted to Discord.

- [ ] **Step 4: Set up live loop**

`scripts/loop_live_a.py`:
```python
"""Track A LIVE loop — every 30 min during market hours."""
import time
from datetime import datetime, time as dt_time
from zoneinfo import ZoneInfo

from trading_shadow.runner import run_one_pass

ET = ZoneInfo("America/New_York")
OPEN = dt_time(9, 35)
CLOSE = dt_time(15, 55)


def is_market_open() -> bool:
    now = datetime.now(ET)
    if now.weekday() >= 5:
        return False
    return OPEN <= now.time() <= CLOSE


if __name__ == "__main__":
    while True:
        if is_market_open():
            try:
                run_one_pass(track="A", live=True)
            except Exception as e:
                print(f"Live pass error: {e}")
        time.sleep(30 * 60)
```

Run in dedicated terminal:
```bash
uv run python scripts/loop_live_a.py
```

- [ ] **Step 5: Quarterly check via Discord**

The runner already posts every trade. Spot-check Discord every 4 hours; if account approaches $19, manually halt:
```bash
uv run python scripts/halt_all.py --live
```

- [ ] **Step 6: EOD report**

```bash
uv run python scripts/daily_report.py
```
Expected: Friday EOD summary in Discord.

- [ ] **Step 7: Commit**

```bash
git add scripts/loop_live_a.py
git commit -m "feat(scripts): Track A live loop runner"
```

---

## TUESDAY 5/5 — Track B Live Cutover

### Task 24: Track B go/no-go + cutover

- [ ] **Step 1: Run go/no-go for Track B**

Modify `scripts/go_no_go.py` or duplicate as `go_no_go_b.py` swapping `track == "A"` → `"B"`. Run Monday 5/4 EOD:
```bash
uv run python scripts/go_no_go_b.py
```

- [ ] **Step 2: If GO, repeat Friday's procedure for Track B**

Pre-market check. First pass at 9:35 ET Tue 5/5. Live loop:

`scripts/loop_live_b.py` (mirror of loop_live_a.py with `track="B"`).

- [ ] **Step 3: Both loops run in parallel**

Two terminals: `loop_live_a.py` and `loop_live_b.py`. Both reporting to Discord.

- [ ] **Step 4: Commit**

```bash
git add scripts/loop_live_b.py scripts/go_no_go_b.py
git commit -m "feat(scripts): Track B live cutover scripts"
```

---

## ONGOING — Monitoring + Graduation

### Task 25: Daily Discord report on schedule

- [ ] **Step 1: Schedule daily_report.py via Windows Task Scheduler**

Set to run weekdays at 16:30 ET (after market close):
- Action: `uv run python scripts/daily_report.py`
- Working dir: `C:\Users\Slash\10 Research Group\products\trading-shadow`
- Trigger: weekly Mon-Fri at 16:30 ET

- [ ] **Step 2: Verify first scheduled run posts Friday EOD**

Watch Discord at 16:30 ET Friday. Confirm message arrives.

---

### Task 26: Per-asset graduation review (every 30 days)

- [ ] **Step 1: Write `scripts/graduation_review.py`**

```python
"""Review graduation criteria per asset class. Posts result to Discord."""
from pathlib import Path
from trading_shadow.config import Config
from trading_shadow.decision_log import DecisionLog
from trading_shadow.accuracy_tracker import compute_accuracy
from trading_shadow.discord_reporter import DiscordReporter

ASSET_CLASSES = ["equities", "etf", "crypto", "options", "forex"]


def main():
    cfg = Config.from_env()
    log = DecisionLog(Path("data/decisions.jsonl"))
    decisions = log.read_all()
    discord = DiscordReporter(cfg.discord_webhook)

    lines = ["📈 GRADUATION REVIEW"]
    for ac in ASSET_CLASSES:
        acc = compute_accuracy(decisions, asset_class=ac)
        ready = (
            acc.total_pairs >= Config.GRADUATION_MIN_TRADES
            and acc.accuracy >= Config.GRADUATION_ACCURACY
        )
        flag = "✅ READY" if ready else "⏳"
        lines.append(f"{flag} {ac}: {acc.matches}/{acc.total_pairs} ({acc.accuracy:.1%})")
    discord.send("\n".join(lines))


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run weekly**

Schedule via Task Scheduler, weekly on Sundays.

- [ ] **Step 3: Commit**

```bash
git add scripts/graduation_review.py
git commit -m "feat(scripts): weekly graduation review per asset class"
```

---

### Task 27: Final integration test

- [ ] **Step 1: Run full test suite**

```bash
uv run pytest -v
```
Expected: all tests pass. At minimum: test_config (2), test_decision_log (2), test_discord_reporter (3), test_alpaca_client (3), test_guardrails (6), test_market_data (2), test_strategy (3), test_backtest (2), test_claude_trader (2), test_shadow (2), test_accuracy_tracker (3) = 30+ passing.

- [ ] **Step 2: Verify project hygiene**

- `data/decisions.jsonl` growing (track A + B + backtest entries)
- Discord channel has continuous activity
- No `.env` committed
- All commits have meaningful messages

- [ ] **Step 3: Tag the v1 release**

```bash
git tag -a v0.1.0 -m "Trading Shadow v0.1 — Track A live 2026-05-01, Track B live 2026-05-05"
git push --tags
```

---

## Self-Review Notes

This plan covers the full trading spec:
- ✅ Project scaffold + config (Tasks 1-4)
- ✅ Decision log + Discord reporting (Tasks 5-6)
- ✅ Halt switch (Task 7)
- ✅ Alpaca client + guardrails (Tasks 8-9)
- ✅ Market data + strategy + backtest (Tasks 10-12)
- ✅ Backtest sprint for shadow corpus (Task 13)
- ✅ Claude trader + Ollama shadow + accuracy tracker (Tasks 15-18)
- ✅ Runner + per-track scripts + paper loop (Tasks 19-21)
- ✅ Go/no-go gate (Task 22)
- ✅ Live cutover for Track A (Task 23) and Track B (Task 24)
- ✅ Daily reporting + graduation review (Tasks 25-26)

Spec coverage check: hard floor ✅, per-trade max ✅, equities-only on live ✅, position cap ✅, kill switch ✅, A/B isolation ✅, daily Discord ✅, graduation rule ✅, A/B comparison metrics (via accuracy_tracker grouped by track — built into existing code).

Notable scope cuts and why:
- **Two-way Discord kill switch** deferred — fallback is `scripts/halt_all.py` invoked manually. Two-way Discord requires bot setup, not in this week's critical path.
- **Vector-store-based shadow learning** simplified — initial shadow uses prompt+context only. True vector retrieval is Phase 1.
- **Crypto/options/forex** stay paper-only. Live equities only. Other asset classes graduate per their own criteria as data accumulates.

---

*Plan v1.0 — 2026-04-27. Companion to spec at `../specs/2026-04-27-trading-shadow-test-design.md`. Ready for execution.*
