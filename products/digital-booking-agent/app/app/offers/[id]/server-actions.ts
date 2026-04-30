"use server";

import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase";
import { generateDealMemoPdf } from "@/lib/deal-memo";

type Result = { ok?: string; error?: string };

/**
 * Server actions that drive the offer contract lifecycle. Every one is
 * thin — the state machine lives in migration 0009's RPCs, and the
 * heavy PDF work is in `@/lib/deal-memo`. Each action revalidates the
 * offer detail page so the UI reflects the new state immediately.
 */

export async function signThomasAction(
  offerId: string,
  opts?: { force?: boolean }
): Promise<Result> {
  try {
    const sb = serverClient();

    // Radius guard (migration 0015). A hard_block means this offer falls
    // inside an existing locked show's radius window; signing breaches
    // that clause. We refuse unless the caller explicitly passes force.
    // soft_warning and festival_exception still sign — the banner on the
    // offer page surfaces those so Thomas has already seen them.
    if (!opts?.force) {
      try {
        const { data: audit } = await (sb as any).rpc("fn_offer_radius_check", {
          p_offer_id: offerId,
        });
        if (audit && audit.severity === "hard_block") {
          const n = audit.conflict_count ?? 0;
          const miles =
            audit.nearest_miles != null
              ? ` · nearest ${Math.round(Number(audit.nearest_miles))}mi`
              : "";
          const days =
            audit.smallest_day_gap != null
              ? ` · smallest gap ${audit.smallest_day_gap}d`
              : "";
          return {
            error:
              `radius hard-block: ${n} locked-show conflict${n === 1 ? "" : "s"}${miles}${days}. ` +
              `sign again to override.`,
          };
        }
      } catch {
        // If the audit RPC isn't available (migration not run), don't block signing.
      }
    }

    const { error } = await sb.rpc("fn_offer_sign_thomas", {
      p_offer_id: offerId,
    });
    if (error) throw error;
    revalidatePath(`/offers/${offerId}`);
    revalidatePath(`/offers`);
    return { ok: opts?.force ? "signed by thomas (radius override)" : "signed by thomas" };
  } catch (e: any) {
    return { error: e?.message ?? "sign failed" };
  }
}

export async function signPromoterAction(offerId: string): Promise<Result> {
  try {
    const sb = serverClient();
    const { error } = await sb.rpc("fn_offer_sign_promoter", {
      p_offer_id: offerId,
    });
    if (error) throw error;
    revalidatePath(`/offers/${offerId}`);
    revalidatePath(`/offers`);
    return { ok: "countersigned by promoter" };
  } catch (e: any) {
    return { error: e?.message ?? "countersign failed" };
  }
}

export async function recordDepositAction(
  offerId: string,
  amount: number
): Promise<Result> {
  try {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "amount must be positive" };
    }
    const sb = serverClient();
    const { error } = await sb.rpc("fn_offer_record_deposit", {
      p_offer_id: offerId,
      p_amount: amount,
    });
    if (error) throw error;
    revalidatePath(`/offers/${offerId}`);
    revalidatePath(`/offers`);
    return { ok: `deposit $${Math.round(amount).toLocaleString()} recorded` };
  } catch (e: any) {
    return { error: e?.message ?? "deposit failed" };
  }
}

export async function generateMemoAction(offerId: string): Promise<Result> {
  try {
    const sb = serverClient();

    // Load the full offer with its joins so the memo generator has
    // everything it needs in one round trip.
    const { data, error } = await sb
      .from("offers")
      .select(
        `*,
         contact:contacts(full_name, email, role, city, state),
         venue:venues(name, city, state, capacity),
         artist:artists(name, slug)`
      )
      .eq("id", offerId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { error: "offer not found" };

    const flat = {
      ...data,
      contact: Array.isArray(data.contact) ? data.contact[0] ?? null : data.contact,
      venue: Array.isArray(data.venue) ? data.venue[0] ?? null : data.venue,
      artist: Array.isArray(data.artist) ? data.artist[0] ?? null : data.artist,
    };

    const { url, generatedAt } = await generateDealMemoPdf(flat as any);

    // Write the URL back plus mark status as memo_sent if we haven't
    // already signed.
    const nextStatus =
      flat.signed_at_thomas == null && flat.status !== "fully_executed"
        ? "memo_sent"
        : flat.status;

    const { error: upErr } = await sb
      .from("offers")
      .update({
        deal_memo_pdf_url: url,
        deal_memo_generated_at: generatedAt,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);
    if (upErr) throw upErr;

    revalidatePath(`/offers/${offerId}`);
    revalidatePath(`/offers`);
    return { ok: "deal memo generated" };
  } catch (e: any) {
    return { error: e?.message ?? "memo generation failed" };
  }
}

export async function sendCounterAction(
  offerId: string,
  counterGuarantee: number
): Promise<Result> {
  try {
    if (!Number.isFinite(counterGuarantee) || counterGuarantee <= 0) {
      return { error: "counter guarantee must be positive" };
    }
    const sb = serverClient();

    // Record the counter in the offer itself (guarantee field) and
    // update counter_bounds so the evaluator's view matches, and bump
    // status to 'countered'. We do NOT auto-send the email; instead,
    // the composer worker picks this up on its next run (it watches
    // offers with status='countered' AND no recent outbound draft).
    const { data: current, error: getErr } = await sb
      .from("offers")
      .select("counter_bounds, guarantee")
      .eq("id", offerId)
      .maybeSingle();
    if (getErr) throw getErr;

    const nextBounds = {
      ...(current?.counter_bounds ?? {}),
      target: counterGuarantee,
      proposed_by_thomas_at: new Date().toISOString(),
    };

    const { error: upErr } = await sb
      .from("offers")
      .update({
        status: "countered",
        counter_bounds: nextBounds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);
    if (upErr) throw upErr;

    revalidatePath(`/offers/${offerId}`);
    revalidatePath(`/offers`);
    return {
      ok: `counter at $${Math.round(
        counterGuarantee
      ).toLocaleString()} flagged — composer will draft on next run`,
    };
  } catch (e: any) {
    return { error: e?.message ?? "counter failed" };
  }
}
