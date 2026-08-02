begin;

select plan(12);

select ok(
  not has_function_privilege('anon', 'public.is_agency_admin()', 'EXECUTE'),
  'anon cannot execute is_agency_admin'
);

select ok(
  not has_function_privilege('anon', 'public.current_client_id()', 'EXECUTE'),
  'anon cannot execute current_client_id'
);

select ok(
  not has_function_privilege('anon', 'public.can_access_project(uuid)', 'EXECUTE'),
  'anon cannot execute can_access_project'
);

select ok(
  has_function_privilege('authenticated', 'public.is_agency_admin()', 'EXECUTE'),
  'authenticated can execute is_agency_admin'
);

select ok(
  has_function_privilege('authenticated', 'public.current_client_id()', 'EXECUTE'),
  'authenticated can execute current_client_id'
);

select ok(
  has_function_privilege('authenticated', 'public.can_access_project(uuid)', 'EXECUTE'),
  'authenticated can execute can_access_project'
);

select ok(
  has_function_privilege('service_role', 'public.is_agency_admin()', 'EXECUTE'),
  'service_role can execute is_agency_admin'
);

select ok(
  has_function_privilege('service_role', 'public.current_client_id()', 'EXECUTE'),
  'service_role can execute current_client_id'
);

select ok(
  has_function_privilege('service_role', 'public.can_access_project(uuid)', 'EXECUTE'),
  'service_role can execute can_access_project'
);

select ok(
  not has_function_privilege('public', 'public.is_agency_admin()', 'EXECUTE'),
  'PUBLIC cannot execute is_agency_admin'
);

select ok(
  not has_function_privilege('public', 'public.current_client_id()', 'EXECUTE'),
  'PUBLIC cannot execute current_client_id'
);

select ok(
  not has_function_privilege('public', 'public.can_access_project(uuid)', 'EXECUTE'),
  'PUBLIC cannot execute can_access_project'
);

select * from finish();

rollback;
