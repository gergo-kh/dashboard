import type {
  MonthlyReviewApprovalInput,
  MonthlyReviewDraftInput,
  MonthlyReviewTransitionInput
} from "@/lib/monthly-communication/schemas";

export function monthlyReviewDraftFromFormData(formData: FormData): MonthlyReviewDraftInput {
  const outcomeItems = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((index) => ({
      label: readText(formData, `outcomeItems.${index}.label`),
      value: readText(formData, `outcomeItems.${index}.value`),
      state: readOutcomeState(formData, `outcomeItems.${index}.state`),
      explanation: optionalText(formData, `outcomeItems.${index}.explanation`),
      correctiveAction: optionalText(formData, `outcomeItems.${index}.correctiveAction`)
    }))
    .filter((item) =>
      [item.label, item.value, item.explanation, item.correctiveAction].some(
        (value) => value !== undefined && value.length > 0
      )
    );
  const correctiveActions = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((index) => readText(formData, `correctiveActions.${index}`))
    .filter((value) => value.length > 0);
  const nextMonthPlan = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((index) => ({
      title: readText(formData, `nextMonthPlan.${index}.title`),
      detail: readText(formData, `nextMonthPlan.${index}.detail`)
    }))
    .filter((item) => item.title.length > 0 || item.detail.length > 0);

  return {
    projectId: readText(formData, "projectId"),
    periodStart: readText(formData, "periodStart"),
    periodEnd: readText(formData, "periodEnd"),
    summaryDraft: readText(formData, "summaryDraft"),
    outcomeType: readOutcomeType(formData, "outcomeType"),
    outcomeItems,
    correctiveActions,
    nextMonthPlan
  };
}

export function monthlyReviewApprovalFromFormData(
  formData: FormData
): MonthlyReviewApprovalInput {
  return {
    reviewId: readText(formData, "reviewId"),
    approvedSummary: readText(formData, "approvedSummary"),
    publishImmediately: false
  };
}

export function monthlyReviewTransitionFromFormData(
  formData: FormData
): MonthlyReviewTransitionInput {
  return {
    reviewId: readText(formData, "reviewId")
  };
}

function readText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, name: string) {
  const value = readText(formData, name);

  return value.length > 0 ? value : undefined;
}

function readOutcomeType(formData: FormData, name: string): MonthlyReviewDraftInput["outcomeType"] {
  return readText(formData, name) as MonthlyReviewDraftInput["outcomeType"];
}

function readOutcomeState(
  formData: FormData,
  name: string
): MonthlyReviewDraftInput["outcomeItems"][number]["state"] {
  return readText(formData, name) as MonthlyReviewDraftInput["outcomeItems"][number]["state"];
}
