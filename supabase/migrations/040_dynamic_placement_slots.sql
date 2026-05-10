-- ====================================================================
-- CDCC · dynamic placement slots · 2026-05-10
-- ====================================================================
-- Extends placement_slots with page_path + position so admins can
-- create new slots on ANY public page without a code edit. Pages
-- render `<PageZone page="/about" position="sidebar" />` at canonical
-- positions; admin creates slots in /admin/placements/slots that
-- target (page_path, position) pairs.
--
-- Mirrors the sources/content_facts pattern: small registry, dynamic
-- discovery, admin CRUD. The leverage point is the page_path +
-- position pair — once a page is rendering its canonical positions,
-- the editorial team can light up any slot from the admin without
-- developer involvement.
--
-- Backwards-compatible. Existing `<Placements slot="X" />` calls keep
-- working via slug.
--
-- Idempotent. Safe to re-run.
-- ====================================================================

-- ───── Schema extension ─────────────────────────────────────────────
alter table placement_slots
  add column if not exists page_path        text,
  add column if not exists position         text,
  add column if not exists is_admin_created boolean not null default false;

create index if not exists idx_placement_slots_page_position
  on placement_slots(page_path, position)
  where active and page_path is not null;

comment on column placement_slots.page_path is
  'Canonical URL pattern this slot belongs to (e.g. ''/about''). NULL = global / multi-page.';
comment on column placement_slots.position is
  'Canonical anchor on the page · ''head'' | ''before_content'' | ''sidebar'' | ''between_sections'' | ''footer''. NULL when slot is slug-keyed only.';
comment on column placement_slots.is_admin_created is
  'TRUE for slots admins added via /admin/placements/slots. FALSE for the original 9 hardcoded seeds.';

-- ───── Backfill the original 9 seeded slots ─────────────────────────
update placement_slots set page_path = '/',          position = 'head'             where slug = 'homepage_hero'         and page_path is null;
update placement_slots set page_path = '/',          position = 'between_sections' where slug = 'homepage_featured'     and page_path is null;
update placement_slots set page_path = '/',          position = 'between_sections' where slug = 'homepage_spotlight'    and page_path is null;
update placement_slots set page_path = '/',          position = 'head'             where slug = 'homepage_announcement' and page_path is null;
update placement_slots set page_path = null,         position = 'head'             where slug = 'global_banner'         and page_path is null;
update placement_slots set page_path = null,         position = 'footer'           where slug = 'global_ticker'         and page_path is null;
update placement_slots set page_path = null,         position = 'footer'           where slug = 'footer_callout'        and page_path is null;
update placement_slots set page_path = '/events',    position = 'sidebar'          where slug = 'events_sidebar'        and page_path is null;
update placement_slots set page_path = null,         position = 'head'             where slug = 'takeover'              and page_path is null;

-- ───── Seed standard per-page slots for the marketing pages ─────────
-- Convention: every public marketing page can carry up to 4 slot kinds:
--   head             — top of page, above any section
--   before_content   — between hero and first content block
--   sidebar          — right rail (or inline on mobile)
--   footer           — bottom of page, before global footer
--
-- Each slot is single-style by default; admins can change the
-- supports_styles array via /admin/placements/slots later.

do $$
declare
  pages text[] := array['/about', '/the-plan', '/ecosystem', '/stakeholders', '/advocacy', '/sector-report', '/programmes', '/jobs', '/grants', '/news', '/press', '/contact'];
  positions_with_styles text[][] := array[
    array['head',             'Head banner',     'banner',    'banner,callout'],
    array['before_content',   'Above content',   'callout',   'callout,card,hero,full_takeover'],
    array['sidebar',          'Sidebar callout', 'callout',   'callout,card'],
    array['footer',           'Footer strip',    'cta_strip', 'cta_strip,callout,card']
  ];
  page text;
  ps text[];
  page_label text;
begin
  foreach page in array pages loop
    page_label := initcap(replace(replace(page, '/', ''), '-', ' '));
    if page_label = '' then page_label := 'Home'; end if;
    foreach ps slice 1 in array positions_with_styles loop
      insert into placement_slots
        (slug, name, description, page_scope, max_concurrent, default_style, supports_styles, page_path, position, active, order_index, is_admin_created)
      values (
        replace(replace(page, '/', ''), '-', '_') || '_' || ps[1],
        page_label || ' · ' || ps[2],
        'Auto-seeded · ' || ps[2] || ' on ' || page || '. Admins can adjust styles + retire via /admin/placements/slots.',
        replace(page, '/', ''),
        1,
        ps[3],
        string_to_array(ps[4], ','),
        page,
        ps[1],
        true,
        100,
        false
      )
      on conflict (slug) do nothing;
    end loop;
  end loop;
end;
$$;

-- ───── RLS · admins can write slot rows (read is public via existing policy) ─
drop policy if exists plcslot_write on placement_slots;
create policy plcslot_write on placement_slots
  for all to authenticated
  using (current_user_is_admin())
  with check (current_user_is_admin());

notify pgrst, 'reload schema';
