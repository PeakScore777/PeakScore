"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Languages, Loader2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type EnglishSet = {
  id: string; part: number; title: string; session: number; status: "draft" | "review" | "approved" | "rejected";
  created_at: string; question_count: number; shared_text: string | null; word_bank: string[] | null;
};
const parts: Record<number, string> = {
  1: "Avisos e imágenes", 2: "Descripciones y banco de palabras", 3: "Conversaciones",
  4: "Completar textos · dos conjuntos oficiales", 5: "Comprensión de lectura",
  6: "Comprensión de lectura", 7: "Completar textos con cuatro opciones",
};
const statusLabel: Record<EnglishSet["status"], string> = {
  draft: "Borrador", review: "En revisión", approved: "Aprobado", rejected: "Rechazado",
};
const officialCounts: Record<number, number> = { 1: 5, 2: 5, 3: 7, 4: 8, 5: 7, 6: 5, 7: 10 };

export default function EnglishQuestionBankPage() {
  const router = useRouter();
  const [sets, setSets] = useState<EnglishSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partFilter, setPartFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profileError || profile?.role !== "admin" || user.email?.toLowerCase() !== "aragonyostynsena07@gmail.com") {
        router.push("/dashboard"); return;
      }
      const response = await fetch("/api/admin/question-bank/english-sets", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "No se pudieron cargar los conjuntos.");
      setSets(payload.sets ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Error cargando el banco de Inglés."); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(setId: string, status: EnglishSet["status"]) {
    const action = status === "approved" ? "aprobar y activar" : status === "rejected" ? "rechazar" : status === "review" ? "enviar a revisión" : "devolver a borrador";
    if (!window.confirm(`¿Confirmas ${action} este conjunto?`)) return;
    setError("");
    try {
      const response = await fetch("/api/admin/question-bank/english-sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId, status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "No se pudo actualizar el estado.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el estado.");
    }
  }

  const visibleSets = useMemo(() => sets.filter(set =>
    (partFilter === "all" || set.part === Number(partFilter)) &&
    (sessionFilter === "all" || set.session === Number(sessionFilter))
  ), [sets, partFilter, sessionFilter]);
  const totals = useMemo(() => ({
    sets: visibleSets.length,
    questions: visibleSets.reduce((sum, set) => sum + set.question_count, 0),
    approved: visibleSets.filter(set => set.status === "approved").length,
    drafts: visibleSets.filter(set => set.status === "draft").length,
  }), [visibleSets]);

  return <main className="min-h-screen bg-slate-100 p-4 md:p-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/question-bank" className="rounded-xl bg-white p-3 shadow-sm" aria-label="Volver al banco"><ArrowLeft size={20}/></Link>
          <div><p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Banco de preguntas</p><h1 className="text-3xl font-bold text-slate-950 md:text-4xl">Inglés · 7 partes</h1><p className="mt-2 text-slate-600">Organiza los conjuntos por parte, sesión, cantidad y estado de revisión.</p></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold text-slate-800"><RefreshCw size={17}/> Actualizar</button>
          <Link href="/dashboard/question-bank/new" className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white"><Plus size={18}/> Crear conjunto</Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Conjuntos", totals.sets], ["Preguntas guardadas", totals.questions], ["Aprobados", totals.approved], ["Borradores", totals.drafts]].map(([label, value]) =>
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-950">{value}</p></div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Filtrar por parte
            <select value={partFilter} onChange={e => setPartFilter(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option value="all">Todas las partes</option>{Object.entries(parts).map(([key, name]) => <option key={key} value={key}>Parte {key} · {name}</option>)}</select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Filtrar por sesión
            <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option value="all">Todas las sesiones</option><option value="1">Sesión 1</option><option value="2">Sesión 2</option></select>
          </label>
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}<button onClick={() => void load()} className="ml-3 font-bold underline">Reintentar</button></div>}
      {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-12 text-slate-600"><Loader2 className="animate-spin"/> Cargando conjuntos...</div> :
        visibleSets.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><Languages size={34} className="mx-auto text-slate-400"/><h2 className="mt-3 text-xl font-bold text-slate-900">Todavía no hay conjuntos</h2><p className="mt-2 text-slate-600">Crea tu primer conjunto manual. Se guardará como borrador y no se usará en simulacros hasta su aprobación.</p><Link href="/dashboard/question-bank/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white"><Plus size={18}/> Crear conjunto</Link></div> :
        <section className="space-y-4">{Object.entries(parts).filter(([key]) => partFilter === "all" || Number(key) === Number(partFilter)).map(([key, name]) => {
          const partSets = visibleSets.filter(set => set.part === Number(key));
          if (!partSets.length) return null;
          return <div key={key} className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-bold text-slate-900">Parte {key} · {name}</h2><p className="text-sm text-slate-500">{partSets.length} conjunto(s) · referencia oficial: {officialCounts[Number(key)]} preguntas por bloque</p></div><span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">{partSets.reduce((sum, set) => sum + set.question_count, 0)} preguntas guardadas</span></div>
            <div className="grid gap-3 lg:grid-cols-2">{partSets.map(set => <article key={set.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><BookOpen size={20}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-bold text-slate-900">{set.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${set.status === "approved" ? "bg-green-100 text-green-800" : set.status === "rejected" ? "bg-red-100 text-red-800" : set.status === "review" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{statusLabel[set.status]}</span></div><p className="mt-2 text-sm text-slate-600">Sesión {set.session} · {set.question_count} pregunta(s)</p>{set.shared_text && <p className="mt-3 line-clamp-2 text-sm text-slate-500">Texto compartido: {set.shared_text}</p>}{set.word_bank?.length ? <p className="mt-3 text-sm text-slate-500">Banco de palabras: {set.word_bank.length} entradas</p> : null}<p className="mt-3 text-xs text-slate-400">Creado: {new Date(set.created_at).toLocaleDateString("es-CO")}</p><div className="mt-4 flex flex-wrap gap-2">{set.status !== "approved" && <button onClick={() => void changeStatus(set.id, "approved")} className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white">Aprobar y activar</button>}{set.status !== "review" && <button onClick={() => void changeStatus(set.id, "review")} className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700">Enviar a revisión</button>}{set.status !== "rejected" && <button onClick={() => void changeStatus(set.id, "rejected")} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Rechazar</button>}{set.status !== "draft" && <button onClick={() => void changeStatus(set.id, "draft")} className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700">Borrador</button>}</div></div></div></article>)}</div>
          </div>;
        })}</section>
      }
      <p className="text-xs text-slate-500">Los conteos oficiales son una referencia de estructura; el editor permite conjuntos de práctica con cantidades distintas. La aprobación y activación se gestionarán por separado.</p>
    </div>
  </main>;
}
