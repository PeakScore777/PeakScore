"use client";

import { useEffect, useState } from "react";
import { Pencil, Save, X, Plus, Table2, Trash2 } from "lucide-react";

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
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/admin/lesson-questions", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!live) return;
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
    setDraft({ ...current, context_blocks: current.context_blocks.map((b) => b.type === "table" ? ({ ...b, headers: [...b.headers], rows: b.rows.map((r) => [...r]) }) : ({ ...b })), options: current.options.map((o) => ({ ...o })) });
    setStatus("");
    setOpen(true);
  }

  function patch(values: Partial<Q>) { setDraft((current) => current ? { ...current, ...values } : current); }
  function patchBlock(index: number, block: Block) {
    if (!draft) return;
    patch({ context_blocks: draft.context_blocks.map((b, i) => i === index ? block : b) });
  }
  function addTable() {
    if (!draft) return;
    patch({ context_blocks: [...draft.context_blocks, { type: "table", title: "Tabla de datos", headers: ["Variable", "Valor"], rows: [["Dato 1", ""], ["Dato 2", ""]] }] });
  }
  function addParagraph() {
    if (!draft) return;
    patch({ context_blocks: [...draft.context_blocks, { type: "paragraph", text: "" }] });
  }

  async function save() {
    if (!draft) return;
    const next = questions.map((q) => q.position === position ? draft : q);
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/admin/lesson-questions", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la pregunta.");
      setQuestions(next);
      setStatus("Las tres preguntas se guardaron en Supabase.");
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
      <section role="dialog" aria-modal="true" aria-labelledby="admin-practice-edit-title" className="max-h-[92vh] w-full max-w-5xl overflow-y-auto border border-amber-200/30 bg-[#0b111c] p-4 text-slate-100 shadow-2xl sm:p-6">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-200">Administración · Laboratorio editorial</p><h2 id="admin-practice-edit-title" className="mt-2 text-xl font-black">Editar pregunta {position}</h2><p className="mt-1 text-xs text-slate-400">Edita los datos y las tablas de esta pregunta. Guarda para persistir los cambios en Supabase.</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar editor" className="border border-white/15 p-2"><X size={18}/></button>
        </header>
        {draft ? <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-amber-100">Dificultad<select value={draft.difficulty} onChange={(e) => patch({ difficulty: e.target.value as Q["difficulty"] })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm text-white"><option>Fácil</option><option>Media</option><option>Difícil</option></select></label>
              <label className="text-xs font-bold text-amber-100">Competencia<input value={draft.competency} onChange={(e) => patch({ competency: e.target.value })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm text-white"/></label>
            </div>
            <label className="block text-xs font-bold text-amber-100">Situación problema<textarea rows={4} value={draft.context_text} onChange={(e) => patch({ context_text: e.target.value })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm font-normal text-white"/></label>
            <div className="border border-white/10 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><b className="text-sm">Tablas y datos</b><div className="flex gap-2"><button type="button" onClick={addTable} className="inline-flex items-center gap-1 border border-emerald-300/40 px-3 py-2 text-xs"><Plus size={14}/><Table2 size={14}/> Crear tabla</button><button type="button" onClick={addParagraph} className="border border-white/15 px-3 py-2 text-xs">+ Texto</button></div></div>
              {draft.context_blocks.length === 0 && <p className="text-xs text-slate-500">Todavía no hay tablas ni bloques adicionales.</p>}
              {draft.context_blocks.map((block, bi) => block.type === "table" ? <div key={bi} className="mb-4 border border-white/10 p-3">
                <div className="mb-2 flex gap-2"><input aria-label="Título de tabla" value={block.title} onChange={(e) => patchBlock(bi, { ...block, title: e.target.value })} className="w-full bg-[#050a12] p-2 text-sm"/><button type="button" title="Quitar tabla" onClick={() => patch({ context_blocks: draft.context_blocks.filter((_, i) => i !== bi) })} className="border border-rose-300/30 px-2 text-rose-200"><Trash2 size={15}/></button></div>
                <div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead><tr>{block.headers.map((header, hi) => <th key={hi} className="border border-white/20 p-1"><input aria-label={`Encabezado columna ${hi + 1}`} value={header} onChange={(e) => patchBlock(bi, { ...block, headers: block.headers.map((x, i) => i === hi ? e.target.value : x) })} className="w-full min-w-20 bg-transparent p-1"/></th>)}</tr></thead><tbody>{block.rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="border border-white/15 p-1"><input aria-label={`Fila ${ri + 1}, columna ${ci + 1}`} value={cell} onChange={(e) => patchBlock(bi, { ...block, rows: block.rows.map((r, i) => i === ri ? r.map((x, j) => j === ci ? e.target.value : x) : r) })} className="w-full min-w-16 bg-transparent p-2"/></td>)}</tr>)}</tbody></table></div>
                <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => patchBlock(bi, { ...block, headers: [...block.headers, "Columna"], rows: block.rows.map((r) => [...r, ""]) })} className="border border-white/15 px-2 py-1 text-xs">+ Columna</button><button type="button" onClick={() => patchBlock(bi, { ...block, rows: [...block.rows, block.headers.map(() => "")] })} className="border border-white/15 px-2 py-1 text-xs">+ Fila</button><button type="button" onClick={() => patchBlock(bi, { ...block, headers: block.headers.slice(0, -1), rows: block.rows.map((r) => r.slice(0, -1)) })} disabled={block.headers.length <= 1} className="border border-white/15 px-2 py-1 text-xs disabled:opacity-40">− Columna</button><button type="button" onClick={() => patchBlock(bi, { ...block, rows: block.rows.slice(0, -1) })} disabled={block.rows.length <= 1} className="border border-white/15 px-2 py-1 text-xs disabled:opacity-40">− Fila</button><button type="button" onClick={() => patch({ context_blocks: draft.context_blocks.filter((_, i) => i !== bi) })} className="border border-rose-300/30 px-2 py-1 text-xs text-rose-200">Quitar tabla</button></div>
              </div> : <div key={bi} className="mb-3 border border-white/10 p-3"><div className="mb-2 flex justify-between"><b className="text-xs">Bloque de texto</b><button type="button" onClick={() => patch({ context_blocks: draft.context_blocks.filter((_, i) => i !== bi) })} className="text-xs text-rose-200">Quitar</button></div><textarea rows={3} value={block.text} onChange={(e) => patchBlock(bi, { ...block, text: e.target.value })} className="w-full bg-[#050a12] p-3 text-sm"/></div>)}
            </div>
            <label className="block text-xs font-bold text-amber-100">Enunciado<textarea rows={3} value={draft.prompt} onChange={(e) => patch({ prompt: e.target.value })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm font-normal text-white"/></label>
            <div><p className="mb-2 text-xs font-bold text-amber-100">Opciones de respuesta</p>{draft.options.map((option, index) => <label key={option.label} className="mb-2 flex gap-2 text-xs"><span className="pt-3 font-black">{option.label}</span><textarea rows={2} value={option.text} onChange={(e) => patch({ options: draft.options.map((o, i) => i === index ? { ...o, text: e.target.value } : o) })} className="w-full bg-[#050a12] p-3 text-sm font-normal text-white"/></label>)}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-amber-100">Respuesta correcta<select value={draft.correct_answer} onChange={(e) => patch({ correct_answer: e.target.value as Q["correct_answer"] })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm text-white">{["A","B","C","D"].map((v) => <option key={v}>{v}</option>)}</select></label>
              <label className="flex items-center gap-2 border border-white/10 p-3 text-xs"><input type="checkbox" checked={draft.is_published} onChange={(e) => patch({ is_published: e.target.checked })}/> Publicada para estudiantes</label>
            </div>
            <label className="block text-xs font-bold text-amber-100">Explicación de la respuesta<textarea rows={4} value={draft.explanation} onChange={(e) => patch({ explanation: e.target.value })} className="mt-2 block w-full bg-[#050a12] p-3 text-sm font-normal text-white"/></label>
          </div>
          <aside className="h-fit border border-amber-200/20 bg-[#101722] p-4 xl:sticky xl:top-4"><p className="font-mono text-[10px] tracking-widest text-amber-200">VISTA PREVIA</p><h3 className="my-3 text-lg font-black">Pregunta {position}</h3><p className="whitespace-pre-wrap border-l-2 border-cyan-300 bg-[#15243a] p-3 text-sm leading-6">{draft.context_text}</p>{draft.context_blocks.map((block, bi) => block.type === "table" ? <div key={bi} className="my-4 overflow-x-auto"><p className="mb-2 text-xs font-bold text-cyan-200">{block.title}</p><table className="w-full border-collapse text-xs"><thead><tr>{block.headers.map((h, i) => <th key={i} className="border border-slate-500 bg-[#233447] p-2 text-left">{h}</th>)}</tr></thead><tbody>{block.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="border border-slate-600 p-2">{v}</td>)}</tr>)}</tbody></table></div> : <p key={bi} className="my-3 whitespace-pre-wrap text-sm leading-6">{block.text}</p>)}<h4 className="mt-4 font-bold leading-7">{draft.prompt}</h4><div className="mt-3 space-y-2">{draft.options.map((o) => <div key={o.label} className="flex gap-2 border border-white/10 bg-[#0a111b] p-3 text-sm"><b>{o.label}</b>{o.text}</div>)}</div><p className="mt-4 whitespace-pre-wrap border border-white/10 p-3 text-sm">{draft.explanation}</p></aside>
        </div> : <p className="border border-amber-200/20 p-4 text-sm text-amber-100">{status}</p>}
        {status && draft && <p role="status" className="mt-4 text-sm text-amber-100">{status}</p>}
        <footer className="mt-6 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4"><button type="button" onClick={() => setOpen(false)} className="border border-white/15 px-4 py-3 text-sm">Cancelar</button><button type="button" onClick={save} disabled={busy || !draft} className="inline-flex items-center gap-2 border border-emerald-300 bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><Save size={16}/>{busy ? "Guardando…" : "Guardar cambios"}</button></footer>
      </section>
    </div>}
  </>;
}
