"use server";

import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase";

type Result = { ok: boolean; error?: string };

/**
 * Mark an email address as bad (bounced, typo, etc.) WITHOUT hard-deleting
 * the contact. Sets email_valid=false + bumps lifetime bounce_count + records
 * reason. Cancels any queued/draft outreach to this contact.
 */
export async function markEmailBad(
  contactId: string,
  reason: string
): Promise<Result> {
  const sb = serverClient();
  const now = new Date().toISOString();

  // bump bounce count
  const { data: existing } = await sb
    .from("contacts")
    .select("bounce_count")
    .eq("id", contactId)
    .maybeSingle();

  const nextCount = (existing?.bounce_count ?? 0) + 1;

  const { error } = await sb
    .from("contacts")
    .update({
      email_valid: false,
      last_bounce_at: now,
      bounce_count: nextCount,
      bounce_reason: reason || "manually flagged as bad email",
    })
    .eq("id", contactId);
  if (error) return { ok: false, error: error.message };

  // cancel anything queued to this contact so sender skips them
  await sb
    .from("outreach_log")
    .update({
      status: "cancelled",
      cancelled_reason: "email marked bad",
    })
    .eq("contact_id", contactId)
    .in("status", ["draft", "queued", "held_for_review"]);

  await sb.from("decisions").insert({
    actor: "outreach_detail_ui",
    action: "mark_email_bad",
    input_snapshot: { contact_id: contactId, reason },
    output_snapshot: { bounce_count: nextCount, email_valid: false },
    reasoning: reason || "manually flagged",
  });

  revalidatePath(`/outreach/${contactId}`);
  revalidatePath("/outreach");
  return { ok: true };
}

/**
 * Restore a previously-marked-bad email. Used when Thomas fixes the address
 * or confirms the bounce was transient. Does NOT reset lifetime bounce_count
 * (that's a permanent audit record).
 */
export async function restoreEmail(
  contactId: string,
  newEmail: string | null
): Promise<Result> {
  const sb = serverClient();
  const patch: Record<string, unknown> = {
    email_valid: true,
    bounce_reason: null,
  };
  if (newEmail && newEmail.includes("@")) {
    patch.email = newEmail.trim().toLowerCase();
  }
  const { error } = await sb.from("contacts").update(patch).eq("id", contactId);
  if (error) return { ok: false, error: error.message };

  await sb.from("decisions").insert({
    actor: "outreach_detail_ui",
    action: "restore_email",
    input_snapshot: { contact_id: contactId, new_email: newEmail ?? null },
    output_snapshot: { email_valid: true },
    reasoning: newEmail ? "email corrected" : "flagged as restorable",
  });

  revalidatePath(`/outreach/${contactId}`);
  revalidatePath("/outreach");
  return { ok: true };
}

/**
 * Set DNC (do not contact). This is a hard stop — the sender will skip
 * and Outbound should refuse to compose.
 */
export async function setDoNotContact(
  contactId: string,
  reason: string
): Promise<Result> {
  const sb = serverClient();
  const { error } = await sb
    .from("contacts")
    .update({
      do_not_contact: true,
      reminder_due_at: null,
      reminder_reason: null,
    })
    .eq("id", contactId);
  if (error) return { ok: false, error: error.message };

  await sb
    .from("outreach_log")
    .update({
      status: "cancelled",
      cancelled_reason: "DNC set",
    })
    .eq("contact_id", contactId)
    .in("status", ["draft", "queued", "held_for_review"]);

  await sb.from("decisions").insert({
    actor: "outreach_detail_ui",
    action: "set_dnc",
    input_snapshot: { contact_id: contactId, reason },
    output_snapshot: { do_not_contact: true },
    reasoning: reason || "manually set",
  });

  revalidatePath(`/outreach/${contactId}`);
  revalidatePath("/outreach");
  return { ok: true };
}

export async function unsetDoNotContact(contactId: string): Promise<Result> {
  const sb = serverClient();
  const { error } = await sb
    .from("contacts")
    .update({ do_not_contact: false })
    .eq("id", contactId);
  if (error) return { ok: false, error: error.message };

  await sb.from("decisions").insert({
    actor: "outreach_detail_ui",
    action: "unset_dnc",
    input_snapshot: { contact_id: contactId },
    output_snapshot: { do_not_contact: false },
    reasoning: "manually cleared",
  });

  revalidatePath(`/outreach/${contactId}`);
  revalidatePath("/outreach");
  return { ok: true };
}

export async function updateThomasNotes(
  contactId: string,
  notes: string
): Promise<Result> {
  const sb = serverClient();
  const { error } = await sb
    .from("contacts")
    .update({ thomas_notes: notes })
    .eq("id", contactId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/outreach/${contactId}`);
  return { ok: true };
}
