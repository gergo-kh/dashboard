revoke all on function public.set_updated_at() from public;

grant usage on schema public to authenticated, service_role;

grant usage on type public.profile_role to authenticated, service_role;
grant usage on type public.monthly_outcome_type to authenticated, service_role;
grant usage on type public.optimization_status to authenticated, service_role;
grant usage on type public.approval_status to authenticated, service_role;
grant usage on type public.client_action_priority to authenticated, service_role;
grant usage on type public.client_action_status to authenticated, service_role;
grant usage on type public.product_issue_status to authenticated, service_role;
grant usage on type public.report_status to authenticated, service_role;
grant usage on type public.sync_status to authenticated, service_role;

revoke all on table
  public.profiles,
  public.clients,
  public.projects,
  public.project_modules,
  public.integrations,
  public.integration_accounts,
  public.daily_metrics,
  public.monthly_snapshots,
  public.monthly_reviews,
  public.optimization_items,
  public.client_action_items,
  public.merchant_products,
  public.product_daily_metrics,
  public.product_issues,
  public.reports,
  public.sync_runs
from anon;

grant select, insert, update, delete on table
  public.profiles,
  public.clients,
  public.projects,
  public.project_modules,
  public.integrations,
  public.integration_accounts,
  public.daily_metrics,
  public.monthly_snapshots,
  public.monthly_reviews,
  public.optimization_items,
  public.client_action_items,
  public.merchant_products,
  public.product_daily_metrics,
  public.product_issues,
  public.reports,
  public.sync_runs
to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_modules enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_accounts enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.monthly_snapshots enable row level security;
alter table public.monthly_reviews enable row level security;
alter table public.optimization_items enable row level security;
alter table public.client_action_items enable row level security;
alter table public.merchant_products enable row level security;
alter table public.product_daily_metrics enable row level security;
alter table public.product_issues enable row level security;
alter table public.reports enable row level security;
alter table public.sync_runs enable row level security;

create policy "Agency admins can manage profiles"
on public.profiles
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read their own profile"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy "Agency admins can manage clients"
on public.clients
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read their own client"
on public.clients
for select
to authenticated
using (id = (select public.current_client_id()));

create policy "Agency admins can manage projects"
on public.projects
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read their client projects"
on public.projects
for select
to authenticated
using (client_id = (select public.current_client_id()));

create policy "Agency admins can manage project modules"
on public.project_modules
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read accessible project modules"
on public.project_modules
for select
to authenticated
using ((select public.can_access_project(project_id)));

create policy "Agency admins can manage integrations"
on public.integrations
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Agency admins can manage integration accounts"
on public.integration_accounts
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Agency admins can manage daily metrics"
on public.daily_metrics
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read accessible daily metrics"
on public.daily_metrics
for select
to authenticated
using ((select public.can_access_project(project_id)));

create policy "Agency admins can manage monthly snapshots"
on public.monthly_snapshots
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read final monthly snapshots"
on public.monthly_snapshots
for select
to authenticated
using (
  is_final = true
  and (select public.can_access_project(project_id))
);

create policy "Agency admins can manage monthly reviews"
on public.monthly_reviews
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read approved monthly reviews"
on public.monthly_reviews
for select
to authenticated
using (
  status in ('approved', 'published')
  and summary_approved is not null
  and (select public.can_access_project(project_id))
);

create policy "Agency admins can manage optimization items"
on public.optimization_items
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read approved visible optimization items"
on public.optimization_items
for select
to authenticated
using (
  is_client_visible = true
  and approval_status = 'approved'
  and status in ('planned', 'in_progress', 'completed')
  and (select public.can_access_project(project_id))
);

create policy "Agency admins can manage client action items"
on public.client_action_items
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read visible client action items"
on public.client_action_items
for select
to authenticated
using (
  status in ('open', 'in_progress', 'resolved', 'dismissed')
  and (select public.can_access_project(project_id))
);

create policy "Agency admins can manage merchant products"
on public.merchant_products
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read visible merchant products"
on public.merchant_products
for select
to authenticated
using (
  coalesce(approval_status, 'active') not in ('draft', 'hidden')
  and (select public.can_access_project(project_id))
);

create policy "Agency admins can manage product daily metrics"
on public.product_daily_metrics
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read accessible product daily metrics"
on public.product_daily_metrics
for select
to authenticated
using ((select public.can_access_project(project_id)));

create policy "Agency admins can manage product issues"
on public.product_issues
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read visible product issues"
on public.product_issues
for select
to authenticated
using (
  status in ('open', 'in_progress', 'resolved', 'dismissed')
  and (select public.can_access_project(project_id))
);

create policy "Agency admins can manage reports"
on public.reports
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));

create policy "Client users can read approved reports"
on public.reports
for select
to authenticated
using (
  status in ('approved', 'generated', 'published')
  and (select public.can_access_project(project_id))
);

create policy "Agency admins can manage sync runs"
on public.sync_runs
for all
to authenticated
using ((select public.is_agency_admin()))
with check ((select public.is_agency_admin()));
