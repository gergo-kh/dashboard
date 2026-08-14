begin;

select plan(18);

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
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'rls-agency-admin@example.invalid',
    'test-password-placeholder',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'rls-client-user@example.invalid',
    'test-password-placeholder',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.clients (id, name, slug, status)
values
  ('20000000-0000-4000-8000-000000000001', 'Client A', 'client-a', 'active'),
  ('20000000-0000-4000-8000-000000000002', 'Client B', 'client-b', 'active');

insert into public.profiles (id, full_name, email, role, client_id, is_active)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'Agency Admin',
    'rls-agency-admin@example.invalid',
    'agency_admin',
    null,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Client User',
    'rls-client-user@example.invalid',
    'client_user',
    '20000000-0000-4000-8000-000000000001',
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
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Client A Project 1',
    'client-a-project-1',
    'HUF',
    'Europe/Budapest',
    'active'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'Client A Project 2',
    'client-a-project-2',
    'HUF',
    'Europe/Budapest',
    'active'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000002',
    'Client B Project',
    'client-b-project',
    'EUR',
    'Europe/Budapest',
    'active'
  );

insert into public.monthly_reviews (
  id,
  project_id,
  period_start,
  period_end,
  summary_draft,
  summary_approved,
  outcome_type,
  status,
  approved_by,
  approved_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '2026-07-01',
    '2026-07-31',
    'Draft text',
    null,
    'mixed',
    'draft',
    null,
    null
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '2026-06-01',
    '2026-06-30',
    'Approved draft',
    'Approved summary',
    'positive',
    'approved',
    '10000000-0000-4000-8000-000000000001',
    now()
  );

insert into public.optimization_items (
  id,
  project_id,
  category,
  title,
  status,
  source,
  is_client_visible,
  approval_status,
  completed_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'google_ads',
    'Approved visible optimization',
    'completed',
    'manual',
    true,
    'approved',
    now()
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    'google_ads',
    'Hidden optimization',
    'completed',
    'manual',
    false,
    'hidden',
    now()
  );

insert into public.integrations (
  id,
  project_id,
  provider,
  status
)
values (
  '60000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'ga4',
  'connected'
);

insert into public.sync_runs (
  id,
  project_id,
  integration_id,
  sync_type,
  status,
  started_at,
  completed_at
)
values (
  '70000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000001',
  'daily_metrics',
  'success',
  now(),
  now()
);

insert into public.merchant_products (
  id,
  project_id,
  external_product_id,
  title,
  gtin,
  approval_status
)
values
  (
    '80000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'VISIBLE-PRODUCT',
    'Visible merchant product',
    '5990000000001',
    'approved'
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    'HIDDEN-PRODUCT',
    'Hidden merchant product',
    null,
    'hidden'
  ),
  (
    '80000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    'OTHER-CLIENT-PRODUCT',
    'Other client merchant product',
    null,
    'approved'
  );

insert into public.product_daily_metrics (
  id,
  project_id,
  merchant_product_id,
  metric_date,
  spend,
  revenue,
  purchases
)
values
  (
    '81000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000001',
    '2026-07-31',
    120000,
    240000,
    4
  ),
  (
    '81000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000002',
    '2026-07-31',
    50000,
    0,
    0
  ),
  (
    '81000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    '80000000-0000-4000-8000-000000000003',
    '2026-07-31',
    999999,
    999999,
    1
  );

insert into public.product_issues (
  id,
  project_id,
  merchant_product_id,
  issue_type,
  severity,
  title,
  status
)
values
  (
    '82000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000001',
    'missing_gtin',
    'high',
    'Visible product issue',
    'open'
  ),
  (
    '82000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000002',
    'feed_quality',
    'high',
    'Hidden product issue',
    'open'
  ),
  (
    '82000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    '80000000-0000-4000-8000-000000000003',
    'performance',
    'critical',
    'Other client product issue',
    'open'
  ),
  (
    '82000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000001',
    'draft_issue',
    'medium',
    'Draft product issue',
    'draft'
  );

set local role authenticated;
do $$
begin
  perform set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
  );
end
$$;

select is(
  (
    select count(*)::integer
    from public.clients
    where id in (
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002'
    )
  ),
  2,
  'agency_admin can read all test clients'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id in (
      '30000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000003'
    )
  ),
  3,
  'agency_admin can read all test projects'
);

