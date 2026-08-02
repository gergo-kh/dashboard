import { CheckCircle2 } from "lucide-react";
import type { MonthlySummary } from "@/types/overview";

type MonthlySummaryCardProps = Readonly<{
  summary: MonthlySummary;
}>;

export function MonthlySummaryCard({ summary }: MonthlySummaryCardProps) {
  return (
    <article className="kh-card kh-monthly-summary" aria-labelledby="monthly-summary-title">
      <div className="kh-card-header-row">
        <div>
          <p className="kh-section-kicker">{summary.monthLabel}</p>
          <h2 id="monthly-summary-title">{summary.title}</h2>
        </div>
        <span className="kh-status-badge kh-status-badge-success">
          <CheckCircle2 aria-hidden="true" size={16} />
          {summary.statusLabel}
        </span>
      </div>
      <p className="kh-summary-text">{summary.text}</p>
      <dl className="kh-meta-list" aria-label="Havi összefoglaló metaadatok">
        <div>
          <dt>Riport hónap</dt>
          <dd>{summary.monthLabel}</dd>
        </div>
        <div>
          <dt>Utolsó frissítés</dt>
          <dd>{summary.lastUpdatedLabel}</dd>
        </div>
        <div>
          <dt>Státusz</dt>
          <dd>{summary.approvedByLabel}</dd>
        </div>
      </dl>
    </article>
  );
}
