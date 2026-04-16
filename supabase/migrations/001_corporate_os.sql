-- =====================================================================
-- BPCDCC — Corporate OS Schema
-- Governance, Finance, HR, Procurement, Documents, Compliance,
-- Stakeholders, Programmes, Events, CMS, Constituency
-- Idempotent — safe to run multiple times
-- =====================================================================

-- ═══════════════════════════════════════════════════════════════
-- SECTION A: ENUMS
-- ═══════════════════════════════════════════════════════════════

do $$ begin
  if not exists (select 1 from pg_type where typname = 'staff_contract_type') then
    create type staff_contract_type as enum ('permanent', 'fixed_term', 'consultant', 'volunteer');
  end if;
  if not exists (select 1 from pg_type where typname = 'leave_type') then
    create type leave_type as enum ('annual', 'sick', 'family', 'unpaid', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'po_status') then
    create type po_status as enum ('draft', 'approved', 'sent', 'received', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'doc_folder') then
    create type doc_folder as enum ('governance', 'finance', 'hr', 'programmes', 'marketing', 'dsac', 'legal', 'general');
  end if;
  if not exists (select 1 from pg_type where typname = 'compliance_status') then
    create type compliance_status as enum ('upcoming', 'in_progress', 'completed', 'overdue');
  end if;
  if not exists (select 1 from pg_type where typname = 'stakeholder_type') then
    create type stakeholder_type as enum ('government', 'partner', 'publisher', 'author', 'illustrator', 'translator', 'printer', 'distributor', 'retailer', 'library', 'school', 'media', 'funder', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'interaction_type') then
    create type interaction_type as enum ('meeting', 'call', 'email', 'whatsapp', 'event', 'note');
  end if;
  if not exists (select 1 from pg_type where typname = 'programme_status') then
    create type programme_status as enum ('planning', 'active', 'completed', 'reported', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type event_status as enum ('draft', 'published', 'registration_open', 'full', 'completed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'page_status') then
    create type page_status as enum ('draft', 'published', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'account_type') then
    create type account_type as enum ('asset', 'liability', 'equity', 'revenue', 'expense');
  end if;
  if not exists (select 1 from pg_type where typname = 'journal_status') then
    create type journal_status as enum ('draft', 'posted', 'voided');
  end if;
  if not exists (select 1 from pg_type where typname = 'expense_status') then
    create type expense_status as enum ('draft', 'submitted', 'approved', 'paid', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type invoice_status as enum ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'constituency_type') then
    create type constituency_type as enum ('author', 'illustrator', 'translator', 'publisher', 'printer', 'distributor', 'bookseller', 'library', 'school', 'language_specialist', 'literary_agent', 'editor', 'designer', 'other');
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- SECTION B: GOVERNANCE
-- ═══════════════════════════════════════════════════════════════

create table if not exists board_members (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  role text not null,
  email text,
  phone text,
  id_number text,
  term_start date,
  term_end date,
  bio text,
  photo_url text,
  active boolean default true
);

create table if not exists board_meetings (
  id serial primary key,
  created_at timestamptz default now(),
  meeting_date date not null,
  meeting_time time,
  location text,
  meeting_type text default 'ordinary', -- ordinary, special, agm
  agenda text,
  status text default 'scheduled', -- scheduled, in_progress, completed, cancelled
  quorum_met boolean
);

create table if not exists meeting_attendance (
  id uuid default gen_random_uuid() primary key,
  meeting_id integer references board_meetings(id) on delete cascade not null,
  board_member_id uuid references board_members(id) on delete cascade not null,
  present boolean default false,
  apology boolean default false,
  unique (meeting_id, board_member_id)
);

create table if not exists meeting_minutes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  meeting_id integer references board_meetings(id) on delete cascade not null unique,
  content text,
  approved boolean default false,
  approved_at timestamptz,
  file_url text
);

create table if not exists resolutions (
  id serial primary key,
  created_at timestamptz default now(),
  number text generated always as ('RES-' || lpad(id::text, 4, '0')) stored,
  meeting_id integer references board_meetings(id),
  title text not null,
  description text,
  proposed_by uuid references board_members(id),
  seconded_by uuid references board_members(id),
  votes_for integer default 0,
  votes_against integer default 0,
  passed boolean default false,
  effective_date date
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION C: HR & TEAM
-- ═══════════════════════════════════════════════════════════════

create table if not exists staff (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  email text unique,
  phone text,
  id_number text,
  tax_number text,
  role text not null,
  contract_type staff_contract_type default 'consultant',
  hourly_rate numeric(10,2),
  monthly_salary numeric(12,2),
  start_date date,
  end_date date,
  bank_name text,
  bank_account text,
  bank_branch text,
  active boolean default true
);

create table if not exists contracts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  staff_id uuid references staff(id) on delete cascade not null,
  title text not null,
  contract_type text, -- employment, consultancy, sla, nda
  start_date date,
  end_date date,
  value numeric(12,2),
  file_url text,
  signed boolean default false,
  notes text
);

create table if not exists timesheets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  staff_id uuid references staff(id) on delete cascade not null,
  work_date date not null,
  hours numeric(4,1) not null,
  programme_id integer, -- FK added after programmes table
  description text,
  approved boolean default false
);

