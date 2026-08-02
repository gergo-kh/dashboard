import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getServerIntegrationEnv } from "@/lib/env/server";
import { IntegrationError, redactSensitiveText } from "@/lib/integrations/errors";
import { assertSafeMetadata } from "@/lib/integrations/metadata";
import { createInMemoryIntegrationRepository, seedLocalErollIntegration } from "@/lib/integrations/testing/in-memory-repository";
import { createDailyMetricsSyncService } from "@/lib/integrations/sync/service";
import { normalizeDailyMetric } from "@/lib/integrations/windsor/normalize";
import { createWindsorClient } from "@/lib/integrations/windsor/client";
import { createFakeWindsorClient } from "@/lib/integrations/windsor/fake";
import type { WindsorFetch } from "@/lib/integrations/windsor/types";

const fixedNow = () => new Date("2026-08-02T08:00:00.000Z");

describe("server integration env", () => {
  it("validates server-only Windsor configuration", () => {
    expect(
      getServerIntegrationEnv({
        NODE_ENV: "test",
        WINDSOR_API_KEY: "test-windsor-key",
        WINDSOR_API_BASE_URL: "http://127.0.0.1:8787"
      })
    ).toMatchObject({
      WINDSOR_API_KEY: "test-windsor-key",
      WINDSOR_API_BASE_URL: "http://127.0.0.1:8787"
    });
  });

  it("fails clearly when the Windsor key is missing without echoing the key", () => {
    expect(() =>
      getServerIntegrationEnv({
        NODE_ENV: "test",
        WINDSOR_API_BASE_URL: "http://127.0.0.1:8787"
      })
    ).toThrow(
      "Missing or invalid server integration environment variables. Configure WINDSOR_API_KEY and WINDSOR_API_BASE_URL."
    );
  });

  it("requires HTTPS outside tests", () => {
    expect(() =>
      getServerIntegrationEnv({
        NODE_ENV: "production",
        WINDSOR_API_KEY: "test-windsor-key",
        WINDSOR_API_BASE_URL: "http://127.0.0.1:8787"
      })
    ).toThrow("Missing or invalid server integration environment variables.");
  });
});

describe("server-only boundary", () => {
  it("keeps Windsor variables server-side only", () => {
    const envExample = readFileSync(".env.example", "utf8");

    expect(envExample).toContain("WINDSOR_API_KEY=");
    expect(envExample).toContain("WINDSOR_API_BASE_URL=");
    expect(envExample).not.toContain("NEXT_PUBLIC_WINDSOR");
  });

  it("does not import server integration modules from client components", () => {
    const clientFiles = [
      "components/overview/performance-chart.tsx",
      "components/portal/portal-mobile-nav.tsx",
      "lib/supabase/browser.ts"
    ];

    clientFiles.forEach((filePath) => {
      expect(readFileSync(filePath, "utf8")).not.toMatch(/lib\/integrations|lib\/env\/server/);
    });
  });

  it("uses Next.js server-only guards on integration boundary modules", () => {
    const serverOnlyFiles = [
      "lib/env/server.ts",
      "lib/integrations/repository.ts",
      "lib/integrations/windsor/client.ts",
      "lib/integrations/sync/service.ts",
      "lib/integrations/testing/local-supabase-harness.ts"
    ];

    serverOnlyFiles.forEach((filePath) => {
      expect(readFileSync(filePath, "utf8").startsWith('import "server-only";')).toBe(
        true
      );
    });
  });
});

describe("safe metadata and errors", () => {
  it("rejects credential-like account metadata keys", () => {
    expect(() =>
      assertSafeMetadata({
        environment: "local_test_data",
        nested: { access_token: "redacted-test-token-shape" }
      })
    ).toThrow("credential-like key");
  });

  it("redacts sensitive strings from errors", () => {
    expect(
      redactSensitiveText("authorization: Bearer abc.def token=secret-value")
    ).toBe("authorization: [redacted] [redacted]");
  });
});

