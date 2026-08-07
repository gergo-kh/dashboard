import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PpcProvider = "google_ads" | "meta_ads" | "tiktok_ads";
export type PpcStatus = "green" | "yellow" | "red";

export type PpcDashboardRow = {
  project_id: string;
  client_id: string;
  client_name: string;
  project_name: string;
  provider: PpcProvider;
  external_account_id: string;
  currency_code: string;
  monthly_budget: number | null;
  target_roas: number | null;
  minimum_roas: number | null;
  target_cpa: number | null;
  maximum_cpa: number | null;
  spend: number;
  revenue: number;
  purchases: number;
  roas: number | null;
  cpa: number | null;
  prev_spend: number;
  prev_revenue: number;
  prev_roas: number | null;
  prev_cpa: number | null;
  spend_change_pct: number | null;
  revenue_change_pct: number | null;
  roas_change_pct: number | null;
  cpa_change_pct: number | null;
  mtd_spend: number;
  mtd_revenue: number;
  mtd_roas: number | null;
  mtd_cpa: number | null;
  prev_mtd_spend: number;
  prev_mtd_revenue: number;
  prev_mtd_roas: number | null;
  prev_mtd_cpa: number | null;
  mtd_spend_change_pct: number | null;
  mtd_revenue_change_pct: number | null;
  mtd_roas_change_pct: number | null;
  mtd_cpa_change_pct: number | null;
  status_7d: PpcStatus;
  status_14d: PpcStatus;
  status_30d: PpcStatus;
  overall_status: PpcStatus;
};

