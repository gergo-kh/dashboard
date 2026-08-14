import { z } from "zod";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  formatRoas
} from "@/lib/overview/format";
import type { DailyMetricProvider } from "@/types/database";
import type {
  ChannelSummary,
  ChannelStatus,
  ChartGranularity,
  ChartIntervalOption,
  ChartSeriesPoint,
  KpiCardViewModel,
  OverviewMetricsContent,
  SemanticState
} from "@/types/overview";

const paidMediaProviders = ["google_ads", "meta_ads", "tiktok_ads"] as const;

type NullableMetricNumber = string | number | null;

const providerSchema = z.enum([
  "google_ads",
  "meta_ads",
  "ga4",
  "merchant_center",
  "tiktok_ads",
  "manual"
]);

const metricNumberSchema = z.union([z.string(), z.number()]).nullable();
const supabaseTimestampSchema = z.string().datetime({ offset: true });

const dailyMetricContentRowSchema = z.object({
  metric_date: z.string().date(),
  provider: providerSchema,
  spend: metricNumberSchema,
  revenue: metricNumberSchema,
  purchases: metricNumberSchema,
  platform_conversion_value: metricNumberSchema,
  platform_conversions: metricNumberSchema,
  currency_code: z.string().trim().length(3).nullable(),
  updated_at: supabaseTimestampSchema
});

export type DailyMetricContentRow = Readonly<z.input<typeof dailyMetricContentRowSchema>>;

export type OverviewMetricsPeriod = Readonly<{
  currentStart: string;
  currentEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
}>;

export type OverviewMetricsRows = Readonly<{
  current: DailyMetricContentRow[];
  comparison: DailyMetricContentRow[];
  period: OverviewMetricsPeriod | null;
  projectCurrencyCode: string | null;
  roasTarget: NullableMetricNumber;
}>;

type NormalizedDailyMetricRow = Readonly<{
  metricDate: string;
  provider: DailyMetricProvider;
  spend: number;
  revenue: number;
  purchases: number;
  platformConversionValue: number | null;
  platformConversions: number | null;
  currencyCode: string | null;
  updatedAt: string;
}>;

type PeriodTotals = Readonly<{
  hasAnyData: boolean;
  paidRowsCount: number;
  ga4RowsCount: number;
  spend: number;
  ga4Revenue: number;
  ga4Purchases: number;
  paidPlatformRevenue: number;
  latestUpdatedAt: string | null;
}>;

type MetricValue = Readonly<{
  value: number;
  hasData: boolean;
}>;

type ComparisonMetric = Readonly<{
  label: string;
  state: SemanticState;
}>;

type ProviderView = Readonly<{
  channel: string;
  provider: DailyMetricProvider;
  statusLabel: string;
  note: string;
}>;

const providerViews = [
  {
    channel: "Google Ads",
    provider: "google_ads",
    statusLabel: "Aktív",
    note: "Google Ads platformadat"
  },
  {
    channel: "Meta Ads",
    provider: "meta_ads",
    statusLabel: "Aktív",
    note: "Meta Ads platformadat"
  },
  {
    channel: "TikTok Ads",
    provider: "tiktok_ads",
    statusLabel: "Aktív",
    note: "TikTok Ads platformadat"
  },
  {
    channel: "GA4",
    provider: "ga4",
    statusLabel: "Adatforrás",
    note: "Webshop szintű mérés"
  }
] satisfies ProviderView[];

export function createMetricPeriods(latestMetricDate: string): OverviewMetricsPeriod {
  const latestDate = parseDateOnly(latestMetricDate);
  const currentStart = createUtcDate(
    latestDate.getUTCFullYear(),
    latestDate.getUTCMonth(),
    1
  );
  const comparisonStart = createUtcDate(
    latestDate.getUTCFullYear(),
    latestDate.getUTCMonth() - 1,
    1
  );
  const comparisonEnd = createUtcDate(
    comparisonStart.getUTCFullYear(),
    comparisonStart.getUTCMonth(),
    Math.min(latestDate.getUTCDate(), getDaysInMonth(comparisonStart))
  );

  return {
    currentStart: formatDateOnly(currentStart),
    currentEnd: formatDateOnly(latestDate),
    comparisonStart: formatDateOnly(comparisonStart),
    comparisonEnd: formatDateOnly(comparisonEnd)
  };
}

