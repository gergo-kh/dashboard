create table if not exists public.ppc_dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null check (provider in ('google_ads','meta_ads','tiktok_ads')),
  external_account_id text not null,
  as_of_date date not null,
  currency_code text not null default 'HUF',
  spend_7 numeric not null default 0,
  revenue_7 numeric not null default 0,
  purchases_7 numeric not null default 0,
  prev_spend_7 numeric not null default 0,
  prev_revenue_7 numeric not null default 0,
  prev_purchases_7 numeric not null default 0,
  spend_14 numeric not null default 0,
  revenue_14 numeric not null default 0,
  purchases_14 numeric not null default 0,
  prev_spend_14 numeric not null default 0,
  prev_revenue_14 numeric not null default 0,
  prev_purchases_14 numeric not null default 0,
  spend_30 numeric not null default 0,
  revenue_30 numeric not null default 0,
  purchases_30 numeric not null default 0,
  prev_spend_30 numeric not null default 0,
  prev_revenue_30 numeric not null default 0,
  prev_purchases_30 numeric not null default 0,
  mtd_spend numeric not null default 0,
  mtd_revenue numeric not null default 0,
  mtd_purchases numeric not null default 0,
  prev_mtd_spend numeric not null default 0,
  prev_mtd_revenue numeric not null default 0,
  prev_mtd_purchases numeric not null default 0,
  source text not null default 'windsor',
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, provider, as_of_date)
);

create index if not exists ppc_dashboard_snapshots_lookup_idx
  on public.ppc_dashboard_snapshots(as_of_date desc, provider, project_id);

alter table public.ppc_dashboard_snapshots enable row level security;

drop policy if exists "Agency admins can manage PPC snapshots" on public.ppc_dashboard_snapshots;
create policy "Agency admins can manage PPC snapshots"
  on public.ppc_dashboard_snapshots for all to authenticated
  using ((select public.is_agency_admin()))
  with check ((select public.is_agency_admin()));

drop policy if exists "Client users can read accessible PPC snapshots" on public.ppc_dashboard_snapshots;
create policy "Client users can read accessible PPC snapshots"
  on public.ppc_dashboard_snapshots for select to authenticated
  using ((select public.can_access_project(project_id)));

drop trigger if exists set_ppc_dashboard_snapshots_updated_at on public.ppc_dashboard_snapshots;
create trigger set_ppc_dashboard_snapshots_updated_at
before update on public.ppc_dashboard_snapshots
for each row execute function public.set_updated_at();

