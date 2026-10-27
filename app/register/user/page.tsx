
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

const ALLOWED_PASSWORD_SYMBOLS = new Set([
  "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "-", "=",
  "[", "]", "{", "}", ";", "'", ":", "\"",
  "\\", "|", "<", ">", "?", ",", ".", "/", "`", "~",
]);

function hasAllowedPasswordSymbol(value: string): boolean {
  return [...value].some((character) =>
    ALLOWED_PASSWORD_SYMBOLS.has(character),
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-[18px] w-[18px] shrink-0"
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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const [legalAccepted, setLegalAccepted] = useState(false);

  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSeconds, setVerificationSeconds] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    const pendingEmail = window.sessionStorage.getItem(
      "peakscore_pending_signup_email"
    );

    if (pendingEmail) {
      setVerificationEmail(pendingEmail);
      setVerificationMode(true);
      setVerificationSeconds(600);
      setResendCooldown(0);
    }
  }, []);

  useEffect(() => {
    if (!verificationMode) return;

    const interval = window.setInterval(() => {
      setVerificationSeconds((previous) => Math.max(previous - 1, 0));
      setResendCooldown((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [verificationMode]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const hasMinLength = password.length >= 15;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = hasAllowedPasswordSymbol(password);

  const passwordStrength = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  const passwordRequirements = [
    { label: "15 caracteres como mínimo", valid: hasMinLength },
    { label: "Una mayúscula", valid: hasUppercase },
    { label: "Una minúscula", valid: hasLowercase },
    { label: "Un número", valid: hasNumber },
    { label: "Un símbolo permitido por el servicio", valid: hasSymbol },
  ];

  function resetCaptcha() {
    setCaptchaToken("");
    setCaptchaKey((previous) => previous + 1);
  }

  async function handleGoogleRegister() {
    if (loading || googleLoading) return;

    setError("");

    if (!legalAccepted) {
      setError(
        "Acepta los Términos y Condiciones y el Aviso de Privacidad para continuar."
      );
      return;
    }

    setGoogleLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        console.error("[PeakScore] Error iniciando OAuth.", {
          errorCode: oauthError.code ?? "UNKNOWN",
          status: oauthError.status ?? "UNKNOWN",
        });

        setError(
          "No pudimos continuar con Google. Comprueba la configuración e inténtalo nuevamente."
        );
        setGoogleLoading(false);
      }
    } catch {
      setError("No fue posible conectar con Google. Inténtalo nuevamente.");
      setGoogleLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || googleLoading) return;

    setError("");

    const cleanName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!cleanName || !normalizedEmail || !password || !confirmPassword) {
      setError("Completa todos los campos para continuar.");
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 120) {
      setError("Introduce un nombre válido.");
      return;
    }

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail) ||
      normalizedEmail.includes("..")
    ) {
      setError("Introduce un correo electrónico válido.");
      return;
    }

    const strongPassword =
      password.length >= 15 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      hasAllowedPasswordSymbol(password);

    if (!strongPassword) {
      setError(
        "La contraseña debe tener al menos 15 caracteres e incluir mayúsculas, minúsculas, números y un símbolo admitido (por ejemplo: !, @, # o $)."
      );
      setPasswordFocused(true);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!legalAccepted) {
      setError(
        "Acepta los Términos y Condiciones y el Aviso de Privacidad para continuar."
      );
      return;
    }

    if (!captchaToken) {
      setError("Completa la verificación de Cloudflare para continuar.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: registerError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          captchaToken,
          data: { full_name: cleanName },
        },
      });

      if (registerError) {
        console.error("[PeakScore] Registro rechazado por Auth.", {
          errorCode: registerError.code ?? "UNKNOWN",
          status: registerError.status ?? "UNKNOWN",
        });

        if (data.user && !data.session) {
          window.sessionStorage.setItem(
            "peakscore_pending_signup_email",
            normalizedEmail
          );

          setVerificationEmail(normalizedEmail);
          setVerificationCode("");
          setVerificationError(
            registerError.code === "over_email_send_rate_limit"
              ? "La cuenta puede haberse creado, pero el correo alcanzó un límite temporal. Intenta reenviar el código más tarde."
              : "La cuenta puede haber quedado pendiente de verificación. Revisa tu correo o solicita un nuevo código."
          );
          setVerificationSeconds(600);
          setResendCooldown(
            registerError.code === "over_email_send_rate_limit" ? 60 : 0
          );

          resetCaptcha();
          setVerificationMode(true);
          setPassword("");
          setConfirmPassword("");
          return;
        }

        const backendPasswordPolicyError =
          registerError.message
            .toLowerCase()
            .includes("password should contain at least one character of each") ||
          registerError.message.toLowerCase().includes("password does not meet");

        setError(
          registerError.code === "over_email_send_rate_limit"
            ? "El servicio de correo alcanzó un límite temporal. Espera unos minutos antes de intentarlo nuevamente."
            : backendPasswordPolicyError
              ? "La contraseña no cumple la política de seguridad: usa mayúscula, minúscula, número y un símbolo admitido como !, @, # o $."
              : registerError.code === "captcha_failed"
                ? "La verificación de seguridad expiró o no se validó. Completa Cloudflare nuevamente."
                : "No fue posible crear la cuenta. Verifica los datos e inténtalo nuevamente."
        );

        resetCaptcha();
        return;
      }

      setVerificationEmail(normalizedEmail);
      setVerificationCode("");
      setVerificationError("");
      setVerificationSeconds(600);
      setResendCooldown(60);

      window.sessionStorage.setItem(
        "peakscore_pending_signup_email",
        normalizedEmail
      );

      resetCaptcha();
      setVerificationMode(true);
      setPassword("");
      setConfirmPassword("");
    } catch {
      resetCaptcha();
      setError(
        "Ocurrió un error al crear la cuenta. Comprueba tu conexión e inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerificationError("");

    const code = verificationCode.trim();

    if (!/^\d{8}$/.test(code)) {
      setVerificationError("Introduce el código completo de 8 dígitos.");
      return;
    }

    if (verificationSeconds <= 0) {
      setVerificationError("El código ha expirado. Solicita uno nuevo.");
      return;
    }

    setVerificationLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: code,
        type: "email",
      });

      if (verifyError) {
        setVerificationError(
          "El código no es válido o ya expiró. Revisa el código e inténtalo nuevamente."
        );
        return;
      }

      await supabase.auth.signOut();
      window.sessionStorage.removeItem("peakscore_pending_signup_email");
      window.location.href = "/login?verified=1";
    } catch {
      setVerificationError(
        "Ocurrió un error al verificar el código. Inténtalo nuevamente."
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  async function handleResendCode() {
    setVerificationError("");

    if (resendCooldown > 0 || verificationLoading) return;

    if (!verificationEmail) {
      setVerificationError("No encontramos el correo de verificación.");
      return;
    }

    if (!captchaToken) {
      setVerificationError(
        "Completa Cloudflare antes de reenviar el código."
      );
      return;
    }

    setVerificationLoading(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: verificationEmail,
        options: { captchaToken },
      });

      if (resendError) {
        console.error("[PeakScore] Error reenviando código.", {
          errorCode: resendError.code ?? "UNKNOWN",
          status: resendError.status ?? "UNKNOWN",
        });

        resetCaptcha();
        setVerificationError(
          resendError.message?.toLowerCase().includes("captcha")
            ? "La verificación expiró. Completa Cloudflare nuevamente."
            : "No pudimos reenviar el código. Espera unos segundos e inténtalo nuevamente."
        );
        return;
      }

      setVerificationCode("");
      setVerificationSeconds(600);
      setResendCooldown(60);
      resetCaptcha();
    } catch {
      resetCaptcha();
      setVerificationError(
        "Ocurrió un error al reenviar el código. Inténtalo nuevamente."
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  function handleBackToRegister() {
    window.sessionStorage.removeItem("peakscore_pending_signup_email");

    setVerificationMode(false);
    setVerificationCode("");
    setCaptchaToken("");
    setCaptchaKey((previous) => previous + 1);
    setVerificationError("");
    setVerificationSeconds(600);
    setResendCooldown(60);
  }

  return (
    <main className="register-user-page relative min-h-screen overflow-x-hidden bg-[#02040c] text-white">
      <style jsx global>{`
        .register-user-page {
          color-scheme: dark;
        }

        .register-user-page input:not([type="checkbox"]) {
          color: #f5f5f5 !important;
          -webkit-text-fill-color: #f5f5f5 !important;
          caret-color: #ffffff !important;
        }

        .register-user-page input:not([type="checkbox"]):-webkit-autofill,
        .register-user-page input:not([type="checkbox"]):-webkit-autofill:hover,
        .register-user-page input:not([type="checkbox"]):-webkit-autofill:focus,
        .register-user-page input:not([type="checkbox"]):-webkit-autofill:active {
          -webkit-text-fill-color: #f5f5f5 !important;
          caret-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0 1000px #111111 inset !important;
          box-shadow: 0 0 0 1000px #111111 inset !important;
          background-color: #111111 !important;
          transition: background-color 99999s ease-out 0s;
        }

        .register-user-page input::placeholder {
          color: #737373 !important;
          opacity: 1;
        }

        .register-user-page input[type="checkbox"] {
          accent-color: #ffffff;
        }

        .register-user-page a:focus-visible,
        .register-user-page button:focus-visible,
        .register-user-page input:focus-visible {
          outline: 2px solid #a3a3a3;
          outline-offset: 3px;
        }
      `}</style>

      {/* Fondo exterior original: ambos Peakys permanecen intactos */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat lg:block"
        style={{
          backgroundImage: "url('/images/register/register_user_bg.webp')",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat lg:hidden"
        style={{
          backgroundImage:
            "url('/images/register/register_user_bg-mobile.webp')",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black/10"
      />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-5 sm:px-6 sm:py-7">
        {/* Tamaño inspirado en la tarjeta compacta de referencia */}
        <section className="w-full max-w-[460px]">
          <div className="overflow-hidden rounded-2xl border border-white/[0.14] bg-[#0a0a0c]/[0.97] shadow-[0_24px_80px_rgba(0,0,0,0.72)] backdrop-blur-xl">
            <div className="px-5 py-6 sm:px-7 sm:py-7">
              {!verificationMode ? (
                <>
                  {/* Título centrado, sin marca adicional dentro del panel */}
                  <header className="mb-5 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.035]">
                      <ShieldCheck size={19} strokeWidth={1.6} />
                    </div>

                    <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.045em] text-white">
                      Crea tu cuenta
                    </h1>

                    <p className="mx-auto mt-2 max-w-[310px] text-[11px] leading-5 text-neutral-400">
                      Crea tu acceso y comienza a preparar tus próximos retos.
                    </p>
                  </header>

                  {/* Google en la parte superior */}
                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={googleLoading || loading || !legalAccepted}
                    className="group relative flex h-[45px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-lg border border-white/15 bg-white px-4 text-[12px] font-semibold text-[#171717] transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-45 sm:text-[13px]"
                  >
                    {googleLoading ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}

                    <span>
                      {googleLoading
                        ? "Conectando con Google..."
                        : "Continuar con Google"}
                    </span>

                    {!googleLoading && (
                      <ArrowRight
                        size={14}
                        className="text-neutral-500 transition-transform group-hover:translate-x-1"
                      />
                    )}
                  </button>

                  <p className="mt-2 text-center text-[10px] leading-4 text-neutral-500">
                    Acepta los términos al final del formulario para continuar.
                  </p>

                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-white/10" />
                    <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.13em] text-neutral-500">
                      O regístrate con correo
                    </span>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>

                  <form onSubmit={handleRegister} className="space-y-3.5" noValidate>
                    {/* Nombre */}
                    <div>
                      <label
                        htmlFor="register-name"
                        className="mb-1.5 block text-[11px] font-medium text-neutral-300"
                      >
                        Nombre completo
                      </label>

                      <div className="relative">
                        <User
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                        />

                        <input
                          id="register-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          minLength={2}
                          maxLength={120}
                          placeholder="Tu nombre completo"
                          value={name}
                          onChange={(event) => {
                            setName(event.target.value);
                            setError("");
                          }}
                          className="h-[44px] w-full rounded-lg border border-white/[0.12] bg-[#111111] pl-9 pr-3 text-[12px] outline-none transition focus:border-neutral-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Correo */}
                    <div>
                      <label
                        htmlFor="register-email"
                        className="mb-1.5 block text-[11px] font-medium text-neutral-300"
                      >
                        Correo electrónico
                      </label>

                      <div className="relative">
                        <Mail
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                        />

                        <input
                          id="register-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          maxLength={254}
                          placeholder="tu@correo.com"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            setError("");
                          }}
                          className="h-[44px] w-full rounded-lg border border-white/[0.12] bg-[#111111] pl-9 pr-3 text-[12px] outline-none transition focus:border-neutral-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <label
                          htmlFor="register-password"
                          className="text-[11px] font-medium text-neutral-300"
                        >
                          Contraseña
                        </label>

                        <span className="text-[9px] text-neutral-500">
                          Mínimo 15 caracteres
                        </span>
                      </div>

                      <div className="relative">
                        <Lock
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                        />

                        <input
                          id="register-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={15}
                          placeholder="Crea una contraseña segura"
                          value={password}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => {
                            if (!password) setPasswordFocused(false);
                          }}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            setError("");
                          }}
                          className="h-[44px] w-full rounded-lg border border-white/[0.12] bg-[#111111] pl-9 pr-10 text-[12px] outline-none transition focus:border-neutral-500"
                          required
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((previous) => !previous)}
                          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-neutral-500 transition hover:text-white"
                          aria-label={
                            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>

                      {/* Requisitos ocultos hasta entrar en el campo */}
                      {(passwordFocused || password.length > 0) && (
                        <div className="mt-2 rounded-lg border border-white/[0.09] bg-white/[0.025] p-2.5">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-neutral-300">
                              Requisitos de contraseña
                            </span>
                            <span className="text-[9px] tabular-nums text-neutral-500">
                              {passwordStrength}/5
                            </span>
                          </div>

                          <div className="mb-2 flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <span
                                key={level}
                                className={`h-[3px] flex-1 rounded-full ${
                                  passwordStrength >= level
                                    ? "bg-neutral-200"
                                    : "bg-white/10"
                                }`}
                              />
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                            {passwordRequirements.map((requirement) => (
                              <div
                                key={requirement.label}
                                className="flex items-center gap-1.5"
                              >
                                <span
                                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                                    requirement.valid
                                      ? "border-neutral-200 bg-neutral-200 text-black"
                                      : "border-neutral-700 text-transparent"
                                  }`}
                                >
                                  {requirement.valid && (
                                    <Check size={9} strokeWidth={3} />
                                  )}
                                </span>

                                <span
                                  className={`text-[9px] ${
                                    requirement.valid
                                      ? "text-neutral-200"
                                      : "text-neutral-500"
                                  }`}
                                >
                                  {requirement.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirmación */}
                    <div>
                      <label
                        htmlFor="register-confirm-password"
                        className="mb-1.5 block text-[11px] font-medium text-neutral-300"
                      >
                        Confirmar contraseña
                      </label>

                      <div className="relative">
                        <Lock
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                        />

                        <input
                          id="register-confirm-password"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={15}
                          placeholder="Repite tu contraseña"
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            setError("");
                          }}
                          className="h-[44px] w-full rounded-lg border border-white/[0.12] bg-[#111111] pl-9 pr-10 text-[12px] outline-none transition focus:border-neutral-500"
                          required
                        />

                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((previous) => !previous)}
                          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-neutral-500 transition hover:text-white"
                          aria-label={
                            showConfirmPassword
                              ? "Ocultar confirmación"
                              : "Mostrar confirmación"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>

                      {confirmPassword.length > 0 && (
                        <p className="mt-1.5 text-[10px] text-neutral-400">
                          {confirmPassword === password
                            ? "Las contraseñas coinciden."
                            : "Las contraseñas todavía no coinciden."}
                        </p>
                      )}
                    </div>

                    {/* Cloudflare, debajo de los campos */}
                    <div className="flex min-h-[72px] items-center justify-center overflow-hidden rounded-lg border border-white/[0.10] bg-[#101010] px-2 py-2">
                      <Turnstile
                        key={`register-captcha-${captchaKey}`}
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                        onSuccess={(token) => {
                          setCaptchaToken(token);
                          setError("");
                        }}
                        onExpire={() => {
                          setCaptchaToken("");
                          setError(
                            "La verificación expiró. Completa Cloudflare nuevamente."
                          );
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
                        }}
                      />
                    </div>

                    {error && (
                      <div
                        role="alert"
                        aria-live="polite"
                        className="rounded-lg border border-red-400/20 bg-red-400/[0.07] px-3 py-2.5 text-[11px] leading-5 text-red-200"
                      >
                        {error}
                      </div>
                    )}

                    {/* Términos al final, como en la referencia */}
                    <div className="border-t border-white/[0.08] pt-3">
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={legalAccepted}
                          onChange={(event) => {
                            setLegalAccepted(event.target.checked);
                            setError("");
                          }}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-neutral-700"
                        />

                        <span className="text-[10px] leading-[1.6] text-neutral-400">
                          Al crear tu cuenta aceptas los{" "}
                          <Link
                            href="/terminos-y-condiciones"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-neutral-200 underline decoration-neutral-600 underline-offset-2 hover:text-white hover:decoration-white"
                          >
                            Términos y Condiciones
                          </Link>{" "}
                          y confirmas que has leído el{" "}
                          <Link
                            href="/politica-de-privacidad"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-neutral-200 underline decoration-neutral-600 underline-offset-2 hover:text-white hover:decoration-white"
                          >
                            Aviso de Privacidad
                          </Link>
                          .
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || googleLoading || !captchaToken || !legalAccepted}
                      className="group flex h-[45px] w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-[12px] font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-45 sm:text-[13px]"
                    >
                      {loading ? (
                        <>
                          <LoaderCircle size={16} className="animate-spin" />
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          Crear cuenta
                          <ArrowRight
                            size={15}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-4 text-center text-[11px] text-neutral-400">
                    ¿Ya tienes una cuenta?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-white underline decoration-neutral-600 underline-offset-4 hover:decoration-white"
                    >
                      Iniciar sesión
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  {/* Verificación de correo */}
                  <button
                    type="button"
                    onClick={handleBackToRegister}
                    className="mb-5 inline-flex items-center gap-2 text-[12px] text-neutral-400 hover:text-white"
                  >
                    <ArrowLeft size={15} />
                    Volver al registro
                  </button>

                  <header className="mb-5 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.035]">
                      <Mail size={18} />
                    </div>

                    <h2 className="text-[25px] font-semibold tracking-[-0.04em]">
                      Confirma tu correo
                    </h2>

                    <p className="mt-2 text-[11px] leading-5 text-neutral-400">
                      Introduce el código de 8 dígitos enviado a
                    </p>

                    <p className="mt-1 break-all text-[11px] font-medium text-white">
                      {verificationEmail}
                    </p>
                  </header>

                  <div className="rounded-lg border border-white/[0.10] bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400">
                        Tiempo restante
                      </span>
                      <span className="text-[12px] font-medium tabular-nums">
                        {formatTime(verificationSeconds)}
                      </span>
                    </div>

                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-neutral-200 transition-all"
                        style={{
                          width: `${Math.max(
                            0,
                            (verificationSeconds / 600) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <form
                    onSubmit={handleVerifyCode}
                    className="mt-4 space-y-3.5"
                  >
                    <div>
                      <label
                        htmlFor="verification-code"
                        className="mb-1.5 block text-[11px] font-medium text-neutral-300"
                      >
                        Código de verificación
                      </label>

                      <input
                        id="verification-code"
                        name="verificationCode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{8}"
                        maxLength={8}
                        required
                        value={verificationCode}
                        onChange={(event) => {
                          setVerificationCode(
                            event.target.value.replace(/\D/g, "").slice(0, 8)
                          );
                          setVerificationError("");
                        }}
                        placeholder="00000000"
                        className="h-[48px] w-full rounded-lg border border-white/[0.12] bg-[#111111] px-4 text-center text-xl font-semibold tracking-[0.3em] text-white outline-none focus:border-neutral-500"
                      />
                    </div>

                    <div className="flex min-h-[72px] items-center justify-center overflow-hidden rounded-lg border border-white/[0.10] bg-[#101010] px-2 py-2">
                      <Turnstile
                        key={`verification-captcha-${captchaKey}`}
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                        onSuccess={(token) => {
                          setCaptchaToken(token);
                          setVerificationError("");
                        }}
                        onExpire={() => setCaptchaToken("")}
                        onError={() => setCaptchaToken("")}
                        options={{
                          language: "es",
                          size: "flexible",
                        }}
                      />
                    </div>

                    {verificationError && (
                      <div
                        role="alert"
                        className="rounded-lg border border-red-400/20 bg-red-400/[0.07] px-3 py-2.5 text-[11px] leading-5 text-red-200"
                      >
                        {verificationError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        verificationLoading ||
                        verificationCode.length !== 8 ||
                        verificationSeconds <= 0
                      }
                      className="flex h-[45px] w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-[12px] font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {verificationLoading ? (
                        <>
                          <LoaderCircle size={16} className="animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          Verificar correo
                          <Check size={15} />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={verificationLoading || resendCooldown > 0}
                      className="text-[11px] font-medium text-neutral-300 hover:text-white disabled:cursor-not-allowed disabled:text-neutral-600"
                    >
                      {resendCooldown > 0
                        ? `Reenviar código en ${resendCooldown}s`
                        : "Reenviar código"}
                    </button>
                  </div>

                  <p className="mt-4 text-center text-[10px] leading-5 text-neutral-500">
                    Si no encuentras el mensaje, revisa la carpeta de spam.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
