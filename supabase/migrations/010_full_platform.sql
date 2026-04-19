-- ============================================================================
-- 010_full_platform.sql
--
-- The "full functioning system" layer:
--   · Newsletters (subscribers + campaigns + sends)
--   · Ticket sales (purchases + payments — uses event_ticket_types)
--   · Organisations register (publishers, booksellers, distributors as entities)
--   · Contact inbox
--   · Press room (releases + media kit + spokespeople)
--   · Book catalog
--   · Literary awards
--   · Job board
--   · Mentorship
--   · Volunteers
--   · Event check-ins (expanded)
-- ============================================================================


-- ---------------------------------------------------------------------------
-- NEWSLETTERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_lists (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  double_opt_in     BOOLEAN DEFAULT TRUE,
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO newsletter_lists (slug, name, description) VALUES
  ('general',   'Council bulletin',            'Monthly bulletin on Council activity, policy, and sector news.'),
  ('events',    'Events announcements',        'New events, Indabas, workshops, and training opportunities.'),
  ('grants',    'Grants and bursaries',        'Funding opportunities from the Council and partners.'),
  ('policy',    'Policy and advocacy',         'Submissions, consultations, and sector policy updates.')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id                SERIAL PRIMARY KEY,
  email             TEXT NOT NULL,
  full_name         TEXT,
  phone             TEXT,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,
  disciplines       TEXT[] DEFAULT '{}',
  province          TEXT,
  source            TEXT,                     -- 'join' / 'event' / 'footer_form' / 'import'
  verified          BOOLEAN DEFAULT FALSE,    -- double-opt-in flag
  verified_at       TIMESTAMPTZ,
  verify_token      TEXT UNIQUE,
  unsubscribed      BOOLEAN DEFAULT FALSE,
  unsubscribed_at   TIMESTAMPTZ,
  unsub_token       TEXT UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_nsubs_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_nsubs_member ON newsletter_subscribers(member_id);

CREATE TABLE IF NOT EXISTS newsletter_list_subscribers (
  list_id           INT NOT NULL REFERENCES newsletter_lists(id) ON DELETE CASCADE,
  subscriber_id     INT NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, subscriber_id)
);

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id                SERIAL PRIMARY KEY,
  list_id           INT REFERENCES newsletter_lists(id) ON DELETE SET NULL,
  subject           TEXT NOT NULL,
  preheader         TEXT,
  html_body         TEXT NOT NULL,
  text_body         TEXT,
  from_name         TEXT DEFAULT 'CDCC',
  from_email        TEXT DEFAULT 'hello@cdcc.org.za',
  status            TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at      TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,
  recipient_count   INT DEFAULT 0,
  open_count        INT DEFAULT 0,
  click_count       INT DEFAULT 0,
  bounce_count      INT DEFAULT 0,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_sends (
  id                SERIAL PRIMARY KEY,
  campaign_id       INT NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id     INT NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  status            TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at           TIMESTAMPTZ,
  opened_at         TIMESTAMPTZ,
  first_click_at    TIMESTAMPTZ,
  resend_message_id TEXT,
  error             TEXT,
  UNIQUE(campaign_id, subscriber_id)
);
CREATE INDEX IF NOT EXISTS idx_nsends_status ON newsletter_sends(status);


-- ---------------------------------------------------------------------------
-- TICKET SALES (event_ticket_types already exists from migration 004)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_ticket_purchases (
  id                SERIAL PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id    INT REFERENCES event_ticket_types(id) ON DELETE SET NULL,
  registration_id   INT REFERENCES event_registrations(id) ON DELETE SET NULL,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,

  buyer_name        TEXT NOT NULL,
  buyer_email       TEXT NOT NULL,
  buyer_phone       TEXT,

  quantity          INT DEFAULT 1,
  amount_rands      NUMERIC(10, 2) NOT NULL,

  status            TEXT DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'paid', 'refunded', 'cancelled', 'failed')),

  paystack_reference TEXT UNIQUE,
  paystack_transaction_id TEXT,
  paid_at           TIMESTAMPTZ,
  raw_response      JSONB,

  invoice_number    TEXT UNIQUE,
  promo_code        TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etp_event ON event_ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_etp_status ON event_ticket_purchases(status);
CREATE INDEX IF NOT EXISTS idx_etp_ref ON event_ticket_purchases(paystack_reference);


