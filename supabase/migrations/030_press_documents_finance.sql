-- =====================================================================
-- The Press · Phase E9 · Documents + Finance + Governance
-- 2026-04-22 · CDCC CMS rebuild
--
-- Contracts (with e-signature), Invoices (in + out), Expense claims,
-- Payments, Meetings (agenda + minutes + resolutions + action items).
-- =====================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'contract_state') then
    create type contract_state as enum ('drafted', 'sent', 'partially_signed', 'signed', 'filed', 'expired', 'terminated');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_direction') then
    create type invoice_direction as enum ('incoming', 'outgoing');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_state') then
    create type invoice_state as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'expense_state') then
    create type expense_state as enum ('submitted', 'approved', 'rejected', 'reimbursed');
  end if;
  if not exists (select 1 from pg_type where typname = 'meeting_kind') then
    create type meeting_kind as enum ('board', 'agm', 'committee', 'working_group', 'staff', 'other');
  end if;
end $$;

-- ── Contracts ──────────────────────────────────────────────────
create table if not exists public.press_contracts (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,
  title           text not null,
  kind            text not null default 'general',    -- speaker · venue · vendor · mou · employment · consulting
  counterparty_stakeholder_id uuid references public.press_stakeholders(id),
  counterparty_council_id     uuid references public.press_council_members(id),
  document_asset_id uuid references public.press_assets(id),
  signature_cdcc_user_id uuid references auth.users(id),
  signature_cdcc_at timestamptz,
  signature_counterparty_name text,
  signature_counterparty_at   timestamptz,
  signature_hash  text,                                 -- SHA-256 of signed PDF
  starts_at       date,
  ends_at         date,
  amount          numeric(14, 2),
  currency        text default 'ZAR',
  state           contract_state not null default 'drafted',
  programme_id    uuid references public.press_programmes(id),
  event_id        uuid references public.press_events(id),
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_contracts enable row level security;
drop policy if exists contracts_rw on public.press_contracts;
create policy contracts_rw on public.press_contracts
  for all using (public.press_has_role('chair', 'treasurer', 'secretary', 'ed'))
  with check (public.press_has_role('chair', 'treasurer', 'secretary', 'ed'));

-- ── Invoices ────────────────────────────────────────────────────
create table if not exists public.press_invoices (
  id              uuid primary key default gen_random_uuid(),
  direction       invoice_direction not null,
  invoice_number  text,
  counterparty_stakeholder_id uuid references public.press_stakeholders(id),
  counterparty_name text,
  amount_net      numeric(14, 2) not null default 0,
  tax             numeric(14, 2) not null default 0,
  amount_gross    numeric(14, 2) not null default 0,
  currency        text default 'ZAR',
  issued_at       date,
  due_at          date,
  paid_at         date,
  state           invoice_state not null default 'draft',
  programme_id    uuid references public.press_programmes(id),
  campaign_id     uuid references public.press_campaigns(id),
  event_id        uuid references public.press_events(id),
  contract_id     uuid references public.press_contracts(id),
  document_asset_id uuid references public.press_assets(id),
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_invoices_direction on public.press_invoices (direction, state);
create index if not exists idx_invoices_due on public.press_invoices (due_at);

alter table public.press_invoices enable row level security;
drop policy if exists invoices_rw on public.press_invoices;
create policy invoices_rw on public.press_invoices
  for all using (public.press_has_role('chair', 'treasurer', 'ed'))
  with check (public.press_has_role('chair', 'treasurer', 'ed'));

-- ── Expense claims ────────────────────────────────────────────
create table if not exists public.press_expenses (
  id              uuid primary key default gen_random_uuid(),
  submitter_user_id uuid references auth.users(id),
  title           text not null,
  amount          numeric(14, 2) not null,
  currency        text default 'ZAR',
  incurred_on     date,
  category        text,                               -- travel · catering · printing · other
  programme_id    uuid references public.press_programmes(id),
  event_id        uuid references public.press_events(id),
  receipt_asset_id uuid references public.press_assets(id),
  state           expense_state not null default 'submitted',
  approver_user_id uuid references auth.users(id),
  approved_at     timestamptz,
  reimbursed_at   timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_expenses_state on public.press_expenses (state);
create index if not exists idx_expenses_submitter on public.press_expenses (submitter_user_id, state);

alter table public.press_expenses enable row level security;
drop policy if exists expenses_submitter_read on public.press_expenses;
create policy expenses_submitter_read on public.press_expenses
  for select using (submitter_user_id = auth.uid());
drop policy if exists expenses_finance_rw on public.press_expenses;
create policy expenses_finance_rw on public.press_expenses
  for all using (public.press_has_role('treasurer', 'chair', 'ed'))
  with check (public.press_has_role('treasurer', 'chair', 'ed'));
drop policy if exists expenses_staff_insert on public.press_expenses;
create policy expenses_staff_insert on public.press_expenses
  for insert with check (public.press_has_role('staff', 'ed', 'programme_lead', 'volunteer', 'contributor'));

-- ── Payments (settled lines) ──────────────────────────────────
create table if not exists public.press_payments (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid references public.press_invoices(id),
  expense_id      uuid references public.press_expenses(id),
  amount          numeric(14, 2) not null,
  currency        text default 'ZAR',
  method          text,                               -- eft · card · cash
  reference       text,
  paid_on         date,
  reconciled_at   timestamptz,
  reconciled_by   uuid references auth.users(id),
  notes           text
);

alter table public.press_payments enable row level security;
drop policy if exists payments_rw on public.press_payments;
create policy payments_rw on public.press_payments
  for all using (public.press_has_role('treasurer', 'chair', 'ed'))
  with check (public.press_has_role('treasurer', 'chair', 'ed'));

-- ── Meetings + Resolutions + Action Items ─────────────────────
create table if not exists public.press_meetings (
  id              uuid primary key default gen_random_uuid(),
  kind            meeting_kind not null default 'board',
  title           text not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  venue           text,
  agenda          jsonb default '[]'::jsonb,
  minutes         jsonb default '[]'::jsonb,
  status          text not null default 'scheduled',  -- scheduled · in_progress · concluded · cancelled
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.press_resolutions (
  id              uuid primary key default gen_random_uuid(),
  meeting_id      uuid references public.press_meetings(id) on delete cascade,
  event_outcome_id uuid references public.press_event_outcomes(id) on delete set null,
  title_en        text not null,
  body_en         text,
  moved_by        text,
  seconded_by     text,
  result          text,                                -- passed · rejected · noted · deferred
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists public.press_action_items (
  id              uuid primary key default gen_random_uuid(),
  resolution_id   uuid references public.press_resolutions(id) on delete cascade,
  meeting_id      uuid references public.press_meetings(id) on delete cascade,
  event_outcome_id uuid references public.press_event_outcomes(id) on delete cascade,
  title           text not null,
  owner_user_id   uuid references auth.users(id),
  due_date        date,
  status          text not null default 'open',       -- open · done · dropped · blocked
  completed_at    timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.press_meetings enable row level security;
alter table public.press_resolutions enable row level security;
alter table public.press_action_items enable row level security;

drop policy if exists meetings_rw on public.press_meetings;
create policy meetings_rw on public.press_meetings
  for all using (public.press_has_role('chair', 'secretary', 'treasurer', 'ed'))
  with check (public.press_has_role('chair', 'secretary', 'treasurer', 'ed'));

drop policy if exists resolutions_rw on public.press_resolutions;
create policy resolutions_rw on public.press_resolutions
  for all using (public.press_has_role('chair', 'secretary', 'ed'))
  with check (public.press_has_role('chair', 'secretary', 'ed'));

drop policy if exists action_items_rw on public.press_action_items;
create policy action_items_rw on public.press_action_items
  for all using (public.press_has_role('chair', 'secretary', 'ed', 'programme_lead'))
  with check (public.press_has_role('chair', 'secretary', 'ed', 'programme_lead'));

drop policy if exists action_items_owner_read on public.press_action_items;
create policy action_items_owner_read on public.press_action_items
  for select using (owner_user_id = auth.uid());

-- Audit
drop trigger if exists trg_audit_contracts on public.press_contracts;
create trigger trg_audit_contracts after insert or update or delete on public.press_contracts for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_invoices on public.press_invoices;
create trigger trg_audit_invoices after insert or update or delete on public.press_invoices for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_expenses on public.press_expenses;
create trigger trg_audit_expenses after insert or update or delete on public.press_expenses for each row execute function public.press_audit_row_change();

drop trigger if exists trg_audit_meetings on public.press_meetings;
create trigger trg_audit_meetings after insert or update or delete on public.press_meetings for each row execute function public.press_audit_row_change();

comment on table public.press_contracts is 'The Press · Contracts. Speaker · venue · vendor · MOU. e-signature (SHA hash of signed PDF).';
comment on table public.press_invoices is 'The Press · Invoices (in + out). Sponsor invoicing, vendor bills, programme reimbursements.';
comment on table public.press_expenses is 'The Press · Expense claims. Submit → approve (Treasurer) → reimburse.';
comment on table public.press_meetings is 'The Press · Meetings with agenda + minutes + resolutions + action items.';
