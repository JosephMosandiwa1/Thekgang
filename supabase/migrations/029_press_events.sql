-- =====================================================================
-- The Press · Phase D8 · Events + Tickets + Attendance + Certificates + Outcomes
-- 2026-04-22 · CDCC CMS rebuild
--
-- The existing events module stays — this migration wraps it with:
--   · press_events           — canonical Event primitive with formats
--   · press_event_outcomes   — Resolutions + Action Items (Imbizo-shape)
--   · press_tickets          — tiered tickets with payment hooks
--   · press_attendance       — timestamped per-session records
--   · press_certificates     — bilingual auto-generated credentials
--
-- If there is already a legacy `events` table, this module uses a
-- parallel `press_events` namespace so data migration in Phase F12 can
-- copy rows across without FK thrash.
-- =====================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'event_format') then
    create type event_format as enum ('symposium', 'imbizo', 'book_fair', 'workshop', 'agm', 'festival', 'webinar', 'launch', 'reading', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'event_state') then
    create type event_state as enum ('draft', 'scheduled', 'registration_open', 'in_progress', 'completed', 'cancelled', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'ticket_state') then
    create type ticket_state as enum ('issued', 'paid', 'confirmed', 'checked_in', 'attended', 'certified', 'refunded', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'outcome_kind') then
    create type outcome_kind as enum ('resolution', 'action_item');
  end if;
end $$;

