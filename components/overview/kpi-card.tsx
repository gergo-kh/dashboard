import { Info, TrendingDown, TrendingUp } from "lucide-react";
import type { KpiCardViewModel } from "@/types/overview";

type KpiGridProps = Readonly<{
  kpis: KpiCardViewModel[];
}>;

function getTrendIcon(state: KpiCardViewModel["state"]) {
  if (state === "negative") {
    return TrendingDown;
  }

  return TrendingUp;
}

export function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <section className="kh-kpi-section" aria-labelledby="kpi-section-title">
      <div className="kh-section-heading-row">
        <div>
          <p className="kh-section-kicker">Fő mutatók</p>
          <h2 id="kpi-section-title">Marketing teljesítmény</h2>
        </div>
      </div>
      <div className="kh-kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </section>
  );
}

export function KpiCard({ kpi }: Readonly<{ kpi: KpiCardViewModel }>) {
  const TrendIcon = getTrendIcon(kpi.state);

  return (
    <article className={`kh-card kh-kpi-card is-${kpi.state}`}>
      <div className="kh-kpi-title-row">
        <h3>{kpi.title}</h3>
        <button className="kh-info-button" type="button" aria-label={`${kpi.title} magyarázat`}>
          <Info aria-hidden="true" size={16} />
          <span role="tooltip">{kpi.tooltip}</span>
        </button>
      </div>
      <strong>{kpi.currentValue}</strong>
      <div className="kh-kpi-comparison">
        <TrendIcon aria-hidden="true" size={17} />
        <span>{kpi.comparisonPercentage}</span>
        <small>{kpi.comparisonLabel}</small>
      </div>
      {kpi.supportingLabel ? <p>{kpi.supportingLabel}</p> : null}
    </article>
  );
}
