# Implementation Guide: Lincoln, NE - Final Push Campaign

**OBJECTIVE:** Immediately launch the "Final Push" ad campaign for the DirtySnatcha show in Lincoln, NE on Feb 27, 2026.

This is a step-by-step guide for an AI agent (like Claude) to execute this task using the provided codebase, skills, and MCP tools.

---

### Step 1: Ingest Context & Verify Data

**Action:** Before doing anything else, read and fully understand the following files to load the project state:
1.  `handoff_context.md` (The master brief you are currently reading from)
2.  `data/parsed_tour_data.md` (To understand the full tour schedule and finances)
3.  `data/MyShowsapp.xlsx` (The raw source of truth for offer details)

**Verification:** Confirm that you see the Lincoln, NE show scheduled for `2026-02-27` and that it is in the `FINAL PUSH` phase.

### Step 2: Load Specific Show Data

**Action:** The `codebase/project_context/show_data/` directory contains a JSON file for every show. Load the data for the Lincoln show.

```bash
# Read the specific JSON file for the Lincoln show
cat codebase/project_context/show_data/2026-02-27_Lincoln_NE.json
```

**Expected Output:** A JSON object containing all known details for the Lincoln show (venue, promoter, deal terms, etc.).

### Step 3: Define Campaign Parameters Using Skills

These steps use the Python scripts in `codebase/tour_marketing_agent/skills/` to generate the specific inputs needed for the ad campaign.

**3.1. Calculate Budget**

**Action:** Run the `calculate_budget_allocation.py` skill to determine the exact dollar amount for the "Final Push" phase (50% of the total marketing budget for this show).

```bash
# The script will need to be adapted to take the show's JSON as input
# For now, assume it reads the file and prints the budget
python3.11 codebase/tour_marketing_agent/skills/calculate_budget_allocation.py --show-file codebase/project_context/show_data/2026-02-27_Lincoln_NE.json --phase "Final Push"
```

**Expected Output:** A single number, e.g., `$250.00`.

**3.2. Define Geo-Targeting**

**Action:** Run the `create_geo_targeting.py` skill to get the precise audience targeting for Meta Ads.

```bash
python3.11 codebase/tour_marketing_agent/skills/create_geo_targeting.py --city "Lincoln" --state "NE"
```

**Expected Output:** A JSON object specifying the geographic targeting parameters for the Meta API (e.g., `{ "cities": [{"name": "Lincoln", "radius": 25, "unit": "mile"}] }`).

**3.3. Generate Ad Copy**

**Action:** Run the `generate_ad_copy.py` skill to create compelling, urgent copy for the Final Push.

```bash
python3.11 codebase/tour_marketing_agent/skills/generate_ad_copy.py --artist "DirtySnatcha" --venue "Cosmic Eye" --date "Feb 27" --phase "Final Push"
```

**Expected Output:** A JSON object with ad copy variations (e.g., `{ "headline": "LAST CHANCE: DirtySnatcha in Lincoln TOMORROW!", "body": "Final tickets are moving fast for DirtySnatcha at Cosmic Eye. Don't miss out! Grab yours now before it's too late." }`).

### Step 4: Execute Campaign via MCP Tool

**Action:** Use the `manus-mcp-cli` to call the `meta-marketing` tool and create the campaign. This command will synthesize all the information from the previous steps.

**IMPORTANT:** The exact tool name and parameters are an assumption based on the project brief. You will need to verify the actual tool spec with `manus-mcp-cli tool list --server meta-marketing`.

```bash
# This is a hypothetical command structure. Adapt it to the real tool spec.
manus-mcp-cli tool call create_campaign --server meta-marketing --input '{
  "name": "DirtySnatcha - Lincoln, NE - Final Push",
  "objective": "CONVERSIONS",
  "budget": 250.00,  // From Step 3.1
  "schedule": {
    "start_time": "now",
    "end_time": "2026-02-27T22:00:00-06:00"
  },
  "targeting": { /* From Step 3.2 */ },
  "ad_creative": {
    "copy": { /* From Step 3.3 */ },
    "asset_url": "/path/to/approved/video_ad.mp4" // This would be provided by Agent 3/6
  },
  "tracking": {
    "url_parameters": "utm_source=meta&utm_medium=cpc&utm_campaign=lincoln_finalpush"
  }
}'
```

**Expected Output:** A JSON response from the MCP tool confirming the campaign was created, including a `campaign_id`.

### Step 5: Confirm and Report

**Action:** Once the campaign is successfully launched, report back to the user with a clear confirmation message.

**Message Template:**
"**ACTION COMPLETE: The Final Push campaign for DirtySnatcha in Lincoln, NE is now LIVE.**

-   **Campaign ID:** `[Insert campaign_id from Step 4]`
-   **Budget:** `$250.00`
-   **Targeting:** Lincoln, NE (+25 mi radius)
-   **Ad Copy:** "LAST CHANCE: DirtySnatcha in Lincoln TOMORROW!"

I will monitor performance and provide a report on Cost-Per-Ticket-Sold (CPT) as data becomes available."