-- ── Event ──────────────────────────────────────────────────────
create table if not exists public.press_events (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  format          event_format not null default 'symposium',
  state           event_state not null default 'draft',
  title_en        text not null,
  title_xh        text,
  description_en  text,
  description_xh  text,
  blocks          jsonb not null default '[]'::jsonb,   -- event landing page block stream

  pillar_id       uuid references public.press_pillars(id),
  discipline_ids  uuid[] default '{}',
  province_ids    uuid[] default '{}',
  programme_id    uuid references public.press_programmes(id),
  campaign_id     uuid references public.press_campaigns(id),

  starts_at       timestamptz,
  ends_at         timestamptz,
  timezone        text default 'Africa/Johannesburg',

  venue_name      text,
  venue_address   text,
  is_virtual      boolean not null default false,
  zoom_url        text,
  capacity        integer,

  registration_form_id uuid references public.press_forms(id),
  ticketing_enabled    boolean not null default false,
  ticket_currency      text default 'ZAR',

  cover_asset_id  uuid references public.press_assets(id),

  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_events_state on public.press_events (state);
create index if not exists idx_events_starts on public.press_events (starts_at);

alter table public.press_events enable row level security;
drop policy if exists events_public_read on public.press_events;
create policy events_public_read on public.press_events
  for select using (state in ('scheduled', 'registration_open', 'in_progress', 'completed'));

drop policy if exists events_editorial_rw on public.press_events;
create policy events_editorial_rw on public.press_events
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

-- ── Ticket tiers (event-scoped catalogue) ──────────────────────
create table if not exists public.press_ticket_tiers (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.press_events(id) on delete cascade,
  slug            text not null,
  label_en        text not null,
  label_xh        text,
  price           numeric(10, 2) not null default 0,
  currency        text default 'ZAR',
  capacity        integer,                              -- tier-specific cap
  for_role        text,                                  -- 'member' · 'non_member' · 'student' · 'press' · 'speaker' · 'vip'
  available_from  timestamptz,
  available_to    timestamptz,
  sort_order      smallint default 0,
  created_at      timestamptz not null default now(),
  unique (event_id, slug)
);

alter table public.press_ticket_tiers enable row level security;
drop policy if exists tiers_read on public.press_ticket_tiers;
create policy tiers_read on public.press_ticket_tiers for select using (true);
drop policy if exists tiers_rw on public.press_ticket_tiers;
create policy tiers_rw on public.press_ticket_tiers
  for all using (public.press_has_role('chair', 'ed', 'programme_lead', 'treasurer'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead', 'treasurer'));

-- ── Ticket (individual issue) ──────────────────────────────────
create table if not exists public.press_tickets (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.press_events(id) on delete cascade,
  tier_id         uuid references public.press_ticket_tiers(id),
  submission_id   uuid references public.press_submissions(id),
  council_member_id uuid references public.press_council_members(id),
  attendee_name   text,
  attendee_email  text,
  attendee_phone  text,
  state           ticket_state not null default 'issued',
  qr_code         text unique,                           -- short token for the QR PDF
  price_paid      numeric(10, 2),
  payment_ref     text,
  payment_provider text,
  issued_at       timestamptz not null default now(),
  paid_at         timestamptz,
  checked_in_at   timestamptz,
  attended_at     timestamptz,
  certificate_sent_at timestamptz
);

create index if not exists idx_tickets_event on public.press_tickets (event_id, state);
create index if not exists idx_tickets_email on public.press_tickets (attendee_email);

alter table public.press_tickets enable row level security;
drop policy if exists tickets_rw on public.press_tickets;
create policy tickets_rw on public.press_tickets
  for all using (public.press_has_role('chair', 'ed', 'programme_lead', 'treasurer', 'volunteer'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead', 'treasurer', 'volunteer'));

drop policy if exists tickets_self_read on public.press_tickets;
create policy tickets_self_read on public.press_tickets
  for select using (
    (council_member_id is not null and exists (select 1 from public.press_council_members where id = council_member_id and user_id = auth.uid()))
  );

-- Auto-generate qr_code
create or replace function public.press_ticket_ensure_qr()
returns trigger language plpgsql as $$
begin
  if new.qr_code is null then
    new.qr_code := replace(replace(replace(encode(gen_random_bytes(16), 'base64'), '/', '_'), '+', '-'), '=', '');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ticket_qr on public.press_tickets;
create trigger trg_ticket_qr before insert on public.press_tickets
  for each row execute function public.press_ticket_ensure_qr();

-- ── Attendance (per session within an event) ───────────────────
create table if not exists public.press_attendance (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.press_events(id) on delete cascade,
  ticket_id       uuid references public.press_tickets(id) on delete set null,
  session_key     text,                                  -- session identifier (nullable = whole event)
  checked_in_at   timestamptz not null default now(),
  checked_in_by   uuid references auth.users(id),
  note            text
);

create index if not exists idx_attendance_event on public.press_attendance (event_id, checked_in_at desc);

alter table public.press_attendance enable row level security;
drop policy if exists attendance_rw on public.press_attendance;
create policy attendance_rw on public.press_attendance
  for all using (public.press_has_role('chair', 'ed', 'programme_lead', 'volunteer'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead', 'volunteer'));

-- ── Event Outcomes (Resolutions + Action Items) ────────────────
create table if not exists public.press_event_outcomes (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.press_events(id) on delete cascade,
  kind            outcome_kind not null,
  title_en        text not null,
  title_xh        text,
  body_en         text,
  body_xh         text,
  owner_user_id   uuid references auth.users(id),
  due_date        date,
  status          text not null default 'open',         -- open · done · dropped
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_outcomes_event on public.press_event_outcomes (event_id, kind);

alter table public.press_event_outcomes enable row level security;
drop policy if exists outcomes_read_public on public.press_event_outcomes;
create policy outcomes_read_public on public.press_event_outcomes for select using (true);
drop policy if exists outcomes_write on public.press_event_outcomes;
create policy outcomes_write on public.press_event_outcomes
  for all using (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary'));

-- ── Certificates ───────────────────────────────────────────────
create table if not exists public.press_certificates (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references public.press_events(id),
  programme_id    uuid references public.press_programmes(id),
  ticket_id       uuid references public.press_tickets(id),
  council_member_id uuid references public.press_council_members(id),
  recipient_name  text not null,
  recipient_email text,
  kind            text not null default 'attendance', -- attendance · completion · award
  signed_by       text default 'CDCC Chair',
  issued_at       timestamptz not null default now(),
  pdf_asset_id    uuid references public.press_assets(id),
  sent_at         timestamptz,
  verification_code text unique
);

alter table public.press_certificates enable row level security;
drop policy if exists certificates_read on public.press_certificates;
create policy certificates_read on public.press_certificates
  for select using (
    public.press_has_role('chair', 'ed', 'programme_lead', 'secretary')
    or (council_member_id is not null and exists (select 1 from public.press_council_members where id = council_member_id and user_id = auth.uid()))
  );
drop policy if exists certificates_write on public.press_certificates;
create policy certificates_write on public.press_certificates
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

-- Fill FKs on other tables that referenced event_id
do $$ begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_messages_event') then
    alter table public.press_messages add constraint fk_messages_event foreign key (event_id) references public.press_events(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_interactions_event') then
    alter table public.press_interactions add constraint fk_interactions_event foreign key (related_event_id) references public.press_events(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_packs_event') then
    alter table public.press_packs add constraint fk_packs_event foreign key (event_id) references public.press_events(id) on delete set null;
  end if;
end $$;

-- Audit
drop trigger if exists trg_audit_events on public.press_events;
create trigger trg_audit_events after insert or update or delete on public.press_events
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_tickets on public.press_tickets;
create trigger trg_audit_tickets after insert or update or delete on public.press_tickets
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_outcomes on public.press_event_outcomes;
create trigger trg_audit_outcomes after insert or update or delete on public.press_event_outcomes
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_certificates on public.press_certificates;
create trigger trg_audit_certificates after insert or update or delete on public.press_certificates
  for each row execute function public.press_audit_row_change();

comment on table public.press_events is 'The Press · Event primitive. Format variants + ticketing + attendance + outcomes + certificates.';
comment on table public.press_event_outcomes is 'The Press · Resolutions + Action Items from an Event. First-class because DSAC asks.';
