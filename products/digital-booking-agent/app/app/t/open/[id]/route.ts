import { NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase";
import { hashIp } from "@/lib/tracking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 1x1 transparent GIF (43 bytes), base64.
const PIXEL_B64 =
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const PIXEL = Buffer.from(PIXEL_B64, "base64");

function extractIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

function pixelResponse(extraHeaders: Record<string, string> = {}) {
  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      // Don't let mail clients cache the open event.
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      ...extraHeaders,
    },
  });
}

/**
 * GET /t/open/[id].gif - 1x1 tracking pixel.
 *
 * Records an `open` event to outreach_events and bumps aggregate
 * counters on outreach_log. Always responds with the pixel bytes even
 * on logging error (we never want mail clients to show a broken image).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  // Accept either "<uuid>" or "<uuid>.gif" for the path param.
  const logId = rawId.replace(/\.gif$/i, "");

  // Serve the pixel first and log in background. Next 15 supports
  // waitUntil via the Edge runtime; on Node, we just fire-and-forget.
  const uaHeader = req.headers.get("user-agent") ?? "";
  const ua = uaHeader.slice(0, 500);
  const ip = extractIp(req);
  const ipHash = hashIp(ip);

  void (async () => {
    try {
      const sb = serverClient();
      await sb.rpc("fn_record_outreach_event", {
        p_log_id: logId,
        p_event_type: "open",
        p_target_url: null,
        p_user_agent: ua,
        p_ip_hash: ipHash,
        p_referrer: req.headers.get("referer") ?? null,
      });
    } catch {
      // swallow: pixel must still render
    }
  })();

  return pixelResponse();
}
