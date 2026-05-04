-- 0023_offers_over_deals.sql
--
-- Replace pass-1 stub `offers` view with a real view-over-deals.
-- Maps DBA's expected offer column names to TENx10's deal columns
-- + computes lifecycle flags so DBA's /offers kanban renders TENx10's
-- 233 deals.
--
-- Status mapping (TENx10 deal_status → DBA offer lifecycle text):
--   inquiry     → inbound
--   offer       → evaluating       (offer made, awaiting promoter response)
--   negotiating → countered        (back-and-forth)
--   confirmed   → fully_executed when deposit_paid else signed_by_thomas
--   completed   → deposit_received
--   cancelled   → declined
--
-- Known limitation: deals.promoter_id references promoters table (not
-- contacts). The view exposes promoter_id as contact_id but the
-- DBA app's `contact:contacts!offers_contact_id_fkey(...)` join no
-- longer works on a view. Page query was patched to drop the contact
-- join (just venue + status + dates + amount). Pass 2 should bridge
-- promoters → contacts via email or build a real contact_id column.

drop view if exists offers cascade;

create view offers as
select
  d.id,
  d.promoter_id                                    as contact_id,
  d.venue_id,
  a.slug                                           as artist_slug,
  case d.status::text
    when 'inquiry'     then 'inbound'
    when 'offer'       then 'evaluating'
    when 'negotiating' then 'countered'
    when 'confirmed'   then case when coalesce(d.deposit_paid, false) then 'fully_executed' else 'signed_by_thomas' end
    when 'completed'   then 'deposit_received'
    when 'cancelled'   then 'declined'
    else d.status::text
  end                                              as status,
  case
    when d.promoter_id is not null then 'direct_promoter'
    else 'manual'
  end                                              as source,
  coalesce(d.net_after_commission, d.offer_amount) as net_to_artist,
  d.show_date                                      as proposed_date,
  d.offer_amount                                   as guarantee,
  case
    when d.offer_amount is not null and d.offer_amount > 0 and d.deposit_amount is not null
      then round((d.deposit_amount / d.offer_amount * 100)::numeric, 0)
    else null
  end                                              as deposit_pct,
  case when coalesce(d.deposit_paid, false) then d.updated_at else null end as deposit_received_at,
  null::timestamptz                                as signed_at_thomas,
  null::timestamptz                                as signed_at_promoter,
  d.offer_sheet_url                                as deal_memo_pdf_url,
  d.deal_points                                    as door_deal,
  d.bonus_structure                                as counter_bounds,
  null::jsonb                                      as evaluator_result,
  d.offer_thread_id                                as thread_id,
  d.notes,
  d.created_at,
  d.updated_at,
  (d.status::text = 'inquiry')                                          as is_new,
  (d.status::text in ('offer','negotiating'))                           as is_negotiating,
  (d.status::text = 'offer')                                            as needs_thomas_sig,
  (d.status::text = 'confirmed' and not coalesce(d.deposit_paid,false)) as needs_promoter_sig,
  (d.status::text = 'confirmed' and not coalesce(d.deposit_paid,false)) as awaiting_deposit,
  (d.status::text in ('completed') or coalesce(d.deposit_paid, false))  as is_locked,
  case when d.show_date is not null then (d.show_date - current_date)::int else null end as days_until_show
from deals d
left join artists a on a.id = d.artist_id;
