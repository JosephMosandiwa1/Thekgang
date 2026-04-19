-- ============================================================================
-- 012_placements.sql
--
-- Universal Placements system — the "WordPress widgets" layer.
-- Lets staff promote any content row (event/book/job/award/...) into any
-- named slot on the public site, with a chosen display style, schedule,
-- and optional overrides.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Named zones on the public site
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS placement_slots (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  page_scope        TEXT,                 -- 'home', 'global', 'events', '*'
  max_concurrent    INT DEFAULT 1,
  default_style     TEXT,
  supports_styles   TEXT[] DEFAULT '{}',   -- allowed styles for this slot
  active            BOOLEAN DEFAULT TRUE,
  order_index       INT DEFAULT 100,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO placement_slots (slug, name, description, page_scope, max_concurrent, default_style, supports_styles, order_index) VALUES
  ('homepage_hero',        'Homepage hero',         'Full-bleed hero at the top of the homepage.', 'home', 1, 'full_takeover', ARRAY['full_takeover','hero'], 10),
  ('homepage_featured',    'Homepage featured strip','Horizontal row of up to 3 featured cards on the homepage.', 'home', 3, 'card', ARRAY['card'], 20),
  ('homepage_spotlight',   'Homepage spotlight',    'Single highlighted card further down the homepage.', 'home', 1, 'callout', ARRAY['callout','card'], 30),
  ('homepage_announcement','Homepage announcement', 'Dismissible banner above homepage content.', 'home', 1, 'banner', ARRAY['banner'], 40),
  ('global_banner',        'Global banner',         'Thin bar visible at the top of every public page.', 'global', 1, 'banner', ARRAY['banner'], 50),
  ('global_ticker',        'Global ticker',         'Scrolling announcements across the bottom of the viewport.', 'global', 5, 'ticker', ARRAY['ticker'], 60),
  ('footer_callout',       'Footer callout',        'CTA block rendered in the public footer.', 'global', 1, 'cta_strip', ARRAY['cta_strip','callout'], 70),
  ('events_sidebar',       'Events sidebar',        'Sidebar on the events listing.', 'events', 2, 'card', ARRAY['card','callout'], 80),
  ('takeover',             'Interstitial takeover', 'Full-page modal on first visit per session.', 'global', 1, 'modal', ARRAY['modal'], 90)
ON CONFLICT (slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- The placements table — polymorphic via (content_kind, ref_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS placements (
  id                SERIAL PRIMARY KEY,
  slot_id           INT NOT NULL REFERENCES placement_slots(id) ON DELETE CASCADE,

  -- What is being placed
  content_kind      TEXT NOT NULL
    CHECK (content_kind IN ('event','book','job','award','consultation','post','press_release','podcast','grant','reading_challenge','banned_book','programme','page','organisation','working_group','custom')),
  ref_id            INT,                   -- FK-less polymorphic ref (no DB-level FK so any content row can be placed)
  custom_html       TEXT,                  -- for content_kind = 'custom'

  -- Display overrides (nullable - fall back to source content)
  override_eyebrow  TEXT,
  override_title    TEXT,
  override_subtitle TEXT,
  override_body     TEXT,
  override_image_url TEXT,
  override_cta_text TEXT,
  override_cta_url  TEXT,

  -- Display style + theming
  style             TEXT NOT NULL
    CHECK (style IN ('full_takeover','hero','card','banner','ticker','callout','modal','cta_strip')),
  theme             TEXT DEFAULT 'light'
    CHECK (theme IN ('light','dark','brand','paper','accent')),
  background_color  TEXT,
  text_color        TEXT,
  accent_color      TEXT,
  text_align        TEXT DEFAULT 'left' CHECK (text_align IN ('left','center','right')),

  -- Scheduling + priority
  priority          INT DEFAULT 100,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  status            TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','live','paused','expired')),

  -- Targeting
  target_paths      TEXT[],
  exclude_paths     TEXT[],
  target_audience   TEXT DEFAULT 'all'
    CHECK (target_audience IN ('all','members_only','non_members','staff')),

  -- Frequency cap (modals only) — 'once' | 'daily' | 'session' | 'always'
  frequency         TEXT DEFAULT 'session'
    CHECK (frequency IN ('once','daily','session','always')),

  -- Analytics counters
  views_count       INT DEFAULT 0,
  clicks_count      INT DEFAULT 0,
  dismiss_count     INT DEFAULT 0,

  -- Metadata
  internal_note     TEXT,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plc_slot_status ON placements(slot_id, status);
CREATE INDEX IF NOT EXISTS idx_plc_status_priority ON placements(status, priority);
CREATE INDEX IF NOT EXISTS idx_plc_ref ON placements(content_kind, ref_id);
CREATE INDEX IF NOT EXISTS idx_plc_ends ON placements(ends_at);


-- Auto-expire placements whose ends_at has passed (called by a view + a cron in admin)
CREATE OR REPLACE FUNCTION placements_is_live(p placements) RETURNS BOOLEAN AS $PLV$
BEGIN
  RETURN p.status = 'live'
     AND (p.starts_at IS NULL OR p.starts_at <= NOW())
     AND (p.ends_at IS NULL OR p.ends_at > NOW());
END;
$PLV$ LANGUAGE plpgsql IMMUTABLE;


-- ---------------------------------------------------------------------------
-- Optional: per-view analytics log (granular; add when you need segmentation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS placement_view_events (
  id                SERIAL PRIMARY KEY,
  placement_id      INT NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL CHECK (event_type IN ('view','click','dismiss')),
  path              TEXT,
  session_id        TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pve_placement ON placement_view_events(placement_id);


-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_plc_touch ON placements;
CREATE TRIGGER trg_plc_touch BEFORE UPDATE ON placements
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ---------------------------------------------------------------------------
-- RLS — public reads for live placements; writes service-role only
-- ---------------------------------------------------------------------------
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plc_read_live ON placements;
CREATE POLICY plc_read_live ON placements
  FOR SELECT USING (
    (status = 'live'
     AND (starts_at IS NULL OR starts_at <= NOW())
     AND (ends_at IS NULL OR ends_at > NOW()))
    OR auth.jwt() ->> 'role' = 'service_role'
  );

ALTER TABLE placement_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plcslot_read ON placement_slots;
CREATE POLICY plcslot_read ON placement_slots FOR SELECT USING (active = TRUE);
