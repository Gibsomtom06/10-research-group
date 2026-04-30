"use client";

import { useState, useTransition } from "react";

type Result = { ok: boolean; error?: string };

export function NotesClient({
  contactId,
  initial,
  save,
}: {
  contactId: string;
  initial: string;
  save: (id: string, notes: string) => Promise<Result>;
}) {
  const [notes, setNotes] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const dirty = notes !== initial;

  function handleSave() {
    start(async () => {
      const r = await save(contactId, notes);
      setMsg(r.ok ? "saved" : `err: ${r.error ?? "unknown"}`);
      setTimeout(() => setMsg(null), 3000);
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="notes — never overwritten by importers or agents."
        className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 rounded text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!dirty || pending}
          className="px-3 py-1 rounded bg-accent text-bg text-sm disabled:opacity-50"
        >
          save notes
        </button>
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </div>
  );
}
