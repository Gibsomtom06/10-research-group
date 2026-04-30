// mirrors schema.sql — keep in sync manually until we codegen from Supabase

export type ContactRole =
  | "talent_buyer" | "venue_owner" | "promoter" | "manager"
  | "agent" | "artist_peer" | "other";

export type RelationshipStrength = "warm" | "cold" | "reconnect" | "dormant";

export type OutreachStatus =
  | "draft" | "queued" | "held_for_review"
  | "sent" | "replied" | "bounced" | "cancelled";

export type PraiseCategory =
  | "recent_win" | "taste_signal" | "personal_thread" | "seasonal";

export interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: ContactRole;
  company: string | null;
  city: string | null;
  state: string | null;
  relationship_strength: RelationshipStrength;
  last_interaction_at: string | null;
  thomas_notes: string | null;
  tags: string[];
}

export interface PitchPackPayload {
  recipient: { name: string; email: string; relationship_strength: RelationshipStrength };
  venue: { name: string; city: string; capacity: number; typical_nights: string[]; has_weekday_slots: boolean };
  praise_hook: { text: string; source_url: string; date_observed: string; freshness_days: number; confidence: number } | null;
  artist_market_stats: Array<{
    claim: string;
    source: string;
    source_url_or_export: string;
    date: string;
    value: number;
    trend_90d_pct?: number;
  }>;
  fit_rationale: { text: string; comp_act?: string; our_similar_show?: string };
  ask: { dates_requested: string[]; routing_context?: string };
  counter_bounds: { min_guarantee: number; target: number; walk_away: number; door_deal_acceptable?: boolean };
  verification_stamps: { praise_verified: boolean; stats_freshness_ok: boolean; sources_cited: number };
}
