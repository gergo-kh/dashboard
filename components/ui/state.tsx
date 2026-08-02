import { AlertCircle, Inbox } from "lucide-react";

type SectionStateProps = Readonly<{
  title: string;
  description: string;
}>;

export function SectionSkeleton({ title, description }: SectionStateProps) {
  return (
    <div className="kh-state-card" aria-busy="true" aria-live="polite">
      <div className="kh-skeleton-line kh-skeleton-title" />
      <div className="kh-skeleton-line" />
      <div className="kh-skeleton-line kh-skeleton-short" />
      <span className="kh-sr-only">
        {title}: {description}
      </span>
    </div>
  );
}

export function EmptyState({ title, description }: SectionStateProps) {
  return (
    <div className="kh-state-card" role="status">
      <Inbox aria-hidden="true" size={22} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function ErrorState({ title, description }: SectionStateProps) {
  return (
    <div className="kh-state-card kh-state-card-error" role="alert">
      <AlertCircle aria-hidden="true" size={22} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
