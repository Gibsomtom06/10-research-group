# DSR System Brief - Pages 12-16 Key Findings

## Skill 13 - Show Content Calendar (page 12)
- Output: Posting schedule for specific show, tied to show date, working backwards
- Post types: Show announcement, presale push, on-sale, lineup graphic, week-of hype, day-of, post-show
- Shared with: Thomas, Leigh, Andrew, promoter, assigned promo team members for that market
- Dark ad copy: Draft generated per post type → requires Thomas approval → filed in 04_MARKETING
- Approved tracks: List cleared for promoter to use in their marketing (typically current push single)

## SECTION 5 — Subagents (page 13-14)
Four specialist subagents. All report to Thomas (human orchestrator) or Partner Dashboard.

### SUBAGENT 01 — A&R Agent
- Domain: Submission intake, scoring, partner vote queue management
- Reports to: Partner Dashboard (3 label partners)
- Skills: Score A&R Submission, Assign User Profile Type
- MCP: Spotify API, SoundCloud API, Apple Music Toolbox, Google Trends, Square MCP
- Key rule: Does NOT approve or reject. Compiles dossier only. 2/3 vote decides.
- Voting window: 72 hours from dossier push. No 2/3 decision → auto-escalate to Tie/Stalled queue
- Tone: Direct and data-driven. No filler.

### SUBAGENT 02 — Bookings Agent
- Domain: Show offer intake, routing, negotiation trail, confirmation workflow, advance tracking
- Reports to: Thomas Nalian exclusively
- Skills: Competition Report, Create Show Folder, Generate Rider PDF, Advance Checklist Tracker, Travel Monitoring, Grade Promoter, Grade Venue, Show Content Calendar
- MCP: Gmail MCP, Google Drive MCP, Google Calendar MCP, Bandsintown/Songkick, Google Flights
- Intake rule: ALL offers route to Thomas regardless of who received them
- Artist approval: Thomas approves first, then forwards to Leigh for sign-off. Leigh has 48hr window. No response = second ping. No confirmation without Leigh's sign-off.
- Agent tracking: Every offer tagged with originating agent — Andrew / Colton / Thomas / Direct — for commission tracking
- Tone: Professional and direct. Industry people hate wasted time.

### SUBAGENT 03 — Marketing Agent
- Domain: Promo team management, release campaigns, UGC verification, Smart Audience ad coordination
- Reports to: Partner Dashboard
- Skills: Promo Team Points Calculation, Weekly Promo Leaderboard, Assign User Profile Type, Build Release Marketing Calendar, Show Content Calendar
- MCP: Meta CAPI, TikTok API (beta), Square MCP, Virgin Music Assets (manual workflow)
- Beta OAuth rule: Promo team beta requires social account connection (Meta or TikTok) to verify posts. Full launch uses tracking links + promo codes instead.
- Post verification: Confirm post used DSR audio/content. Pull reach + impressions + plays + shares. Award points via Skill.
- Tone: Hype but structured. Talk to promo team like they are part of the crew.

### SUBAGENT 04 — Tech Agent
- Domain: API health, database integrity, token storage, voting logic enforcement, user record management
- Reports to: Partner Dashboard
- Skills: All Skills — maintains the plumbing every other agent depends on
- MCP: All MCP connections — monitors health of every integration
- 2/3 vote enforcement: Hard database constraint — no contract record moves to Approved without exactly 2 or 3 partner votes marked Yes. Not a UI rule — enforced at database level.
- Token storage: OAuth tokens from social logins encrypted and stored per user per platform
- Audit log: Every automated action logged with timestamp and user ID
- Alert logic: Any MCP connection drop or unexpected null values → immediate alert to Partner Dashboard
- Tone: Precise and zero-fluff. Documenting systems, not writing poetry.

## SECTION 6 — Database Schema (pages 15-16)

### 6.1 Core Tables

**users**: user_id (PK), name, email (dedup key), join_date, location, profile_types (array: artist/consumer/concert_goer/downloader/promo_member), status (active/inactive/past_member), exit_date, exit_reason

**promo_members** (extends users): user_id (FK→users), messenger_connected, instagram_connected, tiktok_connected, meta_connected (all Boolean), total_points, weekly_points (resets Monday), streak_weeks, inactivity_weeks

**tasks**: task_id (PK), task_name, task_date, task_type (announcement/pre_save/release_day/freebie/tiktok_entry/tour), release_id (FK), base_points (e.g. 15), bonus_points (TikTok/high-effort)

**task_completions**: completion_id (PK), user_id (FK→users), task_id (FK→tasks), status (completed/not_completed/partial/freebie/not_active_yet), post_url, submitted_at, verified_at, points_awarded

**post_analytics**: analytics_id (PK), completion_id (FK→task_completions), platform (instagram/tiktok/facebook/snapchat), impressions, reach, plays, shares, clicks (to DSR tracking link), presaves_attributed, pulled_at

**shows**: show_id (PK), show_date, gig_type (headline/support/festival/other), venue_name, venue_city_state, venue_capacity, guarantee (Decimal)
