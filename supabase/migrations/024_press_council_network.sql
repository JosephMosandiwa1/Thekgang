-- =====================================================================
-- The Press · Phase B3 · Taxonomy + Council + Network
-- 2026-04-22 · CDCC CMS rebuild
--
-- Disciplines + Pillars already seeded in 022. This migration seeds
-- Provinces (9) + Languages (11), introduces Council Member (the
-- 14-discipline constituency CRM) and Stakeholder (partners / funders /
-- sponsors / press / suppliers / government). Adds Interaction log,
-- MOU register, sponsorship tier.
-- =====================================================================

-- ── Province seed ───────────────────────────────────────────────
create table if not exists public.press_provinces (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  label_en   text not null,
  label_xh   text,
  sort_order smallint not null default 0
);

insert into public.press_provinces (slug, label_en, sort_order) values
  ('eastern_cape',  'Eastern Cape',  1),
  ('free_state',    'Free State',    2),
  ('gauteng',       'Gauteng',       3),
  ('kwazulu_natal', 'KwaZulu-Natal', 4),
  ('limpopo',       'Limpopo',       5),
  ('mpumalanga',    'Mpumalanga',    6),
  ('northern_cape', 'Northern Cape', 7),
  ('north_west',    'North West',    8),
  ('western_cape',  'Western Cape',  9)
on conflict (slug) do nothing;

alter table public.press_provinces enable row level security;
drop policy if exists provinces_read on public.press_provinces;
create policy provinces_read on public.press_provinces for select using (true);

-- ── Language seed (11 official SA languages) ────────────────────
create table if not exists public.press_languages (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,      -- ISO 639 where possible
  label_en   text not null,
  endonym    text,                       -- native-script label
  sort_order smallint not null default 0
);

insert into public.press_languages (slug, label_en, endonym, sort_order) values
  ('en', 'English',   'English',     1),
  ('xh', 'isiXhosa',  'isiXhosa',    2),
  ('zu', 'isiZulu',   'isiZulu',     3),
  ('af', 'Afrikaans', 'Afrikaans',   4),
  ('st', 'Sesotho',   'Sesotho',     5),
  ('tn', 'Setswana',  'Setswana',    6),
  ('ts', 'Xitsonga',  'Xitsonga',    7),
  ('ss', 'siSwati',   'siSwati',     8),
  ('ve', 'Tshivenda', 'Tshivenda',   9),
  ('nr', 'isiNdebele','isiNdebele', 10),
  ('nso','Sepedi',    'Sepedi',     11)
on conflict (slug) do nothing;

alter table public.press_languages enable row level security;
drop policy if exists languages_read on public.press_languages;
create policy languages_read on public.press_languages for select using (true);

