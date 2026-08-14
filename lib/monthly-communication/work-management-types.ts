import type {
  ApprovalStatus,
  ClientActionPriority,
  ClientActionStatus,
  Database,
  OptimizationStatus
} from "@/types/database";

export type OptimizationItemRecord =
  Database["public"]["Tables"]["optimization_items"]["Row"];

export type ClientActionItemRecord =
  Database["public"]["Tables"]["client_action_items"]["Row"];

export type OptimizationItemWrite = Readonly<{
  id?: string;
  project_id: string;
  category: string;
  title: string;
  description: string | null;
  status: OptimizationStatus;
  source: "manual";
  started_at: string | null;
  completed_at: string | null;
  is_client_visible: boolean;
  approval_status: ApprovalStatus;
}>;

export type ClientActionItemWrite = Readonly<{
  id?: string;
  project_id: string;
  source: "manual";
  category: string;
  title: string;
  description: string | null;
  priority: ClientActionPriority;
  affected_count: number | null;
  status: ClientActionStatus;
  due_date: string | null;
  resolved_at: string | null;
}>;

export type MonthlyWorkManagementRepository = {
  listOptimizationItems(projectId: string): Promise<OptimizationItemRecord[]>;
  listClientActionItems(projectId: string): Promise<ClientActionItemRecord[]>;
  upsertOptimizationItem(input: OptimizationItemWrite): Promise<OptimizationItemRecord>;
  upsertClientActionItem(input: ClientActionItemWrite): Promise<ClientActionItemRecord>;
};
