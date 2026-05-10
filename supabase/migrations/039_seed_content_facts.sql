-- ====================================================================
-- CDCC · seed content_facts from existing FALLBACK copy · 2026-05-10
-- ====================================================================
-- Lifts the factual atoms out of the hardcoded FALLBACK objects in
-- src/app/(public)/page.tsx (and equivalents on /about, /the-plan, etc.)
-- into the new content_facts table, attributed to `cdcc-self`.
--
-- All seeded rows land in `status='pending_verification'` so editorial
-- can review + promote to `published` (or rework + cite an external
-- source) before they render publicly. This is the honest path: don't
-- silently re-publish unsourced claims behind a "now sourced" label.
--
-- Idempotent. Safe to re-run — uses (surface, position, value) as a
-- soft de-dupe key.
-- ====================================================================

do $$
declare
  cdcc_id uuid;
begin
  select id into cdcc_id from sources where slug = 'cdcc-self';
  if cdcc_id is null then
    raise exception 'sources row cdcc-self not found · run migration 037 first';
  end if;

  -- ─── homepage.social_proof · 3 facts ─────────────────────────────
  insert into content_facts (surface, position, value, label, source_id, href, status)
  select * from (values
    ('homepage.social_proof', 0, 'Dept. of Sport, Arts & Culture', 'Mandated by',          cdcc_id, '/about',          'pending_verification'),
    ('homepage.social_proof', 1, '1 of 17 National CCI Clusters',  'Cluster Programme',    cdcc_id, '/ecosystem',      'pending_verification'),
    ('homepage.social_proof', 2, '30 March 2026',                  'Officially Launched',  cdcc_id, '/about',          'pending_verification')
  ) as v(surface, position, value, label, source_id, href, status)
  where not exists (
    select 1 from content_facts cf
    where cf.surface = v.surface and cf.position = v.position and cf.value = v.value
  );

  -- ─── homepage.doorway_stats · 3 facts (mandate card) ─────────────
  insert into content_facts (surface, position, value, label, source_id, href, status)
  select * from (values
    ('homepage.doorway_stats', 0, '14', 'Disciplines',        cdcc_id, '/stakeholders',    'pending_verification'),
    ('homepage.doorway_stats', 1, '9',  'Provinces',          cdcc_id, '/sector-report',   'pending_verification'),
    ('homepage.doorway_stats', 2, '6',  'Strategic pillars',  cdcc_id, '/the-plan',        'pending_verification')
  ) as v(surface, position, value, label, source_id, href, status)
  where not exists (
    select 1 from content_facts cf
    where cf.surface = v.surface and cf.position = v.position and cf.value = v.value
  );

  -- ─── homepage.outcomes · 6 5-year outcomes ───────────────────────
  insert into content_facts (surface, position, value, label, why_here, source_id, href, status)
  select * from (values
    ('homepage.outcomes', 0, 'Unified & represented sector',     '5-year outcome', 'Every sub-sector has a voice. Small enterprises and large companies alike.', cdcc_id, '/the-plan', 'pending_verification'),
    ('homepage.outcomes', 1, 'Equitable resource allocation',    '5-year outcome', 'Funding distributed based on evidence, not proximity.',                       cdcc_id, '/the-plan', 'pending_verification'),
    ('homepage.outcomes', 2, 'Future-ready workforce',           '5-year outcome', 'Practitioners equipped to navigate the evolving industry landscape.',         cdcc_id, '/programmes', 'pending_verification'),
    ('homepage.outcomes', 3, 'Robust copyright framework',       '5-year outcome', 'Legislative protection for intellectual property across all formats.',         cdcc_id, '/advocacy', 'pending_verification'),
    ('homepage.outcomes', 4, 'National & international influence', '5-year outcome', 'The sector''s priorities addressed in policy at every level.',                cdcc_id, '/stakeholders', 'pending_verification'),
    ('homepage.outcomes', 5, 'Data-driven accountability',       '5-year outcome', 'Monitoring and evaluation embedded in everything we do.',                      cdcc_id, '/sector-report', 'pending_verification')
  ) as v(surface, position, value, label, why_here, source_id, href, status)
  where not exists (
    select 1 from content_facts cf
    where cf.surface = v.surface and cf.position = v.position and cf.value = v.value
  );

  -- ─── homepage.pillars · 6 strategic pillars ──────────────────────
  insert into content_facts (surface, position, value, label, why_here, source_id, href, status)
  select * from (values
    ('homepage.pillars', 0, '01', 'Strategic Oversight',   'Overarching strategic direction, policy guidance, and coordination for the entire content development sector.',                      cdcc_id, '/the-plan',     'pending_verification'),
    ('homepage.pillars', 1, '02', 'Resource Allocation',   'Equitable funding and resources to sub-sector organisations based on needs and priorities — from independents to enterprises.',     cdcc_id, '/the-plan',     'pending_verification'),
    ('homepage.pillars', 2, '03', 'Skills Development',    'Training and development programmes tailored to navigate the evolving industry landscape.',                                          cdcc_id, '/programmes',   'pending_verification'),
    ('homepage.pillars', 3, '04', 'Copyright & IP',        'Lobbying for a regulatory framework for copyright protection, intellectual property, and the prevention of infringements.',          cdcc_id, '/advocacy',     'pending_verification'),
    ('homepage.pillars', 4, '05', 'Advocacy',              'Representing the interests of the entire sector at national and international levels. The main point of contact between publishing and government.', cdcc_id, '/stakeholders', 'pending_verification'),
    ('homepage.pillars', 5, '06', 'Monitoring & Evaluation', 'Data-driven performance assessment ensuring alignment with sector objectives and accountability.',                                  cdcc_id, '/the-plan',     'pending_verification')
  ) as v(surface, position, value, label, why_here, source_id, href, status)
  where not exists (
    select 1 from content_facts cf
    where cf.surface = v.surface and cf.position = v.position and cf.value = v.value
  );

  -- ─── sector-report.totals · placeholder facts (page reads live data) ─
  -- Intentionally not seeded · /sector-report's 4 InfoCards render from
  -- live sector_data_submissions aggregation, not from content_facts.
  -- Their source attribution flows through the cdcc-self ref directly.

end;
$$;

notify pgrst, 'reload schema';
