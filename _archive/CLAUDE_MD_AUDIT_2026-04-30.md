# CLAUDE.md Audit
**Date:** April 30, 2026  
**Scope:** All CLAUDE.md files across 10 Research Group + tenx10 repos

---

## Summary

**Total files found:** 5  
**Active (canonical):** 3  
**Archive (stale):** 1  
**Duplicate scope:** 1  

---

## CLAUDE.md Inventory

| Path | Scope | Purpose | Status |
|------|-------|---------|--------|
| `C:\Users\slash\OneDrive\10 Research Group\.claude\CLAUDE.md` | Umbrella (ORG-LEVEL) | Canonical 10 Research Group operating rules — applies to EVERY project | ACTIVE |
| `C:\Users\slash\OneDrive\10 Research Group\CLAUDE.md` | Umbrella (ORG-LEVEL) | Portfolio overview, storage structure, domain distinction, voice standards | ACTIVE |
| `C:\Users\slash\Projects\tenx10\CLAUDE.md` | Platform (PROJECT-SCOPED) | TENx10 platform-specific rules, tech stack, auth, Xai agent, DSR reference data, 8-agent architecture | ACTIVE |
| `C:\Users\slash\OneDrive\10 Research Group\products\digital-booking-agent\CLAUDE.md` | Project (DBA-SCOPED) | Digital Booking Agent project memory, stack, repo layout, session state pointer | ACTIVE |
| `C:\Users\slash\OneDrive\10 Research Group\_archive\stale-clones\tenx10-cc65688-stale-clone\CLAUDE.md` | Archive (STALE) | Old tenx10 clone from consolidation pass — superseded by `C:\Users\slash\Projects\tenx10\CLAUDE.md` | ARCHIVE |

---

## Rule Conflict Analysis

### Canonical vs. Project-Scoped Rule Hierarchy

**NO CONFLICTS DETECTED.** The three active CLAUDE.md files operate at distinct scopes with clear ownership:

1. **ORG-LEVEL (10 Research Group/.claude + 10 Research Group/):**
   - Operating principle: Claude tokens are scarce → delegation tree (Gemini vs. Ollama vs. Claude)
   - Portfolio structure: DirtySnatcha Records (artist + label), Management, system_steward
   - Storage canon: One real home per file, derived views via Supabase
   - Voice standards: Lower-case, casual, no corporate jargon

2. **PLATFORM-LEVEL (tenx10/):**
   - Tech stack: Next.js 14, TypeScript, Supabase, Anthropic Claude + Gemini API
   - Permission hierarchy: 4-tier (Artist / Manager / Label / Label_Manager)
   - Database: 27-table schema with RLS enforcement
   - Agent architecture: Orchestrator + 6-tier specialist team (Booking, CMO, Social, Manager, Release, Promo)
   - Critical rule: Never expose label financials to artist tier

3. **PROJECT-LEVEL (digital-booking-agent/):**
   - Stack: Next.js 15, React 19, Supabase, Python agents, PDF-lib
   - Focus: Autonomous booking system end-to-end
   - Licensor identity: "Leigh Bray aka DirtySnatcha" (fixed 2026-04-22)

### Contradictions: NONE

The scopes are **non-overlapping**:
- Org rules (how Claude works) don't conflict with platform rules (tech stack, auth, permissions)
- Platform rules (TENx10 multi-tenant, 4-tier RLS) don't conflict with DBA project rules (single-tenant booking automation)
- Each level inherits from parent (DBA inherits org tokenomics, both inherit org voice standards)

---

## Scope Designations

- **Umbrella (ORG):** Rules for every Claude session in 10 Research Group
- **Platform (SCOPED):** Rules for the TENx10 SaaS product
- **Project (SCOPED):** Rules for individual products (DBA, system_steward, etc.)

---

## Stale Clone Note

Archive path `_archive/stale-clones/tenx10-cc65688-stale-clone/CLAUDE.md` is superseded. **Safe to delete.**

---

## Recommendations

1. **Canonical locations confirmed** — no consolidation needed
2. **Hierarchy is clear** — org > platform > project, no conflicts
3. **Archive the stale clone** — already in _archive/, mark for eventual deletion

---

*Audit completed by Claude Code on 2026-04-30*
