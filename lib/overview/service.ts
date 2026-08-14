import "server-only";
import type { CurrentUser } from "@/lib/auth/session";
import {
  createEmptyMonthlyOverviewContent,
  createMonthlyOverviewContent
} from "@/lib/overview/monthly-content";
import {
  createOverviewRepository,
  type OverviewRepository
} from "@/lib/overview/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OverviewDataContext } from "@/types/overview";

export type GetOverviewDataContextInput = Readonly<{
  currentUser: CurrentUser;
  requestedProjectId?: string;
  repository?: OverviewRepository;
}>;

export async function getOverviewDataContext({
  currentUser,
  requestedProjectId,
  repository: providedRepository
}: GetOverviewDataContextInput): Promise<OverviewDataContext> {
  const repository = providedRepository ?? await createServerOverviewRepository();
  const projects = repository.listAccessibleOverviewProjects({
    profile: currentUser.profile,
    projects: currentUser.projects
  });
  const selectedProject = repository.selectOverviewProject({
    projects,
    requestedProjectId
  });
  const monthlyContent = selectedProject
    ? await repository
        .getMonthlyOverviewContentRows(selectedProject.id)
        .then((rows) => createMonthlyOverviewContent(rows))
        .catch(() => createEmptyMonthlyOverviewContent())
    : createEmptyMonthlyOverviewContent();

  return {
    profileName: currentUser.profile.full_name,
    role: currentUser.profile.role,
    projects,
    selectedProject,
    monthlyContent
  };
}

async function createServerOverviewRepository() {
  const supabase = await createServerSupabaseClient();

  return createOverviewRepository(supabase);
}
