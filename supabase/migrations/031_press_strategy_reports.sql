-- =====================================================================
-- The Press · Phase E10 · Strategy + Sector indicators + Reports + Translation
-- 2026-04-22 · CDCC CMS rebuild
-- =====================================================================

-- ── Strategic plan (versioned) ─────────────────────────────────
create table if not exists public.press_strategic_plans (
  id              uuid primary key default gen_random_uuid(),
  version         text not null,                       -- e.g. 2026-2028
  label_en        text not null,
  body_en         jsonb default '[]'::jsonb,            -- block stream
  body_xh         jsonb default '[]'::jsonb,
  pillar_allocations jsonb default '{}'::jsonb,         -- pillar_slug → budget_percentage
  starts_on       date,
  ends_on         date,
  status          text not null default 'draft',        -- draft · live · superseded · archived
  approved_by_chair uuid references auth.users(id),
  approved_at     timestamptz,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_strategic_plans enable row level security;
drop policy if exists strategy_read_public on public.press_strategic_plans;
create policy strategy_read_public on public.press_strategic_plans
  for select using (status = 'live');
drop policy if exists strategy_rw on public.press_strategic_plans;
create policy strategy_rw on public.press_strategic_plans
  for all using (public.press_has_role('chair', 'ed', 'secretary', 'treasurer'))
  with check (public.press_has_role('chair', 'ed', 'secretary', 'treasurer'));

-- ── Sector indicators ──────────────────────────────────────────
create table if not exists public.press_sector_indicators (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  label_en        text not null,
  label_xh        text,
  unit            text,                                 -- count · percent · ZAR · hours
  pillar_id       uuid references public.press_pillars(id),
  discipline_ids  uuid[] default '{}',
  target_value    numeric(14, 2),
  target_period   text,                                 -- monthly · quarterly · annual
  description     text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create table if not exists public.press_indicator_samples (
  id              uuid primary key default gen_random_uuid(),
  indicator_id    uuid not null references public.press_sector_indicators(id) on delete cascade,
  period_start    date not null,
  period_end      date,
  value           numeric(14, 2) not null,
  source          text,
  notes           text,
  recorded_by     uuid references auth.users(id),
  recorded_at     timestamptz not null default now(),
  unique (indicator_id, period_start)
);

create index if not exists idx_samples_indicator on public.press_indicator_samples (indicator_id, period_start desc);

alter table public.press_sector_indicators enable row level security;
alter table public.press_indicator_samples enable row level security;

drop policy if exists indicators_read on public.press_sector_indicators;
create policy indicators_read on public.press_sector_indicators for select using (true);
drop policy if exists indicators_write on public.press_sector_indicators;
create policy indicators_write on public.press_sector_indicators
  for all using (public.press_has_role('chair', 'ed', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists samples_read on public.press_indicator_samples;
create policy samples_read on public.press_indicator_samples for select using (true);
drop policy if exists samples_write on public.press_indicator_samples;
create policy samples_write on public.press_indicator_samples
  for all using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'));

-- ── Reports · assembled DSAC-compliant documents ───────────────
create table if not exists public.press_reports (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,
  template        text not null,                        -- monthly_dsac · quarterly_impact · agm_pack · programme_closeout · event_compliance · financial · constituency · campaign_wrap · sector_pulse · grant · sponsorship
  title_en        text not null,
  period_start    date,
  period_end      date,

  assembled       jsonb default '{}'::jsonb,            -- generated payload (pre-edit)
  draft_body      jsonb default '[]'::jsonb,            -- editable block stream
  pdf_asset_id    uuid references public.press_assets(id),

  sign_off_roles  press_role[] default '{}',            -- roles required to approve
  signed_by       jsonb default '{}'::jsonb,            -- role → {user_id, at}
  status          text not null default 'draft',        -- draft · pending_approval · approved · exported · superseded

  programme_id    uuid references public.press_programmes(id),
  campaign_id     uuid references public.press_campaigns(id),
  event_id        uuid references public.press_events(id),

  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_reports enable row level security;
drop policy if exists reports_rw on public.press_reports;
create policy reports_rw on public.press_reports
  for all using (public.press_has_role('chair', 'ed', 'secretary', 'treasurer'))
  with check (public.press_has_role('chair', 'ed', 'secretary', 'treasurer'));

-- ── Translation queue ─────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'translation_state') then
    create type translation_state as enum ('queued', 'assigned', 'in_progress', 'review', 'published', 'rejected');
  end if;
end $$;

create table if not exists public.press_translations (
  id              uuid primary key default gen_random_uuid(),
  source_kind     text not null,                        -- 'voice' · 'form' · 'campaign' · 'newsletter' · 'report'
  source_id       uuid not null,
  from_language   text not null default 'en',
  to_language     text not null,                        -- 'xh' / 'zu' / etc.
  state           translation_state not null default 'queued',
  assignee_user_id uuid references auth.users(id),
  deadline        date,
  reviewer_user_id uuid references auth.users(id),
  original_text   text,
  translated_text text,
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (source_kind, source_id, to_language)
);

create index if not exists idx_translations_state on public.press_translations (state, deadline);
create index if not exists idx_translations_assignee on public.press_translations (assignee_user_id);

alter table public.press_translations enable row level security;
drop policy if exists translations_rw on public.press_translations;
create policy translations_rw on public.press_translations
  for all using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'));
drop policy if exists translations_assignee_rw on public.press_translations;
create policy translations_assignee_rw on public.press_translations
  for update using (assignee_user_id = auth.uid()) with check (assignee_user_id = auth.uid());

-- Audit
drop trigger if exists trg_audit_strategy on public.press_strategic_plans;
create trigger trg_audit_strategy after insert or update or delete on public.press_strategic_plans for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_reports on public.press_reports;
create trigger trg_audit_reports after insert or update or delete on public.press_reports for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_translations on public.press_translations;
create trigger trg_audit_translations after insert or update or delete on public.press_translations for each row execute function public.press_audit_row_change();

comment on table public.press_strategic_plans is 'The Press · 3-year strategic plan (versioned). Pillars allocated budget and linked to Sector indicators.';
comment on table public.press_sector_indicators is 'The Press · KPIs tracked over time. Roll up into pillars. Fuel DSAC reports.';
comment on table public.press_reports is 'The Press · DSAC-compliant assembled reports. Template-driven, editable, sign-off by role.';
comment on table public.press_translations is 'The Press · translation queue. One row per (source, target language). Used by the Translation pane on Voices + Forms.';
