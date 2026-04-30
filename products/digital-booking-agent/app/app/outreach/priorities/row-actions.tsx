"use client";

import { useState, useTransition } from "react";
import { queueForOutreachAction } from "./server-actions";

type Props = {
  tourId: string;
  contactId: string;
  venueId: string | null;
  marketMetro: string | null;
  relationshipTier: string | null;
  artistSlug: string | null;
  scoreReason: string;
};

/**
 * One-off "outreach now" button for the priorities table. Upserts a
 * tour_targets row at priority=100 with status='queued' so the next
 * seeder pass picks it up first. Does NOT send email directly — Thomas
 * still reviews in /drafts.
 *
 * artistSlug is forwarded into tour_targets.featured_artists as a single-
 * element array so the composer knows which roster artist to lead with
 * (the picker still factors in per-venue suppression on top of that).
 */
export function OutreachNowButton({
  tourId,
  contactId,
  venueId,
  marketMetro,
  relationshipTier,
  artistSlug,
  scoreReason,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<{ ok?: string; err?: string } | null>(
    null
  );

  function fire() {
    setState(null);
    startTransition(async () => {
      const r = await queueForOutreachAction(tourId, contactId, venueId, {
        marketMetro,
        relationshipTier,
        featuredArtists: artistSlug ? [artistSlug] : null,
        reason: `manual: outreach now (${scoreReason})`,
      });
      if (r.error) setState({ err: r.error });
      else setState({ ok: r.ok });
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={fire}
        disabled={pending || state?.ok != null}
        className="text-xs px-2 py-1 rounded border border-white/10 hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
        title="queue this target for the next seeder run at priority=100"
      >
        {pending ? "queueing…" : state?.ok ? "queued" : "outreach now"}
      </button>
      {state?.err && (
        <span className="text-xs text-red-400" title={state.err}>
          err
        </span>
      )}
    </span>
  );
}
