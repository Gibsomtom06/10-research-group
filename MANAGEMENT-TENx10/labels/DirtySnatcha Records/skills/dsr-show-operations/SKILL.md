---
name: dsr-show-operations
description: "Show operations management for DirtySnatcha Records — handles show content calendars, release marketing calendars, tour support grid lookups, and asset management. Use for: building marketing timelines for releases, managing content calendars for upcoming shows, looking up support artist lineups, and ensuring all show assets (flyers, video) are organized and delivered to promoters."
---

# DSR Show Operations

Manages the operational and creative assets for DirtySnatcha Records shows and label releases.

## Show Content Calendars (SK-13)

Triggered on show confirmation. Builds the 8-week countdown timeline for show-specific content.

| Timeline | Focus | Asset Required |
|:---------|:------|:---------------|
| 8 Weeks | Announcement | Official tour flyer / show poster |
| 6 Weeks | On-Sale Launch | Motion graphic / video teaser |
| 4 Weeks | Maintenance | Live show clip / recent release video |
| 2 Weeks | Final Push | Urgency graphic / "Low Ticket" alert |
| Show Week | Day-Of | Set times / venue info / travel story |

## Release Marketing Calendars (SK-12)

Triggered on new release confirmation. Builds the Single → EP → LP progression marketing timeline.

| Timeline | Focus | Asset Required |
|:---------|:------|:---------------|
| 4 Weeks Pre | Tease | Sound bite / blurred artwork |
| 2 Weeks Pre | Pre-Save | Linkfire/HypeEdit link + official art |
| Release Day | Launch | High-quality audio / music video |
| 1 Week Post | Growth | User-generated content / remix clips |

## Tour Support Grid Lookup (SK-20)

Used to populate show assets and marketing with correct support artist info.

```python
# Support Grid Lookup Logic
def get_support(show_date, show_city):
    # Lookup in /project_context/tour_support_grid.json
    # Return: Support1, Support2, Support3, Support4, SpecialGuest
```

**Rule:** Always verify support lineup before generating flyers or ad copy.

## Asset Management (Google Drive MCP)

Every confirmed show must have all assets in the `06_SHOW_ASSETS` subfolder:
1. **Rider PDF:** Auto-generated with custom Queen line.
2. **Press Photo:** Current approved version from `00_MASTER_TEMPLATE/00_LINKED_ASSETS`.
3. **Approved Bio:** Current version.
4. **Visuals Pack:** VJ content link for LED walls.

## Deliverables

1. **Promoter Asset Link:** Direct Google Drive link to `06_SHOW_ASSETS` sent to promoter.
2. **Internal Content Calendar:** Weekly task list for Leigh's social media.
3. **Marketing Schedule:** Dates for ad launches and content posts.

## Reference Files

- `references/asset_checklist.md` — Mandatory assets for every show type
- `references/content_voice_guide.md` — Brand voice for social media posts
- `references/vj_visuals_spec.md` — Technical specs for LED wall content
