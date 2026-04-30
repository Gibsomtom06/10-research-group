-- 0008_outreach_events.sql
-- Adds open/click tracking for outbound emails.
--
-- Design:
--   * Every outbound send gets a 1x1 pixel inlined at /t/open/<id>.gif
--   * Links in the body are rewritten to /t/click/<id>?u=<encoded_url>
--   * The endpoints write a row to outreach_events AND bump aggregate
--     counters on outreach_log for quick queries in the UI.
--   * IPs are hashed with a rotating daily salt (stored in app config)
--     so we never store raw recipient IPs.
--
-- Delete tracking is explicitly not modeled here — Gmail exposes no
-- recipient-side delete signal for individual senders. If/when we wire
-- Postmaster Tools for the domain, add a `delete` event_type and a
-- webhook ingester.
--
-- Safe to re-run.

-- =========================================================================
-- event_type enum
-- =========================================================================
do $$
begin
    if not exists (select 1 from pg_type where typname = 'outreach_event_type') then
        create type outreach_event_type as enum ('open', 'click', 'unsubscribe');
    end if;
end $$;

-- =========================================================================
-- outreach_events: one row per pixel fetch / link click
-- =========================================================================
create table if not exists outreach_events (
    id               uuid primary key default uuid_generate_v4(),
    outreach_log_id  uuid not null references outreach_log(id) on delete cascade,
    contact_id       uuid references contacts(id) on delete set null,
    event_type       outreach_event_type not null,
    target_url       text,                    -- for clicks
    user_agent       text,
    ip_hash          text,                    -- sha256(ip + daily_salt)
    referrer         text,
    created_at       timestamptz default now()
);

create index if not exists idx_outreach_events_log
    on outreach_events (outreach_log_id, created_at desc);
create index if not exists idx_outreach_events_contact
    on outreach_events (contact_id, created_at desc);
create index if not exists idx_outreach_events_type_time
    on outreach_events (event_type, created_at desc);

-- =========================================================================
-- Aggregate columns on outreach_log for fast UI queries
-- =========================================================================
alter table outreach_log
    add column if not exists first_opened_at  timestamptz,
    add column if not exists open_count       int not null default 0,
    add column if not exists first_clicked_at timestamptz,
    add column if not exists click_count      int not null default 0,
    add column if not exists last_event_at    timestamptz;

create index if not exists idx_outreach_log_first_opened
    on outreach_log (first_opened_at)
    where first_opened_at is not null;
create index if not exists idx_outreach_log_first_clicked
    on outreach_log (first_clicked_at)
    where first_clicked_at is not null;

-- =========================================================================
-- fn_record_outreach_event(log_id, event_type, url, ua, ip_hash, ref)
-- Insert event + bump aggregates on outreach_log in one txn.
-- Returns the inserted event row.
-- =========================================================================
create or replace function fn_record_outreach_event(
    p_log_id      uuid,
    p_event_type  outreach_event_type,
    p_target_url  text default null,
    p_user_agent  text default null,
    p_ip_hash     text default null,
    p_referrer    text default null
) returns outreach_events
language plpgsql as $$
declare
    v_event   outreach_events;
    v_contact uuid;
begin
    -- resolve contact from the log row (allows set null on contact delete)
    select contact_id into v_contact
    from outreach_log
    where id = p_log_id;

    insert into outreach_events (
        outreach_log_id, contact_id, event_type,
        target_url, user_agent, ip_hash, referrer
    )
    values (
        p_log_id, v_contact, p_event_type,
        p_target_url, p_user_agent, p_ip_hash, p_referrer
    )
    returning * into v_event;

    if p_event_type = 'open' then
        update outreach_log
           set first_opened_at = coalesce(first_opened_at, v_event.created_at),
               open_count      = open_count + 1,
               last_event_at   = v_event.created_at
         where id = p_log_id;
    elsif p_event_type = 'click' then
        update outreach_log
           set first_clicked_at = coalesce(first_clicked_at, v_event.created_at),
               click_count      = click_count + 1,
               last_event_at    = v_event.created_at
         where id = p_log_id;
    else
        update outreach_log
           set last_event_at = v_event.created_at
         where id = p_log_id;
    end if;

    -- bump last_interaction_at on the contact so the outreach views
    -- surface engagement even before an explicit reply
    if v_contact is not null then
        update contacts
           set last_interaction_at = greatest(
                   coalesce(last_interaction_at, v_event.created_at),
                   v_event.created_at
               )
         where id = v_contact;
    end if;

    return v_event;
end $$;

-- =========================================================================
-- v_outreach_engagement: roll-up for the /history + dashboard views
-- =========================================================================
create or replace view v_outreach_engagement as
select
    o.id                as outreach_log_id,
    o.contact_id,
    o.subject,
    o.sent_at,
    o.first_opened_at,
    o.open_count,
    o.first_clicked_at,
    o.click_count,
    o.last_event_at,
    c.full_name         as contact_name,
    c.email             as contact_email,
    c.city              as contact_city,
    c.state             as contact_state,
    c.relationship_tier
from outreach_log o
left join contacts c on c.id = o.contact_id
where o.direction = 'outbound'
  and o.status   = 'sent';
