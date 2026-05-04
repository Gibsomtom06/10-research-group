---
name: dsr-tour-marketing
description: "Unified tour marketing execution for DirtySnatcha Records — implements the 4-phase campaign system, manages Meta Ads via MCP, integrates Virgin Music Smart Audience logic, and tracks Cost Per Ticket (CPT). Use for: launching show marketing campaigns, calculating budget allocations, generating ad copy, setting geo-targeting, and analyzing performance through the Meta Ads Analyzer."
---

# DSR Tour Marketing Execution

Orchestrates the 4-phase marketing system for every show on a tour, integrating Artist Bible logic with DirtySnatcha Records specific workflows.

## The 4-Phase System

Every show follows this timeline with budget allocated from the promoter's marketing co-spend.

| Phase | Focus | Budget % | Timing |
|:------|:------|:---------|:-------|
| 1. Announcement | Awareness & Hype | Label Budget | 60+ days out |
| 2. On-Sale | Conversion ("Buy Now") | 40% | 30-60 days out |
| 3. Maintenance | Retargeting & Top-of-Mind | 10% | 14-30 days out |
| 4. Final Push | Urgency & Last Tickets | 50% | 0-14 days out |

## Campaign Setup Workflow

```
1. Detect show entry into marketing window (based on show date)
2. Run Calculate Budget Allocation (SK-14)
   → Input: Total promoter marketing budget (Digital bucket only)
   → Output: Dollar amounts per phase
3. Run Generate Ad Copy (SK-16)
   → Phase-specific templates (Hype vs. Buy Now vs. Last Call)
4. Run Create Geo Targeting (SK-17)
   → 25-50 mile radius around venue city
5. Launch via Meta Marketing MCP
   → Advantage+ Campaign Budget (CBO) enabled
   → Standard conversion objective (Ticket Link)
```

## Smart Audience Integration (Virgin Music)

For key releases or major tour stops, use the Virgin Music Assets platform's Smart Audience logic.

| Ad Type | When to Use | Target |
|:--------|:------------|:-------|
| Fan Engagement | 2-4 weeks pre-release | Streaming behavior-based audience |
| Stream Growth | Release day + 14 days | Direct to DSPs (Spotify/Apple) |

**Workflow:**
1. Log into Virgin Music Assets (manual step via user if needed)
2. Pull Smart Audience segment ID
3. Inject segment ID into Meta Ads targeting via MCP

## Performance Tracking & Analysis

### Cost Per Ticket (CPT)
The North Star Metric. Every campaign must report CPT.
`CPT = Total Ad Spend / Tickets Sold (via tracking link)`

### Meta Ads Analyzer (SK-19)
Mandatory for all performance reports. 
- **NEVER** recommend changes based on average CPA alone.
- **ALWAYS** check for the Breakdown Effect.
- **ALWAYS** evaluate at the Campaign Level (if CBO is on).

## Reporting Schedule

1. **Weekly Status:** All active shows, current phase, spend-to-date, CPT.
2. **Phase Completion:** Wrap-up report after each phase transition.
3. **Post-Show Settlement:** Final marketing performance dossier for Thomas & Leigh.

## Reference Files

- `references/ad_copy_templates.md` — Phase-specific copy for DirtySnatcha brand
- `references/targeting_strategy.md` — Radius and interest-based targeting rules
- `references/cpt_benchmarks.md` — Historical CPT data for different market sizes
