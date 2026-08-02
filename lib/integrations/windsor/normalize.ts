import { z } from "zod";
import type { OverviewMetricProvider } from "@/lib/integrations/metadata";
import { IntegrationError } from "@/lib/integrations/errors";
import type { WindsorRawDailyMetric } from "@/lib/integrations/windsor/types";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);
const decimalStringSchema = z.string().regex(/^\d+(\.\d+)?$/);

export type NormalizedDailyMetric = Readonly<{
  projectId: string;
  integrationAccountId: string;
  metricDate: string;
  provider: OverviewMetricProvider;
  currencyCode: string;
  spend: string;
  revenue: string;
  purchases: string;
  clicks: string | null;
  impressions: string | null;
  platformConversions: string | null;
  platformConversionValue: string | null;
  ingestedAt: string;
}>;

export type NormalizeDailyMetricInput = Readonly<{
  projectId: string;
  integrationAccountId: string;
  expectedProvider: OverviewMetricProvider;
  row: WindsorRawDailyMetric;
  ingestedAt: string;
}>;

export function normalizeDailyMetric({
  projectId,
  integrationAccountId,
  expectedProvider,
  row,
  ingestedAt
}: NormalizeDailyMetricInput): NormalizedDailyMetric {
  if (row.provider !== expectedProvider) {
    throw new IntegrationError({
      code: "invalid_response",
      message: "Windsor response provider did not match the requested provider."
    });
  }

  return {
    projectId,
    integrationAccountId,
    metricDate: parseIsoDate(row.date),
    provider: expectedProvider,
    currencyCode: parseCurrency(row.currency),
    spend: parseMetric(row.spend, "spend", "0"),
    revenue: expectedProvider === "ga4" ? parseMetric(row.revenue, "revenue", "0") : "0",
    purchases: parseMetric(row.purchases, "purchases", "0"),
    clicks: parseNullableMetric(row.clicks, "clicks"),
    impressions: parseNullableMetric(row.impressions, "impressions"),
    platformConversions: parseNullableMetric(row.platformConversions, "platformConversions"),
    platformConversionValue:
      expectedProvider === "ga4"
        ? null
        : parseNullableMetric(row.platformConversionValue, "platformConversionValue"),
    ingestedAt
  };
}

function parseIsoDate(value: string): string {
  const parsed = isoDateSchema.safeParse(value);

  if (!parsed.success) {
    throw new IntegrationError({
      code: "invalid_response",
      message: "Windsor response contained an invalid metric date."
    });
  }

  return parsed.data;
}

function parseCurrency(value: string): string {
  const parsed = currencyCodeSchema.safeParse(value);

  if (!parsed.success) {
    throw new IntegrationError({
      code: "invalid_response",
      message: "Windsor response contained an invalid currency code."
    });
  }

  return parsed.data;
}

function parseMetric(
  value: string | undefined,
  fieldName: string,
  fallback: string
): string {
  if (value === undefined) {
    return fallback;
  }

  const parsed = decimalStringSchema.safeParse(value);

  if (!parsed.success) {
    throw new IntegrationError({
      code: "invalid_response",
      message: `Windsor response contained an invalid ${fieldName} value.`
    });
  }

  return parsed.data;
}

function parseNullableMetric(value: string | undefined, fieldName: string): string | null {
  if (value === undefined) {
    return null;
  }

  return parseMetric(value, fieldName, "0");
}
