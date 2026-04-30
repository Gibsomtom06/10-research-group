-- ============================================================
-- DSR PLATFORM — SUPABASE SCHEMA
-- Version: 1.0  |  Generated: March 4, 2026
-- Based on: KA v2.0 Modules 1–17 + Master Operating Bible v3
-- ============================================================
-- EXECUTION ORDER: Run this file once against a fresh Supabase project.
-- Enable Row Level Security on every table after creation.
-- ============================================================

-- ── EXTENSIONS ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";   -- for daily DSP metric pulls
create extension if not exists "pgcrypto";  -- for token encryption

-- ── ENUMS ──────────────────────────────────────────────────

create type user_tier       as enum ('artist', 'manager', 'label', 'admin');
create type show_status     as enum (
  'offer_received', 'under_review', 'counter_sent', 'approved',
  'contract_out', 'contract_signed', 'deposit_pending', 'deposit_received',
  'advancing', 'confirmed', 'day_of_show', 'settled', 'completed',
  'cancelled', 'declined'
);
create type contract_type   as enum ('flat', 'vs', 'bonus');
create type campaign_phase  as enum (
  'pre_announcement', 'announcement', 'on_sale',
  'maintenance', 'final_push', 'post_show', 'completed'
);
create type post_status     as enum ('draft', 'scheduled', 'pending_approval', 'approved', 'posted', 'rejected');
create type post_platform   as enum ('instagram', 'tiktok', 'facebook', 'twitter', 'youtube', 'soundcloud', 'threads');
create type post_category   as enum ('tour_announce', 'ticket_push', 'countdown', 'venue_hype', 'behind_scenes', 'stream_push', 'release_hype', 'community', 'branding', 'collab');
create type release_status  as enum ('idea', 'in_production', 'mastered', 'submitted', 'scheduled', 'released');
create type submission_status as enum ('received', 'scoring', 'voted', 'accepted', 'declined', 'shelved');
create type vote_value      as enum ('yes', 'no', 'abstain');
create type grade_letter    as enum ('A', 'B', 'C', 'D', 'F');
create type alert_priority  as enum ('critical', 'high', 'medium', 'low');
create type timezone_code   as enum ('ET', 'CT', 'MT', 'PT', 'AKT', 'HT');


-- ═══════════════════════════════════════════════════════════
-- SECTION 1: IDENTITY & ACCESS
-- ═══════════════════════════════════════════════════════════

-- ── ARTISTS ────────────────────────────────────────────────
-- One row per artist/entity in the platform.
-- DSR label itself is also an artist row (is_label = true).
create table artists (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Identity
  slug                text unique not null,           -- 'dirtysnatcha', 'whoisee', etc.
  display_name        text not null,
  legal_name          text,
  label               text,                           -- parent label name
  genre               text,
  subgenre            text,
  bio_short           text,
  bio_long            text,
  color_hex           text default '#8b5cf6',         -- brand color for UI
  emoji               text,
  passcode            text,                           -- hashed UI passcode
  is_label            boolean default false,
  is_active           boolean default true,
  timezone            timezone_code default 'ET',

  -- Social
  instagram_handle    text,
  tiktok_handle       text,
  twitter_handle      text,
  facebook_url        text,
  youtube_url         text,
  soundcloud_url      text,

  -- DSP URIs
  spotify_artist_uri  text,
  apple_music_id      text,
  youtube_oac_id      text,
  bandsintown_id      text,

  -- Technical IDs
  meta_pixel_id       text,
  ga4_measurement_id  text,
  bandsintown_api_key text,

  -- OAuth tokens (encrypted)
  spotify_access_token  text,
  spotify_refresh_token text,
  spotify_token_expiry  timestamptz,
  apple_access_token    text,

  -- Follower counts (last sync)
  instagram_followers int,
  tiktok_followers    int,
  twitter_followers   int,
  spotify_followers   int,
  spotify_monthly_listeners int,
  spotify_popularity  int,
  last_dsp_sync       timestamptz
);

-- ── USERS ──────────────────────────────────────────────────
-- Platform users. Linked to Supabase Auth via auth_id.
create table users (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  auth_id         uuid unique references auth.users(id) on delete cascade,
  name            text not null,
  email           text unique not null,
  tier            user_tier not null default 'artist',
  join_date       date default current_date,
  location        text,
  is_active       boolean default true,

  -- Which artists this user can access (null = all, for manager/label tier)
  artist_ids      uuid[],

  -- Profile types (multi-select: artist/consumer/concert_goer/downloader/promo_member)
  profile_types   text[] default '{}'::text[]
);

