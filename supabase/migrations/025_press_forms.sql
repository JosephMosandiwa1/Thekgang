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
