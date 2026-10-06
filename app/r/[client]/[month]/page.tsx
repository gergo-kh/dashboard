import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Layers,
  Megaphone,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildReportAnalysis } from "@/lib/reports/analysis";
import type { Json } from "@/types/database";
import { PrintButton } from "./print-button";
import { TrendChart } from "./report-charts";

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
};

type ActivityEntry = {
  name?: string;
  label?: string;
  count: number;
};

function asObject(value: Json): MetricObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as MetricObject)
    : {};
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asActivityEntries(value: unknown): ActivityEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item && typeof item === "object" && !Array.isArray(item)
        ? (item as MetricObject)
        : {};
      return {
        name: asText(row.name),
        label: asText(row.label),
        count: asNumber(row.count)
      };
    })
    .filter((item) => item.count > 0);
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
  return (
    new Intl.NumberFormat("hu-HU", {
      maximumFractionDigits: 0
    }).format(value) + " Ft"
  );
}

function formatCompactHuf(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return (
      new Intl.NumberFormat("hu-HU", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
      }).format(value / 1_000_000) + " M"
    );
  }
  if (Math.abs(value) >= 1_000) {
    return (
      new Intl.NumberFormat("hu-HU", {
        maximumFractionDigits: 0
      }).format(value / 1_000) + " e"
    );
  }
  return new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(value);
}

function formatDecimal(value: number, digits = 2) {
  return new Intl.NumberFormat("hu-HU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatPct(value: number, digits = 1) {
  const prefix = value > 0 ? "+" : value < 0 ? "−" : "";
  return prefix + formatDecimal(Math.abs(value), digits) + "%";
}

function formatShortDate(dateValue: string | null) {
  if (!dateValue) return "";
  return dateValue.replaceAll("-", ".");
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

function formatShortMonth(reportMonth: string) {
  const [year, month] = reportMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const label = new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    timeZone: "UTC"
  })
    .format(date)
    .replace(".", "");
  return `${year} ${label}`;
}

