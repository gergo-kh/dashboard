# Staging Plan V1

This document defines the staging rollout plan for the KonverzioHuszar client portal after Phase 5. It is a planning artifact only: no hosted Supabase project, Vercel deployment, remote migration, production configuration, or Windsor.ai live call is created by this document.

## Goals

- Create a separate Vercel staging environment.
- Create a separate hosted Supabase staging project.
- Keep staging and production fully isolated.
- Use staging-only environment variables and credentials.
- Apply Supabase migrations safely to staging.
- Use only test or staging seed data.
- Validate `agency_admin` and `client_user` sign-in.
- Validate protected routes, RLS, and project access.
- Smoke test the Phase 4 static dashboard in a browser.
- Keep real Windsor.ai calls disabled.
- Avoid any production deployment.

## Required Approvals And Credentials

The following items require explicit user approval before execution:

- Create or select the Vercel staging project.
- Create or select the hosted Supabase staging project.
- Provide staging Supabase project URL and publishable key.
- Provide staging-only Supabase access token or database credentials for migration deployment.
- Configure Supabase Auth Site URL and redirect URLs.
- Configure Vercel environment variables.
- Create staging Auth users.
- Run migrations against hosted staging.
- Deploy to the Vercel staging project.
- Enable any real Windsor.ai credential or request path.

Production credentials, production Supabase project references, and production Vercel environment variables must not be used for staging.

## Vercel Setup

Recommended setup:

- Use a dedicated Vercel project for staging, separate from production.
- Connect the GitHub repository to the staging project.
- Restrict automatic deployments to the intended staging branch, for example `staging`.
- Keep production deployment disabled for this staging project.
- Configure Preview or Production environment variables in this staging-only project according to the chosen Vercel workflow.
- Do not promote staging deployments to production.

Suggested branch model:

- `main`: source of reviewed application code.
- `staging`: deployment branch for the staging Vercel project.
- feature branches: pull requests into `main`, not direct staging deployments unless explicitly approved.

Alternative:

- Use Vercel Preview deployments from a dedicated `staging` branch with branch-scoped Preview environment variables.
- Only use this if branch-scoped environment variables are verified in the Vercel dashboard before deploy.

## Supabase Setup

Recommended setup:

- Create a dedicated hosted Supabase project named for staging.
- Do not link the repository to production before staging validation is complete.
- Keep staging Auth, PostgreSQL, RLS, Storage, and API keys separate from production.
- Configure Auth email templates and SMTP only with staging-safe settings.
- Set the Supabase Site URL to the staging Vercel URL.
- Add redirect URLs for:
  - `https://<staging-domain>/auth/callback`
  - `https://<staging-domain>/update-password`
  - local callback URLs only if a specific local staging validation is approved.
- Keep RLS enabled through migrations, never through dashboard-only manual changes.

The hosted staging database must start empty except Supabase-managed schemas. Application schema should come only from repository migrations.

## Environment Variables

Vercel staging variables:

```text
NEXT_PUBLIC_APP_URL=https://<staging-domain>
NEXT_PUBLIC_SUPABASE_URL=https://<staging-supabase-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging-publishable-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<optional-staging-transition-fallback>
WINDSOR_API_KEY=<disabled-placeholder-or-staging-only-value>
WINDSOR_API_BASE_URL=https://windsor-api.example.invalid
```

Rules:

- `NEXT_PUBLIC_*` values are browser-visible and must never contain secrets.
- `WINDSOR_API_KEY` is server-only and must be staging-only if ever configured.
- Keep `WINDSOR_API_BASE_URL` pointed at the disabled placeholder until real Windsor.ai activation is separately approved.
- Do not configure `SUPABASE_SERVICE_ROLE_KEY` for the browser app.
- If a service-role key is ever needed for an administrative staging script, store it outside the browser deployment environment and approve that script separately.
- Do not commit `.env.local`, `.env.staging.local`, Vercel project metadata containing IDs, or copied hosted credentials.

## Migration Order

Perform these steps only after staging project approval:

