import { serverClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function load() {
  try {
    const sb = serverClient();
    const { data } = await sb
      .from("contacts")
      .select("id, full_name, email, city, role, relationship_strength, last_interaction_at")
      .is("deleted_at", null)
      .order("last_interaction_at", { ascending: false, nullsFirst: false })
      .limit(100);
    return data ?? [];
  } catch { return []; }
}

const STRENGTH_COLOR: Record<string, string> = {
  warm: "text-accent",
  reconnect: "text-yellow-400",
  dormant: "text-muted",
  cold: "text-muted",
};

export default async function Contacts() {
  const rows = await load();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl">contacts · crm</h1>
      <table className="w-full text-sm">
        <thead className="text-muted text-xs uppercase">
          <tr className="border-b border-white/10">
            <th className="text-left py-2">name</th>
            <th className="text-left">role</th>
            <th className="text-left">city</th>
            <th className="text-left">strength</th>
            <th className="text-left">last touch</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-2">{r.full_name}</td>
              <td className="text-muted">{r.role}</td>
              <td className="text-muted">{r.city ?? "—"}</td>
              <td className={STRENGTH_COLOR[r.relationship_strength] ?? "text-muted"}>{r.relationship_strength}</td>
              <td className="text-muted">{r.last_interaction_at?.slice(0,10) ?? "never"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="text-muted text-sm">no contacts yet — run the gmail import (scripts/parse_gmail_mbox.py).</div>}
    </div>
  );
}
