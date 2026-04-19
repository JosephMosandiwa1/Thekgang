-- ============================================================================
-- 011_sector_depth.sql
--
-- Top 5 research-driven additions that turn the platform into proper sector
-- infrastructure:
--   1. ONIX Metadata + book supply-chain
--   2. Public policy consultations + MP engagement
--   3. i18n / translations layer
--   4. Sector health dashboard (materialised views + grant outcomes)
--   5. Board pack + AGM voting
-- Plus: reading challenges, book clubs, contracts library, banned books
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. ONIX METADATA + SUPPLY CHAIN
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onix_records (
  id                SERIAL PRIMARY KEY,
  book_id           INT REFERENCES books(id) ON DELETE CASCADE,
  isbn              TEXT NOT NULL,
  onix_version      TEXT DEFAULT '3.0',

  -- Core ONIX fields (simplified subset)
  product_form      TEXT,                           -- ONIX codelist 150: BA = paperback, EA = ebook...
  language_code     TEXT DEFAULT 'eng',             -- ISO 639-2/B
  country_code      TEXT DEFAULT 'ZA',
  publication_status TEXT,                          -- ONIX codelist 64
  imprint           TEXT,
  audience_age_min  INT,
  audience_age_max  INT,

  thema_subject_codes TEXT[] DEFAULT '{}',          -- Thema subject classification
  bic_codes         TEXT[] DEFAULT '{}',            -- BIC (legacy)
  bisac_codes       TEXT[] DEFAULT '{}',            -- BISAC (US)
  keywords          TEXT[] DEFAULT '{}',

  rights_territory  TEXT[] DEFAULT '{}',            -- e.g. ['ZA','NA','BW']
  raw_xml           TEXT,                           -- optional — full ONIX XML deposit
  contributors_json JSONB,                          -- authors + roles

  submitted_by_member_id INT REFERENCES members(id) ON DELETE SET NULL,
  submitted_by_org_id INT REFERENCES organisations(id) ON DELETE SET NULL,
  verified          BOOLEAN DEFAULT FALSE,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(isbn)
);
CREATE INDEX IF NOT EXISTS idx_onix_isbn ON onix_records(isbn);
CREATE INDEX IF NOT EXISTS idx_onix_thema ON onix_records USING GIN(thema_subject_codes);

CREATE TABLE IF NOT EXISTS legal_deposit_status (
  id                SERIAL PRIMARY KEY,
  book_id           INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  depositary        TEXT NOT NULL
    CHECK (depositary IN ('national_library_ct', 'national_library_pretoria', 'parliament', 'bloemfontein', 'mafikeng', 'other')),
  deposit_status    TEXT DEFAULT 'pending'
    CHECK (deposit_status IN ('pending', 'submitted', 'acknowledged', 'exempt')),
  submitted_at      DATE,
  acknowledged_at   DATE,
  reference_number  TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, depositary)
);


