-- Staging-only deterministic monthly communication workflow fixture.
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
    with planned_periods(id, period_start, period_end) as (
      values
        ('92000000-0000-4000-8000-000000000101'::uuid, date '2026-08-01', date '2026-08-31'),
        ('92000000-0000-4000-8000-000000000102'::uuid, date '2026-09-01', date '2026-09-30'),
        ('92000000-0000-4000-8000-000000000103'::uuid, date '2026-10-01', date '2026-10-31'),
        ('92000000-0000-4000-8000-000000000104'::uuid, date '2026-11-01', date '2026-11-30')
    )
    select 1
    from public.monthly_reviews mr
    join planned_periods pp
      on pp.period_start = mr.period_start
      and pp.period_end = mr.period_end
    where mr.project_id = expected_project_id
      and mr.id <> pp.id
  ) then
    raise exception 'A planned monthly communication fixture period is already owned by another row.';
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
values
  (
    '92000000-0000-4000-8000-000000000101',
    '90000000-0000-4000-8000-000000000011',
    date '2026-08-01',
    date '2026-08-31',
    'Staging havi kommunikációs vázlat: a hónap fő irányai még ügynökségi szerkesztés alatt állnak.',
    null,
    'mixed',
    '[
      {"label":"Bevétel","value":"ellenőrzés alatt","state":"neutral"},
      {"label":"Költségkontroll","value":"aktív","state":"positive"}
    ]'::jsonb,
    '[]'::jsonb,
    '[
      {"title":"Vázlat ellenőrzése","detail":"A végleges ügyfélszöveg csak approval után kerülhet ki."}
    ]'::jsonb,
    'draft',
    null,
    null
  ),
  (
    '92000000-0000-4000-8000-000000000102',
    '90000000-0000-4000-8000-000000000011',
    date '2026-09-01',
    date '2026-09-30',
    'Staging review állapotú összefoglaló: jóváhagyásra váró ügyfélkommunikációs szöveg.',
    null,
    'focus',
    '[
      {"label":"Merchant fókusz","value":"javítandó","state":"negative","explanation":"A demó feedhibák több termék láthatóságát rontják."},
      {"label":"Mérési stabilitás","value":"rendben","state":"positive"}
    ]'::jsonb,
    '["A feedhibák lezárása előtt a havi kommunikáció nem publikálható."]'::jsonb,
    '[
      {"title":"Feedhibák lezárása","detail":"A prioritásos demó termékek attribútumait ellenőrizzük."}
    ]'::jsonb,
    'review',
    null,
    null
  ),
  (
    '92000000-0000-4000-8000-000000000103',
    '90000000-0000-4000-8000-000000000011',
    date '2026-10-01',
    date '2026-10-31',
    'Staging jóváhagyás előtti belső szöveg.',
    'A staging jóváhagyott havi összefoglaló rögzíti a fő eredményeket, de még nem publikált ügyféloldali tartalom.',
    'positive',
    '[
      {"label":"ROAS","value":"+12%","state":"positive"},
      {"label":"Konverziók","value":"+9%","state":"positive"}
    ]'::jsonb,
    '[]'::jsonb,
    '[
      {"title":"Stabil skálázás","detail":"A jóváhagyott terv szerint óvatos költésnövelés következik."}
    ]'::jsonb,
    'approved',
    '219ab6cd-06b4-423c-a560-af2c05198f0f',
    timestamptz '2026-11-02 09:00:00+00'
  ),
  (
    '92000000-0000-4000-8000-000000000104',
    '90000000-0000-4000-8000-000000000011',
    date '2026-11-01',
    date '2026-11-30',
    'Staging publikálás előtti belső szöveg.',
    'A staging publikált havi összefoglaló ügyféloldalon is megjelenhet, mert jóváhagyási metaadat és végleges szöveg tartozik hozzá.',
    'focus',
    '[
      {"label":"CPA","value":"+7%","state":"negative","explanation":"A demó keresleti mix átmenetileg gyengébb volt."},
      {"label":"Kampánytanulás","value":"lezárult","state":"positive"}
    ]'::jsonb,
    '["A magasabb CPA-t célzott keresési kizárásokkal és feedjavítással kezeljük."]'::jsonb,
    '[
      {"title":"CPA korrekció","detail":"A gyengébb demó szegmensek költését visszafogjuk."}
    ]'::jsonb,
    'published',
    '219ab6cd-06b4-423c-a560-af2c05198f0f',
    timestamptz '2026-12-02 09:00:00+00'
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
  (
    '92000000-0000-4000-8000-000000000301',
    '90000000-0000-4000-8000-000000000011',
    'google_ads',
    'Staging látható optimalizálás',
    'Jóváhagyott, ügyfélnek látható demó optimalizálási rekord a havi munkafolyamat ellenőrzéséhez.',
    'in_progress',
    'manual',
    timestamptz '2026-11-08 08:00:00+00',
    null,
    true,
    'approved'
  ),
  (
    '92000000-0000-4000-8000-000000000302',
    '90000000-0000-4000-8000-000000000011',
    'measurement',
    'Staging rejtett optimalizálás',
    'Rejtett demó optimalizálási rekord, amely kliensoldalon nem jelenhet meg.',
    'planned',
    'manual',
    timestamptz '2026-11-10 08:00:00+00',
    null,
    false,
    'hidden'
  )
on conflict (id) do update
set
  project_id = excluded.project_id,
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
  due_date,
  resolved_at
)
values
  (
    '92000000-0000-4000-8000-000000000401',
    '90000000-0000-4000-8000-000000000011',
    'manual',
    'merchant_center',
    'Staging vázlat ügyfélteendő',
    'Draft státuszú demó ügyfélteendő, amely kliensoldalon nem jelenhet meg.',
    'recommended',
    3,
    'draft',
    null,
    null
  ),
  (
    '92000000-0000-4000-8000-000000000402',
    '90000000-0000-4000-8000-000000000011',
    'manual',
    'merchant_center',
    'Staging látható ügyfélteendő',
    'Látható demó ügyfélteendő a client action workflow ellenőrzéséhez.',
    'urgent',
    2,
    'open',
    date '2026-12-08',
    null
  )
on conflict (id) do update
set
  project_id = excluded.project_id,
  source = excluded.source,
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  priority = excluded.priority,
  affected_count = excluded.affected_count,
  status = excluded.status,
  due_date = excluded.due_date,
  resolved_at = excluded.resolved_at,
  updated_at = now();

commit;
