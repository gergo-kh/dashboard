import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { AccessibleProject, CurrentUser, UserProfile } from "@/lib/auth/session";
import { createOverviewRepository } from "@/lib/overview/repository";
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
  it("keeps agency admins scoped to every accessible project", () => {
    const context = getOverviewDataContext({
      currentUser: createCurrentUser(agencyProfile)
    });

    expect(context.projects.map((project) => project.id)).toEqual(["project-1", "project-2"]);
    expect(context.selectedProject?.id).toBe("project-1");
  });

  it("keeps client users scoped to their own client projects", () => {
    const context = getOverviewDataContext({
      currentUser: createCurrentUser(clientProfile)
    });

    expect(context.projects.map((project) => project.id)).toEqual(["project-1"]);
    expect(context.selectedProject?.client_id).toBe("client-1");
  });

  it("selects a requested accessible project", () => {
    const context = getOverviewDataContext({
      currentUser: createCurrentUser(agencyProfile),
      requestedProjectId: "project-2"
    });

    expect(context.selectedProject?.id).toBe("project-2");
  });

  it("falls back safely when no projects are accessible", () => {
    const context = getOverviewDataContext({
      currentUser: createCurrentUser(clientProfile, [])
    });

    expect(context.projects).toEqual([]);
    expect(context.selectedProject).toBeNull();
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
});
