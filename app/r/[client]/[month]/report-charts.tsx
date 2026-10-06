"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type TrendPoint = {
  month: string;
  spend: number;
  value: number;
  roas: number;
};

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-slate-400">
        Még nincs elég történeti adat a trendgrafikonhoz.
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="money"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`}
          />
          <YAxis
            yAxisId="roas"
            orientation="right"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}×`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
            }}
            formatter={(value, name) => {
              const n = Number(value);
              if (name === "ROAS") return [`${n.toFixed(2)}×`, name];
              return [`${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar
            yAxisId="money"
            dataKey="spend"
            name="Költés"
            fill="#60a5fa"
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            yAxisId="money"
            dataKey="value"
            name="Bevétel / konv. érték"
            fill="#34d399"
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          />
          <Line
            yAxisId="roas"
            type="monotone"
            dataKey="roas"
            name="ROAS"
            stroke="#7c3aed"
            strokeWidth={3}
            dot={{ r: 3, fill: "#7c3aed" }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
