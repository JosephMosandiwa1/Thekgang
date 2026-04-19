-- ============================================================================
-- 007_member_portal.sql
--
-- Member-facing portal for the 14 publishing disciplines.
--
-- Adds:
--   - members           one row per logged-in practitioner linked to auth.users
--   - member_certificates  credentials + event completion records
--   - member_benefits   benefits catalogue (free to members)
--   - member_resources  downloadable resources (member-gated)
--   - member_tiers      membership tiers (for future billing)
--   - ties to existing constituency_submissions, events, event_registrations
--
-- Security:
--   Row-level security enabled; members can only read/update their own record.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- member_tiers (lookup)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_tiers (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  annual_fee_rands NUMERIC(10, 2) DEFAULT 0,
  order_index   INT DEFAULT 100,
  benefits_summary TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO member_tiers (slug, name, description, annual_fee_rands, order_index, benefits_summary)
VALUES
  ('affiliate', 'Affiliate', 'Free introductory membership for practitioners new to the sector.', 0, 10,
   'Newsletter · event discounts · voice in discipline working groups'),
  ('active', 'Active Practitioner', 'Full member with voting rights and all benefits.', 350, 20,
   'Voting at AGM · standing on council · certificate verification · full resource library · priority event access'),
  ('patron', 'Patron', 'Supporting members and institutions funding the Council.', 5000, 30,
   'All Active benefits · acknowledgment in annual report · stakeholder engagement invite · early-access policy briefings')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
  id                SERIAL PRIMARY KEY,
  auth_user_id      UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  constituency_submission_id INT REFERENCES constituency_submissions(id) ON DELETE SET NULL,
  tier_id           INT REFERENCES member_tiers(id) ON DELETE SET NULL,

  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  organisation      TEXT,
  province          TEXT,
  city              TEXT,
  disciplines       TEXT[] DEFAULT '{}',

  bio               TEXT,
  profile_photo_url TEXT,
  website_url       TEXT,
  linkedin_url      TEXT,
  twitter_handle    TEXT,

  member_number     TEXT UNIQUE,                    -- e.g. CDCC-0001
  status            TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'lapsed')),
  verified          BOOLEAN DEFAULT FALSE,
  verified_at       TIMESTAMPTZ,

  consent_marketing BOOLEAN DEFAULT FALSE,
  consent_directory BOOLEAN DEFAULT TRUE,
  popia_consent_at  TIMESTAMPTZ,

  joined_at         TIMESTAMPTZ DEFAULT NOW(),
  renewal_due       DATE,
  last_login_at     TIMESTAMPTZ,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_auth_user_id ON members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_disciplines ON members USING GIN(disciplines);

-- Auto-generate member_number when INSERT happens without one
CREATE OR REPLACE FUNCTION generate_member_number() RETURNS TRIGGER AS $MNUM$
DECLARE
  next_num INT;
BEGIN
  IF NEW.member_number IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(member_number FROM 'CDCC-(\d+)') AS INT)), 0) + 1
      INTO next_num FROM members;
    NEW.member_number := 'CDCC-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$MNUM$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_member_number ON members;
CREATE TRIGGER trg_generate_member_number
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION generate_member_number();

