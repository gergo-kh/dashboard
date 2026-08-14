import { z } from "zod";
import { formatCompactCurrency, formatRoas } from "@/lib/overview/format";
import type {
  AttentionProduct,
  AttentionProductIssue
} from "@/types/overview";

const visibleProductStatuses = new Set(["approved", "active", "disapproved", "limited"]);
const visibleIssueStatuses = new Set(["open", "in_progress"]);

const metricNumberSchema = z.union([z.string(), z.number()]).nullable();

const merchantProductRowSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  external_product_id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  gtin: z.string().trim().min(1).nullable(),
  approval_status: z.string().trim().min(1).nullable(),
  updated_at: z.string().datetime()
});

const productDailyMetricRowSchema = z.object({
  merchant_product_id: z.string().uuid(),
  metric_date: z.string().date(),
  spend: metricNumberSchema,
  revenue: metricNumberSchema,
  purchases: metricNumberSchema
});

const productIssueRowSchema = z.object({
  id: z.string().uuid(),
  merchant_product_id: z.string().uuid(),
  issue_type: z.string().trim().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).nullable(),
  recommendation: z.string().trim().min(1).nullable(),
  status: z.enum(["draft", "open", "in_progress", "resolved", "dismissed", "hidden"]),
  detected_at: z.string().datetime()
});

export type MerchantProductContentRow = Readonly<z.input<typeof merchantProductRowSchema>>;
export type ProductDailyMetricContentRow = Readonly<z.input<typeof productDailyMetricRowSchema>>;
export type ProductIssueContentRow = Readonly<z.input<typeof productIssueRowSchema>>;

export type MerchantAttentionRows = Readonly<{
  products: MerchantProductContentRow[];
  metrics: ProductDailyMetricContentRow[];
  issues: ProductIssueContentRow[];
  projectCurrencyCode: string | null;
}>;

type NormalizedProduct = Readonly<z.output<typeof merchantProductRowSchema>>;
type NormalizedProductIssue = Readonly<z.output<typeof productIssueRowSchema>>;

type ProductMetricTotals = Readonly<{
  hasMetrics: boolean;
  spend: number;
  revenue: number;
  purchases: number;
}>;

type AttentionCandidate = Readonly<{
  product: NormalizedProduct;
  issue: NormalizedProductIssue;
  metrics: ProductMetricTotals;
}>;

const issueLabels = {
  low_efficiency: "alacsony hatékonyság",
  high_spend_low_purchase: "magas költés, kevés vásárlás",
  missing_gtin: "hiányzó GTIN",
  poor_feed_quality: "gyenge feedminőség",
  disapproved: "elutasított termék"
} satisfies Record<AttentionProductIssue, string>;

const severityPriority = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
} satisfies Record<NormalizedProductIssue["severity"], number>;

export function createEmptyMerchantAttentionProducts(): AttentionProduct[] {
  return [];
}

export function createMerchantAttentionProducts(rows: MerchantAttentionRows): AttentionProduct[] {
  const currencyCode = normalizeCurrencyCode(rows.projectCurrencyCode);
  const products = normalizeProducts(rows.products);
  const productById = new Map(products.map((product) => [product.id, product]));
  const metricsByProductId = aggregateProductMetrics(rows.metrics, productById);
  const issues = normalizeIssues(rows.issues, productById);

  return issues
    .map((issue) => {
      const product = productById.get(issue.merchant_product_id);

      if (!product) {
        return null;
      }

      return {
        product,
        issue,
        metrics: metricsByProductId.get(product.id) ?? createEmptyMetricTotals()
      };
    })
    .filter((candidate): candidate is AttentionCandidate => Boolean(candidate))
    .sort(compareAttentionCandidates)
    .slice(0, 10)
    .map((candidate) => toAttentionProduct(candidate, currencyCode));
}

function normalizeProducts(rows: MerchantProductContentRow[]) {
  return rows
    .map((row) => merchantProductRowSchema.safeParse(row))
    .filter((result) => result.success)
    .map((result) => result.data)
    .filter(isClientVisibleProduct);
}

function normalizeIssues(
  rows: ProductIssueContentRow[],
  productById: Map<string, NormalizedProduct>
) {
  return rows
    .map((row) => productIssueRowSchema.safeParse(row))
    .filter((result) => result.success)
    .map((result) => result.data)
    .filter((issue) => visibleIssueStatuses.has(issue.status))
    .filter((issue) => productById.has(issue.merchant_product_id));
}

