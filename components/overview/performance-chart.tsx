"use client";

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
import { formatCompactForint, formatForint, formatRoas } from "@/lib/overview/format";
import type { PerformanceChartViewModel } from "@/types/overview";

type PerformanceChartProps = Readonly<{
  chart: PerformanceChartViewModel;
}>;

export function PerformanceChart({ chart }: PerformanceChartProps) {
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
        <button aria-pressed="true" type="button">
          Napi
        </button>
        <button type="button">Heti</button>
        <button type="button">Havi</button>
      </div>
      <p className="kh-sr-only">{chart.summary}</p>
      <div className="kh-chart-frame">
        <ResponsiveContainer height={320} width="100%">
          <AreaChart data={chart.series} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#E6EAF0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#667085", fontSize: 12 }} tickLine={false} />
            <YAxis
              tick={{ fill: "#667085", fontSize: 12 }}
              tickFormatter={(value) => formatCompactForint(Number(value))}
              tickLine={false}
              yAxisId="money"
            />
            <YAxis
              orientation="right"
              tick={{ fill: "#667085", fontSize: 12 }}
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
              fill="#F36A21"
              fillOpacity={0.1}
              name="Bevétel"
              stroke="#F36A21"
              strokeWidth={2}
              type="monotone"
              yAxisId="money"
            />
            <Line
              dataKey="spend"
              dot={false}
              name="Költés"
              stroke="#24344D"
              strokeWidth={2}
              type="monotone"
              yAxisId="money"
            />
            <Line
              dataKey="roas"
              dot={false}
              name="ROAS"
              stroke="#16794C"
              strokeWidth={2}
              type="monotone"
              yAxisId="roas"
            />
          </AreaChart>
        </ResponsiveContainer>
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
