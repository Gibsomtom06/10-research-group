---
name: dsr-booking-evaluator
description: Evaluate show offers for DirtySnatcha using the full 6-step booking decision engine. Use this skill EVERY TIME the user mentions a new offer, a show they're considering, "should I take this show", "got an offer", "booking today", "evaluate this deal", "is this worth it", "what should I counter at", or any variant of receiving and evaluating a live performance opportunity. Also trigger when the user pastes offer details, emails from promoters or booking agents containing show opportunities, or asks about pricing/guarantees for a specific city. This is the second most critical workflow in the DSR platform after daily briefings.
---

# DSR Booking Evaluator Skill

## What This Skill Does

End-to-end offer evaluation pipeline: detect offer email → parse email body AND all attachments (especially PDFs) → run 6-step booking decision engine → analyze radius clauses against existing dates and festivals → calculate routing options → present structured recommendation → let Thomas take action (counter/approve/check date/decline) → draft and send reply.

## When to Use

- User says "got an offer", "new show offer", "should I take this"
- User pastes an email from a promoter or booking agent
- User asks "what should I counter at" for a specific market
- User wants to compare an offer against existing tour dates
- User says "booking today" or "evaluating a deal"
- User asks to check email for new offers

---

## PHASE 1: OFFER DETECTION & INTAKE

### Step 1: Find the Offer Email

When the user says there's an offer, search Gmail for it:

```
Search patterns (try in order):
1. from:andrew@abtouring.com subject:offer (most common — Andrew at AB Touring)
2. from:colton@prysmtalentagency.com subject:offer (Colton at PRYSM)
3. from:andrew@abtouring.com newer_than:2d (recent emails from Andrew)
4. subject:dirtysnatcha offer (catch-all)
```

Known agent emails:
- Andrew Lehr: andrew@abtouring.com / (814) 602-5613 (AB Touring — primary)
- Colton Anderson: colton@prysmtalentagency.com / 734-904-0224 (PRYSM — legacy)

### Step 2: Parse the Email Body

Extract from the email text:
- City, state, venue name
- Guarantee amount and deal structure (flat / VS / bonus)
- Deposit terms
- Target dates (single date or MAD options)
- Support artists mentioned
- Any special terms (hotel buyout, travel, rider notes)
- Who sent it (agent tag for commission tracking)

### Step 3: Parse ALL Attachments — THIS IS CRITICAL

**Always check for attachments.** Offer emails almost always include a PDF with the full deal terms. The email body is a summary — the PDF is the contract-level detail.

To read the PDF:
1. Open the email in Gmail (navigate to the message URL)
2. Click on the PDF attachment to open the Gmail preview
3. Screenshot and read ALL pages (check page count at bottom of preview)
4. Extract every field from the PDF, especially:

**From the PDF offer sheet, extract:**
- **Promoter company name** (not just the contact — the LLC/entity)
- **Contract signatory name**
- **Promoter email, phone, address**
- **Venue name, address, capacity**
- **Venue website / social media**
- **Stage (main/side), billing (headliner %)**
- **Set time, doors, curfew**
- **Ticket price tiers** (needed for revenue modeling on VS/bonus deals)
- **Deposit amount, deposit due date, final payment terms**
- **Hospitality budget**
- **Guest list count**
- **Other artists on the bill**
- **RADIUS CLAUSE** — distance, duration before AND after. This is the #1 most important contract term to extract.
- **Age restriction (18+ / 21+)**
- **Offer expiration date**
- **Any marketing commitments from promoter**
- **Any special clauses (force majeure, photography rights, foreign citizen tax, etc.)**

**If a PDF exists and you don't read it, the analysis is incomplete. Period.**

### Step 4: Merge Email + PDF Data

Combine both sources. The PDF usually has MORE detail than the email. If they conflict, the PDF is the contract — it takes precedence. Flag any discrepancies to Thomas.

---

## PHASE 2: THE 6-STEP DECISION ENGINE

### Common Offer Terminology

- **MAD** = Mutual Agreeable Date — date is flexible, both sides agree on a window. NOT a promoter name or series.
- **VS** = Versus deal (guarantee vs. percentage of net, whichever is higher)
- **GBOR** = Gross Box Office Revenue
- **DS** = Direct Support (opener right before headliner)
- **Walkout** = Maximum potential payout if all bonus tiers hit

**CRITICAL: Do NOT assume connections between offers, promoters, or series based on abbreviations you don't recognize. If you see a term you're unsure about, ASK — don't guess. Wrong assumptions lead to bad negotiation leverage.**

### Step 5: FLOOR CHECK

**DirtySnatcha's current floor:** $1,500 minimum guarantee.

- Offer < $1,500 → "Below floor. Decline or counter at $1,875 (floor + 25%)."
- Offer ≥ $1,500 → PASS
- Exception: Support slots may accept lower if headliner provides massive visibility (Infected Mushroom, Excision-tier). Flag the trade-off explicitly.

