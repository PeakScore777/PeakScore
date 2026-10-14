"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Chrome, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import { supabase } from "@/lib/supabase/browser";
import PeakMascot from "@/components/login/PeakMascot";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const normalizedEmail = email.trim().toLowerCase();
  const mascotCoverEyes = password.length > 0 && !showPassword;

  async function handleGoogleSignIn() {
    setError("");
    setOauthLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (oauthError) {
      setError("No se pudo iniciar sesión con Google. Inténtalo nuevamente.");
      setOauthLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      normalizedEmail.length > 254 ||
      !/^([^\s@]+)@([^\s@]+)\.([^\s@]{2,})$/.test(normalizedEmail) ||
      !password
    ) {
      setError("Completa tu correo y contraseña.");
      return;
    }

    if (!captchaToken) {
      setError("Completa la verificación de seguridad antes de iniciar sesión.");
      return;
    }

    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
      options: { captchaToken },
    });

    if (signInError) {
      setCaptchaToken("");
      setCaptchaKey((previous) => previous + 1);
      setError(
        signInError.message.toLowerCase().includes("captcha")
          ? "La verificación de seguridad expiró. Completa el CAPTCHA nuevamente e inténtalo otra vez."
          : "El correo o la contraseña no son correctos."
      );
      setLoading(false);
      return;
    }

    if (!data.session) {
      setCaptchaToken("");
      setCaptchaKey((previous) => previous + 1);
      setError("No se pudo establecer la sesión. Intenta nuevamente.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#10110f] text-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-white/[0.07] px-12 py-10 lg:flex xl:px-20">
        <div aria-hidden="true" className="pointer-events-none absolute -left-36 top-1/4 h-[440px] w-[440px] rounded-full bg-[#c5f467]/[0.07] blur-[110px]" />

        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3" aria-label="PeakScore, ir al inicio">
          <span className="relative h-10 w-10">
            <Image
              src="/images/branding/peakscore-logo-transparente2.png"
              alt=""
              fill
              priority
              sizes="40px"
              className="object-contain"
            />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            Peak<span className="text-[#c5f467]">Score</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-xl py-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c5f467]" />
            Tu preparación, a tu ritmo
          </div>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.08] tracking-[-0.055em] xl:text-6xl">
            Tu esfuerzo.
            <br />
            <span className="text-[#c5f467]">Tu próximo nivel.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/55">
            Practica para el ICFES, reconoce tus avances y sigue construyendo confianza, una pregunta a la vez.
          </p>
          <div className="mt-10 flex items-end gap-5">
            <div className="relative h-52 w-48 shrink-0 xl:h-60 xl:w-56">
              <Image
                src="/peaky/login/pose1_reposo.png"
                alt="Peaky, mascota de PeakScore"
                fill
                priority
                sizes="(min-width: 1280px) 224px, 192px"
                className="object-contain object-bottom"
              />
            </div>
            <div className="mb-5 max-w-[210px] border-l border-[#c5f467]/50 pl-4 text-sm leading-6 text-white/50">
              Cada práctica cuenta. Sigue avanzando a tu manera.
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">© {new Date().getFullYear()} PeakScore</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[410px]">
          <Link href="/" className="mb-10 inline-flex items-center gap-3 lg:hidden" aria-label="PeakScore, ir al inicio">
            <span className="relative h-9 w-9">
              <Image
                src="/images/branding/peakscore-logo-transparente2.png"
                alt=""
                fill
                priority
                sizes="36px"
                className="object-contain"
              />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Peak<span className="text-[#c5f467]">Score</span>
            </span>
          </Link>

          <div className="mb-8 lg:mb-9">
            <div className="mb-4 flex justify-center lg:hidden">
              <PeakMascot coverEyes={mascotCoverEyes} welcome={false} />
            </div>
            <p className="text-sm font-medium text-[#c5f467]">Qué bueno verte de nuevo</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-[2.1rem]">Inicia sesión</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">Entra a tu cuenta y continúa donde lo dejaste.</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading || loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {oauthLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Chrome size={18} strokeWidth={1.8} />
            )}
            Continuar con Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-white/35">o con tu correo</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">Correo electrónico</label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 transition focus-within:border-[#c5f467]/60 focus-within:ring-2 focus-within:ring-[#c5f467]/10">
                <Mail size={17} className="shrink-0 text-white/35" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-sm font-medium text-white/80">Contraseña</label>
                <Link href="/forgot-password" className="text-xs text-[#c5f467] transition hover:text-[#d8ff8d]">¿La olvidaste?</Link>
              </div>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 transition focus-within:border-[#c5f467]/60 focus-within:ring-2 focus-within:ring-[#c5f467]/10">
                <LockKeyhole size={17} className="shrink-0 text-white/35" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tu contraseña"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="rounded-md p-1 text-white/40 transition hover:text-white"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex justify-center overflow-x-auto">
              <Turnstile
                key={`login-captcha-${captchaKey}`}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                  setError("");
                }}
                onExpire={() => {
                  setCaptchaToken("");
                  setError("La verificación de seguridad expiró. Completa el CAPTCHA nuevamente.");
                }}
                onError={() => {
                  setCaptchaToken("");
                  setError("No se pudo cargar la verificación de seguridad. Inténtalo nuevamente.");
                }}
                options={{ language: "es", size: "flexible", appearance: "always" }}
              />
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.08] px-3.5 py-3 text-sm leading-5 text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c5f467] px-4 text-sm font-semibold text-[#171a12] transition hover:bg-[#d4ff84] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#171a12]/30 border-t-[#171a12]" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-white/45">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="font-medium text-[#c5f467] transition hover:text-[#d8ff8d]">Crear cuenta</Link>
          </p>
          <p className="mt-10 text-center text-xs text-white/25">Al continuar, accedes a tu espacio de aprendizaje en PeakScore.</p>
        </div>
      </section>
    </main>
  );
}
