-- =====================================================================
-- The Press · Phase D7 · Programmes + variants + Juries
-- 2026-04-22 · CDCC CMS rebuild
--
-- One Programme primitive with five variants:
--   standard · award · mentorship · grant · call_for_submissions
--
-- Applications flow through Forms (Phase B4). Jury reviews sit on top.
-- =====================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'programme_variant') then
    create type programme_variant as enum ('standard', 'award', 'mentorship', 'grant', 'call_for_submissions');
  end if;
  if not exists (select 1 from pg_type where typname = 'programme_state') then
    create type programme_state as enum ('draft', 'open', 'closed', 'in_delivery', 'concluded', 'archived');
  end if;
end $$;

create table if not exists public.press_programmes (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  variant         programme_variant not null default 'standard',
  title_en        text not null,
  title_xh        text,
  description_en  text,
  description_xh  text,
  pillar_id       uuid references public.press_pillars(id),
  discipline_ids  uuid[] default '{}',
  province_ids    uuid[] default '{}',
  campaign_id     uuid references public.press_campaigns(id),
  budget_amount   numeric(14, 2),
  budget_currency text default 'ZAR',
  starts_at       date,
  ends_at         date,
  state           programme_state not null default 'draft',

  -- Application form
  application_form_id uuid references public.press_forms(id),

  -- Lead
  lead_user_id    uuid references auth.users(id),

  -- Award/grant-specific
  prize_pool      numeric(14, 2),
  winner_count    smallint,

  -- Mentorship-specific
  cohort_size     smallint,

  cover_asset_id  uuid references public.press_assets(id),
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_programmes_state on public.press_programmes (state);
create index if not exists idx_programmes_variant on public.press_programmes (variant);
create index if not exists idx_programmes_pillar on public.press_programmes (pillar_id);

alter table public.press_programmes enable row level security;

drop policy if exists programmes_read_public on public.press_programmes;
create policy programmes_read_public on public.press_programmes
  for select using (state in ('open', 'in_delivery', 'concluded'));

drop policy if exists programmes_editorial_rw on public.press_programmes;
create policy programmes_editorial_rw on public.press_programmes
  for all using (public.press_has_role('chair', 'ed', 'programme_lead', 'treasurer'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead', 'treasurer'));

-- ── Jury · for Awards / Grants / Calls ─────────────────────────
create table if not exists public.press_juries (
  id              uuid primary key default gen_random_uuid(),
  programme_id    uuid references public.press_programmes(id) on delete cascade,
  label_en        text not null,
  convened_at     timestamptz not null default now(),
  dissolved_at    timestamptz,
  chair_user_id   uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create table if not exists public.press_jury_members (
  id              uuid primary key default gen_random_uuid(),
  jury_id         uuid not null references public.press_juries(id) on delete cascade,
  user_id         uuid references auth.users(id),
  council_member_id uuid references public.press_council_members(id),
  stakeholder_id  uuid references public.press_stakeholders(id),
  role            text not null default 'member',       -- chair · member
  assigned_at     timestamptz not null default now()
);
create unique index if not exists uq_jury_members_identity
  on public.press_jury_members (jury_id, coalesce(user_id, council_member_id, stakeholder_id));

alter table public.press_juries enable row level security;
alter table public.press_jury_members enable row level security;

drop policy if exists juries_rw on public.press_juries;
create policy juries_rw on public.press_juries
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

drop policy if exists jury_members_rw on public.press_jury_members;
create policy jury_members_rw on public.press_jury_members
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

-- Link Submission to a jury (wire the Phase B4 column properly)
do $$ begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_submissions_jury') then
    alter table public.press_submissions add constraint fk_submissions_jury foreign key (jury_id) references public.press_juries(id) on delete set null;
  end if;
end $$;

-- Audit
drop trigger if exists trg_audit_programmes on public.press_programmes;
create trigger trg_audit_programmes after insert or update or delete on public.press_programmes
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_juries on public.press_juries;
create trigger trg_audit_juries after insert or update or delete on public.press_juries
  for each row execute function public.press_audit_row_change();

comment on table public.press_programmes is 'The Press · Programme primitive with 5 variants: standard · award · mentorship · grant · call_for_submissions.';