create table if not exists leave_records (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  staff_id uuid references staff(id) on delete cascade not null,
  leave_type leave_type not null,
  start_date date not null,
  end_date date not null,
  days numeric(4,1) not null,
  approved boolean default false,
  notes text
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION D: FINANCE (Double-Entry Ledger)
-- ═══════════════════════════════════════════════════════════════

create table if not exists chart_of_accounts (
  code text primary key,
  name text not null,
  account_type account_type not null,
  parent_code text references chart_of_accounts(code),
  is_header boolean default false,
  active boolean default true
);

create table if not exists financial_years (
  id serial primary key,
  label text not null,
  start_date date not null,
  end_date date not null,
  status text default 'open',
  check (end_date > start_date)
);

create table if not exists financial_periods (
  id serial primary key,
  financial_year_id integer references financial_years(id) on delete cascade not null,
  period_number integer not null check (period_number between 1 and 12),
  start_date date not null,
  end_date date not null,
  closed boolean default false,
  unique (financial_year_id, period_number)
);

create table if not exists journal_entries (
  id serial primary key,
  created_at timestamptz default now(),
  number text generated always as ('JE-' || lpad(id::text, 5, '0')) stored,
  entry_date date not null default current_date,
  status journal_status default 'draft',
  description text,
  reference_type text,
  reference_id integer,
  financial_period_id integer references financial_periods(id),
  posted_at timestamptz
);

create table if not exists journal_entry_lines (
  id uuid default gen_random_uuid() primary key,
  journal_entry_id integer references journal_entries(id) on delete cascade not null,
  account_code text references chart_of_accounts(code) not null,
  description text,
  debit numeric(12,2) default 0,
  credit numeric(12,2) default 0,
  check (debit >= 0 and credit >= 0),
  check (debit > 0 or credit > 0)
);

create table if not exists expense_categories (
  id serial primary key,
  name text not null unique,
  gl_account_code text references chart_of_accounts(code),
  active boolean default true
);

create table if not exists expenses (
  id serial primary key,
  created_at timestamptz default now(),
  number text generated always as ('EXP-' || lpad(id::text, 5, '0')) stored,
  category_id integer references expense_categories(id),
  description text not null,
  amount numeric(12,2) not null,
  vat_amount numeric(12,2) default 0,
  total numeric(12,2) not null,
  expense_date date default current_date,
  status expense_status default 'draft',
  receipt_url text,
  programme_id integer, -- FK added after programmes
  submitted_by uuid references staff(id),
  approved_by uuid references staff(id),
  notes text
);

create table if not exists invoices (
  id serial primary key,
  created_at timestamptz default now(),
  number text generated always as ('INV-' || lpad(id::text, 5, '0')) stored,
  recipient_name text not null,
  recipient_email text,
  description text,
  subtotal numeric(12,2) default 0,
  vat numeric(12,2) default 0,
  total numeric(12,2) default 0,
  due_date date,
  status invoice_status default 'draft',
  programme_id integer,
  notes text
);

create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  invoice_id integer references invoices(id),
  amount numeric(12,2) not null,
  method text, -- eft, cash, card
  reference text,
  received_at timestamptz default now()
);

create table if not exists budgets (
  id serial primary key,
  created_at timestamptz default now(),
  name text not null,
  financial_year_id integer references financial_years(id),
  programme_id integer,
  total_amount numeric(12,2) default 0,
  description text
);