### Step 6: MARKET CHECK

Search project knowledge for the offer city:
1. Has DirtySnatcha played this city before? Check tour grid + Master Bible history.
2. If YES: new offer < previous guarantee → counter at previous + 10%.
3. If NO: "New market. Acceptable at lower rate to build, but not below floor."
4. Check nearby markets for routing potential.

### Step 7: CPT ANALYSIS + DATE OPTIONS

**If MAD offer:** Run analysis on EACH date option and present a comparison:

```
DATE OPTIONS:
| Date | Days Out | Nearby Shows (±3d / 300mi) | Route? | Routing Partner City | Holiday/Competition | Rec |
|------|----------|---------------------------|--------|---------------------|--------------------|----|
```

For each date option, also check:
- Can we route this with another pending offer or existing show?
- Does this date fall on a holiday weekend (4th of July, Memorial Day, Labor Day)?
- How much marketing runway do we have?
- Are there competing shows/festivals in that market that weekend?

**Recommend the best date with a clear reason AND suggest routing partners if possible.**

**CPT calculation:**
```
CPT = (artist_ad_spend + estimated_travel) / expected_attendance

artist_ad_spend baseline: ~$125 (Shazam Spike $75 + Save Campaign $50)
Travel estimate:
  Drive (<4 hrs): $100-200
  Fly: $300-600 flight + hotel + ground (subtract any buyout from promoter)
Expected attendance: capacity × fill rate (new market 40-60%, returning 60-80%, strong market 80-100%)
```

CPT thresholds: <$3 good, $3-5 marginal, >$5 losing money. Adjust by market tier.

### Step 8: RADIUS CLAUSE ANALYSIS — DO NOT SKIP

**If the offer includes a radius clause, this step is mandatory.**

1. Extract the exact radius terms: distance (miles) + duration (days before AND after)
2. Calculate the geographic radius on a map from the venue city
3. Check EVERY existing tour date and pending offer against the radius:
   - City + approximate distance from venue
   - Date + whether it falls within the time window
   - Flag any conflicts as 🔴 CRITICAL
4. Check known festivals within the radius window:
   - Search project knowledge (Master Bible Section 14 — Festival Submission Tracker)
   - Search the web for EDM/bass festivals in the region during the radius window
   - Flag any festivals you're submitted to or could get booked for
5. **If the radius clause conflicts with existing dates:** Recommend modification terms (reduce miles, reduce days, carve out specific cities/dates)
6. **If the radius is aggressive for the guarantee level:** Call it out. A 150mi/90day clause on a $2K deal is unreasonable. Compare to industry standard (~50-75mi / 30-45 days for this guarantee tier).

Present radius analysis as:
```
RADIUS CLAUSE: [X] miles / [Y] days before & after

CONFLICT CHECK:
| Existing Date | City | Distance | In Radius? | In Time Window? | Status |
|---------------|------|----------|------------|-----------------|--------|
```

### Step 9: PROMOTER CHECK

- Search project knowledge for promoter name/company
- Check Module 19 promoter network directory
- Found + graded → pull grade, adjust deposit requirements
- Not found → "Unknown promoter. Require 50% deposit minimum."
- **Red flags to note:** Gmail address (not company domain), low hospitality budget, no website, missing marketing commitment

### Step 10: MARKETING BUDGET CHECK

- Is there an itemized marketing budget in the offer? (Check both email and PDF)
- NO → "Missing marketing breakdown. Request $150 minimum digital ad spend."
- YES + digital < $150 → "Light. Add marketing commitment clause."
- YES + digital ≥ $150 → PASS

---

## PHASE 3: RECOMMENDATION + ACTION

### Step 11: Generate Recommendation

Output ONE of: **ACCEPT / COUNTER / DECLINE**

**Counter Amount Formula:**
```
Counter = MAX of:
  1. Floor ($1,500) + 25% = $1,875
  2. Previous guarantee in same market + 10%
  3. Offer + (estimated travel cost / 2)
  4. (Target CPT × expected attendance) + ad budget
```

### Step 12: Format Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OFFER EVALUATION: [City], [State] — [Date or "MAD"]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📨 SOURCE: [Agent name] via [email] — received [date]
📎 ATTACHMENT: [filename.pdf] — PARSED ✅

PROMOTER: [Company name] — [Contact name]
📧 [email] 📞 [phone]
🏢 [address]

VENUE: [name] — [address]
🎪 Capacity: [X] | Stage: [type] | Ages: [X+]
🔗 [website/social]

DEAL:
💰 $[guarantee] [flat/VS/bonus] + [bonus structure if any]
💵 Deposit: [amount] ([%]) due [date]
💵 Balance: [terms]
🏨 Hotel: [buyout amount or N/A]
🚗 Ground: [buyout amount or N/A]
🍽️ Hospitality: $[amount]
🎫 Ticket prices: [tiers]
🎤 Other artists: [list]
📋 Guest list: [count]

