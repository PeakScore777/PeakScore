"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { supabase } from "@/lib/supabase/browser";
import PeakScoreLogo from "@/components/PeakScoreLogo";

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

    const redirectTo = `${window.location.origin}/update-password`;
    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
        captchaToken,
      });

    setCaptchaToken("");
    setCaptchaKey((value) => value + 1);
    setLoading(false);

    if (resetError) {
      setError(
        "No fue posible procesar la solicitud. Inténtalo nuevamente."
      );
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.12)] sm:p-9">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600">
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </Link>

          <div className="mt-8">
            <PeakScoreLogo variant="dark" showTagline={false} compact />
            <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <LockKeyhole size={22} />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Recupera tu contraseña
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Introduce el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
            </p>
          </div>

          {submitted ? (
            <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-900">
                Revisa tu correo
              </p>
              <p className="mt-2 text-xs leading-5 text-blue-800">
                Si el correo está asociado a una cuenta, recibirás instrucciones para recuperar el acceso. Por seguridad, no mostramos si una cuenta existe o no.
              </p>
              <Link
                href="/login"
                className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-blue-700"
              >
                Ir al inicio de sesión <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-bold text-slate-800">
                  Correo electrónico
                </label>
                <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Mail size={17} className="text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-center">
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
                    setError("No se pudo cargar la verificación de seguridad.");
                  }}
                  options={{ language: "es", size: "flexible", appearance: "always" }}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Procesando..." : "Enviar enlace de recuperación"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
