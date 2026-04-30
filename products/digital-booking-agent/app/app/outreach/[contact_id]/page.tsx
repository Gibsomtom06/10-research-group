import Link from "next/link";
import { notFound } from "next/navigation";
import { serverClient } from "@/lib/supabase";
import {
  markEmailBad,
  restoreEmail,
  setDoNotContact,
  unsetDoNotContact,
  updateThomasNotes,
} from "./actions";
import { ContactActions } from "./row-actions";
import { NotesClient } from "./notes-client";

export const dynamic = "force-dynamic";

type Contact = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  relationship_strength: string | null;
  thomas_notes: string | null;
  source_imports: any;
  email_valid: boolean | null;
  last_bounce_at: string | null;
  bounce_count: number | null;
  bounce_reason: string | null;
  do_not_contact: boolean | null;
  reminder_due_at: string | null;
  reminder_reason: string | null;
  last_interaction_at: string | null;
};

type OutreachRow = {
  id: string;
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
  bounced_for_id: string | null;
};

type OfferRow = {
  id: string;
  venue_name: string | null;
  city: string | null;
  state: string | null;
  date_iso: string | null;
  guarantee_usd: number | null;
  capacity_claimed: number | null;
  is_hold: boolean | null;
  hold_position: number | null;
  deadline_to_respond: string | null;
  radius_clause_miles: number | null;
  radius_clause_days: number | null;
  sensitivity_flags: any;
  created_at: string | null;
};

type PitchPack = {
  id: string;
  created_at: string | null;
  market_metro: string | null;
  blocked_reason: string | null;
  payload: any;
};

async function loadContact(id: string): Promise<Contact | null> {
  try {
    const sb = serverClient();
    const { data, error } = await sb
      .from("contacts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Contact;
  } catch {
    return null;
  }
}

async function loadOutreach(id: string): Promise<OutreachRow[]> {
  try {
    const sb = serverClient();
    const { data } = await sb
      .from("outreach_log")
      .select(
        "id, direction, status, subject, body, created_at, sent_at, replied_at, scheduled_send_at, confidence_score, held_reason, cancelled_reason, is_bounce, bounce_type, bounced_for_id"
      )
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []) as OutreachRow[];
  } catch {
    return [];
  }
}

async function loadOffers(id: string): Promise<OfferRow[]> {
  try {
    const sb = serverClient();
    const { data } = await sb
      .from("offers")
      .select(
        "id, venue_name, city, state, date_iso, guarantee_usd, capacity_claimed, is_hold, hold_position, deadline_to_respond, radius_clause_miles, radius_clause_days, sensitivity_flags, created_at"
      )
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as OfferRow[];
  } catch {
    return [];
  }
}

async function loadPitchPacks(id: string): Promise<PitchPack[]> {
  try {
    const sb = serverClient();
    const { data } = await sb
      .from("pitch_packs")
      .select("id, created_at, market_metro, blocked_reason, payload")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(10);
    return (data ?? []) as PitchPack[];
  } catch {
    return [];
  }
}

function fmtDateTime(dt: string | null): string {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dt;
  }
}

function statusBadge(row: OutreachRow): { label: string; cls: string } {
  if (row.is_bounce || row.status === "bounced") {
    return { label: `bounced${row.bounce_type ? ` (${row.bounce_type})` : ""}`, cls: "text-red-400" };
  }
  if (row.status === "held_for_review") return { label: "held", cls: "text-yellow-300" };
  if (row.status === "cancelled") return { label: "cancelled", cls: "text-muted/60" };
  if (row.status === "rejected") return { label: "rejected", cls: "text-muted/60" };
  if (row.status === "draft") return { label: "draft", cls: "text-muted" };
  if (row.status === "queued") return { label: "queued", cls: "text-accent" };
  if (row.status === "sent") return { label: "sent", cls: "text-accent" };
  if (row.direction === "inbound") return { label: "inbound", cls: "text-accent" };
  return { label: row.status, cls: "text-muted" };
}

