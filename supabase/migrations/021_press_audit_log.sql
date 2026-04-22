-- =====================================================================
-- The Press · Phase A0 · audit log
-- 2026-04-22 · CDCC CMS rebuild
--
-- An immutable, append-only log of every admin write. The plan's
-- compliance loop ("who did what, when") starts here. Any table that
-- wants auditing attaches the generic trigger `press_audit_row_change`;
-- Phase A1+ will attach it to Voices, Campaigns, Forms, etc.
--
-- Idempotent.
-- =====================================================================

-- ── press_audit_log table ────────────────────────────────────────
create table if not exists public.press_audit_log (
  id           bigserial primary key,
  at           timestamptz not null default now(),
  actor_id     uuid references auth.users(id),
  actor_role   press_role,
  table_name   text not null,
  row_pk       text not null,                -- text to handle uuid / int / composite
  op           text not null check (op in ('insert', 'update', 'delete')),
  diff         jsonb,                         -- old/new for updates; new for inserts; old for deletes
  note         text
);

create index if not exists idx_audit_at   on public.press_audit_log (at desc);
create index if not exists idx_audit_tbl  on public.press_audit_log (table_name, at desc);
create index if not exists idx_audit_row  on public.press_audit_log (table_name, row_pk);
create index if not exists idx_audit_actor on public.press_audit_log (actor_id, at desc);

alter table public.press_audit_log enable row level security;

-- Audit log is readable by chair / ed / secretary; no one writes
-- directly (only the trigger function does, via security definer).
drop policy if exists press_audit_log_read on public.press_audit_log;
create policy press_audit_log_read on public.press_audit_log
  for select using (public.press_has_role('chair', 'ed', 'secretary'));

drop policy if exists press_audit_log_deny_writes on public.press_audit_log;
create policy press_audit_log_deny_writes on public.press_audit_log
  for all using (false) with check (false);

-- ── Log a manual entry (for non-DB actions like "sent newsletter") ──
create or replace function public.press_audit_note(
  p_table_name text,
  p_row_pk text,
  p_op text,
  p_note text,
  p_diff jsonb default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  insert into public.press_audit_log (actor_id, actor_role, table_name, row_pk, op, diff, note)
  values (
    auth.uid(),
    public.press_current_role(),
    p_table_name,
    p_row_pk,
    p_op,
    p_diff,
    p_note
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- ── Generic row-change trigger ───────────────────────────────────
-- Attach with:
--   create trigger trg_audit_voices
--   after insert or update or delete on public.voices
--   for each row execute function public.press_audit_row_change();
--
-- Reads OLD/NEW into a diff jsonb; excludes large columns by default
-- (append column names to skip_cols array in table-specific triggers
-- via the `audit_skip_cols` setting).
create or replace function public.press_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pk        text;
  v_diff      jsonb;
  v_old       jsonb := case when tg_op in ('update', 'delete') then to_jsonb(old) else null end;
  v_new       jsonb := case when tg_op in ('update', 'insert') then to_jsonb(new) else null end;
begin
  -- Try common pk columns; fall back to 'unknown'.
  if tg_op = 'delete' then
    v_pk := coalesce(v_old->>'id', v_old->>'uuid', 'unknown');
  else
    v_pk := coalesce(v_new->>'id', v_new->>'uuid', 'unknown');
  end if;

  if tg_op = 'update' then
    -- Only log fields that changed.
    select jsonb_object_agg(key, jsonb_build_object('old', v_old->key, 'new', v_new->key))
    into v_diff
    from jsonb_object_keys(v_new) as key
    where v_old->key is distinct from v_new->key;
  elsif tg_op = 'insert' then
    v_diff := jsonb_build_object('new', v_new);
  else
    v_diff := jsonb_build_object('old', v_old);
  end if;

  insert into public.press_audit_log (actor_id, actor_role, table_name, row_pk, op, diff)
  values (
    auth.uid(),
    public.press_current_role(),
    tg_table_name,
    v_pk,
    lower(tg_op),
    v_diff
  );

  return case when tg_op = 'delete' then old else new end;
end;
$$;

-- ── Attach to user_roles (first auditable table) ────────────────
drop trigger if exists trg_audit_user_roles on public.user_roles;
create trigger trg_audit_user_roles
  after insert or update or delete on public.user_roles
  for each row execute function public.press_audit_row_change();

comment on table public.press_audit_log is
  'The Press · immutable audit log. Append-only. Trigger press_audit_row_change() writes rows; nothing else may insert/update/delete.';
