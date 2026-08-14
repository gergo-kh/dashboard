-- Rollback for supabase/fixtures/staging-dashboard-read-demo.sql.
-- Run only against the kh-dashboard-staging Supabase project after explicit approval.

begin;

delete from public.product_issues
where id in (
  '91000000-0000-4000-8000-000000000801'
);

delete from public.product_daily_metrics
where id in (
  '91000000-0000-4000-8000-000000000701',
  '91000000-0000-4000-8000-000000000702',
  '91000000-0000-4000-8000-000000000703',
  '91000000-0000-4000-8000-000000000704'
);

delete from public.merchant_products
where id in (
  '91000000-0000-4000-8000-000000000601',
  '91000000-0000-4000-8000-000000000602'
);

delete from public.reports
where id in (
  '91000000-0000-4000-8000-000000000501'
);

delete from public.client_action_items
where id in (
  '91000000-0000-4000-8000-000000000401',
  '91000000-0000-4000-8000-000000000402',
  '91000000-0000-4000-8000-000000000403'
);

delete from public.optimization_items
where id in (
  '91000000-0000-4000-8000-000000000301',
  '91000000-0000-4000-8000-000000000302',
  '91000000-0000-4000-8000-000000000303',
  '91000000-0000-4000-8000-000000000304'
);

delete from public.daily_metrics
where id between
  '91000000-0000-4000-8000-000000000201'::uuid
  and '91000000-0000-4000-8000-000000000232'::uuid;

delete from public.monthly_reviews
where id in (
  '91000000-0000-4000-8000-000000000101'
);

commit;