-- ── PROMO_MEMBERS ──────────────────────────────────────────
-- Extends users who are street team / promo members.
create table promo_members (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid unique not null references users(id) on delete cascade,
  artist_id         uuid not null references artists(id),

  -- Social connections
  instagram_handle  text,
  tiktok_handle     text,
  twitter_handle    text,
  facebook_url      text,

  -- Points system
  total_points      int not null default 0,
  weekly_points     int not null default 0,
  streak_weeks      int not null default 0,
  inactivity_weeks  int not null default 0,
  last_active       date,
  tier_level        text default 'bronze',  -- bronze / silver / gold / elite

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════
-- SECTION 2: SHOWS & BOOKING
-- ═══════════════════════════════════════════════════════════

-- ── PROMOTERS ──────────────────────────────────────────────
create table promoters (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  name            text not null,
  company         text,
  email           text,
  phone           text,
  city            text,
  state           text,
  region          text,   -- 'northeast', 'southeast', 'midwest', 'southwest', 'west', 'mountain'

  shows_worked    int default 0,
  average_grade   grade_letter,   -- auto-calculated from promoter_show_grades
  notes           text,
  is_blacklisted  boolean default false
);

-- ── VENUES ────────────────────────────────────────────────
create table venues (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),

  name            text not null,
  address         text,
  city            text not null,
  state           text,
  zip             text,
  capacity        int,
  stage_type      text,   -- 'club', 'theater', 'outdoor', 'festival_stage', 'bar'
  pa_system       text,
  notes           text,
  average_grade   grade_letter
);

-- ── SHOWS ──────────────────────────────────────────────────
-- Central table. Every show lives here from offer to close.
create table shows (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  artist_id           uuid not null references artists(id),
  venue_id            uuid references venues(id),
  promoter_id         uuid references promoters(id),

  -- Core logistics
  show_date           date not null,
  load_in_time        time,
  set_time            time,
  set_length_minutes  int,
  city                text not null,
  state               text,
  country             text default 'US',
  status              show_status not null default 'offer_received',

  -- Financial
  contract_type       contract_type not null default 'flat',
  guarantee           numeric(10,2),
  door_split_pct      numeric(5,2),   -- for vs deals: artist % after expenses
  bonus_threshold     int,            -- ticket count before bonus kicks in
  bonus_amount        numeric(10,2),
  merch_split         numeric(5,2),   -- venue's merch cut %
  travel_budget       numeric(10,2),
  hotel_budget        numeric(10,2),

  -- Deposits
  deposit_amount      numeric(10,2),
  deposit_due_date    date,
  deposit_received    boolean default false,
  deposit_received_at timestamptz,

  -- Contract
  contract_sent_at    timestamptz,
  contract_signed_at  timestamptz,
  contract_url        text,           -- Google Drive link

  -- Settlement
  actual_attendance   int,
  door_gross          numeric(10,2),
  merch_gross         numeric(10,2),
  final_payout        numeric(10,2),
  settled_at          timestamptz,

  -- Advance checklist (boolean flags)
  travel_confirmed    boolean default false,
  hotel_confirmed     boolean default false,
  rider_confirmed     boolean default false,
  tech_confirmed      boolean default false,
  greenroom_confirmed boolean default false,

  -- Marketing
  campaign_phase      campaign_phase default 'pre_announcement',
  facebook_event_url  text,
  ticket_link         text,
  ticket_link_live    boolean default false,
  pixel_installed     boolean default false,
  utm_tracking_live   boolean default false,
  marketing_budget_digital  numeric(10,2),
  marketing_budget_creative numeric(10,2),
  marketing_budget_street   numeric(10,2),
  cost_per_ticket     numeric(10,2),   -- calculated: ad_spend / tickets_sold

  -- Support artists
  support_artists     jsonb default '[]'::jsonb,
  -- e.g. [{"name":"Artist","tier":"local_support","fee":200,"confirmed":true}]

  -- Tour routing
  tour_name           text,
  is_headliner        boolean default true,
  gig_type            text default 'headliner',  -- 'headliner','support','festival','private'

  -- Internal notes
  offer_email_url     text,   -- original offer in Drive
  approval_notes      text,
  internal_notes      text,

  -- Timestamps
  offer_received_at   timestamptz default now(),
  approved_at         timestamptz
);

