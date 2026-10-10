"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabase/browser";

type TotpFactor = {
  id: string;
  friendly_name: string | null;
};

export default function LoginMfaPage() {
  const router = useRouter();
  const [factor, setFactor] = useState<TotpFactor | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const checkSession = useCallback(async () => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      router.replace("/login");
      return;
    }

    const { data: assurance, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError) {
      setError("No pudimos verificar el estado de tu autenticación. Vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }

    if (
      assurance.currentLevel === "aal2" ||
      assurance.nextLevel !== "aal2"
    ) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    const { data: factors, error: factorError } =
      await supabase.auth.mfa.listFactors();

    if (factorError) {
      setError("No pudimos cargar tus métodos de autenticación. Intenta nuevamente.");
      setLoading(false);
      return;
    }

    const verified = factors.totp.find((item) => item.status === "verified");

    if (!verified) {
      setError("Tu cuenta requiere verificación adicional, pero no encontramos una aplicación autenticadora verificada. Contacta al soporte de PeakScore.");
      setLoading(false);
      return;
    }

    setFactor({
      id: verified.id,
      friendly_name: verified.friendly_name,
    });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const token = code.replace(/\D/g, "");
    if (!factor || !/^\d{6,8}$/.test(token)) {
      setError("Introduce el código temporal de tu aplicación de autenticación.");
      return;
    }

    setVerifying(true);

    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: factor.id });

      if (challengeError) {
        throw new Error("No se pudo iniciar la verificación. Intenta de nuevo.");
      }

      const { error: verificationError } =
        await supabase.auth.mfa.verify({
          factorId: factor.id,
          challengeId: challenge.id,
          code: token,
        });

      if (verificationError) {
        throw new Error("El código no es válido o ya expiró. Comprueba tu aplicación e inténtalo otra vez.");
      }

      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (
        assuranceError ||
        assurance.currentLevel !== "aal2"
      ) {
        throw new Error("No se pudo confirmar el segundo factor. Intenta nuevamente.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "No se pudo comprobar el código.",
      );
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[#070510] px-4 py-10 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,.18),transparent_58%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-violet-300/20 bg-[#100d1d]/95 p-5 shadow-[0_25px_90px_rgba(0,0,0,.4)] sm:p-7">
        <span className="flex size-12 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
          <ShieldCheck size={24} />
        </span>
        <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.25em] text-violet-300">
          SEGURIDAD DE CUENTA
        </p>
        <h1 className="mt-2 text-2xl font-black">Verificación en dos pasos</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Abre tu aplicación de autenticación e introduce el código temporal para continuar.
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-white/60">
            <LoaderCircle size={17} className="animate-spin" /> Comprobando la cuenta…
          </div>
        ) : factor ? (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-violet-200/80">
                Código de {factor.friendly_name || "tu aplicación"}
              </span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                pattern="[0-9]{6,8}"
                required
                autoFocus
                className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-white outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
              />
            </label>
            <button
              type="submit"
              disabled={verifying}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? <LoaderCircle size={17} className="animate-spin" /> : <KeyRound size={17} />}
              Verificar y continuar
            </button>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
              className="min-h-10 w-full rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/55 transition hover:bg-white/5 hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
            className="mt-5 min-h-11 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/5"
          >
            Cerrar sesión
          </button>
        )}
      </section>
    </main>
  );
}
