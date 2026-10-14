
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const LIME = "#C5F467";

function PasswordRequirements({ password }: { password: string }) {
  const requirements = [
    { label: "15 caracteres como mínimo", passed: password.length >= 15 },
    { label: "Una letra mayúscula", passed: /[A-Z]/.test(password) },
    { label: "Una letra minúscula", passed: /[a-z]/.test(password) },
    { label: "Un número", passed: /\d/.test(password) },
    { label: "Un símbolo", passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const strength = requirements.filter((item) => item.passed).length;

  return (
    <div className="mt-2 rounded-lg border border-white/[0.09] bg-white/[0.025] p-2.5">
      <div className="mb-2 flex gap-1">
        {requirements.map((item, index) => (
          <span
            key={item.label}
            className={`h-[3px] flex-1 rounded-full ${
              strength > index ? "bg-[#C5F467]" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">
        Seguridad de contraseña
      </p>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        {requirements.map((item) => (
          <p
            key={item.label}
            className={`flex items-center gap-1.5 text-[10px] leading-4 ${
              item.passed ? "text-[#C5F467]" : "text-white/45"
            }`}
          >
            <Check size={11} className="shrink-0" />
            {item.label}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const [legalAccepted, setLegalAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  const [pendingSignupEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return (
      window.sessionStorage.getItem("peakscore_pending_signup_email") ?? ""
    );
  });

  const [verificationMode, setVerificationMode] = useState(
    () => Boolean(pendingSignupEmail)
  );
  const [verificationEmail, setVerificationEmail] =
    useState(pendingSignupEmail);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSeconds, setVerificationSeconds] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(
    () => (pendingSignupEmail ? 0 : 60)
  );

  const strongPassword =
    password.length >= 15 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!verificationMode) return;

    const interval = window.setInterval(() => {
      setVerificationSeconds((previous) => Math.max(previous - 1, 0));
      setResendCooldown((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [verificationMode]);

  async function handleGoogleSignUp() {
    setError("");

    if (!legalAccepted) {
      setError(
        "Debes aceptar los Términos y Condiciones y el Aviso de Privacidad para continuar."
      );
      return;
    }

    setGoogleLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        console.error("[PeakScore] Error de Google OAuth.", {
          message: oauthError.message,
        });
        setError("No pudimos conectar con Google. Inténtalo nuevamente.");
        setGoogleLoading(false);
      }
    } catch {
      setError("Ocurrió un problema al iniciar el registro con Google.");
      setGoogleLoading(false);
    }
  }

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

    if (!strongPassword) {
      setError(
        "La contraseña debe tener al menos 15 caracteres e incluir mayúsculas, minúsculas, números y símbolos."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!legalAccepted) {
      setError(
        "Debes aceptar los Términos y Condiciones y el Aviso de Privacidad para crear tu cuenta."
      );
      return;
    }

    if (!captchaToken) {
      setError("Completa la verificación de seguridad para continuar.");
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

          setCaptchaToken("");
          setCaptchaKey((previous) => previous + 1);
          setVerificationMode(true);
          setPassword("");
          setConfirmPassword("");
          return;
        }

        setError(
          registerError.code === "over_email_send_rate_limit"
            ? "El servicio de correo alcanzó un límite temporal. Espera unos minutos antes de intentarlo nuevamente."
            : "No fue posible crear la cuenta. Verifica los datos e inténtalo nuevamente."
        );
        return;
      }

      setVerificationEmail(normalizedEmail);
      setVerificationCode("");
      setVerificationError("");
      setVerificationSeconds(600);
      setResendCooldown(60);
      setCaptchaToken("");
      setCaptchaKey((previous) => previous + 1);

      window.sessionStorage.setItem(
        "peakscore_pending_signup_email",
        normalizedEmail
      );

      setVerificationMode(true);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Ocurrió un error inesperado. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVerificationError("");

    const code = verificationCode.trim();

    if (!/^\d{8}$/.test(code)) {
      setVerificationError("Introduce el código completo de 8 dígitos.");
      return;
    }

    if (verificationSeconds <= 0) {
      setVerificationError("El código ha expirado. Solicita un nuevo código.");
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
        "No se pudo verificar el código. Inténtalo nuevamente."
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationError("");

    if (resendCooldown > 0) return;

    if (!verificationEmail) {
      setVerificationError("No encontramos el correo de verificación.");
      return;
    }

    if (!captchaToken) {
      setVerificationError(
        "Completa la verificación de seguridad antes de reenviar el código."
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

        setCaptchaToken("");
        setCaptchaKey((previous) => previous + 1);

        setVerificationError(
          resendError.message?.toLowerCase().includes("captcha")
            ? "La verificación de seguridad expiró. Completa el CAPTCHA nuevamente."
            : "No pudimos reenviar el código. Espera unos segundos e inténtalo nuevamente."
        );
        return;
      }

      setVerificationCode("");
      setCaptchaToken("");
      setCaptchaKey((previous) => previous + 1);
      setVerificationSeconds(600);
      setResendCooldown(60);
    } catch {
      setVerificationError("Ocurrió un error al reenviar el código.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleBackToRegister = () => {
    window.sessionStorage.removeItem("peakscore_pending_signup_email");
    setVerificationMode(false);
    setVerificationCode("");
    setCaptchaToken("");
    setCaptchaKey((previous) => previous + 1);
    setVerificationError("");
    setVerificationSeconds(600);
    setResendCooldown(60);
  };

  const inputClass =
    "h-9.5 w-full rounded-lg border border-white/10 bg-[#090B0D] pl-10 pr-4 text-[13px] text-white outline-none transition placeholder:text-white/30 focus:border-[#C5F467]/65 focus:ring-2 focus:ring-[#C5F467]/10";

  const labelClass = "mb-1 block text-[11px] font-medium text-white/75";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030405] text-white">
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
        className="pointer-events-none absolute inset-0 bg-black/45"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-4 sm:px-6">
        <section className="w-full max-w-[420px]">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#050606] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div
              aria-hidden="true"
              className="h-[2px] w-full"
              style={{
                background: `linear-gradient(90deg, ${LIME} 0%, rgba(197,244,103,0.16) 55%, transparent 100%)`,
              }}
            />

            <div className="px-5 py-4.5 sm:px-6 sm:py-5">
              {verificationMode ? (
                <>
                  <header className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C5F467]">
                      Seguridad de la cuenta
                    </p>
                    <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
                      Confirma tu correo
                    </h1>
                    <p className="mt-2 text-xs leading-5 text-white/55">
                      Introduce el código de ocho dígitos que enviamos a:
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-white">
                      {verificationEmail}
                    </p>
                  </header>

                  <form onSubmit={handleVerifyCode} className="space-y-3">
                    <div>
                      <label htmlFor="verification-code" className={labelClass}>
                        Código de verificación
                      </label>
                      <input
                        id="verification-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={8}
                        placeholder="00000000"
                        value={verificationCode}
                        onChange={(e) => {
                          setVerificationCode(
                            e.target.value.replace(/\D/g, "").slice(0, 8)
                          );
                          setVerificationError("");
                        }}
                        className="h-11 w-full rounded-lg border border-white/10 bg-[#090B0D] px-4 text-center text-xl font-semibold tracking-[0.35em] text-white outline-none placeholder:text-white/20 focus:border-[#C5F467]/65"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2">
                      <span className="text-xs text-white/55">
                        Tiempo restante
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-[#C5F467]">
                        {formatTime(verificationSeconds)}
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <Turnstile
                        key={`verification-captcha-${captchaKey}`}
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                        onSuccess={(token) => {
                          setCaptchaToken(token);
                          setVerificationError("");
                        }}
                        onExpire={() => {
                          setCaptchaToken("");
                          setVerificationError(
                            "La verificación de seguridad expiró."
                          );
                        }}
                        onError={() => {
                          setCaptchaToken("");
                          setVerificationError(
                            "No se pudo cargar la verificación."
                          );
                        }}
                        options={{ language: "es", size: "flexible" }}
                      />
                    </div>

                    {verificationError && (
                      <div
                        role="alert"
                        className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2.5 text-xs leading-5 text-red-200"
                      >
                        {verificationError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        verificationLoading || verificationCode.length !== 8
                      }
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C5F467] px-4 text-sm font-semibold text-[#10130A] transition hover:bg-[#D6FF87] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verificationLoading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Verificar correo
                          <Check className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={verificationLoading || resendCooldown > 0}
                      className="text-xs font-medium text-[#C5F467] transition hover:text-white disabled:text-white/30"
                    >
                      {resendCooldown > 0
                        ? `Reenviar en ${resendCooldown}s`
                        : "Reenviar código"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackToRegister}
                    className="mt-3 block w-full text-center text-xs text-white/45 transition hover:text-white"
                  >
                    ← Volver al registro
                  </button>
                </>
              ) : (
                <>
                  {/* El panel comienza directamente con el título */}
                  <header className="mb-4">
                    <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.04em] sm:text-[29px]">
                      Crea tu cuenta
                    </h1>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                      Prepárate para el ICFES. Supera tu marca.
                    </p>
                  </header>

                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={googleLoading || loading}
                    className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white text-sm font-semibold text-[#202124] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {googleLoading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
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
                          d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 24 44Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M12.8 27.8a12 12 0 0 1 0-7.6v-5.3H5.9a20 20 0 0 0 0 18.2l6.9-5.3Z"
                        />
                        <path
                          fill="#EA4335"
                          d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.9 14.9l6.9 5.3C14.4 15.5 18.8 12 24 12Z"
                        />
                      </svg>
                    )}
                    {googleLoading
                      ? "Conectando con Google..."
                      : "Continuar con Google"}
                  </button>

                  <div className="my-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-white/[0.09]" />
                    <span className="text-[10px] text-white/40">
                      O regístrate con tu correo
                    </span>
                    <span className="h-px flex-1 bg-white/[0.09]" />
                  </div>

                  <form onSubmit={handleRegister} className="space-y-2.5">
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Nombre completo
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                        <input
                          id="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Tu nombre"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setError("");
                          }}
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className={labelClass}>
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="tu@correo.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <label
                          htmlFor="password"
                          className="text-[11px] font-medium text-white/75"
                        >
                          Contraseña
                        </label>
                        <span className="text-[10px] text-white/40">
                          Mínimo 15 caracteres
                        </span>
                      </div>

                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Crea una contraseña segura"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                          }}
                          className={`${inputClass} pr-11`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white/40 transition hover:text-white"
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>

                      {password.length > 0 && (
                        <PasswordRequirements password={password} />
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className={labelClass}>
                        Confirmar contraseña
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Repite tu contraseña"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError("");
                          }}
                          className={`${inputClass} pr-11 ${
                            confirmPassword && confirmPassword !== password
                              ? "border-red-400/60"
                              : confirmPassword &&
                                  confirmPassword === password
                                ? "border-[#C5F467]/60"
                                : ""
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white/40 transition hover:text-white"
                          aria-label={
                            showConfirmPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>

                      {confirmPassword && confirmPassword !== password && (
                        <p className="mt-1 text-[10px] text-red-300">
                          Las contraseñas no coinciden.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 rounded-lg border border-white/[0.09] bg-white/[0.025] p-2.5">
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          checked={legalAccepted}
                          onChange={(e) => {
                            setLegalAccepted(e.target.checked);
                            setError("");
                          }}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#C5F467]"
                        />
                        <span className="text-[10px] leading-[1.5] text-white/55">
                          Acepto los{" "}
                          <Link
                            href="/terminos"
                            className="text-white/80 underline underline-offset-2 hover:text-[#C5F467]"
                          >
                            Términos y Condiciones
                          </Link>{" "}
                          y declaro haber leído el{" "}
                          <Link
                            href="/privacidad"
                            className="text-white/80 underline underline-offset-2 hover:text-[#C5F467]"
                          >
                            Aviso de Privacidad
                          </Link>{" "}
                          y la Política de Tratamiento de Datos de PeakScore.
                        </span>
                      </label>

                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          checked={marketingAccepted}
                          onChange={(e) =>
                            setMarketingAccepted(e.target.checked)
                          }
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#C5F467]"
                        />
                        <span className="text-[10px] leading-[1.5] text-white/40">
                          Quiero recibir novedades, promociones y contenido de
                          PeakScore. (Opcional)
                        </span>
                      </label>
                    </div>

                    <div className="flex justify-center overflow-hidden">
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
                            "La verificación de seguridad expiró. Completa el CAPTCHA nuevamente."
                          );
                        }}
                        onError={() => {
                          setCaptchaToken("");
                          setError(
                            "No se pudo cargar la verificación de seguridad."
                          );
                        }}
                        options={{ language: "es", size: "flexible" }}
                      />
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-xs leading-5 text-red-200"
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        loading ||
                        googleLoading ||
                        !captchaToken ||
                        !legalAccepted
                      }
                      className="group flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C5F467] px-4 text-sm font-semibold text-[#10130A] transition hover:bg-[#D6FF87] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {loading ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          Crear mi cuenta
                          <ArrowRight
                            size={15}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-3 text-center text-[11px] text-white/40">
                    ¿Ya tienes una cuenta?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-[#C5F467] transition hover:text-white"
                    >
                      Inicia sesión
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>

          <p className="mt-2 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-white/30">
            PeakScore · Preparación ICFES
          </p>
        </section>
      </div>
    </main>
  );
}
