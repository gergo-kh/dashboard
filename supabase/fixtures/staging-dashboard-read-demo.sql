-- Staging-only deterministic dashboard read fixture.
-- Run only against the kh-dashboard-staging Supabase project after explicit approval.
-- This file intentionally contains no Auth users, passwords, API keys, tokens, or real customer data.

begin;

do $$
declare
  expected_client_id constant uuid := '90000000-0000-4000-8000-000000000001';
  expected_project_id constant uuid := '90000000-0000-4000-8000-000000000011';
  expected_agency_profile_id constant uuid := '219ab6cd-06b4-423c-a560-af2c05198f0f';
begin
  if not exists (
    select 1
    from public.clients
    where id = expected_client_id
      and slug = 'kh-staging-client'
      and status = 'active'
  ) then
    raise exception 'Missing expected staging client kh-staging-client (%).', expected_client_id;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = expected_agency_profile_id
      and role = 'agency_admin'
      and client_id is null
      and is_active = true
  ) then
    raise exception 'Missing expected active agency_admin profile (%).', expected_agency_profile_id;
  end if;

  if not exists (
    select 1
    from public.projects
    where id = expected_project_id
      and client_id = expected_client_id
      and slug = 'kh-staging-hu'
      and currency_code = 'HUF'
      and status = 'active'
  ) then
    raise exception 'Missing expected staging project kh-staging-hu (%).', expected_project_id;
  end if;

  if exists (
    select 1
    from public.monthly_reviews
    where project_id = expected_project_id
      and period_start = date '2026-07-01'
      and period_end = date '2026-07-31'
      and id <> '91000000-0000-4000-8000-000000000101'
  ) then
    raise exception 'Staging monthly review period is already owned by another row.';
  end if;

  if exists (
    select 1
    from public.reports
    where project_id = expected_project_id
      and period_start = date '2026-07-01'
      and period_end = date '2026-07-31'
      and version = 1
      and id <> '91000000-0000-4000-8000-000000000501'
  ) then
    raise exception 'Staging report period/version is already owned by another row.';
  end if;

  if exists (
    select 1
    from public.merchant_products
    where project_id = expected_project_id
      and integration_account_id is null
      and external_product_id in ('KH-DEMO-CHAIR-01', 'KH-DEMO-DESK-02')
      and id not in (
        '91000000-0000-4000-8000-000000000601',
        '91000000-0000-4000-8000-000000000602'
      )
  ) then
    raise exception 'Staging merchant product external ID is already owned by another row.';
  end if;

  if exists (
    with planned(id, metric_date, provider) as (
      values
        ('91000000-0000-4000-8000-000000000201'::uuid, date '2026-07-01', 'google_ads'),
        ('91000000-0000-4000-8000-000000000202'::uuid, date '2026-07-01', 'meta_ads'),
        ('91000000-0000-4000-8000-000000000203'::uuid, date '2026-07-01', 'tiktok_ads'),
        ('91000000-0000-4000-8000-000000000204'::uuid, date '2026-07-01', 'ga4'),
        ('91000000-0000-4000-8000-000000000205'::uuid, date '2026-07-10', 'google_ads'),
        ('91000000-0000-4000-8000-000000000206'::uuid, date '2026-07-10', 'meta_ads'),
        ('91000000-0000-4000-8000-000000000207'::uuid, date '2026-07-10', 'tiktok_ads'),
        ('91000000-0000-4000-8000-000000000208'::uuid, date '2026-07-10', 'ga4'),
        ('91000000-0000-4000-8000-000000000209'::uuid, date '2026-07-20', 'google_ads'),
        ('91000000-0000-4000-8000-000000000210'::uuid, date '2026-07-20', 'meta_ads'),
        ('91000000-0000-4000-8000-000000000211'::uuid, date '2026-07-20', 'tiktok_ads'),
        ('91000000-0000-4000-8000-000000000212'::uuid, date '2026-07-20', 'ga4'),
        ('91000000-0000-4000-8000-000000000213'::uuid, date '2026-07-31', 'google_ads'),
        ('91000000-0000-4000-8000-000000000214'::uuid, date '2026-07-31', 'meta_ads'),
        ('91000000-0000-4000-8000-000000000215'::uuid, date '2026-07-31', 'tiktok_ads'),
        ('91000000-0000-4000-8000-000000000216'::uuid, date '2026-07-31', 'ga4'),
        ('91000000-0000-4000-8000-000000000217'::uuid, date '2026-06-01', 'google_ads'),
        ('91000000-0000-4000-8000-000000000218'::uuid, date '2026-06-01', 'meta_ads'),
        ('91000000-0000-4000-8000-000000000219'::uuid, date '2026-06-01', 'tiktok_ads'),
        ('91000000-0000-4000-8000-000000000220'::uuid, date '2026-06-01', 'ga4'),
        ('91000000-0000-4000-8000-000000000221'::uuid, date '2026-06-10', 'google_ads'),
        ('91000000-0000-4000-8000-000000000222'::uuid, date '2026-06-10', 'meta_ads'),
        ('91000000-0000-4000-8000-000000000223'::uuid, date '2026-06-10', 'tiktok_ads'),
        ('91000000-0000-4000-8000-000000000224'::uuid, date '2026-06-10', 'ga4'),
        ('91000000-0000-4000-8000-000000000225'::uuid, date '2026-06-20', 'google_ads'),
        ('91000000-0000-4000-8000-000000000226'::uuid, date '2026-06-20', 'meta_ads'),
        ('91000000-0000-4000-8000-000000000227'::uuid, date '2026-06-20', 'tiktok_ads'),
        ('91000000-0000-4000-8000-000000000228'::uuid, date '2026-06-20', 'ga4'),
        ('91000000-0000-4000-8000-000000000229'::uuid, date '2026-06-30', 'google_ads'),
        ('91000000-0000-4000-8000-000000000230'::uuid, date '2026-06-30', 'meta_ads'),
        ('91000000-0000-4000-8000-000000000231'::uuid, date '2026-06-30', 'tiktok_ads'),
        ('91000000-0000-4000-8000-000000000232'::uuid, date '2026-06-30', 'ga4')
    )
    select 1
    from planned p
    join public.daily_metrics dm
      on dm.project_id = expected_project_id
     and dm.account_id is null
     and dm.metric_date = p.metric_date
     and dm.provider = p.provider
     and dm.id <> p.id
  ) then
    raise exception 'A planned daily_metrics logical row is already owned by another row.';
  end if;