-- ---------------------------------------------------------------------------
-- ORGANISATIONS REGISTER (publishing entities, distinct from individual members)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organisations (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE,
  name              TEXT NOT NULL,
  legal_name        TEXT,
  org_type          TEXT
    CHECK (org_type IN ('publisher', 'imprint', 'bookseller', 'distributor', 'printer', 'design_studio', 'literary_agency', 'press', 'library', 'academic', 'association', 'other')),
  description       TEXT,

  website_url       TEXT,
  email             TEXT,
  phone             TEXT,
  address           TEXT,
  city              TEXT,
  province          TEXT,
  country           TEXT DEFAULT 'ZA',

  logo_url          TEXT,
  banner_url        TEXT,
  year_founded      INT,
  employee_count    TEXT,
  disciplines       TEXT[] DEFAULT '{}',
  languages_active  TEXT[] DEFAULT '{}',

  cipc_number       TEXT,
  vat_number        TEXT,
  bbbee_level       INT,
  cidb_grade        TEXT,

  primary_contact_member_id INT REFERENCES members(id) ON DELETE SET NULL,
  is_member         BOOLEAN DEFAULT FALSE,
  member_tier_id    INT REFERENCES member_tiers(id) ON DELETE SET NULL,
  public            BOOLEAN DEFAULT TRUE,
  verified          BOOLEAN DEFAULT FALSE,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orgs_type ON organisations(org_type);
CREATE INDEX IF NOT EXISTS idx_orgs_disciplines ON organisations USING GIN(disciplines);
CREATE INDEX IF NOT EXISTS idx_orgs_public ON organisations(public) WHERE public = TRUE;


-- ---------------------------------------------------------------------------
-- CONTACT INBOX  (website contact form + enquiries)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_submissions (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  subject           TEXT,
  message           TEXT NOT NULL,
  topic             TEXT,                     -- 'general', 'membership', 'press', 'policy', 'funding', 'complaints'
  source_url        TEXT,

  status            TEXT DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'responded', 'closed', 'spam')),
  assigned_to       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  response_notes    TEXT,
  responded_at      TIMESTAMPTZ,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_topic ON contact_submissions(topic);


-- ---------------------------------------------------------------------------
-- PRESS ROOM
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS press_releases (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  dateline          TEXT,
  summary           TEXT,
  body              TEXT,
  topic             TEXT,
  released_at       TIMESTAMPTZ,
  embargoed_until   TIMESTAMPTZ,
  press_kit_url     TEXT,
  spokesperson_id   INT,                      -- see press_spokespeople below
  status            TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'released', 'archived')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_press_status ON press_releases(status);

