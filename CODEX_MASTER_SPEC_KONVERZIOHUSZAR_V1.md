# KonverzióHuszár Ügyfélportál — Codex Master Specification v1.0

## 0. Instructions for Codex

You are implementing the approved V1 of the KonverzióHuszár client reporting portal.

This document is the source of truth for product behavior, information architecture, data model, UX, UI, and implementation priorities.

### Permanent rules

- Use Next.js 15 with App Router.
- Use TypeScript everywhere.
- Never use `any`.
- Use Tailwind CSS and the existing shadcn/ui-based design system.
- Use Supabase for authentication, PostgreSQL, Row Level Security, storage, and migrations.
- Use Windsor.ai as the primary external data integration layer.
- Use Recharts for charts.
- Use TanStack Table only when a real table is necessary.
- All visible UI text must be Hungarian.
- Internal names, code, database columns, types, functions, and documentation may remain English.
- Do not copy Google Ads, Meta Ads, GA4, or Merchant Center interfaces.
- This is a client reporting and communication portal, not a second ad-management platform.
- The client must understand the main situation within 10–15 seconds.
- Prioritize conclusions, status, agency activity, and client actions over technical advertising metrics.
- Do not expose API secrets in the browser.
- Do not store secrets in the repository.
- Every customer-facing AI-generated text must be editable and approved by a KonverzióHuszár admin before publication.
- Never show a negative result without showing a concrete corrective action or plan.
- Build reusable modules and keep the UI responsive.
- Do not change the approved page structure without explicit instruction.

---

# 1. Product definition

## Product name

**KonverzióHuszár Ügyfélportál**

## Primary product type

A multi-client ecommerce marketing reporting and client-communication platform.

## Primary objective

Replace Looker Studio reports with a clearer, more useful portal that combines:

- webshop-level business performance,
- paid media cost and efficiency,
- a clear explanation of what happened,
- what KonverzióHuszár completed,
- what KonverzióHuszár is currently working on,
- what the client needs to do,
- and what the next monthly plan is.

## Core promise

> **A KonverzióHuszár dolgozik rajta.**

The interface must continuously communicate that the account is actively managed and that problems are already being addressed.

## Desired customer behavior

> **„Minden hétfőn itt kezdem a hetet.”**

## Expected scale

- Maximum approximately 50 agency clients.
- A client may have multiple webshop projects.
- A webshop may have multiple country or regional versions.
- One client login can see all projects belonging to that client.
- KonverzióHuszár administrators can see all clients and projects.

---

# 2. Tenant and project model

## 2.1 Client

A client is a commercial relationship or company.

Examples:

- Eroll
- Capri Ékszer
- Momert
- CandleMap

## 2.2 Project

A project is one specific webshop / market / reporting unit.

Examples:

- Eroll HU
- Eroll RO
- Eroll HR
- Eroll EU
- Capri HU
- Capri RO

All reporting, integrations, monthly summaries, reports, Merchant Center tasks, and optimizations belong to a **project**, not directly to the client.

## 2.3 User access model

V1 does not need a complex role system.

Required roles:

- `agency_admin`
  - can see and manage every client and project,
  - can edit summaries, plans, tasks, reports, and settings,
  - can approve AI-generated content.

- `client_user`
  - belongs to exactly one client,
  - can see all projects of that client,
  - has read-only access to reporting content,
  - may open external Merchant Center actions,
  - cannot edit agency-generated content.

There is only one login person required per client in V1, but the schema should not make future additional client users impossible.

---

# 3. Approved navigation

The left sidebar must contain only:

1. **Marketing áttekintés**
2. **Teljesítmény**
3. **Merchant Center**
4. **Optimalizálások**
5. **Riportok**
6. **Beállítások**

Bottom area:

- selected client and project,
- assigned PPC manager,
- online / active indicator,
- logout.

The sidebar may also show a small current report status card:

- `Júliusi riport`
- `Elkészült`
- action: `Megtekintés / Letöltés`

Do not include:

- Campaigns as a separate V1 navigation page,
- Analytics as a separate V1 navigation page,
- creative gallery,
- search-term lists,
- keyword management,
- detailed ad-platform settings.

---

# 4. Approved visual system

## 4.1 Brand colors

Use existing design tokens; do not hardcode colors inside components.

