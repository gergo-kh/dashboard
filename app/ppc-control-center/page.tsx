import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  CircleDollarSign,
  RefreshCw,
  Target,
  UsersRound,
  WalletCards
} from "lucide-react";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  getPpcDashboardData,
  type PpcClientRow,
  type PpcProvider,
  type PpcStatus
} from "@/lib/ppc-control-center/service";

type PageProps = {
  searchParams: Promise<{
    days?: string;
    platform?: string;
  }>;
};

type FilterProvider = "all" | PpcProvider;
type Period = 7 | 14 | 30 | "mtd";

const providerLabels: Record<FilterProvider, string> = {
  all: "Összes",
  google_ads: "Google",
  meta_ads: "Meta",
  tiktok_ads: "TikTok"
};

const providerShortLabels: Record<PpcProvider, string> = {
  google_ads: "G",
  meta_ads: "M",
  tiktok_ads: "T"
};

const periodOptions: { value: Period; label: string }[] = [
  { value: "mtd", label: "Ebben a hónapban" },
  { value: 30, label: "30 nap" },
  { value: 14, label: "14 nap" },
  { value: 7, label: "7 nap" }
];

const statusStyles: Record<PpcStatus, { dot: string; soft: string; text: string; symbol: string }> = {
  green: {
    dot: "bg-[var(--kh-success)]",
    soft: "bg-[var(--kh-success-bg)] border-[color:color-mix(in_srgb,var(--kh-success)_24%,white)]",
    text: "text-[var(--kh-success)]",
    symbol: "↑"
  },
  yellow: {
    dot: "bg-amber-400",
    soft: "bg-[var(--kh-warning-bg)] border-amber-200",
    text: "text-[var(--kh-warning)]",
    symbol: "−"
  },
  red: {
    dot: "bg-[var(--kh-danger)]",
    soft: "bg-[var(--kh-danger-bg)] border-[color:color-mix(in_srgb,var(--kh-danger)_22%,white)]",
    text: "text-[var(--kh-danger)]",
    symbol: "↓"
  }
};

function parsePeriod(value: string | undefined): Period {
  if (value === "mtd") return "mtd";
  if (value === "7") return 7;
  if (value === "14") return 14;
  return 30;
}

function parseProvider(value: string | undefined): FilterProvider {
  if (value === "google_ads" || value === "meta_ads" || value === "tiktok_ads") {
    return value;
  }
  return "all";
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0
  }).format(value);
}

function formatCompactMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("hu-HU", { maximumFractionDigits: 2 })} M Ft`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000).toLocaleString("hu-HU")} K Ft`;
  }
  return formatMoney(value);
}

function formatRoas(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("hu-HU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(value: number | null, inverse = false): { label: string; className: string } {
  if (value === null || !Number.isFinite(value)) {
    return { label: "—", className: "text-[var(--kh-muted)]" };
  }

  const positive = inverse ? value <= 0 : value >= 0;
  const prefix = value > 0 ? "+" : "";
  return {
    label: `${prefix}${value.toLocaleString("hu-HU", { maximumFractionDigits: 1 })}%`,
    className: positive ? "text-[var(--kh-success)]" : "text-[var(--kh-danger)]"
  };
}

function StatusDot({ status }: { status: PpcStatus }) {
  return (
    <span
      aria-label={status === "green" ? "Rendben" : status === "yellow" ? "Figyelendő" : "Problémás"}
      className={`inline-block size-4 rounded-full ${statusStyles[status].dot}`}
    />
  );
}

function TrendBadge({ status, label }: { status: PpcStatus; label: string }) {
  const style = statusStyles[status];
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-medium text-[var(--kh-muted)]">{label}</span>
      <span className={`grid size-9 place-items-center rounded-full border text-lg font-bold ${style.soft} ${style.text}`}>
        {style.symbol}
      </span>
    </div>
  );
}

function MetricCell(props: {
  value: string;
  change: number | null;
  mtdChange: number | null;
  inverseChange?: boolean;
  showMtdComparison?: boolean;
}) {
  const change = formatPercent(props.change, props.inverseChange);
  const mtdChange = formatPercent(props.mtdChange, props.inverseChange);

  return (
    <div className="min-w-[112px]">
      <div className="font-bold text-[var(--kh-navy)]">{props.value}</div>
      <div className={`mt-1 text-xs font-semibold ${change.className}`}>{change.label}</div>
      {props.showMtdComparison !== false && (
        <div className="mt-4 border-t border-dashed border-[var(--kh-border)] pt-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--kh-muted)]">MTD</div>
          <div className={`mt-0.5 text-xs font-bold ${mtdChange.className}`}>{mtdChange.label}</div>
        </div>
      )}
    </div>
  );
}

