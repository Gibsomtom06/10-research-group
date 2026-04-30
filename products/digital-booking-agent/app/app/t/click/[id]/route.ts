import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";
import { hashIp, verifyClick } from "@/lib/tracking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extractIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/**
 * GET /t/click/[id]?u=<encoded_url>&s=<signature>
 *
 * Records a `click` event, then 302-redirects to the target URL.
 * Rejects unsigned/mis-signed requests to prevent our redirector from
 * being used as an open redirect.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: logId } = await params;
  const url = new URL(req.url);
  const targetRaw = url.searchParams.get("u");
  const sig = url.searchParams.get("s") ?? "";

  if (!targetRaw) {
    return new NextResponse("missing target", { status: 400 });
  }
  let target: string;
  try {
    target = decodeURIComponent(targetRaw);
  } catch {
    return new NextResponse("bad target", { status: 400 });
  }

  // Only allow http(s); refuse mailto, javascript:, file:, etc.
  if (!/^https?:\/\//i.test(target)) {
    return new NextResponse("disallowed scheme", { status: 400 });
  }

  if (!verifyClick(logId, target, sig)) {
    return new NextResponse("bad signature", { status: 403 });
  }

  const uaHeader = req.headers.get("user-agent") ?? "";
  const ua = uaHeader.slice(0, 500);
  const ip = extractIp(req);
  const ipHash = hashIp(ip);

  void (async () => {
    try {
      const sb = serverClient();
      await sb.rpc("fn_record_outreach_event", {
        p_log_id: logId,
        p_event_type: "click",
        p_target_url: target,
        p_user_agent: ua,
        p_ip_hash: ipHash,
        p_referrer: req.headers.get("referer") ?? null,
      });
    } catch {
      // swallow: click must still redirect
    }
  })();

  return NextResponse.redirect(target, { status: 302 });
}
