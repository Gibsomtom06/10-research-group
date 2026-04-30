"""Trader rollback handler — write-side counterpart to ``DecisionLog.rollback_to``.

Spec: ``ROLLBACK_HANDLER_SPEC.md`` in the project root. Per Thomas's
2026-04-30 decisions, the open questions in that spec resolve as follows:

1. Slippage realized during rollback does NOT count toward the per-trade
   ``$5`` cap (rollback is recovery, not new exposure) but DOES count as
   realized loss for the ``$100`` hard floor.
2. Paper-mode rollbacks update the paper simulator/account; live-mode
   rollbacks hit the live broker. The handler delegates to whichever
   ``AlpacaWrapper`` it was constructed with.
3. Hard-floor breach is ALERT ONLY by default for the Friday cutover.
   ``RollbackHandler`` is wired and callable, but auto-rollback on hard
   floor is gated behind ``Config.AUTO_ROLLBACK_ON_HARD_FLOOR`` (default
   ``False``); manual invocation is via ``scripts/halt_all.py
   --rollback-to=<state_id>``.
4. Rollback budget = 3 per UTC day per (track, agent). A 4th rollback
   raises :class:`RollbackBudgetExceeded` and requires Thomas approval.
   Tracked by counting ``action="rollback"`` rows already in the log
   since UTC midnight.
5. Audit rows are reference-only. Each rollback emits ONE new ``Decision``
   row per rolled-back decision: ``action="rollback"``,
   ``reasoning=f"rollback of {original.decision_id}: {reason}"``,
   ``market_state={"rolled_back_decision_id": ..., "slippage_usd": ...,
   "rollback_reason": ...}``. The original decision's snapshot is NOT
   duplicated — it's already on disk.
6. If the safe state's ``prior_state_id`` is ``None`` (very first
   decision in the chain), strategy params fall back to
   ``strategy.DEFAULT_PARAMS``.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from trading_shadow.alpaca_client import AlpacaWrapper
from trading_shadow.decision_log import Decision, DecisionLog
from trading_shadow.discord_reporter import DiscordReporter
from trading_shadow.strategy import DEFAULT_PARAMS


DEFAULT_ROLLBACK_BUDGET_PER_DAY = 3


class RollbackBudgetExceeded(Exception):
    """Raised when a track exceeds the per-UTC-day rollback budget.

    Thomas must approve any rollback past the budget. The handler does
    NOT auto-elevate.
    """


@dataclass(frozen=True)
class RollbackResult:
    state_id: str
    decisions_walked: int
    positions_closed: list[str] = field(default_factory=list)
    orders_canceled: list[str] = field(default_factory=list)
    slippage_usd: float = 0.0
    irreversible_actions: list[str] = field(default_factory=list)
    halted: bool = False
    skipped_already_rolled_back: list[str] = field(default_factory=list)


class RollbackHandler:
    """Write-side rollback for the Trader Sub.

    See module docstring + ``ROLLBACK_HANDLER_SPEC.md`` for the full contract.

    The handler is intentionally small and dependency-injected so the test
    suite can swap in mock brokers / Discord clients while exercising a real
    :class:`DecisionLog` against a tmp-path JSONL file (mirrors the existing
    test conventions in ``tests/test_decision_log.py``).
    """

    def __init__(
        self,
        decision_log: DecisionLog,
        alpaca: AlpacaWrapper,
        discord: DiscordReporter,
        track: str,
        agent: str = "claude",
        *,
        halt_fn: Optional[Callable[[str], None]] = None,
        params_restore_fn: Optional[Callable[[dict[str, Any]], None]] = None,
        budget_per_day: int = DEFAULT_ROLLBACK_BUDGET_PER_DAY,
    ) -> None:
        self.decision_log = decision_log
        self.alpaca = alpaca
        self.discord = discord
        self.track = track
        self.agent = agent
        self.halt_fn = halt_fn
        # Setter is exposed as a public attribute so tests / runner can swap
        # at runtime (e.g. live config writer vs. paper simulator).
        self.params_restore_fn = params_restore_fn
        self.budget_per_day = budget_per_day

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def rollback_to(
        self,
        state_id: str,
        reason: str,
        *,
        halt_after: bool = False,
    ) -> RollbackResult:
        """Walk the decision chain back to ``state_id`` and undo each step.

        Idempotent: a re-run on an already-rolled-back chain performs no
        new broker calls and writes no new audit rows.

        Raises:
            ValueError: ``state_id`` does not exist in the log (mirrors
                :meth:`DecisionLog.rollback_to`).
            RollbackBudgetExceeded: this track has already used its
                daily rollback budget.
        """
        # Budget check — must happen BEFORE we touch the broker. Thomas's
        # rule: 3 rollbacks per UTC day per (track, agent), 4th requires
        # explicit approval.
        self._enforce_budget()

        # Read-side primitive: chain of decisions UP TO AND INCLUDING
        # state_id. Raises ValueError on unknown state_id. We use this
        # purely to validate state_id exists; the actual rollback range
        # is computed below.
        self.decision_log.rollback_to(state_id)

        all_rows = self.decision_log.read_all()
        try:
            anchor_idx = next(
                i for i, d in enumerate(all_rows) if d.decision_id == state_id
            )
        except StopIteration:  # pragma: no cover - defensive
            raise ValueError(f"decision_id not found in log: {state_id}")

        anchor = all_rows[anchor_idx]
        if anchor.track != self.track or anchor.agent != self.agent:
            # state_id exists but isn't ours — treat as no-op rather than
            # blow up. Still report so the operator sees it.
            self._discord_summary(state_id, reason, RollbackResult(
                state_id=state_id, decisions_walked=0,
            ))
            return RollbackResult(state_id=state_id, decisions_walked=0)

        # Per spec test fixtures: state_id is the OLDEST decision in the
        # rollback range. Everything from state_id onwards on our lineage
        # is undone (MRU -> LRU). Audit rows (action="rollback") in that
        # range are skipped — they aren't real decisions.
        to_rollback = [
            d for d in all_rows[anchor_idx:]
            if d.track == self.track
            and d.agent == self.agent
            and d.action != "rollback"
        ]

        # Index of decision_ids that have already been rolled back so we
        # can short-circuit in the idempotent re-run case.
        already_rolled_back = self._already_rolled_back_ids(all_rows)

        # Idempotency short-circuit: if every non-hold decision in range
        # is already rolled back, skip everything — no broker calls, no
        # new audit rows, no Discord noise.
        active = [
            d for d in to_rollback
            if d.action != "hold" and d.decision_id not in already_rolled_back
        ]
        if not active:
            return RollbackResult(
                state_id=state_id,
                decisions_walked=0,
                skipped_already_rolled_back=[d.decision_id for d in to_rollback],
            )

        positions_closed: list[str] = []
        orders_canceled: list[str] = []
        irreversible: list[str] = []
        skipped: list[str] = []
        total_slippage = 0.0

        # MRU -> LRU per spec: newest-first so we unwind in the correct order.
        for decision in reversed(to_rollback):
            if decision.decision_id in already_rolled_back:
                skipped.append(decision.decision_id)
                continue

            slippage = 0.0
            decision_irreversible = False

            if decision.action == "hold":
                # Nothing to undo. Don't even write an audit row — the
                # spec is explicit that ``hold`` is a skip, not a no-op
                # rollback marker.
                continue

            elif decision.action == "buy":
                order_status = (decision.market_state or {}).get("order_status", "filled")
                order_id = (decision.market_state or {}).get("order_id")
                if order_status == "filled":
                    self.alpaca.close_position(decision.ticker)
                    positions_closed.append(decision.ticker)
                    slippage = self._compute_slippage(decision)
                    total_slippage += slippage
                else:
                    if order_id:
                        self.alpaca.cancel_order(order_id)
                        orders_canceled.append(order_id)
                    else:
                        # Submitted but unfilled and we have no order id
                        # to cancel — log as irreversible so the operator
                        # can investigate.
                        decision_irreversible = True
                        irreversible.append(decision.decision_id)

            elif decision.action == "sell":
                short = bool((decision.market_state or {}).get("short", False))
                if short:
                    # Short close = buy back at market. Same close_position
                    # path on Alpaca for the symbol.
                    self.alpaca.close_position(decision.ticker)
                    positions_closed.append(decision.ticker)
                    slippage = self._compute_slippage(decision)
                    total_slippage += slippage
                else:
                    # Long-exit: cannot un-sell. Mark partially recoverable.
                    decision_irreversible = True
                    irreversible.append(decision.decision_id)

            else:
                # Unknown action types (e.g. future "short_open") — flag
                # rather than silently skip so we don't lose audit signal.
                decision_irreversible = True
                irreversible.append(decision.decision_id)

            self._append_audit_row(
                original=decision,
                reason=reason,
                slippage_usd=slippage,
                irreversible=decision_irreversible,
            )

        # Strategy params restore — pull from anchor.prior_state_id's
        # chain. If anchor has no prior state, fall back to DEFAULT_PARAMS.
        self._restore_strategy_params(anchor)

        halted = False
        if halt_after and self.halt_fn is not None:
            self.halt_fn(reason)
            halted = True

        result = RollbackResult(
            state_id=state_id,
            decisions_walked=len(to_rollback),
            positions_closed=positions_closed,
            orders_canceled=orders_canceled,
            slippage_usd=total_slippage,
            irreversible_actions=irreversible,
            halted=halted,
            skipped_already_rolled_back=skipped,
        )
        self._discord_summary(state_id, reason, result)
        return result

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _enforce_budget(self) -> None:
        today = datetime.now(timezone.utc).date().isoformat()
        rows = self.decision_log.read_all()
        used = sum(
            1 for r in rows
            if r.action == "rollback"
            and r.track == self.track
            and r.agent == self.agent
            and (r.timestamp or "").startswith(today)
        )
        if used >= self.budget_per_day:
            raise RollbackBudgetExceeded(
                f"Track {self.track}/{self.agent} hit rollback budget "
                f"({used}/{self.budget_per_day} for {today}). "
                "Thomas approval required."
            )

    def _already_rolled_back_ids(self, rows: list[Decision]) -> set[str]:
        out: set[str] = set()
        for r in rows:
            if r.action != "rollback":
                continue
            ms = r.market_state or {}
            rb_id = ms.get("rolled_back_decision_id")
            if rb_id:
                out.add(rb_id)
        return out

    def _compute_slippage(self, decision: Decision) -> float:
        ms = decision.market_state or {}
        entry_price = float(ms.get("entry_price") or ms.get("price") or 0.0)
        if entry_price <= 0:
            return 0.0
        try:
            current = float(self.alpaca.get_latest_price(decision.ticker))
        except Exception:  # pragma: no cover - defensive
            current = 0.0
        if current <= 0:
            return 0.0
        qty = float(decision.size_usd) / entry_price
        # For a buy being unwound: realized slippage = (current - entry) * qty.
        # Negative numbers = loss (we sold lower than we bought).
        return (current - entry_price) * qty

    def _append_audit_row(
        self,
        *,
        original: Decision,
        reason: str,
        slippage_usd: float,
        irreversible: bool,
    ) -> None:
        ts = datetime.now(timezone.utc).isoformat()
        self.decision_log.append(Decision(
            timestamp=ts,
            track=self.track,
            agent=self.agent,
            ticker=original.ticker,
            action="rollback",
            size_usd=0.0,
            reasoning=f"rollback of {original.decision_id}: {reason}",
            market_state={
                "rolled_back_decision_id": original.decision_id,
                "rolled_back_action": original.action,
                "slippage_usd": slippage_usd,
                "rollback_reason": reason,
                "irreversible": irreversible,
            },
        ))

    def _restore_strategy_params(self, anchor: Decision) -> None:
        """Look up strategy params by walking ``anchor.prior_state_id``
        backwards and push them through ``params_restore_fn``. Falls back
        to :data:`strategy.DEFAULT_PARAMS` when anchor has no prior state
        (very first decision in lineage) or when no decision in the prior
        chain carries ``strategy_params``.
        """
        if self.params_restore_fn is None:
            return

        params: Optional[dict[str, Any]] = None
        rows = self.decision_log.read_all()
        by_id = {d.decision_id: d for d in rows if d.decision_id}

        # Walk anchor.prior_state_id -> prior -> prior... looking for the
        # most recent strategy_params payload BEFORE the rolled-back range.
        cursor: Optional[Decision] = (
            by_id.get(anchor.prior_state_id) if anchor.prior_state_id else None
        )
        seen: set[str] = set()
        while cursor is not None and cursor.decision_id not in seen:
            seen.add(cursor.decision_id)
            ms = cursor.market_state or {}
            if "strategy_params" in ms and ms["strategy_params"]:
                params = dict(ms["strategy_params"])
                break
            prior_id = cursor.prior_state_id
            if not prior_id:
                break
            cursor = by_id.get(prior_id)

        if params is None:
            params = dict(DEFAULT_PARAMS)

        try:
            self.params_restore_fn(params)
        except Exception as e:  # pragma: no cover - defensive
            # Restoration failure must NOT abort an in-progress rollback;
            # the broker side has already executed.
            try:
                self.discord.send(
                    f":warning: rollback param restore failed on track "
                    f"{self.track}/{self.agent}: {e}"
                )
            except Exception:
                pass

    def _discord_summary(self, state_id: str, reason: str, result: RollbackResult) -> None:
        # ONE post per rollback per spec — not one per decision.
        try:
            self.discord.send(
                "ROLLBACK EXECUTED\n"
                f"track={self.track} agent={self.agent}\n"
                f"safe_state={state_id[:12]}... reason={reason}\n"
                f"walked={result.decisions_walked} "
                f"closed={result.positions_closed} "
                f"canceled={result.orders_canceled}\n"
                f"slippage_usd={result.slippage_usd:.4f} "
                f"irreversible={len(result.irreversible_actions)} "
                f"halted={result.halted}"
            )
        except Exception:  # pragma: no cover - defensive
            # Discord failure must never mask the rollback result.
            pass
