import { z } from "zod";
import type { Json } from "@/types/database";

export const providerSchema = z.enum([
  "google_ads",
  "meta_ads",
  "tiktok_ads",
  "ga4",
  "merchant_center"
]);

export type IntegrationProvider = z.infer<typeof providerSchema>;

export const overviewMetricProviderSchema = z.enum([
  "google_ads",
  "meta_ads",
  "tiktok_ads",
  "ga4"
]);

export type OverviewMetricProvider = z.infer<typeof overviewMetricProviderSchema>;
type JsonObject = { [key: string]: Json | undefined };

const blockedMetadataKeys = new Set([
  "api_key",
  "apikey",
  "token",
  "access_token",
  "refresh_token",
  "secret",
  "password",
  "authorization"
]);

export function assertSafeMetadata(metadata: Record<string, Json>): void {
  const unsafeKey = findUnsafeMetadataKey(metadata);

  if (unsafeKey) {
    throw new Error(`Integration metadata contains a credential-like key: ${unsafeKey}.`);
  }
}

function findUnsafeMetadataKey(metadata: JsonObject): string | null {
  for (const [key, value] of Object.entries(metadata)) {
    const normalizedKey = key.trim().toLowerCase();

    if (blockedMetadataKeys.has(normalizedKey)) {
      return key;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = findUnsafeMetadataKey(value);

      if (nested) {
        return `${key}.${nested}`;
      }
    }
  }

  return null;
}
