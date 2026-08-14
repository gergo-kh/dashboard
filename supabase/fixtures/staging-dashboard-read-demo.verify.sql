-- Local automated verification for the staging dashboard read fixture.
-- Do not run against hosted Supabase projects.

do $$
begin
  if (
    select count(*) from public.monthly_reviews
    where id = '91000000-0000-4000-8000-000000000101'
      and status = 'approved'
      and summary_approved is not null
  ) <> 1 then
    raise exception 'Expected one approved fixture monthly review.';
  end if;

  if (
    select count(*) from public.daily_metrics
    where id between '91000000-0000-4000-8000-000000000201'::uuid
      and '91000000-0000-4000-8000-000000000232'::uuid
      and currency_code = 'HUF'
  ) <> 32 then
    raise exception 'Expected 32 fixture daily metrics.';
  end if;

  if (
    select count(*) from public.daily_metrics
    where metadata ->> 'period' = 'current'
  ) <> 16 then
    raise exception 'Expected 16 current fixture daily metrics.';
  end if;

  if (
    select count(*) from public.daily_metrics
    where metadata ->> 'period' = 'comparison'
  ) <> 16 then
    raise exception 'Expected 16 comparison fixture daily metrics.';
  end if;

  if (
    select count(*) from public.optimization_items
    where id between '91000000-0000-4000-8000-000000000301'::uuid
      and '91000000-0000-4000-8000-000000000304'::uuid
      and is_client_visible = true
      and approval_status = 'approved'
  ) <> 4 then
    raise exception 'Expected four visible approved fixture optimization items.';
  end if;

  if (
    select count(*) from public.client_action_items
    where id between '91000000-0000-4000-8000-000000000401'::uuid
      and '91000000-0000-4000-8000-000000000403'::uuid
      and status in ('open', 'in_progress')
  ) <> 3 then
    raise exception 'Expected three visible fixture client action items.';
  end if;

  if (
    select count(*) from public.reports
    where id = '91000000-0000-4000-8000-000000000501'
      and status = 'published'
      and published_at is not null
  ) <> 1 then
    raise exception 'Expected one published fixture report.';
  end if;

  if (
    select count(*) from public.merchant_products
    where id in (
      '91000000-0000-4000-8000-000000000601',
      '91000000-0000-4000-8000-000000000602'
    )
      and approval_status = 'approved'
  ) <> 2 then
    raise exception 'Expected two approved fixture merchant products.';
  end if;

  if (
    select count(*) from public.product_daily_metrics
    where id between '91000000-0000-4000-8000-000000000701'::uuid
      and '91000000-0000-4000-8000-000000000704'::uuid
  ) <> 4 then
    raise exception 'Expected four fixture product daily metrics.';
  end if;

  if (
    select count(*) from public.product_issues
    where id = '91000000-0000-4000-8000-000000000801'
      and status = 'open'
  ) <> 1 then
    raise exception 'Expected one active fixture product issue.';
  end if;
end
$$;
