import "server-only";

import type { AccessibleProject, CurrentUser } from "@/lib/auth/session";
import { createMonthlyWorkManagementRepository } from "@/lib/monthly-communication/work-management-repository";
import type {
  ClientActionItemRecord,
  MonthlyWorkManagementRepository,
  OptimizationItemRecord
} from "@/lib/monthly-communication/work-management-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ApprovalStatus,
  ClientActionPriority,
  ClientActionStatus,
  OptimizationStatus
} from "@/types/database";

export type WorkManagementOption<Value extends string> = Readonly<{
  value: Value;
  label: string;
}>;

export type OptimizationWorkItemViewModel = Readonly<{
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  status: OptimizationStatus;
  statusLabel: string;
  approvalStatus: ApprovalStatus;
  approvalStatusLabel: string;
  isClientVisible: boolean;
  startedDate: string;
  completedDate: string;
  updatedLabel: string;
}>;

export type ClientActionWorkItemViewModel = Readonly<{
  id: string;
  title: string;
  description: string;
  category: string;
  priority: ClientActionPriority;
  priorityLabel: string;
  status: ClientActionStatus;
  visibleStatus: "open" | "in_progress" | "resolved" | "dismissed";
  statusLabel: string;
  visibility: "draft" | "visible" | "hidden";
  visibilityLabel: string;
  affectedCount: string;
  dueDate: string;
  resolvedDate: string;
  updatedLabel: string;
}>;

export type MonthlyWorkManagementViewModel = Readonly<{
  state: "ready" | "empty" | "error";
  projectId: string;
  projectName: string;
  clientName: string;
  optimizationItems: OptimizationWorkItemViewModel[];
  clientActionItems: ClientActionWorkItemViewModel[];
  optimizationStatusOptions: WorkManagementOption<OptimizationStatus>[];
  optimizationCategoryOptions: WorkManagementOption<string>[];
  approvalStatusOptions: WorkManagementOption<ApprovalStatus>[];
  clientActionPriorityOptions: WorkManagementOption<ClientActionPriority>[];
  clientActionStatusOptions: WorkManagementOption<
    "open" | "in_progress" | "resolved" | "dismissed"
  >[];
  clientActionVisibilityOptions: WorkManagementOption<"draft" | "visible" | "hidden">[];
  description: string;
}>;

export type GetMonthlyWorkManagementViewModelInput = Readonly<{
  currentUser: Pick<CurrentUser, "profile">;
  selectedProject: AccessibleProject | null;
  repository?: MonthlyWorkManagementRepository;
}>;

const optimizationCategoryOptions = [
  { value: "google_ads", label: "Google Ads" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "tiktok_ads", label: "TikTok Ads" },
  { value: "merchant_center", label: "Merchant Center" },
  { value: "measurement", label: "Mérés" },
  { value: "reporting", label: "Riportolás" },
  { value: "other", label: "Egyéb" }
] satisfies WorkManagementOption<string>[];

const optimizationStatusOptions = [
  { value: "planned", label: "Tervezett" },
  { value: "in_progress", label: "Folyamatban" },
  { value: "completed", label: "Elkészült" },
  { value: "cancelled", label: "Leállítva" }
] satisfies WorkManagementOption<OptimizationStatus>[];

const approvalStatusOptions = [
  { value: "draft", label: "Vázlat" },
  { value: "approved", label: "Jóváhagyott" },
  { value: "hidden", label: "Rejtett" }
] satisfies WorkManagementOption<ApprovalStatus>[];

const clientActionPriorityOptions = [
  { value: "urgent", label: "Sürgős" },
  { value: "recommended", label: "Javasolt" },
  { value: "opportunity", label: "Fejlesztési lehetőség" }
] satisfies WorkManagementOption<ClientActionPriority>[];

const clientActionStatusOptions = [
  { value: "open", label: "Nyitott" },
  { value: "in_progress", label: "Folyamatban" },
  { value: "resolved", label: "Megoldva" },
  { value: "dismissed", label: "Elvetve" }
] satisfies WorkManagementOption<"open" | "in_progress" | "resolved" | "dismissed">[];

const clientActionVisibilityOptions = [
  { value: "draft", label: "Vázlat, ügyfélnek nem látható" },
  { value: "visible", label: "Jóváhagyott és ügyfélnek látható" },
  { value: "hidden", label: "Rejtett" }
] satisfies WorkManagementOption<"draft" | "visible" | "hidden">[];