end
$$;

insert into public.monthly_reviews (
  id,
  project_id,
  period_start,
  period_end,
  summary_draft,
  summary_approved,
  outcome_type,
  outcome_items,
  corrective_actions,
  next_month_plan,
  status,
  approved_by,
  approved_at
)
values (
  '91000000-0000-4000-8000-000000000101',
  '90000000-0000-4000-8000-000000000011',
  date '2026-07-01',
  date '2026-07-31',
  'Staging demo draft summary.',
  'A júliusi staging demó időszakban a paid média költés kontrolláltan nőtt, miközben a GA4 bevétel és a blended ROAS javult. A KonverzióHuszár csapat a feedminőség, a Shopping hatékonyság és a méréstechnikai stabilitás javításán dolgozott.',
  'positive',
  '[
    {"label":"ROAS javulás","value":"+20%","state":"positive"},
    {"label":"Bevételnövekedés","value":"+28%","state":"positive"},
    {"label":"CPA változás","value":"-6,7%","state":"positive"},
    {"label":"Merchant fókusz","value":"aktív","state":"neutral"}
  ]'::jsonb,
  '["A gyengébb termékcsoportok költését szorosabban figyeljük.","A feedhibák javítása staging demó listán halad."]'::jsonb,
  '[
    {"title":"Shopping fókusz finomítása","detail":"A nagyobb potenciálú demó termékcsoportok kapnak elsőbbséget."},
    {"title":"Feedminőség javítása","detail":"A staging demó termékhibák lezárását priorizáljuk."},
    {"title":"Mérési stabilitás ellenőrzése","detail":"A GA4 és platformadatok eltérését tovább figyeljük."}
  ]'::jsonb,
  'approved',
  '219ab6cd-06b4-423c-a560-af2c05198f0f',
  timestamptz '2026-08-02 08:15:00+00'
)
on conflict (project_id, period_start, period_end) do update
set
  summary_draft = excluded.summary_draft,
  summary_approved = excluded.summary_approved,
  outcome_type = excluded.outcome_type,
  outcome_items = excluded.outcome_items,
  corrective_actions = excluded.corrective_actions,
  next_month_plan = excluded.next_month_plan,
  status = excluded.status,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at,
  updated_at = now();