━━━ 6-STEP ANALYSIS ━━━

1️⃣ FLOOR: ✅ PASS / ❌ BELOW ($X vs $1,500 min)
2️⃣ MARKET: [New / Returning — prev $X / Route opportunity]
3️⃣ CPT: $X.XX — [Good / Marginal / Losing]
4️⃣ CALENDAR: [Standalone / Routed / Conflict]
5️⃣ PROMOTER: [Grade / Unknown — flags]
6️⃣ MARKETING: ✅ / ⚠️ Light / ❌ Missing

━━━ DATE OPTIONS (if MAD) ━━━

| Date | Days Out | Route With | Conflicts | Rec |
|------|----------|-----------|-----------|-----|

━━━ RADIUS CLAUSE ANALYSIS ━━━

⚠️ [X] miles / [Y] days before & after
[Conflict table with existing dates + festivals]
[Recommended modification if aggressive]

━━━ FINANCIAL BREAKDOWN ━━━

Guarantee: $[X]
  Manager (Thomas, 10%): $[X]
  Agent ([name], 10%): $[X]
  Artist (Lee, 80%): $[X]
Travel: $[X] (minus $[buyout])
DSR Ad Spend: $[X]
Net profit: $[X]
CPT: $[X]
[If bonus deal: best/worst case scenarios]

━━━ RECOMMENDATION: [ACCEPT / COUNTER / DECLINE] ━━━

[Reasoning in 2-3 sentences max]
```

### Step 13: Present Action Choices

After the evaluation, present Thomas with clear action options using the ask_user_input tool:

**Question 1: "What do you want to do with this offer?"**
Options:
- **Counter with changes** — Draft reply to Andrew with modified terms
- **Approve as-is** — Draft acceptance reply to Andrew
- **Check date availability** — Ask Andrew about a specific date
- **Decline** — Draft polite decline to Andrew

**If COUNTER:** Present recommended counter terms as multi-select so Thomas picks which to include.

**If MAD offer:** Present date options so Thomas picks the preferred date.

### Step 14: Draft and Send Reply

Based on Thomas's selection, draft the reply email to Andrew using Gmail draft tool.

**Counter reply structure:**
```
Subject: Re: [original subject]

Hey Andrew,

Ran the numbers on [City]. Here's where we land:

• [Counter term 1]
• [Counter term 2]
• [Counter term 3]

Let me know if [promoter/company] can work with this.

Thomas Nalian
Lead A&R DirtySnatcha Records
Manager DirtySnatcha
```

**Approve reply:** Confirm deal + lock date + any conditions (confirm support artist, need contract by X).

**Date check reply:** Express interest + preferred date + preliminary conditions.

**Decline reply:** Brief, professional, keep relationship warm. "Appreciate the offer but passing on this one. Keep them coming."

Always confirm with Thomas before sending. Use Gmail create_draft tool so Thomas can review before it goes out.

---

## CRITICAL RULES

1. **ALWAYS parse attachments.** If there's a PDF, read it. The PDF has contract-level detail the email doesn't. Missing it means missing radius clauses, capacity, promoter info, ticket prices. Skipping the PDF is a critical failure.

2. **NEVER auto-accept or auto-send.** Every action requires Thomas's explicit approval.

3. **NEVER assume terminology you don't recognize.** If unsure, ask Thomas.

4. **ALWAYS check radius clauses against ALL existing dates and festivals.** A radius conflict can kill confirmed shows.

5. **ALWAYS present date options for MAD offers** with routing analysis.

6. **ALWAYS run all 6 steps** even if early steps fail.

7. **ALWAYS compare to tour averages.** "This $2K is below your tour average of $2,270."

8. **ALWAYS draft a ready-to-send reply.** Don't just recommend — give Thomas something he can fire off.

9. **Flag red flags:** Gmail addresses, low hospitality (<$50), no marketing commitment, aggressive radius clauses, expiration dates.

10. **For bonus/VS deals, model both scenarios:** worst case (flat guarantee only) and best case (all bonuses hit).

---

## REFERENCE DATA

| What | Where |
|------|-------|
| Floor, commission, rate sheet | `DSR_Master_Operating_Bible_v3.md` Section 1 |
| Current tour grid | `DSR_Tour_Status_Recalibrated_2026-03-01.docx` |
| Promoter/venue network | `KA_v2_Part5_Templates_Networks_Rules.md` Module 19 |
| Market research by city | `DSR_Tour_Book_2026_Clean.md` |
| Financial engine | `KA_v2_Part2_Booking_Money.md` Module 7 |
| Email templates | `KA_v2_Part5_Templates_Networks_Rules.md` Module 18 |
| Promoter follow-ups | `Promoter_Follow_Up_Emails.md` |
| Festival tracker | `DSR_Master_Operating_Bible_v3.md` Section 14 |
| Show lifecycle / radius | `KA_v2_Part2_Booking_Money.md` Module 5 |
