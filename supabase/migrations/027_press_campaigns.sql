-- =====================================================================
-- The Press · Phase C6 · Campaigns
-- 2026-04-22 · CDCC CMS rebuild
--
-- A strategic push. Wraps Voices + Events + Programmes + Assets +
-- Message sequences + Form submissions. Has its own landing page at
-- /campaign/[slug] and a Pack of collateral in the Library.
-- =====================================================================

create table if not exists public.press_campaigns (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title_en        text not null,
  title_xh        text,
  standfirst_en   text,
  standfirst_xh   text,
  blocks          jsonb not null default '[]'::jsonb,    -- landing page block stream

  pillar_id       uuid references public.press_pillars(id),
  discipline_ids  uuid[] default '{}',
  province_ids    uuid[] default '{}',
  audience        text,

  -- KPIs (simple counters; richer indicators land in Phase E10)
  kpi_targets     jsonb default '{}'::jsonb,

  starts_at       timestamptz,
  ends_at         timestamptz,

  -- Bindings
  pack_id         uuid references public.press_packs(id),
  default_sequence_id uuid references public.press_sequences(id),

  -- Presentation
  visibility      text not null default 'public',       -- public · internal
  cover_asset_id  uuid references public.press_assets(id),

  status          text not null default 'draft',        -- draft · live · wrapped · archived
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_campaigns_status on public.press_campaigns (status);
create index if not exists idx_campaigns_pillar on public.press_campaigns (pillar_id);
create index if not exists idx_campaigns_dates on public.press_campaigns (starts_at, ends_at);

alter table public.press_campaigns enable row level security;

drop policy if exists campaigns_read_public on public.press_campaigns;
create policy campaigns_read_public on public.press_campaigns
  for select using (visibility = 'public' and status in ('live', 'wrapped'));

drop policy if exists campaigns_editorial_rw on public.press_campaigns;
create policy campaigns_editorial_rw on public.press_campaigns
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

-- Back-fill FK constraints on tables that referenced campaign_id
-- without a constraint (Voices, Assets, Messages, Newsletters).
do $$ begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_voices_campaign') then
    alter table public.press_voices add constraint fk_voices_campaign foreign key (campaign_id) references public.press_campaigns(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_assets_campaign') then
    alter table public.press_assets add constraint fk_assets_campaign foreign key (campaign_id) references public.press_campaigns(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_messages_campaign') then
    alter table public.press_messages add constraint fk_messages_campaign foreign key (campaign_id) references public.press_campaigns(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_packs_campaign') then
    alter table public.press_packs add constraint fk_packs_campaign foreign key (campaign_id) references public.press_campaigns(id) on delete set null;
  end if;
end $$;

-- ── Audit ──────────────────────────────────────────────────────
drop trigger if exists trg_audit_campaigns on public.press_campaigns;
create trigger trg_audit_campaigns after insert or update or delete on public.press_campaigns
  for each row execute function public.press_audit_row_change();

comment on table public.press_campaigns is 'The Press · Campaign. Wraps Voices + Events + Programmes + Pack + Sequence into one strategic push. /campaign/[slug] landing page.';
