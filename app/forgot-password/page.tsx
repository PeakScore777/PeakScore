
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Mail, LockKeyhole, Check } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { supabase } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail) ||
      normalizedEmail.includes("..")
    ) {
      setError("Introduce un correo electrónico válido.");
      return;
    }

    if (!captchaToken) {
      setError("Completa la verificación de seguridad.");
      return;
    }

    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/update-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo,
          captchaToken,
        });

      if (resetError) {
        console.error("[PeakScore] Solicitud de recuperación rechazada.", {
          errorCode: resetError.code ?? "UNKNOWN",
          status: resetError.status ?? "UNKNOWN",
        });

        setError(
          "No fue posible procesar la solicitud. Inténtalo nuevamente."
        );
        return;
      }

      setSubmitted(true);
    } catch (resetError) {
      console.error("[PeakScore] Error solicitando recuperación.", {
        errorName:
          resetError instanceof Error
            ? resetError.name
            : "UnknownError",
      });

      setError("No fue posible procesar la solicitud. Inténtalo nuevamente.");
    } finally {
      setCaptchaToken("");
      setCaptchaKey((value) => value + 1);
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050607] px-4 py-6 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(197,244,103,0.07),transparent_55%)]"
      />

      <div className="relative z-10 w-full max-w-[410px]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#090B0D] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <div className="h-[3px] bg-gradient-to-r from-[#C5F467] via-[#C5F467]/30 to-transparent" />

          <div className="p-5 sm:p-7">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-white/45 transition hover:text-[#C5F467]"
            >
              <ArrowLeft size={14} />
              Volver al inicio de sesión
            </Link>

            {submitted ? (
              <div className="pt-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C5F467]/20 bg-[#C5F467]/10 text-[#C5F467]">
                  <Check size={21} />
                </div>

                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                  Revisa tu correo
                </h1>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  Si la dirección de correo está asociada a una cuenta, recibirás un enlace para restablecer tu contraseña y recuperar el acceso a PeakScore.
                </p>

                <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
                  <p className="break-all text-xs text-white/70">
                    {email.trim().toLowerCase()}
                  </p>
                </div>

                <Link
                  href="/login"
                  className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C5F467] text-sm font-semibold text-[#10130A] transition hover:bg-[#D6FF87]"
                >
                  Ir al inicio de sesión
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C5F467]/20 bg-[#C5F467]/10 text-[#C5F467]">
                    <LockKeyhole size={19} />
                  </div>

                  <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C5F467]">
                    Seguridad de tu cuenta
                  </p>

                  <h1 className="mt-1.5 text-[27px] font-semibold leading-tight tracking-[-0.04em]">
                    Recupera tu contraseña
                  </h1>

                  <p className="mt-2 text-sm leading-5 text-white/50">
                    Te enviaremos un enlace para que puedas volver a tu cuenta
                    de PeakScore.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-xs font-medium text-white/75"
                    >
                      Correo electrónico
                    </label>

                    <div className="flex h-10 items-center rounded-lg border border-white/10 bg-[#050607] px-3 transition focus-within:border-[#C5F467]/60 focus-within:ring-2 focus-within:ring-[#C5F467]/10">
                      <Mail size={16} className="shrink-0 text-white/35" />

                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError("");
                        }}
                        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/25"
                        placeholder="tu@correo.com"
                        maxLength={254}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-center overflow-hidden">
                    <Turnstile
                      key={`forgot-captcha-${captchaKey}`}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                      onSuccess={(token) => {
                        setCaptchaToken(token);
                        setError("");
                      }}
                      onExpire={() => setCaptchaToken("")}
                      onError={() => {
                        setCaptchaToken("");
                        setError(
                          "No se pudo cargar la verificación de seguridad."
                        );
                      }}
                      options={{
                        language: "es",
                        size: "flexible",
                        appearance: "always",
                      }}
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2.5 text-xs leading-5 text-red-200"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !captchaToken}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C5F467] px-4 text-sm font-semibold text-[#10130A] transition hover:bg-[#D6FF87] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {loading ? "Procesando..." : "Enviar enlace de recuperación"}
                    {!loading && <ArrowRight size={15} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>

        <p className="mt-3 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-white/25">
          PeakScore · Preparación ICFES
        </p>
      </div>
    </main>
  );
}
