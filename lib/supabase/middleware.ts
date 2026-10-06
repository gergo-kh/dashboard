import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { sanitizeInternalRedirectPath } from "@/lib/routing/redirects";
import type { Database } from "@/types/database";

const publicRoutes = new Set([
  "/login",
  "/reset-password",
  "/update-password",
  "/auth/callback"
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

  if (request.nextUrl.pathname.startsWith("/s/")) {
    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    const token = segments[1] ?? "";
    const requestedMonth = segments[2] ?? null;
    const validToken = /^[a-f0-9]{64}$/.test(token);
    const validMonth = requestedMonth === null || /^\d{4}-\d{2}$/.test(requestedMonth);

    if (validToken && validMonth) {
      const { data: share } = await supabase.rpc("resolve_client_report_share", {
        p_token: token,
        p_month: requestedMonth
      });
      const resolved = share?.[0];

      if (resolved) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = `/r/${resolved.client_slug}/${resolved.report_month}`;
        rewriteUrl.searchParams.set("share_token", token);
        return NextResponse.rewrite(rewriteUrl);
      }
    }

    return response;
  }

  const { data: claimsData } = await supabase.auth.getClaims();

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
