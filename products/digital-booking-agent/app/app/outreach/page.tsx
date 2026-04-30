import Link from "next/link";
import { serverClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Row = {
  contact_id: string;
  full_name: string;
  email: string | null;
  city: string | null;
  state: string | null;
  role: string | null;
  relationship_strength: string | null;
  email_valid: boolean | null;
  do_not_contact: boolean | null;
  last_interaction_at: string | null;
  reminder_due_at: string | null;
  reminder_reason: string | null;
  outbound_sent_count: number | null;
  inbound_count: number | null;
  bounce_count_local: number | null;
  last_outbound_sent_at: string | null;
  last_inbound_at: string | null;
  lifetime_bounce_count: number | null;
};

async function load(filter: string): Promise<Row[]> {
  try {
    const sb = serverClient();
    let q = sb.from("v_outreach_history").select("*").limit(500);
    if (filter === "needs_response") {
      q = q.not("last_inbound_at", "is", null);
    } else if (filter === "bounced") {
      q = q.eq("email_valid", false);
    } else if (filter === "active") {
      q = q.gt("outbound_sent_count", 0);
    } else if (filter === "dnc") {
      q = q.eq("do_not_contact", true);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Row[];
  } catch {
    return [];
  }
}

function fmt(dt: string | null) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "1d ago";
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  } catch {
    return dt;
  }
}

function relCls(r: string | null) {
  switch (r) {
    case "warm": return "text-accent";
    case "reconnect": return "text-yellow-300";
    case "cold": return "text-muted";
    case "dormant": return "text-muted/60";
    default: return "text-muted";
  }
}

export default async function Outreach({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter ?? "all";
  const rows = await load(filter);

  const tabs: { k: string; label: string }[] = [
    { k: "all", label: "all" },
    { k: "active", label: "active (outbound sent)" },
    { k: "needs_response", label: "inbound replies" },
    { k: "bounced", label: "bad email" },
    { k: "dnc", label: "do not contact" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl">outreach history</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/outreach/priorities" className="text-accent hover:opacity-80">
            priorities →
          </Link>
          <Link href="/reminders" className="text-muted hover:text-ink">
            reminders →
          </Link>
        </div>
      </div>
      <div className="flex gap-2 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.k}
            href={`/outreach?filter=${t.k}`}
            className={`px-3 py-1 rounded border ${
              filter === t.k
                ? "bg-accent text-bg border-accent"
                : "border-white/10 text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="text-muted text-sm">
          no outreach history matches that filter yet. once contacts are imported and the
          inbound/outbound agents start running, rows will appear here.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted border-b border-white/10">
            <tr className="text-left">
              <th className="py-2 pr-3">contact</th>
              <th className="py-2 pr-3">city</th>
              <th className="py-2 pr-3">role</th>
              <th className="py-2 pr-3">rel</th>
              <th className="py-2 pr-3 text-right">out</th>
              <th className="py-2 pr-3 text-right">in</th>
              <th className="py-2 pr-3">last out</th>
              <th className="py-2 pr-3">last in</th>
              <th className="py-2 pr-3">status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.contact_id} className="border-b border-white/5">
                <td className="py-2 pr-3">
                  <Link
                    href={`/outreach/${r.contact_id}`}
                    className="hover:text-accent"
                  >
                    {r.full_name}
                  </Link>
                  <div className="text-xs text-muted">{r.email ?? ""}</div>
                </td>
                <td className="py-2 pr-3 text-muted">
                  {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="py-2 pr-3 text-muted">{r.role ?? "—"}</td>
                <td className={`py-2 pr-3 ${relCls(r.relationship_strength)}`}>
                  {r.relationship_strength ?? "—"}
                </td>
                <td className="py-2 pr-3 text-right">{r.outbound_sent_count ?? 0}</td>
                <td className="py-2 pr-3 text-right">{r.inbound_count ?? 0}</td>
                <td className="py-2 pr-3 text-muted">{fmt(r.last_outbound_sent_at)}</td>
                <td className="py-2 pr-3 text-muted">{fmt(r.last_inbound_at)}</td>
                <td className="py-2 pr-3">
                  {r.do_not_contact ? (
                    <span className="text-red-400 text-xs">DNC</span>
                  ) : r.email_valid === false ? (
                    <span className="text-red-400 text-xs">
                      bounced {r.lifetime_bounce_count ?? ""}
                    </span>
                  ) : r.reminder_due_at ? (
                    <span className="text-yellow-300 text-xs">
                      reminder
                    </span>
                  ) : (
                    <span className="text-muted text-xs">ok</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