describe("Windsor HTTP client", () => {
  it("parses and validates successful responses", async () => {
    const fetcher: WindsorFetch = async () =>
      new Response(
        JSON.stringify({
          requestId: "req-1",
          rows: [
            {
              date: "2026-07-01",
              provider: "google_ads",
              externalAccountId: "local-google-ads-eroll-hu",
              currency: "HUF",
              spend: "100",
              purchases: "1"
            }
          ]
        }),
        { status: 200 }
      );
    const client = createWindsorClient({
      apiKey: "test-windsor-key",
      baseUrl: "https://windsor.example.invalid",
      fetcher
    });

    await expect(
      client.fetchDailyMetrics({
        projectId: "project-1",
        provider: "google_ads",
        externalAccountId: "local-google-ads-eroll-hu",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-01"
      })
    ).resolves.toMatchObject({ requestId: "req-1" });
  });

  it("handles 429 responses as rate limits without leaking the key", async () => {
    let calls = 0;
    const fetcher: WindsorFetch = async () => {
      calls += 1;
      return new Response("{}", { status: 429 });
    };
    const client = createWindsorClient({
      apiKey: "test-windsor-key",
      baseUrl: "https://windsor.example.invalid",
      fetcher
    });

    await expect(
      client.fetchDailyMetrics({
        projectId: "project-1",
        provider: "google_ads",
        externalAccountId: "local-google-ads-eroll-hu",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-01"
      })
    ).rejects.toMatchObject({ code: "rate_limited" });
    expect(calls).toBe(3);
  });

  it("handles 5xx responses as provider unavailable", async () => {
    const client = createWindsorClient({
      apiKey: "test-windsor-key",
      baseUrl: "https://windsor.example.invalid",
      fetcher: async () => new Response("{}", { status: 500 })
    });

    await expect(
      client.fetchDailyMetrics({
        projectId: "project-1",
        provider: "google_ads",
        externalAccountId: "local-google-ads-eroll-hu",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-01"
      })
    ).rejects.toMatchObject({ code: "provider_unavailable" });
  });

  it("does not retry permanent 4xx validation errors", async () => {
    let calls = 0;
    const client = createWindsorClient({
      apiKey: "test-windsor-key",
      baseUrl: "https://windsor.example.invalid",
      fetcher: async () => {
        calls += 1;
        return new Response("{}", { status: 400 });
      }
    });

    await expect(
      client.fetchDailyMetrics({
        projectId: "project-1",
        provider: "google_ads",
        externalAccountId: "local-google-ads-eroll-hu",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-01"
      })
    ).rejects.toMatchObject({ code: "invalid_response" });
    expect(calls).toBe(1);
  });

  it("handles timeouts", async () => {
    const client = createWindsorClient({
      apiKey: "test-windsor-key",
      baseUrl: "https://windsor.example.invalid",
      timeoutMs: 1,
      fetcher: (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        })
    });

    await expect(
      client.fetchDailyMetrics({
        projectId: "project-1",
        provider: "google_ads",
        externalAccountId: "local-google-ads-eroll-hu",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-01"
      })
    ).rejects.toMatchObject({ code: "provider_unavailable" });
  });

  it("rejects invalid response shapes through Zod validation", async () => {
    const client = createWindsorClient({
      apiKey: "test-windsor-key",
      baseUrl: "https://windsor.example.invalid",
      fetcher: async () => new Response(JSON.stringify({ rows: [{}] }), { status: 200 })
    });

    await expect(
      client.fetchDailyMetrics({
        projectId: "project-1",
        provider: "google_ads",
        externalAccountId: "local-google-ads-eroll-hu",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-01"
      })
    ).rejects.toMatchObject({ code: "invalid_response" });
  });
});

