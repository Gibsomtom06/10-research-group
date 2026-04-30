"use server";

import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase";

type Result = { ok?: string; error?: string };

const UUID_NIL = "00000000-0000-0000-0000-000000000000";

/**
 * Queue a (tour, contact, venue) triple for immediate outreach by upserting
 * a tour_targets row with priority=100 and status='queued'. The next run
 * of scripts/seed_q2_tier2_drafts.py (or the cron equivalent) will pick
 * it up ahead of anything the normal scoring pass produced.
 *
 * We don't invoke the Python composer directly from Next — that lives in
 * the worker tier. This is the minimum footprint the seeder needs to
 * honor the manual override.
 */
export async function queueForOutreachAction(
  tourId: string,
  contactId: string,
  venueId: string | null,
  opts?: {
    marketMetro?: string | null;
    relationshipTier?: string | null;
    reason?: string | null;
    featuredArtists?: string[] | null;
  }
): Promise<Result> {
  try {
    if (!tourId || !contactId) {
      return { error: "missing tour_id or contact_id" };
    }
    const sb = serverClient();

    // Look up existing row. tour_targets uniqueness is
    // (tour_id, contact_id, coalesce(venue_id, nil_uuid)), so we check
    // both shapes.
    const lookup = venueId
      ? await sb
          .from("tour_targets")
          .select("id, status")
          .eq("tour_id", tourId)
          .eq("contact_id", contactId)
          .eq("venue_id", venueId)
          .limit(1)
      : await sb
          .from("tour_targets")
          .select("id, status")
          .eq("tour_id", tourId)
          .eq("contact_id", contactId)
          .is("venue_id", null)
          .limit(1);

    if (lookup.error) throw lookup.error;

    const patch = {
      tour_id: tourId,
      contact_id: contactId,
      venue_id: venueId,
      market_metro: opts?.marketMetro ?? null,
      relationship_tier_snapshot: opts?.relationshipTier ?? null,
      priority: 100,
      reason: opts?.reason ?? "manual: outreach now",
      status: "queued",
      featured_artists: opts?.featuredArtists ?? null,
    };

    const existing = lookup.data?.[0];
    if (existing) {
      const { error } = await sb
        .from("tour_targets")
        .update(patch)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("tour_targets").insert(patch);
      if (error) throw error;
    }

    revalidatePath("/outreach/priorities");
    revalidatePath("/drafts");
    return { ok: "queued for next seeder run" };
  } catch (e: any) {
    return { error: e?.message ?? "queue failed" };
  }
}
