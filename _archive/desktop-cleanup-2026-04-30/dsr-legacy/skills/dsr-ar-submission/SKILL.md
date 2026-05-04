---
name: dsr-ar-submission
description: "A&R submission pipeline for DirtySnatcha Records — handles music demo intake, automated scoring, dossier generation, partner voting queue, and user profile assignment. Use for: processing new music submissions from dirtysnatcharecords.com, scoring demos against label criteria, building artist dossiers, managing the 2/3 partner vote process, generating acceptance/rejection communications, and assigning user profile types."
---

# DSR A&R Submission Pipeline

Handles the complete music submission lifecycle from demo intake through partner vote to acceptance or rejection.

## Submission Intake

Submissions arrive via dirtysnatcharecords.com portal (Wix MCP) or demos@dirtysnatcha.com. Every submission must include:

| Required Field | Source |
|:---------------|:-------|
| Artist Name | Submission form |
| Track Title | Submission form |
| Genre / Subgenre | Submission form |
| Private streaming link | Submission form (SoundCloud private, Google Drive, Dropbox) |
| Artist social links | Submission form (IG, SoundCloud, Spotify minimum) |
| Brief artist bio | Submission form |
| Contact email | Submission form |

## Scoring System

Every submission is scored automatically on three dimensions. Each dimension produces a 1-10 score. The composite score determines queue priority.

### Dimension 1: Quality (Weight: 40%)

Evaluate production quality, mixdown, mastering, and originality. Data sources:

| Signal | Source | What It Measures |
|:-------|:-------|:-----------------|
| Shazam data | Apple Music Toolbox | Track recognition = existing traction |
| Playlist placement | Spotify API | Editorial or algorithmic playlist adds |
| Release history | Spotify / SoundCloud | Consistency and growth trajectory |
| Play counts | SoundCloud / Spotify | Raw engagement numbers |

### Dimension 2: Reach (Weight: 30%)

Evaluate the artist's existing audience and organic growth. Data sources:

| Signal | Source | What It Measures |
|:-------|:-------|:-----------------|
| Monthly listeners | Spotify API | Active audience size |
| Follower count | SoundCloud API | Platform-specific following |
| Social following | Instagram / TikTok | Cross-platform presence |
| Google Trends | Google Trends API | Organic search interest |

### Dimension 3: Fit (Weight: 30%)

Evaluate alignment with DirtySnatcha Records brand, genre focus, and release philosophy. This is the only subjective dimension — assessed by the agent based on:

- Genre alignment with bass/electronic focus
- Aesthetic and brand compatibility
- Release philosophy alignment (long-term growth, not quick releases)
- Potential for Single → EP → LP progression

## Dossier Generation

After scoring, generate a one-page dossier for each submission:

```
ARTIST: [Name]
TRACK: [Title]
COMPOSITE SCORE: [X/10] (Quality: X | Reach: X | Fit: X)

QUALITY SUMMARY: [2-3 sentences on production, mixdown, originality]
REACH SUMMARY: [Monthly listeners, followers, trend data]
FIT ASSESSMENT: [Genre alignment, brand compatibility, growth potential]

RECOMMENDATION: [Queue for Vote / Reject / Waitlist for Compilation]
RED FLAGS: [Any concerns — low engagement, genre mismatch, etc.]
```

## Partner Vote Process

Dossiers are queued for the three label partners. Rules:

1. **2/3 majority required** to approve any submission or contract
2. Partners access the vote queue via dashboard (Wix portal or shared doc)
3. Each partner votes: Approve / Reject / Waitlist
4. Vote window: 7 days. After 7 days with no vote → ping reminder
5. After 14 days with incomplete votes → escalate to Thomas
6. Voting logic enforced by Tech Agent — cannot be bypassed

## Post-Vote Actions

### On Approval (2/3 Yes)
```
1. Generate acceptance email (professional, on-brand tone)
2. Generate contract from template
3. Assign user profile type: "Signed Artist"
4. Unlock Project Room access (WAVs, stems, marketing plans)
5. Create release timeline: Single → EP → LP progression
6. Notify Thomas for final review of contract terms
```

### On Rejection (2/3 No)
```
1. Generate rejection email with the "asshole disclaimer"
   → Professional thank-you, honest feedback, door left open
   → Include: "Opinions are like assholes — everyone has one"
2. User stays in portal as "Submitting Artist" type
3. Can resubmit after 90 days
```

### On Waitlist
```
1. Generate waitlist email — track may be held for Compilation Queue
2. Assign status: "Waitlisted"
3. Track enters Compilation Queue for release schedule gap-filling
4. Re-evaluate when compilation slot opens
```

## User Profile Types

Five profile types assigned based on entry events:

| Profile Type | Entry Event | Portal Access |
|:-------------|:------------|:-------------|
| Fan | Purchases merch via Square | Basic portal, merch history |
| Submitting Artist | Submits demo | Submission tracker, resubmit after 90 days |
| Signed Artist | Approved by 2/3 vote | Project Room, release timeline, marketing tools |
| Promo Team Member | Accepted into promo team | Task dashboard, points tracker, leaderboard |
| Industry Contact | Added by Thomas manually | Show calendar, booking contact info |

## Reference Files

- `references/scoring_weights.md` — Detailed scoring rubric and API data sources
- `references/email_templates.md` — Acceptance, rejection, and waitlist email templates
- `references/contract_template.md` — Standard artist contract template
