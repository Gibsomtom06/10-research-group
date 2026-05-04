# DirtySnatcha Records — Unified System Summary

This document summarizes the integration of the **DSR Centralized Portal** and the **Artist Bible Platform** into a single, cohesive operating system for DirtySnatcha Records.

---

## System Integration Overview

The unified system now manages the entire lifecycle of DirtySnatcha Records' operations:

1. **A&R Pipeline:** Demo intake, automated scoring (Quality/Reach/Fit), partner vote queue (2/3 majority), and artist onboarding.
2. **Booking Workflow:** Show offer intake (hard-gate validation), competition reports, Thomas & Leigh approval chain, contract generation, and financial tracking.
3. **Show Operations:** Google Drive folder automation, rider generation (with custom Queen of England demand), advance checklist tracking, and travel monitoring.
4. **Tour Marketing:** 4-phase campaign system (Announcement, On-Sale, Maintenance, Final Push), budget allocation, ad copy generation, and CPT tracking.
5. **Promo Team:** Member onboarding, task verification, points calculation, and weekly leaderboards.
6. **User Portal:** Integrated user profiles (Fan, Submitting Artist, Signed Artist, Promo Member, Industry Contact) for dirtysnatcharecords.com.

---

## Unified Agent Map

The system is powered by 6 specialist subagents, all sharing a unified **Project Knowledge** base.

| Subagent | Role | Key Skill |
|:---------|:-----|:----------|
| **Agent 1: A&R** | Music intake & scoring | `dsr-ar-submission` |
| **Agent 2: Bookings** | Offers, contracts, & financials | `dsr-booking-workflow` |
| **Agent 3: Tour Marketing** | Campaign execution & CPT | `dsr-tour-marketing` |
| **Agent 4: Creative** | Assets & content calendars | `dsr-show-operations` |
| **Agent 5: Promo** | Street team & leaderboards | `dsr-promo-team` |
| **Agent 6: Tech** | System integrity & voting logic | `tech-agent-logic` |

---

## Core Components Delivered

### 1. Unified Skill Library
Five new enterprise-grade skills created and validated:
- `dsr-booking-workflow`
- `dsr-ar-submission`
- `dsr-promo-team`
- `dsr-tour-marketing`
- `dsr-show-operations`

### 2. Automation Codebase
Thirteen Python scripts for automated scoring, budget math, content generation, and grading:
- `ar_scoring.py`, `promo_points.py`, `show_competition.py`, `show_onboarding.py`, `show_status.py`, `show_grading.py`, `show_content.py`, `show_budget.py`, `show_ad_copy.py`, `show_geo.py`, `show_cpt.py`, `show_support.py`, `show_commission.py`

### 3. Persistent Project Knowledge
A comprehensive `DSR_PROJECT_KNOWLEDGE.md` file that acts as the "brain" for all agents, containing brand voice, key people, label logic, rider standards, and approval chains.

### 4. System Architecture
A master `SYSTEM_ARCHITECTURE.md` mapping all agents, skills, MCP connections, and database schemas into a unified framework.

---

## Next Steps for Execution

1. **Lincoln Final Push:** Agent 3 is ready to execute the final push for the Lincoln, NE show using the `dsr-tour-marketing` skill.
2. **A&R Queue:** Load pending demos into the `dsr-ar-submission` pipeline for partner voting.
3. **Promo Team Beta:** Invite the first 10 members to test the `dsr-promo-team` verification workflow.
4. **Wix Integration:** Connect the Wix MCP to the `dirtysnatcharecords.com` portal for live user management.