function aggregateProductMetrics(
  rows: ProductDailyMetricContentRow[],
  productById: Map<string, NormalizedProduct>
) {
  return rows.reduce<Map<string, ProductMetricTotals>>((totalsByProductId, row) => {
    const parsed = productDailyMetricRowSchema.safeParse(row);

    if (!parsed.success || !productById.has(parsed.data.merchant_product_id)) {
      return totalsByProductId;
    }

    const spend = parseMetricNumber(parsed.data.spend);
    const revenue = parseMetricNumber(parsed.data.revenue);
    const purchases = parseMetricNumber(parsed.data.purchases);

    if (spend === null || revenue === null || purchases === null) {
      return totalsByProductId;
    }

    const current = totalsByProductId.get(parsed.data.merchant_product_id) ?? createEmptyMetricTotals();

    totalsByProductId.set(parsed.data.merchant_product_id, {
      hasMetrics: true,
      spend: current.spend + spend,
      revenue: current.revenue + revenue,
      purchases: current.purchases + purchases
    });

    return totalsByProductId;
  }, new Map<string, ProductMetricTotals>());
}

function toAttentionProduct(
  candidate: AttentionCandidate,
  currencyCode: string
): AttentionProduct {
  const issue = getAttentionIssue(candidate);

  return {
    id: candidate.product.id,
    name: candidate.product.title,
    sku: candidate.product.gtin ?? candidate.product.external_product_id,
    spendLabel: candidate.metrics.hasMetrics
      ? formatCompactCurrency(candidate.metrics.spend, currencyCode)
      : "nincs adat",
    revenueLabel: candidate.metrics.hasMetrics
      ? formatCompactCurrency(candidate.metrics.revenue, currencyCode)
      : "nincs adat",
    roasLabel: candidate.metrics.hasMetrics && candidate.metrics.spend > 0
      ? formatRoas(candidate.metrics.revenue / candidate.metrics.spend)
      : "nincs adat",
    issue,
    issueLabel: issueLabels[issue],
    detail: createIssueDetail(candidate.issue)
  };
}

function getAttentionIssue(candidate: AttentionCandidate): AttentionProductIssue {
  const text = `${candidate.issue.issue_type} ${candidate.issue.title} ${candidate.issue.description ?? ""}`.toLowerCase();

  if (text.includes("gtin")) {
    return "missing_gtin";
  }

  if (
    text.includes("disapproved") ||
    text.includes("elutas") ||
    candidate.product.approval_status === "disapproved"
  ) {
    return "disapproved";
  }

  if (
    text.includes("feed") ||
    text.includes("title") ||
    text.includes("image") ||
    text.includes("kép")
  ) {
    return "poor_feed_quality";
  }

  if (candidate.metrics.hasMetrics && candidate.metrics.spend > 0 && candidate.metrics.purchases === 0) {
    return "high_spend_low_purchase";
  }

  return "low_efficiency";
}

function createIssueDetail(issue: NormalizedProductIssue) {
  return issue.recommendation ?? issue.description ?? issue.title;
}

function compareAttentionCandidates(left: AttentionCandidate, right: AttentionCandidate) {
  const severityDifference =
    severityPriority[left.issue.severity] - severityPriority[right.issue.severity];

  if (severityDifference !== 0) {
    return severityDifference;
  }

  if (right.metrics.spend !== left.metrics.spend) {
    return right.metrics.spend - left.metrics.spend;
  }

  return right.issue.detected_at.localeCompare(left.issue.detected_at);
}

function isClientVisibleProduct(product: NormalizedProduct) {
  if (!product.approval_status) {
    return true;
  }

  return visibleProductStatuses.has(product.approval_status);
}

function createEmptyMetricTotals(): ProductMetricTotals {
  return {
    hasMetrics: false,
    spend: 0,
    revenue: 0,
    purchases: 0
  };
}

function parseMetricNumber(value: string | number | null) {
  if (value === null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function normalizeCurrencyCode(currencyCode?: string | null) {
  const normalized = currencyCode?.trim().toUpperCase();

  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : "HUF";
}
