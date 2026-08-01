create extension if not exists pgcrypto;

create type public.profile_role as enum ('agency_admin', 'client_user');
create type public.monthly_outcome_type as enum ('positive', 'mixed', 'focus');
create type public.optimization_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
create type public.approval_status as enum ('draft', 'approved', 'hidden');
create type public.client_action_priority as enum ('urgent', 'recommended', 'opportunity');
create type public.client_action_status as enum ('draft', 'open', 'in_progress', 'resolved', 'dismissed', 'hidden');
create type public.product_issue_status as enum ('draft', 'open', 'in_progress', 'resolved', 'dismissed', 'hidden');
create type public.report_status as enum ('draft', 'review', 'approved', 'generated', 'published', 'failed');
create type public.sync_status as enum ('queued', 'running', 'success', 'failed', 'cancelled');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active',
  logo_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_slug_unique unique (slug),
  constraint clients_slug_not_blank check (length(trim(slug)) > 0),
  constraint clients_name_not_blank check (length(trim(name)) > 0),
  constraint clients_status_check check (status in ('active', 'paused', 'archived'))
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text null,
  role public.profile_role not null,
  client_id uuid null references public.clients(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_unique unique (email),
  constraint profiles_email_not_blank check (length(trim(email)) > 0),
  constraint profiles_full_name_not_blank check (length(trim(full_name)) > 0),
  constraint profiles_client_role_check check (
    (role = 'agency_admin' and client_id is null)
    or (role = 'client_user' and client_id is not null)
  )
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  slug text not null,
  country_code text null,
  market_label text null,
  currency_code text not null,
  timezone text not null,
  roas_target numeric null,
  report_day smallint null,
  assigned_manager_profile_id uuid null references public.profiles(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_client_slug_unique unique (client_id, slug),
  constraint projects_name_not_blank check (length(trim(name)) > 0),
  constraint projects_slug_not_blank check (length(trim(slug)) > 0),
  constraint projects_currency_code_format check (currency_code ~ '^[A-Z]{3}$'),
  constraint projects_report_day_range check (report_day is null or report_day between 1 and 28),
  constraint projects_roas_target_nonnegative check (roas_target is null or roas_target >= 0),
  constraint projects_status_check check (status in ('active', 'paused', 'archived'))
);

create table public.project_modules (
  project_id uuid primary key references public.projects(id) on delete cascade,
  overview_enabled boolean not null default true,
  performance_enabled boolean not null default true,
  merchant_enabled boolean not null default false,
  optimizations_enabled boolean not null default true,
  reports_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null,
  status text not null default 'planned',
  last_successful_sync_at timestamptz null,
  last_sync_attempt_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrations_provider_check check (
    provider in ('windsor', 'google_ads', 'meta_ads', 'ga4', 'merchant_center', 'tiktok_ads')
  ),
  constraint integrations_status_check check (status in ('planned', 'connected', 'syncing', 'error', 'disabled'))
);

create table public.integration_accounts (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  external_account_id text not null,
  external_account_name text not null,
  account_type text null,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_accounts_unique_external unique (integration_id, external_account_id),
  constraint integration_accounts_external_id_not_blank check (length(trim(external_account_id)) > 0),
  constraint integration_accounts_external_name_not_blank check (length(trim(external_account_name)) > 0),
  constraint integration_accounts_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  metric_date date not null,
  provider text not null,
  account_id uuid null references public.integration_accounts(id) on delete set null,
  spend numeric not null default 0,
  revenue numeric not null default 0,
  purchases numeric not null default 0,
  clicks numeric null,
  impressions numeric null,
  platform_conversion_value numeric null,
  platform_conversions numeric null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_metrics_provider_check check (
    provider in ('google_ads', 'meta_ads', 'ga4', 'merchant_center', 'tiktok_ads', 'manual')
  ),
  constraint daily_metrics_nonnegative_values check (
    spend >= 0
    and revenue >= 0
    and purchases >= 0
    and (clicks is null or clicks >= 0)
    and (impressions is null or impressions >= 0)
    and (platform_conversion_value is null or platform_conversion_value >= 0)
    and (platform_conversions is null or platform_conversions >= 0)
  ),
  constraint daily_metrics_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  comparison_start date null,
  comparison_end date null,
  spend numeric not null default 0,
  revenue numeric not null default 0,
  purchases numeric not null default 0,
  blended_roas numeric null,
  blended_cpa numeric null,
  average_order_value numeric null,
  snapshot_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references public.profiles(id) on delete set null,
  version integer not null default 1,
  is_final boolean not null default false,
  constraint monthly_snapshots_period_check check (period_start <= period_end),
  constraint monthly_snapshots_comparison_check check (
    (comparison_start is null and comparison_end is null)
    or (comparison_start is not null and comparison_end is not null and comparison_start <= comparison_end)
  ),
  constraint monthly_snapshots_nonnegative_values check (
    spend >= 0
    and revenue >= 0
    and purchases >= 0
    and (blended_roas is null or blended_roas >= 0)
    and (blended_cpa is null or blended_cpa >= 0)
    and (average_order_value is null or average_order_value >= 0)
  ),
  constraint monthly_snapshots_version_positive check (version > 0),
  constraint monthly_snapshots_snapshot_object check (jsonb_typeof(snapshot_data) = 'object'),
  constraint monthly_snapshots_unique_version unique (project_id, period_start, period_end, version)
);

create table public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  summary_draft text null,
  summary_approved text null,
  outcome_type public.monthly_outcome_type not null default 'mixed',
  outcome_items jsonb not null default '[]'::jsonb,
  corrective_actions jsonb not null default '[]'::jsonb,
  next_month_plan jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  approved_by uuid null references public.profiles(id) on delete set null,
  approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_reviews_project_period_unique unique (project_id, period_start, period_end),
  constraint monthly_reviews_period_check check (period_start <= period_end),
  constraint monthly_reviews_status_check check (status in ('draft', 'review', 'approved', 'published', 'archived')),
  constraint monthly_reviews_outcome_items_array check (jsonb_typeof(outcome_items) = 'array'),
  constraint monthly_reviews_corrective_actions_array check (jsonb_typeof(corrective_actions) = 'array'),
  constraint monthly_reviews_next_month_plan_array check (jsonb_typeof(next_month_plan) = 'array'),
  constraint monthly_reviews_approval_consistency check (
    (status in ('draft', 'review') and approved_by is null and approved_at is null)
    or (status in ('approved', 'published', 'archived') and approved_by is not null and approved_at is not null)
  )
);

