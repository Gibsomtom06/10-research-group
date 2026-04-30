"use client";

import { useState, useTransition } from "react";
import {
  signThomasAction,
  signPromoterAction,
  recordDepositAction,
  generateMemoAction,
  sendCounterAction,
} from "./server-actions";

type OfferLite = {
  id: string;
  status: string;
  guarantee: number | null;
  deposit_pct: number | null;
  signed_at_thomas: string | null;
  signed_at_promoter: string | null;
  deposit_received_at: string | null;
  deal_memo_pdf_url: string | null;
  deal_memo_generated_at: string | null;
};

export function OfferActions({ offer }: { offer: OfferLite }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  // radius-override latch: first click with a hard_block gets a refusal
  // from the server action. Second click (while this flag is true) sends
  // force:true so the sign goes through. The flag resets on any success
  // or any other action.
  const [signForceArmed, setSignForceArmed] = useState(false);

  const hasMemo = !!offer.deal_memo_pdf_url;
  const canThomasSign = hasMemo && !offer.signed_at_thomas;
  const canPromoterSign =
    !!offer.signed_at_thomas && !offer.signed_at_promoter;
  const canRecordDeposit =
    !!offer.signed_at_thomas &&
    !!offer.signed_at_promoter &&
    !offer.deposit_received_at;
  const canGenerateMemo = !offer.deposit_received_at;

  function run(fn: () => Promise<{ ok?: string; error?: string }>) {
    setErr(null);
    setOk(null);
    startTransition(async () => {
      try {
        const r = await fn();
        if (r.error) setErr(r.error);
        else if (r.ok) {
          setOk(r.ok);
          setSignForceArmed(false);
        }
      } catch (e: any) {
        setErr(e?.message ?? "failed");
      }
    });
  }

  function runSign() {
    setErr(null);
    setOk(null);
    startTransition(async () => {
      try {
        const r = await signThomasAction(offer.id, { force: signForceArmed });
        if (r.error) {
          setErr(r.error);
          // if server complains about a radius hard-block, arm the override
          // so the next click passes force:true.
          if (r.error.startsWith("radius hard-block")) {
            setSignForceArmed(true);
          } else {
            setSignForceArmed(false);
          }
        } else if (r.ok) {
          setOk(r.ok);
          setSignForceArmed(false);
        }
      } catch (e: any) {
        setErr(e?.message ?? "failed");
      }
    });
  }

  return (
    <div className="bg-white/[0.02] rounded p-4 space-y-3">
      <div className="text-xs uppercase tracking-wide text-muted">actions</div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || !canGenerateMemo}
          onClick={() => run(() => generateMemoAction(offer.id))}
          className="text-xs px-3 py-1.5 rounded border border-white/10 hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {hasMemo ? "regenerate memo" : "generate deal memo"}
        </button>

        <button
          type="button"
          disabled={pending || !canThomasSign}
          onClick={runSign}
          className={`text-xs px-3 py-1.5 rounded border disabled:opacity-40 disabled:cursor-not-allowed ${
            signForceArmed
              ? "border-red-400/60 text-red-300 hover:border-red-300"
              : "border-white/10 hover:border-accent hover:text-accent"
          }`}
          title={
            !canThomasSign
              ? "needs a generated memo first"
              : signForceArmed
              ? "override radius hard-block and sign anyway"
              : "mark memo as signed by thomas"
          }
        >
          {signForceArmed ? "sign anyway (override)" : "sign as thomas"}
        </button>

        <button
          type="button"
          disabled={pending || !canPromoterSign}
          onClick={() => run(() => signPromoterAction(offer.id))}
          className="text-xs px-3 py-1.5 rounded border border-white/10 hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
          title={
            canPromoterSign
              ? "record promoter's countersignature"
              : "thomas must sign first"
          }
        >
          record promoter sig
        </button>

        <DepositForm
          disabled={pending || !canRecordDeposit}
          defaultAmount={
            offer.guarantee != null && offer.deposit_pct != null
              ? Math.round((offer.guarantee * offer.deposit_pct) / 100)
              : null
          }
          onSubmit={(amt) =>
            run(() => recordDepositAction(offer.id, amt))
          }
        />

        <CounterForm
          disabled={pending || !!offer.signed_at_thomas}
          onSubmit={(guarantee) =>
            run(() => sendCounterAction(offer.id, guarantee))
          }
        />
      </div>

      {err && <div className="text-xs text-red-400">error: {err}</div>}
      {ok && <div className="text-xs text-accent">{ok}</div>}
      {pending && <div className="text-xs text-muted">working…</div>}
    </div>
  );
}

function DepositForm({
  disabled,
  defaultAmount,
  onSubmit,
}: {
  disabled: boolean;
  defaultAmount: number | null;
  onSubmit: (amount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState<string>(
    defaultAmount != null ? String(defaultAmount) : ""
  );

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded border border-white/10 hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        record deposit
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(val);
        if (Number.isFinite(n) && n > 0) {
          onSubmit(n);
          setOpen(false);
        }
      }}
      className="flex items-center gap-1"
    >
      <span className="text-xs text-muted">$</span>
      <input
        type="number"
        min="0"
        step="1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-24 text-xs bg-bg border border-white/10 rounded px-2 py-1"
        autoFocus
      />
      <button
        type="submit"
        className="text-xs px-2 py-1 rounded bg-accent text-bg"
      >
        save
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs px-2 py-1 rounded text-muted hover:text-ink"
      >
        ×
      </button>
    </form>
  );
}

function CounterForm({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (guarantee: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded border border-white/10 hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
        title="draft a counter-offer email"
      >
        counter
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(val);
        if (Number.isFinite(n) && n > 0) {
          onSubmit(n);
          setOpen(false);
        }
      }}
      className="flex items-center gap-1"
    >
      <span className="text-xs text-muted">counter at $</span>
      <input
        type="number"
        min="0"
        step="100"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-24 text-xs bg-bg border border-white/10 rounded px-2 py-1"
        autoFocus
      />
      <button
        type="submit"
        className="text-xs px-2 py-1 rounded bg-accent text-bg"
      >
        draft
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs px-2 py-1 rounded text-muted hover:text-ink"
      >
        ×
      </button>
    </form>
  );
}
