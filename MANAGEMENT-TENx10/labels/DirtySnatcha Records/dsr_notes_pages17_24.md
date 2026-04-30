# DSR System Brief - Pages 17-24 Key Findings

## Database Schema (continued from page 17)

**shows** (continued): deposit_amount, deposit_due_date, final_payment_due_date, venue_support_budget, marketing_budget, other_artists, originated_by (andrew/colton/thomas/direct), promoter_id (FK→promoters), status (pending_thomas/pending_leigh/confirmed/rejected/cancelled), thomas_approved_at, leigh_approved_at, drive_folder_url, travel_party (thomas/andrew/both/neither), hotel_confirmed, ground_confirmed, rider_sent, rider_signed, deposit_received, final_payment_received (all Boolean)

**promoters**: promoter_id (PK), name, company, email, phone, shows_worked (count), average_grade (A/B/C/D/F auto-calculated), access (Private — Thomas + Leigh only)

**promoter_show_grades** (per show per promoter): grade_id (PK), promoter_id (FK→promoters), show_id (FK→shows), paid_deposit_on_time, paid_final_on_time, delivered_marketing, created_fb_event (all Boolean), rider_fulfilled (full/partial/no), turnout_vs_projection (exceeded/met/below/way_below), green_room_delivered, would_rebook (Boolean), notes (Text), calculated_grade (A/B/C/D/F)

**venues**: venue_id (PK), venue_name, city_state, capacity, market_size (tier1/tier2/tier3/small), average_grade (A/B/C/D/F auto-calculated), access (Private — Thomas + Leigh only)

**agent_commissions**: commission_id (PK), show_id (FK→shows), agent (andrew/colton/thomas), commission_rate (Percentage), commission_amount (auto-calculated from guarantee), commission_paid (Boolean), paid_date

## SECTION 7 — Google Drive Structure (page 19-20)
Existing Drive folder: DirtySnatcha_TMTYLT_2026 (ID: 1TQnx4iTH7VgmdSeW9mxloIuLzjMlAgz-)

Folders:
- 00_MASTER_TEMPLATE: Template folder. Contains subfolder tree to clone for each new show.
- 00_LINKED_ASSETS: Inside master template. Linked shared assets.
- 01_TOUR_STOPS: All confirmed show folders live here. Named by date/city/venue.
- Show folder naming: [MM.DD.YYYY] [City, State] - [Venue Name]

Auto-Generated Show Folder Structure:
- 00_CONTROL: Original offer email, negotiation thread, approval record, competition report, deal summary sheet
- 01_CONTRACT_&_PAYMENT: Unsigned contract, signed contract, deposit confirmation, final payment confirmation, settlement sheet
- 02_ADVANCE_&_LOGISTICS: Advance sheet, hotel/ground/rider/tech/green room confirmations (Pending/Confirmed)
- 03_TRAVEL: Travel party, flight monitoring log, booked flight + hotel confirmations
- 04_MARKETING: Dark ad copy, approved content, approved tracks, marketing allocation + spend tracker, FB event page link, post-show marketing report
- 05_TICKETS: Sold ticket tracker, giveaway ticket log
- 06_SHOW_ASSETS: Rider PDF (auto-generated with custom Queen line), approved setlist, press photo + bio

## SECTION 8 — Promo Team System (page 21)

### 8.1 Current Spreadsheet Structure (to be replaced)
- Team Members tab: Name, join date, location, Messenger connected Y/N, Instagram connected Y/N
- FB Task Completion tab: Grid with members as rows, dated campaign tasks as columns. Status legend: completed, not completed, partial, freebie, not active yet, inactive 2+ weeks. 15 pts per share task.
- Top Promoters tab: Manual weekly leaderboard
- Past Members tab: Name, joined date, end date, reason for leaving. Primary exit reason: 2-week inactivity.

### 8.2 Automation Rules
- Inactivity warning: If inactivity_weeks >= 2: auto-send warning message
- Inactivity removal: If no response within 48hrs of warning: move to Past Members, log exit reason
- Points: Auto-fires when task_completion marked verified. Base + effectiveness bonus.
- Weekly leaderboard: Auto-generates every Monday from prior week data. Emails all active members. Pushes to Partner Dashboard.
- Super Fan flag: Member crossing point threshold + Square purchase history → flag to Partner Dashboard for potential upgrade

### 8.3 Beta vs Full Launch OAuth
- Beta requirement: Promo team must connect at least one social account (Meta or TikTok) to verify posts
- Why beta only: Verification needed to build accurate points system before full launch
- Beta disclosure copy: "During beta, we ask you to connect at least one social account so we can verify your posts count toward your points..."
- Full launch: Tracking links + promo codes replace OAuth requirement. Social connection becomes optional for personal stats dashboard only.

## Page 22 - Snapchat
- Identity verification only — no post analytics available via public API. Skip for beta analytics.

## SECTION 9 — Open Items (Must Resolve Before Build) (page 23)
1. Thomas never finished sentence: "After receiving the signed contract..." — critical gap in confirmation workflow chain
2. Rider agent contact block still lists Colton as the agent. Needs update to Andrew as primary, Colton as legacy
3. Local promotion company database — structure and per-market contact info needs to be defined
4. Market size classification system — Tier 1/2/3 or Major/Mid/Small needs explicit definition
5. Demographic data source for ad targeting — pulled automatically from a tool or entered manually?
6. Who is the second partner with access to promoter grading backend alongside Thomas? Confirmed it is Leigh.
7. Post/content calendar sharing permissions — who gets access per show type?
8. Virgin Music Assets — Smart Audience ad workflow needs step-by-step Skill documentation
9. Andrew's full contact info needed for rider update and system records
10. Budget split logic for Fan Engagement vs Stream Growth ads — standard split or per release?

## SECTION 10 — Build Instructions for Manus.ai (page 24)

Opening prompt: "You are the Lead Architect for the DirtySnatcha Records Centralized Portal. This document is your complete system brief. Build this system using the Skills + MCP + Subagents + Project Knowledge architecture framework. Every piece of functionality in this document maps to one of those four layers — do not mix layers. Start with Phase 1: (1) Project Knowledge setup, (2) MCP connections for Gmail and Google Drive, (3) Bookings Agent with the show intake workflow, (4) Tech Agent with the 2/3 voting logic as a hard database constraint. Maintain the DirtySnatcha voice in all user-facing copy — blunt, professional, no corporate fluff. Thomas Nalian is the single human orchestrator — all show decisions route to him. Nothing is confirmed without both Thomas and Leigh signing off."

### Phase 1 Build Order
1. Project Knowledge — paste Section 2 as the Project system prompt
2. Gmail MCP + Google Drive MCP — foundation for all booking workflows
3. Bookings Agent — show intake, routing to Thomas, folder creation on confirmation
4. Tech Agent — 2/3 voting constraint, user record creation, audit logging
5. A&R Agent — submission scoring, dossier, partner dashboard queue
6. Marketing Agent — promo team tracking, points, leaderboard

### Phase 2 Build Order
7. Square MCP — loyalty tracking, user type assignment by purchase history
8. Spotify + SoundCloud + Apple Music Toolbox — A&R scoring data
9. Travel monitoring — Google Flights integration, buy alerts
10. Promo team beta OAuth — Meta + TikTok connection, post verification
11. Smart Audience ad workflow — Virgin Music Assets integration into release calendar Skill
12. Promoter + venue grading backend — private dashboard for Thomas + Leigh

Note: Resolve all 10 open items in Section 9 before starting Phase 2.
