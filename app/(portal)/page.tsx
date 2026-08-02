import { requireCurrentUser } from "@/lib/auth/session";
import {
  ClientActionsCard,
  CompletedWorkCard,
  NextMonthPlanCard,
  WorkInProgressCard
} from "@/components/overview/action-cards";
import { AttentionProducts } from "@/components/overview/attention-products";
import { ChannelSummary } from "@/components/overview/channel-summary";
import { KpiGrid } from "@/components/overview/kpi-card";
import { MetricExplanationSheet } from "@/components/overview/metric-explanation-sheet";
import { MonthlyOutcomeCard } from "@/components/overview/monthly-outcome-card";
import { MonthlySummaryCard } from "@/components/overview/monthly-summary-card";
import { OverviewHeader } from "@/components/overview/overview-header";
import { PerformanceChart } from "@/components/overview/performance-chart";
import { ReportsCard } from "@/components/overview/reports-card";
import { EmptyState } from "@/components/ui/state";
import { createOverviewViewModel } from "@/lib/overview/static-data";

export default async function PortalHomePage() {
  const currentUser = await requireCurrentUser();
  const overview = createOverviewViewModel({
    profileName: currentUser.profile.full_name,
    role: currentUser.profile.role,
    projects: currentUser.projects
  });

  if (currentUser.projects.length === 0) {
    return (
      <section className="kh-overview-page" aria-labelledby="overview-title">
        <h1 id="overview-title">Marketing áttekintés</h1>
        <EmptyState
          description="A fiókodhoz még nincs elérhető projekt. Kérj segítséget a KonverzióHuszár csapattól."
          title="Nincs elérhető projekt"
        />
      </section>
    );
  }

  return (
    <div className="kh-overview-page">
      <OverviewHeader header={overview.header} />

      <div className="kh-overview-grid">
        <MonthlySummaryCard summary={overview.monthlySummary} />
        <MonthlyOutcomeCard outcome={overview.monthlyOutcome} />
      </div>

      <KpiGrid kpis={overview.kpis} />
      <MetricExplanationSheet explanation={overview.metricExplanation} />

      <div className="kh-overview-grid kh-overview-grid-balanced">
        <PerformanceChart chart={overview.performanceChart} />
        <ChannelSummary summary={overview.channelSummary} />
      </div>

      <section className="kh-actions-grid" aria-label="Munkák és teendők">
        <WorkInProgressCard items={overview.currentWork} />
        <CompletedWorkCard items={overview.completedOptimizations} />
        <ClientActionsCard items={overview.clientActions} />
        <NextMonthPlanCard items={overview.nextMonthPlan} />
      </section>

      <div className="kh-overview-grid kh-overview-grid-balanced">
        <ReportsCard reports={overview.reports} />
        <AttentionProducts products={overview.attentionProducts} />
      </div>
    </div>
  );
}
