"use client";

import { Calculator, X } from "lucide-react";
import { useId, useState } from "react";
import type { MetricExplanation } from "@/types/overview";

type MetricExplanationSheetProps = Readonly<{
  explanation: MetricExplanation;
}>;

export function MetricExplanationSheet({ explanation }: MetricExplanationSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button className="kh-text-action" onClick={() => setIsOpen(true)} type="button">
        <Calculator aria-hidden="true" size={17} />
        Hogyan számoljuk ezeket a mutatókat?
      </button>

      {isOpen ? (
        <div className="kh-sheet-overlay" role="presentation">
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            className="kh-side-sheet"
            role="dialog"
          >
            <div className="kh-sheet-header">
              <h2 id={titleId}>Mutatók számítása</h2>
              <button
                aria-label="Mutató magyarázat bezárása"
                className="kh-icon-button"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <dl className="kh-explanation-list">
              <div>
                <dt>Adatforrás</dt>
                <dd>{explanation.dataSource}</dd>
              </div>
              <div>
                <dt>Képlet</dt>
                <dd>{explanation.formula}</dd>
              </div>
              <div>
                <dt>Miért térhet el a platformadat?</dt>
                <dd>{explanation.platformDifference}</dd>
              </div>
              <div>
                <dt>Attribúciós korlátok</dt>
                <dd>{explanation.attributionLimitations}</dd>
              </div>
              <div>
                <dt>Utolsó adatfrissítés</dt>
                <dd>{explanation.lastRefresh}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </>
  );
}
