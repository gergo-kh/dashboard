# Project Overview

## Product Vision

KonverzióHuszár Ügyfélportál is a multi-client ecommerce marketing reporting and client-communication platform. The approved V1 replaces Looker Studio reports with a clearer portal that combines webshop-level business performance, paid media efficiency, explanation, agency activity, client actions, and the next monthly plan.

The core promise is:

> A KonverzióHuszár dolgozik rajta.

The interface must continuously communicate that the account is actively managed and that problems are already being addressed.

## Primary Goal

Replace Looker Studio with a reporting and client-communication portal that helps clients understand:

- what happened,
- what KonverzióHuszár completed,
- what KonverzióHuszár is currently working on,
- what the client needs to do,
- what the next monthly plan is.

The desired customer behavior is: "Minden hétfőn itt kezdem a hetet."

## Target Users

- `agency_admin`
  - Can see and manage every client and project.
  - Can edit summaries, plans, tasks, reports, and settings.
  - Can approve AI-generated content.
- `client_user`
  - Belongs to exactly one client.
  - Can see all projects of that client.
  - Has read-only access to reporting content.
  - May open external Merchant Center actions.
  - Cannot edit agency-generated content.

## Client and Project Model

- A client is a commercial relationship or company.
- A project is one specific webshop, market, or reporting unit.
- All reporting, integrations, monthly summaries, reports, Merchant Center tasks, and optimizations belong to a project, not directly to the client.
- One client may have multiple webshop projects.
- One webshop may have multiple country or regional versions.
- One client login can see all projects belonging to that client.
- KonverzióHuszár administrators can see all clients and projects.

## Main Modules

- Marketing áttekintés
  - Primary V1 page and main client entry point.
  - Shows KPI cards, monthly summary, performance chart, channel summary, current work, completed work, client actions, next monthly plan, reports, and attention products.
- Teljesítmény
  - Deeper but still client-friendly performance view.
- Merchant Center
  - Feed health, product issues, client action list, and prioritized product attention.
- Optimalizálások
  - Current, completed, previous, and planned work.
- Riportok
  - Monthly report archive, approval state, PDF download, and history.
- Beállítások
  - Agency-admin project/client configuration and client profile settings.

## Expected Scale

- Maximum approximately 50 agency clients.
- A client may have multiple projects.
- A project may map to multiple accounts per provider, including Google Ads, Meta Ads, GA4, Merchant Center, and optional TikTok Ads.

## Source of Truth

Use `CODEX_MASTER_SPEC_KONVERZIOHUSZAR_V1.md` for approved V1 behavior, architecture, data model, UX, UI, implementation priorities, acceptance criteria, and out-of-scope boundaries.