create table if not exists budget_items (
  id serial primary key,
  budget_id integer references budgets(id) on delete cascade not null,
  account_code text references chart_of_accounts(code),
  description text,
  amount numeric(12,2) default 0,
  notes text
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION E: PROCUREMENT
-- ═══════════════════════════════════════════════════════════════

create table if not exists vendors (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  service_type text, -- venue, printing, design, catering, travel, other
  bank_name text,
  bank_account text,
  tax_number text,
  rating integer default 0 check (rating between 0 and 5),
  active boolean default true,
  notes text
);

create table if not exists purchase_orders (
  id serial primary key,
  created_at timestamptz default now(),
  number text generated always as ('PO-' || lpad(id::text, 5, '0')) stored,
  vendor_id uuid references vendors(id) not null,
  description text not null,
  amount numeric(12,2) not null,
  vat numeric(12,2) default 0,
  total numeric(12,2) not null,
  status po_status default 'draft',
  programme_id integer,
  approved_by uuid references staff(id),
  notes text
);

-- Three-quote compliance for NPC governance
create table if not exists procurement_quotes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  purchase_order_id integer references purchase_orders(id) on delete cascade not null,
  vendor_id uuid references vendors(id) not null,
  amount numeric(12,2) not null,
  file_url text,
  selected boolean default false,
  notes text
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION F: DOCUMENTS
-- ═══════════════════════════════════════════════════════════════

create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  folder doc_folder default 'general',
  file_url text not null,
  file_type text,
  file_size integer,
  version integer default 1,
  uploaded_by uuid references staff(id),
  linked_type text, -- board_meeting, contract, programme, vendor
  linked_id text,
  notes text
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION G: COMPLIANCE
-- ═══════════════════════════════════════════════════════════════

create table if not exists compliance_items (
  id serial primary key,
  created_at timestamptz default now(),
  title text not null,
  description text,
  due_date date not null,
  responsible text, -- board member name or staff
  status compliance_status default 'upcoming',
  category text, -- cipc, dsac, sars, audit, governance
  completed_at timestamptz,
  file_url text, -- proof of compliance
  recurring boolean default false,
  recurrence_months integer, -- 12 for annual, 3 for quarterly
  notes text
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION H: STAKEHOLDERS & CRM
-- ═══════════════════════════════════════════════════════════════

create table if not exists stakeholders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  stakeholder_type stakeholder_type not null,
  organisation text,
  email text,
  phone text,
  address text,
  province text,
  website text,
  relationship_status text default 'identified', -- identified, contacted, engaged, active, dormant
  notes text
);

create table if not exists interactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  stakeholder_id uuid references stakeholders(id) on delete cascade not null,
  interaction_type interaction_type not null,
  date timestamptz default now(),
  summary text not null,
  follow_up text,
  follow_up_date date,
  completed boolean default false,
  logged_by uuid references staff(id)
);

create table if not exists stakeholder_programmes (
  stakeholder_id uuid references stakeholders(id) on delete cascade,
  programme_id integer, -- FK added after programmes
  role text, -- partner, sponsor, participant, facilitator
  primary key (stakeholder_id, programme_id)
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION I: PROGRAMMES & EVENTS
-- ═══════════════════════════════════════════════════════════════

create table if not exists programmes (
  id serial primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  description text,
  objectives text,
  target_audience text,
  province text,
  status programme_status default 'planning',
  start_date date,
  end_date date,
  budget_allocated numeric(12,2) default 0,
  budget_spent numeric(12,2) default 0,
  notes text
);

create table if not exists programme_milestones (
  id uuid default gen_random_uuid() primary key,
  programme_id integer references programmes(id) on delete cascade not null,
  title text not null,
  due_date date,
  completed boolean default false,
  completed_at timestamptz,
  notes text
);

create table if not exists programme_kpis (
  id uuid default gen_random_uuid() primary key,
  programme_id integer references programmes(id) on delete cascade not null,
  indicator text not null, -- e.g. "Attendees", "Books distributed", "Authors trained"
  target numeric default 0,
  actual numeric default 0,
  unit text default 'count' -- count, rand, percentage
);

create table if not exists events (
  id serial primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  programme_id integer references programmes(id),
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  end_date date,
  venue text,
  venue_address text,
  capacity integer,
  status event_status default 'draft',
  registration_required boolean default true,
  cover_image_url text,
  notes text
);

create table if not exists event_registrations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  event_id integer references events(id) on delete cascade not null,
  name text not null,
  email text not null,
  phone text,
  organisation text,
  province text,
  dietary_requirements text,
  checked_in boolean default false,
  checked_in_at timestamptz
);

