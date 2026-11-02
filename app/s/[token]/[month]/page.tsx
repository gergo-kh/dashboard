import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SharedReportMonthPage({
  params
}: {
  params: Promise<{ token: string; month: string }>;
}) {
  const { token, month } = await params;

  if (!/^[a-f0-9]{64}$/.test(token) || !/^\d{4}-\d{2}$/.test(month)) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("resolve_client_report_share", {
    p_token: token,
    p_month: month
  });

  const resolved = data?.[0];

  if (error || !resolved) {
    notFound();
  }

  redirect(
    `/r/${resolved.client_slug}/${resolved.report_month}?share_token=${encodeURIComponent(token)}`
  );
}
