import { redirect } from "next/navigation";
import { getPublicEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export function buildPasswordResetRedirectUrl(appUrl = getPublicEnv().NEXT_PUBLIC_APP_URL) {
  const redirectUrl = new URL("/auth/callback", appUrl);
  redirectUrl.searchParams.set("next", "/update-password");
  return redirectUrl.toString();
}

export async function requestPasswordResetAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/reset-password?error=missing");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildPasswordResetRedirectUrl()
  });

  if (error) {
    redirect("/reset-password?error=generic");
  }

  redirect("/reset-password?sent=1");
}
