begin;

select plan(5);

select ok(
  exists (
    select 1
    from public.clients
    where slug = 'eroll'
      and name = 'Eroll'
      and status = 'active'
  ),
  'development seed creates the Eroll client'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where client_id = '00000000-0000-4000-8000-000000000001'
      and slug = any (array['eroll-hu', 'eroll-ro', 'eroll-hr', 'eroll-eu'])
  ),
  4,
  'development seed creates the four Eroll projects'
);

select is(
  (
    select count(*)::integer
    from public.project_modules pm
    join public.projects p
      on p.id = pm.project_id
    where p.client_id = '00000000-0000-4000-8000-000000000001'
      and pm.overview_enabled = true
      and pm.performance_enabled = true
      and pm.merchant_enabled = true
      and pm.optimizations_enabled = true
      and pm.reports_enabled = true
  ),
  4,
  'development seed enables all V1 modules for seeded Eroll projects'
);

select ok(
  exists (
    select 1
    from auth.users u
    join public.profiles p
      on p.id = u.id
    where u.email = 'agency-admin@example.invalid'
      and p.role = 'agency_admin'
      and p.is_active = true
  ),
  'development seed creates a local agency_admin auth user and profile'
);

select ok(
  exists (
    select 1
    from auth.users u
    join public.profiles p
      on p.id = u.id
    where u.email = 'client-user@example.invalid'
      and p.role = 'client_user'
      and p.client_id = '00000000-0000-4000-8000-000000000001'
      and p.is_active = true
  ),
  'development seed creates a local client_user auth user and profile'
);

select * from finish();

rollback;
