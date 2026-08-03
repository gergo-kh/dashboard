import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, ProfileRole } from "@/types/database";

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

export type AccessibleProject = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  | "id"
  | "client_id"
  | "name"
  | "slug"
  | "status"
  | "country_code"
  | "market_label"
  | "currency_code"
  | "roas_target"
  | "report_day"
  | "assigned_manager_profile_id"
> & {
  client: {
    id: string;
    name: string;
    slug: string;
  } | null;
  assignedManager: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
};

export type CurrentUser = {
  authUser: User;
  profile: UserProfile;
  projects: AccessibleProject[];
};

export type CurrentUserFailureReason =
  | "unauthenticated"
  | "missing_profile"
  | "inactive_profile"
  | "unsupported_role";

export type CurrentUserResult =
  | { status: "authenticated"; user: CurrentUser }
  | { status: "rejected"; reason: CurrentUserFailureReason };

export type ProjectScopeRow = AccessibleProject;

export function isSupportedRole(role: string): role is ProfileRole {
  return role === "agency_admin" || role === "client_user";
}

export function filterAccessibleProjectsForProfile(
  profile: Pick<UserProfile, "role" | "client_id">,
  projects: ProjectScopeRow[]
): ProjectScopeRow[] {
  if (profile.role === "agency_admin") {
    return projects;
  }

  if (profile.role === "client_user" && profile.client_id) {
    return projects.filter((project) => project.client_id === profile.client_id);
  }

  return [];
}

type ResolveCurrentUserInput = {
  authUser: User | null;
  profile: UserProfile | null;
  projects: AccessibleProject[];
};

export function resolveCurrentUser({
  authUser,
  profile,
  projects
}: ResolveCurrentUserInput): CurrentUserResult {
  if (!authUser) {
    return { status: "rejected", reason: "unauthenticated" };
  }

  if (!profile) {
    return { status: "rejected", reason: "missing_profile" };
  }

  if (!profile.is_active) {
    return { status: "rejected", reason: "inactive_profile" };
  }

  if (!isSupportedRole(profile.role)) {
    return { status: "rejected", reason: "unsupported_role" };
  }

  return {
    status: "authenticated",
    user: {
      authUser,
      profile,
      projects: filterAccessibleProjectsForProfile(profile, projects)
    }
  };
}

type ProjectQueryRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  | "id"
  | "client_id"
  | "name"
  | "slug"
  | "status"
  | "country_code"
  | "market_label"
  | "currency_code"
  | "roas_target"
  | "report_day"
  | "assigned_manager_profile_id"
> & {
  clients: {
    id: string;
    name: string;
    slug: string;
  } | null;
  assigned_manager: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
};

function toAccessibleProject(project: ProjectQueryRow): AccessibleProject {
  return {
    id: project.id,
    client_id: project.client_id,
    name: project.name,
    slug: project.slug,
    status: project.status,
    country_code: project.country_code,
    market_label: project.market_label,
    currency_code: project.currency_code,
    roas_target: project.roas_target,
    report_day: project.report_day,
    assigned_manager_profile_id: project.assigned_manager_profile_id,
    client: project.clients,
    assignedManager: project.assigned_manager
  };
}

export async function getAccessibleProjects(profile: UserProfile) {
  const supabase = await createServerSupabaseClient();
  const projectQuery = supabase
    .from("projects")
    .select(
      "id, client_id, name, slug, status, country_code, market_label, currency_code, roas_target, report_day, assigned_manager_profile_id, clients(id, name, slug), assigned_manager:profiles!projects_assigned_manager_profile_id_fkey(id, full_name, email, avatar_url)"
    );

  const scopedQuery = (() => {
    if (profile.role !== "client_user") {
      return projectQuery;
    }

    if (!profile.client_id) {
      return null;
    }

    return projectQuery.eq("client_id", profile.client_id);
  })();

  if (!scopedQuery) {
    return [];
  }

  const { data, error } = await scopedQuery
    .order("name", { ascending: true })
    .returns<ProjectQueryRow[]>();

  if (error) {
    throw new Error("Could not load accessible projects.");
  }

  return data.map(toAccessibleProject);
}

export async function getCurrentUser(): Promise<CurrentUserResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { status: "rejected", reason: "unauthenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("Could not load the authenticated profile.");
  }

  const baseResult = resolveCurrentUser({
    authUser,
    profile,
    projects: []
  });

  if (baseResult.status === "rejected") {
    return baseResult;
  }

  return {
    status: "authenticated",
    user: {
      ...baseResult.user,
      projects: await getAccessibleProjects(baseResult.user.profile)
    }
  };
}

export async function requireCurrentUser() {
  const result = await getCurrentUser();

  if (result.status === "authenticated") {
    return result.user;
  }

  if (result.reason === "unauthenticated") {
    redirect("/login");
  }

  redirect(`/login?auth=${result.reason}`);
}
