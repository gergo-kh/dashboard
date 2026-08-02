import { signOutAction } from "@/app/(portal)/actions";
import { requireCurrentUser } from "@/lib/auth/session";
import Link from "next/link";

type PortalLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function PortalLayout({ children }: PortalLayoutProps) {
  const currentUser = await requireCurrentUser();
  const roleLabel =
    currentUser.profile.role === "agency_admin" ? "Ügynökségi admin" : "Ügyfél";
  const projectLabel =
    currentUser.projects.length === 1
      ? "1 elérhető projekt"
      : `${currentUser.projects.length} elérhető projekt`;

  return (
    <main className="kh-portal-shell">
      <aside className="kh-sidebar" aria-label="Fő navigáció">
        <div>
          <div className="kh-sidebar-brand">KonverzióHuszár</div>
          <nav className="kh-sidebar-nav">
            <Link aria-current="page" href="/">
              Marketing áttekintés
            </Link>
            <span>Teljesítmény</span>
            <span>Merchant Center</span>
            <span>Optimalizálások</span>
            <span>Riportok</span>
            <span>Beállítások</span>
          </nav>
        </div>
        <div className="kh-sidebar-footer">
          <div>
            <p>{currentUser.profile.full_name}</p>
            <span>{roleLabel}</span>
          </div>
          <div>
            <p>{projectLabel}</p>
            <span>Aktív hozzáférés</span>
          </div>
          <form action={signOutAction}>
            <button className="kh-sidebar-logout" type="submit">
              Kijelentkezés
            </button>
          </form>
        </div>
      </aside>
      <section className="kh-portal-content">{children}</section>
    </main>
  );
}
