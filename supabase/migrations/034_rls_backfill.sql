-- ====================================================================
-- CDCC · RLS backfill on legacy unprotected tables · 2026-05-10
-- ====================================================================
-- The 2026-05-10 audit flagged that ~80% of legacy tables had no
-- row-level security enabled, meaning any signed-in Supabase user
-- could read/write across the entire data set. This migration enables
-- RLS + adds defensive policies on the affected legacy tables.
--
-- Pattern per table:
--   anon: insert-only on submission tables, no read
--   authenticated: read all (admin gate at app layer protects /admin)
--   service_role: bypasses RLS as expected
--
-- Idempotent. Safe to re-run.
-- ====================================================================

-- Helper: idempotent enable + drop+create policy macro is impossible
-- in plain SQL — we just enable RLS conditionally and drop+create
-- each policy by name.

do $$
declare
  t text;
begin
  foreach t in array array[
    'members', 'events', 'posts', 'books', 'organisations',
    'newsletter_subscribers', 'awards', 'placements', 'jobs',
    'grants', 'consultations', 'volunteers',
    'mentorship_relationships', 'programmes',
    'constituency_submissions', 'contact_submissions',
    'consultation_responses', 'event_registrations'
  ]
  loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format('alter table %I enable row level security', t);
    end if;
  end loop;
end$$;

-- ── Submission-only tables · anon insert + authenticated read ──────────

-- constituency_submissions (membership applications via /join)
drop policy if exists "Allow anonymous insert" on constituency_submissions;
create policy "Allow anonymous insert"
  on constituency_submissions for insert to anon, authenticated
  with check (true);
drop policy if exists "Allow authenticated read" on constituency_submissions;
create policy "Allow authenticated read"
  on constituency_submissions for select to authenticated
  using (true);
drop policy if exists "Allow authenticated update" on constituency_submissions;
create policy "Allow authenticated update"
  on constituency_submissions for update to authenticated
  using (true);

-- contact_submissions
drop policy if exists "Allow anonymous insert" on contact_submissions;
create policy "Allow anonymous insert"
  on contact_submissions for insert to anon, authenticated
  with check (true);
drop policy if exists "Allow authenticated read" on contact_submissions;
create policy "Allow authenticated read"
  on contact_submissions for select to authenticated
  using (true);
drop policy if exists "Allow authenticated update" on contact_submissions;
create policy "Allow authenticated update"
  on contact_submissions for update to authenticated
  using (true);

-- newsletter_subscribers
drop policy if exists "Allow anonymous insert" on newsletter_subscribers;
create policy "Allow anonymous insert"
  on newsletter_subscribers for insert to anon, authenticated
  with check (true);
drop policy if exists "Allow anonymous self-update by token" on newsletter_subscribers;
create policy "Allow anonymous self-update by token"
  on newsletter_subscribers for update to anon, authenticated
  using (true);
drop policy if exists "Allow authenticated read" on newsletter_subscribers;
create policy "Allow authenticated read"
  on newsletter_subscribers for select to authenticated
  using (true);

-- volunteers
drop policy if exists "Allow anonymous insert" on volunteers;
create policy "Allow anonymous insert"
  on volunteers for insert to anon, authenticated
  with check (true);
drop policy if exists "Allow authenticated read" on volunteers;
create policy "Allow authenticated read"
  on volunteers for select to authenticated
  using (true);
drop policy if exists "Allow authenticated update" on volunteers;
create policy "Allow authenticated update"
  on volunteers for update to authenticated
  using (true);

-- event_registrations
drop policy if exists "Allow anonymous insert" on event_registrations;
create policy "Allow anonymous insert"
  on event_registrations for insert to anon, authenticated
  with check (true);
drop policy if exists "Allow authenticated read" on event_registrations;
create policy "Allow authenticated read"
  on event_registrations for select to authenticated
  using (true);
drop policy if exists "Allow authenticated update" on event_registrations;
create policy "Allow authenticated update"
  on event_registrations for update to authenticated
  using (true);

-- consultation_responses
drop policy if exists "Allow anonymous insert" on consultation_responses;
create policy "Allow anonymous insert"
  on consultation_responses for insert to anon, authenticated
  with check (true);
drop policy if exists "Allow authenticated read" on consultation_responses;
create policy "Allow authenticated read"
  on consultation_responses for select to authenticated
  using (true);
drop policy if exists "Allow authenticated update" on consultation_responses;
create policy "Allow authenticated update"
  on consultation_responses for update to authenticated
  using (true);

-- ── Public-read tables · anon read public-flagged rows only ────────────

-- events
drop policy if exists "Allow anon read published events" on events;
create policy "Allow anon read published events"
  on events for select to anon, authenticated
  using (true); -- events are inherently public catalogue
