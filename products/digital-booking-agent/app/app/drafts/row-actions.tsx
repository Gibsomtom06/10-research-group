"use client";

import { useState, useTransition } from "react";
import { approveDraft, editDraft, rejectDraft } from "./actions";

type DraftRow = {
  id: string;
  subject: string | null;
  body: string | null;
  confidence_score: number | null;
};

export function RowActions({ row }: { row: DraftRow }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(row.subject ?? "");
  const [body, setBody] = useState(row.body ?? "");

  function onApprove() {
    setErr(null);
    start(async () => {
      const r = await approveDraft(row.id);
      if (!r.ok) setErr(r.error);
    });
  }

  function onReject() {
    const reason = window.prompt("reject reason (optional)") ?? undefined;
    setErr(null);
    start(async () => {
      const r = await rejectDraft(row.id, reason);
      if (!r.ok) setErr(r.error);
    });
  }

  function onSaveEdit() {
    setErr(null);
    start(async () => {
      const r = await editDraft(row.id, { subject, body });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={pending}
          className="px-3 py-1 bg-accent text-bg rounded text-sm disabled:opacity-50"
        >
          approve
        </button>
        <button
          onClick={() => setEditing((v) => !v)}
          disabled={pending}
          className="px-3 py-1 border border-white/20 rounded text-sm"
        >
          {editing ? "cancel" : "edit"}
        </button>
        <button
          onClick={onReject}
          disabled={pending}
          className="px-3 py-1 border border-white/20 rounded text-sm"
        >
          reject
        </button>
      </div>
      {err && <div className="text-xs text-red-400">{err}</div>}
      {editing && (
        <div className="w-[560px] max-w-full space-y-2 bg-bg border border-white/10 rounded p-3 mt-2">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-panel border border-white/10 rounded p-2 text-sm"
            placeholder="subject"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="w-full bg-panel border border-white/10 rounded p-2 text-sm font-mono"
            placeholder="body"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onSaveEdit}
              disabled={pending}
              className="px-3 py-1 bg-accent text-bg rounded text-sm"
            >
              save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
