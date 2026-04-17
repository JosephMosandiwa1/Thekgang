-- =====================================================================
-- 006 · Complete event ecosystem — 12 event types, mini-site engine,
--       automation, budget, speaker pipeline, section builder
-- =====================================================================

-- ── 1. Expand event_type enum ───────────────────────────────────
-- Drop and recreate to add all 12 types
DO $$
BEGIN
  -- Add new values to the enum if they don't exist
  -- (Can't alter enum in a transaction easily, so we use a workaround)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reading' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_status')) THEN
    -- event_type is a text column, not an enum — so we just need to document valid values
    NULL;
  END IF;
END $$;

-- Valid event_type values (enforced at app level, not DB constraint):
-- symposium, book_fair, workshop, imbizo, book_launch, webinar,
-- conference, reading, awards, training, agm, festival, event (generic)

-- ── 2. Event theme (per-event branding) ─────────────────────────
CREATE TABLE IF NOT EXISTS event_theme (
  event_id          INT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  accent_color      TEXT DEFAULT '#000000',
  accent_color_2    TEXT,
  hero_type         TEXT DEFAULT 'image' CHECK (hero_type IN ('image','video','gradient','pattern','solid')),
  hero_media_url    TEXT,
  event_logo_url    TEXT,
  dark_mode         BOOLEAN DEFAULT false,
  custom_css        TEXT,
  font_heading      TEXT DEFAULT 'Playfair Display',
  font_body         TEXT DEFAULT 'DM Sans',
  footer_text       TEXT,
  footer_contact_email TEXT,
  footer_social_links JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Event sections (section builder — ordering + visibility) ──
CREATE TABLE IF NOT EXISTS event_sections (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  section_key       TEXT NOT NULL,          -- 'hero','about','programme','speakers','exhibitors','venue','faq','registration','partners','gallery','documents','reading_list','abstracts','featured_books','floor_plan','curriculum','discussion_topics','book_details','categories','nominees'
  label             TEXT,                   -- custom label override (default auto from section_key)
  sort_order        INT NOT NULL DEFAULT 0,
  visible           BOOLEAN DEFAULT true,
  content_override  JSONB,                  -- per-section custom content if needed
  UNIQUE (event_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_event_sections_order ON event_sections(event_id, sort_order);

-- ── 4. Event navigation (custom mini-site nav) ──────────────────
CREATE TABLE IF NOT EXISTS event_nav (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label             TEXT NOT NULL,
  href              TEXT NOT NULL,           -- '#about', '#programme', or external URL
  sort_order        INT DEFAULT 0,
  is_cta            BOOLEAN DEFAULT false    -- renders as button instead of link
);

-- ── 5. Event budget items ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_budget_items (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category          TEXT NOT NULL,           -- 'venue_hire','catering','speaker_travel','marketing','av_technical','stationery','staff','exhibitor_infra','prizes','insurance','contingency','other'
  description       TEXT,
  allocated         NUMERIC(12,2) DEFAULT 0,
  committed         NUMERIC(12,2) DEFAULT 0,
  spent             NUMERIC(12,2) DEFAULT 0,
  receipt_urls      JSONB DEFAULT '[]'::jsonb,
  notes             TEXT,
  sort_order        INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_items_event ON event_budget_items(event_id);

-- ── 6. Event tasks (auto-generated checklist) ───────────────────
CREATE TABLE IF NOT EXISTS event_tasks (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT DEFAULT 'planning', -- 'planning','speakers','marketing','logistics','day_of','post_event'
  assignee          TEXT,
  due_date          DATE,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','skipped')),
  auto_generated    BOOLEAN DEFAULT false,
  sort_order        INT DEFAULT 0,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_tasks_event ON event_tasks(event_id, sort_order);

-- ── 7. Speaker invitations (pipeline) ───────────────────────────
CREATE TABLE IF NOT EXISTS speaker_invitations (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  speaker_id        UUID REFERENCES speakers(id),
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  topic_fit         TEXT,
  notes             TEXT,
  status            TEXT DEFAULT 'prospect' CHECK (status IN ('prospect','invited','accepted','declined','briefed','confirmed','completed','cancelled')),
  invited_at        TIMESTAMPTZ,
  responded_at      TIMESTAMPTZ,
  briefed_at        TIMESTAMPTZ,
  confirmed_at      TIMESTAMPTZ,
  travel_needed     BOOLEAN DEFAULT false,
  travel_details    JSONB,                   -- {flight, hotel, transfer, cost}
  dietary           TEXT,
  accessibility     TEXT,
  session_assigned  TEXT,
  speaker_type      TEXT DEFAULT 'speaker',  -- keynote, speaker, facilitator, panelist, moderator
  bio_submitted     BOOLEAN DEFAULT false,
  photo_submitted   BOOLEAN DEFAULT false,
  slides_url        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_speaker_invitations_event ON speaker_invitations(event_id, status);

-- ── 8. Speaker self-service tokens ──────────────────────────────
CREATE TABLE IF NOT EXISTS speaker_self_service_tokens (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id     UUID NOT NULL REFERENCES speaker_invitations(id) ON DELETE CASCADE,
  token             TEXT NOT NULL UNIQUE,
  expires_at        TIMESTAMPTZ NOT NULL,
  used_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ── 9. Event custom registration fields ─────────────────────────
CREATE TABLE IF NOT EXISTS event_custom_fields (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field_name        TEXT NOT NULL,
  field_type        TEXT DEFAULT 'text' CHECK (field_type IN ('text','textarea','select','checkbox','radio','file','number','email','phone','date')),
  label             TEXT NOT NULL,
  placeholder       TEXT,
  options           JSONB,                   -- for select/radio: [{value, label}]
  required          BOOLEAN DEFAULT false,
  sort_order        INT DEFAULT 0,
  conditional_on    TEXT,                    -- field_name that must have a value for this to show
  conditional_value TEXT
);

-- ── 10. Promo codes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_promo_codes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code              TEXT NOT NULL,
  discount_type     TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value    NUMERIC(10,2) NOT NULL,
  usage_limit       INT,
  used_count        INT DEFAULT 0,
  expires_at        TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, code)
);

-- ── 11. Live announcements ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_announcements (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  message           TEXT NOT NULL,
  announcement_type TEXT DEFAULT 'info' CHECK (announcement_type IN ('info','warning','urgent','success')),
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  expires_at        TIMESTAMPTZ
);

-- ── 12. Session-level feedback ──────────────────────────────────
CREATE TABLE IF NOT EXISTS event_session_feedback (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_title     TEXT NOT NULL,
  session_index     INT,
  rating            INT CHECK (rating >= 1 AND rating <= 5),
  comment           TEXT,
  respondent_name   TEXT,
  respondent_email  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ── 13. Festival sub-events ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_sub_events (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  event_date        DATE,
  start_time        TIME,
  end_time          TIME,
  venue             TEXT,
  venue_room        TEXT,
  event_type        TEXT DEFAULT 'reading',  -- reading, panel, workshop, performance, market, children, signing
  speakers          JSONB DEFAULT '[]'::jsonb,
  capacity          INT,
  requires_ticket   BOOLEAN DEFAULT false,
  age_group         TEXT,                    -- 'all','children','teens','adults'
  sort_order        INT DEFAULT 0,
  is_highlight      BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_parent ON event_sub_events(parent_event_id, event_date, start_time);

-- ── 14. Extend event_exhibitors ─────────────────────────────────
ALTER TABLE event_exhibitors
  ADD COLUMN IF NOT EXISTS booth_size       TEXT,
  ADD COLUMN IF NOT EXISTS booth_fee        NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_instructions TEXT,
  ADD COLUMN IF NOT EXISTS products         JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS catalogue_url    TEXT;

-- ── 15. Extend event_registrations ──────────────────────────────
ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS custom_fields    JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS refund_status    TEXT,
  ADD COLUMN IF NOT EXISTS dietary          TEXT,
  ADD COLUMN IF NOT EXISTS accessibility_needs TEXT,
  ADD COLUMN IF NOT EXISTS promo_code_used  TEXT;

-- ── 16. Extend events with new fields ───────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS venue_map_url    TEXT,
  ADD COLUMN IF NOT EXISTS venue_map_embed  TEXT,
  ADD COLUMN IF NOT EXISTS accommodation_info TEXT,
  ADD COLUMN IF NOT EXISTS transport_info   TEXT,
  ADD COLUMN IF NOT EXISTS faq              JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS key_themes       JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS why_attend       TEXT,
  ADD COLUMN IF NOT EXISTS target_audience  TEXT,
  ADD COLUMN IF NOT EXISTS dress_code       TEXT,
  ADD COLUMN IF NOT EXISTS featured_books   JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS discussion_topics JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resolutions      JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS book_details     JSONB,
  ADD COLUMN IF NOT EXISTS press_kit_url    TEXT,
  ADD COLUMN IF NOT EXISTS award_categories JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS nominees         JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS winners          JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS curriculum       JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS accreditation    JSONB,
  ADD COLUMN IF NOT EXISTS agenda_items     JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_objectives JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prerequisites    JSONB DEFAULT '[]'::jsonb;

-- ── 17. Comments ────────────────────────────────────────────────
COMMENT ON TABLE event_theme IS 'Per-event branding: accent colour, hero, logo, fonts, footer. Enables each event to be its own mini-site with unique identity.';
COMMENT ON TABLE event_sections IS 'Section builder: controls which sections appear on the mini-site and in what order. Admin can toggle visibility and reorder.';
COMMENT ON TABLE event_budget_items IS 'Line-item budget tracking per event. Categories pre-populated from event-type template.';
COMMENT ON TABLE event_tasks IS 'Auto-generated checklist per event type. Tracks planning progress from creation to post-event.';
COMMENT ON TABLE speaker_invitations IS 'Full speaker lifecycle: prospect → invited → accepted → briefed → confirmed → completed. Tracks travel, dietary, submissions.';
COMMENT ON TABLE event_sub_events IS 'Festival sub-events: hundreds of mini-events within a parent festival. Each with its own schedule, venue, speakers.';
COMMENT ON TABLE event_custom_fields IS 'Custom registration form fields per event. Admin can add dropdowns, checkboxes, file uploads beyond standard fields.';
COMMENT ON TABLE event_promo_codes IS 'Discount codes for ticket purchases. Percentage or fixed amount, with usage limits and expiry.';
