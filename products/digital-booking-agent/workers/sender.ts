/**
 * Outreach sender worker.
 *
 * Poll loop:
 *   1. Read outreach_log where status='queued' AND scheduled_send_at <= now()
 *      AND direction='outbound'
 *   2. For each row, resolve contact email + thread
 *   3. Send via Gmail API (threaded reply if thread_id present)
 *   4. On success: flip status='sent', set sent_at, store gmail_message_id
 *   5. On failure: write audit row, increment attempt_count, set
 *      scheduled_send_at = now() + backoff (2min, 10min, 1hr, then surface)
 *
 * Quiet hours enforced at TWO layers:
 *   - Worker-local (Thomas' laptop): skips the whole pass 9pm-8am local.
 *   - Per-recipient: resolves contacts.timezone (falls back to city ->
 *     tz map, then America/New_York) and if the recipient is in their
 *     local 9pm-8am window, bumps scheduled_send_at to their next 8am.
 * Daily cap enforced: MAX_SENDS_PER_DAY across all outbound rows.
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REFRESH_TOKEN   (for thomas@dirtysnatcha.com)
 *   SENDER_DRY_RUN=true|false    (when true, logs but doesn't actually send)
 *   SENDER_POLL_INTERVAL_MS=30000
 *   MAX_SENDS_PER_DAY=25
 *
 * Run:
 *   npm run worker:sender             # continuous
 *   npm run worker:sender -- --once   # single pass (for cron)
 *   SENDER_DRY_RUN=true npm run worker:sender -- --once
 */

import "dotenv/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Keep google-apis dependency optional — runtime-require so the worker can
// start in dry-run without it installed during early development.
type GmailClient = {
  users: {
    messages: {
      send: (params: {
        userId: string;
        requestBody: { raw: string; threadId?: string };
      }) => Promise<{ data: { id: string; threadId: string } }>;
    };
  };
};

const DRY_RUN = (process.env.SENDER_DRY_RUN ?? "false").toLowerCase() === "true";
const POLL_INTERVAL_MS = Number(process.env.SENDER_POLL_INTERVAL_MS ?? 30_000);
const MAX_SENDS_PER_DAY = Number(process.env.MAX_SENDS_PER_DAY ?? 25);
const QUIET_START_HOUR = 21; // 9pm
const QUIET_END_HOUR = 8; // 8am
// Business-outreach window (per-recipient TZ). Cold promoter emails land
// best Tue/Wed/Thu 9:30-10:45am local. Fri afternoon thru Mon = all bad
// (promoters at shows Fri-Sun, inbox bloat Mon). Sends outside this window
// get deferred to the next valid slot. Override: SENDER_BUSINESS_HOURS_ONLY=false.
const BUSINESS_HOURS_ONLY =
  (process.env.SENDER_BUSINESS_HOURS_ONLY ?? "true").toLowerCase() === "true";
const SEND_WINDOW_START_HOUR = 9;   // inclusive (9:00am local)
const SEND_WINDOW_END_HOUR = 11;    // exclusive (last send fires before 11:00)
// Tue=2, Wed=3, Thu=4 in JS Date.getDay() semantics (Sun=0).
const BUSINESS_SEND_DAYS = new Set([2, 3, 4]);
// Dev-only escape hatch — bypasses BOTH the worker-local quiet hours gate AND
// the per-recipient timezone quiet hours deferral AND the business-hours gate.
// Use for smoke-testing the end-to-end send pipeline at hours when the worker
// would normally defer. NEVER set this in prod — recipients receiving cold
// outreach at 2am local, or on a Sunday, is a reputation bomb. Default: false.
const IGNORE_QUIET_HOURS =
  (process.env.SENDER_IGNORE_QUIET_HOURS ?? "false").toLowerCase() === "true";

function supabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadGmail(): Promise<GmailClient | null> {
  if (DRY_RUN) return null;
  // Dynamic require so a missing googleapis doesn't break the dry-run path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { google } = require("googleapis") as typeof import("googleapis");

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail OAuth env missing: CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN");
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oauth2 }) as unknown as GmailClient;
}

type OutreachRow = {
  id: string;
  subject: string | null;
  body: string | null;
  thread_id: string | null;
  contact_id: string | null;
  scheduled_send_at: string | null;
  contact?: {
    full_name: string | null;
    email: string | null;
    city: string | null;
    timezone: string | null;
  } | null;
};

