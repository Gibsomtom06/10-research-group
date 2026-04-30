import Link from "next/link";
import { serverClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type HistoryRow = {
  id: string;
  contact_id: string | null;
  direction: "inbound" | "outbound" | string;
  status: string;
  subject: string | null;
  body: string | null;
  created_at: string | null;
  sent_at: string | null;
  replied_at: string | null;
  scheduled_send_at: string | null;
  confidence_score: number | null;
  held_reason: string | null;
  cancelled_reason: string | null;
  is_bounce: boolean | null;
  bounce_type: string | null;
  first_opened_at: string | null;
  open_count: number | null;
  first_clicked_at: string | null;
  click_count: number | null;
  last_event_at: string | null;
  contact?: {
    full_name: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    relationship_tier?: string | null;
  } | null;
};

type Range = "today" | "7d" | "30d" | "all";
type StatusFilter =
  | "all"
  | "sent"
  | "queued"
  | "draft"
  | "replied"
  | "bounced"
  | "held"
  | "inbound";

function rangeStart(range: Range): Date | null {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

async function load(
  range: Range,
  status: StatusFilter,
  direction: "all" | "outbound" | "inbound"
): Promise<HistoryRow[]> {
  try {
    const sb = serverClient();
    let q = sb
      .from("outreach_log")
      .select(
        "id, contact_id, direction, status, subject, body, created_at, sent_at, replied_at, scheduled_send_at, confidence_score, held_reason, cancelled_reason, is_bounce, bounce_type, first_opened_at, open_count, first_clicked_at, click_count, last_event_at, contact:contacts(full_name, email, city, state, relationship_tier)"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    const since = rangeStart(range);
    if (since) q = q.gte("created_at", since.toISOString());

    if (direction !== "all") q = q.eq("direction", direction);

    if (status === "sent") q = q.eq("status", "sent");
    else if (status === "queued") q = q.eq("status", "queued");
    else if (status === "draft") q = q.eq("status", "draft");
    else if (status === "bounced") q = q.eq("is_bounce", true);
    else if (status === "held") q = q.eq("status", "held_for_review");
    else if (status === "replied") q = q.not("replied_at", "is", null);
    else if (status === "inbound") q = q.eq("direction", "inbound");

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      ...r,
      contact: Array.isArray(r.contact) ? r.contact[0] ?? null : r.contact,
    })) as HistoryRow[];
  } catch {
    return [];
  }
}

function fmtWhen(dt: string | null): string {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dt;
  }
}

function dirArrow(direction: string): string {
  if (direction === "outbound") return "→";
  if (direction === "inbound") return "←";
  return "·";
}

function statusBadge(row: HistoryRow): { label: string; cls: string } {
  if (row.is_bounce || row.status === "bounced") {
    return {
      label: `bounced${row.bounce_type ? ` (${row.bounce_type})` : ""}`,
      cls: "text-red-400",
    };
  }
  if (row.status === "held_for_review") return { label: "held", cls: "text-yellow-300" };
  if (row.status === "cancelled") return { label: "cancelled", cls: "text-muted/60" };
  if (row.status === "rejected") return { label: "rejected", cls: "text-muted/60" };
  if (row.status === "draft") return { label: "draft", cls: "text-muted" };
  if (row.status === "queued") return { label: "queued", cls: "text-accent/80" };
  if (row.status === "sent") return { label: "sent", cls: "text-accent" };
  if (row.direction === "inbound") return { label: "inbound", cls: "text-accent" };
  return { label: row.status, cls: "text-muted" };
}

function counts(rows: HistoryRow[]) {
  const c = { sent: 0, bounced: 0, replied: 0, queued: 0, inbound: 0, held: 0 };
  for (const r of rows) {
    if (r.is_bounce || r.status === "bounced") c.bounced++;
    if (r.status === "sent" && r.direction === "outbound") c.sent++;
    if (r.replied_at) c.replied++;
    if (r.status === "queued") c.queued++;
    if (r.status === "held_for_review") c.held++;
    if (r.direction === "inbound") c.inbound++;
  }
  return c;
}

