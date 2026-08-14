-- Local-only cleanup for scripts/verify-staging-dashboard-read-fixtures.sh.
-- Do not run against hosted Supabase projects.

begin;

delete from public.projects
where id = '90000000-0000-4000-8000-000000000011';

delete from public.profiles
where id in (
  '219ab6cd-06b4-423c-a560-af2c05198f0f',
  '1e0957db-1b2b-4803-888e-c3e6d5b26d3c'
);

delete from public.clients
where id = '90000000-0000-4000-8000-000000000001';

delete from auth.users
where id in (
  '219ab6cd-06b4-423c-a560-af2c05198f0f',
  '1e0957db-1b2b-4803-888e-c3e6d5b26d3c'
);

commit;
