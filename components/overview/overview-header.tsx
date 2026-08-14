import { Bot, Download, Radio, Target } from "lucide-react";
import { ProjectSelectorControl } from "@/components/overview/project-selector-control";
import type { OverviewHeaderViewModel } from "@/types/overview";

type OverviewHeaderProps = Readonly<{
  header: OverviewHeaderViewModel;
}>;

export function OverviewHeader({ header }: OverviewHeaderProps) {
  const selectedDateRange = header.dateRanges.find((item) => item.isSelected);
  const selectedComparison = header.comparisons.find((item) => item.isSelected);

  return (
    <header className="kh-overview-header">
      <div className="kh-overview-title-block">
        <p className="kh-eyebrow">Marketing áttekintés</p>
        <h1>{header.title}</h1>
        <p>{header.subtitle}</p>
      </div>

      <div className="kh-header-controls" aria-label="Áttekintés vezérlők">
        <ProjectSelectorControl
          canSwitchProjects={header.canSwitchProjects}
          helpText={header.projectSelectorHelp}
          projects={header.projectSelector}
        />

        <label className="kh-control-field">
          Időszak
          <select
            aria-describedby="date-range-help"
            aria-label="Időszak kiválasztása"
            defaultValue={selectedDateRange?.value}
            disabled
          >
            {header.dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <span className="kh-control-help" id="date-range-help">
            A statikus előnézet a jóváhagyott júliusi időszakot mutatja.
          </span>
        </label>

        <label className="kh-control-field">
          Összehasonlítás
          <select
            aria-describedby="comparison-help"
            aria-label="Összehasonlítás kiválasztása"
            defaultValue={selectedComparison?.value}
            disabled
          >
            {header.comparisons.map((comparison) => (
              <option key={comparison.value} value={comparison.value}>
                {comparison.label}
              </option>
            ))}
          </select>
          <span className="kh-control-help" id="comparison-help">
            Az összehasonlítási váltás live adatokkal kapcsolódik be.
          </span>
        </label>
      </div>

      <section className="kh-management-strip" aria-label="Aktív kezelés státusza">
        <div className="kh-status-pill kh-status-pill-active">
          <Radio aria-hidden="true" size={17} />
          <strong>{header.managementActivity.label}</strong>
        </div>
        <span>{header.managementActivity.lastOptimizationLabel}</span>
        <span>Ebben a hónapban: {header.managementActivity.monthlyOptimizationCount} optimalizálás</span>
        <span className="kh-target-pill">
          <Target aria-hidden="true" size={16} />
          {header.roasTarget}
        </span>
      </section>

      <div className="kh-header-actions" aria-label="Oldalszintű műveletek">
        <button
          aria-describedby="ai-disabled-help"
          className="kh-button kh-button-muted"
          disabled
          title="Az AI kérdező funkció a későbbi fázisban lesz elérhető"
          type="button"
        >
          <Bot aria-hidden="true" size={17} />
          Kérdezd az AI-t{" "}
          <span>Hamarosan</span>
        </button>
        <span className="kh-sr-only" id="ai-disabled-help">
          Az AI kérdező funkció a későbbi fázisban lesz elérhető.
        </span>

        <button
          aria-describedby="download-disabled-help"
          className="kh-button kh-button-outline"
          disabled
          title="A PDF riport letöltése a riport generálási fázisban készül el"
          type="button"
        >
          <Download aria-hidden="true" size={17} />
          Riport letöltése
        </button>
        <span className="kh-sr-only" id="download-disabled-help">
          A PDF riport letöltése a riport generálási fázisban készül el.
        </span>
        <p className="kh-disabled-note">
          Az AI kérdezés és a PDF letöltés a későbbi fázisban lesz elérhető.
        </p>
      </div>
    </header>
  );
}