async function loadDueRows(sb: SupabaseClient, limit = 10): Promise<OutreachRow[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from("outreach_log")
    .select(
      "id, subject, body, thread_id, contact_id, scheduled_send_at, contact:contacts(full_name, email, city, timezone)"
    )
    .eq("status", "queued")
    .eq("direction", "outbound")
    .lte("scheduled_send_at", nowIso)
    .order("scheduled_send_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  // supabase returns contact as array for the joined selection; normalize
  return (data ?? []).map((r: any) => ({
    ...r,
    contact: Array.isArray(r.contact) ? r.contact[0] ?? null : r.contact,
  }));
}

async function dailySendCount(sb: SupabaseClient): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count, error } = await sb
    .from("outreach_log")
    .select("*", { count: "exact", head: true })
    .eq("direction", "outbound")
    .eq("status", "sent")
    .gte("sent_at", start.toISOString());
  if (error) throw error;
  return count ?? 0;
}

// Worker-local quiet hours — Thomas' laptop timezone. This is the *outer*
// gate so the worker doesn't fire a burst at 3am Denver regardless of who
// the recipient is. Per-recipient quiet hours are enforced inside
// processRow via `inQuietHoursForTz`.
function inQuietHours(now = new Date()): boolean {
  const h = now.getHours();
  if (QUIET_START_HOUR > QUIET_END_HOUR) {
    // wraps midnight
    return h >= QUIET_START_HOUR || h < QUIET_END_HOUR;
  }
  return h >= QUIET_START_HOUR && h < QUIET_END_HOUR;
}

// Rough city -> IANA timezone fallback. Intentionally short — most
// contacts should have `contacts.timezone` populated upstream by the
// contact enrichment step. This is a last-ditch fallback so we never
// default to sender-local time for a recipient.
const CITY_TZ_FALLBACK: Record<string, string> = {
  // US metros we book most
  "new york": "America/New_York",
  brooklyn: "America/New_York",
  boston: "America/New_York",
  philadelphia: "America/New_York",
  "washington": "America/New_York",
  atlanta: "America/New_York",
  miami: "America/New_York",
  orlando: "America/New_York",
  tampa: "America/New_York",
  nashville: "America/Chicago",
  chicago: "America/Chicago",
  minneapolis: "America/Chicago",
  austin: "America/Chicago",
  dallas: "America/Chicago",
  houston: "America/Chicago",
  "new orleans": "America/Chicago",
  detroit: "America/Detroit",
  denver: "America/Denver",
  "salt lake city": "America/Denver",
  phoenix: "America/Phoenix",
  albuquerque: "America/Denver",
  "los angeles": "America/Los_Angeles",
  "san francisco": "America/Los_Angeles",
  oakland: "America/Los_Angeles",
  "san diego": "America/Los_Angeles",
  seattle: "America/Los_Angeles",
  portland: "America/Los_Angeles",
  vegas: "America/Los_Angeles",
  "las vegas": "America/Los_Angeles",
  // CA / EU common fallbacks
  toronto: "America/Toronto",
  montreal: "America/Toronto",
  vancouver: "America/Vancouver",
  london: "Europe/London",
  berlin: "Europe/Berlin",
  amsterdam: "Europe/Amsterdam",
};
const DEFAULT_TZ = "America/New_York";

function resolveTz(
  explicit: string | null | undefined,
  city: string | null | undefined
): string {
  if (explicit && explicit.trim().length > 0) return explicit;
  if (city) {
    const key = city.trim().toLowerCase();
    if (CITY_TZ_FALLBACK[key]) return CITY_TZ_FALLBACK[key];
  }
  return DEFAULT_TZ;
}

// Get the recipient's current local hour (0-23) via Intl without pulling a
// tz library. Returns null (treat as safe-to-send) on invalid tz.
function hourInTz(tz: string, now = new Date()): number | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    });
    const h = Number(fmt.format(now));
    return Number.isFinite(h) ? h : null;
  } catch {
    return null;
  }
}

function inQuietHoursForTz(tz: string, now = new Date()): boolean {
  const h = hourInTz(tz, now);
  if (h === null) return false;
  if (QUIET_START_HOUR > QUIET_END_HOUR) {
    return h >= QUIET_START_HOUR || h < QUIET_END_HOUR;
  }
  return h >= QUIET_START_HOUR && h < QUIET_END_HOUR;
}