create table public.optimization_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  title text not null,
  description text null,
  status public.optimization_status not null default 'planned',
  source text not null default 'manual',
  source_reference text null,
  source_timestamp timestamptz null,
  started_at timestamptz null,
  completed_at timestamptz null,
  is_client_visible boolean not null default true,
  approval_status public.approval_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint optimization_items_category_check check (
    category in ('google_ads', 'meta_ads', 'tiktok_ads', 'merchant_center', 'measurement', 'reporting', 'other')
  ),
  constraint optimization_items_title_not_blank check (length(trim(title)) > 0),
  constraint optimization_items_source_not_blank check (length(trim(source)) > 0),
  constraint optimization_items_completed_status_check check (
    (status = 'completed' and completed_at is not null)
    or status <> 'completed'
  )
);

create table public.client_action_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source text not null default 'manual',
  category text not null,
  title text not null,
  description text null,
  priority public.client_action_priority not null default 'recommended',
  affected_count integer null,
  external_url text null,
  status public.client_action_status not null default 'open',
  due_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz null,
  constraint client_action_items_title_not_blank check (length(trim(title)) > 0),
  constraint client_action_items_source_not_blank check (length(trim(source)) > 0),
  constraint client_action_items_affected_count_nonnegative check (affected_count is null or affected_count >= 0),
  constraint client_action_items_resolved_status_check check (
    (status = 'resolved' and resolved_at is not null)
    or status <> 'resolved'
  )
);

create table public.merchant_products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  integration_account_id uuid null references public.integration_accounts(id) on delete set null,
  external_product_id text not null,
  title text not null,
  image_url text null,
  link_url text null,
  brand text null,
  gtin text null,
  approval_status text null,
  feed_metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchant_products_external_product_id_not_blank check (length(trim(external_product_id)) > 0),
  constraint merchant_products_title_not_blank check (length(trim(title)) > 0),
  constraint merchant_products_feed_metadata_object check (jsonb_typeof(feed_metadata) = 'object')
);

create table public.product_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  merchant_product_id uuid not null references public.merchant_products(id) on delete cascade,
  metric_date date not null,
  spend numeric not null default 0,
  revenue numeric not null default 0,
  purchases numeric not null default 0,
  clicks numeric null,
  impressions numeric null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_daily_metrics_nonnegative_values check (
    spend >= 0
    and revenue >= 0
    and purchases >= 0
    and (clicks is null or clicks >= 0)
    and (impressions is null or impressions >= 0)
  ),
  constraint product_daily_metrics_unique_product_date unique (merchant_product_id, metric_date)
);

