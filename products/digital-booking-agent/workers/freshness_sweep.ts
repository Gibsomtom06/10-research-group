/**
 * Freshness sweep worker.
 *
 * Runs daily (or on demand). Finds pitch_packs whose stats or praise
 * have gone stale and marks them for regeneration. Does NOT regenerate
 * here — writes a `refresh_pitch_pack` decision which the Supervisor
 * picks up and dispatches to the Analyst runner.
 *
 * Also:
 *   - marks praise_bank entries consumed when a draft referencing them
 *     was sent
 *   - expires praise_bank rows past their expires_at
 *   - flags contacts whose last Analyst pack failed verification and
 *     haven't been retried in 48hr — these get queued for Research
 *     enrichment instead
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:
 *   npm run freshness-sweep            # continuous, 6hr interval
 *   npm run freshness-sweep -- --once  # single pass (for cron)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = Number(process.env.FRESHNESS_POLL_INTERVAL_MS ?? 6 * 60 * 60_000);
const STATS_STALE_DAYS = 30;
const REFRESH_LEAD_DAYS = 7; // regen pitch packs 7 days before they expire

function supabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function markStalePitchPacks(sb: SupabaseClient) {
  // Find packs expiring within REFRESH_LEAD_DAYS that don't already have a
  // refresh decision queued.
  const cutoff = new Date(Date.now() + REFRESH_LEAD_DAYS * 24 * 60 * 60_000).toISOString();
  const { data, error } = await sb
    .from("pitch_packs")
    .select("id, contact_id, payload")
    .lte("payload->>expires_at", cutoff)
    .is("blocked_reason", null)
    .limit(200);
  if (error) throw error;

  let queued = 0;
  for (const pack of data ?? []) {
    // check if a refresh is already queued for this contact in last 24hr
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const { count } = await sb
      .from("decisions")
      .select("*", { count: "exact", head: true })
      .eq("action", "refresh_pitch_pack")
      .eq("subject_id", pack.id)
      .gte("created_at", since);
    if ((count ?? 0) > 0) continue;

    await sb.from("decisions").insert({
      actor: "freshness_sweep",
      action: "refresh_pitch_pack",
      subject_type: "pitch_pack",
      subject_id: pack.id,
      rationale: "pack expiring within lead window",
      input_snapshot: {
        contact_id: pack.contact_id,
        expires_at: (pack.payload as any)?.expires_at,
      },
    });
    queued++;
  }
  return queued;
}

async function expirePraise(sb: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  // Use RPC-style update since supabase-js doesn't fluently support SET expr
  const { data, error } = await sb
    .from("praise_bank")
    .update({ consumed_at: new Date().toISOString() })
    .lt("expires_at", today)
    .is("consumed_at", null)
    .select("id");
  if (error) throw error;
  return (data ?? []).length;
}

async function markConsumedPraiseFromSends(sb: SupabaseClient) {
  // For each outbound row sent in the last 48h that has pitch_pack_id,
  // pull the pack's praise_hook_id (if any) and mark that praise as consumed.
  const since = new Date(Date.now() - 48 * 60 * 60_000).toISOString();
  const { data: sends, error } = await sb
    .from("outreach_log")
    .select("id, pitch_pack_id, sent_at")
    .eq("status", "sent")
    .gte("sent_at", since)
    .not("pitch_pack_id", "is", null);
  if (error) throw error;

  let consumed = 0;
  for (const s of sends ?? []) {
    const { data: pack } = await sb
      .from("pitch_packs")
      .select("praise_hook_id")
      .eq("id", s.pitch_pack_id)
      .single();
    if (!pack?.praise_hook_id) continue;

    const { error: upd } = await sb
      .from("praise_bank")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", pack.praise_hook_id)
      .is("consumed_at", null);
    if (!upd) consumed++;
  }
  return consumed;
}

async function flagBlockedContactsForResearch(sb: SupabaseClient) {
  // Contacts whose most recent pitch_pack is blocked and hasn't been
  // retried in 48hr → queue a research task.
  const since = new Date(Date.now() - 48 * 60 * 60_000).toISOString();
  const { data, error } = await sb
    .from("pitch_packs")
    .select("id, contact_id, blocked_reason, created_at")
    .not("blocked_reason", "is", null)
    .lte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  // dedupe by contact
  const seen = new Set<string>();
  let queued = 0;
  for (const p of data ?? []) {
    if (!p.contact_id || seen.has(p.contact_id)) continue;
    seen.add(p.contact_id);

    // skip if already queued
    const { count } = await sb
      .from("decisions")
      .select("*", { count: "exact", head: true })
      .eq("action", "dispatch_research")
      .eq("subject_id", p.contact_id)
      .gte("created_at", since);
    if ((count ?? 0) > 0) continue;

    await sb.from("decisions").insert({
      actor: "freshness_sweep",
      action: "dispatch_research",
      subject_type: "contact",
      subject_id: p.contact_id,
      rationale: `last pitch pack blocked: ${p.blocked_reason}`,
    });
    queued++;
  }
  return queued;
}

export async function runOnce() {
  const sb = supabase();
  const [stale_packs, expired_praise, consumed_praise, research_queued] = await Promise.all([
    markStalePitchPacks(sb),
    expirePraise(sb),
    markConsumedPraiseFromSends(sb),
    flagBlockedContactsForResearch(sb),
  ]);
  return { stale_packs, expired_praise, consumed_praise, research_queued };
}

async function main() {
  const once = new Set(process.argv.slice(2)).has("--once");
  if (once) {
    const r = await runOnce();
    console.log(JSON.stringify(r));
    return;
  }
  console.log(`freshness sweep: interval=${POLL_INTERVAL_MS}ms`);
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
