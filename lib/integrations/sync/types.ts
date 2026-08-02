import type { OverviewMetricProvider } from "@/lib/integrations/metadata";

export type DailyMetricsSyncInput = Readonly<{
  projectId: string;
  provider: OverviewMetricProvider;
  dateFrom: string;
  dateTo: string;
}>;

export type DailyMetricsSyncSuccess = Readonly<{
  status: "success";
  syncRunId: string;
  fetchedRows: number;
  persistedRows: number;
}>;

export type DailyMetricsSyncFailure = Readonly<{
  status: "failed";
  syncRunId: string | null;
  errorCode: string;
  message: string;
}>;

export type DailyMetricsSyncResult =
  | DailyMetricsSyncSuccess
  | DailyMetricsSyncFailure;
