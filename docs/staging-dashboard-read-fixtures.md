# Staging Dashboard Read Fixtures

This document describes the deterministic staging-only dashboard read fixture for the existing `kh-staging-client` / `kh-staging-hu` project.

## Scope

The fixture file is:

```text
supabase/fixtures/staging-dashboard-read-demo.sql
```

It creates or updates only deterministic demo records for:

- current and comparison `daily_metrics`,
- one approved `monthly_reviews` row,
- visible approved `optimization_items`,
- visible `client_action_items`,
- one published `reports` row,
- visible `merchant_products`,
- `product_daily_metrics`,
- one active `product_issues` row.

The rollback file is:

```text
supabase/fixtures/staging-dashboard-read-demo.rollback.sql
```

## Target Staging Base Records

The fixture requires these existing staging base records:

| Object | Required value |
| --- | --- |
| Client ID | `90000000-0000-4000-8000-000000000001` |
| Client slug | `kh-staging-client` |
| Project ID | `90000000-0000-4000-8000-000000000011` |
| Project slug | `kh-staging-hu` |
| Project currency | `HUF` |
| Agency admin profile ID | `219ab6cd-06b4-423c-a560-af2c05198f0f` |

If any required base record is missing or mismatched, the fixture raises an exception before writing dashboard data.

## Safety Rules

- Do not run this fixture against production.
- Do not run this fixture against hosted staging without explicit approval.
- Run the fixture inside a single explicit transaction.
- Use only staging database access approved for this operation.
- Do not add passwords, API keys, tokens, or real customer data.
- Do not call Windsor.ai.
- Do not modify Auth users.
- Do not modify Vercel or Supabase hosted configuration.

## Suggested Hosted Staging Execution

After separate approval:

```sql
\ir supabase/fixtures/staging-dashboard-read-demo.sql
```

The fixture file contains its own transaction wrapper, so all precondition checks and writes succeed or fail together. If using a SQL runner that does not support `\ir`, paste the reviewed SQL file content directly.

## Verification

Before applying to hosted staging, run locally:

```text
supabase start
supabase db reset --local
supabase test db --local supabase/tests
pnpm test:staging-fixture
pnpm test
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

The `pnpm test:staging-fixture` command:

- creates the required staging base records in a transaction,
- runs the actual fixture SQL,
- verifies expected record counts,
- runs the fixture a second time to verify idempotency,
- runs the rollback SQL,
- verifies that fixture records are removed,
- cleans up the local staging base records.

The command uses only the local Supabase database container through `psql`; it does not connect to hosted staging.

## Rollback

Rollback file:

```text
supabase/fixtures/staging-dashboard-read-demo.rollback.sql
```

Recommended rollback execution after separate approval:

```sql
\ir supabase/fixtures/staging-dashboard-read-demo.rollback.sql
```

The rollback file contains its own transaction wrapper and deletes only the deterministic fixture records by their approved fixture IDs.
