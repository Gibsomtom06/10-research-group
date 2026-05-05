-- migration 0025 — outreach v2: threads, requests, pitches, coordinations, favors
--
-- models the actual shape of music industry outreach (sketched 2026-05-04 with
-- lance dunlap as the anchor case). adds five new entities + an interactions
-- view, plus a backfill of lance's data as the prototype.
--
--   thread          — groups related events into a storyline (e.g. "ds b2b mport — excision tour")
--   request         — inbound questions ("excision team asked lance: who could mport b2b with?")
--   pitch           — a strategic pitch attempt; broader than an offer; may never become one
--   coordination    — between-managers alignment BEFORE a pitch goes out
--   favor           — the IOU ledger. music biz runs on social capital.
--   v_outreach_interactions — union-flattened timeline view per contact
--
-- existing offers table is unchanged. when a pitch lands, outreach_pitches.landed_offer_id
-- points at the resulting offer row (offers is a view-over-deals so it's a weak ref).

-- ─── enums ────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'thread_status') then
    create type thread_status as enum ('active', 'won', 'lost', 'dormant');
  end if;
  if not exists (select 1 from pg_type where typname = 'pitch_type') then
    create type pitch_type as enum (
      'standard',       -- artist for venue/date
      'tour_add',       -- artist opens for headliner on tour
      'b2b',            -- two artists joint set
      'festival_slot',  -- artist for festival lineup
      'guest_spot'      -- artist joins headliner mid-set
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'pitch_outcome') then
    create type pitch_outcome as enum (
      'pitched',            -- sent, waiting
      'landed',             -- became an offer
      'not_selected',       -- buyer picked someone else
      'not_this_one',       -- specific idea didn't fit, relationship intact
      'soft_fade',          -- no reply, atrophy
      'passed_with_reason', -- explicit "no thanks because X"
      'withdrawn'           -- pitcher pulled it
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'coordination_status') then
    create type coordination_status as enum (
      'proposed',
      'aligned',
      'declined',
      'pending_response',
      'expired'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'favor_direction') then
    create type favor_direction as enum (
      'they_owe_thomas',
      'thomas_owes_them',
      'mutual'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'favor_size') then
    create type favor_size as enum ('small', 'medium', 'big');
  end if;
  if not exists (select 1 from pg_type where typname = 'favor_status') then
    create type favor_status as enum (
      'outstanding',
      'partially_called',
      'settled'
    );
  end if;
end $$;

-- ─── threads ──────────────────────────────────────────────────────────
create table if not exists outreach_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_slugs text[] not null default '{}',
  external_org text,
  status thread_status not null default 'active',
  next_action text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_threads_status_idx on outreach_threads(status);
create index if not exists outreach_threads_artists_idx on outreach_threads using gin (artist_slugs);