function ClientRow({ row, showMtdComparison }: { row: PpcClientRow; showMtdComparison: boolean }) {
  return (
    <div className="grid grid-cols-[42px_minmax(170px,1.3fr)_110px_repeat(4,minmax(120px,1fr))_190px] items-start gap-3 border-t border-[var(--kh-border)] px-5 py-4 text-sm max-[1180px]:min-w-[1120px]">
      <div className="pt-2"><StatusDot status={row.overallStatus} /></div>
      <div className="pt-1">
        <div className="font-bold text-[var(--kh-navy)]">{row.clientName}</div>
        <div className="mt-1 text-xs text-[var(--kh-muted)]">{row.clientId.slice(0, 8)}</div>
      </div>
      <div className="flex flex-wrap gap-1 pt-1">
        {row.providers.map((provider) => (
          <span
            key={provider}
            title={providerLabels[provider]}
            className="grid size-8 place-items-center rounded-lg border border-[var(--kh-border)] bg-white text-xs font-extrabold text-[var(--kh-navy)]"
          >
            {providerShortLabels[provider]}
          </span>
        ))}
      </div>
      <MetricCell value={formatCompactMoney(row.spend)} change={row.spendChangePct} mtdChange={row.mtdSpendChangePct} showMtdComparison={showMtdComparison} />
      <MetricCell value={formatCompactMoney(row.revenue)} change={row.revenueChangePct} mtdChange={row.mtdRevenueChangePct} showMtdComparison={showMtdComparison} />
      <MetricCell value={formatRoas(row.roas)} change={row.roasChangePct} mtdChange={row.mtdRoasChangePct} showMtdComparison={showMtdComparison} />
      <MetricCell value={row.cpa === null ? "—" : formatMoney(row.cpa)} change={row.cpaChangePct} mtdChange={row.mtdCpaChangePct} inverseChange showMtdComparison={showMtdComparison} />
      <div className="flex justify-between gap-3 px-1">
        <TrendBadge status={row.status7d} label="7 nap" />
        <TrendBadge status={row.status14d} label="14 nap" />
        <TrendBadge status={row.status30d} label="30 nap" />
      </div>
    </div>
  );
}

function KpiCard(props: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[var(--kh-border)] bg-white p-5 shadow-[var(--kh-shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-[var(--kh-muted)]">{props.title}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--kh-navy)]">{props.value}</p>
          <p className="mt-2 text-xs text-[var(--kh-muted)]">{props.subtitle}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--kh-muted-soft)] text-[var(--kh-navy)]">
          {props.icon}
        </span>
      </div>
    </article>
  );
}

function filterHref(period: Period, provider: FilterProvider) {
  const params = new URLSearchParams({ days: String(period) });
  if (provider !== "all") params.set("platform", provider);
  return `/ppc-control-center?${params.toString()}`;
}

function asMtdRow(row: PpcClientRow): PpcClientRow {
  return {
    ...row,
    spend: row.mtdSpend,
    revenue: row.mtdRevenue,
    roas: row.mtdRoas,
    cpa: row.mtdCpa,
    spendChangePct: row.mtdSpendChangePct,
    revenueChangePct: row.mtdRevenueChangePct,
    roasChangePct: row.mtdRoasChangePct,
    cpaChangePct: row.mtdCpaChangePct
  };
}

