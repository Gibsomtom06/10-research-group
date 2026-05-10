# DBA — Domain Model

How offers, contracts, agents, and standard deal terms relate. Refer here when building any feature that touches the offer lifecycle.

---

## Offers ARE contracts (post-migration 0009)

Migration 0009 eliminated a separate contract-ingest pipeline. **An offer row holds the entire contract lifecycle.** No separate `contracts` table exists; never re-introduce one.

### Offer lifecycle states (`offer_status` enum)

```
inbound → evaluating → countered → memo_sent → signed_by_thomas → fully_executed → deposit_received
```

Plus terminal sidesteps: `declined`, `withdrawn`, `expired`. Also `inbound → declined` directly on pass.

### Kanban (`/offers`)

Six columns mirror the lifecycle: **new**, **negotiating**, **awaiting my sig**, **awaiting promoter sig**, **awaiting deposit**, **locked**. Reads `v_offer_contract_status`.

## Agent relays (post-0010, fixed in 0012)

Offers don't always come direct from a promoter. Thomas has agents who relay:

- **Andrew Lehr / AB Touring** → `source = 'agent_ab'` (active primary, `andrew@abtouring.com`)
- **Colton Anderson @ PRYSM Talent Agency** → `source = 'agent_prysm'` (`@prysmtalentagency.com` — 0010 used wrong `@prysmagency.com`; 0012 backfilled). **LEGACY** — being transitioned out via Adobe Sign "DirtySnatcha_Prysm_Mutual_Transition_and_Release".
- **Other agents** → `source = 'agent_other'`
- **Direct from promoter** → `source = 'direct_promoter'`
- **Manual / `gigwell_import`** → legacy import sources

### Routing model

- `contact_id` = primary reply-to (whoever emailed us)
- `relayed_by_contact_id` = the agent, if relayed
- `promoter_contact_id` = underlying promoter, optional
- `reply_to_contact_id` = override if Thomas wants us to cc the promoter anyway
- `fn_offer_reply_to(offer_id)` resolves to `coalesce(reply_to, relayed_by, contact_id)`

**Always use `fn_offer_reply_to()` or the `coalesce(reply_to, relayed_by, contact_id)` pattern. Don't assume `contact_id` is the promoter.**

### Commission

`agent_commission_pct` (default 10% for AB / PRYSM via `dsr_standard_deal_terms`). `net_to_artist` is a **generated column** = `guarantee * (1 - agent_commission_pct/100.0)`. **Use `net_to_artist`, not `guarantee`, for anything user-facing about Thomas's take-home.**

## Standard deal terms (view: `dsr_standard_deal_terms`)

Refresh this view anytime the defaults change. Current values:

- `deposit_pct_default = 50`, minimum `10`
- `deposit_due_days = 30`
- `override_pct = 85` (of gross after expenses)
- `radius_miles = 75`, `radius_days = 30` before / `30` after
- `hospitality = 'standard'`
- `sound_lights = 'promoter_provided'`
- `cancellation = 'force_majeure'`
- `travel_provided = true`, `lodging_provided = true`
- `agent_commission_pct_default = 10`

⚠ Set from Thomas's stated preferences + industry norms for mid-tier headliner. Task #50 in `TASKS.md`: backfill from parsed Colton (PRYSM) email threads.

## Lifecycle RPCs

- `fn_offer_sign_thomas(offer_id)` — stamps `signed_at_thomas`, advances status. Refuses `hard_block` from `fn_offer_radius_check()` unless called with `{force: true}`.
- `fn_offer_sign_promoter(offer_id)` — stamps `signed_at_promoter`, advances to `fully_executed`.
- `fn_offer_record_deposit(offer_id, amount, method)` — stamps `deposit_received_at`, advances to `deposit_received`.

## View: `v_offer_contract_status`

Pre-computes lifecycle flags: `is_new`, `is_negotiating`, `needs_thomas_sig`, `needs_promoter_sig`, `awaiting_deposit`, `is_locked`, `is_relayed`, `days_until_show`. Plus all key columns including `net_to_artist`.

**Use `v_offer_contract_status` for kanban / dashboard READS. Use the raw `offers` table for WRITES.**

## Supabase joins — disambiguate FKs

When a table has multiple FKs to the same target (e.g., `offers` → `contacts` three ways), use the `!fkey_name` syntax:

```ts
.select(`id, status,
  contact:contacts!offers_contact_id_fkey(full_name, email),
  relayed_by:contacts!offers_relayed_by_contact_id_fkey(full_name, email),
  promoter:contacts!offers_promoter_contact_id_fkey(full_name, email)`)
```

Without `!fkey`, Supabase errors *"could not embed because more than one relationship was found."*