export default async function History({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    status?: string;
    direction?: string;
  }>;
}) {
  const sp = await searchParams;
  const range = ((sp.range as Range) ?? "7d") as Range;
  const status = ((sp.status as StatusFilter) ?? "all") as StatusFilter;
  const direction = ((sp.direction as "all" | "outbound" | "inbound") ?? "all");
  const rows = await load(range, status, direction);
  const c = counts(rows);

  const rangeTabs: { k: Range; label: string }[] = [
    { k: "today", label: "today" },
    { k: "7d", label: "7d" },
    { k: "30d", label: "30d" },
    { k: "all", label: "all" },
  ];
  const statusTabs: { k: StatusFilter; label: string }[] = [
    { k: "all", label: "all" },
    { k: "sent", label: "sent" },
    { k: "replied", label: "replied" },
    { k: "queued", label: "queued" },
    { k: "held", label: "held" },
    { k: "bounced", label: "bounced" },
    { k: "inbound", label: "inbound" },
  ];
  const dirTabs: { k: "all" | "outbound" | "inbound"; label: string }[] = [
    { k: "all", label: "both" },
    { k: "outbound", label: "outbound" },
    { k: "inbound", label: "inbound" },
  ];

  function mkHref(patch: {
    range?: Range;
    status?: StatusFilter;
    direction?: "all" | "outbound" | "inbound";
  }) {
    const params = new URLSearchParams();
    params.set("range", patch.range ?? range);
    params.set("status", patch.status ?? status);
    params.set("direction", patch.direction ?? direction);
    return `/history?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl">email history</h1>
        <div className="text-xs text-muted space-x-3">
          <span>sent {c.sent}</span>
          <span>· replied {c.replied}</span>
          <span>· bounced {c.bounced}</span>
          <span>· queued {c.queued}</span>
          <span>· held {c.held}</span>
          <span>· inbound {c.inbound}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <FilterGroup
          tabs={rangeTabs}
          active={range}
          hrefFor={(k) => mkHref({ range: k })}
        />
        <FilterGroup
          tabs={statusTabs}
          active={status}
          hrefFor={(k) => mkHref({ status: k })}
        />
        <FilterGroup
          tabs={dirTabs}
          active={direction}
          hrefFor={(k) => mkHref({ direction: k })}
        />
      </div>

      {rows.length === 0 ? (
        <div className="text-muted text-sm">
          no outreach rows match those filters yet. drafts appear once the seeder
          runs; sent rows appear once the sender worker runs.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const badge = statusBadge(r);
            const when =
              r.sent_at ||
              r.replied_at ||
              r.scheduled_send_at ||
              r.created_at;
            const contactName = r.contact?.full_name ?? "unknown contact";
            const loc =
              [r.contact?.city, r.contact?.state].filter(Boolean).join(", ") ||
              null;
            return (
              <div
                key={r.id}
                className="px-3 py-2 bg-white/[0.02] rounded text-sm"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-muted text-xs">
                        {dirArrow(r.direction)}
                      </span>
                      {r.contact_id ? (
                        <Link
                          href={`/outreach/${r.contact_id}`}
                          className="hover:text-accent"
                        >
                          {contactName}
                        </Link>
                      ) : (
                        <span>{contactName}</span>
                      )}
                      {r.contact?.relationship_tier && (
                        <span className="text-xs text-muted">
                          · {r.contact.relationship_tier}
                        </span>
                      )}
                      {loc && (
                        <span className="text-xs text-muted">· {loc}</span>
                      )}
                    </div>
                    <div className="truncate text-ink mt-0.5">
                      {r.subject ?? "(no subject)"}
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap shrink-0">
                    <div className={`text-xs ${badge.cls}`}>{badge.label}</div>
                    <div className="text-xs text-muted">{fmtWhen(when)}</div>
                  </div>
                </div>

                {(r.confidence_score != null ||
                  r.held_reason ||
                  r.cancelled_reason ||
                  (r.open_count ?? 0) > 0 ||
                  (r.click_count ?? 0) > 0) && (
                  <div className="text-xs text-muted mt-1 space-x-3">
                    {r.confidence_score != null && (
                      <span>conf: {r.confidence_score.toFixed(2)}</span>
                    )}
                    {(r.open_count ?? 0) > 0 && (
                      <span className="text-accent">
                        opens: {r.open_count}
                        {r.first_opened_at
                          ? ` (first ${fmtWhen(r.first_opened_at)})`
                          : ""}
                      </span>
                    )}
                    {(r.click_count ?? 0) > 0 && (
                      <span className="text-accent">
                        clicks: {r.click_count}
                      </span>
                    )}
                    {r.held_reason && (
                      <span className="text-yellow-300">
                        held: {r.held_reason}
                      </span>
                    )}
                    {r.cancelled_reason && (
                      <span className="text-muted/70">
                        cancelled: {r.cancelled_reason}
                      </span>
                    )}
                  </div>
                )}

                {r.body && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted cursor-pointer hover:text-ink">
                      show body
                    </summary>
                    <pre className="mt-2 text-xs text-muted whitespace-pre-wrap">
                      {r.body}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterGroup<T extends string>({
  tabs,
  active,
  hrefFor,
}: {
  tabs: { k: T; label: string }[];
  active: T;
  hrefFor: (k: T) => string;
}) {
  return (
    <div className="flex gap-1 text-xs">
      {tabs.map((t) => (
        <Link
          key={t.k}
          href={hrefFor(t.k)}
          className={`px-2 py-1 rounded border ${
            active === t.k
              ? "bg-accent text-bg border-accent"
              : "border-white/10 text-muted hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
