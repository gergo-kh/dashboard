# Agent Instructions

This repository implements the approved V1 of the KonverzioHuszar client reporting portal. Treat `CODEX_MASTER_SPEC_KONVERZIOHUSZAR_V1.md` as the source of truth for product behavior, information architecture, UX, UI, data model, and implementation sequence.

## Permanent Engineering Rules

- Use Next.js 15 with the App Router.
- Use TypeScript everywhere.
- Never use `any`.
- Keep internal names, code, database columns, types, functions, and documentation in English.
- Keep business logic separate from UI components.
- Build reusable, typed modules and components.
- Centralize metric calculations and formulas in service code, not UI components.
- Use Supabase for authentication, PostgreSQL, Row Level Security, storage, and migrations.
- Use Row Level Security on all client/project data tables.
- Never rely only on frontend filtering for authorization.
- Use Windsor.ai only from server-side code, server actions, API routes, or background jobs.
- Never call Windsor.ai directly from browser code.
- Never expose API secrets in the browser.
- Never store secrets in the repository.
- Keep all customer-facing AI-generated text editable and approval-gated.
- Never publish AI-generated client text without explicit KonverzioHuszar agency approval.
- Do not implement database migrations, authentication, Windsor.ai integration, or business features unless the active task explicitly asks for them.

## Permanent UI Rules

- All visible UI text must be Hungarian.
- The portal is a client reporting and communication product, not an ad-management platform.
- The client must understand the main situation within 10-15 seconds.
- Prioritize conclusions, status, agency activity, and client actions over technical advertising metrics.
- Never show a negative result without an explanation, an action already taken or in progress, or a clear next step.
- Use the approved navigation only:
  - Marketing áttekintés
  - Teljesítmény
  - Merchant Center
  - Optimalizálások
  - Riportok
  - Beállítások
- Do not add V1 navigation for campaign management, analytics exploration, creative galleries, keyword management, search-term lists, or platform settings.
- Use Tailwind CSS and the shadcn/ui-based design system.
- Use design tokens; do not hardcode colors inside components unless establishing approved tokens.
- Keep the main workspace light and the desktop sidebar dark navy.
- Use concise Hungarian wording, strong hierarchy, responsive layouts, and accessible controls.
- Support loading, empty, partial data, stale data, sync failed, and permission denied states for every data module.