CREATE TABLE IF NOT EXISTS press_spokespeople (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  role              TEXT,
  email             TEXT,
  phone             TEXT,
  bio               TEXT,
  headshot_url      TEXT,
  topics            TEXT[] DEFAULT '{}',
  available         BOOLEAN DEFAULT TRUE,
  order_index       INT DEFAULT 100,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS press_kit_assets (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT,
  asset_type        TEXT CHECK (asset_type IN ('logo', 'image', 'document', 'fact_sheet', 'brand_guide', 'photo', 'video')),
  file_url          TEXT,
  file_size_bytes   BIGINT,
  thumbnail_url     TEXT,
  order_index       INT DEFAULT 100,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE press_releases
  DROP CONSTRAINT IF EXISTS fk_press_spokesperson;
ALTER TABLE press_releases
  ADD CONSTRAINT fk_press_spokesperson
  FOREIGN KEY (spokesperson_id) REFERENCES press_spokespeople(id) ON DELETE SET NULL;


-- ---------------------------------------------------------------------------
-- BOOK CATALOG (sector-wide bibliography - separate from copyright register)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
  id                SERIAL PRIMARY KEY,
  isbn              TEXT UNIQUE,
  title             TEXT NOT NULL,
  subtitle          TEXT,
  author_names      TEXT[] DEFAULT '{}',
  illustrator_names TEXT[] DEFAULT '{}',
  translator_names  TEXT[] DEFAULT '{}',
  publisher_org_id  INT REFERENCES organisations(id) ON DELETE SET NULL,
  publisher_name    TEXT,                     -- for non-registered publishers

  genre             TEXT,
  category          TEXT,                     -- 'adult_fiction' / 'childrens' / 'academic' / 'poetry' / ...
  language          TEXT DEFAULT 'en',
  age_range         TEXT,                     -- 'adult' / '6-8' / '9-12' / 'YA'

  format            TEXT[] DEFAULT '{}',      -- ['print','ebook','audio','braille']
  page_count        INT,
  published_date    DATE,
  edition           TEXT,

  cover_image_url   TEXT,
  description       TEXT,
  awards            TEXT[] DEFAULT '{}',

  cover_price_rands NUMERIC(8, 2),
  buy_links         JSONB DEFAULT '[]'::JSONB, -- [{retailer, url}, ...]

  featured          BOOLEAN DEFAULT FALSE,
  public            BOOLEAN DEFAULT TRUE,
  created_by_member_id INT REFERENCES members(id) ON DELETE SET NULL,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_author ON books USING GIN(author_names);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_language ON books(language);


-- ---------------------------------------------------------------------------
-- AWARDS / PRIZES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS awards (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  category          TEXT,                     -- 'fiction' / 'non_fiction' / 'poetry' / 'translation' / 'childrens' / 'lifetime'
  disciplines       TEXT[] DEFAULT '{}',
  prize_amount_rands NUMERIC(10, 2),
  frequency         TEXT DEFAULT 'annual'
    CHECK (frequency IN ('annual', 'biennial', 'triennial')),
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS award_cycles (
  id                SERIAL PRIMARY KEY,
  award_id          INT NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  year              INT NOT NULL,
  nominations_open  DATE,
  nominations_close DATE,
  shortlist_date    DATE,
  winner_announced  DATE,
  status            TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'nominations', 'judging', 'shortlisted', 'announced', 'archived')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(award_id, year)
);

CREATE TABLE IF NOT EXISTS award_nominations (
  id                SERIAL PRIMARY KEY,
  cycle_id          INT NOT NULL REFERENCES award_cycles(id) ON DELETE CASCADE,
  book_id           INT REFERENCES books(id) ON DELETE SET NULL,
  nominee_name      TEXT NOT NULL,
  nominated_title   TEXT,
  nominator_member_id INT REFERENCES members(id) ON DELETE SET NULL,
  nominator_name    TEXT,
  nominator_email   TEXT,
  rationale         TEXT,
  supporting_docs   JSONB DEFAULT '[]'::JSONB,

  status            TEXT DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'long_listed', 'shortlisted', 'winner', 'runner_up', 'withdrawn', 'ineligible')),
  judge_notes       TEXT,
  score             NUMERIC(5, 2),
  decision_at       TIMESTAMPTZ,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_anom_cycle ON award_nominations(cycle_id);


-- ---------------------------------------------------------------------------
-- JOB BOARD
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE,
  title             TEXT NOT NULL,
  employer_org_id   INT REFERENCES organisations(id) ON DELETE SET NULL,
  employer_name     TEXT NOT NULL,
  employer_logo_url TEXT,
  contact_email     TEXT,

  job_type          TEXT
    CHECK (job_type IN ('full_time', 'part_time', 'contract', 'freelance', 'internship', 'volunteer')),
  discipline        TEXT,
  location          TEXT,
  remote            BOOLEAN DEFAULT FALSE,

  salary_min_rands  NUMERIC(10, 2),
  salary_max_rands  NUMERIC(10, 2),
  salary_period     TEXT DEFAULT 'month'
    CHECK (salary_period IN ('hour', 'day', 'week', 'month', 'year', 'project')),

  description       TEXT,
  requirements      TEXT,
  benefits          TEXT,
  application_url   TEXT,
  application_email TEXT,

  closes_at         DATE,
  posted_at         TIMESTAMPTZ DEFAULT NOW(),
  status            TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed', 'filled', 'archived')),
  created_by_member_id INT REFERENCES members(id) ON DELETE SET NULL,
  approved          BOOLEAN DEFAULT FALSE,    -- admin approves before going public

  views_count       INT DEFAULT 0,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_discipline ON jobs(discipline);

CREATE TABLE IF NOT EXISTS job_applications (
  id                SERIAL PRIMARY KEY,
  job_id            INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,
  applicant_name    TEXT NOT NULL,
  applicant_email   TEXT NOT NULL,
  cover_note        TEXT,
  cv_url            TEXT,
  portfolio_url     TEXT,
  status            TEXT DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'reviewed', 'shortlisted', 'rejected', 'hired', 'withdrawn')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- MENTORSHIP
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentorship_profiles (
  id                SERIAL PRIMARY KEY,
  member_id         INT NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('mentor', 'mentee', 'both')),
  disciplines       TEXT[] DEFAULT '{}',
  experience_years  INT,
  bio               TEXT,
  goals             TEXT,
  availability      TEXT,
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentorship_matches (
  id                SERIAL PRIMARY KEY,
  mentor_id         INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  mentee_id         INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status            TEXT DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'active', 'paused', 'completed', 'cancelled')),
  started_at        DATE,
  ended_at          DATE,
  goals             TEXT,
  notes             TEXT,
  match_score       NUMERIC(3, 1),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id, mentee_id)
);


