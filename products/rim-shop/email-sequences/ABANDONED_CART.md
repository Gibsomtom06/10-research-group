# Abandoned Cart — WRS Refurbished Wheels

3-email sequence. Benchmark: $9.86/recipient in recovered revenue (automotive ecom).

Send conditions: cart inactive 1 hour and customer has email. Stop sequence on purchase or unsubscribe.

---

## Email 1 — T+1 hour — gentle nudge

**Subject:** you left something behind

**Preview text:** still available — we held it for you

**Body (plain text, prose, no bullets):**

hey {{first_name}} —

noticed you were checking out the {{finish}} {{size}}" wheels. they're still sitting in your cart and i wanted to make sure you didn't lose your spot.

these are refurbished OEM, inspected and balanced in-house, and we stand behind every set. if you had a question about fitment, finish, or shipping timeline, reply to this email and one of us will get back to you same day.

{{cart_link}}

— wheel repair specialists
ferndale, mi

---

## Email 2 — T+24 hours — objection + small incentive

**Subject:** same wheels, 10% off while we still have them

**Preview text:** running this code for you — expires 48 hours

**Body:**

hey {{first_name}} —

the {{finish}} set you were looking at is still in stock, but these finishes move fast — machined gunmetal and pvd chrome are the ones we refinish and sell through quickest right now.

if shipping cost was the hangup, here's a code that takes 10% off the full cart: **WRS10**. expires in 48 hours.

if it was something else — fitment, timing, color match — just reply. we do this every day and can save you the guesswork.

{{cart_link}}

— wheel repair specialists

---

## Email 3 — T+72 hours — urgency + alternative

**Subject:** last call on your {{finish}} set

**Preview text:** if these sell we refinish the next batch differently

**Body:**

hey {{first_name}} —

quick heads-up — the {{finish}} wheels you saved are down to our last couple of sets in that size. once these ship, the next batch we refinish will likely be a different color run based on what's trending (we're seeing machined gunmetal and hyper graphite outpace everything else for spring).

if you still want them: **WRS10** is live until tonight. if not, reply and tell us what you were hoping for and we'll tell you what we've got.

{{cart_link}}

— wheel repair specialists

---

## Merge fields expected from Klaviyo/equivalent

| Field | Source |
|---|---|
| `first_name` | customer profile |
| `finish` | cart item metadata (custom_label_0 stripped of "finish:") |
| `size` | cart item metadata (custom_label_1 stripped of "size:") |
| `cart_link` | cart recovery URL |

## Deliverability rules

- Send from an authenticated subdomain: `shop@wrs-mi.com` with proper SPF/DKIM/DMARC
- Never send email 3 if emails 1 or 2 bounced
- Unsubscribe link in footer (required)
- Text version of every HTML email

## A/B tests to run after 30 sends

- Email 1 subject: "you left something behind" vs "still holding your wheels"
- Email 2 incentive: 10% vs free shipping
- Email 3 urgency angle: color-run rotation vs stock scarcity
