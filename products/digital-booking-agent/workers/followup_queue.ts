/**
 * Follow-up queue worker.
 *
 * Bridges the reminders UI (`/reminders` → composeFollowUp server action)
 * to the Outbound composer.
 *
 * Flow:
 *   1. UI inserts a `decisions` row with action='queue_followup_compose'
 *      and output_snapshot.status='queued'.
 *   2. This worker polls those rows.
 *   3. For each, it spawns the Outbound Python runner with the contact id
 *      and lane (`followup:sent_no_reply`, etc.) as the compose intent.
 *   4. On success, it flips output_snapshot.status to 'processed' and
 *      records the resulting outreach_log id. On failure, it flips to
 *      'failed' with the error message and bumps attempt_count; after
 *      3 failures it goes to 'dead' and surfaces on the dashboard.
 *
 * Idempotent: the decisions row is what gates retries. If the Outbound
 * runner crashes mid-compose, the row stays 'queued' and will retry on
 * the next tick.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   OUTBOUND_PYTHON_BIN  default: python
 *   OUTBOUND_RUNNER_PATH default: ../agents/outbound.py
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import path from "node:path";

const POLL_INTERVAL_MS = Number(process.env.FOLLOWUP_POLL_INTERVAL_MS ?? 60_000);
const MAX_ATTEMPTS = 3;

function supabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function runOutboundCompose(
  contactId: string,
  lane: string
): Promise<{ ok: true; outreach_log_id: string | null } | { ok: false; error: string }> {
  const bin = process.env.OUTBOUND_PYTHON_BIN ?? "python";
  const script =
    process.env.OUTBOUND_RUNNER_PATH ?? path.resolve(__dirname, "..", "agents", "outbound.py");

  return new Promise((resolve) => {
    const args = [
      script,
      "--contact-id",
      contactId,
      "--intent",
      `followup:${lane}`,
    ];
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      resolve({ ok: false, error: "outbound runner timed out after 120s" });
    }, 120_000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        resolve({ ok: false, error: stderr.trim() || `exit ${code}` });
        return;
      }
      // outbound.py is expected to print a JSON line with outreach_log_id
      try {
        const lines = stdout.trim().split("\n").filter(Boolean);
        const last = lines[lines.length - 1] ?? "{}";
        const parsed = JSON.parse(last);
        resolve({ ok: true, outreach_log_id: parsed.outreach_log_id ?? null });
      } catch {
        // runner succeeded but didn't print parseable json — that's fine
        resolve({ ok: true, outreach_log_id: null });
      }
    });
  });
}

export async function runOnce() {
  const sb = supabase();

  const { data, error } = await sb
    .from("decisions")
    .select("id, input_snapshot, output_snapshot")
    .eq("action", "queue_followup_compose")
    .limit(25);
  if (error) throw error;

  const queued = (data ?? []).filter(
    (d: any) => (d.output_snapshot?.status ?? "queued") === "queued"
  );

  let processed = 0;
  let failed = 0;
  let deadLetter = 0;

  for (const row of queued) {
    const contactId: string | undefined = row.input_snapshot?.contact_id;
    const lane: string = row.input_snapshot?.lane ?? "unknown";
    const attempts: number = row.output_snapshot?.attempts ?? 0;

    if (!contactId) {
      await sb
        .from("decisions")
        .update({
          output_snapshot: {
            status: "dead",
            error: "missing contact_id in input_snapshot",
          },
        })
        .eq("id", row.id);
      deadLetter++;
      continue;
    }

    const result = await runOutboundCompose(contactId, lane);

    if (result.ok) {
      await sb
        .from("decisions")
        .update({
          output_snapshot: {
            status: "processed",
            attempts: attempts + 1,
            outreach_log_id: result.outreach_log_id,
            processed_at: new Date().toISOString(),
          },
        })
        .eq("id", row.id);
      processed++;
    } else {
      const nextAttempts = attempts + 1;
      const nextStatus = nextAttempts >= MAX_ATTEMPTS ? "dead" : "queued";
      await sb
        .from("decisions")
        .update({
          output_snapshot: {
            status: nextStatus,
            attempts: nextAttempts,
            last_error: result.error,
            last_attempt_at: new Date().toISOString(),
          },
        })
        .eq("id", row.id);
      if (nextStatus === "dead") deadLetter++;
      else failed++;
    }
  }

  return {
    seen: queued.length,
    processed,
    failed_will_retry: failed,
    dead_letter: deadLetter,
  };
}

async function main() {
  const once = new Set(process.argv.slice(2)).has("--once");
  if (once) {
    console.log(JSON.stringify(await runOnce()));
    return;
  }
  console.log(`followup queue: interval=${POLL_INTERVAL_MS}ms`);
  while (true) {
    try {
      const r = await runOnce();
      if (r.seen > 0) {
        console.log(`${new Date().toISOString()} ${JSON.stringify(r)}`);
      }
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
