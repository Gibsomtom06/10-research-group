import { serverClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// --------------------------------------------------------------------
// /dashboard/costs — token + dollar ledger for the model router (task #21).
//
// Reads v_model_spend_30d + v_model_spend_agent_summary, both declared in
// migration 0016. If the view / table doesn't exist yet (env not migrated),
// we render an "awaiting first model call" empty state rather than crash.
// --------------------------------------------------------------------

type AgentRow = {
  agent_name: string;
  call_count: number;
  total_tokens: number;
  cost_usd: number;
  avg_latency_ms: number | null;
  error_count: number;
  pct_of_spend: number | null;
};

type SpendRow = {
  tenant_key: string;
  agent_name: string;
  model_id: string;
  provider: string;
  call_count: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  cost_usd: number;
  avg_latency_ms: number | null;
  error_count: number;
  first_call_at: string | null;
  last_call_at: string | null;
};

type DailyRow = {
  day: string;
  cost_usd: number;
};

async function load() {
  try {
    const sb = serverClient();
    const [agents, spend, daily] = await Promise.all([
      sb.from("v_model_spend_agent_summary").select("*").limit(20),
      sb.from("v_model_spend_30d").select("*").limit(50),
      sb.from("v_model_spend_daily")
        .select("day, cost_usd")
        .gte("day", new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10))
        .order("day", { ascending: false })
        .limit(60),
    ]);
    // roll up /day across all agents/models for the sparkline row
    const byDay = new Map<string, number>();
    for (const r of (daily.data as DailyRow[]) ?? []) {
      byDay.set(r.day, (byDay.get(r.day) ?? 0) + Number(r.cost_usd ?? 0));
    }
    const dailyRolled = Array.from(byDay.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 30);
    return {
      agents: (agents.data as AgentRow[]) ?? [],
      spend: (spend.data as SpendRow[]) ?? [],
      daily: dailyRolled,
      error: null as string | null,
    };
  } catch (e) {
    return {
      agents: [] as AgentRow[],
      spend: [] as SpendRow[],
      daily: [] as [string, number][],
      error: (e as Error).message ?? "supabase error",
    };
  }
}

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n ?? 0);

const int = (n: number | null | undefined) => (n ?? 0).toLocaleString();

