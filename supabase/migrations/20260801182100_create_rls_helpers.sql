create or replace function public.is_agency_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'agency_admin'
      and is_active = true
  );
$$;

create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select client_id
  from public.profiles
  where id = (select auth.uid())
    and is_active = true
  limit 1;
$$;

create or replace function public.can_access_project(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
      and p.role = 'agency_admin'
  )
  or exists (
    select 1
    from public.profiles p
    join public.projects pr
      on pr.client_id = p.client_id
    where p.id = (select auth.uid())
      and p.is_active = true
      and p.role = 'client_user'
      and pr.id = project_uuid
  );
$$;

revoke all on function public.is_agency_admin() from public;
revoke all on function public.current_client_id() from public;
revoke all on function public.can_access_project(uuid) from public;

grant execute on function public.is_agency_admin() to authenticated, service_role;
grant execute on function public.current_client_id() to authenticated, service_role;
grant execute on function public.can_access_project(uuid) to authenticated, service_role;
