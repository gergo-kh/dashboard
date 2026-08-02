import { describe, expect, it } from "vitest";
import { createDailyMetricsSyncService } from "@/lib/integrations/sync/service";
import { createInMemoryIntegrationRepository, seedLocalErollIntegration } from "@/lib/integrations/testing/in-memory-repository";
import { createFakeWindsorClient } from "@/lib/integrations/windsor/fake";

describe("local fake integration sync harness", () => {
  it("runs twice without creating duplicate daily metric rows and records a sanitized failure", async () => {
    const repository = createInMemoryIntegrationRepository();
    await seedLocalErollIntegration(repository, "google_ads");
    const service = createDailyMetricsSyncService({
      repository,
      windsorClient: createFakeWindsorClient("success"),
      now: () => new Date("2026-08-02T08:00:00.000Z")
    });

    const first = await service.syncDailyMetrics({
      projectId: "00000000-0000-4000-8000-000000000011",
      provider: "google_ads",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-02"
    });
    const firstRowCount = repository.getDailyMetrics().length;

    const second = await service.syncDailyMetrics({
      projectId: "00000000-0000-4000-8000-000000000011",
      provider: "google_ads",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-02"
    });
    const secondRowCount = repository.getDailyMetrics().length;

    const failedService = createDailyMetricsSyncService({
      repository,
      windsorClient: createFakeWindsorClient("provider_unavailable"),
      now: () => new Date("2026-08-02T08:05:00.000Z")
    });
    const failed = await failedService.syncDailyMetrics({
      projectId: "00000000-0000-4000-8000-000000000011",
      provider: "google_ads",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-02"
    });

    expect(first).toMatchObject({ status: "success", fetchedRows: 2, persistedRows: 2 });
    expect(second).toMatchObject({ status: "success", fetchedRows: 2, persistedRows: 2 });
    expect(firstRowCount).toBe(2);
    expect(secondRowCount).toBe(2);
    expect(failed).toMatchObject({
      status: "failed",
      errorCode: "provider_unavailable"
    });
    expect(repository.getSyncRuns().map((run) => run.status)).toEqual([
      "success",
      "success",
      "failed"
    ]);
    expect(JSON.stringify(repository.getSyncRuns())).not.toMatch(
      /api_key|access_token|refresh_token|authorization|Bearer/i
    );
  });
});
