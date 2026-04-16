-- =====================================================================
-- 005 · Full feature set — speakers table, directory, exhibitors,
--       polls, reading lists, gallery, budget, SMS, certificates
-- =====================================================================

-- ── 1. Central speakers table (re-usable across events) ─────────
CREATE TABLE IF NOT EXISTS speakers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  title           TEXT,
  organisation    TEXT,
  bio             TEXT,
  photo_url       TEXT,
  website         TEXT,
  social_links    JSONB DEFAULT '{}'::jsonb,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_speakers (
  event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  speaker_id      UUID NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'speaker',   -- keynote, speaker, facilitator, panelist, moderator
  session         TEXT,                      -- which programme session
  sort_order      INT DEFAULT 0,
  PRIMARY KEY (event_id, speaker_id)
);

-- ── 2. Event budget tracking ────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS budget_allocated   NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_spent       NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_notes       TEXT;

-- ── 3. Reading lists per event ──────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS reading_list       JSONB DEFAULT '[]'::jsonb;
-- Each entry: {title, author, isbn, cover_url, description, link}

-- ── 4. Gallery management ───────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS gallery_caption    TEXT;
-- gallery_urls already exists as TEXT[] — we add a caption field

-- ── 5. Live polling / Q&A ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_polls (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  poll_type       TEXT DEFAULT 'multiple_choice' CHECK (poll_type IN ('multiple_choice', 'open_ended', 'rating', 'yes_no')),
  options         JSONB DEFAULT '[]'::jsonb,   -- for multiple_choice: [{label, votes}]
  is_active       BOOLEAN DEFAULT false,
  allow_anonymous BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_poll_responses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id         UUID NOT NULL REFERENCES event_polls(id) ON DELETE CASCADE,
  respondent_name TEXT,
  respondent_email TEXT,
  answer          TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 6. Exhibitor management (book fairs) ────────────────────────
CREATE TABLE IF NOT EXISTS event_exhibitors (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  organisation    TEXT,
  description     TEXT,
  logo_url        TEXT,
  website         TEXT,
  booth_number    TEXT,
  exhibitor_type  TEXT DEFAULT 'publisher' CHECK (exhibitor_type IN ('publisher', 'bookseller', 'author', 'distributor', 'printer', 'ngo', 'government', 'other')),
  contact_email   TEXT,
  contact_phone   TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'confirmed')),
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 7. Certificates ─────────────────────────────────────────────
ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS certificate_issued    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certificate_code      TEXT;

-- ── 8. SMS scaffold ─────────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS sms_enabled           BOOLEAN DEFAULT false;

ALTER TABLE event_campaigns
  ADD COLUMN IF NOT EXISTS channel               TEXT DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'whatsapp'));

-- ── 9. Comments ─────────────────────────────────────────────────
COMMENT ON TABLE speakers IS 'Central speaker database — re-usable across events. event_speakers junction links speakers to specific events.';
COMMENT ON TABLE event_polls IS 'Live polls + Q&A for virtual/hybrid events.';
COMMENT ON TABLE event_exhibitors IS 'Book fair exhibitor management — applications, booth assignments, profiles.';
COMMENT ON COLUMN events.reading_list IS 'JSONB array of recommended books: [{title, author, isbn, cover_url, description, link}]';
COMMENT ON COLUMN events.budget_allocated IS 'Event budget in ZAR — for DSAC financial reporting.';
COMMENT ON COLUMN event_registrations.certificate_code IS 'Unique certificate code for CPD/attendance verification.';
