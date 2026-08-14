"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { createMonthlyCommunicationRepository } from "@/lib/monthly-communication/repository";
import { monthlyReviewDraftFromFormData } from "@/lib/monthly-communication/form-data";
import {
  saveMonthlyReviewDraft,
  submitMonthlyReviewForReview
} from "@/lib/monthly-communication/service";
import { MonthlyCommunicationError } from "@/lib/monthly-communication/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MonthlyReviewEditorActionState = Readonly<{
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string>;
}>;

export async function saveMonthlyReviewDraftAction(
  _previousState: MonthlyReviewEditorActionState,
  formData: FormData
): Promise<MonthlyReviewEditorActionState> {
  return persistMonthlyReviewDraft(formData, "save");
}

export async function submitMonthlyReviewDraftAction(
  _previousState: MonthlyReviewEditorActionState,
  formData: FormData
): Promise<MonthlyReviewEditorActionState> {
  return persistMonthlyReviewDraft(formData, "submit");
}

async function persistMonthlyReviewDraft(
  formData: FormData,
  mode: "save" | "submit"
): Promise<MonthlyReviewEditorActionState> {
  try {
    const currentUser = await requireCurrentUser();
    const supabase = await createServerSupabaseClient();
    const repository = createMonthlyCommunicationRepository(supabase);
    const draft = monthlyReviewDraftFromFormData(formData);
    const savedReview = await saveMonthlyReviewDraft({
      currentUser,
      repository,
      draft
    });

    if (mode === "submit") {
      await submitMonthlyReviewForReview({
        currentUser,
        repository,
        transition: {
          reviewId: savedReview.id
        }
      });
    }

    revalidatePath("/");

    return {
      status: "success",
      message:
        mode === "submit"
          ? "A havi összefoglaló jóváhagyásra vár."
          : "A havi összefoglaló vázlata mentve.",
      fieldErrors: {}
    };
  } catch (error) {
    return toEditorActionErrorState(error);
  }
}

function toEditorActionErrorState(error: unknown): MonthlyReviewEditorActionState {
  if (error instanceof ZodError) {
    return {
      status: "error",
      message: "Ellenőrizd a kiemelt mezőket, és próbáld újra.",
      fieldErrors: toFieldErrors(error)
    };
  }

  if (error instanceof MonthlyCommunicationError) {
    return {
      status: "error",
      message: translateMonthlyCommunicationError(error),
      fieldErrors: {}
    };
  }

  return {
    status: "error",
    message: "Nem sikerült menteni a havi összefoglalót. Próbáld újra később.",
    fieldErrors: {}
  };
}

function toFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path.join(".");
    const groupField = issue.path[0];

    if (field.length > 0 && !fieldErrors[field]) {
      fieldErrors[field] = translateValidationIssue(field);
    }

    if (typeof groupField === "string" && !fieldErrors[groupField]) {
      fieldErrors[groupField] = translateValidationIssue(field);
    }
  }

  return fieldErrors;
}

function translateValidationIssue(field: string) {
  if (field === "summaryDraft") {
    return "Az összefoglaló nem lehet üres.";
  }

  if (field === "outcomeItems") {
    return "Legalább egy havi eredményt adj meg.";
  }

  if (field.startsWith("outcomeItems.")) {
    return "Minden megadott eredménysornál szükséges a címke és az érték.";
  }

  if (field === "correctiveActions") {
    return "Fókusz vagy gyenge eredmény esetén legalább egy javító lépés szükséges.";
  }

  if (field === "nextMonthPlan") {
    return "Legalább egy következő havi tervet adj meg.";
  }

  if (field.startsWith("nextMonthPlan.")) {
    return "A tervsor címe és részlete is szükséges.";
  }

  return "Ez a mező ellenőrzést igényel.";
}

function translateMonthlyCommunicationError(error: MonthlyCommunicationError) {
  if (error.code === "permission_denied") {
    return "Ehhez a művelethez agency admin jogosultság szükséges.";
  }

  if (error.code === "invalid_transition") {
    return "Ez az összefoglaló ebben az állapotban nem módosítható.";
  }

  if (error.code === "missing_review") {
    return "A havi összefoglaló nem található.";
  }

  return "A havi összefoglaló tartalma nem érvényes.";
}
