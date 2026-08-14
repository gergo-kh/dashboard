import "server-only";

import type { CurrentUser } from "@/lib/auth/session";
import {
  correctiveActionsDraftSchema,
  monthlyOutcomeItemDraftSchema,
  monthlyReviewApprovalSchema,
  monthlyReviewDraftSchema,
  monthlyReviewTransitionSchema,
  nextMonthPlanItemDraftSchema,
  type MonthlyReviewApprovalInput,
  type MonthlyReviewDraftInput,
  type MonthlyReviewTransitionInput,
  type ParsedMonthlyReviewApprovalInput
} from "@/lib/monthly-communication/schemas";
import type {
  MonthlyCommunicationRepository,
  MonthlyOutcomeDraftItem,
  MonthlyReviewDraftWrite,
  MonthlyReviewRecord,
  NextMonthPlanDraftItem
} from "@/lib/monthly-communication/types";
import { MonthlyCommunicationError } from "@/lib/monthly-communication/types";
import type { Json, MonthlyReviewStatus } from "@/types/database";

type MonthlyCommunicationServiceInput = Readonly<{
  currentUser: CurrentUser;
  repository: MonthlyCommunicationRepository;
  now?: () => Date;
}>;

type SaveMonthlyReviewDraftInput = MonthlyCommunicationServiceInput & Readonly<{
  draft: MonthlyReviewDraftInput;
}>;

type TransitionMonthlyReviewInput = MonthlyCommunicationServiceInput & Readonly<{
  transition: MonthlyReviewTransitionInput;
}>;

type ApproveMonthlyReviewInput = MonthlyCommunicationServiceInput & Readonly<{
  approval: MonthlyReviewApprovalInput;
}>;

export async function saveMonthlyReviewDraft({
  currentUser,
  repository,
  draft
}: SaveMonthlyReviewDraftInput): Promise<MonthlyReviewRecord> {
  assertAgencyAdmin(currentUser);
  const parsedDraft = monthlyReviewDraftSchema.parse(draft);
  const existingReview = await repository.findMonthlyReviewByProjectPeriod({
    projectId: parsedDraft.projectId,
    periodStart: parsedDraft.periodStart,
    periodEnd: parsedDraft.periodEnd
  });

  if (existingReview && !canEditDraft(existingReview.status)) {
    throw new MonthlyCommunicationError(
      "invalid_transition",
      "Approved, published, archived monthly reviews cannot be overwritten as drafts."
    );
  }

  return repository.upsertMonthlyReviewDraft(toMonthlyReviewDraftWrite(parsedDraft));
}

export async function submitMonthlyReviewForReview({
  currentUser,
  repository,
  transition
}: TransitionMonthlyReviewInput): Promise<MonthlyReviewRecord> {
  assertAgencyAdmin(currentUser);
  const parsedTransition = monthlyReviewTransitionSchema.parse(transition);
  const review = await getRequiredMonthlyReview(repository, parsedTransition.reviewId);

  assertTransition(review.status, ["draft", "review"], "Only draft monthly reviews can be submitted.");
  assertMonthlyReviewHasDraftContent(review);

  return repository.updateMonthlyReviewStatus({
    id: review.id,
    status: "review",
    approved_by: null,
    approved_at: null
  });
}

export async function approveMonthlyReview({
  currentUser,
  repository,
  approval,
  now = () => new Date()
}: ApproveMonthlyReviewInput): Promise<MonthlyReviewRecord> {
  assertAgencyAdmin(currentUser);
  const parsedApproval = monthlyReviewApprovalSchema.parse(approval);
  const review = await getRequiredMonthlyReview(repository, parsedApproval.reviewId);

  assertTransition(review.status, ["review"], "Only reviews waiting for approval can be approved.");
  assertMonthlyReviewCanBeApproved(review, parsedApproval);

  return repository.updateMonthlyReviewStatus({
    id: review.id,
    status: parsedApproval.publishImmediately ? "published" : "approved",
    summary_approved: parsedApproval.approvedSummary,
    approved_by: currentUser.profile.id,
    approved_at: now().toISOString()
  });
}

