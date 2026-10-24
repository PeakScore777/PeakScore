"use client";

import Image from "next/image";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase/browser";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-[21px] w-[21px] shrink-0"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"
      />
    </svg>
  );
}

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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  function resetCaptcha() {
    setCaptchaToken("");
    setCaptchaKey((current) => current + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || googleLoading) return;

    setError("");

    if (
      normalizedEmail.length > 254 ||
      !/^([^\s@]+)@([^\s@]+)\.([^\s@]{2,})$/.test(normalizedEmail) ||
      !password
    ) {
      setError("Escribe un correo electrónico válido y tu contraseña.");
      return;
    }

    if (!captchaToken) {
      setError("Completa la verificación de seguridad antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
          options: {
            captchaToken,
          },
        });

      if (signInError) {
        resetCaptcha();

        setError(
          signInError.message.toLowerCase().includes("captcha")
            ? "La verificación expiró. Complétala de nuevo."
            : "El correo o la contraseña no son correctos."
        );

        return;
      }

      if (!data.session) {
        resetCaptcha();
        setError("No se pudo establecer la sesión. Inténtalo de nuevo.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      resetCaptcha();
      setError("Ocurrió un error inesperado. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (loading || googleLoading) return;

    setError("");
    setGoogleLoading(true);

    try {
      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

      if (oauthError) {
        setError("No pudimos iniciar sesión con Google. Inténtalo de nuevo.");
        setGoogleLoading(false);
      }
    } catch {
      setError("No pudimos conectar con Google. Inténtalo nuevamente.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="login-root relative min-h-screen overflow-hidden bg-[#08090b] text-white">
      {/* Elimina bordes y fondos nativos de los inputs, incluido autofill */}
      <style jsx global>{`
        .login-root input,
        .login-root input:focus,
        .login-root input:active {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          background: transparent !important;
          border: 0 !important;
          border-radius: 0 !important;
          outline: none !important;
          appearance: none !important;
          -webkit-appearance: none !important;
        }

        .login-root input:-webkit-autofill,
        .login-root input:-webkit-autofill:hover,
        .login-root input:-webkit-autofill:focus,
        .login-root input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0 1000px #101114 inset !important;
          box-shadow: 0 0 0 1000px #101114 inset !important;
          background-color: #101114 !important;
          border: 0 !important;
          border-radius: 0 !important;
          transition: background-color 99999s ease-out 0s;
        }

        .login-root input::placeholder {
          color: #777982 !important;
          opacity: 1;
        }

        .login-root input:-moz-autofill {
          filter: none;
          color: #ffffff !important;
          background-color: #101114 !important;
        }
      `}</style>

      {/* Fondo de Peaky. Se alinea a la derecha para aprovechar la escena */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[76%] lg:block"
      >
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage:
              "url('/images/branding/peaky-login-background.png')",
            backgroundSize: "auto 112%",
            backgroundPosition: "right center",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#08090b] via-[#08090b]/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090b]/40 via-transparent to-[#08090b]/10" />
      </div>

      {/* Fondo de respaldo en móvil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(8,9,11,.92),rgba(8,9,11,.97)),url('/images/branding/peaky-login-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "right center",
        }}
      />

      {/* PANEL IZQUIERDO: más ancho y contenido desplazado hacia la derecha */}
      <section className="relative z-10 flex min-h-screen w-full items-center border-r border-white/[0.08] bg-[#08090b]/96 px-5 py-8 sm:px-8 lg:w-[39%] lg:min-w-[470px] lg:max-w-[610px] lg:justify-end lg:pl-[3.5vw] lg:pr-[2.5vw] xl:min-w-0 xl:pl-[4vw] xl:pr-[2.5vw]">
        <div className="mx-auto w-full max-w-[450px]">
          {/* Logo, sin círculo, borde ni tarjeta */}
          <Link
            href="/"
            aria-label="Volver al inicio de PeakScore"
            className="mb-7 inline-flex items-center gap-3 transition-opacity hover:opacity-75 sm:mb-8"
          >
            <Image
              src="/images/branding/peaky-monochrome.png" width={1200} height={800} alt="Símbolo de PeakScore"
              className="h-11 w-11 object-contain sm:h-12 sm:w-12"
            />

            <span className="text-[24px] font-semibold tracking-[-0.06em] text-white sm:text-[26px]">
              PeakScore
            </span>
          </Link>

          {/* Encabezado */}
          <header className="mb-6 sm:mb-7">
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-400">
              Acceso a tu cuenta
            </p>

            <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.06em] text-white sm:text-[38px]">
              Bienvenido de nuevo.
            </h1>

            <p className="mt-3 max-w-[390px] text-[14px] leading-6 text-zinc-400 sm:text-[15px]">
              Inicia sesión para continuar con tu preparación y consultar tu
              progreso.
            </p>
          </header>

          {/* Google: botón ancho, centrado y limpio */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="group relative flex min-h-[52px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/15 bg-white px-5 py-3 text-[14px] font-semibold text-zinc-900 shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-zinc-100 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {googleLoading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}

            <span>
              {googleLoading
                ? "Conectando con Google..."
                : "Continuar con Google"}
            </span>

            {!googleLoading && (
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
            )}
          </button>

          {/* Separador */}
          <div className="my-7 flex items-center gap-4 sm:my-8">
            <span className="h-px flex-1 bg-white/[0.12]" />
            <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              O continúa con tu correo
            </span>
            <span className="h-px flex-1 bg-white/[0.12]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Correo */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[12px] font-medium text-zinc-300"
              >
                Correo electrónico
              </label>

              <div
                className={`flex h-[54px] w-full items-center overflow-hidden rounded-xl border bg-[#101114] transition ${
                  emailFocused
                    ? "border-white/45 ring-2 ring-white/[0.06]"
                    : "border-white/[0.13] hover:border-white/25"
                }`}
              >
                <span className="flex h-full w-12 shrink-0 items-center justify-center text-zinc-500">
                  <Mail size={19} strokeWidth={1.7} />
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="correo@ejemplo.com"
                  className="login-input h-full min-w-0 flex-1 px-1 pr-4 text-[14px] font-medium text-white"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-[13px] font-medium text-zinc-300"
                >
                  Contraseña
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium text-zinc-400 transition hover:text-white"
                >
                  ¿La olvidaste?
                </Link>
              </div>

              <div
                className={`flex h-[54px] w-full items-center overflow-hidden rounded-xl border bg-[#101114] transition ${
                  passwordFocused
                    ? "border-white/45 ring-2 ring-white/[0.06]"
                    : "border-white/[0.13] hover:border-white/25"
                }`}
              >
                <span className="flex h-full w-12 shrink-0 items-center justify-center text-zinc-500">
                  <KeyRound size={19} strokeWidth={1.7} />
                </span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Tu contraseña"
                  className="login-input h-full min-w-0 flex-1 px-1 text-[14px] font-medium text-white"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  className="flex h-full w-12 shrink-0 items-center justify-center text-zinc-500 transition hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Cloudflare Turnstile real */}
            <div className="rounded-xl border border-white/[0.10] bg-[#101114] p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-zinc-300" />
                <span className="text-[12px] font-medium text-zinc-300">
                  Verificación de seguridad
                </span>
                <span className="ml-auto text-[10px] text-zinc-500">
                  Protegido por Cloudflare
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center overflow-hidden">
                <Turnstile
                  key={`login-captcha-${captchaKey}`}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => {
                    setCaptchaToken(token);
                    setError("");
                  }}
                  onExpire={() => {
                    setCaptchaToken("");
                    setError("La verificación expiró. Complétala nuevamente.");
                  }}
                  onError={() => {
                    setCaptchaToken("");
                    setError(
                      "No se pudo cargar Cloudflare. Inténtalo nuevamente."
                    );
                  }}
                  options={{
                    language: "es",
                    size: "flexible",
                    appearance: "always",
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-[13px] leading-5 text-red-300"
              >
                {error}
              </div>
            )}

            {/* Botón de acceso */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* Crear cuenta */}
          <p className="mt-5 text-center text-[12px] text-zinc-400">
            ¿Todavía no tienes una cuenta?{" "}
            <Link
              href="/register"
              className="font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
            >
              Crear cuenta
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-zinc-600">
            <ShieldCheck size={13} />
            <span>Conexión protegida · PeakScore</span>
          </div>
        </div>
      </section>
    </main>
  );
}
