-- ========================================================================
-- THE PRESS · consolidated migration (020 through 032 merged)
-- Generated: 2026-04-22T20:06:52Z
-- 
-- Run this once against Supabase to create the entire CDCC CMS schema
-- in one shot. Fully idempotent — safe to re-run after partial failure.
-- 
-- Contents (in dependency order):
--   020 · roles + user_roles + RLS helpers
--   021 · audit log + generic row-change trigger
--   022 · Voices + Blocks + Briefs + Disciplines (14) + Pillars (4)
--   023 · Library (Assets + Packs + Templates + Press kit)
--   024 · Council + Network + MOUs + Interactions + Provinces (9) + Languages (11)
--   025 · Forms + Submissions + seeded "Join the Council" form
--   026 · Messaging (Subscribers + Segments + Messages + Sequences + Newsletters + Deliveries)
--   027 · Campaigns + FK backfill
--   028 · Programmes (5 variants) + Juries
--   029 · Events + Tickets + Attendance + Outcomes + Certificates
--   030 · Documents + Finance (Contracts + Invoices + Expenses + Payments + Meetings)
--   031 · Strategy + Sector indicators + Reports + Translations
--   032 · Site + Integrations + Media loop (contacts + pitches + coverage + social)
-- ========================================================================



-- ========================================================================
-- SECTION · 020_press_roles.sql
-- ========================================================================

-- =====================================================================
-- The Press · Phase A0 · role system
-- 2026-04-22 · CDCC CMS rebuild
--
-- Introduces a 10-role model named for CDCC's actual governance shape
-- (not WordPress-generic subscriber/author/editor/admin). Every RLS
-- policy going forward calls `public.press_current_role()` which reads
-- from `user_roles`. Phase A0 only SEEDS the role model — subsequent
-- phases add per-primitive row-level policies that reference it.
--
-- Idempotent. Safe to run multiple times.
-- =====================================================================

-- ── Role enum ─────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'press_role') then
    create type press_role as enum (
      'chair',
      'treasurer',
      'secretary',
      'ed',
      'programme_lead',
      'contributor',
      'council_member',
      'jury_member',
      'volunteer',
      'staff'
    );
  end if;
end $$;

-- ── user_roles · binds a Supabase auth user to one Press role ────
create table if not exists public.user_roles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  role           press_role not null,
  -- Optional scope: Programme Leads are scoped to a programme_id; Jury
  -- Members to a jury_id; both are populated once those tables exist in
  -- later phases. NULL = cluster-wide for ED/Chair/Treasurer/Secretary.
  scope_programme_id uuid null,
  scope_jury_id      uuid null,
  assigned_by    uuid references auth.users(id),
  assigned_at    timestamptz not null default now(),
  notes          text
);

create index if not exists idx_user_roles_role on public.user_roles (role);
create index if not exists idx_user_roles_programme on public.user_roles (scope_programme_id);

-- ── Helper · current user's Press role ───────────────────────────
-- Callable from RLS policies (security invoker). Returns NULL if not
-- signed in or not yet assigned.
create or replace function public.press_current_role()
returns press_role
language sql
stable
security invoker
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;

-- ── Helper · does current user have one of the given roles? ──────
create or replace function public.press_has_role(variadic roles press_role[])
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role = any(roles)
  );
$$;

-- ── Helper · programme scope ──────────────────────────────────────
-- Returns true if current user is a Programme Lead scoped to the given
-- programme, OR if they have cluster-wide privilege (chair / ed).
create or replace function public.press_can_access_programme(p_programme_id uuid)
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and (
        role in ('chair', 'ed', 'treasurer', 'secretary')
        or (role = 'programme_lead' and scope_programme_id = p_programme_id)
      )
  );
$$;

-- ── RLS on user_roles itself ─────────────────────────────────────
alter table public.user_roles enable row level security;

