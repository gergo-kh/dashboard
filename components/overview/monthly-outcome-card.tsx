import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import type { MonthlyOutcomeState, SemanticState } from "@/types/overview";

type MonthlyOutcomeCardProps = Readonly<{
  outcome: MonthlyOutcomeState;
}>;

function getOutcomeIcon(state: SemanticState) {
  if (state === "negative") {
    return AlertTriangle;
  }

  if (state === "positive") {
    return TrendingUp;
  }

  return CheckCircle2;
}

export function monthlyOutcomeHasCorrectiveActions(outcome: MonthlyOutcomeState) {
  return outcome.items.every((item) => {
    if (item.state !== "negative") {
      return true;
    }

    return Boolean(item.explanation || item.correctiveAction);
  });
}

export function weakOutcomeHasRequiredSections(outcome: MonthlyOutcomeState) {
  if (outcome.variant !== "weak") {
    return true;
  }

  return Boolean(outcome.focusAreas?.length && outcome.correctiveActions?.length);
}

export function MonthlyOutcomeCard({ outcome }: MonthlyOutcomeCardProps) {
  return (
    <article
      className={`kh-card kh-outcome-card kh-outcome-${outcome.variant}`}
      aria-labelledby="monthly-outcome-title"
    >
      <div className="kh-card-header-row">
        <div>
          <p className="kh-section-kicker">Havi állapot</p>
          <h2 id="monthly-outcome-title">{outcome.title}</h2>
        </div>
        <span className="kh-readonly-badge">Ügyféloldalon csak olvasható</span>
      </div>
      <p className="kh-muted-tight">{outcome.summary}</p>

      <div className="kh-outcome-grid">
        {outcome.items.map((item) => {
          const Icon = getOutcomeIcon(item.state);

          return (
            <section className={`kh-outcome-item is-${item.state}`} key={item.label}>
              <div>
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </div>
              <strong>{item.value}</strong>
              {item.explanation ? <p>{item.explanation}</p> : null}
              {item.correctiveAction ? <p>{item.correctiveAction}</p> : null}
            </section>
          );
        })}
      </div>

      {outcome.variant === "weak" ? (
        <div className="kh-weak-outcome-columns">
          <section>
            <h3>Kiemelt fókuszterületek</h3>
            <ul>
              {outcome.focusAreas?.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section>
            <h3>Mit teszünk a javítás érdekében?</h3>
            <ul>
              {outcome.correctiveActions?.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>
      ) : null}
    </article>
  );
}
