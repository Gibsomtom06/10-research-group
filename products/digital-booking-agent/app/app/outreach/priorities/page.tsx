import Link from "next/link";
import { serverClient } from "@/lib/supabase";
import { OutreachNowButton } from "./row-actions";

export const dynamic = "force-dynamic";

/**
 * /outreach/priorities
 *
 * Top N targets by composite probability-to-book score (migration 0011 →
 * v_target_score). Replaces the old "pick N from each tier" routing with
 * a single ranked queue + factor-breakdown audit.
 *
 * Filters (searchParams):
 *   artist=<slug>     — restrict to one roster artist
 *   tour=<tour_id>    — restrict to one tour
 *   min=<0..1>        — floor on score
 *   limit=<n>         — top N (default 50, capped at 200)
 *   include_blocked   — surface radius-blocked rows at the bottom
 *
 * The "outreach now" button upserts a tour_targets row with priority=1 so
 * the existing seeder/composer picks it up out-of-band. It does NOT send
 * email directly — Thomas still reviews in /drafts.
 */

type ScoreRow = {
  tour_id: string;
  tour_name: string | null;
  window_start: string | null;
  window_end: string | null;
  artist_id: string;
  artist_slug: string | null;
  artist_name: string | null;
  contact_id: string;
  contact_name: string | null;
  email: string | null;
  relationship_tier: string | null;
  vip: boolean | null;
  venue_id: string | null;
  venue_name: string | null;
  venue_capacity: number | null;
  venue_city: string | null;
  venue_state: string | null;
  score: number | null;
  has_radius_conflict: boolean | null;
  radius_blocked: boolean | null;
  radius_exception_candidate: boolean | null;
  is_festival: boolean | null;
  factor_breakdown: {
    weights?: Record<string, number>;
    factors?: {
      history?: number;
      tier?: number;
      recency?: number;
      cap_fit?: number;
      anchor?: number;
      reply?: number;
      genre?: number;
    };
    signals?: Record<string, unknown>;
    raw_score?: number;
  } | null;
};

type TourLite = { id: string; name: string | null; status: string | null };
type ArtistLite = { slug: string | null; display_name: string | null };

async function loadTours(): Promise<TourLite[]> {
  try {
    const sb = serverClient();
    const { data, error } = await sb
      .from("tours")
      .select("id, name, status")
      .in("status", ["planning", "active"])
      .order("window_start", { ascending: true });
    if (error) throw error;
    return (data ?? []) as TourLite[];
  } catch {
    return [];
  }
}

async function loadArtists(): Promise<ArtistLite[]> {
  try {
    const sb = serverClient();
    const { data, error } = await sb
      .from("artists")
      .select("slug, display_name")
      .eq("active", true)
      .order("display_name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ArtistLite[];
  } catch {
    return [];
  }
}

async function loadPriorities(params: {
  artist?: string;
  tour?: string;
  min?: number;
  limit: number;
  includeBlocked: boolean;
}): Promise<{ ranked: ScoreRow[]; blocked: ScoreRow[]; exceptions: ScoreRow[] }> {
  try {
    const sb = serverClient();
    let q = sb.from("v_target_score").select("*");
    if (params.artist) q = q.eq("artist_slug", params.artist);
    if (params.tour) q = q.eq("tour_id", params.tour);
    if (!params.includeBlocked) q = q.eq("radius_blocked", false);
    if (typeof params.min === "number") q = q.gte("score", params.min);
    q = q.order("score", { ascending: false }).limit(params.limit);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as ScoreRow[];
    const ranked = rows.filter((r) => !r.radius_blocked);
    const blocked = rows.filter((r) => r.radius_blocked);

    // Second query: pull the top exception candidates regardless of the main
    // filter so the "festival radius exceptions" panel still populates even
    // when the user has a tight filter on the main table.
    let eq = sb
      .from("v_radius_exception_candidates")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);
    if (params.artist) eq = eq.eq("artist_slug", params.artist);
    if (params.tour) eq = eq.eq("tour_id", params.tour);
    const { data: exData } = await eq;
    const exceptions = (exData ?? []) as ScoreRow[];

    return { ranked, blocked, exceptions };
  } catch {
    return { ranked: [], blocked: [], exceptions: [] };
  }
}

