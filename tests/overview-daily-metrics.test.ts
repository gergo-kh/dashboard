import { describe, expect, it } from "vitest";
import {
  createEmptyOverviewMetricsContent,
  createMetricPeriods,
  createOverviewMetricsContent,
  type DailyMetricContentRow
} from "@/lib/overview/daily-metrics";

const baseUpdatedAt = "2026-08-01T06:10:00Z";

function createRow(input: {
  date: string;
  provider: DailyMetricContentRow["provider"];
  spend?: string | number | null;
  revenue?: string | number | null;
  purchases?: string | number | null;
  platformConversionValue?: string | number | null;
  currencyCode?: string | null;
}): DailyMetricContentRow {
  return {
    metric_date: input.date,
    provider: input.provider,
    spend: input.spend ?? "0",
    revenue: input.revenue ?? "0",
    purchases: input.purchases ?? "0",
    platform_conversion_value: input.platformConversionValue ?? null,
    platform_conversions: null,
    currency_code: input.currencyCode ?? "HUF",
    updated_at: baseUpdatedAt
  };
}

describe("overview daily metrics read model", () => {
  it("calculates the six KPI cards from current and comparison daily metrics", () => {
    const content = createOverviewMetricsContent({
      period: createMetricPeriods("2026-07-31"),
      projectCurrencyCode: "HUF",
      roasTarget: "4.2",
      current: [
        createRow({
          date: "2026-07-01",
          provider: "google_ads",
          spend: "1000",
          platformConversionValue: "5000"
        }),
        createRow({
          date: "2026-07-01",
          provider: "meta_ads",
          spend: "500",
          platformConversionValue: "1000"
        }),
        createRow({
          date: "2026-07-01",
          provider: "tiktok_ads",
          spend: "0",
          platformConversionValue: "0"
        }),
        createRow({
          date: "2026-07-01",
          provider: "ga4",
          revenue: "9000",
          purchases: "3"
        })
      ],
      comparison: [
        createRow({
          date: "2026-06-01",
          provider: "google_ads",
          spend: "1000",
          platformConversionValue: "4000"
        }),
        createRow({
          date: "2026-06-01",
          provider: "ga4",
          revenue: "6000",
          purchases: "2"
        })
      ]
    });

    expect(content.kpis.map((kpi) => kpi.title)).toEqual([
      "Költés",
      "Bevétel (GA4)",
      "ROAS (Blended)",
      "Vásárlások (GA4)",
      "CPA (Blended)",
      "Átlagos rendelési érték"
    ]);
    expect(content.kpis.find((kpi) => kpi.id === "spend")?.currentValue).toBe("1 500 Ft");
    expect(content.kpis.find((kpi) => kpi.id === "spend")?.comparisonPercentage).toBe("+50%");
    expect(content.kpis.find((kpi) => kpi.id === "revenue")?.currentValue).toBe("9 000 Ft");
    expect(content.kpis.find((kpi) => kpi.id === "roas")?.currentValue).toBe("6");
    expect(content.kpis.find((kpi) => kpi.id === "cpa")?.currentValue).toBe("500 Ft");
    expect(content.kpis.find((kpi) => kpi.id === "aov")?.currentValue).toBe("3 000 Ft");
    expect(content.performanceChart.state).toBe("normal");
    expect(content.performanceChart.intervals).toHaveLength(3);
    expect(content.channelSummary.totalRow.roasLabel).toBe("6");
  });

  it("keeps missing data separate from true zero values", () => {
    const emptyContent = createEmptyOverviewMetricsContent({
      projectCurrencyCode: "HUF",
      roasTarget: "4.2"
    });

    expect(emptyContent.kpis.find((kpi) => kpi.id === "spend")?.currentValue).toBe("nincs adat");
    expect(emptyContent.performanceChart.state).toBe("empty");

    const zeroContent = createOverviewMetricsContent({
      period: createMetricPeriods("2026-07-31"),
      projectCurrencyCode: "HUF",
      roasTarget: "4.2",
      current: [
        createRow({
          date: "2026-07-01",
          provider: "google_ads",
          spend: "0",
          platformConversionValue: "0"
        }),
        createRow({
          date: "2026-07-01",
          provider: "ga4",
          revenue: "0",
          purchases: "0"
        })
      ],
      comparison: []
    });

    expect(zeroContent.kpis.find((kpi) => kpi.id === "spend")?.currentValue).toBe("0 Ft");
    expect(zeroContent.kpis.find((kpi) => kpi.id === "revenue")?.currentValue).toBe("0 Ft");
    expect(zeroContent.kpis.find((kpi) => kpi.id === "roas")?.currentValue).toBe("nincs adat");
    expect(zeroContent.performanceChart.state).toBe("normal");
  });

  it("uses the selected project currency and does not mix another currency into totals", () => {
    const content = createOverviewMetricsContent({
      period: createMetricPeriods("2026-07-31"),
      projectCurrencyCode: "EUR",
      roasTarget: "4.2",
      current: [
        createRow({
          date: "2026-07-01",
          provider: "google_ads",
          spend: "1000",
          platformConversionValue: "2000",
          currencyCode: "EUR"
        }),
        createRow({
          date: "2026-07-01",
          provider: "google_ads",
          spend: "999999",
          platformConversionValue: "999999",
          currencyCode: "HUF"
        }),
        createRow({
          date: "2026-07-01",
          provider: "ga4",
          revenue: "3000",
          purchases: "3",
          currencyCode: "EUR"
        })
      ],
      comparison: []
    });

    expect(content.kpis.find((kpi) => kpi.id === "spend")?.currentValue).toBe("1 k EUR");
    expect(content.kpis.find((kpi) => kpi.id === "revenue")?.currentValue).toBe("3 k EUR");
    expect(content.kpis.find((kpi) => kpi.id === "roas")?.currentValue).toBe("3");
  });

  it("builds a safe empty state when daily metric rows cannot be normalized", () => {
    const content = createOverviewMetricsContent({
      period: createMetricPeriods("2026-07-31"),
      projectCurrencyCode: "HUF",
      roasTarget: "4.2",
      current: [
        createRow({
          date: "2026-07-01",
          provider: "ga4",
          revenue: "not-a-number",
          purchases: "1"
        })
      ],
      comparison: []
    });

    expect(content.kpis.every((kpi) => kpi.currentValue === "nincs adat")).toBe(true);
    expect(content.performanceChart.state).toBe("empty");
    expect(content.channelSummary.totalRow.statusLabel).toBe("Nincs adat");
  });
});