1. Confirm the working tree is clean and the reviewed commit is selected.
2. Confirm the target Supabase project is the staging project, not production.
3. Confirm local validation still passes against the local Supabase stack.
4. Review migration files in timestamp order under `supabase/migrations/`.
5. Apply migrations to hosted staging only.
6. Verify all required tables, enum types, foreign keys, triggers, helper functions, and RLS policies exist.
7. Run Supabase database lint and advisors against staging if available and approved.
8. Do not run production migrations.

Recommended migration sequence:

- Phase 2 base schema migrations.
- Phase 2 RLS helper and policy migrations.
- Phase 5 daily metrics currency and integration uniqueness migration.

Do not skip migrations or recreate tables manually from the dashboard.

## Staging Seed Strategy

Seed data must be staging-only and non-production:

- one placeholder `agency_admin` Auth user,
- one placeholder `client_user` Auth user,
- Eroll staging client,
- Eroll HU, RO, HR, and EU staging projects,
- safe integration account mappings with fake external account IDs,
- optional deterministic daily metric examples only if needed for smoke testing.

Rules:

- No real passwords, personal email addresses, API keys, tokens, or customer secrets.
- No production client data.
- No real Windsor.ai calls.
- Seed scripts must be reviewed before running against hosted staging.
- If Auth users are created manually in Supabase Dashboard, record only their role and test purpose in docs, not passwords.

## Pre-Deploy Validation

Run locally before any staging deployment:

```text
supabase start
supabase db reset --local
supabase test db --local supabase/tests
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm integration:sync:local
pnpm integration:sync:db:local
```

Required outcomes:

- migrations apply from scratch,
- local seed succeeds,
- RLS tests pass,
- application tests pass,
- lint, typecheck, and build pass,
- local integration harnesses use fake Windsor only,
- no hosted Supabase URL is accepted by local-only harnesses.

## Post-Deploy Validation

After an approved staging deployment:

1. Open the staging URL.
2. Confirm unauthenticated users redirect to `/login`.
3. Sign in as staging `agency_admin`.
4. Confirm the protected portal loads.
5. Confirm the Phase 4 static Marketing áttekintés dashboard renders.
6. Sign out and confirm the session is cleared.
7. Sign in as staging `client_user`.
8. Confirm only that client's projects are accessible.
9. Confirm another client's project is not accessible.
10. Confirm inactive or missing profile handling remains safe if tested.
11. Confirm client users cannot read internal integration tables or sync runs.
12. Confirm no browser console errors.
13. Confirm no request is made to real Windsor.ai.
14. Confirm no production Supabase URL or production Vercel URL appears in runtime configuration.

## Security Checks

Before and after staging deployment, verify:

- no committed real secrets,
- no `NEXT_PUBLIC_WINDSOR` variables,
- no `SUPABASE_SERVICE_ROLE_KEY` in browser deployment variables,
- staging environment variables point only to staging services,
- production Supabase URL is absent,
- production Vercel project is untouched,
- RLS remains enabled on all client/project data tables,
- `agency_admin` can manage tenant data in staging,
- `client_user` can read only allowed tenant data,
- draft, hidden, integration, and sync data remain inaccessible to client users,
- password reset callback uses the trusted staging `NEXT_PUBLIC_APP_URL`,
- Windsor.ai live calls remain disabled.

## Rollback Plan

Application rollback:

- Use Vercel's deployment history for the staging project.
- Roll back only the staging deployment.
- Do not promote staging to production as a rollback mechanism.

Database rollback:

- Prefer restoring the staging Supabase project from a backup or recreating staging from migrations and seed data.
- Do not manually edit production.
- If a migration must be reverted, create a reviewed rollback migration and apply it only to staging after approval.
- Keep staging seed data disposable so the project can be rebuilt from scratch.

## Staging Exit Gate

Phase 6 should not begin against hosted staging until:

- staging Vercel project exists,
- staging Supabase project exists,
- all migrations are applied to staging,
- staging-only environment variables are configured,
- staging seed users can sign in,
- protected routes pass browser smoke tests,
- RLS access checks pass,
- Phase 4 static dashboard renders in staging,
- no real Windsor.ai call is made,
- production remains unchanged.

