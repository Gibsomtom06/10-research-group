-- 0024_offers_promoter_denorm.sql
--
-- Denormalize promoter info (name, email, company, city, grade) into the
-- offers view so DBA pages can show real promoter names without needing a
-- contact-table FK that doesn't work on views.
--
-- Also adds artist_name (display_name) so the kanban tile can show the
-- artist label without a separate fetch.

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
  -- denormalized promoter
  p.name                                           as promoter_name,
  p.email                                          as promoter_email,
  p.company                                        as promoter_company,
  p.city                                           as promoter_city,
  p.grade                                          as promoter_grade,
  p.shows_with_ds                                  as promoter_shows_with_ds,
  p.is_blacklisted                                 as promoter_is_blacklisted,
  -- denormalized artist
  a.display_name                                   as artist_name,
  -- lifecycle flags
  (d.status::text = 'inquiry')                                          as is_new,
  (d.status::text in ('offer','negotiating'))                           as is_negotiating,
  (d.status::text = 'offer')                                            as needs_thomas_sig,
  (d.status::text = 'confirmed' and not coalesce(d.deposit_paid,false)) as needs_promoter_sig,
  (d.status::text = 'confirmed' and not coalesce(d.deposit_paid,false)) as awaiting_deposit,
  (d.status::text in ('completed') or coalesce(d.deposit_paid, false))  as is_locked,
  case when d.show_date is not null then (d.show_date - current_date)::int else null end as days_until_show
from deals d
left join artists a   on a.id = d.artist_id
left join promoters p on p.id = d.promoter_id;
