// ============================================================
// DSR PLATFORM — SUPABASE CLIENT
// Version: 1.0  |  March 4, 2026
// Connects the React platform to the Supabase backend.
// Covers: content_calendar, shows, dsp_metrics, releases, alerts
// ============================================================

import { createClient } from "@supabase/supabase-js";

// ── CONFIG ──────────────────────────────────────────────────
// In production: pull from environment variables.
// In Claude artifact: paste your Project URL + anon key.
const SUPABASE_URL  = import.meta.env?.VITE_SUPABASE_URL  || "__YOUR_SUPABASE_URL__";
const SUPABASE_ANON = import.meta.env?.VITE_SUPABASE_ANON || "__YOUR_SUPABASE_ANON_KEY__";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 5 } },
});


// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════

export const auth = {
  /** Sign in with email + password */
  signIn: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),

  /** Sign out current session */
  signOut: () => supabase.auth.signOut(),

  /** Get the currently signed-in Supabase user */
  getUser: () => supabase.auth.getUser(),

  /** Subscribe to auth state changes */
  onAuthStateChange: (callback) =>
    supabase.auth.onAuthStateChange(callback),
};


// ═══════════════════════════════════════════════════════════
// ARTISTS
// ═══════════════════════════════════════════════════════════

export const artists = {
  /** Fetch all artists the current user can access */
  list: async () => {
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .eq("is_active", true)
      .order("display_name");
    if (error) throw error;
    return data;
  },

  /** Fetch a single artist by slug */
  getBySlug: async (slug) => {
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    return data;
  },

  /** Update artist's cached follower/listener counts */
  updateMetrics: async (artistId, metrics) => {
    const { data, error } = await supabase
      .from("artists")
      .update({ ...metrics, updated_at: new Date().toISOString() })
      .eq("id", artistId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};


// ═══════════════════════════════════════════════════════════
// CONTENT CALENDAR
// ═══════════════════════════════════════════════════════════

export const contentCalendar = {
  /**
   * Fetch all posts for an artist, optionally filtered by date range.
   * @param {string} artistSlug - e.g. 'dirtysnatcha'
   * @param {string} [from]     - ISO date string, e.g. '2026-03-01'
   * @param {string} [to]       - ISO date string, e.g. '2026-05-31'
   */
  listByArtist: async (artistSlug, from, to) => {
    let q = supabase
      .from("content_calendar")
      .select(`
        id, post_date, post_time, timezone, day_of_week,
        platform, category, caption, hashtags,
        asset_type, asset_url, asset_note,
        algorithm_note, boost_eligible, status,
        approved_at, posted_at,
        linked_show_id, linked_release_id,
        impressions, reach, likes, comments, shares, saves,
        link_clicks, video_views, engagement_rate
      `)
      .eq("artist_slug", artistSlug)
      .order("post_date", { ascending: true })
      .order("post_time", { ascending: true });

    if (from) q = q.gte("post_date", from);
    if (to)   q = q.lte("post_date", to);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  /**
   * Fetch ALL artists' posts (for master calendar).
   * Manager/label tier only — RLS enforces this.
   */
  listAll: async (from, to) => {
    let q = supabase
      .from("content_calendar")
      .select(`
        id, artist_slug, post_date, post_time, timezone,
        platform, category, caption, status,
        algorithm_note, boost_eligible,
        linked_show_id, linked_release_id
      `)
      .order("post_date", { ascending: true });

    if (from) q = q.gte("post_date", from);
    if (to)   q = q.lte("post_date", to);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  /**
   * Create a new post.
   * @param {object} post - Matches content_calendar schema
   */
  create: async (post) => {
    const { data, error } = await supabase
      .from("content_calendar")
      .insert(post)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Bulk insert posts (e.g. importing from the static CONTENT_CALENDAR).
   * @param {object[]} posts - Array of post objects
   */
  bulkCreate: async (posts) => {
    const { data, error } = await supabase
      .from("content_calendar")
      .insert(posts)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Update a post's status (draft → pending_approval → approved → posted).
   * @param {string} postId
   * @param {string} status  - post_status enum value
   * @param {object} [extra] - Additional fields to update (e.g. rejection_reason)
   */
  updateStatus: async (postId, status, extra = {}) => {
    const patch = {
      status,
      updated_at: new Date().toISOString(),
      ...extra,
    };
    if (status === "approved")  patch.approved_at = new Date().toISOString();
    if (status === "posted")    patch.posted_at   = new Date().toISOString();

    const { data, error } = await supabase
      .from("content_calendar")
      .update(patch)
      .eq("id", postId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Update caption / hashtags / asset of a post.
   */
  updateContent: async (postId, fields) => {
    const { data, error } = await supabase
      .from("content_calendar")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", postId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Delete a post.
   */
  delete: async (postId) => {
    const { error } = await supabase
      .from("content_calendar")
      .delete()
      .eq("id", postId);
    if (error) throw error;
  },

  /**
   * Back-fill analytics after a post goes live.
   */
  updateAnalytics: async (postId, analytics) => {
    const { data, error } = await supabase
      .from("content_calendar")
      .update({ ...analytics, updated_at: new Date().toISOString() })
      .eq("id", postId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Subscribe to real-time changes on an artist's calendar.
   * Returns the channel — call channel.unsubscribe() to clean up.
   */
  subscribe: (artistSlug, callback) => {
    const channel = supabase
      .channel(`cc:${artistSlug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_calendar",
          filter: `artist_slug=eq.${artistSlug}`,
        },
        (payload) => callback(payload)
      )
      .subscribe();
    return channel;
  },
};


// ═══════════════════════════════════════════════════════════
// SHOWS
// ═══════════════════════════════════════════════════════════

export const shows = {
  /** All shows for an artist, sorted by date */
  listByArtist: async (artistId, statusFilter) => {
    let q = supabase
      .from("shows")
      .select(`
        *,
        venues(name, city, state, capacity),
        promoters(name, company, email, phone)
      `)
      .eq("artist_id", artistId)
      .order("show_date", { ascending: true });

    if (statusFilter) q = q.eq("status", statusFilter);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  /** All shows across the full roster (manager/label tier) */
  listAll: async (tourName) => {
    let q = supabase
      .from("shows")
      .select(`
        id, artist_id, show_date, city, state, status,
        guarantee, campaign_phase, ticket_link_live,
        deposit_received, contract_signed_at,
        artists(slug, display_name, color_hex)
      `)
      .order("show_date", { ascending: true });

    if (tourName) q = q.eq("tour_name", tourName);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  /** Fetch a single show with all relations */
  getById: async (showId) => {
    const { data, error } = await supabase
      .from("shows")
      .select(`
        *,
        venues(*),
        promoters(*),
        agent_commissions(*),
        contracts(*),
        votes(user_id, value, notes)
      `)
      .eq("id", showId)
      .single();
    if (error) throw error;
    return data;
  },

  /** Create a new show from an offer */
  create: async (show) => {
    const { data, error } = await supabase
      .from("shows")
      .insert({ ...show, status: "offer_received" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Update show — use for status transitions, financial updates, etc. */
  update: async (showId, fields) => {
    const { data, error } = await supabase
      .from("shows")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", showId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Advance a show's status through the state machine.
   * Enforces the 2/3 vote gate on the 'approved' transition (server-side trigger).
   */
  transition: async (showId, newStatus, notes) => {
    return shows.update(showId, {
      status: newStatus,
      ...(newStatus === "approved" && { approved_at: new Date().toISOString() }),
      ...(notes && { internal_notes: notes }),
    });
  },

  /** Cast a vote on a show (2/3 system) */
  castVote: async (showId, userId, value, notes) => {
    const { data, error } = await supabase
      .from("votes")
      .upsert({ show_id: showId, user_id: userId, value, notes })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Calculate CPT (Cost Per Ticket) for a show.
   * Returns null if insufficient data.
   */
  calcCPT: (show) => {
    const spend = (show.marketing_budget_digital || 0)
                + (show.marketing_budget_creative || 0)
                + (show.marketing_budget_street || 0);
    const sold  = show.actual_attendance;
    if (!spend || !sold) return null;
    return +(spend / sold).toFixed(2);
  },

  /**
   * Tour-wide P&L summary.
   * Module 7: Financial Engine
   */
  tourPnL: async (tourName) => {
    const { data, error } = await supabase
      .from("shows")
      .select("guarantee, deposit_amount, deposit_received, final_payout, status, artist_id")
      .eq("tour_name", tourName);
    if (error) throw error;

    const confirmed   = data.filter(s => ["confirmed","advancing","day_of_show","settled","completed"].includes(s.status));
    const totalGuarantee   = data.reduce((s,r) => s + (r.guarantee || 0), 0);
    const totalReceived    = data.filter(s => s.deposit_received).reduce((s,r) => s + (r.deposit_amount || 0), 0);
    const totalSettled     = data.filter(s => s.final_payout != null).reduce((s,r) => s + (r.final_payout || 0), 0);
    const confirmedCount   = confirmed.length;
    const totalShows       = data.length;

    return {
      totalShows,
      confirmedCount,
      totalGuarantee,
      totalReceived,
      totalSettled,
      outstandingDeposits: data.filter(s => !s.deposit_received && s.deposit_amount > 0).length,
      // 10/10/80 commission split
      commissionAB:     +(totalGuarantee * 0.10).toFixed(2),
      commissionPRYSM:  +(totalGuarantee * 0.10).toFixed(2),
      artistNet:        +(totalGuarantee * 0.80).toFixed(2),
    };
  },
};


// ═══════════════════════════════════════════════════════════
// DSP METRICS
// ═══════════════════════════════════════════════════════════

export const dspMetrics = {
  /** Latest snapshot for an artist */
  latest: async (artistId) => {
    const { data, error } = await supabase
      .from("dsp_metrics")
      .select("*")
      .eq("artist_id", artistId)
      .order("metric_date", { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  },

  /** Historical trend (last N days) */
  trend: async (artistId, days = 30) => {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const { data, error } = await supabase
      .from("dsp_metrics")
      .select("metric_date, spotify_monthly_listeners, spotify_popularity, spotify_streams_28d")
      .eq("artist_id", artistId)
      .gte("metric_date", from.toISOString().split("T")[0])
      .order("metric_date", { ascending: true });
    if (error) throw error;
    return data;
  },

  /** Insert today's snapshot (called by daily cron) */
  upsert: async (artistId, metricDate, metrics) => {
    const { data, error } = await supabase
      .from("dsp_metrics")
      .upsert({ artist_id: artistId, metric_date: metricDate, ...metrics })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Top tracks for an artist on a given date */
  topTracks: async (artistId, metricDate) => {
    const { data, error } = await supabase
      .from("track_metrics")
      .select("*")
      .eq("artist_id", artistId)
      .eq("metric_date", metricDate)
      .order("streams_28d", { ascending: false })
      .limit(10);
    if (error) throw error;
    return data;
  },
};


// ═══════════════════════════════════════════════════════════
// RELEASES
// ═══════════════════════════════════════════════════════════

export const releases = {
  listByArtist: async (artistId) => {
    const { data, error } = await supabase
      .from("releases")
      .select("*, release_marketing(*)")
      .eq("artist_id", artistId)
      .order("release_date", { ascending: false });
    if (error) throw error;
    return data;
  },

  create: async (release) => {
    const { data, error } = await supabase
      .from("releases")
      .insert(release)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (releaseId, fields) => {
    const { data, error } = await supabase
      .from("releases")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", releaseId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Check 6-week rule (Module 12).
   * Returns { passes: bool, daysSinceLast: int, lastReleaseTitle: string }
   */
  checkSixWeekRule: async (artistId, proposedDate) => {
    const { data, error } = await supabase
      .from("releases")
      .select("release_date, title")
      .eq("artist_id", artistId)
      .eq("status", "released")
      .lt("release_date", proposedDate)
      .order("release_date", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === "PGRST116") {
      // No prior releases
      return { passes: true, daysSinceLast: null, lastReleaseTitle: null };
    }
    if (error) throw error;

    const last  = new Date(data.release_date);
    const next  = new Date(proposedDate);
    const diff  = Math.floor((next - last) / (1000 * 60 * 60 * 24));
    return {
      passes: diff >= 42,
      daysSinceLast: diff,
      lastReleaseTitle: data.title,
    };
  },
};


// ═══════════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════════

export const alerts = {
  /** Fetch unresolved alerts for an artist */
  listActive: async (artistId) => {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("artist_id", artistId)
      .eq("is_resolved", false)
      .order("priority", { ascending: true })   // critical first
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Fetch all unresolved alerts across roster (manager/label) */
  listAllActive: async () => {
    const { data, error } = await supabase
      .from("alerts")
      .select("*, artists(slug, display_name, color_hex)")
      .eq("is_resolved", false)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  create: async (alert) => {
    const { data, error } = await supabase
      .from("alerts")
      .insert(alert)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  resolve: async (alertId, userId, note) => {
    const { data, error } = await supabase
      .from("alerts")
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_note: note,
      })
      .eq("id", alertId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Subscribe to new alerts in real-time */
  subscribe: (artistId, callback) => {
    const channel = supabase
      .channel(`alerts:${artistId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `artist_id=eq.${artistId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
    return channel;
  },
};


// ═══════════════════════════════════════════════════════════
// AI CONVERSATIONS
// ═══════════════════════════════════════════════════════════

export const aiConversations = {
  /** Append a message to the conversation log */
  log: async (entry) => {
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Fetch conversation history for a session */
  getSession: async (sessionId, limit = 50) => {
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("role, content, created_at, intent")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  /** Fetch recent sessions for a user */
  recentSessions: async (userId, limit = 10) => {
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("session_id, created_at, intent, content")
      .eq("user_id", userId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },
};


// ═══════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════

export const tasks = {
  listActive: async (artistId) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("artist_id", artistId)
      .is("completed_at", null)
      .order("priority", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data;
  },

  create: async (task) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  complete: async (taskId) => {
    const { data, error } = await supabase
      .from("tasks")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};


// ═══════════════════════════════════════════════════════════
// MIGRATION HELPER
// Converts the static CONTENT_CALENDAR object in dsr-platform.jsx
// to Supabase rows. Run once after schema is deployed.
// ═══════════════════════════════════════════════════════════

/**
 * Migrates the decoded CC posts from the React platform into Supabase.
 *
 * Usage (run from browser console or a migration script):
 *   import { migrateContentCalendar } from './supabase_client.js';
 *   import { CC, ARTIST_META } from './dsr-platform.jsx';
 *   await migrateContentCalendar(CC, ARTIST_META);
 *
 * @param {object} CC          - Decoded content calendar object from platform
 * @param {object} artistMeta  - ARTIST_META map from platform (slug → { id: uuid })
 */
export async function migrateContentCalendar(CC, artistMeta) {
  const rows = [];

  for (const [slug, posts] of Object.entries(CC)) {
    const artistId = artistMeta[slug]?.id;
    if (!artistId) {
      console.warn(`[migrate] No artist_id found for slug: ${slug}`);
      continue;
    }

    for (const post of posts) {
      rows.push({
        artist_id:      artistId,
        artist_slug:    slug,
        post_date:      post.date,
        post_time:      post.time || null,
        timezone:       post.timezone || null,
        day_of_week:    post.day || null,
        platform:       post.platform?.toLowerCase() || "instagram",
        category:       post.category?.toLowerCase().replace(/ /g, "_") || "branding",
        caption:        post.caption || null,
        hashtags:       post.hashtags || [],
        asset_type:     post.asset || null,
        algorithm_note: post.algorithmNote || null,
        boost_eligible: post.boost || false,
        status:         "draft",
      });
    }
  }

  console.log(`[migrate] Inserting ${rows.length} posts...`);
  const { data, error } = await supabase
    .from("content_calendar")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("[migrate] Error:", error);
    throw error;
  }

  console.log(`[migrate] ✅ Migrated ${data.length} posts successfully.`);
  return data;
}


// ═══════════════════════════════════════════════════════════
// REAL-TIME SUBSCRIPTION MANAGER
// Manages all active subscriptions and provides cleanup.
// ═══════════════════════════════════════════════════════════

const activeChannels = new Map();

export const realtime = {
  /**
   * Subscribe to an artist's full data feed.
   * Updates on: content_calendar, alerts, shows.
   */
  subscribeArtist: (artistSlug, artistId, handlers = {}) => {
    const key = `artist:${artistSlug}`;
    if (activeChannels.has(key)) return;

    const channels = [];

    if (handlers.onCalendarChange) {
      channels.push(contentCalendar.subscribe(artistSlug, handlers.onCalendarChange));
    }
    if (handlers.onAlert) {
      channels.push(alerts.subscribe(artistId, handlers.onAlert));
    }

    activeChannels.set(key, channels);
  },

  /** Unsubscribe and clean up */
  unsubscribeArtist: (artistSlug) => {
    const key = `artist:${artistSlug}`;
    const channels = activeChannels.get(key) || [];
    channels.forEach((ch) => ch.unsubscribe());
    activeChannels.delete(key);
  },

  /** Clean up all subscriptions (call on app unmount) */
  unsubscribeAll: () => {
    activeChannels.forEach((channels) => {
      channels.forEach((ch) => ch.unsubscribe());
    });
    activeChannels.clear();
  },
};

export default supabase;

// ─────────────────────────────────────────────────────────
// End of DSR Supabase Client v1.0
// ─────────────────────────────────────────────────────────
