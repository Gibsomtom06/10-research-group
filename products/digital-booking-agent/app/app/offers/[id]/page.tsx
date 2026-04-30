import Link from "next/link";
import { notFound } from "next/navigation";
import { serverClient } from "@/lib/supabase";
import { OfferActions } from "./actions";

export const dynamic = "force-dynamic";

type OfferDetail = {
  id: string;
  contact_id: string | null;
  venue_id: string | null;
  artist_id: string | null;
  artist_slug: string | null;
  status: string;
  source: string | null;
  relayed_by_contact_id: string | null;
  promoter_contact_id: string | null;
  agent_commission_pct: number | null;
  net_to_artist: number | null;
  reply_to_contact_id: string | null;
  proposed_date: string | null;
  guarantee: number | null;
  door_deal: any;
  counter_bounds: any;
  evaluator_result: any;
  notes: string | null;
  thread_id: string | null;
  // 0009 lifecycle:
  deposit_pct: number | null;
  deposit_due_days: number | null;
  deposit_received_at: string | null;
  deposit_amount_received: number | null;
  balance_due_when: string | null;
  override_pct: number | null;
  override_threshold: number | null;
  override_notes: string | null;
  radius_miles: number | null;
  radius_days_before: number | null;
  radius_days_after: number | null;
  radius_exclusions: string | null;
  sound_lights: string | null;
  hospitality: string | null;
  travel_provided: boolean | null;
  lodging_provided: boolean | null;
  ground_transport_provided: boolean | null;
  cancellation: string | null;
  cancellation_notice_days: number | null;
  force_majeure_language: string | null;
  signed_at_thomas: string | null;
  signed_at_promoter: string | null;
  signature_method: string | null;
  offer_sheet_url: string | null;
  offer_sheet_source: string | null;
  offer_sheet_raw_text: string | null;
  deal_memo_pdf_url: string | null;
  deal_memo_generated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  contact?: {
    full_name: string | null;
    email: string | null;
    role: string | null;
    city: string | null;
    state: string | null;
    relationship_tier?: string | null;
  } | null;
  venue?: {
    name: string | null;
    city: string | null;
    state: string | null;
    capacity: number | null;
  } | null;
  artist?: {
    name: string | null;
    slug: string | null;
  } | null;
  relayed_by?: {
    full_name: string | null;
    email: string | null;
    role: string | null;
  } | null;
  promoter?: {
    full_name: string | null;
    email: string | null;
    role: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

function sourceBadge(source: string | null): { label: string; cls: string } {
  switch (source) {
    case "agent_ab":
      return { label: "via AB Talent", cls: "text-blue-300" };
    case "agent_prysm":
      return { label: "via PRYSM", cls: "text-blue-300" };
    case "agent_other":
      return { label: "via agent", cls: "text-blue-300" };
    case "direct_promoter":
      return { label: "direct", cls: "text-muted" };
    case "gigwell_import":
      return { label: "gigwell", cls: "text-muted/70" };
    case "manual":
      return { label: "manual entry", cls: "text-muted/70" };
    default:
      return { label: "unknown source", cls: "text-muted/60" };
  }
}

type RadiusAuditTopConflict = {
  locked_show_date: string | null;
  locked_venue_city: string | null;
  locked_venue_state: string | null;
  locked_is_festival?: boolean | null;
  miles_between: number | null;
  day_gap: number | null;
  check_method: "haversine" | "same_city" | null;
  severity: "hard_block" | "soft_warning" | "festival_exception" | null;
  source_type: string | null;
  source_id: string | null;
};

type RadiusAudit = {
  severity: "clear" | "hard_block" | "soft_warning" | "festival_exception";
  conflict_count: number;
  hard_block_count?: number;
  soft_warning_count?: number;
  festival_exception_count?: number;
  nearest_miles?: number | null;
  smallest_day_gap?: number | null;
  top_conflicts: RadiusAuditTopConflict[];
};

async function loadRadiusAudit(offerId: string): Promise<RadiusAudit> {
  // Calls fn_offer_radius_check(offer_id) — see migration 0015. Returns
  // {severity: 'clear'} if no conflicts, otherwise {severity, counts,
  // nearest_miles, smallest_day_gap, top_conflicts[]}.
  try {
    const sb = serverClient();
    const { data, error } = await (sb as any).rpc("fn_offer_radius_check", {
      p_offer_id: offerId,
    });
    if (error) throw error;
    if (!data) return { severity: "clear", conflict_count: 0, top_conflicts: [] };
    return data as RadiusAudit;
  } catch {
    // If the migration hasn't been applied, don't break the page —
    // just render without the banner.
    return { severity: "clear", conflict_count: 0, top_conflicts: [] };
  }
}

async function load(id: string): Promise<OfferDetail | null> {
  try {
    const sb = serverClient();
    const { data, error } = await sb
      .from("offers")
      .select(
        `*,
         contact:contacts!offers_contact_id_fkey(full_name, email, role, city, state, relationship_tier),
         venue:venues(name, city, state, capacity),
         artist:artists(name, slug),
         relayed_by:contacts!offers_relayed_by_contact_id_fkey(full_name, email, role),
         promoter:contacts!offers_promoter_contact_id_fkey(full_name, email, role, city, state)`
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row: any = {
      ...data,
      contact: Array.isArray(data.contact) ? data.contact[0] ?? null : data.contact,
      venue: Array.isArray(data.venue) ? data.venue[0] ?? null : data.venue,
      artist: Array.isArray(data.artist) ? data.artist[0] ?? null : data.artist,
      relayed_by: Array.isArray((data as any).relayed_by)
        ? (data as any).relayed_by[0] ?? null
        : (data as any).relayed_by,
      promoter: Array.isArray((data as any).promoter)
        ? (data as any).promoter[0] ?? null
        : (data as any).promoter,
    };
    return row as OfferDetail;
  } catch {
    return null;
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
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDT(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleString();
}

function lifecycleStage(o: OfferDetail): { label: string; pct: number; cls: string } {
  if (o.deposit_received_at) return { label: "locked", pct: 100, cls: "text-accent" };
  if (o.signed_at_thomas && o.signed_at_promoter)
    return { label: "awaiting deposit", pct: 80, cls: "text-purple-300" };
  if (o.signed_at_thomas)
    return { label: "awaiting promoter sig", pct: 65, cls: "text-blue-300" };
  if (o.deal_memo_pdf_url)
    return { label: "awaiting my sig", pct: 50, cls: "text-orange-300" };
  if (o.status === "countered")
    return { label: "countered", pct: 35, cls: "text-yellow-300" };
  if (o.status === "evaluating")
    return { label: "evaluating", pct: 20, cls: "text-yellow-200" };
  return { label: "new", pct: 10, cls: "text-accent" };
}

function RadiusAuditBanner({ audit }: { audit: RadiusAudit }) {
  // Banner colors by severity. Lowercase per Thomas's UI convention.
  //   hard_block          red     — do not sign. breaches an existing clause.
  //   soft_warning        yellow  — same-city proxy fired because venues
  //                                   lack coords; Thomas should eyeball it.
  //   festival_exception  blue    — festival overlap; might coexist.
  //   clear               (no render)
  if (audit.severity === "clear" || audit.conflict_count === 0) return null;

  const theme =
    audit.severity === "hard_block"
      ? {
          border: "border-red-400/40",
          bg: "bg-red-500/[0.06]",
          accent: "text-red-300",
          label: "radius conflict · hard block",
          blurb:
            "this offer falls inside an existing locked show's radius window. signing would breach that clause.",
        }
      : audit.severity === "soft_warning"
      ? {
          border: "border-yellow-400/40",
          bg: "bg-yellow-500/[0.05]",
          accent: "text-yellow-200",
          label: "radius conflict · soft warning",
          blurb:
            "same-city proxy flagged this (venue coords missing). eyeball the actual distance before signing; backfill coords to upgrade to haversine.",
        }
      : {
          border: "border-blue-400/40",
          bg: "bg-blue-500/[0.06]",
          accent: "text-blue-300",
          label: "radius conflict · festival exception",
          blurb:
            "festival overlap — contract-level exclusivity often allows this. surface with the agent before signing.",
        };

  return (
    <div className={`rounded border ${theme.border} ${theme.bg} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-xs uppercase tracking-wide ${theme.accent}`}>
            {theme.label}
          </div>
          <div className="text-sm mt-1 text-ink">{theme.blurb}</div>
          <div className="text-[11px] text-muted mt-2">
            {audit.conflict_count} locked-show conflict
            {audit.conflict_count === 1 ? "" : "s"} within the radius window
            {audit.nearest_miles != null && (
              <> · nearest {Math.round(Number(audit.nearest_miles))}mi</>
            )}
            {audit.smallest_day_gap != null && (
              <> · smallest gap {audit.smallest_day_gap}d</>
            )}
          </div>
        </div>
      </div>
      {audit.top_conflicts && audit.top_conflicts.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {audit.top_conflicts.map((c, i) => {
            const loc = [c.locked_venue_city, c.locked_venue_state]
              .filter(Boolean)
              .join(", ");
            const date = c.locked_show_date ? fmtDate(c.locked_show_date) : "—";
            const miles =
              c.miles_between != null
                ? `${Math.round(Number(c.miles_between))}mi`
                : c.check_method === "same_city"
                ? "same city"
                : "—";
            const sev =
              c.severity === "hard_block"
                ? "text-red-300"
                : c.severity === "soft_warning"
                ? "text-yellow-300"
                : c.severity === "festival_exception"
                ? "text-blue-300"
                : "text-muted";
            return (
              <div
                key={i}
                className="text-xs flex items-center gap-2 text-muted"
              >
                <span className={`${sev} uppercase tracking-wide`}>
                  {c.severity ?? "—"}
                </span>
                <span>·</span>
                <span>{loc || "unknown city"}</span>
                <span>·</span>
                <span>{date}</span>
                <span>·</span>
                <span>{miles}</span>
                {c.day_gap != null && (
                  <>
                    <span>·</span>
                    <span>{c.day_gap}d gap</span>
                  </>
                )}
                {c.locked_is_festival && (
                  <>
                    <span>·</span>
                    <span className="text-blue-300">festival</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wide text-muted">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function KV({ k, v, accent }: { k: string; v: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-1 border-b border-white/[0.04] last:border-0">
      <div className="text-muted text-xs">{k}</div>
      <div className={accent ? "text-accent" : "text-ink"}>{v ?? "—"}</div>
    </div>
  );
}

export default async function OfferDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const o = await load(id);
  if (!o) notFound();

  // Radius audit runs in parallel conceptually — the data only matters if the
  // offer is in-flight (non-terminal). For terminal states (declined/
  // withdrawn/expired/deposit_received) we skip the call entirely to avoid
  // noise on already-settled records. The view excludes declined/withdrawn/
  // expired anyway, but deposit_received is in v_locked_shows (not audited).
  const terminalStates = ["declined", "withdrawn", "expired", "deposit_received"];
  const audit: RadiusAudit = terminalStates.includes(o.status)
    ? { severity: "clear", conflict_count: 0, top_conflicts: [] }
    : await loadRadiusAudit(id);

  const stage = lifecycleStage(o);
  const srcBadge = sourceBadge(o.source);
  const venueName = o.venue?.name ?? "unknown venue";
  const loc = [o.venue?.city, o.venue?.state].filter(Boolean).join(", ");
  const contactName = o.contact?.full_name ?? "unknown contact";
  const relayedBy = o.relayed_by ?? null;
  const promoter = o.promoter ?? null;
  const commissionDollars =
    o.guarantee != null && o.agent_commission_pct != null
      ? Math.round((o.guarantee * o.agent_commission_pct) / 100)
      : null;

  const doorSplit =
    o.door_deal && typeof o.door_deal === "object"
      ? o.door_deal
      : null;
  const counter =
    o.counter_bounds && typeof o.counter_bounds === "object"
      ? o.counter_bounds
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/offers" className="text-xs text-muted hover:text-ink">
          ← offers
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl">
            {venueName} · {fmtDate(o.proposed_date)}
          </h1>
          <div className="text-muted text-sm mt-1 flex items-center gap-2 flex-wrap">
            <span>{contactName}</span>
            {o.contact?.role && <span>· {o.contact.role}</span>}
            {loc && <span>· {loc}</span>}
            {o.artist_slug && <span>· {o.artist_slug}</span>}
            <span className={`ml-2 text-xs ${srcBadge.cls}`}>· {srcBadge.label}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm ${stage.cls}`}>{stage.label}</div>
          <div className="w-40 h-1.5 bg-white/10 rounded mt-1 overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${stage.pct}%` }}
            />
          </div>
          <div className="text-[10px] text-muted mt-1">status: {o.status}</div>
        </div>
      </div>

      <RadiusAuditBanner audit={audit} />

      <OfferActions offer={o as any} />

      {(relayedBy || promoter || o.agent_commission_pct != null) && (
        <Section title="relay & routing">
          {relayedBy && (
            <KV
              k="relayed by"
              v={`${relayedBy.full_name ?? "—"}${
                relayedBy.email ? ` <${relayedBy.email}>` : ""
              }${relayedBy.role ? ` · ${relayedBy.role}` : ""}`}
              accent
            />
          )}
          {promoter && promoter.full_name && (
            <KV
              k="promoter"
              v={`${promoter.full_name}${
                promoter.email ? ` <${promoter.email}>` : ""
              }${
                [promoter.city, promoter.state].filter(Boolean).length
                  ? ` · ${[promoter.city, promoter.state].filter(Boolean).join(", ")}`
                  : ""
              }`}
            />
          )}
          {o.agent_commission_pct != null && (
            <KV
              k="agent commission"
              v={`${o.agent_commission_pct}%${
                commissionDollars != null
                  ? ` · $${commissionDollars.toLocaleString()}`
                  : ""
              }`}
            />
          )}
          {o.net_to_artist != null && o.net_to_artist !== o.guarantee && (
            <KV
              k="net to artist"
              v={`$${Math.round(o.net_to_artist).toLocaleString()}`}
              accent
            />
          )}
          <div className="text-[10px] text-muted/70 mt-2">
            counters + confirmations reply to{" "}
            {relayedBy?.full_name ?? contactName}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="financial">
          <KV k="guarantee" v={fmtMoney(o.guarantee)} accent />
          {doorSplit && (
            <>
              {doorSplit.split != null && (
                <KV k="door split" v={`${doorSplit.split}%`} />
              )}
              {doorSplit.bonus_threshold != null && (
                <KV k="bonus threshold" v={fmtMoney(doorSplit.bonus_threshold)} />
              )}
            </>
          )}
          <KV
            k="deposit"
            v={
              o.deposit_pct != null
                ? `${o.deposit_pct}%${
                    o.deposit_due_days ? ` · ${o.deposit_due_days}d prior` : ""
                  }`
                : "—"
            }
          />
          <KV
            k="deposit received"
            v={
              o.deposit_received_at
                ? `${fmtMoney(o.deposit_amount_received)} on ${fmtDT(
                    o.deposit_received_at
                  )}`
                : "—"
            }
          />
          <KV k="balance due" v={o.balance_due_when} />
          {(o.override_pct != null || o.override_threshold != null) && (
            <KV
              k="override"
              v={
                o.override_pct != null && o.override_threshold != null
                  ? `${o.override_pct}% over ${fmtMoney(o.override_threshold)}`
                  : o.override_pct != null
                  ? `${o.override_pct}%`
                  : fmtMoney(o.override_threshold)
              }
            />
          )}
          {o.override_notes && (
            <div className="text-xs text-muted mt-1">{o.override_notes}</div>
          )}
        </Section>

        <Section title="counter bounds (internal)">
          {counter ? (
            <>
              <KV k="min guarantee" v={fmtMoney(counter.min_guarantee)} />
              <KV k="target" v={fmtMoney(counter.target)} accent />
              <KV k="walk away" v={fmtMoney(counter.walk_away)} />
            </>
          ) : (
            <div className="text-xs text-muted">
              no counter bounds set. the evaluator will compute these on next run.
            </div>
          )}
        </Section>

        <Section title="radius clause">
          <KV
            k="radius"
            v={
              o.radius_miles != null
                ? `${o.radius_miles}mi`
                : "—"
            }
          />
          <KV
            k="window"
            v={
              o.radius_days_before != null || o.radius_days_after != null
                ? `${o.radius_days_before ?? "—"}d before / ${
                    o.radius_days_after ?? "—"
                  }d after`
                : "—"
            }
          />
          {o.radius_exclusions && (
            <div className="text-xs text-muted mt-2">
              <div className="text-[10px] uppercase">carve-outs</div>
              {o.radius_exclusions}
            </div>
          )}
        </Section>

        <Section title="production">
          <KV k="sound/lights" v={o.sound_lights} />
          <KV k="hospitality" v={o.hospitality} />
          <KV k="travel" v={o.travel_provided === null ? "—" : o.travel_provided ? "yes" : "no"} />
          <KV k="lodging" v={o.lodging_provided === null ? "—" : o.lodging_provided ? "yes" : "no"} />
          <KV
            k="ground transport"
            v={
              o.ground_transport_provided === null
                ? "—"
                : o.ground_transport_provided
                ? "yes"
                : "no"
            }
          />
        </Section>

        <Section title="cancellation">
          <KV k="policy" v={o.cancellation} />
          <KV k="notice" v={o.cancellation_notice_days != null ? `${o.cancellation_notice_days}d` : "—"} />
          {o.force_majeure_language && (
            <div className="text-xs text-muted mt-2 whitespace-pre-wrap">
              {o.force_majeure_language}
            </div>
          )}
        </Section>

        <Section title="signatures">
          <KV k="thomas" v={fmtDT(o.signed_at_thomas)} accent={!!o.signed_at_thomas} />
          <KV k="promoter" v={fmtDT(o.signed_at_promoter)} accent={!!o.signed_at_promoter} />
          <KV k="method" v={o.signature_method} />
          {o.deal_memo_pdf_url ? (
            <a
              href={o.deal_memo_pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 text-xs text-accent hover:underline"
            >
              view deal memo →
            </a>
          ) : (
            <div className="text-xs text-muted mt-2">
              no memo yet. generate one once negotiation is locked.
            </div>
          )}
        </Section>
      </div>

      {o.evaluator_result && (
        <Section title="evaluator">
          <pre className="text-xs text-muted whitespace-pre-wrap">
            {JSON.stringify(o.evaluator_result, null, 2)}
          </pre>
        </Section>
      )}

      {o.offer_sheet_url && (
        <Section title="original offer">
          <a
            href={o.offer_sheet_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent hover:underline"
          >
            {o.offer_sheet_source ?? "source"} · view →
          </a>
          {o.offer_sheet_raw_text && (
            <details className="mt-2">
              <summary className="text-xs text-muted cursor-pointer hover:text-ink">
                show extracted text
              </summary>
              <pre className="text-xs text-muted mt-2 whitespace-pre-wrap">
                {o.offer_sheet_raw_text}
              </pre>
            </details>
          )}
        </Section>
      )}

      {o.notes && (
        <Section title="notes">
          <div className="text-sm whitespace-pre-wrap">{o.notes}</div>
        </Section>
      )}

      <div className="text-xs text-muted">
        created {fmtDT(o.created_at)} · updated {fmtDT(o.updated_at)}
      </div>
    </div>
  );
}
