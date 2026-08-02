-- Development-only seed data for local Supabase environments.
-- Do not run this against production.
-- No real passwords, API keys, tokens, or personal email addresses are included.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  phone_change_token,
  reauthentication_token,
  email_change_token_current,
  email_change_confirm_status,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user,
  is_anonymous,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000101',
    'authenticated',
    'authenticated',
    'agency-admin@example.invalid',
    extensions.crypt('LocalAgencyPass123!', extensions.gen_salt('bf', 10)),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email":"agency-admin@example.invalid","email_verified":true,"phone_verified":false,"sub":"00000000-0000-4000-8000-000000000101"}'::jsonb,
    false,
    false,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000102',
    'authenticated',
    'authenticated',
    'client-user@example.invalid',
    extensions.crypt('LocalClientPass123!', extensions.gen_salt('bf', 10)),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email":"client-user@example.invalid","email_verified":true,"phone_verified":false,"sub":"00000000-0000-4000-8000-000000000102"}'::jsonb,
    false,
    false,
    now(),
    now()
  )
on conflict (id) do update
set
  instance_id = excluded.instance_id,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  phone_change = excluded.phone_change,
  phone_change_token = excluded.phone_change_token,
  reauthentication_token = excluded.reauthentication_token,
  email_change_token_current = excluded.email_change_token_current,
  email_change_confirm_status = excluded.email_change_confirm_status,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000101',
    '{"sub":"00000000-0000-4000-8000-000000000101","email":"agency-admin@example.invalid","email_verified":false,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000102',
    '{"sub":"00000000-0000-4000-8000-000000000102","email":"client-user@example.invalid","email_verified":false,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do update
set
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;

insert into public.clients (
  id,
  name,
  slug,
  status
)
values (
  '00000000-0000-4000-8000-000000000001',
  'Eroll',
  'eroll',
  'active'
)
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status;

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
    '00000000-0000-4000-8000-000000000101',
    'Agency Admin Local',
    'agency-admin@example.invalid',
    'agency_admin',
    null,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    'Client User Local',
    'client-user@example.invalid',
    'client_user',
    '00000000-0000-4000-8000-000000000001',
    true
  )
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  client_id = excluded.client_id,
  is_active = excluded.is_active;

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
  status
)
values
  (
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000001',
    'Eroll HU',
    'eroll-hu',
    'HU',
    'Hungary',
    'HUF',
    'Europe/Budapest',
    null,
    5,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000001',
    'Eroll RO',
    'eroll-ro',
    'RO',
    'Romania',
    'RON',
    'Europe/Bucharest',
    null,
    5,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000001',
    'Eroll HR',
    'eroll-hr',
    'HR',
    'Croatia',
    'EUR',
    'Europe/Zagreb',
    null,
    5,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000014',
    '00000000-0000-4000-8000-000000000001',
    'Eroll EU',
    'eroll-eu',
    null,
    'European Union',
    'EUR',
    'Europe/Budapest',
    null,
    5,
    'active'
  )
on conflict (client_id, slug) do update
set
  name = excluded.name,
  country_code = excluded.country_code,
  market_label = excluded.market_label,
  currency_code = excluded.currency_code,
  timezone = excluded.timezone,
  roas_target = excluded.roas_target,
  report_day = excluded.report_day,
  status = excluded.status;

insert into public.project_modules (
  project_id,
  overview_enabled,
  performance_enabled,
  merchant_enabled,
  optimizations_enabled,
  reports_enabled
)
values
  ('00000000-0000-4000-8000-000000000011', true, true, true, true, true),
  ('00000000-0000-4000-8000-000000000012', true, true, true, true, true),
  ('00000000-0000-4000-8000-000000000013', true, true, true, true, true),
  ('00000000-0000-4000-8000-000000000014', true, true, true, true, true)
on conflict (project_id) do update
set
  overview_enabled = excluded.overview_enabled,
  performance_enabled = excluded.performance_enabled,
  merchant_enabled = excluded.merchant_enabled,
  optimizations_enabled = excluded.optimizations_enabled,
  reports_enabled = excluded.reports_enabled;
