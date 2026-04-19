-- ============================================================================
-- 008_council_modules.sql
--
-- The six Council-specific modules that turn the platform from a generic
-- NPC admin into a full Books & Publishing sector body:
--
--   1. Sector data collection   (annual discipline submissions)
--   2. Policy submissions       (working-group positions to Parliament)
--   3. Grant opportunities + applications
--   4. Tender pipeline          (eTenders feed · bid tracking · CIDB contracts)
--   5. Discipline working groups (14 sub-councils · members · posts · votes)
--   6. Copyright register       (lightweight IP metadata per work)
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. SECTOR DATA COLLECTION
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sector_data_periods (
  id                SERIAL PRIMARY KEY,
  year              INT NOT NULL,
  period_type       TEXT DEFAULT 'annual' CHECK (period_type IN ('annual', 'quarterly')),
  period_label      TEXT NOT NULL,           -- e.g. 'FY2026' or 'Q1 2026'
  open_date         DATE NOT NULL,
  close_date        DATE NOT NULL,
  status            TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed', 'archived')),
  public_report_url TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, period_type, period_label)
);

CREATE TABLE IF NOT EXISTS sector_data_submissions (
  id                SERIAL PRIMARY KEY,
  period_id         INT NOT NULL REFERENCES sector_data_periods(id) ON DELETE CASCADE,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,
  discipline        TEXT NOT NULL,
  organisation      TEXT,

  -- Core sector metrics (publishing-specific)
  titles_published  INT,
  copies_sold       INT,
  revenue_rands     NUMERIC(14, 2),
  employees_fte     INT,
  freelancers_count INT,
  export_revenue_rands NUMERIC(14, 2),
  translations_count INT,
  digital_titles_count INT,
  audio_titles_count INT,
  provinces_active  TEXT[],

  -- Qualitative + open-text
  growth_notes      TEXT,
  challenges_notes  TEXT,
  policy_priorities TEXT,

  -- Flexible JSON bucket for discipline-specific questions
  discipline_data   JSONB DEFAULT '{}'::JSONB,

  status            TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'verified', 'rejected')),
  submitted_at      TIMESTAMPTZ,
  verified_at       TIMESTAMPTZ,
  verified_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sds_period ON sector_data_submissions(period_id);
CREATE INDEX IF NOT EXISTS idx_sds_member ON sector_data_submissions(member_id);
CREATE INDEX IF NOT EXISTS idx_sds_discipline ON sector_data_submissions(discipline);
CREATE INDEX IF NOT EXISTS idx_sds_status ON sector_data_submissions(status);


-- ---------------------------------------------------------------------------
-- 2. POLICY SUBMISSIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_submissions (
  id                SERIAL PRIMARY KEY,
  working_group_id  INT,                        -- FK added after working_groups exists
  author_member_id  INT REFERENCES members(id) ON DELETE SET NULL,

  title             TEXT NOT NULL,
  subject           TEXT,                        -- e.g. 'Copyright Amendment Bill'
  target_body       TEXT,                        -- 'Portfolio Committee on Trade & Industry'
  reference_code    TEXT UNIQUE,                 -- e.g. CDCC-POL-2026-001
  executive_summary TEXT,
  full_text         TEXT,

  status            TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'approved', 'submitted', 'responded', 'withdrawn')),
  submission_date   DATE,
  response_received_at DATE,
  response_notes    TEXT,
  supporting_docs   JSONB DEFAULT '[]'::JSONB,

  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_status ON policy_submissions(status);
CREATE INDEX IF NOT EXISTS idx_policy_subject ON policy_submissions(subject);


