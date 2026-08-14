-- Local automated verification for the staging monthly communication workflow fixture.
-- Do not run against hosted Supabase projects unless separately approved for read-only verification.

begin;

do $$
begin
  if (
    select count(*) from public.monthly_reviews
    where id between '92000000-0000-4000-8000-000000000101'::uuid
      and '92000000-0000-4000-8000-000000000104'::uuid
  ) <> 4 then
    raise exception 'Expected four monthly communication fixture reviews.';
  end if;

  if (
    select count(*) from public.monthly_reviews
    where id = '92000000-0000-4000-8000-000000000101'
      and status = 'draft'
      and summary_draft is not null
      and summary_approved is null
      and approved_by is null
      and approved_at is null
  ) <> 1 then
    raise exception 'Expected one draft monthly review without approval metadata.';
  end if;

  if (
    select count(*) from public.monthly_reviews
    where id = '92000000-0000-4000-8000-000000000102'
      and status = 'review'
      and summary_draft is not null
      and summary_approved is null
      and approved_by is null
      and approved_at is null
      and jsonb_array_length(corrective_actions) >= 1
  ) <> 1 then
    raise exception 'Expected one review-state monthly review with corrective action.';
  end if;

  if (
    select count(*) from public.monthly_reviews
    where id = '92000000-0000-4000-8000-000000000103'
      and status = 'approved'
      and summary_approved is not null
      and approved_by = '219ab6cd-06b4-423c-a560-af2c05198f0f'
      and approved_at is not null
  ) <> 1 then
    raise exception 'Expected one approved monthly review with approval metadata.';
  end if;

  if (
    select count(*) from public.monthly_reviews
    where id = '92000000-0000-4000-8000-000000000104'
      and status = 'published'
      and outcome_type = 'focus'
      and summary_approved is not null
      and approved_by = '219ab6cd-06b4-423c-a560-af2c05198f0f'
      and approved_at is not null
      and jsonb_array_length(corrective_actions) >= 1
  ) <> 1 then
    raise exception 'Expected one published focus monthly review with corrective action.';
  end if;

  if (
    select count(*) from public.optimization_items
    where id = '92000000-0000-4000-8000-000000000301'
      and approval_status = 'approved'
      and is_client_visible = true
  ) <> 1 then
    raise exception 'Expected one visible approved optimization item.';
  end if;

  if (
    select count(*) from public.optimization_items
    where id = '92000000-0000-4000-8000-000000000302'
      and approval_status = 'hidden'
      and is_client_visible = false
  ) <> 1 then
    raise exception 'Expected one hidden optimization item.';
  end if;

  if (
    select count(*) from public.client_action_items
    where id = '92000000-0000-4000-8000-000000000401'
      and status = 'draft'
      and resolved_at is null
  ) <> 1 then
    raise exception 'Expected one draft client action item.';
  end if;

  if (
    select count(*) from public.client_action_items
    where id = '92000000-0000-4000-8000-000000000402'
      and status = 'open'
      and due_date = date '2026-12-08'
      and resolved_at is null
  ) <> 1 then
    raise exception 'Expected one visible open client action item.';
  end if;
end
$$;

set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claim.sub', '1e0957db-1b2b-4803-888e-c3e6d5b26d3c', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    '{"sub":"1e0957db-1b2b-4803-888e-c3e6d5b26d3c","role":"authenticated"}',
    true
  );
end
$$;

do $$
begin
  if (
    select count(*) from public.monthly_reviews
    where id in (
      '92000000-0000-4000-8000-000000000101',
      '92000000-0000-4000-8000-000000000102'
    )
  ) <> 0 then
    raise exception 'Client user must not read draft or review monthly reviews.';
  end if;

  if (
    select count(*) from public.monthly_reviews
    where id in (
      '92000000-0000-4000-8000-000000000103',
      '92000000-0000-4000-8000-000000000104'
    )
  ) <> 2 then
    raise exception 'Client user must read approved and published monthly reviews.';
  end if;

  if (
    select count(*) from public.optimization_items
    where id = '92000000-0000-4000-8000-000000000301'
  ) <> 1 then
    raise exception 'Client user must read the visible approved optimization item.';
  end if;

  if (
    select count(*) from public.optimization_items
    where id = '92000000-0000-4000-8000-000000000302'
  ) <> 0 then
    raise exception 'Client user must not read the hidden optimization item.';
  end if;

  if (
    select count(*) from public.client_action_items
    where id = '92000000-0000-4000-8000-000000000401'
  ) <> 0 then
    raise exception 'Client user must not read draft client action items.';
  end if;

  if (
    select count(*) from public.client_action_items
    where id = '92000000-0000-4000-8000-000000000402'
  ) <> 1 then
    raise exception 'Client user must read visible client action items.';
  end if;
end
$$;

reset role;

rollback;
