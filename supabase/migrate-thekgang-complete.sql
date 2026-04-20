-- =====================================================================================
-- THEKGANG / CDCC — FULL CONSOLIDATED MIGRATION
-- Generated from migrations/001_corporate_os.sql through 014_search_vectors.sql
-- Apply this ONE script to a Supabase project to get the full schema.
-- All source migrations were authored idempotent (IF NOT EXISTS / CREATE OR REPLACE).
-- =====================================================================================
--
-- HOW TO USE
-- ----------
-- 1. (OPTIONAL but RECOMMENDED if you ran a script from another app by mistake)
--    Uncomment the RESET BLOCK below to drop the public schema and start clean.
--    It's commented out by default because it's destructive.
--
-- 2. Paste the whole file into Supabase SQL Editor and run.
--    OR via CLI:  supabase db push  (if migrations/ folder is used)
--    OR via psql: psql "$SUPABASE_DB_URL" -f migrate-thekgang-complete.sql
--
-- =====================================================================================


-- ─────────────────────────────────────────────────────────────────────────────────────
-- RESET BLOCK — uncomment to wipe the public schema before applying.
-- Drops every table, view, function, type, and row in public.
-- Supabase's `auth`, `storage`, `realtime`, `extensions` schemas are preserved.
-- ─────────────────────────────────────────────────────────────────────────────────────
--
-- drop schema if exists public cascade;
-- create schema public;
-- grant usage on schema public to postgres, anon, authenticated, service_role;
-- grant all on schema public to postgres, service_role;
-- alter default privileges in schema public grant all on tables    to postgres, service_role;
-- alter default privileges in schema public grant all on functions to postgres, service_role;
-- alter default privileges in schema public grant all on sequences to postgres, service_role;
-- -- Restore Supabase anon/authenticated access (wiped by `drop schema cascade`):
-- alter default privileges in schema public grant all on tables    to anon, authenticated;
-- alter default privileges in schema public grant all on sequences to anon, authenticated;
-- alter default privileges in schema public grant all on functions to anon, authenticated;
--
-- ─────────────────────────────────────────────────────────────────────────────────────




