# Gigwell Scrape -> DBA Staging

Point Gemini here. One JSONL file per entity. Loader reads these and
upserts to Supabase. Never write directly to Supabase from the scrape.

## Directory layout

```
_staging/gigwell_scrape/
  contacts.jsonl          # one line per promoter/buyer person
  venues.jsonl            # one line per room
  contact_venues.jsonl    # links — who books where
  offers.jsonl            # every offer in Gigwell, won or lost
  confirmed_shows.jsonl   # booked shows with settlement data if available
  radius_holds.jsonl      # active avails / holds per contact
  praise.jsonl            # quotes / testimonials worth capturing
  _run_meta.json          # { scraped_at, gigwell_account, pages_scanned }
```

## Stable IDs

Every record carries `gigwell_id` — the internal ID Gigwell uses for
that row. That's how the loader dedupes on re-scrape. If Gigwell shows
two IDs for the same person/venue, pick the canonical one and list the
others under `gigwell_alt_ids: []`.

## Per-file schemas

Gemini MUST match these keys exactly. Unknown fields are dropped.
Missing optional fields are fine — just omit them.

### contacts.jsonl

```json
{
  "gigwell_id": "c_192847",
  "full_name": "Dan Goldstein",
  "email": "dan@mishawaka.com",
  "phone": "+1-303-555-0199",
  "role_raw": "Talent Buyer",
  "company": "Mishawaka Amphitheatre",
  "city": "Bellvue",
  "state": "CO",
  "country": "US",
  "timezone": "America/Denver",
  "linkedin_url": null,
  "instagram_handle": null,
  "website": "https://themishawaka.com",
  "first_seen_in_gigwell": "2023-06-12",
  "last_seen_in_gigwell": "2026-03-08",
  "offer_count_in_gigwell": 14,
  "confirmed_show_count_in_gigwell": 9,
  "notes_from_gigwell": "Prefers Thu/Fri. Responds fast.",
  "gigwell_alt_ids": []
}
```

### venues.jsonl

```json
{
  "gigwell_id": "v_55821",
  "name": "Mishawaka Amphitheatre",
  "city": "Bellvue",
  "state": "CO",
  "country": "US",
  "capacity": 1000,
  "typical_nights": ["Thu", "Fri", "Sat"],
  "has_weekday_slots": false,
  "genre_fit": ["jamtronica", "bass", "livetronica"],
  "website": "https://themishawaka.com",
  "songkick_id": null,
  "bandsintown_id": null,
  "notes": "Outdoor venue, seasonal May-Sep"
}
```

### contact_venues.jsonl

```json
{
  "contact_gigwell_id": "c_192847",
  "venue_gigwell_id": "v_55821",
  "relationship": "talent_buyer"
}
```

### offers.jsonl

```json
{
  "gigwell_id": "o_889921",
  "contact_gigwell_id": "c_192847",
  "venue_gigwell_id": "v_55821",
  "artist_slug": "dirtysnatcha",
  "status_raw": "Confirmed",
  "proposed_date": "2025-08-15",
  "guarantee": 2500,
  "door_deal": {"split": 85, "bonus_threshold": null},
  "counter_bounds": null,
  "thread_ref": "gigwell_msg_99182",
  "notes": "Support slot. Cross-billed with PhaseOne."
}
```

`status_raw` maps in the loader to the `offer_status` enum
(`inbound` | `negotiating` | `confirmed` | `declined` | `lost`).

### confirmed_shows.jsonl

```json
{
  "gigwell_id": "s_774432",
  "offer_gigwell_id": "o_889921",
  "venue_gigwell_id": "v_55821",
  "artist_slug": "dirtysnatcha",
  "show_date": "2025-08-15",
  "guarantee": 2500,
  "status_raw": "Completed",
  "paid_attendance": 820,
  "capacity_at_show": 1000,
  "settlement_total": 2500,
  "notes": null
}
```

`artist_slug` is REQUIRED on offers + confirmed_shows. This is what
drives the "don't re-pitch DirtySnatcha to a venue he just played"
logic. Valid slugs: `dirtysnatcha`, `mport`, `kotrax`, `ozztin`,
`dark_matter`, `hvrcrft`, `xenotype`.

### radius_holds.jsonl

```json
{
  "contact_gigwell_id": "c_192847",
  "artist_slug": "dirtysnatcha",
  "hold_start": "2026-05-01",
  "hold_end": "2026-06-15",
  "radius_miles": 150,
  "hold_number": 1,
  "notes": "1st hold, not yet confirmed"
}
```

### praise.jsonl

```json
{
  "contact_gigwell_id": "c_192847",
  "venue_gigwell_id": "v_55821",
  "category": "review",
  "text": "one of the cleanest loadins we've had all season",
  "source_url": "https://gigwell.com/contract/889921",
  "date_observed": "2025-08-16"
}
```

## Dedup / upsert rules

- `contacts`: upsert by `gigwell_id`. If `email` matches an existing
  contact with different `gigwell_id`, merge: append Gigwell id to
  `source_imports`, never overwrite `thomas_notes`, bump
  `last_contact_at` if Gigwell is newer.
- `venues`: upsert by `gigwell_id`. If `name + city + state` matches
  an existing venue without a gigwell_id, merge.
- `offers`: upsert by `gigwell_id`. Never rewrite status backwards
  (confirmed offers stay confirmed even if Gigwell shows them cancelled
  later — flag but don't overwrite).
- `confirmed_shows`: upsert by `gigwell_id`. `paid_attendance` and
  `capacity_at_show` only update if the incoming value is non-null.

## What NOT to scrape

- Contract PDFs / rider text — handled separately, not this pipeline.
- Payment / banking details — skip entirely.
- Artist-side info (our own roster profile pages) — not needed.

## Running the loader

```bash
cd products/digital-booking-agent
python scripts/load_gigwell_scrape.py --dry-run
python scripts/load_gigwell_scrape.py --write
```

All records get `source_tag='gigwell_scrape:<run-date>'` so you can
always filter out / back out a bad scrape run.
