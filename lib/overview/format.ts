export function formatForint(value: number) {
  return formatCurrency(value, "HUF");
}

export function formatCurrency(value: number, currencyCode = "HUF") {
  if (currencyCode === "HUF") {
    return `${formatGroupedInteger(value)} Ft`;
  }

  return new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: currencyCode
  }).format(value);
}

export function formatCompactForint(value: number) {
  return formatCompactCurrency(value, "HUF");
}

export function formatCompactCurrency(value: number, currencyCode = "HUF") {
  if (Math.abs(value) >= 1_000_000) {
    const compactValue = new Intl.NumberFormat("hu-HU", {
      maximumFractionDigits: 1
    }).format(value / 1_000_000);

    if (currencyCode === "HUF") {
      return `${compactValue} M Ft`;
    }

    return `${compactValue} M ${currencyCode}`;
  }

  if (currencyCode === "HUF") {
    return formatForint(value);
  }

  if (Math.abs(value) >= 1_000) {
    return `${new Intl.NumberFormat("hu-HU", {
      maximumFractionDigits: 1
    }).format(value / 1_000)} k ${currencyCode}`;
  }

  return formatCurrency(value, currencyCode);
}

function formatGroupedInteger(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
