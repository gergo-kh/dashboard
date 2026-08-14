"use client";

import { CheckCircle2, ExternalLink, ListChecks, Target, X } from "lucide-react";
import { useId, useState } from "react";
import { useDialogBehavior } from "@/components/ui/use-dialog-behavior";
import type {
  ClientActionItem,
  CompletedOptimizationItem,
  CurrentWorkItem,
  NextMonthPlanItem
} from "@/types/overview";

type WorkInProgressCardProps = Readonly<{
  items: CurrentWorkItem[];
}>;

type CompletedWorkCardProps = Readonly<{
  items: CompletedOptimizationItem[];
}>;

type ClientActionsCardProps = Readonly<{
  items: ClientActionItem[];
}>;

type NextMonthPlanCardProps = Readonly<{
  items: NextMonthPlanItem[];
}>;

export function WorkInProgressCard({ items }: WorkInProgressCardProps) {
  if (items.length === 0) {
    return (
      <article className="kh-card kh-action-card">
        <CardTitle kicker="Aktuális munka" title="Min dolgozunk most?" />
        <p className="kh-muted-tight">
          Most nincs ügyféloldalon megjeleníthető aktuális munka ehhez a projekthez.
        </p>
      </article>
    );
  }

  return (
    <article className="kh-card kh-action-card">
      <CardTitle kicker="Aktuális munka" title="Min dolgozunk most?" />
      <ul className="kh-action-list">
        {items.map((item) => (
          <li key={item.title}>
            <CheckCircle2 aria-hidden="true" size={18} />
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <span>{item.statusLabel} · {item.startedAtLabel}</span>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function CompletedWorkCard({ items }: CompletedWorkCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const { closeDialog, dialogRef, triggerRef } = useDialogBehavior({
    isOpen,
    onClose: () => setIsOpen(false)
  });
  const visibleItems = items.slice(0, 6);
  const hiddenCount = 12;

  if (items.length === 0) {
    return (
      <article className="kh-card kh-action-card">
        <CardTitle kicker="Elvégzett munka" title="Mit csináltunk ebben a hónapban?" />
        <p className="kh-muted-tight">
          Ehhez a projekthez még nincs publikált elvégzett optimalizálás.
        </p>
      </article>
    );
  }

  return (
    <article className="kh-card kh-action-card">
      <CardTitle kicker="Elvégzett munka" title="Mit csináltunk ebben a hónapban?" />
      <ul className="kh-compact-list">
        {visibleItems.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.impactLabel}</span>
          </li>
        ))}
      </ul>
      <button
        className="kh-text-action"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <ListChecks aria-hidden="true" size={17} />+ {hiddenCount} további optimalizálás megtekintése
      </button>

      {isOpen ? (
        <div className="kh-sheet-overlay" role="presentation">
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            className="kh-side-sheet"
            ref={dialogRef}
            role="dialog"
          >
            <div className="kh-sheet-header">
              <h2 id={titleId}>Elvégzett optimalizálások</h2>
              <button
                aria-label="Optimalizálások ablak bezárása"
                className="kh-icon-button"
                onClick={closeDialog}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <ul className="kh-dialog-list">
              {items.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <span>{item.impactLabel}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </article>
  );
}

export function ClientActionsCard({ items }: ClientActionsCardProps) {
  if (items.length === 0) {
    return (
      <article className="kh-card kh-action-card">
        <CardTitle kicker="Ügyfél feladatok" title="Mit kell neked megcsinálnod?" />
        <p className="kh-muted-tight">Most nincs ügyféloldali teendő.</p>
      </article>
    );
  }

  return (
    <article className="kh-card kh-action-card">
      <CardTitle kicker="Ügyfél feladatok" title="Mit kell neked megcsinálnod?" />
      <ul className="kh-client-action-list">
        {items.map((item) => (
          <li className={`priority-${item.priority}`} key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.priorityLabel}</span>
            <p>{item.detail}</p>
          </li>
        ))}
      </ul>
      <button
        aria-describedby="merchant-disabled-help"
        className="kh-button kh-button-outline"
        disabled
        title="Merchant Center mélylink a későbbi integrációs fázisban lesz elérhető"
        type="button"
      >
        <ExternalLink aria-hidden="true" size={17} />
        Merchant Center megnyitása
      </button>
      <span className="kh-sr-only" id="merchant-disabled-help">
        Merchant Center mélylink a későbbi integrációs fázisban lesz elérhető.
      </span>
      <p className="kh-disabled-note">
        A Merchant Center megnyitása a későbbi integrációs fázisban lesz aktív.
      </p>
    </article>
  );
}

export function NextMonthPlanCard({ items }: NextMonthPlanCardProps) {
  if (items.length === 0) {
    return (
      <article className="kh-card kh-action-card">
        <CardTitle kicker="Terv" title="Következő havi terv" />
        <p className="kh-muted-tight">A következő havi terv még nincs publikálva.</p>
      </article>
    );
  }

  return (
    <article className="kh-card kh-action-card">
      <CardTitle kicker="Terv" title="Következő havi terv" />
      <ul className="kh-action-list">
        {items.map((item) => (
          <li key={item.title}>
            <Target aria-hidden="true" size={18} />
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function CardTitle({ kicker, title }: Readonly<{ kicker: string; title: string }>) {
  return (
    <div className="kh-card-title-block">
      <p className="kh-section-kicker">{kicker}</p>
      <h2>{title}</h2>
    </div>
  );
}
