export const chartColorTokens = {
  revenue: "var(--kh-chart-revenue)",
  spend: "var(--kh-chart-spend)",
  roas: "var(--kh-chart-roas)",
  grid: "var(--kh-chart-grid)",
  axis: "var(--kh-chart-axis)"
} as const;

export const requiredOverviewDesignTokens = [
  "--kh-chart-revenue",
  "--kh-chart-spend",
  "--kh-chart-roas",
  "--kh-chart-grid",
  "--kh-chart-axis",
  "--kh-status-online",
  "--kh-status-online-text"
] as const;
