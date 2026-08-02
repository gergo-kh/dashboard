# Integration Foundation V1

This document describes the Phase 5 server-side integration foundation for the KonverzioHuszar client portal. Product behavior remains governed by `CODEX_MASTER_SPEC_KONVERZIOHUSZAR_V1.md`.

## Phase 5 Scope

Phase 5 adds infrastructure only:

- server-only Windsor.ai adapter boundary,
- project/provider integration lookup,
- external account mapping validation,
- sync run lifecycle recording,
- normalized daily metric validation,
- idempotent daily metric persistence,
- deterministic fake Windsor transport for tests and local development.

The Phase 4 static overview remains unchanged. Phase 5 does not add live dashboard queries, Merchant Center product ingestion, report generation, AI features, cron jobs, queues, or hosted Supabase changes.

## Architecture

```text
lib/env/server.ts
  Server-only Windsor environment validation.

lib/integrations/windsor/
  client.ts      HTTP adapter with timeout, retry, and response validation.
  fake.ts        Deterministic local/test fake.
  normalize.ts   Strict daily metric normalization.
  schemas.ts     Zod response schemas.
  types.ts       Narrow adapter contract.

lib/integrations/
  metadata.ts    Provider and metadata validation.
  errors.ts      Sanitized typed error model.
  repository.ts  Server-side Supabase repository operations.

lib/integrations/sync/
  service.ts     Daily metric sync orchestration.
  types.ts       Sync input and result contracts.
```

All external-service code is server-only. Browser components must not import `lib/env/server.ts` or `lib/integrations/**`. Runtime checks are not the primary boundary: server-only modules use the Next.js `import "server-only";` guard so accidental imports from Client Components fail at build time.

## Server-Only Secret Boundary

Required server variables:

```text
WINDSOR_API_KEY=
WINDSOR_API_BASE_URL=
```

Rules:

- `WINDSOR_API_KEY` must never use `NEXT_PUBLIC_`.
- Windsor credentials are not stored in database tables, migrations, seeds, fixtures, logs, or docs.
- `WINDSOR_API_BASE_URL` must be HTTPS outside test environments.
- Missing or invalid server integration env throws a clear configuration error without echoing the key value.

`.env.example` contains placeholders only.

## Windsor Client Abstraction

The production-facing interface is intentionally narrow:

```ts
interface WindsorClient {
  fetchDailyMetrics(input: WindsorDailyMetricsRequest):
    Promise<WindsorDailyMetricsResponse>;
}
```

The HTTP client uses native `fetch`, `AbortController`, Zod validation, and sanitized typed errors.

Retry policy:

- retry transient `429` and `5xx` responses up to three total attempts,
- do not retry authentication failures,
- do not retry permanent validation or other `4xx` failures,
- treat timeout as `provider_unavailable`.

## Confirmed Facts Versus Mapping Assumptions

Confirmed by the approved product scope:

- Windsor.ai is the external integration layer.
- Google Ads, Meta Ads, TikTok Ads, and GA4 can feed daily overview metrics.
- Merchant Center may have account metadata in Phase 5, but product ingestion is out of scope.
- Secrets stay server-side.

Unconfirmed and intentionally isolated:

- the exact production Windsor.ai endpoint path,
- the exact raw field names returned by Windsor.ai,
- provider-specific account ID naming,
- whether Windsor daily responses include request IDs in production.

The current adapter contract is a Phase 5 internal contract used by the fake transport and tests. It must be confirmed against Windsor.ai before real API calls are enabled.

## Provider And Account Mapping

Supported provider identifiers:

- `google_ads`
- `meta_ads`
- `tiktok_ads`
- `ga4`
- `merchant_center`

Daily metric ingestion focuses on:

- `google_ads`
- `meta_ads`
- `tiktok_ads`
- `ga4`

`integration_accounts.metadata` may contain safe local or provider metadata only. Server validation rejects credential-like keys, including `api_key`, `token`, `access_token`, `refresh_token`, `secret`, `password`, and `authorization`, including nested object keys.

## Normalized Daily Metric Contract

The normalized metric contract maps to `daily_metrics`:

- `project_id`
- `account_id`
- `metric_date`
- `provider`
- `currency_code`
- `spend`
- `revenue`
- `purchases`
- `clicks`
- `impressions`
- `platform_conversions`
- `platform_conversion_value`
- `metadata.ingested_at`

Money and numeric metric values are handled as non-negative decimal strings before persistence. Missing optional values remain `null`; explicit zero remains `"0"`.

GA4 ecommerce revenue is stored in `revenue` for `ga4` rows. Advertising platform conversion value is stored in `platform_conversion_value` for ad-platform rows. The ingestion layer does not calculate blended ROAS, blended CPA, or merge GA4 revenue with platform-reported revenue.

