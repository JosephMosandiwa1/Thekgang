-- =====================================================================
-- 004 · Event lifecycle — documents, virtual links, calendar, reminders
-- =====================================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS documents           JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS virtual_link        TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_email_template TEXT,
  ADD COLUMN IF NOT EXISTS reminder_days       INT[] DEFAULT '{7,3,1}',
  ADD COLUMN IF NOT EXISTS rsvp_enabled        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rsvp_count          INT DEFAULT 0;

COMMENT ON COLUMN events.documents IS 'Array of {name, url, type} — attached PDFs, programme docs, etc.';
COMMENT ON COLUMN events.virtual_link IS 'Zoom/Teams URL — shown only to confirmed registrants.';
COMMENT ON COLUMN events.reminder_days IS 'Days before event to auto-send reminders (e.g. {7,3,1}).';
COMMENT ON COLUMN events.rsvp_enabled IS 'When true, initial interest capture before full registration opens.';

-- ── Ticket types per event ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_ticket_types (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,                          -- 'General Admission', 'VIP', 'Student', 'Early Bird'
  description     TEXT,
  price_zar       NUMERIC(10,2) DEFAULT 0,                -- 0 = free
  quantity        INT,                                     -- null = unlimited
  sold            INT DEFAULT 0,
  sort_order      INT DEFAULT 0,
  sale_start      TIMESTAMPTZ,
  sale_end        TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON event_ticket_types(event_id, sort_order);

-- Extend registrations with ticket reference
ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES event_ticket_types(id),
  ADD COLUMN IF NOT EXISTS ticket_code    TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid    NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free','pending','paid','refunded'));

COMMENT ON TABLE event_ticket_types IS 'Ticket tiers per event — free, paid, limited, early-bird, VIP, student, etc.';
COMMENT ON COLUMN event_registrations.ticket_type_id IS 'Which ticket tier this registration booked.';
COMMENT ON COLUMN event_registrations.ticket_code IS 'Human-readable ticket code (e.g. CDCC-POA26-VIP-001).';
