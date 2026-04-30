/**
 * Shared helpers for outbound email open/click tracking.
 *
 * Pixel URL:     {TRACK_BASE}/t/open/<outreach_log_id>.gif
 * Click URL:     {TRACK_BASE}/t/click/<outreach_log_id>?u=<encoded_target>
 *
 * Design notes:
 *   - TRACK_BASE must be a public HTTPS origin the recipient's mail client
 *     can reach. Set via NEXT_PUBLIC_TRACK_BASE (e.g. https://dba.dsr.xyz).
 *     Fall back to empty string (disable tracking) when unset.
 *   - We sign click URLs with a short HMAC so an attacker can't abuse the
 *     redirector to bounce traffic off our domain. The signature is
 *     computed from (id, target) with TRACKING_SECRET.
 *   - IP hashing uses a daily-rotating salt to avoid persistent tracking
 *     of any individual recipient across days.
 */

import crypto from "crypto";

const TRACK_BASE = (process.env.NEXT_PUBLIC_TRACK_BASE ?? "").replace(/\/+$/, "");
const TRACKING_SECRET = process.env.TRACKING_SECRET ?? "";
const IP_SALT_SEED = process.env.TRACKING_IP_SALT_SEED ?? "dsr-tracking-v1";

export function trackingEnabled(): boolean {
  return TRACK_BASE.length > 0 && TRACKING_SECRET.length > 0;
}

export function pixelUrl(outreachLogId: string): string {
  if (!trackingEnabled()) return "";
  return `${TRACK_BASE}/t/open/${encodeURIComponent(outreachLogId)}.gif`;
}

export function signClick(outreachLogId: string, target: string): string {
  const h = crypto.createHmac("sha256", TRACKING_SECRET);
  h.update(`${outreachLogId}\n${target}`);
  return h.digest("hex").slice(0, 16); // 64 bits is plenty
}

export function verifyClick(
  outreachLogId: string,
  target: string,
  sig: string
): boolean {
  try {
    const expected = signClick(outreachLogId, target);
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(sig, "hex")
    );
  } catch {
    return false;
  }
}

export function clickUrl(outreachLogId: string, target: string): string {
  if (!trackingEnabled()) return target;
  const sig = signClick(outreachLogId, target);
  const u = encodeURIComponent(target);
  return `${TRACK_BASE}/t/click/${encodeURIComponent(outreachLogId)}?u=${u}&s=${sig}`;
}

/**
 * Rewrite every http(s) link in a plain-text body to go through the
 * click redirector. Preserves surrounding punctuation.
 */
export function rewriteLinksForTracking(
  body: string,
  outreachLogId: string
): string {
  if (!trackingEnabled()) return body;
  // Matches http(s) URLs up to the next whitespace or closing paren/angle.
  const urlRe = /\bhttps?:\/\/[^\s<>)\]]+/g;
  return body.replace(urlRe, (m) => {
    // Trim trailing punctuation that's usually sentence-terminal
    let tail = "";
    let url = m;
    while (/[.,;:!?]$/.test(url)) {
      tail = url.slice(-1) + tail;
      url = url.slice(0, -1);
    }
    // Skip if already a tracking URL (idempotent re-wrap guard)
    if (TRACK_BASE && url.startsWith(`${TRACK_BASE}/t/`)) {
      return url + tail;
    }
    return clickUrl(outreachLogId, url) + tail;
  });
}

/**
 * Turn a plain-text body into a minimal multipart/alternative-friendly
 * HTML string with the tracking pixel inlined at the bottom. The caller
 * decides whether to send this as text/html or as the HTML part of a
 * multipart payload.
 */
export function wrapBodyWithPixel(
  body: string,
  outreachLogId: string
): string {
  const pixel = pixelUrl(outreachLogId);
  // Escape the body for HTML; preserve paragraphs on blank lines.
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const htmlBody = escaped
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  const pixelTag = pixel
    ? `<img src="${pixel}" width="1" height="1" alt="" style="display:block;border:0;outline:none;">`
    : "";
  return `<!doctype html><html><body style="font-family:inherit;font-size:14px;color:#111;">\n${htmlBody}\n${pixelTag}\n</body></html>`;
}

/**
 * Hash the recipient's IP with a daily-rotating salt. Returns a short
 * hex string suitable for storage in outreach_events.ip_hash.
 */
export function hashIp(ip: string | null | undefined, now = new Date()): string | null {
  if (!ip) return null;
  const day = now.toISOString().slice(0, 10);
  const h = crypto.createHmac("sha256", `${IP_SALT_SEED}:${day}`);
  h.update(ip);
  return h.digest("hex").slice(0, 24);
}
