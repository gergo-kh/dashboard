import "server-only";
import type {
  AccessibleProject,
  ProjectScopeRow,
  UserProfile
} from "@/lib/auth/session";
import { filterAccessibleProjectsForProfile } from "@/lib/auth/session";
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
    }
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
