import { updatePasswordAction } from "@/app/(auth)/update-password/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

type UpdatePasswordPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function UpdatePasswordPage({
  searchParams
}: UpdatePasswordPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const expired = params.recovery === "expired" || !user;
  const error = params.error;

  return (
    <main className="kh-auth-shell">
      <section className="kh-auth-panel" aria-labelledby="update-title">
        <div className="kh-brand-mark">KH</div>
        <p className="kh-eyebrow">Új jelszó</p>
        <h1 id="update-title">Jelszó frissítése</h1>

        {expired ? (
          <>
            <p className="kh-alert kh-alert-error">
              A visszaállító link lejárt vagy már fel lett használva.
            </p>
            <Link className="kh-button kh-button-secondary" href="/reset-password">
              Új link kérése
            </Link>
          </>
        ) : (
          <>
            <p className="kh-muted">Adj meg egy új, legalább 8 karakteres jelszót.</p>
            {error === "weak" ? (
              <p className="kh-alert kh-alert-error">
                A jelszó legyen legalább 8 karakter hosszú.
              </p>
            ) : null}
            {error === "mismatch" ? (
              <p className="kh-alert kh-alert-error">A két jelszó nem egyezik.</p>
            ) : null}
            {error === "generic" ? (
              <p className="kh-alert kh-alert-error">
                Most nem sikerült frissíteni a jelszót. Próbáld újra.
              </p>
            ) : null}
            <form action={updatePasswordAction} className="kh-form">
              <label>
                Új jelszó
                <input
                  autoComplete="new-password"
                  name="password"
                  required
                  type="password"
                />
              </label>
              <label>
                Új jelszó megerősítése
                <input
                  autoComplete="new-password"
                  name="confirmPassword"
                  required
                  type="password"
                />
              </label>
              <SubmitButton pendingLabel="Frissítés folyamatban...">
                Jelszó frissítése
              </SubmitButton>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
