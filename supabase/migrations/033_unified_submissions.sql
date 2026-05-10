-- ====================================================================
-- CDCC · unified submissions inbox · 2026-05-10
-- ====================================================================
-- Backs the new /admin/inbox surface that lists every form submission
-- across the app in one place.
--
-- Step 1: ensure all four "code-references-but-no-migration" tables
--         exist (contact_submissions, newsletter_subscribers, volunteers,
--         consultation_responses) for any environment that's missing
--         them. Idempotent — no-ops on the existing prod schema.
--
-- Step 2: backfill the uniformity columns (status, reviewed_by,
--         reviewed_at, notes, tags) on every submission table so the
--         inbox can show + persist review state consistently.
--
-- Step 3: create the v_all_submissions view that UNIONs all seven
--         submission sources with a uniform shape, mapping each
--         source's actual column names onto:
--             id, source, source_pk, submitted_at, submitter_email,
--             submitter_name, summary, payload (jsonb), status,
--             reviewed_by, reviewed_at, notes, tags
--
-- Idempotent. Safe to re-run.
-- ====================================================================

-- ── 1. Defensive create-if-not-exists for tables that may be missing ──

create table if not exists contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  phone       text,
  subject     text,
  message     text not null,
  topic       text default 'general',
  source_url  text,
  status      text default 'new'
);

create table if not exists newsletter_subscribers (
  id              bigserial primary key,
  created_at      timestamptz not null default now(),
  email           text not null unique,
  full_name       text,
  phone           text,
  disciplines     text[] default '{}',
  province        text,
  source          text default 'public',
  verify_token    text,
  verified        boolean default false,
  verified_at     timestamptz,
  unsub_token     text,
  unsubscribed    boolean default false,
  unsubscribed_at timestamptz
);

