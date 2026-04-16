-- ============================================================
-- CDCC Enhanced Events — Full Event Lifecycle
-- Dedicated pages, campaigns, feedback, speakers, sponsors
-- ============================================================

-- Enhanced events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'event';
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS format text DEFAULT 'in-person';
ALTER TABLE events ADD COLUMN IF NOT EXISTS programme_schedule jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS speakers jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sponsors jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recording_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_urls text[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_enabled boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_dedicated boolean DEFAULT false;

-- Enhanced registrations
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS qr_code text;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS confirmation_sent boolean DEFAULT false;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS waitlisted boolean DEFAULT false;

-- Event campaigns (replace Mailchimp workflow)
CREATE TABLE IF NOT EXISTS event_campaigns (
  id serial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  event_id integer REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  campaign_type text NOT NULL, -- save_the_date, invitation, reminder, last_call, post_event, custom
  subject text NOT NULL,
  body text, -- markdown/rich text
  recipient_list text DEFAULT 'registrants', -- registrants, waitlisted, constituency, all
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer DEFAULT 0,
  status text DEFAULT 'draft' -- draft, scheduled, sent, failed
);

-- Event feedback (post-event)
CREATE TABLE IF NOT EXISTS event_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  event_id integer REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text,
  email text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  highlights text,
  improvements text,
  would_recommend boolean,
  constituency_type text -- capture what type of practitioner they are
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_event_campaigns_event ON event_campaigns(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_qr ON event_registrations(qr_code);

-- RLS policies for new tables
ALTER TABLE event_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_campaigns' AND policyname = 'event_campaigns_all') THEN
    CREATE POLICY event_campaigns_all ON event_campaigns FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_feedback' AND policyname = 'event_feedback_all') THEN
    CREATE POLICY event_feedback_all ON event_feedback FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