Recommended palette:

- Primary navy: `#0B1F3A` or closest approved token
- Secondary navy: `#24344D`
- Accent orange: `#F36A21`
- Background: `#F7F9FC`
- Card: `#FFFFFF`
- Border: `#E6EAF0`
- Text primary: `#24344D`
- Text secondary: `#667085`
- Success green: semantic design-system token
- Warning orange: semantic design-system token
- Danger red: semantic design-system token
- Informational blue: semantic design-system token

## 4.2 Style

- Light main workspace.
- Dark navy fixed desktop sidebar.
- Rounded white cards.
- Very subtle shadows.
- High information density, but with consistent spacing.
- Strong hierarchy.
- Avoid decorative gradients except very subtle status backgrounds.
- Avoid oversized headings.
- Use concise Hungarian wording.
- Desktop-first, but fully responsive.
- Tablet and mobile views should stack cards logically.
- Never require horizontal scrolling for the main overview page.

---

# 5. Marketing áttekintés page

Route:

```text
/
```

or

```text
/overview
```

This is the primary page and the most important V1 deliverable.

## 5.1 Header

Required controls:

- Project selector:
  - example: `Eroll.hu (HU)`
  - client users see only projects belonging to their client.
  - agency admins can switch between all projects.

- Active management status:
  - `A KonverzióHuszár aktívan dolgozik a fiókodon`
  - `Utolsó optimalizálás: 2 napja`
  - `Ebben a hónapban: 18 optimalizálás`

- Date range selector.
- Comparison selector:
  - previous period,
  - previous month,
  - previous year.
- ROAS target display.
- `Kérdezd az AI-t` button:
  - may remain disabled or marked as coming soon in early V1,
  - do not implement unrestricted AI chat before data permissions and grounding are complete.
- `Riport letöltése` button.

## 5.2 Monthly report status card in sidebar

Shows:

- report month,
- current status:
  - `Készül`
  - `Jóváhagyásra vár`
  - `Elkészült`
- action:
  - view,
  - download.

## 5.3 Monthly summary

Title:

**Havi összefoglaló**

Purpose:

A concise, editable, approved summary of the selected month.

Example:

> Júliusban 18 optimalizálást végeztünk el. A bevétel 14,6%-kal nőtt, miközben a költség csak 10,3%-kal emelkedett. A fő fókusz a Shopping kampányok és a Merchant feed javítása volt. Augusztusban a konverziós arány növelésére koncentrálunk.

Rules:

- AI may generate a draft.
- Agency admin must be able to edit it.
- Agency admin must explicitly publish/approve it.
- Client sees only the approved version.
- Preserve monthly versions.
- Never regenerate or overwrite an approved historical summary automatically.

## 5.4 Dynamic monthly outcome block

This block changes according to the month’s performance.

### Positive month

Title:

**Ebben a hónapban elért eredmények**

Examples:

- `ROAS javulás +18%`
- `CPA csökkenés -22%`
- `Bevételnövekedés +2,8 M Ft`
- `Új TOP10 termékek: 3 db`
- `Merchant hibák: 42 → 8`
- `Jóváhagyási arány: 96%`

### Mixed month

Title:

**Fontos változások ebben a hónapban**

Show a balanced mix of:

- improvements,
- stable metrics,
- weaker metrics,
- implemented actions.

### Weak month

Title:

**Kiemelt fókuszterületek**

Required paired section:

**Mit teszünk a javítás érdekében?**

Example weak-month items:

- `A ROAS 21%-kal csökkent`
- `A bevétel 12,8%-kal csökkent`
- `A CPA 18%-kal nőtt`

Corrective actions:

- Shopping campaign restructuring,
- Merchant feed fixes,
- new Meta creatives,
- search-term cleanup,
- selected product promotions.

### Non-negotiable communication rule

A negative metric must never appear without:

- an explanation,
- an action already taken or in progress,
- or a clear next step.

## 5.5 KPI cards

Exactly six primary cards:

1. **Költés**
2. **Bevétel (GA4)**
3. **ROAS (Blended)**
4. **Vásárlások (GA4)**
5. **CPA (Blended)**
6. **Átlagos rendelési érték**

Each card includes:

- current value,
- comparison percentage,
- comparison label,
- semantic positive/negative display,
- information tooltip.

