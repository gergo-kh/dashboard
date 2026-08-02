import "server-only";
import { IntegrationError } from "@/lib/integrations/errors";
import {
  assertSafeMetadata,
  type IntegrationProvider
} from "@/lib/integrations/metadata";
import type { NormalizedDailyMetric } from "@/lib/integrations/windsor/normalize";
import type { Database, Json } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type IntegrationRow = Database["public"]["Tables"]["integrations"]["Row"];
export type IntegrationAccountRow =
  Database["public"]["Tables"]["integration_accounts"]["Row"];
export type SyncRunRow = Database["public"]["Tables"]["sync_runs"]["Row"];

export type IntegrationMetadata = Record<string, Json>;

export type UpsertIntegrationInput = Readonly<{
  projectId: string;
  provider: IntegrationProvider;
  status: IntegrationRow["status"];
  lastError?: string | null;
  lastSyncAttemptAt?: string | null;
  lastSuccessfulSyncAt?: string | null;
}>;

export type UpsertIntegrationAccountInput = Readonly<{
  integrationId: string;
  externalAccountId: string;
  externalAccountName: string;
  accountType: IntegrationProvider;
  metadata?: IntegrationMetadata;
  isActive?: boolean;
}>;

export type CreateSyncRunInput = Readonly<{
  projectId: string;
  integrationId: string;
  syncType: string;
  metadata: IntegrationMetadata;
}>;

export type MarkSyncRunSuccessInput = Readonly<{
  syncRunId: string;
  recordsProcessed: number;
  completedAt: string;
  metadata: IntegrationMetadata;
}>;

export type MarkSyncRunFailureInput = Readonly<{
  syncRunId: string;
  completedAt: string;
  errorMessage: string;
  metadata: IntegrationMetadata;
}>;

export type IntegrationRepository = {
  getIntegrationByProjectAndProvider(input: {
    projectId: string;
    provider: IntegrationProvider;
  }): Promise<IntegrationRow | null>;
  listIntegrationAccounts(integrationId: string): Promise<IntegrationAccountRow[]>;
  upsertIntegration(input: UpsertIntegrationInput): Promise<IntegrationRow>;
  upsertIntegrationAccount(
    input: UpsertIntegrationAccountInput
  ): Promise<IntegrationAccountRow>;
  markIntegrationStatus(input: UpsertIntegrationInput): Promise<IntegrationRow>;
  createSyncRun(input: CreateSyncRunInput): Promise<SyncRunRow>;
  markSyncRunRunning(syncRunId: string): Promise<SyncRunRow>;
  markSyncRunSuccess(input: MarkSyncRunSuccessInput): Promise<SyncRunRow>;
  markSyncRunFailure(input: MarkSyncRunFailureInput): Promise<SyncRunRow>;
  upsertNormalizedDailyMetrics(rows: NormalizedDailyMetric[]): Promise<number>;
  getLatestSuccessfulSync(projectId: string): Promise<SyncRunRow | null>;
  findRunningDailyMetricsSync(input: {
    projectId: string;
    integrationId: string;
    dateFrom: string;
    dateTo: string;
  }): Promise<SyncRunRow | null>;
};

