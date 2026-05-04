// ============================================================
// TENx10 PLATFORM — SUPABASE CLIENT
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
        contracts(*)
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
   * Requires manager or label tier (enforced via RLS).
   */
  transition: async (showId, newStatus, notes) => {
    return shows.update(showId, {
      status: newStatus,
      ...(newStatus === "approved" && { approved_at: new Date().toISOString() }),
      ...(notes && { internal_notes: notes }),
    });
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
// DUAL AI ROUTING
// Module 1: Three-Layer Pipeline
// Layer 1 (Builder): Claude — used in artifact & this conversation
// Layer 3 (Consumer): Gemini API — used in production deployment
//
// The platform auto-routes based on environment.
// Artifact / dev = Claude.  Production = Gemini.
// Both log to ai_conversations with provider field.
// ═══════════════════════════════════════════════════════════

const AI_PROVIDER = typeof window !== "undefined" &&
  window.location?.hostname?.includes("claude.ai")
    ? "claude"
    : "gemini";

export const aiAgent = {
  /**
   * Send a message to the active AI provider.
   * Automatically routes Claude ↔ Gemini based on environment.
   * Logs the exchange to ai_conversations.
   *
   * @param {object} opts
   * @param {string}   opts.systemPrompt   - Entity system prompt (Module 20)
   * @param {object[]} opts.messages        - Conversation history [{role, content}]
   * @param {string}   opts.artistId        - For conversation logging
   * @param {string}   opts.userId          - For conversation logging
   * @param {string}   opts.sessionId       - Client-generated session UUID
   * @param {string}   opts.intent          - Intent classification key
   * @param {string[]} opts.modulesLoaded   - KA modules injected
   */
  chat: async (opts) => {
    const { systemPrompt, messages, artistId, userId, sessionId, intent, modulesLoaded } = opts;
    let responseText = "";

    if (AI_PROVIDER === "claude") {
      // ── Claude API (artifact / builder layer) ──
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages,
        }),
      });
      const data = await res.json();
      responseText = data.content?.[0]?.text || "No response.";

    } else {
      // ── Gemini API (production consumer layer) ──
      // Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent
      const GEMINI_KEY = import.meta.env?.VITE_GEMINI_API_KEY || "";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: messages.map(m => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
          }),
        }
      );
      const data = await res.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    }

    // Log to Supabase
    if (artistId || userId) {
      await aiConversations.log({
        session_id: sessionId,
        user_id: userId || null,
        artist_id: artistId || null,
        role: "assistant",
        content: responseText,
        provider: AI_PROVIDER,
        model_used: AI_PROVIDER === "claude" ? "claude-sonnet-4-20250514" : "gemini-1.5-pro",
        intent: intent || null,
        modules_loaded: modulesLoaded || [],
      });
    }

    return responseText;
  },

  /** Which provider is active */
  provider: AI_PROVIDER,
};


// ═══════════════════════════════════════════════════════════
// GMAIL INTEGRATION
// Drafts emails using Module 18 templates.
// All emails go to gmail_outbox — NEVER auto-send.
// Human approval required before send. (Module 20 guardrail)
// ═══════════════════════════════════════════════════════════

