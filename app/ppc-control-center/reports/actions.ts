"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function assertUuid(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("Invalid client ID.");
  }
}

async function requireAgencyAdmin() {
  const currentUser = await requireCurrentUser();
  if (currentUser.profile.role !== "agency_admin") {
    throw new Error("Not authorized.");
  }
  return currentUser;
}

export async function regenerateReportShare(clientId: string) {
  await requireAgencyAdmin();
  assertUuid(clientId);

  const supabase = await createServerSupabaseClient();
  const token = randomBytes(32).toString("hex");
  const { error } = await supabase
    .from("client_report_shares")
    .update({
      token,
      is_active: true,
      revoked_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("client_id", clientId);

  if (error) {
    throw new Error("Could not regenerate report share link.");
  }

  revalidatePath("/ppc-control-center/reports");
}

export async function revokeReportShare(clientId: string) {
  await requireAgencyAdmin();
  assertUuid(clientId);

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("client_report_shares")
    .update({
      is_active: false,
      revoked_at: now,
      updated_at: now
    })
    .eq("client_id", clientId);

  if (error) {
    throw new Error("Could not revoke report share link.");
  }

  revalidatePath("/ppc-control-center/reports");
}
