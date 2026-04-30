import { serverClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function load() {
  try {
    const sb = serverClient();
    // latest snapshot per metro
    const { data } = await sb
      .from("artist_data")
      .select("metro, as_of_date, spotify_monthly_listeners, spotify_trend_90d_pct, ig_followers, youtube_views_28d")
      .order("as_of_date", { ascending: false })
      .limit(300);
    const latest = new Map<string, any>();
    for (const row of (data ?? [])) if (!latest.has(row.metro)) latest.set(row.metro, row);
    return Array.from(latest.values())
      .sort((a, b) => (b.spotify_monthly_listeners ?? 0) - (a.spotify_monthly_listeners ?? 0));
  } catch { return []; }
}

function trendColor(pct: number | null) {
  if (pct == null) return "text-muted";
  if (pct >= 20) return "text-accent";
  if (pct > 0) return "text-ink";
  return "text-red-400";
}

export default async function Markets() {
  const rows = await load();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl">artist heat map</h1>
      <p className="text-sm text-muted">
        where the roster draws right now. refreshed nightly by analyst agent.
        {/* TODO (#34): add artist selector — currently aggregates whichever rows land in artist_data. */}
      </p>
      <table className="w-full text-sm">
        <thead className="text-muted text-xs uppercase">
          <tr className="border-b border-white/10">
            <th className="text-left py-2">metro</th>
            <th className="text-right">monthly listeners</th>
            <th className="text-right">90d trend</th>
            <th className="text-right">ig followers</th>
            <th className="text-right">yt views (28d)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.metro} className="border-b border-white/5">
              <td className="py-2">{r.metro}</td>
              <td className="text-right">{r.spotify_monthly_listeners?.toLocaleString() ?? "—"}</td>
              <td className={`text-right ${trendColor(r.spotify_trend_90d_pct)}`}>
                {r.spotify_trend_90d_pct != null ? `${r.spotify_trend_90d_pct > 0 ? "+" : ""}${r.spotify_trend_90d_pct}%` : "—"}
              </td>
              <td className="text-right">{r.ig_followers?.toLocaleString() ?? "—"}</td>
              <td className="text-right">{r.youtube_views_28d?.toLocaleString() ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="text-muted text-sm">no data — wire spotify for artists + youtube analytics + ig apis, then run the nightly ingest.</div>}
    </div>
  );
}
