# 10 Research Group — Org-level Claude Context

This file applies to EVERY project under 10 Research Group\.
Project-specific context lives in each project's own .claude/CLAUDE.md (e.g. TENx10/.claude/CLAUDE.md).

---

## Portfolio

- **TENx10** — AI-powered artist management SaaS platform (Next.js + Supabase). Consumer layer: Gemini. Build layer: Claude.
- **DirtySnatcha Records** — The live proof-of-concept label. Real artists, real shows, real data. TENx10 reads DSR data via Supabase.
- **Management** — Artist management business. DirtySnatcha is the flagship managed artist.
- **system_steward** — Local system maintenance utilities.

## Core Principle: Canonical Storage

Every file has ONE real home. Other views of the same file (by artist, by year, by contract status) are derived via Supabase queries or reference manifests — never duplicated on disk.

- **DirtySnatcha Records\\** is organized by **release** (not by artist). Each release folder has a metadata.yaml listing its artists, ISRCs, splits, and distributor.
- **Management\\clients\\** is organized by **artist**. Release work for a managed artist points to DSR\\releases\\<release>\\ rather than duplicating files.
- TENx10 the platform maintains the relational layer in Supabase: releases, artists, artist_releases (bridge table with role + split), contracts, splits.

## Domain Distinction

- **DirtySnatcha** = the artist (managed by Thomas, flagship act).
- **DirtySnatcha Records (DSR)** = the label Thomas runs with DirtySnatcha. Signs many artists: Dark Matter, BBX, Kotrax, Yunit, Brainwash, Ozztin, Mavic, Azella, Zubah, Rivibes, Sloth & Chackk, Walter Wilde, etc.
- Email: canonical domain is dirtysnatcharecords.com. dirtysnatcha.com aliases forward in (demos@, thomas@).

## Voice & Standards

(Placeholder — fill in as we establish voice/standards across the portfolio.)
