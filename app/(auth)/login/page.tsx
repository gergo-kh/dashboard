import { redirect } from "next/navigation";
import Link from "next/link";
import { signInWithPasswordAction } from "@/app/(auth)/login/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { sanitizeInternalRedirectPath } from "@/lib/routing/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LoginPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function getFirstParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getLoginMessage(params: Record<string, string | string[] | undefined>) {
  const error = getFirstParam(params, "error");
  const auth = getFirstParam(params, "auth");

  if (error === "invalid") {
    return "A megadott belépési adatokkal nem sikerült bejelentkezni.";
  }

  if (error === "missing") {
    return "Add meg az email címet és a jelszót.";
  }

  if (auth === "inactive_profile") {
    return "A hozzáférés jelenleg inaktív. Kérj segítséget a KonverzióHuszár csapattól.";
  }

  if (auth === "missing_profile" || auth === "unsupported_role") {
    return "A fiókhoz még nincs portál-hozzáférés beállítva.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = sanitizeInternalRedirectPath(getFirstParam(params, "next"));
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const message = getLoginMessage(params);
  const resetUpdated = getFirstParam(params, "updated") === "1";
  const signedOut = getFirstParam(params, "signedOut") === "1";

  return (
    <main className="kh-auth-shell">
      <section className="kh-auth-panel" aria-labelledby="login-title">
        <div className="kh-brand-mark">KH</div>
        <p className="kh-eyebrow">KonverzióHuszár Ügyfélportál</p>
        <h1 id="login-title">Belépés</h1>
        <p className="kh-muted">
          Lépj be, és nézd meg, min dolgozik éppen a KonverzióHuszár.
        </p>

        {resetUpdated ? (
          <p className="kh-alert kh-alert-success">A jelszó frissült. Most már beléphetsz.</p>
        ) : null}
        {signedOut ? (
          <p className="kh-alert kh-alert-success">Sikeresen kijelentkeztél.</p>
        ) : null}
        {message ? <p className="kh-alert kh-alert-error">{message}</p> : null}

        <form action={signInWithPasswordAction} className="kh-form">
          <input name="next" type="hidden" value={next} />
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
          <label>
            Jelszó
            <input
              autoComplete="current-password"
              name="password"
              placeholder="Jelszó"
              required
              type="password"
            />
          </label>
          <SubmitButton pendingLabel="Belépés folyamatban...">Belépés</SubmitButton>
        </form>

        <Link className="kh-link" href="/reset-password">
          Elfelejtett jelszó
        </Link>
      </section>
    </main>
  );
}
