# Financial Tracking Reference

## Contract Types

| Type | Description | Example |
|:-----|:------------|:--------|
| Flat | Fixed guarantee regardless of ticket sales | $2,000 flat |
| VS | Guarantee vs percentage of net (whichever is higher) | $1,500 vs 90% NET |
| Bonus | Flat guarantee + bonus after threshold | $1,600 + bonus after 200 sold |

## Per-Show Financial Fields

| Field | Type | Description |
|:------|:-----|:------------|
| guarantee | Decimal | Base offer amount |
| contract_type | Enum | flat / vs / bonus |
| bonus_threshold | Integer | Ticket count that triggers bonus |
| bonus_amount | Decimal | Bonus payout amount |
| deposit_amount | Decimal | Required deposit |
| deposit_due_date | Date | When deposit is due |
| deposit_status | Enum | pending / received / overdue |
| final_payment_due | Date | When final payment is due |
| final_payment_status | Enum | pending / received / overdue |
| merch_split | Text | Venue/artist percentage (e.g., "80/20 artist") |
| marketing_budget_digital | Decimal | Trackable paid ads budget |
| marketing_budget_creative | Decimal | Design/flyers budget |
| marketing_budget_street | Decimal | Physical/street team budget |
| cost_per_ticket | Decimal | Calculated: ad spend / tickets sold |
| agent_commission_rate | Decimal | Typically 10% |
| agent_commission_amount | Decimal | Auto-calculated from guarantee |
| mgmt_commission_rate | Decimal | Typically 10% (PRYSM) |
| mgmt_commission_amount | Decimal | Auto-calculated from guarantee |
| artist_payout | Decimal | Guarantee minus commissions |

## Commission Structure

Standard split: 10% to PRYSM (management), 10% to booking agent (TOM), remainder to LEE (artist). Every offer tagged with originating agent for commission tracking.

## Payment Tracking Rules

1. Deposit overdue → auto-alert to Thomas + follow-up email to promoter
2. Final payment overdue → escalation alert
3. All payments logged with date received and method (Zelle, wire, check)
4. Partial payments tracked with running balance
