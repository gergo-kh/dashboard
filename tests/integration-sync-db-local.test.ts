import { describe, expect, it } from "vitest";
import {
  assertLocalSupabaseUrl,
  runLocalSupabaseSyncHarness
} from "@/lib/integrations/testing/local-supabase-harness";

describe("local Supabase-backed integration sync harness", () => {
  it("refuses hosted Supabase URLs", () => {
    expect(() => assertLocalSupabaseUrl("https://project.supabase.co")).toThrow(
      "refuses non-local Supabase URLs"
    );
  });

  it("runs successful, repeated, and failed fake syncs against local PostgreSQL", async () => {
    const result = await runLocalSupabaseSyncHarness();

    expect(result.first).toEqual({
      fetchedRows: 2,
      persistedRows: 2,
      dailyMetricRows: 2
    });
    expect(result.second).toEqual({
      fetchedRows: 2,
      persistedRows: 2,
      dailyMetricRows: 2
    });
    expect(result.duplicateLogicalRows).toBe(0);
    expect(result.successSyncRuns).toBe(2);
    expect(result.failedSyncRuns).toBe(1);
    expect(result.sanitizedFailure).toBe(true);
  });
});
