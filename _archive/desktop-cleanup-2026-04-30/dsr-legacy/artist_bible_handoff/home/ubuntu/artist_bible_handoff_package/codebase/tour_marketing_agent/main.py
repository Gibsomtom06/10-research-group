# Tour Marketing Campaign Agent — Main Orchestrator
# Artist Bible Platform v0.1

"""
ARCHITECTURE OVERVIEW
=====================
This agent orchestrates a 4-phase marketing campaign system for every show on a tour.

SKILLS (internal know-how, loaded on demand):
  - calculate_budget_allocation   -> Math for phase-based budget splits
  - generate_campaign_phases      -> Timeline generation per show
  - generate_ad_copy              -> Phase-appropriate ad copy templates
  - create_geo_targeting          -> Audience targeting by city/radius
  - build_show_folder_structure   -> Per-show file organization
  - meta-ads-analyzer             -> Interprets Meta Ads performance data correctly
                                    (Breakdown Effect, learning phase, bid strategies, etc.)

MCP TOOLS (external connections, called at runtime):
  - meta-marketing  -> Launch/monitor/report on Facebook & Instagram ad campaigns
  - gmail           -> Read booking offers, send promoter reports
  - google-calendar -> Create/update tour calendar events

PROJECT CONTEXT (per-artist data, injected at runtime):
  - artist_profile   -> Name, genre, integration credentials
  - show_data        -> Individual JSON files per show (offer, promoter, phase, etc.)
  - campaign_history -> Past campaign performance for benchmarking
"""

import json
import os
import datetime

# ---------------------------------------------------------------------------
# SYSTEM PROMPT (under 600 tokens as specified in the architecture brief)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are the Tour Marketing Campaign Agent for the Artist Bible platform.

ROLE: Orchestrate a 4-phase marketing campaign for every show on a tour.

PHASES & BUDGET SPLIT (of promoter marketing budget):
1. Announcement - Awareness/hype. Budget: artist's overall marketing budget (NOT per-show).
2. On-Sale - "Buy now" CTA. Budget: 40% of promoter co-spend.
3. Maintenance - Retargeting/top-of-mind. Budget: 10%.
4. Final Push - Urgency/last tickets. Budget: 50%.

MARKETING BUDGET RULES:
Every offer must itemize marketing into three buckets:
- Paid Digital Ads (Meta, TikTok, Google) - trackable
- Design & Creative (flyers, posters, digital assets) - one-time
- Street Team / Physical (flyering, postering) - hard to attribute
Flag any offer missing this breakdown for negotiation.

REPORTING:
- Track cost-per-ticket-sold for every campaign.
- Provide transparent spend reports for both artist/manager AND promoter.
- When analyzing Meta Ads data, ALWAYS use the meta-ads-analyzer skill to interpret
  results correctly. Never recommend changes based on average CPA alone.

SKILLS: Load on demand. Do not assume - call the skill.
MCP TOOLS: Use meta-marketing for ad ops, gmail for comms, google-calendar for scheduling.
CONTEXT: Artist profile and show data are injected per session."""


# ---------------------------------------------------------------------------
# AGENT CLASS
# ---------------------------------------------------------------------------
class TourMarketingAgent:
    def __init__(self, artist_profile_path, show_data_dir):
        self.artist_profile = self._load_json(artist_profile_path)
        self.shows = self._load_all_shows(show_data_dir)
        self.today = datetime.date.today()

    # --- Data Loading ---
    def _load_json(self, path):
        with open(path, "r") as f:
            return json.load(f)

    def _load_all_shows(self, directory):
        shows = []
        for filename in sorted(os.listdir(directory)):
            if filename.endswith(".json"):
                shows.append(self._load_json(os.path.join(directory, filename)))
        return shows

    # --- Phase Detection ---
    def determine_phase(self, show_date_str):
        """Determine which campaign phase a show is currently in."""
        show_date = datetime.datetime.strptime(show_date_str, "%m/%d/%Y").date()
        days_out = (show_date - self.today).days

        if days_out <= 0:
            return "COMPLETED"
        elif days_out <= 14:
            return "Final Push"
        elif days_out <= 30:
            return "Maintenance"
        elif days_out <= 60:
            return "On-Sale"
        else:
            return "Announcement"

    # --- Tour Status Report ---
    def generate_tour_status(self):
        """Generate a status report for all shows on the tour."""
        report = []
        for show in self.shows:
            phase = self.determine_phase(show["date"])
            report.append({
                "show": f"{show['city']}, {show['state']}",
                "date": show["date"],
                "offer": show["offer"],
                "current_phase": phase,
                "deal_type": show["deal_type"],
                "hgr": show["hgr"],
            })
        return report

    # --- Entry Point ---
    def run(self):
        """Main agent loop - assess tour, prioritize actions, execute."""
        print(f"Tour Marketing Agent initialized for: {self.artist_profile['name']}")
        print(f"Today's date: {self.today}")
        print(f"Total shows loaded: {len(self.shows)}")
        print()

        status = self.generate_tour_status()
        for s in status:
            print(f"  [{s['current_phase']:>13}]  {s['date']}  {s['show']:<25}  ${s['offer']:,.0f}  {s['deal_type']}")

        return status


# ---------------------------------------------------------------------------
# RUN
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    ARTIST_PROFILE = "/home/ubuntu/artist_bible_platform/project_context/artist_profile/dirtysnatcha.json"
    SHOW_DATA_DIR = "/home/ubuntu/artist_bible_platform/project_context/show_data"

    agent = TourMarketingAgent(ARTIST_PROFILE, SHOW_DATA_DIR)
    agent.run()