-- ---------------------------------------------------------------------------
-- 3. GRANTS (opportunities + applications + decisions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grant_opportunities (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  slug              TEXT UNIQUE,
  issuer            TEXT,                        -- 'NAC', 'DSAC', 'Council', etc.
  description       TEXT,
  eligibility       TEXT,
  amount_rands      NUMERIC(12, 2),
  discipline_tags   TEXT[] DEFAULT '{}',
  province_restriction TEXT[],
  opens_at          DATE,
  closes_at         DATE,
  decision_date     DATE,
  guidelines_url    TEXT,
  application_form_url TEXT,
  status            TEXT DEFAULT 'open'
    CHECK (status IN ('draft', 'open', 'closing', 'closed', 'awarded', 'archived')),
  total_pool_rands  NUMERIC(12, 2),
  awardees_count    INT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grants_status ON grant_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_grants_tags ON grant_opportunities USING GIN(discipline_tags);

CREATE TABLE IF NOT EXISTS grant_applications (
  id                SERIAL PRIMARY KEY,
  opportunity_id    INT NOT NULL REFERENCES grant_opportunities(id) ON DELETE CASCADE,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,

  applicant_name    TEXT NOT NULL,
  applicant_email   TEXT NOT NULL,
  applicant_phone   TEXT,
  organisation      TEXT,

  project_title     TEXT NOT NULL,
  project_description TEXT,
  amount_requested_rands NUMERIC(12, 2),
  disciplines       TEXT[] DEFAULT '{}',
  supporting_docs   JSONB DEFAULT '[]'::JSONB,

  status            TEXT DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'under_review', 'shortlisted', 'awarded', 'declined', 'withdrawn')),
  review_score      NUMERIC(5, 2),
  review_notes      TEXT,
  reviewer_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_awarded_rands NUMERIC(12, 2),
  decision_at       TIMESTAMPTZ,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grant_apps_opp ON grant_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_grant_apps_member ON grant_applications(member_id);
CREATE INDEX IF NOT EXISTS idx_grant_apps_status ON grant_applications(status);


-- ---------------------------------------------------------------------------
-- 4. TENDER PIPELINE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenders (
  id                SERIAL PRIMARY KEY,
  source            TEXT
    CHECK (source IN ('etenders', 'leads2business', 'construction_monitor', 'national_treasury', 'provincial', 'referral', 'direct')),
  external_ref      TEXT,                        -- eTenders reference number
  title             TEXT NOT NULL,
  issuer            TEXT,
  description       TEXT,
  category          TEXT,
  value_rands       NUMERIC(14, 2),
  cidb_grade_required TEXT,
  bbbee_level_required INT,
  province          TEXT,

  discovered_at     DATE,
  closes_at         TIMESTAMPTZ,
  award_date        DATE,

  status            TEXT DEFAULT 'discovered'
    CHECK (status IN ('discovered', 'reviewing', 'bid_decided', 'bidding', 'submitted', 'awarded_self', 'awarded_competitor', 'lost', 'withdrawn')),
  relevance_score   NUMERIC(3, 1),               -- 0.0 - 10.0
  fit_notes         TEXT,
  documents         JSONB DEFAULT '[]'::JSONB,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_closes ON tenders(closes_at);

CREATE TABLE IF NOT EXISTS tender_bids (
  id                SERIAL PRIMARY KEY,
  tender_id         INT NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  decision          TEXT DEFAULT 'pending'
    CHECK (decision IN ('pending', 'bid', 'no_bid')),
  decision_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_at       TIMESTAMPTZ,
  decision_notes    TEXT,

  bid_amount_rands  NUMERIC(14, 2),
  submitted_at      TIMESTAMPTZ,
  proof_of_submission_url TEXT,

  outcome           TEXT
    CHECK (outcome IN ('pending', 'awarded', 'unsuccessful')),
  award_notes       TEXT,
  cidb_registered   BOOLEAN DEFAULT FALSE,
  cidb_registered_at DATE,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tender_bids_tender ON tender_bids(tender_id);


-- ---------------------------------------------------------------------------
-- 5. DISCIPLINE WORKING GROUPS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS working_groups (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  discipline        TEXT NOT NULL,                -- matches CDCC_DISCIPLINES in lib/utils.ts
  name              TEXT NOT NULL,
  description       TEXT,
  convenor_member_id INT REFERENCES members(id) ON DELETE SET NULL,
  meeting_cadence   TEXT DEFAULT 'monthly',
  meeting_day       TEXT,
  joinable          BOOLEAN DEFAULT TRUE,
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Seed working groups for the 14 disciplines
INSERT INTO working_groups (slug, discipline, name, description, meeting_cadence)
VALUES
  ('authors',         'Author',          'Authors Working Group',        'For South African authors across genres, languages, and formats.', 'monthly'),
  ('editors',         'Editor',          'Editors Working Group',        'Structural, copy, and developmental editors.', 'monthly'),
  ('translators',     'Translator',      'Translators Working Group',    'Literary, technical, and commercial translators across 11 languages.', 'monthly'),
  ('literary-critics','Literary critic', 'Literary Critics Working Group','Reviewers, academics, and literary journalism.', 'quarterly'),
  ('poets',           'Poet',            'Poets Working Group',          'Published poets working across oral and written traditions.', 'monthly'),
  ('illustrators',    'Illustrator',     'Illustrators Working Group',   'Book illustrators, children''s and adult.', 'monthly'),
  ('book-designers',  'Book designer',   'Book Designers Working Group', 'Cover and interior book design.', 'monthly'),
  ('typesetters',     'Typesetter',      'Typesetters Working Group',    'Specialist typesetters and compositors.', 'quarterly'),
  ('publishers',      'Publisher',       'Publishers Working Group',     'Trade, educational, academic, and independent publishers.', 'monthly'),
  ('printers',        'Printer',         'Printers Working Group',       'Commercial book printers and POD services.', 'quarterly'),
  ('booksellers',     'Bookseller',      'Booksellers Working Group',    'Independent and chain booksellers.', 'monthly'),
  ('librarians',      'Librarian',       'Librarians Working Group',     'Public, academic, and school librarians.', 'monthly'),
  ('distributors',    'Distributor',     'Distributors Working Group',   'Book distribution and wholesale.', 'quarterly'),
  ('literary-agents', 'Literary agent',  'Literary Agents Working Group','Domestic and international literary agents.', 'quarterly')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS working_group_members (
  id                SERIAL PRIMARY KEY,
  working_group_id  INT NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  member_id         INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role              TEXT DEFAULT 'member'
    CHECK (role IN ('member', 'convenor', 'scribe', 'observer')),
  joined_at         TIMESTAMPTZ DEFAULT NOW(),
  left_at           TIMESTAMPTZ,
  UNIQUE(working_group_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_wg_members_member ON working_group_members(member_id);

CREATE TABLE IF NOT EXISTS working_group_posts (
  id                SERIAL PRIMARY KEY,
  working_group_id  INT NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  author_member_id  INT REFERENCES members(id) ON DELETE SET NULL,
  kind              TEXT DEFAULT 'discussion'
    CHECK (kind IN ('discussion', 'decision', 'announcement', 'meeting_minutes', 'resource')),
  title             TEXT,
  body              TEXT,
  attachments       JSONB DEFAULT '[]'::JSONB,
  pinned            BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wg_posts_group ON working_group_posts(working_group_id);

CREATE TABLE IF NOT EXISTS working_group_votes (
  id                SERIAL PRIMARY KEY,
  working_group_id  INT NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  motion            TEXT NOT NULL,
  options           JSONB DEFAULT '["for","against","abstain"]'::JSONB,
  opens_at          TIMESTAMPTZ DEFAULT NOW(),
  closes_at         TIMESTAMPTZ,
  status            TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  result_summary    JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS working_group_ballots (
  id                SERIAL PRIMARY KEY,
  vote_id           INT NOT NULL REFERENCES working_group_votes(id) ON DELETE CASCADE,
  member_id         INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  choice            TEXT NOT NULL,
  comment           TEXT,
  cast_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vote_id, member_id)
);

-- Add the FK from policy_submissions.working_group_id now that the table exists
ALTER TABLE policy_submissions
  DROP CONSTRAINT IF EXISTS fk_policy_working_group;
ALTER TABLE policy_submissions
  ADD CONSTRAINT fk_policy_working_group
  FOREIGN KEY (working_group_id) REFERENCES working_groups(id) ON DELETE SET NULL;


-- ---------------------------------------------------------------------------
-- 6. COPYRIGHT REGISTER
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS copyright_register (
  id                SERIAL PRIMARY KEY,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,

  title             TEXT NOT NULL,
  subtitle          TEXT,
  work_type         TEXT NOT NULL
    CHECK (work_type IN ('book', 'novel', 'anthology', 'children_book', 'poetry', 'academic', 'translation', 'illustration', 'cover_design', 'typeset_layout', 'audio_book', 'digital_first', 'other')),
  format            TEXT[],                      -- ['print','ebook','audio','translation']
  language          TEXT DEFAULT 'en',
  isbn              TEXT,
  ismn              TEXT,

  author_name       TEXT NOT NULL,
  co_authors        TEXT[],
  illustrator_name  TEXT,
  translator_name   TEXT,
  publisher         TEXT,
  first_published_at DATE,
  country_of_origin TEXT DEFAULT 'ZA',

  rights_held_by    TEXT,                        -- "author" | "publisher" | split
  rights_breakdown  JSONB DEFAULT '{}'::JSONB,   -- free-form splits across primary/derivative/translation/audio/film
  licensing_terms   TEXT,

  description       TEXT,
  cover_image_url   TEXT,
  sample_url        TEXT,

  public            BOOLEAN DEFAULT FALSE,       -- show in public register
  verified          BOOLEAN DEFAULT FALSE,
  verification_code TEXT UNIQUE,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copyright_member ON copyright_register(member_id);
CREATE INDEX IF NOT EXISTS idx_copyright_type ON copyright_register(work_type);
CREATE INDEX IF NOT EXISTS idx_copyright_isbn ON copyright_register(isbn);
CREATE INDEX IF NOT EXISTS idx_copyright_public ON copyright_register(public) WHERE public = TRUE;


-- ---------------------------------------------------------------------------
-- Row-level security (minimal - admin via service role, member self-access)
-- ---------------------------------------------------------------------------
ALTER TABLE sector_data_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sds_own ON sector_data_submissions;
CREATE POLICY sds_own ON sector_data_submissions
  FOR ALL USING (
    member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );

ALTER TABLE grant_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grants_read ON grant_opportunities;
CREATE POLICY grants_read ON grant_opportunities FOR SELECT USING (status IN ('open','closing','awarded'));

ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grant_apps_own ON grant_applications;
CREATE POLICY grant_apps_own ON grant_applications
  FOR ALL USING (
    member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );

ALTER TABLE working_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wg_read ON working_groups;
CREATE POLICY wg_read ON working_groups FOR SELECT USING (active = TRUE);

ALTER TABLE working_group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wgm_read ON working_group_members;
CREATE POLICY wgm_read ON working_group_members FOR SELECT USING (
  member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
  OR auth.jwt() ->> 'role' = 'service_role'
);

ALTER TABLE copyright_register ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS copyright_own_or_public ON copyright_register;
CREATE POLICY copyright_own_or_public ON copyright_register
  FOR SELECT USING (
    public = TRUE
    OR member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );
DROP POLICY IF EXISTS copyright_own_write ON copyright_register;
CREATE POLICY copyright_own_write ON copyright_register
  FOR INSERT WITH CHECK (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sds_touch ON sector_data_submissions;
CREATE TRIGGER trg_sds_touch BEFORE UPDATE ON sector_data_submissions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_policy_touch ON policy_submissions;
CREATE TRIGGER trg_policy_touch BEFORE UPDATE ON policy_submissions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_grants_touch ON grant_opportunities;
CREATE TRIGGER trg_grants_touch BEFORE UPDATE ON grant_opportunities
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_grant_apps_touch ON grant_applications;
CREATE TRIGGER trg_grant_apps_touch BEFORE UPDATE ON grant_applications
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_tenders_touch ON tenders;
CREATE TRIGGER trg_tenders_touch BEFORE UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_tender_bids_touch ON tender_bids;
CREATE TRIGGER trg_tender_bids_touch BEFORE UPDATE ON tender_bids
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_wg_posts_touch ON working_group_posts;
CREATE TRIGGER trg_wg_posts_touch BEFORE UPDATE ON working_group_posts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_copyright_touch ON copyright_register;
CREATE TRIGGER trg_copyright_touch BEFORE UPDATE ON copyright_register
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
