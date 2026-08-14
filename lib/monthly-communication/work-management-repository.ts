import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClientActionItemRecord,
  MonthlyWorkManagementRepository,
  OptimizationItemRecord
} from "@/lib/monthly-communication/work-management-types";
import type { Database } from "@/types/database";

const optimizationItemSelect =
  "id, project_id, category, title, description, status, source, source_reference, source_timestamp, started_at, completed_at, is_client_visible, approval_status, created_at, updated_at";

const clientActionItemSelect =
  "id, project_id, source, category, title, description, priority, affected_count, external_url, status, due_date, created_at, updated_at, resolved_at";

export function createMonthlyWorkManagementRepository(
  supabase: SupabaseClient<Database>
): MonthlyWorkManagementRepository {
  return {
    async listOptimizationItems(projectId) {
      const { data, error } = await supabase
        .from("optimization_items")
        .select(optimizationItemSelect)
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(24)
        .returns<OptimizationItemRecord[]>();

      if (error) {
        throw new Error("Could not load optimization items.");
      }

      return data;
    },

    async listClientActionItems(projectId) {
      const { data, error } = await supabase
        .from("client_action_items")
        .select(clientActionItemSelect)
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(24)
        .returns<ClientActionItemRecord[]>();

      if (error) {
        throw new Error("Could not load client action items.");
      }

      return data;
    },

    async upsertOptimizationItem(input) {
      const { data, error } = await supabase
        .from("optimization_items")
        .upsert(toOptimizationItemInsert(input), {
          onConflict: "id"
        })
        .select(optimizationItemSelect)
        .single()
        .returns<OptimizationItemRecord>();

      if (error) {
        throw new Error("Could not save the optimization item.");
      }

      return data;
    },

    async upsertClientActionItem(input) {
      const { data, error } = await supabase
        .from("client_action_items")
        .upsert(toClientActionItemInsert(input), {
          onConflict: "id"
        })
        .select(clientActionItemSelect)
        .single()
        .returns<ClientActionItemRecord>();

      if (error) {
        throw new Error("Could not save the client action item.");
      }

      return data;
    }
  };
}

function toOptimizationItemInsert(
  input: Parameters<MonthlyWorkManagementRepository["upsertOptimizationItem"]>[0]
): Database["public"]["Tables"]["optimization_items"]["Insert"] {
  return {
    id: input.id,
    project_id: input.project_id,
    category: input.category,
    title: input.title,
    description: input.description,
    status: input.status,
    source: input.source,
    started_at: input.started_at,
    completed_at: input.completed_at,
    is_client_visible: input.is_client_visible,
    approval_status: input.approval_status
  };
}

function toClientActionItemInsert(
  input: Parameters<MonthlyWorkManagementRepository["upsertClientActionItem"]>[0]
): Database["public"]["Tables"]["client_action_items"]["Insert"] {
  return {
    id: input.id,
    project_id: input.project_id,
    source: input.source,
    category: input.category,
    title: input.title,
    description: input.description,
    priority: input.priority,
    affected_count: input.affected_count,
    status: input.status,
    due_date: input.due_date,
    resolved_at: input.resolved_at
  };
}
