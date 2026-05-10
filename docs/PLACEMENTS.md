# Placements · publishing content across the marketing site

This document describes the placements system — the way an admin features any piece of content (event, book, job, news post, custom HTML, etc.) on any public page.

The pattern mirrors the source-attribution discipline (`docs/SOURCE_ATTRIBUTION.md`): a small registry, a discovery component, and admin CRUD. The leverage point is the schema — once a slot exists targeting a (page, position) pair, the page's canonical anchor renders it. No code edit per new slot.

## The two layers

### Layer 1 · slots (the registry)

A **slot** is a named position on a public page. Each slot row in `placement_slots` carries:

- `slug` — globally unique identifier (e.g. `homepage_hero`, `about_sidebar`)
- `name` + `description` — admin-facing labels
- `page_path` — the URL pattern this slot belongs to (`/about`, `/the-plan`, `/`, etc.) or `null` for global multi-page slots
- `position` — the canonical anchor on that page (`head`, `before_content`, `sidebar`, `between_sections`, `footer`)
- `default_style` + `supports_styles[]` — what visual styles can fill this slot
- `max_concurrent` — how many placements can be live in this slot at once
- `active` — toggle to hide without deleting

Admin manages slots at **`/admin/placements/slots`**.

### Layer 2 · placements (the live content)

A **placement** is a content row that fills a slot. Each row in `placements` carries:

- `slot_id` — which slot it fills
- `content_kind` + `ref_id` — what content is being placed (event, book, post, etc.)
- `style` — which visual style this specific placement uses (must be in slot's `supports_styles`)
- `theme` + per-placement copy/image overrides
- `priority` + scheduling (`starts_at`, `ends_at`, `status`)
- `frequency` for modal-style placements

Admin manages placements at **`/admin/placements`** and creates them via **`FeatureOnSiteButton`** (which appears inside content editors).

## Page anchors · the canonical positions

Every public page renders four canonical anchors via `<PageZone>` (server) or `<PageZoneClient>` (when the parent page is `'use client'`):

| Position | Where on the page |
|---|---|
| `head` | Top of page, above the hero section |
| `before_content` | Between hero and first content block |
| `sidebar` | Right rail (or inline on mobile) |
| `between_sections` | Between major content sections |
| `footer` | Bottom of page, before the global footer |

A page renders these unconditionally. If no slot is registered for that (page, position) pair, the zone returns nothing (zero cost). When admin creates a new slot, the zone lights up.

## How to feature an event on the homepage

1. Open `/admin/events/{id}`. Go to the **Surfaces** tab.
2. Find the slot row for `Home · Head` (homepage_hero).
3. Click **+ Feature here**. The modal opens with this event preselected.
4. Pick a style (`full_takeover` for full-bleed hero), set start/end dates, set status `live`. Save.
5. The homepage now displays this event's hero treatment until the end date.

Same flow works for any slot — sidebar callout on `/about`, footer strip on `/the-plan`, etc.

## How to add a new slot anywhere

1. Open `/admin/placements/slots`. Click **+ New slot**.
2. Name it (e.g. "Programmes · Sidebar"). Slug auto-derives.
3. Pick the page (`/programmes`) and position (`sidebar`).
4. Pick allowed styles + a default.
5. Save.
6. The page already renders the `sidebar` anchor at that path — placements created for this slot now appear immediately.

To add a slot on a NEW page (one we haven't built yet), the page just needs to render `<PageZone page="/new-page" position="..." />` at canonical positions. After that, slot creation lights up without further code changes.

## Calendar visibility

Events with `status != 'draft'` appear in `/events/calendar` automatically. The Surfaces tab shows the calendar visibility row at the top so admins know they're already on the calendar (or that draft mode is hiding them).

## Adding a new content kind (newsletters, etc.)

Today the placements system supports 16 content kinds (event, book, job, post, press_release, podcast, grant, programme, etc.). To add a new kind (e.g. `newsletter`):

1. Add the kind to the `placements.content_kind` CHECK constraint:
   ```sql
   alter table placements drop constraint placements_content_kind_check;
   alter table placements add constraint placements_content_kind_check
     check (content_kind in ('event', 'book', ..., 'newsletter'));
   ```
2. Register a resolver from the newsletter module:
   ```ts
   // src/lib/newsletters/placement-resolver.ts
   import { registerResolver } from '@/lib/placements';
   registerResolver('newsletter', async (sb, p) => {
     const { data } = await sb.from('newsletters').select('...').eq('id', p.ref_id).maybeSingle();
     // build DisplayPayload
   });
   ```
3. Add `'newsletter'` + a label to the `ContentKind` type union and `CONTENT_KIND_LABELS` map in `src/lib/placements.ts`.

The central resolver doesn't need to be edited — `RESOLVERS` is a registry the new module writes into.

## Forbidden patterns

- **Don't add new `<Placements slot="X" />` calls in pages** — use `<PageZone>` / `<PageZoneClient>` at canonical positions instead. The slug-keyed call still works for the original 9 seeded slots and back-compat.
- **Don't hardcode a content_kind branch outside its module** — register a resolver from the module that owns the data.
- **Don't bypass `FeatureOnSiteButton` to insert raw `placements` rows** — the button enforces style validation per slot and gives operators a consistent shape.

## Migration history

- `012_placements.sql` — created `placement_slots` + `placements` + `placement_view_events`. Seeded 9 hardcoded slots.
- `040_dynamic_placement_slots.sql` — extended `placement_slots` with `page_path` + `position`. Backfilled the 9 seeded slots. Seeded standard slots for every public marketing page (`/about`, `/the-plan`, `/ecosystem`, `/stakeholders`, `/advocacy`, `/sector-report`, `/programmes`, `/events`, `/jobs`, `/grants`, `/news`, `/press`, `/contact`) × 4 canonical positions. Added admin-write RLS.