export default async function PpcControlCenterPage({ searchParams }: PageProps) {
  const currentUser = await requireCurrentUser();
  if (currentUser.profile.role !== "agency_admin") {
    redirect("/");
  }

  const params = await searchParams;
  const period = parsePeriod(params.days);
  const provider = parseProvider(params.platform);
  const data = await getPpcDashboardData({
    days: period === "mtd" ? 30 : period,
    provider: provider === "all" ? null : provider
  });
  const rows = period === "mtd" ? data.rows.map(asMtdRow) : data.rows;
  const totalSpend = rows.reduce((sum, row) => sum + row.spend, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalPurchases = rows.reduce((sum, row) => sum + row.purchases, 0);
  const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : null;
  const totalCpa = totalPurchases > 0 ? totalSpend / totalPurchases : null;
  const periodSubtitle = period === "mtd" ? "Ebben a hónapban" : `Utolsó ${period} nap`;
  const showMtdComparison = period !== "mtd";

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen grid-cols-[220px_minmax(0,1fr)] max-[900px]:grid-cols-1">
        <aside className="sticky top-0 flex h-screen flex-col justify-between bg-[var(--kh-navy)] p-5 text-white max-[900px]:static max-[900px]:h-auto">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--kh-orange)] font-black">KH</span>
              <div>
                <div className="font-extrabold">KonverzióHuszár</div>
                <div className="text-xs text-white/60">PPC Control Center</div>
              </div>
            </div>
            <nav className="mt-8 grid gap-2" aria-label="PPC Control Center navigáció">
              <span className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 font-semibold">
                <BarChart3 size={18} /> Áttekintés
              </span>
              <Link className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 no-underline hover:bg-white/5" href="/">
                <UsersRound size={18} /> Ügyfélportál
              </Link>
            </nav>
          </div>
          <div className="border-t border-white/10 pt-4 text-sm">
            <div className="font-bold">{currentUser.profile.full_name}</div>
            <div className="mt-1 text-xs text-white/55">Agency admin</div>
          </div>
        </aside>

        <section className="min-w-0 p-7 max-[700px]:p-4">
          <header className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="m-0 text-3xl font-extrabold tracking-tight text-[var(--kh-navy)]">PPC Control Center</h1>
              <p className="mt-2 text-sm text-[var(--kh-muted)]">Minden fontos PPC adat egy helyen.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-[var(--kh-border)] bg-white p-1">
                {periodOptions.map((item) => (
                  <Link
                    key={String(item.value)}
                    href={filterHref(item.value, provider)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold no-underline ${period === item.value ? "bg-[var(--kh-navy)] text-white" : "text-[var(--kh-muted)]"}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="flex rounded-xl border border-[var(--kh-border)] bg-white p-1">
                {(Object.keys(providerLabels) as FilterProvider[]).map((item) => (
                  <Link
                    key={item}
                    href={filterHref(period, item)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold no-underline ${provider === item ? "bg-[var(--kh-focus)] text-white" : "text-[var(--kh-muted)]"}`}
                  >
                    {providerLabels[item]}
                  </Link>
                ))}
              </div>
            </div>
          </header>

          {!rows.some((row) => row.spend > 0 || row.revenue > 0 || row.purchases > 0) && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-[var(--kh-warning-bg)] px-4 py-3 text-sm text-[var(--kh-warning)]">
              <RefreshCw size={18} />
              <strong>A fiókok be vannak állítva, de a napi mérőszámok még nincsenek betöltve a staging adatbázisba.</strong>
            </div>
          )}

          <section className="mt-6 grid grid-cols-5 gap-3 max-[1250px]:grid-cols-3 max-[700px]:grid-cols-1">
            <KpiCard title="Összes költés" value={formatCompactMoney(totalSpend)} subtitle={periodSubtitle} icon={<CircleDollarSign size={20} />} />
            <KpiCard title="Összes bevétel" value={formatCompactMoney(totalRevenue)} subtitle={periodSubtitle} icon={<WalletCards size={20} />} />
            <KpiCard title="Átlag ROAS" value={formatRoas(totalRoas)} subtitle={periodSubtitle} icon={<Target size={20} />} />
            <KpiCard title="Átlag CPA" value={totalCpa === null ? "—" : formatMoney(totalCpa)} subtitle={periodSubtitle} icon={<BarChart3 size={20} />} />
            <KpiCard title="Aktív ügyfelek" value={String(data.clientCount)} subtitle={`🟢 ${data.statusCounts.green}   🟡 ${data.statusCounts.yellow}   🔴 ${data.statusCounts.red}`} icon={<UsersRound size={20} />} />
          </section>

          <section className="mt-5 overflow-hidden rounded-2xl border border-[var(--kh-border)] bg-white shadow-[var(--kh-shadow-soft)]">
            <div className="flex items-center justify-between gap-4 px-5 py-5">
              <div>
                <h2 className="m-0 text-lg font-extrabold text-[var(--kh-navy)]">Ügyfelek teljesítménye</h2>
                <p className="mt-1 text-xs text-[var(--kh-muted)]">
                  {period === "mtd"
                    ? "Ebben a hónapban eddig, összevetve az előző hónap azonos időszakával."
                    : "MTD: aktuális hónap eddig vs. előző hónap azonos időszaka."}
                </p>
              </div>
              <div className="text-right text-xs text-[var(--kh-muted)]">
                <div>Adatforrás: Windsor.ai</div>
                <div className="mt-1">Frissítés: napi</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-[42px_minmax(170px,1.3fr)_110px_repeat(4,minmax(120px,1fr))_190px] gap-3 border-t border-[var(--kh-border)] bg-[var(--kh-muted-soft)] px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--kh-muted)] max-[1180px]:min-w-[1120px]">
                <span>Státusz</span>
                <span>Ügyfél</span>
                <span>Platform</span>
                <span>Költés</span>
                <span>Bevétel</span>
                <span>ROAS</span>
                <span>CPA</span>
                <span className="text-center">Teljesítmény trend</span>
              </div>

              {rows.length > 0 ? (
                rows.map((row) => <ClientRow key={row.clientId} row={row} showMtdComparison={showMtdComparison} />)
              ) : (
                <div className="px-6 py-14 text-center text-sm text-[var(--kh-muted)]">
                  Nincs megjeleníthető ügyfél a kiválasztott platformon.
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
