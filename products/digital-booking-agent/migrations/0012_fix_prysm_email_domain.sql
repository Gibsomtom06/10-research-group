-- 0012_fix_prysm_email_domain.sql
--
-- Bug fix for migration 0010.
--
-- 0010 backfilled `source = 'agent_prysm'` by matching contact emails
-- ending in `@prysmagency.com`. That domain is WRONG — Colton's actual
-- email is `colton@prysmtalentagency.com` (verified 2026-04-22 from
-- the TENx10 platform source where the contact data is hard-coded).
--
-- Any offer routed through a PRYSM contact using the correct domain
-- was therefore left as `direct_promoter` after 0010 ran. This
-- migration sweeps those and retags them.
--
-- We also tag the reverse: if any @prysmagency.com contacts were
-- mistakenly created (typo, bad import) they still get the agent_prysm
-- source from 0010 — we leave those alone; the migration is additive.
--
-- Safe to re-run.

-- =========================================================================
-- 1. Re-backfill with the correct domain.
-- =========================================================================
update offers o
set source = 'agent_prysm',
    relayed_by_contact_id = o.contact_id,
    agent_commission_pct = coalesce(o.agent_commission_pct, 10)
from contacts c
where o.contact_id = c.id
  and (o.source is null or o.source = 'direct_promoter')
  and c.email ilike '%@prysmtalentagency.com';

-- =========================================================================
-- 2. Also normalize any @prysmagency.com addresses that were created
--    as a typo. They don't resolve to a real PRYSM domain — flag them
--    so Thomas can clean up. We don't auto-rewrite the email because
--    that might be someone's actual inbox. Just mark the contact with
--    a note so it surfaces in the contacts UI.
-- =========================================================================
update contacts
set notes = trim(both E'\n' from coalesce(notes, '') ||
    E'\n[0012] email domain is @prysmagency.com — did you mean @prysmtalentagency.com?')
where email ilike '%@prysmagency.com'
  and (notes is null or notes not like '%[0012]%');

-- =========================================================================
-- Sanity
-- =========================================================================
select 'info: offers now tagged agent_prysm' as info, count(*) as n
from offers where source = 'agent_prysm';

select 'info: offers retagged from direct_promoter to agent_prysm in this run' as info,
       count(*) as n
from offers o
join contacts c on c.id = o.contact_id
where o.source = 'agent_prysm'
  and c.email ilike '%@prysmtalentagency.com';

select 'info: contacts with flagged typo-domain @prysmagency.com' as info, count(*) as n
from contacts
where email ilike '%@prysmagency.com';