-- ── VOTES (2/3 system — DSR only) ──────────────────────────
-- Hard constraint: show cannot move to 'approved' without
-- 2 yes votes out of 3 partners.
create table votes (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),

  show_id     uuid not null references shows(id) on delete cascade,
  user_id     uuid not null references users(id),
  value       vote_value not null,
  notes       text,

  unique(show_id, user_id)
);

-- ── PROMOTER_SHOW_GRADES ───────────────────────────────────
create table promoter_show_grades (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),

  show_id         uuid not null references shows(id) on delete cascade,
  promoter_id     uuid not null references promoters(id),
  grade           grade_letter not null,
  marketing_score int check (marketing_score between 1 and 5),
  communication_score int check (communication_score between 1 and 5),
  payment_score   int check (payment_score between 1 and 5),
  notes           text
);

-- ── VENUE_SHOW_GRADES ─────────────────────────────────────
create table venue_show_grades (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),

  show_id         uuid not null references shows(id) on delete cascade,
  venue_id        uuid not null references venues(id),
  grade           grade_letter not null,
  sound_score     int check (sound_score between 1 and 5),
  hospitality_score int check (hospitality_score between 1 and 5),
  load_in_score   int check (load_in_score between 1 and 5),
  notes           text
);

-- ── AGENT_COMMISSIONS ─────────────────────────────────────
-- Tracks 10/10/80 commission splits per show.
create table agent_commissions (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),

  show_id         uuid not null references shows(id) on delete cascade,
  agent_name      text not null,     -- 'Andrew @ AB Touring', 'Colton @ PRYSM', etc.
  agent_email     text,
  commission_pct  numeric(5,2) not null default 10.00,
  commission_amount numeric(10,2),   -- calculated from final_payout
  paid_at         timestamptz,
  payment_method  text,
  notes           text
);

-- ── CONTRACTS ─────────────────────────────────────────────
create table contracts (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  show_id         uuid not null references shows(id) on delete cascade,
  version         int not null default 1,
  status          text default 'draft',   -- draft / sent / signed / executed
  drive_url       text,
  docusign_url    text,
  signed_by_artist_at   timestamptz,
  signed_by_promoter_at timestamptz,
  notes           text
);


-- ═══════════════════════════════════════════════════════════
-- SECTION 3: DSP & STREAMING METRICS
-- ═══════════════════════════════════════════════════════════

-- ── DSP_METRICS ───────────────────────────────────────────
-- Daily snapshot of streaming performance per artist.
-- Populated by cron job via OAuth tokens.
create table dsp_metrics (
  id                    uuid primary key default uuid_generate_v4(),
  recorded_at           timestamptz not null default now(),
  metric_date           date not null,
  artist_id             uuid not null references artists(id),

  -- Spotify
  spotify_monthly_listeners   int,
  spotify_followers           int,
  spotify_popularity          int,        -- 0–100 Spotify Popularity Index
  spotify_streams_28d         int,
  spotify_saves_28d           int,
  spotify_save_rate           numeric(5,3),
  spotify_discovery_mode_on   boolean,
  spotify_top_city_1          text,
  spotify_top_city_2          text,
  spotify_top_city_3          text,

  -- Apple Music
  apple_listeners_28d         int,
  apple_shazams_28d           int,
  apple_top_city_1            text,

  -- SoundCloud
  sc_plays_28d                int,
  sc_followers                int,
  sc_reposts_28d              int,

  -- TikTok / YouTube (via future OAuth)
  tiktok_video_views_28d      int,
  tiktok_sound_uses_28d       int,
  youtube_shorts_views_28d    int,

  unique(artist_id, metric_date)
);

-- ── TRACK_METRICS ──────────────────────────────────────────
-- Per-track stats (not just artist-level).
create table track_metrics (
  id              uuid primary key default uuid_generate_v4(),
  recorded_at     timestamptz not null default now(),
  metric_date     date not null,
  artist_id       uuid not null references artists(id),

  track_title     text not null,
  spotify_uri     text,
  streams_total   int,
  streams_28d     int,
  saves_total     int,
  save_rate       numeric(5,3),
  playlist_adds   int,
  editorial_playlist boolean default false,
  algorithmic_playlist boolean default false,
  is_active_push  boolean default false,  -- currently being promoted
  notes           text,

  unique(artist_id, track_title, metric_date)
);


