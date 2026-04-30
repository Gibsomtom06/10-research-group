# Analyst Agent — Demographics + Data Specialist for DBA

**Role in DBA:** Sits between the Supervisor and the Outbound agent. Every outbound pitch must pass through Analyst first. No pitch ships without a pitch-pack.

**Philosophy:** "Show them we did our homework. Prove the artist will draw. Give them one true, specific reason to feel good about their own work." That's the three-legged stool of a pitch that converts.

---

## 1. What Analyst owns

| Domain | Owns | Does not own |
|---|---|---|
| Artist-side data | Streams, views, followers, engagement by market; attendance history; growth velocity | Voice of the pitch (Outbound owns) |
| Buyer/venue data | Room capacity, past bookings, upcoming calendar gaps, recent press mentions | Negotiation band (Routing + Supervisor own) |
| Market intelligence | DMA demographics, scene trends, comp-act attendance, weekday-slot availability | Routing the tour (Routing agent owns) |
| Praise bank | Dated, sourced praise hooks per buyer/venue | Final delivery tone (Outbound owns) |
| Pitch-pack JSON | The structured input Outbound composes from | The email itself |

## 2. Data sources

### Artist-side (DirtySnatcha for dogfood, per-tenant for productized)

| Source | API / method | Refresh | Key fields |
|---|---|---|---|
| Spotify for Artists | Spotify for Artists API (OAuth) | Nightly | Monthly listeners by metro, top 10 cities, audience age/gender, new listeners, save rate, source of streams (playlist/profile/direct) |
| YouTube | YouTube Analytics API (OAuth) | Nightly | Views + watch time by geography, top videos by market, subscriber growth by geo |
| Instagram | Meta Graph API (Instagram Business) | Nightly | Followers by city, story/reel reach, engagement rate, saves, audience demographics |
| TikTok | TikTok Business API | Nightly | Followers by region, video views by city, engagement |
| Past shows | Internal CRM + ticketing exports (DICE, Ticketmaster, AXS, Eventbrite, door sheets) | On-demand | Paid attendance, sell-through %, capacity, date, venue, openers |
| Chartmetric / Soundcharts | Paid tier (deferred until revenue justifies) | Weekly | Playlist reach, competitor benchmarks, momentum score |

### Buyer / venue / market-side

| Source | API / method | Refresh | Key fields |
|---|---|---|---|
| Songkick | Partner API | Nightly for CRM venues, on-demand for new markets | Venue calendars, past shows, attendance estimates |
| Bandsintown | Partner API | Nightly for CRM venues | Same as Songkick, different coverage |
| Pollstar (budget-gated) | Subscription | Weekly | Grosses, ticket counts, verified attendance |
| Nielsen DMA reference | Static dataset | Annual | Metro population, age distribution, music consumption indexes |
| US Census ACS | census.gov API | Annual | Income, age, household composition by ZIP/metro |
| Local venue scrapers | Custom per venue (Playwright when needed) | Weekly | Upcoming calendars that aren't on Songkick |
| Google Alerts | Email-parsed | Real-time | Buyer/venue name mentions — feeds the praise bank |
| Instagram public scraping | Targeted account-watch | Daily | Recent posts from buyers/venues for praise material |
| Substack / Reddit / local press | Regional-list scrapers | Weekly | Scene trends, what's hot, what's coming |

## 3. The pitch-pack contract

Every outbound pitch Outbound composes must receive a pitch-pack from Analyst. Format:

```json
{
  "pitch_id": "uuid",
  "recipient": {
    "name": "Jane Promoter",
    "email": "jane@smallroom.com",
    "relationship_strength": "warm | cold | reconnect"
  },
  "venue": {
    "name": "Small Room",
    "city": "Columbus, OH",
    "capacity": 400,
    "typical_nights": ["Thu", "Fri", "Sat"],
    "has_weekday_slots": true
  },
  "praise_hook": {
    "text": "Saw the spring weekender announcement — Thursday lineup is tight",
    "source_url": "https://www.instagram.com/p/...",
    "date_observed": "2026-04-18",
    "freshness_days": 4,
    "confidence": 0.92
  },
  "artist_market_stats": [
    {
      "claim": "~3,100 monthly Spotify listeners in the Columbus DMA",
      "source": "Spotify for Artists",
      "source_url_or_export": "artists.spotify.com/c/...",
      "date": "2026-04-21",
      "value": 3104,
      "trend_90d_pct": 22
    }
  ],
  "fit_rationale": {
    "text": "Your April booking of [Comp Act] drew ~280 paid in a 400-cap; our Cleveland show in Feb pulled 312 in a 400-cap — same demo, same BPM range",
    "comp_act": "...",
    "our_similar_show": "Cleveland Feb 17 2026"
  },
  "ask": {
    "dates_requested": ["2026-05-19", "2026-05-20"],
    "routing_context": "between Cleveland (May 17) and Chicago (May 22)"
  },
  "counter_bounds": {
    "min_guarantee": 1200,
    "target": 1800,
    "walk_away": 800,
    "door_deal_acceptable": true
  },
  "verification_stamps": {
    "praise_verified": true,
    "stats_freshness_ok": true,
    "sources_cited": 3
  }
}
```

