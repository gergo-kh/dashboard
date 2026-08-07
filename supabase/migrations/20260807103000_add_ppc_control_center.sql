create table if not exists public.project_platform_settings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null check (provider in ('google_ads', 'meta_ads', 'tiktok_ads')),
  external_account_id text not null,
  external_account_name text,
  monthly_budget numeric(14, 2),
  target_roas numeric(12, 4),
  minimum_roas numeric(12, 4),
  target_cpa numeric(14, 2),
  maximum_cpa numeric(14, 2),
  primary_conversion_name text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, provider)
);

create index if not exists project_platform_settings_provider_idx
  on public.project_platform_settings(provider, is_enabled);
create index if not exists project_platform_settings_external_account_idx
  on public.project_platform_settings(external_account_id);

alter table public.project_platform_settings enable row level security;

drop policy if exists "Agency admins can manage platform settings" on public.project_platform_settings;
create policy "Agency admins can manage platform settings"
  on public.project_platform_settings
  for all
  to authenticated
  using ((select public.is_agency_admin()))
  with check ((select public.is_agency_admin()));

drop policy if exists "Client users can read accessible platform settings" on public.project_platform_settings;
create policy "Client users can read accessible platform settings"
  on public.project_platform_settings
  for select
  to authenticated
  using ((select public.can_access_project(project_id)));

drop trigger if exists set_project_platform_settings_updated_at on public.project_platform_settings;
create trigger set_project_platform_settings_updated_at
before update on public.project_platform_settings
for each row execute function public.set_updated_at();

create or replace function public.ppc_status_rank(p_status text)
returns integer
language sql
immutable
as $$
  select case p_status when 'red' then 3 when 'yellow' then 2 when 'green' then 1 else 0 end;
$$;

create or replace function public.ppc_metric_status(
  p_roas numeric,
  p_cpa numeric,
  p_target_roas numeric,
  p_minimum_roas numeric,
  p_target_cpa numeric,
  p_maximum_cpa numeric
)
returns text
language plpgsql
immutable
as $$
declare
  roas_status text := 'green';
  cpa_status text := 'green';
begin
  if p_roas is null and p_cpa is null then
    return 'yellow';
  end if;

  if p_target_roas is not null then
    if p_roas is null then
      roas_status := 'yellow';
    elsif p_minimum_roas is not null and p_roas < p_minimum_roas then
      roas_status := 'red';
    elsif p_roas < p_target_roas then
      roas_status := 'yellow';
    end if;
  end if;

  if p_target_cpa is not null then
    if p_cpa is null then
      cpa_status := 'yellow';
    elsif p_maximum_cpa is not null and p_cpa > p_maximum_cpa then
      cpa_status := 'red';
    elsif p_cpa > p_target_cpa then
      cpa_status := 'yellow';
    end if;
  end if;

  if public.ppc_status_rank(roas_status) >= public.ppc_status_rank(cpa_status) then
    return roas_status;
  end if;

  return cpa_status;
end;
$$;

