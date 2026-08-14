# Overview Static UI V1

This document describes the Phase 4 approved static UI implementation for the KonverzioHuszar client portal. Product behavior remains governed by `CODEX_MASTER_SPEC_KONVERZIOHUSZAR_V1.md`.

## Scope

Phase 4 implements the final static and responsive `Marketing áttekintés` page and the protected portal shell. It uses manually authored, typed placeholder view models only.

This phase does not connect Windsor.ai, live advertising data, background jobs, PDF generation, AI chat, admin editing, or deeper module pages.

## Component Architecture

Portal shell components live under `components/portal/`:

- `PortalSidebar`
- `PortalMobileNav`
- `portalNavigationItems`

Overview components live under `components/overview/`:

- `OverviewHeader`
- `MonthlySummaryCard`
- `MonthlyOutcomeCard`
- `KpiGrid`
- `KpiCard`
- `MetricExplanationSheet`
- `PerformanceChart`
- `ChannelSummary`
- `WorkInProgressCard`
- `CompletedWorkCard`
- `ClientActionsCard`
- `NextMonthPlanCard`
- `ReportsCard`
- `AttentionProducts`

Reusable state components live under `components/ui/`:

- `SectionSkeleton`
- `EmptyState`
- `ErrorState`

The protected route behavior still uses the Phase 3 `requireCurrentUser()` helper. The UI receives accessible projects from the authenticated server-side profile flow, but all overview content is static placeholder content.

## Typed View Model

The main overview contracts are defined in `types/overview.ts`.

Static data is created in `lib/overview/static-data.ts` and includes:

- project selector items
- overview header
- management activity status
- date range and comparison options
- report status
- monthly summary
- positive, mixed, and weak monthly outcome examples
- exactly six KPI cards
- manually authored daily, weekly, and monthly Recharts series
- channel summary
- current work
- completed optimizations
- client action items
- next month plan
- reports
- attention products

The default rendered dataset is one coherent neutral demonstration example.

## Static Placeholder Strategy

The view model is deterministic and manually authored. No random mock-data generators are used.

Static controls look production-ready but remain non-destructive:

- agency project selector is active and persists the selected accessible project in the URL
- client project selector, date range, and comparison selectors are disabled with visible Hungarian explanations
- `Kérdezd az AI-t` is disabled and marked as coming soon.
- `Riport letöltése` is disabled.
- Merchant Center deep-link action is disabled.
- PDF download is disabled.
- sidebar report preview/download actions are disabled with a visible explanation.

The chart interval control is the one functional local interaction in this phase. It switches between manually authored daily, weekly, and monthly datasets and updates `aria-pressed` state without loading live data.

Missing data states are explicit and never rendered as real zero values.

## Design Tokens

Semantic CSS variables are defined in `app/globals.css`.

Key tokens:

- primary navy: `--kh-navy`
- secondary navy: `--kh-navy-soft`
- accent orange: `--kh-orange`
- chart revenue, spend, ROAS, grid, and axis tokens: `--kh-chart-*`
- online status tokens: `--kh-status-online` and `--kh-status-online-text`
- workspace background: `--background`
- cards: `--kh-card`
- borders, muted text, success, warning, danger, focus, and shadows

Components use these tokens instead of hardcoding repeated brand colors.

## Responsive Behavior

Desktop:

- fixed dark navy sidebar
- light main workspace
- dense two-column overview sections
- six KPI cards across the available width

Tablet:

- navigation switches to a drawer
- KPI cards use three columns around the tablet breakpoint
- action cards use two columns
- chart and channel summary stack when needed

Mobile:

- top mobile bar opens a focus-trapped drawer
- controls and cards stack
- channel summary and attention products become stacked card-like rows
- the overview page avoids horizontal page overflow

The helper `getNavigationModeForWidth()` documents the sidebar/drawer breakpoint behavior for tests.

## Accessibility Decisions

- The page uses semantic `header`, `nav`, `section`, `article`, table roles, and headings.
- Mobile drawer has `role="dialog"`, `aria-modal`, Escape close, and Tab trapping.
- Active navigation uses `aria-current="page"`.
- Disabled controls include visible Hungarian explanations, with `aria-describedby` where useful.
- KPI tooltips are keyboard accessible through focusable info buttons.
- Charts include an accessible textual summary and expose the current interval through `aria-pressed`.
- Color is paired with icons, labels, or text badges rather than used alone.
- Visible focus styles are centralized in `app/globals.css`.

## Loading, Empty, And Error States

Reusable states exist for sections:

- `SectionSkeleton`
- `EmptyState`
- `ErrorState`

The performance chart supports explicit `normal`, `loading`, `empty`, and `error` states. Client actions, attention products, missing current report, and no accessible projects use explicit empty states.

## Tests

`tests/overview-static-ui.test.ts` covers:

- overview view-model validation
- exactly six KPI cards
- approved navigation order
- project selector access, query-param, and scoping behavior
- positive, mixed, and weak monthly outcome rendering
- weak outcome corrective-action requirements
- metric formatting
- loading, empty, and error states
- missing data labels not rendered as real zero values
- responsive navigation helper behavior
- disabled AI/report controls
- accessibility labels for important actions

`tests/overview-components.test.tsx` covers:

- chart interval switching and `aria-pressed` updates
- chart design token configuration
- active agency project switching and disabled client/static-control explanations
- disabled sidebar report actions
- mobile drawer open/close behavior
- dialog open/close labels and focus return
- Escape close behavior for the completed-work sheet

## Known Limitations

- No live advertising data is loaded.
- No Windsor.ai integration is present.
- No real PDF generation is present.
- Non-overview module pages remain out of scope.
- Date/comparison selector changes are intentionally disabled until live period controls exist.
- Full browser E2E coverage is not included yet.

## Remaining Work

Phase 5:

- project-to-account mappings
- server-only Windsor.ai client
- sync run records
- metrics storage and refresh error tracking

Phase 6:

- live KPI calculations
- live chart and channel summaries
- refresh status
- production metric formulas and tooltips
