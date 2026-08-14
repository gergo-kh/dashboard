# Dashboard Read Path V1

This document closes Phase 6 for the KonverzioHuszar V1 portal. It describes how the approved static overview UI is now fed by server-side Supabase reads while keeping the remaining unconnected areas on typed static fallback data.

## Scope

Phase 6 completed the read foundation for the `Marketing attekintes` dashboard:

- selected project context from the authenticated user's accessible projects,
- approved monthly review content,
- report links and report status cards,
- visible optimization and client action items,
- daily-metric based KPI cards,
- daily, weekly, and monthly performance chart series,
- channel summary rows,
- merchant attention products,
- deterministic staging dashboard read fixtures.

Phase 6 does not perform live Windsor.ai ingestion, editor workflows, PDF generation, AI drafting, or production data backfills.

## Server-Side Flow

The protected portal page loads the authenticated profile first, then builds the overview view model server-side.

```text
app/(portal)/page.tsx
  -> requireCurrentUser()
  -> getOverviewDataContext({ currentUser })
  -> createOverviewViewModel(context)
  -> approved overview UI components
```

The overview service creates a Supabase server client from the current cookie-backed session. All repository calls run with the authenticated user's database role, so PostgreSQL Row Level Security remains the authorization boundary.

The service selects the active project from `currentUser.accessibleProjects`. If no project is accessible, the UI receives a safe empty project state instead of falling back to another tenant's data.

## Dashboard Section Mapping

| Dashboard section | Primary tables | Read behavior |
| --- | --- | --- |
| Project selector and portal context | `profiles`, `clients`, `projects` | Uses the server-loaded authenticated profile and accessible projects. The view model receives the selected project name, market, currency, timezone, report day, status, and assigned manager summary. |
| Monthly outcome and narrative summary | `monthly_reviews` | Loads the latest approved or published review for the selected project. Draft content is ignored. |
| Current work and completed optimizations | `optimization_items` | Loads approved, client-visible planned, in-progress, and completed items. Hidden or draft items are ignored. |
| Client action items | `client_action_items` | Loads visible client action records for the selected project and maps them into the existing action-item UI model. |
| Reports card | `reports` | Loads recent generated, approved, or published report records for the selected project. Draft/internal records are ignored. |
| KPI cards | `daily_metrics` | Aggregates current and comparison periods for paid media and GA4 rows. Missing data remains missing; it is not converted into real zero performance. |
| Performance chart | `daily_metrics` | Builds deterministic daily, weekly, and monthly chart series from the same current and comparison metric windows. |
| Channel summary | `daily_metrics` | Aggregates Google Ads, Meta Ads, TikTok Ads, and GA4 rows into channel-level spend, revenue, conversion, and ROAS summaries. |
| Attention products | `merchant_products`, `product_daily_metrics`, `product_issues` | Shows only visible products for the selected project with active issues and current-period product metrics. |

## Monthly Content Rules

Monthly review content is eligible only when it belongs to the selected project and is approved or published. The approved client-facing JSON summary must parse successfully before it is shown.

Optimization items are shown only when they are client-visible and approved. Client action items are read for the selected project and rendered as action-oriented communication, not as editable business workflow.

Report records are shown only when they are generated, approved, or published. Draft report states remain hidden from client users.

If any monthly JSON payload is missing or invalid, the dashboard falls back to a safe empty or static placeholder state for that section instead of crashing the whole overview.

## Metric Date Windows

Daily metrics use the latest available `daily_metrics.metric_date` for the selected project as the anchor date.

Current period:

- starts on the first day of the anchor date's month,
- ends on the anchor date.

Comparison period:

- starts on the first day of the previous month,
- ends on the same day number in the previous month,
- is capped to the last day of the previous month when needed.

Rows outside these windows are ignored. Rows with a currency that does not match the selected project's currency are ignored for currency-sensitive calculations.

## KPI Formulas

All formulas live in server-side overview service code. UI components receive already-calculated display models.

| KPI | Formula | Missing-data behavior |
| --- | --- | --- |
| Spend | Sum of `daily_metrics.spend` for paid media providers. | Missing paid rows produce an empty state, not an invented spend value. |
| Revenue | Sum of GA4 `daily_metrics.revenue`. | Missing GA4 revenue produces an empty state. |
| Purchases | Sum of GA4 `daily_metrics.purchases`. | Missing GA4 purchase rows produce an empty state. |
| Blended ROAS | GA4 revenue divided by paid media spend. | Calculated only when both numerator and denominator exist and spend is greater than zero. |
| Blended CPA | Paid media spend divided by GA4 purchases. | Calculated only when purchase count is greater than zero. |
| Average order value | GA4 revenue divided by GA4 purchases. | Calculated only when purchase count is greater than zero. |

