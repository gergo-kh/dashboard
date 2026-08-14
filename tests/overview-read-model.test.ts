import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { AccessibleProject, CurrentUser, UserProfile } from "@/lib/auth/session";
import {
  createOverviewRepository,
  type OverviewRepository
} from "@/lib/overview/repository";
import { getOverviewDataContext } from "@/lib/overview/service";

const authUser = {
  id: "agency-user",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-08-01T00:00:00Z"
} satisfies User;

const agencyProfile = {
  id: "agency-user",
  full_name: "Agency Admin",
  email: "agency@example.invalid",
  avatar_url: null,
  role: "agency_admin",
  client_id: null,
  is_active: true,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z"
} satisfies UserProfile;

const clientProfile = {
  ...agencyProfile,
  id: "client-user",
  full_name: "Client User",
  email: "client@example.invalid",
  role: "client_user",
  client_id: "client-1"
} satisfies UserProfile;

function createProject(input: {
  id: string;
  clientId: string;
  name: string;
  managerName: string | null;
}): AccessibleProject {
  return {
    id: input.id,
    client_id: input.clientId,
    name: input.name,
    slug: input.name.toLowerCase().replaceAll(" ", "-"),
    status: "active",
    country_code: "HU",
    market_label: "HU",
    currency_code: "HUF",
    timezone: "Europe/Budapest",
    roas_target: "4.2",
    report_day: 5,
    assigned_manager_profile_id: input.managerName ? "manager-1" : null,
    client: {
      id: input.clientId,
      name: input.clientId === "client-1" ? "Első ügyfél" : "Másik ügyfél",
      slug: input.clientId
    },
    assignedManager: input.managerName
      ? {
          id: "manager-1",
          full_name: input.managerName,
          email: "manager@example.invalid",
          avatar_url: null
        }
      : null
  };
}

const projects = [
  createProject({
    id: "project-1",
    clientId: "client-1",
    name: "Első projekt",
    managerName: "PPC Manager"
  }),
  createProject({
    id: "project-2",
    clientId: "client-2",
    name: "Másik projekt",
    managerName: null
  })
] satisfies AccessibleProject[];

function createCurrentUser(profile: UserProfile, scopedProjects = projects): CurrentUser {
  return {
    authUser,
    profile,
    projects: scopedProjects
  };
}

