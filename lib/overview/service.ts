import "server-only";
import type { CurrentUser } from "@/lib/auth/session";
import { createOverviewRepository } from "@/lib/overview/repository";
import type { OverviewDataContext } from "@/types/overview";

export type GetOverviewDataContextInput = Readonly<{
  currentUser: CurrentUser;
  requestedProjectId?: string;
}>;

export function getOverviewDataContext({
  currentUser,
  requestedProjectId
}: GetOverviewDataContextInput): OverviewDataContext {
  const repository = createOverviewRepository();
  const projects = repository.listAccessibleOverviewProjects({
    profile: currentUser.profile,
    projects: currentUser.projects
  });
  const selectedProject = repository.selectOverviewProject({
    projects,
    requestedProjectId
  });

  return {
    profileName: currentUser.profile.full_name,
    role: currentUser.profile.role,
    projects,
    selectedProject
  };
}