function dirArrow(direction: string): string {
  if (direction === "outbound") return "→";
  if (direction === "inbound") return "←";
  return "·";
}

export default async function ContactDetail({
  params,
}: {
  params: Promise<{ contact_id: string }>;
}) {
  const { contact_id } = await params;
  const contact = await loadContact(contact_id);
  if (!contact) notFound();

  const [outreach, offers, packs] = await Promise.all([
    loadOutreach(contact_id),
    loadOffers(contact_id),
    loadPitchPacks(contact_id),
  ]);

  const outboundSent = outreach.filter(
    (o) => o.direction === "outbound" && o.status === "sent"
  ).length;
  const inboundCount = outreach.filter((o) => o.direction === "inbound").length;
  const bounceCount = outreach.filter((o) => o.is_bounce).length;

  const location = [contact.city, contact.state].filter(Boolean).join(", ") || "—";
  const sources = Array.isArray(contact.source_imports)
    ? (contact.source_imports as any[])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/outreach" className="text-sm text-muted hover:text-ink">
          ← outreach history
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl">{contact.full_name}</h1>
          <div className="text-sm text-muted mt-1 space-x-3">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>· {contact.phone}</span>}
            {contact.role && <span>· {contact.role}</span>}
          </div>
          <div className="text-sm text-muted mt-1 space-x-3">
            {contact.company && <span>{contact.company}</span>}
            <span>· {location}</span>
            {contact.relationship_strength && (
              <span>· {contact.relationship_strength}</span>
            )}
          </div>
        </div>
        <ContactActions
          contactId={contact.id}
          emailValid={contact.email_valid !== false}
          doNotContact={contact.do_not_contact === true}
          markEmailBad={markEmailBad}
          restoreEmail={restoreEmail}
          setDoNotContact={setDoNotContact}
          unsetDoNotContact={unsetDoNotContact}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="outbound sent" value={String(outboundSent)} />
        <Stat label="inbound" value={String(inboundCount)} />
        <Stat label="bounces" value={String(bounceCount)} />
        <Stat label="last touch" value={fmtDateTime(contact.last_interaction_at)} />
      </div>

      {contact.do_not_contact && (
        <div className="px-3 py-2 bg-red-400/10 border border-red-400/30 rounded text-sm text-red-300">
          <strong>do not contact</strong> — no outbound will be sent to this contact.
        </div>
      )}

      {contact.email_valid === false && (
        <div className="px-3 py-2 bg-red-400/10 border border-red-400/30 rounded text-sm text-red-300">
          <strong>bad email</strong>
          {contact.bounce_reason ? `: ${contact.bounce_reason}` : ""}.{" "}
          {contact.bounce_count ? `${contact.bounce_count} lifetime bounces.` : ""}{" "}
          get a better address and use "restore email" above to re-enable outbound.
        </div>
      )}

      {contact.reminder_due_at && (
        <div className="px-3 py-2 bg-yellow-300/10 border border-yellow-300/30 rounded text-sm text-yellow-200">
          <strong>reminder</strong>: {contact.reminder_reason ?? "due"}
        </div>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">notes</h2>
        <NotesEditor
          contactId={contact.id}
          initial={contact.thomas_notes ?? ""}
          save={updateThomasNotes}
        />
      </section>

      {sources.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-muted mb-2">sources</h2>
          <div className="text-xs text-muted space-y-1">
            {sources.map((s, i) => (
              <div key={i}>
                <span className="text-ink">{s.source ?? "unknown"}</span>
                {s.tag && <span> · {s.tag}</span>}
                {s.imported_at && <span> · {fmtDateTime(s.imported_at)}</span>}
                {s.show_date && <span> · show {s.show_date}</span>}
                {s.show_title && <span> — {s.show_title}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-muted mb-2">
            offers ({offers.length})
          </h2>
          <div className="space-y-2">
            {offers.map((o) => (
              <div
                key={o.id}
                className="px-3 py-2 bg-white/[0.02] rounded text-sm"
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-ink">
                      {o.venue_name ?? "unknown venue"}
                    </span>
                    {(o.city || o.state) && (
                      <span className="text-muted">
                        {" "}
                        — {[o.city, o.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">
                    {fmtDateTime(o.created_at)}
                  </div>
                </div>
                <div className="text-xs text-muted mt-1 space-x-3">
                  {o.date_iso && <span>date: {o.date_iso}</span>}
                  {o.guarantee_usd != null && (
                    <span>guarantee: ${o.guarantee_usd.toLocaleString()}</span>
                  )}
                  {o.capacity_claimed != null && (
                    <span>cap: {o.capacity_claimed}</span>
                  )}
                  {o.is_hold && (
                    <span className="text-yellow-300">
                      hold{o.hold_position ? ` #${o.hold_position}` : ""}
                    </span>
                  )}
                  {(o.radius_clause_miles || o.radius_clause_days) && (
                    <span>
                      radius: {o.radius_clause_miles ?? "?"}mi /{" "}
                      {o.radius_clause_days ?? "?"}d
                    </span>
                  )}
                  {o.deadline_to_respond && (
                    <span className="text-yellow-300">
                      deadline: {o.deadline_to_respond}
                    </span>
                  )}
                </div>
                {Array.isArray(o.sensitivity_flags) &&
                  o.sensitivity_flags.length > 0 && (
                    <div className="text-xs text-red-300 mt-1">
                      flags: {o.sensitivity_flags.join(", ")}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </section>
      )}

      {packs.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-muted mb-2">
            pitch packs ({packs.length})
          </h2>
          <div className="space-y-2">
            {packs.map((p) => {
              const stamps = p.payload?.verification_stamps ?? {};
              const conf = p.payload?.confidence ?? null;
              const allOk =
                stamps.stats_freshness_ok &&
                stamps.praise_freshness_ok &&
                stamps.praise_specificity_ok &&
                stamps.no_invented_fields &&
                stamps.sources_all_linkable;
              return (
                <div
                  key={p.id}
                  className="px-3 py-2 bg-white/[0.02] rounded text-sm"
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      {p.market_metro ?? "no metro"}
                      {p.blocked_reason && (
                        <span className="text-red-400 text-xs ml-2">
                          blocked: {p.blocked_reason}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      {fmtDateTime(p.created_at)}
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-1 space-x-3">
                    {conf != null && <span>conf: {conf.toFixed(2)}</span>}
                    <span className={allOk ? "text-accent" : "text-yellow-300"}>
                      stamps: {allOk ? "all pass" : "incomplete"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">
          outreach timeline ({outreach.length})
        </h2>
        {outreach.length === 0 ? (
          <div className="text-muted text-sm">
            no outbound or inbound recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {outreach.map((r) => {
              const badge = statusBadge(r);
              const when =
                r.sent_at || r.replied_at || r.scheduled_send_at || r.created_at;
              return (
                <div
                  key={r.id}
                  className="px-3 py-2 bg-white/[0.02] rounded text-sm"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-muted text-xs">
                          {dirArrow(r.direction)}
                        </span>
                        <span className="truncate">
                          {r.subject ?? "(no subject)"}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs ${badge.cls}`}>{badge.label}</span>
                    <span className="text-xs text-muted whitespace-nowrap">
                      {fmtDateTime(when)}
                    </span>
                  </div>
                  {(r.confidence_score != null ||
                    r.held_reason ||
                    r.cancelled_reason) && (
                    <div className="text-xs text-muted mt-1 space-x-3">
                      {r.confidence_score != null && (
                        <span>conf: {r.confidence_score.toFixed(2)}</span>
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
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 bg-white/[0.02] rounded">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

function NotesEditor({
  contactId,
  initial,
  save,
}: {
  contactId: string;
  initial: string;
  save: (id: string, notes: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  // server component can't hold state; delegate to a small client wrapper
  return <NotesClient contactId={contactId} initial={initial} save={save} />;
}