-- ═══════════════════════════════════════════════════════════
-- SECTION 4: RELEASES
-- ═══════════════════════════════════════════════════════════

-- ── RELEASES ──────────────────────────────────────────────
create table releases (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  artist_id           uuid not null references artists(id),
  title               text not null,
  release_type        text default 'single',  -- single / ep / album / remix
  status              release_status not null default 'idea',

  release_date        date,
  delivery_date       date,    -- 5 business days before release
  editorial_pitch_date date,   -- 7+ days before release
  presave_link        text,
  smartlink           text,
  upc                 text,
  isrc                text,

  -- 6-week rule check
  days_since_last_release int,   -- populated on insert trigger
  six_week_rule_passed    boolean,

  -- Distribution
  distributor         text default 'Virgin Music Group',
  label               text,
  genre               text,
  bpm                 int,
  key                 text,

  -- Assets
  cover_art_url       text,
  audio_url           text,
  stems_url           text,

  notes               text
);

-- ── RELEASE_MARKETING ─────────────────────────────────────
-- Marketing plan attached to each release.
create table release_marketing (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  release_id      uuid unique not null references releases(id) on delete cascade,
  artist_id       uuid not null references artists(id),

  -- VMG Smart Audience ads
  vmg_fan_engagement_budget   numeric(10,2),
  vmg_stream_growth_budget    numeric(10,2),
  vmg_fan_engagement_start    date,
  vmg_stream_growth_start     date,

  -- Meta ads
  meta_campaign_id            text,
  meta_ad_spend               numeric(10,2),
  meta_impressions            int,
  meta_link_clicks            int,
  meta_ctr                    numeric(6,4),

  -- Editorial
  spotify_editorial_pitched   boolean default false,
  spotify_editorial_result    text,   -- 'added', 'passed', 'pending'
  apple_music_featured        boolean default false,

  -- Content
  content_pieces_planned      int default 0,
  content_pieces_posted       int default 0,
  presave_clicks              int,

  notes                       text
);


-- ═══════════════════════════════════════════════════════════
-- SECTION 5: CONTENT CALENDAR
-- ═══════════════════════════════════════════════════════════

-- ── CONTENT_CALENDAR ──────────────────────────────────────
-- Every scheduled post for every artist.
-- This replaces the static CONTENT_CALENDAR object in the React app.
create table content_calendar (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  artist_id         uuid not null references artists(id),
  artist_slug       text not null,   -- denormalized for fast queries

  -- Scheduling
  post_date         date not null,
  post_time         time,            -- local time
  timezone          timezone_code,
  day_of_week       text,            -- 'Mon', 'Tue', etc.

  -- Content
  platform          post_platform not null,
  category          post_category not null,
  caption           text,
  hashtags          text[],
  asset_type        text,            -- 'photo', 'video', 'reel', 'story', 'carousel', 'clip'
  asset_url         text,
  asset_note        text,            -- production note, e.g. "Use clip from soundcheck"

  -- Algorithm note
  algorithm_note    text,            -- e.g. "Reel → push to non-followers"
  boost_eligible    boolean default false,
  linked_show_id    uuid references shows(id),
  linked_release_id uuid references releases(id),

  -- Approval workflow
  status            post_status not null default 'draft',
  submitted_at      timestamptz,
  approved_by       uuid references users(id),
  approved_at       timestamptz,
  rejection_reason  text,
  posted_at         timestamptz,

  -- Performance (back-filled after posting)
  impressions       int,
  reach             int,
  likes             int,
  comments          int,
  shares            int,
  saves             int,
  link_clicks       int,
  video_views       int,
  engagement_rate   numeric(6,4)
);