-- ─── requests ────────────────────────────────────────────────────────
-- inbound asks. e.g. "excision team → lance: who could mport b2b with?"
-- or "lance → thomas: send me artist fits".
create table if not exists outreach_requests (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references outreach_threads(id) on delete set null,
  from_contact_id uuid references contacts(id) on delete set null,
  to_contact_id uuid references contacts(id) on delete set null,
  to_is_thomas boolean not null default false,
  question text not null,
  channel text,                       -- email | text | dm | in_person | phone
  asked_at timestamptz not null default now(),
  decay_days int default 30,          -- how long stays "live" before fading
  resolved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_requests_thread_idx on outreach_requests(thread_id);
create index if not exists outreach_requests_from_idx on outreach_requests(from_contact_id);
create index if not exists outreach_requests_active_idx on outreach_requests(asked_at desc) where resolved_at is null;

-- ─── pitches ─────────────────────────────────────────────────────────
-- a strategic pitch attempt. broader than an offer.
create table if not exists outreach_pitches (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references outreach_threads(id) on delete set null,
  proposed_by_contact_id uuid references contacts(id) on delete set null,
  pitched_through_contact_id uuid references contacts(id) on delete set null,
  proposed_by_thomas boolean not null default false,
  on_behalf_of_artist_slugs text[] not null default '{}',
  responding_to_request_id uuid references outreach_requests(id) on delete set null,
  pitched_to_contact_id uuid references contacts(id) on delete set null,
  pitched_to_org text,
  pitch_type pitch_type not null default 'standard',
  context text,                       -- "denver excision date 2026-XX-XX"
  proposed_date date,
  outcome pitch_outcome not null default 'pitched',
  outcome_at timestamptz,
  landed_offer_id uuid,               -- weak ref; offers is a view
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_pitches_thread_idx on outreach_pitches(thread_id);
create index if not exists outreach_pitches_outcome_idx on outreach_pitches(outcome);
create index if not exists outreach_pitches_artists_idx on outreach_pitches using gin (on_behalf_of_artist_slugs);
create index if not exists outreach_pitches_recent_idx on outreach_pitches(updated_at desc);

-- ─── coordinations ───────────────────────────────────────────────────
-- between-managers alignment BEFORE a pitch. e.g. thomas → lance:
-- "cool if i pitch ds b2b mport for excision tour leg 2?"
create table if not exists outreach_coordinations (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references outreach_threads(id) on delete set null,
  initiated_by_contact_id uuid references contacts(id) on delete set null,
  initiated_by_thomas boolean not null default false,
  with_contact_id uuid references contacts(id) on delete set null,
  topic text not null,
  status coordination_status not null default 'pending_response',
  resulting_pitch_id uuid references outreach_pitches(id) on delete set null,
  proposed_at timestamptz not null default now(),
  resolved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_coordinations_thread_idx on outreach_coordinations(thread_id);
create index if not exists outreach_coordinations_pending_idx on outreach_coordinations(status, proposed_at desc)
  where status in ('pending_response', 'proposed');
create index if not exists outreach_coordinations_with_idx on outreach_coordinations(with_contact_id);

-- ─── favors ──────────────────────────────────────────────────────────
-- the IOU ledger.
create table if not exists outreach_favors (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  direction favor_direction not null,
  size favor_size not null default 'medium',
  source text not null,               -- "thomas booked mport on multiple ds shows 2026"
  status favor_status not null default 'outstanding',
  evidence_url text,
  acknowledged_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_favors_contact_idx on outreach_favors(contact_id);
create index if not exists outreach_favors_outstanding_idx on outreach_favors(contact_id, status)
  where status != 'settled';

-- ─── interactions view ───────────────────────────────────────────────
-- union-flattened timeline of (request | pitch | coordination) per contact.
-- /contacts/:id and /outreach/threads/:id read this.
create or replace view v_outreach_interactions as
  select
    r.id,
    r.thread_id,
    'request'::text as kind,
    coalesce(r.from_contact_id, r.to_contact_id) as primary_contact_id,
    r.from_contact_id,
    r.to_contact_id,
    null::uuid as resulting_pitch_id,
    r.question as summary,
    null::pitch_outcome as pitch_outcome,
    null::coordination_status as coord_status,
    r.asked_at as event_at,
    r.notes,
    r.created_at,
    r.updated_at
  from outreach_requests r
  union all
  select
    p.id,
    p.thread_id,
    'pitch'::text as kind,
    coalesce(p.pitched_through_contact_id, p.proposed_by_contact_id, p.pitched_to_contact_id) as primary_contact_id,
    p.proposed_by_contact_id as from_contact_id,
    p.pitched_to_contact_id as to_contact_id,
    null::uuid as resulting_pitch_id,
    coalesce(p.context, p.notes, p.pitch_type::text) as summary,
    p.outcome as pitch_outcome,
    null::coordination_status as coord_status,
    coalesce(p.outcome_at, p.updated_at) as event_at,
    p.notes,
    p.created_at,
    p.updated_at
  from outreach_pitches p
  union all
  select
    c.id,
    c.thread_id,
    'coordination'::text as kind,
    coalesce(c.with_contact_id, c.initiated_by_contact_id) as primary_contact_id,
    c.initiated_by_contact_id as from_contact_id,
    c.with_contact_id as to_contact_id,
    c.resulting_pitch_id,
    c.topic as summary,
    null::pitch_outcome as pitch_outcome,
    c.status as coord_status,
    c.proposed_at as event_at,
    c.notes,
    c.created_at,
    c.updated_at
  from outreach_coordinations c;

-- ─── lance backfill (prototype) ──────────────────────────────────────
-- idempotent: only seeds if lance is in contacts AND we haven't already.
do $$
declare
  lance_id uuid;
  thread_id_v uuid;
  request_id_v uuid;
  pitch_id_v uuid;
begin
  -- find lance dunlap; tolerate either name column convention
  select id into lance_id from contacts
   where lower(coalesce(full_name, name)) like '%lance dunlap%'
      or lower(coalesce(email, '')) like '%lance%mport%'
   limit 1;

  if lance_id is null then
    raise notice 'lance dunlap not found in contacts; skip seeding (re-run 0025 after contact is added)';
    return;
  end if;

  -- idempotency: if any favor row already exists for lance referencing mport, skip.
  if exists (select 1 from outreach_favors where contact_id = lance_id and source ilike '%mport%') then
    raise notice 'lance outreach prototype already seeded; skip';
    return;
  end if;

  -- thread: ds b2b mport — excision
  insert into outreach_threads (title, artist_slugs, external_org, status, next_action, notes)
  values (
    'dirtysnatcha b2b mport — excision tour',
    array['dirtysnatcha', 'mport'],
    'excision touring',
    'active',
    'wait on lance reply re leg-2 pitch idea',
    'thread spans request → lance pitch (denver, not selected) → thomas coordination ask (leg 2, pending)'
  )
  returning id into thread_id_v;

  -- request: excision team asked lance "who could mport b2b with?"
  insert into outreach_requests (
    thread_id, from_contact_id, question, channel, notes
  ) values (
    thread_id_v,
    null,                               -- excision buyer not in contacts yet
    'who could mport b2b with on excision tour?',
    'unknown',
    'asked of lance directly, not thomas. originated the whole b2b idea.'
  )
  returning id into request_id_v;

  -- pitch: lance proposed mport+ds for denver, not_selected
  insert into outreach_pitches (
    thread_id,
    proposed_by_contact_id, pitched_through_contact_id,
    on_behalf_of_artist_slugs,
    responding_to_request_id,
    pitch_type,
    context,
    outcome,
    outcome_at,
    notes
  ) values (
    thread_id_v,
    lance_id, lance_id,
    array['mport', 'dirtysnatcha'],
    request_id_v,
    'b2b'::pitch_type,
    'denver excision date',
    'not_selected'::pitch_outcome,
    now() - interval '7 days',
    'lance pitched on his own initiative, responding to the excision team request. used his connection. thomas was beneficiary, not pitcher.'
  )
  returning id into pitch_id_v;

  -- coordination: thomas → lance, leg-2 pitch idea, pending response
  insert into outreach_coordinations (
    thread_id,
    initiated_by_thomas,
    with_contact_id,
    topic,
    status,
    notes
  ) values (
    thread_id_v,
    true,
    lance_id,
    'thomas pitches dirtysnatcha b2b mport for excision tour leg 2',
    'pending_response'::coordination_status,
    'live coordination — waiting on lance greenlight before thomas pitches excision side directly.'
  );

  -- inbound ask: lance → thomas, "send me artists that fit"
  insert into outreach_requests (
    thread_id, from_contact_id, to_is_thomas, question, channel, notes
  ) values (
    null,                               -- standalone open invitation, not in the b2b thread
    lance_id,
    true,
    'send me artists that may be a good fit for my shows',
    'in_person',
    'open standing ask. eligible artists: dirtysnatcha, kotrax, hvrcrft, dark matter.'
  );

  -- favor: lance owes thomas, partially called (he tried excision denver)
  insert into outreach_favors (
    contact_id, direction, size, source, status, acknowledged_at, notes
  ) values (
    lance_id,
    'they_owe_thomas'::favor_direction,
    'medium'::favor_size,
    'thomas booked mport on multiple ds shows in 2026',
    'partially_called'::favor_status,
    now() - interval '14 days',
    'lance acknowledged via text/email: "thank you for putting mport on all these shows i owe you". partially_called: lance pitched mport+ds at excision denver — didn''t land but tried, so debt reduced not reset.'
  );

  raise notice 'seeded outreach prototype for lance dunlap (contact_id=%)', lance_id;
end $$;

-- ─── sanity ──────────────────────────────────────────────────────────
select
  'info: 0025 outreach_v2 ready' as status,
  (select count(*) from outreach_threads) as threads,
  (select count(*) from outreach_requests) as requests,
  (select count(*) from outreach_pitches) as pitches,
  (select count(*) from outreach_coordinations) as coordinations,
  (select count(*) from outreach_favors) as favors;
