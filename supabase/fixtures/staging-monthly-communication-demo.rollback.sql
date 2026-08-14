-- Rollback for supabase/fixtures/staging-monthly-communication-demo.sql.
-- Run only against the kh-dashboard-staging Supabase project after explicit approval.

begin;

delete from public.client_action_items
where id in (
  '92000000-0000-4000-8000-000000000401',
  '92000000-0000-4000-8000-000000000402'
);

delete from public.optimization_items
where id in (
  '92000000-0000-4000-8000-000000000301',
  '92000000-0000-4000-8000-000000000302'
);

delete from public.monthly_reviews
where id in (
  '92000000-0000-4000-8000-000000000101',
  '92000000-0000-4000-8000-000000000102',
  '92000000-0000-4000-8000-000000000103',
  '92000000-0000-4000-8000-000000000104'
);

commit;