-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/001_corporate_os.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/002_enhanced_events.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/003_bespoke_cms.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- CDCC Bespoke CMS Migration — Phase 1-4 support
-- ───────────────────────────────────────────────────────────────
-- Adds:
--   1. `media` storage bucket (images/pdfs/audio for admin upload)
--   2. `homepage_content` table (editable homepage sections)
--   3. Seed of homepage_content with the current hardcoded content
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. STORAGE BUCKET — public-read media for website content
-- ───────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800, -- 50 MB per file
  array[
    'image/jpeg','image/png','image/webp','image/gif','image/svg+xml',
    'application/pdf',
    'audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/mp4'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies: public read, authenticated write
do $$ begin
  drop policy if exists "media_public_read" on storage.objects;
  drop policy if exists "media_auth_insert" on storage.objects;
  drop policy if exists "media_auth_update" on storage.objects;
  drop policy if exists "media_auth_delete" on storage.objects;
exception when others then null; end $$;

create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

create policy "media_auth_insert" on storage.objects
  for insert with check (bucket_id = 'media');

create policy "media_auth_update" on storage.objects
  for update using (bucket_id = 'media');

create policy "media_auth_delete" on storage.objects
  for delete using (bucket_id = 'media');

-- ───────────────────────────────────────────────────────────────
-- 2. HOMEPAGE_CONTENT — single-row-per-section editable CMS
-- ───────────────────────────────────────────────────────────────
create table if not exists homepage_content (
  id serial primary key,
  section_key text unique not null, -- 'hero', 'stakeholders', 'social_proof', 'doorways', 'audiences', 'pillars', 'outcomes', 'cta'
  label text not null,              -- display name in admin UI
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  updated_at timestamptz default now(),
  updated_by text                   -- admin name / email, free-text for audit
);

create index if not exists idx_homepage_content_section_key on homepage_content (section_key);
create index if not exists idx_homepage_content_sort on homepage_content (sort_order);

alter table homepage_content enable row level security;

do $$ begin
  drop policy if exists "homepage_public_read" on homepage_content;
  drop policy if exists "homepage_auth_write" on homepage_content;
exception when others then null; end $$;

create policy "homepage_public_read" on homepage_content
  for select using (true);

create policy "homepage_auth_write" on homepage_content
  for all using (true) with check (true);

-- ───────────────────────────────────────────────────────────────
-- 3. SEED — preload each homepage section with the current copy
-- so the live site never goes blank when the CMS switches on
-- ───────────────────────────────────────────────────────────────
insert into homepage_content (section_key, label, sort_order, content) values
(
  'hero',
  'Hero — the top of the homepage',
  1,
  '{
    "eyebrow": "Books & Publishing — Content Developers & Creators",
    "headline_line1": "One sector.",
    "headline_line2": "One voice.",
    "headline_line3": "One council.",
    "subcopy": "The central strategic and coordinating body for South Africa''s content development and creation sector. 14 disciplines. 9 provinces. 1 mandate.",
    "cta_primary_label": "Join the Council",
    "cta_primary_href": "/join",
    "cta_secondary_label": "See the Strategic Plan",
    "cta_secondary_href": "/the-plan",
    "cluster_label": "1 of 17 DSAC Cultural & Creative Industries Clusters →",
    "cluster_href": "/ecosystem"
  }'::jsonb
),
(
  'stakeholders',
  'Stakeholder disciplines — the 14 categories',
  2,
  '{
    "eyebrow": "Who We Represent",
    "headline": "14 disciplines. One unified voice.",
    "subcopy": "CDCC represents the full spectrum of content development and creation — from independent creatives to large production companies.",
    "read_more_label": "Read our full mandate →",
    "read_more_href": "/about",
    "categories": [
      "Authors & Writers","Translators","Designers","Narrators",
      "Publishers & Self-Publishers","Research & Development","Editors","Indexers",
      "Proofreaders","Legal & IP","Layout/Designers","Literary Agents",
      "Photographers","AI & Software"
    ],
    "footer_label": "Find your discipline and join →",
    "footer_href": "/join"
  }'::jsonb
),
(
  'social_proof',
  'Social proof strip — mandate, cluster, launch date',
  3,
  '{
    "items": [
      {"eyebrow":"Mandated by","value":"Dept. of Sport, Arts & Culture"},
      {"eyebrow":"Cluster Programme","value":"1 of 17 National CCI Clusters"},
      {"eyebrow":"Officially Launched","value":"30 March 2026"}
    ]
  }'::jsonb
),
(
  'doorways',
  'Doorway cards — Mandate + Ecosystem',
  4,
  '{
    "cards": [
      {
        "eyebrow":"The Mandate",
        "title":"Central strategic body for the content creation sector",
        "body":"CDCC unifies diverse industry stakeholders by providing strategic direction, allocating resources equitably, and fostering skills development to meet evolving demands.",
        "stats":["14 disciplines","9 provinces","6 strategic pillars"],
        "link_label":"Read the full mandate →",
        "link_href":"/about"
      },
      {
        "eyebrow":"The Ecosystem",
        "title":"17 clusters. One national programme.",
        "body":"CDCC operates within DSAC''s Cultural & Creative Industries cluster programme — alongside theatre, dance, film, music, visual arts, design, and more.",
        "tags":["Theatre","Dance","Visual Arts","Film & TV","Music","Design","+11 more"],
        "link_label":"Explore the full ecosystem →",
        "link_href":"/ecosystem"
      }
    ]
  }'::jsonb
),
(
  'audiences',
  'Audiences — 4 entry points',
  5,
  '{
    "eyebrow":"Who This Is For",
    "headline_line1":"From independent creatives",
    "headline_line2":"to production companies.",
    "cards":[
      {
        "title":"For Content Creators",
        "desc":"Authors, illustrators, photographers, narrators — if you create content in the books and publishing space, CDCC coordinates your representation at the highest levels of government.",
        "cta_label":"Join the Council","cta_href":"/join",
        "deeper_label":"Read our mandate →","deeper_href":"/about",
        "hover_class":"card-hover"
      },
      {
        "title":"For Publishers & Enterprises",
        "desc":"From independent self-publishers to large production companies — we ensure equitable resource allocation and advocate for your business interests nationally and internationally.",
        "cta_label":"Affiliate Now","cta_href":"/join",
        "deeper_label":"See the strategic framework →","deeper_href":"/the-plan",
        "hover_class":"card-hover-amber"
      },
      {
        "title":"For Industry Professionals",
        "desc":"Editors, proofreaders, translators, indexers, literary agents, layout designers — the professionals who make publishing happen. CDCC represents the full spectrum.",
        "cta_label":"Register Your Practice","cta_href":"/join",
        "deeper_label":"Why affiliate with CDCC →","deeper_href":"/stakeholders",
        "hover_class":"card-hover-emerald"
      },
      {
        "title":"For Innovators",
        "desc":"AI & software developers, new media creators, digital-first publishers — the future of content creation is here. CDCC ensures the evolving landscape has a seat at the policy table.",
        "cta_label":"Join as Innovator","cta_href":"/join",
        "deeper_label":"Copyright & IP advocacy →","deeper_href":"/advocacy",
        "hover_class":"card-hover-violet"
      }
    ]
  }'::jsonb
),
(
  'pillars',
  'Strategic pillars — 6 items on the charcoal section',
  6,
  '{
    "eyebrow":"Strategic Pillars",
    "headline":"Six pillars. One mandate.",
    "subcopy":"Our 3-year focus areas and 5-year outcomes are built on these foundations.",
    "link_label":"See the full plan →",
    "link_href":"/the-plan",
    "items":[
      {"num":"01","title":"Strategic Oversight","desc":"Overarching strategic direction, policy guidance, and coordination for the entire content development sector.","link":"/the-plan"},
      {"num":"02","title":"Resource Allocation","desc":"Equitable funding and resources to sub-sector organisations based on needs and priorities — from independents to enterprises.","link":"/the-plan"},
      {"num":"03","title":"Skills Development","desc":"Training and development programmes tailored to navigate the evolving industry landscape.","link":"/programmes"},
      {"num":"04","title":"Copyright & IP","desc":"Lobbying for a regulatory framework for copyright protection, intellectual property, and the prevention of infringements.","link":"/advocacy"},
      {"num":"05","title":"Advocacy","desc":"Representing the interests of the entire sector at national and international levels. The main point of contact between publishing and government.","link":"/stakeholders"},
      {"num":"06","title":"Monitoring & Evaluation","desc":"Data-driven performance assessment ensuring alignment with sector objectives and accountability.","link":"/the-plan"}
    ]
  }'::jsonb
),
(
  'outcomes',
  '5-year outcomes — 6 items',
  7,
  '{
    "eyebrow":"5-Year Outcomes",
    "headline":"Where we''re headed.",
    "items":[
      {"label":"Unified & represented sector","desc":"Every sub-sector has a voice. Small enterprises and large companies alike."},
      {"label":"Equitable resource allocation","desc":"Funding distributed based on evidence, not proximity."},
      {"label":"Future-ready workforce","desc":"Practitioners equipped to navigate the evolving industry landscape."},
      {"label":"Robust copyright framework","desc":"Legislative protection for intellectual property across all formats."},
      {"label":"National & international influence","desc":"The sector''s priorities addressed in policy at every level."},
      {"label":"Data-driven accountability","desc":"Monitoring and evaluation embedded in everything we do."}
    ],
    "link_label":"See the full strategic framework →",
    "link_href":"/the-plan"
  }'::jsonb
),
(
  'cta',
  'Final CTA — bottom of homepage',
  8,
  '{
    "headline":"Your sector needs your voice.",
    "subcopy":"Authors, designers, editors, publishers, translators, agents, photographers, narrators, AI developers — if you create or enable content, we represent you.",
    "cta_primary_label":"Join the Council",
    "cta_primary_href":"/join",
    "link_1_label":"See the strategic plan →",
    "link_1_href":"/the-plan",
    "link_2_label":"Explore the ecosystem →",
    "link_2_href":"/ecosystem"
  }'::jsonb
)
on conflict (section_key) do nothing;


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/004_event_lifecycle.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/005_full_feature_set.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/006_event_ecosystem.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/007_member_portal.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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
  constituency_submission_id UUID REFERENCES constituency_submissions(id) ON DELETE SET NULL,  -- FIX: constituency_submissions.id is UUID
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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/008_council_modules.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/009_billing.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- 009_billing.sql
--
-- Membership billing + Paystack integration:
--   - member_subscriptions   one per member, tracks current subscription state
--   - member_payments        immutable ledger of every payment received
--   - paystack_events        raw webhook inbox (for audit + retry on failures)
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_subscriptions (
  id                SERIAL PRIMARY KEY,
  member_id         INT NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  tier_id           INT NOT NULL REFERENCES member_tiers(id) ON DELETE RESTRICT,

  status            TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'past_due', 'cancelled', 'expired')),
  started_at        DATE,
  expires_at        DATE,
  auto_renew        BOOLEAN DEFAULT TRUE,

  last_payment_at   TIMESTAMPTZ,
  last_payment_id   INT,
  next_renewal_at   DATE,

  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  paystack_authorization_code TEXT,     -- tokenised card for future charges

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msubs_status ON member_subscriptions(status);

