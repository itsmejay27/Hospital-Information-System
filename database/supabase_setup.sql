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
-- Roles, append-only audit log, profile change approvals, public staff directory
-- ------------------------------------------------------------------------------
-- Roles: doctor, nurse, staff (front desk), admin, medtech (RMT), radtech (RRT), radiologist,
-- pharmacy, finance (CFO), legal. Stored in users.data->>'role'.
create or replace function private.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.data->>'role'
  from public.staff_accounts s
  join public.users u on u.id = s.user_id
  where s.auth_id = (select auth.uid())
    and coalesce(u.data->>'status', 'active') = 'active';
$$;
revoke all on function private.my_role() from public, anon;
grant execute on function private.my_role() to authenticated;

-- Audit log: any active staff member can add an entry; nobody can edit or delete
-- one; only administrators and legal counsel can read it.
drop policy if exists "staff read" on public.audit_logs;
drop policy if exists "staff update" on public.audit_logs;
drop policy if exists "staff delete" on public.audit_logs;
drop policy if exists "admin legal read" on public.audit_logs;
create policy "admin legal read" on public.audit_logs for select to authenticated
  using ((select private.my_role()) in ('admin', 'legal'));
-- Remove the sample entries that older versions of the app wrote on first run.
delete from public.audit_logs
where id in ('AUD-989','AUD-990','AUD-991','AUD-992','AUD-993','AUD-994','AUD-995','AUD-996');

