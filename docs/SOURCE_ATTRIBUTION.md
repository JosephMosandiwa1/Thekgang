# Source attribution + context linking · the discipline

Every fact and every image on the public CDCC site traces back to (a) a published source and (b) a link to its full context. This document is the rulebook. Components, the schema, and the admin UI all enforce it together — there is no path to publishing an unsourced or orphan fact.

## The rule, in one sentence

If it claims something, it cites a source. If it shows data outside its full context, it links to the silo where that context lives.

## Why this matters

We're a sector council. Our credibility with members, government, and partners depends on our claims being verifiable. The first time someone reads "30,000 people work in publishing in South Africa" without a citation, they assume we made it up — and they're right to. A site full of un-attributed numbers reads as marketing fluff, not as a council.

VACSA (sister sector council) enforces this discipline; the patterns ported here are adapted from theirs.

## The three layers

### Layer 1 · the database (the enforcer)

Two tables make the discipline impossible to bypass:

**`sources`** — every citation we will ever make. Slug, label, publisher, URL, kind (survey / masterplan / gazette / internal / press / research / member_submission), publication date, status (draft / pending_verification / published).

**`content_facts`** — every public stat / claim / numbered figure. Carries `source_id` (NOT NULL FK to `sources`), `href` (NOT NULL — the doorway), and `surface` (the location key, e.g. `homepage.social_proof`). The schema rejects any insert without provenance.

**`media_library` extension** — every image carries `photographer` + `source_id` FK + `license` + optional `caption`. New uploads cannot complete without these (admin form blocks the commit). Existing rows have these as nullable while editorial backfills; a follow-up migration will tighten them to NOT NULL.

The schema is the leverage point — once data is in, every consumer has provenance, automatically.

### Layer 2 · the components (compile-time enforcement)

`SourcedFact`, `SourcedImage`, and `InfoCard` accept `source: SourceRef` and `href: string` as **required props**. TypeScript fails the build if either is missing. There is no "noCredit" or "noSource" prop.

`SourceStrip` renders a thin macro citation strip at the top or bottom of any data-driven page, listing the sources cited and linking to `/evidence`.

### Layer 3 · the admin UI (editor flow)

**`/admin/sources`** — the registry. Add / edit / publish citations. Only `published` sources can be picked when creating facts.

**`/admin/content`** — the facts editor. Each fact requires `source_id` + `href`. Filter by surface key (e.g. `homepage.social_proof`) to manage one section at a time.

**`ImageUploader`** — extended. Upload form requires photographer + source picker + license + optional caption before the file is committed. The new `media_library` row ships with full provenance.

**`MediaPicker`** — picks from `media_library`, filtered to provenance-rich rows only. Sourceless legacy images can't be reused on new surfaces.

## How to add a new fact

1. Go to `/admin/sources`. Confirm the citation you want to use is listed and `published`. If not, add it (verify the URL + publication date first — never seed unverified).
2. Go to `/admin/content`. Click "+ New fact".
3. Pick a surface key. Use existing keys when possible (`homepage.social_proof`, `homepage.doorway_stats`, `about.pillar`, `the-plan.outcome`, etc.). Define a new surface if you're adding a new section to a page.
4. Fill in value + label + (optional) why-here + (optional) hover context.
5. Pick the source from the dropdown.
6. Set the doorway href — where the user goes if they click "Learn more". Required.
7. Set status to `pending_verification` for editorial review, or `published` if you're an editor and confident.
8. Save. The fact appears on the public surface immediately (or after one revalidation cycle).

## How to upload an image

1. Use any admin form with `ImageUploader` (events, podcast, board members, posts). Drag a file in.
2. The form pauses and asks for: alt text, photographer, source (dropdown of published sources), license, optional caption.
3. Fill in all four required fields. Click "Upload + register".
4. Image is uploaded to the `media` bucket, registered in `media_library` with full provenance, and the URL is returned to the parent form.

## What goes where

| Content type | Where it lives | Example surface key |
|---|---|---|
| Stats / claims / numbered figures | `content_facts` | `homepage.social_proof`, `the-plan.outcome` |
| Images | `media_library` (extended) | — |
| Citations | `sources` | — |
| Brand narrative (hero copy, CTA wording, headlines) | `homepage_content` (existing CMS) | hero, audiences, cta |

The split: **facts vs narrative.** Facts go through the discipline. Narrative stays in the existing CMS where editors author copy directly.

## Empty-state convention

If a surface has no published facts, the page shows a clear *"This section is being assembled — see the strategic plan for our published work."* card. **Never silently fall back to invented copy.** An empty section is honest; a fake section damages trust.

## Surface keys (current)

- `homepage.social_proof` — 3-stat row beneath the hero
- `homepage.doorway_stats` — stats inside the mandate doorway card
- `homepage.pillars` — 6 strategic pillars on the dark section
- `homepage.outcomes` — 6 5-year outcomes

Add a new key when adding a new section. Document it here so other editors can find it.

## When `SourceStrip` is required

Any public page that renders one or more `content_facts` rows. Place it at the top (above the first fact-bearing block) or the bottom (footer of the data-rich section). It carries the page's distinct sources + a link to `/evidence`.

`/evidence` itself never needs a SourceStrip — it IS the registry.

## Forbidden patterns

- Do not pass a string to `InfoCard`'s `source` prop. It must be a `SourceRef`. The compiler will catch this.
- Do not use `<img>` or plain `<Image>` for editorial images on the public site. Use `SourcedImage` so credit + license render automatically.
- Do not seed `sources` with speculative entries (PASA, DSAC, StatsSA, etc.) that haven't been verified. Add them after confirming the publication, date, and URL.
- Do not write hardcoded fact arrays inside page files. New facts go through `/admin/content`.
- Do not promote a `pending_verification` fact to `published` without confirming the source actually backs the claim. If the source doesn't back it, archive the fact (uncheck `is_active`) or reword it.

## Migration history

- `037_source_system.sql` — created `sources`, `content_facts`, extended `media_library`, seeded `cdcc-self`.
- `038_image_fk_columns.sql` — added `*_media_id` FK columns to `events`, `board_members`, `podcast_episodes`, `posts` alongside the existing `*_url` columns.
- `039_seed_content_facts.sql` — lifted the homepage FALLBACK facts into `content_facts` as `pending_verification`, attributed to `cdcc-self`. Editorial promotes individually after review.

## Future migrations (planned, deferred)

- Tighten `media_library.photographer` / `source_id` / `license` to NOT NULL after editorial backfill.
- Drop legacy `*_url` columns on `events`, `board_members`, etc. after content has been re-anchored to `*_media_id`.
