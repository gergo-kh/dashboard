import { requestPasswordResetAction } from "@/app/(auth)/reset-password/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import Link from "next/link";

type ResetPasswordPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function hasParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  return params[key] === "1";
}

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const sent = hasParam(params, "sent");
  const error = params.error;

  return (
    <main className="kh-auth-shell">
      <section className="kh-auth-panel" aria-labelledby="reset-title">
        <div className="kh-brand-mark">KH</div>
        <p className="kh-eyebrow">Jelszó-visszaállítás</p>
        <h1 id="reset-title">Új jelszó kérése</h1>
        <p className="kh-muted">
          Add meg az email címedet. Ha tartozik hozzá fiók, küldünk egy
          visszaállító linket.
        </p>

        {sent ? (
          <p className="kh-alert kh-alert-success">
            Ha tartozik fiók ehhez az email címhez, elküldtük a visszaállító
            linket.
          </p>
        ) : null}
        {error === "missing" ? (
          <p className="kh-alert kh-alert-error">Add meg az email címet.</p>
        ) : null}
        {error === "generic" ? (
          <p className="kh-alert kh-alert-error">
            Most nem sikerült elküldeni a kérést. Próbáld újra később.
          </p>
        ) : null}

        <form action={requestPasswordResetAction} className="kh-form">
          <label>
            Email cím
            <input
              autoComplete="email"
              inputMode="email"
              name="email"
              placeholder="pelda@example.invalid"
              required
              type="email"
            />
          </label>
          <SubmitButton pendingLabel="Küldés folyamatban...">
            Visszaállító link küldése
          </SubmitButton>
        </form>

        <Link className="kh-link" href="/login">
          Vissza a belépéshez
        </Link>
      </section>
    </main>
  );
}
