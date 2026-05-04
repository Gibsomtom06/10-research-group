# Artist Bible Platform — Handoff Package

**Created:** 2026-02-26
**Purpose:** Complete project transfer to Claude for continued development with higher reasoning.

---

## Quick Start

1. Open `PASTE_THIS_INTO_CLAUDE.md`
2. Copy everything below the line in that file
3. Start a new Claude conversation (use the highest reasoning model available)
4. Paste the copied text as your first message
5. Attach the entire `artist_bible_handoff_package.zip` to the same message
6. Claude will read everything and confirm understanding before proceeding

---

## Package Contents

```
artist_bible_handoff_package/
│
├── README.md                          ← You are here
├── PASTE_THIS_INTO_CLAUDE.md          ← Copy-paste starter prompt for Claude
├── handoff_context.md                 ← Master project brief (7 agents, architecture, pipeline)
├── implementation_guide.md            ← Step-by-step: Launch Lincoln Final Push campaign
├── system_guide.md                    ← Plain-language explanation of agents/skills/MCP
├── roadmap_update_1.md                ← Phased build roadmap
│
├── data/
│   ├── parsed_tour_data.md            ← Full parsed tour schedule (17 shows)
│   ├── example_analysis_complete.md   ← Analysis of Crankdat examples (quality standard)
│   └── MyShowsapp.xlsx                ← Raw offer data from booking platform
│
├── codebase/
│   ├── create_show_data.py            ← Script that generates show JSON files
│   ├── project_context/
│   │   ├── artist_profile/
│   │   │   └── dirtysnatcha.json      ← Artist profile data
│   │   └── show_data/
│   │       ├── 2026-02-27_Lincoln_NE.json
│   │       ├── 2026-02-28_Minneapolis_MN.json
│   │       ├── ... (one JSON per show)
│   │       └── 2026-04-12_Tampa_FL.json
│   └── tour_marketing_agent/
│       ├── main.py                    ← Agent 1 main file (scaffolded)
│       └── skills/
│           ├── calculate_budget_allocation.py
│           ├── generate_campaign_phases.py
│           ├── generate_ad_copy.py
│           ├── create_geo_targeting.py
│           └── build_show_folder_structure.py
│
├── skills/
│   └── meta-ads-analyzer/
│       ├── SKILL.md                   ← Skill instructions
│       └── references/
│           ├── breakdown_effect.md
│           ├── core_concepts.md
│           ├── bid_strategies.md
│           ├── campaign_budget_optimization.md
│           ├── creative_fatigue.md
│           ├── frequency_management.md
│           ├── ios_privacy.md
│           ├── learning_phase.md
│           └── scaling_strategies.md
│
├── examples/
│   ├── Crankdat-AtlantaMarketingLetter(1).pdf   ← Gold standard marketing letter
│   └── TMTYLMarketingEmail.docx                  ← Example promoter email (input format)
│
└── presentation/
    ├── slide_content.md               ← Slide outline/content script
    └── slide_*.html                   ← 18 HTML slides for system architecture deck
```

---

## What Has Been Built

| Component | Status | Notes |
|:---|:---|:---|
| 7-Agent Architecture | **Designed** | All agents defined, roles clear, pipeline mapped |
| Tour Marketing Agent (Agent 1) | **Scaffolded** | Python files created, skills written, needs execution logic |
| Meta Ads Analyzer Skill | **Complete** | 9 reference docs, ready to use |
| Show Data (17 shows) | **Parsed** | Individual JSON files for each show |
| Artist Profile | **Created** | DirtySnatcha profile with genre, social links |
| System Architecture Presentation | **Complete** | 18-slide HTML deck |
| Agents 2-7 | **Designed only** | Architecture defined, not yet coded |

## What Needs To Be Built

| Priority | Task | Blocked By |
|:---|:---|:---|
| **URGENT** | Launch Lincoln Final Push campaign | Nothing — ready to execute |
| **HIGH** | Make Agent 1 skills functional (not just scaffolded) | Nothing |
| **HIGH** | Connect Google Analytics API | API credentials needed |
| **MEDIUM** | Build Agent 5 (Show Onboarding) | Agent 1 completion |
| **MEDIUM** | Connect TikTok, X, Snapchat APIs | API credentials needed |
| **LOW** | Build Agents 2-7 | Follows build order in roadmap |