-- ---------------------------------------------------------------------------
-- 2. PUBLIC POLICY CONSULTATIONS + MP ENGAGEMENT
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultations (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  subject           TEXT,                           -- 'Copyright Amendment Bill'
  body              TEXT,                           -- full explainer
  bill_reference    TEXT,
  opens_at          TIMESTAMPTZ,
  closes_at         TIMESTAMPTZ,
  status            TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed', 'responded', 'archived')),

  response_count    INT DEFAULT 0,
  sign_on_count     INT DEFAULT 0,

  summary_published BOOLEAN DEFAULT FALSE,
  council_position  TEXT,
  council_submission_url TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consult_status ON consultations(status);

CREATE TABLE IF NOT EXISTS consultation_responses (
  id                SERIAL PRIMARY KEY,
  consultation_id   INT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,
  respondent_name   TEXT NOT NULL,
  respondent_email  TEXT NOT NULL,
  organisation      TEXT,
  position_stance   TEXT CHECK (position_stance IN ('support', 'oppose', 'support_with_amendments', 'neutral')),
  response_text     TEXT,
  public            BOOLEAN DEFAULT FALSE,          -- publish respondent name in sector summary
  signed_on         BOOLEAN DEFAULT FALSE,          -- agreed to Council position as a signatory
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cresp_consult ON consultation_responses(consultation_id);

CREATE TABLE IF NOT EXISTS mp_engagements (
  id                SERIAL PRIMARY KEY,
  mp_name           TEXT NOT NULL,
  party             TEXT,
  portfolio_committee TEXT,
  province          TEXT,
  contact_email     TEXT,
  engagement_type   TEXT
    CHECK (engagement_type IN ('meeting', 'briefing', 'submission', 'correspondence', 'public_hearing')),
  subject           TEXT,
  topics            TEXT[] DEFAULT '{}',
  engagement_date   DATE,
  outcome_summary   TEXT,
  position_tracked  TEXT CHECK (position_tracked IN ('supportive', 'neutral', 'opposed', 'unknown')),
  council_rep       TEXT,
  policy_submission_id INT REFERENCES policy_submissions(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mpeng_date ON mp_engagements(engagement_date);


-- ---------------------------------------------------------------------------
-- 3. i18n / TRANSLATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS translations (
  id                SERIAL PRIMARY KEY,
  key               TEXT NOT NULL,                  -- dot-notation: 'hero.title'
  lang              TEXT NOT NULL,                  -- ISO 639-1: en, zu, xh, af, st, tn, ve, ts, ss, nr, nso
  value             TEXT NOT NULL,
  domain            TEXT DEFAULT 'general',         -- general / forms / emails / admin
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, lang, domain)
);
CREATE INDEX IF NOT EXISTS idx_i18n_key ON translations(key);
CREATE INDEX IF NOT EXISTS idx_i18n_lang ON translations(lang);


-- ---------------------------------------------------------------------------
-- 4. SECTOR HEALTH MATERIALISED VIEWS + GRANT OUTCOMES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grant_outcomes (
  id                SERIAL PRIMARY KEY,
  application_id    INT NOT NULL REFERENCES grant_applications(id) ON DELETE CASCADE,
  outcome_type      TEXT
    CHECK (outcome_type IN ('book_published', 'event_delivered', 'training_completed', 'milestone_reached', 'final_report', 'jobs_created')),
  outcome_date      DATE,
  quantitative      JSONB DEFAULT '{}'::JSONB,      -- {'books': 3, 'attendees': 120, 'jobs_created': 2}
  narrative         TEXT,
  evidence_url      TEXT,
  verified          BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Lightweight aggregate view (refreshed on demand)
CREATE OR REPLACE VIEW sector_health_snapshot AS
SELECT
  (SELECT COUNT(*) FROM members WHERE status = 'active') AS active_members,
  (SELECT COUNT(*) FROM members WHERE status = 'active' AND verified = true) AS verified_members,
  (SELECT COUNT(*) FROM organisations WHERE public = true) AS public_organisations,
  (SELECT COUNT(*) FROM books WHERE public = true) AS books_in_catalogue,
  (SELECT COUNT(*) FROM events WHERE status = 'published') AS published_events,
  (SELECT COUNT(*) FROM grant_applications WHERE status = 'awarded') AS grants_awarded,
  (SELECT COALESCE(SUM(amount_awarded_rands),0) FROM grant_applications WHERE status = 'awarded') AS total_grants_awarded_rands,
  (SELECT COUNT(*) FROM policy_submissions WHERE status IN ('submitted','responded')) AS policy_submissions_filed,
  (SELECT COUNT(*) FROM copyright_register WHERE public = true) AS copyright_register_public,
  (SELECT COUNT(*) FROM jobs WHERE status = 'open' AND approved = true) AS open_jobs,
  (SELECT COUNT(*) FROM working_groups WHERE active = true) AS active_working_groups,
  (SELECT COUNT(DISTINCT member_id) FROM working_group_members WHERE left_at IS NULL) AS wg_membership_count,
  NOW() AS snapshot_at;


-- ---------------------------------------------------------------------------
-- 5. BOARD PACK + AGM VOTING
-- ---------------------------------------------------------------------------
-- board_meetings already exists in corporate_os migration
CREATE TABLE IF NOT EXISTS board_papers (
  id                SERIAL PRIMARY KEY,
  meeting_id        INT REFERENCES board_meetings(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  paper_number      TEXT,                           -- e.g. 'BP-2026-04-03'
  section           TEXT,                           -- 'finance', 'strategy', 'governance', 'decisions'
  summary           TEXT,
  body              TEXT,
  attachments       JSONB DEFAULT '[]'::JSONB,
  generated         BOOLEAN DEFAULT FALSE,          -- auto-generated from system data vs. uploaded
  presented_by      TEXT,
  order_index       INT DEFAULT 100,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bpapers_meeting ON board_papers(meeting_id);

CREATE TABLE IF NOT EXISTS agm_events (
  id                SERIAL PRIMARY KEY,
  year              INT NOT NULL,
  meeting_date      TIMESTAMPTZ,
  venue             TEXT,
  virtual_link      TEXT,
  quorum_required   INT DEFAULT 15,                 -- % of members
  quorum_met        BOOLEAN,
  status            TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'open', 'voting', 'closed', 'minutes_ready')),
  minutes_url       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year)
);

CREATE TABLE IF NOT EXISTS agm_resolutions (
  id                SERIAL PRIMARY KEY,
  agm_id            INT NOT NULL REFERENCES agm_events(id) ON DELETE CASCADE,
  resolution_number TEXT,                           -- 'Res 1 of 2026'
  title             TEXT NOT NULL,
  motion            TEXT NOT NULL,
  background        TEXT,
  proposer          TEXT,
  seconder          TEXT,
  passed            BOOLEAN,
  votes_for         INT DEFAULT 0,
  votes_against     INT DEFAULT 0,
  votes_abstain     INT DEFAULT 0,
  order_index       INT DEFAULT 100,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agm_ballots (
  id                SERIAL PRIMARY KEY,
  resolution_id     INT NOT NULL REFERENCES agm_resolutions(id) ON DELETE CASCADE,
  member_id         INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  choice            TEXT NOT NULL CHECK (choice IN ('for', 'against', 'abstain')),
  proxy_for         INT REFERENCES members(id) ON DELETE SET NULL,
  cast_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resolution_id, member_id)
);


-- ---------------------------------------------------------------------------
-- 6. READING CHALLENGES + BOOK CLUBS  (public engagement)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_challenges (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  year              INT,
  theme             TEXT,
  target_books      INT DEFAULT 12,
  category_prompts  JSONB DEFAULT '[]'::JSONB,      -- ['a book by a poet', 'a translation into your mother tongue', ...]
  starts_at         DATE,
  ends_at           DATE,
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_logs (
  id                SERIAL PRIMARY KEY,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,
  participant_email TEXT,                           -- for non-member participation
  participant_name  TEXT,
  challenge_id      INT REFERENCES reading_challenges(id) ON DELETE SET NULL,
  book_id           INT REFERENCES books(id) ON DELETE SET NULL,
  book_title        TEXT,                           -- for books not in catalogue
  author            TEXT,
  language          TEXT,
  category_prompt   TEXT,
  completed_at      DATE DEFAULT CURRENT_DATE,
  notes             TEXT,
  rating            INT CHECK (rating BETWEEN 1 AND 5),
  public            BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rlog_member ON reading_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_rlog_challenge ON reading_logs(challenge_id);

CREATE TABLE IF NOT EXISTS book_clubs (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  city              TEXT,
  province          TEXT,
  meeting_cadence   TEXT,
  language          TEXT,
  contact_email     TEXT,
  member_count      INT DEFAULT 0,
  public            BOOLEAN DEFAULT TRUE,
  moderator_member_id INT REFERENCES members(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 7. CONTRACTS LIBRARY (member legal templates)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contract_templates (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  contract_type     TEXT
    CHECK (contract_type IN ('publishing', 'translation', 'illustration', 'ghostwriting', 'editorial', 'nda', 'model_release', 'photography', 'audiobook', 'film_option', 'other')),
  description       TEXT,
  body_markdown     TEXT NOT NULL,
  variables         JSONB DEFAULT '[]'::JSONB,       -- [{name:'AUTHOR_NAME', label:'Author full name', required:true}]
  disciplines       TEXT[] DEFAULT '{}',
  jurisdiction      TEXT DEFAULT 'ZA',
  last_reviewed     DATE,
  reviewed_by       TEXT,
  tier_required     TEXT DEFAULT 'affiliate',
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 8. BANNED / CHALLENGED BOOKS TRACKER
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banned_books (
  id                SERIAL PRIMARY KEY,
  book_id           INT REFERENCES books(id) ON DELETE SET NULL,
  book_title        TEXT NOT NULL,
  author            TEXT,
  isbn              TEXT,
  challenge_type    TEXT
    CHECK (challenge_type IN ('ban', 'restriction', 'removal', 'challenge', 'reinstated')),
  institution       TEXT,                           -- 'Gauteng school libraries', 'SAPS import'
  location          TEXT,
  reason_stated     TEXT,
  date_of_event     DATE,
  council_response  TEXT,
  council_response_url TEXT,
  public            BOOLEAN DEFAULT TRUE,
  source_url        TEXT,                           -- news article etc.
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_onix_touch ON onix_records;
CREATE TRIGGER trg_onix_touch BEFORE UPDATE ON onix_records FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_consult_touch ON consultations;
CREATE TRIGGER trg_consult_touch BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_contract_tpl_touch ON contract_templates;
CREATE TRIGGER trg_contract_tpl_touch BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_banned_touch ON banned_books;
CREATE TRIGGER trg_banned_touch BEFORE UPDATE ON banned_books FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ---------------------------------------------------------------------------
-- RLS: public-facing ones
-- ---------------------------------------------------------------------------
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS consult_read ON consultations;
CREATE POLICY consult_read ON consultations FOR SELECT USING (status IN ('open', 'closed', 'responded') OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE consultation_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cresp_public_read ON consultation_responses;
CREATE POLICY cresp_public_read ON consultation_responses FOR SELECT USING (public = TRUE);

ALTER TABLE reading_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rchal_read ON reading_challenges;
CREATE POLICY rchal_read ON reading_challenges FOR SELECT USING (active = TRUE);

ALTER TABLE book_clubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bclub_read ON book_clubs;
CREATE POLICY bclub_read ON book_clubs FOR SELECT USING (public = TRUE);

ALTER TABLE banned_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS banned_read ON banned_books;
CREATE POLICY banned_read ON banned_books FOR SELECT USING (public = TRUE);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ctpl_read ON contract_templates;
CREATE POLICY ctpl_read ON contract_templates FOR SELECT USING (active = TRUE);

ALTER TABLE agm_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agm_read ON agm_events;
CREATE POLICY agm_read ON agm_events FOR SELECT USING (TRUE);

ALTER TABLE agm_resolutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agmres_read ON agm_resolutions;
CREATE POLICY agmres_read ON agm_resolutions FOR SELECT USING (TRUE);

ALTER TABLE agm_ballots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agmbal_own ON agm_ballots;
CREATE POLICY agmbal_own ON agm_ballots FOR ALL USING (
  member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
  OR auth.jwt() ->> 'role' = 'service_role'
);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS i18n_read ON translations;
CREATE POLICY i18n_read ON translations FOR SELECT USING (TRUE);