-- ---------------------------------------------------------------------------
-- VOLUNTEERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteers (
  id                SERIAL PRIMARY KEY,
  member_id         INT REFERENCES members(id) ON DELETE SET NULL,
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  interests         TEXT[] DEFAULT '{}',
  availability      TEXT,
  skills            TEXT[] DEFAULT '{}',
  status            TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'rotated_out')),
  hours_logged      NUMERIC(8, 2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id                SERIAL PRIMARY KEY,
  volunteer_id      INT NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  event_id          INT REFERENCES events(id) ON DELETE SET NULL,
  role              TEXT,
  scheduled_at      TIMESTAMPTZ,
  hours             NUMERIC(5, 2),
  completed         BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- EVENT CHECK-INS (extends event_registrations.checked_in_at flag)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_checkins (
  id                SERIAL PRIMARY KEY,
  event_id          INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id   INT REFERENCES event_registrations(id) ON DELETE SET NULL,
  checked_in_at     TIMESTAMPTZ DEFAULT NOW(),
  checked_in_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  method            TEXT
    CHECK (method IN ('qr', 'search', 'manual', 'self')),
  notes             TEXT
);
CREATE INDEX IF NOT EXISTS idx_chki_event ON event_checkins(event_id);


-- ---------------------------------------------------------------------------
-- Triggers + RLS
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_orgs_touch ON organisations;
CREATE TRIGGER trg_orgs_touch BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_contact_touch ON contact_submissions;
CREATE TRIGGER trg_contact_touch BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_press_touch ON press_releases;
CREATE TRIGGER trg_press_touch BEFORE UPDATE ON press_releases FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_books_touch ON books;
CREATE TRIGGER trg_books_touch BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_touch ON jobs;
CREATE TRIGGER trg_jobs_touch BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_ncamp_touch ON newsletter_campaigns;
CREATE TRIGGER trg_ncamp_touch BEFORE UPDATE ON newsletter_campaigns FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_ticket_touch ON event_ticket_purchases;
CREATE TRIGGER trg_ticket_touch BEFORE UPDATE ON event_ticket_purchases FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_mprof_touch ON mentorship_profiles;
CREATE TRIGGER trg_mprof_touch BEFORE UPDATE ON mentorship_profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Public read for public-facing tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orgs_read ON organisations;
CREATE POLICY orgs_read ON organisations FOR SELECT USING (public = TRUE OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS press_read ON press_releases;
CREATE POLICY press_read ON press_releases FOR SELECT USING (status = 'released' OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE press_spokespeople ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spokes_read ON press_spokespeople;
CREATE POLICY spokes_read ON press_spokespeople FOR SELECT USING (TRUE);

ALTER TABLE press_kit_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kit_read ON press_kit_assets;
CREATE POLICY kit_read ON press_kit_assets FOR SELECT USING (TRUE);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS books_read ON books;
CREATE POLICY books_read ON books FOR SELECT USING (public = TRUE OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS awards_read ON awards;
CREATE POLICY awards_read ON awards FOR SELECT USING (active = TRUE);

ALTER TABLE award_cycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS award_cycles_read ON award_cycles;
CREATE POLICY award_cycles_read ON award_cycles FOR SELECT USING (TRUE);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jobs_read ON jobs;
CREATE POLICY jobs_read ON jobs FOR SELECT USING ((status = 'open' AND approved = TRUE) OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nsub_none ON newsletter_subscribers;
CREATE POLICY nsub_none ON newsletter_subscribers FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contact_admin ON contact_submissions;
CREATE POLICY contact_admin ON contact_submissions FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');
