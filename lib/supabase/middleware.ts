import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { sanitizeInternalRedirectPath } from "@/lib/routing/redirects";
import type { Database } from "@/types/database";

const publicRoutes = new Set([
  "/login",
  "/reset-password",
  "/update-password",
  "/auth/callback",
  "/api/report-inspect-a73c92d44f8e4136a9b8e7f2"
]);

function isPublicRoute(pathname: string) {
  return publicRoutes.has(pathname) || pathname === "/s" || pathname.startsWith("/s/");
}

export type AuthRouteDecisionInput = {
  pathname: string;
  returnTo?: string;
  isAuthenticated: boolean;
};

export type AuthRouteDecision =
  | { type: "continue" }
  | { type: "redirect"; destination: string };

export function getAuthRouteDecision({
  pathname,
  returnTo,
  isAuthenticated
}: AuthRouteDecisionInput): AuthRouteDecision {
  if (isAuthenticated && pathname === "/login") {
    return { type: "redirect", destination: "/" };
  }

  if (!isAuthenticated && !isPublicRoute(pathname)) {
    const safeReturnTo = sanitizeInternalRedirectPath(returnTo ?? pathname);
    const next = safeReturnTo === "/" ? "" : `?next=${encodeURIComponent(safeReturnTo)}`;
    return { type: "redirect", destination: `/login${next}` };
  }

  return { type: "continue" };
}

function buildRedirectUrl(request: NextRequest, destination: string) {
  const redirectUrl = request.nextUrl.clone();
  const safeDestination = sanitizeInternalRedirectPath(destination);
  const [pathname, search] = safeDestination.split("?");
  redirectUrl.pathname = pathname;
  redirectUrl.search = search ? `?${search}` : "";
  return redirectUrl;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const pathname = request.nextUrl.pathname;
  const shareToken = request.nextUrl.searchParams.get("share_token");

  if (
    isPublicRoute(pathname) ||
    pathname === "/s" ||
    pathname.startsWith("/s/") ||
    (pathname.startsWith("/r/") && shareToken && /^[a-f0-9]{64}$/.test(shareToken))
  ) {
    return response;
  }

  const env = getPublicEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const claimsResult = await Promise.race([
    supabase.auth.getClaims().catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
  ]);
  const claimsData = claimsResult?.data ?? null;

  const decision = getAuthRouteDecision({
    pathname: request.nextUrl.pathname,
    returnTo: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    isAuthenticated: Boolean(claimsData?.claims)
  });

  if (decision.type === "redirect") {
    return NextResponse.redirect(buildRedirectUrl(request, decision.destination));
  }

  return response;
}
