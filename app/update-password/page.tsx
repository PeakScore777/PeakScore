"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import PeakScoreLogo from "@/components/PeakScoreLogo";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setReady(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 15) {
      setError("La contraseña debe tener al menos 15 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setSaving(false);
      setError(
        "No fue posible actualizar la contraseña. El enlace puede haber expirado o la contraseña no cumplir los requisitos de seguridad."
      );
      return;
    }

    // Revoca las sesiones de la cuenta después del cambio.
    await supabase.auth.signOut({ scope: "global" });

    setSaving(false);
    setPassword("");
    setConfirmation("");
    setSuccess(true);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.12)] sm:p-9">
          <PeakScoreLogo variant="dark" showTagline={false} compact />

          {success ? (
            <div className="mt-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Check size={22} />
              </div>
              <h1 className="mt-5 text-3xl font-black text-slate-950">
                Contraseña actualizada
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tu contraseña fue cambiada y las sesiones activas fueron revocadas. Inicia sesión nuevamente.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white"
              >
                Iniciar sesión <ArrowRight size={15} />
              </Link>
            </div>
          ) : !ready ? (
            <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <h1 className="text-lg font-black text-amber-950">
                Enlace no disponible
              </h1>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                El enlace de recuperación puede haber expirado o ya haber sido utilizado.
              </p>
              <Link href="/forgot-password" className="mt-4 inline-flex text-xs font-bold text-amber-900 underline">
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
                  Usa una contraseña larga y única. No reutilices contraseñas de otros servicios.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <PasswordField
                  id="password"
                  label="Nueva contraseña"
                  value={password}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  onChange={setPassword}
                  autoComplete="new-password"
                />

                <PasswordField
                  id="confirmation"
                  label="Repite la contraseña"
                  value={confirmation}
                  show={showConfirmation}
                  onToggle={() => setShowConfirmation((v) => !v)}
                  onChange={setConfirmation}
                  autoComplete="new-password"
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">Requisitos</p>
                  <ul className="mt-2 space-y-1">
                    <li className={password.length >= 15 ? "text-emerald-600" : ""}>
                      • Mínimo 15 caracteres
                    </li>
                    <li className={password === confirmation && confirmation.length > 0 ? "text-emerald-600" : ""}>
                      • Las dos contraseñas deben coincidir
                    </li>
                  </ul>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Actualizando..." : "Actualizar contraseña"}
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
      <label htmlFor={id} className="mb-2 block text-xs font-bold text-slate-800">
        {label}
      </label>
      <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
        <LockKeyhole size={17} className="text-slate-400" />
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="text-slate-400 hover:text-blue-600"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}
