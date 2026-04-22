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
