# MCP Tool Directory

All MCP integrations currently connected to Claude Code via claude.ai account-level settings.
These load on every session and consume context budget. Review each to decide keep vs. disconnect.

## Summary

| Integration | Tools | Context Cost | Status | Review |
|-------------|-------|-------------|--------|--------|
| Meta Ads | ~70 | 🔴 massive | connected | [→](meta-ads.md) |
| Supabase | ~30 | 🟡 large | connected | [→](supabase.md) |
| Vercel | ~20 | 🟡 medium | connected | [→](vercel.md) |
| Gmail | ~10 | 🟢 small | connected | [→](gmail.md) |
| Google Calendar | ~8 | 🟢 small | connected | [→](google-calendar.md) |
| Google Drive | ~7 | 🟢 small | connected | [→](google-drive.md) |
| Microsoft Learn | ~3 | 🟢 tiny | connected | [→](microsoft-learn.md) |

## Where these come from

These are **claude.ai account-level integrations** — not local config files.
To disconnect: claude.ai → Settings → Integrations

## Recommendations

**Disconnect now** (zero active use in Claude Code):
- Meta Ads — 70 tools, never used in code sessions
- Microsoft Learn — Azure docs lookup, not needed in daily flow

**Move to project-level** (only needed in TENx10 project):
- Supabase — only relevant in `10 Research Group/products/tenx10-platform/`
- Vercel — only relevant in `10 Research Group/products/tenx10-platform/`

**Keep global** (used across sessions):
- Gmail — email drafts, search across DAD work
- Google Calendar — scheduling
- Google Drive — file access across all accounts

## Project-Level MCP Config Path

For tools that should only load in TENx10:
`10 Research Group/products/tenx10-platform/.claude/settings.json`

See individual files for tool lists and copy-paste config snippets.
