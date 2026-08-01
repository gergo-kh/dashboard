begin;

select plan(7);

select ok(
  (
    select count(*)
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any (array[
        'profiles',
        'clients',
        'projects',
        'project_modules',
        'integrations',
        'integration_accounts',
        'daily_metrics',
        'monthly_snapshots',
        'monthly_reviews',
        'optimization_items',
        'client_action_items',
        'merchant_products',
        'product_daily_metrics',
        'product_issues',
        'reports',
        'sync_runs'
      ])
  ) = 16,
  'all 16 V1 tables exist'
);

select ok(
  (
    select count(*)
    from pg_type t
    join pg_namespace n
      on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = any (array[
        'profile_role',
        'monthly_outcome_type',
        'optimization_status',
        'approval_status',
        'client_action_priority',
        'client_action_status',
        'product_issue_status',
        'report_status',
        'sync_status'
      ])
  ) = 9,
  'all V1 enum types exist'
);

select ok(
  not exists (
    with expected(source_table, source_column, target_table, target_column) as (
      values
        ('public.profiles', 'id', 'auth.users', 'id'),
        ('public.profiles', 'client_id', 'public.clients', 'id'),
        ('public.projects', 'client_id', 'public.clients', 'id'),
        ('public.projects', 'assigned_manager_profile_id', 'public.profiles', 'id'),
        ('public.project_modules', 'project_id', 'public.projects', 'id'),
        ('public.integrations', 'project_id', 'public.projects', 'id'),
        ('public.integration_accounts', 'integration_id', 'public.integrations', 'id'),
        ('public.daily_metrics', 'project_id', 'public.projects', 'id'),
        ('public.daily_metrics', 'account_id', 'public.integration_accounts', 'id'),
        ('public.monthly_snapshots', 'project_id', 'public.projects', 'id'),
        ('public.monthly_snapshots', 'created_by', 'public.profiles', 'id'),
        ('public.monthly_reviews', 'project_id', 'public.projects', 'id'),
        ('public.monthly_reviews', 'approved_by', 'public.profiles', 'id'),
        ('public.optimization_items', 'project_id', 'public.projects', 'id'),
        ('public.client_action_items', 'project_id', 'public.projects', 'id'),
        ('public.merchant_products', 'project_id', 'public.projects', 'id'),
        ('public.merchant_products', 'integration_account_id', 'public.integration_accounts', 'id'),
        ('public.product_daily_metrics', 'project_id', 'public.projects', 'id'),
        ('public.product_daily_metrics', 'merchant_product_id', 'public.merchant_products', 'id'),
        ('public.product_issues', 'project_id', 'public.projects', 'id'),
        ('public.product_issues', 'merchant_product_id', 'public.merchant_products', 'id'),
        ('public.reports', 'project_id', 'public.projects', 'id'),
        ('public.reports', 'monthly_review_id', 'public.monthly_reviews', 'id'),
        ('public.reports', 'monthly_snapshot_id', 'public.monthly_snapshots', 'id'),
        ('public.sync_runs', 'project_id', 'public.projects', 'id'),
        ('public.sync_runs', 'integration_id', 'public.integrations', 'id')
    ),
    actual as (
      select
        source_ns.nspname || '.' || source_table.relname as source_table,
        source_attr.attname as source_column,
        target_ns.nspname || '.' || target_table.relname as target_table,
        target_attr.attname as target_column
      from pg_constraint c
      join pg_class source_table
        on source_table.oid = c.conrelid
      join pg_namespace source_ns
        on source_ns.oid = source_table.relnamespace
      join pg_class target_table
        on target_table.oid = c.confrelid
      join pg_namespace target_ns
        on target_ns.oid = target_table.relnamespace
      join pg_attribute source_attr
        on source_attr.attrelid = c.conrelid
       and source_attr.attnum = any (c.conkey)
      join pg_attribute target_attr
        on target_attr.attrelid = c.confrelid
       and target_attr.attnum = c.confkey[array_position(c.conkey, source_attr.attnum)]
      where c.contype = 'f'
    )
    select 1
    from expected e
    left join actual a
      on a.source_table = e.source_table
     and a.source_column = e.source_column
     and a.target_table = e.target_table
     and a.target_column = e.target_column
    where a.source_table is null
  ),
  'all expected foreign keys exist'
);

select ok(
  (
    select count(*)
    from pg_trigger t
    join pg_proc p
      on p.oid = t.tgfoid
    join pg_class c
      on c.oid = t.tgrelid
    join pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and p.proname = 'set_updated_at'
      and not t.tgisinternal
  ) = 16,
  'updated_at trigger exists on every V1 table'
);

select ok(
  (
    select count(*)
    from pg_class c
    join pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any (array[
        'profiles',
        'clients',
        'projects',
        'project_modules',
        'integrations',
        'integration_accounts',
        'daily_metrics',
        'monthly_snapshots',
        'monthly_reviews',
        'optimization_items',
        'client_action_items',
        'merchant_products',
        'product_daily_metrics',
        'product_issues',
        'reports',
        'sync_runs'
      ])
      and c.relrowsecurity = true
  ) = 16,
  'RLS is enabled on every V1 table'
);

select ok(
  (
    select count(*)
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (array[
        'is_agency_admin',
        'current_client_id',
        'can_access_project'
      ])
  ) = 3,
  'all RLS helper functions exist'
);

select ok(
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'profiles',
        'clients',
        'projects',
        'project_modules',
        'integrations',
        'integration_accounts',
        'daily_metrics',
        'monthly_snapshots',
        'monthly_reviews',
        'optimization_items',
        'client_action_items',
        'merchant_products',
        'product_daily_metrics',
        'product_issues',
        'reports',
        'sync_runs'
      ])
  ) = 29,
  'all expected V1 RLS policies exist'
);

select * from finish();

rollback;