export const gmail = {
  /**
   * Save an AI-drafted email to the outbox.
   * Call this every time the AI generates an email draft.
   */
  saveDraft: async (draft) => {
    const { data, error } = await supabase
      .from("gmail_outbox")
      .insert({ ...draft, status: "draft" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * List all outbox emails for an artist, optionally filtered.
   * @param {string} artistId
   * @param {string} [status]   - 'draft' | 'pending_send' | 'sent'
   * @param {string} [category] - email_category enum value
   */
  listByArtist: async (artistId, status, category) => {
    let q = supabase
      .from("gmail_outbox")
      .select("*")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false });

    if (status)   q = q.eq("status", status);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  /** List ALL outbox emails across roster (manager/label tier) */
  listAll: async (status) => {
    let q = supabase
      .from("gmail_outbox")
      .select("*, artists(slug, display_name, color_hex)")
      .order("created_at", { ascending: false });

    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  /**
   * Mark a draft as pending_send (approved for sending).
   * The actual send happens via Gmail MCP in the UI layer.
   */
  approveDraft: async (emailId, reviewedBy) => {
    const { data, error } = await supabase
      .from("gmail_outbox")
      .update({
        status: "pending_send",
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Record a successful send — called after Gmail MCP confirms.
   * @param {string} emailId
   * @param {string} gmailMessageId  - Returned by Gmail API
   * @param {string} gmailThreadId
   */
  confirmSent: async (emailId, gmailMessageId, gmailThreadId) => {
    const { data, error } = await supabase
      .from("gmail_outbox")
      .update({
        status: "sent",
        gmail_message_id: gmailMessageId,
        gmail_thread_id: gmailThreadId,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Build a promoter follow-up email draft using Module 18 template logic.
   * Resolves all {variable} tokens from show + promoter data.
   *
   * @param {object} show      - Full show row with venue/promoter joined
   * @param {string} category  - email_category value
   * @param {string} artistId
   * @returns {object} Ready-to-insert gmail_outbox row
   */
  buildPromoterEmail: (show, category, artistId) => {
    const p = show.promoters || {};
    const v = show.venues || {};
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const showDate = new Date(show.show_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    const subjects = {
      advance:          `Advance — ${show.artists?.display_name || "Artist"} · ${show.city} · ${showDate}`,
      promoter_followup:`Follow-Up: ${show.artists?.display_name || "Artist"} · ${show.city}`,
      deposit_request:  `Deposit Due — ${show.artists?.display_name || "Artist"} · ${show.city} · ${showDate}`,
      deposit_overdue:  `OVERDUE: Deposit — ${show.artists?.display_name || "Artist"} · ${show.city}`,
      contract_send:    `Contract — ${show.artists?.display_name || "Artist"} · ${show.city} · ${showDate}`,
      settlement:       `Settlement — ${show.artists?.display_name || "Artist"} · ${show.city} · ${showDate}`,
    };

    const bodies = {
      advance: `Hi ${p.name || "there"},\n\nReaching out to advance the ${show.city} show.\n\nDate: ${showDate}\nVenue: ${v.name || show.venues}\nLoad-in: ${show.load_in_time || "TBD"}\nSet time: ${show.set_time || "TBD"}\n\nPlease confirm the following:\n• Load-in time and parking\n• Sound check time\n• Green room access\n• PA system / tech rider status\n• Hotel confirmation (if applicable)\n\nTicket link: ${show.ticket_link || "Not yet live"}\nFacebook event: ${show.facebook_event_url || "Not yet live"}\n\nLet me know if anything has changed. Thanks —\nThomas Nalian\nTENx10`,

      deposit_request: `Hi ${p.name || "there"},\n\nJust a reminder that the deposit of $${show.deposit_amount} is due for the ${show.city} show on ${showDate}.\n\nPayment info:\n• Venmo: @thomas-nalian\n• Zelle: thomas@dirtysnatcha.com\n• Check payable to: Thomas Nalian\n\nPlease confirm receipt once sent.\n\nThanks,\nThomas Nalian\nTENx10`,

      deposit_overdue: `Hi ${p.name || "there"},\n\nThe deposit of $${show.deposit_amount} for the ${show.city} show (${showDate}) is now past due as of ${today}.\n\nThis needs to be resolved today. Please send payment or let us know what's happening.\n\nIf we don't hear back by EOD, we'll need to reconsider the booking.\n\nThomas Nalian\nTENx10`,

      settlement: `Hi ${p.name || "there"},\n\nThank you for having us in ${show.city}! Here's the settlement summary:\n\nGuarantee: $${show.guarantee || "TBD"}\nFinal payout: $${show.final_payout || "TBD"}\nAttendance: ${show.actual_attendance || "TBD"}\n\nPlease send final payment if any balance remains.\n\nThanks,\nThomas Nalian\nTENx10`,
    };

    return {
      artist_id:      artistId,
      show_id:        show.id,
      category:       category,
      to_email:       p.email || "",
      to_name:        p.name || "",
      subject:        subjects[category] || `Re: ${show.city} Show`,
      body_text:      bodies[category] || "",
      template_used:  `module_18_${category}`,
      variables_used: { show_city: show.city, show_date: showDate, promoter_name: p.name, deposit: show.deposit_amount },
    };
  },

  /** Subscribe to new outbox entries (real-time approval queue) */
  subscribe: (callback) => {
    const channel = supabase
      .channel("gmail_outbox_new")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gmail_outbox" },
        (payload) => callback(payload.new))
      .subscribe();
    return channel;
  },
};


// ═══════════════════════════════════════════════════════════
// GOOGLE DRIVE INTEGRATION
// Manages the show folder structure from KA Section 17 / Bible.
// Creates folders via Google Drive MCP (gcal.mcp.claude.com is Calendar;
// Drive uses https://drive.google.com API via service account or OAuth).
// ═══════════════════════════════════════════════════════════

// Standard sub-folder structure for every show (from Master Operating Bible)
const SHOW_FOLDER_STRUCTURE = [
  { key: "00_control",     name: "00_CONTROL",            type: "00_control" },
  { key: "01_contract",    name: "01_CONTRACT_&_PAYMENT",  type: "01_contract" },
  { key: "02_advance",     name: "02_ADVANCE_&_LOGISTICS",  type: "02_advance" },
  { key: "03_travel",      name: "03_TRAVEL",              type: "03_travel" },
  { key: "04_marketing",   name: "04_MARKETING",           type: "04_marketing" },
  { key: "05_tickets",     name: "05_TICKETS",             type: "05_tickets" },
  { key: "06_show_assets", name: "06_SHOW_ASSETS",         type: "06_show_assets" },
];

export const drive = {
  /**
   * Build the canonical show folder name.
   * Format: [MM.DD.YYYY] [City, State] - [Venue Name]
   */
  showFolderName: (show) => {
    const d = new Date(show.show_date);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    const venue = show.venues?.name || "TBD Venue";
    return `[${mm}.${dd}.${yyyy}] ${show.city}, ${show.state || "XX"} - ${venue}`;
  },

  /**
   * Register a show's full folder structure in Supabase (drive_folders table).
   * Call this when a show transitions to 'approved'.
   * Actual Drive folder creation happens separately via Drive API/MCP.
   *
   * @param {object} show      - Full show row
   * @param {string} artistId
   * @param {string} [rootDriveFolderId] - If Drive folder already exists
   */
  registerShowFolders: async (show, artistId, rootDriveFolderId) => {
    const rootName = drive.showFolderName(show);

    // Insert root folder
    const { data: root, error: rootErr } = await supabase
      .from("drive_folders")
      .insert({
        artist_id:      artistId,
        show_id:        show.id,
        folder_name:    rootName,
        folder_type:    "show_root",
        drive_folder_id: rootDriveFolderId || null,
        drive_folder_url: rootDriveFolderId
          ? `https://drive.google.com/drive/folders/${rootDriveFolderId}`
          : null,
        is_created: !!rootDriveFolderId,
      })
      .select()
      .single();
    if (rootErr) throw rootErr;

    // Insert sub-folders
    const subRows = SHOW_FOLDER_STRUCTURE.map(sf => ({
      artist_id:       artistId,
      show_id:         show.id,
      folder_name:     sf.name,
      folder_type:     sf.type,
      parent_folder_id: root.id,
      drive_parent_id: rootDriveFolderId || null,
      is_created:      false,
    }));

    const { data: subs, error: subErr } = await supabase
      .from("drive_folders")
      .insert(subRows)
      .select();
    if (subErr) throw subErr;

    return { root, subFolders: subs };
  },

  /**
   * Update a folder's Drive ID after it's been created via Drive API.
   */
  linkDriveFolder: async (folderId, driveFolderId) => {
    const { data, error } = await supabase
      .from("drive_folders")
      .update({
        drive_folder_id:  driveFolderId,
        drive_folder_url: `https://drive.google.com/drive/folders/${driveFolderId}`,
        is_created:       true,
        created_in_drive_at: new Date().toISOString(),
      })
      .eq("id", folderId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Register a file inside a show folder.
   */
  registerFile: async (file) => {
    const { data, error } = await supabase
      .from("drive_files")
      .insert(file)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Get the full folder tree for a show.
   */
  getShowFolders: async (showId) => {
    const { data, error } = await supabase
      .from("drive_folders")
      .select("*, drive_files(*)")
      .eq("show_id", showId)
      .order("folder_name");
    if (error) throw error;
    return data;
  },

  /**
   * Check which show folders are still missing from Drive (not yet created).
   * Used to surface "Missing: 02_ADVANCE" type alerts.
   */
  getMissingFolders: async (showId) => {
    const { data, error } = await supabase
      .from("drive_folders")
      .select("folder_name, folder_type, is_created")
      .eq("show_id", showId)
      .eq("is_created", false);
    if (error) throw error;
    return data;
  },
};




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
// Converts the static CONTENT_CALENDAR object in tenx10-platform.jsx
// to Supabase rows. Run once after schema is deployed.
// ═══════════════════════════════════════════════════════════

/**
 * Migrates the decoded CC posts from the React platform into Supabase.
 *
 * Usage (run from browser console or a migration script):
 *   import { migrateContentCalendar } from './tenx10_supabase_client.js';
 *   import { CC, ARTIST_META } from './tenx10-platform.jsx';
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
// End of TENx10 Supabase Client v1.0
// ─────────────────────────────────────────────────────────
