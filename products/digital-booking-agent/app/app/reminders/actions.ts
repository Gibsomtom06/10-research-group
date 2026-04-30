"use server";

import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase";

/**
 * Queue a follow-up draft for Outbound to compose.
 *
 * This doesn't generate the email here — composition goes through the
 * Analyst → Outbound pipeline so we keep the same freshness gates and
 * verification stamps. We insert a `decisions` row that the Outbound
 * runner picks up on its next cycle, and we stamp the contact so it
 * stops showing up on the reminders page until we hear back.
 */
export async function composeFollowUp(contactId: string, lane: string) {
  const sb = serverClient();

  // queue work for the Outbound agent
  const { error: decErr } = await sb.from("decisions").insert({
    actor: "reminders_ui",
    action: "queue_followup_compose",
    input_snapshot: { contact_id: contactId, lane },
    output_snapshot: { status: "queued" },
    reasoning: `manual follow-up queued from /reminders for lane=${lane}`,
  });
  if (decErr) {
    return { ok: false, error: decErr.message };
  }

  // stamp contact so the lane clears from this view
  await sb
    .from("contacts")
    .update({
      reminder_due_at: null,
      reminder_reason: `followup_queued: ${lane} @ ${new Date().toISOString()}`,
    })
    .eq("id", contactId);

  revalidatePath("/reminders");
  revalidatePath("/drafts");
  return { ok: true };
}

/**
 * Push a reminder out N days. Sets contacts.reminder_due_at into the
 * future so the nightly sweep leaves it alone until then.
 */
export async function snoozeReminder(contactId: string, days: number) {
  const sb = serverClient();
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await sb
    .from("contacts")
    .update({
      reminder_due_at: until,
      reminder_reason: `snoozed until ${until}`,
    })
    .eq("id", contactId);

  if (error) return { ok: false, error: error.message };

  await sb.from("decisions").insert({
    actor: "reminders_ui",
    action: "snooze_reminder",
    input_snapshot: { contact_id: contactId, days },
    output_snapshot: { reminder_due_at: until },
    reasoning: `snoozed ${days}d via /reminders`,
  });

  revalidatePath("/reminders");
  return { ok: true };
}

/**
 * Mark a reminder as handled without sending anything (e.g. "already
 * talked to them on a call"). Clears reminder_due_at entirely.
 */
export async function clearReminder(contactId: string, note: string) {
  const sb = serverClient();

  const { error } = await sb
    .from("contacts")
    .update({
      reminder_due_at: null,
      reminder_reason: null,
      last_interaction_at: new Date().toISOString(),
    })
    .eq("id", contactId);

  if (error) return { ok: false, error: error.message };

  await sb.from("decisions").insert({
    actor: "reminders_ui",
    action: "clear_reminder",
    input_snapshot: { contact_id: contactId },
    output_snapshot: { note: note || null },
    reasoning: note || "manually cleared from /reminders",
  });

  revalidatePath("/reminders");
  return { ok: true };
}
