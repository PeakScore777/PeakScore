"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  LoaderCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type AdminProfile = {
  id: string;
  fullName: string;
  email: string;
};

type AccountStatus = {
  userId: string;
  isAdmin: boolean;
  isBanned: boolean;
  bannedUntil: string | null;
};

type ApiError = {
  error?: string;
  mfaRequired?: boolean;
  settingsUrl?: string;
};

type Notice = {
  kind: "success" | "warning" | "error";
  text: string;
  settingsHref?: string;
};

const DURATIONS = [
  { value: "24h", label: "24 horas" },
  { value: "168h", label: "7 días" },
  { value: "720h", label: "30 días" },
  { value: "876000h", label: "100 años (bloqueo prolongado)" },
] as const;

function apiError(data: ApiError, status: number): Notice {
  if (data.mfaRequired) {
    return {
      kind: "error",
      text: data.error ?? "Esta operación requiere una sesión con MFA verificado.",
      settingsHref: data.settingsUrl ?? "/perfil/configuracion",
    };
  }

  if (status === 401) {
    return { kind: "error", text: "La sesión ya no es válida. Inicia sesión nuevamente." };
  }

  if (status === 403) {
    return {
      kind: "error",
      text: data.error ?? "No tienes permisos suficientes para esta operación.",
    };
  }

  return { kind: "error", text: data.error ?? "No se pudo completar la solicitud." };
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(date);
}

