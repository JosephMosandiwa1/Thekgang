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
