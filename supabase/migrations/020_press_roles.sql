-- =====================================================================
-- The Press · Phase A0 · role system
-- 2026-04-22 · CDCC CMS rebuild
--
-- Introduces a 10-role model named for CDCC's actual governance shape
-- (not WordPress-generic subscriber/author/editor/admin). Every RLS
-- policy going forward calls `public.press_current_role()` which reads
-- from `user_roles`. Phase A0 only SEEDS the role model — subsequent
-- phases add per-primitive row-level policies that reference it.
--
-- Idempotent. Safe to run multiple times.
-- =====================================================================

-- ── Role enum ─────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'press_role') then
    create type press_role as enum (
      'chair',
      'treasurer',
      'secretary',
      'ed',
      'programme_lead',
      'contributor',
      'council_member',
      'jury_member',
      'volunteer',
      'staff'
    );
  end if;
end $$;

-- ── user_roles · binds a Supabase auth user to one Press role ────
create table if not exists public.user_roles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  role           press_role not null,
  -- Optional scope: Programme Leads are scoped to a programme_id; Jury
  -- Members to a jury_id; both are populated once those tables exist in
  -- later phases. NULL = cluster-wide for ED/Chair/Treasurer/Secretary.
  scope_programme_id uuid null,
  scope_jury_id      uuid null,
  assigned_by    uuid references auth.users(id),
  assigned_at    timestamptz not null default now(),
  notes          text
);

create index if not exists idx_user_roles_role on public.user_roles (role);
create index if not exists idx_user_roles_programme on public.user_roles (scope_programme_id);

-- ── Helper · current user's Press role ───────────────────────────
-- Callable from RLS policies (security invoker). Returns NULL if not
-- signed in or not yet assigned.
create or replace function public.press_current_role()
returns press_role
language sql
stable
security invoker
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;

-- ── Helper · does current user have one of the given roles? ──────
create or replace function public.press_has_role(variadic roles press_role[])
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role = any(roles)
  );
$$;

-- ── Helper · programme scope ──────────────────────────────────────
-- Returns true if current user is a Programme Lead scoped to the given
-- programme, OR if they have cluster-wide privilege (chair / ed).
create or replace function public.press_can_access_programme(p_programme_id uuid)
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and (
        role in ('chair', 'ed', 'treasurer', 'secretary')
        or (role = 'programme_lead' and scope_programme_id = p_programme_id)
      )
  );
$$;

-- ── RLS on user_roles itself ─────────────────────────────────────
alter table public.user_roles enable row level security;

drop policy if exists user_roles_self_read on public.user_roles;
create policy user_roles_self_read on public.user_roles
  for select using (user_id = auth.uid() or public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists user_roles_chair_ed_write on public.user_roles;
create policy user_roles_chair_ed_write on public.user_roles
  for all using (public.press_has_role('chair', 'ed')) with check (public.press_has_role('chair', 'ed'));

-- ── Bootstrap · assign the first signed-in admin as ED ──────────
-- If there are ZERO user_roles rows yet, the next auth.users insert
-- should get an ED role automatically so the shell is reachable.
-- This is a one-time bootstrap trigger; remove in production after
-- the first admin is seeded.
create or replace function public.press_bootstrap_first_admin()
returns trigger
language plpgsql
security definer
as $$
begin
  if (select count(*) from public.user_roles) = 0 then
    insert into public.user_roles (user_id, role, notes)
    values (new.id, 'ed', 'Auto-assigned as first admin (press_bootstrap_first_admin).');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_press_bootstrap_first_admin on auth.users;
create trigger trg_press_bootstrap_first_admin
  after insert on auth.users
  for each row execute function public.press_bootstrap_first_admin();

-- ── Comment on the table for discoverability ────────────────────
comment on table public.user_roles is
  'The Press · role registry. One row per admin user. See lib/press/roles.ts for the canonical enum + capability matrix.';