### KPI definitions

#### Költés

Sum of advertising spend from all connected active paid channels.

Typical sources:

- Google Ads
- Meta Ads
- TikTok Ads

#### Bevétel

GA4 ecommerce purchase revenue for the selected project and date range.

#### Blended ROAS

```text
GA4 ecommerce revenue
÷
total paid media spend
```

#### Vásárlások

GA4 purchase count.

#### Blended CPA

```text
total paid media spend
÷
GA4 purchase count
```

#### Átlagos rendelési érték

```text
GA4 ecommerce revenue
÷
GA4 purchase count
```

### KPI info tooltips

Every card must contain an info icon.

A page-level action must also exist:

**Hogyan számoljuk ezeket a mutatókat?**

This opens a modal or side sheet explaining:

- data source,
- formula,
- why platform data may differ,
- attribution limitations,
- last data refresh.

## 5.6 Performance chart

Only one main chart on the overview page.

Title:

**Teljesítmény alakulása**

Series:

- Bevétel
- Költés
- ROAS

Controls:

- Napi
- Heti
- Havi

Rules:

- Use daily data for typical monthly range.
- Use aggregation appropriate to the range.
- Show readable tooltips.
- Do not overload with clicks, CTR, impressions, CPC, or technical metrics.
- Chart must support loading, empty, and error states.

## 5.7 Channel summary

Title:

**Csatornák összefoglalója**

Rows:

- Google Ads
- Meta Ads
- TikTok Ads
- GA4 as data source row

Columns:

- status,
- spend,
- GA4-attributed or project-level allocated revenue only if the method is explicitly defined,
- platform ROAS when useful,
- spend share.

Important:

- Do not falsely imply channel revenue is additive when attribution models overlap.
- The total row must use GA4 revenue and total media spend.
- Include an explanatory footnote.
- If reliable channel allocation is unavailable, show platform-reported revenue clearly labeled as platform data.

## 5.8 Four central action cards

### Card A: Min dolgozunk most?

Displays current agency work.

Examples:

- Shopping kampányok optimalizálása
- Merchant feed javítása
- Meta kreatív tesztelés

Fields:

- title,
- short explanation,
- status,
- start date,
- optional project relation.

Client is read-only.

### Card B: Mit csináltunk ebben a hónapban?

Automatically collected activity list, editable by agency.

Examples:

- 34 negatív kulcsszó hozzáadása
- 12 keresési kifejezés kizárása
- 5 PMax asset csoport frissítése
- Merchant feed optimalizálása
- ROAS cél módosítása
- Meta kreatívcsere

Display:

- first 5–6 items,
- `+ 18 további optimalizálás megtekintése`.

Important:

- automatic collection may be based on change logs where available,
- raw platform changes must be transformed into understandable Hungarian summaries,
- agency admin can edit, hide, merge, or approve items.

### Card C: Mit kell neked megcsinálnod?

Primarily Merchant Center / feed tasks where client action is required.

Examples:

- 18 termék title javítása
- 6 termékhez hiányzik GTIN
- 3 termékhez nincs kép
- 2 termék leírása túl rövid

Priority labels:

- `Sürgős`
- `Javasolt`
- `Fejlesztési lehetőség`

Action:

- `Merchant Center megnyitása`
- or relevant external deep link.

### Card D: Következő havi terv

Agency plan for the next month.

Examples:

- Shopping ROAS növelése
- Merchant hibák megszüntetése
- új Meta kreatívok tesztelése
- márkás keresések bővítése
- konverziós arány növelése

Agency admin can edit and publish.

## 5.9 Reports card

Title:

**Havi riportok**

Shows:

- latest report,
- report month,
- creation date,
- status,
- PDF download,
- historical report timeline/list.

Client can download all reports belonging to projects accessible through their client.

Reports should be generated automatically, but only from approved monthly content.

## 5.10 Products requiring attention

Title:

**Figyelmet igénylő termékek (TOP 10)**

Source:

- Google Merchant Center
- Google Shopping / Google Ads
- optionally GA4 product data where reliable.

Columns:

- product,
- spend,
- revenue,
- ROAS,
- issue,
- action/details.

Examples:

