import { z } from "zod";
import type {
  ClientActionItem,
  CompletedOptimizationItem,
  CurrentWorkItem,
  MonthlyOutcomeState,
  MonthlySummary,
  NextMonthPlanItem,
  ReportItem,
  ReportsViewModel
} from "@/types/overview";

const semanticStateSchema = z.enum(["positive", "neutral", "negative"]);

export const monthlyOutcomeItemSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  state: semanticStateSchema,
  explanation: z.string().trim().min(1).optional(),
  correctiveAction: z.string().trim().min(1).optional()
});

export const correctiveActionSchema = z.string().trim().min(1);

export const nextMonthPlanItemSchema = z.object({
  title: z.string().trim().min(1),
  detail: z.string().trim().min(1)
});

export const monthlyOutcomeItemsSchema = z.array(monthlyOutcomeItemSchema);
export const correctiveActionsSchema = z.array(correctiveActionSchema);
export const nextMonthPlanSchema = z.array(nextMonthPlanItemSchema);

export type MonthlyReviewContentRow = Readonly<{
  id: string;
  period_start: string;
  period_end: string;
  summary_approved: string | null;
  outcome_type: "positive" | "mixed" | "focus";
  outcome_items: unknown;
  corrective_actions: unknown;
  next_month_plan: unknown;
  status: string;
  approved_at: string | null;
  updated_at: string;
  approved_by_profile: {
    full_name: string;
  } | null;
}>;

export type ReportContentRow = Readonly<{
  id: string;
  period_start: string;
  period_end: string;
  status: "approved" | "generated" | "published";
  generated_at: string | null;
  published_at: string | null;
  created_at: string;
}>;

export type OptimizationContentRow = Readonly<{
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: "planned" | "in_progress" | "completed";
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}>;

export type ClientActionContentRow = Readonly<{
  id: string;
  title: string;
  description: string | null;
  priority: "urgent" | "recommended" | "opportunity";
  status: "open" | "in_progress" | "resolved" | "dismissed";
  affected_count: number | null;
}>;

export type MonthlyOverviewContentRows = Readonly<{
  monthlyReview: MonthlyReviewContentRow | null;
  reports: ReportContentRow[];
  optimizationItems: OptimizationContentRow[];
  clientActionItems: ClientActionContentRow[];
}>;

export type MonthlyOverviewContent = Readonly<{
  monthlySummary: MonthlySummary;
  monthlyOutcome: MonthlyOutcomeState;
  currentWork: CurrentWorkItem[];
  completedOptimizations: CompletedOptimizationItem[];
  clientActions: ClientActionItem[];
  nextMonthPlan: NextMonthPlanItem[];
  reports: ReportsViewModel;
}>;

const emptyMonthlySummary: MonthlySummary = {
  title: "Havi összefoglaló",
  text: "A kiválasztott projekthez még nincs jóváhagyott havi összefoglaló. Amint a KonverzióHuszár csapat publikálja, itt fog megjelenni.",
  status: "draft",
  statusLabel: "Még nincs publikálva",
  monthLabel: "Nincs publikált hónap",
  lastUpdatedLabel: "Frissítve: nincs adat",
  approvedByLabel: "Jóváhagyás: folyamatban"
};

const emptyMonthlyOutcome: MonthlyOutcomeState = {
  variant: "mixed",
  title: "Havi értékelés még nem elérhető",
  summary:
    "Ehhez a projekthez még nincs ügyféloldalon megjeleníthető, jóváhagyott havi értékelés.",
  items: [
    {
      label: "Adatállapot",
      value: "nincs publikált adat",
      state: "neutral"
    }
  ]
};

const emptyReports: ReportsViewModel = {
  title: "Havi riportok",
  history: []
};

export function createEmptyMonthlyOverviewContent(): MonthlyOverviewContent {
  return {
    monthlySummary: emptyMonthlySummary,
    monthlyOutcome: emptyMonthlyOutcome,
    currentWork: [],
    completedOptimizations: [],
    clientActions: [],
    nextMonthPlan: [],
    reports: emptyReports
  };
}

export function createMonthlyOverviewContent(
  rows: MonthlyOverviewContentRows
): MonthlyOverviewContent {
  const emptyContent = createEmptyMonthlyOverviewContent();

  return {
    monthlySummary: createMonthlySummary(rows.monthlyReview) ?? emptyContent.monthlySummary,
    monthlyOutcome: createMonthlyOutcome(rows.monthlyReview) ?? emptyContent.monthlyOutcome,
    currentWork: rows.optimizationItems
      .filter((item) => item.status === "planned" || item.status === "in_progress")
      .map(toCurrentWorkItem),
    completedOptimizations: rows.optimizationItems
      .filter((item) => item.status === "completed")
      .map(toCompletedOptimizationItem),
    clientActions: rows.clientActionItems.map(toClientActionItem),
    nextMonthPlan: createNextMonthPlan(rows.monthlyReview),
    reports: createReportsViewModel(rows.reports)
  };
}

