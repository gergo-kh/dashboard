-- Development-only seed data for local Supabase environments.
-- Do not run this against production.
-- No real passwords, API keys, tokens, or personal email addresses are included.

-- Agency admin placeholder:
-- 1. Create a local Supabase Auth user through Supabase Studio/Auth first.
-- 2. Replace the placeholder UUID below with that auth user id.
-- 3. Uncomment the insert when a matching auth.users row exists.
--
-- insert into public.profiles (
--   id,
--   full_name,
--   email,
--   role,
--   client_id,
--   is_active
-- )
-- values (
--   '00000000-0000-4000-8000-000000000100',
--   'Agency Admin Placeholder',
--   'agency.admin@example.invalid',
--   'agency_admin',
--   null,
--   true
-- )
-- on conflict (id) do update
-- set
--   full_name = excluded.full_name,
--   email = excluded.email,
--   role = excluded.role,
--   client_id = excluded.client_id,
--   is_active = excluded.is_active;

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
