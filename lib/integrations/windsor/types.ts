import type { IntegrationProvider, OverviewMetricProvider } from "@/lib/integrations/metadata";

export type WindsorDailyMetricsRequest = Readonly<{
  projectId: string;
  provider: OverviewMetricProvider;
  externalAccountId: string;
  dateFrom: string;
  dateTo: string;
}>;

export type WindsorRawDailyMetric = Readonly<{
  date: string;
  provider: IntegrationProvider;
  externalAccountId: string;
  currency?: string;
  spend?: string;
  revenue?: string;
  purchases?: string;
  clicks?: string;
  impressions?: string;
  platformConversions?: string;
  platformConversionValue?: string;
}>;

export type WindsorDailyMetricsResponse = Readonly<{
  requestId: string;
  rows: WindsorRawDailyMetric[];
}>;

export interface WindsorClient {
  fetchDailyMetrics(
    input: WindsorDailyMetricsRequest
  ): Promise<WindsorDailyMetricsResponse>;
}

export type WindsorFetch = (
  input: URL | RequestInfo,
  init?: RequestInit
) => Promise<Response>;