create table if not exists newsletter_lists (
  id          bigserial primary key,
  slug        text not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists newsletter_list_subscribers (
  list_id       bigint references newsletter_lists(id) on delete cascade,
  subscriber_id bigint references newsletter_subscribers(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (list_id, subscriber_id)
);

create table if not exists volunteers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  full_name   text not null,
  email       text not null,
  phone       text,
  interests   text[] default '{}',
  availability text,
  skills      text,
  status      text default 'new'
);

create table if not exists consultation_responses (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  consultation_id   integer,
  respondent_name   text,
  respondent_email  text,
  organisation      text,
  position_stance   text,
  response_text     text,
  public            boolean default false,
  signed_on         boolean default false
);

-- ── 2. Backfill uniformity columns ─────────────────────────────────────

alter table constituency_submissions add column if not exists reviewed_by text;
alter table constituency_submissions add column if not exists reviewed_at timestamptz;
alter table constituency_submissions add column if not exists tags text[] default '{}';

alter table contact_submissions add column if not exists notes text;
alter table contact_submissions add column if not exists reviewed_by text;
alter table contact_submissions add column if not exists reviewed_at timestamptz;
alter table contact_submissions add column if not exists tags text[] default '{}';

alter table newsletter_subscribers add column if not exists notes text;
alter table newsletter_subscribers add column if not exists reviewed_by text;
alter table newsletter_subscribers add column if not exists reviewed_at timestamptz;
alter table newsletter_subscribers add column if not exists tags text[] default '{}';
alter table newsletter_subscribers add column if not exists status text default 'new';

alter table volunteers add column if not exists notes text;
alter table volunteers add column if not exists reviewed_by text;
alter table volunteers add column if not exists reviewed_at timestamptz;
alter table volunteers add column if not exists tags text[] default '{}';

alter table event_registrations add column if not exists notes text;
alter table event_registrations add column if not exists reviewed_by text;
alter table event_registrations add column if not exists reviewed_at timestamptz;
alter table event_registrations add column if not exists tags text[] default '{}';
alter table event_registrations add column if not exists status text default 'new';

alter table consultation_responses add column if not exists notes text;
alter table consultation_responses add column if not exists reviewed_by text;
alter table consultation_responses add column if not exists reviewed_at timestamptz;
alter table consultation_responses add column if not exists tags text[] default '{}';
alter table consultation_responses add column if not exists status text default 'new';

alter table press_submissions add column if not exists notes text;
alter table press_submissions add column if not exists tags text[] default '{}';

-- ── 3. The v_all_submissions view ──────────────────────────────────────

drop view if exists v_all_submissions;
create or replace view v_all_submissions as
select
  cs.id::text                                    as id,
  'join'::text                                   as source,
  cs.id::text                                    as source_pk,
  cs.created_at                                  as submitted_at,
  cs.email                                       as submitter_email,
  cs.name                                        as submitter_name,
  coalesce(cs.constituency_type::text, 'member application')
                                                 as summary,
  to_jsonb(cs.*)                                 as payload,
  coalesce(cs.status, 'new')                     as status,
  cs.reviewed_by                                 as reviewed_by,
  cs.reviewed_at                                 as reviewed_at,
  cs.notes                                       as notes,
  cs.tags                                        as tags
from constituency_submissions cs

union all
select
  c.id::text                                     as id,
  'contact'::text                                as source,
  c.id::text                                     as source_pk,
  c.created_at                                   as submitted_at,
  c.email                                        as submitter_email,
  c.name                                         as submitter_name,
  coalesce(c.subject, c.topic, 'contact enquiry') as summary,
  to_jsonb(c.*)                                  as payload,
  coalesce(c.status, 'new')                      as status,
  c.reviewed_by                                  as reviewed_by,
  c.reviewed_at                                  as reviewed_at,
  c.notes                                        as notes,
  c.tags                                         as tags
from contact_submissions c

union all
select
  n.id::text                                     as id,
  'newsletter'::text                             as source,
  n.id::text                                     as source_pk,
  n.created_at                                   as submitted_at,
  n.email                                        as submitter_email,
  n.full_name                                    as submitter_name,
  case
    when n.unsubscribed then 'unsubscribed'
    when n.verified then 'verified subscription'
    else 'newsletter subscription · pending verification'
  end                                            as summary,
  to_jsonb(n.*)                                  as payload,
  coalesce(n.status, case
    when n.unsubscribed then 'archived'
    when n.verified then 'actioned'
    else 'new'
  end)                                           as status,
  n.reviewed_by                                  as reviewed_by,
  n.reviewed_at                                  as reviewed_at,
  n.notes                                        as notes,
  n.tags                                         as tags
from newsletter_subscribers n

union all
select
  v.id::text                                     as id,
  'volunteer'::text                              as source,
  v.id::text                                     as source_pk,
  v.created_at                                   as submitted_at,
  v.email                                        as submitter_email,
  v.full_name                                    as submitter_name,
  coalesce(array_to_string(v.interests, ', '), 'volunteer enquiry')
                                                 as summary,
  to_jsonb(v.*)                                  as payload,
  coalesce(v.status, 'new')                      as status,
  v.reviewed_by                                  as reviewed_by,
  v.reviewed_at                                  as reviewed_at,
  v.notes                                        as notes,
  v.tags                                         as tags
from volunteers v

union all
select
  er.id::text                                    as id,
  'event_registration'::text                     as source,
  er.id::text                                     as source_pk,
  er.created_at                                  as submitted_at,
  er.email                                       as submitter_email,
  er.name                                        as submitter_name,
  ('event registration · ' ||
    coalesce((select title from events where id = er.event_id), 'event #' || er.event_id::text))
                                                 as summary,
  to_jsonb(er.*)                                 as payload,
  coalesce(er.status, case when er.checked_in then 'actioned' else 'new' end)
                                                 as status,
  er.reviewed_by                                 as reviewed_by,
  er.reviewed_at                                 as reviewed_at,
  er.notes                                       as notes,
  er.tags                                        as tags
from event_registrations er

union all
select
  cr.id::text                                    as id,
  'consultation'::text                            as source,
  cr.id::text                                     as source_pk,
  cr.created_at                                  as submitted_at,
  cr.respondent_email                            as submitter_email,
  cr.respondent_name                             as submitter_name,
  ('consultation response · ' ||
    coalesce((select title from consultations where id = cr.consultation_id), 'consultation #' || cr.consultation_id::text))
                                                 as summary,
  to_jsonb(cr.*)                                 as payload,
  coalesce(cr.status, 'new')                     as status,
  cr.reviewed_by                                 as reviewed_by,
  cr.reviewed_at                                 as reviewed_at,
  cr.notes                                       as notes,
  cr.tags                                         as tags
from consultation_responses cr

union all
select
  ps.id::text                                    as id,
  ('press_form:' ||
    coalesce((select slug from press_forms where id = ps.form_id), ps.form_id::text))
                                                 as source,
  ps.id::text                                     as source_pk,
  ps.created_at                                  as submitted_at,
  ps.submitter_email                             as submitter_email,
  ps.submitter_name                              as submitter_name,
  coalesce(
    (select title_en from press_forms where id = ps.form_id),
    'press form submission'
  )                                              as summary,
  jsonb_build_object(
    'form_id', ps.form_id,
    'state', ps.state,
    'payload', ps.payload,
    'review_note', ps.review_note,
    'score', ps.score,
    'assigned_to', ps.assigned_to,
    'decided_at', ps.decided_at,
    'decided_by', ps.decided_by,
    'source_url', ps.source_url,
    'submitted_by', ps.submitted_by
  )                                              as payload,
  ps.state::text                                 as status,
  ps.decided_by::text                            as reviewed_by,
  ps.decided_at                                  as reviewed_at,
  ps.notes                                       as notes,
  ps.tags                                         as tags
from press_submissions ps;

comment on view v_all_submissions is
  'CDCC · unified inbox view across constituency_submissions, contact_submissions, newsletter_subscribers, volunteers, event_registrations, consultation_responses, press_submissions. Backed by /admin/inbox.';

-- ── 4. Helper RPC: write-back for the inbox (mark reviewed / set notes) ─

create or replace function inbox_set_review(
  p_source text,
  p_source_pk text,
  p_status text,
  p_reviewed_by text,
  p_notes text default null
) returns void
language plpgsql
security definer
as $$
begin
  if p_source = 'join' then
    update constituency_submissions set
      status = coalesce(p_status, status),
      reviewed_by = coalesce(p_reviewed_by, reviewed_by),
      reviewed_at = case when p_status is not null then now() else reviewed_at end,
      notes = coalesce(p_notes, notes)
    where id::text = p_source_pk;
  elsif p_source = 'contact' then
    update contact_submissions set
      status = coalesce(p_status, status),
      reviewed_by = coalesce(p_reviewed_by, reviewed_by),
      reviewed_at = case when p_status is not null then now() else reviewed_at end,
      notes = coalesce(p_notes, notes)
    where id::text = p_source_pk;
  elsif p_source = 'newsletter' then
    update newsletter_subscribers set
      status = coalesce(p_status, status),
      reviewed_by = coalesce(p_reviewed_by, reviewed_by),
      reviewed_at = case when p_status is not null then now() else reviewed_at end,
      notes = coalesce(p_notes, notes)
    where id::text = p_source_pk;
  elsif p_source = 'volunteer' then
    update volunteers set
      status = coalesce(p_status, status),
      reviewed_by = coalesce(p_reviewed_by, reviewed_by),
      reviewed_at = case when p_status is not null then now() else reviewed_at end,
      notes = coalesce(p_notes, notes)
    where id::text = p_source_pk;
  elsif p_source = 'event_registration' then
    update event_registrations set
      status = coalesce(p_status, status),
      reviewed_by = coalesce(p_reviewed_by, reviewed_by),
      reviewed_at = case when p_status is not null then now() else reviewed_at end,
      notes = coalesce(p_notes, notes)
    where id::text = p_source_pk;
  elsif p_source = 'consultation' then
    update consultation_responses set
      status = coalesce(p_status, status),
      reviewed_by = coalesce(p_reviewed_by, reviewed_by),
      reviewed_at = case when p_status is not null then now() else reviewed_at end,
      notes = coalesce(p_notes, notes)
    where id::text = p_source_pk;
  elsif p_source like 'press_form%' then
    update press_submissions set
      review_note = coalesce(p_notes, review_note),
      decided_at = case when p_status in ('accepted','rejected','waitlisted') then now() else decided_at end,
      state = coalesce(p_status::submission_state, state),
      notes = coalesce(p_notes, notes)
    where id::text = p_source_pk;
  end if;
end;
$$;

-- ── 5. PostgREST schema cache reload ───────────────────────────────────

notify pgrst, 'reload schema';
