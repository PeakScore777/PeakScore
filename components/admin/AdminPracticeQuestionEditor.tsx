"use client";

import { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";

type Block = { type: "paragraph"; text: string } | { type: "table"; title: string; headers: string[]; rows: string[][] };
type Q = {
  position: number; difficulty: "Fácil" | "Media" | "Difícil"; competency: string;
  context_text: string; context_blocks: Block[]; prompt: string;
  options: { label: string; text: string }[]; correct_answer: "A" | "B" | "C" | "D";
  explanation: string; is_published: boolean;
};

export default function AdminPracticeQuestionEditor({ position, initialQuestions }: { position: number; initialQuestions: Q[] }) {
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<Q[]>(initialQuestions);
  const [draft, setDraft] = useState<Q | null>(null);
  const [blocksText, setBlocksText] = useState("[]");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialQuestions.length === 3) setQuestions(initialQuestions);
  }, [initialQuestions]);

  useEffect(() => {
    let live = true;
    fetch("/api/admin/lesson-questions", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!live) return;
        // La respuesta puede informar el rol aunque falle la consulta a la tabla.
        setAdmin(data.isAdmin === true);
        if (r.ok && Array.isArray(data.questions) && data.questions.length === 3) {
          setQuestions(data.questions);
        } else if (data.error) {
          setStatus(data.error);
        }
      })
      .catch(() => { if (live) setStatus("No se pudo consultar la API de preguntas. Revisa la sesión y el servidor."); });
    return () => { live = false; };
  }, []);

  function startEdit() {
    const current = questions.find((q) => q.position === position);
    if (!current || questions.length !== 3) {
      setStatus("No se encontraron las tres preguntas de esta misión. Recarga la página e inténtalo de nuevo.");
      setOpen(true);
      return;
    }
    setDraft({ ...current, options: current.options.map((o) => ({ ...o })) });
    setBlocksText(JSON.stringify(current.context_blocks ?? [], null, 2));
    setStatus("");
    setOpen(true);
  }

  function patch(values: Partial<Q>) { setDraft((current) => current ? { ...current, ...values } : current); }

  async function save() {
    if (!draft) return;
    let blocks: Block[];
    try {
      const parsed = JSON.parse(blocksText);
      if (!Array.isArray(parsed)) throw new Error();
      blocks = parsed;
    } catch {
      setStatus("El contexto estructurado debe ser un arreglo JSON válido. No se guardó ningún cambio.");
      return;
    }
    const next = questions.map((q) => q.position === position ? { ...draft, context_blocks: blocks } : q);
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/admin/lesson-questions", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la pregunta.");
      setQuestions(next);
      setStatus("Pregunta guardada en Supabase. Al recargar, todos verán la versión publicada.");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally { setBusy(false); }
  }

  if (!admin) return null;
  return <>
    <div className="mb-4 flex justify-end">
      <button type="button" onClick={startEdit} className="inline-flex items-center gap-2 border border-amber-200/50 bg-amber-200/10 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-200/20">
        <Pencil size={14} /> Editar pregunta
      </button>
    </div>
    {status && !open && <p role="status" className="mb-3 border border-white/10 bg-[#101722] p-3 text-xs text-slate-200">{status}</p>}
    {open && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="admin-practice-edit-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-amber-200/30 bg-[#0b111c] p-4 text-slate-100 shadow-2xl sm:p-6">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-200">Administración · Supabase</p><h2 id="admin-practice-edit-title" className="mt-2 text-xl font-black">Editar pregunta {position}</h2><p className="mt-1 text-xs text-slate-400">Los cambios solo se comparten al guardar; publica la pregunta para mostrarla a estudiantes.</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar editor" className="border border-white/15 p-2"><X size={18}/></button>
        </header>
        {draft ? <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-amber-100">Dificultad<select value={draft.difficulty} onChange={(e) => patch({ difficulty: e.target.value as Q["difficulty"] })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm text-white"><option>Fácil</option><option>Media</option><option>Difícil</option></select></label>
            <label className="text-xs font-bold text-amber-100">Competencia<input value={draft.competency} onChange={(e) => patch({ competency: e.target.value })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm text-white"/></label>
          </div>
          <label className="block text-xs font-bold text-amber-100">Situación problema<textarea rows={4} value={draft.context_text} onChange={(e) => patch({ context_text: e.target.value })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm font-normal text-white"/></label>
          <label className="block text-xs font-bold text-amber-100">Tablas / bloques de contexto (JSON)<textarea rows={7} value={blocksText} onChange={(e) => setBlocksText(e.target.value)} spellCheck={false} className="mt-2 block w-full bg-[#050a12] p-3 font-mono text-xs font-normal text-white"/></label>
          <label className="block text-xs font-bold text-amber-100">Enunciado<textarea rows={3} value={draft.prompt} onChange={(e) => patch({ prompt: e.target.value })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm font-normal text-white"/></label>
          <div><p className="mb-2 text-xs font-bold text-amber-100">Opciones de respuesta</p>{draft.options.map((option, index) => <label key={option.label} className="mb-2 flex gap-2 text-xs"><span className="pt-3 font-black">{option.label}</span><textarea rows={2} value={option.text} onChange={(e) => patch({ options: draft.options.map((o, i) => i === index ? { ...o, text: e.target.value } : o) })} className="w-full bg-[#050a12] p-3 text-sm font-normal text-white"/></label>)}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-amber-100">Respuesta correcta<select value={draft.correct_answer} onChange={(e) => patch({ correct_answer: e.target.value as Q["correct_answer"] })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm text-white">{["A","B","C","D"].map((v) => <option key={v}>{v}</option>)}</select></label>
            <label className="flex items-center gap-2 border border-white/10 p-3 text-xs"><input type="checkbox" checked={draft.is_published} onChange={(e) => patch({ is_published: e.target.checked })}/> Publicada para estudiantes</label>
          </div>
          <label className="block text-xs font-bold text-amber-100">Explicación de la respuesta<textarea rows={4} value={draft.explanation} onChange={(e) => patch({ explanation: e.target.value })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm font-normal text-white"/></label>
        </div> : <p className="border border-amber-200/20 p-4 text-sm text-amber-100">{status}</p>}
        {status && draft && <p role="status" className="mt-4 text-sm text-amber-100">{status}</p>}
        <footer className="mt-6 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4"><button type="button" onClick={() => setOpen(false)} className="border border-white/15 px-4 py-3 text-sm">Cancelar</button><button type="button" onClick={save} disabled={busy || !draft} className="inline-flex items-center gap-2 border border-emerald-300 bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><Save size={16}/>{busy ? "Guardando…" : "Guardar cambios"}</button></footer>
      </section>
    </div>}
  </>;
}
