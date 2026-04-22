-- =====================================================================
-- The Press · Phase C5 · Messaging (email · WhatsApp · SMS)
-- 2026-04-22 · CDCC CMS rebuild
--
-- The ANFASA loop: save-the-date → invitation → reminder → thank-you →
-- 3-month impact survey. Plus transactional messages (registration
-- confirmations, certificate delivery) and broadcast newsletters.
--
-- Three channels behind one adapter:
--   email       — SendGrid/Postmark/SES (chosen in integrations)
--   whatsapp    — Meta WhatsApp Cloud API
--   sms         — Twilio or local SA provider (rare — 2FA + emergency)
--
-- Idempotent.
-- =====================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'message_channel') then
    create type message_channel as enum ('email', 'whatsapp', 'sms');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_kind') then
    create type message_kind as enum ('transactional', 'broadcast', 'sequence_step', 'newsletter');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_state') then
    create type message_state as enum ('draft', 'scheduled', 'sending', 'sent', 'failed', 'paused', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_state') then
    create type delivery_state as enum ('queued', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type subscription_status as enum ('pending', 'confirmed', 'unsubscribed', 'bounced', 'suppressed');
  end if;
end $$;

-- ── Subscriber · newsletter subscription + consent record ─────
create table if not exists public.press_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text unique,
  phone           text,                                -- for WhatsApp/SMS
  full_name       text,
  status          subscription_status not null default 'pending',
  topics          text[] default '{}',                 -- newsletter topic slugs they opted into
  language_pref   text default 'en',
  council_member_id uuid references public.press_council_members(id),
  stakeholder_id  uuid references public.press_stakeholders(id),
  consent_at      timestamptz,
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  source          text,                                -- `form:slug` / `import` / `manual`
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_subscribers_status on public.press_subscribers (status);
create index if not exists idx_subscribers_topics on public.press_subscribers using gin (topics);

alter table public.press_subscribers enable row level security;

drop policy if exists subscribers_rw on public.press_subscribers;
create policy subscribers_rw on public.press_subscribers
  for all using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'));

drop policy if exists subscribers_self_read on public.press_subscribers;
create policy subscribers_self_read on public.press_subscribers
  for select using (
    exists (select 1 from public.press_council_members cm
      where cm.id = council_member_id and cm.user_id = auth.uid())
  );

-- ── Segment · saved audience query ──────────────────────────────
-- Fields are evaluated into SQL at send time by the runtime.
create table if not exists public.press_segments (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  label_en        text not null,
  label_xh        text,
  description_en  text,
  -- query structure:
  -- { discipline_ids: [...], pillar_ids: [...], province_ids: [...],
  --   topics: [...], language_pref: 'xh', programme_id: '...',
  --   programme_state: 'accepted', event_attended_id: '...',
  --   opted_in: true, is_council_member: true }
  query           jsonb not null default '{}'::jsonb,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_segments enable row level security;
drop policy if exists segments_rw on public.press_segments;
create policy segments_rw on public.press_segments
  for all using (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary'));

-- ── Message · one outbound piece ────────────────────────────────
create table if not exists public.press_messages (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,
  kind            message_kind not null default 'broadcast',
  channel         message_channel not null default 'email',
  state           message_state not null default 'draft',

  subject_en      text,
  subject_xh      text,
  body_en         jsonb default '[]'::jsonb,         -- block stream, same shape as Voice
  body_xh         jsonb default '[]'::jsonb,
  plain_text_fallback text,                           -- for email clients without HTML
  attachments     uuid[] default '{}',                -- array of asset ids

  from_name       text default 'CDCC',
  from_email      text,
  reply_to        text,

  segment_id      uuid references public.press_segments(id),
  to_emails       text[] default '{}',                -- direct list (for transactional)

  scheduled_at    timestamptz,
  sent_at         timestamptz,

  sequence_id     uuid,                                -- set for sequence_step messages
  sequence_step_order smallint,

  campaign_id     uuid,
  event_id        uuid,

  delivered_count integer not null default 0,
  opened_count    integer not null default 0,
  clicked_count   integer not null default 0,
  bounced_count   integer not null default 0,

  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_messages_state on public.press_messages (state);
create index if not exists idx_messages_scheduled on public.press_messages (scheduled_at) where state = 'scheduled';
create index if not exists idx_messages_campaign on public.press_messages (campaign_id);

alter table public.press_messages enable row level security;
drop policy if exists messages_rw on public.press_messages;
create policy messages_rw on public.press_messages
  for all using (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary'));

-- ── Sequence · chained Messages triggered by an anchor event ───
do $$ begin
  if not exists (select 1 from pg_type where typname = 'sequence_trigger') then
    create type sequence_trigger as enum (
      'event_created',          -- fires when a new Event row is created
      'voice_published',
      'form_submitted',
      'programme_opened',
      'absolute',               -- run at a specific timestamp
      'manual'                  -- fired by UI
    );
  end if;
end $$;

create table if not exists public.press_sequences (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  label_en        text not null,
  label_xh        text,
  description_en  text,
  trigger_kind    sequence_trigger not null default 'manual',
  trigger_config  jsonb default '{}'::jsonb,          -- e.g. { offset_weeks: -8 } relative to event
  campaign_id     uuid,
  default_segment_id uuid references public.press_segments(id),
  status          text not null default 'draft',      -- draft · active · paused · archived
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Sequence steps — ordered Messages.
create table if not exists public.press_sequence_steps (
  id              uuid primary key default gen_random_uuid(),
  sequence_id     uuid not null references public.press_sequences(id) on delete cascade,
  step_order      smallint not null,
  offset_minutes  integer not null default 0,         -- minutes relative to the trigger; negative for pre-event
  message_id      uuid references public.press_messages(id),
  branch_on       text,                                -- 'opened' · 'clicked' · null
  next_step_yes   uuid references public.press_sequence_steps(id),
  next_step_no    uuid references public.press_sequence_steps(id),
  created_at      timestamptz not null default now(),
  unique (sequence_id, step_order)
);

alter table public.press_sequences enable row level security;
alter table public.press_sequence_steps enable row level security;

drop policy if exists sequences_rw on public.press_sequences;
create policy sequences_rw on public.press_sequences
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

drop policy if exists sequence_steps_rw on public.press_sequence_steps;
create policy sequence_steps_rw on public.press_sequence_steps
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

-- ── Newsletter · a recurring broadcast with topic-based opt-in ─
create table if not exists public.press_newsletters (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,                -- becomes the topic slug on Subscriber.topics
  title_en        text not null,
  title_xh        text,
  description_en  text,
  cadence         text not null default 'monthly',     -- weekly · monthly · quarterly · adhoc
  discipline_ids  uuid[] default '{}',
  pillar_id       uuid,
  default_segment_id uuid references public.press_segments(id),
  status          text not null default 'draft',
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_newsletters enable row level security;
drop policy if exists newsletters_rw on public.press_newsletters;
create policy newsletters_rw on public.press_newsletters
  for all using (public.press_has_role('chair', 'ed', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'secretary'));

-- ── Delivery log · per-recipient per-message tracking ──────────
create table if not exists public.press_deliveries (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references public.press_messages(id) on delete cascade,
  subscriber_id   uuid references public.press_subscribers(id) on delete set null,
  to_email        text,
  to_phone        text,
  state           delivery_state not null default 'queued',
  provider_id     text,                                -- upstream message id
  error_message   text,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  bounced_at      timestamptz,
  queued_at       timestamptz not null default now(),
  delivered_at    timestamptz
);

create index if not exists idx_deliveries_message on public.press_deliveries (message_id, state);
create index if not exists idx_deliveries_subscriber on public.press_deliveries (subscriber_id, queued_at desc);
create index if not exists idx_deliveries_state on public.press_deliveries (state);

alter table public.press_deliveries enable row level security;
drop policy if exists deliveries_read on public.press_deliveries;
create policy deliveries_read on public.press_deliveries
  for select using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'));

-- ── POPIA suppression list ──────────────────────────────────────
create table if not exists public.press_suppression_list (
  email_or_phone  text primary key,
  reason          text not null,
  added_at        timestamptz not null default now()
);
alter table public.press_suppression_list enable row level security;
drop policy if exists suppression_read on public.press_suppression_list;
create policy suppression_read on public.press_suppression_list
  for select using (public.press_has_role('chair', 'ed', 'secretary'));

-- ── Audit triggers ──────────────────────────────────────────────
drop trigger if exists trg_audit_messages on public.press_messages;
create trigger trg_audit_messages after insert or update or delete on public.press_messages
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_sequences on public.press_sequences;
create trigger trg_audit_sequences after insert or update or delete on public.press_sequences
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_newsletters on public.press_newsletters;
create trigger trg_audit_newsletters after insert or update or delete on public.press_newsletters
  for each row execute function public.press_audit_row_change();

comment on table public.press_messages is 'The Press · Message (email / WhatsApp / SMS). Transactional or broadcast. Block-stream body with bilingual panes.';
comment on table public.press_sequences is 'The Press · Sequence = chained Messages triggered by an anchor event. Powers the ANFASA loop (save-the-date → thank-you).';
comment on table public.press_deliveries is 'The Press · delivery log. One row per recipient per Message. Tracks open/click/bounce/unsubscribe.';