export async function publishMonthlyReview({
  currentUser,
  repository,
  transition
}: TransitionMonthlyReviewInput): Promise<MonthlyReviewRecord> {
  assertAgencyAdmin(currentUser);
  const parsedTransition = monthlyReviewTransitionSchema.parse(transition);
  const review = await getRequiredMonthlyReview(repository, parsedTransition.reviewId);

  assertTransition(review.status, ["approved"], "Only approved monthly reviews can be published.");

  if (!review.summary_approved || !review.approved_by || !review.approved_at) {
    throw new MonthlyCommunicationError(
      "invalid_content",
      "A monthly review must have approved content before publishing."
    );
  }

  assertStoredMonthlyReviewContent(review);

  return repository.updateMonthlyReviewStatus({
    id: review.id,
    status: "published"
  });
}

export function assertAgencyAdmin(currentUser: Pick<CurrentUser, "profile">): void {
  if (currentUser.profile.role !== "agency_admin" || !currentUser.profile.is_active) {
    throw new MonthlyCommunicationError(
      "permission_denied",
      "Only active agency admins can manage monthly communication content."
    );
  }
}

function canEditDraft(status: MonthlyReviewStatus): boolean {
  return status === "draft" || status === "review";
}

async function getRequiredMonthlyReview(
  repository: MonthlyCommunicationRepository,
  reviewId: string
): Promise<MonthlyReviewRecord> {
  const review = await repository.findMonthlyReviewById(reviewId);

  if (!review) {
    throw new MonthlyCommunicationError("missing_review", "The monthly review does not exist.");
  }

  return review;
}

function assertTransition(
  currentStatus: MonthlyReviewStatus,
  allowedStatuses: MonthlyReviewStatus[],
  message: string
) {
  if (!allowedStatuses.includes(currentStatus)) {
    throw new MonthlyCommunicationError("invalid_transition", message);
  }
}

function assertMonthlyReviewHasDraftContent(review: MonthlyReviewRecord): void {
  if (!review.summary_draft?.trim()) {
    throw new MonthlyCommunicationError(
      "invalid_content",
      "A monthly review draft requires a summary before review."
    );
  }

  assertStoredMonthlyReviewContent(review);
}

function assertMonthlyReviewCanBeApproved(
  review: MonthlyReviewRecord,
  approval: ParsedMonthlyReviewApprovalInput
): void {
  assertStoredMonthlyReviewContent(review);

  if (!approval.approvedSummary.trim()) {
    throw new MonthlyCommunicationError(
      "invalid_content",
      "Approved monthly summary text is required."
    );
  }
}

function assertStoredMonthlyReviewContent(review: MonthlyReviewRecord): void {
  const outcomeItems = monthlyOutcomeItemDraftSchema.array().safeParse(review.outcome_items);
  const nextMonthPlan = nextMonthPlanItemDraftSchema.array().safeParse(review.next_month_plan);
  const correctiveActions = correctiveActionsDraftSchema.safeParse(review.corrective_actions);

  if (!outcomeItems.success || outcomeItems.data.length === 0) {
    throw new MonthlyCommunicationError(
      "invalid_content",
      "Monthly outcome items must be valid before approval."
    );
  }

  if (!nextMonthPlan.success || nextMonthPlan.data.length === 0) {
    throw new MonthlyCommunicationError(
      "invalid_content",
      "Next month plan items must be valid before approval."
    );
  }

  if (!correctiveActions.success) {
    throw new MonthlyCommunicationError(
      "invalid_content",
      "Corrective actions must be valid before approval."
    );
  }

  if (review.outcome_type === "focus" && correctiveActions.data.length === 0) {
    throw new MonthlyCommunicationError(
      "invalid_content",
      "Focus monthly outcomes require at least one corrective action."
    );
  }
}

function toMonthlyReviewDraftWrite(draft: MonthlyReviewDraftInput): MonthlyReviewDraftWrite {
  return {
    project_id: draft.projectId,
    period_start: draft.periodStart,
    period_end: draft.periodEnd,
    summary_draft: draft.summaryDraft,
    summary_approved: null,
    outcome_type: draft.outcomeType,
    outcome_items: toJsonArray(draft.outcomeItems),
    corrective_actions: toJsonArray(draft.correctiveActions),
    next_month_plan: toJsonArray(draft.nextMonthPlan),
    status: "draft",
    approved_by: null,
    approved_at: null
  };
}

function toJsonArray(
  value: MonthlyOutcomeDraftItem[] | NextMonthPlanDraftItem[] | string[]
): Json[] {
  return value.map((item) => item as Json);
}