-- ── Council Member · discipline-bound constituency ──────────────
create table if not exists public.press_council_members (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete set null,
  slug           text unique,
  full_name      text not null,
  pronouns       text,
  photo_asset_id uuid references public.press_assets(id),
  bio_en         text,
  bio_xh         text,
  email          text,
  phone          text,
  province_id    uuid references public.press_provinces(id),
  discipline_ids uuid[] default '{}',
  language_prefs text[] default '{en}',        -- ISO 639 slugs
  public_profile boolean not null default false,
  status         text not null default 'active',   -- active · inactive · suspended
  joined_at      date,
  notes          text,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_council_status on public.press_council_members (status);
create index if not exists idx_council_province on public.press_council_members (province_id);
create index if not exists idx_council_disciplines on public.press_council_members using gin (discipline_ids);

alter table public.press_council_members enable row level security;

-- Public read only for public_profile=true members
drop policy if exists council_public_read on public.press_council_members;
create policy council_public_read on public.press_council_members
  for select using (public_profile = true and status = 'active');

-- Editorial read
drop policy if exists council_editorial_read on public.press_council_members;
create policy council_editorial_read on public.press_council_members
  for select using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'));

-- Members read their own row
drop policy if exists council_self_read on public.press_council_members;
create policy council_self_read on public.press_council_members
  for select using (user_id = auth.uid());

drop policy if exists council_write on public.press_council_members;
create policy council_write on public.press_council_members
  for all using (public.press_has_role('chair', 'ed', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists council_self_update on public.press_council_members;
create policy council_self_update on public.press_council_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Stakeholder · broader network CRM ───────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'stakeholder_variant') then
    create type stakeholder_variant as enum ('partner', 'funder', 'sponsor', 'press', 'supplier', 'government', 'other');
  end if;
end $$;

create table if not exists public.press_stakeholders (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,
  variant         stakeholder_variant not null default 'partner',
  organisation    text not null,
  legal_entity    text,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  website         text,
  province_id     uuid references public.press_provinces(id),
  bio_en          text,
  bio_xh          text,
  logo_asset_id   uuid references public.press_assets(id),
  relationship_strength smallint not null default 0,  -- 0-5 scale
  notes           text,
  -- Sponsor-variant fields
  sponsor_tier    text,            -- bronze · silver · gold · platinum · custom
  sponsor_amount  numeric(14, 2),
  -- Press-variant fields
  beat            text,            -- the journalist's beat (arts, culture, policy)
  outlet          text,
  -- Funder-variant fields
  funding_cycle   text,            -- annual · quarterly · ad-hoc
  -- Common
  status          text not null default 'active',
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_stakeholders_variant on public.press_stakeholders (variant);
create index if not exists idx_stakeholders_status on public.press_stakeholders (status);

alter table public.press_stakeholders enable row level security;

drop policy if exists stakeholders_editorial_rw on public.press_stakeholders;
create policy stakeholders_editorial_rw on public.press_stakeholders
  for all using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead', 'treasurer'))
  with check (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead', 'treasurer'));

-- ── MOU register ────────────────────────────────────────────────
create table if not exists public.press_mous (
  id             uuid primary key default gen_random_uuid(),
  stakeholder_id uuid references public.press_stakeholders(id) on delete cascade,
  title          text not null,
  summary        text,
  document_asset_id uuid references public.press_assets(id),
  signed_by_cdcc uuid references auth.users(id),
  signed_at      date,
  effective_from date,
  effective_to   date,
  status         text not null default 'draft',   -- draft · sent · signed · expired · terminated
  notes          text,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.press_mous enable row level security;
drop policy if exists mous_rw on public.press_mous;
create policy mous_rw on public.press_mous
  for all using (public.press_has_role('chair', 'ed', 'secretary', 'treasurer'))
  with check (public.press_has_role('chair', 'ed', 'secretary', 'treasurer'));

-- ── Interaction log ─────────────────────────────────────────────
-- Touchpoints with Council Members or Stakeholders. Fuels the
-- Relationship loop on Home + the Council profile pane.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'interaction_kind') then
    create type interaction_kind as enum ('call', 'meeting', 'email', 'whatsapp', 'event_attended', 'application_reviewed', 'contract_signed', 'newsletter_opened', 'pitch_sent', 'coverage_logged', 'other');
  end if;
end $$;

create table if not exists public.press_interactions (
  id              uuid primary key default gen_random_uuid(),
  kind            interaction_kind not null,
  council_id      uuid references public.press_council_members(id) on delete cascade,
  stakeholder_id  uuid references public.press_stakeholders(id) on delete cascade,
  summary         text,
  direction       text,             -- in · out · mutual
  at              timestamptz not null default now(),
  duration_mins   integer,
  logged_by       uuid references auth.users(id),
  related_voice_id uuid references public.press_voices(id),
  related_programme_id uuid,
  related_event_id uuid
);

create index if not exists idx_interactions_council on public.press_interactions (council_id, at desc);
create index if not exists idx_interactions_stakeholder on public.press_interactions (stakeholder_id, at desc);
create index if not exists idx_interactions_at on public.press_interactions (at desc);

alter table public.press_interactions enable row level security;
drop policy if exists interactions_rw on public.press_interactions;
create policy interactions_rw on public.press_interactions
  for all using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead', 'treasurer'))
  with check (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead', 'treasurer'));

-- ── Audit triggers ──────────────────────────────────────────────
drop trigger if exists trg_audit_council on public.press_council_members;
create trigger trg_audit_council after insert or update or delete on public.press_council_members
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_stakeholders on public.press_stakeholders;
create trigger trg_audit_stakeholders after insert or update or delete on public.press_stakeholders
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_mous on public.press_mous;
create trigger trg_audit_mous after insert or update or delete on public.press_mous
  for each row execute function public.press_audit_row_change();

comment on table public.press_council_members is 'The Press · 14-discipline constituency. Each member has discipline(s), province, language prefs, bilingual bio, public/private toggle.';
comment on table public.press_stakeholders is 'The Press · broader network. Partner / funder / sponsor / press / supplier / government.';
comment on table public.press_mous is 'The Press · MOU register. Signed agreements with Stakeholders.';
