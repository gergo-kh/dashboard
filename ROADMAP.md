# Roadmap

This roadmap follows the approved implementation sequence from `CODEX_MASTER_SPEC_KONVERZIOHUSZAR_V1.md`. Do not add new product modules without explicit approval.

## Phase 1: Stabilize Foundation

Deliverables:

- Install dependencies.
- Commit `pnpm-lock.yaml`.
- Run lint.
- Run TypeScript typecheck.
- Run production build.
- Fix all foundation-level errors.
- Confirm the application starts.

Review gate:

- Lint, typecheck, build, and start verification must pass before moving to database work.

Status:

- Completed in the foundation commit.

## Phase 2: Supabase Schema

Deliverables:

- Create Supabase migrations.
- Create RLS helper functions.
- Create RLS policies.
- Seed one agency admin in development only.
- Seed Eroll client and projects in development only.

Review gate:

- Schema and RLS review must pass before authentication work begins.
- No client/project data table may ship without RLS.

Status:

- Completed and merged into `main`.

## Phase 3: Authentication

Deliverables:

- Email/password login.
- Password reset.
- Protected application routes.
- Logout.
- Profile loading.
- Role-aware project selector.

Review gate:

- Agency admins must be able to access all projects.
- Client users must be restricted to their own client's projects.
- Authorization must not rely only on frontend filtering.

Status:

- Completed and merged into `main`.

## Phase 4: Approved Static UI

Deliverables:

- Implement the final Marketing áttekintés design precisely.
- Use typed placeholder view models only.
- Use Hungarian visible UI text.
- Avoid random mock generators.
- Add approved responsive behavior.
- Add required loading, empty, and error states.

Review gate:

- UI must match the approved page structure and navigation.
- No business integrations are required in this phase.

Status:

- Completed and merged into `main`.

## Phase 5: Integration Foundation

Deliverables:

- Project-to-account mappings.
- Server-only Windsor.ai client.
- Sync run records.
- Daily metrics storage.
- Refresh error tracking.

Review gate:

- Windsor.ai credentials must remain server-side.
- Browser code must never call Windsor.ai directly.

Status:

- Completed and merged into `main` via Phase 5 PR #4.

## Phase 6: Live Overview Metrics

Deliverables:

- KPI calculations.
- Main performance chart.
- Channel summary.
- Refresh status.
- Metric tooltips and calculation explanation.

Review gate:

- KPI formulas must match the master specification.
- Missing data must never be displayed as real zero data.

## Phase 7: Monthly Communication

Deliverables:

- Monthly summary editor.
- Monthly outcome block.
- Current work.
- Completed work.
- Client action items.
- Next month plan.

Review gate:

- Client-visible monthly content must be approved.
- Weak months must include corrective actions.

## Phase 8: Merchant Center

Deliverables:

- Product feed health.
- Product metrics.
- Product issues.
- Client actions.
- Attention products.

Review gate:

- Every issue must explain what is wrong, why it matters, and what the client should do.
- Only Google Shopping / Merchant Center products are in scope for V1.

## Phase 9: Reports

Deliverables:

- Monthly snapshots.
- Approval workflow.
- PDF generation.
- Historical archive.
- Report download.

Review gate:

- Published historical reports must remain immutable except through an explicit revision workflow.
- Reports must use approved monthly content.

## Phase 10: AI Drafts

Deliverables:

- Monthly summary draft.
- Outcome draft.
- Corrective action draft.
- Approval workflow.

Review gate:

- AI is an assistant, never the final publisher.
- AI-generated client text must be grounded in project data and approved before publication.
- AI must not invent causes, promise performance improvement, or make unsupported numerical forecasts.
