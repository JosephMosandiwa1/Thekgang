-- ====================================================================
-- CDCC · source-attribution + context-linking system · 2026-05-10
-- ====================================================================
-- Three-layer discipline ported from VACSA: every public fact + every
-- public image traces to a published source AND links back to its full
-- context. Enforced at the database (this migration), the admin form
-- layer (/admin/sources, /admin/content), and the component layer
-- (SourcedFact, SourcedImage, SourceStrip).
--
-- This migration adds:
--   1. `sources` registry  (single source of truth for citations)
--   2. `content_facts`     (every public stat/claim, FK to source + href)
--   3. `media_library` extension (photographer + source_id + license)
--
-- Per user direction: don't seed anything that isn't factual. Only the
-- internal `cdcc-self` source is seeded — admins add PASA, DSAC, etc.
-- after verifying URLs + dates.
--
-- Idempotent. Safe to re-run.
-- ====================================================================

-- ───── 1. SOURCES REGISTRY ──────────────────────────────────────────
create table if not exists sources (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  label         text not null,
  publisher     text not null,
  url           text,                                     -- nullable for internal sources
  kind          text not null default 'research',         -- survey | masterplan | gazette | internal | press | research | member_submission
  published_at  date,
  retrieved_at  date,
  status        text not null default 'pending_verification',
                                                          -- draft | pending_verification | published
  notes         text,
  added_by      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_sources_status_kind on sources(status, kind);
create index if not exists idx_sources_slug on sources(slug);

-- Updated-at trigger
create or replace function touch_sources()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_sources on sources;
create trigger trg_touch_sources
  before update on sources
  for each row
  execute function touch_sources();

-- Seed: ONLY the internal canonical reference
insert into sources (slug, label, publisher, url, kind, status, published_at, notes)
values (
  'cdcc-self',
  'Content Developers and Creators Council',
  'Content Developers and Creators Council',
  null,
  'internal',
  'published',
  '2026-03-30',
  'Council-direct attribution for facts CDCC publishes about itself (mandate, governance, programmes). External claims must use a verified external source.'
)
on conflict (slug) do nothing;

-- ───── 2. CONTENT_FACTS · every public stat/claim ───────────────────
create table if not exists content_facts (
  id            uuid primary key default gen_random_uuid(),
  surface       text not null,                            -- 'homepage.social_proof' | 'about.pillar' | 'the-plan.outcome' | etc.
  position      int not null default 0,
  value         text not null,
  label         text not null,
  why_here      text,
  context       text,
  source_id     uuid not null references sources(id) on delete restrict,
  href          text not null,                            -- the doorway · MUST exist
  status        text not null default 'draft',            -- draft | pending_verification | published
  is_active     bool not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_content_facts_surface_published
  on content_facts(surface, position)
  where status = 'published' and is_active;

create index if not exists idx_content_facts_status on content_facts(status);

drop trigger if exists trg_touch_content_facts on content_facts;
create trigger trg_touch_content_facts
  before update on content_facts
  for each row
  execute function touch_sources();

-- ───── 3. MEDIA_LIBRARY EXTENSION · provenance per image ────────────
-- Add columns; do not flip NOT NULL yet — existing rows need editorial
-- backfill first. A follow-up migration will tighten the constraints
-- once the library has been reviewed.

alter table media_library
  add column if not exists photographer text,
  add column if not exists source_id    uuid references sources(id) on delete restrict,
  add column if not exists license      text,
  add column if not exists caption      text;

create index if not exists idx_media_library_source on media_library(source_id);

comment on column media_library.photographer is
  'Required for new uploads. Existing rows will be backfilled by editorial pass.';
comment on column media_library.source_id is
  'FK to sources.id. Required for new uploads.';
comment on column media_library.license is
  'cc-by | all-rights-reserved | member-submitted | public-domain | press-release | fair-use';
comment on column media_library.caption is
  'Optional caption shown by SourcedImage if provided.';

-- ───── 4. RLS · public can read published, admins can write ─────────
alter table sources enable row level security;
alter table content_facts enable row level security;

drop policy if exists "Public reads published sources" on sources;
create policy "Public reads published sources"
  on sources for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Admin reads all sources" on sources;
create policy "Admin reads all sources"
  on sources for select to authenticated
  using (current_user_is_admin());

drop policy if exists "Admin writes sources" on sources;
create policy "Admin writes sources"
  on sources for all to authenticated
  using (current_user_is_admin())
  with check (current_user_is_admin());

drop policy if exists "Public reads published facts" on content_facts;
create policy "Public reads published facts"
  on content_facts for select to anon, authenticated
  using (status = 'published' and is_active);

drop policy if exists "Admin reads all facts" on content_facts;
create policy "Admin reads all facts"
  on content_facts for select to authenticated
  using (current_user_is_admin());

drop policy if exists "Admin writes facts" on content_facts;
create policy "Admin writes facts"
  on content_facts for all to authenticated
  using (current_user_is_admin())
  with check (current_user_is_admin());

-- media_library RLS already exists from earlier migrations; we don't
-- modify it here. New columns inherit existing policies.

notify pgrst, 'reload schema';
