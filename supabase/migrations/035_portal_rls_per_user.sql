-- ====================================================================
-- CDCC · per-user RLS for portal member self-serve · 2026-05-10
-- ====================================================================
-- Closes the audit gap on member-facing tables. The 034 migration set
-- coarse "any-authenticated read" policies; this layers per-user
-- filtering on the tables that hold a single member's private data:
--   - member_certificates (mine only)
--   - member_payments (mine only)
--   - member_messages (mine only · either as sender or recipient)
--   - event_registrations (mine only when reading from /portal · admin
--     still reads everything because they're checked by the admin
--     layout gate, not by RLS)
--
-- Pattern: each policy resolves the caller's member_id by joining
--          members.auth_user_id = auth.uid(), then filters rows where
--          the table's member_id (or sender/recipient) matches.
-- Admin escape hatch: a separate policy lets users with one of the
--   admin roles (chair/ed/secretary/staff) see all rows.
--
-- Idempotent. Safe to re-run.
-- ====================================================================

-- Helper: a SQL function to resolve the calling user's member_id.
-- Marked stable + security definer so policies can call it safely.
create or replace function current_member_id()
returns integer
language sql
stable
security definer
as $$
  select id from public.members where auth_user_id = auth.uid() limit 1;
$$;

-- Helper: is the caller in an admin-tier role?
create or replace function current_user_is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role in ('chair','ed','secretary','staff')
  );
$$;

-- ── member_certificates · own-only ─────────────────────────────────────

alter table member_certificates enable row level security;

drop policy if exists "Members read own certificates" on member_certificates;
create policy "Members read own certificates"
  on member_certificates for select to authenticated
  using (member_id = current_member_id() or current_user_is_admin());

drop policy if exists "Admin write certificates" on member_certificates;
create policy "Admin write certificates"
  on member_certificates for all to authenticated
  using (current_user_is_admin())
  with check (current_user_is_admin());

-- ── member_payments · own-only ─────────────────────────────────────────

alter table member_payments enable row level security;

drop policy if exists "Members read own payments" on member_payments;
create policy "Members read own payments"
  on member_payments for select to authenticated
  using (member_id = current_member_id() or current_user_is_admin());

drop policy if exists "System inserts payments" on member_payments;
create policy "System inserts payments"
  on member_payments for insert to authenticated
  with check (member_id = current_member_id() or current_user_is_admin());

drop policy if exists "Admin update payments" on member_payments;
create policy "Admin update payments"
  on member_payments for update to authenticated
  using (current_user_is_admin())
  with check (current_user_is_admin());

-- ── member_messages · sender or recipient only ─────────────────────────

alter table member_messages enable row level security;

drop policy if exists "Members read own messages" on member_messages;
create policy "Members read own messages"
  on member_messages for select to authenticated
  using (
    from_member_id = current_member_id()
    or to_member_id = current_member_id()
    or current_user_is_admin()
  );

drop policy if exists "Members send messages" on member_messages;
create policy "Members send messages"
  on member_messages for insert to authenticated
  with check (
    from_member_id = current_member_id() or current_user_is_admin()
  );

drop policy if exists "Members update own messages" on member_messages;
create policy "Members update own messages"
  on member_messages for update to authenticated
  using (
    from_member_id = current_member_id() or current_user_is_admin()
  );

-- ── event_registrations · per-user portal read overrides 034's blanket
--      read. We do this via a more specific policy that takes precedence
--      for the (member-side) read path; admin still reads everything via
--      the OR clause. Anon insert still goes through the policy from 034.
--      Note: dropping/recreating the existing 034 read policy with the
--      tighter rule. ────────────────────────────────────────────────────

drop policy if exists "Allow authenticated read" on event_registrations;
create policy "Allow authenticated read"
  on event_registrations for select to authenticated
  using (
    current_user_is_admin()
    or email = (
      select email from public.members where auth_user_id = auth.uid() limit 1
    )
  );

-- (anon insert + admin update policies from 034 remain unchanged.)

-- ── consultation_responses · per-user read for own responses ────────────

drop policy if exists "Allow authenticated read" on consultation_responses;
create policy "Allow authenticated read"
  on consultation_responses for select to authenticated
  using (
    current_user_is_admin()
    or respondent_email = (
      select email from public.members where auth_user_id = auth.uid() limit 1
    )
    or public  -- public-flagged responses readable by any authenticated user
  );

-- ── PostgREST schema cache reload ──────────────────────────────────────

notify pgrst, 'reload schema';
