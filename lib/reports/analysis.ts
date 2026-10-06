import type { Json } from "@/types/database";

export type ReportMetricRow = {
  report_month: string;
  combined: Json;
  meta: Json;
  google: Json;
};

type MetricObject = Record<string, unknown>;
type Coverage = "meta+google" | "meta" | "google" | "none";

export type RollingWindow = {
  months: number;
  availableMonths: number;
  coverageConsistent: boolean;
  spend: number;
  attributedValue: number;
  roas: number;
  averageMonthlyValue: number;
};

export type ReportAnalysis = {
  coverage: {
    current: Coverage;
    previousMonth: Coverage | null;
    previousYear: Coverage | null;
    combinedMomComparable: boolean;
    combinedYoyComparable: boolean;
  };
  mom: {
    spendPct: number | null;
    valuePct: number | null;
    roasPct: number | null;
  };
  yoy: {
    combined: {
      available: boolean;
      comparable: boolean;
      spendPct: number | null;
      valuePct: number | null;
      roasPct: number | null;
    };
    meta: {
      comparable: boolean;
      spendPct: number | null;
      valuePct: number | null;
      roasPct: number | null;
    };
    google: {
      comparable: boolean;
      spendPct: number | null;
      valuePct: number | null;
      roasPct: number | null;
    };
  };
  seasonality: {
    available: boolean;
    classification:
      | "seasonal_decline_supported"
      | "decline_deeper_than_last_year"
      | "decline_milder_than_last_year"
      | "seasonal_growth_supported"
      | "growth_stronger_than_last_year"
      | "growth_weaker_than_last_year"
      | "decline_not_supported_by_last_year"
      | "growth_above_last_year_pattern"
      | "stable"
      | "mixed"
      | "unavailable";
    currentMomValuePct: number | null;
    priorYearMomValuePct: number | null;
    gapPp: number | null;
    label: string;
  };
  rolling: {
    threeMonths: RollingWindow;
    sixMonths: RollingWindow;
    twelveMonths: RollingWindow;
  };
  priorYearReportMonth: string | null;
};

function asObject(value: Json | null | undefined): MetricObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as MetricObject)
    : {};
}