function pct(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${Math.round(v * 100)}`;
}

function scoreCls(s: number | null | undefined): string {
  const v = Number(s ?? 0);
  if (v >= 0.8) return "text-accent";
  if (v >= 0.6) return "text-yellow-300";
  if (v >= 0.4) return "text-ink";
  return "text-muted";
}

/** small sparkbar — 7 narrow bars, one per factor */
function FactorBars({ f }: { f: ScoreRow["factor_breakdown"] }) {
  const factors = f?.factors ?? {};
  const pairs: Array<[string, number]> = [
    ["hist", factors.history ?? 0],
    ["tier", factors.tier ?? 0],
    ["rec", factors.recency ?? 0],
    ["cap", factors.cap_fit ?? 0],
    ["anc", factors.anchor ?? 0],
    ["rep", factors.reply ?? 0],
    ["gen", factors.genre ?? 0],
  ];
  return (
    <div className="flex items-end gap-0.5 h-5" title={pairs.map(([k, v]) => `${k} ${pct(v)}%`).join(" · ")}>
      {pairs.map(([k, v]) => {
        const pctH = Math.max(2, Math.min(100, Math.round((v ?? 0) * 100)));
        const cls =
          v >= 0.7 ? "bg-accent" : v >= 0.4 ? "bg-yellow-300/70" : "bg-muted/50";
        return (
          <div
            key={k}
            className={`w-1.5 ${cls}`}
            style={{ height: `${pctH}%` }}
          />
        );
      })}
    </div>
  );
}

/** Reduce factor_breakdown.factors → top 3 weighted contributions string */
function topContribs(f: ScoreRow["factor_breakdown"]): string {
  if (!f?.factors || !f?.weights) return "";
  const contribs = Object.entries(f.factors).map(([k, v]) => {
    const w = (f.weights as Record<string, number>)[k] ?? 0;
    return { k, contrib: (v ?? 0) * w };
  });
  contribs.sort((a, b) => b.contrib - a.contrib);
  const labels: Record<string, string> = {
    history: "booking history",
    tier: "buyer tier",
    recency: "recency",
    cap_fit: "capacity fit",
    anchor: "routing anchor",
    reply: "reply rate",
    genre: "genre fit",
  };
  return contribs
    .slice(0, 3)
    .map((c) => labels[c.k] ?? c.k)
    .join(" · ");
}

export default async function PrioritiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    artist?: string;
    tour?: string;
    min?: string;
    limit?: string;
    include_blocked?: string;
  }>;
}) {
  const sp = await searchParams;
  const artist = sp.artist || undefined;
  const tour = sp.tour || undefined;
  const min = sp.min ? Math.max(0, Math.min(1, Number(sp.min))) : undefined;
  const limit = Math.min(200, Math.max(10, Number(sp.limit ?? 50)));
  const includeBlocked = sp.include_blocked === "1";

  const [tours, artists, result] = await Promise.all([
    loadTours(),
    loadArtists(),
    loadPriorities({ artist, tour, min, limit, includeBlocked }),
  ]);

  const { ranked, blocked, exceptions } = result;

  function buildHref(patch: Record<string, string | undefined>): string {
    const next: Record<string, string> = {};
    if (artist) next.artist = artist;
    if (tour) next.tour = tour;
    if (min !== undefined) next.min = String(min);
    if (limit !== 50) next.limit = String(limit);
    if (includeBlocked) next.include_blocked = "1";
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") delete next[k];
      else next[k] = v;
    }
    const qs = new URLSearchParams(next).toString();
    return "/outreach/priorities" + (qs ? `?${qs}` : "");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl">outreach priorities</h1>
          <div className="text-xs text-muted mt-1">
            ranked by v_target_score · history 25 · tier 15 · recency 10 · cap-fit 10 · anchor 15 · reply 15 · genre 10
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/outreach" className="text-muted hover:text-ink">
            ← outreach history
          </Link>
          <Link href="/drafts" className="text-muted hover:text-ink">
            drafts →
          </Link>
        </div>
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <span className="text-muted">artist:</span>
        <Link
          href={buildHref({ artist: undefined })}
          className={`px-2 py-1 rounded border ${
            !artist
              ? "bg-accent text-bg border-accent"
              : "border-white/10 text-muted hover:text-ink"
          }`}
        >
          all
        </Link>
        {artists.map((a) => (
          <Link
            key={a.slug ?? a.display_name ?? ""}
            href={buildHref({ artist: a.slug ?? undefined })}
            className={`px-2 py-1 rounded border ${
              artist === a.slug
                ? "bg-accent text-bg border-accent"
                : "border-white/10 text-muted hover:text-ink"
            }`}
          >
            {a.display_name ?? a.slug}
          </Link>
        ))}

        <span className="text-muted ml-4">tour:</span>
        <Link
          href={buildHref({ tour: undefined })}
          className={`px-2 py-1 rounded border ${
            !tour
              ? "bg-accent text-bg border-accent"
              : "border-white/10 text-muted hover:text-ink"
          }`}
        >
          all
        </Link>
        {tours.map((t) => (
          <Link
            key={t.id}
            href={buildHref({ tour: t.id })}
            className={`px-2 py-1 rounded border ${
              tour === t.id
                ? "bg-accent text-bg border-accent"
                : "border-white/10 text-muted hover:text-ink"
            }`}
          >
            {t.name ?? t.id.slice(0, 8)}
          </Link>
        ))}

        <span className="text-muted ml-4">min score:</span>
        {[undefined, 0.3, 0.5, 0.7].map((v) => (
          <Link
            key={String(v)}
            href={buildHref({ min: v === undefined ? undefined : String(v) })}
            className={`px-2 py-1 rounded border ${
              (min ?? -1) === (v ?? -1)
                ? "bg-accent text-bg border-accent"
                : "border-white/10 text-muted hover:text-ink"
            }`}
          >
            {v === undefined ? "any" : v.toFixed(1)}
          </Link>
        ))}

        <span className="text-muted ml-4">limit:</span>
        {[25, 50, 100, 200].map((v) => (
          <Link
            key={v}
            href={buildHref({ limit: v === 50 ? undefined : String(v) })}
            className={`px-2 py-1 rounded border ${
              limit === v
                ? "bg-accent text-bg border-accent"
                : "border-white/10 text-muted hover:text-ink"
            }`}
          >
            {v}
          </Link>
        ))}

        <Link
          href={buildHref({
            include_blocked: includeBlocked ? undefined : "1",
          })}
          className={`ml-4 px-2 py-1 rounded border ${
            includeBlocked
              ? "bg-yellow-900/40 text-yellow-200 border-yellow-500/30"
              : "border-white/10 text-muted hover:text-ink"
          }`}
        >
          {includeBlocked ? "✓ including blocked" : "show radius-blocked"}
        </Link>
      </div>

      {/* main ranked table */}
      {ranked.length === 0 && (
        <div className="text-muted text-sm">
          no ranked targets match these filters. if you have tours in planning/active status
          and pitchable contacts, check migration 0011 has been applied and the seeder has run.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted border-b border-white/10">
            <tr className="text-left">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-3">artist</th>
              <th className="py-2 pr-3">contact</th>
              <th className="py-2 pr-3">venue · city</th>
              <th className="py-2 pr-3">tier</th>
              <th className="py-2 pr-3 text-right">score</th>
              <th className="py-2 pr-3">factors</th>
              <th className="py-2 pr-3">why (top 3)</th>
              <th className="py-2 pr-3">flags</th>
              <th className="py-2 pr-3 text-right">action</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => (
              <tr key={`${r.tour_id}-${r.artist_id}-${r.contact_id}-${r.venue_id ?? "none"}`} className="border-b border-white/5">
                <td className="py-2 pr-2 text-muted">{i + 1}</td>
                <td className="py-2 pr-3">
                  <div className="text-ink">{r.artist_name ?? r.artist_slug}</div>
                  <div className="text-xs text-muted">{r.tour_name ?? "—"}</div>
                </td>
                <td className="py-2 pr-3">
                  <Link
                    href={`/outreach/${r.contact_id}`}
                    className="hover:text-accent"
                  >
                    {r.contact_name ?? "—"}
                  </Link>
                  <div className="text-xs text-muted">{r.email ?? ""}</div>
                </td>
                <td className="py-2 pr-3">
                  <div className="text-ink">{r.venue_name ?? "—"}</div>
                  <div className="text-xs text-muted">
                    {[r.venue_city, r.venue_state].filter(Boolean).join(", ") || "—"}
                    {r.venue_capacity ? ` · cap ${r.venue_capacity}` : ""}
                  </div>
                </td>
                <td className="py-2 pr-3 text-muted">{r.relationship_tier ?? "—"}</td>
                <td className={`py-2 pr-3 text-right ${scoreCls(r.score)}`}>
                  {r.score === null ? "—" : r.score.toFixed(3)}
                </td>
                <td className="py-2 pr-3">
                  <FactorBars f={r.factor_breakdown} />
                </td>
                <td className="py-2 pr-3 text-xs text-muted">
                  {topContribs(r.factor_breakdown) || "—"}
                </td>
                <td className="py-2 pr-3">
                  <div className="flex flex-col gap-0.5">
                    {r.vip && (
                      <span className="text-xs text-accent">vip</span>
                    )}
                    {r.is_festival && (
                      <span className="text-xs text-yellow-300">festival</span>
                    )}
                    {r.radius_exception_candidate && (
                      <span className="text-xs text-yellow-300" title="radius conflict at festival venue — negotiate carve-out">
                        radius exception
                      </span>
                    )}
                    {r.has_radius_conflict && !r.radius_exception_candidate && (
                      <span className="text-xs text-red-400">radius conflict</span>
                    )}
                  </div>
                </td>
                <td className="py-2 pr-3 text-right">
                  <OutreachNowButton
                    tourId={r.tour_id}
                    contactId={r.contact_id}
                    venueId={r.venue_id}
                    marketMetro={
                      r.venue_city && r.venue_state
                        ? `${r.venue_city}, ${r.venue_state}`
                        : r.venue_city ?? null
                    }
                    relationshipTier={r.relationship_tier ?? null}
                    artistSlug={r.artist_slug ?? null}
                    scoreReason={
                      r.score === null
                        ? "no score"
                        : `score ${r.score.toFixed(3)} · ${topContribs(r.factor_breakdown) || "no factors"}`
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* festival exception candidates panel */}
      {exceptions.length > 0 && (
        <section className="mt-8 space-y-2">
          <h2 className="text-lg text-yellow-300">
            festival radius exceptions ({exceptions.length})
          </h2>
          <p className="text-xs text-muted">
            festival venues inside the radius window — worth asking the agent for a carve-out.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted border-b border-white/10">
                <tr className="text-left">
                  <th className="py-2 pr-3">artist</th>
                  <th className="py-2 pr-3">venue · city</th>
                  <th className="py-2 pr-3">contact</th>
                  <th className="py-2 pr-3 text-right">score</th>
                  <th className="py-2 pr-3">conflict source</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((r) => (
                  <tr key={`exc-${r.tour_id}-${r.artist_id}-${r.contact_id}-${r.venue_id ?? "none"}`} className="border-b border-white/5">
                    <td className="py-2 pr-3">{r.artist_name ?? r.artist_slug}</td>
                    <td className="py-2 pr-3">
                      {r.venue_name ?? "—"}
                      <span className="text-xs text-muted"> · {r.venue_city ?? "—"}</span>
                    </td>
                    <td className="py-2 pr-3">
                      <Link
                        href={`/outreach/${r.contact_id}`}
                        className="hover:text-accent"
                      >
                        {r.contact_name ?? "—"}
                      </Link>
                    </td>
                    <td className={`py-2 pr-3 text-right ${scoreCls(r.score)}`}>
                      {r.score === null ? "—" : r.score.toFixed(3)}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted">
                      {(r.factor_breakdown?.signals as { conflict_source?: string } | undefined)?.conflict_source ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* blocked panel */}
      {includeBlocked && blocked.length > 0 && (
        <section className="mt-8 space-y-2">
          <h2 className="text-lg text-red-300">
            radius-blocked (non-festival) ({blocked.length})
          </h2>
          <p className="text-xs text-muted">
            hard-zeroed by the scorer. surfaced so you can spot false positives — e.g. two
            venues in the same city that are actually far apart, or an expired lock.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted border-b border-white/10">
                <tr className="text-left">
                  <th className="py-2 pr-3">artist</th>
                  <th className="py-2 pr-3">venue · city</th>
                  <th className="py-2 pr-3">contact</th>
                  <th className="py-2 pr-3">conflict source</th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((r) => (
                  <tr key={`blk-${r.tour_id}-${r.artist_id}-${r.contact_id}-${r.venue_id ?? "none"}`} className="border-b border-white/5">
                    <td className="py-2 pr-3">{r.artist_name ?? r.artist_slug}</td>
                    <td className="py-2 pr-3">
                      {r.venue_name ?? "—"}
                      <span className="text-xs text-muted"> · {r.venue_city ?? "—"}</span>
                    </td>
                    <td className="py-2 pr-3">{r.contact_name ?? "—"}</td>
                    <td className="py-2 pr-3 text-xs text-muted">
                      {(r.factor_breakdown?.signals as { conflict_source?: string } | undefined)?.conflict_source ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
