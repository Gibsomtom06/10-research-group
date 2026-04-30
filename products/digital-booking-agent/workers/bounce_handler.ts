/**
 * Bounce handler worker.
 *
 * Polls Gmail for bounce DSN messages (mailer-daemon@, postmaster@,
 * Gmail's standard bounce labels) since the last run, parses the
 * failed recipient, and:
 *   - marks contact.email_valid = false
 *   - increments bounce_count, stamps last_bounce_at, bounce_reason
 *   - cancels any queued outreach to that contact (status -> 'held_for_review')
 *   - writes an outreach_log row with direction='inbound', status='bounced',
 *     is_bounce=true, and if we can find the original outbound by thread_id
 *     or Message-Id, links via bounced_for_id
 *   - audits to decisions
 *
 * Idempotency: tracks the last processed Gmail historyId or internalDate in
 * a `worker_state` kv. Can also be run with --since=<ISO> to backfill.
 *
 * Run:
 *   npm run bounce-handler
 *   npm run bounce-handler -- --once
 *   npm run bounce-handler -- --once --since=2026-04-20T00:00:00Z
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REFRESH_TOKEN
 *   BOUNCE_POLL_INTERVAL_MS=600000  (10min default)
 *   HARD_BOUNCE_THRESHOLD=1         (1 hard bounce -> invalidate; some orgs use 2-3)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = Number(process.env.BOUNCE_POLL_INTERVAL_MS ?? 10 * 60_000);
const HARD_BOUNCE_THRESHOLD = Number(process.env.HARD_BOUNCE_THRESHOLD ?? 1);

// Gmail search query for bounce DSNs. These are the patterns Gmail uses.
const BOUNCE_SEARCH_QUERY = [
  "from:(mailer-daemon@ OR postmaster@)",
  "subject:(\"Delivery Status Notification\" OR \"Undelivered Mail Returned\" OR \"failure notice\")",
].join(" ");

function supabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadGmail() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { google } = require("googleapis") as typeof import("googleapis");
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail OAuth env missing");
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oauth2 });
}

type ParsedBounce = {
  failed_recipient: string | null;
  bounce_type: "hard" | "soft" | "blocked" | "unknown";
  reason: string;
  original_message_id: string | null;   // In-Reply-To from the DSN
  original_subject: string | null;
  gmail_message_id: string;
  gmail_thread_id: string;
  internal_date_iso: string;
};

// DSN bodies are verbose. Look for common patterns.
function parseBounceBody(body: string): Omit<ParsedBounce, "gmail_message_id" | "gmail_thread_id" | "internal_date_iso"> {
  // Failed recipient: usually "Original-Recipient:", "Final-Recipient:", or
  // "To: <...>" near the top of the DSN, or in the "failed to deliver to" line.
  let recipient: string | null = null;

  const finalRecip = body.match(/Final-Recipient:\s*rfc822\s*;\s*([^\s<>]+@[^\s<>]+)/i);
  if (finalRecip) recipient = finalRecip[1].trim();

  if (!recipient) {
    const origRecip = body.match(/Original-Recipient:\s*rfc822\s*;\s*([^\s<>]+@[^\s<>]+)/i);
    if (origRecip) recipient = origRecip[1].trim();
  }

  if (!recipient) {
    const toLine = body.match(/failed to deliver to ['"]?([^\s<>'"]+@[^\s<>'"]+)/i);
    if (toLine) recipient = toLine[1].trim();
  }

  // Bounce type from status codes.
  // 5.x.x -> hard, 4.x.x -> soft
  let bounce_type: ParsedBounce["bounce_type"] = "unknown";
  const statusMatch = body.match(/Status:\s*(\d)\.(\d+)\.(\d+)/);
  if (statusMatch) {
    if (statusMatch[1] === "5") bounce_type = "hard";
    else if (statusMatch[1] === "4") bounce_type = "soft";
  }
  if (bounce_type === "unknown") {
    if (/address not found|no such user|user unknown|does not exist|account has been disabled|deleted user/i.test(body)) {
      bounce_type = "hard";
    } else if (/mailbox full|over quota|temporarily deferred|try again later/i.test(body)) {
      bounce_type = "soft";
    } else if (/blocked|policy|spam|reputation/i.test(body)) {
      bounce_type = "blocked";
    }
  }

  // Reason: first diagnostic line after "Diagnostic-Code:" if present
  let reason = "";
  const diag = body.match(/Diagnostic-Code:[^\n]*\n([^\n]+)/i);
  if (diag) reason = diag[1].trim();
  if (!reason) {
    const firstRemote = body.match(/Remote-?MTA[^\n]*\n(.+?)(?:\n\n|$)/is);
    if (firstRemote) reason = firstRemote[1].trim().slice(0, 300);
  }
  if (!reason) reason = body.split("\n").slice(0, 8).join(" ").slice(0, 300);

  // Original Message-Id (DSNs often embed the failed message's headers at the bottom)
  let original_message_id: string | null = null;
  const origMid = body.match(/Message-ID:\s*<([^>]+)>/i);
  if (origMid) original_message_id = origMid[1].trim();

  let original_subject: string | null = null;
  const origSubj = body.match(/^Subject:\s*(.+)$/im);
  if (origSubj) original_subject = origSubj[1].trim();

  return { failed_recipient: recipient, bounce_type, reason, original_message_id, original_subject };
}

async function findOriginalOutbound(
  sb: SupabaseClient,
  parsed: { original_message_id: string | null; original_subject: string | null; failed_recipient: string | null }
): Promise<string | null> {
  // Best: match on stored gmail_message_id in decisions output_snapshot
  if (parsed.original_message_id) {
    const { data } = await sb
      .from("decisions")
      .select("subject_id")
      .eq("action", "send_email")
      .eq("subject_type", "outreach_log")
      .contains("output_snapshot", { gmail_message_id: parsed.original_message_id })
      .limit(1);
    if (data && data[0]?.subject_id) return data[0].subject_id as string;
  }
  // Fallback: most recent outbound to that email address
  if (parsed.failed_recipient) {
    const { data } = await sb
      .from("contacts")
      .select("id")
      .ilike("email", parsed.failed_recipient)
      .limit(1);
    const cid = data?.[0]?.id;
    if (cid) {
      const { data: logs } = await sb
        .from("outreach_log")
        .select("id, subject, sent_at")
        .eq("contact_id", cid)
        .eq("direction", "outbound")
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(5);
      if (logs && logs.length > 0) {
        if (parsed.original_subject) {
          const match = logs.find((l) => (l.subject || "").trim() === parsed.original_subject!.trim());
          if (match) return match.id as string;
        }
        return logs[0].id as string;
      }
    }
  }
  return null;
}

async function recordBounce(
  sb: SupabaseClient,
  parsed: ParsedBounce
): Promise<{ contact_id: string | null; invalidated: boolean; cancelled: number }> {
  if (!parsed.failed_recipient) return { contact_id: null, invalidated: false, cancelled: 0 };

  // Find contact (case-insensitive match on email)
  const { data: contacts } = await sb
    .from("contacts")
    .select("id, email, email_valid, bounce_count")
    .ilike("email", parsed.failed_recipient)
    .limit(1);
  const contact = contacts?.[0];
  if (!contact) {
    // Still log the bounce for observability
    await sb.from("outreach_log").insert({
      direction: "inbound",
      status: "bounced",
      is_bounce: true,
      bounce_type: parsed.bounce_type,
      subject: `BOUNCE: ${parsed.original_subject ?? parsed.failed_recipient}`,
      body: parsed.reason,
    });
    return { contact_id: null, invalidated: false, cancelled: 0 };
  }

  const newBounceCount = (contact.bounce_count ?? 0) + 1;
  const shouldInvalidate =
    parsed.bounce_type === "hard" && newBounceCount >= HARD_BOUNCE_THRESHOLD;

  const patch: Record<string, unknown> = {
    bounce_count: newBounceCount,
    last_bounce_at: parsed.internal_date_iso,
    bounce_reason: parsed.reason.slice(0, 500),
  };
  if (shouldInvalidate) {
    patch.email_valid = false;
    patch.do_not_contact = false; // keep contact, just invalid email
  }

  await sb.from("contacts").update(patch).eq("id", contact.id);

  // Link to the original outbound if findable
  const originalId = await findOriginalOutbound(sb, parsed);

  const bounceLog = await sb.from("outreach_log").insert({
    direction: "inbound",
    status: "bounced",
    contact_id: contact.id,
    is_bounce: true,
    bounce_type: parsed.bounce_type,
    bounced_for_id: originalId,
    subject: `BOUNCE: ${parsed.original_subject ?? parsed.failed_recipient}`,
    body: parsed.reason,
    decision_trace: {
      parsed,
      invalidated: shouldInvalidate,
      new_bounce_count: newBounceCount,
    },
  }).select("id").single();

  // Cancel any queued/held outreach to this contact
  const { data: cancelled } = await sb
    .from("outreach_log")
    .update({
      status: "held_for_review",
      held_reason: `contact email invalid or bouncing (${parsed.bounce_type})`,
    })
    .eq("contact_id", contact.id)
    .in("status", ["queued", "draft"])
    .select("id");

  await sb.from("decisions").insert({
    actor: "bounce_handler",
    action: shouldInvalidate ? "invalidate_email" : "record_bounce",
    subject_type: "contact",
    subject_id: contact.id,
    rationale: parsed.reason.slice(0, 400),
    output_snapshot: {
      bounce_type: parsed.bounce_type,
      new_bounce_count: newBounceCount,
      cancelled_queued: (cancelled ?? []).length,
      bounce_log_id: bounceLog.data?.id,
    },
  });

  return {
    contact_id: contact.id,
    invalidated: shouldInvalidate,
    cancelled: (cancelled ?? []).length,
  };
}

async function loadState(sb: SupabaseClient, key: string): Promise<string | null> {
  const { data } = await sb.from("worker_state").select("value").eq("key", key).single();
  return (data?.value as any) ?? null;
}

async function saveState(sb: SupabaseClient, key: string, value: string) {
  await sb.from("worker_state").upsert({ key, value, updated_at: new Date().toISOString() });
}

function extractBody(payload: any): string {
  // Gmail messages come with parts; we want text/plain preferentially
  if (!payload) return "";
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }
  const parts: any[] = payload.parts ?? [];
  const plain = parts.find((p) => p.mimeType === "text/plain");
  if (plain?.body?.data) return Buffer.from(plain.body.data, "base64").toString("utf8");
  for (const p of parts) {
    const nested = extractBody(p);
    if (nested) return nested;
  }
  return "";
}

export async function runOnce(sinceOverride?: string) {
  const sb = supabase();
  const gmail = await loadGmail();

  const since =
    sinceOverride ??
    (await loadState(sb, "bounce_handler.last_internal_date_iso")) ??
    new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();

  const afterEpoch = Math.floor(new Date(since).getTime() / 1000);
  const query = `${BOUNCE_SEARCH_QUERY} after:${afterEpoch}`;

  const list = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 50,
  });

  const ids = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);
  let processed = 0;
  let invalidated = 0;
  let cancelled = 0;
  let latestInternalMs = new Date(since).getTime();

  for (const id of ids) {
    const full = await gmail.users.messages.get({ userId: "me", id, format: "full" });
    const msg = full.data;
    const body = extractBody(msg.payload);
    const internalMs = Number(msg.internalDate ?? 0);
    const internalIso = new Date(internalMs).toISOString();

    const parsed = parseBounceBody(body);
    const bounce: ParsedBounce = {
      ...parsed,
      gmail_message_id: msg.id!,
      gmail_thread_id: msg.threadId!,
      internal_date_iso: internalIso,
    };

    const r = await recordBounce(sb, bounce);
    processed++;
    if (r.invalidated) invalidated++;
    cancelled += r.cancelled;
    if (internalMs > latestInternalMs) latestInternalMs = internalMs;
  }

  if (ids.length > 0) {
    await saveState(sb, "bounce_handler.last_internal_date_iso", new Date(latestInternalMs).toISOString());
  }

  return { found: ids.length, processed, invalidated, cancelled_queued: cancelled, watermark: new Date(latestInternalMs).toISOString() };
}

async function main() {
  const args = process.argv.slice(2);
  const once = args.includes("--once");
  const sinceArg = args.find((a) => a.startsWith("--since="));
  const since = sinceArg ? sinceArg.slice("--since=".length) : undefined;

  if (once) {
    const r = await runOnce(since);
    console.log(JSON.stringify(r));
    return;
  }

  console.log(`bounce handler: interval=${POLL_INTERVAL_MS}ms threshold=${HARD_BOUNCE_THRESHOLD}`);
  while (true) {
    try {
      const r = await runOnce(since);
      if (r.found > 0) console.log(`${new Date().toISOString()} ${JSON.stringify(r)}`);
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
