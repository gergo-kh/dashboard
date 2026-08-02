import "server-only";
import { IntegrationError } from "@/lib/integrations/errors";
import type {
  WindsorClient,
  WindsorDailyMetricsRequest,
  WindsorDailyMetricsResponse,
  WindsorRawDailyMetric
} from "@/lib/integrations/windsor/types";

export type FakeWindsorMode =
  | "success"
  | "malformed"
  | "rate_limited"
  | "provider_unavailable"
  | "timeout";

export function createFakeWindsorClient(mode: FakeWindsorMode = "success"): WindsorClient {
  return {
    async fetchDailyMetrics(input) {
      if (mode === "rate_limited") {
        throw new IntegrationError({
          code: "rate_limited",
          message: "Fake Windsor rate limit.",
          retryable: true
        });
      }

      if (mode === "provider_unavailable") {
        throw new IntegrationError({
          code: "provider_unavailable",
          message: "Fake Windsor provider unavailable.",
          retryable: true
        });
      }

      if (mode === "timeout") {
        throw new IntegrationError({
          code: "provider_unavailable",
          message: "Fake Windsor timeout.",
          retryable: true
        });
      }

      if (mode === "malformed") {
        return {
          requestId: "fake-malformed",
          rows: [
            {
              date: "not-a-date",
              provider: input.provider,
              externalAccountId: input.externalAccountId,
              currency: "HUF",
              spend: "10"
            }
          ]
        };
      }

      return createSuccessfulFakeResponse(input);
    }
  };
}

function createSuccessfulFakeResponse(
  input: WindsorDailyMetricsRequest
): WindsorDailyMetricsResponse {
  return {
    requestId: `fake-${input.provider}-${input.externalAccountId}`,
    rows: fakeRows
      .filter((row) => row.provider === input.provider)
      .filter((row) => row.externalAccountId === input.externalAccountId)
      .filter((row) => row.date >= input.dateFrom && row.date <= input.dateTo)
  };
}

const fakeRows = [
  {
    date: "2026-07-01",
    provider: "google_ads",
    externalAccountId: "local-google-ads-eroll-hu",
    currency: "HUF",
    spend: "45000",
    purchases: "18",
    clicks: "620",
    impressions: "18200",
    platformConversions: "18",
    platformConversionValue: "390000"
  },
  {
    date: "2026-07-02",
    provider: "google_ads",
    externalAccountId: "local-google-ads-eroll-hu",
    currency: "HUF",
    spend: "0",
    purchases: "0",
    clicks: "0",
    impressions: "0",
    platformConversions: "0",
    platformConversionValue: "0"
  },
  {
    date: "2026-07-01",
    provider: "meta_ads",
    externalAccountId: "local-meta-ads-eroll-hu",
    currency: "HUF",
    spend: "32000",
    purchases: "11",
    clicks: "410",
    impressions: "22100",
    platformConversions: "10",
    platformConversionValue: "248000"
  },
  {
    date: "2026-07-01",
    provider: "tiktok_ads",
    externalAccountId: "local-tiktok-ads-eroll-hu",
    currency: "HUF",
    spend: "9500",
    purchases: "2",
    impressions: "12000"
  },
  {
    date: "2026-07-01",
    provider: "ga4",
    externalAccountId: "local-ga4-eroll-hu",
    currency: "HUF",
    spend: "0",
    revenue: "428000",
    purchases: "27",
    clicks: "0",
    impressions: "0"
  }
] satisfies WindsorRawDailyMetric[];