create or replace function public.ppc_dashboard_overview(
  p_days integer default 30,
  p_provider text default null,
  p_as_of date default (current_date - 1)
)
returns table (
  project_id uuid,
  client_id uuid,
  client_name text,
  project_name text,
  provider text,
  external_account_id text,
  currency_code text,
  monthly_budget numeric,
  target_roas numeric,
  minimum_roas numeric,
  target_cpa numeric,
  maximum_cpa numeric,
  spend numeric,
  revenue numeric,
  purchases numeric,
  roas numeric,
  cpa numeric,
  prev_spend numeric,
  prev_revenue numeric,
  prev_roas numeric,
  prev_cpa numeric,
  spend_change_pct numeric,
  revenue_change_pct numeric,
  roas_change_pct numeric,
  cpa_change_pct numeric,
  mtd_spend numeric,
  mtd_revenue numeric,
  mtd_roas numeric,
  mtd_cpa numeric,
  prev_mtd_spend numeric,
  prev_mtd_revenue numeric,
  prev_mtd_roas numeric,
  prev_mtd_cpa numeric,
  mtd_spend_change_pct numeric,
  mtd_revenue_change_pct numeric,
  mtd_roas_change_pct numeric,
  mtd_cpa_change_pct numeric,
  status_7d text,
  status_14d text,
  status_30d text,
  overall_status text
)
language sql
stable
security invoker
set search_path = public
as $$
with settings as (
  select
    s.project_id,
    p.client_id,
    c.name as client_name,
    p.name as project_name,
    p.currency_code,
    s.provider,
    s.external_account_id,
    s.monthly_budget,
    coalesce(s.target_roas, p.roas_target) as target_roas,
    s.minimum_roas,
    s.target_cpa,
    s.maximum_cpa
  from public.project_platform_settings s
  join public.projects p on p.id = s.project_id and p.status = 'active'
  join public.clients c on c.id = p.client_id and c.status = 'active'
  where s.is_enabled
    and (p_provider is null or s.provider = p_provider)
),
ranges as (
  select
    p_as_of as as_of,
    (p_as_of - (p_days - 1))::date as cur_from,
    (p_as_of - p_days)::date as prev_to,
    (p_as_of - (2 * p_days - 1))::date as prev_from,
    date_trunc('month', p_as_of)::date as mtd_from,
    (date_trunc('month', p_as_of) - interval '1 month')::date as prev_mtd_from,
    ((date_trunc('month', p_as_of) - interval '1 month')::date + (extract(day from p_as_of)::int - 1))::date as prev_mtd_to
),
agg as (
  select
    s.*,
    coalesce(sum(dm.spend) filter (where dm.metric_date between r.cur_from and r.as_of), 0)::numeric as spend,
    coalesce(sum(dm.revenue) filter (where dm.metric_date between r.cur_from and r.as_of), 0)::numeric as revenue,
    coalesce(sum(dm.purchases) filter (where dm.metric_date between r.cur_from and r.as_of), 0)::numeric as purchases,
    coalesce(sum(dm.spend) filter (where dm.metric_date between r.prev_from and r.prev_to), 0)::numeric as prev_spend,
    coalesce(sum(dm.revenue) filter (where dm.metric_date between r.prev_from and r.prev_to), 0)::numeric as prev_revenue,
    coalesce(sum(dm.purchases) filter (where dm.metric_date between r.prev_from and r.prev_to), 0)::numeric as prev_purchases,
    coalesce(sum(dm.spend) filter (where dm.metric_date between r.mtd_from and r.as_of), 0)::numeric as mtd_spend,
    coalesce(sum(dm.revenue) filter (where dm.metric_date between r.mtd_from and r.as_of), 0)::numeric as mtd_revenue,
    coalesce(sum(dm.purchases) filter (where dm.metric_date between r.mtd_from and r.as_of), 0)::numeric as mtd_purchases,
    coalesce(sum(dm.spend) filter (where dm.metric_date between r.prev_mtd_from and r.prev_mtd_to), 0)::numeric as prev_mtd_spend,
    coalesce(sum(dm.revenue) filter (where dm.metric_date between r.prev_mtd_from and r.prev_mtd_to), 0)::numeric as prev_mtd_revenue,
    coalesce(sum(dm.purchases) filter (where dm.metric_date between r.prev_mtd_from and r.prev_mtd_to), 0)::numeric as prev_mtd_purchases,
    coalesce(sum(dm.spend) filter (where dm.metric_date between (r.as_of - 6) and r.as_of), 0)::numeric as spend_7,
    coalesce(sum(dm.revenue) filter (where dm.metric_date between (r.as_of - 6) and r.as_of), 0)::numeric as revenue_7,
    coalesce(sum(dm.purchases) filter (where dm.metric_date between (r.as_of - 6) and r.as_of), 0)::numeric as purchases_7,
    coalesce(sum(dm.spend) filter (where dm.metric_date between (r.as_of - 13) and r.as_of), 0)::numeric as spend_14,
    coalesce(sum(dm.revenue) filter (where dm.metric_date between (r.as_of - 13) and r.as_of), 0)::numeric as revenue_14,
    coalesce(sum(dm.purchases) filter (where dm.metric_date between (r.as_of - 13) and r.as_of), 0)::numeric as purchases_14,
    coalesce(sum(dm.spend) filter (where dm.metric_date between (r.as_of - 29) and r.as_of), 0)::numeric as spend_30,
    coalesce(sum(dm.revenue) filter (where dm.metric_date between (r.as_of - 29) and r.as_of), 0)::numeric as revenue_30,
    coalesce(sum(dm.purchases) filter (where dm.metric_date between (r.as_of - 29) and r.as_of), 0)::numeric as purchases_30
  from settings s
  cross join ranges r
  left join public.daily_metrics dm
    on dm.project_id = s.project_id
   and dm.provider = s.provider
   and dm.metric_date between least(r.prev_from, r.prev_mtd_from, r.as_of - 29) and r.as_of
  group by s.project_id, s.client_id, s.client_name, s.project_name, s.currency_code, s.provider,
           s.external_account_id, s.monthly_budget, s.target_roas, s.minimum_roas, s.target_cpa, s.maximum_cpa
),
calc as (
  select
    a.*,
    case when spend > 0 then revenue / spend end as roas,
    case when purchases > 0 then spend / purchases end as cpa,
    case when prev_spend > 0 then prev_revenue / prev_spend end as prev_roas,
    case when prev_purchases > 0 then prev_spend / prev_purchases end as prev_cpa,
    case when mtd_spend > 0 then mtd_revenue / mtd_spend end as mtd_roas,
    case when mtd_purchases > 0 then mtd_spend / mtd_purchases end as mtd_cpa,
    case when prev_mtd_spend > 0 then prev_mtd_revenue / prev_mtd_spend end as prev_mtd_roas,
    case when prev_mtd_purchases > 0 then prev_mtd_spend / prev_mtd_purchases end as prev_mtd_cpa,
    case when spend_7 > 0 then revenue_7 / spend_7 end as roas_7,
    case when purchases_7 > 0 then spend_7 / purchases_7 end as cpa_7,
    case when spend_14 > 0 then revenue_14 / spend_14 end as roas_14,
    case when purchases_14 > 0 then spend_14 / purchases_14 end as cpa_14,
    case when spend_30 > 0 then revenue_30 / spend_30 end as roas_30,
    case when purchases_30 > 0 then spend_30 / purchases_30 end as cpa_30
  from agg a
),
statuses as (
  select
    c.*,
    public.ppc_metric_status(roas_7, cpa_7, target_roas, minimum_roas, target_cpa, maximum_cpa) as s7,
    public.ppc_metric_status(roas_14, cpa_14, target_roas, minimum_roas, target_cpa, maximum_cpa) as s14,
    public.ppc_metric_status(roas_30, cpa_30, target_roas, minimum_roas, target_cpa, maximum_cpa) as s30
  from calc c
)
select
  project_id, client_id, client_name, project_name, provider, external_account_id, currency_code,
  monthly_budget, target_roas, minimum_roas, target_cpa, maximum_cpa,
  round(spend, 2), round(revenue, 2), round(purchases, 4), round(roas, 4), round(cpa, 2),
  round(prev_spend, 2), round(prev_revenue, 2), round(prev_roas, 4), round(prev_cpa, 2),
  round(case when prev_spend <> 0 then (spend - prev_spend) / prev_spend * 100 end, 2),
  round(case when prev_revenue <> 0 then (revenue - prev_revenue) / prev_revenue * 100 end, 2),
  round(case when prev_roas <> 0 then (roas - prev_roas) / prev_roas * 100 end, 2),
  round(case when prev_cpa <> 0 then (cpa - prev_cpa) / prev_cpa * 100 end, 2),
  round(mtd_spend, 2), round(mtd_revenue, 2), round(mtd_roas, 4), round(mtd_cpa, 2),
  round(prev_mtd_spend, 2), round(prev_mtd_revenue, 2), round(prev_mtd_roas, 4), round(prev_mtd_cpa, 2),
  round(case when prev_mtd_spend <> 0 then (mtd_spend - prev_mtd_spend) / prev_mtd_spend * 100 end, 2),
  round(case when prev_mtd_revenue <> 0 then (mtd_revenue - prev_mtd_revenue) / prev_mtd_revenue * 100 end, 2),
  round(case when prev_mtd_roas <> 0 then (mtd_roas - prev_mtd_roas) / prev_mtd_roas * 100 end, 2),
  round(case when prev_mtd_cpa <> 0 then (mtd_cpa - prev_mtd_cpa) / prev_mtd_cpa * 100 end, 2),
  s7, s14, s30,
  case
    when s30 = 'red' then 'red'
    when s14 = 'red' and s7 = 'red' then 'red'
    when s30 = 'yellow' or s14 in ('yellow', 'red') or s7 in ('yellow', 'red') then 'yellow'
    else 'green'
  end as overall_status
from statuses
order by public.ppc_status_rank(
  case
    when s30 = 'red' then 'red'
    when s14 = 'red' and s7 = 'red' then 'red'
    when s30 = 'yellow' or s14 in ('yellow', 'red') or s7 in ('yellow', 'red') then 'yellow'
    else 'green'
  end
) desc, client_name, provider;
$$;

grant execute on function public.ppc_dashboard_overview(integer, text, date) to authenticated;
