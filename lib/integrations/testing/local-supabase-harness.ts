import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createDailyMetricsSyncService } from "@/lib/integrations/sync/service";
import { createSupabaseIntegrationRepository } from "@/lib/integrations/repository";
import { createFakeWindsorClient } from "@/lib/integrations/windsor/fake";
import type { Database } from "@/types/database";

const localHarnessProjectId = "00000000-0000-4000-8000-000000000011";
const localHarnessIntegrationId = "00000000-0000-4000-8000-000000000301";
const localHarnessAccountId = "00000000-0000-4000-8000-000000000401";
const localHarnessDateFrom = "2026-07-01";
const localHarnessDateTo = "2026-07-02";

export type LocalSupabaseHarnessConfig = Readonly<{
  supabaseUrl: string;
  supabasePublishableKey: string;
}>;

export type LocalSupabaseSyncHarnessResult = Readonly<{
  first: {
    fetchedRows: number;
    persistedRows: number;
    dailyMetricRows: number;
  };
  second: {
    fetchedRows: number;
    persistedRows: number;
    dailyMetricRows: number;
  };
  successSyncRuns: number;
  failedSyncRuns: number;
  duplicateLogicalRows: number;
  sanitizedFailure: boolean;
}>;

export function resolveLocalSupabaseHarnessConfig(
  env: NodeJS.ProcessEnv = process.env
): LocalSupabaseHarnessConfig {
  const localEnv = readDotEnvLocal();
  const supabaseUrl =
    env.LOCAL_SUPABASE_URL ??
    env.NEXT_PUBLIC_SUPABASE_URL ??
    localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    env.LOCAL_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Local Supabase sync harness requires LOCAL_SUPABASE_URL and LOCAL_SUPABASE_PUBLISHABLE_KEY, or the matching local NEXT_PUBLIC_SUPABASE values."
    );
  }

  assertLocalSupabaseUrl(supabaseUrl);

  return { supabaseUrl, supabasePublishableKey };
}

function readDotEnvLocal(): Record<string, string> {
  if (!existsSync(".env.local")) {
    return {};
  }

  return readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce<Record<string, string>>((values, line) => {
      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        return values;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      return { ...values, [key]: value };
    }, {});
}

export async function runLocalSupabaseSyncHarness(
  config = resolveLocalSupabaseHarnessConfig()
): Promise<LocalSupabaseSyncHarnessResult> {
  const supabase = createClient<Database>(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      }
    }
  );

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: "agency-admin@example.invalid",
    password: "LocalAgencyPass123!"
  });

  if (signInError) {
    throw new Error("Local Supabase sync harness could not sign in as agency_admin.");
  }

  await cleanHarnessRows(supabase);

  const repository = createSupabaseIntegrationRepository(supabase);
  const service = createDailyMetricsSyncService({
    repository,
    windsorClient: createFakeWindsorClient("success"),
    now: () => new Date("2026-08-02T08:00:00.000Z")
  });

  const first = await service.syncDailyMetrics({
    projectId: localHarnessProjectId,
    provider: "google_ads",
    dateFrom: localHarnessDateFrom,
    dateTo: localHarnessDateTo
  });

  if (first.status !== "success") {
    throw new Error(`First local DB sync failed with ${first.errorCode}.`);
  }

  const firstDailyRows = await loadHarnessDailyMetrics(supabase);

  const second = await service.syncDailyMetrics({
    projectId: localHarnessProjectId,
    provider: "google_ads",
    dateFrom: localHarnessDateFrom,
    dateTo: localHarnessDateTo
  });

  if (second.status !== "success") {
    throw new Error(`Second local DB sync failed with ${second.errorCode}.`);
  }

  const secondDailyRows = await loadHarnessDailyMetrics(supabase);

  const failingService = createDailyMetricsSyncService({
    repository,
    windsorClient: createFakeWindsorClient("provider_unavailable"),
    now: () => new Date("2026-08-02T08:05:00.000Z")
  });
  const failed = await failingService.syncDailyMetrics({
    projectId: localHarnessProjectId,
    provider: "google_ads",
    dateFrom: localHarnessDateFrom,
    dateTo: localHarnessDateTo
  });

  if (failed.status !== "failed") {
    throw new Error("Expected deterministic fake failure to be recorded.");
  }

  const syncRuns = await loadHarnessSyncRuns(supabase);
  const failedRuns = syncRuns.filter((syncRun) => syncRun.status === "failed");
  const persistedFailure = failedRuns.at(-1);
  const persistedFailureText = JSON.stringify(persistedFailure ?? {});

  return {
    first: {
      fetchedRows: first.fetchedRows,
      persistedRows: first.persistedRows,
      dailyMetricRows: firstDailyRows.length
    },
    second: {
      fetchedRows: second.fetchedRows,
      persistedRows: second.persistedRows,
      dailyMetricRows: secondDailyRows.length
    },
    successSyncRuns: syncRuns.filter((syncRun) => syncRun.status === "success").length,
    failedSyncRuns: failedRuns.length,
    duplicateLogicalRows: countDuplicateLogicalDailyRows(secondDailyRows),
    sanitizedFailure:
      persistedFailure?.error_message === "provider_unavailable" &&
      !/api_key|access_token|refresh_token|authorization|bearer|stack|secret/i.test(
        persistedFailureText
      )
  };
}

