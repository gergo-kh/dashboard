-- Local automated rollback verification for the staging monthly communication workflow fixture.
-- Do not run against hosted Supabase projects unless separately approved for read-only verification.

do $$
begin
  if (
    select count(*) from public.client_action_items
    where id in (
      '92000000-0000-4000-8000-000000000401',
      '92000000-0000-4000-8000-000000000402'
    )
  ) <> 0 then
    raise exception 'Expected monthly communication client action fixture rows to be removed.';
  end if;

  if (
    select count(*) from public.optimization_items
    where id in (
      '92000000-0000-4000-8000-000000000301',
      '92000000-0000-4000-8000-000000000302'
    )
  ) <> 0 then
    raise exception 'Expected monthly communication optimization fixture rows to be removed.';
  end if;

  if (
    select count(*) from public.monthly_reviews
    where id between '92000000-0000-4000-8000-000000000101'::uuid
      and '92000000-0000-4000-8000-000000000104'::uuid
  ) <> 0 then
    raise exception 'Expected monthly communication review fixture rows to be removed.';
  end if;
end
$$;
