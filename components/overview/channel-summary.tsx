import type { ChannelSummary as ChannelSummaryViewModel } from "@/types/overview";

type ChannelSummaryProps = Readonly<{
  summary: ChannelSummaryViewModel;
}>;

export function ChannelSummary({ summary }: ChannelSummaryProps) {
  return (
    <section className="kh-card kh-channel-card" aria-labelledby="channel-summary-title">
      <div className="kh-card-header-row">
        <div>
          <p className="kh-section-kicker">Csatornák</p>
          <h2 id="channel-summary-title">{summary.title}</h2>
        </div>
      </div>

      <div className="kh-channel-table" role="table" aria-label="Csatornák összefoglalója">
        <div className="kh-channel-row kh-channel-head" role="row">
          <span role="columnheader">Csatorna</span>
          <span role="columnheader">Státusz</span>
          <span role="columnheader">Költés</span>
          <span role="columnheader">Bevétel</span>
          <span role="columnheader">ROAS</span>
          <span role="columnheader">Költési arány</span>
        </div>
        {[...summary.rows, summary.totalRow].map((row) => (
          <div className={`kh-channel-row is-${row.status}`} key={row.channel} role="row">
            <span role="cell">
              <strong>{row.channel}</strong>
              {row.note ? <small>{row.note}</small> : null}
            </span>
            <span role="cell">
              <mark>{row.statusLabel}</mark>
            </span>
            <span role="cell">{row.spendLabel}</span>
            <span role="cell">{row.revenueLabel}</span>
            <span role="cell">{row.roasLabel}</span>
            <span role="cell">{row.spendShareLabel}</span>
          </div>
        ))}
      </div>

      <p className="kh-footnote">{summary.footnote}</p>
    </section>
  );
}