export default async function CostsPage() {
  const { agents, spend, daily, error } = await load();

  const total30d = agents.reduce((a, r) => a + Number(r.cost_usd ?? 0), 0);
  const calls30d = agents.reduce((a, r) => a + Number(r.call_count ?? 0), 0);
  const errors30d = agents.reduce((a, r) => a + Number(r.error_count ?? 0), 0);

  // peak for the tiny sparkline bars
  const peak = Math.max(0.0001, ...daily.map(([, v]) => v));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">model spend</h1>
        <p className="text-sm text-muted mt-1">
          last 30 days. every agent call goes through <code>agents/model_router.py</code> and writes a row to <code>model_calls</code>. phase-1 downgrade targets sort to the top by <span className="text-accent">pct of spend</span>.
        </p>
      </div>

      {/* KPI strip */}
      <section className="grid grid-cols-4 gap-4">
        <div className="panel">
          <div className="text-muted text-xs">30d cost</div>
          <div className="text-xl mt-1">{money(total30d)}</div>
        </div>
        <div className="panel">
          <div className="text-muted text-xs">30d calls</div>
          <div className="text-xl mt-1">{int(calls30d)}</div>
        </div>
        <div className="panel">
          <div className="text-muted text-xs">avg $ / call</div>
          <div className="text-xl mt-1">
            {calls30d > 0 ? money(total30d / calls30d) : "—"}
          </div>
        </div>
        <div className="panel">
          <div className="text-muted text-xs">errors</div>
          <div className={`text-xl mt-1 ${errors30d > 0 ? "text-red-400" : ""}`}>{int(errors30d)}</div>
        </div>
      </section>

      {/* Daily sparkline (plain HTML bars, no charting library) */}
      {daily.length > 0 && (
        <section>
          <div className="text-muted text-xs uppercase mb-2">daily spend (last 30d)</div>
          <div className="flex items-end gap-[2px] h-16">
            {[...daily].reverse().map(([d, v]) => (
              <div
                key={d}
                title={`${d}: ${money(v)}`}
                className="bg-accent/60 hover:bg-accent w-2"
                style={{ height: `${Math.max(2, (v / peak) * 100)}%` }}
              />
            ))}
          </div>
          <div className="text-[10px] text-muted mt-1 flex justify-between">
            <span>{daily[daily.length - 1]?.[0] ?? ""}</span>
            <span>{daily[0]?.[0] ?? ""}</span>
          </div>
        </section>
      )}

      {/* Agent summary — Phase-1 downgrade shortlist */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg">by agent</h2>
          <div className="text-xs text-muted">sorted by cost — top row is the best downgrade target</div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-muted text-xs uppercase">
            <tr className="border-b border-white/10">
              <th className="text-left py-2">agent</th>
              <th className="text-right">calls</th>
              <th className="text-right">tokens</th>
              <th className="text-right">avg latency</th>
              <th className="text-right">errors</th>
              <th className="text-right">% of spend</th>
              <th className="text-right">cost</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((r) => (
              <tr key={r.agent_name} className="border-b border-white/5">
                <td className="py-2">{r.agent_name}</td>
                <td className="text-right">{int(r.call_count)}</td>
                <td className="text-right">{int(r.total_tokens)}</td>
                <td className="text-right">{r.avg_latency_ms ? `${int(r.avg_latency_ms)} ms` : "—"}</td>
                <td className={`text-right ${r.error_count > 0 ? "text-red-400" : "text-muted"}`}>{int(r.error_count)}</td>
                <td className="text-right">{r.pct_of_spend != null ? `${r.pct_of_spend}%` : "—"}</td>
                <td className="text-right">{money(Number(r.cost_usd))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {agents.length === 0 && !error && (
          <div className="text-muted text-sm">no calls logged yet — awaiting first agent run.</div>
        )}
      </section>

      {/* Full breakdown by tenant × agent × model */}
      <section>
        <h2 className="text-lg mb-2">by tenant × agent × model</h2>
        <table className="w-full text-sm">
          <thead className="text-muted text-xs uppercase">
            <tr className="border-b border-white/10">
              <th className="text-left py-2">tenant</th>
              <th className="text-left">agent</th>
              <th className="text-left">model</th>
              <th className="text-left">provider</th>
              <th className="text-right">calls</th>
              <th className="text-right">in</th>
              <th className="text-right">out</th>
              <th className="text-right">cache w/r</th>
              <th className="text-right">errors</th>
              <th className="text-right">cost</th>
            </tr>
          </thead>
          <tbody>
            {spend.map((r, i) => (
              <tr key={`${r.tenant_key}-${r.agent_name}-${r.model_id}-${i}`} className="border-b border-white/5">
                <td className="py-2">{r.tenant_key}</td>
                <td>{r.agent_name}</td>
                <td className="text-muted text-xs">{r.model_id}</td>
                <td className="text-muted text-xs">{r.provider}</td>
                <td className="text-right">{int(r.call_count)}</td>
                <td className="text-right">{int(r.input_tokens)}</td>
                <td className="text-right">{int(r.output_tokens)}</td>
                <td className="text-right text-xs text-muted">
                  {int(r.cache_creation_tokens)} / {int(r.cache_read_tokens)}
                </td>
                <td className={`text-right ${r.error_count > 0 ? "text-red-400" : "text-muted"}`}>{int(r.error_count)}</td>
                <td className="text-right">{money(Number(r.cost_usd))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {spend.length === 0 && !error && (
          <div className="text-muted text-sm">no model_calls rows — run any agent to start populating the ledger.</div>
        )}
      </section>

      {error && (
        <section className="text-sm text-red-400">
          supabase: {error}. if you haven&apos;t run migration 0016 yet, apply it from <code>migrations/0016_model_calls.sql</code>.
        </section>
      )}

      <style>{`.panel{display:block;background:#141416;border:1px solid rgba(255,255,255,.08);padding:1rem;border-radius:8px}`}</style>
    </div>
  );
}
