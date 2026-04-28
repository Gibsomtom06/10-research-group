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
