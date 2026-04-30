import { serverClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function stats() {
  try {
    const sb = serverClient();
    const [contacts, venues, drafts, held, voice, praise] = await Promise.all([
      sb.from("contacts").select("*", { count: "exact", head: true }),
      sb.from("venues").select("*", { count: "exact", head: true }),
      sb.from("outreach_log").select("*", { count: "exact", head: true }).eq("status", "draft"),
      sb.from("outreach_log").select("*", { count: "exact", head: true }).eq("status", "held_for_review"),
      sb.from("voice_samples").select("*", { count: "exact", head: true }),
      sb.from("praise_bank").select("*", { count: "exact", head: true }).is("consumed_at", null),
    ]);
    return {
      contacts: contacts.count ?? 0,
      venues: venues.count ?? 0,
      drafts: drafts.count ?? 0,
      held: held.count ?? 0,
      voice: voice.count ?? 0,
      praise: praise.count ?? 0,
    };
  } catch {
    return { contacts: 0, venues: 0, drafts: 0, held: 0, voice: 0, praise: 0, error: "supabase not configured" as const };
  }
}

const PHASE_0_GOALS = [
  { key: "contacts", label: "crm contacts imported", target: 200 },
  { key: "venues", label: "venues enriched", target: 50 },
  { key: "voice", label: "voice samples captured", target: 50 },
  { key: "praise", label: "fresh praise hooks", target: 90 },
] as const;

export default async function Dashboard() {
  const s = await stats();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl">phase 0 status</h1>
      {"error" in s && (
        <div className="text-sm text-yellow-400">
          supabase not wired yet — set env vars and run `npm run db:push`
        </div>
      )}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PHASE_0_GOALS.map((g) => {
          const val = (s as any)[g.key] as number;
          const pct = Math.min(100, Math.round((val / g.target) * 100));
          return (
            <div key={g.key} className="bg-panel border border-white/10 rounded p-4">
              <div className="text-xs text-muted">{g.label}</div>
              <div className="text-2xl mt-1">{val} <span className="text-muted text-sm">/ {g.target}</span></div>
              <div className="h-1 bg-white/5 mt-3 overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-panel border border-white/10 rounded p-4">
          <div className="text-xs text-muted">drafts awaiting thomas</div>
          <div className="text-2xl mt-1">{s.held}</div>
        </div>
        <div className="bg-panel border border-white/10 rounded p-4">
          <div className="text-xs text-muted">drafts in composition</div>
          <div className="text-2xl mt-1">{s.drafts}</div>
        </div>
      </section>
    </div>
  );
}
