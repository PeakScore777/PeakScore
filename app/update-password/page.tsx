
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

const MIN_PASSWORD_LENGTH = 15;

function getRecoveryErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "El enlace de recuperación no es válido o ya no está disponible.";
  }

  const value = error as { code?: string; message?: string };
  const code = value.code ?? "";
  const message = (value.message ?? "").toLowerCase();

  if (
    code === "otp_expired" ||
    message.includes("expired") ||
    message.includes("invalid")
  ) {
    return "El enlace de recuperación expiró o ya fue utilizado. Solicita un nuevo enlace.";
  }

  return "No pudimos validar el enlace de recuperación. Solicita un nuevo enlace e inténtalo nuevamente.";
}

function PasswordRequirements({
  password,
  confirmation,
}: {
  password: string;
  confirmation: string;
}) {
  const requirements = [
    {
      label: "15 caracteres como mínimo",
      passed: password.length >= MIN_PASSWORD_LENGTH,
    },
    { label: "Una letra mayúscula", passed: /[A-Z]/.test(password) },
    { label: "Una letra minúscula", passed: /[a-z]/.test(password) },
    { label: "Un número", passed: /\d/.test(password) },
    {
      label: "Un símbolo",
      passed: /[^A-Za-z0-9]/.test(password),
    },
    {
      label: "Las contraseñas coinciden",
      passed: password.length > 0 && password === confirmation,
    },
  ];

  const strength = requirements.slice(0, 5).filter((item) => item.passed).length;

  return (
    <div className="rounded-lg border border-white/[0.09] bg-white/[0.025] p-3">
      <div className="mb-2 flex gap-1">
        {requirements.slice(0, 5).map((item, index) => (
          <span
            key={item.label}
            className={`h-[3px] flex-1 rounded-full ${
              strength > index ? "bg-[#C5F467]" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">
        Requisitos de contraseña
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

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [ready, setReady] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeRecovery() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const authError = url.searchParams.get("error");
        const authErrorCode = url.searchParams.get("error_code");

        if (authError || authErrorCode) {
          if (mounted) {
            setError(
              "El enlace de recuperación expiró o ya fue utilizado. Solicita un nuevo enlace."
            );
            setCheckingRecovery(false);
          }
          return;
        }

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            if (mounted) {
              setError(getRecoveryErrorMessage(exchangeError));
              setCheckingRecovery(false);
            }
            return;
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          setError(
            "El enlace de recuperación no es válido o ya no está disponible. Solicita un nuevo enlace."
          );
          setCheckingRecovery(false);
          return;
        }

        setReady(true);
        setCheckingRecovery(false);
      } catch (recoveryError) {
        console.error(
          "[PeakScore] Error inicializando recuperación de contraseña.",
          {
            errorName:
              recoveryError instanceof Error
                ? recoveryError.name
                : "UnknownError",
          }
        );

        if (mounted) {
          setError(
            "No pudimos validar el enlace de recuperación. Solicita un nuevo enlace e inténtalo nuevamente."
          );
          setCheckingRecovery(false);
        }
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "PASSWORD_RECOVERY" || Boolean(session)) {
          setReady(true);
          setCheckingRecovery(false);
          setError("");
        }
      }
    );

    void initializeRecovery();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const strongPassword =
      password.length >= MIN_PASSWORD_LENGTH &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!strongPassword) {
      setError(
        "La contraseña debe tener al menos 15 caracteres e incluir mayúsculas, minúsculas, números y símbolos."
      );
      return;
    }

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!ready) {
      setError(
        "El enlace de recuperación ya no está disponible. Solicita uno nuevo."
      );
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("[PeakScore] Error actualizando contraseña.", {
          errorCode: updateError.code ?? "UNKNOWN",
          status: updateError.status ?? "UNKNOWN",
        });

        setError(getRecoveryErrorMessage(updateError));
        return;
      }

      const { error: signOutError } = await supabase.auth.signOut({
        scope: "global",
      });

      if (signOutError) {
        console.warn(
          "[PeakScore] La contraseña se actualizó, pero no fue posible revocar todas las sesiones.",
          { errorCode: signOutError.code ?? "UNKNOWN" }
        );
      }

      setPassword("");
      setConfirmation("");
      setSuccess(true);
      setReady(false);
    } catch (updateError) {
      console.error(
        "[PeakScore] Error inesperado actualizando contraseña.",
        {
          errorName:
            updateError instanceof Error
              ? updateError.name
              : "UnknownError",
        }
      );

      setError(
        "No fue posible actualizar la contraseña. Solicita un nuevo enlace e inténtalo nuevamente."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050607] px-4 py-6 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(197,244,103,0.07),transparent_55%)]"
      />

      <section className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#090B0D] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="h-[3px] bg-gradient-to-r from-[#C5F467] via-[#C5F467]/30 to-transparent" />

        <div className="p-5 sm:p-7">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-white/45 transition hover:text-[#C5F467]"
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </Link>

          {success ? (
            <div className="pt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C5F467]/20 bg-[#C5F467]/10 text-[#C5F467]">
                <Check size={21} />
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                Contraseña actualizada
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/55">
                Tu contraseña se cambió correctamente. Inicia sesión nuevamente
                con tus nuevas credenciales.
              </p>

              <Link
                href="/login"
                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C5F467] text-sm font-semibold text-[#10130A] transition hover:bg-[#D6FF87]"
              >
                Iniciar sesión
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : checkingRecovery ? (
            <div className="pt-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C5F467]/20 bg-[#C5F467]/10 text-[#C5F467]">
                <LoaderCircle size={19} className="animate-spin" />
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                Validando enlace
              </h1>

              <p className="mt-2 text-sm leading-5 text-white/50">
                Estamos verificando de forma segura tu enlace de recuperación.
              </p>
            </div>
          ) : !ready ? (
            <div className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                <LockKeyhole size={19} />
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                Enlace no disponible
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/55">
                {error ||
                  "El enlace de recuperación puede haber expirado o ya haber sido utilizado."}
              </p>

              <Link
                href="/forgot-password"
                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C5F467] text-sm font-semibold text-[#10130A] transition hover:bg-[#D6FF87]"
              >
                Solicitar otro enlace
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
                  Nueva contraseña
                </h1>

                <p className="mt-2 text-sm leading-5 text-white/50">
                  Usa una contraseña larga y única. No reutilices contraseñas
                  de otros servicios.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <PasswordField
                  id="password"
                  label="Nueva contraseña"
                  value={password}
                  show={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                  onChange={(value) => {
                    setPassword(value);
                    setError("");
                  }}
                />

                <PasswordField
                  id="confirmation"
                  label="Repite la contraseña"
                  value={confirmation}
                  show={showConfirmation}
                  onToggle={() =>
                    setShowConfirmation((value) => !value)
                  }
                  onChange={(value) => {
                    setConfirmation(value);
                    setError("");
                  }}
                />

                <PasswordRequirements
                  password={password}
                  confirmation={confirmation}
                />

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
                  disabled={
                    saving ||
                    password.length < MIN_PASSWORD_LENGTH ||
                    password !== confirmation
                  }
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C5F467] text-sm font-semibold text-[#10130A] transition hover:bg-[#D6FF87] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      Actualizar contraseña
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <p className="pointer-events-none absolute bottom-3 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-white/25">
        PeakScore · Preparación ICFES
      </p>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  show,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-white/75"
      >
        {label}
      </label>

      <div className="flex h-10 items-center rounded-lg border border-white/10 bg-[#050607] px-3 transition focus-within:border-[#C5F467]/60 focus-within:ring-2 focus-within:ring-[#C5F467]/10">
        <LockKeyhole size={16} className="shrink-0 text-white/35" />

        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/25"
          placeholder={label}
          required
          minLength={MIN_PASSWORD_LENGTH}
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center text-white/40 transition hover:text-[#C5F467]"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