export function createEmptyOverviewMetricsContent(input: {
  projectCurrencyCode?: string | null;
  roasTarget?: NullableMetricNumber;
} = {}): OverviewMetricsContent {
  const currencyCode = normalizeCurrencyCode(input.projectCurrencyCode);
  const emptyKpi = (id: string, title: string, tooltip: string, supportingLabel?: string) => ({
    id,
    title,
    currentValue: "nincs adat",
    comparisonPercentage: "nincs összehasonlítás",
    comparisonLabel: "az előző időszakhoz képest",
    state: "neutral" as const,
    tooltip,
    supportingLabel
  });

  return {
    dateRangeLabel: "Nincs metrikaadat",
    comparisonRangeLabel: "Nincs összehasonlítás",
    lastRefreshLabel: "Utolsó adatfrissítés: nincs adat",
    kpis: [
      emptyKpi("spend", "Költés", "Összes aktív fizetett csatorna médiaköltése.", "Google, Meta és TikTok együtt"),
      emptyKpi("revenue", "Bevétel (GA4)", "GA4 ecommerce purchase revenue a kiválasztott projektben.", "GA4 vásárlási bevétel"),
      emptyKpi("roas", "ROAS (Blended)", "GA4 bevétel osztva az összes fizetett média költéssel.", `Cél: ${formatRoasTarget(input.roasTarget)}`),
      emptyKpi("purchases", "Vásárlások (GA4)", "GA4 purchase események száma.", "Webshop vásárlások"),
      emptyKpi("cpa", "CPA (Blended)", "Teljes médiaköltés osztva a GA4 vásárlások számával.", "Alacsonyabb érték jobb"),
      emptyKpi("aov", "Átlagos rendelési érték", "GA4 bevétel osztva a GA4 vásárlások számával.", "Kosárérték")
    ],
    metricExplanation: {
      dataSource: "Ehhez a projekthez még nincs betöltött napi teljesítményadat.",
      formula: "Blended ROAS = GA4 ecommerce bevétel / teljes paid-media költés.",
      platformDifference:
        "A platformok saját attribúciót használnak, ezért ugyanazt a vásárlást több rendszer is magának tulajdoníthatja.",
      attributionLimitations:
        "A hiányzó adat nem nulla eredményt jelent, hanem azt, hogy az adott időszak még nem számolható.",
      lastRefresh: "Utolsó adatfrissítés: nincs adat"
    },
    performanceChart: createEmptyPerformanceChart(),
    channelSummary: createEmptyChannelSummary(currencyCode)
  };
}