-- ---------------------------------------------------------------------------
-- member_certificates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_certificates (
  id                SERIAL PRIMARY KEY,
  member_id         INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_id          INT REFERENCES events(id) ON DELETE SET NULL,
  programme_id      INT REFERENCES programmes(id) ON DELETE SET NULL,

  certificate_type  TEXT NOT NULL
    CHECK (certificate_type IN ('event_attendance', 'course_completion', 'credential', 'good_standing', 'other')),
  certificate_code  TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,

  issued_by         TEXT DEFAULT 'Content Development Council',
  issued_at         DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at        DATE,

  pdf_url           TEXT,
  verification_url  TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certs_member ON member_certificates(member_id);
CREATE INDEX IF NOT EXISTS idx_certs_code ON member_certificates(certificate_code);

-- ---------------------------------------------------------------------------
-- member_benefits (catalogue · not per-member)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_benefits (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  tier_required     TEXT DEFAULT 'affiliate'
    CHECK (tier_required IN ('affiliate', 'active', 'patron')),
  category          TEXT,
  icon_name         TEXT,
  link_url          TEXT,
  active            BOOLEAN DEFAULT TRUE,
  order_index       INT DEFAULT 100,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO member_benefits (slug, title, description, tier_required, category, order_index) VALUES
  ('policy-voice', 'Policy voice to Parliament', 'Your submissions are carried by the Council to Portfolio Committee briefings and DSAC engagements.', 'affiliate', 'voice', 10),
  ('skills-workshops', 'Skills programme access', 'Priority places at Council workshops across 9 provinces and the annual Indaba.', 'affiliate', 'skills', 20),
  ('copyright-advocacy', 'Copyright framework advocacy', 'Council policy work covers every format - print, digital, audio, translation, emerging.', 'active', 'protection', 30),
  ('legal-infrastructure', 'Shared legal infrastructure', 'Access to Council-negotiated service agreements and template contracts.', 'active', 'infrastructure', 40),
  ('annual-indaba', 'Annual sector Indaba', 'Your seat at the annual sector-wide convening - 340 delegates, 14 disciplines.', 'affiliate', 'community', 50),
  ('bursary-eligibility', 'Grant & bursary eligibility', 'Council-led grant programmes, training bursaries, and translation commissions.', 'active', 'funding', 60),
  ('certificate-verification', 'Public certificate verification', 'Every event and completion certificate you earn is publicly verifiable via Council URL.', 'affiliate', 'credentials', 70),
  ('sector-report-early', 'Early sector report access', 'See the State of the Publishing Sector report before public release.', 'active', 'intelligence', 80)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- member_resources (downloadable library)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_resources (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT,
  resource_type     TEXT
    CHECK (resource_type IN ('document', 'template', 'video', 'dataset', 'guide', 'other')),
  category          TEXT,
  discipline_tags   TEXT[] DEFAULT '{}',
  tier_required     TEXT DEFAULT 'affiliate'
    CHECK (tier_required IN ('affiliate', 'active', 'patron')),
  file_url          TEXT,
  external_url      TEXT,
  file_size_bytes   BIGINT,
  download_count    INT DEFAULT 0,
  published         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON member_resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_discipline_tags ON member_resources USING GIN(discipline_tags);

-- ---------------------------------------------------------------------------
-- member_resource_downloads (log for analytics)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_resource_downloads (
  id                SERIAL PRIMARY KEY,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,
  resource_id       INT NOT NULL REFERENCES member_resources(id) ON DELETE CASCADE,
  downloaded_at     TIMESTAMPTZ DEFAULT NOW(),
  ip_address        TEXT
);

CREATE INDEX IF NOT EXISTS idx_resource_dl_member ON member_resource_downloads(member_id);
CREATE INDEX IF NOT EXISTS idx_resource_dl_resource ON member_resource_downloads(resource_id);

-- ---------------------------------------------------------------------------
-- Row-level security: members see only their own row
-- ---------------------------------------------------------------------------
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS members_select_own ON members;
CREATE POLICY members_select_own ON members
  FOR SELECT USING (auth.uid() = auth_user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS members_update_own ON members;
CREATE POLICY members_update_own ON members
  FOR UPDATE USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Anyone can insert (self-registration); admin creates via service role
DROP POLICY IF EXISTS members_insert_self ON members;
CREATE POLICY members_insert_self ON members
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id OR auth_user_id IS NULL);

ALTER TABLE member_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS certs_select_own ON member_certificates;
CREATE POLICY certs_select_own ON member_certificates
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- member_benefits and member_resources are publicly readable (the portal shows them to logged-in members)
ALTER TABLE member_benefits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS benefits_read ON member_benefits;
CREATE POLICY benefits_read ON member_benefits FOR SELECT USING (TRUE);

ALTER TABLE member_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS resources_read ON member_resources;
CREATE POLICY resources_read ON member_resources FOR SELECT USING (published = TRUE);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $TOUCH$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$TOUCH$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_members_touch ON members;
CREATE TRIGGER trg_members_touch BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_resources_touch ON member_resources;
CREATE TRIGGER trg_resources_touch BEFORE UPDATE ON member_resources
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