// Recipient-local day-of-week, 0=Sun..6=Sat. null on invalid tz.
function dayOfWeekInTz(tz: string, now = new Date()): number | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
    });
    const name = fmt.format(now);
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return name in map ? map[name] : null;
  } catch {
    return null;
  }
}

// Is NOW a valid promoter-outreach send moment in the recipient's TZ?
// Tue/Wed/Thu, 9am-11am local.
function inBusinessSendWindowForTz(tz: string, now = new Date()): boolean {
  const dow = dayOfWeekInTz(tz, now);
  const h = hourInTz(tz, now);
  if (dow === null || h === null) return false;
  return BUSINESS_SEND_DAYS.has(dow) && h >= SEND_WINDOW_START_HOUR && h < SEND_WINDOW_END_HOUR;
}

// Next valid business-send slot in recipient TZ.
// Returns a UTC Date at the recipient's next Tue/Wed/Thu ~9:05-9:35am.
function nextBusinessSendSlot(tz: string, now = new Date()): Date {
  for (let offsetHours = 1; offsetHours <= 24 * 7; offsetHours++) {
    const cand = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
    const dow = dayOfWeekInTz(tz, cand);
    const h = hourInTz(tz, cand);
    if (dow === null || h === null) continue;
    if (BUSINESS_SEND_DAYS.has(dow) && h === SEND_WINDOW_START_HOUR) {
      // Jitter 5-35min past :00 so 25 sends don't all fire at :00 (Gmail reputation).
      const jitterMin = 5 + Math.floor(Math.random() * 30);
      return new Date(cand.getTime() + jitterMin * 60_000);
    }
  }
  // Fallback: next Tuesday ~ default. Very unusual to hit this.
  return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
}

// Compute the next send-safe UTC instant for a recipient in quiet hours —
// i.e. the next local QUIET_END_HOUR in their tz.
function nextSafeSendUtc(tz: string, now = new Date()): Date {
  // Find the timestamp for "today QUIET_END_HOUR:05 local" in tz; if that's
  // already past, add a day. We approximate by iterating at hour resolution;
  // cheap enough and avoids pulling a tz library.
  for (let offsetHours = 1; offsetHours <= 36; offsetHours++) {
    const cand = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
    const h = hourInTz(tz, cand);
    if (h !== null && h === QUIET_END_HOUR) {
      // add a few minutes of jitter so we don't hammer on the top of the hour
      return new Date(cand.getTime() + (5 + Math.floor(Math.random() * 25)) * 60_000);
    }
  }
  // fallback: +9 hours
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

const TRACK_BASE = (process.env.NEXT_PUBLIC_TRACK_BASE ?? "").replace(/\/+$/, "");
const TRACKING_SECRET = process.env.TRACKING_SECRET ?? "";
const TRACKING_ENABLED = TRACK_BASE.length > 0 && TRACKING_SECRET.length > 0;

function signClick(outreachLogId: string, target: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto");
  const h = crypto.createHmac("sha256", TRACKING_SECRET);
  h.update(`${outreachLogId}\n${target}`);
  return h.digest("hex").slice(0, 16);
}

function rewriteLinks(body: string, outreachLogId: string): string {
  if (!TRACKING_ENABLED) return body;
  const urlRe = /\bhttps?:\/\/[^\s<>)\]]+/g;
  return body.replace(urlRe, (m) => {
    let tail = "";
    let url = m;
    while (/[.,;:!?]$/.test(url)) {
      tail = url.slice(-1) + tail;
      url = url.slice(0, -1);
    }
    if (TRACK_BASE && url.startsWith(`${TRACK_BASE}/t/`)) return url + tail;
    const sig = signClick(outreachLogId, url);
    const encoded = encodeURIComponent(url);
    return `${TRACK_BASE}/t/click/${encodeURIComponent(outreachLogId)}?u=${encoded}&s=${sig}` + tail;
  });
}

function htmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function htmlBodyFromText(trackedText: string, outreachLogId: string): string {
  const pixel = TRACKING_ENABLED
    ? `<img src="${TRACK_BASE}/t/open/${encodeURIComponent(outreachLogId)}.gif" width="1" height="1" alt="" style="display:block;border:0;outline:none;">`
    : "";
  const paragraphs = htmlEscape(trackedText)
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  return `<!doctype html><html><body style="font-family:inherit;font-size:14px;color:#111;">\n${paragraphs}\n${pixel}\n</body></html>`;
}