-- ── POST_ANALYTICS ─────────────────────────────────────────
-- Detailed analytics snapshots for posted content.
-- Linked to content_calendar rows after posting.
create table post_analytics (
  id                uuid primary key default uuid_generate_v4(),
  recorded_at       timestamptz not null default now(),
  metric_date       date not null,

  post_id           uuid not null references content_calendar(id) on delete cascade,
  artist_id         uuid not null references artists(id),
  platform          post_platform not null,

  -- Reach & Awareness
  impressions       int default 0,
  reach             int default 0,
  frequency         numeric(6,3),

  -- Engagement
  likes             int default 0,
  comments          int default 0,
  shares            int default 0,
  saves             int default 0,
  profile_visits    int default 0,
  link_clicks       int default 0,

  -- Video specific
  video_views       int default 0,
  avg_watch_pct     numeric(5,2),
  completion_rate   numeric(5,2),

  -- Calculated
  engagement_rate   numeric(6,4),

  unique(post_id, metric_date)
);


-- ═══════════════════════════════════════════════════════════
-- SECTION 6: CAMPAIGNS & ADS
-- ═══════════════════════════════════════════════════════════

-- ── CAMPAIGNS ─────────────────────────────────────────────
create table campaigns (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  artist_id           uuid not null references artists(id),
  show_id             uuid references shows(id),
  release_id          uuid references releases(id),

  name                text not null,
  platform            text not null,   -- 'meta', 'vmg', 'tiktok', 'google'
  campaign_type       text,            -- 'fan_engagement', 'stream_growth', 'ticket_sales', 'awareness'
  status              text default 'draft',   -- draft / active / paused / completed

  -- Meta Ads
  meta_campaign_id    text,
  meta_adset_id       text,

  -- Budget
  budget_total        numeric(10,2),
  budget_spent        numeric(10,2) default 0,
  daily_budget        numeric(10,2),
  start_date          date,
  end_date            date,

  -- Performance
  impressions         int default 0,
  clicks              int default 0,
  ctr                 numeric(6,4),
  cpc                 numeric(8,4),
  cpm                 numeric(8,4),
  conversions         int default 0,
  cost_per_conversion numeric(10,2),
  roas                numeric(8,4),

  notes               text
);

-- ── ASSETS ────────────────────────────────────────────────
-- Uploaded files: flyers, photos, audio, video, etc.
create table assets (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),

  artist_id       uuid not null references artists(id),
  show_id         uuid references shows(id),
  release_id      uuid references releases(id),

  name            text not null,
  file_type       text,   -- 'image', 'video', 'audio', 'pdf', 'doc'
  mime_type       text,
  url             text not null,   -- Supabase Storage URL
  drive_url       text,            -- Google Drive URL if synced
  size_bytes      bigint,
  width_px        int,
  height_px       int,
  duration_sec    numeric(8,2),
  tags            text[],
  is_approved     boolean default false,
  approved_by     uuid references users(id),
  notes           text
);


-- ═══════════════════════════════════════════════════════════
-- SECTION 7: A&R SUBMISSIONS
-- ═══════════════════════════════════════════════════════════

-- ── SUBMISSIONS ───────────────────────────────────────────
-- Incoming demo submissions to the label.
create table submissions (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Submitter
  artist_name         text not null,
  contact_email       text,
  contact_instagram   text,
  location            text,

  -- Track
  track_title         text not null,
  genre               text,
  bpm                 int,
  demo_url            text,   -- SoundCloud / Dropbox / Drive link
  notes_from_artist   text,

  -- Scoring (Module 13: A&R)
  reach_score         int check (reach_score between 0 and 10),    -- social + streaming reach
  quality_score       int check (quality_score between 0 and 10),  -- production quality
  fit_score           int check (fit_score between 0 and 10),      -- label fit
  total_score         int,   -- auto-calculated: reach + quality + fit

  -- Status
  status              submission_status not null default 'received',
  assigned_to         uuid references users(id),

  -- Voting (2/3 system for accept)
  vote_1_user         uuid references users(id),
  vote_1_value        vote_value,
  vote_2_user         uuid references users(id),
  vote_2_value        vote_value,
  vote_3_user         uuid references users(id),
  vote_3_value        vote_value,
  yes_count           int default 0,   -- auto-calculated
  vote_completed_at   timestamptz,

  -- Decision
  final_decision      text,   -- 'accepted' / 'declined' / 'shelved'
  decision_notes      text,
  decided_at          timestamptz
);


-- ═══════════════════════════════════════════════════════════
-- SECTION 8: TASKS & PROMO
-- ═══════════════════════════════════════════════════════════