- low efficiency,
- low conversion rate,
- high spend and few purchases,
- missing identifier,
- poor feed quality,
- disapproval.

Do not show an entire product feed table on the overview page.

---

# 6. Teljesítmény page

Route:

```text
/performance
```

Purpose:

A deeper but still client-friendly performance view.

V1 contents:

- date range,
- project selector,
- KPI trend cards,
- monthly trend chart,
- channel summary,
- comparison with previous period,
- approved written interpretation.

Avoid:

- search terms,
- keywords,
- bids,
- ad groups,
- asset-level details,
- detailed campaign management.

Campaign-level data may be added later only if it remains understandable.

---

# 7. Merchant Center page

Route:

```text
/merchant-center
```

This is one of the strongest V1 modules.

## Required sections

- overall feed health,
- approved products,
- disapproved products,
- limited products,
- missing GTIN,
- missing brand,
- missing image,
- too-short title,
- too-short description,
- other available Merchant Center issues,
- product-level priority list,
- client action list.

## Advice

Every issue must include:

- what is wrong,
- why it matters,
- what the client should do,
- priority,
- affected product count,
- affected products,
- optional suggested title or description.

AI title/description suggestions may be implemented later, but design the schema for them.

Only Google Shopping / Merchant Center products are in scope for V1.

Do not build Shopify, UNAS, WooCommerce, or other ecommerce-platform integrations in V1.

---

# 8. Optimalizálások page

Route:

```text
/optimizations
```

Purpose:

Show that KonverzióHuszár is actively working.

Sections:

- Current work
- Completed this month
- Previous months
- Planned work

Each item may contain:

- project,
- category,
- title,
- clear client-friendly description,
- status,
- source,
- source timestamp,
- completed date,
- visibility,
- approval state.

Categories:

- Google Ads
- Meta Ads
- TikTok Ads
- Merchant Center
- Measurement
- Reporting
- Other

Avoid exposing raw platform change logs directly.

---

# 9. Reports page

Route:

```text
/reports
```

Requirements:

- month/year filter,
- project filter,
- report cards or table,
- status,
- generated date,
- approved date,
- PDF download,
- historical archive.

Report statuses:

- `draft`
- `review`
- `approved`
- `generated`
- `published`
- `failed`

PDF must use:

- approved monthly summary,
- approved monthly outcome block,
- KPI snapshot,
- key chart,
- channel summary,
- completed optimizations,
- current work,
- client tasks,
- next month plan,
- attention products.

Historical reports must remain immutable after publication, except via an explicit revision workflow.

---

# 10. Settings page

Route:

```text
/settings
```

V1 agency-admin settings:

- client name,
- project name,
- project market/country,
- currency,
- timezone,
- ROAS target,
- project status,
- assigned PPC manager,
- module visibility,
- integration account mappings,
- report day,
- project logo if needed.

V1 client settings:

- profile information,
- password reset,
- optional email notification preferences.

---

# 11. Modular visibility

The product should be modular without becoming complicated.

Use project-level module flags:

- overview enabled,
- performance enabled,
- merchant center enabled,
- optimizations enabled,
- reports enabled.

Examples:

- Merchant Center page hidden when no Merchant Center integration is connected.
- TikTok row hidden when no TikTok account is mapped.
- Client action card may still display manual actions even without Merchant Center API data.

Do not build a generic plugin framework in V1.

---

# 12. Data sources and integration model

Primary integration gateway:

**Windsor.ai**

Connected or planned sources:

- Google Ads
- Meta Ads
- Google Analytics 4
- Google Merchant Center
- TikTok Ads

A project may have multiple accounts per provider.

Examples:

- multiple Google Ads accounts,
- multiple Meta ad accounts,
- multiple GA4 properties,
- multiple Merchant Center accounts,
- multiple TikTok accounts.

## Integration rule

The browser must never call Windsor.ai directly with a private token.

Use server-side API routes, server actions, or background jobs.

## Data refresh

- Refresh data at least daily.
- Show last successful refresh.
- Store refresh errors.
- Avoid querying full historical data on every page load.
- Normalize and cache reporting data in Supabase.

---

# 13. Database model

Use UUID primary keys.

Use `created_at` and `updated_at`.

Use UTC timestamps and project timezone for display/reporting periods.

Use migrations in the repository.

