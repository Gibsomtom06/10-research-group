/**
 * Reminder sweep worker.
 *
 * Reads v_reach_back_reminders (created in migration 0002) and:
 *   - stamps contacts.reminder_due_at / reminder_reason with the most
 *     urgent lane per contact (so the dashboard and /reminders page
 *     can show who needs attention without re-computing the view
 *     on every request)
 *   - clears reminder_due_at on contacts that no longer appear in
 *     the view (they got touched, got a reply, etc.)
 *
 * Runs daily.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = Number(process.env.REMINDER_POLL_INTERVAL_MS ?? 12 * 60 * 60_000);

// Lane priority (most urgent first)
const LANE_PRIORITY: Record<string, number> = {
  inbound_awaiting_us: 1,
  sent_no_reply: 2,
  warm_going_cold: 3,
};

function supabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function runOnce() {
  const sb = supabase();
  const { data, error } = await sb.from("v_reach_back_reminders").select("*");
  if (error) throw error;

  // Pick the most-urgent lane per contact
  const best = new Map<string, any>();
  for (const r of data ?? []) {
    const prev = best.get(r.contact_id);
    const prio = LANE_PRIORITY[r.lane] ?? 99;
    const prevPrio = prev ? LANE_PRIORITY[prev.lane] ?? 99 : 99;
    if (!prev || prio < prevPrio) best.set(r.contact_id, r);
  }

  const dueIds = new Set(best.keys());
  const now = new Date().toISOString();

  let stamped = 0;
  for (const [cid, row] of best.entries()) {
    const { error: upd } = await sb
      .from("contacts")
      .update({
        reminder_due_at: now,
        reminder_reason: `${row.lane}: ${row.reason}`,
      })
      .eq("id", cid);
    if (!upd) stamped++;
  }

  // Clear reminders for contacts no longer in the view
  const { data: stampedContacts } = await sb
    .from("contacts")
    .select("id")
    .not("reminder_due_at", "is", null);
  let cleared = 0;
  for (const c of stampedContacts ?? []) {
    if (!dueIds.has(c.id)) {
      const { error: upd } = await sb
        .from("contacts")
        .update({ reminder_due_at: null, reminder_reason: null })
        .eq("id", c.id);
      if (!upd) cleared++;
    }
  }

  return { due_contacts: dueIds.size, stamped, cleared };
}

async function main() {
  const once = new Set(process.argv.slice(2)).has("--once");
  if (once) {
    console.log(JSON.stringify(await runOnce()));
    return;
  }
  console.log(`reminder sweep: interval=${POLL_INTERVAL_MS}ms`);
  while (true) {
    try {
      const r = await runOnce();
      console.log(`${new Date().toISOString()} ${JSON.stringify(r)}`);
    } catch (e: any) {
      console.error(`${new Date().toISOString()} error: ${e?.message ?? e}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
