"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Download, LoaderCircle, Plus, Save, Sparkles } from "lucide-react";
import { QUESTION_BANK } from "@/lib/games/que-es-esa-vaina-bank";

type Subject = "Matemáticas" | "Química" | "Física" | "Biología" | "Historia" | "Inglés";
type Question = { id: string; subject: Subject; topic: string; difficulty: "facil" | "media" | "dificil"; clue: string; options: string[]; answer: number; explanation: string; hint: string; status: "draft" | "published" | "archived" };
const emptyQuestion = (): Omit<Question, "id"> => ({ subject: "Matemáticas", topic: "", difficulty: "media", clue: "", options: ["", "", "", ""], answer: 0, explanation: "", hint: "", status: "draft" });
const subjects: Subject[] = ["Matemáticas", "Química", "Física", "Biología", "Historia", "Inglés"];

export default function AdminGameQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<Omit<Question, "id"> & { id?: string }>(emptyQuestion());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/game-questions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el banco.");
      setQuestions(data.questions ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Error inesperado."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const importLocalBank = async () => {
    setImporting(true); setError(""); setNotice("");
    try {
      const res = await fetch("/api/admin/game-questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bulkImport: true, questions: QUESTION_BANK }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo importar el banco.");
      setNotice(`Importación completada: ${data.imported} nuevas, ${data.skipped} omitidas por duplicado. Todas quedaron como borradores.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error inesperado al importar."); }
    finally { setImporting(false); }
  };
  const setField = (key: string, value: unknown) => setForm((old) => ({ ...old, [key]: value }));
  const save = async (publish = false) => {
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = { ...form, status: publish ? "published" : form.status };
      const res = await fetch("/api/admin/game-questions", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
      setNotice(publish ? "Pregunta publicada." : "Borrador guardado.");
      setForm(emptyQuestion()); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error inesperado."); }
    finally { setSaving(false); }
  };
  const edit = (q: Question) => { setForm({ ...q }); setNotice(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const fieldClass = "w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400";
  const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300";
  return <main className="min-h-screen bg-[#080d1d] px-4 py-8 text-white md:px-8">
    <div className="mx-auto max-w-7xl">
      <Link href="/aprender/juegos" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft size={16}/> Volver a juegos</Link>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.25em] text-amber-300">PeakScore · Administración</p><h1 className="mt-2 text-3xl font-black">Banco de preguntas</h1><p className="mt-2 text-sm text-slate-400">Crea preguntas originales, revisa sus explicaciones y publícalas cuando estén listas.</p></div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm"><span className="text-slate-400">Total registradas</span><p className="text-2xl font-black text-amber-300">{questions.length}</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
        <section className="rounded-2xl border-2 border-slate-600 bg-[#101a30] p-5 shadow-[5px_5px_0_#030712]">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{form.id ? "Editar pregunta" : "Nueva pregunta"}</h2><button onClick={() => { setForm(emptyQuestion()); setError(""); setNotice(""); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm"><Plus size={15}/> Nueva</button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className={labelClass}>Materia</span><select className={fieldClass} value={form.subject} onChange={e=>setField("subject",e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select></label>
            <label><span className={labelClass}>Tema</span><input className={fieldClass} maxLength={140} value={form.topic} onChange={e=>setField("topic",e.target.value)} placeholder="Ej. Rapidez media"/></label>
            <label><span className={labelClass}>Dificultad interna</span><select className={fieldClass} value={form.difficulty} onChange={e=>setField("difficulty",e.target.value)}><option value="facil">Fácil</option><option value="media">Media</option><option value="dificil">Difícil</option></select></label>
            <label><span className={labelClass}>Estado</span><select className={fieldClass} value={form.status} onChange={e=>setField("status",e.target.value)}><option value="draft">Borrador</option><option value="published">Publicada</option><option value="archived">Archivada</option></select></label>
          </div>
          <label className="mt-4 block"><span className={labelClass}>Pregunta / pista principal</span><textarea className={fieldClass+" min-h-24"} value={form.clue} onChange={e=>setField("clue",e.target.value)} placeholder="Redacta una pregunta original..."/></label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{form.options.map((option,i)=><label key={i}><span className={labelClass}>Opción {String.fromCharCode(65+i)} {form.answer===i?"· Correcta":""}</span><div className="flex gap-2"><input className={fieldClass} value={option} onChange={e=>setField("options",form.options.map((v,j)=>j===i?e.target.value:v))} placeholder={"Respuesta "+String.fromCharCode(65+i)}/><button type="button" aria-label={"Marcar opción "+String.fromCharCode(65+i)+" como correcta"} onClick={()=>setField("answer",i)} className={"rounded-lg border px-3 "+(form.answer===i?"border-emerald-400 bg-emerald-950 text-emerald-300":"border-slate-600 text-slate-500")}><Check size={16}/></button></div></label>)}</div>
          <label className="mt-4 block"><span className={labelClass}>Pista de ayuda</span><textarea className={fieldClass} value={form.hint} onChange={e=>setField("hint",e.target.value)} placeholder="Una orientación sin revelar la respuesta"/></label>
          <label className="mt-4 block"><span className={labelClass}>Explicación de la respuesta</span><textarea className={fieldClass+" min-h-24"} value={form.explanation} onChange={e=>setField("explanation",e.target.value)} placeholder="Explica el razonamiento paso a paso"/></label>
          {error&&<p role="alert" className="mt-4 rounded-lg border border-rose-500/50 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}{notice&&<p role="status" className="mt-4 rounded-lg border border-emerald-500/50 bg-emerald-950/40 p-3 text-sm text-emerald-200">{notice}</p>}
          <div className="mt-5 flex flex-wrap gap-3"><button disabled={saving} onClick={()=>void save(false)} className="inline-flex items-center gap-2 rounded-lg border border-slate-500 bg-slate-800 px-4 py-3 font-bold disabled:opacity-50">{saving?<LoaderCircle className="animate-spin" size={16}/>:<Save size={16}/>} Guardar borrador</button><button disabled={saving} onClick={()=>void save(true)} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-700 px-4 py-3 font-bold shadow-[3px_3px_0_#052e16] disabled:opacity-50"><Check size={16}/> Publicar pregunta</button></div>
        </section>
        <section className="rounded-2xl border-2 border-slate-600 bg-[#0b1226] p-5 shadow-[5px_5px_0_#030712]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Preguntas guardadas</h2><div className="flex flex-wrap gap-2"><button disabled={importing} onClick={()=>void importLocalBank()} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-700 px-3 py-2 text-xs font-bold disabled:opacity-50">{importing?<LoaderCircle className="animate-spin" size={14}/>:<Download size={14}/>} Importar banco local ({QUESTION_BANK.length})</button><button onClick={()=>void load()} className="rounded-lg border border-slate-700 px-3 py-2 text-sm">Actualizar</button></div></div>
          {loading?<p className="text-sm text-slate-400">Cargando banco...</p>:questions.length===0?<p className="rounded-lg border border-dashed border-slate-700 p-5 text-sm text-slate-400">No hay preguntas todavía. Crea la primera. Si aparece un error de migración, aplica el SQL de Supabase.</p>:<div className="max-h-[900px] space-y-3 overflow-auto pr-1">{questions.map(q=><article key={q.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4"><div className="mb-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider"><span className="rounded bg-slate-800 px-2 py-1 text-cyan-200">{q.subject}</span><span className="rounded bg-slate-800 px-2 py-1 text-amber-200">{q.difficulty}</span><span className={"rounded px-2 py-1 "+(q.status==="published"?"bg-emerald-950 text-emerald-300":"bg-slate-800 text-slate-300")}>{q.status}</span></div><h3 className="font-bold">{q.topic}</h3><p className="mt-2 line-clamp-3 text-sm text-slate-300">{q.clue}</p><button onClick={()=>edit(q)} className="mt-3 rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold hover:border-amber-300">Editar</button></article>)}</div>}
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-950/20 p-4"><p className="flex items-center gap-2 font-bold text-amber-200"><Sparkles size={16}/> Generación con IA</p><p className="mt-2 text-sm text-slate-300">La interfaz ya está preparada para administrar el banco. La generación automática debe conectarse a un proveedor de IA del proyecto y guardar primero como borrador; no publica preguntas sin revisión.</p></div>
        </section>
      </div>
    </div>
  </main>;
}
