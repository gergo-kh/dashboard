begin;

select plan(10);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_metrics'
      and column_name = 'currency_code'
      and is_nullable = 'NO'
  ),
  'daily_metrics stores an explicit currency code'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'integrations_project_provider_unique'
  ),
  'integrations are unique per project and provider'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'daily_metrics'
      and indexname = 'daily_metrics_project_provider_account_date_uidx'
  ),
  'daily_metrics has an account-level idempotency index'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'integrations',
        'integration_accounts',
        'daily_metrics',
        'sync_runs'
      )
      and lower(column_name) = any (
        array[
          'api_key',
          'token',
          'access_token',
          'refresh_token',
          'secret',
          'password',
          'authorization'
        ]
      )
  ),
  0,
  'integration foundation tables do not contain credential columns'
);

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
    '11000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'integration-agency-admin@example.invalid',
    'test-password-placeholder',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'integration-client-user@example.invalid',
    'test-password-placeholder',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.clients (id, name, slug, status)
values
  ('21000000-0000-4000-8000-000000000001', 'Integration Client A', 'integration-client-a', 'active'),
  ('21000000-0000-4000-8000-000000000002', 'Integration Client B', 'integration-client-b', 'active');

insert into public.profiles (id, full_name, email, role, client_id, is_active)
values
  (
    '11000000-0000-4000-8000-000000000001',
    'Integration Agency Admin',
    'integration-agency-admin@example.invalid',
    'agency_admin',
    null,
    true
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    'Integration Client User',
    'integration-client-user@example.invalid',
    'client_user',
    '21000000-0000-4000-8000-000000000001',
    true
  );

insert into public.projects (
  id,
  client_id,
  name,
  slug,
  currency_code,
  timezone,
  status
)
values
  (
    '31000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    'Integration Client A Project',
    'integration-client-a-project',
    'HUF',
    'Europe/Budapest',
    'active'
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000002',
    'Integration Client B Project',
    'integration-client-b-project',
    'EUR',
    'Europe/Budapest',
    'active'
  );

insert into public.integrations (id, project_id, provider, status)
values
  (
    '61000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    'google_ads',
    'connected'
  ),
  (
    '61000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002',
    'google_ads',
    'connected'
  );

insert into public.integration_accounts (
  id,
  integration_id,
  external_account_id,
  external_account_name,
  account_type,
  metadata,
  is_active
)
values
  (
    '62000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000001',
    'local-client-a-google-ads',
    'Local Client A Google Ads',
    'google_ads',
    '{"environment":"local_test_data"}'::jsonb,
    true
  ),
  (
    '62000000-0000-4000-8000-000000000002',
    '61000000-0000-4000-8000-000000000002',
    'local-client-b-google-ads',
    'Local Client B Google Ads',
    'google_ads',
    '{"environment":"local_test_data"}'::jsonb,
    true
  );

insert into public.daily_metrics (
  project_id,
  metric_date,
  provider,
  account_id,
  currency_code,
  spend,
  revenue,
  purchases,
  metadata
)
values
  (
    '31000000-0000-4000-8000-000000000001',
    '2026-07-01',
    'google_ads',
    '62000000-0000-4000-8000-000000000001',
    'HUF',
    1200,
    0,
    4,
    '{"source":"local_test"}'::jsonb
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    '2026-07-01',
    'google_ads',
    '62000000-0000-4000-8000-000000000002',
    'EUR',
    42,
    0,
    1,
    '{"source":"local_test"}'::jsonb
  );

insert into public.sync_runs (
  project_id,
  integration_id,
  sync_type,
  status,
  started_at,
  completed_at,
  metadata
)
values (
  '31000000-0000-4000-8000-000000000001',
  '61000000-0000-4000-8000-000000000001',
  'daily_metrics',
  'success',
  now(),
  now(),
  '{"date_from":"2026-07-01","date_to":"2026-07-01"}'::jsonb
);

set local role authenticated;
do $$
begin
  perform set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    '{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
  );
end
$$;

select lives_ok(
  $$
  insert into public.integrations (project_id, provider, status)
  values ('31000000-0000-4000-8000-000000000001', 'meta_ads', 'planned')
  $$,
  'agency_admin can manage integration metadata'
);

select lives_ok(
  $$
  update public.integration_accounts
  set metadata = '{"environment":"local_test_data","updated":true}'::jsonb
  where id = '62000000-0000-4000-8000-000000000001'
  $$,
  'agency_admin can update integration account metadata'
);

reset role;
set local role authenticated;
do $$
begin
  perform set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000002', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    '{"sub":"11000000-0000-4000-8000-000000000002","role":"authenticated"}',
    true
  );
end
$$;

select is(
  (
    (select count(*)::integer from public.integrations)
    + (select count(*)::integer from public.integration_accounts)
    + (select count(*)::integer from public.sync_runs)
  ),
  0,
  'client_user cannot read internal integration mappings or sync runs'
);

select is(
  (
    select count(*)::integer
    from public.daily_metrics
    where project_id = '31000000-0000-4000-8000-000000000001'
  ),
  1,
  'client_user can read daily metrics for their own project'
);

select is(
  (
    select count(*)::integer
    from public.daily_metrics
    where project_id = '31000000-0000-4000-8000-000000000002'
  ),
  0,
  'client_user cannot read daily metrics for another client project'
);

select throws_ok(
  $$
  insert into public.daily_metrics (
    project_id,
    metric_date,
    provider,
    account_id,
    currency_code,
    spend,
    revenue,
    purchases
  )
  values (
    '31000000-0000-4000-8000-000000000001',
    '2026-07-02',
    'google_ads',
    '62000000-0000-4000-8000-000000000001',
    'huf',
    1,
    0,
    0
  )
  $$,
  '42501',
  null,
  'client_user cannot insert daily metrics even when payload is otherwise shaped'
);

select * from finish();

rollback;
