"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { EmptyState, ErrorState, SectionSkeleton } from "@/components/ui/state";
import { chartColorTokens } from "@/lib/overview/design-tokens";
import { formatCompactForint, formatForint, formatRoas } from "@/lib/overview/format";
import type { PerformanceChartViewModel } from "@/types/overview";

type PerformanceChartProps = Readonly<{
  chart: PerformanceChartViewModel;
}>;

export function PerformanceChart({ chart }: PerformanceChartProps) {
  const [selectedGranularity, setSelectedGranularity] = useState(chart.granularity);
  const selectedInterval =
    chart.intervals.find((interval) => interval.value === selectedGranularity) ??
    chart.intervals[0];
  const visibleSeries = selectedInterval?.series ?? chart.series;
  const visibleSummary = selectedInterval?.summary ?? chart.summary;

  if (chart.state === "loading") {
    return (
      <section className="kh-card kh-chart-card" aria-labelledby="performance-chart-title">
        <ChartHeading chart={chart} />
        <SectionSkeleton
          description="A teljesítménydiagram adatai betöltés alatt vannak."
          title={chart.title}
        />
      </section>
    );
  }

  if (chart.state === "empty") {
    return (
      <section className="kh-card kh-chart-card" aria-labelledby="performance-chart-title">
        <ChartHeading chart={chart} />
        <EmptyState description={chart.emptyMessage} title="Nincs diagramadat" />
      </section>
    );
  }

  if (chart.state === "error") {
    return (
      <section className="kh-card kh-chart-card" aria-labelledby="performance-chart-title">
        <ChartHeading chart={chart} />
        <ErrorState description={chart.errorMessage} title="Nem sikerült betölteni" />
      </section>
    );
  }

  return (
    <section className="kh-card kh-chart-card" aria-labelledby="performance-chart-title">
      <ChartHeading chart={chart} />
      <div className="kh-chart-controls" aria-label="Diagram bontása">
        {chart.intervals.map((interval) => (
          <button
            aria-pressed={interval.value === selectedGranularity}
            key={interval.value}
            onClick={() => setSelectedGranularity(interval.value)}
            type="button"
          >
            {interval.label}
          </button>
        ))}
      </div>
      <p className="kh-chart-summary">{visibleSummary}</p>
      <div aria-label={visibleSummary} className="kh-chart-frame" role="img">
        <div className="kh-chart-canvas">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={visibleSeries} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={chartColorTokens.grid} strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: chartColorTokens.axis, fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: chartColorTokens.axis, fontSize: 12 }}
                tickFormatter={(value) => formatCompactForint(Number(value))}
                tickLine={false}
                yAxisId="money"
              />
              <YAxis
                orientation="right"
                tick={{ fill: chartColorTokens.axis, fontSize: 12 }}
                tickFormatter={(value) => formatRoas(Number(value))}
                tickLine={false}
                yAxisId="roas"
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "ROAS") {
                    return [formatRoas(Number(value)), "ROAS"];
                  }

                  return [formatForint(Number(value)), String(name)];
                }}
                labelFormatter={(label) => `${label}`}
              />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 16 }} />
              <Area
                dataKey="revenue"
                fill={chartColorTokens.revenue}
                fillOpacity={0.1}
                isAnimationActive={false}
                name="Bevétel"
                stroke={chartColorTokens.revenue}
                strokeWidth={2}
                type="monotone"
                yAxisId="money"
              />
              <Line
                dataKey="spend"
                dot={false}
                isAnimationActive={false}
                name="Költés"
                stroke={chartColorTokens.spend}
                strokeWidth={2}
                type="monotone"
                yAxisId="money"
              />
              <Line
                dataKey="roas"
                dot={false}
                isAnimationActive={false}
                name="ROAS"
                stroke={chartColorTokens.roas}
                strokeWidth={2}
                type="monotone"
                yAxisId="roas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function ChartHeading({ chart }: PerformanceChartProps) {
  return (
    <div className="kh-card-header-row">
      <div>
        <p className="kh-section-kicker">Trend</p>
        <h2 id="performance-chart-title">{chart.title}</h2>
      </div>
      <span className="kh-readonly-badge">Statikus előnézet</span>
    </div>
  );
}
