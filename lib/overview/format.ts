export function formatForint(value: number) {
  return new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "HUF"
  }).format(value);
}

export function formatCompactForint(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat("hu-HU", {
      maximumFractionDigits: 1
    }).format(value / 1_000_000)} M Ft`;
  }

  return formatForint(value);
}

export function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 1
  }).format(value)}%`;
}

export function formatRoas(value: number) {
  return new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 2
  }).format(value);
}