export default function AdminAccountModeration() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminProfile[]>([]);
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]["value"]>("168h");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  async function searchAccounts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setBusy("search");
    setSelected(null);
    setStatus(null);
    setResults([]);

    try {
      const response = await fetch(
        `/api/admin/profiles?q=${encodeURIComponent(query.trim())}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        profiles?: AdminProfile[];
        error?: string;
        mfaRequired?: boolean;
        settingsUrl?: string;
      };

      if (!response.ok) throw apiError(data, response.status);
      setResults(data.profiles ?? []);

      if (!data.profiles?.length) {
        setNotice({ kind: "warning", text: "No encontramos cuentas con ese nombre o correo." });
      }
    } catch (error) {
      setNotice(
        typeof error === "object" && error !== null && "kind" in error
          ? (error as Notice)
          : {
              kind: "error",
              text: error instanceof Error ? error.message : "No se pudo realizar la búsqueda.",
            },
      );
    } finally {
      setBusy("");
    }
  }

  async function selectAccount(profile: AdminProfile) {
    setSelected(profile);
    setStatus(null);
    setNotice(null);
    setBusy("status");

    try {
      const response = await fetch(
        `/api/admin/accounts?userId=${encodeURIComponent(profile.id)}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as AccountStatus & ApiError;

      if (!response.ok) throw apiError(data, response.status);
      setStatus(data);
    } catch (error) {
      setNotice(
        typeof error === "object" && error !== null && "kind" in error
          ? (error as Notice)
          : {
              kind: "error",
              text: error instanceof Error ? error.message : "No se pudo consultar el estado de la cuenta.",
            },
      );
    } finally {
      setBusy("");
    }
  }

  async function submitModeration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !status || status.isAdmin) return;

    const action = status.isBanned ? "unban" : "ban";
    const cleanReason = reason.trim();

    if (cleanReason.length < 5 || cleanReason.length > 500) {
      setNotice({
        kind: "error",
        text: "El motivo debe tener entre 5 y 500 caracteres.",
      });
      return;
    }

    const actionLabel = action === "ban" ? "bloquear" : "levantar el bloqueo de";
    const durationLabel = action === "ban"
      ? DURATIONS.find((item) => item.value === duration)?.label ?? duration
      : "sin bloqueo";
    const confirmed = window.confirm(
      `¿Confirmas ${actionLabel} la cuenta de ${selected.fullName || selected.email}?\n\nDuración: ${durationLabel}.\nMotivo: ${cleanReason}`,
    );

    if (!confirmed) return;

    setBusy("moderate");
    setNotice(null);

    try {
      const response = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.id,
          action,
          reason: cleanReason,
          ...(action === "ban" ? { duration } : {}),
        }),
      });
      const data = (await response.json()) as AccountStatus & {
        success?: boolean;
        auditWarning?: boolean;
      } & ApiError;

      if (!response.ok || !data.success) {
        throw apiError(data, response.status);
      }

      if (typeof data.isBanned === "boolean") {
        setStatus({
          userId: data.userId,
          isAdmin: data.isAdmin,
          isBanned: data.isBanned,
          bannedUntil: data.bannedUntil,
        });
      } else {
        setStatus(null);
      }

      setReason("");
      setNotice(
        data.auditWarning
          ? {
              kind: "warning",
              text: "La acción se aplicó, pero no se pudo cerrar el registro de auditoría. Revisa los logs antes de realizar otra acción.",
            }
          : {
              kind: "success",
              text: action === "ban"
                ? "Bloqueo aplicado y estado de la cuenta actualizado."
                : "Bloqueo levantado y estado de la cuenta actualizado.",
            },
      );

      // La respuesta de la API contiene el estado verificado después de aplicar la acción.
      // Si no lo incluye, refrescamos la consulta sin repetir la modificación.
      if (typeof data.isBanned !== "boolean") {
        const refresh = await fetch(
          `/api/admin/accounts?userId=${encodeURIComponent(selected.id)}`,
          { cache: "no-store" },
        );
        const refreshed = (await refresh.json()) as AccountStatus & ApiError;
        if (refresh.ok) {
          setStatus(refreshed);
        } else {
          setNotice({
            kind: "warning",
            text: "La acción fue aceptada, pero no se pudo refrescar el estado. Vuelve a consultar la cuenta.",
          });
        }
      }
    } catch (error) {
      setNotice(
        typeof error === "object" && error !== null && "kind" in error
          ? (error as Notice)
          : {
              kind: "error",
              text: error instanceof Error ? error.message : "No se pudo completar la moderación.",
            },
      );
    } finally {
      setBusy("");
    }
  }

  const bannerStyle = notice?.kind === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : notice?.kind === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-7 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Volver al panel
          </Link>
          <div className="mt-5 flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <ShieldAlert size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">Moderación de cuentas</h1>
              <p className="mt-1 text-sm text-slate-500">
                Consulta una cuenta, revisa su estado y registra una acción con motivo obligatorio.
              </p>
            </div>
          </div>
        </header>

        {notice && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${bannerStyle}`}
          >
            <p>{notice.text}</p>
            {notice.settingsHref && (
              <Link
                href={notice.settingsHref}
                className="mt-2 inline-block font-bold underline underline-offset-2"
              >
                Abrir configuración de seguridad
              </Link>
            )}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <form onSubmit={searchAccounts} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Buscar por nombre o correo
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                minLength={2}
                maxLength={80}
                required
                placeholder="Nombre o correo del usuario"
                className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              />
            </label>
            <button
              type="submit"
              disabled={busy === "search" || query.trim().length < 2}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {busy === "search" ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
              Buscar cuenta
            </button>
          </form>

          {results.length > 0 && (
            <div className="mt-5 space-y-2" aria-label="Resultados de búsqueda">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Selecciona la cuenta exacta
              </p>
              {results.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => void selectAccount(profile)}
                  disabled={busy !== ""}
                  className={`flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition sm:flex-row sm:items-center sm:justify-between ${selected?.id === profile.id ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"} disabled:opacity-60`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <UserRound size={18} className="shrink-0 text-slate-500" />
                    <span className="min-w-0">
                      <span className="block break-words font-bold">{profile.fullName || "Sin nombre registrado"}</span>
                      <span className="block break-all text-sm text-slate-500">{profile.email || "Sin correo de perfil"}</span>
                    </span>
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {profile.id.slice(0, 8)}…{profile.id.slice(-4)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {busy === "status" && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <LoaderCircle className="animate-spin" size={18} /> Consultando el estado real de la cuenta…
          </div>
        )}

        {selected && status && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cuenta seleccionada</p>
                <h2 className="mt-1 text-xl font-black">{selected.fullName || selected.email || "Usuario"}</h2>
                <p className="mt-1 break-all text-sm text-slate-500">{selected.email}</p>
                <p className="mt-1 font-mono text-xs text-slate-400">ID: {selected.id}</p>
              </div>
              <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-sm font-bold ${status.isAdmin ? "border-violet-200 bg-violet-50 text-violet-900" : status.isBanned ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
                {status.isAdmin ? <ShieldCheck size={16} /> : status.isBanned ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                {status.isAdmin ? "Cuenta administradora" : status.isBanned ? "Cuenta bloqueada" : "Cuenta activa"}
              </div>
            </div>

            {status.isBanned && (
              <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {status.bannedUntil && formatDate(status.bannedUntil)
                  ? `Bloqueo vigente hasta ${formatDate(status.bannedUntil)}.`
                  : "La cuenta figura bloqueada, pero no se pudo interpretar la fecha de vencimiento."}
              </p>
            )}

            {status.isAdmin ? (
              <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                Esta cuenta tiene rol de administración. La API impide bloquear cuentas administrativas y esta interfaz no permite ejecutar la acción.
              </p>
            ) : (
              <form onSubmit={submitModeration} className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                {!status.isBanned && (
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Duración del bloqueo
                    </span>
                    <select
                      value={duration}
                      onChange={(event) => setDuration(event.target.value as (typeof DURATIONS)[number]["value"])}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 sm:max-w-sm"
                    >
                      {DURATIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Motivo obligatorio
                  </span>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    minLength={5}
                    maxLength={500}
                    required
                    rows={3}
                    placeholder="Describe brevemente el motivo de la acción (5–500 caracteres)."
                    className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                  />
                  <span className="mt-1 block text-right text-xs text-slate-400">{reason.trim().length}/500</span>
                </label>

                <button
                  type="submit"
                  disabled={busy !== "" || reason.trim().length < 5 || reason.trim().length > 500}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50 ${status.isBanned ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"}`}
                >
                  {busy === "moderate" ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                  {busy === "moderate"
                    ? "Procesando…"
                    : status.isBanned
                      ? "Levantar bloqueo"
                      : "Bloquear cuenta"}
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