export function createOverviewMetricsContent(rows: OverviewMetricsRows): OverviewMetricsContent {
  const currencyCode = normalizeCurrencyCode(rows.projectCurrencyCode);
  const currentRows = normalizeRows(rows.current, currencyCode);
  const comparisonRows = normalizeRows(rows.comparison, currencyCode);

  if (!rows.period || currentRows.length === 0) {
    return createEmptyOverviewMetricsContent({
      projectCurrencyCode: currencyCode,
      roasTarget: rows.roasTarget
    });
  }

  const currentTotals = aggregateTotals(currentRows);
  const comparisonTotals = aggregateTotals(comparisonRows);
  const periodLabels = createPeriodLabels(rows.period);
  const lastRefreshLabel = createLastRefreshLabel(currentTotals.latestUpdatedAt);

  return {
    dateRangeLabel: periodLabels.current,
    comparisonRangeLabel: periodLabels.comparison,
    lastRefreshLabel,
    kpis: createKpis({
      currentTotals,
      comparisonTotals,
      currencyCode,
      roasTarget: rows.roasTarget,
      comparisonLabel: `${periodLabels.comparison} időszakhoz képest`
    }),
    metricExplanation: {
      dataSource:
        "GA4 ecommerce bevétel, Google Ads, Meta Ads és TikTok Ads napi médiaköltés.",
      formula: "Blended ROAS = GA4 ecommerce bevétel / teljes paid-media költés.",
      platformDifference:
        "A platformok saját attribúciót használnak, ezért ugyanazt a vásárlást több rendszer is magának tulajdoníthatja.",
      attributionLimitations:
        "A cookie, consent és cross-device hatások miatt a riport üzleti iránytű, nem könyvelési kimutatás.",
      lastRefresh: lastRefreshLabel
    },
    performanceChart: createPerformanceChart(currentRows, comparisonRows, rows.period),
    channelSummary: createChannelSummary(currentRows, currentTotals, currencyCode, rows.roasTarget)
  };
}

function createKpis(input: {
  currentTotals: PeriodTotals;
  comparisonTotals: PeriodTotals;
  currencyCode: string;
  roasTarget: NullableMetricNumber;
  comparisonLabel: string;
}): KpiCardViewModel[] {
  const spend = createMetricValue(input.currentTotals.spend, input.currentTotals.paidRowsCount > 0);
  const comparisonSpend = createMetricValue(
    input.comparisonTotals.spend,
    input.comparisonTotals.paidRowsCount > 0
  );
  const revenue = createMetricValue(input.currentTotals.ga4Revenue, input.currentTotals.ga4RowsCount > 0);
  const comparisonRevenue = createMetricValue(
    input.comparisonTotals.ga4Revenue,
    input.comparisonTotals.ga4RowsCount > 0
  );
  const purchases = createMetricValue(
    input.currentTotals.ga4Purchases,
    input.currentTotals.ga4RowsCount > 0
  );
  const comparisonPurchases = createMetricValue(
    input.comparisonTotals.ga4Purchases,
    input.comparisonTotals.ga4RowsCount > 0
  );
  const roas = createRatioMetric(revenue, spend);
  const comparisonRoas = createRatioMetric(comparisonRevenue, comparisonSpend);
  const cpa = createRatioMetric(spend, purchases);
  const comparisonCpa = createRatioMetric(comparisonSpend, comparisonPurchases);
  const aov = createRatioMetric(revenue, purchases);
  const comparisonAov = createRatioMetric(comparisonRevenue, comparisonPurchases);

  return [
    createKpi({
      id: "spend",
      title: "Költés",
      metric: spend,
      comparison: comparisonSpend,
      formatter: (value) => formatCompactCurrency(value, input.currencyCode),
      comparisonLabel: input.comparisonLabel,
      tooltip: "Összes aktív fizetett csatorna médiaköltése.",
      supportingLabel: "Google, Meta és TikTok együtt",
      lowerIsBetter: false
    }),
    createKpi({
      id: "revenue",
      title: "Bevétel (GA4)",
      metric: revenue,
      comparison: comparisonRevenue,
      formatter: (value) => formatCompactCurrency(value, input.currencyCode),
      comparisonLabel: input.comparisonLabel,
      tooltip: "GA4 ecommerce purchase revenue a kiválasztott projektben.",
      supportingLabel: "GA4 vásárlási bevétel",
      lowerIsBetter: false
    }),
    createKpi({
      id: "roas",
      title: "ROAS (Blended)",
      metric: roas,
      comparison: comparisonRoas,
      formatter: formatRoas,
      comparisonLabel: input.comparisonLabel,
      tooltip: "GA4 bevétel osztva az összes fizetett média költéssel.",
      supportingLabel: `Cél: ${formatRoasTarget(input.roasTarget)}`,
      lowerIsBetter: false
    }),
    createKpi({
      id: "purchases",
      title: "Vásárlások (GA4)",
      metric: purchases,
      comparison: comparisonPurchases,
      formatter: formatInteger,
      comparisonLabel: input.comparisonLabel,
      tooltip: "GA4 purchase események száma.",
      supportingLabel: "Webshop vásárlások",
      lowerIsBetter: false
    }),
    createKpi({
      id: "cpa",
      title: "CPA (Blended)",
      metric: cpa,
      comparison: comparisonCpa,
      formatter: (value) => formatCurrency(value, input.currencyCode),
      comparisonLabel: input.comparisonLabel,
      tooltip: "Teljes médiaköltés osztva a GA4 vásárlások számával.",
      supportingLabel: "Alacsonyabb érték jobb",
      lowerIsBetter: true
    }),
    createKpi({
      id: "aov",
      title: "Átlagos rendelési érték",
      metric: aov,
      comparison: comparisonAov,
      formatter: (value) => formatCurrency(value, input.currencyCode),
      comparisonLabel: input.comparisonLabel,
      tooltip: "GA4 bevétel osztva a GA4 vásárlások számával.",
      supportingLabel: "Kosárérték",
      lowerIsBetter: false
    })
  ];
}

