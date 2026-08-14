-- Local-only setup for scripts/verify-staging-dashboard-read-fixtures.sh.
-- Do not run against hosted Supabase projects.

begin;

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '219ab6cd-06b4-423c-a560-af2c05198f0f',
    'authenticated',
    'authenticated',
    'agency-admin-staging@example.invalid',
    'test-password-placeholder',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '1e0957db-1b2b-4803-888e-c3e6d5b26d3c',
    'authenticated',
    'authenticated',
    'client-user-staging@example.invalid',
    'test-password-placeholder',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into public.clients (
  id,
  name,
  slug,
  status
)
values (
  '90000000-0000-4000-8000-000000000001',
  'Staging Teszt Ugyfel',
  'kh-staging-client',
  'active'
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  updated_at = now();

insert into public.profiles (
  id,
  full_name,
  email,
  role,
  client_id,
  is_active
)
values
  (
    '219ab6cd-06b4-423c-a560-af2c05198f0f',
    'Agency Admin Staging',
    'agency-admin-staging@example.invalid',
    'agency_admin',
    null,
    true
  ),
  (
    '1e0957db-1b2b-4803-888e-c3e6d5b26d3c',
    'Client User Staging',
    'client-user-staging@example.invalid',
    'client_user',
    '90000000-0000-4000-8000-000000000001',
    true
  )
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  client_id = excluded.client_id,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.projects (
  id,
  client_id,
  name,
  slug,
  country_code,
  market_label,
  currency_code,
  timezone,
  roas_target,
  report_day,
  assigned_manager_profile_id,
  status
)
values (
  '90000000-0000-4000-8000-000000000011',
  '90000000-0000-4000-8000-000000000001',
  'Staging HU Projekt',
  'kh-staging-hu',
  'HU',
  'Magyarorszag',
  'HUF',
  'Europe/Budapest',
  4.2,
  5,
  '219ab6cd-06b4-423c-a560-af2c05198f0f',
  'active'
)
on conflict (id) do update
set
  client_id = excluded.client_id,
  name = excluded.name,
  slug = excluded.slug,
  country_code = excluded.country_code,
  market_label = excluded.market_label,
  currency_code = excluded.currency_code,
  timezone = excluded.timezone,
  roas_target = excluded.roas_target,
  report_day = excluded.report_day,
  assigned_manager_profile_id = excluded.assigned_manager_profile_id,
  status = excluded.status,
  updated_at = now();

commit;