function paragraphs(text: string | null) {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sentences(text: string | null) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pctChange(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function goodDelta(value: number | null, lowerIsBetter = false) {
  if (value === null || value === 0) return "neutral";
  const positive = lowerIsBetter ? value < 0 : value > 0;
  return positive ? "good" : "bad";
}

export default async function ClientReportPage({ params }: PageProps) {
  const { client, month } = await params;
  const supabase = await createServerSupabaseClient();
  const [reportYear, reportMonthNumber] = month.split("-").map(Number);
  const priorYearMonth = `${reportYear - 1}-${String(reportMonthNumber).padStart(2, "0")}`;

  const [{ data: report, error }, { data: archive }, { data: priorYearReport }] =
    await Promise.all([
      supabase
        .from("client_reports")
        .select("*")
        .eq("client_slug", client)
        .eq("report_month", month)
        .maybeSingle(),
      supabase
        .from("client_reports")
        .select("report_month, combined, meta, google")
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

  const historyRows = (archive ?? []).map((item) => ({
    report_month: item.report_month,
    combined: item.combined,
    meta: item.meta,
    google: item.google
  }));

  const analysis = buildReportAnalysis(
    {
      report_month: report.report_month,
      combined: report.combined,
      meta: report.meta,
      google: report.google
    },
    historyRows
  );

  const combined = asObject(report.combined);
  const meta = asObject(report.meta);
  const google = asObject(report.google);
  const accountActivity = asObject(report.account_activity);
  const metaActivity = asObject(accountActivity.meta as Json);
  const googleActivity = asObject(accountActivity.google as Json);
  const metaPrevious = asObject(meta.previous as Json);
  const googlePrevious = asObject(google.previous as Json);
  const metaChange = asObject(meta.change_pct as Json);
  const googleChange = asObject(google.change_pct as Json);
  const combinedChange = asObject(combined.change_pct as Json);

  const metaActivityTotal = asNumber(metaActivity.total);
  const googleActivityTotal = asNumber(googleActivity.total);
  const manualActivityTotal =
    asNumber(accountActivity.total_manual_actions) || metaActivityTotal + googleActivityTotal;
  const metaActivityActions = asActivityEntries(metaActivity.top_actions);
  const googleActivityActions = asActivityEntries(googleActivity.top_actions);
  const metaActivityActors = asActivityEntries(metaActivity.actors);
  const activityNote = asText(accountActivity.note);
  const googleActivityPartial = googleActivity.partial === true;

  const hasMeta =
    asNumber(meta.spend) > 0 ||
    asNumber(meta.impressions) > 0 ||
    asNumber(meta.revenue) > 0;
  const hasGoogle =
    asNumber(google.spend) > 0 ||
    asNumber(google.impressions) > 0 ||
    asNumber(google.revenue) > 0;

  const totalSpend = asNumber(combined.spend);
  const totalRevenue = asNumber(combined.attributed_value);
  const totalRoas = asNumber(combined.roas);

  const metaSpend = asNumber(meta.spend);
  const metaRevenue = asNumber(meta.revenue);
  const metaRoas = asNumber(meta.roas);
  const metaPurchases = asNumber(meta.purchases);

  const googleSpend = asNumber(google.spend);
  const googleRevenue = asNumber(google.revenue);
  const googleRoas = asNumber(google.roas);
  const googleConversions = asNumber(google.conversions);

  const currentActions = metaPurchases + googleConversions;
  const previousActions =
    asNumber(metaPrevious.purchases) + asNumber(googlePrevious.conversions);
  const actionMom = pctChange(currentActions, previousActions);

  const priorCombined = priorYearReport ? asObject(priorYearReport.combined) : {};
  const priorMeta = priorYearReport ? asObject(priorYearReport.meta) : {};
  const priorGoogle = priorYearReport ? asObject(priorYearReport.google) : {};

  const priorTotalSpend = asNumber(priorCombined.spend);
  const priorTotalRevenue = asNumber(priorCombined.attributed_value);
  const priorTotalRoas = asNumber(priorCombined.roas);
  const priorActions =
    asNumber(priorMeta.purchases) + asNumber(priorGoogle.conversions);
  const actionYoy = analysis.yoy.combined.comparable
    ? pctChange(currentActions, priorActions)
    : null;

  const allMonths = (archive ?? [])
    .map((item) => item.report_month)
    .filter(Boolean)
    .sort();
  const currentIndex = allMonths.indexOf(month);
  const previousMonth = currentIndex > 0 ? allMonths[currentIndex - 1] : null;
  const nextMonth =
    currentIndex >= 0 && currentIndex < allMonths.length - 1
      ? allMonths[currentIndex + 1]
      : null;

  const trendData = [...(archive ?? [])]
    .sort((a, b) => a.report_month.localeCompare(b.report_month))
    .slice(-12)
    .map((item) => {
      const row = asObject(item.combined);
      return {
        month: formatShortMonth(item.report_month),
        spend: asNumber(row.spend),
        value: asNumber(row.attributed_value),
        roas: asNumber(row.roas)
      };
    });

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
            roas: asNumber(row.roas)
          };
        })
        .filter((row) => row.campaign)
    : [];

  const goodItems = sentences(report.what_went_well);
  const improveItems = [
    ...sentences(report.google_improvements),
    ...sentences(report.facebook_improvements)
  ];

  const focusItems = [
    ...(hasMeta
      ? [
          {
            title: "Új kreatívok tesztelése",
            subtitle: "nyerő irányok új változatai",
            icon: <Megaphone className="h-5 w-5" />
          },
          {
            title: "Nyerők iterálása",
            subtitle: "gyenge hirdetések gyors lekapcsolása",
            icon: <RefreshCw className="h-5 w-5" />
          }
        ]
      : []),
    ...(hasGoogle
      ? [
          {
            title: "Termékoptimalizálás",
            subtitle: "keret a jobban termelő termékekre",
            icon: <Layers className="h-5 w-5" />
          },
          {
            title: "Kulcsszóoptimalizálás",
            subtitle: "gyenge keresések kiszűrése",
            icon: <Search className="h-5 w-5" />
          }
        ]
      : [])
  ].slice(0, 4);

  return (
    <main className="min-h-screen bg-[#f6f9fc] text-[#0d1b3e] print:bg-white">
      <div className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8 print:max-w-none print:p-0">
        <header className="rounded-[22px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.045)] print:shadow-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Image
                src="/kh-logo.svg"
                alt="KonverzióHuszár"
                width={242}
                height={44}
                priority
                unoptimized
                className="h-auto w-[185px] shrink-0 sm:w-[220px]"
              />
              <div className="hidden h-8 w-px bg-slate-200 sm:block" />
              <h1 className="truncate text-2xl font-black tracking-tight text-[#0b1739] sm:text-3xl">
                {report.client_name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
                {previousMonth ? (
                  <a
                    href={`/r/${client}/${previousMonth}`}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                    aria-label="Előző riport"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="p-2 text-slate-300">
                    <ChevronLeft className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-[190px] px-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm font-black text-[#0b1739]">
                    <CalendarDays className="h-4 w-4" />
                    {formatMonthLabel(report.report_month)}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-slate-400">
                    {formatShortDate(report.period_start)} – {formatShortDate(report.period_end)}
                  </div>
                </div>
                {nextMonth ? (
                  <a
                    href={`/r/${client}/${nextMonth}`}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                    aria-label="Következő riport"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="p-2 text-slate-300">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
              <PrintButton />
            </div>
          </div>
        </header>

        <section
          id="overview"
          className="mt-5 scroll-mt-4 rounded-[24px] border border-emerald-100/70 bg-gradient-to-br from-[#f4fbf8] via-white to-[#f3f8ff] p-4 shadow-[0_12px_38px_rgba(15,23,42,0.04)] sm:p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-[#0b1739]">
              Fő mutatók – {formatMonthLabel(report.report_month)}
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={<Wallet className="h-5 w-5" />}
              iconClass="bg-blue-50 text-blue-600"
              label="Költés"
              value={formatHuf(totalSpend)}
              mom={getNestedNumber(combinedChange, ["spend"])}
              yoy={analysis.yoy.combined.spendPct}
              lowerIsBetter={false}
            />
            <KpiCard
              icon={<TrendingUp className="h-5 w-5" />}
              iconClass="bg-emerald-50 text-emerald-600"
              label="Attribútált bevétel"
              value={formatHuf(totalRevenue)}
              mom={getNestedNumber(combinedChange, ["attributed_value"])}
              yoy={analysis.yoy.combined.valuePct}
            />
            <KpiCard
              icon={<Target className="h-5 w-5" />}
              iconClass="bg-emerald-50 text-emerald-600"
              label="ROAS"
              value={formatDecimal(totalRoas) + "×"}
              mom={getNestedNumber(combinedChange, ["roas"])}
              yoy={analysis.yoy.combined.roasPct}
            />
            <KpiCard
              icon={<ShoppingCart className="h-5 w-5" />}
              iconClass="bg-emerald-50 text-emerald-600"
              label="Vásárlások / konv."
              value={formatDecimal(currentActions, currentActions % 1 === 0 ? 0 : 1)}
              mom={actionMom}
              yoy={actionYoy}
            />
          </div>
        </section>

        <section id="analysis" className="mt-4 grid scroll-mt-4 gap-4 lg:grid-cols-2">
          <Panel
            title="Fiókkezelési aktivitás"
            icon={<Activity className="h-5 w-5" />}
            iconClass="bg-violet-50 text-violet-600"
            panelClass="bg-gradient-to-br from-white to-violet-50/50"
          >
            {manualActivityTotal > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <ActivityStat label="Összes művelet" value={manualActivityTotal} emphasis />
                  <ActivityStat label="Meta" value={metaActivityTotal} />
                  <ActivityStat
                    label={googleActivityPartial ? "Google*" : "Google"}
                    value={googleActivityTotal}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {metaActivityActions.length > 0 && (
                    <ActivityActions
                      title="Meta"
                      badgeClass="bg-blue-600 text-white"
                      actions={metaActivityActions.slice(0, 4)}
                    />
                  )}
                  {googleActivityActions.length > 0 && (
                    <ActivityActions
                      title="Google"
                      badgeClass="bg-white text-blue-600 ring-1 ring-slate-200"
                      actions={googleActivityActions.slice(0, 4)}
                    />
                  )}
                </div>

                {metaActivityActors.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-violet-100">
                    <Users className="h-4 w-4 text-violet-500" />
                    <span className="text-xs font-bold text-slate-500">Közreműködők:</span>
                    {metaActivityActors.map((actor) => (
                      <span
                        key={actor.name}
                        className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700"
                      >
                        {actor.name}: {actor.count}
                      </span>
                    ))}
                  </div>
                )}

                {activityNote && (
                  <p className="mt-3 text-[11px] leading-5 text-slate-400">{activityNote}</p>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                Ehhez a hónaphoz még nincs részletes fiókkezelési aktivitás betöltve.
              </div>
            )}
          </Panel>

          <Panel
            title="Havi értékelés"
            icon={<Target className="h-5 w-5" />}
            iconClass="bg-blue-50 text-blue-600"
            panelClass="bg-gradient-to-br from-white to-blue-50/70"
          >
            <div className="space-y-3">
              {paragraphs(report.monthly_summary).map((paragraph) => (
                <p key={paragraph} className="text-sm leading-6 text-slate-650">
                  {paragraph}
                </p>
              ))}
            </div>
            {analysis.seasonality.available && (
              <div className="mt-4 flex gap-3 rounded-xl bg-blue-100/60 px-4 py-3 text-sm leading-6 text-blue-900">
                <div className="mt-0.5 shrink-0 rounded-full bg-blue-600 p-1 text-white">
                  <span className="block h-3 w-3 text-center text-[9px] font-black leading-3">i</span>
                </div>
                <span>{analysis.seasonality.label}</span>
              </div>
            )}
          </Panel>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel
            title="Mi ment jól?"
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconClass="bg-emerald-500 text-white"
          >
            <BulletList items={goodItems} tone="good" />
          </Panel>

          <Panel
            title="Amin javítunk"
            icon={<AlertTriangle className="h-5 w-5" />}
            iconClass="bg-orange-500 text-white"
            panelClass="bg-gradient-to-br from-white to-orange-50/50"
          >
            <BulletList items={improveItems} tone="warning" />
          </Panel>
        </section>

        {focusItems.length > 0 && (
          <section className="mt-4 rounded-[22px] border border-violet-100 bg-gradient-to-r from-[#faf8ff] to-[#f6f2ff] p-4 shadow-[0_10px_30px_rgba(124,58,237,0.05)]">
            <div className="mb-3 flex items-center gap-2 text-violet-700">
              <Rocket className="h-5 w-5" />
              <h2 className="text-lg font-black">Következő havi fókusz</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {focusItems.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-xl bg-white/70 px-4 py-3 ring-1 ring-violet-100"
                >
                  <div className="rounded-lg bg-violet-100 p-2 text-violet-600">{item.icon}</div>
                  <div>
                    <div className="text-sm font-black text-[#10214b]">{item.title}</div>
                    <div className="mt-0.5 text-xs leading-4 text-slate-500">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section
          className={`mt-4 grid gap-4 ${hasMeta && hasGoogle ? "lg:grid-cols-2" : "grid-cols-1"}`}
        >
          {hasMeta && (
            <PlatformCard
              id="meta"
              brand="Meta"
              badge="M"
              badgeClass="bg-blue-600 text-white"
              spend={metaSpend}
              revenue={metaRevenue}
              roas={metaRoas}
              actions={metaPurchases}
              actionLabel="Vásárlások"
              changes={{
                spend: getNestedNumber(metaChange, ["spend"]),
                revenue: getNestedNumber(metaChange, ["revenue"]),
                roas: getNestedNumber(metaChange, ["roas"]),
                actions: getNestedNumber(metaChange, ["purchases"])
              }}
            />
          )}
          {hasGoogle && (
            <PlatformCard
              id="google"
              brand="Google"
              badge="G"
              badgeClass="bg-white text-blue-600 ring-1 ring-slate-200"
              spend={googleSpend}
              revenue={googleRevenue}
              roas={googleRoas}
              actions={googleConversions}
              actionLabel="Konverziók"
              changes={{
                spend: getNestedNumber(googleChange, ["spend"]),
                revenue: getNestedNumber(googleChange, ["revenue"]),
                roas: getNestedNumber(googleChange, ["roas"]),
                actions: getNestedNumber(googleChange, ["conversions"])
              }}
            />
          )}
        </section>

        <section id="trends" className="mt-4 grid scroll-mt-4 gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <Panel
            title="Havi trend – költés, bevétel és ROAS"
            icon={<TrendingUp className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-600"
          >
            <TrendChart data={trendData} />
          </Panel>

          <Panel
            title={`Év/év összehasonlítás – ${formatMonthLabel(report.report_month).replace(String(reportYear) + ". ", "")}`}
            icon={<CalendarDays className="h-5 w-5" />}
            iconClass="bg-blue-50 text-blue-600"
          >
            {priorYearReport ? (
              analysis.yoy.combined.comparable ? (
                <YoyComparison
                  previousYear={reportYear - 1}
                  currentYear={reportYear}
                  items={[
                    {
                      label: "Költés",
                      previous: priorTotalSpend,
                      current: totalSpend,
                      previousLabel: formatCompactHuf(priorTotalSpend),
                      currentLabel: formatCompactHuf(totalSpend),
                      change: analysis.yoy.combined.spendPct,
                      lowerIsBetter: false
                    },
                    {
                      label: "Bevétel",
                      previous: priorTotalRevenue,
                      current: totalRevenue,
                      previousLabel: formatCompactHuf(priorTotalRevenue),
                      currentLabel: formatCompactHuf(totalRevenue),
                      change: analysis.yoy.combined.valuePct
                    },
                    {
                      label: "ROAS",
                      previous: priorTotalRoas,
                      current: totalRoas,
                      previousLabel: formatDecimal(priorTotalRoas) + "×",
                      currentLabel: formatDecimal(totalRoas) + "×",
                      change: analysis.yoy.combined.roasPct
                    },
                    {
                      label: "Vásárlás / konv.",
                      previous: priorActions,
                      current: currentActions,
                      previousLabel: formatDecimal(priorActions, priorActions % 1 === 0 ? 0 : 1),
                      currentLabel: formatDecimal(currentActions, currentActions % 1 === 0 ? 0 : 1),
                      change: actionYoy
                    }
                  ]}
                />
              ) : (
                <div className="rounded-xl bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                  A tavalyi és az idei csatornafedezet eltér, ezért nem mutatunk félrevezető
                  összesített év/év grafikont. A platformonként összehasonlítható ROAS továbbra is
                  elérhető a részletes elemzésben.
                </div>
              )
            ) : (
              <div className="flex min-h-[220px] items-center justify-center text-center text-sm text-slate-400">
                Ehhez a hónaphoz még nincs előző évi összehasonlítható bázis.
              </div>
            )}
          </Panel>
        </section>

        {campaignRows.length > 0 && (
          <section className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                  <Settings className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black">Top kampányok</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">{formatMonthLabel(report.report_month)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3 text-left">Kampány</th>
                    <th className="px-3 py-3 text-left">Platform</th>
                    <th className="px-3 py-3 text-right">Költés</th>
                    <th className="px-3 py-3 text-right">Bevétel / érték</th>
                    <th className="px-3 py-3 text-right">ROAS</th>
                    <th className="px-3 py-3 text-right">Konv.</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignRows.slice(0, 8).map((campaign) => (
                    <tr
                      key={campaign.platform + campaign.campaign}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-3 py-3 font-semibold text-slate-700">{campaign.campaign}</td>
                      <td className="px-3 py-3 text-slate-500">{campaign.platform}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{formatHuf(campaign.spend)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{formatHuf(campaign.revenue)}</td>
                      <td className="px-3 py-3 text-right font-black text-[#10214b]">
                        {formatDecimal(campaign.roas)}×
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        {formatDecimal(campaign.conversions, campaign.platform === "Meta" ? 0 : 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section
          id="archive"
          className="mt-4 scroll-mt-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex shrink-0 items-center gap-2">
              <History className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-black">Korábbi riportok</h2>
            </div>
            <div className="flex flex-1 gap-2 overflow-x-auto lg:px-4">
              {[...(archive ?? [])]
                .filter((item) => item.report_month !== month)
                .slice(0, 10)
                .map((item) => (
                  <a
                    key={item.report_month}
                    href={`/r/${client}/${item.report_month}`}
                    className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-slate-950"
                  >
                    {formatMonthLabel(item.report_month)}
                  </a>
                ))}
            </div>
            <a
              href="#archive"
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600"
            >
              Összes korábbi riport <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {report.source_note && (
          <p className="mx-auto mt-5 max-w-5xl text-center text-[11px] leading-5 text-slate-400">
            {report.source_note}
          </p>
        )}
      </div>
    </main>
  );
}

function Panel({
  title,
  icon,
  iconClass,
  panelClass = "",
  children
}: {
  title: string;
  icon: React.ReactNode;
  iconClass: string;
  panelClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)] ${panelClass}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className={`rounded-xl p-2 ${iconClass}`}>{icon}</div>
        <h2 className="text-lg font-black text-[#0b1739]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  icon,
  iconClass,
  label,
  value,
  mom,
  yoy,
  lowerIsBetter = false
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  mom: number | null;
  yoy: number | null;
  lowerIsBetter?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-white bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2.5 ${iconClass}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 truncate text-2xl font-black tracking-tight text-[#0b1739]">{value}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 divide-x divide-slate-100">
        <Delta value={mom} label="hó/hó" lowerIsBetter={lowerIsBetter} />
        <Delta value={yoy} label="év/év" lowerIsBetter={lowerIsBetter} />
      </div>
    </div>
  );
}

function Delta({
  value,
  label,
  lowerIsBetter = false
}: {
  value: number | null;
  label: string;
  lowerIsBetter?: boolean;
}) {
  const state = goodDelta(value, lowerIsBetter);
  const className =
    state === "good"
      ? "text-emerald-600"
      : state === "bad"
        ? "text-red-500"
        : "text-slate-400";
  return (
    <div className="px-2 first:pl-0 last:pr-0">
      <div className={`text-sm font-black ${className}`}>
        {value === null ? "—" : formatPct(value)}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-slate-400">{label}</div>
    </div>
  );
}

function ActivityStat({
  label,
  value,
  emphasis = false
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "rounded-xl bg-[#15284d] px-3 py-3 text-white"
          : "rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200"
      }
    >
      <div className={`text-2xl font-black ${emphasis ? "text-white" : "text-[#0b1739]"}`}>
        {new Intl.NumberFormat("hu-HU").format(value)}
      </div>
      <div className={`mt-0.5 text-[11px] font-bold ${emphasis ? "text-blue-100" : "text-slate-400"}`}>
        {label}
      </div>
    </div>
  );
}

function ActivityActions({
  title,
  badgeClass,
  actions
}: {
  title: string;
  badgeClass: string;
  actions: ActivityEntry[];
}) {
  return (
    <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200/80">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${badgeClass}`}
        >
          {title.charAt(0)}
        </span>
        <span className="text-xs font-black text-[#10214b]">{title}</span>
      </div>
      <div className="space-y-2">
        {actions.map((action) => (
          <div key={action.label} className="flex items-start justify-between gap-3 text-xs">
            <span className="leading-4 text-slate-600">{action.label}</span>
            <span className="shrink-0 font-black text-[#10214b]">{action.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulletList({ items, tone }: { items: string[]; tone: "good" | "warning" }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Ehhez a hónaphoz nincs külön megjegyzés.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-5 text-slate-650">
          <span
            className={
              tone === "good"
                ? "mt-0.5 text-emerald-500"
                : "mt-0.5 text-orange-500"
            }
          >
            {tone === "good" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PlatformCard({
  id,
  brand,
  badge,
  badgeClass,
  spend,
  revenue,
  roas,
  actions,
  actionLabel,
  changes
}: {
  id: string;
  brand: string;
  badge: string;
  badgeClass: string;
  spend: number;
  revenue: number;
  roas: number;
  actions: number;
  actionLabel: string;
  changes: {
    spend: number;
    revenue: number;
    roas: number;
    actions: number;
  };
}) {
  const metrics = [
    ["Költés", formatHuf(spend), changes.spend],
    ["Bevétel / érték", formatHuf(revenue), changes.revenue],
    ["ROAS", formatDecimal(roas) + "×", changes.roas],
    [actionLabel, formatDecimal(actions, actions % 1 === 0 ? 0 : 1), changes.actions]
  ] as const;

  return (
    <div
      id={id}
      className="scroll-mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-black ${badgeClass}`}
          >
            {badge}
          </div>
          <h2 className="text-lg font-black text-[#0b1739]">{brand} teljesítmény</h2>
        </div>
        <a href="#analysis" className="flex items-center gap-1 text-xs font-bold text-blue-600">
          Részletek <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
        {metrics.map(([label, value, change], index) => (
          <div
            key={label}
            className={`px-3 first:pl-0 sm:border-l sm:border-slate-100 sm:first:border-l-0 ${index === 2 ? "sm:pl-4" : ""}`}
          >
            <div className="text-xs font-semibold text-slate-400">{label}</div>
            <div className="mt-1 text-lg font-black text-[#0b1739]">{value}</div>
            <div className={`mt-1 text-xs font-black ${goodDelta(change) === "good" ? "text-emerald-600" : goodDelta(change) === "bad" ? "text-red-500" : "text-slate-400"}`}>
              {formatPct(change)}
              <span className="ml-1 font-medium text-slate-400">hó/hó</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YoyComparison({
  previousYear,
  currentYear,
  items
}: {
  previousYear: number;
  currentYear: number;
  items: Array<{
    label: string;
    previous: number;
    current: number;
    previousLabel: string;
    currentLabel: string;
    change: number | null;
    lowerIsBetter?: boolean;
  }>;
}) {
  return (
    <div>
      <div className="mb-5 flex justify-end gap-4 text-[11px] font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
          {previousYear}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#173d71]" />
          {currentYear}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {items.map((item) => {
          const max = Math.max(Math.abs(item.previous), Math.abs(item.current), 1);
          const previousHeight = Math.max(18, Math.round((Math.abs(item.previous) / max) * 82));
          const currentHeight = Math.max(18, Math.round((Math.abs(item.current) / max) * 82));
          const state = goodDelta(item.change, item.lowerIsBetter);
          return (
            <div key={item.label} className="text-center">
              <div className="flex h-28 items-end justify-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="mb-1 text-[10px] font-bold text-slate-500">{item.previousLabel}</span>
                  <div
                    className="w-8 rounded-t bg-slate-300"
                    style={{ height: previousHeight }}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="mb-1 text-[10px] font-black text-[#0b1739]">{item.currentLabel}</span>
                  <div
                    className="w-8 rounded-t bg-[#173d71]"
                    style={{ height: currentHeight }}
                  />
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-500">{item.label}</div>
              <div
                className={`mt-1 text-sm font-black ${state === "good" ? "text-emerald-600" : state === "bad" ? "text-red-500" : "text-slate-400"}`}
              >
                {item.change === null ? "—" : formatPct(item.change)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
