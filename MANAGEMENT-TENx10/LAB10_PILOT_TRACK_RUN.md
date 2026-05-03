# LAB10 Publishing — Pilot Track Registration Playbook
**Last updated:** 2026-05-03
**Status:** NOT STARTED — use this doc to run the first track and capture the run

---

## Why this exists

0 of 82 Leigh Bray (DirtySnatcha) tracks are registered with BMI/MLC/SoundExchange under LAB10 Publishing. The CSV tooling and Supabase tracker exist but have never been run against a live registry. This doc captures the first end-to-end run so the remaining 81 tracks become a repeatable batch.

---

## Registry order (canonical — do not reorder)

1. **BMI** — source of truth for the composition. Every other registry references the BMI Work ID.
2. **MLC** — mechanical royalties for streaming (Spotify, Apple, etc.). Needs BMI Work ID to match recording to composition.
3. **SoundExchange** — digital performance (Pandora radio, SiriusXM, webcasts). Independent channel, paid to master/performer, not songwriter. Can be batched separately.
4. **CMRRA** — Canada mechanical. DEFER. Batch all 82 after US flow is proven.

---

## Pre-flight checklist

Before starting, confirm all of these are true:

- [ ] BMI login confirmed working (bmi.com → Songwriter/Publisher portal, can see member dashboard)
- [ ] MLC member account confirmed — LAB10 Publishing enrolled at themlc.com
  - If NOT enrolled: go to themlc.com → Become a Member → publisher path. Takes 5-7 days. Enroll immediately, proceed with BMI + SoundExchange in the meantime.
- [ ] SoundExchange account confirmed — DSR Records or LAB10 enrolled at soundexchange.com
- [ ] Supabase publishing tracker open — confirm these columns exist on the tracks table: `bmi_work_id`, `iswc`, `bmi_registered_at`, `mlc_song_code`, `mlc_registered_at`, `sx_isrc_registered`, `sx_registered_at`
- [ ] Pilot track selected:
  - Must be: 100% Leigh Bray sole write (no co-writers — simplest case)
  - Must have: known ISRC in DB
  - Prefer: released ≥6 months ago (streams have accumulated, back-claim window is open)

---

## Pilot track record

Fill this in before starting:

| Field | Value |
|---|---|
| Track title | |
| ISRC | |
| Release date | |
| Duration (seconds) | |
| Writer | Leigh Bray — IPI 01017500116 — 100% |
| Publisher | LAB10 Publishing — BMI — 100% |
| Already in Supabase? (y/n) | |
| Row ID in Supabase | |

---

## Step-by-step run log

### STEP 1: BMI Registration

**URL:** bmi.com → Login → Register Work

**Fields to enter:**
- Title (+ any alternative titles, e.g. remix name)
- Writer: Leigh Bray / IPI 01017500116 / share: 100%
- Publisher: LAB10 Publishing / IPI: [fill in] / share: 100%
- Duration: [seconds]
- Genre: Electronic / Bass Music
- ISWC: leave blank — BMI will generate

**After submitting:**

| Field | Value | Notes |
|---|---|---|
| BMI Work ID | | 9-10 digits |
| ISWC assigned | | Format: T-xxx.xxx.xxx-x |
| Submission timestamp | | |
| Any validation errors | | |

**Supabase update:**
```sql
UPDATE tracks SET bmi_work_id = '[id]', iswc = '[iswc]', bmi_registered_at = now()
WHERE isrc = '[ISRC]';
```

---

### STEP 2: MLC Registration

**URL:** themlc.com → Member Portal → Register Works → Single Work form

**Fields to enter:**
- Title
- ISWC: [from Step 1 — REQUIRED, this is the matching key]
- Writer: Leigh Bray / share: 100% / IPI: 01017500116
- Publisher: LAB10 Publishing / share: 100% / IPI: [fill in]
- Sound Recording ISRC: [pilot track ISRC]
- Original release date
- Label: DirtySnatcha Records

**After submitting:**

| Field | Value | Notes |
|---|---|---|
| MLC Song Code | | |
| Submission timestamp | | |
| Back-claim period | up to 3.5 years | Note the earliest date MLC will pay from |
| Any validation errors | | |

**Supabase update:**
```sql
UPDATE tracks SET mlc_song_code = '[code]', mlc_registered_at = now()
WHERE isrc = '[ISRC]';
```

---

### STEP 3: SoundExchange Registration

**URL:** soundexchange.com → Log in as rights holder → Repertoire → Add Recording

**Important:** SoundExchange pays the **sound recording owner** and **featured artist** (not the songwriter). Confirm which entity owns the master — DSR Records or LAB10.

**Fields to enter:**
- ISRC
- Recording title
- Featured artist: DirtySnatcha (Leigh Bray)
- Sound recording owner: [DSR Records / LAB10 — confirm]
- Release date
- Label: DirtySnatcha Records

**After submitting:**

| Field | Value | Notes |
|---|---|---|
| SoundExchange confirmation | | |
| Submission timestamp | | |
| Any validation errors | | |

**Supabase update:**
```sql
UPDATE tracks SET sx_isrc_registered = true, sx_registered_at = now()
WHERE isrc = '[ISRC]';
```

---

## Validation pass

After all three registries:

- [ ] Pull the Supabase row — confirm `bmi_work_id`, `mlc_song_code`, `sx_isrc_registered` all populated with timestamps
- [ ] Run the BMI CSV generator for this track — confirm output is clean (no nulls, correct IPI, correct ISWC)
- [ ] Run the MLC CSV generator for this track — confirm ISRC + Song Code correct
- [ ] Run the SoundExchange CSV generator for this track — confirm ISRC + owner correct
- [ ] If CSV generator chokes: **STOP. Fix before proceeding to track #2.** Log the bug below.

---

## Run log

| Run date | Track | BMI Work ID | MLC Song Code | SX confirmed | Time taken | Notes / bugs |
|---|---|---|---|---|---|---|
| | | | | | | |

---

## Bugs found during pilot run

| Bug | Registry | Impact | Status |
|---|---|---|---|
| | | | |

---

## Batch plan (after pilot is clean)

Once 1 track is proven:
- Batch pace: ~30-45 min per track
- 81 remaining tracks = ~40-60 hrs total
- Suggested approach: 3-5 tracks/session, 2-3 sessions/week = done in 3-4 weeks

Session log:

| Date | Tracks registered | Running total | Notes |
|---|---|---|---|
| | | 1 (pilot) | |

---

## Registry account reference

| Registry | Account | Login URL | Notes |
|---|---|---|---|
| BMI | LAB10 Publishing | bmi.com | IPI: TBD — add when confirmed |
| MLC | LAB10 Publishing | themlc.com | Confirm enrollment status first |
| SoundExchange | DSR Records or LAB10 | soundexchange.com | Confirm master ownership before registering |
| CMRRA | Accounts 02274554 / 02274555 | cmrra.ca | Activate before submitting — defer until US flow proven |

---

*Created 2026-05-03 from audit action plan. Update after each session.*
