-- Local automated rollback verification for the staging dashboard read fixture.
-- Do not run against hosted Supabase projects.

do $$
begin
  if (
    select count(*) from public.product_issues
    where id = '91000000-0000-4000-8000-000000000801'
  ) <> 0 then
    raise exception 'Expected fixture product issues to be removed.';
  end if;

  if (
    select count(*) from public.product_daily_metrics
    where id between '91000000-0000-4000-8000-000000000701'::uuid
      and '91000000-0000-4000-8000-000000000704'::uuid
  ) <> 0 then
    raise exception 'Expected fixture product metrics to be removed.';
  end if;

  if (
    select count(*) from public.merchant_products
    where id in (
      '91000000-0000-4000-8000-000000000601',
      '91000000-0000-4000-8000-000000000602'
    )
  ) <> 0 then
    raise exception 'Expected fixture merchant products to be removed.';
  end if;

  if (
    select count(*) from public.reports
    where id = '91000000-0000-4000-8000-000000000501'
  ) <> 0 then
    raise exception 'Expected fixture report to be removed.';
  end if;

  if (
    select count(*) from public.client_action_items
    where id between '91000000-0000-4000-8000-000000000401'::uuid
      and '91000000-0000-4000-8000-000000000403'::uuid
  ) <> 0 then
    raise exception 'Expected fixture client action items to be removed.';
  end if;

  if (
    select count(*) from public.optimization_items
    where id between '91000000-0000-4000-8000-000000000301'::uuid
      and '91000000-0000-4000-8000-000000000304'::uuid
  ) <> 0 then
    raise exception 'Expected fixture optimization items to be removed.';
  end if;

  if (
    select count(*) from public.daily_metrics
    where id between '91000000-0000-4000-8000-000000000201'::uuid
      and '91000000-0000-4000-8000-000000000232'::uuid
  ) <> 0 then
    raise exception 'Expected fixture daily metrics to be removed.';
  end if;

  if (
    select count(*) from public.monthly_reviews
    where id = '91000000-0000-4000-8000-000000000101'
  ) <> 0 then
    raise exception 'Expected fixture monthly review to be removed.';
  end if;
end
$$;