function number(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullablePct(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function activePlatform(value: Json | null | undefined): boolean {
  const metric = asObject(value);
  return (
    number(metric.spend) > 0 ||
    number(metric.impressions) > 0 ||
    number(metric.revenue) > 0
  );
}

function coverage(row: ReportMetricRow | null | undefined): Coverage {
  if (!row) return "none";
  const meta = activePlatform(row.meta);
  const google = activePlatform(row.google);
  if (meta && google) return "meta+google";
  if (meta) return "meta";
  if (google) return "google";
  return "none";
}

function monthOffset(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function combinedMetric(row: ReportMetricRow | null | undefined, key: string): number {
  return number(asObject(row?.combined)[key]);
}

function platformMetric(
  row: ReportMetricRow | null | undefined,
  platform: "meta" | "google",
  key: string
): number {
  return number(asObject(row?.[platform])[key]);
}

function rollingWindow(
  history: ReportMetricRow[],
  currentMonth: string,
  months: number,
  currentCoverage: Coverage
): RollingWindow {
  const firstMonth = monthOffset(currentMonth, -(months - 1));
  const rows = history.filter(
    (row) => row.report_month >= firstMonth && row.report_month <= currentMonth
  );
  const spend = rows.reduce((sum, row) => sum + combinedMetric(row, "spend"), 0);
  const attributedValue = rows.reduce(
    (sum, row) => sum + combinedMetric(row, "attributed_value"),
    0
  );
  const comparableRows = rows.filter((row) => coverage(row) !== "none");
  const coverageConsistent =
    comparableRows.length > 0 &&
    comparableRows.every((row) => coverage(row) === currentCoverage);

  return {
    months,
    availableMonths: rows.length,
    coverageConsistent,
    spend,
    attributedValue,
    roas: spend > 0 ? attributedValue / spend : 0,
    averageMonthlyValue: rows.length > 0 ? attributedValue / rows.length : 0
  };
}

function classifySeasonality(
  currentMom: number | null,
  priorYearMom: number | null
): ReportAnalysis["seasonality"] {
  if (currentMom === null || priorYearMom === null) {
    return {
      available: false,
      classification: "unavailable",
      currentMomValuePct: currentMom,
      priorYearMomValuePct: priorYearMom,
      gapPp: null,
      label: "Nincs elég összehasonlítható történeti adat a szezonalitás megítéléséhez."
    };
  }

  const gap = currentMom - priorYearMom;
  let classification: ReportAnalysis["seasonality"]["classification"] = "mixed";
  let label = "A mostani havi mozgás nem követ egyértelműen tavalyi szezonális mintát.";

  if (Math.abs(currentMom) < 10 && Math.abs(priorYearMom) < 10) {
    classification = "stable";
    label = "A hónapváltás tavaly és idén is viszonylag stabil volt.";
  } else if (currentMom <= -10 && priorYearMom <= -10) {
    if (gap < -15) {
      classification = "decline_deeper_than_last_year";
      label = "A visszaesés iránya szezonálisan indokolható, de idén érezhetően mélyebb a tavalyinál.";
    } else if (gap > 15) {
      classification = "decline_milder_than_last_year";
      label = "A visszaesés szezonális mintát követ, de enyhébb a tavalyinál.";
    } else {
      classification = "seasonal_decline_supported";
      label = "A visszaesés nagyrészt illeszkedik a tavalyi szezonális mintához.";
    }
  } else if (currentMom >= 10 && priorYearMom >= 10) {
    if (gap > 15) {
      classification = "growth_stronger_than_last_year";
      label = "A szezonálisan erősödő időszak idén a tavalyinál is nagyobb növekedést hozott.";
    } else if (gap < -15) {
      classification = "growth_weaker_than_last_year";
      label = "A szezonálisan erősödő időszak megvan, de a növekedés gyengébb a tavalyinál.";
    } else {
      classification = "seasonal_growth_supported";
      label = "A növekedés jól illeszkedik a tavalyi szezonális mintához.";
    }
  } else if (currentMom <= -10 && priorYearMom > -10) {
    classification = "decline_not_supported_by_last_year";
    label = "A mostani visszaesést a tavalyi hónapváltás nem támasztja alá szezonális hatásként.";
  } else if (currentMom >= 10 && priorYearMom < 10) {
    classification = "growth_above_last_year_pattern";
    label = "A mostani növekedés erősebb annál, amit a tavalyi szezonális minta önmagában indokolna.";
  }

  return {
    available: true,
    classification,
    currentMomValuePct: currentMom,
    priorYearMomValuePct: priorYearMom,
    gapPp: gap,
    label
  };
}

export function buildReportAnalysis(
  current: ReportMetricRow,
  historyRows: ReportMetricRow[]
): ReportAnalysis {
  const historyMap = new Map(historyRows.map((row) => [row.report_month, row]));
  historyMap.set(current.report_month, current);
  const history = [...historyMap.values()].sort((a, b) =>
    a.report_month.localeCompare(b.report_month)
  );

  const previousMonth = historyMap.get(monthOffset(current.report_month, -1)) ?? null;
  const priorYearMonth = monthOffset(current.report_month, -12);
  const priorYear = historyMap.get(priorYearMonth) ?? null;
  const priorYearPreviousMonth = historyMap.get(monthOffset(current.report_month, -13)) ?? null;

  const currentCoverage = coverage(current);
  const previousCoverage = previousMonth ? coverage(previousMonth) : null;
  const priorYearCoverage = priorYear ? coverage(priorYear) : null;
  const priorYearPreviousCoverage = priorYearPreviousMonth
    ? coverage(priorYearPreviousMonth)
    : null;

  const combinedMomComparable =
    Boolean(previousMonth) &&
    currentCoverage !== "none" &&
    currentCoverage === previousCoverage;

  const combinedYoyComparable =
    Boolean(priorYear) &&
    currentCoverage !== "none" &&
    currentCoverage === priorYearCoverage;

  const currentSpend = combinedMetric(current, "spend");
  const currentValue = combinedMetric(current, "attributed_value");
  const currentRoas = combinedMetric(current, "roas");

  const previousSpend = combinedMetric(previousMonth, "spend");
  const previousValue = combinedMetric(previousMonth, "attributed_value");
  const previousRoas = combinedMetric(previousMonth, "roas");

  const priorYearSpend = combinedMetric(priorYear, "spend");
  const priorYearValue = combinedMetric(priorYear, "attributed_value");
  const priorYearRoas = combinedMetric(priorYear, "roas");

  const metaComparable = Boolean(priorYear) && activePlatform(current.meta) && activePlatform(priorYear?.meta);
  const googleComparable =
    Boolean(priorYear) && activePlatform(current.google) && activePlatform(priorYear?.google);

  const currentMomValuePct = combinedMomComparable
    ? nullablePct(currentValue, previousValue)
    : null;

  const priorYearTransitionComparable =
    Boolean(priorYear && priorYearPreviousMonth) &&
    priorYearCoverage !== "none" &&
    priorYearCoverage === priorYearPreviousCoverage;

  const priorYearMomValuePct = priorYearTransitionComparable
    ? nullablePct(
        combinedMetric(priorYear, "attributed_value"),
        combinedMetric(priorYearPreviousMonth, "attributed_value")
      )
    : null;

  return {
    coverage: {
      current: currentCoverage,
      previousMonth: previousCoverage,
      previousYear: priorYearCoverage,
      combinedMomComparable,
      combinedYoyComparable
    },
    mom: {
      spendPct: combinedMomComparable ? nullablePct(currentSpend, previousSpend) : null,
      valuePct: currentMomValuePct,
      roasPct: combinedMomComparable ? nullablePct(currentRoas, previousRoas) : null
    },
    yoy: {
      combined: {
        available: Boolean(priorYear),
        comparable: combinedYoyComparable,
        spendPct: combinedYoyComparable ? nullablePct(currentSpend, priorYearSpend) : null,
        valuePct: combinedYoyComparable ? nullablePct(currentValue, priorYearValue) : null,
        roasPct: combinedYoyComparable ? nullablePct(currentRoas, priorYearRoas) : null
      },
      meta: {
        comparable: metaComparable,
        spendPct: metaComparable
          ? nullablePct(platformMetric(current, "meta", "spend"), platformMetric(priorYear, "meta", "spend"))
          : null,
        valuePct: metaComparable
          ? nullablePct(platformMetric(current, "meta", "revenue"), platformMetric(priorYear, "meta", "revenue"))
          : null,
        roasPct: metaComparable
          ? nullablePct(platformMetric(current, "meta", "roas"), platformMetric(priorYear, "meta", "roas"))
          : null
      },
      google: {
        comparable: googleComparable,
        spendPct: googleComparable
          ? nullablePct(platformMetric(current, "google", "spend"), platformMetric(priorYear, "google", "spend"))
          : null,
        valuePct: googleComparable
          ? nullablePct(platformMetric(current, "google", "revenue"), platformMetric(priorYear, "google", "revenue"))
          : null,
        roasPct: googleComparable
          ? nullablePct(platformMetric(current, "google", "roas"), platformMetric(priorYear, "google", "roas"))
          : null
      }
    },
    seasonality: classifySeasonality(currentMomValuePct, priorYearMomValuePct),
    rolling: {
      threeMonths: rollingWindow(history, current.report_month, 3, currentCoverage),
      sixMonths: rollingWindow(history, current.report_month, 6, currentCoverage),
      twelveMonths: rollingWindow(history, current.report_month, 12, currentCoverage)
    },
    priorYearReportMonth: priorYear ? priorYear.report_month : null
  };
}