export async function getMonthlyWorkManagementViewModel({
  currentUser,
  selectedProject,
  repository: providedRepository
}: GetMonthlyWorkManagementViewModelInput): Promise<MonthlyWorkManagementViewModel | null> {
  if (currentUser.profile.role !== "agency_admin" || !selectedProject) {
    return null;
  }

  try {
    const repository = providedRepository ?? await createServerRepository();
    const [optimizationItems, clientActionItems] = await Promise.all([
      repository.listOptimizationItems(selectedProject.id),
      repository.listClientActionItems(selectedProject.id)
    ]);

    return createMonthlyWorkManagementViewModel({
      selectedProject,
      optimizationItems,
      clientActionItems,
      state: optimizationItems.length === 0 && clientActionItems.length === 0 ? "empty" : "ready"
    });
  } catch {
    return createMonthlyWorkManagementViewModel({
      selectedProject,
      optimizationItems: [],
      clientActionItems: [],
      state: "error"
    });
  }
}

export function createMonthlyWorkManagementViewModel({
  selectedProject,
  optimizationItems,
  clientActionItems,
  state
}: Readonly<{
  selectedProject: AccessibleProject;
  optimizationItems: OptimizationItemRecord[];
  clientActionItems: ClientActionItemRecord[];
  state: MonthlyWorkManagementViewModel["state"];
}>): MonthlyWorkManagementViewModel {
  return {
    state,
    projectId: selectedProject.id,
    projectName: selectedProject.name,
    clientName: selectedProject.client?.name ?? "Ügyfél",
    optimizationItems: optimizationItems.map(toOptimizationItemViewModel),
    clientActionItems: clientActionItems.map(toClientActionItemViewModel),
    optimizationStatusOptions,
    optimizationCategoryOptions,
    approvalStatusOptions,
    clientActionPriorityOptions,
    clientActionStatusOptions,
    clientActionVisibilityOptions,
    description: getStateDescription(state)
  };
}

async function createServerRepository() {
  const supabase = await createServerSupabaseClient();

  return createMonthlyWorkManagementRepository(supabase);
}

function toOptimizationItemViewModel(
  item: OptimizationItemRecord
): OptimizationWorkItemViewModel {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    category: item.category,
    categoryLabel: getOptimizationCategoryLabel(item.category),
    status: item.status,
    statusLabel: getOptimizationStatusLabel(item.status),
    approvalStatus: item.approval_status,
    approvalStatusLabel: getApprovalStatusLabel(item.approval_status),
    isClientVisible: item.is_client_visible,
    startedDate: toDateInputValue(item.started_at),
    completedDate: toDateInputValue(item.completed_at),
    updatedLabel: formatDateTimeLabel(item.updated_at)
  };
}

function toClientActionItemViewModel(
  item: ClientActionItemRecord
): ClientActionWorkItemViewModel {
  const visibility = getClientActionVisibility(item.status);
  const visibleStatus = getClientActionVisibleStatus(item.status);

  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    category: item.category,
    priority: item.priority,
    priorityLabel: getClientActionPriorityLabel(item.priority),
    status: item.status,
    visibleStatus,
    statusLabel: getClientActionStatusLabel(item.status),
    visibility,
    visibilityLabel: getClientActionVisibilityLabel(visibility),
    affectedCount: item.affected_count === null ? "" : String(item.affected_count),
    dueDate: item.due_date ?? "",
    resolvedDate: toDateInputValue(item.resolved_at),
    updatedLabel: formatDateTimeLabel(item.updated_at)
  };
}

function getStateDescription(state: MonthlyWorkManagementViewModel["state"]) {
  if (state === "error") {
    return "A munkák és ügyfélteendők kezelőfelülete most nem érhető el. Próbáld újra később.";
  }

  if (state === "empty") {
    return "Még nincs mentett optimalizálás vagy ügyfélteendő ehhez a projekthez.";
  }

  return "Itt kezelhető, mi kerüljön ügyfél elé a munkák és teendők szekciókban.";
}

function getOptimizationCategoryLabel(category: string) {
  return optimizationCategoryOptions.find((option) => option.value === category)?.label ?? "Egyéb";
}

function getOptimizationStatusLabel(status: OptimizationStatus) {
  return optimizationStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getApprovalStatusLabel(status: ApprovalStatus) {
  return approvalStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getClientActionPriorityLabel(priority: ClientActionPriority) {
  return clientActionPriorityOptions.find((option) => option.value === priority)?.label ?? priority;
}

function getClientActionStatusLabel(status: ClientActionStatus) {
  if (status === "draft") {
    return "Vázlat";
  }

  if (status === "hidden") {
    return "Rejtett";
  }

  return clientActionStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getClientActionVisibility(status: ClientActionStatus) {
  if (status === "draft") {
    return "draft";
  }

  if (status === "hidden") {
    return "hidden";
  }

  return "visible";
}

function getClientActionVisibleStatus(status: ClientActionStatus) {
  if (status === "open" || status === "in_progress" || status === "resolved" || status === "dismissed") {
    return status;
  }

  return "open";
}

function getClientActionVisibilityLabel(visibility: "draft" | "visible" | "hidden") {
  return clientActionVisibilityOptions.find((option) => option.value === visibility)?.label ?? visibility;
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
