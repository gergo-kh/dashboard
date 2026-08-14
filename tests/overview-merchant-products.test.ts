import { describe, expect, it } from "vitest";
import {
  createEmptyMerchantAttentionProducts,
  createMerchantAttentionProducts,
  type MerchantProductContentRow,
  type ProductDailyMetricContentRow,
  type ProductIssueContentRow
} from "@/lib/overview/merchant-products";

const projectId = "30000000-0000-4000-8000-000000000001";
const updatedAt = "2026-08-01T06:10:00Z";

function createProduct(input: {
  id: string;
  title: string;
  externalProductId: string;
  gtin?: string | null;
  approvalStatus?: string | null;
  projectId?: string;
}): MerchantProductContentRow {
  return {
    id: input.id,
    project_id: input.projectId ?? projectId,
    external_product_id: input.externalProductId,
    title: input.title,
    gtin: input.gtin ?? null,
    approval_status: input.approvalStatus ?? "approved",
    updated_at: updatedAt
  };
}

function createMetric(input: {
  productId: string;
  spend: string;
  revenue: string;
  purchases: string;
}): ProductDailyMetricContentRow {
  return {
    merchant_product_id: input.productId,
    metric_date: "2026-07-31",
    spend: input.spend,
    revenue: input.revenue,
    purchases: input.purchases
  };
}

function createIssue(input: {
  id: string;
  productId: string;
  issueType: string;
  title: string;
  severity?: ProductIssueContentRow["severity"];
  status?: ProductIssueContentRow["status"];
  description?: string | null;
  recommendation?: string | null;
  detectedAt?: string;
}): ProductIssueContentRow {
  return {
    id: input.id,
    merchant_product_id: input.productId,
    issue_type: input.issueType,
    severity: input.severity ?? "high",
    title: input.title,
    description: input.description ?? null,
    recommendation: input.recommendation ?? null,
    status: input.status ?? "open",
    detected_at: input.detectedAt ?? updatedAt
  };
}

describe("merchant attention products read model", () => {
  it("maps visible merchant products, current metrics, and active issues to attention products", () => {
    const productId = "40000000-0000-4000-8000-000000000001";
    const content = createMerchantAttentionProducts({
      projectCurrencyCode: "HUF",
      products: [
        createProduct({
          id: productId,
          title: "Demó Merchant termék",
          externalProductId: "SKU-1",
          gtin: "5990000000001"
        })
      ],
      metrics: [
        createMetric({
          productId,
          spend: "120000",
          revenue: "240000",
          purchases: "4"
        })
      ],
      issues: [
        createIssue({
          id: "50000000-0000-4000-8000-000000000001",
          productId,
          issueType: "missing_gtin",
          title: "GTIN ellenőrzés szükséges",
          recommendation: "Pótold a gyártói azonosítót a feedben."
        })
      ]
    });

    expect(content).toHaveLength(1);
    expect(content[0]).toMatchObject({
      name: "Demó Merchant termék",
      sku: "5990000000001",
      spendLabel: "120 000 Ft",
      revenueLabel: "240 000 Ft",
      roasLabel: "2",
      issue: "missing_gtin",
      issueLabel: "hiányzó GTIN",
      detail: "Pótold a gyártói azonosítót a feedben."
    });
  });

  it("excludes hidden products, inactive issues, and orphan metric rows", () => {
    const visibleProductId = "40000000-0000-4000-8000-000000000011";
    const hiddenProductId = "40000000-0000-4000-8000-000000000012";
    const dismissedProductId = "40000000-0000-4000-8000-000000000013";
    const content = createMerchantAttentionProducts({
      projectCurrencyCode: "HUF",
      products: [
        createProduct({
          id: visibleProductId,
          title: "Látható termék",
          externalProductId: "VISIBLE-1"
        }),
        createProduct({
          id: hiddenProductId,
          title: "Rejtett termék",
          externalProductId: "HIDDEN-1",
          approvalStatus: "hidden"
        }),
        createProduct({
          id: dismissedProductId,
          title: "Lezárt issue termék",
          externalProductId: "DISMISSED-1"
        })
      ],
      metrics: [
        createMetric({
          productId: visibleProductId,
          spend: "50000",
          revenue: "0",
          purchases: "0"
        }),
        createMetric({
          productId: "40000000-0000-4000-8000-000000000099",
          spend: "999999",
          revenue: "999999",
          purchases: "1"
        })
      ],
      issues: [
        createIssue({
          id: "50000000-0000-4000-8000-000000000011",
          productId: visibleProductId,
          issueType: "performance",
          title: "Magas költés vásárlás nélkül"
        }),
        createIssue({
          id: "50000000-0000-4000-8000-000000000012",
          productId: hiddenProductId,
          issueType: "feed",
          title: "Rejtett termék issue"
        }),
        createIssue({
          id: "50000000-0000-4000-8000-000000000013",
          productId: dismissedProductId,
          issueType: "feed",
          title: "Lezárt issue",
          status: "dismissed"
        })
      ]
    });

    expect(content).toHaveLength(1);
    expect(content[0]?.name).toBe("Látható termék");
    expect(content[0]?.issue).toBe("high_spend_low_purchase");
    expect(JSON.stringify(content)).not.toContain("Rejtett termék");
    expect(JSON.stringify(content)).not.toContain("Lezárt issue termék");
    expect(JSON.stringify(content)).not.toContain("999999");
  });

  it("returns a safe empty state when no visible active product issues are available", () => {
    expect(createEmptyMerchantAttentionProducts()).toEqual([]);
    expect(
      createMerchantAttentionProducts({
        projectCurrencyCode: "HUF",
        products: [],
        metrics: [],
        issues: []
      })
    ).toEqual([]);
  });
});
