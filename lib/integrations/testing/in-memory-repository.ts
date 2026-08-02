import { assertServerOnlyModule } from "@/lib/server-only";
import type {
  IntegrationAccountRow,
  IntegrationMetadata,
  IntegrationRepository,
  IntegrationRow,
  SyncRunRow,
  UpsertIntegrationAccountInput,
  UpsertIntegrationInput
} from "@/lib/integrations/repository";
import { assertSafeMetadata, type IntegrationProvider } from "@/lib/integrations/metadata";
import type { NormalizedDailyMetric } from "@/lib/integrations/windsor/normalize";

assertServerOnlyModule("In-memory integration repository");

type StoredDailyMetric = NormalizedDailyMetric;

export type InMemoryIntegrationRepository = IntegrationRepository & {
  getDailyMetrics(): StoredDailyMetric[];
  getSyncRuns(): SyncRunRow[];
  seedIntegration(input: UpsertIntegrationInput): Promise<IntegrationRow>;
  seedIntegrationAccount(
    input: UpsertIntegrationAccountInput
  ): Promise<IntegrationAccountRow>;
};

export function createInMemoryIntegrationRepository(): InMemoryIntegrationRepository {
  const integrations = new Map<string, IntegrationRow>();
  const accounts = new Map<string, IntegrationAccountRow>();
  const syncRuns = new Map<string, SyncRunRow>();
  const dailyMetrics = new Map<string, StoredDailyMetric>();
  let sequence = 1;

  function nextId(prefix: string): string {
    const id = `${prefix}-${String(sequence).padStart(4, "0")}`;
    sequence += 1;
    return id;
  }

  function now(): string {
    return "2026-08-02T00:00:00.000Z";
  }

  async function upsertIntegration(input: UpsertIntegrationInput): Promise<IntegrationRow> {
    const existing = [...integrations.values()].find(
      (integration) =>
        integration.project_id === input.projectId && integration.provider === input.provider
    );
    const timestamp = now();
    const row: IntegrationRow = {
      id: existing?.id ?? nextId("integration"),
      project_id: input.projectId,
      provider: input.provider,
      status: input.status,
      last_successful_sync_at: input.lastSuccessfulSyncAt ?? null,
      last_sync_attempt_at: input.lastSyncAttemptAt ?? null,
      last_error: input.lastError ?? null,
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp
    };

    integrations.set(row.id, row);
    return row;
  }

  async function upsertIntegrationAccount(
    input: UpsertIntegrationAccountInput
  ): Promise<IntegrationAccountRow> {
    assertSafeMetadata(input.metadata ?? {});

    const existing = [...accounts.values()].find(
      (account) =>
        account.integration_id === input.integrationId &&
        account.external_account_id === input.externalAccountId
    );
    const timestamp = now();
    const row: IntegrationAccountRow = {
      id: existing?.id ?? nextId("account"),
      integration_id: input.integrationId,
      external_account_id: input.externalAccountId,
      external_account_name: input.externalAccountName,
      account_type: input.accountType,
      metadata: input.metadata ?? {},
      is_active: input.isActive ?? true,
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp
    };

    accounts.set(row.id, row);
    return row;
  }

  function syncRunBase(input: {
    projectId: string;
    integrationId: string | null;
    syncType: string;
    metadata: IntegrationMetadata;
  }): SyncRunRow {
    const timestamp = now();

    return {
      id: nextId("sync"),
      project_id: input.projectId,
      integration_id: input.integrationId,
      sync_type: input.syncType,
      status: "queued",
      started_at: timestamp,
      completed_at: null,
      records_processed: 0,
      error_message: null,
      metadata: input.metadata,
      created_at: timestamp,
      updated_at: timestamp
    };
  }

  return {
    async getIntegrationByProjectAndProvider({ projectId, provider }) {
      return (
        [...integrations.values()].find(
          (integration) =>
            integration.project_id === projectId && integration.provider === provider
        ) ?? null
      );
    },

    async listIntegrationAccounts(integrationId) {
      return [...accounts.values()].filter(
        (account) => account.integration_id === integrationId
      );
    },

    upsertIntegration,
    seedIntegration: upsertIntegration,
    upsertIntegrationAccount,
    seedIntegrationAccount: upsertIntegrationAccount,
    markIntegrationStatus: upsertIntegration,

    async createSyncRun(input) {
      assertSafeMetadata(input.metadata);
      const row = syncRunBase({
        projectId: input.projectId,
        integrationId: input.integrationId,
        syncType: input.syncType,
        metadata: input.metadata
      });

      syncRuns.set(row.id, row);
      return row;
    },

    async markSyncRunRunning(syncRunId) {
      return updateSyncRun(syncRuns, syncRunId, { status: "running" });
    },

    async markSyncRunSuccess(input) {
      assertSafeMetadata(input.metadata);

      return updateSyncRun(syncRuns, input.syncRunId, {
        status: "success",
        completed_at: input.completedAt,
        records_processed: input.recordsProcessed,
        error_message: null,
        metadata: input.metadata
      });
    },

    async markSyncRunFailure(input) {
      assertSafeMetadata(input.metadata);

      return updateSyncRun(syncRuns, input.syncRunId, {
        status: "failed",
        completed_at: input.completedAt,
        error_message: input.errorMessage,
        metadata: input.metadata
      });
    },

    async upsertNormalizedDailyMetrics(rows) {
      rows.forEach((row) => {
        dailyMetrics.set(
          `${row.projectId}:${row.provider}:${row.integrationAccountId}:${row.metricDate}`,
          row
        );
      });

      return rows.length;
    },

    async getLatestSuccessfulSync(projectId) {
      return (
        [...syncRuns.values()]
          .filter((syncRun) => syncRun.project_id === projectId)
          .filter((syncRun) => syncRun.status === "success")
          .at(-1) ?? null
      );
    },

    async findRunningDailyMetricsSync({ projectId, integrationId, dateFrom, dateTo }) {
      return (
        [...syncRuns.values()].find(
          (syncRun) =>
            syncRun.project_id === projectId &&
            syncRun.integration_id === integrationId &&
            syncRun.sync_type === "daily_metrics" &&
            syncRun.status === "running" &&
            syncRun.metadata.date_from === dateFrom &&
            syncRun.metadata.date_to === dateTo
        ) ?? null
      );
    },

    getDailyMetrics() {
      return [...dailyMetrics.values()];
    },

    getSyncRuns() {
      return [...syncRuns.values()];
    }
  };
}

export async function seedLocalErollIntegration(
  repository: InMemoryIntegrationRepository,
  provider: Exclude<IntegrationProvider, "windsor" | "merchant_center">
) {
  const integration = await repository.seedIntegration({
    projectId: "00000000-0000-4000-8000-000000000011",
    provider,
    status: "connected"
  });

  await repository.seedIntegrationAccount({
    integrationId: integration.id,
    externalAccountId: `local-${provider.replace("_", "-")}-eroll-hu`,
    externalAccountName: `Local ${provider} Eroll HU`,
    accountType: provider,
    metadata: { environment: "local_test_data" },
    isActive: true
  });

  return integration;
}

function updateSyncRun(
  syncRuns: Map<string, SyncRunRow>,
  syncRunId: string,
  patch: Partial<SyncRunRow>
): SyncRunRow {
  const current = syncRuns.get(syncRunId);

  if (!current) {
    throw new Error("Sync run not found.");
  }

  const updated = {
    ...current,
    ...patch,
    updated_at: "2026-08-02T00:00:00.000Z"
  };

  syncRuns.set(syncRunId, updated);
  return updated;
}
