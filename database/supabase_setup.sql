-- ==============================================================================
-- CarePoint Medical Center — Supabase setup for the web app
-- ==============================================================================
-- The app stores each record as-is in a `data` jsonb column, one table per
-- store (see src/services/db.ts). Only signed-in Supabase Auth users that an
-- administrator has linked in `staff_accounts` can read or write anything.
-- Safe to re-run. Already applied to the "Carepoint" project.
-- ==============================================================================

-- Links a Supabase Auth login to a CarePoint staff profile (users.id, e.g. 'D-001').
create table if not exists public.staff_accounts (
  auth_id uuid primary key references auth.users(id) on delete cascade,
  user_id text not null unique,
  created_at timestamptz not null default now()
);
alter table public.staff_accounts enable row level security;
drop policy if exists "read own staff link" on public.staff_accounts;
create policy "read own staff link" on public.staff_accounts
  for select to authenticated using (auth_id = (select auth.uid()));
revoke all on public.staff_accounts from anon;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff_accounts where auth_id = (select auth.uid()));
$$;
revoke all on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;

do $$
declare
  t text;
  tables text[] := array[
    'patients','opd_queue','health_records','medication_orders','diagnostic_results',
    'treatment_logs','admission_entries','opd_referrals','opd_discharges',
    'philhealth_claims','visitor_logs','audit_logs','hospital_config','users'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create table if not exists public.%I (
         id text primary key,
         data jsonb not null,
         updated_at timestamptz not null default now()
       )', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "staff read" on public.%I', t);
    execute format('drop policy if exists "staff insert" on public.%I', t);
    execute format('drop policy if exists "staff update" on public.%I', t);
    execute format('drop policy if exists "staff delete" on public.%I', t);
    execute format('create policy "staff read" on public.%I for select to authenticated using ((select private.is_staff()))', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check ((select private.is_staff()))', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()))', t);
    execute format('create policy "staff delete" on public.%I for delete to authenticated using ((select private.is_staff()))', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- ------------------------------------------------------------------------------
-- Giving a staff member access
-- ------------------------------------------------------------------------------
-- 1. Supabase Dashboard -> Authentication -> Users -> Add user -> Create new user
--    (enter email + password, tick "Auto Confirm User").
-- 2. Link that login to a staff profile id from src/mockData.ts (DEMO_USERS),
--    e.g. D-001 = Dr. Jacobe, admin = the Hospital Administrator:
--
--    insert into public.staff_accounts (auth_id, user_id)
--    select id, 'D-001' from auth.users where email = 'doctor@example.com';
--
-- Removing access: delete from public.staff_accounts where user_id = 'D-001';
