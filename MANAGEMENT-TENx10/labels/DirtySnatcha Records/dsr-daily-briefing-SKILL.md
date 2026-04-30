---
name: dsr-daily-briefing
description: Generate DirtySnatcha Records daily briefings, status updates, tour check-ins, and morning reports. Use this skill EVERY TIME the user asks for a daily briefing, status update, morning check-in, "what's happening today", "what matters today", "give me the rundown", "what should I focus on", tour status, show status, weekly priorities, or any variant of "what do I need to know right now". Also trigger when the user asks "what's urgent", "any fires", "what's overdue", or starts a new conversation with a greeting that implies they want to get caught up. This is the #1 most-used workflow in the DSR platform — when in doubt, use this skill.
---

# DSR Daily Briefing Skill

## What This Skill Does

Generates a comprehensive daily briefing for DirtySnatcha Records by pulling real data from operational documents and running it through the Knowledge Architecture decision frameworks. The output is a specific, actionable briefing — not a generic status report.

## When to Use

- User says "daily briefing", "morning briefing", "what's happening today"
- User says "status update", "tour status", "what matters"
- User says "what should I focus on", "what's urgent", "any fires"
- User greets you and seems to want to get caught up
- User asks "what's the plan for this week"
- User asks about multiple shows at once (not a single show deep-dive)

## Step-by-Step Workflow

### Step 1: Load Current Tour Data

Search the project knowledge for these files IN THIS ORDER:

1. **Tour Status (Recalibrated)** — `DSR_Tour_Status_Recalibrated_2026-03-01.docx`
   - This is the single source of truth for show dates, offers, phases, and days-out
   - Start here ALWAYS

2. **Content Calendar** — `DSR_4Week_Content_Calendar.md`
   - What content is scheduled for today/this week
   - Which posts are HIGH priority vs medium

3. **Master Operating Bible** — `DSR_Master_Operating_Bible_v3.md`
   - Current metrics (Spotify, Instagram, SoundCloud)
   - Key contacts and commission structures
   - NOTE: The Bible lists the artist as "Lee Silva" — this is WRONG. Use "Lee Bray" or "Leigh Bray"

4. **Release Cadence Framework** — `Release_Cadence_Framework.md`
   - Check if any release deadlines are approaching (6-week minimum rule)

5. **Promoter Follow-Up Emails** — `Promoter_Follow_Up_Emails.md`
   - Check if any promoter communications are overdue

### Step 2: Calculate Today's Date Context

Using today's date, calculate for EVERY show on the tour:
- Days until show (show_date minus today)
- Current phase based on Module 9 rules:
  - Past date → COMPLETED (trigger post-show tasks)
  - 0-10 days → FINAL PUSH
  - 11-28 days → ON-SALE (if tickets live) or MAINTENANCE
  - 29+ days → ANNOUNCEMENT or MAINTENANCE
- Whether the phase in the Tour Status doc matches what it SHOULD be (flag mismatches)

### Step 3: Run Alert Triggers

Check every show against Module 15's alert conditions:

**🔴 CRITICAL triggers:**
- Show in ≤7 days + no contract signed
- Show in ≤7 days + no deposit received
- Show in ≤3 days + no advance sheet sent
- Deposit overdue (past due date)
- Venue still TBD for show in ≤14 days
- Decay deadline in ≤7 days

**🟡 WARNING triggers:**
- Show in ≤14 days + no ticket link
- Show entering Final Push phase
- Content calendar has gaps (no posts for 2+ days)
- Venue TBD for show in 14-28 days
- Decay deadline in ≤14 days

**🟢 INFO triggers:**
- Show completed (trigger grading)
- Content approved and ready to post
- Phase transition happened

### Step 4: Prioritize Actions

From all alerts and data, rank actions using this priority formula (Module 14):

```
Priority = (show_urgency × 3) + (deposit_urgency × 2) + (decay_urgency × 2) + (content_urgency × 1)
```

Where urgency = inverse of days remaining (closer = higher).

Select the TOP 3 actions for 🔴 URGENT and TOP 3 for 🟡 THIS WEEK.

