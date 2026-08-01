import { requireCurrentUser } from "@/lib/auth/session";

export default async function PortalHomePage() {
  const currentUser = await requireCurrentUser();
  const firstProject = currentUser.projects[0];

  return (
    <section className="kh-page-panel" aria-labelledby="portal-title">
      <p className="kh-eyebrow">Marketing áttekintés</p>
      <h1 id="portal-title">A KonverzióHuszár dolgozik rajta.</h1>
      <p className="kh-muted">
        Ez egy védett portál alapnézet. A végleges dashboard UI a következő
        jóváhagyott fázisban készül el.
      </p>
      <div className="kh-placeholder-grid">
        <article>
          <span>Bejelentkezett felhasználó</span>
          <strong>{currentUser.profile.full_name}</strong>
        </article>
        <article>
          <span>Szerepkör</span>
          <strong>
            {currentUser.profile.role === "agency_admin"
              ? "Ügynökségi admin"
              : "Ügyfél"}
          </strong>
        </article>
        <article>
          <span>Elérhető projektek</span>
          <strong>{currentUser.projects.length}</strong>
        </article>
        <article>
          <span>Aktuális projekt</span>
          <strong>{firstProject?.name ?? "Nincs elérhető projekt"}</strong>
        </article>
      </div>
    </section>
  );
}