function encodeRaw(
  to: string,
  subject: string,
  body: string,
  fromEmail: string,
  outreachLogId?: string
): string {
  // If tracking is off or we don't have an id, send plain-text only.
  if (!TRACKING_ENABLED || !outreachLogId) {
    const lines = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
    ];
    const raw = lines.join("\r\n");
    return Buffer.from(raw, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  // Tracking-enabled: send multipart/alternative with a plain-text part
  // (fallback) and an HTML part carrying the open pixel. Links are
  // rewritten in both parts so clicks work regardless of what the client
  // renders.
  const tracked = rewriteLinks(body, outreachLogId);
  const htmlBody = htmlBodyFromText(tracked, outreachLogId);
  const boundary = `dba_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

  const lines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    tracked,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    htmlBody,
    "",
    `--${boundary}--`,
    "",
  ];
  const raw = lines.join("\r\n");
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function markSent(sb: SupabaseClient, id: string, gmailMessageId: string, gmailThreadId: string) {
  const { error } = await sb
    .from("outreach_log")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      thread_id: gmailThreadId,
    })
    .eq("id", id);
  if (error) throw error;

  await sb.from("decisions").insert({
    actor: "sender_worker",
    action: "send_email",
    subject_type: "outreach_log",
    subject_id: id,
    rationale: "scheduled send completed",
    output_snapshot: { gmail_message_id: gmailMessageId, gmail_thread_id: gmailThreadId },
  });
}

async function markFailedWithBackoff(
  sb: SupabaseClient,
  id: string,
  attempt: number,
  reason: string
) {
  const backoffs = [2, 10, 60]; // minutes
  const bump = backoffs[Math.min(attempt, backoffs.length - 1)];
  const next = new Date(Date.now() + bump * 60_000).toISOString();

  const shouldGiveUp = attempt >= backoffs.length;
  const update: Record<string, unknown> = shouldGiveUp
    ? {
        status: "held_for_review",
        held_reason: `send_failed_after_${attempt}_attempts: ${reason}`,
      }
    : {
        scheduled_send_at: next,
        held_reason: null,
      };
  const { error } = await sb.from("outreach_log").update(update).eq("id", id);
  if (error) throw error;

  await sb.from("decisions").insert({
    actor: "sender_worker",
    action: shouldGiveUp ? "escalate_to_thomas" : "retry_send",
    subject_type: "outreach_log",
    subject_id: id,
    rationale: reason,
    output_snapshot: { attempt, next_attempt_at: shouldGiveUp ? null : next },
  });
}

async function deferToRecipientMorning(
  sb: SupabaseClient,
  id: string,
  tz: string,
  now = new Date()
) {
  const next = nextSafeSendUtc(tz, now);
  const { error } = await sb
    .from("outreach_log")
    .update({ scheduled_send_at: next.toISOString() })
    .eq("id", id);
  if (error) throw error;

  await sb.from("decisions").insert({
    actor: "sender_worker",
    action: "defer_for_quiet_hours",
    subject_type: "outreach_log",
    subject_id: id,
    rationale: `recipient in quiet hours (tz=${tz}); rescheduled`,
    output_snapshot: { tz, next_attempt_at: next.toISOString() },
  });
}

async function processRow(
  sb: SupabaseClient,
  gmail: GmailClient | null,
  row: OutreachRow,
  fromEmail: string
): Promise<{ id: string; result: "sent" | "skipped" | "failed" | "deferred"; reason?: string }> {
  if (!row.contact?.email) {
    await markFailedWithBackoff(sb, row.id, 99, "no contact email");
    return { id: row.id, result: "failed", reason: "no contact email" };
  }
  if (!row.subject || !row.body) {
    await markFailedWithBackoff(sb, row.id, 99, "missing subject or body");
    return { id: row.id, result: "failed", reason: "missing subject/body" };
  }

  // Per-recipient quiet hours. If the recipient is in their 9pm-8am local
  // window, bump scheduled_send_at forward to their local morning and skip.
  // SENDER_IGNORE_QUIET_HOURS=true bypasses this for dev smoke-tests only.
  const recipientTz = resolveTz(row.contact.timezone, row.contact.city);
  if (inQuietHoursForTz(recipientTz) && !IGNORE_QUIET_HOURS) {
    await deferToRecipientMorning(sb, row.id, recipientTz);
    return {
      id: row.id,
      result: "deferred",
      reason: `recipient_quiet_hours(${recipientTz})`,
    };
  }

  // Business-hours gate: Tue/Wed/Thu 9-11am local only. Cold outreach sent
  // outside this window has dramatically lower reply rates (Mon = inbox bloat,
  // Fri-Sun = promoter at shows). Defer to next valid slot.
  // SENDER_IGNORE_QUIET_HOURS=true bypasses; SENDER_BUSINESS_HOURS_ONLY=false
  // bypasses only this gate without opening quiet hours.
  if (BUSINESS_HOURS_ONLY && !IGNORE_QUIET_HOURS && !inBusinessSendWindowForTz(recipientTz)) {
    const next = nextBusinessSendSlot(recipientTz);
    await sb
      .from("outreach_log")
      .update({ scheduled_send_at: next.toISOString() })
      .eq("id", row.id);
    await logDecision(sb, {
      subject_type: "outreach_log",
      subject_id: row.id,
      action: "defer_for_business_hours",
      actor: "sender_worker",
      rationale: `outside Tue/Wed/Thu 9-11am window (tz=${recipientTz}); rescheduled to ${next.toISOString()}`,
    });
    return {
      id: row.id,
      result: "deferred",
      reason: `outside_business_hours(${recipientTz})`,
    };
  }

  if (DRY_RUN || !gmail) {
    console.log(
      `[dry-run] would send to ${row.contact.email} (tz=${recipientTz}) subject="${row.subject}" thread=${row.thread_id ?? "(new)"}`
    );
    return { id: row.id, result: "skipped", reason: "dry-run" };
  }

  try {
    const raw = encodeRaw(row.contact.email, row.subject, row.body, fromEmail, row.id);
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: row.thread_id ? { raw, threadId: row.thread_id } : { raw },
    });
    await markSent(sb, row.id, res.data.id, res.data.threadId);
    return { id: row.id, result: "sent" };
  } catch (e: any) {
    const reason = String(e?.message ?? e);
    // naive attempt counter via decisions history
    const { count } = await sb
      .from("decisions")
      .select("*", { count: "exact", head: true })
      .eq("subject_id", row.id)
      .eq("action", "retry_send");
    const attempt = (count ?? 0) + 1;
    await markFailedWithBackoff(sb, row.id, attempt, reason);
    return { id: row.id, result: "failed", reason };
  }
}

export async function runOnce(): Promise<{
  considered: number;
  sent: number;
  skipped: number;
  deferred: number;
  failed: number;
  reason?: string;
}> {
  const sb = supabase();

  if (inQuietHours() && !IGNORE_QUIET_HOURS) {
    return {
      considered: 0,
      sent: 0,
      skipped: 0,
      deferred: 0,
      failed: 0,
      reason: "worker_quiet_hours",
    };
  }

  const sentToday = await dailySendCount(sb);
  if (sentToday >= MAX_SENDS_PER_DAY) {
    return {
      considered: 0,
      sent: 0,
      skipped: 0,
      deferred: 0,
      failed: 0,
      reason: `daily_cap_hit(${sentToday}/${MAX_SENDS_PER_DAY})`,
    };
  }

  const remaining = MAX_SENDS_PER_DAY - sentToday;
  const rows = await loadDueRows(sb, Math.min(remaining, 10));
  if (rows.length === 0) {
    return { considered: 0, sent: 0, skipped: 0, deferred: 0, failed: 0 };
  }

  const gmail = await loadGmail();
  const fromEmail = process.env.SENDER_FROM_EMAIL ?? "thomas@dirtysnatcha.com";

  let sent = 0;
  let skipped = 0;
  let deferred = 0;
  let failed = 0;
  for (const row of rows) {
    const result = await processRow(sb, gmail, row, fromEmail);
    if (result.result === "sent") sent++;
    else if (result.result === "skipped") skipped++;
    else if (result.result === "deferred") deferred++;
    else failed++;
    // brief jitter to avoid burst pattern
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 1500));
  }
  return { considered: rows.length, sent, skipped, deferred, failed };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const once = args.has("--once");

  if (once) {
    const r = await runOnce();
    console.log(JSON.stringify(r));
    return;
  }

  console.log(
    `sender worker: poll=${POLL_INTERVAL_MS}ms dryRun=${DRY_RUN} cap=${MAX_SENDS_PER_DAY}/day`
  );
  while (true) {
    try {
      const r = await runOnce();
      if (r.considered > 0 || r.reason) {
        console.log(
          `${new Date().toISOString()} ${JSON.stringify(r)}`
        );
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
