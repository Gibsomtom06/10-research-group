"use client";

import { useState, useTransition } from "react";

type Result = { ok: boolean; error?: string };

type Props = {
  contactId: string;
  lane: string;
  composeFollowUp: (contactId: string, lane: string) => Promise<Result>;
  snoozeReminder: (contactId: string, days: number) => Promise<Result>;
  clearReminder: (contactId: string, note: string) => Promise<Result>;
};

export function ReminderRowActions({
  contactId,
  lane,
  composeFollowUp,
  snoozeReminder,
  clearReminder,
}: Props) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [showClear, setShowClear] = useState(false);
  const [clearNote, setClearNote] = useState("");

  function handle<T extends any[]>(
    fn: (...args: T) => Promise<Result>,
    ...args: T
  ) {
    start(async () => {
      const r = await fn(...args);
      setMsg(r.ok ? "done" : `err: ${r.error ?? "unknown"}`);
      setTimeout(() => setMsg(null), 3000);
    });
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {msg && <span className="text-muted mr-1">{msg}</span>}
      <button
        className="px-2 py-1 rounded border border-accent/40 text-accent hover:bg-accent/10 disabled:opacity-50"
        disabled={pending}
        onClick={() => handle(composeFollowUp, contactId, lane)}
        title="queue a follow-up draft in /drafts"
      >
        compose
      </button>
      <button
        className="px-2 py-1 rounded border border-white/10 text-muted hover:text-ink disabled:opacity-50"
        disabled={pending}
        onClick={() => handle(snoozeReminder, contactId, 7)}
        title="hide this reminder for 7 days"
      >
        snooze 7d
      </button>
      <button
        className="px-2 py-1 rounded border border-white/10 text-muted hover:text-ink disabled:opacity-50"
        disabled={pending}
        onClick={() => setShowClear((v) => !v)}
        title="clear reminder (e.g. already handled offline)"
      >
        clear
      </button>
      {showClear && (
        <div className="flex items-center gap-1 ml-1">
          <input
            type="text"
            placeholder="why? (optional)"
            value={clearNote}
            onChange={(e) => setClearNote(e.target.value)}
            className="px-2 py-1 bg-bg border border-white/10 rounded text-xs w-36"
          />
          <button
            className="px-2 py-1 rounded bg-accent text-bg disabled:opacity-50"
            disabled={pending}
            onClick={() => {
              handle(clearReminder, contactId, clearNote);
              setShowClear(false);
              setClearNote("");
            }}
          >
            ok
          </button>
        </div>
      )}
    </div>
  );
}
