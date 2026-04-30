# Skills Audit
**Date:** April 30, 2026  
**Scope:** All SKILL.md files across 10 Research Group OneDrive + tenx10 repos

---

## Summary

**Total files found:** 24  
**Real skills (canonical):** 10  
**Node modules (non-canonical):** 4  
**Duplicates (orphaned/archive):** 10  

---

## Real Skills (Production / Active)

| Path | Name | Description |
|------|------|-------------|
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/SKILL.md` | skill-creator | Guide for creating or updating skills that extend Manus via specialized knowledge, workflows, or tool integrations |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/skills/dsr-ar-submission/SKILL.md` | dsr-ar-submission | A&R submission pipeline — handles demo intake, automated scoring, dossier generation, partner voting, and user profile assignment |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/skills/dsr-booking-workflow/SKILL.md` | dsr-booking-workflow | Complete show booking workflow — from offer intake through confirmation, folder creation, rider generation, advance tracking, settlement |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/skills/dsr-promo-team/SKILL.md` | dsr-promo-team | Promo team management — handles member onboarding, task assignment, UGC verification, points calculation, leaderboard generation, rewards |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/skills/dsr-show-operations/SKILL.md` | dsr-show-operations | Show operations management — handles show content calendars, release marketing calendars, tour support grid, asset management |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/skills/dsr-tour-marketing/SKILL.md` | dsr-tour-marketing | Unified tour marketing execution — implements 4-phase campaign system, manages Meta Ads, Virgin Music Smart Audience logic, tracks CPT |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/meta-ads-analyzer/SKILL.md` | meta-ads-analyzer | Meta Ads Analysis & Diagnosis — provides expert-level analysis for Meta Ads campaigns, root cause identification, actionable recommendations |
| `products/tenx10-platform/.claude/skills/edm-booking-agent/SKILL.md` | edm-booking-agent | Elite EDM & Dubstep Booking Agent persona — tour routing, festival pitching, DJ deal negotiation, streaming/chart data for booking |
| `products/tenx10-platform/.claude/skills/model_router/SKILL.md` | model_router | Pick the cheapest sufficient Claude model for a given task — routes to Opus/Sonnet/Haiku based on task complexity |
| `products/tenx10-platform/.claude/skills/meta-ads-analyzer/SKILL.md` | meta-ads-analyzer | Meta Ads Analysis & Diagnosis (placeholder) — awaiting handoff package extraction |

---

## Node Modules (Non-Canonical)

| Path | Name | Description |
|------|------|-------------|
| `products/digital-booking-agent/workers/node_modules/dotenv/skills/dotenv/SKILL.md` | (dotenv lib) | External dependency — not project skill |
| `products/digital-booking-agent/workers/node_modules/dotenv/skills/dotenvx/SKILL.md` | (dotenvx lib) | External dependency — not project skill |
| `products/tenx10-platform/node_modules/dotenv/skills/dotenv/SKILL.md` | (dotenv lib) | External dependency — not project skill |
| `products/tenx10-platform/node_modules/dotenv/skills/dotenvx/SKILL.md` | (dotenvx lib) | External dependency — not project skill |

**Note:** These are included in gitignore and should not be committed.

---

## Archive / Orphaned / Stale Duplicates

| Path | Status | Notes |
|------|--------|-------|
| `_archive/desktop-cleanup-2026-04-30/ubuntu/artist_bible_handoff_package/codebase/tour_marketing_agent/skills/meta-ads-analyzer/SKILL.md` | Orphaned | From stale handoff package |
| `_archive/desktop-cleanup-2026-04-30/ubuntu/artist_bible_handoff_package/skills/meta-ads-analyzer/SKILL.md` | Orphaned | From stale handoff package |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/codebase/tour_marketing_agent/skills/meta-ads-analyzer/SKILL.md` | Orphaned | From stale codebase export |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/skills/meta-ads-analyzer/SKILL.md` | Orphaned | Superseded by canonical at `meta-ads-analyzer/SKILL.md` |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/artist_bible_handoff/artist_bible_handoff_package/skills/meta-ads-analyzer/SKILL.md` | Orphaned | From handoff package |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/artist_bible_handoff/artist_bible_handoff_package/codebase/tour_marketing_agent/skills/meta-ads-analyzer/SKILL.md` | Orphaned | From handoff package |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/artist_bible_handoff/home/ubuntu/artist_bible_handoff_package/skills/meta-ads-analyzer/SKILL.md` | Orphaned | From handoff package |
| `MANAGEMENT-TENx10/labels/DirtySnatcha Records/artist_bible_handoff/home/ubuntu/artist_bible_handoff_package/codebase/tour_marketing_agent/skills/meta-ads-analyzer/SKILL.md` | Orphaned | From handoff package |
| `products/tenx10-platform/node_modules/playwright-core/lib/tools/cli-client/skill/SKILL.md` | Non-canonical | External dependency (playwright) |
| `products/tenx10-platform/node_modules/playwright-core/lib/tools/trace/SKILL.md` | Non-canonical | External dependency (playwright) |

---

## Recommendations

1. **Delete all archive + orphaned copies** — keep only the canonical location per skill
2. **Verify meta-ads-analyzer placeholder** — extract from handoff package or confirm it's truly not needed
3. **Document skill inventory** — link each skill to the .claude/settings.json allowlist or skill registry

---

*Audit completed by Claude Code on 2026-04-30*