export function createSupabaseIntegrationRepository(
  supabase: SupabaseClient<Database>
): IntegrationRepository {
  async function upsertIntegration(input: UpsertIntegrationInput): Promise<IntegrationRow> {
    const { data, error } = await supabase
      .from("integrations")
      .upsert(
        {
          project_id: input.projectId,
          provider: input.provider,
          status: input.status,
          last_error: input.lastError ?? null,
          last_sync_attempt_at: input.lastSyncAttemptAt ?? null,
          last_successful_sync_at: input.lastSuccessfulSyncAt ?? null
        },
        { onConflict: "project_id,provider" }
      )
      .select("*")
      .single();

    if (error) {
      throw persistenceError("Could not upsert integration.");
    }

    return data;
  }

  return {
    async getIntegrationByProjectAndProvider({ projectId, provider }) {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("project_id", projectId)
        .eq("provider", provider)
        .maybeSingle();

      if (error) {
        throw persistenceError("Could not load integration.");
      }

      return data;
    },

    async listIntegrationAccounts(integrationId) {
      const { data, error } = await supabase
        .from("integration_accounts")
        .select("*")
        .eq("integration_id", integrationId)
        .order("external_account_name", { ascending: true });

      if (error) {
        throw persistenceError("Could not load integration accounts.");
      }

      return data;
    },

    upsertIntegration,

    async upsertIntegrationAccount(input) {
      assertSafeMetadata(input.metadata ?? {});

      const { data, error } = await supabase
        .from("integration_accounts")
        .upsert(
          {
            integration_id: input.integrationId,
            external_account_id: input.externalAccountId,
            external_account_name: input.externalAccountName,
            account_type: input.accountType,
            metadata: input.metadata ?? {},
            is_active: input.isActive ?? true
          },
          { onConflict: "integration_id,external_account_id" }
        )
        .select("*")
        .single();

      if (error) {
        throw persistenceError("Could not upsert integration account.");
      }

      return data;
    },

    markIntegrationStatus: upsertIntegration,

    async createSyncRun(input) {
      assertSafeMetadata(input.metadata);

      const { data, error } = await supabase
        .from("sync_runs")
        .insert({
          project_id: input.projectId,
          integration_id: input.integrationId,
          sync_type: input.syncType,
          status: "queued",
          metadata: input.metadata
        })
        .select("*")
        .single();

      if (error) {
        throw persistenceError("Could not create sync run.");
      }

      return data;
    },

    async markSyncRunRunning(syncRunId) {
      const { data, error } = await supabase
        .from("sync_runs")
        .update({ status: "running" })
        .eq("id", syncRunId)
        .select("*")
        .single();

      if (error) {
        throw persistenceError("Could not mark sync run as running.");
      }

      return data;
    },

    async markSyncRunSuccess(input) {
      assertSafeMetadata(input.metadata);

      const { data, error } = await supabase
        .from("sync_runs")
        .update({
          status: "success",
          completed_at: input.completedAt,
          records_processed: input.recordsProcessed,
          error_message: null,
          metadata: input.metadata
        })
        .eq("id", input.syncRunId)
        .select("*")
        .single();

      if (error) {
        throw persistenceError("Could not mark sync run as successful.");
      }

      return data;
    },

    async markSyncRunFailure(input) {
      assertSafeMetadata(input.metadata);

      const { data, error } = await supabase
        .from("sync_runs")
        .update({
          status: "failed",
          completed_at: input.completedAt,
          error_message: input.errorMessage,
          metadata: input.metadata
        })
        .eq("id", input.syncRunId)
        .select("*")
        .single();

      if (error) {
        throw persistenceError("Could not mark sync run as failed.");
      }

      return data;
    },

    async upsertNormalizedDailyMetrics(rows) {
      if (rows.length === 0) {
        return 0;
      }

      const { error } = await supabase.from("daily_metrics").upsert(
        rows.map((row) => ({
          project_id: row.projectId,
          account_id: row.integrationAccountId,
          metric_date: row.metricDate,
          provider: row.provider,
          currency_code: row.currencyCode,
          spend: row.spend,
          revenue: row.revenue,
          purchases: row.purchases,
          clicks: row.clicks,
          impressions: row.impressions,
          platform_conversions: row.platformConversions,
          platform_conversion_value: row.platformConversionValue,
          metadata: { ingested_at: row.ingestedAt }
        })),
        { onConflict: "project_id,provider,account_id,metric_date" }
      );

      if (error) {
        throw persistenceError("Could not upsert daily metrics.");
      }

      return rows.length;
    },

    async getLatestSuccessfulSync(projectId) {
      const { data, error } = await supabase
        .from("sync_runs")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "success")
        .order("completed_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw persistenceError("Could not load latest successful sync.");
      }

      return data;
    },

    async findRunningDailyMetricsSync({ projectId, integrationId, dateFrom, dateTo }) {
      const { data, error } = await supabase
        .from("sync_runs")
        .select("*")
        .eq("project_id", projectId)
        .eq("integration_id", integrationId)
        .eq("sync_type", "daily_metrics")
        .eq("status", "running")
        .contains("metadata", { date_from: dateFrom, date_to: dateTo })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw persistenceError("Could not check running sync runs.");
      }

      return data;
    }
  };
}

function persistenceError(message: string): IntegrationError {
  return new IntegrationError({
    code: "persistence_error",
    message
  });
}
