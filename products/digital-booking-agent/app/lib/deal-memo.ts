/**
 * Deal memo PDF generator.
 *
 * Produces a one-to-two page PDF summarizing the DSR side of a booking
 * agreement, built from an offers row (see migration 0009). The memo
 * is the internal document that Thomas signs; once both sides sign it,
 * the offer is "fully_executed" and we wait on the deposit.
 *
 * Uses pdf-lib (pure JS, no native deps, works in the Next.js Node
 * runtime without a headless browser). Layout is intentionally simple
 * — the goal is legibility + auditability, not typography.
 *
 * Storage strategy:
 *   - If SUPABASE_URL + service role is configured and a bucket named
 *     `deal-memos` exists, upload the PDF and return its signed public
 *     URL (10-year expiry).
 *   - Otherwise, write to /tmp in dev and return a file:// URL. Caller
 *     can always regenerate; we don't rely on the URL being forever.
 *
 * The memo template draws from `dsr_standard_deal_terms` for any
 * fields the offer hasn't set explicitly — so a fresh offer with just
 * (venue, date, guarantee) still produces a complete memo using
 * DSR-standard defaults.
 */

import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import { serverClient } from "./supabase";

type OfferForMemo = {
  id: string;
  proposed_date: string | null;
  guarantee: number | null;
  door_deal: any;
  artist_slug: string | null;
  deposit_pct: number | null;
  deposit_due_days: number | null;
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
  notes: string | null;
  contact?: {
    full_name: string | null;
    email: string | null;
    role: string | null;
    city: string | null;
    state: string | null;
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
};

// DSR standard defaults — mirror of dsr_standard_deal_terms view. We
// keep them here as a JS constant so the memo can render without an
// extra round trip to Postgres.
const STANDARD = {
  deposit_pct: 50,
  deposit_due_days: 30,
  override_pct: 85,
  radius_miles: 75,
  radius_days_before: 30,
  radius_days_after: 30,
  hospitality: "standard" as const,
  sound_lights: "promoter_provided" as const,
  cancellation: "force_majeure" as const,
  travel_provided: true,
  lodging_provided: true,
  ground_transport_provided: false,
} as const;

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function pick<T>(explicit: T | null | undefined, fallback: T): T {
  return explicit == null ? fallback : explicit;
}

function humanize(key: string | null | undefined): string {
  if (!key) return "—";
  return key.replace(/_/g, " ");
}

/** Simple text writer that wraps on width and updates y cursor. */
class PdfWriter {
  private y: number;
  private readonly lineH: number;
  constructor(
    private page: import("pdf-lib").PDFPage,
    private font: PDFFont,
    private bold: PDFFont,
    private x: number,
    startY: number,
    private rightX: number,
    size: number
  ) {
    this.y = startY;
    this.lineH = size * 1.35;
  }

  section(title: string) {
    this.y -= 6;
    this.page.drawText(title.toUpperCase(), {
      x: this.x,
      y: this.y,
      size: 9,
      font: this.bold,
      color: rgb(0.35, 0.35, 0.35),
    });
    this.y -= this.lineH;
    this.page.drawLine({
      start: { x: this.x, y: this.y + 3 },
      end: { x: this.rightX, y: this.y + 3 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    this.y -= 4;
  }

  kv(label: string, value: string) {
    this.page.drawText(label + ":", {
      x: this.x,
      y: this.y,
      size: 10,
      font: this.bold,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.page.drawText(value, {
      x: this.x + 130,
      y: this.y,
      size: 10,
      font: this.font,
      color: rgb(0.05, 0.05, 0.05),
    });
    this.y -= this.lineH;
  }

  paragraph(text: string) {
    const maxWidth = this.rightX - this.x;
    const words = text.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const width = this.font.widthOfTextAtSize(test, 10);
      if (width > maxWidth) {
        this.page.drawText(line, {
          x: this.x,
          y: this.y,
          size: 10,
          font: this.font,
          color: rgb(0.05, 0.05, 0.05),
        });
        this.y -= this.lineH;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      this.page.drawText(line, {
        x: this.x,
        y: this.y,
        size: 10,
        font: this.font,
        color: rgb(0.05, 0.05, 0.05),
      });
      this.y -= this.lineH;
    }
  }

  spacer(h = 8) {
    this.y -= h;
  }

  getY() {
    return this.y;
  }
}

async function renderPdf(offer: OfferForMemo): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 54;
  const rightX = 612 - margin;

  // Header
  page.drawText("DIRTYSNATCHA RECORDS", {
    x: margin,
    y: 752,
    size: 16,
    font: bold,
    color: rgb(0, 0, 0),
  });
  page.drawText("deal memo · internal", {
    x: margin,
    y: 734,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText(
    `generated ${new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`,
    {
      x: rightX - 160,
      y: 752,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    }
  );
  page.drawText(`offer id ${offer.id.slice(0, 8)}…`, {
    x: rightX - 160,
    y: 738,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawLine({
    start: { x: margin, y: 724 },
    end: { x: rightX, y: 724 },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  const w = new PdfWriter(page, font, bold, margin, 708, rightX, 10);

  // Show summary
  w.section("show");
  w.kv("artist", offer.artist?.name ?? offer.artist_slug ?? "dirtysnatcha");
  w.kv("venue", offer.venue?.name ?? "—");
  const loc = [offer.venue?.city, offer.venue?.state].filter(Boolean).join(", ");
  if (loc) w.kv("location", loc);
  if (offer.venue?.capacity != null) w.kv("capacity", String(offer.venue.capacity));
  w.kv("date", fmtDate(offer.proposed_date));
  w.kv(
    "promoter",
    `${offer.contact?.full_name ?? "—"}${
      offer.contact?.email ? ` <${offer.contact.email}>` : ""
    }`
  );

  w.spacer();

  // Financial
  w.section("financial");
  w.kv("guarantee", fmtMoney(offer.guarantee));
  const door = offer.door_deal;
  if (door && typeof door === "object") {
    if (door.split != null) w.kv("door split", `${door.split}%`);
    if (door.bonus_threshold != null)
      w.kv("bonus over", fmtMoney(door.bonus_threshold));
  }
  w.kv(
    "deposit",
    `${pick(offer.deposit_pct, STANDARD.deposit_pct)}% due ${pick(
      offer.deposit_due_days,
      STANDARD.deposit_due_days
    )}d prior to performance`
  );
  w.kv(
    "balance due",
    offer.balance_due_when ?? "day of show, USD cash, prior to doors"
  );
  w.kv(
    "override",
    `${pick(offer.override_pct, STANDARD.override_pct)}% of net box office receipts${
      offer.override_threshold != null
        ? ` above ${fmtMoney(offer.override_threshold)}`
        : ""
    }`
  );
  if (offer.override_notes) w.paragraph(offer.override_notes);

  w.spacer();

  // Radius
  w.section("radius clause");
  w.kv(
    "radius",
    `${pick(offer.radius_miles, STANDARD.radius_miles)} miles`
  );
  w.kv(
    "window",
    `${pick(offer.radius_days_before, STANDARD.radius_days_before)} days before / ${pick(
      offer.radius_days_after,
      STANDARD.radius_days_after
    )} days after`
  );
  if (offer.radius_exclusions) {
    w.paragraph(`carve-outs: ${offer.radius_exclusions}`);
  }

  w.spacer();

  // Production
  w.section("production");
  w.kv("sound & lights", humanize(pick(offer.sound_lights, STANDARD.sound_lights)));
  w.kv("hospitality", humanize(pick(offer.hospitality, STANDARD.hospitality)));
  w.kv(
    "travel",
    pick(offer.travel_provided, STANDARD.travel_provided) ? "provided by promoter" : "artist covers"
  );
  w.kv(
    "lodging",
    pick(offer.lodging_provided, STANDARD.lodging_provided) ? "provided by promoter" : "artist covers"
  );
  w.kv(
    "ground transport",
    pick(offer.ground_transport_provided, STANDARD.ground_transport_provided)
      ? "provided by promoter"
      : "artist covers"
  );

  w.spacer();

  // Cancellation
  w.section("cancellation");
  w.kv("policy", humanize(pick(offer.cancellation, STANDARD.cancellation)));
  if (offer.cancellation_notice_days != null)
    w.kv("notice", `${offer.cancellation_notice_days} days`);
  w.paragraph(
    offer.force_majeure_language ??
      "Neither party shall be liable for failure to perform due to acts of god, government action, labor disruption, public health emergency, or other events beyond reasonable control. Deposits returned within 14 days of cancellation under force majeure."
  );

  // Notes (if any)
  if (offer.notes) {
    w.spacer();
    w.section("notes");
    w.paragraph(offer.notes);
  }

  // Signature block — always force to bottom of page
  const sigY = Math.max(w.getY() - 30, 150);
  page.drawLine({
    start: { x: margin, y: sigY + 4 },
    end: { x: rightX, y: sigY + 4 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  page.drawText("SIGNATURES", {
    x: margin,
    y: sigY - 6,
    size: 9,
    font: bold,
    color: rgb(0.35, 0.35, 0.35),
  });

  // Thomas line
  const thomasY = sigY - 40;
  page.drawLine({
    start: { x: margin, y: thomasY },
    end: { x: margin + 220, y: thomasY },
    thickness: 0.5,
    color: rgb(0.2, 0.2, 0.2),
  });
  // Licensor line: Thomas's legal artist signing identity.
  // Thomas's stated preferred phrasing is "aka" (per session 2026-04-22).
  // If/when he confirms the more conventional entertainment-contract
  // phrasing "p/k/a" (professionally known as) is what he wants,
  // swap the literal below and nothing else needs to change.
  page.drawText("Leigh Bray aka DirtySnatcha · Licensor", {
    x: margin,
    y: thomasY - 12,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Promoter line
  const promoterX = margin + 260;
  page.drawLine({
    start: { x: promoterX, y: thomasY },
    end: { x: promoterX + 220, y: thomasY },
    thickness: 0.5,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText(
    `${offer.contact?.full_name ?? "Promoter"}${
      offer.contact?.role ? ` · ${offer.contact.role}` : ""
    }`,
    {
      x: promoterX,
      y: thomasY - 12,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    }
  );

  // Date lines
  page.drawText("date", {
    x: margin,
    y: thomasY - 36,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawLine({
    start: { x: margin + 30, y: thomasY - 32 },
    end: { x: margin + 130, y: thomasY - 32 },
    thickness: 0.3,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText("date", {
    x: promoterX,
    y: thomasY - 36,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawLine({
    start: { x: promoterX + 30, y: thomasY - 32 },
    end: { x: promoterX + 130, y: thomasY - 32 },
    thickness: 0.3,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Footer
  page.drawText(
    "dirtysnatcha records · 10 research group · internal memo — not for external distribution without countersignature",
    {
      x: margin,
      y: 40,
      size: 7,
      font,
      color: rgb(0.55, 0.55, 0.55),
    }
  );

  const bytes = await doc.save();
  return bytes;
}

type UploadResult = { url: string; generatedAt: string };

async function uploadToSupabase(
  offerId: string,
  bytes: Uint8Array
): Promise<UploadResult | null> {
  try {
    const sb = serverClient();
    const bucket = "deal-memos";
    const fileName = `${offerId}/${Date.now()}.pdf`;
    const { error } = await sb.storage.from(bucket).upload(fileName, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (error) {
      // Bucket probably doesn't exist yet — that's fine, fall through
      // to local fallback. The caller can create it via the Supabase
      // dashboard or `supabase storage buckets create deal-memos`.
      return null;
    }
    // Long-lived signed URL (10 years); swap for publicUrl if bucket
    // is public.
    const { data: signed } = await sb.storage
      .from(bucket)
      .createSignedUrl(fileName, 60 * 60 * 24 * 3650);
    return {
      url: signed?.signedUrl ?? "",
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function writeLocal(
  offerId: string,
  bytes: Uint8Array
): Promise<UploadResult> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");
  const dir = path.join(os.tmpdir(), "dba-deal-memos", offerId);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}.pdf`);
  await fs.writeFile(file, bytes);
  return {
    url: `file://${file}`,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateDealMemoPdf(
  offer: OfferForMemo
): Promise<UploadResult> {
  const bytes = await renderPdf(offer);
  const uploaded = await uploadToSupabase(offer.id, bytes);
  if (uploaded) return uploaded;
  return writeLocal(offer.id, bytes);
}
