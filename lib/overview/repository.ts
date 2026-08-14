import "server-only";
import type {
  AccessibleProject,
  ProjectScopeRow,
  UserProfile
} from "@/lib/auth/session";
import { filterAccessibleProjectsForProfile } from "@/lib/auth/session";
import {
  createMetricPeriods,
  type DailyMetricContentRow,
  type OverviewMetricsRows
} from "@/lib/overview/daily-metrics";
import type {
  ClientActionContentRow,
  MonthlyOverviewContentRows,
  MonthlyReviewContentRow,
  OptimizationContentRow,
  ReportContentRow
} from "@/lib/overview/monthly-content";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type OverviewProjectContext = AccessibleProject;

export type OverviewRepository = {
  listAccessibleOverviewProjects(input: {
    profile: Pick<UserProfile, "role" | "client_id">;
    projects: ProjectScopeRow[];
  }): OverviewProjectContext[];
  selectOverviewProject(input: {
    projects: OverviewProjectContext[];
    requestedProjectId?: string;
  }): OverviewProjectContext | null;
  getMonthlyOverviewContentRows(projectId: string): Promise<MonthlyOverviewContentRows>;
  getOverviewMetricsRows(project: OverviewProjectContext): Promise<OverviewMetricsRows>;
};

export function createOverviewRepository(
  supabase?: SupabaseClient<Database>
): OverviewRepository {
  return {
    listAccessibleOverviewProjects({ profile, projects }) {
      return filterAccessibleProjectsForProfile(profile, projects);
    },

    selectOverviewProject({ projects, requestedProjectId }) {
      if (projects.length === 0) {
        return null;
      }

      if (!requestedProjectId) {
        return projects[0] ?? null;
      }

      return projects.find((project) => project.id === requestedProjectId) ?? projects[0] ?? null;
    },

    async getMonthlyOverviewContentRows(projectId) {
      if (!supabase) {
        return {
          monthlyReview: null,
          reports: [],
          optimizationItems: [],
          clientActionItems: []
        };
      }

      return getMonthlyOverviewContentRows(supabase, projectId);
    },

    async getOverviewMetricsRows(project) {
      if (!supabase) {
        return createEmptyOverviewMetricsRows(project);
      }

      return getOverviewMetricsRows(supabase, project);
    }
  };
}

function createEmptyOverviewMetricsRows(project: OverviewProjectContext): OverviewMetricsRows {
  return {
    current: [],
    comparison: [],
    period: null,
    projectCurrencyCode: project.currency_code,
    roasTarget: project.roas_target
  };
}

async function getMonthlyOverviewContentRows(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<MonthlyOverviewContentRows> {
  const [monthlyReview, reports, optimizationItems, clientActionItems] = await Promise.all([
    getLatestMonthlyReview(supabase, projectId),
    getReports(supabase, projectId),
    getOptimizationItems(supabase, projectId),
    getClientActionItems(supabase, projectId)
  ]);

  return {
    monthlyReview,
    reports,
    optimizationItems,
    clientActionItems
  };
}

async function getLatestMonthlyReview(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<MonthlyReviewContentRow | null> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .select(
      "id, period_start, period_end, summary_approved, outcome_type, outcome_items, corrective_actions, next_month_plan, status, approved_at, updated_at, approved_by_profile:profiles!monthly_reviews_approved_by_fkey(full_name)"
    )
    .eq("project_id", projectId)
    .in("status", ["approved", "published"])
    .not("summary_approved", "is", null)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<MonthlyReviewContentRow | null>();

  if (error) {
    throw new Error("Could not load monthly overview review content.");
  }

  return data;
}

async function getReports(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<ReportContentRow[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, period_start, period_end, status, generated_at, published_at, created_at")
    .eq("project_id", projectId)
    .in("status", ["approved", "generated", "published"])
    .order("period_start", { ascending: false })
    .limit(4)
    .returns<ReportContentRow[]>();

  if (error) {
    throw new Error("Could not load monthly overview reports.");
  }

  return data;
}

async function getOptimizationItems(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<OptimizationContentRow[]> {
  const { data, error } = await supabase
    .from("optimization_items")
    .select("id, title, description, category, status, started_at, completed_at, created_at")
    .eq("project_id", projectId)
    .filter("is_client_visible", "eq", "true")
    .filter("approval_status", "eq", "approved")
    .in("status", ["planned", "in_progress", "completed"])
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(18)
    .returns<OptimizationContentRow[]>();

  if (error) {
    throw new Error("Could not load monthly overview optimization items.");
  }

  return data;
}

async function getClientActionItems(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<ClientActionContentRow[]> {
  const { data, error } = await supabase
    .from("client_action_items")
    .select("id, title, description, priority, status, affected_count")
    .eq("project_id", projectId)
    .in("status", ["open", "in_progress", "resolved", "dismissed"])
    .order("created_at", { ascending: false })
    .limit(12)
    .returns<ClientActionContentRow[]>();

  if (error) {
    throw new Error("Could not load monthly overview client action items.");
  }

  return data;
}

async function getOverviewMetricsRows(
  supabase: SupabaseClient<Database>,
  project: OverviewProjectContext
): Promise<OverviewMetricsRows> {
  const latestDate = await getLatestDailyMetricDate(supabase, project.id);

  if (!latestDate) {
    return createEmptyOverviewMetricsRows(project);
  }

  const period = createMetricPeriods(latestDate);
  const rows = await getDailyMetricRows(supabase, project.id, period.comparisonStart, period.currentEnd);

  return {
    current: rows.filter((row) => row.metric_date >= period.currentStart),
    comparison: rows.filter(
      (row) => row.metric_date >= period.comparisonStart && row.metric_date <= period.comparisonEnd
    ),
    period,
    projectCurrencyCode: project.currency_code,
    roasTarget: project.roas_target
  };
}

async function getLatestDailyMetricDate(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("daily_metrics")
    .select("metric_date")
    .eq("project_id", projectId)
    .order("metric_date", { ascending: false })
    .limit(1)
    .returns<Array<{ metric_date: string }>>();

  if (error) {
    throw new Error("Could not load latest daily metric date.");
  }

  return data[0]?.metric_date ?? null;
}

async function getDailyMetricRows(
  supabase: SupabaseClient<Database>,
  projectId: string,
  startDate: string,
  endDate: string
): Promise<DailyMetricContentRow[]> {
  const { data, error } = await supabase
    .from("daily_metrics")
    .select(
      "metric_date, provider, spend, revenue, purchases, platform_conversion_value, platform_conversions, currency_code, updated_at"
    )
    .eq("project_id", projectId)
    .gte("metric_date", startDate)
    .lte("metric_date", endDate)
    .order("metric_date", { ascending: true })
    .returns<DailyMetricContentRow[]>();

  if (error) {
    throw new Error("Could not load daily metric rows.");
  }

  return data;
}