insert into public.daily_metrics (
  id,
  project_id,
  metric_date,
  provider,
  account_id,
  spend,
  revenue,
  purchases,
  clicks,
  impressions,
  platform_conversion_value,
  platform_conversions,
  currency_code,
  metadata
)
values
  ('91000000-0000-4000-8000-000000000201', '90000000-0000-4000-8000-000000000011', date '2026-07-01', 'google_ads', null, 410000, 0, 0, 1850, 92000, 1960000, 42, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000202', '90000000-0000-4000-8000-000000000011', date '2026-07-01', 'meta_ads', null, 165000, 0, 0, 730, 41000, 520000, 13, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000203', '90000000-0000-4000-8000-000000000011', date '2026-07-01', 'tiktok_ads', null, 35000, 0, 0, 210, 18000, 76000, 2, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000204', '90000000-0000-4000-8000-000000000011', date '2026-07-01', 'ga4', null, 0, 3180000, 72, 0, 0, null, null, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000205', '90000000-0000-4000-8000-000000000011', date '2026-07-10', 'google_ads', null, 455000, 0, 0, 2010, 101000, 2380000, 51, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000206', '90000000-0000-4000-8000-000000000011', date '2026-07-10', 'meta_ads', null, 182000, 0, 0, 805, 45500, 660000, 16, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000207', '90000000-0000-4000-8000-000000000011', date '2026-07-10', 'tiktok_ads', null, 42000, 0, 0, 260, 22000, 118000, 3, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000208', '90000000-0000-4000-8000-000000000011', date '2026-07-10', 'ga4', null, 0, 3860000, 86, 0, 0, null, null, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000209', '90000000-0000-4000-8000-000000000011', date '2026-07-20', 'google_ads', null, 498000, 0, 0, 2190, 113000, 2790000, 59, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000210', '90000000-0000-4000-8000-000000000011', date '2026-07-20', 'meta_ads', null, 196000, 0, 0, 860, 48900, 720000, 18, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000211', '90000000-0000-4000-8000-000000000011', date '2026-07-20', 'tiktok_ads', null, 48000, 0, 0, 290, 24700, 146000, 4, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000212', '90000000-0000-4000-8000-000000000011', date '2026-07-20', 'ga4', null, 0, 4410000, 96, 0, 0, null, null, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000213', '90000000-0000-4000-8000-000000000011', date '2026-07-31', 'google_ads', null, 520000, 0, 0, 2300, 119000, 3010000, 63, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000214', '90000000-0000-4000-8000-000000000011', date '2026-07-31', 'meta_ads', null, 205000, 0, 0, 910, 51000, 810000, 20, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000215', '90000000-0000-4000-8000-000000000011', date '2026-07-31', 'tiktok_ads', null, 52000, 0, 0, 315, 26500, 168000, 5, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000216', '90000000-0000-4000-8000-000000000011', date '2026-07-31', 'ga4', null, 0, 4920000, 104, 0, 0, null, null, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"current"}'::jsonb),
  ('91000000-0000-4000-8000-000000000217', '90000000-0000-4000-8000-000000000011', date '2026-06-01', 'google_ads', null, 390000, 0, 0, 1740, 88000, 1520000, 34, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000218', '90000000-0000-4000-8000-000000000011', date '2026-06-01', 'meta_ads', null, 158000, 0, 0, 690, 38600, 430000, 11, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000219', '90000000-0000-4000-8000-000000000011', date '2026-06-01', 'tiktok_ads', null, 30000, 0, 0, 175, 15400, 52000, 1, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000220', '90000000-0000-4000-8000-000000000011', date '2026-06-01', 'ga4', null, 0, 2500000, 62, 0, 0, null, null, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000221', '90000000-0000-4000-8000-000000000011', date '2026-06-10', 'google_ads', null, 408000, 0, 0, 1805, 90500, 1710000, 38, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000222', '90000000-0000-4000-8000-000000000011', date '2026-06-10', 'meta_ads', null, 164000, 0, 0, 720, 39700, 480000, 12, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000223', '90000000-0000-4000-8000-000000000011', date '2026-06-10', 'tiktok_ads', null, 34000, 0, 0, 190, 16200, 68000, 2, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000224', '90000000-0000-4000-8000-000000000011', date '2026-06-10', 'ga4', null, 0, 2860000, 67, 0, 0, null, null, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000225', '90000000-0000-4000-8000-000000000011', date '2026-06-20', 'google_ads', null, 430000, 0, 0, 1890, 95000, 1890000, 41, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000226', '90000000-0000-4000-8000-000000000011', date '2026-06-20', 'meta_ads', null, 172000, 0, 0, 745, 41400, 530000, 13, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000227', '90000000-0000-4000-8000-000000000011', date '2026-06-20', 'tiktok_ads', null, 38000, 0, 0, 210, 17800, 84000, 2, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000228', '90000000-0000-4000-8000-000000000011', date '2026-06-20', 'ga4', null, 0, 3220000, 73, 0, 0, null, null, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000229', '90000000-0000-4000-8000-000000000011', date '2026-06-30', 'google_ads', null, 444000, 0, 0, 1960, 99000, 2060000, 44, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000230', '90000000-0000-4000-8000-000000000011', date '2026-06-30', 'meta_ads', null, 176000, 0, 0, 760, 42500, 560000, 14, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000231', '90000000-0000-4000-8000-000000000011', date '2026-06-30', 'tiktok_ads', null, 41000, 0, 0, 235, 19000, 96000, 2, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb),
  ('91000000-0000-4000-8000-000000000232', '90000000-0000-4000-8000-000000000011', date '2026-06-30', 'ga4', null, 0, 3480000, 77, 0, 0, null, null, 'HUF', '{"fixture":"staging_dashboard_read_demo","period":"comparison"}'::jsonb)
