import { Download, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/state";
import type { ReportsViewModel } from "@/types/overview";

type ReportsCardProps = Readonly<{
  reports: ReportsViewModel;
}>;

export function ReportsCard({ reports }: ReportsCardProps) {
  if (!reports.latestReport) {
    return (
      <section className="kh-card" aria-labelledby="reports-title">
        <h2 id="reports-title">{reports.title}</h2>
        <EmptyState
          description="A kiválasztott projekthez még nincs aktuális riport."
          title="Nincs aktuális riport"
        />
      </section>
    );
  }

  return (
    <section className="kh-card kh-reports-card" aria-labelledby="reports-title">
      <div className="kh-card-header-row">
        <div>
          <p className="kh-section-kicker">Riport archívum</p>
          <h2 id="reports-title">{reports.title}</h2>
        </div>
        <span className="kh-status-badge kh-status-badge-success">
          <FileText aria-hidden="true" size={16} />
          {reports.latestReport.statusLabel}
        </span>
      </div>

      <div className="kh-latest-report">
        <strong>{reports.latestReport.monthLabel}</strong>
        <span>Létrehozva: {reports.latestReport.createdAtLabel}</span>
        <button
          aria-describedby="pdf-disabled-help"
          className="kh-button kh-button-outline"
          disabled
          title="PDF generálás ebben a fázisban még nincs"
          type="button"
        >
          <Download aria-hidden="true" size={17} />
          PDF letöltése
        </button>
        <span className="kh-sr-only" id="pdf-disabled-help">
          PDF generálás ebben a fázisban még nincs.
        </span>
      </div>

      <ul className="kh-report-history" aria-label="Korábbi riportok">
        {reports.history.map((report) => (
          <li key={report.id}>
            <span>{report.monthLabel}</span>
            <small>{report.createdAtLabel}</small>
            <strong>{report.statusLabel}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
