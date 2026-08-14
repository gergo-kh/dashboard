import type {
  Json,
  MonthlyOutcomeType,
  MonthlyReviewStatus
} from "@/types/database";

export type MonthlyCommunicationErrorCode =
  | "permission_denied"
  | "invalid_transition"
  | "missing_review"
  | "invalid_content";

export class MonthlyCommunicationError extends Error {
  constructor(
    public readonly code: MonthlyCommunicationErrorCode,
    message: string
  ) {
    super(message);
    this.name = "MonthlyCommunicationError";
  }
}

export type MonthlyOutcomeDraftItem = Readonly<{
  label: string;
  value: string;
  state: "positive" | "neutral" | "negative";
  explanation?: string;
  correctiveAction?: string;
}>;

export type NextMonthPlanDraftItem = Readonly<{
  title: string;
  detail: string;
}>;

export type MonthlyReviewRecord = Readonly<{
  id: string;
  project_id: string;
  period_start: string;
  period_end: string;
  summary_draft: string | null;
  summary_approved: string | null;
  outcome_type: MonthlyOutcomeType;
  outcome_items: Json[];
  corrective_actions: Json[];
  next_month_plan: Json[];
  status: MonthlyReviewStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}>;

export type MonthlyReviewDraftWrite = Readonly<{
  project_id: string;
  period_start: string;
  period_end: string;
  summary_draft: string;
  summary_approved: null;
  outcome_type: MonthlyOutcomeType;
  outcome_items: Json[];
  corrective_actions: Json[];
  next_month_plan: Json[];
  status: "draft";
  approved_by: null;
  approved_at: null;
}>;

export type MonthlyReviewStatusUpdate = Readonly<{
  id: string;
  status: MonthlyReviewStatus;
  summary_approved?: string;
  approved_by?: string | null;
  approved_at?: string | null;
}>;

export type MonthlyCommunicationRepository = {
  findMonthlyReviewByProjectPeriod(input: {
    projectId: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<MonthlyReviewRecord | null>;
  findMonthlyReviewById(reviewId: string): Promise<MonthlyReviewRecord | null>;
  upsertMonthlyReviewDraft(input: MonthlyReviewDraftWrite): Promise<MonthlyReviewRecord>;
  updateMonthlyReviewStatus(input: MonthlyReviewStatusUpdate): Promise<MonthlyReviewRecord>;
};