## 13.1 profiles

Linked to `auth.users`.

Fields:

- `id uuid primary key references auth.users(id)`
- `full_name text`
- `email text`
- `avatar_url text null`
- `role text check role in ('agency_admin','client_user')`
- `client_id uuid null`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

## 13.2 clients

Fields:

- `id uuid primary key`
- `name text`
- `slug text unique`
- `status text`
- `logo_url text null`
- `created_at`
- `updated_at`

## 13.3 projects

Fields:

- `id uuid primary key`
- `client_id uuid references clients(id)`
- `name text`
- `slug text`
- `country_code text null`
- `market_label text null`
- `currency_code text`
- `timezone text`
- `roas_target numeric null`
- `report_day smallint null`
- `assigned_manager_profile_id uuid null`
- `status text`
- `created_at`
- `updated_at`

Unique:

- `(client_id, slug)`

## 13.4 project_modules

Fields:

- `project_id uuid primary key references projects(id)`
- `overview_enabled boolean default true`
- `performance_enabled boolean default true`
- `merchant_enabled boolean default false`
- `optimizations_enabled boolean default true`
- `reports_enabled boolean default true`
- `updated_at`

## 13.5 integrations

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `provider text`
- `status text`
- `last_successful_sync_at timestamptz null`
- `last_sync_attempt_at timestamptz null`
- `last_error text null`
- `created_at`
- `updated_at`

Provider values:

- `windsor`
- `google_ads`
- `meta_ads`
- `ga4`
- `merchant_center`
- `tiktok_ads`

## 13.6 integration_accounts

Fields:

- `id uuid primary key`
- `integration_id uuid references integrations(id)`
- `external_account_id text`
- `external_account_name text`
- `account_type text null`
- `metadata jsonb default '{}'`
- `is_active boolean default true`
- `created_at`
- `updated_at`

Unique:

- `(integration_id, external_account_id)`

## 13.7 daily_metrics

Store normalized daily project and channel metrics.

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `metric_date date`
- `provider text`
- `account_id uuid null references integration_accounts(id)`
- `spend numeric default 0`
- `revenue numeric default 0`
- `purchases numeric default 0`
- `clicks numeric null`
- `impressions numeric null`
- `platform_conversion_value numeric null`
- `platform_conversions numeric null`
- `metadata jsonb default '{}'`
- `created_at`
- `updated_at`

Unique index should prevent duplicate daily rows per logical account/provider.

## 13.8 monthly_snapshots

Immutable or versioned reporting snapshot.

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `period_start date`
- `period_end date`
- `comparison_start date null`
- `comparison_end date null`
- `spend numeric`
- `revenue numeric`
- `purchases numeric`
- `blended_roas numeric null`
- `blended_cpa numeric null`
- `average_order_value numeric null`
- `snapshot_data jsonb`
- `created_at`
- `created_by uuid null`
- `version integer`
- `is_final boolean default false`

## 13.9 monthly_reviews

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `period_start date`
- `period_end date`
- `summary_draft text null`
- `summary_approved text null`
- `outcome_type text check in ('positive','mixed','focus')`
- `outcome_items jsonb default '[]'`
- `corrective_actions jsonb default '[]'`
- `next_month_plan jsonb default '[]'`
- `status text`
- `approved_by uuid null`
- `approved_at timestamptz null`
- `created_at`
- `updated_at`

Unique:

- `(project_id, period_start, period_end)`

## 13.10 optimization_items

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `category text`
- `title text`
- `description text null`
- `status text`
- `source text`
- `source_reference text null`
- `source_timestamp timestamptz null`
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `is_client_visible boolean default true`
- `approval_status text`
- `created_at`
- `updated_at`

Statuses:

- `planned`
- `in_progress`
- `completed`
- `cancelled`

Approval statuses:

- `draft`
- `approved`
- `hidden`

## 13.11 client_action_items

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `source text`
- `category text`
- `title text`
- `description text null`
- `priority text`
- `affected_count integer null`
- `external_url text null`
- `status text`
- `due_date date null`
- `created_at`
- `updated_at`
- `resolved_at timestamptz null`

Priority:

- `urgent`
- `recommended`
- `opportunity`

