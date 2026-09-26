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

-- A signed-in login counts as staff only while its linked profile is active.
create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_accounts s
    join public.users u on u.id = s.user_id
    where s.auth_id = (select auth.uid())
      and coalesce(u.data->>'status', 'active') = 'active'
  );
$$;
revoke all on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_accounts s
    join public.users u on u.id = s.user_id
    where s.auth_id = (select auth.uid())
      and coalesce(u.data->>'status', 'active') = 'active'
      and u.data->>'role' = 'admin'
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

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

-- Only admins may change staff profiles (roles, suspension).
drop policy if exists "staff insert" on public.users;
drop policy if exists "staff update" on public.users;
drop policy if exists "staff delete" on public.users;
drop policy if exists "admin insert" on public.users;
drop policy if exists "admin update" on public.users;
drop policy if exists "admin delete" on public.users;
create policy "admin insert" on public.users for insert to authenticated with check ((select private.is_admin()));
create policy "admin update" on public.users for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin delete" on public.users for delete to authenticated using ((select private.is_admin()));

-- ------------------------------------------------------------------------------
-- Nursing Station, duty shifts and profile photos
-- ------------------------------------------------------------------------------
create or replace function private.my_staff_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select user_id from public.staff_accounts where auth_id = (select auth.uid());
$$;
revoke all on function private.my_staff_id() from public, anon;
grant execute on function private.my_staff_id() to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['care_plans','doctor_orders','nurse_notes','chief_complaints','shift_schedules','shift_endorsements','staff_photos'] loop
    execute format(
      'create table if not exists public.%I (
         id text primary key,
         data jsonb not null,
         updated_at timestamptz not null default now()
       )', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists "staff read" on public.%I', t);
    execute format('create policy "staff read" on public.%I for select to authenticated using ((select private.is_staff()))', t);
  end loop;

  -- Clinical documents: any active staff member can write
  foreach t in array array['care_plans','doctor_orders','nurse_notes','chief_complaints','shift_endorsements'] loop
    execute format('drop policy if exists "staff insert" on public.%I', t);
    execute format('drop policy if exists "staff update" on public.%I', t);
    execute format('drop policy if exists "staff delete" on public.%I', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check ((select private.is_staff()))', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()))', t);
    execute format('create policy "staff delete" on public.%I for delete to authenticated using ((select private.is_staff()))', t);
  end loop;
end $$;

-- Duty shifts: everyone can read, only admins assign or remove
drop policy if exists "admin insert" on public.shift_schedules;
drop policy if exists "admin update" on public.shift_schedules;
drop policy if exists "admin delete" on public.shift_schedules;
create policy "admin insert" on public.shift_schedules for insert to authenticated with check ((select private.is_admin()));
create policy "admin update" on public.shift_schedules for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin delete" on public.shift_schedules for delete to authenticated using ((select private.is_admin()));

-- Profile photos: each staff member manages only their own
drop policy if exists "own insert" on public.staff_photos;
drop policy if exists "own update" on public.staff_photos;
drop policy if exists "own delete" on public.staff_photos;
create policy "own insert" on public.staff_photos for insert to authenticated
  with check ((select private.is_staff()) and id = (select private.my_staff_id()));
create policy "own update" on public.staff_photos for update to authenticated
  using (id = (select private.my_staff_id()))
  with check ((select private.is_staff()) and id = (select private.my_staff_id()));
create policy "own delete" on public.staff_photos for delete to authenticated
  using (id = (select private.my_staff_id()));

-- ------------------------------------------------------------------------------
-- Giving a staff member access
-- ------------------------------------------------------------------------------
-- Normally: sign in as an administrator and use Admin -> Accounts -> Provision
-- Account. That calls the `create-staff-account` Edge Function
-- (supabase/functions/create-staff-account), which creates the login, profile
-- and link. Suspending a profile there removes its data access immediately.
--
-- Bootstrapping the first administrator by hand:
-- 1. Dashboard -> Authentication -> Users -> Add user (tick "Auto Confirm User").
-- 2. insert into public.users (id, data) values ('ADMIN-001', '{"id":"ADMIN-001",
--      "name":"System Administrator","role":"admin","title":"System Administrator",
--      "department":"Administration","avatarInitials":"SA","status":"active"}');
--    insert into public.staff_accounts (auth_id, user_id)
--    select id, 'ADMIN-001' from auth.users where email = 'admin@example.com';
