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
};

type Column = {
  key: string;
  title: string;
  description: string;
  filter: (r: OfferRow) => boolean;
  accent: string;
};

const COLUMNS: Column[] = [
  {
    key: "new",
    title: "new",
    description: "inbound, not yet triaged",
    filter: (r) => r.status === "inbound",
    accent: "text-accent",
  },
  {
    key: "negotiating",
    title: "negotiating",
    description: "countered or evaluating",
    filter: (r) => r.status === "evaluating" || r.status === "countered",
    accent: "text-yellow-300",
  },
  {
    key: "needs_me",
    title: "awaiting my sig",
    description: "memo out, my signature pending",
    filter: (r) =>
      r.status === "memo_sent" ||
      (!!r.deal_memo_pdf_url && !r.signed_at_thomas),
    accent: "text-orange-300",
  },
  {
    key: "needs_them",
    title: "awaiting promoter sig",
    description: "I signed, waiting on countersignature",
    filter: (r) =>
      r.status === "signed_by_thomas" ||
      (!!r.signed_at_thomas && !r.signed_at_promoter),
    accent: "text-blue-300",
  },
  {
    key: "awaiting_deposit",
    title: "awaiting deposit",
    description: "fully executed, deposit not in",
    filter: (r) =>
      r.status === "fully_executed" ||
      (!!r.signed_at_thomas && !!r.signed_at_promoter && !r.deposit_received_at),
    accent: "text-purple-300",
  },
  {
    key: "locked",
    title: "locked",
    description: "deposit received — it's on",
    filter: (r) => r.status === "deposit_received" || !!r.deposit_received_at,
    accent: "text-accent",
  },
];

async function load(): Promise<OfferRow[]> {
  try {
    const sb = serverClient();
    // `offers` is a view-over-deals (post-merger). Promoter info is
    // denormalized into the view (promoter_name, _email, _grade, etc.)
    // so we don't need a FK join from a view.
    const { data, error } = await sb
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
      .limit(300);

    if (error) throw error;

    return (data ?? []).map((r: any): OfferRow => {
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

function daysOutBadge(d: number | null): { label: string; cls: string } | null {
  if (d == null) return null;
  if (d < 0) return { label: `${-d}d ago`, cls: "text-muted/60" };
  if (d === 0) return { label: "today", cls: "text-red-400" };
  if (d <= 14) return { label: `${d}d out`, cls: "text-red-300" };
  if (d <= 45) return { label: `${d}d out`, cls: "text-yellow-300" };
  return { label: `${d}d out`, cls: "text-muted" };
}

export default async function OffersKanban() {
  const all = await load();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl">offers</h1>
        <div className="text-xs text-muted">
          {all.length} total · offers are contracts
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {COLUMNS.map((col) => {
          const rows = all.filter(col.filter);
          return (
            <div
              key={col.key}
              className="bg-white/[0.02] rounded p-3 min-h-[100px]"
            >
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <div className={`text-sm ${col.accent}`}>{col.title}</div>
                  <div className="text-[10px] text-muted/70 mt-0.5 leading-tight">
                    {col.description}
                  </div>
                </div>
                <div className="text-xs text-muted">{rows.length}</div>
              </div>

              <div className="space-y-2">
                {rows.length === 0 && (
                  <div className="text-[10px] text-muted/40 italic">empty</div>
                )}
                {rows.map((r) => {
                  const loc = [r.venue?.city, r.venue?.state]
                    .filter(Boolean)
                    .join(", ");
                  const dob = daysOutBadge(r.days_until_show);
                  return (
                    <Link
                      key={r.id}
                      href={`/offers/${r.id}`}
                      className="block bg-white/[0.03] hover:bg-white/[0.06] rounded px-2 py-2 transition-colors"
                    >
                      <div className="text-xs truncate">
                        {r.venue?.name ?? "unknown venue"}
                      </div>
                      <div className="text-[10px] text-muted truncate">
                        {loc || "—"}
                      </div>
                      {(r.promoter_name || r.promoter_company) && (
                        <div className="text-[10px] text-muted/80 truncate">
                          {r.promoter_name || r.promoter_company}
                          {r.promoter_grade && (
                            <span className="ml-1 text-blue-300/80">
                              · {r.promoter_grade}
                            </span>
                          )}
                        </div>
                      )}
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
                        <span className="text-muted">
                          {fmtDate(r.proposed_date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-0.5">
                        {r.artist_slug && (
                          <span className="text-muted/80">{r.artist_slug}</span>
                        )}
                        {r.source && r.source !== "direct_promoter" && (
                          <span className="text-blue-300/80">
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
                      {dob && (
                        <div className={`text-[10px] mt-0.5 ${dob.cls}`}>
                          {dob.label}
                        </div>
                      )}
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
