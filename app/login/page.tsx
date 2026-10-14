
"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import { supabase } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [novaLogoFailed, setNovaLogoFailed] = useState(false);
  const [fallbackLogoFailed, setFallbackLogoFailed] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const disabled = loading || googleLoading;

  async function handleGoogleSignIn() {
    if (disabled) return;

    setError("");
    setGoogleLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });

      if (oauthError) {
        setError(
          "No se pudo iniciar sesión con Google. Inténtalo nuevamente.",
        );
        setGoogleLoading(false);
      }
    } catch {
      setError(
        "Ocurrió un problema al conectar con Google. Inténtalo nuevamente.",
      );
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) return;

    setError("");

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail) ||
      !password
    ) {
      setError("Completa un correo electrónico válido y tu contraseña.");
      return;
    }

    if (!captchaToken) {
      setError(
        "Completa la verificación de seguridad antes de iniciar sesión.",
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
          options: { captchaToken },
        });

      if (signInError) {
        setCaptchaToken("");
        setCaptchaKey((previous) => previous + 1);

        if (signInError.message.toLowerCase().includes("captcha")) {
          setError(
            "La verificación de seguridad expiró. Completa el CAPTCHA nuevamente.",
          );
        } else {
          setError("El correo o la contraseña no son correctos.");
        }

        return;
      }

      if (!data.session) {
        setCaptchaToken("");
        setCaptchaKey((previous) => previous + 1);
        setError("No se pudo establecer la sesión. Intenta nuevamente.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b0d] text-white">
      {/* Fondo de Peaky */}
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src="/images/auth/login-background2.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#080b0d]/95 via-[#080b0d]/75 via-[42%] to-[#080b0d]/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b0d]/40 via-transparent to-[#080b0d]/15" />
        <div className="absolute inset-y-0 left-0 w-full bg-[radial-gradient(ellipse_at_20%_50%,rgba(8,11,13,0.22),transparent_65%)]" />
      </div>

      {/* Formulario */}
      <section className="relative z-10 flex min-h-screen items-center px-5 py-10 sm:px-10 lg:px-[9%]">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-11 flex h-[76px] items-center">
            {!novaLogoFailed ? (
              <Image
                src="/images/branding/nuevologopeaky.png"
                alt="PeakScore"
                width={76}
                height={76}
                className="h-[76px] w-[76px] object-contain"
                onError={() => setNovaLogoFailed(true)}
                unoptimized
                priority
              />
            ) : !fallbackLogoFailed ? (
              <Image
                src="/images/branding/peakscore-logo-transparente2.png"
                alt="PeakScore"
                width={66}
                height={66}
                className="h-[54px] w-[54px] object-contain"
                onError={() => setFallbackLogoFailed(true)}
                unoptimized
                priority
              />
            ) : (
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight"
              >
                Peak<span className="text-[#c5f467]">Score</span>
              </Link>
            )}
          </div>

          {/* Encabezado */}
          <header className="mb-9">
            <p className="text-sm font-medium text-[#c5f467]">
              Nos alegra verte de nuevo
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-[2.15rem]">
              Bienvenido de nuevo
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/60">
              Inicia sesión y continúa avanzando a tu ritmo.
            </p>
          </header>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={disabled}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.055] text-sm font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="h-[18px] w-[18px]"
              >
                <path
                  fill="#4285F4"
                  d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"
                />
                <path
                  fill="#34A853"
                  d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 
              24 44Z"
                />
                <path
                  fill="#FBBC05"
                  d="M12.8 27.8a12 12 0 0 1 0-7.6v-5.3H5.9a20 20 0 0 0 0 18.2l6.9-5.3Z"
                />
                <path
                  fill="#EA4335"
                  d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.9 14.9l6.9 5.3C14.4 15.5 18.8 12 
              24 12Z"
                />
              </svg>
            )}
            {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
          </button>

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-white/40">
              o con tu correo
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Correo */}
            <div>
              <label
                htmlFor="email"
                className="mb-2.5 block text-sm font-medium text-white/85"
              >
                Correo electrónico
              </label>

              <div className="flex h-[46px] items-center gap-3 rounded-xl border border-white/10 bg-[#080b0d]/45 px-3.5 transition focus-within:border-[#c5f467]/60 focus-within:ring-2 focus-within:ring-[#c5f467]/10">
                <Mail
                  size={17}
                  className="shrink-0 text-white/40"
                  aria-hidden="true"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="correo@ejemplo.com"
                  required
                  maxLength={254}
                  disabled={disabled}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white/85"
                >
                  Contraseña
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs text-[#c5f467] transition-colors hover:text-[#dcff9b]"
                >
                  ¿La olvidaste?
                </Link>
              </div>

              <div className="flex h-[46px] items-center gap-3 rounded-xl border border-white/10 bg-[#080b0d]/45 px-3.5 transition focus-within:border-[#c5f467]/60 focus-within:ring-2 focus-within:ring-[#c5f467]/10">
                <LockKeyhole
                  size={17}
                  className="shrink-0 text-white/40"
                  aria-hidden="true"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Tu contraseña"
                  required
                  disabled={disabled}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-60"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="rounded-md p-1 text-white/45 transition-colors hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Cloudflare Turnstile */}
            <div className="min-w-0 py-0.5">
              <Turnstile
                key={`login-captcha-${captchaKey}`}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                  setError("");
                }}
                onExpire={() => {
                  setCaptchaToken("");
                  setError(
                    "La verificación de seguridad expiró. Completa el CAPTCHA nuevamente.",
                  );
                }}
                onError={() => {
                  setCaptchaToken("");
                  setError(
                    "No se pudo cargar la verificación de seguridad. Inténtalo nuevamente.",
                  );
                }}
                options={{
                  language: "es",
                  size: "flexible",
                  appearance: "always",
                }}
              />
            </div>

            {/* Errores */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-red-400/20 bg-red-400/[0.08] px-3.5 py-3 text-sm leading-5 text-red-200"
              >
                {error}
              </div>
            )}

            {/* Iniciar sesión */}
            <button
              type="submit"
              disabled={disabled || !captchaToken}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c5f467] px-4 text-sm font-semibold text-[#171a12] transition-colors hover:bg-[#d5ff86] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black"
                  />
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

          {/* Registro */}
          <p className="mt-8 text-center text-sm text-white/55">
            ¿Todavía no tienes una cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-[#c5f467] transition-colors hover:text-[#dcff9b]"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
