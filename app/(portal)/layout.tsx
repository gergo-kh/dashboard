import { PortalMobileNav } from "@/components/portal/portal-mobile-nav";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { requireCurrentUser } from "@/lib/auth/session";
import { createPortalShellViewModel } from "@/lib/overview/static-data";

type PortalLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function PortalLayout({ children }: PortalLayoutProps) {
  const currentUser = await requireCurrentUser();
  const shell = createPortalShellViewModel({
    profileName: currentUser.profile.full_name,
    role: currentUser.profile.role,
    projects: currentUser.projects
  });

  return (
    <main className="kh-portal-shell">
      <PortalSidebar shell={shell} />
      <PortalMobileNav shell={shell} />
      <section className="kh-portal-content" aria-label="Portál tartalom">
        {children}
      </section>
    </main>
  );
}