Comparison percentage is calculated as:

```text
(current_value - comparison_value) / abs(comparison_value) * 100
```

When the comparison value is missing, the card shows a no-comparison state. Lower-is-better metrics, such as CPA, invert the positive/negative comparison label.

Zero and missing data are intentionally different:

- zero means the source reported a real `0`,
- missing means no trusted row or value was available.

## Chart And Channel Summary

The daily chart groups metric rows by date:

- revenue comes from GA4 revenue,
- spend comes from paid media spend,
- ROAS is revenue divided by spend when spend is greater than zero.

Weekly chart data is derived from the daily series by week bucket. Monthly chart data compares current-period and comparison-period totals.

The channel summary contains rows for:

- Google Ads,
- Meta Ads,
- TikTok Ads,
- GA4 webshop measurement.

Paid media rows use provider spend and provider conversion value. The total row uses paid spend and GA4 revenue to show blended performance.

## Merchant Attention Products

Merchant attention products are built from visible product records, current-period product metrics, and active product issues.

The read path:

1. Loads visible `merchant_products` for the selected project.
2. Finds the latest `product_daily_metrics.metric_date` for those products.
3. Builds the current month-to-date product metric window.
4. Loads `product_daily_metrics` rows for the visible products and period.
5. Loads active `product_issues` rows for the same selected project and visible products.
6. Returns the highest priority attention products.

Issue severity and issue type are derived from the approved issue fields and product metric context. Products without active visible issues do not appear in the attention list.

## JSON Validation

Repository rows are normalized with Zod before they enter the view model. Invalid JSON or malformed timestamp values are handled as data-quality failures for the affected section.

The dashboard should prefer a safe empty state over a runtime exception. A broken optional content section must not block the whole protected portal from rendering.

## RLS Expectations

The dashboard read path must continue to rely on PostgreSQL Row Level Security rather than frontend filtering.

Agency admins:

- can read all client and project data needed by the overview,
- can read all project-scoped dashboard rows through the existing RLS helpers.

Client users:

- can read only their own active profile,
- can read only their own client,
- can read only projects belonging to their client,
- can read only approved, published, or explicitly client-visible project data,
- cannot read another client's project rows,
- cannot read draft monthly reviews,
- cannot read hidden optimization items,
- cannot read internal integrations, integration accounts, or sync runs.

The server must use the authenticated user's Supabase session. Service-role credentials are not required for the browser dashboard read path and must not be exposed to the client.

Supabase Data API exposure and RLS are separate controls. Tables used by the browser-backed server client must have explicit grants for the intended database roles, and RLS policies must still enforce tenant and visibility rules.

## Staging Smoke Result

Phase 6 staging validation used the isolated staging systems:

- Supabase project ref: `shspxmmdzuxbwxqdugoa`,
- Vercel project: `kh-dashboard-staging`,
- staging URL: `https://kh-dashboard-staging.vercel.app`.

The Phase 6 staging read fixture was applied only to the deterministic staging client/project records. Verification confirmed the intended fixture record counts and relationships for daily metrics, monthly content, report content, merchant products, product metrics, and product issues.

The automatic staging deployment for commit `80992669319b9409f3d23da80acbe537ac558fce` reached `READY`. Runtime log review confirmed that the earlier dashboard runtime failure did not recur:

- digest `2601761348` was not observed again,
- the previous `roas_target` parsing issue was resolved,
- no new server runtime error was identified in the checked logs.

Before any production promotion, repeat the authenticated browser smoke with the staging agency admin and client user credentials:

- login and logout,
- protected route redirect behavior,
- KPI cards,
- performance chart,
- channel summary,
- monthly content,
- merchant attention products,
- console and network error review.

## Known Limitations And Follow-Ups

- Windsor.ai live calls remain disabled and outside the Phase 6 read path.
- The dashboard can only show live-like metrics where approved rows already exist in Supabase.
- Missing source data renders safe empty states.
- Future phases still own monthly editor workflows, Merchant Center deep-dive pages, PDF report generation, and AI draft approval flows.
- Production Supabase migrations, production seeds, and production Vercel changes require separate approval.