## 13.12 merchant_products

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `integration_account_id uuid null`
- `external_product_id text`
- `title text`
- `image_url text null`
- `link_url text null`
- `brand text null`
- `gtin text null`
- `approval_status text null`
- `feed_metadata jsonb default '{}'`
- `last_seen_at timestamptz`
- `created_at`
- `updated_at`

Unique logical product key per project/account.

## 13.13 product_daily_metrics

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `merchant_product_id uuid references merchant_products(id)`
- `metric_date date`
- `spend numeric default 0`
- `revenue numeric default 0`
- `purchases numeric default 0`
- `clicks numeric null`
- `impressions numeric null`
- `created_at`
- `updated_at`

## 13.14 product_issues

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `merchant_product_id uuid references merchant_products(id)`
- `issue_type text`
- `severity text`
- `title text`
- `description text null`
- `recommendation text null`
- `status text`
- `detected_at timestamptz`
- `resolved_at timestamptz null`
- `metadata jsonb default '{}'`

## 13.15 reports

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `monthly_review_id uuid null`
- `monthly_snapshot_id uuid null`
- `period_start date`
- `period_end date`
- `status text`
- `pdf_storage_path text null`
- `version integer default 1`
- `generated_at timestamptz null`
- `published_at timestamptz null`
- `created_at`
- `updated_at`

## 13.16 sync_runs

Fields:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `integration_id uuid null`
- `sync_type text`
- `status text`
- `started_at timestamptz`
- `completed_at timestamptz null`
- `records_processed integer default 0`
- `error_message text null`
- `metadata jsonb default '{}'`

---

# 14. Row Level Security

RLS is mandatory on all client/project data tables.

## Agency admin

May read and write all rows.

## Client user

May read:

- their own profile,
- their client,
- projects where `projects.client_id = profiles.client_id`,
- all published or client-visible data belonging to those projects.

May not:

- edit monthly reviews,
- edit optimization items,
- edit reports,
- change integrations,
- see hidden or draft items,
- see other clients.

Use helper SQL functions where useful, for example:

- `is_agency_admin()`
- `current_client_id()`
- `can_access_project(project_uuid)`

Never rely only on frontend filtering.

---

# 15. Authentication

Use Supabase Auth.

V1:

- email/password login,
- password reset,
- protected application routes,
- logout,
- profile loading,
- role-aware project selector.

Do not implement social login in V1.

---

# 16. API and service architecture

Recommended folders:

```text
services/windsor/
services/reporting/
services/metrics/
services/merchant/
services/optimizations/
services/reports/
lib/supabase/
types/
```

Server-only Windsor client:

- reads credentials from environment variables,
- validates request inputs,
- maps project integration accounts,
- normalizes data,
- writes to Supabase.

Do not put Windsor account IDs directly into UI components.

---

# 17. Background jobs and automation

Required recurring jobs:

1. Daily metrics sync.
2. Merchant Center product and issue sync.
3. Monthly snapshot creation.
4. Draft monthly summary generation.
5. Draft monthly outcome classification.
6. Report PDF generation after approval.

Use Vercel Cron or another explicitly approved scheduler.

All jobs must be idempotent.

Store run logs in `sync_runs`.

---

# 18. AI behavior

AI is an assistant, never the final publisher.

## Allowed V1 uses

- monthly summary draft,
- positive/mixed/focus classification draft,
- key outcome item draft,
- corrective action draft,
- Merchant issue explanation draft,
- product title suggestion draft later.

## Required safeguards

- ground only in project data,
- include the reporting period,
- do not invent causes,
- distinguish facts from hypotheses,
- never promise performance improvement,
- never make unsupported numerical forecasts,
- require human approval before client visibility.

## Weak-month writing rule

Use clear but calm language.

Bad:

> A kampányok rosszul teljesítettek.

Better:

> A Shopping és Meta csatornák hatékonysága csökkent az előző hónaphoz képest. A fő fókusz a kampánystruktúra, a Merchant feed és az új kreatívok felülvizsgálata.

---

# 19. Loading, empty, and error states

Every data module must support:

- loading skeleton,
- no integration,
- no data,
- partial data,
- stale data,
- sync failed,
- permission denied.

Never display zero as if it were real data when data is missing.

Use labels such as:

- `Nincs csatlakoztatva`
- `Nincs elegendő adat`
- `Az adatfrissítés sikertelen`
- `Utolsó sikeres frissítés: ...`

