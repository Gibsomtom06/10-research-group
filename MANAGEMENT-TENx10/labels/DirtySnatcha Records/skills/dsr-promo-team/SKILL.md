---
name: dsr-promo-team
description: "Promo team management for DirtySnatcha Records — handles member onboarding, task assignment, UGC verification, points calculation, leaderboard generation, and reward tracking. Use for: managing promo team members, assigning and verifying promotional tasks, calculating points from social media posts, generating weekly leaderboards, tracking rewards, and managing the promo team portal on dirtysnatcharecords.com."
---

# DSR Promo Team Management

Manages the DirtySnatcha Records street team / promo team. Handles onboarding, task assignment, verification, points, and rewards.

## Onboarding Flow

1. Application via dirtysnatcharecords.com portal (Wix MCP)
2. Thomas reviews application — approve / reject
3. On approval: assign user profile type "Promo Team Member"
4. Member gets portal access: task dashboard, points tracker, leaderboard
5. Welcome email with guidelines and first task assignment

## Task Types & Points

| Task Type | Points | Verification Method |
|:----------|:-------|:-------------------|
| Instagram Story (tag @dirtysnatcha) | 5 | Screenshot + post URL |
| Instagram Reel (tag + audio) | 15 | Post URL + engagement check |
| TikTok Video (tag + sound) | 15 | Post URL + engagement check |
| Twitter/X Post (tag + link) | 5 | Post URL |
| Facebook Share (public, tag) | 5 | Post URL |
| UGC Video (original content, 15s+) | 25 | Post URL + content review |
| Event Flyering (physical) | 20 | Photo proof + location tag |
| Event Attendance + Content | 30 | Check-in + content posted |
| Playlist Add (curated playlist, 500+ followers) | 10 | Playlist URL + screenshot |
| Referral (new promo member signs up) | 50 | New member confirmed |

## Verification Workflow

```
1. Member submits task completion via portal
   → Includes: task type, post URL or screenshot, date
2. Agent verifies:
   a. Post exists and is public
   b. Correct tags/mentions present
   c. Content meets minimum quality (not spam, on-brand)
   d. For UGC: minimum 15 seconds, original content
3. IF verified → award points, log completion
4. IF rejected → notify member with reason, allow resubmission
```

**Beta Phase:** Verification via OAuth (member connects social accounts). If OAuth unavailable, fall back to tracking links or manual screenshot verification.

**Future Phase:** Replace OAuth with tracking links for simpler verification.

## Points Calculation

Points accumulate per calendar month. Monthly reset with lifetime total preserved.

```python
# Points calculation logic
monthly_points = sum(task.points for task in completed_tasks_this_month)
lifetime_points = sum(task.points for task in all_completed_tasks)
streak_bonus = 10 if consecutive_weeks_active >= 4 else 0
monthly_total = monthly_points + streak_bonus
```

## Weekly Leaderboard

Generated every Monday. Distributed via email and posted to portal.

```
DSR PROMO TEAM — WEEK OF [DATE]

RANK | MEMBER          | WEEKLY PTS | MONTHLY PTS | LIFETIME
1    | [Name]          | 85         | 340         | 1,250
2    | [Name]          | 70         | 290         | 980
3    | [Name]          | 65         | 275         | 1,100
...

TOP PERFORMER: [Name] — [Highlight achievement]
STREAK ALERT: [Names with 4+ consecutive active weeks]
```

## Reward Tiers

| Tier | Monthly Points Required | Reward |
|:-----|:-----------------------|:-------|
| Bronze | 50 | Shoutout on DSR socials |
| Silver | 150 | Exclusive unreleased track preview |
| Gold | 300 | Free merch item from store |
| Platinum | 500 | Guest list + meet & greet at next local show |
| Diamond | 1000 | Feature on DSR compilation consideration |

## Portal Integration

Promo team members access via dirtysnatcharecords.com:
- Task dashboard (available tasks, deadlines)
- Submission form (complete task, upload proof)
- Points tracker (monthly + lifetime)
- Leaderboard (weekly updated)
- Reward status and redemption

## Reference Files

- `references/task_guidelines.md` — Detailed content guidelines per task type
- `references/reward_fulfillment.md` — How rewards are fulfilled and tracked
