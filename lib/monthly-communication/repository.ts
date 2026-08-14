import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  MonthlyCommunicationRepository,
  MonthlyReviewDraftWrite,
  MonthlyReviewRecord,
  MonthlyReviewStatusUpdate
} from "@/lib/monthly-communication/types";

const monthlyReviewSelect =
  "id, project_id, period_start, period_end, summary_draft, summary_approved, outcome_type, outcome_items, corrective_actions, next_month_plan, status, approved_by, approved_at, created_at, updated_at";

export function createMonthlyCommunicationRepository(
  supabase: SupabaseClient<Database>
): MonthlyCommunicationRepository {
  return {
    async findMonthlyReviewByProjectPeriod({ projectId, periodStart, periodEnd }) {
      const { data, error } = await supabase
        .from("monthly_reviews")
        .select(monthlyReviewSelect)
        .eq("project_id", projectId)
        .eq("period_start", periodStart)
        .eq("period_end", periodEnd)
        .maybeSingle()
        .returns<MonthlyReviewRecord | null>();

      if (error) {
        throw new Error("Could not load the monthly review.");
      }

      return data;
    },

    async findMonthlyReviewById(reviewId) {
      const { data, error } = await supabase
        .from("monthly_reviews")
        .select(monthlyReviewSelect)
        .eq("id", reviewId)
        .maybeSingle()
        .returns<MonthlyReviewRecord | null>();

      if (error) {
        throw new Error("Could not load the monthly review.");
      }

      return data;
    },

    async upsertMonthlyReviewDraft(input) {
      const { data, error } = await supabase
        .from("monthly_reviews")
        .upsert(toMonthlyReviewDraftInsert(input), {
          onConflict: "project_id,period_start,period_end"
        })
        .select(monthlyReviewSelect)
        .single()
        .returns<MonthlyReviewRecord>();

      if (error) {
        throw new Error("Could not save the monthly review draft.");
      }

      return data;
    },

    async updateMonthlyReviewStatus(input) {
      const { data, error } = await supabase
        .from("monthly_reviews")
        .update(toMonthlyReviewStatusUpdate(input))
        .eq("id", input.id)
        .select(monthlyReviewSelect)
        .single()
        .returns<MonthlyReviewRecord>();

      if (error) {
        throw new Error("Could not update the monthly review status.");
      }

      return data;
    }
  };
}

function toMonthlyReviewDraftInsert(
  input: MonthlyReviewDraftWrite
): Database["public"]["Tables"]["monthly_reviews"]["Insert"] {
  return {
    project_id: input.project_id,
    period_start: input.period_start,
    period_end: input.period_end,
    summary_draft: input.summary_draft,
    summary_approved: input.summary_approved,
    outcome_type: input.outcome_type,
    outcome_items: input.outcome_items,
    corrective_actions: input.corrective_actions,
    next_month_plan: input.next_month_plan,
    status: input.status,
    approved_by: input.approved_by,
    approved_at: input.approved_at
  };
}

function toMonthlyReviewStatusUpdate(
  input: MonthlyReviewStatusUpdate
): Database["public"]["Tables"]["monthly_reviews"]["Update"] {
  return {
    status: input.status,
    summary_approved: input.summary_approved,
    approved_by: input.approved_by,
    approved_at: input.approved_at
  };
}