function createMonthlySummary(row: MonthlyReviewContentRow | null): MonthlySummary | null {
  if (!isClientVisibleMonthlyReview(row)) {
    return null;
  }

  return {
    title: "Havi összefoglaló",
    text: row.summary_approved,
    status: "published",
    statusLabel: "Jóváhagyva és publikálva",
    monthLabel: formatMonthLabel(row.period_start),
    lastUpdatedLabel: `Frissítve: ${formatDateTimeLabel(row.updated_at)}`,
    approvedByLabel: `Jóváhagyta: ${row.approved_by_profile?.full_name ?? "KonverzióHuszár"}`
  };
}

function createMonthlyOutcome(row: MonthlyReviewContentRow | null): MonthlyOutcomeState | null {
  if (!isClientVisibleMonthlyReview(row)) {
    return null;
  }

  const outcomeItems = monthlyOutcomeItemsSchema.safeParse(row.outcome_items);
  const correctiveActions = correctiveActionsSchema.safeParse(row.corrective_actions);

  if (!outcomeItems.success) {
    return null;
  }

  const variant = row.outcome_type === "focus" ? "weak" : row.outcome_type;
  const focusAreas = variant === "weak" ? correctiveActions.data : undefined;

  return {
    variant,
    title: getMonthlyOutcomeTitle(variant),
    summary: row.summary_approved ?? "A havi eredmények ügyféloldali értékelése jóváhagyva.",
    items: outcomeItems.data,
    focusAreas,
    correctiveActions: variant === "weak" ? correctiveActions.data : undefined
  };
}

function createNextMonthPlan(row: MonthlyReviewContentRow | null): NextMonthPlanItem[] {
  if (!isClientVisibleMonthlyReview(row)) {
    return [];
  }

  const parsed = nextMonthPlanSchema.safeParse(row.next_month_plan);

  return parsed.success ? parsed.data : [];
}

function isClientVisibleMonthlyReview(
  row: MonthlyReviewContentRow | null
): row is MonthlyReviewContentRow & { summary_approved: string } {
  if (!row?.summary_approved) {
    return false;
  }

  return row.status === "approved" || row.status === "published";
}

function createReportsViewModel(rows: ReportContentRow[]): ReportsViewModel {
  const history = rows.map(toReportItem);

  return {
    title: "Havi riportok",
    latestReport: history[0],
    history: history.slice(1)
  };
}

function toCurrentWorkItem(row: OptimizationContentRow): CurrentWorkItem {
  return {
    title: row.title,
    description: row.description ?? "A részletek jóváhagyás után jelennek meg.",
    statusLabel: row.status === "planned" ? "Tervezve" : "Folyamatban",
    startedAtLabel: `Indítva: ${formatShortDateLabel(row.started_at ?? row.created_at)}`
  };
}

function toCompletedOptimizationItem(row: OptimizationContentRow): CompletedOptimizationItem {
  return {
    title: row.title,
    detail: row.description ?? "Az optimalizálás részletei jóváhagyva.",
    impactLabel: getOptimizationImpactLabel(row.category)
  };
}

function toClientActionItem(row: ClientActionContentRow): ClientActionItem {
  return {
    title: row.title,
    detail: row.description ?? createClientActionFallbackDetail(row),
    priority: row.priority,
    priorityLabel: getClientActionPriorityLabel(row.priority)
  };
}

function toReportItem(row: ReportContentRow): ReportItem {
  return {
    id: row.id,
    monthLabel: `${formatMonthName(row.period_start)} riport`,
    createdAtLabel: formatDateLabel(row.published_at ?? row.generated_at ?? row.created_at),
    status: row.status === "approved" ? "waiting_approval" : "published",
    statusLabel: getReportStatusLabel(row.status)
  };
}

function getMonthlyOutcomeTitle(variant: MonthlyOutcomeState["variant"]) {
  if (variant === "positive") {
    return "Ebben a hónapban elért eredmények";
  }

  if (variant === "weak") {
    return "Kiemelt fókuszterületek";
  }

  return "Fontos változások ebben a hónapban";
}

function getOptimizationImpactLabel(category: string) {
  const labels: Record<string, string> = {
    google_ads: "Google Ads",
    meta_ads: "Meta Ads",
    tiktok_ads: "TikTok Ads",
    merchant_center: "Merchant Center",
    measurement: "Mérés",
    reporting: "Riportolás",
    other: "Optimalizálás"
  };

  return labels[category] ?? "Optimalizálás";
}

function getClientActionPriorityLabel(priority: ClientActionItem["priority"]) {
  if (priority === "urgent") {
    return "Sürgős";
  }

  if (priority === "opportunity") {
    return "Fejlesztési lehetőség";
  }

  return "Javasolt";
}

function createClientActionFallbackDetail(row: ClientActionContentRow) {
  if (row.affected_count) {
    return `${row.affected_count} elem igényel ügyféloldali ellenőrzést.`;
  }

  return "Ügyféloldali ellenőrzést igényel.";
}

function getReportStatusLabel(status: ReportContentRow["status"]) {
  if (status === "approved") {
    return "Jóváhagyva";
  }

  if (status === "generated") {
    return "Generálva";
  }

  return "Elkészült";
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long"
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatMonthName(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "long"
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

function formatShortDateLabel(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "long",
    day: "numeric"
  }).format(new Date(value));
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