---

# 20. Accessibility

- Semantic headings.
- Keyboard-accessible controls.
- Visible focus states.
- Tooltip content accessible via keyboard.
- Do not rely only on color.
- Use icon + text for status.
- Tables need proper headers.
- Modal focus trapping.
- Sufficient contrast.

---

# 21. Responsive behavior

## Desktop

Use the approved wide layout.

## Tablet

- Collapsible sidebar.
- KPI cards in 2–3 columns.
- Chart and channel summary stacked when needed.
- Four action cards in 2 columns.

## Mobile

- Drawer navigation.
- Header controls collapse.
- KPI cards stack or use 2 columns.
- Outcome metrics scroll only if unavoidable; prefer wrapping.
- Chart simplified.
- Channel summary becomes stacked rows.
- Tables become card lists where practical.

---

# 22. V1 implementation sequence

## Phase 1 — Stabilize foundation

- install dependencies,
- run lint,
- run typecheck,
- run production build,
- fix all errors,
- commit lockfile.

## Phase 2 — Supabase schema

- create migrations,
- create RLS helpers,
- create RLS policies,
- seed one agency admin,
- seed Eroll client and projects in development only.

## Phase 3 — Authentication

- login,
- password reset,
- protected routes,
- profile and project access.

## Phase 4 — Approved static UI

- implement the final Marketing áttekintés design precisely,
- use typed placeholder view models only,
- no random mock generators.

## Phase 5 — Integration foundation

- project-to-account mappings,
- Windsor server client,
- sync runs,
- daily metrics storage.

## Phase 6 — Live overview metrics

- KPI calculations,
- chart,
- channel summary,
- refresh status,
- tooltips.

## Phase 7 — Monthly communication

- monthly summary editor,
- outcome block,
- current work,
- completed work,
- client actions,
- next month plan.

## Phase 8 — Merchant Center

- products,
- product metrics,
- issues,
- actions,
- attention products.

## Phase 9 — Reports

- snapshots,
- approval,
- PDF generation,
- archive.

## Phase 10 — AI drafts

- summary draft,
- outcome draft,
- corrective actions,
- approval workflow.

---

# 23. Immediate Codex task

After reading this document, do not implement the whole system in one change.

First perform a repository audit and produce:

```text
docs/implementation-plan-v1.md
```

The plan must include:

- current repository status,
- dependency/build issues,
- files already available,
- gaps against this specification,
- proposed migration files,
- proposed route structure,
- proposed service structure,
- proposed implementation steps,
- risks,
- questions that block implementation.

Then implement only:

## Task 1

**Stabilize and verify the existing project foundation.**

Deliverables:

- install dependencies,
- commit `pnpm-lock.yaml`,
- run `pnpm lint`,
- run TypeScript check,
- run `pnpm build`,
- fix all errors,
- confirm the application starts,
- do not implement new business features yet.

Create a separate commit with a clear message.

After Task 1, stop and report:

- changed files,
- commands executed,
- build result,
- unresolved issues.

Do not proceed to database migrations until Task 1 is reviewed.

---

# 24. Acceptance criteria for the final V1

The V1 is complete when:

- users can log in,
- client users see only their client’s projects,
- agency admin sees all projects,
- project selection works,
- Google Ads, Meta, GA4, Merchant Center, and optional TikTok mappings exist,
- daily data is cached,
- KPI calculations are documented and correct,
- overview page matches the approved design,
- monthly summary can be drafted, edited, approved, and published,
- weak months always include corrective actions,
- completed/current/planned work is visible,
- client Merchant tasks are visible,
- reports are generated and downloadable historically,
- all important tables have RLS,
- lint, typecheck, tests, and production build pass,
- no secret exists in the repository,
- client never sees another client’s data.

---

# 25. Out of scope for V1

Do not implement unless explicitly requested later:

- campaign management,
- keyword management,
- search-term exploration,
- bid changes,
- ad creation,
- creative gallery,
- raw change-history UI,
- Shopify integration,
- UNAS integration,
- WooCommerce integration,
- standalone SaaS billing,
- complex team roles,
- client editing of agency content,
- unrestricted AI agent actions,
- real-time sync,
- mobile native application.
