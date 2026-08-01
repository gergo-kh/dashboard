# Authentication V1

This document describes the Phase 3 Supabase authentication foundation for the KonverzioHuszar client portal. Product behavior remains governed by `CODEX_MASTER_SPEC_KONVERZIOHUSZAR_V1.md`.

## Auth Flow

- Users sign in with email and password at `/login`.
- Successful sign-in creates a Supabase cookie-backed session and redirects to `/`.
- Unauthenticated portal requests are redirected to `/login`.
- Authenticated users are redirected away from `/login` to `/`.
- Logout clears the Supabase session and redirects to `/login?signedOut=1`.

## Cookie And Session Model

- Browser and server clients use `@supabase/ssr`.
- Session state is stored in Supabase auth cookies.
- `middleware.ts` refreshes server-side auth state for application routes.
- Server code validates the authenticated user with Supabase Auth before loading profile data.
- Service-role keys are not required and must not be exposed to browser code.

## Protected Route Behavior

- `app/(portal)/layout.tsx` calls the typed current-user helper.
- Missing sessions redirect to `/login`.
- Missing, inactive, or unsupported profiles redirect to `/login` with a generic access message.
- The root portal page is a protected placeholder only; the final dashboard UI is out of scope for Phase 3.

## Role And Profile Loading

The current-user helper loads:

- the authenticated Supabase Auth user,
- the matching `profiles` row,
- the accessible project list.

Supported roles:

- `agency_admin`: can load every project visible through RLS.
- `client_user`: can load projects for its own `client_id`.

The helper handles expired sessions, missing profile rows, inactive profiles, and unsupported roles safely.

## Environment Variables

Required runtime variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is intentionally not required for browser authentication.

## Local Test Accounts

`supabase/seed.sql` creates local-only test accounts after `supabase db reset --local`.

| Role | Email | Password |
| --- | --- | --- |
| `agency_admin` | `agency-admin@example.invalid` | `LocalAgencyPass123!` |
| `client_user` | `client-user@example.invalid` | `LocalClientPass123!` |

These are development-only credentials using non-routable example email addresses.

## Password Reset Flow

1. The user requests a reset link at `/reset-password`.
2. The response is generic and does not reveal whether an email exists.
3. Local Supabase captures reset emails in Mailpit.
4. The reset link returns through `/auth/callback?next=/update-password`.
5. The callback exchanges the recovery code for a cookie session.
6. `/update-password` lets the user set a new password.
7. After a successful update, the user is signed out and redirected to `/login?updated=1`.

## Security Notes

- Authorization is enforced server-side and by PostgreSQL RLS.
- Frontend checks are only UI behavior, not authorization boundaries.
- No service-role key is used in browser authentication.
- No Windsor.ai integration is included in this phase.
- No hosted Supabase migrations are applied in this phase.
- Environment validation is centralized in `lib/env.ts`.

## Known Limitations

- No final dashboard UI is implemented yet.
- No social login is included.
- No production SMTP configuration is included.
- The local seed passwords are for local development only and must not be used in production.