-- ── TASKS ─────────────────────────────────────────────────
-- AI-generated and manually created action items.
create table tasks (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  artist_id       uuid not null references artists(id),
  show_id         uuid references shows(id),
  release_id      uuid references releases(id),
  assigned_to     uuid references users(id),

  title           text not null,
  description     text,
  priority        alert_priority not null default 'medium',
  due_date        date,
  completed_at    timestamptz,
  is_recurring    boolean default false,
  recurrence_rule text,   -- iCal RRULE string
  source          text default 'manual',  -- 'manual' / 'ai_agent' / 'alert_trigger'
  tags            text[]
);

-- ── TASK_COMPLETIONS ──────────────────────────────────────
-- Promo member task completions with proof.
create table task_completions (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),

  task_id           uuid not null references tasks(id) on delete cascade,
  promo_member_id   uuid not null references promo_members(id),

  proof_url         text,    -- screenshot, post URL, etc.
  proof_type        text,    -- 'screenshot', 'post_url', 'story_url'
  points_awarded    int default 0,
  verified          boolean default false,
  verified_by       uuid references users(id),
  verified_at       timestamptz,
  rejection_reason  text,

  unique(task_id, promo_member_id)
);


-- ═══════════════════════════════════════════════════════════
-- SECTION 9: AI & CONVERSATIONS
-- ═══════════════════════════════════════════════════════════

-- ── AI_CONVERSATIONS ──────────────────────────────────────
-- All AI agent conversations, logged for context and audit.
create table ai_conversations (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),

  user_id         uuid references users(id),
  artist_id       uuid references artists(id),
  session_id      text,               -- client-generated session UUID

  -- Message
  role            text not null,      -- 'user' / 'assistant' / 'system'
  content         text not null,
  token_count     int,

  -- Intent classification
  intent          text,               -- 'booking', 'dsp', 'content', 'briefing', etc.
  modules_loaded  text[],             -- which KA modules were injected

  -- Actions triggered
  action_type     text,               -- 'task_created', 'alert_fired', 'email_drafted', etc.
  action_payload  jsonb,

  metadata        jsonb
);

-- ── ALERTS ────────────────────────────────────────────────
-- Fired alerts — from Module 15 trigger conditions.
create table alerts (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,

  artist_id       uuid not null references artists(id),
  show_id         uuid references shows(id),
  release_id      uuid references releases(id),

  priority        alert_priority not null,
  alert_type      text not null,      -- e.g. 'cpt_high', 'deposit_overdue', 'decay_alert'
  title           text not null,
  body            text,
  suggested_action text,

  is_read         boolean default false,
  is_resolved     boolean default false,
  resolved_by     uuid references users(id),
  resolution_note text
);


-- ═══════════════════════════════════════════════════════════
-- SECTION 10: INDEXES
-- ═══════════════════════════════════════════════════════════

-- Shows
create index idx_shows_artist_id         on shows(artist_id);
create index idx_shows_show_date         on shows(show_date);
create index idx_shows_status            on shows(status);
create index idx_shows_tour_name         on shows(tour_name);
create index idx_shows_campaign_phase    on shows(campaign_phase);

-- Content calendar
create index idx_cc_artist_id            on content_calendar(artist_id);
create index idx_cc_post_date            on content_calendar(post_date);
create index idx_cc_status               on content_calendar(status);
create index idx_cc_platform             on content_calendar(platform);
create index idx_cc_artist_date          on content_calendar(artist_slug, post_date);

-- DSP metrics
create index idx_dsp_artist_date         on dsp_metrics(artist_id, metric_date desc);
create index idx_track_artist_date       on track_metrics(artist_id, metric_date desc);

-- AI conversations
create index idx_ai_conv_session         on ai_conversations(session_id);
create index idx_ai_conv_user            on ai_conversations(user_id);
create index idx_ai_conv_artist          on ai_conversations(artist_id);

-- Alerts
create index idx_alerts_artist_unread    on alerts(artist_id) where is_resolved = false;
create index idx_alerts_priority         on alerts(priority);

-- Tasks
create index idx_tasks_artist_due        on tasks(artist_id, due_date) where completed_at is null;

-- Submissions
create index idx_submissions_status      on submissions(status);
create index idx_submissions_score       on submissions(total_score desc);


-- ═══════════════════════════════════════════════════════════
-- SECTION 11: FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at timestamps
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_artists_updated_at
  before update on artists
  for each row execute function set_updated_at();

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

