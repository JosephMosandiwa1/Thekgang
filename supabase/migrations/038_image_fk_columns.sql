-- ====================================================================
-- CDCC · image-bearing tables · *_media_id FK columns · 2026-05-10
-- ====================================================================
-- Additive migration. Existing `*_url` columns stay in place for
-- backwards compatibility. New uploads route through the extended
-- media_library (with photographer + source_id + license required at
-- the form layer) and reference media_library by FK.
--
-- Old content keeps working with `*_url`; new content uses `*_media_id`.
-- A follow-up migration deprecates the URL columns once content has
-- been re-anchored.
--
-- Idempotent. Safe to re-run.
-- ====================================================================

alter table events
  add column if not exists cover_media_id uuid references media_library(id) on delete set null;

alter table board_members
  add column if not exists photo_media_id uuid references media_library(id) on delete set null;

alter table podcast_episodes
  add column if not exists cover_media_id uuid references media_library(id) on delete set null;

alter table posts
  add column if not exists cover_media_id uuid references media_library(id) on delete set null;

create index if not exists idx_events_cover_media         on events(cover_media_id);
create index if not exists idx_board_members_photo_media  on board_members(photo_media_id);
create index if not exists idx_podcast_episodes_cover_media on podcast_episodes(cover_media_id);
create index if not exists idx_posts_cover_media          on posts(cover_media_id);

comment on column events.cover_media_id is
  'FK to media_library. New events use this; legacy events still have cover_image_url.';
comment on column board_members.photo_media_id is
  'FK to media_library. New members use this; legacy members still have photo_url.';
comment on column podcast_episodes.cover_media_id is
  'FK to media_library. New episodes use this; legacy episodes still have cover_image_url.';
comment on column posts.cover_media_id is
  'FK to media_library. New posts use this; legacy posts still have cover_image_url.';

notify pgrst, 'reload schema';
