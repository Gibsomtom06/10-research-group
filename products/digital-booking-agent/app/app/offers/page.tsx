import Link from "next/link";
import { serverClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Offers kanban.
 *
 * Columns are the contract lifecycle (offers ARE contracts — see
 * migration 0009). Order left → right is the flow Thomas's eye
 * follows during a normal week: new offers on the left, locked shows
 * on the right.
 *
 * Reads v_offer_contract_status so the lifecycle flags come pre-derived.
 */

type DealPoints = {
  city?: string | null;
  state?: string | null;
  venue?: string | null;
  tour?: string | null;
  notes?: string | null;
  capacity?: number | null;
  promoterName?: string | null;
  gigwellId?: string | null;
} | null;

type OfferRow = {
  id: string;
  contact_id: string | null;
  venue_id: string | null;
  artist_slug: string | null;
  status: string;
  source: string | null;
  net_to_artist: number | null;
  proposed_date: string | null;
  guarantee: number | null;
  deposit_pct: number | null;
  deposit_received_at: string | null;
  signed_at_thomas: string | null;
  signed_at_promoter: string | null;
  deal_memo_pdf_url: string | null;
  is_new: boolean | null;
  is_negotiating: boolean | null;
  needs_thomas_sig: boolean | null;
  needs_promoter_sig: boolean | null;
  awaiting_deposit: boolean | null;
  is_locked: boolean | null;
  days_until_show: number | null;
  created_at: string | null;
  updated_at: string | null;
  contact?: { full_name: string | null; email: string | null } | null;
  venue?: { name: string | null; city: string | null; state: string | null } | null;
  promoter_name?: string | null;
  promoter_email?: string | null;
  promoter_company?: string | null;
  promoter_grade?: string | null;
  artist_name?: string | null;
  // From deals row (offers is a view over deals; title + deal_points
  // hold the city/state/venue/tour/notes that the importer wrote).
  title?: string | null;
  deal_points?: DealPoints;
};

type Column = {
  key: string;
  title: string;
  description: string;
  filter: (r: OfferRow) => boolean;
  accent: string;
  /** Probability this offer actually closes (becomes deposit_received). */
  stageProb: number;
  /** Days of inactivity before a card in this column is "stale." null = never. */
  rotDays: number | null;
};

// Stage probabilities are v1 defensible defaults; tune from history later.
// Rot thresholds calibrated for booking velocity (Thomas's gut + Pipedrive convention).
const COLUMNS: Column[] = [
  {
    key: "new",
    title: "new",
    description: "inbound, not yet triaged",
    filter: (r) => r.status === "inbound",
    accent: "text-accent",
    stageProb: 0.10,
    rotDays: 3,
  },
  {
    key: "negotiating",
    title: "negotiating",
    description: "countered or evaluating",
    filter: (r) => r.status === "evaluating" || r.status === "countered",
    accent: "text-yellow-300",
    stageProb: 0.30,
    rotDays: 7,
  },
  {
    key: "needs_me",
    title: "awaiting my sig",
    description: "memo out, my signature pending",
    filter: (r) =>
      r.status === "memo_sent" ||
      (!!r.deal_memo_pdf_url && !r.signed_at_thomas),
    accent: "text-orange-300",
    stageProb: 0.60,
    rotDays: 2,
  },
  {
    key: "needs_them",
    title: "awaiting promoter sig",
    description: "I signed, waiting on countersignature",
    filter: (r) =>
      r.status === "signed_by_thomas" ||
      (!!r.signed_at_thomas && !r.signed_at_promoter),
    accent: "text-blue-300",
    stageProb: 0.80,
    rotDays: 5,
  },
  {
    key: "awaiting_deposit",
    title: "awaiting deposit",
    description: "fully executed, deposit not in",
    filter: (r) =>
      r.status === "fully_executed" ||
      (!!r.signed_at_thomas && !!r.signed_at_promoter && !r.deposit_received_at),
    accent: "text-purple-300",
    stageProb: 0.95,
    rotDays: 7,
  },
  {
    key: "locked",
    title: "locked",
    description: "deposit received — it's on",
    filter: (r) => r.status === "deposit_received" || !!r.deposit_received_at,
    accent: "text-accent",
    stageProb: 1.00,
    rotDays: null,
  },
];

async function load(): Promise<OfferRow[]> {
  try {
    const sb = serverClient();
    // `offers` is a view-over-deals (post-merger). Promoter info is
    // denormalized into the view; but title + deal_points (jsonb with
    // city/state/venue/tour/notes) only live on the underlying `deals`
    // table — fetch in parallel and merge by id.
    const [offersRes, dealsRes] = await Promise.all([
      sb
        .from("offers")
        .select(
          `id, contact_id, venue_id, artist_slug, status, source, net_to_artist,
           proposed_date, guarantee, deposit_pct, deposit_received_at,
           signed_at_thomas, signed_at_promoter, deal_memo_pdf_url,
           created_at, updated_at,
           promoter_name, promoter_email, promoter_company, promoter_city, promoter_grade,
           artist_name,
           venue:venues(name, city, state)`
        )
        .order("proposed_date", { ascending: true, nullsFirst: false })
        .limit(300),
      sb.from("deals").select("id, title, deal_points").limit(500),
    ]);

    if (offersRes.error) throw offersRes.error;

    const dealMap = new Map<string, { title: string | null; deal_points: DealPoints }>();
    for (const d of dealsRes.data ?? []) {
      dealMap.set(d.id, { title: d.title ?? null, deal_points: (d.deal_points ?? null) as DealPoints });
    }

    return (offersRes.data ?? []).map((r: any): OfferRow => {
      const dealExtra = dealMap.get(r.id);
      const row: OfferRow = {
        id: r.id,
        contact_id: r.contact_id,
        venue_id: r.venue_id,
        artist_slug: r.artist_slug,
        status: r.status,
        source: r.source ?? null,
        net_to_artist: r.net_to_artist ?? null,
        proposed_date: r.proposed_date,
        guarantee: r.guarantee,
        deposit_pct: r.deposit_pct,
        deposit_received_at: r.deposit_received_at,
        signed_at_thomas: r.signed_at_thomas,
        signed_at_promoter: r.signed_at_promoter,
        deal_memo_pdf_url: r.deal_memo_pdf_url,
        is_new: null,
        is_negotiating: null,
        needs_thomas_sig: null,
        needs_promoter_sig: null,
        awaiting_deposit: null,
        is_locked: null,
        days_until_show: r.proposed_date
          ? Math.ceil(
              (new Date(r.proposed_date).getTime() - Date.now()) /
                (24 * 60 * 60 * 1000)
            )
          : null,
        created_at: r.created_at,
        updated_at: r.updated_at,
        contact: Array.isArray(r.contact) ? r.contact[0] ?? null : r.contact,
        venue: Array.isArray(r.venue) ? r.venue[0] ?? null : r.venue,
        promoter_name: r.promoter_name ?? null,
        promoter_email: r.promoter_email ?? null,
        promoter_company: r.promoter_company ?? null,
        promoter_grade: r.promoter_grade ?? null,
        artist_name: r.artist_name ?? null,
        title: dealExtra?.title ?? null,
        deal_points: dealExtra?.deal_points ?? null,
      };
      return row;
    });
  } catch {
    return [];
  }
}

function fmtMoney(n: number | null): string {
  if (n == null) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: dt.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

// Sheet-style date: M/D/YYYY. Matches the format Thomas + Leigh use in the
// production booking spreadsheet so the eye recognizes shows on sight.
function fmtSheetDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}

// Headline a card the way the production sheet does: "M/D/YYYY CITY, ST".
// Falls back gracefully — never "unknown venue". If no city/state, use
// venue name. If no venue, use promoter. If nothing, just the date.
function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

// Headline a card the way the production sheet does: "M/D/YYYY CITY, ST".
// Importer wrote real data into deals.title (e.g., "Hartford, CT — TMTYL")
// and deals.deal_points jsonb (city/state/venue/tour/notes). Prefer those —
// the venues-FK path was mostly null and gave us the dreaded "unknown venue".
function cardHeadline(r: OfferRow): {
  primary: string;
  venueLine: string | null;
  tour: string | null;
  notesExcerpt: string | null;
} {
  const date = fmtSheetDate(r.proposed_date);
  const dp = r.deal_points;

  // 1) Title from the importer ("Hartford, CT — TMTYL", "Pontiac, MI — Pike Room").
  if (r.title && r.title.trim()) {
    return {
      primary: `${date}  ${r.title.trim().toUpperCase()}`,
      venueLine: dp?.venue ?? r.venue?.name ?? null,
      tour: dp?.tour ?? null,
      notesExcerpt: dp?.notes ? truncate(dp.notes, 80) : null,
    };
  }

  // 2) deal_points jsonb has city/state where the importer didn't fill title.
  const dpLoc = [dp?.city?.trim(), dp?.state?.trim()].filter(Boolean).join(", ").toUpperCase();
  if (dpLoc) {
    return {
      primary: `${date}  ${dpLoc}`,
      venueLine: dp?.venue ?? r.venue?.name ?? null,
      tour: dp?.tour ?? null,
      notesExcerpt: dp?.notes ? truncate(dp.notes, 80) : null,
    };
  }

  // 3) Legacy venues-table FK fallback.
  const vLoc = [r.venue?.city?.trim(), r.venue?.state?.trim()].filter(Boolean).join(", ").toUpperCase();
  if (vLoc) {
    return { primary: `${date}  ${vLoc}`, venueLine: r.venue?.name ?? null, tour: null, notesExcerpt: null };
  }
  if (r.venue?.name) {
    return { primary: `${date}  ${r.venue.name}`, venueLine: null, tour: null, notesExcerpt: null };
  }

  // 4) Promoter or just the date.
  const promoter = r.promoter_company || r.promoter_name;
  if (promoter) {
    return { primary: `${date}  ${promoter}`, venueLine: null, tour: null, notesExcerpt: null };
  }
  return { primary: date, venueLine: null, tour: null, notesExcerpt: null };
}

function daysOutBadge(d: number | null): { label: string; cls: string } | null {
  if (d == null) return null;
  if (d < 0) return { label: `${-d}d ago`, cls: "text-muted/60" };
  if (d === 0) return { label: "today", cls: "text-red-400" };
  if (d <= 14) return { label: `${d}d out`, cls: "text-red-300" };
  if (d <= 45) return { label: `${d}d out`, cls: "text-yellow-300" };
  return { label: `${d}d out`, cls: "text-muted" };
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (24 * 60 * 60 * 1000);
}

function isStale(updatedAt: string | null, rotDays: number | null): boolean {
  if (rotDays == null) return false;
  const d = daysSince(updatedAt);
  return d != null && d > rotDays;
}

type ColumnTotals = {
  count: number;
  gross: number;
  net: number;
  weightedNet: number;
  staleCount: number;
};

function aggregateColumn(rows: OfferRow[], col: Column): ColumnTotals {
  let gross = 0;
  let net = 0;
  let staleCount = 0;
  for (const r of rows) {
    gross += r.guarantee ?? 0;
    net += r.net_to_artist ?? r.guarantee ?? 0;
    if (isStale(r.updated_at, col.rotDays)) staleCount += 1;
  }
  return {
    count: rows.length,
    gross,
    net,
    weightedNet: net * col.stageProb,
    staleCount,
  };
}

export default async function OffersKanban() {
  const all = await load();

  // Page-level summary: aggregate across every column once so the header line
  // can show pipeline-wide weighted $, booked $, and stale count.
  const colTotals = COLUMNS.map((col) => ({
    col,
    totals: aggregateColumn(all.filter(col.filter), col),
  }));
  const pipelineWeighted = colTotals.reduce(
    (acc, { col, totals }) =>
      col.key === "locked" ? acc : acc + totals.weightedNet,
    0
  );
  const booked = colTotals.find((c) => c.col.key === "locked")?.totals.net ?? 0;
  const totalStale = colTotals.reduce((acc, { totals }) => acc + totals.staleCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <h1 className="text-2xl">offers</h1>
        <div className="flex items-baseline gap-3 text-xs text-muted">
          <span>{all.length} total</span>
          <span className="text-muted/50">·</span>
          <span>
            <span className="text-accent">{fmtMoney(booked)}</span> booked
          </span>
          <span className="text-muted/50">·</span>
          <span>
            <span className="text-yellow-300">{fmtMoney(pipelineWeighted)}</span>{" "}
            in flight (weighted)
          </span>
          {totalStale > 0 && (
            <>
              <span className="text-muted/50">·</span>
              <span className="text-red-400">{totalStale} stale</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {colTotals.map(({ col, totals }) => {
          const rows = all.filter(col.filter);
          return (
            <div
              key={col.key}
              className="bg-white/[0.02] rounded p-3 min-h-[100px]"
            >
              <div className="mb-3">
                <div className="flex items-baseline justify-between">
                  <div className={`text-sm ${col.accent}`}>{col.title}</div>
                  <div className="text-xs text-muted">{totals.count}</div>
                </div>
                <div className="text-[10px] text-muted/70 mt-0.5 leading-tight">
                  {col.description}
                </div>
                {totals.net > 0 && (
                  <div className="flex items-baseline justify-between mt-1.5 gap-2">
                    <div className="text-[10px] text-muted truncate">
                      {col.key === "locked" ? (
                        <span className="text-accent">
                          {fmtMoney(totals.net)} booked
                        </span>
                      ) : (
                        <>
                          {fmtMoney(totals.net)}{" "}
                          <span className="text-muted/60">→</span>{" "}
                          <span className={col.accent}>
                            {fmtMoney(totals.weightedNet)}
                          </span>{" "}
                          <span className="text-muted/60">weighted</span>
                        </>
                      )}
                    </div>
                    {totals.staleCount > 0 && (
                      <div className="text-[10px] text-red-400 shrink-0">
                        {totals.staleCount} stale
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {rows.length === 0 && (
                  <div className="text-[10px] text-muted/40 italic">empty</div>
                )}
                {rows.map((r) => {
                  const head = cardHeadline(r);
                  const dob = daysOutBadge(r.days_until_show);
                  const stale = isStale(r.updated_at, col.rotDays);
                  const staleDays = stale
                    ? Math.round(daysSince(r.updated_at) ?? 0)
                    : null;
                  return (
                    <Link
                      key={r.id}
                      href={`/offers/${r.id}`}
                      className={`block bg-white/[0.03] hover:bg-white/[0.06] rounded px-2 py-2 transition-colors border-l-4 ${
                        stale ? "border-red-500" : "border-transparent"
                      }`}
                      title={
                        stale
                          ? `stale: no activity in ${staleDays}d (rot threshold ${col.rotDays}d)`
                          : undefined
                      }
                    >
                      {/* Headline — sheet style: M/D/YYYY CITY, ST */}
                      <div className="text-xs font-medium truncate">
                        {head.primary}
                      </div>
                      {/* Venue + tour tag on the same line */}
                      {(head.venueLine || head.tour) && (
                        <div className="flex items-baseline justify-between gap-1 text-[10px] mt-0.5">
                          <span className="text-muted truncate">
                            {head.venueLine ?? ""}
                          </span>
                          {head.tour && (
                            <span className="text-yellow-300/80 shrink-0 uppercase tracking-wide">
                              {head.tour}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Artist + source */}
                      <div className="flex items-center justify-between text-[10px] mt-0.5 gap-1">
                        <span className="text-muted/80 truncate">
                          {r.artist_slug ?? "—"}
                        </span>
                        {r.source && r.source !== "direct_promoter" && (
                          <span className="text-blue-300/80 shrink-0">
                            {r.source === "agent_ab"
                              ? "AB"
                              : r.source === "agent_prysm"
                              ? "PRYSM"
                              : r.source === "agent_other"
                              ? "agent"
                              : r.source === "gigwell_import"
                              ? "gigwell"
                              : "manual"}
                          </span>
                        )}
                      </div>
                      {/* Promoter (smaller). Only when we have it and haven't
                          already used it as the headline. */}
                      {(r.promoter_name || r.promoter_company) &&
                        (head.venueLine ||
                          r.deal_points?.city ||
                          r.title) && (
                          <div className="text-[10px] text-muted/60 truncate mt-0.5">
                            {r.promoter_name || r.promoter_company}
                            {r.promoter_grade && (
                              <span className="ml-1 text-blue-300/80">
                                · {r.promoter_grade}
                              </span>
                            )}
                          </div>
                        )}
                      {/* Notes excerpt (deal_points.notes). Italicized, faint,
                          one line. Surfaces things like "Support for Shlump",
                          "Deposit POP confirmed Apr 16", agent negotiation tags. */}
                      {head.notesExcerpt && (
                        <div className="text-[10px] text-muted/70 truncate mt-0.5 italic">
                          {head.notesExcerpt}
                        </div>
                      )}
                      {/* Money line */}
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="text-accent">
                          {fmtMoney(r.guarantee)}
                          {r.net_to_artist != null &&
                            r.net_to_artist !== r.guarantee && (
                              <span className="text-muted/70 ml-1">
                                (net {fmtMoney(r.net_to_artist)})
                              </span>
                            )}
                        </span>
                        {dob && (
                          <span className={dob.cls}>{dob.label}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