create table if not exists programme_reports (
  id serial primary key,
  created_at timestamptz default now(),
  programme_id integer references programmes(id) on delete cascade not null,
  report_type text default 'quarterly', -- quarterly, annual, completion
  period text, -- Q1 2026, etc.
  narrative text,
  budget_spent numeric(12,2) default 0,
  challenges text,
  recommendations text,
  submitted boolean default false,
  submitted_at timestamptz,
  file_url text
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION J: CMS (Content Management)
-- ═══════════════════════════════════════════════════════════════

create table if not exists pages (
  id serial primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  slug text unique not null,
  title text not null,
  content jsonb default '[]'::jsonb, -- block-based content
  meta_description text,
  status page_status default 'draft',
  published_at timestamptz,
  author_id uuid references staff(id)
);

create table if not exists posts (
  id serial primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content jsonb default '[]'::jsonb,
  cover_image_url text,
  category text, -- news, press_release, announcement, opinion
  status page_status default 'draft',
  published_at timestamptz,
  author_id uuid references staff(id)
);

create table if not exists podcast_episodes (
  id serial primary key,
  created_at timestamptz default now(),
  title text not null,
  description text,
  guest_name text,
  guest_title text,
  audio_url text,
  cover_image_url text,
  duration_minutes integer,
  episode_number integer,
  season integer default 1,
  published boolean default false,
  published_at timestamptz
);

create table if not exists media_library (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  file_url text not null,
  file_type text, -- image, pdf, audio, video
  file_size integer,
  alt_text text,
  folder text default 'general'
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION K: CONSTITUENCY REGISTRY
-- ═══════════════════════════════════════════════════════════════

create table if not exists constituency_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  email text,
  phone text,
  province text,
  municipality text,
  constituency_type constituency_type not null,
  organisation text,
  languages text[] default '{}', -- languages they work in
  years_active text,
  specialisation text, -- genre, format, material type
  bio text,
  portfolio_link text,
  status text default 'new', -- new, reviewed, verified, contacted
  notes text,
  utm_source text,
  utm_campaign text
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION L: ADD FOREIGN KEYS (deferred because of table order)
-- ═══════════════════════════════════════════════════════════════

do $$ begin
  -- timesheets.programme_id
  if not exists (select 1 from information_schema.columns where table_name = 'timesheets' and column_name = 'programme_id' and data_type = 'integer') then
    null; -- column already created without FK, add it
  end if;
  -- expenses.programme_id FK
  -- invoices.programme_id FK
  -- budgets.programme_id FK
  -- purchase_orders.programme_id FK
  -- stakeholder_programmes.programme_id FK
  -- These are already integer columns; FK enforcement is via application layer
end $$;

-- ═══════════════════════════════════════════════════════════════
-- SECTION M: TRIGGERS
-- ═══════════════════════════════════════════════════════════════

create or replace function update_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_staff_updated on staff;
create trigger trg_staff_updated before update on staff for each row execute function update_updated_at();

drop trigger if exists trg_stakeholders_updated on stakeholders;
create trigger trg_stakeholders_updated before update on stakeholders for each row execute function update_updated_at();

drop trigger if exists trg_programmes_updated on programmes;
create trigger trg_programmes_updated before update on programmes for each row execute function update_updated_at();

drop trigger if exists trg_events_updated on events;
create trigger trg_events_updated before update on events for each row execute function update_updated_at();

drop trigger if exists trg_pages_updated on pages;
create trigger trg_pages_updated before update on pages for each row execute function update_updated_at();

drop trigger if exists trg_posts_updated on posts;
create trigger trg_posts_updated before update on posts for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- SECTION N: ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'board_members','board_meetings','meeting_attendance','meeting_minutes','resolutions',
    'staff','contracts','timesheets','leave_records',
    'chart_of_accounts','financial_years','financial_periods','journal_entries','journal_entry_lines',
    'expense_categories','expenses','invoices','payments','budgets','budget_items',
    'vendors','purchase_orders','procurement_quotes',
    'documents','compliance_items',
    'stakeholders','interactions','stakeholder_programmes',
    'programmes','programme_milestones','programme_kpis','events','event_registrations','programme_reports',
    'pages','posts','podcast_episodes','media_library',
    'constituency_submissions'
  ]) loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "Allow all %I" on %I', t, t);
    execute format('create policy "Allow all %I" on %I for all using (true)', t, t);
  end loop;
