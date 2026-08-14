import "server-only";

import type { CurrentUser } from "@/lib/auth/session";
import { assertAgencyAdmin } from "@/lib/monthly-communication/service";
import type {
  ClientActionItemWrite,
  MonthlyWorkManagementRepository,
  OptimizationItemWrite
} from "@/lib/monthly-communication/work-management-types";
import {
  clientActionItemInputSchema,
  optimizationItemInputSchema,
  type ClientActionItemInput,
  type OptimizationItemInput,
  type ParsedClientActionItemInput,
  type ParsedOptimizationItemInput
} from "@/lib/monthly-communication/work-management-schemas";
import type { ClientActionStatus } from "@/types/database";

type MonthlyWorkManagementInput = Readonly<{
  currentUser: CurrentUser;
  repository: MonthlyWorkManagementRepository;
  now?: () => Date;
}>;

type SaveOptimizationItemInput = MonthlyWorkManagementInput & Readonly<{
  item: OptimizationItemInput;
}>;

type SaveClientActionItemInput = MonthlyWorkManagementInput & Readonly<{
  item: ClientActionItemInput;
}>;

export async function saveOptimizationItem({
  currentUser,
  repository,
  item,
  now = () => new Date()
}: SaveOptimizationItemInput) {
  assertAgencyAdmin(currentUser);
  const parsedItem = optimizationItemInputSchema.parse(item);

  return repository.upsertOptimizationItem(toOptimizationItemWrite(parsedItem, now));
}

export async function saveClientActionItem({
  currentUser,
  repository,
  item,
  now = () => new Date()
}: SaveClientActionItemInput) {
  assertAgencyAdmin(currentUser);
  const parsedItem = clientActionItemInputSchema.parse(item);

  return repository.upsertClientActionItem(toClientActionItemWrite(parsedItem, now));
}

function toOptimizationItemWrite(
  item: ParsedOptimizationItemInput,
  now: () => Date
): OptimizationItemWrite {
  const completedAt =
    item.status === "completed"
      ? dateOnlyToTimestamp(item.completedDate) ?? now().toISOString()
      : null;
  const isClientVisible =
    item.approvalStatus === "approved" ? item.isClientVisible : false;

  return {
    id: item.itemId,
    project_id: item.projectId,
    category: item.category,
    title: item.title,
    description: item.description,
    status: item.status,
    source: "manual",
    started_at: dateOnlyToTimestamp(item.startedDate),
    completed_at: completedAt,
    is_client_visible: isClientVisible,
    approval_status: item.approvalStatus
  };
}

function toClientActionItemWrite(
  item: ParsedClientActionItemInput,
  now: () => Date
): ClientActionItemWrite {
  const status = toClientActionStatus(item);
  const resolvedAt =
    status === "resolved"
      ? dateOnlyToTimestamp(item.resolvedDate) ?? now().toISOString()
      : null;

  return {
    id: item.itemId,
    project_id: item.projectId,
    source: "manual",
    category: item.category,
    title: item.title,
    description: item.description,
    priority: item.priority,
    affected_count: item.affectedCount,
    status,
    due_date: item.dueDate,
    resolved_at: resolvedAt
  };
}

function toClientActionStatus(item: ParsedClientActionItemInput): ClientActionStatus {
  if (item.visibility === "draft") {
    return "draft";
  }

  if (item.visibility === "hidden") {
    return "hidden";
  }

  return item.status;
}

function dateOnlyToTimestamp(value: string | null) {
  return value ? `${value}T12:00:00.000Z` : null;
}