`currency_code` is nullable in the database for legacy rows. Phase 5 ingestion must set a validated ISO currency code explicitly for every new normalized row. There is no default HUF or inferred currency. Rows with `currency_code is null` mean unknown/unbackfilled currency, not HUF.

## Migration

Phase 5 adds one backwards-compatible migration:

```text
20260802063523_add_daily_metrics_currency_code.sql
```

It adds:

- `daily_metrics.currency_code`,
- an ISO currency check constraint that allows legacy null values,
- a project/provider uniqueness constraint for `integrations`,
- a full account-scoped unique index for `daily_metrics(project_id, provider, account_id, metric_date)` so repository upserts match a real PostgreSQL conflict target,
- a currency/date index for metric queries.

No new tables are created.

## Sync Lifecycle

The sync service flow:

1. validate ISO date range,
2. load project/provider integration,
3. reject disabled or missing integrations,
4. check for an already running sync for the same project/provider/date range,
5. load active account mappings,
6. create a queued `sync_run`,
7. mark it running,
8. fetch Windsor rows per account,
9. validate and normalize all rows,
10. upsert daily metrics idempotently,
11. mark the integration connected and update sync timestamps,
12. mark the `sync_run` successful with fetched and persisted counts,
13. on failure, mark the `sync_run` failed with sanitized error code and message.

Batch behavior is deterministic all-or-nothing before metric writes: all account responses are fetched and normalized before the repository writes metric rows. The current Phase 5 implementation does not wrap metric upsert, integration status update, and final `sync_run` update in one database transaction. If an unexpected persistence failure happens after some database writes, the persisted state may be partially updated; retries remain idempotent because daily metrics use stable conflict keys and sync failures store sanitized error categories.

## Idempotency Strategy

Daily metrics are upserted by:

```text
project_id + provider + account_id + metric_date
```

The existing partial unique index supports account-scoped rows. Repeated syncs for the same provider/account/date update the same logical row instead of creating duplicates.

## Error Sanitization

Typed integration error categories:

- `configuration_error`
- `authentication_error`
- `rate_limited`
- `provider_unavailable`
- `invalid_response`
- `mapping_error`
- `persistence_error`
- `sync_conflict`

Persisted `sync_runs.error_message` contains the sanitized error category, not stack traces, raw payloads, authorization headers, user emails, or credentials.

## RLS And Client Visibility

Existing Phase 2 RLS remains intact:

- agency admins can manage integration metadata,
- client users cannot read `integrations`,
- client users cannot read `integration_accounts`,
- client users cannot read `sync_runs`,
- client users can read `daily_metrics` only for accessible projects.

Future client-facing refresh status should be exposed through a safe server-side view model or restricted derived view/function, not by opening internal sync tables to `client_user`.

## Local Fake Transport

`createFakeWindsorClient()` provides deterministic local/test behavior:

- multiple providers,
- explicit zero metric cases,
- missing metric cases,
- malformed payload mode,
- 429 mode,
- 500/provider unavailable mode,
- timeout mode,
- duplicate-date upsert coverage through the local harness.

It does not make network calls and does not replace the Phase 4 static overview data.

## Local Sync Command

Run the local fake sync harness:

```bash
pnpm integration:sync:local
```

The harness uses the fake Windsor client and in-memory repository by default. It runs the same date range twice and confirms the second run does not create duplicate daily metric rows. It also records a sanitized failure case. It does not call real Windsor.ai.

Run the local PostgreSQL-backed fake sync harness:

```bash
pnpm integration:sync:db:local
```

This harness uses the fake Windsor client, the real Supabase repository implementation, and the local Supabase PostgreSQL database. It refuses non-local Supabase URLs, signs in with the development-only local agency admin account, cleans only deterministic Eroll HU test rows for the fixed date range, runs the sync twice, checks no duplicate logical daily metric rows exist, verifies persisted successful `sync_runs`, records a deterministic failed sync, and checks the failed row contains only sanitized error information.

## Known Limitations

- The real Windsor.ai production request/response contract is not confirmed yet.
- No real Windsor.ai call is enabled in Phase 5.
- No hosted Supabase migration has been applied.
- No scheduled sync, cron, queue, or worker exists yet.
- The in-memory local harness and PostgreSQL-backed local harness are both test/development tools, not production jobs.
- Merchant Center product ingestion starts later and is not included here.

## Handoff To Phase 6

Phase 6 can consume this foundation by:

- confirming the real Windsor.ai contract,
- enabling a server-only real transport in a controlled environment,
- reading normalized `daily_metrics`,
- calculating KPI view models server-side,
- adding refresh status through a safe client-visible view model,
- preserving the Phase 4 UI structure while replacing static metric values with live server-derived data.
