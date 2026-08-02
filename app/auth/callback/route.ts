import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { sanitizeInternalRedirectPath } from "@/lib/routing/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeInternalRedirectPath(requestUrl.searchParams.get("next"));
  const env = getPublicEnv();

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, env.NEXT_PUBLIC_APP_URL));
    }
  }

  return NextResponse.redirect(
    new URL("/update-password?recovery=expired", env.NEXT_PUBLIC_APP_URL)
  );
}