**Hard rules Analyst enforces before handoff:**
- `praise_hook.freshness_days` must be ≤ 90. If not, omit praise.
- Every stat in `artist_market_stats` must have `date` within 30 days. If stale, refresh or omit.
- `verification_stamps.praise_verified` must be `true` (source URL or export exists).
- If confidence on any element is < 0.7, drop that element — don't pass it through weakened.

## 4. The praise bank — how we stay specific

Praise is the single biggest "sounds human" signal. Analyst maintains a per-contact praise bank sourced from:

1. **Google Alerts** on every buyer name + venue name in the CRM, parsed nightly.
2. **Targeted IG monitoring** — for every venue + buyer account we've identified, watch for new posts daily.
3. **Press mentions** — Pollstar, Billboard, regional press alerts.
4. **Scene chatter** — subreddits like r/COMusic etc. weekly scan for venue/buyer mentions.
5. **Thomas-added notes** — dashboard lets Thomas drop a one-line note on a contact ("just had a kid", "just moved to Nashville"). These are highest-priority praise material.

Each praise hook is stored with:
- source URL
- date observed
- category (recent_win | taste_signal | personal_thread | seasonal)
- confidence score
- expires_at (90 days from observation by default)

When Outbound asks for a praise hook, Analyst returns the freshest, highest-confidence one. If nothing qualifies, Analyst returns `null` and Outbound composes without praise rather than faking it.

## 5. How Outbound uses the pack

Outbound receives the JSON and composes an email in Thomas's voice. The composition rules:
- **Never** dump JSON keys into the email.
- Praise goes in the first 2 sentences or not at all.
- Exactly one hard artist stat per pitch. More than one reads like a pitch deck.
- The fit rationale is usually one clause inside a larger sentence, not its own paragraph.
- The ask is the last sentence. Always.
- Sign off in Thomas's pattern. No template sign-offs.

## 6. Example — cold market outreach, composed from pitch-pack

Taking the JSON above, Outbound produces something like (voice-calibrated to Thomas):

> hey jane —
>
> caught the spring weekender lineup — thursday looks really good, the co-headliner choice is sharp.
>
> reason i'm reaching out — we've got 3,100 monthly spotify listeners in columbus and that number's up 22% in the last three months. we're routing may 17 cleveland → may 22 chicago and i'd love to land a tuesday or wednesday in between at small room. similar-size room to where we just pulled 312 paid in cleveland in feb.
>
> what would work on your end for that window?
>
> thomas

One praise hook (specific, recent, sourced). One hard artist stat (dated, metro-level). One fit signal (comparable show, comparable room). One clean ask. Prose, no bullets, no em-dashes, lowercase if that's Thomas's pattern.

## 7. Ship order for Analyst v0 (inside the 2-week DBA milestone)

1. Supabase schema: `artist_data`, `buyer_signals`, `praise_bank`, `pitch_packs`.
2. Spotify for Artists + IG pulls — enough to populate the dashboard heat map for DSR on day 10.
3. Songkick/Bandsintown ingest for DSR's CRM venues.
4. Google Alerts setup + email parser into `praise_bank`.
5. Pitch-pack generator function — given a (contact, venue, market) triple, return the JSON.
6. One end-to-end demo: Thomas points at a CRM contact, Analyst returns a pitch-pack, Outbound composes, draft lands in review.

Everything else (Pollstar integration, Chartmetric, custom scrapers for tertiary venues) is post-v0 and budget-gated.
