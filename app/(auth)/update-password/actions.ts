"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    redirect("/update-password?error=weak");
  }

  if (password !== confirmPassword) {
    redirect("/update-password?error=mismatch");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/update-password?recovery=expired");
  }

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    redirect("/update-password?error=generic");
  }

  await supabase.auth.signOut();
  redirect("/login?updated=1");
}
