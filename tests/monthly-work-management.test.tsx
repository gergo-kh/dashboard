// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthlyWorkManagement } from "@/components/monthly-communication/monthly-work-management";
import type { MonthlyReviewEditorActionState } from "@/app/(portal)/monthly-review-actions";
import type { AccessibleProject, CurrentUser, UserProfile } from "@/lib/auth/session";
import {
  clientActionItemInputSchema,
  optimizationItemInputSchema
} from "@/lib/monthly-communication/work-management-schemas";
import {
  createMonthlyWorkManagementViewModel,
  getMonthlyWorkManagementViewModel
} from "@/lib/monthly-communication/work-management-view-model";
import {
  saveClientActionItem,
  saveOptimizationItem
} from "@/lib/monthly-communication/work-management";
import type {
  ClientActionItemRecord,
  ClientActionItemWrite,
  MonthlyWorkManagementRepository,
  OptimizationItemRecord,
  OptimizationItemWrite
} from "@/lib/monthly-communication/work-management-types";
import { MonthlyCommunicationError } from "@/lib/monthly-communication/types";
import type { User } from "@supabase/supabase-js";

const agencyProfile = {
  id: "219ab6cd-06b4-423c-a560-af2c05198f0f",
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
  id: "1e0957db-1b2b-4803-888e-c3e6d5b26d3c",
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

const optimizationItem = {
  id: "10000000-0000-4000-8000-000000000001",
  project_id: project.id,
  category: "google_ads",
  title: "Kampánystruktúra finomítása",
  description: "A fő termékcsoportok külön költségkeretet kaptak.",
  status: "in_progress",
  source: "manual",
  source_reference: null,
  source_timestamp: null,
  started_at: "2026-08-05T12:00:00.000Z",
  completed_at: null,
  is_client_visible: true,
  approval_status: "approved",
  created_at: "2026-08-05T08:00:00.000Z",
  updated_at: "2026-08-06T08:00:00.000Z"
} satisfies OptimizationItemRecord;

const clientActionItem = {
  id: "20000000-0000-4000-8000-000000000001",
  project_id: project.id,
  source: "manual",
  category: "merchant_center",
  title: "Termékképek frissítése",
  description: "A kiemelt termékeknél egységes képarány szükséges.",
  priority: "urgent",
  affected_count: 12,
  external_url: null,
  status: "open",
  due_date: "2026-08-20",
  created_at: "2026-08-05T08:00:00.000Z",
  updated_at: "2026-08-06T08:00:00.000Z",
  resolved_at: null
} satisfies ClientActionItemRecord;

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

function createRepository() {
  const state = {
    optimizationWrites: [] as OptimizationItemWrite[],
    clientActionWrites: [] as ClientActionItemWrite[]
  };

  const repository: MonthlyWorkManagementRepository = {
    async listOptimizationItems() {
      return [optimizationItem];
    },
    async listClientActionItems() {
      return [clientActionItem];
    },
    async upsertOptimizationItem(input) {
      state.optimizationWrites.push(input);

      return {
        ...optimizationItem,
        ...input,
        id: input.id ?? optimizationItem.id,
        source_reference: null,
        source_timestamp: null,
        created_at: optimizationItem.created_at,
        updated_at: "2026-08-14T12:00:00.000Z"
      };
    },
    async upsertClientActionItem(input) {
      state.clientActionWrites.push(input);

      return {
        ...clientActionItem,
        ...input,
        id: input.id ?? clientActionItem.id,
        external_url: null,
        created_at: clientActionItem.created_at,
        updated_at: "2026-08-14T12:00:00.000Z"
      };
    }
  };

  return {
    repository,
    state
  };
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

describe("monthly work management service", () => {
  it("allows agency admins to save approved visible optimization items", async () => {
    const { repository, state } = createRepository();

    await saveOptimizationItem({
      currentUser: createCurrentUser(agencyProfile),
      repository,
      item: {
        projectId: project.id,
        category: "google_ads",
        title: "Keresési kampány tisztítása",
        description: "A nem releváns keresések kizárása megtörtént.",
        status: "completed",
        approvalStatus: "approved",
        isClientVisible: true,
        startedDate: "2026-08-01",
        completedDate: "",
        itemId: ""
      },
      now: () => new Date("2026-08-14T10:00:00.000Z")
    });

    expect(state.optimizationWrites).toHaveLength(1);
    expect(state.optimizationWrites[0]?.approval_status).toBe("approved");
    expect(state.optimizationWrites[0]?.is_client_visible).toBe(true);
    expect(state.optimizationWrites[0]?.completed_at).toBe("2026-08-14T10:00:00.000Z");
  });

  it("keeps draft optimization items hidden from clients", async () => {
    const { repository, state } = createRepository();

    await saveOptimizationItem({
      currentUser: createCurrentUser(agencyProfile),
      repository,
      item: {
        projectId: project.id,
        category: "measurement",
        title: "Mérési terv előkészítése",
        description: "",
        status: "planned",
        approvalStatus: "draft",
        isClientVisible: false,
        startedDate: "",
        completedDate: "",
        itemId: ""
      }
    });

    expect(state.optimizationWrites[0]?.approval_status).toBe("draft");
    expect(state.optimizationWrites[0]?.is_client_visible).toBe(false);
  });

  it("uses the existing client action status workflow for visibility", async () => {
    const { repository, state } = createRepository();

    await saveClientActionItem({
      currentUser: createCurrentUser(agencyProfile),
      repository,
      item: {
        projectId: project.id,
        category: "merchant_center",
        title: "Feed címek ellenőrzése",
        description: "A rövid címeket bővíteni kell.",
        priority: "recommended",
        affectedCount: "9",
        visibility: "hidden",
        status: "open",
        dueDate: "2026-08-21",
        resolvedDate: "",
        itemId: ""
      }
    });

    expect(state.clientActionWrites[0]?.status).toBe("hidden");
    expect(state.clientActionWrites[0]?.due_date).toBe("2026-08-21");
    expect(state.clientActionWrites[0]?.resolved_at).toBeNull();
  });

  it("sets resolved_at when a visible client action is resolved", async () => {
    const { repository, state } = createRepository();

    await saveClientActionItem({
      currentUser: createCurrentUser(agencyProfile),
      repository,
      item: {
        projectId: project.id,
        category: "merchant_center",
        title: "GTIN javítás visszaellenőrzése",
        description: "",
        priority: "urgent",
        affectedCount: "",
        visibility: "visible",
        status: "resolved",
        dueDate: "",
        resolvedDate: "",
        itemId: ""
      },
      now: () => new Date("2026-08-14T10:00:00.000Z")
    });

    expect(state.clientActionWrites[0]?.status).toBe("resolved");
    expect(state.clientActionWrites[0]?.resolved_at).toBe("2026-08-14T10:00:00.000Z");
  });

  it("rejects client users before mutating work content", async () => {
    const { repository, state } = createRepository();

    await expect(
      saveOptimizationItem({
        currentUser: createCurrentUser(clientProfile),
        repository,
        item: {
          projectId: project.id,
          category: "google_ads",
          title: "Nem engedélyezett módosítás",
          description: "",
          status: "planned",
          approvalStatus: "draft",
          isClientVisible: false,
          startedDate: "",
          completedDate: "",
          itemId: ""
        }
      })
    ).rejects.toBeInstanceOf(MonthlyCommunicationError);

    expect(state.optimizationWrites).toHaveLength(0);
  });

  it("validates visibility and date input before persistence", () => {
    expect(
      optimizationItemInputSchema.safeParse({
        projectId: project.id,
        category: "google_ads",
        title: "Látható vázlat",
        description: "",
        status: "planned",
        approvalStatus: "draft",
        isClientVisible: true,
        startedDate: "",
        completedDate: "",
        itemId: ""
      }).success
    ).toBe(false);

    expect(
      clientActionItemInputSchema.safeParse({
        projectId: project.id,
        category: "merchant_center",
        title: "Hibás dátum",
        description: "",
        priority: "urgent",
        affectedCount: "",
        visibility: "visible",
        status: "open",
        dueDate: "2026-99-99",
        resolvedDate: "",
        itemId: ""
      }).success
    ).toBe(false);
  });
});

describe("monthly work management view model and UI", () => {
  it("returns null for client users", async () => {
    const { repository } = createRepository();

    await expect(
      getMonthlyWorkManagementViewModel({
        currentUser: createCurrentUser(clientProfile),
        selectedProject: project,
        repository
      })
    ).resolves.toBeNull();
  });

  it("creates an error state when agency work content cannot load", async () => {
    const repository: MonthlyWorkManagementRepository = {
      async listOptimizationItems() {
        throw new Error("Nope");
      },
      async listClientActionItems() {
        return [];
      },
      async upsertOptimizationItem() {
        return optimizationItem;
      },
      async upsertClientActionItem() {
        return clientActionItem;
      }
    };

    const viewModel = await getMonthlyWorkManagementViewModel({
      currentUser: createCurrentUser(agencyProfile),
      selectedProject: project,
      repository
    });

    expect(viewModel?.state).toBe("error");
    expect(viewModel?.description).toContain("nem érhető el");
  });

  it("renders Hungarian management UI for optimization and client action records", () => {
    const management = createMonthlyWorkManagementViewModel({
      selectedProject: project,
      optimizationItems: [optimizationItem],
      clientActionItems: [clientActionItem],
      state: "ready"
    });

    render(createElement(MonthlyWorkManagement, {
      management,
      saveOptimizationAction: successAction,
      saveClientActionAction: successAction
    }));

    expect(screen.getByRole("heading", { name: "Havi munka kezelése" })).toBeTruthy();
    expect(screen.getByText("Kampánystruktúra finomítása")).toBeTruthy();
    expect(screen.getByText("Termékképek frissítése")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Optimalizálás létrehozása" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ügyfélteendő létrehozása" })).toBeTruthy();
    expect(screen.getByLabelText("Kezelt projekt")).toBeTruthy();
  });

  it("renders empty state copy when no work records exist", () => {
    const management = createMonthlyWorkManagementViewModel({
      selectedProject: project,
      optimizationItems: [],
      clientActionItems: [],
      state: "empty"
    });

    render(createElement(MonthlyWorkManagement, {
      management,
      saveOptimizationAction: successAction,
      saveClientActionAction: successAction
    }));

    expect(screen.getByText("Még nincs mentett optimalizálás ehhez a projekthez.")).toBeTruthy();
    expect(screen.getByText("Még nincs mentett ügyfélteendő ehhez a projekthez.")).toBeTruthy();
  });

  it("submits optimization and client action forms through separate server actions", async () => {
    const user = userEvent.setup();
    const saveOptimizationAction = vi.fn(async () => ({
      status: "success",
      message: "Optimalizálás mentve.",
      fieldErrors: {}
    }) satisfies MonthlyReviewEditorActionState);
    const saveClientActionAction = vi.fn(async () => ({
      status: "success",
      message: "Ügyfélteendő mentve.",
      fieldErrors: {}
    }) satisfies MonthlyReviewEditorActionState);
    const management = createMonthlyWorkManagementViewModel({
      selectedProject: project,
      optimizationItems: [],
      clientActionItems: [],
      state: "empty"
    });

    render(createElement(MonthlyWorkManagement, {
      management,
      saveOptimizationAction,
      saveClientActionAction
    }));

    await user.type(screen.getAllByLabelText("Cím")[0]!, "Új optimalizálás");
    await user.type(screen.getAllByLabelText("Cím")[1]!, "Új ügyfélteendő");
    await user.click(screen.getByRole("button", { name: "Optimalizálás létrehozása" }));
    await user.click(screen.getByRole("button", { name: "Ügyfélteendő létrehozása" }));

    expect(saveOptimizationAction).toHaveBeenCalledTimes(1);
    expect(saveClientActionAction).toHaveBeenCalledTimes(1);
  });
});