### Step 5: Pull Content Calendar

Check the 4-Week Content Calendar for:
- What's scheduled TODAY (exact post descriptions, platforms, priority level)
- What's scheduled THIS WEEK that needs prep
- Any gaps that need to be filled

### Step 6: Pull Metrics

From the Master Operating Bible (or ask user for updated numbers if stale):
- Spotify Monthly Listeners + trend
- Spotify Popularity Index + trend
- Instagram followers + engagement trend
- Any notable stream/save data

### Step 7: Generate Strategic Recommendation

Based on ALL the above data, generate ONE specific strategic recommendation. This is not a platitude — it's a specific action based on the intersection of:
- Which shows are at risk (soft ticket sales, no promoter engagement, high CPT)
- Where marketing dollars should be allocated RIGHT NOW
- Whether a release is needed to prevent Spotify decay
- Whether a promoter needs to be contacted or escalated

### Step 8: Format Output

Use this EXACT format (from Module 20):

```
Good {morning/afternoon}, Thomas. Here's what matters today.

🔴 URGENT — DO TODAY:
• [Specific action #1 — with dollar amounts, names, deadlines]
• [Specific action #2]
• [Specific action #3 if applicable]

🟡 THIS WEEK:
• [Action with specific deadline]
• [Action with specific deadline]
• [Action with specific deadline if applicable]

📱 CONTENT TODAY:
• [Platform]: [Exact content description from calendar] — [Priority level]
• [Platform]: [Exact content description] — [Priority level]

📊 METRICS CHECK:
• Spotify Monthly Listeners: {value} ({trend})
• Spotify Popularity: {value} ({trend})
• Instagram: {value} ({trend})
• Tour Revenue (Guaranteed): ${total} across {n} shows

💡 RECOMMENDATION:
{One specific, data-backed strategic recommendation with a clear CTA — who to contact, what to do, by when}
```

## Critical Rules

1. **NEVER give generic advice.** Every bullet point references real show names, dollar amounts, dates, and promoter names.

2. **NEVER sugarcoat.** If a show is losing money or at risk, say so plainly. "Tampa ticket sales are soft" not "Tampa could benefit from additional marketing attention."

3. **ALWAYS include CTAs.** Don't just inform — tell the user what to DO, who to CONTACT, and by WHEN.

4. **ALWAYS cite data sources.** "Based on Tour Status as of 3/1..." or "Per the content calendar..."

5. **Use the right name.** The artist is Lee Bray or Leigh Bray or DirtySnatcha. NEVER "Lee Silva."

6. **Address Thomas by name.** The primary user is Thomas Nalian, manager. The briefing is for him.

7. **Prioritize ruthlessly.** 3 urgent items, not 10. If there are genuinely 5+ fires, say so, but still rank them.

8. **Flag missing data.** If venue is TBD, deposit status unknown, or metrics are stale — call it out as a data gap that needs resolution.

9. **Check phase alignment.** If a show SHOULD be in Final Push based on date math but the Tour Status says Maintenance, flag the mismatch.

10. **Content in artist voice.** If you include sample captions or content suggestions, write them in DirtySnatcha's voice: hype, raw, short, emojis (🔥🛸👽🙏), caps for emphasis, casual profanity. NOT corporate tone.

## Reference Files

For deeper context on specific modules referenced in this skill, search the project knowledge for:
- `KA_v2_Part3_DSP_Content_Voice.md` — Module 9 (touring phases), Module 10 (content engine)
- `KA_v2_Part4_Releases_Alerts_Integrations.md` — Module 15 (alert triggers), Module 16 (dashboard KPIs)
- `KA_v2_Part5_Templates_Networks_Rules.md` — Module 20 (agent behavior rules, briefing format)
- `Tampa_Pittsburgh_Final_Push_Content.md` — Ready-to-use content for at-risk shows
- `Spotify_Radio_Priming_Ad_Specs.md` — Ad configurations if recommending ad spend
- `DSP_Hack_Checklist.md` — If a release is happening or decay is approaching