drop policy if exists user_roles_self_read on public.user_roles;
create policy user_roles_self_read on public.user_roles
  for select using (user_id = auth.uid() or public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists user_roles_chair_ed_write on public.user_roles;
create policy user_roles_chair_ed_write on public.user_roles
  for all using (public.press_has_role('chair', 'ed')) with check (public.press_has_role('chair', 'ed'));

-- ── Bootstrap · assign the first signed-in admin as ED ──────────
-- If there are ZERO user_roles rows yet, the next auth.users insert
-- should get an ED role automatically so the shell is reachable.
-- This is a one-time bootstrap trigger; remove in production after
-- the first admin is seeded.
create or replace function public.press_bootstrap_first_admin()
returns trigger
language plpgsql
security definer
as $$
begin
  if (select count(*) from public.user_roles) = 0 then
    insert into public.user_roles (user_id, role, notes)
    values (new.id, 'ed', 'Auto-assigned as first admin (press_bootstrap_first_admin).');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_press_bootstrap_first_admin on auth.users;
create trigger trg_press_bootstrap_first_admin
  after insert on auth.users
  for each row execute function public.press_bootstrap_first_admin();

-- ── Comment on the table for discoverability ────────────────────
comment on table public.user_roles is
  'The Press · role registry. One row per admin user. See lib/press/roles.ts for the canonical enum + capability matrix.';


-- ========================================================================
-- SECTION · 021_press_audit_log.sql
-- ========================================================================

-- =====================================================================
-- The Press · Phase A0 · audit log
-- 2026-04-22 · CDCC CMS rebuild
--
-- An immutable, append-only log of every admin write. The plan's
-- compliance loop ("who did what, when") starts here. Any table that
-- wants auditing attaches the generic trigger `press_audit_row_change`;
-- Phase A1+ will attach it to Voices, Campaigns, Forms, etc.
--
-- Idempotent.
-- =====================================================================

-- ── press_audit_log table ────────────────────────────────────────
create table if not exists public.press_audit_log (
  id           bigserial primary key,
  at           timestamptz not null default now(),
  actor_id     uuid references auth.users(id),
  actor_role   press_role,
  table_name   text not null,
  row_pk       text not null,                -- text to handle uuid / int / composite
  op           text not null check (op in ('insert', 'update', 'delete')),
  diff         jsonb,                         -- old/new for updates; new for inserts; old for deletes
  note         text
);

create index if not exists idx_audit_at   on public.press_audit_log (at desc);
create index if not exists idx_audit_tbl  on public.press_audit_log (table_name, at desc);
create index if not exists idx_audit_row  on public.press_audit_log (table_name, row_pk);
create index if not exists idx_audit_actor on public.press_audit_log (actor_id, at desc);

alter table public.press_audit_log enable row level security;

-- Audit log is readable by chair / ed / secretary; no one writes
-- directly (only the trigger function does, via security definer).
drop policy if exists press_audit_log_read on public.press_audit_log;
create policy press_audit_log_read on public.press_audit_log
  for select using (public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists press_audit_log_deny_writes on public.press_audit_log;
create policy press_audit_log_deny_writes on public.press_audit_log
  for all using (false) with check (false);

-- ── Log a manual entry (for non-DB actions like "sent newsletter") ──
create or replace function public.press_audit_note(
  p_table_name text,
  p_row_pk text,
  p_op text,
  p_note text,
  p_diff jsonb default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  insert into public.press_audit_log (actor_id, actor_role, table_name, row_pk, op, diff, note)
  values (
    auth.uid(),
    public.press_current_role(),
    p_table_name,
    p_row_pk,
    p_op,
    p_diff,
    p_note
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- ── Generic row-change trigger ───────────────────────────────────
-- Attach with:
--   create trigger trg_audit_voices
--   after insert or update or delete on public.voices
--   for each row execute function public.press_audit_row_change();
--
-- Reads OLD/NEW into a diff jsonb; excludes large columns by default
-- (append column names to skip_cols array in table-specific triggers
-- via the `audit_skip_cols` setting).
create or replace function public.press_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pk        text;
  v_diff      jsonb;
  v_old       jsonb := case when tg_op in ('update', 'delete') then to_jsonb(old) else null end;
  v_new       jsonb := case when tg_op in ('update', 'insert') then to_jsonb(new) else null end;
begin
  -- Try common pk columns; fall back to 'unknown'.
  if tg_op = 'delete' then
    v_pk := coalesce(v_old->>'id', v_old->>'uuid', 'unknown');
  else
    v_pk := coalesce(v_new->>'id', v_new->>'uuid', 'unknown');
  end if;

  if tg_op = 'update' then
    -- Only log fields that changed.
    select jsonb_object_agg(key, jsonb_build_object('old', v_old->key, 'new', v_new->key))
    into v_diff
    from jsonb_object_keys(v_new) as key
    where v_old->key is distinct from v_new->key;
  elsif tg_op = 'insert' then
    v_diff := jsonb_build_object('new', v_new);
  else
    v_diff := jsonb_build_object('old', v_old);
  end if;

  insert into public.press_audit_log (actor_id, actor_role, table_name, row_pk, op, diff)
  values (
    auth.uid(),
    public.press_current_role(),
    tg_table_name,
    v_pk,
    lower(tg_op),
    v_diff
  );

  return case when tg_op = 'delete' then old else new end;
end;
$$;

-- ── Attach to user_roles (first auditable table) ────────────────
drop trigger if exists trg_audit_user_roles on public.user_roles;
create trigger trg_audit_user_roles
  after insert or update or delete on public.user_roles
  for each row execute function public.press_audit_row_change();

comment on table public.press_audit_log is
  'The Press · immutable audit log. Append-only. Trigger press_audit_row_change() writes rows; nothing else may insert/update/delete.';


-- ========================================================================
-- SECTION · 022_press_voices.sql
-- ========================================================================

-- =====================================================================
-- The Press · Phase A1 · Voices + blocks + briefs + taxonomy
-- 2026-04-22 · CDCC CMS rebuild
--
-- The unified publishing primitive. One table for article, page,
-- essay, podcast, booklet, press-release, research-note,
-- policy-submission, call-for-submissions, announcement, SOP, playbook.
-- Format drives rendering; the underlying shape is the same.
--
-- Also seeds the two foundational taxonomies (Discipline · Pillar)
-- because the Voice schema references them. Phase B3 will extend
-- with Province + Language.
--
-- Idempotent.
-- =====================================================================

-- ── Voice-format enum ───────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'voice_format') then
    create type voice_format as enum (
      'article',
      'page',
      'essay',
      'podcast',
      'booklet',
      'press_release',
      'research_note',
      'policy_submission',
      'call_for_submissions',
      'announcement',
      'sop',
      'playbook'
    );
  end if;
end $$;

-- ── Voice workflow state ────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'voice_state') then
    create type voice_state as enum (
      'commissioned',
      'in_progress',
      'council_review',
      'ready',
      'live',
      'archived'
    );
  end if;
end $$;

-- ── Discipline (seeded — 14 rows) ───────────────────────────────
create table if not exists public.press_disciplines (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  label_en   text not null,
  label_xh   text,
  description text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

insert into public.press_disciplines (slug, label_en, sort_order) values
  ('authors',            'Authors',                 1),
  ('translators',        'Translators',             2),
  ('editors',            'Editors',                 3),
  ('publishers',         'Publishers',              4),
  ('designers',          'Designers',               5),
  ('narrators',          'Narrators',               6),
  ('proofreaders',       'Proofreaders',            7),
  ('literary_agents',    'Literary agents',         8),
  ('photographers',      'Photographers',           9),
  ('indexers',           'Indexers',                10),
  ('layout_graphic',     'Layout and graphic designers', 11),
  ('research_dev',       'Research and development', 12),
  ('ai_software',        'AI and software',         13),
  ('legal_ip',           'Legal and IP',            14)
on conflict (slug) do nothing;

-- ── Pillar (seeded — 4 rows) ────────────────────────────────────
create table if not exists public.press_pillars (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  label_en   text not null,
  label_xh   text,
  description text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

insert into public.press_pillars (slug, label_en, sort_order) values
  ('build_author_capacity',  'Build Author Capacity', 1),
  ('transform_consumption',  'Transform Consumption', 2),
  ('support_all_talent',     'Support All Talent',    3),
  ('grow_markets',           'Grow Markets',          4)
on conflict (slug) do nothing;

-- ── Briefs · commissioning artefact ─────────────────────────────
create table if not exists public.press_briefs (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  intent         text,                     -- why this exists
  format         voice_format not null default 'article',
  pillar_id      uuid references public.press_pillars(id),
  discipline_ids uuid[],                   -- array of discipline ids
  commissioned_by uuid references auth.users(id),
  assigned_to    uuid references auth.users(id),
  due_at         timestamptz,
  state          text not null default 'open', -- open · accepted · completed · cancelled
  voice_id       uuid,                     -- set when a Voice is created
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_briefs_assigned on public.press_briefs (assigned_to, state);
create index if not exists idx_briefs_state on public.press_briefs (state, created_at desc);

-- ── Voices · the unified publishing primitive ───────────────────
create table if not exists public.press_voices (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  format          voice_format not null default 'article',
  state           voice_state not null default 'in_progress',

  -- Bilingual panes
  title_en        text,
  title_xh        text,
  standfirst_en   text,
  standfirst_xh   text,

  -- Block stream: an ordered array of { type, props } objects.
  -- Each block's props include bilingual variants where applicable
  -- (e.g. prose.html_en + prose.html_xh).
  blocks          jsonb not null default '[]'::jsonb,

  -- Taxonomy
  brief_id        uuid references public.press_briefs(id),
  pillar_id       uuid references public.press_pillars(id),
  discipline_ids  uuid[],
  campaign_id     uuid,                      -- FK set in Phase C6
  tags            text[] default '{}',

  -- Scheduling + preview
  scheduled_at    timestamptz,
  published_at    timestamptz,
  preview_token   text unique,               -- signed token for /preview/[token]

  -- SEO + social
  seo_title_en    text,
  seo_title_xh    text,
  seo_description_en text,
  seo_description_xh text,
  social_image_url text,

  -- Print extraction
  print_included  boolean not null default false,
  print_order     smallint,

  -- Audit
  created_by      uuid references auth.users(id),
  updated_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_voices_state    on public.press_voices (state, updated_at desc);
create index if not exists idx_voices_format   on public.press_voices (format);
create index if not exists idx_voices_pillar   on public.press_voices (pillar_id);
create index if not exists idx_voices_scheduled on public.press_voices (scheduled_at) where state = 'ready';
create index if not exists idx_voices_published on public.press_voices (published_at desc) where state = 'live';
create index if not exists idx_voices_campaign on public.press_voices (campaign_id);

-- FK for brief.voice_id now that voices exists
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_briefs_voice' and table_name = 'press_briefs'
  ) then
    alter table public.press_briefs
      add constraint fk_briefs_voice
      foreign key (voice_id) references public.press_voices(id) on delete set null;
  end if;
end $$;

-- ── Voice revisions ─────────────────────────────────────────────
create table if not exists public.press_voice_revisions (
  id          uuid primary key default gen_random_uuid(),
  voice_id    uuid not null references public.press_voices(id) on delete cascade,
  snapshot    jsonb not null,              -- full voice row at save time
  revision_no integer not null,
  note        text,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  unique (voice_id, revision_no)
);
create index if not exists idx_revisions_voice on public.press_voice_revisions (voice_id, revision_no desc);

-- ── Voice comments · inline annotations during Council review ──
create table if not exists public.press_voice_comments (
  id         uuid primary key default gen_random_uuid(),
  voice_id   uuid not null references public.press_voices(id) on delete cascade,
  block_key  text,                         -- id of the block this comment is anchored to; null = whole-piece
  body       text not null,
  resolved   boolean not null default false,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  author_id  uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_voice on public.press_voice_comments (voice_id, resolved, created_at desc);

-- ── State-transition log (append-only, separate from audit log) ─
create table if not exists public.press_voice_transitions (
  id          bigserial primary key,
  voice_id    uuid not null references public.press_voices(id) on delete cascade,
  from_state  voice_state,
  to_state    voice_state not null,
  actor_id    uuid references auth.users(id),
  note        text,
  at          timestamptz not null default now()
);
create index if not exists idx_transitions_voice on public.press_voice_transitions (voice_id, at desc);

-- ── Trigger · generate a preview token on insert if missing ────
create or replace function public.press_voice_ensure_preview_token()
returns trigger
language plpgsql
as $$
begin
  if new.preview_token is null then
    -- 24-byte random base64url-ish token
    new.preview_token := encode(gen_random_bytes(24), 'base64');
    new.preview_token := replace(replace(replace(new.preview_token, '/', '_'), '+', '-'), '=', '');
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_voice_ensure_token on public.press_voices;
create trigger trg_voice_ensure_token
  before insert or update on public.press_voices
  for each row execute function public.press_voice_ensure_preview_token();

-- ── Trigger · record state transitions + snapshot revisions ────
create or replace function public.press_voice_on_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_rev integer;
begin
  if tg_op = 'update' and old.state is distinct from new.state then
    insert into public.press_voice_transitions (voice_id, from_state, to_state, actor_id)
    values (new.id, old.state, new.state, auth.uid());

    -- Stamp published_at when first entering live
    if new.state = 'live' and old.state <> 'live' then
      new.published_at := coalesce(new.published_at, now());
    end if;
  end if;

  -- Snapshot a revision when blocks or panes change
  if tg_op = 'update' and (
       old.blocks is distinct from new.blocks
       or old.title_en is distinct from new.title_en
       or old.title_xh is distinct from new.title_xh
       or old.standfirst_en is distinct from new.standfirst_en
       or old.standfirst_xh is distinct from new.standfirst_xh
     ) then
    select coalesce(max(revision_no), 0) + 1 into v_next_rev
      from public.press_voice_revisions where voice_id = new.id;
    insert into public.press_voice_revisions (voice_id, snapshot, revision_no, created_by)
    values (new.id, to_jsonb(old), v_next_rev, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_voice_on_change on public.press_voices;
create trigger trg_voice_on_change
  before update on public.press_voices
  for each row execute function public.press_voice_on_change();

-- Attach audit trigger to voices too (the generic logger from 021)
drop trigger if exists trg_audit_voices on public.press_voices;
create trigger trg_audit_voices
  after insert or update or delete on public.press_voices
  for each row execute function public.press_audit_row_change();

-- ── RLS · Voices ────────────────────────────────────────────────
alter table public.press_voices enable row level security;

-- Read · live Voices are public; drafts readable by editorial roles + the author
drop policy if exists voices_public_read_live on public.press_voices;
create policy voices_public_read_live on public.press_voices
  for select using (state = 'live');

drop policy if exists voices_editorial_read on public.press_voices;
create policy voices_editorial_read on public.press_voices
  for select using (
    public.press_has_role('chair', 'ed', 'secretary')
    or (public.press_has_role('programme_lead') and created_by = auth.uid())
    or (public.press_has_role('contributor') and created_by = auth.uid())
  );

-- Write · ED + Programme Lead (scoped) + Contributor (own only)
drop policy if exists voices_write on public.press_voices;
create policy voices_write on public.press_voices
  for all using (
    public.press_has_role('ed')
    or (public.press_has_role('programme_lead') and created_by = auth.uid())
    or (public.press_has_role('contributor') and created_by = auth.uid())
    or public.press_has_role('chair')
  )
  with check (
    public.press_has_role('ed', 'chair')
    or (public.press_has_role('programme_lead') and created_by = auth.uid())
    or (public.press_has_role('contributor') and created_by = auth.uid())
  );

-- ── RLS · Briefs · comments · revisions · transitions ─────────
alter table public.press_briefs enable row level security;
drop policy if exists briefs_editorial on public.press_briefs;
create policy briefs_editorial on public.press_briefs
  for all using (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'secretary', 'programme_lead'));

drop policy if exists briefs_assignee_read on public.press_briefs;
create policy briefs_assignee_read on public.press_briefs
  for select using (assigned_to = auth.uid());

alter table public.press_voice_comments enable row level security;
drop policy if exists voice_comments_rw on public.press_voice_comments;
create policy voice_comments_rw on public.press_voice_comments
  for all using (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary', 'contributor'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary', 'contributor'));

alter table public.press_voice_revisions enable row level security;
drop policy if exists voice_revisions_read on public.press_voice_revisions;
create policy voice_revisions_read on public.press_voice_revisions
  for select using (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary'));

alter table public.press_voice_transitions enable row level security;
drop policy if exists voice_transitions_read on public.press_voice_transitions;
create policy voice_transitions_read on public.press_voice_transitions
  for select using (public.press_has_role('chair', 'ed', 'programme_lead', 'secretary'));

-- ── RLS · Taxonomy (read public) ────────────────────────────────
alter table public.press_disciplines enable row level security;
drop policy if exists disciplines_read on public.press_disciplines;
create policy disciplines_read on public.press_disciplines for select using (true);

drop policy if exists disciplines_write on public.press_disciplines;
create policy disciplines_write on public.press_disciplines
  for all using (public.press_has_role('chair', 'ed')) with check (public.press_has_role('chair', 'ed'));

alter table public.press_pillars enable row level security;
drop policy if exists pillars_read on public.press_pillars;
create policy pillars_read on public.press_pillars for select using (true);

drop policy if exists pillars_write on public.press_pillars;
create policy pillars_write on public.press_pillars
  for all using (public.press_has_role('chair', 'ed')) with check (public.press_has_role('chair', 'ed'));

comment on table public.press_voices is
  'The Press · unified publishing primitive. One table for article · page · essay · podcast · booklet · press_release · research_note · policy_submission · call_for_submissions · announcement · sop · playbook.';


-- ========================================================================
-- SECTION · 023_press_library.sql
-- ========================================================================

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


-- ========================================================================
-- SECTION · 024_press_council_network.sql
-- ========================================================================

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


-- ========================================================================
-- SECTION · 025_press_forms.sql
-- ========================================================================

-- =====================================================================
-- The Press · Phase B4 · Forms + submissions
-- 2026-04-22 · CDCC CMS rebuild
--
-- Forms are authored, not coded. Admin opens /admin/press/forms and
-- builds any form: event registration, membership application, call-
-- for-submissions, grant application, feedback, RSVP, survey. The
-- field list, validation, routing, scheduling, thank-you, redirect,
-- bilingual labels all live in this schema.
--
-- Submissions are stored as rows in press_submissions with a jsonb
-- payload. Review state + routing travel through separate columns.
-- =====================================================================

-- ── Form access rules ───────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'form_access') then
    create type form_access as enum ('public', 'member', 'programme_scoped', 'token_gated');
  end if;
  if not exists (select 1 from pg_type where typname = 'submission_state') then
    create type submission_state as enum ('received', 'reviewing', 'shortlisted', 'accepted', 'declined', 'notified', 'withdrawn');
  end if;
end $$;

-- ── Form · authored definition ──────────────────────────────────
create table if not exists public.press_forms (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title_en        text not null,
  title_xh        text,
  description_en  text,
  description_xh  text,

  -- Ordered array of fields. Each field:
  --   { key, type, label_en, label_xh, help_en, help_xh,
  --     required, options (for selects), validation,
  --     default_value, placeholder_en, placeholder_xh }
  fields          jsonb not null default '[]'::jsonb,

  access          form_access not null default 'public',
  programme_id    uuid,
  campaign_id     uuid,

  -- Routing
  route_to_role   press_role,                    -- who sees submissions
  route_to_user_id uuid references auth.users(id),
  notify_emails   text[] default '{}',

  -- Scheduling
  opens_at        timestamptz,
  closes_at       timestamptz,

  -- Presentation
  submit_label_en text default 'Submit',
  submit_label_xh text,
  thankyou_en     text,
  thankyou_xh     text,
  redirect_url    text,

  -- Audit
  status          text not null default 'draft',   -- draft · published · archived
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_forms_status on public.press_forms (status);
create index if not exists idx_forms_access on public.press_forms (access);

alter table public.press_forms enable row level security;

drop policy if exists forms_read_public on public.press_forms;
create policy forms_read_public on public.press_forms
  for select using (status = 'published');

drop policy if exists forms_editorial_rw on public.press_forms;
create policy forms_editorial_rw on public.press_forms
  for all using (public.press_has_role('chair', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead'));

-- ── Submission · an instance of a filled Form ───────────────────
create table if not exists public.press_submissions (
  id              uuid primary key default gen_random_uuid(),
  form_id         uuid not null references public.press_forms(id) on delete cascade,
  payload         jsonb not null,                  -- field_key → value
  state           submission_state not null default 'received',

  -- Who submitted
  submitted_by    uuid references auth.users(id),
  submitter_email text,
  submitter_name  text,

  -- Review
  assigned_to     uuid references auth.users(id),
  jury_id         uuid,                             -- set once juries exist (Phase D7)
  score           numeric(5,2),
  review_note     text,
  decided_at      timestamptz,
  decided_by      uuid references auth.users(id),
  notified_at     timestamptz,

  -- Metadata
  source_url      text,
  user_agent      text,
  ip_hash         text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_submissions_form on public.press_submissions (form_id, created_at desc);
create index if not exists idx_submissions_state on public.press_submissions (state);
create index if not exists idx_submissions_assignee on public.press_submissions (assigned_to);

alter table public.press_submissions enable row level security;

-- Anyone authenticated may insert a submission to a published form.
drop policy if exists submissions_insert on public.press_submissions;
create policy submissions_insert on public.press_submissions
  for insert with check (true);

-- Editorial read + submitter own-read
drop policy if exists submissions_editorial_read on public.press_submissions;
create policy submissions_editorial_read on public.press_submissions
  for select using (
    public.press_has_role('chair', 'ed', 'programme_lead', 'secretary', 'jury_member')
    or submitted_by = auth.uid()
  );

drop policy if exists submissions_editorial_update on public.press_submissions;
create policy submissions_editorial_update on public.press_submissions
  for update using (public.press_has_role('chair', 'ed', 'programme_lead', 'jury_member'))
  with check (public.press_has_role('chair', 'ed', 'programme_lead', 'jury_member'));

-- ── Audit triggers ──────────────────────────────────────────────
drop trigger if exists trg_audit_forms on public.press_forms;
create trigger trg_audit_forms after insert or update or delete on public.press_forms
  for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_submissions on public.press_submissions;
create trigger trg_audit_submissions after insert or update or delete on public.press_submissions
  for each row execute function public.press_audit_row_change();

-- ── Seed · one example form so the surface has something to show ─
insert into public.press_forms (slug, title_en, description_en, fields, access, status, submit_label_en, thankyou_en)
values (
  'join-the-council',
  'Join the Council',
  'Apply to join the Books and Publishing Content Developers and Creators Council.',
  '[
    {"key":"full_name","type":"text","label_en":"Full name","required":true},
    {"key":"email","type":"email","label_en":"Email","required":true},
    {"key":"phone","type":"phone","label_en":"Phone","required":false},
    {"key":"discipline","type":"discipline_picker","label_en":"Primary discipline","required":true},
    {"key":"province","type":"province_picker","label_en":"Province","required":true},
    {"key":"why","type":"textarea","label_en":"Why do you want to join?","help_en":"Two sentences.","required":true},
    {"key":"consent","type":"consent","label_en":"I agree to the CDCC member code of conduct.","required":true}
  ]'::jsonb,
  'public',
  'published',
  'Send application',
  'Received. You will hear back within ten working days.'
)
on conflict (slug) do nothing;

comment on table public.press_forms is 'The Press · authored Form definitions. No-code field builder, bilingual labels, access + routing rules, scheduling.';
comment on table public.press_submissions is 'The Press · Form submission instances. payload jsonb stores field_key → value.';


-- ========================================================================
-- SECTION · 026_press_messaging.sql
-- ========================================================================

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


-- ========================================================================
-- SECTION · 027_press_campaigns.sql
-- ========================================================================

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


-- ========================================================================
-- SECTION · 028_press_programmes.sql
-- ========================================================================

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


-- ========================================================================
-- SECTION · 029_press_events.sql
-- ========================================================================

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


-- ========================================================================
-- SECTION · 030_press_documents_finance.sql
-- ========================================================================

-- =====================================================================
-- The Press · Phase E9 · Documents + Finance + Governance
-- 2026-04-22 · CDCC CMS rebuild
--
-- Contracts (with e-signature), Invoices (in + out), Expense claims,
-- Payments, Meetings (agenda + minutes + resolutions + action items).
-- =====================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'contract_state') then
    create type contract_state as enum ('drafted', 'sent', 'partially_signed', 'signed', 'filed', 'expired', 'terminated');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_direction') then
    create type invoice_direction as enum ('incoming', 'outgoing');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_state') then
    create type invoice_state as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'expense_state') then
    create type expense_state as enum ('submitted', 'approved', 'rejected', 'reimbursed');
  end if;
  if not exists (select 1 from pg_type where typname = 'meeting_kind') then
    create type meeting_kind as enum ('board', 'agm', 'committee', 'working_group', 'staff', 'other');
  end if;
end $$;

-- ── Contracts ──────────────────────────────────────────────────
create table if not exists public.press_contracts (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,
  title           text not null,
  kind            text not null default 'general',    -- speaker · venue · vendor · mou · employment · consulting
  counterparty_stakeholder_id uuid references public.press_stakeholders(id),
  counterparty_council_id     uuid references public.press_council_members(id),
  document_asset_id uuid references public.press_assets(id),
  signature_cdcc_user_id uuid references auth.users(id),
  signature_cdcc_at timestamptz,
  signature_counterparty_name text,
  signature_counterparty_at   timestamptz,
  signature_hash  text,                                 -- SHA-256 of signed PDF
  starts_at       date,
  ends_at         date,
  amount          numeric(14, 2),
  currency        text default 'ZAR',
  state           contract_state not null default 'drafted',
  programme_id    uuid references public.press_programmes(id),
  event_id        uuid references public.press_events(id),
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_contracts enable row level security;
drop policy if exists contracts_rw on public.press_contracts;
create policy contracts_rw on public.press_contracts
  for all using (public.press_has_role('chair', 'treasurer', 'secretary', 'ed'))
  with check (public.press_has_role('chair', 'treasurer', 'secretary', 'ed'));

-- ── Invoices ────────────────────────────────────────────────────
create table if not exists public.press_invoices (
  id              uuid primary key default gen_random_uuid(),
  direction       invoice_direction not null,
  invoice_number  text,
  counterparty_stakeholder_id uuid references public.press_stakeholders(id),
  counterparty_name text,
  amount_net      numeric(14, 2) not null default 0,
  tax             numeric(14, 2) not null default 0,
  amount_gross    numeric(14, 2) not null default 0,
  currency        text default 'ZAR',
  issued_at       date,
  due_at          date,
  paid_at         date,
  state           invoice_state not null default 'draft',
  programme_id    uuid references public.press_programmes(id),
  campaign_id     uuid references public.press_campaigns(id),
  event_id        uuid references public.press_events(id),
  contract_id     uuid references public.press_contracts(id),
  document_asset_id uuid references public.press_assets(id),
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_invoices_direction on public.press_invoices (direction, state);
create index if not exists idx_invoices_due on public.press_invoices (due_at);

alter table public.press_invoices enable row level security;
drop policy if exists invoices_rw on public.press_invoices;
create policy invoices_rw on public.press_invoices
  for all using (public.press_has_role('chair', 'treasurer', 'ed'))
  with check (public.press_has_role('chair', 'treasurer', 'ed'));

-- ── Expense claims ────────────────────────────────────────────
create table if not exists public.press_expenses (
  id              uuid primary key default gen_random_uuid(),
  submitter_user_id uuid references auth.users(id),
  title           text not null,
  amount          numeric(14, 2) not null,
  currency        text default 'ZAR',
  incurred_on     date,
  category        text,                               -- travel · catering · printing · other
  programme_id    uuid references public.press_programmes(id),
  event_id        uuid references public.press_events(id),
  receipt_asset_id uuid references public.press_assets(id),
  state           expense_state not null default 'submitted',
  approver_user_id uuid references auth.users(id),
  approved_at     timestamptz,
  reimbursed_at   timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_expenses_state on public.press_expenses (state);
create index if not exists idx_expenses_submitter on public.press_expenses (submitter_user_id, state);

alter table public.press_expenses enable row level security;
drop policy if exists expenses_submitter_read on public.press_expenses;
create policy expenses_submitter_read on public.press_expenses
  for select using (submitter_user_id = auth.uid());
drop policy if exists expenses_finance_rw on public.press_expenses;
create policy expenses_finance_rw on public.press_expenses
  for all using (public.press_has_role('treasurer', 'chair', 'ed'))
  with check (public.press_has_role('treasurer', 'chair', 'ed'));
drop policy if exists expenses_staff_insert on public.press_expenses;
create policy expenses_staff_insert on public.press_expenses
  for insert with check (public.press_has_role('staff', 'ed', 'programme_lead', 'volunteer', 'contributor'));

-- ── Payments (settled lines) ──────────────────────────────────
create table if not exists public.press_payments (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid references public.press_invoices(id),
  expense_id      uuid references public.press_expenses(id),
  amount          numeric(14, 2) not null,
  currency        text default 'ZAR',
  method          text,                               -- eft · card · cash
  reference       text,
  paid_on         date,
  reconciled_at   timestamptz,
  reconciled_by   uuid references auth.users(id),
  notes           text
);

alter table public.press_payments enable row level security;
drop policy if exists payments_rw on public.press_payments;
create policy payments_rw on public.press_payments
  for all using (public.press_has_role('treasurer', 'chair', 'ed'))
  with check (public.press_has_role('treasurer', 'chair', 'ed'));

-- ── Meetings + Resolutions + Action Items ─────────────────────
create table if not exists public.press_meetings (
  id              uuid primary key default gen_random_uuid(),
  kind            meeting_kind not null default 'board',
  title           text not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  venue           text,
  agenda          jsonb default '[]'::jsonb,
  minutes         jsonb default '[]'::jsonb,
  status          text not null default 'scheduled',  -- scheduled · in_progress · concluded · cancelled
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.press_resolutions (
  id              uuid primary key default gen_random_uuid(),
  meeting_id      uuid references public.press_meetings(id) on delete cascade,
  event_outcome_id uuid references public.press_event_outcomes(id) on delete set null,
  title_en        text not null,
  body_en         text,
  moved_by        text,
  seconded_by     text,
  result          text,                                -- passed · rejected · noted · deferred
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists public.press_action_items (
  id              uuid primary key default gen_random_uuid(),
  resolution_id   uuid references public.press_resolutions(id) on delete cascade,
  meeting_id      uuid references public.press_meetings(id) on delete cascade,
  event_outcome_id uuid references public.press_event_outcomes(id) on delete cascade,
  title           text not null,
  owner_user_id   uuid references auth.users(id),
  due_date        date,
  status          text not null default 'open',       -- open · done · dropped · blocked
  completed_at    timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_meetings enable row level security;
alter table public.press_resolutions enable row level security;
alter table public.press_action_items enable row level security;

drop policy if exists meetings_rw on public.press_meetings;
create policy meetings_rw on public.press_meetings
  for all using (public.press_has_role('chair', 'secretary', 'treasurer', 'ed'))
  with check (public.press_has_role('chair', 'secretary', 'treasurer', 'ed'));

drop policy if exists resolutions_rw on public.press_resolutions;
create policy resolutions_rw on public.press_resolutions
  for all using (public.press_has_role('chair', 'secretary', 'ed'))
  with check (public.press_has_role('chair', 'secretary', 'ed'));

drop policy if exists action_items_rw on public.press_action_items;
create policy action_items_rw on public.press_action_items
  for all using (public.press_has_role('chair', 'secretary', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'secretary', 'ed', 'programme_lead'));

drop policy if exists action_items_owner_read on public.press_action_items;
create policy action_items_owner_read on public.press_action_items
  for select using (owner_user_id = auth.uid());

-- Audit
drop trigger if exists trg_audit_contracts on public.press_contracts;
create trigger trg_audit_contracts after insert or update or delete on public.press_contracts for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_invoices on public.press_invoices;
create trigger trg_audit_invoices after insert or update or delete on public.press_invoices for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_expenses on public.press_expenses;
create trigger trg_audit_expenses after insert or update or delete on public.press_expenses for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_meetings on public.press_meetings;
create trigger trg_audit_meetings after insert or update or delete on public.press_meetings for each row execute function public.press_audit_row_change();

comment on table public.press_contracts is 'The Press · Contracts. Speaker · venue · vendor · MOU. e-signature (SHA hash of signed PDF).';
comment on table public.press_invoices is 'The Press · Invoices (in + out). Sponsor invoicing, vendor bills, programme reimbursements.';
comment on table public.press_expenses is 'The Press · Expense claims. Submit → approve (Treasurer) → reimburse.';
comment on table public.press_meetings is 'The Press · Meetings with agenda + minutes + resolutions + action items.';


-- ========================================================================
-- SECTION · 031_press_strategy_reports.sql
-- ========================================================================

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


-- ========================================================================
-- SECTION · 032_press_site_integrations_media.sql
-- ========================================================================

-- =====================================================================
-- The Press · Phase F11 · Site settings + Integrations + Media loop
-- 2026-04-22 · CDCC CMS rebuild
-- =====================================================================

-- ── Site-wide settings (singleton row) ─────────────────────────
create table if not exists public.press_site (
  id              smallint primary key default 1 check (id = 1),
  site_title_en   text default 'CDCC',
  site_title_xh   text,
  tagline_en      text,
  tagline_xh      text,
  primary_nav     jsonb default '[]'::jsonb,            -- [{ label_en, label_xh, href, role_filter }]
  footer          jsonb default '{}'::jsonb,
  homepage_blocks jsonb default '[]'::jsonb,            -- block stream for the homepage
  seo_defaults    jsonb default '{}'::jsonb,            -- { title_suffix, og_image, robots }
  social_handles  jsonb default '{}'::jsonb,
  theme_tokens    jsonb default '{}'::jsonb,            -- overrides on top of cdcc-tokens
  contact_email   text default 'hello@cdcc.org.za',
  updated_by      uuid references auth.users(id),
  updated_at      timestamptz not null default now()
);
insert into public.press_site (id) values (1) on conflict (id) do nothing;

alter table public.press_site enable row level security;
drop policy if exists site_read on public.press_site;
create policy site_read on public.press_site for select using (true);
drop policy if exists site_rw on public.press_site;
create policy site_rw on public.press_site
  for all using (public.press_has_role('chair', 'ed'))
  with check (public.press_has_role('chair', 'ed'));

-- ── Site redirects ─────────────────────────────────────────────
create table if not exists public.press_redirects (
  id              uuid primary key default gen_random_uuid(),
  from_path       text unique not null,
  to_path         text not null,
  status_code     smallint not null default 301,
  created_at      timestamptz not null default now()
);
alter table public.press_redirects enable row level security;
drop policy if exists redirects_read on public.press_redirects;
create policy redirects_read on public.press_redirects for select using (true);
drop policy if exists redirects_rw on public.press_redirects;
create policy redirects_rw on public.press_redirects
  for all using (public.press_has_role('chair', 'ed'))
  with check (public.press_has_role('chair', 'ed'));

-- ── Integrations (adapter registry) ────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'integration_kind') then
    create type integration_kind as enum (
      'email_sendgrid', 'email_postmark', 'email_ses', 'email_brevo',
      'whatsapp_meta', 'sms_twilio',
      'payment_yoco', 'payment_payfast', 'payment_stripe',
      'video_zoom', 'video_teams',
      'esign_docusign', 'esign_inhouse',
      'analytics_ga4', 'analytics_plausible',
      'podcast_rss', 'social_linkedin', 'social_x', 'social_instagram', 'social_facebook'
    );
  end if;
end $$;

create table if not exists public.press_integrations (
  id              uuid primary key default gen_random_uuid(),
  kind            integration_kind not null unique,
  label           text not null,
  enabled         boolean not null default false,
  config          jsonb default '{}'::jsonb,            -- non-secret config only
  credential_ref  text,                                  -- reference into secret-manager / env var name
  health_state    text default 'unknown',                -- unknown · ok · degraded · down
  last_check_at   timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_integrations enable row level security;
drop policy if exists integrations_read on public.press_integrations;
create policy integrations_read on public.press_integrations
  for select using (public.press_has_role('chair', 'ed'));
drop policy if exists integrations_rw on public.press_integrations;
create policy integrations_rw on public.press_integrations
  for all using (public.press_has_role('chair', 'ed'))
  with check (public.press_has_role('chair', 'ed'));

-- ── Media loop · press contacts, pitches, coverage ─────────────
create table if not exists public.press_media_contacts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  outlet          text,
  beat            text,
  email           text,
  phone           text,
  province_id     uuid references public.press_provinces(id),
  relationship_strength smallint default 0,
  last_contact_at timestamptz,
  notes           text,
  stakeholder_id  uuid references public.press_stakeholders(id),
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_type where typname = 'pitch_state') then
    create type pitch_state as enum ('drafted', 'sent', 'responded', 'covered', 'declined', 'no_response');
  end if;
end $$;

create table if not exists public.press_pitches (
  id              uuid primary key default gen_random_uuid(),
  voice_id        uuid references public.press_voices(id) on delete cascade,
  media_contact_id uuid references public.press_media_contacts(id),
  subject         text,
  body            text,
  sent_at         timestamptz,
  state           pitch_state not null default 'drafted',
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.press_coverage (
  id              uuid primary key default gen_random_uuid(),
  voice_id        uuid references public.press_voices(id),
  event_id        uuid references public.press_events(id),
  campaign_id     uuid references public.press_campaigns(id),
  media_contact_id uuid references public.press_media_contacts(id),
  outlet          text,
  headline        text,
  url             text,
  published_at    date,
  sentiment       text,                                   -- positive · neutral · negative
  reach_estimate  integer,
  notes           text,
  logged_by       uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

alter table public.press_media_contacts enable row level security;
alter table public.press_pitches enable row level security;
alter table public.press_coverage enable row level security;

drop policy if exists media_contacts_rw on public.press_media_contacts;
create policy media_contacts_rw on public.press_media_contacts
  for all using (public.press_has_role('chair', 'ed', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists pitches_rw on public.press_pitches;
create policy pitches_rw on public.press_pitches
  for all using (public.press_has_role('chair', 'ed', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists coverage_read on public.press_coverage;
create policy coverage_read on public.press_coverage for select using (true);
drop policy if exists coverage_write on public.press_coverage;
create policy coverage_write on public.press_coverage
  for all using (public.press_has_role('chair', 'ed', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'secretary'));

-- ── Social scheduler (posts to external platforms) ─────────────
create table if not exists public.press_social_posts (
  id              uuid primary key default gen_random_uuid(),
  platform        text not null,                          -- linkedin · x · instagram · facebook
  voice_id        uuid references public.press_voices(id),
  campaign_id     uuid references public.press_campaigns(id),
  body            text not null,
  asset_id        uuid references public.press_assets(id),
  scheduled_at    timestamptz,
  posted_at       timestamptz,
  external_id     text,
  state           text not null default 'draft',          -- draft · scheduled · posted · failed
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_social_posts enable row level security;
drop policy if exists social_rw on public.press_social_posts;
create policy social_rw on public.press_social_posts
  for all using (public.press_has_role('chair', 'ed', 'secretary'))
  with check (public.press_has_role('chair', 'ed', 'secretary'));

-- Audit triggers
drop trigger if exists trg_audit_site on public.press_site;
create trigger trg_audit_site after update on public.press_site for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_integrations on public.press_integrations;
create trigger trg_audit_integrations after insert or update or delete on public.press_integrations for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_media on public.press_media_contacts;
create trigger trg_audit_media after insert or update or delete on public.press_media_contacts for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_pitches on public.press_pitches;
create trigger trg_audit_pitches after insert or update or delete on public.press_pitches for each row execute function public.press_audit_row_change();

-- Seed integrations as disabled entries so the admin UI shows them
insert into public.press_integrations (kind, label, enabled) values
  ('email_postmark',     'Email · Postmark',          false),
  ('whatsapp_meta',      'WhatsApp · Meta Cloud API', false),
  ('payment_yoco',       'Payments · Yoco',           false),
  ('payment_payfast',    'Payments · PayFast',        false),
  ('video_zoom',         'Video · Zoom',              false),
  ('esign_inhouse',      'E-sign · In-house',         true),
  ('analytics_plausible','Analytics · Plausible',     false),
  ('podcast_rss',        'Podcast RSS feed',          true),
  ('social_linkedin',    'Social · LinkedIn',         false)
on conflict (kind) do nothing;

comment on table public.press_site is 'The Press · singleton site settings. Primary nav, footer, homepage blocks, SEO, theme, social handles.';
comment on table public.press_integrations is 'The Press · third-party adapter registry. Credentials live in env / secret manager; this table tracks config + health.';