on conflict (project_id, provider, metric_date) where account_id is null do update
set
  spend = excluded.spend,
  revenue = excluded.revenue,
  purchases = excluded.purchases,
  clicks = excluded.clicks,
  impressions = excluded.impressions,
  platform_conversion_value = excluded.platform_conversion_value,
  platform_conversions = excluded.platform_conversions,
  currency_code = excluded.currency_code,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.optimization_items (
  id,
  project_id,
  category,
  title,
  description,
  status,
  source,
  started_at,
  completed_at,
  is_client_visible,
  approval_status
)
values
  ('91000000-0000-4000-8000-000000000301', '90000000-0000-4000-8000-000000000011', 'google_ads', 'Shopping keresési kifejezések tisztítása', 'A staging demóban a gyenge minőségű kereséseket kizártuk a költés védelméhez.', 'completed', 'manual', timestamptz '2026-07-08 08:00:00+00', timestamptz '2026-07-12 08:00:00+00', true, 'approved'),
  ('91000000-0000-4000-8000-000000000302', '90000000-0000-4000-8000-000000000011', 'merchant_center', 'Merchant feed címek javítása', 'Demó termékcímek és attribútumok finomítása fut a feedminőség emelésére.', 'in_progress', 'manual', timestamptz '2026-07-22 08:00:00+00', null, true, 'approved'),
  ('91000000-0000-4000-8000-000000000303', '90000000-0000-4000-8000-000000000011', 'meta_ads', 'Meta kreatívteszt frissítése', 'A staging demó kreatívcsoportok új termékfókuszú üzeneteket kapnak.', 'in_progress', 'manual', timestamptz '2026-07-25 08:00:00+00', null, true, 'approved'),
  ('91000000-0000-4000-8000-000000000304', '90000000-0000-4000-8000-000000000011', 'measurement', 'GA4 vásárlási mérés ellenőrzése', 'A staging demó mérési útvonalban a purchase események konzisztenciáját ellenőrizzük.', 'planned', 'manual', timestamptz '2026-07-29 08:00:00+00', null, true, 'approved')
on conflict (id) do update
set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  source = excluded.source,
  started_at = excluded.started_at,
  completed_at = excluded.completed_at,
  is_client_visible = excluded.is_client_visible,
  approval_status = excluded.approval_status,
  updated_at = now();

insert into public.client_action_items (
  id,
  project_id,
  source,
  category,
  title,
  description,
  priority,
  affected_count,
  status,
  due_date
)
values
  ('91000000-0000-4000-8000-000000000401', '90000000-0000-4000-8000-000000000011', 'manual', 'merchant_center', 'GTIN pótlása két demó terméknél', 'A demó feedben két termékazonosító hiányzik, ezek javítása növeli a Merchant lefedettséget.', 'urgent', 2, 'open', date '2026-08-08'),
  ('91000000-0000-4000-8000-000000000402', '90000000-0000-4000-8000-000000000011', 'manual', 'feed_quality', 'Termékképek ellenőrzése', 'A staging demó termékeknél egységesebb képarányt javaslunk.', 'recommended', 4, 'in_progress', date '2026-08-12'),
  ('91000000-0000-4000-8000-000000000403', '90000000-0000-4000-8000-000000000011', 'manual', 'catalog', 'Szezonális demó kategória ellenőrzése', 'A következő havi tervhez a kiemelt demó kategória készletjelzését kérjük.', 'opportunity', 1, 'open', date '2026-08-15')
on conflict (id) do update
set
  source = excluded.source,
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  priority = excluded.priority,
  affected_count = excluded.affected_count,
  status = excluded.status,
  due_date = excluded.due_date,
  resolved_at = null,
  updated_at = now();