create trigger trg_shows_updated_at
  before update on shows
  for each row execute function set_updated_at();

create trigger trg_content_calendar_updated_at
  before update on content_calendar
  for each row execute function set_updated_at();

create trigger trg_releases_updated_at
  before update on releases
  for each row execute function set_updated_at();

create trigger trg_submissions_updated_at
  before update on submissions
  for each row execute function set_updated_at();

-- Auto-calculate submission total score
create or replace function calc_submission_score()
returns trigger language plpgsql as $$
begin
  new.total_score = coalesce(new.reach_score, 0)
                  + coalesce(new.quality_score, 0)
                  + coalesce(new.fit_score, 0);
  return new;
end;
$$;

create trigger trg_submission_score
  before insert or update on submissions
  for each row execute function calc_submission_score();

-- Auto-calculate submission yes_count
create or replace function calc_submission_votes()
returns trigger language plpgsql as $$
begin
  new.yes_count = (
    case when new.vote_1_value = 'yes' then 1 else 0 end +
    case when new.vote_2_value = 'yes' then 1 else 0 end +
    case when new.vote_3_value = 'yes' then 1 else 0 end
  );
  return new;
end;
$$;

create trigger trg_submission_votes
  before insert or update on submissions
  for each row execute function calc_submission_votes();

-- Prevent show approval without 2/3 votes (DSR enforcement)
create or replace function enforce_vote_gate()
returns trigger language plpgsql as $$
declare
  yes_votes int;
begin
  if new.status = 'approved' and old.status != 'approved' then
    select count(*) into yes_votes
    from votes
    where show_id = new.id and value = 'yes';

    if yes_votes < 2 then
      raise exception 'Cannot approve show: requires at least 2 yes votes (got %)', yes_votes;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_show_vote_gate
  before update on shows
  for each row execute function enforce_vote_gate();

-- Auto-update promoter average_grade after each grade entry
create or replace function update_promoter_grade()
returns trigger language plpgsql as $$
declare
  avg_numeric numeric;
  grade_val grade_letter;
begin
  -- Map grade letters to numbers, average, map back
  select avg(
    case grade
      when 'A' then 5
      when 'B' then 4
      when 'C' then 3
      when 'D' then 2
      when 'F' then 1
    end
  ) into avg_numeric
  from promoter_show_grades
  where promoter_id = new.promoter_id;

  grade_val := case
    when avg_numeric >= 4.5 then 'A'::grade_letter
    when avg_numeric >= 3.5 then 'B'::grade_letter
    when avg_numeric >= 2.5 then 'C'::grade_letter
    when avg_numeric >= 1.5 then 'D'::grade_letter
    else 'F'::grade_letter
  end;

  update promoters set average_grade = grade_val, updated_at = now()
  where id = new.promoter_id;

  return new;
end;
$$;

create trigger trg_promoter_grade_rollup
  after insert or update on promoter_show_grades
  for each row execute function update_promoter_grade();


-- ═══════════════════════════════════════════════════════════
-- SECTION 12: ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════
-- Module 3: Permission & Access Logic
-- artist tier   → own artist data only
-- manager tier  → all artists in their roster (users.artist_ids)
-- label tier    → full access to all artists
-- admin tier    → full access + user management

alter table artists             enable row level security;
alter table users               enable row level security;
alter table promo_members       enable row level security;
alter table shows               enable row level security;
alter table promoters           enable row level security;
alter table venues              enable row level security;
alter table votes               enable row level security;
alter table promoter_show_grades enable row level security;
alter table venue_show_grades   enable row level security;
alter table agent_commissions   enable row level security;
alter table contracts           enable row level security;
alter table releases            enable row level security;
alter table release_marketing   enable row level security;
alter table content_calendar    enable row level security;
alter table post_analytics      enable row level security;
alter table dsp_metrics         enable row level security;
alter table track_metrics       enable row level security;
alter table campaigns           enable row level security;
alter table assets              enable row level security;
alter table submissions         enable row level security;
alter table tasks               enable row level security;
alter table task_completions    enable row level security;
alter table ai_conversations    enable row level security;
alter table alerts              enable row level security;

-- Helper: get current user's tier and artist_ids
create or replace function current_user_tier()
returns user_tier language sql stable security definer as $$
  select tier from users where auth_id = auth.uid() limit 1;
