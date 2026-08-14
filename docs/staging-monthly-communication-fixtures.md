# Staging Monthly Communication Fixtures

This document describes the deterministic staging-only fixture for the monthly communication workflow on the existing `kh-staging-client` / `kh-staging-hu` project.

## Scope

The fixture file is:

```text
supabase/fixtures/staging-monthly-communication-demo.sql
```

It creates or updates only deterministic demo records for:

- one `draft` monthly review,
- one `review` monthly review,
- one `approved` monthly review,
- one `published` monthly review,
- one hidden and one visible `optimization_items` row,
- one draft and one visible `client_action_items` row,
- workflow verification of approval metadata, corrective actions, and client-visible read behavior.

The rollback file is:

```text
supabase/fixtures/staging-monthly-communication-demo.rollback.sql
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
| Client user profile ID | `1e0957db-1b2b-4803-888e-c3e6d5b26d3c` |

If any required base record is missing or mismatched, the fixture raises an exception before writing monthly communication data.

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
\ir supabase/fixtures/staging-monthly-communication-demo.sql
```

The fixture file contains its own transaction wrapper, so all precondition checks and writes succeed or fail together. If using a SQL runner that does not support `\ir`, paste the reviewed SQL file content directly.

## Verification

Before applying to hosted staging, run locally:

```text
supabase start
supabase db reset --local
supabase test db --local supabase/tests
pnpm test:staging-monthly-fixture
pnpm test
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

The `pnpm test:staging-monthly-fixture` command:

- creates the required staging base records in a local transaction,
- runs the actual fixture SQL,
- verifies expected monthly review, optimization, and client action records,
- verifies client-user RLS visibility for draft/review/approved/published content,
- runs the fixture a second time to verify idempotency,
- runs the rollback SQL,
- verifies that fixture records are removed,
- cleans up the local staging base records.

The command uses only the local Supabase database container through `psql`; it does not connect to hosted staging.

## Rollback

Rollback file:

```text
supabase/fixtures/staging-monthly-communication-demo.rollback.sql
```

Recommended rollback execution after separate approval:

```sql
\ir supabase/fixtures/staging-monthly-communication-demo.rollback.sql
```

The rollback file contains its own transaction wrapper and deletes only the deterministic fixture records by their approved fixture IDs.
