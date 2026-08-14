// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthlyReviewEditor } from "@/components/monthly-communication/monthly-review-editor";
import type { MonthlyReviewEditorActionState } from "@/app/(portal)/monthly-review-actions";
import { createMonthlyReviewEditorViewModel } from "@/lib/monthly-communication/editor-view-model";
import { monthlyReviewDraftFromFormData } from "@/lib/monthly-communication/form-data";
import { monthlyReviewDraftSchema } from "@/lib/monthly-communication/schemas";
import type { AccessibleProject, CurrentUser, UserProfile } from "@/lib/auth/session";
import type { User } from "@supabase/supabase-js";

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

const authUser = {
  id: agencyProfile.id,
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-08-01T00:00:00Z"
} satisfies User;

const project = {
  id: "90000000-0000-4000-8000-000000000011",
  client_id: "client-1",
  name: "Demó HU",
  slug: "demo-hu",
  status: "active",
  country_code: "HU",
  market_label: "HU",
  currency_code: "HUF",
  timezone: "Europe/Budapest",
  roas_target: "4.2",
  report_day: 5,
  assigned_manager_profile_id: agencyProfile.id,
  client: {
    id: "client-1",
    name: "Demó ügyfél",
    slug: "demo-client"
  },
  assignedManager: {
    id: agencyProfile.id,
    full_name: "Agency Admin",
    email: "agency@example.invalid",
    avatar_url: null
  }
} satisfies AccessibleProject;

function createCurrentUser(profile: UserProfile): CurrentUser {
  return {
    authUser: {
      ...authUser,
      id: profile.id
    },
    profile,
    projects: [project]
  };
}

function createEditor() {
  const editor = createMonthlyReviewEditorViewModel({
    currentUser: createCurrentUser(agencyProfile),
    selectedProject: project,
    now: new Date("2026-08-14T10:00:00Z")
  });

  if (!editor) {
    throw new Error("Expected agency editor view model.");
  }

  return editor;
}

const successAction = vi.fn(async () => ({
  status: "success",
  message: "Mentve.",
  fieldErrors: {}
}) satisfies MonthlyReviewEditorActionState);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("monthly review editor foundation", () => {
  it("creates an editor view model only for agency admins with a selected project", () => {
    const agencyEditor = createMonthlyReviewEditorViewModel({
      currentUser: createCurrentUser(agencyProfile),
      selectedProject: project,
      now: new Date("2026-08-14T10:00:00Z")
    });
    const clientEditor = createMonthlyReviewEditorViewModel({
      currentUser: createCurrentUser(clientProfile),
      selectedProject: project,
      now: new Date("2026-08-14T10:00:00Z")
    });

    expect(agencyEditor?.periodStart).toBe("2026-08-01");
    expect(agencyEditor?.periodEnd).toBe("2026-08-31");
    expect(clientEditor).toBeNull();
  });

  it("renders Hungarian fields, actions, and validation feedback", () => {
    render(createElement(MonthlyReviewEditor, {
      editor: createEditor(),
      saveAction: successAction,
      submitAction: successAction,
      initialState: {
        status: "error",
        message: "Ellenőrizd a kiemelt mezőket, és próbáld újra.",
        fieldErrors: {
          summaryDraft: "Az összefoglaló nem lehet üres.",
          outcomeItems: "Legalább egy havi eredményt adj meg.",
          nextMonthPlan: "Legalább egy következő havi tervet adj meg."
        }
      }
    }));

    expect(screen.getByRole("heading", { name: "Havi összefoglaló szerkesztése" })).toBeTruthy();
    expect(screen.getByLabelText("Összefoglaló vázlat")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Vázlat mentése" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jóváhagyásra küldés" })).toBeTruthy();
    expect(screen.getByText("Az összefoglaló nem lehet üres.")).toBeTruthy();
    expect(screen.getByText("Legalább egy havi eredményt adj meg.")).toBeTruthy();
    expect(screen.getByText("Legalább egy következő havi tervet adj meg.")).toBeTruthy();
  });

  it("uses distinct server actions for saving drafts and submitting for review", async () => {
    const user = userEvent.setup();
    const saveAction = vi.fn(successAction);
    const submitAction = vi.fn(successAction);
    render(createElement(MonthlyReviewEditor, {
      editor: createEditor(),
      saveAction,
      submitAction
    }));

    await user.type(screen.getByLabelText("Összefoglaló vázlat"), "Rövid havi összefoglaló.");
    await user.click(screen.getByRole("button", { name: "Vázlat mentése" }));
    await user.click(screen.getByRole("button", { name: "Jóváhagyásra küldés" }));

    expect(saveAction).toHaveBeenCalledTimes(1);
    expect(submitAction).toHaveBeenCalledTimes(1);
  });

  it("parses filled form rows and leaves validation to the shared Zod schema", () => {
    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("periodStart", "2026-08-01");
    formData.set("periodEnd", "2026-08-31");
    formData.set("summaryDraft", "A hónap rövid összefoglalója.");
    formData.set("outcomeType", "focus");
    formData.set("outcomeItems.0.label", "ROAS");
    formData.set("outcomeItems.0.value", "+8%");
    formData.set("outcomeItems.0.state", "negative");
    formData.set("outcomeItems.0.explanation", "A margin mix átmenetileg romlott.");
    formData.set("correctiveActions.0", "Kategória szintű licitkorrekció indul.");
    formData.set("nextMonthPlan.0.title", "Shopping fókusz");
    formData.set("nextMonthPlan.0.detail", "A fő termékkategóriák priorizálása.");

    const parsed = monthlyReviewDraftSchema.parse(monthlyReviewDraftFromFormData(formData));

    expect(parsed.outcomeType).toBe("focus");
    expect(parsed.outcomeItems).toHaveLength(1);
    expect(parsed.correctiveActions).toEqual(["Kategória szintű licitkorrekció indul."]);
    expect(parsed.nextMonthPlan).toEqual([
      {
        title: "Shopping fókusz",
        detail: "A fő termékkategóriák priorizálása."
      }
    ]);
  });
});
