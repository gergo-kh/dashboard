# KonverzioHuszar Client Portal V1 Implementation Plan

## Current Repository Status

- Repository: `gergo-kh/dashboard`
- Default branch: `main`
- Local checkout status at audit time: clean before Task 1 changes.
- Current commit at audit time: `0d31be9 Initial commit`
- The repository is effectively empty and does not yet contain a runnable application.
- The local workspace initially was not a Git repository; the GitHub repository was cloned into `/Users/kissgergo/Documents/Dashbord`.
- Required pre-read files status:
  - `CODEX_MASTER_SPEC_KONVERZIOHUSZAR_V1.md`: read from `/Users/kissgergo/Downloads/CODEX_MASTER_SPEC_KONVERZIOHUSZAR_V1.md`; this is the source of truth for V1.
  - `AGENTS.md`: not present locally or in the GitHub repository.
  - `PROJECT.md`: not present locally or in the GitHub repository.
  - `ROADMAP.md`: not present locally or in the GitHub repository.

## Existing Files and Components

- `README.md`
  - Contains a short product description for a KonverzioHuszar client analytics dashboard.
- `.gitignore`
  - Generic Node/JavaScript ignore rules, including `node_modules`, `.env`, `.next`, `dist`, cache folders, and pnpm store.

No application files currently exist:

- no `package.json`
- no `pnpm-lock.yaml`
- no Next.js app directory
- no TypeScript configuration
- no Tailwind configuration
- no shadcn/ui components
- no Supabase folder
- no service layer
- no tests
- no CI configuration

## Dependency and Build Problems

- There is no dependency manifest, so dependencies cannot be installed until a minimal project foundation is created.
- There is no lockfile to commit.
- There are no lint, typecheck, or build scripts.
- There is no Next.js 15 App Router setup.
- There is no TypeScript setup.
- There is no Tailwind CSS setup.
- There is no application entry route to start or build.
- Local environment note: `pnpm` is available, but direct `node` and `npm` commands were not available in the shell during audit. Task 1 should rely on `pnpm` commands and verify whether package scripts can access their local runtime correctly.

## Gaps Against the Master Specification

The current repository has none of the approved V1 product foundation beyond a README. Major gaps:

- Next.js 15 App Router foundation is missing.
- TypeScript is missing.
- Tailwind CSS and the shadcn/ui-based design system are missing.
- Approved navigation shell is missing.
- All approved routes are missing:
  - `/` or `/overview`
  - `/performance`
  - `/merchant-center`
  - `/optimizations`
  - `/reports`
  - `/settings`
- Supabase Auth is missing.
- Supabase migrations are missing.
- RLS helper functions and policies are missing.
- Windsor.ai integration layer is missing.
- Reporting, metrics, Merchant Center, optimization, and report-generation services are missing.
- Loading, empty, stale, partial, failed-sync, and permission states are missing.
- Hungarian customer-facing UI copy is missing.
- AI draft and admin approval workflow is missing.
- PDF reporting workflow is missing.

## Proposed Route Structure

Use Next.js 15 App Router:

```text
app/
  layout.tsx
  page.tsx                         # Marketing attekintes, primary V1 route
  overview/page.tsx                 # optional alias or redirect to /
  performance/page.tsx
  merchant-center/page.tsx
  optimizations/page.tsx
  reports/page.tsx
  settings/page.tsx
  login/page.tsx                    # later, Phase 3
  reset-password/page.tsx           # later, Phase 3
  actions.ts                        # later, server actions where appropriate
```

Suggested route groups after authentication is implemented:

```text
app/
  (auth)/
    login/page.tsx
    reset-password/page.tsx
  (portal)/
    layout.tsx
    page.tsx
    performance/page.tsx
    merchant-center/page.tsx
    optimizations/page.tsx
    reports/page.tsx
    settings/page.tsx
```

## Proposed Supabase Migration Structure

Do not create database tables in Task 1. For Phase 2, use Supabase migrations in the repository:

