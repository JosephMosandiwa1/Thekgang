-- ═══════════════════════════════════════════════════════════════
-- CDCC Bespoke CMS Migration — Phase 1-4 support
-- ───────────────────────────────────────────────────────────────
-- Adds:
--   1. `media` storage bucket (images/pdfs/audio for admin upload)
--   2. `homepage_content` table (editable homepage sections)
--   3. Seed of homepage_content with the current hardcoded content
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. STORAGE BUCKET — public-read media for website content
-- ───────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800, -- 50 MB per file
  array[
    'image/jpeg','image/png','image/webp','image/gif','image/svg+xml',
    'application/pdf',
    'audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/mp4'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies: public read, authenticated write
do $$ begin
  drop policy if exists "media_public_read" on storage.objects;
  drop policy if exists "media_auth_insert" on storage.objects;
  drop policy if exists "media_auth_update" on storage.objects;
  drop policy if exists "media_auth_delete" on storage.objects;
exception when others then null; end $$;

create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

create policy "media_auth_insert" on storage.objects
  for insert with check (bucket_id = 'media');

create policy "media_auth_update" on storage.objects
  for update using (bucket_id = 'media');

create policy "media_auth_delete" on storage.objects
  for delete using (bucket_id = 'media');

-- ───────────────────────────────────────────────────────────────
-- 2. HOMEPAGE_CONTENT — single-row-per-section editable CMS
-- ───────────────────────────────────────────────────────────────
create table if not exists homepage_content (
  id serial primary key,
  section_key text unique not null, -- 'hero', 'stakeholders', 'social_proof', 'doorways', 'audiences', 'pillars', 'outcomes', 'cta'
  label text not null,              -- display name in admin UI
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  updated_at timestamptz default now(),
  updated_by text                   -- admin name / email, free-text for audit
);

create index if not exists idx_homepage_content_section_key on homepage_content (section_key);
create index if not exists idx_homepage_content_sort on homepage_content (sort_order);

alter table homepage_content enable row level security;

do $$ begin
  drop policy if exists "homepage_public_read" on homepage_content;
  drop policy if exists "homepage_auth_write" on homepage_content;
exception when others then null; end $$;

create policy "homepage_public_read" on homepage_content
  for select using (true);

create policy "homepage_auth_write" on homepage_content
  for all using (true) with check (true);

-- ───────────────────────────────────────────────────────────────
-- 3. SEED — preload each homepage section with the current copy
-- so the live site never goes blank when the CMS switches on
-- ───────────────────────────────────────────────────────────────
insert into homepage_content (section_key, label, sort_order, content) values
(
  'hero',
  'Hero — the top of the homepage',
  1,
  '{
    "eyebrow": "Books & Publishing — Content Developers & Creators",
    "headline_line1": "One sector.",
    "headline_line2": "One voice.",
    "headline_line3": "One council.",
    "subcopy": "The central strategic and coordinating body for South Africa''s content development and creation sector. 14 disciplines. 9 provinces. 1 mandate.",
    "cta_primary_label": "Join the Council",
    "cta_primary_href": "/join",
    "cta_secondary_label": "See the Strategic Plan",
    "cta_secondary_href": "/the-plan",
    "cluster_label": "1 of 17 DSAC Cultural & Creative Industries Clusters →",
    "cluster_href": "/ecosystem"
  }'::jsonb
),
(
  'stakeholders',
  'Stakeholder disciplines — the 14 categories',
  2,
  '{
    "eyebrow": "Who We Represent",
    "headline": "14 disciplines. One unified voice.",
    "subcopy": "CDCC represents the full spectrum of content development and creation — from independent creatives to large production companies.",
    "read_more_label": "Read our full mandate →",
    "read_more_href": "/about",
    "categories": [
      "Authors & Writers","Translators","Designers","Narrators",
      "Publishers & Self-Publishers","Research & Development","Editors","Indexers",
      "Proofreaders","Legal & IP","Layout/Designers","Literary Agents",
      "Photographers","AI & Software"
    ],
    "footer_label": "Find your discipline and join →",
    "footer_href": "/join"
  }'::jsonb
),
(
  'social_proof',
  'Social proof strip — mandate, cluster, launch date',
  3,
  '{
    "items": [
      {"eyebrow":"Mandated by","value":"Dept. of Sport, Arts & Culture"},
      {"eyebrow":"Cluster Programme","value":"1 of 17 National CCI Clusters"},
      {"eyebrow":"Officially Launched","value":"30 March 2026"}
    ]
  }'::jsonb
),
(
  'doorways',
  'Doorway cards — Mandate + Ecosystem',
  4,
  '{
    "cards": [
      {
        "eyebrow":"The Mandate",
        "title":"Central strategic body for the content creation sector",
        "body":"CDCC unifies diverse industry stakeholders by providing strategic direction, allocating resources equitably, and fostering skills development to meet evolving demands.",
        "stats":["14 disciplines","9 provinces","6 strategic pillars"],
        "link_label":"Read the full mandate →",
        "link_href":"/about"
      },
      {
        "eyebrow":"The Ecosystem",
        "title":"17 clusters. One national programme.",
        "body":"CDCC operates within DSAC''s Cultural & Creative Industries cluster programme — alongside theatre, dance, film, music, visual arts, design, and more.",
        "tags":["Theatre","Dance","Visual Arts","Film & TV","Music","Design","+11 more"],
        "link_label":"Explore the full ecosystem →",
        "link_href":"/ecosystem"
      }
    ]
  }'::jsonb
),
(
  'audiences',
  'Audiences — 4 entry points',
  5,
  '{
    "eyebrow":"Who This Is For",
    "headline_line1":"From independent creatives",
    "headline_line2":"to production companies.",
    "cards":[
      {
        "title":"For Content Creators",
        "desc":"Authors, illustrators, photographers, narrators — if you create content in the books and publishing space, CDCC coordinates your representation at the highest levels of government.",
        "cta_label":"Join the Council","cta_href":"/join",
        "deeper_label":"Read our mandate →","deeper_href":"/about",
        "hover_class":"card-hover"
      },
      {
        "title":"For Publishers & Enterprises",
        "desc":"From independent self-publishers to large production companies — we ensure equitable resource allocation and advocate for your business interests nationally and internationally.",
        "cta_label":"Affiliate Now","cta_href":"/join",
        "deeper_label":"See the strategic framework →","deeper_href":"/the-plan",
        "hover_class":"card-hover-amber"
      },
      {
        "title":"For Industry Professionals",
        "desc":"Editors, proofreaders, translators, indexers, literary agents, layout designers — the professionals who make publishing happen. CDCC represents the full spectrum.",
        "cta_label":"Register Your Practice","cta_href":"/join",
        "deeper_label":"Why affiliate with CDCC →","deeper_href":"/stakeholders",
        "hover_class":"card-hover-emerald"
      },
      {
        "title":"For Innovators",
        "desc":"AI & software developers, new media creators, digital-first publishers — the future of content creation is here. CDCC ensures the evolving landscape has a seat at the policy table.",
        "cta_label":"Join as Innovator","cta_href":"/join",
        "deeper_label":"Copyright & IP advocacy →","deeper_href":"/advocacy",
        "hover_class":"card-hover-violet"
      }
    ]
  }'::jsonb
),
(
  'pillars',
  'Strategic pillars — 6 items on the charcoal section',
  6,
  '{
    "eyebrow":"Strategic Pillars",
    "headline":"Six pillars. One mandate.",
    "subcopy":"Our 3-year focus areas and 5-year outcomes are built on these foundations.",
    "link_label":"See the full plan →",
    "link_href":"/the-plan",
    "items":[
      {"num":"01","title":"Strategic Oversight","desc":"Overarching strategic direction, policy guidance, and coordination for the entire content development sector.","link":"/the-plan"},
      {"num":"02","title":"Resource Allocation","desc":"Equitable funding and resources to sub-sector organisations based on needs and priorities — from independents to enterprises.","link":"/the-plan"},
      {"num":"03","title":"Skills Development","desc":"Training and development programmes tailored to navigate the evolving industry landscape.","link":"/programmes"},
      {"num":"04","title":"Copyright & IP","desc":"Lobbying for a regulatory framework for copyright protection, intellectual property, and the prevention of infringements.","link":"/advocacy"},
      {"num":"05","title":"Advocacy","desc":"Representing the interests of the entire sector at national and international levels. The main point of contact between publishing and government.","link":"/stakeholders"},
      {"num":"06","title":"Monitoring & Evaluation","desc":"Data-driven performance assessment ensuring alignment with sector objectives and accountability.","link":"/the-plan"}
    ]
  }'::jsonb
),
(
  'outcomes',
  '5-year outcomes — 6 items',
  7,
  '{
    "eyebrow":"5-Year Outcomes",
    "headline":"Where we''re headed.",
    "items":[
      {"label":"Unified & represented sector","desc":"Every sub-sector has a voice. Small enterprises and large companies alike."},
      {"label":"Equitable resource allocation","desc":"Funding distributed based on evidence, not proximity."},
      {"label":"Future-ready workforce","desc":"Practitioners equipped to navigate the evolving industry landscape."},
      {"label":"Robust copyright framework","desc":"Legislative protection for intellectual property across all formats."},
      {"label":"National & international influence","desc":"The sector''s priorities addressed in policy at every level."},
      {"label":"Data-driven accountability","desc":"Monitoring and evaluation embedded in everything we do."}
    ],
    "link_label":"See the full strategic framework →",
    "link_href":"/the-plan"
  }'::jsonb
),
(
  'cta',
  'Final CTA — bottom of homepage',
  8,
  '{
    "headline":"Your sector needs your voice.",
    "subcopy":"Authors, designers, editors, publishers, translators, agents, photographers, narrators, AI developers — if you create or enable content, we represent you.",
    "cta_primary_label":"Join the Council",
    "cta_primary_href":"/join",
    "link_1_label":"See the strategic plan →",
    "link_1_href":"/the-plan",
    "link_2_label":"Explore the ecosystem →",
    "link_2_href":"/ecosystem"
  }'::jsonb
)
on conflict (section_key) do nothing;