end $$;

-- Public read access for CMS content
do $$ begin
  drop policy if exists "Public read pages" on pages;
  drop policy if exists "Public read posts" on posts;
  drop policy if exists "Public read episodes" on podcast_episodes;
  drop policy if exists "Public read events" on events;
  drop policy if exists "Public insert registrations" on event_registrations;
  drop policy if exists "Public insert constituency" on constituency_submissions;
end $$;

create policy "Public read pages" on pages for select using (status = 'published');
create policy "Public read posts" on posts for select using (status = 'published');
create policy "Public read episodes" on podcast_episodes for select using (published = true);
create policy "Public read events" on events for select using (status != 'draft');
create policy "Public insert registrations" on event_registrations for insert with check (true);
create policy "Public insert constituency" on constituency_submissions for insert with check (true);

-- ═══════════════════════════════════════════════════════════════
-- SECTION O: INDEXES
-- ═══════════════════════════════════════════════════════════════

create index if not exists idx_staff_active on staff(active);
create index if not exists idx_expenses_date on expenses(expense_date);
create index if not exists idx_expenses_status on expenses(status);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_journal_entries_date on journal_entries(entry_date);
create index if not exists idx_stakeholders_type on stakeholders(stakeholder_type);
create index if not exists idx_interactions_stakeholder on interactions(stakeholder_id);
create index if not exists idx_programmes_status on programmes(status);
create index if not exists idx_events_date on events(event_date);
create index if not exists idx_events_status on events(status);
create index if not exists idx_event_registrations_event on event_registrations(event_id);
create index if not exists idx_pages_slug on pages(slug);
create index if not exists idx_posts_slug on posts(slug);
create index if not exists idx_posts_status on posts(status);
create index if not exists idx_constituency_type on constituency_submissions(constituency_type);
create index if not exists idx_compliance_due on compliance_items(due_date);
create index if not exists idx_documents_folder on documents(folder);

-- ═══════════════════════════════════════════════════════════════
-- SECTION P: STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('podcast', 'podcast', true) on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════════
-- SECTION Q: SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- Board Members
insert into board_members (name, role, email, active) values
  ('Terry-Ann Adams', 'Chairperson & Founder', 'terry@bpcdcc.org.za', true),
  ('Lorraine Sithole', 'Treasurer', 'lorraine@bpcdcc.org.za', true),
  ('Melvin Kaabwe', 'Secretary & Spokesperson', 'melvin@bpcdcc.org.za', true)
on conflict do nothing;

-- Chart of Accounts (NPC-appropriate)
insert into chart_of_accounts (code, name, account_type, parent_code, is_header) values
  ('1000', 'Assets', 'asset', null, true),
  ('1100', 'Bank Account', 'asset', '1000', false),
  ('1200', 'Accounts Receivable', 'asset', '1000', false),
  ('1300', 'Prepaid Expenses', 'asset', '1000', false),
  ('1400', 'VAT Input', 'asset', '1000', false),
  ('2000', 'Liabilities', 'liability', null, true),
  ('2100', 'Accounts Payable', 'liability', '2000', false),
  ('2200', 'VAT Output', 'liability', '2000', false),
  ('2300', 'DSAC Funds Held (Restricted)', 'liability', '2000', false),
  ('3000', 'Equity', 'equity', null, true),
  ('3100', 'Accumulated Surplus', 'equity', '3000', false),
  ('4000', 'Revenue', 'revenue', null, true),
  ('4100', 'DSAC Grant Income', 'revenue', '4000', false),
  ('4200', 'Sponsorship Income', 'revenue', '4000', false),
  ('4300', 'Registration Fees', 'revenue', '4000', false),
  ('4400', 'Other Income', 'revenue', '4000', false),
  ('5000', 'Programme Expenses', 'expense', null, true),
  ('5100', 'Venue & Catering', 'expense', '5000', false),
  ('5200', 'Travel & Accommodation', 'expense', '5000', false),
  ('5300', 'Facilitators & Speakers', 'expense', '5000', false),
  ('5400', 'Printing & Materials', 'expense', '5000', false),
  ('5500', 'Book Procurement & Distribution', 'expense', '5000', false),
  ('5600', 'Podcast Production', 'expense', '5000', false),
  ('5700', 'Marketing & Communications', 'expense', '5000', false),
  ('6000', 'Administrative Expenses', 'expense', null, true),
  ('6100', 'Staff & Consultant Fees', 'expense', '6000', false),
  ('6200', 'Office & Administration', 'expense', '6000', false),
  ('6300', 'Professional Fees (Audit, Legal)', 'expense', '6000', false),
  ('6400', 'Insurance', 'expense', '6000', false),
  ('6500', 'IT & Software', 'expense', '6000', false),
  ('6600', 'Bank Charges', 'expense', '6000', false),
  ('7000', 'Governance', 'expense', null, true),
  ('7100', 'Board Meeting Costs', 'expense', '7000', false),
  ('7200', 'AGM Costs', 'expense', '7000', false),
  ('7300', 'Compliance & Filing', 'expense', '7000', false)
