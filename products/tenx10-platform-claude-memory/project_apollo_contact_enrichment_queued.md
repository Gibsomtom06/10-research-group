---
name: project_apollo_contact_enrichment_queued
description: Apollo.io contact-enrichment integration is queued but on hold until after the Contacts Next Action feature ships
metadata: 
  node_type: memory
  type: project
  originSessionId: 3da292d4-a88d-4dc3-8a64-6bde3e5acfb8
  modified: 2026-08-21T07:26:16.630Z
---

Thomas wants to use Apollo (Apollo.io) to enrich/update `contacts` table data — **contacts only, explicitly not venues**. Decided 2026-08-21.

**Why contacts-only:** Apollo is a B2B SaaS sales enrichment tool (LinkedIn/corporate-directory sourced). It's a reasonable fit for agency/label/corporate contacts but a poor fit for venues — no concert-industry fields (capacity, in-house booker), and most venue/promoter contacts are small independent operators unlikely to be in Apollo's index. Confirmed via `vercel integration discover` that Apollo is not on the Vercel Marketplace, so this would be a direct API integration (`APOLLO_API_KEY` env var + a client in `src/lib/apollo/`), not a marketplace install. Apollo enrichment is credit-metered per lookup — check cost before a bulk backfill over 743 contacts.

**How to apply:** Do not scope or brainstorm this yet. Thomas said "hold it" 2026-08-21 — wait for him to raise it again, expected after `[[project_tenx10_contacts_next_action]]` (R255(d) item 1, spec at `docs/superpowers/specs/2026-08-21-contacts-next-action-design.md`) ships. When he does, treat it as its own brainstorming pass (separate spec), not folded into an existing plan.