describe("metric normalization", () => {
  it("preserves missing values separately from explicit zero values", () => {
    const metric = normalizeDailyMetric({
      projectId: "project-1",
      integrationAccountId: "account-1",
      expectedProvider: "google_ads",
      ingestedAt: "2026-08-02T00:00:00Z",
      row: {
        date: "2026-07-01",
        provider: "google_ads",
        externalAccountId: "local-google-ads-eroll-hu",
        currency: "HUF",
        spend: "0",
        purchases: "0",
        clicks: "0"
      }
    });

    expect(metric.spend).toBe("0");
    expect(metric.clicks).toBe("0");
    expect(metric.impressions).toBeNull();
  });

  it("rejects negative metrics and invalid currencies", () => {
    expect(() =>
      normalizeDailyMetric({
        projectId: "project-1",
        integrationAccountId: "account-1",
        expectedProvider: "google_ads",
        ingestedAt: "2026-08-02T00:00:00Z",
        row: {
          date: "2026-07-01",
          provider: "google_ads",
          externalAccountId: "local-google-ads-eroll-hu",
          currency: "HUF",
          spend: "-1"
        }
      })
    ).toThrow(IntegrationError);

    expect(() =>
      normalizeDailyMetric({
        projectId: "project-1",
        integrationAccountId: "account-1",
        expectedProvider: "google_ads",
        ingestedAt: "2026-08-02T00:00:00Z",
        row: {
          date: "2026-07-01",
          provider: "google_ads",
          externalAccountId: "local-google-ads-eroll-hu",
          spend: "1"
        }
      })
    ).toThrow(IntegrationError);

    expect(() =>
      normalizeDailyMetric({
        projectId: "project-1",
        integrationAccountId: "account-1",
        expectedProvider: "google_ads",
        ingestedAt: "2026-08-02T00:00:00Z",
        row: {
          date: "2026-07-01",
          provider: "google_ads",
          externalAccountId: "local-google-ads-eroll-hu",
          currency: "HUF1",
          spend: "1"
        }
      })
    ).toThrow(IntegrationError);
  });

  it("keeps GA4 revenue separate from platform conversion value", () => {
    const ga4 = normalizeDailyMetric({
      projectId: "project-1",
      integrationAccountId: "account-1",
      expectedProvider: "ga4",
      ingestedAt: "2026-08-02T00:00:00Z",
      row: {
        date: "2026-07-01",
        provider: "ga4",
        externalAccountId: "local-ga4-eroll-hu",
        currency: "HUF",
        revenue: "420000",
        platformConversionValue: "100"
      }
    });
    const googleAds = normalizeDailyMetric({
      projectId: "project-1",
      integrationAccountId: "account-2",
      expectedProvider: "google_ads",
      ingestedAt: "2026-08-02T00:00:00Z",
      row: {
        date: "2026-07-01",
        provider: "google_ads",
        externalAccountId: "local-google-ads-eroll-hu",
        currency: "HUF",
        revenue: "420000",
        platformConversionValue: "300000"
      }
    });

    expect(ga4.revenue).toBe("420000");
    expect(ga4.platformConversionValue).toBeNull();
    expect(googleAds.revenue).toBe("0");
    expect(googleAds.platformConversionValue).toBe("300000");
  });

  it("documents nullable legacy currency in database types", () => {
    const databaseTypes = readFileSync("types/database.ts", "utf8");

    expect(databaseTypes).toContain("currency_code: string | null;");
    expect(databaseTypes).toContain("currency_code?: string | null;");
  });
});

describe("daily metrics sync service", () => {
  it("runs a successful sync lifecycle and idempotently updates daily metrics", async () => {
    const repository = createInMemoryIntegrationRepository();
    await seedLocalErollIntegration(repository, "google_ads");
    const service = createDailyMetricsSyncService({
      repository,
      windsorClient: createFakeWindsorClient("success"),
      now: fixedNow
    });

    const first = await service.syncDailyMetrics({
      projectId: "00000000-0000-4000-8000-000000000011",
      provider: "google_ads",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-02"
    });
    const firstCount = repository.getDailyMetrics().length;
    const second = await service.syncDailyMetrics({
      projectId: "00000000-0000-4000-8000-000000000011",
      provider: "google_ads",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-02"
    });

    expect(first).toMatchObject({ status: "success", fetchedRows: 2, persistedRows: 2 });
    expect(second).toMatchObject({ status: "success", fetchedRows: 2, persistedRows: 2 });
    expect(firstCount).toBe(2);
    expect(repository.getDailyMetrics()).toHaveLength(2);
    expect(repository.getSyncRuns().filter((run) => run.status === "success")).toHaveLength(2);
  });

  it("records sanitized failed sync runs", async () => {
    const repository = createInMemoryIntegrationRepository();
    await seedLocalErollIntegration(repository, "google_ads");
    const service = createDailyMetricsSyncService({
      repository,
      windsorClient: createFakeWindsorClient("malformed"),
      now: fixedNow
    });

    const result = await service.syncDailyMetrics({
      projectId: "00000000-0000-4000-8000-000000000011",
      provider: "google_ads",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-02"
    });

    expect(result).toMatchObject({ status: "failed", errorCode: "invalid_response" });
    expect(repository.getSyncRuns().at(-1)).toMatchObject({
      status: "failed",
      error_message: "invalid_response"
    });
    expect(JSON.stringify(repository.getSyncRuns().at(-1))).not.toContain("test-windsor-key");
  });

  it("prevents duplicate concurrent syncs when a matching run is already running", async () => {
    const repository = createInMemoryIntegrationRepository();
    const integration = await seedLocalErollIntegration(repository, "google_ads");
    const running = await repository.createSyncRun({
      projectId: "00000000-0000-4000-8000-000000000011",
      integrationId: integration.id,
      syncType: "daily_metrics",
      metadata: {
        date_from: "2026-07-01",
        date_to: "2026-07-02",
        provider: "google_ads"
      }
    });
    await repository.markSyncRunRunning(running.id);
    const service = createDailyMetricsSyncService({
      repository,
      windsorClient: createFakeWindsorClient("success"),
      now: fixedNow
    });

    await expect(
      service.syncDailyMetrics({
        projectId: "00000000-0000-4000-8000-000000000011",
        provider: "google_ads",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-02"
      })
    ).resolves.toMatchObject({ status: "failed", errorCode: "sync_conflict" });
  });
});