export function assertLocalSupabaseUrl(value: string): void {
  const url = new URL(value);
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

  if (url.protocol !== "http:" || !localHosts.has(url.hostname) || url.port !== "54321") {
    throw new Error("Local Supabase sync harness refuses non-local Supabase URLs.");
  }
}

async function cleanHarnessRows(supabase: ReturnType<typeof createClient<Database>>) {
  await requireSuccess(
    supabase
      .from("sync_runs")
      .delete()
      .eq("project_id", localHarnessProjectId)
      .eq("integration_id", localHarnessIntegrationId)
      .eq("sync_type", "daily_metrics")
      .contains("metadata", {
        date_from: localHarnessDateFrom,
        date_to: localHarnessDateTo,
        provider: "google_ads"
      }),
    "Could not clean local harness sync rows."
  );

  await requireSuccess(
    supabase
      .from("daily_metrics")
      .delete()
      .eq("project_id", localHarnessProjectId)
      .eq("provider", "google_ads")
      .eq("account_id", localHarnessAccountId)
      .gte("metric_date", localHarnessDateFrom)
      .lte("metric_date", localHarnessDateTo),
    "Could not clean local harness metric rows."
  );
}

async function loadHarnessDailyMetrics(
  supabase: ReturnType<typeof createClient<Database>>
) {
  const { data, error } = await supabase
    .from("daily_metrics")
    .select("id, project_id, provider, account_id, metric_date, currency_code, spend")
    .eq("project_id", localHarnessProjectId)
    .eq("provider", "google_ads")
    .eq("account_id", localHarnessAccountId)
    .gte("metric_date", localHarnessDateFrom)
    .lte("metric_date", localHarnessDateTo);

  if (error) {
    throw new Error("Could not load local harness metric rows.");
  }

  return data;
}

async function loadHarnessSyncRuns(supabase: ReturnType<typeof createClient<Database>>) {
  const { data, error } = await supabase
    .from("sync_runs")
    .select("*")
    .eq("project_id", localHarnessProjectId)
    .eq("integration_id", localHarnessIntegrationId)
    .eq("sync_type", "daily_metrics")
    .contains("metadata", {
      date_from: localHarnessDateFrom,
      date_to: localHarnessDateTo,
      provider: "google_ads"
    })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Could not load local harness sync rows.");
  }

  return data;
}

function countDuplicateLogicalDailyRows(
  rows: Awaited<ReturnType<typeof loadHarnessDailyMetrics>>
): number {
  const keys = new Set<string>();
  let duplicates = 0;

  rows.forEach((row) => {
    const key = `${row.project_id}:${row.provider}:${row.account_id}:${row.metric_date}`;

    if (keys.has(key)) {
      duplicates += 1;
      return;
    }

    keys.add(key);
  });

  return duplicates;
}

async function requireSuccess(
  query: PromiseLike<{ error: { message: string } | null }>,
  message: string
) {
  const { error } = await query;

  if (error) {
    throw new Error(message);
  }
}
