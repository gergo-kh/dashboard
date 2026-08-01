import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export function buildPasswordResetRedirectUrl(origin: string) {
  const redirectUrl = new URL("/auth/callback", origin);
  redirectUrl.searchParams.set("next", "/update-password");
  return redirectUrl.toString();
}

export async function requestPasswordResetAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/reset-password?error=missing");
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://127.0.0.1:3000";
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildPasswordResetRedirectUrl(origin)
  });

  if (error) {
    redirect("/reset-password?error=generic");
  }

  redirect("/reset-password?sent=1");
}