$$;

create or replace function current_user_artist_ids()
returns uuid[] language sql stable security definer as $$
  select artist_ids from users where auth_id = auth.uid() limit 1;
$$;

-- Artists: label/admin see all; manager/artist see their own
create policy "artists_select"
  on artists for select
  using (
    current_user_tier() in ('label', 'admin')
    or id = any(current_user_artist_ids())
  );

create policy "artists_modify"
  on artists for all
  using (current_user_tier() in ('label', 'admin'));

-- Shows: same logic
create policy "shows_select"
  on shows for select
  using (
    current_user_tier() in ('label', 'admin', 'manager')
    or artist_id = any(current_user_artist_ids())
  );

create policy "shows_modify"
  on shows for all
  using (
    current_user_tier() in ('label', 'admin', 'manager')
    or artist_id = any(current_user_artist_ids())
  );

-- Content calendar: all tiers can read; artist can read own
create policy "cc_select"
  on content_calendar for select
  using (
    current_user_tier() in ('label', 'admin', 'manager')
    or artist_id = any(current_user_artist_ids())
  );

create policy "cc_modify"
  on content_calendar for all
  using (
    current_user_tier() in ('label', 'admin', 'manager')
    or artist_id = any(current_user_artist_ids())
  );

-- Promoters: label/admin/manager only (Module 3: PRIVATE)
create policy "promoters_select"
  on promoters for select
  using (current_user_tier() in ('label', 'admin', 'manager'));

-- Submissions: label/admin only
create policy "submissions_select"
  on submissions for select
  using (current_user_tier() in ('label', 'admin'));

-- AI conversations: own conversations only (plus label/admin)
create policy "ai_conv_select"
  on ai_conversations for select
  using (
    current_user_tier() in ('label', 'admin')
    or user_id = (select id from users where auth_id = auth.uid() limit 1)
  );

-- DSP metrics: artist sees own, manager/label sees all
create policy "dsp_metrics_select"
  on dsp_metrics for select
  using (
    current_user_tier() in ('label', 'admin', 'manager')
    or artist_id = any(current_user_artist_ids())
  );


-- ═══════════════════════════════════════════════════════════
-- SECTION 13: SEED DATA — DSR TEST INSTANCE
-- ═══════════════════════════════════════════════════════════
-- Seed data for the first real deployment (DirtySnatcha Records).
-- Run AFTER setting up auth users for Thomas, Lee, and team.

-- Artists
insert into artists (slug, display_name, legal_name, label, genre, subgenre,
  color_hex, emoji, is_label, timezone,
  instagram_handle, spotify_artist_uri, meta_pixel_id, ga4_measurement_id,
  instagram_followers, spotify_followers, spotify_monthly_listeners, spotify_popularity)
values
  ('dsr_label',    'DirtySnatcha Records', null, 'DirtySnatcha Records',
   'Dubstep', 'Riddim', '#8b5cf6', '🏴',
   true, 'ET', 'dirtysnatcharecords', null, null, null,
   null, null, null, null),

  ('dirtysnatcha', 'DirtySnatcha', 'Lee Bray', 'DirtySnatcha Records',
   'Dubstep', 'Riddim', '#a855f7', '🎧',
   false, 'ET', 'dirtysnatcha', 'spotify:artist:4xT9G9HMVL81VZf2w7mNGv',
   '701854965266742', 'G-PPES7BDNF3',
   11000, 4500, 8500, 28),

  ('whoisee',      'WHOiSEE', null, 'DirtySnatcha Records',
   'Dubstep', 'Riddim', '#3b82f6', '👁',
   false, 'ET', 'whoisee_music', null, null, null,
   null, null, null, null),

  ('darkmatter',   'Dark Matter', null, 'DirtySnatcha Records',
   'Dubstep', 'Riddim', '#ef4444', '⚫',
   false, 'ET', null, null, null, null,
   null, null, null, null),

  ('kotrax',       'Kotrax', null, 'DirtySnatcha Records',
   'Dubstep', 'Riddim', '#f59e0b', '⚡',
   false, 'CT', null, null, null, null,
   null, null, null, null);

-- ─────────────────────────────────────────────────────────
-- End of DSR Platform Supabase Schema v1.0
-- Next: Run supabase_client.js to connect the React platform
-- ─────────────────────────────────────────────────────────
