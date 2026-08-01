import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  filterAccessibleProjectsForProfile,
  resolveCurrentUser,
  type AccessibleProject,
  type UserProfile
} from "@/lib/auth/session";
import { getAuthRouteDecision } from "@/lib/supabase/middleware";
import { buildPasswordResetRedirectUrl } from "@/app/(auth)/reset-password/actions";

const authUser = {
  id: "user-1",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-08-01T00:00:00Z"
} satisfies User;

const agencyProfile = {
  id: "user-1",
  full_name: "Agency Admin",
  email: "agency-admin@example.invalid",
  role: "agency_admin",
  client_id: null,
  is_active: true,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z"
} satisfies UserProfile;

const clientProfile = {
  ...agencyProfile,
  id: "user-2",
  full_name: "Client User",
  email: "client-user@example.invalid",
  role: "client_user",
  client_id: "client-1"
} satisfies UserProfile;

const projects = [
  {
    id: "project-1",
    client_id: "client-1",
    name: "Eroll HU",
    slug: "eroll-hu",
    status: "active",
    client: { id: "client-1", name: "Eroll", slug: "eroll" }
  },
  {
    id: "project-2",
    client_id: "client-2",
    name: "Other HU",
    slug: "other-hu",
    status: "active",
    client: { id: "client-2", name: "Other", slug: "other" }
  }
] satisfies AccessibleProject[];

describe("auth route decisions", () => {
  it("redirects unauthenticated portal requests to login", () => {
    expect(
      getAuthRouteDecision({ pathname: "/", isAuthenticated: false })
    ).toEqual({ type: "redirect", destination: "/login" });
  });

  it("redirects authenticated users away from login", () => {
    expect(
      getAuthRouteDecision({ pathname: "/login", isAuthenticated: true })
    ).toEqual({ type: "redirect", destination: "/" });
  });
});

describe("current user resolution", () => {
  it("loads an agency_admin profile with all projects", () => {
    const result = resolveCurrentUser({
      authUser,
      profile: agencyProfile,
      projects
    });

    expect(result.status).toBe("authenticated");
    expect(result.status === "authenticated" ? result.user.projects : []).toHaveLength(2);
  });

  it("loads a client_user profile with scoped projects", () => {
    const result = resolveCurrentUser({
      authUser,
      profile: clientProfile,
      projects
    });

    expect(result.status).toBe("authenticated");
    expect(result.status === "authenticated" ? result.user.projects : []).toHaveLength(1);
  });

  it("rejects inactive profiles", () => {
    expect(
      resolveCurrentUser({
        authUser,
        profile: { ...clientProfile, is_active: false },
        projects
      })
    ).toEqual({ status: "rejected", reason: "inactive_profile" });
  });

  it("handles missing profile rows safely", () => {
    expect(resolveCurrentUser({ authUser, profile: null, projects })).toEqual({
      status: "rejected",
      reason: "missing_profile"
    });
  });

  it("scopes accessible projects for client users", () => {
    expect(filterAccessibleProjectsForProfile(clientProfile, projects)).toEqual([
      projects[0]
    ]);
  });
});

describe("session actions", () => {
  it("keeps login available after logout", () => {
    expect(getAuthRouteDecision({ pathname: "/login", isAuthenticated: false })).toEqual({
      type: "continue"
    });
  });

  it("builds the password reset recovery redirect", () => {
    expect(buildPasswordResetRedirectUrl("http://127.0.0.1:3000")).toBe(
      "http://127.0.0.1:3000/auth/callback?next=%2Fupdate-password"
    );
  });
});