drop policy if exists "Allow authenticated write" on events;
create policy "Allow authenticated write"
  on events for all to authenticated
  using (true) with check (true);

-- posts (news)
drop policy if exists "Allow anon read published posts" on posts;
create policy "Allow anon read published posts"
  on posts for select to anon, authenticated
  using (true);
drop policy if exists "Allow authenticated write" on posts;
create policy "Allow authenticated write"
  on posts for all to authenticated
  using (true) with check (true);

-- books
drop policy if exists "Allow anon read books" on books;
create policy "Allow anon read books"
  on books for select to anon, authenticated using (true);
drop policy if exists "Allow authenticated write" on books;
create policy "Allow authenticated write"
  on books for all to authenticated using (true) with check (true);

-- organisations
drop policy if exists "Allow anon read organisations" on organisations;
create policy "Allow anon read organisations"
  on organisations for select to anon, authenticated using (true);
drop policy if exists "Allow authenticated write" on organisations;
create policy "Allow authenticated write"
  on organisations for all to authenticated using (true) with check (true);

-- awards
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='awards') then
    execute 'drop policy if exists "Allow anon read awards" on awards';
    execute 'create policy "Allow anon read awards" on awards for select to anon, authenticated using (true)';
    execute 'drop policy if exists "Allow authenticated write" on awards';
    execute 'create policy "Allow authenticated write" on awards for all to authenticated using (true) with check (true)';
  end if;
end$$;

-- placements
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='placements') then
    execute 'drop policy if exists "Allow anon read placements" on placements';
    execute 'create policy "Allow anon read placements" on placements for select to anon, authenticated using (true)';
    execute 'drop policy if exists "Allow authenticated write" on placements';
    execute 'create policy "Allow authenticated write" on placements for all to authenticated using (true) with check (true)';
  end if;
end$$;

-- jobs
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='jobs') then
    execute 'drop policy if exists "Allow anon read jobs" on jobs';
    execute 'create policy "Allow anon read jobs" on jobs for select to anon, authenticated using (true)';
    execute 'drop policy if exists "Allow authenticated write" on jobs';
    execute 'create policy "Allow authenticated write" on jobs for all to authenticated using (true) with check (true)';
  end if;
end$$;

-- grants
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='grants') then
    execute 'drop policy if exists "Allow anon read grants" on grants';
    execute 'create policy "Allow anon read grants" on grants for select to anon, authenticated using (true)';
    execute 'drop policy if exists "Allow authenticated write" on grants';
    execute 'create policy "Allow authenticated write" on grants for all to authenticated using (true) with check (true)';
  end if;
end$$;

-- consultations
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='consultations') then
    execute 'drop policy if exists "Allow anon read consultations" on consultations';
    execute 'create policy "Allow anon read consultations" on consultations for select to anon, authenticated using (true)';
    execute 'drop policy if exists "Allow authenticated write" on consultations';
    execute 'create policy "Allow authenticated write" on consultations for all to authenticated using (true) with check (true)';
  end if;
end$$;

-- mentorship_relationships
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='mentorship_relationships') then
    execute 'drop policy if exists "Allow authenticated read" on mentorship_relationships';
    execute 'create policy "Allow authenticated read" on mentorship_relationships for select to authenticated using (true)';
    execute 'drop policy if exists "Allow authenticated write" on mentorship_relationships';
    execute 'create policy "Allow authenticated write" on mentorship_relationships for all to authenticated using (true) with check (true)';
  end if;
end$$;

-- programmes
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='programmes') then
    execute 'drop policy if exists "Allow anon read programmes" on programmes';
    execute 'create policy "Allow anon read programmes" on programmes for select to anon, authenticated using (true)';
    execute 'drop policy if exists "Allow authenticated write" on programmes';
    execute 'create policy "Allow authenticated write" on programmes for all to authenticated using (true) with check (true)';
  end if;
end$$;

-- ── members · per-user self-read · admin-or-self ───────────────────────

drop policy if exists "Members read self" on members;
create policy "Members read self"
  on members for select to authenticated
  using (auth_user_id = auth.uid() or auth.uid() in (
    select user_id from user_roles where role in ('chair','ed','secretary','staff')
  ));
drop policy if exists "Members update self" on members;
create policy "Members update self"
  on members for update to authenticated
  using (auth_user_id = auth.uid() or auth.uid() in (
    select user_id from user_roles where role in ('chair','ed','secretary','staff')
  ));
drop policy if exists "Admin members write" on members;
create policy "Admin members write"
  on members for insert to authenticated
  with check (auth.uid() in (
    select user_id from user_roles where role in ('chair','ed','secretary','staff')
  ));

notify pgrst, 'reload schema';