CREATE TABLE IF NOT EXISTS member_payments (
  id                SERIAL PRIMARY KEY,
  member_id         INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  subscription_id   INT REFERENCES member_subscriptions(id) ON DELETE SET NULL,
  tier_id           INT REFERENCES member_tiers(id) ON DELETE SET NULL,

  amount_rands      NUMERIC(10, 2) NOT NULL,
  currency          TEXT DEFAULT 'ZAR',
  status            TEXT NOT NULL
    CHECK (status IN ('initiated', 'success', 'failed', 'refunded', 'disputed')),

  paystack_reference TEXT UNIQUE,
  paystack_transaction_id TEXT,
  channel           TEXT,                           -- card / eft / transfer
  paid_at           TIMESTAMPTZ,

  invoice_number    TEXT UNIQUE,
  receipt_url       TEXT,
  notes             TEXT,

  raw_response      JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mpays_member ON member_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_mpays_ref ON member_payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_mpays_status ON member_payments(status);

-- Paystack webhook event log (audit trail, retry source)
CREATE TABLE IF NOT EXISTS paystack_events (
  id                SERIAL PRIMARY KEY,
  event_type        TEXT NOT NULL,
  paystack_reference TEXT,
  payload           JSONB NOT NULL,
  processed         BOOLEAN DEFAULT FALSE,
  processed_at      TIMESTAMPTZ,
  error             TEXT,
  received_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pse_type ON paystack_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pse_processed ON paystack_events(processed);

-- Invoice number generator
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TRIGGER AS $INV$
DECLARE
  year_part TEXT;
  next_num INT;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-' || year_part || '-(\d+)') AS INT)), 0) + 1
      INTO next_num
      FROM member_payments
      WHERE invoice_number LIKE 'INV-' || year_part || '-%';
    NEW.invoice_number := 'INV-' || year_part || '-' || LPAD(next_num::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$INV$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gen_invoice_num ON member_payments;
CREATE TRIGGER trg_gen_invoice_num
  BEFORE INSERT ON member_payments
  FOR EACH ROW
  WHEN (NEW.status = 'success')
  EXECUTE FUNCTION generate_invoice_number();

-- Updated-at triggers
DROP TRIGGER IF EXISTS trg_msubs_touch ON member_subscriptions;
CREATE TRIGGER trg_msubs_touch BEFORE UPDATE ON member_subscriptions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS: members see only their own payments + subscription
ALTER TABLE member_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msubs_own ON member_subscriptions;
CREATE POLICY msubs_own ON member_subscriptions
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );

ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mpay_own ON member_payments;
CREATE POLICY mpay_own ON member_payments
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/010_full_platform.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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
  ticket_type_id    UUID REFERENCES event_ticket_types(id) ON DELETE SET NULL,  -- FIX: event_ticket_types.id is UUID
  registration_id   UUID REFERENCES event_registrations(id) ON DELETE SET NULL,  -- FIX: event_registrations.id is UUID
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
  registration_id   UUID REFERENCES event_registrations(id) ON DELETE SET NULL,  -- FIX: event_registrations.id is UUID
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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/011_sector_depth.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/012_placements.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/013_messaging.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- 013_messaging.sql
--
-- Member-to-member direct messaging.
-- Thread-based (one thread per pair of members). Polling-based reads.
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_message_threads (
  id                SERIAL PRIMARY KEY,
  member_a_id       INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_b_id       INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  subject           TEXT,
  last_message_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure only one thread per unordered pair
  CHECK (member_a_id <> member_b_id)
);
-- Unique pair index — always store with member_a < member_b
CREATE UNIQUE INDEX IF NOT EXISTS idx_thread_pair ON member_message_threads (LEAST(member_a_id, member_b_id), GREATEST(member_a_id, member_b_id));

CREATE TABLE IF NOT EXISTS member_messages (
  id                SERIAL PRIMARY KEY,
  thread_id         INT NOT NULL REFERENCES member_message_threads(id) ON DELETE CASCADE,
  from_member_id    INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_member_id      INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  body              TEXT NOT NULL,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_thread ON member_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_msg_recipient ON member_messages(to_member_id, read_at);

-- RLS: members can only see threads + messages where they're a participant
ALTER TABLE member_message_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_threads_own ON member_message_threads;
CREATE POLICY msg_threads_own ON member_message_threads
  FOR SELECT USING (
    member_a_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR member_b_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );

ALTER TABLE member_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_own ON member_messages;
CREATE POLICY msg_own ON member_messages
  FOR SELECT USING (
    from_member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR to_member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );
DROP POLICY IF EXISTS msg_insert_own ON member_messages;
CREATE POLICY msg_insert_own ON member_messages
  FOR INSERT WITH CHECK (
    from_member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/014_search_vectors.sql
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- 014_search_vectors.sql
--
-- Full-text search via Postgres tsvector generated columns + GIN indexes.
-- Covers: posts · events · books · jobs · consultations · pages.
-- English configuration (no SA-specific dictionary available OOTB — still
-- vastly better than ilike pattern scans).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- POSTS (jsonb content → stringified for FTS)
-- ---------------------------------------------------------------------------
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english'::regconfig, coalesce(excerpt, '')), 'B') ||
      setweight(to_tsvector('english'::regconfig, coalesce(category, '')), 'C') ||
      setweight(to_tsvector('english'::regconfig, coalesce(content::text, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- PAGES
-- ---------------------------------------------------------------------------
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english'::regconfig, coalesce(meta_description, '')), 'B') ||
      setweight(to_tsvector('english'::regconfig, coalesce(content::text, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_pages_search ON pages USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------------
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english'::regconfig, coalesce(venue, '')), 'B') ||
      setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'C') ||
      setweight(to_tsvector('english'::regconfig, coalesce(notes, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- BOOKS
-- ---------------------------------------------------------------------------
-- array_to_string() is STABLE, not IMMUTABLE — it can't be used directly in a
-- generated column. Wrap it in an IMMUTABLE SQL function so the books search
-- vector can still include authors/illustrators/translators.
CREATE OR REPLACE FUNCTION immutable_array_join(arr text[], sep text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
AS $$ SELECT COALESCE(array_to_string(arr, sep), '') $$;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english'::regconfig, coalesce(subtitle, '')), 'A') ||
      setweight(to_tsvector('english'::regconfig, immutable_array_join(author_names, ' ')), 'A') ||
      setweight(to_tsvector('english'::regconfig, immutable_array_join(illustrator_names, ' ')), 'B') ||
      setweight(to_tsvector('english'::regconfig, immutable_array_join(translator_names, ' ')), 'B') ||
      setweight(to_tsvector('english'::regconfig, coalesce(publisher_name, '')), 'B') ||
      setweight(to_tsvector('english'::regconfig, coalesce(genre, '')), 'C') ||
      setweight(to_tsvector('english'::regconfig, coalesce(category, '')), 'C') ||
      setweight(to_tsvector('english'::regconfig, coalesce(language, '')), 'C') ||
      setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_books_search ON books USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- JOBS
-- ---------------------------------------------------------------------------
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english'::regconfig, coalesce(employer_name, '')), 'B') ||
      setweight(to_tsvector('english'::regconfig, coalesce(discipline, '')), 'B') ||
      setweight(to_tsvector('english'::regconfig, coalesce(location, '')), 'C') ||
      setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'D') ||
      setweight(to_tsvector('english'::regconfig, coalesce(requirements, '')), 'D') ||
      setweight(to_tsvector('english'::regconfig, coalesce(benefits, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- CONSULTATIONS
-- ---------------------------------------------------------------------------
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english'::regconfig, coalesce(subject, '')), 'A') ||
      setweight(to_tsvector('english'::regconfig, coalesce(bill_reference, '')), 'B') ||
      setweight(to_tsvector('english'::regconfig, coalesce(council_position, '')), 'C') ||
      setweight(to_tsvector('english'::regconfig, coalesce(body, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_consultations_search ON consultations USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- RPC: unified_search
--
-- Returns a ranked union of matches across all content types.
-- Query string is processed with websearch_to_tsquery so users can write
-- natural queries like `hello "exact phrase" -excluded`.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION unified_search(q TEXT, lim INT DEFAULT 10)
RETURNS TABLE (
  kind TEXT,
  id INT,
  slug TEXT,
  title TEXT,
  snippet TEXT,
  extra JSONB,
  rank REAL
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tsq tsquery;
BEGIN
  tsq := websearch_to_tsquery('english', q);

  RETURN QUERY
  (
    SELECT 'post'::TEXT,
           p.id,
           p.slug,
           p.title,
           COALESCE(p.excerpt, LEFT(p.meta_description, 180)) AS snippet,
           jsonb_build_object(
             'category', p.category,
             'published_at', p.published_at
           ) AS extra,
           ts_rank(p.search_tsv, tsq) AS rank
    FROM posts p
    WHERE p.status = 'published' AND p.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'event'::TEXT,
           e.id,
           NULL::TEXT AS slug,
           e.title,
           LEFT(COALESCE(e.description, ''), 180) AS snippet,
           jsonb_build_object(
             'event_date', e.event_date,
             'venue', e.venue
           ) AS extra,
           ts_rank(e.search_tsv, tsq) AS rank
    FROM events e
    WHERE e.status <> 'draft' AND e.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'book'::TEXT,
           b.id,
           NULL::TEXT AS slug,
           b.title,
           LEFT(COALESCE(b.description, ''), 180) AS snippet,
           jsonb_build_object(
             'authors', b.author_names,
             'language', b.language,
             'category', b.category,
             'cover', b.cover_image_url
           ) AS extra,
           ts_rank(b.search_tsv, tsq) AS rank
    FROM books b
    WHERE b.public = true AND b.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'job'::TEXT,
           j.id,
           j.slug,
           j.title,
           LEFT(COALESCE(j.description, ''), 180) AS snippet,
           jsonb_build_object(
             'employer', j.employer_name,
             'location', j.location,
             'discipline', j.discipline,
             'closes_at', j.closes_at
           ) AS extra,
           ts_rank(j.search_tsv, tsq) AS rank
    FROM jobs j
    WHERE j.status = 'open' AND j.approved = true AND j.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'consultation'::TEXT,
           c.id,
           c.slug,
           c.title,
           LEFT(COALESCE(c.body, c.subject, ''), 180) AS snippet,
           jsonb_build_object(
             'status', c.status,
             'closes_at', c.closes_at,
             'bill_reference', c.bill_reference
           ) AS extra,
           ts_rank(c.search_tsv, tsq) AS rank
    FROM consultations c
    WHERE c.status IN ('open', 'closed', 'responded') AND c.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'page'::TEXT,
           pg.id,
           pg.slug,
           pg.title,
           LEFT(COALESCE(pg.meta_description, ''), 180) AS snippet,
           '{}'::JSONB AS extra,
           ts_rank(pg.search_tsv, tsq) AS rank
    FROM pages pg
    WHERE pg.status = 'published' AND pg.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  ORDER BY rank DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION unified_search(TEXT, INT) TO anon, authenticated;
