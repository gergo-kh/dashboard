import { assertServerOnlyModule } from "@/lib/server-only";
import { IntegrationError, toIntegrationError } from "@/lib/integrations/errors";
import type { IntegrationRepository } from "@/lib/integrations/repository";
import { normalizeDailyMetric } from "@/lib/integrations/windsor/normalize";
import type { WindsorClient } from "@/lib/integrations/windsor/types";
import type {
  DailyMetricsSyncInput,
  DailyMetricsSyncResult,
  DailyMetricsSyncSuccess
} from "@/lib/integrations/sync/types";

assertServerOnlyModule("Daily metrics sync service");

export type DailyMetricsSyncServiceConfig = Readonly<{
  repository: IntegrationRepository;
  windsorClient: WindsorClient;
  now?: () => Date;
}>;

export function createDailyMetricsSyncService(config: DailyMetricsSyncServiceConfig) {
  const now = config.now ?? (() => new Date());

  async function syncDailyMetrics(
    input: DailyMetricsSyncInput
  ): Promise<DailyMetricsSyncResult> {
    let syncRunId: string | null = null;

    try {
      validateDateRange(input.dateFrom, input.dateTo);

      const integration = await config.repository.getIntegrationByProjectAndProvider({
        projectId: input.projectId,
        provider: input.provider
      });

      if (!integration || integration.status === "disabled") {
        throw new IntegrationError({
          code: "mapping_error",
          message: "No active integration mapping exists for this project and provider."
        });
      }

      const running = await config.repository.findRunningDailyMetricsSync({
        projectId: input.projectId,
        integrationId: integration.id,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo
      });

      if (running) {
        throw new IntegrationError({
          code: "sync_conflict",
          message: "A daily metrics sync is already running for this project and date range."
        });
      }

      const accounts = (await config.repository.listIntegrationAccounts(integration.id))
        .filter((account) => account.is_active)
        .filter((account) => account.account_type === input.provider);

      if (accounts.length === 0) {
        throw new IntegrationError({
          code: "mapping_error",
          message: "No active integration accounts exist for this project and provider."
        });
      }

      const syncRun = await config.repository.createSyncRun({
        projectId: input.projectId,
        integrationId: integration.id,
        syncType: "daily_metrics",
        metadata: {
          date_from: input.dateFrom,
          date_to: input.dateTo,
          provider: input.provider,
          account_count: accounts.length
        }
      });

      syncRunId = syncRun.id;
      await config.repository.markSyncRunRunning(syncRun.id);

      const startedAt = now().toISOString();
      const normalizedRows = [];

      for (const account of accounts) {
        const response = await config.windsorClient.fetchDailyMetrics({
          projectId: input.projectId,
          provider: input.provider,
          externalAccountId: account.external_account_id,
          dateFrom: input.dateFrom,
          dateTo: input.dateTo
        });

        normalizedRows.push(
          ...response.rows.map((row) =>
            normalizeDailyMetric({
              projectId: input.projectId,
              integrationAccountId: account.id,
              expectedProvider: input.provider,
              row,
              ingestedAt: startedAt
            })
          )
        );
      }

      const persistedRows =
        await config.repository.upsertNormalizedDailyMetrics(normalizedRows);
      const completedAt = now().toISOString();

      await config.repository.markIntegrationStatus({
        projectId: input.projectId,
        provider: input.provider,
        status: "connected",
        lastError: null,
        lastSyncAttemptAt: completedAt,
        lastSuccessfulSyncAt: completedAt
      });

      const completedRun = await config.repository.markSyncRunSuccess({
        syncRunId: syncRun.id,
        completedAt,
        recordsProcessed: persistedRows,
        metadata: {
          date_from: input.dateFrom,
          date_to: input.dateTo,
          provider: input.provider,
          fetched_rows: normalizedRows.length,
          persisted_rows: persistedRows,
          account_count: accounts.length
        }
      });

      return {
        status: "success",
        syncRunId: completedRun.id,
        fetchedRows: normalizedRows.length,
        persistedRows
      } satisfies DailyMetricsSyncSuccess;
    } catch (error) {
      const integrationError = toIntegrationError(error);

      if (syncRunId) {
        const completedAt = now().toISOString();

        await config.repository.markSyncRunFailure({
          syncRunId,
          completedAt,
          errorMessage: integrationError.code,
          metadata: {
            date_from: input.dateFrom,
            date_to: input.dateTo,
            provider: input.provider,
            error_code: integrationError.code,
            error_message: integrationError.message
          }
        });
      }

      return {
        status: "failed",
        syncRunId,
        errorCode: integrationError.code,
        message: integrationError.message
      };
    }
  }

  return { syncDailyMetrics };
}

function validateDateRange(dateFrom: string, dateTo: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    throw new IntegrationError({
      code: "mapping_error",
      message: "Sync date range must use ISO calendar dates."
    });
  }

  if (dateFrom > dateTo) {
    throw new IntegrationError({
      code: "mapping_error",
      message: "Sync date range start must be before the end date."
    });
  }
}
