"use server";

import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase";

/**
 * Server actions for the outreach draft queue.
 *
 * Flow:
 *   Outbound composer writes a row to `outreach_log` with status = 'draft'.
 *   Drafts page lists them. Thomas clicks approve | edit | reject.
 *
 * Approve: flips status to 'queued', sets queued_at, emits event for the sender.
 * Edit:    saves edited subject/body, resets composer_confidence to manual (1.0),
 *          marks who_edited = 'thomas', keeps status = 'draft' so Thomas can
 *          approve on a second pass if he wants.
 * Reject:  flips status to 'rejected', writes reason if provided.
 *
 * NOTE: auto-send is not triggered here. A separate sender worker polls
 * outreach_log where status = 'queued' and send_after <= now().
 */

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function human_cadence_send_after(confidence: number): Date {
  // >=0.95 → send at next human-cadence window (add 10 min jitter)
  // 0.80-0.94 → send 2hr after approval (gives Thomas cooldown to yank)
  // <0.80 → shouldn't be queued at all; default 2hr if someone forces it
  const now = Date.now();
  if (confidence >= 0.95) {
    const jitter = 5 * 60_000 + Math.floor(Math.random() * 15 * 60_000);
    return new Date(now + jitter);
  }
  return new Date(now + 2 * 60 * 60_000);
}

export async function approveDraft(id: string): Promise<ActionResult> {
  try {
    const sb = serverClient();
    const { data: current, error: loadErr } = await sb
      .from("outreach_log")
      .select("id, status, confidence_score")
      .eq("id", id)
      .single();
    if (loadErr) throw loadErr;
    if (!current) return { ok: false, error: "not found" };
    if (current.status !== "draft") {
      return { ok: false, error: `cannot approve status=${current.status}` };
    }
    const confidence = Number(current.confidence_score ?? 0.5);
    const scheduled_send_at = human_cadence_send_after(confidence);

    const { error } = await sb
      .from("outreach_log")
      .update({
        status: "queued",
        scheduled_send_at: scheduled_send_at.toISOString(),
        approved_at: new Date().toISOString(),
        approved_by: "thomas",
      })
      .eq("id", id);
    if (error) throw error;

    // audit in decisions table
    await sb.from("decisions").insert({
      actor: "thomas",
      action: "approve_draft",
      subject_type: "outreach_log",
      subject_id: id,
      confidence,
      rationale: `human approve at confidence ${confidence.toFixed(2)}`,
    });

    revalidatePath("/drafts");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

export async function editDraft(
  id: string,
  patch: { subject?: string; body?: string }
): Promise<ActionResult> {
  try {
    if (!patch.subject && !patch.body) {
      return { ok: false, error: "no changes" };
    }
    const sb = serverClient();
    const update: Record<string, unknown> = {
      edited_by: "thomas",
      edited_at: new Date().toISOString(),
      confidence_score: 1.0, // human-authored trumps model confidence
    };
    if (patch.subject) update.subject = patch.subject;
    if (patch.body) update.body = patch.body;

    const { error } = await sb.from("outreach_log").update(update).eq("id", id);
    if (error) throw error;

    await sb.from("decisions").insert({
      actor: "thomas",
      action: "edit_draft",
      subject_type: "outreach_log",
      subject_id: id,
      rationale: "manual edit by thomas",
      output_snapshot: patch,
    });

    revalidatePath("/drafts");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

export async function rejectDraft(
  id: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const sb = serverClient();
    const { error } = await sb
      .from("outreach_log")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        rejected_by: "thomas",
        cancelled_reason: reason ?? null,
      })
      .eq("id", id);
    if (error) throw error;

    await sb.from("decisions").insert({
      actor: "thomas",
      action: "reject_draft",
      subject_type: "outreach_log",
      subject_id: id,
      rationale: reason ?? "no reason given",
    });

    revalidatePath("/drafts");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}