function createKpi(input: {
  id: string;
  title: string;
  metric: MetricValue;
  comparison: MetricValue;
  formatter: (value: number) => string;
  comparisonLabel: string;
  tooltip: string;
  supportingLabel: string;
  lowerIsBetter: boolean;
}): KpiCardViewModel {
  const comparison = createComparisonMetric(input.metric, input.comparison, input.lowerIsBetter);

  return {
    id: input.id,
    title: input.title,
    currentValue: input.metric.hasData ? input.formatter(input.metric.value) : "nincs adat",
    comparisonPercentage: comparison.label,
    comparisonLabel: input.comparisonLabel,
    state: comparison.state,
    tooltip: input.tooltip,
    supportingLabel: input.supportingLabel
  };
}

function createPerformanceChart(
  currentRows: NormalizedDailyMetricRow[],
  comparisonRows: NormalizedDailyMetricRow[],
  period: OverviewMetricsPeriod
) {
  const dailySeries = createDailySeries(currentRows);
  const weeklySeries = createWeeklySeries(dailySeries);
  const monthlySeries = createMonthlySeries(currentRows, comparisonRows, period);

  if (dailySeries.length === 0) {
    return createEmptyPerformanceChart();
  }

  const currencyCode = normalizeCurrencyCode(currentRows[0]?.currencyCode);
  const intervals: ChartIntervalOption[] = [
    {
      value: "daily",
      label: "Napi",
      summary: createChartSummary("Napi", dailySeries, currencyCode),
      series: dailySeries
    },
    {
      value: "weekly",
      label: "Heti",
      summary: createChartSummary("Heti", weeklySeries, currencyCode),
      series: weeklySeries
    },
    {
      value: "monthly",
      label: "Havi",
      summary: createChartSummary("Havi", monthlySeries, currencyCode),
      series: monthlySeries
    }
  ];

  return {
    title: "Teljesítmény alakulása",
    state: "normal" as const,
    granularity: "daily" as const,
    series: dailySeries,
    intervals,
    summary: intervals[0]?.summary ?? "A kiválasztott időszak teljesítményadatai betöltve.",
    emptyMessage: "Ehhez az időszakhoz még nincs megjeleníthető teljesítményadat.",
    errorMessage: "A teljesítményadatok most nem tölthetők be."
  };
}