select lives_ok(
  $$
  do $do$
  declare
    affected_rows integer;
  begin
    insert into public.monthly_reviews (
      id,
      project_id,
      period_start,
      period_end,
      summary_draft,
      outcome_type,
      status
    )
    values (
      '40000000-0000-4000-8000-000000000003',
      '30000000-0000-4000-8000-000000000002',
      '2026-05-01',
      '2026-05-31',
      'Agency draft',
      'mixed',
      'draft'
    );

    update public.monthly_reviews
    set summary_draft = 'Updated agency draft'
    where id = '40000000-0000-4000-8000-000000000003';

    get diagnostics affected_rows = row_count;
    if affected_rows <> 1 then
      raise exception 'Expected agency update to affect 1 row, affected %', affected_rows;
    end if;
  end
  $do$;
  $$,
  'agency_admin can insert and update agency-managed content'
);

reset role;
set local role authenticated;
do $$
begin
  perform set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',
    true
  );
end
$$;

select is(
  (
    select count(*)::integer
    from public.clients
    where id in (
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002'
    )
  ),
  1,
  'client_user can read their own client'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id in (
      '30000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000003'
    )
  ),
  2,
  'client_user can read every project belonging to their client'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id = '30000000-0000-4000-8000-000000000003'
  ),
  0,
  'client_user cannot read another client project'
);

select is(
  (
    select count(*)::integer
    from public.monthly_reviews
    where id = '40000000-0000-4000-8000-000000000001'
  ),
  0,
  'client_user cannot read draft monthly reviews'
);

select is(
  (
    select count(*)::integer
    from public.monthly_reviews
    where id = '40000000-0000-4000-8000-000000000002'
  ),
  1,
  'client_user can read approved monthly reviews'
);

select lives_ok(
  $$
  do $do$
  declare
    affected_rows integer;
  begin
    update public.monthly_reviews
    set summary_draft = 'Client edit attempt'
    where id = '40000000-0000-4000-8000-000000000002';

    get diagnostics affected_rows = row_count;
    if affected_rows <> 0 then
      raise exception 'Expected client update to affect 0 rows, affected %', affected_rows;
    end if;
  end
  $do$;
  $$,
  'client_user cannot modify monthly reviews'
);

select is(
  (
    (select count(*)::integer from public.integrations)
    + (select count(*)::integer from public.sync_runs)
  ),
  0,
  'client_user cannot read integrations or sync_runs'
);

select is(
  (
    select count(*)::integer
    from public.optimization_items
    where id = '50000000-0000-4000-8000-000000000001'
  ),
  1,
  'client_user can read approved visible optimization items'
);

select is(
  (
    select count(*)::integer
    from public.optimization_items
    where id = '50000000-0000-4000-8000-000000000002'
  ),
  0,
  'client_user cannot read hidden optimization items'
);

select is(
  (
    select count(*)::integer
    from public.merchant_products
    where id = '80000000-0000-4000-8000-000000000001'
  ),
  1,
  'client_user can read visible merchant products for their project'
);

select is(
  (
    select count(*)::integer
    from public.merchant_products
    where id in (
      '80000000-0000-4000-8000-000000000002',
      '80000000-0000-4000-8000-000000000003'
    )
  ),
  0,
  'client_user cannot read hidden or other-client merchant products'
);

select is(
  (
    select count(*)::integer
    from public.product_daily_metrics
    where id = '81000000-0000-4000-8000-000000000001'
  ),
  1,
  'client_user can read product metrics for visible products in their project'
);

select is(
  (
    select count(*)::integer
    from public.product_daily_metrics
    where id in (
      '81000000-0000-4000-8000-000000000002',
      '81000000-0000-4000-8000-000000000003'
    )
  ),
  0,
  'client_user cannot read product metrics for hidden or other-client products'
);

select is(
  (
    select count(*)::integer
    from public.product_issues
    where id = '82000000-0000-4000-8000-000000000001'
  ),
  1,
  'client_user can read active product issues for visible products in their project'
);

select is(
  (
    select count(*)::integer
    from public.product_issues
    where id in (
      '82000000-0000-4000-8000-000000000002',
      '82000000-0000-4000-8000-000000000003',
      '82000000-0000-4000-8000-000000000004'
    )
  ),
  0,
  'client_user cannot read hidden, draft, or other-client product issues'
);

select * from finish();

rollback;
