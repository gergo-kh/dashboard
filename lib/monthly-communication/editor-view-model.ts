import type { AccessibleProject, CurrentUser } from "@/lib/auth/session";
import type {
  MonthlyOutcomeDraftItem,
  NextMonthPlanDraftItem
} from "@/lib/monthly-communication/types";

export type MonthlyReviewEditorViewModel = Readonly<{
  projectId: string;
  projectName: string;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  summaryDraft: string;
  outcomeType: "positive" | "mixed" | "focus";
  outcomeItems: MonthlyOutcomeDraftItem[];
  correctiveActions: string[];
  nextMonthPlan: NextMonthPlanDraftItem[];
}>;

export type CreateMonthlyReviewEditorViewModelInput = Readonly<{
  currentUser: Pick<CurrentUser, "profile">;
  selectedProject: AccessibleProject | null;
  now?: Date;
}>;

const defaultOutcomeItems = [
  {
    label: "ROAS",
    value: "",
    state: "neutral" as const,
    explanation: "",
    correctiveAction: ""
  },
  {
    label: "Bevétel",
    value: "",
    state: "neutral" as const,
    explanation: "",
    correctiveAction: ""
  },
  {
    label: "Költség",
    value: "",
    state: "neutral" as const,
    explanation: "",
    correctiveAction: ""
  }
] satisfies MonthlyOutcomeDraftItem[];

const defaultNextMonthPlan = [
  {
    title: "",
    detail: ""
  },
  {
    title: "",
    detail: ""
  }
] satisfies NextMonthPlanDraftItem[];

export function createMonthlyReviewEditorViewModel({
  currentUser,
  selectedProject,
  now = new Date()
}: CreateMonthlyReviewEditorViewModelInput): MonthlyReviewEditorViewModel | null {
  if (currentUser.profile.role !== "agency_admin" || !selectedProject) {
    return null;
  }

  const period = createProjectMonthPeriod(now, selectedProject.timezone);

  return {
    projectId: selectedProject.id,
    projectName: selectedProject.name,
    clientName: selectedProject.client?.name ?? "Ügyfél",
    periodStart: period.start,
    periodEnd: period.end,
    periodLabel: period.label,
    summaryDraft: "",
    outcomeType: "mixed",
    outcomeItems: defaultOutcomeItems,
    correctiveActions: ["", ""],
    nextMonthPlan: defaultNextMonthPlan
  };
}

function createProjectMonthPeriod(now: Date, timezone: string) {
  const { year, month } = getDatePartsInTimezone(now, timezone);
  const start = `${year}-${month}-01`;
  const endDate = new Date(Date.UTC(Number(year), Number(month), 0));
  const end = `${year}-${month}-${String(endDate.getUTCDate()).padStart(2, "0")}`;

  return {
    start,
    end,
    label: `${year}. ${month}. havi összefoglaló`
  };
}

function getDatePartsInTimezone(date: Date, timezone: string) {
  const parts = (() => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit"
      }).formatToParts(date);
    } catch {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit"
      }).formatToParts(date);
    }
  })();
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return {
    year: year ?? String(date.getUTCFullYear()),
    month: month ?? String(date.getUTCMonth() + 1).padStart(2, "0")
  };
}