function createChannelSummary(
  currentRows: NormalizedDailyMetricRow[],
  totals: PeriodTotals,
  currencyCode: string,
  roasTarget: NullableMetricNumber
): ChannelSummary {
  const target = parseOptionalNumber(roasTarget);
  const rows = providerViews.map((view) => {
    const providerRows = currentRows.filter((row) => row.provider === view.provider);
    const providerTotals = aggregateProviderRows(providerRows);
    const hasRows = providerRows.length > 0;
    const isGa4 = view.provider === "ga4";
    const spendShare = totals.spend > 0 && providerTotals.spend > 0
      ? `${formatRoas((providerTotals.spend / totals.spend) * 100)}%`
      : hasRows
        ? "0%"
        : "nincs adat";
    const channelRevenue = isGa4 ? providerTotals.revenue : providerTotals.platformRevenue;
    const roas = providerTotals.spend > 0 ? channelRevenue / providerTotals.spend : null;

    return {
      channel: view.channel,
      status: getChannelStatus({
        hasRows,
        isGa4,
        spend: providerTotals.spend,
        roas,
        target
      }),
      statusLabel: hasRows ? view.statusLabel : "Nincs adat",
      spendLabel: isGa4
        ? "nem médiaköltés"
        : hasRows
          ? formatCompactCurrency(providerTotals.spend, currencyCode)
          : "nincs adat",
      revenueLabel: isGa4
        ? `GA4 bevétel: ${hasRows ? formatCompactCurrency(providerTotals.revenue, currencyCode) : "nincs adat"}`
        : `Platform bevétel: ${hasRows ? formatCompactCurrency(channelRevenue, currencyCode) : "nincs adat"}`,
      roasLabel: isGa4
        ? "projekt szint"
        : roas === null
          ? "nincs adat"
          : formatRoas(roas),
      spendShareLabel: isGa4 ? "n/a" : spendShare,
      note: hasRows ? view.note : "A csatornához nincs napi metrikaadat."
    };
  });

  return {
    title: "Csatornák összefoglalója",
    rows,
    totalRow: {
      channel: "Összesen",
      status: (totals.hasAnyData ? "active" : "source") as ChannelStatus,
      statusLabel: totals.hasAnyData ? "GA4 alapú összesítés" : "Nincs adat",
      spendLabel: totals.paidRowsCount > 0
        ? formatCompactCurrency(totals.spend, currencyCode)
        : "nincs adat",
      revenueLabel: `GA4 bevétel: ${totals.ga4RowsCount > 0 ? formatCompactCurrency(totals.ga4Revenue, currencyCode) : "nincs adat"}`,
      roasLabel: totals.spend > 0 && totals.ga4RowsCount > 0
        ? formatRoas(totals.ga4Revenue / totals.spend)
        : "nincs adat",
      spendShareLabel: totals.paidRowsCount > 0 ? "100%" : "nincs adat"
    },
    footnote:
      "A platformon jelentett bevételek átfedhetnek, ezért nem összeadhatók. Az összes sor GA4 bevételt és teljes paid-media költést használ."
  };
}

function createEmptyPerformanceChart() {
  const intervals = ["daily", "weekly", "monthly"].map((value) => ({
    value: value as ChartGranularity,
    label: getGranularityLabel(value as ChartGranularity),
    summary: "Ehhez az időszakhoz még nincs megjeleníthető teljesítményadat.",
    series: []
  }));

  return {
    title: "Teljesítmény alakulása",
    state: "empty" as const,
    granularity: "daily" as const,
    series: [],
    intervals,
    summary: "Ehhez az időszakhoz még nincs megjeleníthető teljesítményadat.",
    emptyMessage: "Ehhez az időszakhoz még nincs megjeleníthető teljesítményadat.",
    errorMessage: "A teljesítményadatok most nem tölthetők be."
  };
}

