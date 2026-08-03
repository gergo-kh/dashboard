import "server-only";
import type {
  AccessibleProject,
  ProjectScopeRow,
  UserProfile
} from "@/lib/auth/session";
import { filterAccessibleProjectsForProfile } from "@/lib/auth/session";

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
};

export function createOverviewRepository(): OverviewRepository {
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
    }
  };
}
