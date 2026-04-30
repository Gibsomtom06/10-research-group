import { serverClient } from "@/lib/supabase";
import { RowActions } from "./row-actions";

export const dynamic = "force-dynamic";

async function load() {
  try {
    const sb = serverClient();
    const { data, error } = await sb
      .from("outreach_log")
      .select(
        "id, status, direction, subject, body, confidence_score, created_at, contact:contacts(full_name, city, role)"
      )
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

function confidenceBadge(c: number | null) {
  const v = Number(c ?? 0);
  if (v >= 0.95) return { label: "auto-send ready", cls: "bg-accent text-bg" };
  if (v >= 0.8) return { label: `queue ${Math.round(v * 100)}%`, cls: "bg-yellow-900/40 text-yellow-200 border border-yellow-500/30" };
  return { label: `hold ${Math.round(v * 100)}%`, cls: "bg-red-900/40 text-red-200 border border-red-500/30" };
}

export default async function Drafts() {
  const rows = await load();
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl">drafts awaiting thomas</h1>
        <div className="text-xs text-muted">
          auto-send rules: ≥95% at next cadence window · 80–94% 2hr after approve · &lt;80% held
        </div>
      </div>
      {rows.length === 0 && (
        <div className="text-muted text-sm">
          nothing in the queue. inbound agent will surface here when offers hit the booking inbox, and the outbound composer will drop outbound pitches here when the analyst clears the verification stamps.
        </div>
      )}
      <ul className="space-y-3">
        {rows.map((r: any) => {
          const badge = confidenceBadge(r.confidence_score);
          const contact = Array.isArray(r.contact) ? r.contact[0] : r.contact;
          return (
            <li key={r.id} className="bg-panel border border-white/10 rounded p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted uppercase">
                      {r.status} · {r.direction}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-lg mt-1">{r.subject ?? "(no subject)"}</div>
                  <div className="text-sm text-muted">
                    to: {contact?.full_name ?? "—"} · {contact?.city ?? "—"} · {contact?.role ?? "—"}
                  </div>
                  {r.body && (
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-sm text-ink/90 border-l border-white/10 pl-3">
                      {r.body}
                    </pre>
                  )}
                </div>
                <RowActions
                  row={{
                    id: r.id,
                    subject: r.subject,
                    body: r.body,
                    confidence_score: r.confidence_score,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