function createEmptyChannelSummary(currencyCode: string) {
  return {
    title: "Csatornák összefoglalója",
    rows: providerViews.map((view) => ({
      channel: view.channel,
      status: view.provider === "ga4" ? "source" : "stable" as ChannelStatus,
      statusLabel: "Nincs adat",
      spendLabel: view.provider === "ga4" ? "nem médiaköltés" : "nincs adat",
      revenueLabel: view.provider === "ga4" ? "GA4 bevétel: nincs adat" : "Platform bevétel: nincs adat",
      roasLabel: view.provider === "ga4" ? "projekt szint" : "nincs adat",
      spendShareLabel: view.provider === "ga4" ? "n/a" : "nincs adat",
      note: "A csatornához nincs napi metrikaadat."
    })),
    totalRow: {
      channel: "Összesen",
      status: "source" as const,
      statusLabel: "Nincs adat",
      spendLabel: "nincs adat",
      revenueLabel: "GA4 bevétel: nincs adat",
      roasLabel: "nincs adat",
      spendShareLabel: "nincs adat"
    },
    footnote:
      `A ${currencyCode} devizájú napi metrikaadatok megjelenése után itt látszik majd a csatornaösszesítés.`
  };
}

function createDailySeries(rows: NormalizedDailyMetricRow[]): ChartSeriesPoint[] {
  const byDate = new Map<string, { spend: number; revenue: number }>();

  rows.forEach((row) => {
    const current = byDate.get(row.metricDate) ?? { spend: 0, revenue: 0 };

    byDate.set(row.metricDate, {
      spend: current.spend + (isPaidMediaProvider(row.provider) ? row.spend : 0),
      revenue: current.revenue + (row.provider === "ga4" ? row.revenue : 0)
    });
  });

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, totals]) => ({
      label: formatShortDateLabel(date),
      revenue: Math.round(totals.revenue),
      spend: Math.round(totals.spend),
      roas: totals.spend > 0 ? roundMetric(totals.revenue / totals.spend) : 0
    }));
}

function createWeeklySeries(dailySeries: ChartSeriesPoint[]): ChartSeriesPoint[] {
  const buckets = new Map<number, { revenue: number; spend: number }>();

  dailySeries.forEach((point) => {
    const dayMatch = point.label.match(/\d+/);
    const day = dayMatch ? Number(dayMatch[0]) : 1;
    const weekIndex = Math.floor((day - 1) / 7) + 1;
    const current = buckets.get(weekIndex) ?? { revenue: 0, spend: 0 };

    buckets.set(weekIndex, {
      revenue: current.revenue + point.revenue,
      spend: current.spend + point.spend
    });
  });

  return [...buckets.entries()].map(([weekIndex, totals]) => ({
    label: `${weekIndex}. hét`,
    revenue: Math.round(totals.revenue),
    spend: Math.round(totals.spend),
    roas: totals.spend > 0 ? roundMetric(totals.revenue / totals.spend) : 0
  }));
}

function createMonthlySeries(
  currentRows: NormalizedDailyMetricRow[],
  comparisonRows: NormalizedDailyMetricRow[],
  period: OverviewMetricsPeriod
): ChartSeriesPoint[] {
  const comparisonTotals = aggregateTotals(comparisonRows);
  const currentTotals = aggregateTotals(currentRows);
  const points: ChartSeriesPoint[] = [];

  if (comparisonTotals.hasAnyData) {
    points.push(toMonthlyPoint(
      createMonthName(period.comparisonStart),
      comparisonTotals
    ));
  }

  points.push(toMonthlyPoint(createMonthName(period.currentStart), currentTotals));

  return points;
}

function toMonthlyPoint(label: string, totals: PeriodTotals): ChartSeriesPoint {
  return {
    label,
    revenue: Math.round(totals.ga4Revenue),
    spend: Math.round(totals.spend),
    roas: totals.spend > 0 ? roundMetric(totals.ga4Revenue / totals.spend) : 0
  };
}

