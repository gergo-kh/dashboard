import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { PrintButton } from "./print-button";

type PageProps = {
  params: Promise<{ client: string; month: string }>;
};

type MetricObject = Record<string, unknown>;

type Campaign = {
  platform: string;
  campaign: string;
  spend: number;
  revenue: number;
  conversions: number;
  roas: number;
  assessment?: string;
};

function asObject(value: Json): MetricObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as MetricObject)
    : {};
}

function asNumber(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNestedNumber(object: MetricObject, path: string[], fallback = 0) {
  let current: unknown = object;
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return fallback;
    }
    current = (current as MetricObject)[key];
  }
  return asNumber(current, fallback);
}

function formatHuf(value: number) {
  return new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 0
  }).format(value) + " Ft";
}

function formatMillions(value: number) {
  return new Intl.NumberFormat("hu-HU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 1_000_000) + " M Ft";
}

function formatDecimal(value: number, digits = 2) {
  return new Intl.NumberFormat("hu-HU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatPct(value: number, digits = 1) {
  const prefix = value > 0 ? "▲ " : value < 0 ? "▼ " : "";
  return prefix + formatDecimal(Math.abs(value), digits) + "%";
}

function formatDate(dateValue: string | null, includeYear = true) {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("hu-HU", {
    year: includeYear ? "numeric" : undefined,
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function formatMonthLabel(reportMonth: string) {
  const [year, month] = reportMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    timeZone: "UTC"
  }).format(date);
}

function paragraphs(text: string | null) {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function deltaClass(value: number, lowerIsBetter = false) {
  if (value === 0) return "text-slate-500";
  const good = lowerIsBetter ? value < 0 : value > 0;
  return good ? "text-emerald-700" : "text-red-700";
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default async function ClientReportPage({ params }: PageProps) {
  const { client, month } = await params;
  const supabase = await createServerSupabaseClient();
  const [reportYear, reportMonthNumber] = month.split("-").map(Number);
  const priorYearMonth = `${reportYear - 1}-${String(reportMonthNumber).padStart(2, "0")}`;

  const [{ data: report, error }, { data: archive }, { data: priorYearReport }] = await Promise.all([
    supabase
      .from("client_reports")
      .select("*")
      .eq("client_slug", client)
      .eq("report_month", month)
      .maybeSingle(),
    supabase
      .from("client_reports")
      .select("report_month")
      .eq("client_slug", client)
      .order("report_month", { ascending: false }),
    supabase
      .from("client_reports")
      .select("report_month, combined, meta, google")
      .eq("client_slug", client)
      .eq("report_month", priorYearMonth)
      .maybeSingle()
  ]);

  if (error || !report) {
    notFound();
  }

  const combined = asObject(report.combined);
  const meta = asObject(report.meta);
  const google = asObject(report.google);
  const priorCombined = priorYearReport ? asObject(priorYearReport.combined) : {};
  const priorMeta = priorYearReport ? asObject(priorYearReport.meta) : {};
  const priorGoogle = priorYearReport ? asObject(priorYearReport.google) : {};
  const hasMeta = Object.keys(meta).length > 0;
  const hasGoogle = Object.keys(google).length > 0;
  const platformLabel = hasMeta && hasGoogle ? "Meta Ads + Google Ads" : hasMeta ? "Meta Ads" : "Google Ads";
  const metaPrevious = asObject(meta.previous as Json);
  const googlePrevious = asObject(google.previous as Json);
  const metaChange = asObject(meta.change_pct as Json);
  const googleChange = asObject(google.change_pct as Json);
  const combinedChange = asObject(combined.change_pct as Json);

  const campaignRows: Campaign[] = Array.isArray(report.campaigns)
    ? report.campaigns
        .map((item) => {
          const row = asObject(item);
          return {
            platform: asText(row.platform),
            campaign: asText(row.campaign),
            spend: asNumber(row.spend),
            revenue: asNumber(row.revenue),
            conversions: asNumber(row.conversions),
            roas: asNumber(row.roas),
            assessment: asText(row.assessment) || undefined
          };
        })
        .filter((row) => row.campaign)
    : [];

  const totalSpend = asNumber(combined.spend);
  const totalRevenue = asNumber(combined.attributed_value);
  const totalRoas = asNumber(combined.roas);
  const previousSpend = asNumber(combined.previous_spend);
  const previousRoas = asNumber(combined.previous_roas);

  const metaSpend = asNumber(meta.spend);
  const metaRevenue = asNumber(meta.revenue);
  const metaRoas = asNumber(meta.roas);
  const metaPurchases = asNumber(meta.purchases);
  const metaCpa = asNumber(meta.cpa);
  const metaCtr = asNumber(meta.ctr_pct);

  const googleSpend = asNumber(google.spend);
  const googleRevenue = asNumber(google.revenue);
  const googleRoas = asNumber(google.roas);
  const googleConversions = asNumber(google.conversions);
  const googleCpa = asNumber(google.cpa);
  const googleCtr = asNumber(google.ctr_pct);

  const archivedMonths = (archive ?? [])
    .map((item) => item.report_month)
    .filter((item) => item !== month);

  const priorTotalSpend = asNumber(priorCombined.spend);
  const priorTotalRevenue = asNumber(priorCombined.attributed_value);
  const priorTotalRoas = asNumber(priorCombined.roas);
  const yoySpend = priorYearReport ? percentChange(totalSpend, priorTotalSpend) : null;
  const yoyRevenue = priorYearReport ? percentChange(totalRevenue, priorTotalRevenue) : null;
  const yoyRoas = priorYearReport ? percentChange(totalRoas, priorTotalRoas) : null;
  const priorMetaRoas = asNumber(priorMeta.roas);
  const priorGoogleRoas = asNumber(priorGoogle.roas);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
        <header className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">
              KonverzióHuszár · PPC riport
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {report.client_name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {formatDate(report.period_start)}–{formatDate(report.period_end, false)} · összehasonlítás:{" "}
              {formatDate(report.comparison_start)}–{formatDate(report.comparison_end, false)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              {platformLabel}
            </div>
            <PrintButton />
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Összes hirdetési költés"
            value={formatHuf(totalSpend)}
            delta={formatPct(getNestedNumber(combinedChange, ["spend"])) + " vs. előző hónap"}
            deltaClass={deltaClass(getNestedNumber(combinedChange, ["spend"]))}
          />
          <KpiCard
            label="Attribútált bevétel"
            value={formatHuf(totalRevenue)}
            delta={formatPct(getNestedNumber(combinedChange, ["attributed_value"])) + " vs. előző hónap"}
            deltaClass={deltaClass(getNestedNumber(combinedChange, ["attributed_value"]))}
          />
          <KpiCard
            label="Összesített ROAS"
            value={formatDecimal(totalRoas) + "×"}
            delta={formatPct(getNestedNumber(combinedChange, ["roas"])) + " vs. előző hónap"}
            deltaClass={deltaClass(getNestedNumber(combinedChange, ["roas"]))}
          />
          <KpiCard
            label="Előző havi ROAS"
            value={formatDecimal(previousRoas) + "×"}
            delta={formatHuf(previousSpend) + " költés mellett"}
            deltaClass="text-slate-500"
          />
        </section>

        {(report.hero_title || report.hero_subtitle) && (
          <section className="mt-4 flex flex-col justify-between gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-white md:flex-row md:items-center">
            <strong className="text-base sm:text-lg">{report.hero_title}</strong>
            <span className="text-sm text-slate-300">{report.hero_subtitle}</span>
          </section>
        )}

        <section className={`mt-6 grid gap-4 ${hasMeta && hasGoogle ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          {hasMeta && (
            <PlatformCard
              title="Meta Ads"
              metrics={[
                ["Költés", formatHuf(metaSpend), getNestedNumber(metaChange, ["spend"]), false],
                ["Bevétel", formatMillions(metaRevenue), getNestedNumber(metaChange, ["revenue"]), false],
                ["ROAS", formatDecimal(metaRoas) + "×", getNestedNumber(metaChange, ["roas"]), false],
                ["Vásárlás", formatDecimal(metaPurchases, 0), getNestedNumber(metaChange, ["purchases"]), false],
                ["CPA", formatHuf(metaCpa), getNestedNumber(metaChange, ["cpa"]), true],
                ["CTR", formatDecimal(metaCtr) + "%", null, false]
              ]}
              ctrPrevious={getNestedNumber(metaPrevious, ["ctr_pct"], 0)}
            />
          )}
          {hasGoogle && (
            <PlatformCard
              title="Google Ads"
              metrics={[
                ["Költés", formatHuf(googleSpend), getNestedNumber(googleChange, ["spend"]), false],
                ["Konv. érték", formatMillions(googleRevenue), getNestedNumber(googleChange, ["revenue"]), false],
                ["ROAS", formatDecimal(googleRoas) + "×", getNestedNumber(googleChange, ["roas"]), false],
                ["Konverzió", formatDecimal(googleConversions, 1), getNestedNumber(googleChange, ["conversions"]), false],
                ["CPA", formatHuf(googleCpa), getNestedNumber(googleChange, ["cpa"]), true],
                ["CTR", formatDecimal(googleCtr) + "%", null, false]
              ]}
              ctrPrevious={getNestedNumber(googlePrevious, ["ctr_pct"], 0)}
            />
          )}
        </section>

        {priorYearReport && (
          <section className="mt-6">
            <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-black">Év/év összehasonlítás</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {formatMonthLabel(priorYearReport.report_month)} → {formatMonthLabel(report.report_month)}
                </p>
              </div>
              <a
                href={`/r/${client}/${priorYearReport.report_month}`}
                className="text-sm font-bold text-slate-600 hover:text-slate-950"
              >
                Tavalyi riport megnyitása →
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <YoyCard
                label="Hirdetési költés"
                current={formatHuf(totalSpend)}
                previous={formatHuf(priorTotalSpend)}
                change={yoySpend}
              />
              <YoyCard
                label="Attribútált bevétel"
                current={formatHuf(totalRevenue)}
                previous={formatHuf(priorTotalRevenue)}
                change={yoyRevenue}
              />
              <YoyCard
                label="Összesített ROAS"
                current={formatDecimal(totalRoas) + "×"}
                previous={formatDecimal(priorTotalRoas) + "×"}
                change={yoyRoas}
              />
            </div>
            {(priorMetaRoas > 0 || priorGoogleRoas > 0) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                {priorMetaRoas > 0 && metaRoas > 0 && (
                  <span className="rounded-full bg-white px-3 py-2 ring-1 ring-slate-200">
                    Meta ROAS: {formatDecimal(priorMetaRoas)}× → {formatDecimal(metaRoas)}×
                  </span>
                )}
                {priorGoogleRoas > 0 && googleRoas > 0 && (
                  <span className="rounded-full bg-white px-3 py-2 ring-1 ring-slate-200">
                    Google ROAS: {formatDecimal(priorGoogleRoas)}× → {formatDecimal(googleRoas)}×
                  </span>
                )}
              </div>
            )}
          </section>
        )}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-black">Havi értékelés + következő lépés</h2>
            <div className="space-y-2">
              {paragraphs(report.monthly_summary).map((paragraph, index, all) => (
                <div
                  key={paragraph}
                  className={
                    index === all.length - 1
                      ? "rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"
                      : "rounded-xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700"
                  }
                >
                  {index === all.length - 1 && (
                    <span className="font-black">Következő lépés: </span>
                  )}
                  {paragraph}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-black">⚔️ Huszár összefoglaló</h2>
            <div className="space-y-2">
              {report.what_went_well && (
                <Callout className="bg-emerald-50 text-emerald-900" label="🟢 Ami jól ment:">
                  {report.what_went_well}
                </Callout>
              )}
              {report.google_improvements && (
                <Callout className="bg-amber-50 text-amber-900" label="🟡 Amin javítunk a Google-ben:">
                  {report.google_improvements}
                </Callout>
              )}
              {report.facebook_improvements && (
                <Callout className="bg-slate-100 text-slate-700" label="🔵 Amin javítunk a Facebookon:">
                  {report.facebook_improvements}
                </Callout>
              )}
            </div>
          </div>
        </section>

        {campaignRows.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-xl font-black">Top kampányok – {formatMonthLabel(report.report_month)}</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-4 py-3 text-left">Kampány</th>
                    <th className="px-4 py-3 text-left">Platform</th>
                    <th className="px-4 py-3 text-right">Költés</th>
                    <th className="px-4 py-3 text-right">Bevétel / konv. érték</th>
                    <th className="px-4 py-3 text-right">ROAS</th>
                    <th className="px-4 py-3 text-right">Vásárlás / konv.</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignRows.map((campaign) => (
                    <tr key={campaign.platform + campaign.campaign} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium">{campaign.campaign}</td>
                      <td className="px-4 py-3">{campaign.platform}</td>
                      <td className="px-4 py-3 text-right">{formatHuf(campaign.spend)}</td>
                      <td className="px-4 py-3 text-right">{formatHuf(campaign.revenue)}</td>
                      <td className="px-4 py-3 text-right font-black">{formatDecimal(campaign.roas)}×</td>
                      <td className="px-4 py-3 text-right">
                        {formatDecimal(campaign.conversions, campaign.platform === "Meta" ? 0 : 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-3 text-xl font-black">Riportarchívum</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">Aktuális</div>
              <div className="mt-2 text-xl font-black">{formatMonthLabel(report.report_month)}</div>
              <div className="mt-1 text-sm font-bold text-emerald-700">Megnyitva</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">Archívum</div>
              {archivedMonths.length === 0 ? (
                <>
                  <div className="mt-2 text-xl font-black">Innen indul</div>
                  <div className="mt-1 text-sm text-slate-500">Korábbi webes riport még nincs eltárolva.</div>
                </>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {archivedMonths.map((archiveMonth) => (
                    <a
                      key={archiveMonth}
                      href={`/r/${client}/${archiveMonth}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"
                    >
                      {formatMonthLabel(archiveMonth)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {report.source_note && (
          <p className="mt-6 text-xs leading-5 text-slate-400">{report.source_note}</p>
        )}

        <footer className="mt-7 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row">
          <span>KonverzióHuszár</span>
          <span>Ügyfélriport · {formatMonthLabel(report.report_month)}</span>
        </footer>
      </div>
    </main>
  );
}

function KpiCard({
  label,
  value,
  delta,
  deltaClass
}: {
  label: string;
  value: string;
  delta: string;
  deltaClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
      <div className={`mt-1 text-sm font-bold ${deltaClass}`}>{delta}</div>
    </div>
  );
}

function YoyCard({
  label,
  current,
  previous,
  change
}: {
  label: string;
  current: string;
  previous: string;
  change: number | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight">{current}</div>
      <div className="mt-1 text-xs text-slate-500">tavaly: {previous}</div>
      <div className={`mt-2 text-sm font-bold ${change === null ? "text-slate-500" : deltaClass(change)}`}>
        {change === null ? "nincs összehasonlítható bázis" : `${formatPct(change)} év/év`}
      </div>
    </div>
  );
}

function PlatformCard({
  title,
  metrics,
  ctrPrevious
}: {
  title: string;
  metrics: Array<[string, string, number | null, boolean]>;
  ctrPrevious: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          Aktuális hónap
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map(([label, value, change, lowerIsBetter]) => (
          <div key={label} className="rounded-xl border border-slate-200 p-3">
            <div className="text-xs font-semibold text-slate-500">{label}</div>
            <div className="mt-1 text-xl font-black">{value}</div>
            {change === null ? (
              <div className="mt-1 text-xs font-bold text-slate-500">
                előző hó: {formatDecimal(ctrPrevious)}%
              </div>
            ) : (
              <div className={`mt-1 text-xs font-bold ${deltaClass(change, lowerIsBetter)}`}>
                {formatPct(change)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Callout({
  className,
  label,
  children
}: {
  className: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl px-4 py-3 text-sm leading-6 ${className}`}>
      <span className="font-black">{label} </span>
      {children}
    </div>
  );
}
