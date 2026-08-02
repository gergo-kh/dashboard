import "server-only";
import { z } from "zod";
import { providerSchema } from "@/lib/integrations/metadata";

const decimalStringSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Metric values must be non-negative decimal strings.");

export const windsorDailyMetricRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  provider: providerSchema,
  externalAccountId: z.string().min(1),
  currency: z.string().regex(/^[A-Z]{3}$/),
  spend: decimalStringSchema.optional(),
  revenue: decimalStringSchema.optional(),
  purchases: decimalStringSchema.optional(),
  clicks: decimalStringSchema.optional(),
  impressions: decimalStringSchema.optional(),
  platformConversions: decimalStringSchema.optional(),
  platformConversionValue: decimalStringSchema.optional()
});

export const windsorDailyMetricsResponseSchema = z.object({
  requestId: z.string().min(1),
  rows: z.array(windsorDailyMetricRowSchema)
});