function createChartSummary(granularity: string, series: ChartSeriesPoint[], currencyCode: string) {
  if (series.length === 0) {
    return "Ehhez az időszakhoz még nincs megjeleníthető teljesítményadat.";
  }

  const totals = series.reduce(
    (accumulator, point) => ({
      revenue: accumulator.revenue + point.revenue,
      spend: accumulator.spend + point.spend
    }),
    { revenue: 0, spend: 0 }
  );
  const roas = totals.spend > 0 ? formatRoas(totals.revenue / totals.spend) : "nincs adat";

  return `${granularity} nézet: a kiválasztott időszakban ${formatCompactCurrency(totals.revenue, currencyCode)} GA4 bevétel és ${formatCompactCurrency(totals.spend, currencyCode)} médiaköltés látszik. Blended ROAS: ${roas}.`;
}

function aggregateTotals(rows: NormalizedDailyMetricRow[]): PeriodTotals {
  const paidRows = rows.filter((row) => isPaidMediaProvider(row.provider));
  const ga4Rows = rows.filter((row) => row.provider === "ga4");
  const latestUpdatedAt = rows.reduce<string | null>((latest, row) => {
    if (!latest || row.updatedAt > latest) {
      return row.updatedAt;
    }

    return latest;
  }, null);

  return {
    hasAnyData: rows.length > 0,
    paidRowsCount: paidRows.length,
    ga4RowsCount: ga4Rows.length,
    spend: paidRows.reduce((sum, row) => sum + row.spend, 0),
    ga4Revenue: ga4Rows.reduce((sum, row) => sum + row.revenue, 0),
    ga4Purchases: ga4Rows.reduce((sum, row) => sum + row.purchases, 0),
    paidPlatformRevenue: paidRows.reduce(
      (sum, row) => sum + (row.platformConversionValue ?? row.revenue),
      0
    ),
    latestUpdatedAt
  };
}

function aggregateProviderRows(rows: NormalizedDailyMetricRow[]) {
  return rows.reduce(
    (totals, row) => ({
      spend: totals.spend + row.spend,
      revenue: totals.revenue + row.revenue,
      platformRevenue: totals.platformRevenue + (row.platformConversionValue ?? row.revenue),
      purchases: totals.purchases + row.purchases
    }),
    { spend: 0, revenue: 0, platformRevenue: 0, purchases: 0 }
  );
}

function normalizeRows(rows: DailyMetricContentRow[], projectCurrencyCode: string) {
  return rows
    .map(toNormalizedRow)
    .filter((row): row is NormalizedDailyMetricRow => Boolean(row))
    .filter((row) => !row.currencyCode || row.currencyCode === projectCurrencyCode);
}

function toNormalizedRow(row: DailyMetricContentRow): NormalizedDailyMetricRow | null {
  const parsed = dailyMetricContentRowSchema.safeParse(row);

  if (!parsed.success) {
    return null;
  }

  const spend = parseRequiredMetricNumber(parsed.data.spend);
  const revenue = parseRequiredMetricNumber(parsed.data.revenue);
  const purchases = parseRequiredMetricNumber(parsed.data.purchases);
  const platformConversionValue = parseOptionalMetricNumber(parsed.data.platform_conversion_value);
  const platformConversions = parseOptionalMetricNumber(parsed.data.platform_conversions);

  if (spend === null || revenue === null || purchases === null) {
    return null;
  }

  return {
    metricDate: parsed.data.metric_date,
    provider: parsed.data.provider,
    spend,
    revenue,
    purchases,
    platformConversionValue,
    platformConversions,
    currencyCode: parsed.data.currency_code,
    updatedAt: parsed.data.updated_at
  };
}

function createMetricValue(value: number, hasData: boolean): MetricValue {
  return {
    value,
    hasData
  };
}

function createRatioMetric(numerator: MetricValue, denominator: MetricValue): MetricValue {
  if (!numerator.hasData || !denominator.hasData || denominator.value <= 0) {
    return {
      value: 0,
      hasData: false
    };
  }

  return {
    value: numerator.value / denominator.value,
    hasData: true
  };
}

