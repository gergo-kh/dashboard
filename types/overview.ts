import type { AccessibleProject } from "@/lib/auth/session";
import type { MonthlyOverviewContent } from "@/lib/overview/monthly-content";

export type SemanticState = "positive" | "neutral" | "negative";
export type MonthlyOutcomeVariant = "positive" | "mixed" | "weak";
export type ChartDisplayState = "normal" | "loading" | "empty" | "error";
export type ComparisonOption = "previous_period" | "previous_month" | "previous_year";
export type DateRangeOption = "this_month" | "last_30_days" | "quarter";
export type ReportStatus = "draft" | "waiting_approval" | "published";
export type ClientActionPriority = "urgent" | "recommended" | "opportunity";
export type ChannelStatus = "active" | "attention" | "stable" | "source";
export type ChartGranularity = "daily" | "weekly" | "monthly";

export type ProjectSelectorItem = {
  id: string;
  name: string;
  clientName: string;
  marketLabel: string;
  isSelected: boolean;
  isAccessible: boolean;
};

export type OverviewHeaderViewModel = {
  title: string;
  subtitle: string;
  projectSelector: ProjectSelectorItem[];
  canSwitchProjects: boolean;
  projectSelectorHelp: string;
  selectedProjectName: string;
  selectedClientName: string;
  managementActivity: ManagementActivityStatus;
  dateRanges: DateRangeSelectorOption[];
  comparisons: ComparisonSelectorOption[];
  roasTarget: string;
  lastRefreshLabel: string;
};

export type ManagementActivityStatus = {
  label: string;
  lastOptimizationLabel: string;
  monthlyOptimizationCount: number;
  state: "active" | "paused";
};

export type DateRangeSelectorOption = {
  value: DateRangeOption;
  label: string;
  isSelected: boolean;
};

export type ComparisonSelectorOption = {
  value: ComparisonOption;
  label: string;
  isSelected: boolean;
};

export type MonthlySummary = {
  title: string;
  text: string;
  status: ReportStatus;
  statusLabel: string;
  monthLabel: string;
  lastUpdatedLabel: string;
  approvedByLabel: string;
};

export type MonthlyOutcomeItem = {
  label: string;
  value: string;
  state: SemanticState;
  explanation?: string;
  correctiveAction?: string;
};

export type MonthlyOutcomeState = {
  variant: MonthlyOutcomeVariant;
  title: string;
  summary: string;
  items: MonthlyOutcomeItem[];
  focusAreas?: string[];
  correctiveActions?: string[];
};

export type KpiCardViewModel = {
  id: string;
  title: string;
  currentValue: string;
  comparisonPercentage: string;
  comparisonLabel: string;
  state: SemanticState;
  tooltip: string;
  supportingLabel?: string;
};

export type ChartSeriesPoint = {
  label: string;
  revenue: number;
  spend: number;
  roas: number;
};

export type ChartIntervalOption = {
  value: ChartGranularity;
  label: string;
  summary: string;
  series: ChartSeriesPoint[];
};

export type PerformanceChartViewModel = {
  title: string;
  state: ChartDisplayState;
  granularity: ChartGranularity;
  series: ChartSeriesPoint[];
  intervals: ChartIntervalOption[];
  summary: string;
  emptyMessage: string;
  errorMessage: string;
};

export type ChannelSummaryRow = {
  channel: string;
  status: ChannelStatus;
  statusLabel: string;
  spendLabel: string;
  revenueLabel: string;
  roasLabel: string;
  spendShareLabel: string;
  note?: string;
};

export type ChannelSummary = {
  title: string;
  rows: ChannelSummaryRow[];
  totalRow: ChannelSummaryRow;
  footnote: string;
};

export type CurrentWorkItem = {
  title: string;
  description: string;
  statusLabel: string;
  startedAtLabel: string;
};

export type CompletedOptimizationItem = {
  title: string;
  detail: string;
  impactLabel: string;
};

export type ClientActionItem = {
  title: string;
  detail: string;
  priority: ClientActionPriority;
  priorityLabel: string;
};

export type NextMonthPlanItem = {
  title: string;
  detail: string;
};

export type ReportItem = {
  id: string;
  monthLabel: string;
  createdAtLabel: string;
  status: ReportStatus;
  statusLabel: string;
};

export type ReportsViewModel = {
  title: string;
  latestReport?: ReportItem;
  history: ReportItem[];
};

export type AttentionProductIssue =
  | "low_efficiency"
  | "high_spend_low_purchase"
  | "missing_gtin"
  | "poor_feed_quality"
  | "disapproved";

export type AttentionProduct = {
  id: string;
  name: string;
  sku: string;
  spendLabel: string;
  revenueLabel: string;
  roasLabel: string;
  issue: AttentionProductIssue;
  issueLabel: string;
  detail: string;
};

export type MetricExplanation = {
  dataSource: string;
  formula: string;
  platformDifference: string;
  attributionLimitations: string;
  lastRefresh: string;
};

export type OverviewMetricsContent = Readonly<{
  dateRangeLabel: string;
  comparisonRangeLabel: string;
  lastRefreshLabel: string;
  kpis: KpiCardViewModel[];
  metricExplanation: MetricExplanation;
  performanceChart: PerformanceChartViewModel;
  channelSummary: ChannelSummary;
}>;

export type PortalShellViewModel = {
  userName: string;
  roleLabel: string;
  selectedClientName: string;
  selectedProjectName: string;
  ppcManagerName: string;
  currentReport: ReportItem;
  accessibleProjectCount: number;
};

export type OverviewViewModel = {
  header: OverviewHeaderViewModel;
  monthlySummary: MonthlySummary;
  monthlyOutcome: MonthlyOutcomeState;
  kpis: KpiCardViewModel[];
  metricExplanation: MetricExplanation;
  performanceChart: PerformanceChartViewModel;
  channelSummary: ChannelSummary;
  currentWork: CurrentWorkItem[];
  completedOptimizations: CompletedOptimizationItem[];
  clientActions: ClientActionItem[];
  nextMonthPlan: NextMonthPlanItem[];
  reports: ReportsViewModel;
  attentionProducts: AttentionProduct[];
};

export type OverviewDataContext = {
  profileName: string;
  role: "agency_admin" | "client_user";
  projects: AccessibleProject[];
  selectedProject: AccessibleProject | null;
  monthlyContent: MonthlyOverviewContent | null;
  metricsContent: OverviewMetricsContent | null;
  merchantContent: AttentionProduct[] | null;
};
