-- ====================================================================
-- CDCC · email_templates registry · 2026-05-10
-- ====================================================================
-- Hybrid email-template strategy: TS modules for the 5 critical
-- transactional templates (welcome, event-reminder, grant-decision,
-- certificate-issued, campaign-shell) live in src/lib/mail/templates/
-- and ship via git. This table is for ADMIN-EDITABLE copy — newsletter
-- campaigns, ad-hoc announcements, programme launches — where operators
-- want to change wording without a deploy.
--
-- Render pipeline: lib/mail/render-template.ts loads the row by `key`,
-- substitutes {{var}} placeholders, then sendBrandedEmail() wraps the
-- result in the standard CDCC HTML scaffold.
--
-- Idempotent. Safe to re-run.
-- ====================================================================

create table if not exists email_templates (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  key             text not null,
  version         integer not null default 1,
  category        text not null default 'campaign',  -- campaign | transactional | system
  subject         text not null,
  body            text not null,                       -- supports {{name}} {{var}} placeholders
  variables       text[] default '{}',
  is_active       boolean not null default true,
  description     text,
  created_by      text,
  unique (key, version)
);

create index if not exists idx_email_templates_key_active
  on email_templates(key, is_active, version desc);

-- Updated-at trigger
create or replace function touch_email_templates()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_email_templates on email_templates;
create trigger trg_touch_email_templates
  before update on email_templates
  for each row
  execute function touch_email_templates();

-- RLS · admin-only writes, no anon reads (table never exposed publicly)
alter table email_templates enable row level security;

drop policy if exists "Admin reads templates" on email_templates;
create policy "Admin reads templates"
  on email_templates for select to authenticated
  using (current_user_is_admin());

drop policy if exists "Admin writes templates" on email_templates;
create policy "Admin writes templates"
  on email_templates for all to authenticated
  using (current_user_is_admin())
  with check (current_user_is_admin());

notify pgrst, 'reload schema';
