"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import PeakScoreLogo from "@/components/PeakScoreLogo";

const MIN_PASSWORD_LENGTH = 15;

function getRecoveryErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "El enlace de recuperación no es válido o ya no está disponible.";
  }

  const value = error as {
    code?: string;
    message?: string;
  };

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

        /*
         * @supabase/ssr utiliza PKCE. Cuando Supabase devuelve
         * un auth code después de abrir el enlace de recuperación,
         * debemos intercambiarlo por una sesión antes de permitir
         * el cambio de contraseña.
         */
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            if (mounted) {
              setError(
                getRecoveryErrorMessage(exchangeError)
              );
              setCheckingRecovery(false);
            }
            return;
          }

          /*
           * Nunca dejamos el código de recuperación en la barra
           * de direcciones después del intercambio.
           */
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }

        /*
         * Comprobamos que exista una sesión válida después del
         * intercambio. El cambio de contraseña solo se permite
         * cuando Supabase Auth tiene una sesión recuperada.
         */
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

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

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) {
          return;
        }

        if (
          event === "PASSWORD_RECOVERY" ||
          Boolean(session)
        ) {
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        console.error(
          "[PeakScore] Error actualizando contraseña.",
          {
            errorCode:
              updateError.code ?? "UNKNOWN",
            status:
              updateError.status ?? "UNKNOWN",
          }
        );

        setError(
          getRecoveryErrorMessage(updateError)
        );
        return;
      }

      /*
       * El cambio de contraseña es una operación sensible.
       * Revocamos las sesiones existentes para obligar a iniciar
       * sesión nuevamente con la nueva contraseña.
       */
      const { error: signOutError } =
        await supabase.auth.signOut({
          scope: "global",
        });

      if (signOutError) {
        console.warn(
          "[PeakScore] La contraseña se actualizó, pero no fue posible revocar todas las sesiones.",
          {
            errorCode:
              signOutError.code ?? "UNKNOWN",
          }
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
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.12)] sm:p-9">
          <PeakScoreLogo
            variant="dark"
            showTagline={false}
            compact
          />

          {success ? (
            <div className="mt-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Check size={22} />
              </div>

              <h1 className="mt-5 text-3xl font-black text-slate-950">
                Contraseña actualizada
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tu contraseña fue cambiada correctamente y
                las sesiones activas fueron revocadas.
                Inicia sesión nuevamente.
              </p>

              <Link
                href="/login"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Iniciar sesión
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : checkingRecovery ? (
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                <p className="text-sm font-bold text-blue-950">
                  Validando enlace...
                </p>
              </div>

              <p className="mt-3 text-xs leading-5 text-blue-800">
                Estamos verificando de forma segura tu enlace
                de recuperación.
              </p>
            </div>
          ) : !ready ? (
            <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <h1 className="text-lg font-black text-amber-950">
                Enlace no disponible
              </h1>

              <p className="mt-2 text-sm leading-6 text-amber-900">
                {error ||
                  "El enlace de recuperación puede haber expirado o ya haber sido utilizado."}
              </p>

              <Link
                href="/forgot-password"
                className="mt-4 inline-flex text-xs font-bold text-amber-900 underline"
              >
                Solicitar otro enlace
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <LockKeyhole size={22} />
                </div>

                <h1 className="mt-5 text-3xl font-black text-slate-950">
                  Nueva contraseña
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Usa una contraseña larga y única. No
                  reutilices contraseñas de otros servicios.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-5"
              >
                <PasswordField
                  id="password"
                  label="Nueva contraseña"
                  value={password}
                  show={showPassword}
                  onToggle={() =>
                    setShowPassword((value) => !value)
                  }
                  onChange={(value) => {
                    setPassword(value);
                    setError("");
                  }}
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">
                    Requisitos
                  </p>

                  <ul className="mt-2 space-y-1">
                    <li
                      className={
                        password.length >=
                        MIN_PASSWORD_LENGTH
                          ? "text-emerald-600"
                          : ""
                      }
                    >
                      • Mínimo 15 caracteres
                    </li>

                    <li
                      className={
                        /[A-Z]/.test(password)
                          ? "text-emerald-600"
                          : ""
                      }
                    >
                      • Una mayúscula
                    </li>

                    <li
                      className={
                        /[a-z]/.test(password)
                          ? "text-emerald-600"
                          : ""
                      }
                    >
                      • Una minúscula
                    </li>

                    <li
                      className={
                        /\d/.test(password)
                          ? "text-emerald-600"
                          : ""
                      }
                    >
                      • Un número
                    </li>

                    <li
                      className={
                        /[^A-Za-z0-9]/.test(password)
                          ? "text-emerald-600"
                          : ""
                      }
                    >
                      • Un símbolo
                    </li>

                    <li
                      className={
                        password.length > 0 &&
                        password === confirmation
                          ? "text-emerald-600"
                          : ""
                      }
                    >
                      • Las dos contraseñas deben coincidir
                    </li>
                  </ul>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    saving ||
                    password.length <
                      MIN_PASSWORD_LENGTH ||
                    password !== confirmation
                  }
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Actualizando..."
                    : "Actualizar contraseña"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
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
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold text-slate-800"
      >
        {label}
      </label>

      <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
        <LockKeyhole
          size={17}
          className="text-slate-400"
        />

        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          required
          minLength={MIN_PASSWORD_LENGTH}
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            show
              ? "Ocultar contraseña"
              : "Mostrar contraseña"
          }
          className="text-slate-400 hover:text-blue-600"
        >
          {show ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </div>
  );
}
