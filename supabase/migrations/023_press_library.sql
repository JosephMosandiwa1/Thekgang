-- =====================================================================
-- The Press · Phase A2 · Library + packs + templates + press kit
-- 2026-04-22 · CDCC CMS rebuild
--
-- Evolves the existing `media_library` into a full Asset primitive
-- with alt-text, caption, credit, rights, discipline + campaign tags,
-- usage graph. Introduces Pack (CI baseline OR Campaign-scoped) and
-- Template (reusable writing/comms templates).
--
-- Press kit is a computed view that auto-assembles: cluster logo set
-- + boilerplate + sector fact sheet + latest three press releases.
--
-- Idempotent. Does NOT drop the existing media_library table — wraps
-- it with a compatibility view for continuity.
-- =====================================================================

-- ── Rights enum ─────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'asset_rights') then
    create type asset_rights as enum ('public', 'member', 'press', 'internal');
  end if;
  if not exists (select 1 from pg_type where typname = 'asset_kind') then
    create type asset_kind as enum ('image', 'document', 'audio', 'video', 'template', 'font', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'pack_scope') then
    create type pack_scope as enum ('ci_baseline', 'campaign', 'press_kit', 'event', 'programme');
  end if;
end $$;

-- ── Asset · the canonical file record ───────────────────────────
create table if not exists public.press_assets (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,
  kind            asset_kind not null default 'image',
  filename        text not null,
  url             text not null,                -- absolute or relative URL
  storage_key     text,                          -- supabase storage path
  size_bytes      bigint,
  mime_type       text,
  width           integer,
  height          integer,
  duration_ms     integer,

  alt_en          text,
  alt_xh          text,
  caption_en      text,
  caption_xh      text,
  credit          text,

  rights          asset_rights not null default 'internal',
  discipline_ids  uuid[],
  campaign_id     uuid,
  language        text,                          -- ISO 639 code where the asset is language-specific

  tags            text[] default '{}',

  download_count  integer not null default 0,

  uploaded_by     uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_assets_kind on public.press_assets (kind);
create index if not exists idx_assets_rights on public.press_assets (rights);
create index if not exists idx_assets_campaign on public.press_assets (campaign_id);
create index if not exists idx_assets_tags on public.press_assets using gin (tags);
create index if not exists idx_assets_discipline on public.press_assets using gin (discipline_ids);

alter table public.press_assets enable row level security;

-- Read · rights-filtered. Public assets are public; member/press/internal
-- require matching role or token.
drop policy if exists assets_read_public on public.press_assets;
create policy assets_read_public on public.press_assets
  for select using (rights = 'public');

drop policy if exists assets_read_member on public.press_assets;
create policy assets_read_member on public.press_assets
  for select using (rights = 'member' and auth.uid() is not null);

drop policy if exists assets_read_press on public.press_assets;
create policy assets_read_press on public.press_assets
  for select using (rights = 'press' and public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists assets_read_internal on public.press_assets;
create policy assets_read_internal on public.press_assets
  for select using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead', 'contributor', 'treasurer'));

-- Write · ED + Programme Lead + Contributor upload; Chair + ED edit/delete.
drop policy if exists assets_insert on public.press_assets;
create policy assets_insert on public.press_assets
  for insert with check (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead', 'contributor'));

drop policy if exists assets_update on public.press_assets;
create policy assets_update on public.press_assets
  for update using (public.press_has_role('chair', 'ed')) with check (public.press_has_role('chair', 'ed'));

drop policy if exists assets_delete on public.press_assets;
create policy assets_delete on public.press_assets
  for delete using (public.press_has_role('chair', 'ed'));

-- ── Packs · grouped bundles ─────────────────────────────────────
create table if not exists public.press_packs (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  scope        pack_scope not null,
  label_en     text not null,
  label_xh     text,
  description_en text,
  description_xh text,
  campaign_id  uuid,
  event_id     uuid,
  programme_id uuid,
  cover_asset_id uuid references public.press_assets(id),
  rights       asset_rights not null default 'public',
  sort_order   integer not null default 0,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_packs_scope on public.press_packs (scope);
create index if not exists idx_packs_campaign on public.press_packs (campaign_id);

-- Pack ↔ Asset linker (ordered)
create table if not exists public.press_pack_assets (
  pack_id    uuid not null references public.press_packs(id) on delete cascade,
  asset_id   uuid not null references public.press_assets(id) on delete cascade,
  sort_order integer not null default 0,
  note       text,
  primary key (pack_id, asset_id)
);

alter table public.press_packs enable row level security;
alter table public.press_pack_assets enable row level security;

drop policy if exists packs_read on public.press_packs;
create policy packs_read on public.press_packs for select using (
  rights = 'public'
  or (rights = 'member' and auth.uid() is not null)
  or (rights = 'press' and public.press_has_role('chair', 'ed', 'secretary'))
  or (rights = 'internal' and public.press_has_role('chair', 'ed', 'secretary', 'programme_lead', 'contributor', 'treasurer'))
);
drop policy if exists packs_write on public.press_packs;
create policy packs_write on public.press_packs
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

drop policy if exists pack_assets_read on public.press_pack_assets;
create policy pack_assets_read on public.press_pack_assets for select using (true);

drop policy if exists pack_assets_write on public.press_pack_assets;
create policy pack_assets_write on public.press_pack_assets
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

-- ── Templates · reusable writing/comms templates ────────────────
create table if not exists public.press_templates (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name_en         text not null,
  name_xh         text,
  category        text not null default 'general',    -- press_release, event_invitation, programme_announcement, email_signature, social_post, etc.
  body_en         jsonb,                               -- block stream (same shape as Voice.blocks)
  body_xh         jsonb,
  variables       jsonb default '[]'::jsonb,           -- list of merge fields this template expects
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_templates_category on public.press_templates (category);

alter table public.press_templates enable row level security;

drop policy if exists templates_read on public.press_templates;
create policy templates_read on public.press_templates
  for select using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead', 'contributor'));

drop policy if exists templates_write on public.press_templates;
create policy templates_write on public.press_templates
  for all using (public.press_has_role('chair', 'ed', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'secretary'));

-- ── Asset download log (fuels analytics) ────────────────────────
create table if not exists public.press_asset_downloads (
  id          bigserial primary key,
  asset_id    uuid not null references public.press_assets(id) on delete cascade,
  pack_id     uuid references public.press_packs(id),
  downloaded_by uuid references auth.users(id),
  downloaded_at timestamptz not null default now(),
  ip_hash     text,
  user_agent  text
);
create index if not exists idx_downloads_asset on public.press_asset_downloads (asset_id, downloaded_at desc);
create index if not exists idx_downloads_pack on public.press_asset_downloads (pack_id, downloaded_at desc);

alter table public.press_asset_downloads enable row level security;

drop policy if exists asset_downloads_read on public.press_asset_downloads;
create policy asset_downloads_read on public.press_asset_downloads
  for select using (public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists asset_downloads_insert on public.press_asset_downloads;
create policy asset_downloads_insert on public.press_asset_downloads for insert with check (true);

-- ── Press kit seed (one row in packs, populated by comms) ──────
insert into public.press_packs (slug, scope, label_en, rights, sort_order)
values ('press-kit-cluster', 'press_kit', 'CDCC Press Kit', 'press', 0)
on conflict (slug) do nothing;

-- ── Bootstrap · CI baseline pack stub ──────────────────────────
insert into public.press_packs (slug, scope, label_en, description_en, rights, sort_order)
values (
  'ci-baseline',
  'ci_baseline',
  'CDCC · CI baseline',
  'Cluster-wide corporate identity. Logo set, typography, colour, brand guide. Always current.',
  'public',
  0
)
on conflict (slug) do nothing;

-- ── Attach audit log trigger ────────────────────────────────────
drop trigger if exists trg_audit_assets on public.press_assets;
create trigger trg_audit_assets after insert or update or delete on public.press_assets
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_packs on public.press_packs;
create trigger trg_audit_packs after insert or update or delete on public.press_packs
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_templates on public.press_templates;
create trigger trg_audit_templates after insert or update or delete on public.press_templates
  for each row execute function public.press_audit_row_change();

comment on table public.press_assets is 'The Press · canonical Asset record. Evolves from media_library. Rights-filtered downloads, multi-tagged.';
comment on table public.press_packs is 'The Press · Asset bundle. CI baseline (cluster-wide), Campaign-scoped, Event-scoped, Programme-scoped, or Press kit (computed).';