type PpcDatabase = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      ppc_dashboard_overview: {
        Args: {
          p_days?: number;
          p_provider?: string | null;
          p_as_of?: string;
        };
        Returns: PpcDashboardRow[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type PpcClientRow = {
  clientId: string;
  clientName: string;
  providers: PpcProvider[];
  spend: number;
  revenue: number;
  purchases: number;
  roas: number | null;
  cpa: number | null;
  spendChangePct: number | null;
  revenueChangePct: number | null;
  roasChangePct: number | null;
  cpaChangePct: number | null;
  mtdSpend: number;
  mtdRevenue: number;
  mtdRoas: number | null;
  mtdCpa: number | null;
  mtdSpendChangePct: number | null;
  mtdRevenueChangePct: number | null;
  mtdRoasChangePct: number | null;
  mtdCpaChangePct: number | null;
  status7d: PpcStatus;
  status14d: PpcStatus;
  status30d: PpcStatus;
  overallStatus: PpcStatus;
};

export type PpcDashboardData = {
  rows: PpcClientRow[];
  totalSpend: number;
  totalRevenue: number;
  totalPurchases: number;
  totalRoas: number | null;
  totalCpa: number | null;
  clientCount: number;
  statusCounts: Record<PpcStatus, number>;
  hasMetrics: boolean;
};

const statusRank: Record<PpcStatus, number> = {
  green: 1,
  yellow: 2,
  red: 3
};

function worstStatus(values: PpcStatus[]): PpcStatus {
  return values.reduce<PpcStatus>(
    (worst, current) => (statusRank[current] > statusRank[worst] ? current : worst),
    "green"
  );
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function groupRows(rows: PpcDashboardRow[]): PpcClientRow[] {
  const grouped = new Map<string, PpcDashboardRow[]>();

  for (const row of rows) {
    const existing = grouped.get(row.client_id) ?? [];
    existing.push(row);
    grouped.set(row.client_id, existing);
  }

  return [...grouped.values()]
    .map((clientRows) => {
      const first = clientRows[0];
      if (!first) {
        throw new Error("PPC dashboard grouping produced an empty client group.");
      }

      const spend = clientRows.reduce((sum, row) => sum + Number(row.spend), 0);
      const revenue = clientRows.reduce((sum, row) => sum + Number(row.revenue), 0);
      const purchases = clientRows.reduce((sum, row) => sum + Number(row.purchases), 0);
      const prevSpend = clientRows.reduce((sum, row) => sum + Number(row.prev_spend), 0);
      const prevRevenue = clientRows.reduce((sum, row) => sum + Number(row.prev_revenue), 0);
      const prevPurchases = clientRows.reduce(
        (sum, row) => sum + (row.prev_cpa && row.prev_cpa > 0 ? Number(row.prev_spend) / Number(row.prev_cpa) : 0),
        0
      );
      const mtdSpend = clientRows.reduce((sum, row) => sum + Number(row.mtd_spend), 0);
      const mtdRevenue = clientRows.reduce((sum, row) => sum + Number(row.mtd_revenue), 0);
      const mtdPurchases = clientRows.reduce(
        (sum, row) => sum + (row.mtd_cpa && row.mtd_cpa > 0 ? Number(row.mtd_spend) / Number(row.mtd_cpa) : 0),
        0
      );
      const prevMtdSpend = clientRows.reduce((sum, row) => sum + Number(row.prev_mtd_spend), 0);
      const prevMtdRevenue = clientRows.reduce((sum, row) => sum + Number(row.prev_mtd_revenue), 0);
      const prevMtdPurchases = clientRows.reduce(
        (sum, row) =>
          sum + (row.prev_mtd_cpa && row.prev_mtd_cpa > 0 ? Number(row.prev_mtd_spend) / Number(row.prev_mtd_cpa) : 0),
        0
      );

      const roas = spend > 0 ? revenue / spend : null;
      const cpa = purchases > 0 ? spend / purchases : null;
      const prevRoas = prevSpend > 0 ? prevRevenue / prevSpend : null;
      const prevCpa = prevPurchases > 0 ? prevSpend / prevPurchases : null;
      const mtdRoas = mtdSpend > 0 ? mtdRevenue / mtdSpend : null;
      const mtdCpa = mtdPurchases > 0 ? mtdSpend / mtdPurchases : null;
      const prevMtdRoas = prevMtdSpend > 0 ? prevMtdRevenue / prevMtdSpend : null;
      const prevMtdCpa = prevMtdPurchases > 0 ? prevMtdSpend / prevMtdPurchases : null;

      return {
        clientId: first.client_id,
        clientName: first.client_name,
        providers: [...new Set(clientRows.map((row) => row.provider))],
        spend,
        revenue,
        purchases,
        roas,
        cpa,
        spendChangePct: percentChange(spend, prevSpend),
        revenueChangePct: percentChange(revenue, prevRevenue),
        roasChangePct: roas !== null && prevRoas !== null ? percentChange(roas, prevRoas) : null,
        cpaChangePct: cpa !== null && prevCpa !== null ? percentChange(cpa, prevCpa) : null,
        mtdSpend,
        mtdRevenue,
        mtdRoas,
        mtdCpa,
        mtdSpendChangePct: percentChange(mtdSpend, prevMtdSpend),
        mtdRevenueChangePct: percentChange(mtdRevenue, prevMtdRevenue),
        mtdRoasChangePct:
          mtdRoas !== null && prevMtdRoas !== null ? percentChange(mtdRoas, prevMtdRoas) : null,
        mtdCpaChangePct:
          mtdCpa !== null && prevMtdCpa !== null ? percentChange(mtdCpa, prevMtdCpa) : null,
        status7d: worstStatus(clientRows.map((row) => row.status_7d)),
        status14d: worstStatus(clientRows.map((row) => row.status_14d)),
        status30d: worstStatus(clientRows.map((row) => row.status_30d)),
        overallStatus: worstStatus(clientRows.map((row) => row.overall_status))
      } satisfies PpcClientRow;
    })
    .sort((a, b) => {
      const statusDifference = statusRank[b.overallStatus] - statusRank[a.overallStatus];
      return statusDifference !== 0 ? statusDifference : a.clientName.localeCompare(b.clientName, "hu");
    });
}

export async function getPpcDashboardData(input: {
  days: 7 | 14 | 30;
  provider: PpcProvider | null;
  asOf?: string;
}): Promise<PpcDashboardData> {
  const supabase = await createServerSupabaseClient();
  const rpcClient = supabase as unknown as SupabaseClient<PpcDatabase>;
  const { data, error } = await rpcClient.rpc("ppc_dashboard_overview", {
    p_days: input.days,
    p_provider: input.provider,
    ...(input.asOf ? { p_as_of: input.asOf } : {})
  });

  if (error) {
    throw new Error("A PPC dashboard adatai nem tölthetők be.");
  }

  const rows = groupRows(data ?? []);
  const totalSpend = rows.reduce((sum, row) => sum + row.spend, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalPurchases = rows.reduce((sum, row) => sum + row.purchases, 0);

  return {
    rows,
    totalSpend,
    totalRevenue,
    totalPurchases,
    totalRoas: totalSpend > 0 ? totalRevenue / totalSpend : null,
    totalCpa: totalPurchases > 0 ? totalSpend / totalPurchases : null,
    clientCount: rows.length,
    statusCounts: {
      green: rows.filter((row) => row.overallStatus === "green").length,
      yellow: rows.filter((row) => row.overallStatus === "yellow").length,
      red: rows.filter((row) => row.overallStatus === "red").length
    },
    hasMetrics: rows.some((row) => row.spend > 0 || row.revenue > 0 || row.purchases > 0)
  };
}
