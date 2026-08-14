import "server-only";

import type { CurrentUser } from "@/lib/auth/session";
import type {
  MonthlyReviewEditorViewModel
} from "@/lib/monthly-communication/editor-view-model";
import { createMonthlyCommunicationRepository } from "@/lib/monthly-communication/repository";
import type {
  MonthlyCommunicationRepository,
  MonthlyReviewRecord
} from "@/lib/monthly-communication/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MonthlyReviewStatus } from "@/types/database";

export type MonthlyReviewApprovalWorkflowViewModel = Readonly<{
  state: "empty" | "ready" | "error";
  reviewId: string | null;
  status: MonthlyReviewStatus | "missing";
  statusLabel: string;
  description: string;
  approvedSummary: string;
  canApprove: boolean;
  canPublish: boolean;
  approveDisabledReason: string | null;
  publishDisabledReason: string | null;
  approvedMetadataLabel: string | null;
  historyProtectionLabel: string | null;
}>;

export type GetMonthlyReviewApprovalWorkflowInput = Readonly<{
  currentUser: Pick<CurrentUser, "profile">;
  editor: MonthlyReviewEditorViewModel | null;
  repository?: MonthlyCommunicationRepository;
}>;

export async function getMonthlyReviewApprovalWorkflowViewModel({
  currentUser,
  editor,
  repository: providedRepository
}: GetMonthlyReviewApprovalWorkflowInput): Promise<MonthlyReviewApprovalWorkflowViewModel | null> {
  if (currentUser.profile.role !== "agency_admin" || !editor) {
    return null;
  }

  try {
    const repository = providedRepository ?? await createServerRepository();
    const review = await repository.findMonthlyReviewByProjectPeriod({
      projectId: editor.projectId,
      periodStart: editor.periodStart,
      periodEnd: editor.periodEnd
    });

    return createMonthlyReviewApprovalWorkflowViewModel(review);
  } catch {
    return createWorkflowErrorViewModel();
  }
}

export function createMonthlyReviewApprovalWorkflowViewModel(
  review: MonthlyReviewRecord | null
): MonthlyReviewApprovalWorkflowViewModel {
  if (!review) {
    return {
      state: "empty",
      reviewId: null,
      status: "missing",
      statusLabel: "Nincs mentett vázlat",
      description: "Mentés után lehet jóváhagyásra küldeni a havi összefoglalót.",
      approvedSummary: "",
      canApprove: false,
      canPublish: false,
      approveDisabledReason: "Előbb mentsd és küldd jóváhagyásra a vázlatot.",
      publishDisabledReason: "Publikálni csak jóváhagyott összefoglalót lehet.",
      approvedMetadataLabel: null,
      historyProtectionLabel: null
    };
  }

  const publishBlockReason = getPublishBlockReason(review);

  return {
    state: "ready",
    reviewId: review.id,
    status: review.status,
    statusLabel: getStatusLabel(review.status),
    description: getStatusDescription(review.status),
    approvedSummary: review.summary_approved ?? review.summary_draft ?? "",
    canApprove: review.status === "review",
    canPublish: review.status === "approved" && !publishBlockReason,
    approveDisabledReason: getApproveDisabledReason(review.status),
    publishDisabledReason: publishBlockReason ?? getPublishDisabledReason(review.status),
    approvedMetadataLabel: getApprovedMetadataLabel(review),
    historyProtectionLabel: getHistoryProtectionLabel(review.status)
  };
}

async function createServerRepository() {
  const supabase = await createServerSupabaseClient();

  return createMonthlyCommunicationRepository(supabase);
}

function createWorkflowErrorViewModel(): MonthlyReviewApprovalWorkflowViewModel {
  return {
    state: "error",
    reviewId: null,
    status: "missing",
    statusLabel: "Nem sikerült betölteni",
    description: "A jóváhagyási állapot most nem érhető el. Próbáld újra később.",
    approvedSummary: "",
    canApprove: false,
    canPublish: false,
    approveDisabledReason: "A jóváhagyás betöltési hiba miatt nem indítható.",
    publishDisabledReason: "A publikálás betöltési hiba miatt nem indítható.",
    approvedMetadataLabel: null,
    historyProtectionLabel: null
  };
}

function getStatusLabel(status: MonthlyReviewStatus) {
  const labels: Record<MonthlyReviewStatus, string> = {
    draft: "Vázlat",
    review: "Jóváhagyásra vár",
    approved: "Jóváhagyva",
    published: "Publikálva",
    archived: "Archiválva"
  };

  return labels[status];
}

function getStatusDescription(status: MonthlyReviewStatus) {
  if (status === "review") {
    return "A vázlat jóváhagyható, de ügyféloldalon még nem publikált tartalom.";
  }

  if (status === "approved") {
    return "A jóváhagyott tartalom publikálható az ügyfélportálon.";
  }

  if (status === "published") {
    return "A tartalom már ügyféloldalon is megjelenhet.";
  }

  if (status === "archived") {
    return "Archivált összefoglaló nem módosítható vagy publikálható.";
  }

  return "A vázlatot előbb jóváhagyásra kell küldeni.";
}

function getApproveDisabledReason(status: MonthlyReviewStatus) {
  if (status === "review") {
    return null;
  }

  if (status === "draft") {
    return "Előbb küldd jóváhagyásra a vázlatot.";
  }

  return "Jóváhagyott történeti tartalmat ez a workflow nem ír felül.";
}

function getPublishDisabledReason(status: MonthlyReviewStatus) {
  if (status === "approved") {
    return null;
  }

  if (status === "published") {
    return "Ez az összefoglaló már publikálva van.";
  }

  if (status === "review") {
    return "Publikálás előtt jóvá kell hagyni az ügyfélszöveget.";
  }

  return "Publikálni csak jóváhagyott összefoglalót lehet.";
}

function getPublishBlockReason(review: MonthlyReviewRecord) {
  if (review.status !== "approved") {
    return null;
  }

  if (!review.summary_approved?.trim() || !review.approved_by || !review.approved_at) {
    return "A publikáláshoz rögzített jóváhagyó és jóváhagyási időpont szükséges.";
  }

  if (review.outcome_type === "focus" && review.corrective_actions.length === 0) {
    return "Fókuszt igénylő havi eredmény nem publikálható javító lépés nélkül.";
  }

  return null;
}

function getApprovedMetadataLabel(review: MonthlyReviewRecord) {
  if (!review.approved_by || !review.approved_at) {
    return null;
  }

  return `Jóváhagyás rögzítve: ${formatDateTimeLabel(review.approved_at)}`;
}

function getHistoryProtectionLabel(status: MonthlyReviewStatus) {
  if (status === "approved" || status === "published" || status === "archived") {
    return "A jóváhagyott történeti szöveget ez a művelet nem írja felül.";
  }

  return null;
}

function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
