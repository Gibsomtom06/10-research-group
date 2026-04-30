"use client";

import { useState, useTransition } from "react";

type Result = { ok: boolean; error?: string };

type Props = {
  contactId: string;
  emailValid: boolean;
  doNotContact: boolean;
  markEmailBad: (id: string, reason: string) => Promise<Result>;
  restoreEmail: (id: string, newEmail: string | null) => Promise<Result>;
  setDoNotContact: (id: string, reason: string) => Promise<Result>;
  unsetDoNotContact: (id: string) => Promise<Result>;
};

export function ContactActions({
  contactId,
  emailValid,
  doNotContact,
  markEmailBad,
  restoreEmail,
  setDoNotContact,
  unsetDoNotContact,
}: Props) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<null | "bad" | "restore" | "dnc">(null);
  const [text, setText] = useState("");

  function runAndClose(promise: Promise<Result>) {
    start(async () => {
      const r = await promise;
      setMsg(r.ok ? "saved" : `err: ${r.error ?? "unknown"}`);
      setTimeout(() => setMsg(null), 3000);
      setMode(null);
      setText("");
    });
  }

  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      <div className="flex items-center gap-2">
        {msg && <span className="text-muted">{msg}</span>}

        {emailValid ? (
          <button
            className="px-2 py-1 rounded border border-red-400/40 text-red-300 hover:bg-red-400/10 disabled:opacity-50"
            disabled={pending}
            onClick={() => setMode("bad")}
            title="invalidate this email address without deleting the contact"
          >
            mark email bad
          </button>
        ) : (
          <button
            className="px-2 py-1 rounded border border-accent/40 text-accent hover:bg-accent/10 disabled:opacity-50"
            disabled={pending}
            onClick={() => setMode("restore")}
            title="re-enable outbound (optionally with a corrected email)"
          >
            restore email
          </button>
        )}

        {doNotContact ? (
          <button
            className="px-2 py-1 rounded border border-white/10 text-muted hover:text-ink disabled:opacity-50"
            disabled={pending}
            onClick={() => runAndClose(unsetDoNotContact(contactId))}
          >
            unset DNC
          </button>
        ) : (
          <button
            className="px-2 py-1 rounded border border-white/10 text-muted hover:text-ink disabled:opacity-50"
            disabled={pending}
            onClick={() => setMode("dnc")}
            title="do not contact — hard stop on all outbound"
          >
            set DNC
          </button>
        )}
      </div>

      {mode === "bad" && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="reason (e.g. bounced, typo)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="px-2 py-1 bg-bg border border-white/10 rounded text-xs w-56"
            autoFocus
          />
          <button
            className="px-2 py-1 rounded bg-red-400 text-bg disabled:opacity-50"
            disabled={pending}
            onClick={() => runAndClose(markEmailBad(contactId, text))}
          >
            confirm
          </button>
          <button
            className="px-2 py-1 rounded border border-white/10 text-muted"
            onClick={() => {
              setMode(null);
              setText("");
            }}
          >
            cancel
          </button>
        </div>
      )}

      {mode === "restore" && (
        <div className="flex items-center gap-1">
          <input
            type="email"
            placeholder="corrected email (optional)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="px-2 py-1 bg-bg border border-white/10 rounded text-xs w-56"
            autoFocus
          />
          <button
            className="px-2 py-1 rounded bg-accent text-bg disabled:opacity-50"
            disabled={pending}
            onClick={() =>
              runAndClose(restoreEmail(contactId, text.trim() || null))
            }
          >
            restore
          </button>
          <button
            className="px-2 py-1 rounded border border-white/10 text-muted"
            onClick={() => {
              setMode(null);
              setText("");
            }}
          >
            cancel
          </button>
        </div>
      )}

      {mode === "dnc" && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="reason for DNC"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="px-2 py-1 bg-bg border border-white/10 rounded text-xs w-56"
            autoFocus
          />
          <button
            className="px-2 py-1 rounded bg-red-400 text-bg disabled:opacity-50"
            disabled={pending}
            onClick={() => runAndClose(setDoNotContact(contactId, text))}
          >
            confirm DNC
          </button>
          <button
            className="px-2 py-1 rounded border border-white/10 text-muted"
            onClick={() => {
              setMode(null);
              setText("");
            }}
          >
            cancel
          </button>
        </div>
      )}
    </div>
  );
}