```text
supabase/
  config.toml
  migrations/
    <timestamp>_create_core_tenant_tables.sql
    <timestamp>_create_project_module_tables.sql
    <timestamp>_create_integration_tables.sql
    <timestamp>_create_metrics_tables.sql
    <timestamp>_create_monthly_review_tables.sql
    <timestamp>_create_optimization_and_action_tables.sql
    <timestamp>_create_merchant_product_tables.sql
    <timestamp>_create_report_tables.sql
    <timestamp>_create_sync_run_tables.sql
    <timestamp>_create_rls_helper_functions.sql
    <timestamp>_enable_rls_and_policies.sql
    <timestamp>_seed_development_data.sql
```

Migration principles:

- Use UUID primary keys.
- Use `created_at` and `updated_at` timestamps.
- Store UTC timestamps and display using the project timezone.
- Enable RLS on every client/project data table.
- Use helper functions such as `is_agency_admin()`, `current_client_id()`, and `can_access_project(project_uuid)`.
- Avoid frontend-only authorization.
- Keep development seed data separate from production schema.

## Proposed Service Structure

```text
services/
  windsor/
    client.ts
    mappings.ts
    normalizers.ts
  reporting/
    snapshots.ts
    periods.ts
    comparisons.ts
  metrics/
    kpis.ts
    charts.ts
    channels.ts
  merchant/
    products.ts
    issues.ts
    recommendations.ts
  optimizations/
    activity-log.ts
    approval.ts
  reports/
    pdf.ts
    archive.ts
  ai/
    monthly-summary.ts
    outcome-classification.ts
lib/
  supabase/
    browser.ts
    server.ts
    middleware.ts
  env.ts
types/
  database.ts
  view-models.ts
  metrics.ts
```

Service principles:

- Browser code must never call Windsor.ai directly.
- Windsor credentials must stay server-side.
- UI components should consume typed view models.
- Metrics formulas should be centralized and documented.
- Customer-facing AI text must remain editable and approval-gated before publication.

## Implementation Sequence

1. Stabilize project foundation.
   - Create minimal Next.js 15 App Router foundation.
   - Install dependencies.
   - Commit `pnpm-lock.yaml`.
   - Add lint, typecheck, and build scripts.
   - Run lint, typecheck, production build, and start verification.
2. Create Supabase schema.
   - Add migrations only after Task 1 review.
   - Add RLS helpers and policies.
   - Add development-only seed data.
3. Implement authentication.
   - Email/password login.
   - Password reset.
   - Protected routes.
   - Role-aware profile and project access.
4. Build approved static UI.
   - Final Marketing attekintes layout first.
   - Typed placeholder view models only.
   - Hungarian visible UI text.
5. Add integration foundation.
   - Project-to-account mappings.
   - Server-only Windsor client.
   - Sync run records.
6. Add live overview metrics.
   - KPI calculations.
   - Main chart.
   - Channel summary.
   - Refresh status and metric explanation modal.
7. Add monthly communication modules.
   - Summary editor.
   - Outcome block.
   - Current/completed/planned work.
   - Client action items.
8. Add Merchant Center module.
   - Feed health.
   - Product issues.
   - Client action list.
   - Attention products.
9. Add reports.
   - Snapshots.
   - Approval.
   - PDF generation.
   - Historical archive.
10. Add AI drafts.
    - Draft generation only.
    - Human approval required before client visibility.

## Risks and Blocking Questions

- Missing project guidance files: `AGENTS.md`, `PROJECT.md`, and `ROADMAP.md` were requested but do not exist. If they contain hidden project conventions, they must be added before deeper implementation.
- Empty repository: there is no existing foundation to stabilize, so Task 1 must create a minimal foundation instead of repairing an existing app.
- Runtime availability: direct `node` and `npm` commands were not available in the shell, although `pnpm` was available.
- shadcn/ui baseline: there is no existing design system to preserve yet; the first UI phase must establish tokens carefully.
- Supabase project configuration is unknown.
- Windsor.ai credentials, account mapping rules, and refresh cadence details are unknown.
- Report PDF generation technology is not yet selected.
- Vercel project and cron configuration are unknown.
- The exact first development seed client/project set needs confirmation, although the master spec suggests Eroll development data later.
- The approved product asks for all visible UI text in Hungarian, but internal docs/code can remain English; future copy review should enforce this.
