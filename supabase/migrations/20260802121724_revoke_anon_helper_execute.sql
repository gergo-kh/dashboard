revoke execute on function public.is_agency_admin() from anon;
revoke execute on function public.current_client_id() from anon;
revoke execute on function public.can_access_project(uuid) from anon;

revoke execute on function public.is_agency_admin() from public;
revoke execute on function public.current_client_id() from public;
revoke execute on function public.can_access_project(uuid) from public;

grant execute on function public.is_agency_admin() to authenticated, service_role;
grant execute on function public.current_client_id() to authenticated, service_role;
grant execute on function public.can_access_project(uuid) to authenticated, service_role;