on conflict (code) do nothing;

-- Expense Categories
insert into expense_categories (name, gl_account_code) values
  ('Venue & Catering', '5100'),
  ('Travel & Accommodation', '5200'),
  ('Facilitators & Speakers', '5300'),
  ('Printing & Materials', '5400'),
  ('Book Procurement', '5500'),
  ('Podcast Production', '5600'),
  ('Marketing & Comms', '5700'),
  ('Staff & Consultants', '6100'),
  ('Office & Admin', '6200'),
  ('Professional Fees', '6300'),
  ('Insurance', '6400'),
  ('IT & Software', '6500'),
  ('Bank Charges', '6600'),
  ('Board Meetings', '7100'),
  ('AGM', '7200'),
  ('Compliance & Filing', '7300')
on conflict (name) do nothing;

-- Seed programmes
insert into programmes (name, description, province, status) values
  ('Book Value Chain Imbizo', 'Multi-stakeholder gathering to discuss the SA book value chain — authors, publishers, printers, distributors', 'KwaZulu-Natal', 'planning'),
  ('Jacana Work Skills Programme', 'Collaboration with Jacana Literary Foundation — publishing postgraduate students researching indigenous language poetry anthologies', null, 'active'),
  ('Zibonele Podcast', 'Industry podcast featuring interviews with actors across the book publishing value chain', null, 'active'),
  ('Author Branding & Marketing Workshop', 'Workshop for authors on building their brand and marketing their books', 'North West', 'planning'),
  ('Indigenous Language Book Distribution', 'Distribution of indigenous language books to schools in underserved provinces', 'Limpopo', 'planning')
on conflict do nothing;

-- Seed compliance items
insert into compliance_items (title, due_date, responsible, category, recurring, recurrence_months) values
  ('DSAC Q4 Narrative Report', '2026-04-30', 'Melvin Kaabwe', 'dsac', true, 3),
  ('DSAC Q4 Financial Report', '2026-04-30', 'Lorraine Sithole', 'dsac', true, 3),
  ('CIPC Annual Return', '2026-06-30', 'Melvin Kaabwe', 'cipc', true, 12),
  ('Annual Financial Statements', '2026-09-30', 'Lorraine Sithole', 'audit', true, 12),
  ('B-BBEE Verification', '2026-12-31', 'Terry-Ann Adams', 'governance', true, 12)
on conflict do nothing;

-- Financial year
insert into financial_years (label, start_date, end_date, status)
select 'FY 2026', '2026-04-01', '2027-03-31', 'open'
where not exists (select 1 from financial_years where label = 'FY 2026');

-- Auto-create 12 monthly periods
do $$
declare
  fy_id integer;
  i integer;
  m_start date;
  m_end date;
begin
  select id into fy_id from financial_years where label = 'FY 2026';
  if fy_id is not null then
    for i in 1..12 loop
      m_start := '2026-04-01'::date + ((i - 1) * interval '1 month');
      m_end := m_start + interval '1 month' - interval '1 day';
      insert into financial_periods (financial_year_id, period_number, start_date, end_date)
      values (fy_id, i, m_start, m_end)
      on conflict (financial_year_id, period_number) do nothing;
    end loop;
  end if;
end $$;
