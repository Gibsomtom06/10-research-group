# Analytics-MCP Everywhere — STUB / IN FUNNEL

**Date:** 2026-04-30 night
**Status:** Stub captured. Pursue/kill question OPEN. Light installation work could happen anytime; full Xai-integration is BACKBURNERED until a recurring weekly GA query is named.
**Resume condition:** Thomas names a specific recurring GA question that today is hard/expensive to answer.

---

## What Thomas dropped

> https://github.com/googleanalytics/google-analytics-mcp
> "figure out how we use analytics with everything"

The reference is Google's OFFICIAL Google Analytics MCP server. Lets a Claude / Claude Code / Xai agent query GA4 data via Model Context Protocol. Documented at the GitHub link above; not yet installed in this umbrella.

---

## Two layers, like always

### Layer 1 — install + ad-hoc query (light, ship-anytime)

| Task | What | Time |
|---|---|---|
| Audit which properties already have GA4 | Per CLAUDE.md DSR is `G-PPES7BDNF3`. Unknown for MHP, faceless channel future, agency landing pages, TENx10 platform itself, system-steward dashboards | 30 min |
| Install google-analytics-mcp locally | `git clone` + auth setup with GA service account; configure for Claude Code MCP server list | 30 min |
| Smoke-test queries | "How many sessions did dsr.com get last 7d?" "Top 5 traffic sources for tenx10.co?" | 15 min |
| Document MCP config in BRAIN.md and reference docs | So future sessions know it exists and how to use it | 10 min |

This Layer 1 is reasonable IF Thomas wants ad-hoc analytics queries from inside Claude Code.

### Layer 2 — Xai integration (BACKBURNERED)

Wire GA-via-MCP into Xai's daily-briefing pipeline so morning briefings include traffic + conversion data alongside DSP + booking. Requires:
- Service-account credentials accessible from the platform deployment
- A new context-injection function similar to `buildManagerContext()` for analytics
- Per-property scoping so each manager only sees their own properties' data
- Caching layer (GA queries aren't free — rate-limited + slow)

This is a real integration project, not a stub. Defer until Layer 1 proves out the recurring-query value.

---

## Strategist's pushback

**Two assumptions:**
1. **All properties already have GA4 installed and emitting events.** Per CLAUDE.md, DSR has `G-PPES7BDNF3` and Meta pixel `701854965266742`. Unknown for: MHP storefront, agency landing pages (don't exist yet), faceless music channel (doesn't exist yet), system-steward dashboards. **Answer this before any install work.**
2. **MCP integration adds enough value over the GA dashboard to justify install.** True only if Xai / Claude / Thomas WILL be querying GA data routinely. If Thomas would just open analytics.google.com anyway, MCP is overkill.

**Failure mode:** install MCP, connect 5 properties, never actually query from Xai routinely. Becomes connected-but-unused infrastructure. Same anti-pattern as half the agents in the legacy `EMPLOYEE_DIRECTORY.md` — connected but unused.

**Pursue/kill question:**

> Name ONE recurring weekly question about analytics that today is hard or expensive to answer manually.
>
> Examples that WOULD justify Layer 2:
> - "Is dsr.com merch traffic actually converting, or are people bouncing on the product page?"
> - "What % of TENx10 platform signups came from organic vs ads vs referrals last month?"
> - "Across all 20 agency client landing pages, which 3 have the worst CPC-to-conversion ratio?"
>
> Examples that would NOT (Layer 1 ad-hoc is enough):
> - "I just want to see GA data sometimes." (Open the dashboard.)
> - "It would be cool if Xai had analytics." (Coolness is not unblocking.)
> - "Other agencies do this." (So what? Validate the loop yourself.)

Until Thomas names a question, Layer 2 is BACKBURNERED. Layer 1 install is fine to do anytime if the property audit confirms there's data worth querying.

---

## Existing portfolio connections to map

| Asset | Connection |
|---|---|
| **DSR site** | Has GA4 `G-PPES7BDNF3` per CLAUDE.md |
| **TENx10 platform** | tenx10.co — GA install status: needs verification |
| **MHP storefront** (dirtysnatcharecords.com/merch) | GA install status: needs verification |
| **Faceless music channel future** | YouTube has its own analytics; GA only if there's a landing page |
| **Gary Vee agency client sites** | Each has its own GA; MCP would let one Claude session manage 20 client properties — strong fit for the agency model |
| **Module 25 catalog evaluator** | Could ingest GA traffic-source data to compute true funnel ROI per track (currently DSP-only) |
| **Label catalog evaluator stub** | Same — Cross-Catalog DSP Performance + analytics traffic data combined |
| **Unified Observability contract** (BRAIN.md) | GA-via-MCP fits the "single observability surface" pattern. Cross-cutting infra. |

---

## Recommended order if Thomas pursues

1. Property audit (which properties have GA4? Which need it installed?). 30 min.
2. Layer 1 install (clone the MCP, auth, smoke test). 1 hour.
3. Document in `BRAIN.md` "Single Sources of Truth" table.
4. Use ad-hoc for 30 days. Track which questions you actually ask.
5. If 3+ recurring questions emerge → Layer 2 integration into Xai briefings.
6. If <3 recurring questions → Layer 1 is the destination, don't over-build.

---

## What to NOT do tonight

- No MCP install
- No service-account creation
- No Xai integration
- No "let me just hook up DSR real quick" — pursue/kill answer first

---

*Stub spec v1 — 2026-04-30. Update when Thomas names a recurring weekly question OR runs property audit.*