insert into public.reports (
  id,
  project_id,
  monthly_review_id,
  period_start,
  period_end,
  status,
  version,
  generated_at,
  published_at
)
values (
  '91000000-0000-4000-8000-000000000501',
  '90000000-0000-4000-8000-000000000011',
  '91000000-0000-4000-8000-000000000101',
  date '2026-07-01',
  date '2026-07-31',
  'published',
  1,
  timestamptz '2026-08-02 08:30:00+00',
  timestamptz '2026-08-02 09:00:00+00'
)
on conflict (project_id, period_start, period_end, version) do update
set
  monthly_review_id = excluded.monthly_review_id,
  status = excluded.status,
  generated_at = excluded.generated_at,
  published_at = excluded.published_at,
  updated_at = now();

insert into public.merchant_products (
  id,
  project_id,
  integration_account_id,
  external_product_id,
  title,
  image_url,
  link_url,
  brand,
  gtin,
  approval_status,
  feed_metadata,
  last_seen_at
)
values
  ('91000000-0000-4000-8000-000000000601', '90000000-0000-4000-8000-000000000011', null, 'KH-DEMO-CHAIR-01', 'Demó ergonomikus szék', null, null, 'KH Demo', null, 'approved', '{"fixture":"staging_dashboard_read_demo","category":"office"}'::jsonb, timestamptz '2026-07-31 06:00:00+00'),
  ('91000000-0000-4000-8000-000000000602', '90000000-0000-4000-8000-000000000011', null, 'KH-DEMO-DESK-02', 'Demó állítható asztal', null, null, 'KH Demo', '5990000000002', 'approved', '{"fixture":"staging_dashboard_read_demo","category":"office"}'::jsonb, timestamptz '2026-07-31 06:00:00+00')
on conflict (project_id, external_product_id) where integration_account_id is null do update
set
  title = excluded.title,
  image_url = excluded.image_url,
  link_url = excluded.link_url,
  brand = excluded.brand,
  gtin = excluded.gtin,
  approval_status = excluded.approval_status,
  feed_metadata = excluded.feed_metadata,
  last_seen_at = excluded.last_seen_at,
  updated_at = now();

insert into public.product_daily_metrics (
  id,
  project_id,
  merchant_product_id,
  metric_date,
  spend,
  revenue,
  purchases,
  clicks,
  impressions
)
values
  ('91000000-0000-4000-8000-000000000701', '90000000-0000-4000-8000-000000000011', '91000000-0000-4000-8000-000000000601', date '2026-07-20', 86000, 0, 0, 240, 13200),
  ('91000000-0000-4000-8000-000000000702', '90000000-0000-4000-8000-000000000011', '91000000-0000-4000-8000-000000000601', date '2026-07-31', 118000, 186000, 3, 310, 16800),
  ('91000000-0000-4000-8000-000000000703', '90000000-0000-4000-8000-000000000011', '91000000-0000-4000-8000-000000000602', date '2026-07-20', 64000, 145000, 2, 180, 9900),
  ('91000000-0000-4000-8000-000000000704', '90000000-0000-4000-8000-000000000011', '91000000-0000-4000-8000-000000000602', date '2026-07-31', 72000, 210000, 3, 205, 11400)
on conflict (merchant_product_id, metric_date) do update
set
  project_id = excluded.project_id,
  spend = excluded.spend,
  revenue = excluded.revenue,
  purchases = excluded.purchases,
  clicks = excluded.clicks,
  impressions = excluded.impressions,
  updated_at = now();

insert into public.product_issues (
  id,
  project_id,
  merchant_product_id,
  issue_type,
  severity,
  title,
  description,
  recommendation,
  status,
  detected_at,
  metadata
)
values (
  '91000000-0000-4000-8000-000000000801',
  '90000000-0000-4000-8000-000000000011',
  '91000000-0000-4000-8000-000000000601',
  'missing_gtin',
  'high',
  'GTIN hiányzik a demó terméknél',
  'A GTIN nélküli demó termék Merchant megjelenése korlátozott lehet.',
  'Pótold a gyártói azonosítót a staging demó feedben.',
  'open',
  timestamptz '2026-07-31 07:00:00+00',
  '{"fixture":"staging_dashboard_read_demo"}'::jsonb
)
on conflict (id) do update
set
  merchant_product_id = excluded.merchant_product_id,
  issue_type = excluded.issue_type,
  severity = excluded.severity,
  title = excluded.title,
  description = excluded.description,
  recommendation = excluded.recommendation,
  status = excluded.status,
  detected_at = excluded.detected_at,
  resolved_at = null,
  metadata = excluded.metadata,
  updated_at = now();

commit;