describe("overview read model foundation", () => {
  it("keeps agency admins scoped to every accessible project", async () => {
    const context = await getOverviewDataContext({
      currentUser: createCurrentUser(agencyProfile),
      repository: createOverviewRepository()
    });

    expect(context.projects.map((project) => project.id)).toEqual(["project-1", "project-2"]);
    expect(context.selectedProject?.id).toBe("project-1");
    expect(context.monthlyContent?.reports.history).toEqual([]);
  });

  it("keeps client users scoped to their own client projects", async () => {
    const context = await getOverviewDataContext({
      currentUser: createCurrentUser(clientProfile),
      repository: createOverviewRepository()
    });

    expect(context.projects.map((project) => project.id)).toEqual(["project-1"]);
    expect(context.selectedProject?.client_id).toBe("client-1");
  });

  it("selects a requested accessible project", async () => {
    const context = await getOverviewDataContext({
      currentUser: createCurrentUser(agencyProfile),
      requestedProjectId: "project-2",
      repository: createOverviewRepository()
    });

    expect(context.selectedProject?.id).toBe("project-2");
  });

  it("falls back safely when no projects are accessible", async () => {
    const context = await getOverviewDataContext({
      currentUser: createCurrentUser(clientProfile, []),
      repository: createOverviewRepository()
    });

    expect(context.projects).toEqual([]);
    expect(context.selectedProject).toBeNull();
    expect(context.monthlyContent?.monthlySummary.status).toBe("draft");
  });

  it("keeps repository selection inside the accessible project list", () => {
    const repository = createOverviewRepository();
    const accessibleProjects = repository.listAccessibleOverviewProjects({
      profile: clientProfile,
      projects
    });

    expect(
      repository.selectOverviewProject({
        projects: accessibleProjects,
        requestedProjectId: "project-2"
      })?.id
    ).toBe("project-1");
  });

  it("loads monthly overview rows for the selected accessible project", async () => {
    const requestedProjectIds: string[] = [];
    const metricProjectIds: string[] = [];
    const merchantProjectIds: string[] = [];
    const baseRepository = createOverviewRepository();
    const repository: OverviewRepository = {
      ...baseRepository,
      async getMonthlyOverviewContentRows(projectId) {
        requestedProjectIds.push(projectId);

        return {
          monthlyReview: {
            id: "review-1",
            period_start: "2026-07-01",
            period_end: "2026-07-31",
            summary_approved: "Jóváhagyott havi szöveg.",
            outcome_type: "positive",
            outcome_items: [
              {
                label: "ROAS",
                value: "+9%",
                state: "positive"
              }
            ],
            corrective_actions: [],
            next_month_plan: [],
            status: "approved",
            approved_at: "2026-08-02T08:15:00Z",
            updated_at: "2026-08-02T08:15:00Z",
            approved_by_profile: null
          },
          reports: [],
          optimizationItems: [],
          clientActionItems: []
        };
      },
      async getOverviewMetricsRows(project) {
        metricProjectIds.push(project.id);

        return {
          current: [],
          comparison: [],
          period: null,
          projectCurrencyCode: project.currency_code,
          roasTarget: project.roas_target
        };
      },
      async getMerchantAttentionRows(project) {
        merchantProjectIds.push(project.id);

        return {
          products: [],
          metrics: [],
          issues: [],
          projectCurrencyCode: project.currency_code
        };
      }
    };

    const context = await getOverviewDataContext({
      currentUser: createCurrentUser(agencyProfile),
      requestedProjectId: "project-2",
      repository
    });

    expect(requestedProjectIds).toEqual(["project-2"]);
    expect(metricProjectIds).toEqual(["project-2"]);
    expect(merchantProjectIds).toEqual(["project-2"]);
    expect(context.monthlyContent?.monthlySummary.text).toBe("Jóváhagyott havi szöveg.");
    expect(context.metricsContent?.performanceChart.state).toBe("empty");
    expect(context.merchantContent).toEqual([]);
  });

  it("returns safe monthly empty state when selected project content cannot load", async () => {
    const baseRepository = createOverviewRepository();
    const repository: OverviewRepository = {
      ...baseRepository,
      async getMonthlyOverviewContentRows() {
        throw new Error("Simulated repository failure");
      }
    };

    const context = await getOverviewDataContext({
      currentUser: createCurrentUser(agencyProfile),
      repository
    });

    expect(context.selectedProject?.id).toBe("project-1");
    expect(context.monthlyContent?.monthlySummary.status).toBe("draft");
    expect(context.monthlyContent?.currentWork).toEqual([]);
  });

  it("returns safe daily metric empty state when selected project metrics cannot load", async () => {
    const baseRepository = createOverviewRepository();
    const repository: OverviewRepository = {
      ...baseRepository,
      async getOverviewMetricsRows() {
        throw new Error("Simulated metrics failure");
      }
    };

    const context = await getOverviewDataContext({
      currentUser: createCurrentUser(agencyProfile),
      repository
    });

    expect(context.selectedProject?.id).toBe("project-1");
    expect(context.metricsContent?.performanceChart.state).toBe("empty");
    expect(context.metricsContent?.kpis.every((kpi) => kpi.currentValue === "nincs adat")).toBe(
      true
    );
  });

  it("returns safe merchant empty state when selected project products cannot load", async () => {
    const baseRepository = createOverviewRepository();
    const repository: OverviewRepository = {
      ...baseRepository,
      async getMerchantAttentionRows() {
        throw new Error("Simulated merchant repository failure");
      }
    };

    const context = await getOverviewDataContext({
      currentUser: createCurrentUser(agencyProfile),
      repository
    });

    expect(context.selectedProject?.id).toBe("project-1");
    expect(context.merchantContent).toEqual([]);
  });
});