create or replace function public.ppc_dashboard_overview(
  p_days integer default 30,
  p_provider text default null,
  p_as_of date default (current_date - 1)
)
returns table (
  project_id uuid, client_id uuid, client_name text, project_name text, provider text,
  external_account_id text, currency_code text, monthly_budget numeric,
  target_roas numeric, minimum_roas numeric, target_cpa numeric, maximum_cpa numeric,
  spend numeric, revenue numeric, purchases numeric, roas numeric, cpa numeric,
  prev_spend numeric, prev_revenue numeric, prev_roas numeric, prev_cpa numeric,
  spend_change_pct numeric, revenue_change_pct numeric, roas_change_pct numeric, cpa_change_pct numeric,
  mtd_spend numeric, mtd_revenue numeric, mtd_roas numeric, mtd_cpa numeric,
  prev_mtd_spend numeric, prev_mtd_revenue numeric, prev_mtd_roas numeric, prev_mtd_cpa numeric,
  mtd_spend_change_pct numeric, mtd_revenue_change_pct numeric, mtd_roas_change_pct numeric, mtd_cpa_change_pct numeric,
  status_7d text, status_14d text, status_30d text, overall_status text
)
language sql stable security invoker set search_path=public
as $$
with base as (
  select s.project_id,p.client_id,c.name client_name,p.name project_name,s.provider,s.external_account_id,
    coalesce(x.currency_code,p.currency_code) currency_code,s.monthly_budget,
    coalesce(s.target_roas,p.roas_target) target_roas,s.minimum_roas,s.target_cpa,s.maximum_cpa,
    x.spend_7,x.revenue_7,x.purchases_7,x.prev_spend_7,x.prev_revenue_7,x.prev_purchases_7,
    x.spend_14,x.revenue_14,x.purchases_14,x.prev_spend_14,x.prev_revenue_14,x.prev_purchases_14,
    x.spend_30,x.revenue_30,x.purchases_30,x.prev_spend_30,x.prev_revenue_30,x.prev_purchases_30,
    x.mtd_spend,x.mtd_revenue,x.mtd_purchases,x.prev_mtd_spend,x.prev_mtd_revenue,x.prev_mtd_purchases
  from public.project_platform_settings s
  join public.projects p on p.id=s.project_id and p.status='active'
  join public.clients c on c.id=p.client_id and c.status='active'
  left join public.ppc_dashboard_snapshots x
    on x.project_id=s.project_id and x.provider=s.provider and x.as_of_date=p_as_of
  where s.is_enabled and (p_provider is null or s.provider=p_provider)
), calc as (
  select b.*,
    case p_days when 7 then coalesce(b.spend_7,0) when 14 then coalesce(b.spend_14,0) else coalesce(b.spend_30,0) end cur_spend,
    case p_days when 7 then coalesce(b.revenue_7,0) when 14 then coalesce(b.revenue_14,0) else coalesce(b.revenue_30,0) end cur_revenue,
    case p_days when 7 then coalesce(b.purchases_7,0) when 14 then coalesce(b.purchases_14,0) else coalesce(b.purchases_30,0) end cur_purchases,
    case p_days when 7 then coalesce(b.prev_spend_7,0) when 14 then coalesce(b.prev_spend_14,0) else coalesce(b.prev_spend_30,0) end prv_spend,
    case p_days when 7 then coalesce(b.prev_revenue_7,0) when 14 then coalesce(b.prev_revenue_14,0) else coalesce(b.prev_revenue_30,0) end prv_revenue,
    case p_days when 7 then coalesce(b.prev_purchases_7,0) when 14 then coalesce(b.prev_purchases_14,0) else coalesce(b.prev_purchases_30,0) end prv_purchases,
    case when coalesce(b.spend_7,0)>0 then b.revenue_7/b.spend_7 end roas7,
    case when coalesce(b.purchases_7,0)>0 then b.spend_7/b.purchases_7 end cpa7,
    case when coalesce(b.spend_14,0)>0 then b.revenue_14/b.spend_14 end roas14,
    case when coalesce(b.purchases_14,0)>0 then b.spend_14/b.purchases_14 end cpa14,
    case when coalesce(b.spend_30,0)>0 then b.revenue_30/b.spend_30 end roas30,
    case when coalesce(b.purchases_30,0)>0 then b.spend_30/b.purchases_30 end cpa30
  from base b
), metrics as (
  select c.*,
    case when c.cur_spend>0 then c.cur_revenue/c.cur_spend end cur_roas,
    case when c.cur_purchases>0 then c.cur_spend/c.cur_purchases end cur_cpa,
    case when c.prv_spend>0 then c.prv_revenue/c.prv_spend end prv_roas,
    case when c.prv_purchases>0 then c.prv_spend/c.prv_purchases end prv_cpa,
    case when coalesce(c.mtd_spend,0)>0 then c.mtd_revenue/c.mtd_spend end mroas,
    case when coalesce(c.mtd_purchases,0)>0 then c.mtd_spend/c.mtd_purchases end mcpa,
    case when coalesce(c.prev_mtd_spend,0)>0 then c.prev_mtd_revenue/c.prev_mtd_spend end pmroas,
    case when coalesce(c.prev_mtd_purchases,0)>0 then c.prev_mtd_spend/c.prev_mtd_purchases end pmcpa,
    public.ppc_metric_status(c.roas7,c.cpa7,c.target_roas,c.minimum_roas,c.target_cpa,c.maximum_cpa) s7,
    public.ppc_metric_status(c.roas14,c.cpa14,c.target_roas,c.minimum_roas,c.target_cpa,c.maximum_cpa) s14,
    public.ppc_metric_status(c.roas30,c.cpa30,c.target_roas,c.minimum_roas,c.target_cpa,c.maximum_cpa) s30
  from calc c
)
select m.project_id,m.client_id,m.client_name,m.project_name,m.provider,m.external_account_id,m.currency_code,
  m.monthly_budget,m.target_roas,m.minimum_roas,m.target_cpa,m.maximum_cpa,
  round(m.cur_spend,2),round(m.cur_revenue,2),round(m.cur_purchases,4),round(m.cur_roas,4),round(m.cur_cpa,2),
  round(m.prv_spend,2),round(m.prv_revenue,2),round(m.prv_roas,4),round(m.prv_cpa,2),
  round(case when m.prv_spend<>0 then (m.cur_spend-m.prv_spend)/m.prv_spend*100 end,2),
  round(case when m.prv_revenue<>0 then (m.cur_revenue-m.prv_revenue)/m.prv_revenue*100 end,2),
  round(case when m.prv_roas<>0 then (m.cur_roas-m.prv_roas)/m.prv_roas*100 end,2),
  round(case when m.prv_cpa<>0 then (m.cur_cpa-m.prv_cpa)/m.prv_cpa*100 end,2),
  round(coalesce(m.mtd_spend,0),2),round(coalesce(m.mtd_revenue,0),2),round(m.mroas,4),round(m.mcpa,2),
  round(coalesce(m.prev_mtd_spend,0),2),round(coalesce(m.prev_mtd_revenue,0),2),round(m.pmroas,4),round(m.pmcpa,2),
  round(case when coalesce(m.prev_mtd_spend,0)<>0 then (m.mtd_spend-m.prev_mtd_spend)/m.prev_mtd_spend*100 end,2),
  round(case when coalesce(m.prev_mtd_revenue,0)<>0 then (m.mtd_revenue-m.prev_mtd_revenue)/m.prev_mtd_revenue*100 end,2),
  round(case when m.pmroas<>0 then (m.mroas-m.pmroas)/m.pmroas*100 end,2),
  round(case when m.pmcpa<>0 then (m.mcpa-m.pmcpa)/m.pmcpa*100 end,2),
  m.s7,m.s14,m.s30,
  case when m.s30='red' then 'red'
    when m.s14='red' and m.s7='red' then 'red'
    when m.s30='yellow' or m.s14 in ('yellow','red') or m.s7 in ('yellow','red') then 'yellow'
    else 'green' end
from metrics m
order by public.ppc_status_rank(
  case when m.s30='red' then 'red'
    when m.s14='red' and m.s7='red' then 'red'
    when m.s30='yellow' or m.s14 in ('yellow','red') or m.s7 in ('yellow','red') then 'yellow'
    else 'green' end
) desc,m.client_name,m.provider;
$$;

grant execute on function public.ppc_dashboard_overview(integer,text,date) to authenticated;
