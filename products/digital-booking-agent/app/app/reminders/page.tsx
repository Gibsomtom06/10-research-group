import Link from "next/link";
import { serverClient } from "@/lib/supabase";
import { composeFollowUp, snoozeReminder, clearReminder } from "./actions";
import { ReminderRowActions } from "./row-actions";

export const dynamic = "force-dynamic";

type Lane = "inbound_awaiting_us" | "warm_going_cold" | "sent_no_reply";

type Row = {
  contact_id: string;
  full_name: string;
  email: string | null;
  role: string | null;
  last_inbound_at: string | null;
  lane: Lane;
  reason: string;
};

const LANE_LABEL: Record<Lane, string> = {
  inbound_awaiting_us: "inbound — awaiting us",
  sent_no_reply: "sent — no reply",
  warm_going_cold: "warm — going cold",
};

const LANE_ORDER: Lane[] = ["inbound_awaiting_us", "sent_no_reply", "warm_going_cold"];

async function load(): Promise<Row[]> {
  try {
    const sb = serverClient();
    const { data, error } = await sb
      .from("v_reach_back_reminders")
      .select("*")
      .limit(500);
    if (error) throw error;
    return (data ?? []) as Row[];
  } catch {
    return [];
  }
}

function fmtAge(dt: string | null): string {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "1d";
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${Math.floor(days / 365)}y`;
  } catch {
    return dt;
  }
}

function laneAccent(lane: Lane): string {
  switch (lane) {
    case "inbound_awaiting_us":
      return "border-l-2 border-l-red-400/70";
    case "sent_no_reply":
      return "border-l-2 border-l-yellow-300/70";
    case "warm_going_cold":
      return "border-l-2 border-l-accent/70";
  }
}

export default async function Reminders() {
  const rows = await load();

  // dedup to most-urgent lane per contact, same ordering as the worker
  const priority: Record<Lane, number> = {
    inbound_awaiting_us: 1,
    sent_no_reply: 2,
    warm_going_cold: 3,
  };
  const best = new Map<string, Row>();
  for (const r of rows) {
    const prev = best.get(r.contact_id);
    if (!prev || priority[r.lane] < priority[prev.lane]) best.set(r.contact_id, r);
  }
  const unique = Array.from(best.values());

  const grouped: Record<Lane, Row[]> = {
    inbound_awaiting_us: [],
    sent_no_reply: [],
    warm_going_cold: [],
  };
  for (const r of unique) grouped[r.lane].push(r);
  for (const lane of LANE_ORDER) {
    grouped[lane].sort((a, b) => {
      const ta = a.last_inbound_at ? new Date(a.last_inbound_at).getTime() : 0;
      const tb = b.last_inbound_at ? new Date(b.last_inbound_at).getTime() : 0;
      return ta - tb;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl">reminders</h1>
          <p className="text-sm text-muted mt-1">
            who to reach back out to, grouped by why. most urgent first.
          </p>
        </div>
        <Link href="/outreach" className="text-sm text-muted hover:text-ink">
          ← outreach history
        </Link>
      </div>

      <div className="flex gap-4 text-xs text-muted">
        <div>
          <span className="inline-block w-2 h-2 rounded-full bg-red-400/70 mr-1 align-middle" />
          inbound awaiting: {grouped.inbound_awaiting_us.length}
        </div>
        <div>
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-300/70 mr-1 align-middle" />
          sent no reply: {grouped.sent_no_reply.length}
        </div>
        <div>
          <span className="inline-block w-2 h-2 rounded-full bg-accent/70 mr-1 align-middle" />
          warm going cold: {grouped.warm_going_cold.length}
        </div>
      </div>

      {unique.length === 0 && (
        <div className="text-muted text-sm">
          nothing queued. once outbound has gone 14+ days without reply, or inbound messages
          have sat 48+ hours, or warm contacts have gone 30+ days untouched, they'll show up here.
        </div>
      )}

      {LANE_ORDER.map((lane) => {
        const items = grouped[lane];
        if (items.length === 0) return null;
        return (
          <section key={lane} className="space-y-2">
            <h2 className="text-sm uppercase tracking-wide text-muted">
              {LANE_LABEL[lane]}{" "}
              <span className="text-xs text-muted/60">({items.length})</span>
            </h2>
            <div className="space-y-1">
              {items.map((r) => (
                <div
                  key={`${r.contact_id}:${r.lane}`}
                  className={`flex items-center gap-3 px-3 py-2 bg-white/[0.02] rounded ${laneAccent(
                    r.lane
                  )}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link
                        href={`/outreach/${r.contact_id}`}
                        className="hover:text-accent truncate"
                      >
                        {r.full_name}
                      </Link>
                      <span className="text-xs text-muted truncate">
                        {r.email ?? ""}
                      </span>
                      {r.role && (
                        <span className="text-xs text-muted/70">· {r.role}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted mt-0.5">{r.reason}</div>
                  </div>
                  <div className="text-xs text-muted whitespace-nowrap">
                    {fmtAge(r.last_inbound_at)}
                  </div>
                  <ReminderRowActions
                    contactId={r.contact_id}
                    lane={r.lane}
                    composeFollowUp={composeFollowUp}
                    snoozeReminder={snoozeReminder}
                    clearReminder={clearReminder}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