-- Profile change requests: staff submit changes to their own profile; an
-- administrator approves (and applies them) or rejects.
create table if not exists public.profile_requests (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.profile_requests enable row level security;
revoke all on public.profile_requests from anon;
drop policy if exists "own or admin read" on public.profile_requests;
drop policy if exists "own insert" on public.profile_requests;
drop policy if exists "admin update" on public.profile_requests;
drop policy if exists "own cancel" on public.profile_requests;
create policy "own or admin read" on public.profile_requests for select to authenticated
  using (data->>'userId' = (select private.my_staff_id()) or (select private.is_admin()));
create policy "own insert" on public.profile_requests for insert to authenticated
  with check ((select private.is_staff()) and data->>'userId' = (select private.my_staff_id()) and data->>'status' = 'Pending');
create policy "admin update" on public.profile_requests for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "own cancel" on public.profile_requests for delete to authenticated
  using (data->>'userId' = (select private.my_staff_id()) and data->>'status' = 'Pending');

-- Public staff directory ("Doctors & Staff" page): readable by website visitors,
-- managed only by administrators. Holds name, title, department and photo only.
create table if not exists public.public_directory (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.public_directory enable row level security;
grant select on public.public_directory to anon, authenticated;
drop policy if exists "public read" on public.public_directory;
drop policy if exists "admin insert" on public.public_directory;
drop policy if exists "admin update" on public.public_directory;
drop policy if exists "admin delete" on public.public_directory;
create policy "public read" on public.public_directory for select to anon, authenticated using (true);
create policy "admin insert" on public.public_directory for insert to authenticated with check ((select private.is_admin()));
create policy "admin update" on public.public_directory for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin delete" on public.public_directory for delete to authenticated using ((select private.is_admin()));

-- License numbers: no two active staff may share one (compared by digits only).
-- Placeholder values such as "PRC Lic. #00" are cleared so they can be re-entered.
update public.users
set data = data - 'licenseNumber'
where data ? 'licenseNumber'
  and regexp_replace(coalesce(data->>'licenseNumber', ''), '\D', '', 'g') ~ '^0*$';
create unique index if not exists users_unique_license
  on public.users ((regexp_replace(data->>'licenseNumber', '\D', '', 'g')))
  where regexp_replace(coalesce(data->>'licenseNumber', ''), '\D', '', 'g') <> ''
    and coalesce(data->>'status', 'active') <> 'suspended';

-- Imaging files (X-ray / CT / ultrasound images uploaded by Radiologic Technologists).
-- Every active staff member can view them; only technologists can add; nobody edits or deletes.
create table if not exists public.imaging_files (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.imaging_files enable row level security;
revoke all on public.imaging_files from anon;
drop policy if exists "staff read" on public.imaging_files;
drop policy if exists "radtech insert" on public.imaging_files;
create policy "staff read" on public.imaging_files for select to authenticated using ((select private.is_staff()));
create policy "radtech insert" on public.imaging_files for insert to authenticated
  with check ((select private.my_role()) = 'radtech');

-- Pharmacy stock, billing, incident reports, data privacy requests, appointments
do $$
declare t text;
begin
  foreach t in array array['pharmacy_stock','bills','incident_reports','privacy_requests','appointments'] loop
    execute format('create table if not exists public.%I (id text primary key, data jsonb not null, updated_at timestamptz not null default now())', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Medicine stock: all staff can see it; only pharmacy changes it
drop policy if exists "staff read" on public.pharmacy_stock;
drop policy if exists "pharmacy insert" on public.pharmacy_stock;
drop policy if exists "pharmacy update" on public.pharmacy_stock;
create policy "staff read" on public.pharmacy_stock for select to authenticated using ((select private.is_staff()));
create policy "pharmacy insert" on public.pharmacy_stock for insert to authenticated with check ((select private.my_role()) = 'pharmacy');
create policy "pharmacy update" on public.pharmacy_stock for update to authenticated
  using ((select private.my_role()) = 'pharmacy') with check ((select private.my_role()) = 'pharmacy');

-- Bills: finance and front desk (cashier) work on them; admin and legal can read
drop policy if exists "billing read" on public.bills;
drop policy if exists "billing insert" on public.bills;
drop policy if exists "billing update" on public.bills;
create policy "billing read" on public.bills for select to authenticated
  using ((select private.my_role()) in ('finance','staff','admin','legal'));
create policy "billing insert" on public.bills for insert to authenticated with check ((select private.my_role()) in ('finance','staff'));
create policy "billing update" on public.bills for update to authenticated
  using ((select private.my_role()) in ('finance','staff')) with check ((select private.my_role()) in ('finance','staff'));

-- Incident reports: anyone files (as themselves) and sees their own; legal/admin see and update all
drop policy if exists "own or legal read" on public.incident_reports;
drop policy if exists "staff file" on public.incident_reports;
drop policy if exists "legal update" on public.incident_reports;
create policy "own or legal read" on public.incident_reports for select to authenticated
  using (data->>'reporterId' = (select private.my_staff_id()) or (select private.my_role()) in ('legal','admin'));
create policy "staff file" on public.incident_reports for insert to authenticated
  with check ((select private.is_staff()) and data->>'reporterId' = (select private.my_staff_id()) and data->>'status' = 'Open');
create policy "legal update" on public.incident_reports for update to authenticated
  using ((select private.my_role()) in ('legal','admin')) with check ((select private.my_role()) in ('legal','admin'));

-- Data privacy requests: legal counsel and admin only
drop policy if exists "legal read" on public.privacy_requests;
drop policy if exists "legal insert" on public.privacy_requests;
drop policy if exists "legal update" on public.privacy_requests;
create policy "legal read" on public.privacy_requests for select to authenticated using ((select private.my_role()) in ('legal','admin'));
create policy "legal insert" on public.privacy_requests for insert to authenticated with check ((select private.my_role()) in ('legal','admin'));
create policy "legal update" on public.privacy_requests for update to authenticated
  using ((select private.my_role()) in ('legal','admin')) with check ((select private.my_role()) in ('legal','admin'));

-- Appointments: all staff can see; front desk books; doctors can mark their visits completed
drop policy if exists "staff read" on public.appointments;
drop policy if exists "desk insert" on public.appointments;
drop policy if exists "desk update" on public.appointments;
create policy "staff read" on public.appointments for select to authenticated using ((select private.is_staff()));
create policy "desk insert" on public.appointments for insert to authenticated with check ((select private.my_role()) in ('staff','doctor'));
create policy "desk update" on public.appointments for update to authenticated
  using ((select private.my_role()) in ('staff','doctor')) with check ((select private.my_role()) in ('staff','doctor'));

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
