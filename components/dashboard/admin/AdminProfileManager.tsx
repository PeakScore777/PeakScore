"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LoaderCircle,
  Search,
  ShieldCheck,
  Save,
  UserRound,
} from "lucide-react";

type AdminProfile = {
  id: string;
  fullName: string;
  email: string;
  targetScore: number;
  averageScore: number;
  streak: number;
  simulations: number;
  historicalXp: number;
  seasonXp: number | null;
  coins: number;
  level: number;
  selectedCharacter: string;
};

type Notice = { kind: "success" | "warning" | "error"; text: string };

function NumberField({
  label,
  value,
  onChange,
  step = "1",
  min = 0,
  max,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step?: string;
  min?: number;
  max: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-500">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
      />
    </label>
  );
}

export default function AdminProfileManager() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminProfile[]>([]);
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState<AdminProfile | null>(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [reason, setReason] = useState("");

  async function searchProfiles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setBusy("search");
    setSelected(null);
    setForm(null);

    try {
      const response = await fetch(`/api/admin/profiles?q=${encodeURIComponent(query.trim())}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { profiles?: AdminProfile[]; error?: string; mfaRequired?: boolean };
      if (!response.ok) {
        const suffix = data.mfaRequired
          ? " Abre Configuración desde el avatar, activa la autenticación en dos pasos y vuelve a ingresar."
          : "";
        throw new Error((data.error ?? "No se pudieron buscar perfiles.") + suffix);
      }
      setResults(data.profiles ?? []);
      if (!data.profiles?.length) {
        setNotice({ kind: "error", text: "No encontramos perfiles con ese nombre o correo." });
      }
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "No se pudieron buscar perfiles." });
    } finally {
      setBusy("");
    }
  }

  function selectProfile(profile: AdminProfile) {
    setSelected(profile);
    setForm({ ...profile });
    setNotice(null);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setNotice(null);

    const cleanReason = reason.trim();
    if (cleanReason.length < 5 || cleanReason.length > 500) {
      setNotice({ kind: "error", text: "El motivo debe tener entre 5 y 500 caracteres." });
      return;
    }

    const requiredNumbers = [
      form.targetScore,
      form.averageScore,
      form.streak,
      form.simulations,
      form.historicalXp,
      form.coins,
      form.level,
    ];
    if (requiredNumbers.some((value) => value === null || !Number.isFinite(value))) {
      setNotice({ kind: "error", text: "Completa todos los valores numéricos con cifras válidas." });
      return;
    }
    if (form.seasonXp !== null && (!Number.isSafeInteger(form.seasonXp) || form.seasonXp < 0)) {
      setNotice({ kind: "error", text: "La EXP de temporada debe ser un entero no negativo." });
      return;
    }

    setBusy("save");
    try {
      const response = await fetch("/api/admin/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.id,
          reason: cleanReason,
          fullName: form.fullName,
          targetScore: form.targetScore,
          averageScore: form.averageScore,
          streak: form.streak,
          simulations: form.simulations,
          historicalXp: form.historicalXp,
          ...(form.seasonXp === null ? {} : { seasonXp: form.seasonXp }),
          coins: form.coins,
          level: form.level,
          selectedCharacter: form.selectedCharacter || null,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        mfaRequired?: boolean;
        auditWarning?: boolean;
      };
      if (!response.ok || !data.success) {
        const suffix = data.mfaRequired
          ? " Activa la autenticación en dos pasos en Configuración y vuelve a ingresar."
          : "";
        throw new Error((data.error ?? "No se pudieron guardar los cambios.") + suffix);
      }

      setSelected({ ...form });
      setResults((current) => current.map((item) => item.id === form.id ? { ...form } : item));
      setReason("");
      setNotice(
        data.auditWarning
          ? {
              kind: "warning",
              text: "Los cambios se guardaron, pero el registro de auditoría no pudo marcarse como aplicado. Revisa los logs antes de repetir esta operación.",
            }
          : {
              kind: "success",
              text: "Cambios guardados y registrados en la auditoría administrativa.",
            },
      );
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "No se pudieron guardar los cambios." });
    } finally {
      setBusy("");
    }
  }

  function update<K extends keyof AdminProfile>(key: K, value: AdminProfile[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-7 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
            <ArrowLeft size={16} /> Volver al panel
          </Link>
          <div className="mt-5 flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><ShieldCheck size={24} /></span>
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">Gestión de perfiles</h1>
              <p className="mt-1 text-sm text-slate-500">Busca una cuenta y ajusta sus estadísticas de PeakScore. Solo disponible para administradores.</p>
            </div>
          </div>
        </header>

        {notice && (
          <div role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : notice.kind === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>
            {notice.text}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <form onSubmit={searchProfiles} className="flex flex-col gap-3 sm:flex-row">
            <label className="min-w-0 flex-1">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Buscar por nombre o correo</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} minLength={2} maxLength={80} required placeholder="Nombre o correo del usuario" className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200" />
            </label>
            <button disabled={busy === "search"} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-slate-700 disabled:opacity-50">
              {busy === "search" ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />} Buscar
            </button>
          </form>

          {results.length > 0 && (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {results.map((profile) => (
                <button type="button" key={profile.id} onClick={() => selectProfile(profile)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selected?.id === profile.id ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><UserRound size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">{profile.fullName || "Sin nombre"}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{profile.email || profile.id}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {form && selected && (
          <form onSubmit={saveProfile} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="border-b border-slate-100 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Perfil seleccionado</p>
              <h2 className="mt-2 text-xl font-black">{selected.fullName || "Sin nombre"}</h2>
              <p className="mt-1 break-all text-sm text-slate-500">{selected.email}</p>
              <p className="mt-2 text-[11px] text-slate-400">ID: {selected.id}</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">Motivo de la modificación (obligatorio)</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={5}
                maxLength={500}
                required
                rows={3}
                placeholder="Explica por qué se necesita este ajuste administrativo (5–500 caracteres)."
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              />
              <span className="mt-1 block text-right text-xs text-slate-400">{reason.trim().length}/500</span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">Nombre visible</span>
              <input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} minLength={2} maxLength={70} required className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumberField label="Meta de puntaje" value={form.targetScore} onChange={(value) => update("targetScore", value ?? 0)} max={500} />
              <NumberField label="Promedio ICFES" value={form.averageScore} onChange={(value) => update("averageScore", value ?? 0)} max={500} />
              <NumberField label="Días de racha" value={form.streak} onChange={(value) => update("streak", value ?? 0)} max={1000000} />
              <NumberField label="Simulacros completados" value={form.simulations} onChange={(value) => update("simulations", value ?? 0)} max={10000000} />
              <NumberField label="EXP histórica" value={form.historicalXp} onChange={(value) => update("historicalXp", value ?? 0)} max={1000000000} />
              <NumberField label="Peak Coins" value={form.coins} onChange={(value) => update("coins", value ?? 0)} max={1000000000} />
              <NumberField label="Nivel" value={form.level} onChange={(value) => update("level", value ?? 1)} min={1} max={100000} />
              <NumberField label="EXP de temporada" value={form.seasonXp} onChange={(value) => update("seasonXp", value)} max={1000000000} />
            </div>
            {form.seasonXp === null && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                Este usuario no tiene una participación encontrada para la temporada activa. El campo puede dejarse vacío; no se creará una participación de temporada automáticamente.
              </p>
            )}

            <label className="block max-w-md">
              <span className="mb-2 block text-xs font-bold text-slate-500">Personaje seleccionado</span>
              <select value={form.selectedCharacter} onChange={(event) => update("selectedCharacter", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200">
                <option value="">Sin personaje</option>
                <option value="nova">Nova</option>
                <option value="nox">Nox</option>
                <option value="zyra">Zyra</option>
                <option value="orby">Orby</option>
              </select>
            </label>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <button disabled={busy === "save"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-violet-500 disabled:opacity-50">
                {busy === "save" ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Guardar cambios
              </button>
              <span className="text-xs leading-5 text-slate-400">No se permite modificar correo, contraseña ni rol desde este editor.</span>
            </div>
          </form>
        )}

        <p className="text-xs leading-5 text-slate-400">Los cambios administrativos se registran en los logs del servidor sin guardar contraseñas ni códigos de seguridad. Verifica siempre el perfil seleccionado antes de guardar.</p>
      </div>
    </main>
  );
}
