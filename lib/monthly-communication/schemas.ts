import { z } from "zod";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export const monthlyCommunicationDateSchema = z
  .string()
  .regex(dateOnlyPattern, "Expected an ISO date in YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, "Expected a valid calendar date.");

export const monthlyOutcomeTypeSchema = z.enum(["positive", "mixed", "focus"]);

export const monthlyOutcomeItemDraftSchema = z
  .object({
    label: z.string().trim().min(1).max(120),
    value: z.string().trim().min(1).max(80),
    state: z.enum(["positive", "neutral", "negative"]),
    explanation: z.string().trim().min(1).max(300).optional(),
    correctiveAction: z.string().trim().min(1).max(300).optional()
  })
  .superRefine((item, context) => {
    if (item.state !== "negative") {
      return;
    }

    if (item.explanation || item.correctiveAction) {
      return;
    }

    context.addIssue({
      code: "custom",
      message: "Negative monthly outcome items require an explanation or corrective action.",
      path: ["explanation"]
    });
  });

export const nextMonthPlanItemDraftSchema = z.object({
  title: z.string().trim().min(1).max(140),
  detail: z.string().trim().min(1).max(400)
});

export const correctiveActionsDraftSchema = z.array(z.string().trim().min(1).max(300)).max(8);

export const monthlyReviewDraftSchema = z
  .object({
    projectId: z.uuid(),
    periodStart: monthlyCommunicationDateSchema,
    periodEnd: monthlyCommunicationDateSchema,
    summaryDraft: z.string().trim().min(1).max(4000),
    outcomeType: monthlyOutcomeTypeSchema,
    outcomeItems: z.array(monthlyOutcomeItemDraftSchema).min(1).max(8),
    correctiveActions: correctiveActionsDraftSchema,
    nextMonthPlan: z.array(nextMonthPlanItemDraftSchema).min(1).max(8)
  })
  .superRefine((draft, context) => {
    if (draft.periodStart > draft.periodEnd) {
      context.addIssue({
        code: "custom",
        message: "The monthly review period start must be before or equal to the period end.",
        path: ["periodStart"]
      });
    }

    if (draft.outcomeType === "focus" && draft.correctiveActions.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Focus monthly outcomes require at least one corrective action.",
        path: ["correctiveActions"]
      });
    }
  });

export const monthlyReviewApprovalSchema = z.object({
  reviewId: z.uuid(),
  approvedSummary: z.string().trim().min(1).max(4000),
  publishImmediately: z.boolean().default(false)
});

export const monthlyReviewTransitionSchema = z.object({
  reviewId: z.uuid()
});

export type MonthlyReviewDraftInput = z.infer<typeof monthlyReviewDraftSchema>;
export type MonthlyReviewApprovalInput = z.input<typeof monthlyReviewApprovalSchema>;
export type ParsedMonthlyReviewApprovalInput = z.output<typeof monthlyReviewApprovalSchema>;
export type MonthlyReviewTransitionInput = z.infer<typeof monthlyReviewTransitionSchema>;
