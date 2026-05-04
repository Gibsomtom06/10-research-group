# A&R Scoring Weights & Data Sources

## Composite Score Formula

```
Composite = (Quality × 0.40) + (Reach × 0.30) + (Fit × 0.30)
```

Each dimension scored 1-10. Composite determines queue priority.

## Quality Scoring (1-10)

| Score Range | Criteria |
|:------------|:---------|
| 8-10 | Release-ready mixdown, original sound design, professional mastering, Shazam recognition or editorial playlist placement |
| 5-7 | Solid production, minor mixdown issues fixable in mastering, some playlist traction |
| 3-4 | Decent ideas but significant production gaps, no external traction |
| 1-2 | Unfinished, poor mixdown, derivative, no traction |

**API Data Points:**
- Shazam recognition count (Apple Music Toolbox)
- Spotify editorial playlist adds (Spotify API — `get_track` → `album.tracks`)
- SoundCloud play count and repost count
- Release cadence (number of releases in past 12 months)

## Reach Scoring (1-10)

| Score Range | Criteria |
|:------------|:---------|
| 8-10 | 50K+ monthly listeners, 10K+ social following, positive Google Trends |
| 5-7 | 10K-50K monthly listeners, 2K-10K social, some trend activity |
| 3-4 | 1K-10K monthly listeners, under 2K social, minimal trends |
| 1-2 | Under 1K monthly listeners, negligible social presence |

**API Data Points:**
- Spotify monthly listeners (Spotify API)
- SoundCloud followers (SoundCloud API)
- Instagram followers (manual or API)
- Google Trends interest score (Google Trends API — 0-100 scale)

## Fit Scoring (1-10)

| Score Range | Criteria |
|:------------|:---------|
| 8-10 | Core bass/electronic genre, aesthetic aligns with DSR brand, clear growth trajectory, ready for Single → EP → LP path |
| 5-7 | Adjacent genre with crossover potential, some brand alignment, moderate growth potential |
| 3-4 | Genre stretch, limited brand alignment, unclear growth path |
| 1-2 | Wrong genre entirely, no brand fit, one-off release mentality |

This is the only subjective dimension. Agent assesses based on DSR brand knowledge and release philosophy.