function createComparisonMetric(
  current: MetricValue,
  comparison: MetricValue,
  lowerIsBetter: boolean
): ComparisonMetric {
  if (!current.hasData || !comparison.hasData) {
    return {
      label: "nincs összehasonlítás",
      state: "neutral"
    };
  }

  if (comparison.value === 0) {
    if (current.value === 0) {
      return {
        label: "0%",
        state: "neutral"
      };
    }

    return {
      label: "új adat",
      state: lowerIsBetter ? "negative" : "positive"
    };
  }

  const change = ((current.value - comparison.value) / comparison.value) * 100;
  const state = getComparisonState(change, lowerIsBetter);

  return {
    label: formatPercent(change),
    state
  };
}

function getComparisonState(change: number, lowerIsBetter: boolean): SemanticState {
  if (Math.abs(change) < 0.05) {
    return "neutral";
  }

  if (lowerIsBetter) {
    return change < 0 ? "positive" : "negative";
  }

  return change > 0 ? "positive" : "negative";
}

function getChannelStatus(input: {
  hasRows: boolean;
  isGa4: boolean;
  spend: number;
  roas: number | null;
  target: number | null;
}): ChannelStatus {
  if (!input.hasRows) {
    return "stable";
  }

  if (input.isGa4) {
    return "source";
  }

  if (input.spend <= 0) {
    return "stable";
  }

  if (input.target !== null && input.roas !== null && input.roas < input.target) {
    return "attention";
  }

  return "active";
}

function isPaidMediaProvider(provider: DailyMetricProvider): provider is typeof paidMediaProviders[number] {
  return paidMediaProviders.some((paidProvider) => paidProvider === provider);
}

function parseRequiredMetricNumber(value: string | number | null): number | null {
  if (value === null) {
    return null;
  }

  return parseOptionalMetricNumber(value);
}

function parseOptionalMetricNumber(value: string | number | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseOptionalNumber(value: NullableMetricNumber): number | null {
  if (value === null || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCurrencyCode(currencyCode?: string | null) {
  const normalized = currencyCode?.trim().toUpperCase();

  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : "HUF";
}

function formatRoasTarget(roasTarget: NullableMetricNumber | undefined) {
  return roasTarget === null || roasTarget === undefined
    ? "4,2"
    : String(roasTarget).replace(".", ",");
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 0
  }).format(value);
}

function roundMetric(value: number) {
  return Number(value.toFixed(2));
}

function createPeriodLabels(period: OverviewMetricsPeriod) {
  return {
    current: createDateRangeLabel(period.currentStart, period.currentEnd),
    comparison: createDateRangeLabel(period.comparisonStart, period.comparisonEnd)
  };
}

function createDateRangeLabel(start: string, end: string) {
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return createMonthLabel(start);
  }

  return `${formatShortDateLabel(start)} - ${formatShortDateLabel(end)}`;
}

function createLastRefreshLabel(updatedAt: string | null) {
  return updatedAt
    ? `Utolsó adatfrissítés: ${formatDateTimeLabel(updatedAt)}`
    : "Utolsó adatfrissítés: nincs adat";
}

function formatShortDateLabel(date: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(parseDateOnly(date));
}

function formatDateTimeLabel(date: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Budapest"
  }).format(new Date(date));
}

function createMonthLabel(date: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    timeZone: "UTC"
  }).format(parseDateOnly(date));
}

function createMonthName(date: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "long",
    timeZone: "UTC"
  }).format(parseDateOnly(date));
}

function getGranularityLabel(granularity: ChartGranularity) {
  if (granularity === "daily") {
    return "Napi";
  }

  if (granularity === "weekly") {
    return "Heti";
  }

  return "Havi";
}

function parseDateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function createUtcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysInMonth(date: Date) {
  return createUtcDate(date.getUTCFullYear(), date.getUTCMonth() + 1, 0).getUTCDate();
}
