alter table public.daily_metrics
  add column currency_code text null;

alter table public.integrations
  add constraint integrations_project_provider_unique unique (project_id, provider);

drop index if exists public.daily_metrics_project_provider_account_date_uidx;

create unique index daily_metrics_project_provider_account_date_uidx
  on public.daily_metrics (project_id, provider, account_id, metric_date);

alter table public.daily_metrics
  add constraint daily_metrics_currency_code_format
  check (currency_code is null or currency_code ~ '^[A-Z]{3}$');

create index daily_metrics_project_currency_date_idx
  on public.daily_metrics (project_id, currency_code, metric_date desc);

comment on column public.daily_metrics.currency_code is
  'ISO 4217 currency code supplied by the normalized ingestion layer. Legacy rows may remain null until an authoritative backfill is performed; Phase 5 ingestion must set this explicitly.';
