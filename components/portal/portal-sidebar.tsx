import { Download, Eye, LogOut, Radio } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/(portal)/actions";
import { portalNavigationItems } from "@/components/portal/navigation";
import type { PortalShellViewModel } from "@/types/overview";

type PortalSidebarProps = Readonly<{
  shell: PortalShellViewModel;
}>;

export function PortalSidebar({ shell }: PortalSidebarProps) {
  return (
    <aside className="kh-sidebar kh-desktop-sidebar" aria-label="Fő navigáció">
      <div>
        <div className="kh-sidebar-brand" aria-label="KonverzióHuszár Ügyfélportál">
          <span className="kh-brand-mark kh-brand-mark-small">KH</span>
          <span>KonverzióHuszár</span>
        </div>

        <nav className="kh-sidebar-nav" aria-label="Portál menü">
          {portalNavigationItems.map((item) => {
            const Icon = item.icon;

            if (item.isDisabled) {
              return (
                <button
                  aria-disabled="true"
                  className="kh-sidebar-nav-item"
                  disabled
                  key={item.label}
                  title={`${item.label} oldal hamarosan elérhető`}
                  type="button"
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>{item.label}</span>
                  <span className="kh-nav-soon">Hamarosan</span>
                </button>
              );
            }

            return (
              <Link
                aria-current={item.isActive ? "page" : undefined}
                aria-label={`${item.label} oldal`}
                className="kh-sidebar-nav-item"
                href={item.href}
                key={item.label}
                title={item.label}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="kh-sidebar-footer">
        <ReportMiniCard shell={shell} />
        <div className="kh-sidebar-context">
          <p>Ügyfél</p>
          <strong>{shell.selectedClientName}</strong>
        </div>
        <div className="kh-sidebar-context">
          <p>Projekt</p>
          <strong>{shell.selectedProjectName}</strong>
        </div>
        <div className="kh-sidebar-context kh-manager-status">
          <Radio aria-hidden="true" size={16} />
          <div>
            <p>PPC manager</p>
            <strong>{shell.ppcManagerName}</strong>
            <span>Aktív</span>
          </div>
        </div>
        <form action={signOutAction}>
          <button className="kh-sidebar-logout" type="submit">
            <LogOut aria-hidden="true" size={17} />
            Kijelentkezés
          </button>
        </form>
      </div>
    </aside>
  );
}

export function ReportMiniCard({ shell }: PortalSidebarProps) {
  return (
    <section className="kh-sidebar-report" aria-labelledby="sidebar-report-title">
      <span>Aktuális riport</span>
      <h2 id="sidebar-report-title">{shell.currentReport.monthLabel}</h2>
      <p>{shell.currentReport.statusLabel}</p>
      <div className="kh-sidebar-report-actions" aria-label="Riport műveletek">
        <button
          aria-describedby="sidebar-report-disabled-help"
          disabled
          title="Statikus előnézet, Phase 4-ben még nincs megnyitás"
          type="button"
        >
          <Eye aria-hidden="true" size={15} />
          Megtekintés
        </button>
        <button
          aria-describedby="sidebar-report-disabled-help"
          disabled
          title="PDF letöltés a későbbi riport fázisban készül el"
          type="button"
        >
          <Download aria-hidden="true" size={15} />
          Letöltés
        </button>
      </div>
      <small className="kh-sidebar-report-help" id="sidebar-report-disabled-help">
        A riport megnyitása és letöltése későbbi fázisban készül el.
      </small>
    </section>
  );
}
