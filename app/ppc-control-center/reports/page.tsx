import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  FileText,
  Link2,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { requireCurrentUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CopyShareLinkButton, ShareAdminActions } from "./share-controls";

function formatMonth(reportMonth: string) {
  const [year, month] = reportMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export default async function ReportSharesPage() {
  const currentUser = await requireCurrentUser();
  if (currentUser.profile.role !== "agency_admin") {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  const [
    { data: shares, error: sharesError },
    { data: clients, error: clientsError },
    { data: reports, error: reportsError }
  ] = await Promise.all([
    supabase
      .from("client_report_shares")
      .select("client_id, token, is_active, revoked_at, updated_at"),
    supabase
      .from("clients")
      .select("id, name, slug, status")
      .order("name", { ascending: true }),
    supabase
      .from("client_reports")
      .select("client_slug, report_month")
      .order("report_month", { ascending: false })
  ]);

  if (sharesError || clientsError || reportsError) {
    throw new Error("Could not load report share links.");
  }

  const latestBySlug = new Map<string, string>();
  for (const report of reports ?? []) {
    if (!latestBySlug.has(report.client_slug)) {
      latestBySlug.set(report.client_slug, report.report_month);
    }
  }

  const shareByClientId = new Map(
    (shares ?? []).map((share) => [share.client_id, share])
  );

  const rows = (clients ?? [])
    .map((client) => ({
      ...client,
      latestMonth: latestBySlug.get(client.slug) ?? null,
      share: shareByClientId.get(client.id) ?? null
    }))
    .filter((row) => row.latestMonth !== null);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen grid-cols-[220px_minmax(0,1fr)] max-[900px]:grid-cols-1">
        <aside className="sticky top-0 flex h-screen flex-col justify-between bg-[var(--kh-navy)] p-5 text-white max-[900px]:static max-[900px]:h-auto">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--kh-orange)] font-black">
                KH
              </span>
              <div>
                <div className="font-extrabold">KonverzióHuszár</div>
                <div className="text-xs text-white/60">PPC Control Center</div>
              </div>
            </div>

            <nav className="mt-8 grid gap-2" aria-label="PPC Control Center navigáció">
              <Link
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 no-underline hover:bg-white/5"
                href="/ppc-control-center"
              >
                <BarChart3 size={18} /> Áttekintés
              </Link>
              <span className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 font-semibold">
                <FileText size={18} /> Riportok
              </span>
              <Link
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 no-underline hover:bg-white/5"
                href="/"
              >
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
              <h1 className="m-0 text-3xl font-extrabold tracking-tight text-[var(--kh-navy)]">
                Ügyfélriportok
              </h1>
              <p className="mt-2 text-sm text-[var(--kh-muted)]">
                Privát, stabil link minden ügyfélhez. A link mindig a legfrissebb riportot nyitja meg.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              <ShieldCheck size={18} />
              {rows.filter((row) => row.share?.is_active).length} aktív privát link
            </div>
          </header>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-900">
            <div className="flex items-start gap-3">
              <Link2 className="mt-0.5 shrink-0" size={18} />
              <p className="m-0">
                Az ügyfélnek csak a <strong>Link másolása</strong> gombbal kapott URL-t küldd el.
                A közvetlen <code>/r/...</code> riportútvonalak már bejelentkezéshez kötöttek.
                Ha egy link illetéktelenhez kerül, az <strong>Új link</strong> gombbal azonnal
                érvénytelenítheted a régit.
              </p>
            </div>
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-[var(--kh-border)] bg-white shadow-[var(--kh-shadow-soft)]">
            <div className="grid grid-cols-[minmax(200px,1.4fr)_160px_120px_minmax(330px,1fr)] gap-4 bg-[var(--kh-muted-soft)] px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--kh-muted)] max-[950px]:hidden">
              <span>Ügyfél</span>
              <span>Legfrissebb riport</span>
              <span>Állapot</span>
              <span>Műveletek</span>
            </div>

            <div className="divide-y divide-[var(--kh-border)]">
              {rows.map((row) => {
                const share = row.share;
                const isActive = Boolean(share?.is_active);
                const sharePath = share ? `/s/${share.token}` : "";

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[minmax(200px,1.4fr)_160px_120px_minmax(330px,1fr)] items-center gap-4 px-5 py-4 max-[950px]:grid-cols-1"
                  >
                    <div>
                      <div className="font-extrabold text-[var(--kh-navy)]">{row.name}</div>
                      <div className="mt-1 text-xs text-[var(--kh-muted)]">{row.slug}</div>
                    </div>

                    <div className="text-sm font-semibold text-[var(--kh-navy)]">
                      {row.latestMonth ? formatMonth(row.latestMonth) : "—"}
                    </div>

                    <div>
                      <span
                        className={
                          isActive
                            ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
                            : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200"
                        }
                      >
                        {isActive ? "Aktív" : "Visszavonva"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {share ? (
                        <>
                          <CopyShareLinkButton path={sharePath} disabled={!isActive} />
                          {isActive && (
                            <Link
                              href={sharePath}
                              target="_blank"
                              className="inline-flex items-center gap-2 rounded-lg border border-[var(--kh-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--kh-navy)] no-underline transition hover:bg-slate-50"
                            >
                              Megnyitás <ArrowUpRight size={14} />
                            </Link>
                          )}
                          <ShareAdminActions clientId={row.id} isActive={isActive} />
                        </>
                      ) : (
                        <span className="text-xs text-red-500">Nincs share link.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