create table public.product_issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  merchant_product_id uuid not null references public.merchant_products(id) on delete cascade,
  issue_type text not null,
  severity text not null,
  title text not null,
  description text null,
  recommendation text null,
  status public.product_issue_status not null default 'open',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_issues_issue_type_not_blank check (length(trim(issue_type)) > 0),
  constraint product_issues_title_not_blank check (length(trim(title)) > 0),
  constraint product_issues_severity_check check (severity in ('low', 'medium', 'high', 'critical')),
  constraint product_issues_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint product_issues_resolved_status_check check (
    (status = 'resolved' and resolved_at is not null)
    or status <> 'resolved'
  )
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  monthly_review_id uuid null references public.monthly_reviews(id) on delete set null,
  monthly_snapshot_id uuid null references public.monthly_snapshots(id) on delete set null,
  period_start date not null,
  period_end date not null,
  status public.report_status not null default 'draft',
  pdf_storage_path text null,
  version integer not null default 1,
  generated_at timestamptz null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_period_check check (period_start <= period_end),
  constraint reports_version_positive check (version > 0),
  constraint reports_unique_version unique (project_id, period_start, period_end, version),
  constraint reports_published_status_check check (
    (status = 'published' and published_at is not null)
    or status <> 'published'
  )
);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  integration_id uuid null references public.integrations(id) on delete set null,
  sync_type text not null,
  status public.sync_status not null default 'queued',
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  records_processed integer not null default 0,
  error_message text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sync_runs_sync_type_not_blank check (length(trim(sync_type)) > 0),
  constraint sync_runs_records_processed_nonnegative check (records_processed >= 0),
  constraint sync_runs_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint sync_runs_completed_status_check check (
    (status in ('success', 'failed', 'cancelled') and completed_at is not null)
    or status in ('queued', 'running')
  )
);

create unique index daily_metrics_project_provider_date_no_account_uidx
  on public.daily_metrics (project_id, provider, metric_date)
  where account_id is null;

create unique index daily_metrics_project_provider_account_date_uidx
  on public.daily_metrics (project_id, provider, account_id, metric_date)
  where account_id is not null;

create unique index merchant_products_project_external_no_account_uidx
  on public.merchant_products (project_id, external_product_id)
  where integration_account_id is null;

create unique index merchant_products_project_account_external_uidx
  on public.merchant_products (project_id, integration_account_id, external_product_id)
  where integration_account_id is not null;

create index profiles_client_id_idx on public.profiles (client_id);
create index profiles_role_idx on public.profiles (role);
create index projects_client_id_idx on public.projects (client_id);
create index projects_assigned_manager_profile_id_idx on public.projects (assigned_manager_profile_id);
create index project_modules_project_id_idx on public.project_modules (project_id);
create index integrations_project_id_idx on public.integrations (project_id);
create index integrations_provider_idx on public.integrations (provider);
create index integration_accounts_integration_id_idx on public.integration_accounts (integration_id);
create index daily_metrics_project_date_idx on public.daily_metrics (project_id, metric_date desc);
create index daily_metrics_account_id_idx on public.daily_metrics (account_id);
create index monthly_snapshots_project_period_idx on public.monthly_snapshots (project_id, period_start desc, period_end desc);
create index monthly_reviews_project_period_idx on public.monthly_reviews (project_id, period_start desc, period_end desc);
create index monthly_reviews_status_idx on public.monthly_reviews (status);
create index optimization_items_project_status_idx on public.optimization_items (project_id, status);
create index optimization_items_project_approval_idx on public.optimization_items (project_id, approval_status, is_client_visible);
create index client_action_items_project_status_idx on public.client_action_items (project_id, status);
create index merchant_products_project_id_idx on public.merchant_products (project_id);
create index merchant_products_integration_account_id_idx on public.merchant_products (integration_account_id);
create index product_daily_metrics_project_date_idx on public.product_daily_metrics (project_id, metric_date desc);
create index product_daily_metrics_product_id_idx on public.product_daily_metrics (merchant_product_id);
create index product_issues_project_status_idx on public.product_issues (project_id, status);
create index product_issues_product_id_idx on public.product_issues (merchant_product_id);
create index reports_project_period_idx on public.reports (project_id, period_start desc, period_end desc);
create index reports_status_idx on public.reports (status);
create index sync_runs_project_started_idx on public.sync_runs (project_id, started_at desc);
create index sync_runs_integration_id_idx on public.sync_runs (integration_id);
create index sync_runs_status_idx on public.sync_runs (status);

create trigger set_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger set_project_modules_updated_at
  before update on public.project_modules
  for each row execute function public.set_updated_at();

create trigger set_integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

create trigger set_integration_accounts_updated_at
  before update on public.integration_accounts
  for each row execute function public.set_updated_at();

create trigger set_daily_metrics_updated_at
  before update on public.daily_metrics
  for each row execute function public.set_updated_at();

create trigger set_monthly_snapshots_updated_at
  before update on public.monthly_snapshots
  for each row execute function public.set_updated_at();

create trigger set_monthly_reviews_updated_at
  before update on public.monthly_reviews
  for each row execute function public.set_updated_at();

create trigger set_optimization_items_updated_at
  before update on public.optimization_items
  for each row execute function public.set_updated_at();

create trigger set_client_action_items_updated_at
  before update on public.client_action_items
  for each row execute function public.set_updated_at();

create trigger set_merchant_products_updated_at
  before update on public.merchant_products
  for each row execute function public.set_updated_at();

create trigger set_product_daily_metrics_updated_at
  before update on public.product_daily_metrics
  for each row execute function public.set_updated_at();

create trigger set_product_issues_updated_at
  before update on public.product_issues
  for each row execute function public.set_updated_at();

create trigger set_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

create trigger set_sync_runs_updated_at
  before update on public.sync_runs
  for each row execute function public.set_updated_at();
